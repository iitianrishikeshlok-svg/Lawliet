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
    <header className="draggable relative flex flex-col w-full px-4 pt-3 pb-2.5 border-b border-white/[0.08] bg-black/40 backdrop-blur-2xl select-none">
      {/* Top Utility Row */}
      <div className="flex items-center justify-between w-full">
        {/* L Identity Mark, Status & Latency */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-rose-600/30 to-purple-600/25 border border-white/20 shadow-[0_0_20px_rgba(244,63,94,0.35)] p-1.5 transition-transform hover:scale-110 color-cycle-flow">
            <img
              src="/l-triangle-logo.svg"
              alt="L"
              className="w-full h-full object-contain pointer-events-none"
              style={{ mixBlendMode: 'screen', background: 'transparent' }}
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-black animate-pulse" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold tracking-wide text-white font-sans">
                L Intelligence
              </span>
              {lastLatency && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {lastLatency}
                </span>
              )}
            </div>
            <span className="text-[10px] text-white/40 tracking-wider">
              Reasoning Engine • Multimodal
            </span>
          </div>
        </div>

        {/* Window Controls & Floating PiP Button */}
        <div className="non-draggable flex items-center space-x-2">
          {/* Insecure Origin HTTP Warning Pill */}
          {!isSecure && !isElectron && (
            <button
              onClick={() => setShowSecurityModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
              title="Camera & Screen Share blocked on HTTP IP by Chrome. Click for 1-click fix."
            >
              <ShieldAlert size={12} className="text-amber-400" />
              <span>Fix Permissions</span>
            </button>
          )}

          {/* Desktop Always-On-Top Floating Icon (Picture-in-Picture) */}
          <button
            onClick={handleFloatPiPClick}
            title="Pop out Floating Icon & Circular Menu on Real Home Page"
            className={`relative overflow-hidden flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-medium border transition-all cursor-pointer hover:scale-105 active:scale-95 ${
              pipActive
                ? 'color-cycle-pill text-white border-white/20 shadow-[0_0_20px_rgba(244,63,94,0.45)]'
                : 'bg-white/[0.04] text-white/80 hover:text-white border-white/[0.1] hover:border-white/[0.2] hover:bg-white/[0.08]'
            }`}
          >
            <Monitor size={12} className={pipActive ? 'text-white' : 'text-rose-400'} />
            <span className="hidden sm:inline">Float HUD</span>
          </button>

          {/* Always on Top Pin */}
          <button
            onClick={() => {
              audio.playClick();
              onTogglePin?.();
            }}
            title={isPinned ? 'Always on Top: Active' : 'Always on Top: Inactive'}
            className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all cursor-pointer hover:scale-110 active:scale-95 ${
              isPinned
                ? 'color-cycle-pill text-white border-white/20 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                : 'bg-white/[0.04] text-white/60 hover:text-white border-white/[0.08] hover:bg-white/[0.08]'
            }`}
          >
            <Pin size={12} />
          </button>

          {/* Close / Minimize Panel Button */}
          <button
            onClick={() => {
              audio.playCollapse();
              onClose?.();
            }}
            title="Minimize to Floating Icon (Esc)"
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.04] text-white/60 hover:text-white border border-white/[0.08] hover:bg-white/[0.1] hover:border-rose-500/30 transition-all cursor-pointer hover:scale-110 active:scale-95"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Modern Minimalist Segmented Reasoning Selector */}
      <div className="non-draggable mt-2.5 flex items-center justify-between w-full px-3 py-1.5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
        <div className="flex items-center space-x-1.5 text-white/40 text-[11px] font-medium">
          <Sparkles size={12} className="text-rose-400" />
          <span>Cognitive Depth:</span>
        </div>
        <div className="flex items-center space-x-1 p-0.5 rounded-full bg-black/40 border border-white/[0.06]">
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
                className={`relative overflow-hidden px-3 py-1 rounded-full text-[11px] font-medium transition-all duration-200 flex items-center space-x-1.5 cursor-pointer hover:scale-105 active:scale-95 ${
                  isActive
                    ? 'color-cycle-pill text-white shadow-[0_2px_15px_rgba(244,63,94,0.4)] font-semibold'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <Icon size={11} className={isActive ? 'text-white' : 'text-stone-400'} />
                <span>
                  {lvl === 1 ? 'Fast' : lvl === 2 ? 'Balanced' : 'Deep'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Security Context & Permission Unblock Modal */}
      {showSecurityModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-[#0e1017]/95 border border-white/[0.12] rounded-3xl p-6 shadow-2xl text-left space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center space-x-2 text-rose-400 font-semibold text-sm">
                <ShieldAlert size={16} />
                <span>Permission Configuration</span>
              </div>
              <button
                onClick={() => setShowSecurityModal(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
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
