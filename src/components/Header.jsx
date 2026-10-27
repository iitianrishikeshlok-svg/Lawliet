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
  selectedModel = 'gemini-3.5-flash',
  onSelectModel,
  onToggleScreenXpert,
  isScreenXpertOpen = false,
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
  // Launch Always-on-top Floating Desktop Icon & ScreenXpert via Document Picture-in-Picture
  const launchFloatingDesktopPiP = async () => {
    audio.playClick();
    if (!('documentPictureInPicture' in window)) {
      alert(
        'Document Picture-in-Picture is supported in modern Chrome & Edge.\n\nTo keep L & ASUS ScreenXpert floating permanently on top of all windows, tabs, and apps:\n1. Open in Google Chrome or Microsoft Edge\n2. Or run: launch.bat (Native Desktop Overlay)!'
      );
      return;
    }

    try {
      const pipWin = await window.documentPictureInPicture.requestWindow({
        width: 380,
        height: 620,
      });

      setPipActive(true);
      pipWin.addEventListener('pagehide', () => setPipActive(false));

      // Style PiP document
      pipWin.document.title = 'ASUS ScreenXpert — Floating Overlay';
      pipWin.document.body.style.margin = '0';
      pipWin.document.body.style.padding = '12px';
      pipWin.document.body.style.background = '#0d0e12';
      pipWin.document.body.style.color = '#f1f2f4';
      pipWin.document.body.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
      pipWin.document.body.style.boxSizing = 'border-box';
      pipWin.document.body.style.userSelect = 'none';
      pipWin.document.body.style.overflowY = 'auto';

      pipWin.document.body.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:12px;height:100%;">
          <!-- Header -->
          <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.08);">
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#f43f5e,#be123c);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(244,63,94,0.4);">
                <img src="/l-triangle-logo.svg" style="width:20px;height:20px;object-fit:contain;" />
              </div>
              <div>
                <div style="font-size:13px;font-weight:700;color:#fff;display:flex;align-items:center;gap:6px;">
                  <span>ScreenXpert</span>
                  <span style="font-size:9px;font-family:monospace;padding:1px 5px;border-radius:4px;background:rgba(244,63,94,0.2);color:#fda4af;border:1px solid rgba(244,63,94,0.3);">FLOAT</span>
                </div>
                <div style="font-size:10px;color:rgba(255,255,255,0.45);">Always-on-Top Across All Tabs</div>
              </div>
            </div>
            <span style="font-size:10px;font-family:monospace;color:#10b981;display:flex;align-items:center;gap:4px;">
              <span style="width:6px;height:6px;border-radius:50%;background:#10b981;box-shadow:0 0 6px #10b981;"></span>
              Active
            </span>
          </div>

          <!-- Quick Action Tiles Grid -->
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
            <button id="pip-chat" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:12px 6px;border-radius:14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:#fff;cursor:pointer;transition:all 0.15s;">
              <span style="font-size:18px;">💬</span>
              <span style="font-size:11px;font-weight:600;">Ask L (Chat)</span>
              <span style="font-size:9px;color:rgba(255,255,255,0.4);">Gemini Core</span>
            </button>
            <button id="pip-snip" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:12px 6px;border-radius:14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:#fff;cursor:pointer;transition:all 0.15s;">
              <span style="font-size:18px;">✂️</span>
              <span style="font-size:11px;font-weight:600;">OCR Snip</span>
              <span style="font-size:9px;color:rgba(255,255,255,0.4);">Screen Grab</span>
            </button>
            <button id="pip-browser" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:12px 6px;border-radius:14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:#fff;cursor:pointer;transition:all 0.15s;">
              <span style="font-size:18px;">🌐</span>
              <span style="font-size:11px;font-weight:600;">YouTube</span>
              <span style="font-size:9px;color:rgba(255,255,255,0.4);">Cinema Video</span>
            </button>
            <button id="pip-watch" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:12px 6px;border-radius:14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:#fff;cursor:pointer;transition:all 0.15s;">
              <span style="font-size:18px;">👁️</span>
              <span style="font-size:11px;font-weight:600;">Screen Watch</span>
              <span style="font-size:9px;color:rgba(255,255,255,0.4);">Live Stream</span>
            </button>
            <button id="pip-camera" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:12px 6px;border-radius:14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:#fff;cursor:pointer;transition:all 0.15s;">
              <span style="font-size:18px;">📷</span>
              <span style="font-size:11px;font-weight:600;">Camera</span>
              <span style="font-size:9px;color:rgba(255,255,255,0.4);">Optical Vision</span>
            </button>
            <button id="pip-focus" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:12px 6px;border-radius:14px;background:linear-gradient(135deg,rgba(244,63,94,0.2),rgba(244,63,94,0.3));border:1px solid rgba(244,63,94,0.4);color:#fda4af;cursor:pointer;transition:all 0.15s;">
              <span style="font-size:18px;">⚡</span>
              <span style="font-size:11px;font-weight:700;">Open Hub</span>
              <span style="font-size:9px;color:#fda4af;">Main Window</span>
            </button>
          </div>

          <!-- Bottom Telemetry Banner -->
          <div style="margin-top:auto;padding:10px;border-radius:12px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:between;font-size:10px;color:rgba(255,255,255,0.6);">
            <span>🔒 ASUS ScreenXpert Running</span>
            <span style="font-family:monospace;color:#f43f5e;">L-OS v2.5</span>
          </div>
        </div>
      `;

      const wireButton = (id, action) => {
        const btn = pipWin.document.getElementById(id);
        if (btn) {
          btn.addEventListener('click', () => {
            window.focus();
            action();
          });
        }
      };

      wireButton('pip-chat', () => onFloatPiP?.());
      wireButton('pip-snip', () => window.focus());
      wireButton('pip-browser', () => window.focus());
      wireButton('pip-watch', () => window.focus());
      wireButton('pip-camera', () => window.focus());
      wireButton('pip-focus', () => window.focus());
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
              {/* Active Model Pill */}
              <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-[10px] font-mono text-rose-300">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                <span>{selectedModel}</span>
              </div>
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
          {/* Toggle ScreenXpert Game Bar Overlay */}
          <button
            onClick={() => {
              audio.playClick();
              onToggleScreenXpert?.();
            }}
            title={isScreenXpertOpen ? 'Collapse ScreenXpert Game Bar' : 'Open ASUS ScreenXpert Game Bar'}
            className={`relative overflow-hidden flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all cursor-pointer hover:scale-105 active:scale-95 ${
              isScreenXpertOpen
                ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                : 'bg-white/[0.04] text-white/80 hover:text-white border-white/[0.1] hover:bg-white/[0.08]'
            }`}
          >
            <span className="text-rose-400">⚡</span>
            <span>ScreenXpert</span>
          </button>

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
            <span className="hidden sm:inline">Desktop Video</span>
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
