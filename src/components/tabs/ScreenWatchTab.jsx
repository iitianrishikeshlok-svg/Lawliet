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
      <div className="flex flex-col p-5 rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl shadow-xl relative overflow-hidden">
        {/* Radar Sweep Effect */}
        {isStreaming && (
          <div className="absolute inset-0 bg-gradient-to-b from-rose-500/10 via-transparent to-transparent animate-radar-sweep pointer-events-none" />
        )}

        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center space-x-2.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isStreaming ? 'bg-rose-500 animate-ping shadow-[0_0_8px_#ff1e2e]' : 'bg-white/20'
              }`}
            />
            <span className="text-xs font-semibold text-white tracking-wide">
              {isStreaming ? 'Live Screen Stream Active' : 'Screen Share Inactive'}
            </span>
          </div>

          <button
            onClick={handleToggle}
            className={`relative overflow-hidden flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 cursor-pointer ${
              isStreaming
                ? 'bg-rose-500/15 border border-rose-500/40 text-rose-300 hover:bg-rose-500/25'
                : 'color-cycle-pill text-white shadow-[0_2px_15px_rgba(244,63,94,0.4)] hover:scale-105 active:scale-95 border border-white/20'
            }`}
          >
            {isStreaming ? <EyeOff size={13} /> : <Eye size={13} />}
            <span>{isStreaming ? 'Stop Sharing' : 'Share Screen Live'}</span>
          </button>
        </div>

        {/* Live Frame Viewport with Scanline Grid */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center shadow-lg group">
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
              <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center text-rose-400">
                <Monitor size={22} />
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-xs font-semibold text-white">No Active Screen Stream</span>
                <span className="text-[11px] text-white/40 max-w-[260px] leading-relaxed">
                  Share your full display, application window, or browser tab with AI vision.
                </span>
              </div>
              <button
                onClick={startStream}
                className="relative overflow-hidden px-5 py-2.5 rounded-full text-xs font-semibold text-white color-cycle-pill shadow-[0_4px_20px_rgba(244,63,94,0.45)] hover:scale-105 active:scale-95 transition-all flex items-center space-x-2 cursor-pointer border border-white/20"
              >
                <Eye size={13} />
                <span>Select Screen to Share</span>
              </button>
            </div>
          )}

          {/* Telemetry Overlay Pills */}
          <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5 pointer-events-none">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-md ${
              isStreaming
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                : 'bg-black/50 text-white/60 border border-white/10'
            }`}>
              {isStreaming ? `Live • ${resolution}` : 'Standby'}
            </span>
            {lastScanTime && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-[10px] font-mono text-emerald-400 border border-emerald-500/20 backdrop-blur-md">
                Pulse #{pulseCount} ({lastScanTime})
              </span>
            )}
          </div>

          {/* Instant Manual Snapshot Button */}
          {isStreaming && (
            <div className="absolute bottom-2.5 right-2.5">
              <button
                onClick={handleManualScan}
                title="Capture instantaneous snapshot"
                className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-md text-white/70 hover:text-white border border-white/15 flex items-center justify-center transition-colors cursor-pointer"
              >
                <RefreshCw size={12} />
              </button>
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="mt-2.5 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Sampling Interval Selector */}
        <div className="flex items-center justify-between mt-3.5 text-xs text-white/70">
          <span className="text-[11px] text-white/40 font-medium">Sampling Frequency:</span>
          <div className="flex items-center space-x-1 p-0.5 rounded-full bg-black/30 border border-white/[0.06]">
            {[
              { sec: 5, label: '5s (Fast)' },
              { sec: 10, label: '10s (Standard)' },
              { sec: 30, label: '30s (Eco)' },
            ].map((opt) => (
              <button
                key={opt.sec}
                onClick={() => {
                  audio.playClick();
                  setIntervalSec(opt.sec);
                }}
                className={`px-3 py-1 rounded-full text-[10px] font-medium transition-all cursor-pointer ${
                  intervalSec === opt.sec
                    ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-sm'
                    : 'text-white/50 hover:text-white hover:bg-white/[0.05]'
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
        <span className="text-xs font-semibold text-rose-400 px-1">
          Instant Screen Insights
        </span>
        <div className="grid grid-cols-1 gap-2">
          {[
            {
              title: 'Summarize Active Screen',
              prompt: 'Summarize everything happening on my active screen in concise bullet points.',
              desc: 'Synthesizes text, open windows, and visual context.',
            },
            {
              title: 'Find Bugs & Syntax Errors',
              prompt: 'Review the code visible on screen. Find bugs, missing semicolons, or logic errors.',
              desc: 'Deep inspection for IDE windows and code editors.',
            },
            {
              title: 'Explain Visual Diagram / Chart',
              prompt: 'Explain the architecture diagram or data charts visible on screen.',
              desc: 'Breaks down components, workflows, and metrics.',
            },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleAnalyzeScreen(item.prompt)}
              className="flex flex-col text-left p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] hover:border-rose-500/30 transition-all group cursor-pointer shadow-sm"
            >
              <div className="flex items-center justify-between text-xs font-medium text-white group-hover:text-rose-400">
                <span>{item.title}</span>
                <Sparkles size={12} className="text-rose-400 opacity-60 group-hover:opacity-100" />
              </div>
              <span className="text-[11px] text-white/40 mt-1">{item.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
