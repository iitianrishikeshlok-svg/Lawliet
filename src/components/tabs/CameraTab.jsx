import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Sparkles, Check, X, RotateCcw } from '../../common/Icons';
import AnnotationCanvas from '../canvas/AnnotationCanvas';
import { audio } from '../../common/AudioEngine';

export default function CameraTab({ onSendToChat, theme }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [isMirror, setIsMirror] = useState(true);
  const [snapshot, setSnapshot] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isAnnotating, setIsAnnotating] = useState(false);

  // Initialize camera devices
  useEffect(() => {
    async function getCameras() {
      try {
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = deviceList.filter((d) => d.kind === 'videoinput');
        setDevices(videoInputs);
        if (videoInputs.length > 0) {
          setSelectedDeviceId(videoInputs[0].deviceId);
        }
      } catch (e) {
        console.warn('[Camera] Device enumeration error:', e);
      }
    }
    getCameras();
  }, []);

  const fileInputRef = useRef(null);

  const handleNativeCameraCapture = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const dataUrl = loadEvt.target?.result;
      if (dataUrl) {
        audio.playShutter();
        setSnapshot(dataUrl);
        setErrorMsg(null);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Start video stream
  useEffect(() => {
    let active = true;

    async function startStream() {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      setErrorMsg(null);
      try {
        const constraints = {
          video: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true,
          audio: false,
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        if (active) {
          setErrorMsg('Camera access unavailable or blocked. Check permissions.');
        }
      }
    }

    if (!snapshot) {
      startStream();
    }

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [selectedDeviceId, snapshot]);

  const handleCapture = () => {
    if (!videoRef.current) return;
    audio.playShutter();

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');

    if (isMirror) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');
    setSnapshot(dataUrl);
  };

  const handleCountdownCapture = () => {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleCapture();
          return null;
        }
        audio.playClick();
        return prev - 1;
      });
    }, 1000);
  };

  const handleRetake = () => {
    audio.playClick();
    setSnapshot(null);
    setIsAnnotating(false);
  };

  const handleSendToAI = (prompt) => {
    if (snapshot) {
      onSendToChat(
        snapshot,
        prompt || 'Analyze this camera snapshot. Transcribe any handwritten notes or explain the physical object.'
      );
    }
  };

  return (
    <div className="flex flex-col w-full h-full p-4 overflow-y-auto space-y-4 select-none">
      {/* Viewfinder Window */}
      <div className="relative w-full aspect-video rounded-none overflow-hidden bg-black border-[3px] border-[#ff1e2e] shadow-[6px_6px_0px_#000,6px_6px_0px_#ff1e2e] flex items-center justify-center">
        {snapshot ? (
          isAnnotating ? (
            <AnnotationCanvas
              imageSrc={snapshot}
              theme={theme}
              isEmbedded={true}
              onFinishAnnotation={(finalDataUrl) => {
                setSnapshot(finalDataUrl);
                setIsAnnotating(false);
                onSendToChat(finalDataUrl, 'Analyze this annotated camera frame.');
              }}
              onCancel={() => setIsAnnotating(false)}
            />
          ) : (
            <img
              src={snapshot}
              alt="Camera Snapshot"
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${isMirror ? 'scale-x-[-1]' : ''}`}
          />
        )}

        {/* HUD Crosshairs and Framing Brackets */}
        <div className="absolute inset-4 pointer-events-none border-2 border-white/20 rounded-none flex flex-col justify-between p-2 font-mono">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono text-cyan-400 bg-black px-2 py-0.5 rounded-none border border-cyan-400 font-bold uppercase">
              [ LENS // OPTICAL 01 ]
            </span>
            <span className="text-[10px] font-mono text-white bg-black px-2 py-0.5 rounded-none border border-neutral-700 font-bold">
              [ 720p // 30 FPS ]
            </span>
          </div>

          {/* Center Targeting Reticle */}
          <div className="self-center flex items-center justify-center w-8 h-8 rounded-none border-2 border-[#ff1e2e] bg-black/40">
            <div className="w-1.5 h-1.5 rounded-none bg-rose-500 shadow-[0_0_6px_#ff1e2e]" />
          </div>

          <div className="flex justify-between items-end">
            <span className="text-[9px] font-mono text-white/60 bg-black px-1.5 py-0.5 border border-neutral-800">
              ISO AUTO • WB AUTO
            </span>
            <span className="text-[9px] font-mono text-emerald-400 bg-black px-1.5 py-0.5 border border-emerald-500 font-bold">
              [ LIVE SENSOR ]
            </span>
          </div>
        </div>

        {/* Countdown Overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/75 z-30 font-mono">
            <span className="text-6xl font-black font-mono text-white animate-ping">
              {countdown}
            </span>
          </div>
        )}

        {/* Error Notification with Direct Native Camera Bypass */}
        {errorMsg && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-black/95 text-center text-xs space-y-3 z-30 font-mono">
            <div className="w-12 h-12 rounded-none bg-black border-2 border-[#ff1e2e] shadow-[3px_3px_0px_#ff1e2e] flex items-center justify-center text-rose-400">
              <Camera size={24} />
            </div>
            <div className="space-y-1 max-w-xs">
              <p className="font-black text-white text-sm uppercase">[ LIVE VIDEO BLOCKED BY BROWSER ]</p>
              <p className="text-stone-400 text-[11px] leading-relaxed">
                Chrome strictly blocks live WebRTC video streams on HTTP network IP addresses (<code className="text-rose-400 font-mono">172.21.16.52</code>).
              </p>
            </div>

            <div className="flex flex-col space-y-2 w-full max-w-xs pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="brutal-btn-solid w-full py-2.5 rounded-none text-black font-mono font-black text-xs border-2 border-black shadow-[3px_3px_0px_#ffffff] transition-all cursor-pointer flex items-center justify-center space-x-2 uppercase"
              >
                <span>[ 📸 SNAP PHOTO WITH CAMERA ]</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="brutal-btn w-full py-2 rounded-none bg-black text-white font-mono font-bold text-xs border-2 border-[#ff1e2e] shadow-[3px_3px_0px_#ff1e2e] transition-all cursor-pointer flex items-center justify-center space-x-2 uppercase"
              >
                <span>[ 📁 UPLOAD IMAGE FROM DEVICE ]</span>
              </button>
            </div>

            <p className="text-[10px] text-stone-500 font-mono pt-1">
              For continuous live streaming, open at <strong className="text-white">http://localhost:5173/</strong> on PC.
            </p>
          </div>
        )}
      </div>

      {/* Hidden Native Camera Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleNativeCameraCapture}
        className="hidden"
      />

      {/* Camera Controls Bar */}
      <div className="flex items-center justify-between p-2.5 rounded-none bg-[#090a0d] border-2 border-stone-800 shadow-[3px_3px_0px_#000]">
        {snapshot ? (
          <div className="flex items-center space-x-2 w-full justify-between">
            <button
              onClick={handleRetake}
              className="brutal-btn rounded-none text-xs text-white bg-black border-2 border-neutral-700 shadow-[2px_2px_0px_#000] cursor-pointer font-mono font-bold uppercase"
            >
              <RotateCcw size={13} />
              <span>[ RETAKE ]</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsAnnotating(true)}
                className="brutal-btn rounded-none text-xs text-cyan-300 bg-black border-2 border-cyan-400 shadow-[2px_2px_0px_#06b6d4] font-mono font-bold uppercase cursor-pointer"
              >
                [ ANNOTATE ]
              </button>

              <button
                onClick={() => handleSendToAI()}
                className="brutal-btn-solid rounded-none text-xs font-black text-black border-2 border-black shadow-[3px_3px_0px_#ffffff] flex items-center space-x-1.5 uppercase font-mono cursor-pointer"
              >
                <Sparkles size={13} />
                <span>[ ASK L ]</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            {/* Mirror Toggle */}
            <button
              onClick={() => setIsMirror(!isMirror)}
              className={`px-3 py-1.5 rounded-none text-xs font-mono font-bold uppercase border-2 transition-colors cursor-pointer shadow-[2px_2px_0px_#000] ${
                isMirror ? 'text-cyan-300 bg-black border-cyan-400' : 'text-white/60 bg-black border-neutral-800 hover:text-white'
              }`}
              title="Mirror Camera Feed"
            >
              [ FLIP ]
            </button>

            {/* Shutter Button & Direct Native Snap */}
            <div className="flex items-center space-x-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Open Native Phone Camera / File Picker"
                className="brutal-btn rounded-none !text-[10px] !py-1.5 !px-3 border-2 border-[#ff1e2e] bg-black text-white shadow-[2px_2px_0px_#ff1e2e] font-mono font-bold uppercase flex items-center space-x-1 cursor-pointer"
              >
                <span>[ 📸 SNAP PHOTO ]</span>
              </button>

              <button
                onClick={handleCountdownCapture}
                title="3-Second Timer Shutter"
                className="brutal-btn rounded-none !text-[10px] !py-1.5 !px-2.5 border-2 border-neutral-700 bg-black text-white/70 shadow-[2px_2px_0px_#000] font-mono font-bold uppercase cursor-pointer"
              >
                [ 3S TIMER ]
              </button>

              <button
                onClick={handleCapture}
                title="Capture Frame from Live Video"
                className="w-10 h-10 rounded-none border-2 border-black bg-[#ff1e2e] shadow-[3px_3px_0px_#ffffff] flex items-center justify-center cursor-pointer active:translate-x-[1px] active:translate-y-[1px]"
              >
                <div className="w-3.5 h-3.5 rounded-none bg-black" />
              </button>
            </div>

            {/* Camera Device Switcher */}
            {devices.length > 1 ? (
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="bg-black text-[10px] font-mono text-white border-2 border-neutral-800 rounded-none px-1.5 py-1 outline-none max-w-[90px] shadow-[2px_2px_0px_#000]"
              >
                {devices.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId}>
                    {d.label || `Cam ${i + 1}`}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-[10px] font-mono text-white/60 font-bold uppercase">[ READY ]</span>
            )}
          </div>
        )}
      </div>

      {/* Suggested Queries */}
      <div className="p-3.5 rounded-none bg-black border-2 border-stone-800 text-xs space-y-1.5 font-mono shadow-[3px_3px_0px_#000]">
        <span className="font-black text-rose-400 block mb-1 uppercase tracking-wider">
          [ REAL-WORLD VISUAL QUERIES: ]
        </span>
        <button
          onClick={() => handleSendToAI('Transcribe and format the handwritten notes in this image.')}
          className="text-left text-[11px] text-stone-300 hover:text-rose-400 block w-full truncate font-mono"
        >
          • "Transcribe handwritten notebook page into markdown"
        </button>
        <button
          onClick={() => handleSendToAI('Identify this electronic hardware component and explain pinouts.')}
          className="text-left text-[11px] text-stone-300 hover:text-rose-400 block w-full truncate font-mono"
        >
          • "Identify hardware component / PCB schematic"
        </button>
        <button
          onClick={() => handleSendToAI('Solve the math equation written on the whiteboard/paper.')}
          className="text-left text-[11px] text-stone-300 hover:text-rose-400 block w-full truncate font-mono"
        >
          • "Solve the equation shown on paper step-by-step"
        </button>
      </div>
    </div>
  );
}
