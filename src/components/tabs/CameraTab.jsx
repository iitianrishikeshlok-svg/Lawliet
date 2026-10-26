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
      <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-black/80 border border-white/[0.1] shadow-2xl flex items-center justify-center">
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

        {/* HUD Framing & Status */}
        <div className="absolute inset-4 pointer-events-none flex flex-col justify-between p-2">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-cyan-300 bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-cyan-500/30 font-medium">
              Optical Lens
            </span>
            <span className="text-[10px] text-white/70 bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/10">
              720p • 30 FPS
            </span>
          </div>

          {/* Center Targeting Reticle */}
          <div className="self-center flex items-center justify-center w-8 h-8 rounded-full border border-rose-500/40 bg-black/30 backdrop-blur-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_#ff1e2e]" />
          </div>

          <div className="flex justify-between items-end">
            <span className="text-[9px] text-white/50 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
              ISO Auto • WB Auto
            </span>
            <span className="text-[9px] text-emerald-400 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-emerald-500/30 font-medium">
              Live Sensor Active
            </span>
          </div>
        </div>

        {/* Countdown Overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/75 z-30">
            <span className="text-6xl font-bold text-white animate-ping">
              {countdown}
            </span>
          </div>
        )}

        {/* Error Notification with Direct Native Camera Bypass */}
        {errorMsg && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-black/90 backdrop-blur-xl text-center text-xs space-y-3 z-30">
            <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center text-rose-400">
              <Camera size={22} />
            </div>
            <div className="space-y-1 max-w-xs">
              <p className="font-semibold text-white text-sm">Live Video Blocked by Browser</p>
              <p className="text-white/50 text-[11px] leading-relaxed">
                Chrome strictly blocks live WebRTC video streams on HTTP network IP addresses (<code className="text-rose-400 font-mono">172.21.16.52</code>).
              </p>
            </div>

            <div className="flex flex-col space-y-2 w-full max-w-xs pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 rounded-full text-white font-semibold text-xs bg-gradient-to-r from-rose-500 to-rose-600 shadow-[0_4px_16px_rgba(244,63,94,0.4)] transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>📸 Snap Photo with Camera</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white border border-white/[0.1] text-xs font-medium transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>📁 Upload Image from Device</span>
              </button>
            </div>

            <p className="text-[10px] text-white/40 pt-1">
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
      <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl shadow-lg">
        {snapshot ? (
          <div className="flex items-center space-x-2 w-full justify-between">
            <button
              onClick={handleRetake}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs text-white/70 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-colors cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Retake</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsAnnotating(true)}
                className="px-3.5 py-1.5 rounded-full text-xs text-cyan-300 bg-cyan-950/30 border border-cyan-500/30 font-medium hover:bg-cyan-900/40 transition-colors cursor-pointer"
              >
                Annotate
              </button>

              <button
                onClick={() => handleSendToAI()}
                className="px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-rose-500 to-rose-600 shadow-[0_2px_15px_rgba(244,63,94,0.4)] hover:scale-105 active:scale-95 flex items-center space-x-1.5 cursor-pointer"
              >
                <Sparkles size={13} />
                <span>Ask L</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            {/* Mirror Toggle */}
            <button
              onClick={() => setIsMirror(!isMirror)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                isMirror ? 'text-cyan-300 bg-cyan-950/30 border-cyan-500/40' : 'text-white/60 bg-white/[0.03] border-white/10 hover:text-white'
              }`}
              title="Mirror Camera Feed"
            >
              Flip
            </button>

            {/* Shutter Button & Direct Native Snap */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Open Native Phone Camera / File Picker"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white border border-white/10 transition-all cursor-pointer"
              >
                <span>📸 Snap</span>
              </button>

              <button
                onClick={handleCountdownCapture}
                title="3-Second Timer Shutter"
                className="px-2.5 py-1.5 rounded-full text-[11px] font-medium bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white border border-white/10 transition-all cursor-pointer"
              >
                3s Timer
              </button>

              {/* Minimal Circular Shutter Button */}
              <button
                onClick={handleCapture}
                title="Capture Frame from Live Video"
                className="w-10 h-10 rounded-full border-2 border-white/30 bg-gradient-to-tr from-rose-500 to-rose-600 shadow-[0_0_16px_rgba(244,63,94,0.4)] flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all"
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white shadow-sm" />
              </button>
            </div>

            {/* Camera Device Switcher */}
            {devices.length > 1 ? (
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="bg-black/60 text-xs text-white border border-white/10 rounded-full px-2.5 py-1 outline-none max-w-[100px]"
              >
                {devices.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId}>
                    {d.label || `Cam ${i + 1}`}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-[10px] text-white/40">Ready</span>
            )}
          </div>
        )}
      </div>

      {/* Suggested Queries */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-xs space-y-2">
        <span className="font-semibold text-rose-400 block mb-1">
          Real-World Visual Queries
        </span>
        <button
          onClick={() => handleSendToAI('Transcribe and format the handwritten notes in this image.')}
          className="text-left text-[11px] text-white/60 hover:text-white block w-full truncate transition-colors"
        >
          • "Transcribe handwritten notebook page into markdown"
        </button>
        <button
          onClick={() => handleSendToAI('Identify this electronic hardware component and explain pinouts.')}
          className="text-left text-[11px] text-white/60 hover:text-white block w-full truncate transition-colors"
        >
          • "Identify hardware component / PCB schematic"
        </button>
        <button
          onClick={() => handleSendToAI('Solve the math equation written on the whiteboard/paper.')}
          className="text-left text-[11px] text-white/60 hover:text-white block w-full truncate transition-colors"
        >
          • "Solve the equation shown on paper step-by-step"
        </button>
      </div>
    </div>
  );
}
