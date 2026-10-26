import React, { useState, useEffect, useRef } from 'react';
import { Monitor, Sparkles, RefreshCw, Eye, EyeOff, Play } from '../../common/Icons';
import { audio } from '../../common/AudioEngine';

export default function ScreenWatchTab({
  isWatching,
  onToggleWatch,
  onCaptureFrame,
  onSendToChat,
  theme,
}) {
  const [intervalSec, setIntervalSec] = useState(10);
  const [latestFrame, setLatestFrame] = useState(null);
  const [lastScanTime, setLastScanTime] = useState(null);
  const [pulseCount, setPulseCount] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const [resolution, setResolution] = useState('1080p');
  const [errorMessage, setErrorMessage] = useState('');

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Stop active screen stream
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    onToggleWatch(false);
  };

  // Start live screen stream via getDisplayMedia
  const startStream = async () => {
    setErrorMessage('');
    audio.playClick();
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        throw new Error('Screen sharing is not supported in this browser window.');
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor',
        },
        audio: false,
      });

      streamRef.current = stream;
      setIsStreaming(true);
      onToggleWatch(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      const track = stream.getVideoTracks()[0];
      if (track) {
        const settings = track.getSettings();
        if (settings.width && settings.height) {
          setResolution(`${settings.width}x${settings.height}`);
        }
        track.onended = () => {
          stopStream();
        };
      }

      // Initial snapshot after stream starts
      setTimeout(() => {
        captureFrameFromVideo();
      }, 500);
    } catch (err) {
      console.warn('[ScreenWatch] Screen capture error:', err);
      setErrorMessage(
        'Screen sharing locked by browser on HTTP network IP. To enable full desktop sharing: open at http://localhost:5173/ on PC or launch Electron.'
      );
      setIsStreaming(false);
    }
  };

  // Capture frame from active video element or fallback
  const captureFrameFromVideo = async () => {
    if (videoRef.current && videoRef.current.videoWidth > 0) {
      try {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setLatestFrame(dataUrl);
        setLastScanTime(new Date().toLocaleTimeString());
        setPulseCount((c) => c + 1);
        return dataUrl;
      } catch (err) {
        console.warn('[ScreenWatch] Canvas capture error:', err);
      }
    }

    if (onCaptureFrame) {
      try {
        const frame = await onCaptureFrame();
        if (frame) {
          setLatestFrame(frame);
          setLastScanTime(new Date().toLocaleTimeString());
          setPulseCount((c) => c + 1);
          return frame;
        }
      } catch (e) {
        console.warn('[ScreenWatch] Fallback capture error:', e);
      }
    }
    return null;
  };

  // Toggle watch / stream button
  const handleToggle = () => {
    if (isStreaming) {
      audio.playClick();
      stopStream();
    } else {
      startStream();
    }
  };

  // Periodic capture when watching / streaming is active
  useEffect(() => {
    let timer;
    if (isStreaming && isWatching) {
      timer = setInterval(() => {
        captureFrameFromVideo();
      }, intervalSec * 1000);
    }
    return () => clearInterval(timer);
  }, [isStreaming, isWatching, intervalSec]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleManualScan = async () => {
    audio.playClick();
    if (!isStreaming) {
      await startStream();
    } else {
      await captureFrameFromVideo();
    }
  };

  const handleAnalyzeScreen = async (customPrompt) => {
    audio.playShutter();
    let frameToSend = latestFrame;
    if (isStreaming) {
      const freshFrame = await captureFrameFromVideo();
      if (freshFrame) frameToSend = freshFrame;
    } else if (!frameToSend) {
      await startStream();
      return;
    }

    if (frameToSend) {
      onSendToChat(
        frameToSend,
        customPrompt || 'Analyze my current screen context. Highlight key data points and any potential errors.'
      );
    }
  };

  return (
    <div className="flex flex-col w-full h-full p-4 overflow-y-auto space-y-4 select-none">
      {/* Live Monitor Card */}
      <div className="flex flex-col p-4 rounded-none bg-[#090a0d] border-[3px] border-[#ff1e2e] shadow-[6px_6px_0px_#000,6px_6px_0px_#ff1e2e] relative overflow-hidden font-mono">
        {/* Radar Sweep Effect */}
        {isStreaming && (
          <div className="absolute inset-0 bg-gradient-to-b from-rose-500/10 via-transparent to-transparent animate-radar-sweep pointer-events-none" />
        )}

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span
              className={`w-2.5 h-2.5 rounded-none ${
                isStreaming ? 'bg-rose-500 animate-ping shadow-[0_0_8px_#ff1e2e]' : 'bg-neutral-700'
              }`}
            />
            <span className="text-xs font-black uppercase tracking-wider text-white">
              {isStreaming ? '[ LIVE SCREEN SHARING: ACTIVE ]' : '[ SCREEN SHARE: INACTIVE ]'}
            </span>
          </div>

          <button
            onClick={handleToggle}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-none text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
              isStreaming
                ? 'brutal-btn border-2 border-[#ff1e2e] bg-black text-rose-300 shadow-[3px_3px_0px_#ff1e2e] font-bold'
                : 'brutal-btn-solid text-black border-2 border-black shadow-[3px_3px_0px_#ffffff] font-black'
            }`}
          >
            {isStreaming ? <EyeOff size={13} /> : <Eye size={13} className="stroke-[2.5]" />}
            <span>{isStreaming ? '[ STOP SCREEN SHARE ]' : '[ 📺 SHARE SCREEN LIVE ]'}</span>
          </button>
        </div>

        {/* Live Frame Viewport with Scanline Grid */}
        <div className="relative w-full aspect-video rounded-none overflow-hidden bg-black border-2 border-neutral-700 flex items-center justify-center scanline-grid shadow-[3px_3px_0px_#000] group">
          {/* Real-time Video Stream Element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-contain ${isStreaming ? 'block' : 'hidden'}`}
          />

          {/* Fallback Static Screenshot or Placeholder */}
          {!isStreaming && latestFrame && (
            <img
              src={latestFrame}
              alt="Screen Snapshot"
              className="w-full h-full object-contain"
            />
          )}

          {!isStreaming && !latestFrame && (
            <div className="flex flex-col items-center justify-center text-white/50 space-y-3 p-4 text-center">
              <div className="w-12 h-12 rounded-none bg-black border-2 border-neutral-700 shadow-[2px_2px_0px_#000] flex items-center justify-center text-rose-400">
                <Monitor size={24} />
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-xs font-black uppercase text-white">[ NO ACTIVE SCREEN STREAM ]</span>
                <span className="text-[10px] text-stone-400 max-w-[240px]">
                  Click below to share your entire desktop, specific app window, or browser tab with AI vision.
                </span>
              </div>
              <button
                onClick={startStream}
                className="brutal-btn-solid px-4 py-2 rounded-none text-xs font-black text-black border-2 border-black shadow-[3px_3px_0px_#ffffff] transition-all flex items-center space-x-1.5 uppercase cursor-pointer"
              >
                <Eye size={13} className="stroke-[2.5]" />
                <span>[ SELECT SCREEN TO SHARE ]</span>
              </button>
            </div>
          )}

          {/* Telemetry Overlay Pills */}
          <div className="absolute top-2 left-2 flex items-center space-x-1.5 pointer-events-none">
            <span className={`px-2 py-0.5 rounded-none text-[10px] font-mono border-2 font-bold uppercase shadow-[2px_2px_0px_#000] ${
              isStreaming
                ? 'bg-black text-rose-400 border-[#ff1e2e] animate-pulse'
                : 'bg-black text-stone-300 border-neutral-700'
            }`}>
              {isStreaming ? `[ 🔴 LIVE // ${resolution} ]` : '[ STANDBY ]'}
            </span>
            {lastScanTime && (
              <span className="px-2 py-0.5 rounded-none bg-black text-[10px] font-mono font-bold text-emerald-400 border border-emerald-500 shadow-[2px_2px_0px_#000]">
                Pulse #{pulseCount} ({lastScanTime})
              </span>
            )}
          </div>

          {/* Instant Manual Snapshot Button */}
          {isStreaming && (
            <div className="absolute bottom-2 right-2">
              <button
                onClick={handleManualScan}
                title="Capture instantaneous snapshot"
                className="p-1.5 rounded-none bg-black text-white hover:text-rose-400 border-2 border-neutral-700 hover:border-[#ff1e2e] shadow-[2px_2px_0px_#000] transition-colors cursor-pointer"
              >
                <RefreshCw size={12} />
              </button>
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="mt-2 p-2 rounded-none bg-black border-2 border-[#ff1e2e] text-rose-300 text-[11px] shadow-[2px_2px_0px_#000]">
            {errorMessage}
          </div>
        )}

        {/* Sampling Interval Selector */}
        <div className="flex items-center justify-between mt-3 text-xs text-white/70">
          <span className="text-[11px] font-mono text-stone-400 uppercase font-bold">[ FREQUENCY: ]</span>
          <div className="flex items-center space-x-1.5">
            {[
              { sec: 5, label: '[ 5S (FAST) ]' },
              { sec: 10, label: '[ 10S (STD) ]' },
              { sec: 30, label: '[ 30S (ECO) ]' },
            ].map((opt) => (
              <button
                key={opt.sec}
                onClick={() => {
                  audio.playClick();
                  setIntervalSec(opt.sec);
                }}
                className={`px-2.5 py-0.5 rounded-none text-[10px] font-mono uppercase font-bold transition-all cursor-pointer ${
                  intervalSec === opt.sec
                    ? 'bg-[#ff1e2e] text-black border-2 border-black shadow-[2px_2px_0px_#fff]'
                    : 'bg-black text-stone-400 border border-neutral-800 hover:border-neutral-500 hover:text-white shadow-[1px_1px_0px_#000]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preset Action Grid */}
      <div className="flex flex-col space-y-2">
        <span className="text-xs font-black text-rose-400 uppercase tracking-widest px-1 font-mono">
          [ INSTANT SCREEN INSIGHTS ]
        </span>
        <div className="grid grid-cols-1 gap-2">
          {[
            {
              title: '[ SUMMARIZE ACTIVE SCREEN ]',
              prompt: 'Summarize everything happening on my active screen in concise bullet points.',
              desc: 'Synthesizes text, open tabs, and visual context.',
            },
            {
              title: '[ FIND BUGS & SYNTAX ISSUES ]',
              prompt: 'Review the code visible on screen. Find bugs, missing semicolons, or logic errors.',
              desc: 'Deep inspection for IDE windows and terminals.',
            },
            {
              title: '[ EXPLAIN VISUAL DIAGRAM / CHART ]',
              prompt: 'Explain the architecture diagram or data charts visible on screen.',
              desc: 'Breaks down components, workflows, and metrics.',
            },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleAnalyzeScreen(item.prompt)}
              className="flex flex-col text-left p-3 rounded-none bg-[#090a0d] border-2 border-neutral-800 hover:border-[#ff1e2e] shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all group cursor-pointer font-mono"
            >
              <div className="flex items-center justify-between text-xs font-bold text-white group-hover:text-rose-400">
                <span>{item.title}</span>
                <Sparkles size={12} className="text-rose-400 opacity-60 group-hover:opacity-100" />
              </div>
              <span className="text-[10px] text-stone-400 mt-1 font-sans">{item.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
