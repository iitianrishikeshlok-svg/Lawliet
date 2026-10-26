import React, { useState } from 'react';
import { Pin, Zap, Scale, Brain, X, Sparkles, ExternalLink, ShieldAlert, Monitor } from '../common/Icons';
import { THINKING_LEVELS } from '../services/gemini';
import { audio } from '../common/AudioEngine';

export default function Header({
  thinkingLevel = 2,
  onThinkingLevelChange,
  isPinned = true,
  onTogglePin,
  onClose,
  lastLatency = null,
  theme,
  onFloatPiP,
}) {
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [pipActive, setPipActive] = useState(false);
  const isSecure = typeof window !== 'undefined' ? window.isSecureContext : true;
  const isElectron = typeof window !== 'undefined' ? !!window.electronAPI : false;

  const handleFloatPiPClick = () => {
    audio.playClick();
    if (onFloatPiP) {
      onFloatPiP();
    } else {
      launchFloatingDesktopPiP();
    }
  };

  // Launch Always-on-top Floating Desktop Icon via Document Picture-in-Picture
  const launchFloatingDesktopPiP = async () => {
    audio.playClick();
    if (!('documentPictureInPicture' in window)) {
      alert(
        'Document Picture-in-Picture is supported in modern Chrome & Edge. To use a permanent always-on-top icon across all windows, run: npm run electron'
      );
      return;
    }

    try {
      const pipWin = await window.documentPictureInPicture.requestWindow({
        width: 120,
        height: 120,
      });

      setPipActive(true);
      pipWin.addEventListener('pagehide', () => setPipActive(false));

      // Style PiP document
      pipWin.document.title = 'L Assistant Floating Icon';
      pipWin.document.body.style.margin = '0';
      pipWin.document.body.style.padding = '0';
      pipWin.document.body.style.background = '#0a0a0c';
      pipWin.document.body.style.display = 'flex';
      pipWin.document.body.style.alignItems = 'center';
      pipWin.document.body.style.justifyContent = 'center';
      pipWin.document.body.style.height = '100vh';
      pipWin.document.body.style.cursor = 'pointer';
      pipWin.document.body.style.userSelect = 'none';
      pipWin.document.body.style.overflow = 'hidden';

      pipWin.document.body.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;background:radial-gradient(circle,rgba(255,30,46,0.3) 0%,transparent 70%);">
          <img src="/l-triangle-logo.svg" style="width:68px;height:68px;object-fit:contain;filter:drop-shadow(0 0 10px rgba(255,30,46,0.7));transition:transform 0.2s;" />
          <span style="font-family:monospace;font-size:9px;color:#ff4b5c;font-weight:bold;letter-spacing:1px;margin-top:2px;">L-HUD • CLICK</span>
        </div>
      `;

      pipWin.document.body.addEventListener('click', () => {
        window.focus();
      });
    } catch (err) {
      console.warn('PiP launch error:', err);
    }
  };

  return (
    <header className="draggable relative flex flex-col w-full px-3.5 pt-3 pb-2.5 border-b-[3px] border-black bg-[#0a0b0e] select-none shadow-[0_4px_0px_#ff1e2e]">
      {/* Top Utility Row */}
      <div className="flex items-center justify-between w-full">
        {/* L Identity Mark, Status & Latency */}
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-none bg-black border-2 border-[#ff1e2e] shadow-[2px_2px_0px_#ff1e2e] p-0.5">
            <img
              src="/l-triangle-logo.svg"
              alt="L"
              className="w-full h-full object-contain pointer-events-none"
              style={{ mixBlendMode: 'screen', background: 'transparent' }}
            />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-black tracking-wider text-white font-mono uppercase">
                [ L // ASSISTANT ]
              </span>
              <span className="w-2 h-2 rounded-none bg-emerald-400 animate-pulse shadow-[0_0_6px_#00ff66]" />
            </div>
            <span className="text-[9px] font-mono text-rose-400 font-bold tracking-wider uppercase">
              DEATH NOTE COGNITIVE OS
            </span>
          </div>

          {lastLatency && (
            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-none bg-black text-[#00ff66] border-2 border-[#00ff66] shadow-[2px_2px_0px_#000]">
              {lastLatency}
            </span>
          )}
        </div>

        {/* Window Controls & Floating PiP Button */}
        <div className="non-draggable flex items-center space-x-1.5">
          {/* Insecure Origin HTTP Warning Pill */}
          {!isSecure && !isElectron && (
            <button
              onClick={() => setShowSecurityModal(true)}
              className="brutal-btn rounded-none !text-[9px] !py-1 !px-2 border-2 border-amber-400 text-amber-300 shadow-[2px_2px_0px_#ffe600] cursor-pointer"
              title="Camera & Screen Share blocked on HTTP IP by Chrome. Click for 1-click fix."
            >
              <ShieldAlert size={11} className="text-amber-400" />
              <span>[ FIX PERMS ]</span>
            </button>
          )}

          {/* Desktop Always-On-Top Floating Icon (Picture-in-Picture) */}
          <button
            onClick={handleFloatPiPClick}
            title="Pop out Floating Icon & Circular Menu on Real Home Page"
            className={`brutal-btn rounded-none text-[10px] px-2.5 py-1 border-2 border-[#ff1e2e] shadow-[2px_2px_0px_#ff1e2e] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer ${
              pipActive
                ? 'bg-[#ff1e2e] text-black font-black'
                : 'bg-black text-white'
            }`}
          >
            <Monitor size={11} className={pipActive ? 'text-black' : 'text-rose-400'} />
            <span className="hidden sm:inline">[ FLOAT PiP ]</span>
          </button>

          {/* Always on Top Pin */}
          <button
            onClick={() => {
              audio.playClick();
              onTogglePin?.();
            }}
            title={isPinned ? 'Always on Top: Active' : 'Always on Top: Inactive'}
            className={`p-1.5 rounded-none border-2 font-mono shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer ${
              isPinned
                ? 'text-black bg-[#ff1e2e] border-black font-black'
                : 'text-white/60 bg-black border-neutral-700 hover:border-[#ff1e2e]'
            }`}
          >
            <Pin size={13} />
          </button>

          {/* Close Panel Button */}
          <button
            onClick={() => {
              audio.playCollapse();
              onClose?.();
            }}
            title="Minimize to Floating Icon (Esc)"
            className="p-1.5 rounded-none border-2 border-neutral-700 hover:border-[#ff1e2e] bg-black text-white/70 hover:text-white shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Quick / Deep Reasoning Selector */}
      <div className="non-draggable mt-2.5 flex items-center justify-between w-full p-1.5 rounded-none bg-black border-2 border-[#ff1e2e] shadow-[3px_3px_0px_#000]">
        <span className="text-[10px] font-mono text-rose-400 px-2 tracking-widest uppercase font-black">
          [ COGNITIVE MODE: ]
        </span>
        <div className="flex items-center space-x-1.5">
          {[1, 2, 3].map((lvl) => {
            const config = THINKING_LEVELS[lvl];
            const isActive = thinkingLevel === lvl;
            const Icon = lvl === 1 ? Zap : lvl === 2 ? Scale : Brain;

            return (
              <button
                key={lvl}
                onClick={() => {
                  audio.playClick();
                  onThinkingLevelChange?.(lvl);
                }}
                title={config.desc}
                className={`px-3 py-1 rounded-none text-xs font-mono uppercase tracking-wider transition-all duration-150 flex items-center space-x-1.5 cursor-pointer ${
                  isActive
                    ? 'brutal-btn-solid border-2 border-black shadow-[2px_2px_0px_#fff] font-black'
                    : 'bg-black text-white/70 border-2 border-neutral-800 hover:border-neutral-500 shadow-[2px_2px_0px_#000]'
                }`}
              >
                <Icon size={12} className={isActive ? 'text-black' : 'text-rose-400'} />
                <span>
                  [ {lvl === 1 ? 'FAST' : lvl === 2 ? 'BALANCED' : 'DEEP'} ]
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Security Context & Permission Unblock Modal */}
      {showSecurityModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-[#090a0d] border-[3px] border-[#ff1e2e] rounded-none p-5 shadow-[6px_6px_0px_#000,6px_6px_0px_#ff1e2e] text-left space-y-4">
            <div className="flex items-center justify-between border-b-2 border-neutral-800 pb-3">
              <div className="flex items-center space-x-2 text-rose-400 font-mono font-black text-sm uppercase">
                <ShieldAlert size={16} />
                <span>[ UNBLOCK CAMERA & SCREEN SHARING ]</span>
              </div>
              <button
                onClick={() => setShowSecurityModal(false)}
                className="brutal-btn rounded-none text-xs px-2 py-0.5 border-2 border-neutral-700 hover:border-rose-500"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed font-mono">
              Google Chrome and Chromium browsers enforce a strict security policy:
              <strong className="text-rose-400"> Live Camera and Screen Sharing are automatically blocked on raw HTTP IP addresses</strong> (like <code className="bg-black px-1.5 py-0.5 border border-rose-500 text-rose-400 font-mono">http://172.21.16.52:5173</code>).
            </p>

            <div className="space-y-2.5 text-xs text-stone-300">
              <div className="p-3 rounded-xl bg-black/60 border border-white/10">
                <span className="font-bold text-white block mb-1">Option 1: Open on Desktop via Localhost (Instant Fix)</span>
                <p className="text-stone-400 text-[11px]">
                  On this computer, use <a href="http://localhost:5173/" className="text-rose-400 underline font-mono font-bold">http://localhost:5173/</a>. Chrome recognizes localhost as a secure origin, so Camera and Screen sharing work 100% immediately!
                </p>
              </div>

              <div className="p-3 rounded-xl bg-black/60 border border-white/10">
                <span className="font-bold text-white block mb-1">Option 2: Unlock for Mobile & Wi-Fi IP</span>
                <p className="text-stone-400 text-[11px] leading-relaxed">
                  In Chrome (on desktop or Android phone), paste into address bar:<br />
                  <code className="bg-white/10 px-1 py-0.5 rounded text-amber-300 font-mono select-all text-[10px]">chrome://flags/#unsafely-treat-insecure-origin-as-secure</code><br />
                  Enter <code className="text-rose-400 font-mono font-bold">http://172.21.16.52:5173</code>, set to <strong>Enabled</strong>, and tap <strong>Relaunch</strong>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-black/60 border border-white/10">
                <span className="font-bold text-white block mb-1">Option 3: Use Native Mobile Photo Capture</span>
                <p className="text-stone-400 text-[11px]">
                  Inside the <strong>Camera</strong> tab, tap <strong>"📸 Snap Photo"</strong>. It uses device camera capture directly without any WebRTC permission blocks!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowSecurityModal(false)}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs shadow-lg transition-colors cursor-pointer"
            >
              GOT IT // CLOSE NOTICE
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
