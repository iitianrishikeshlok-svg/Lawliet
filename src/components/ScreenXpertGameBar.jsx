import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Scissors,
  Monitor,
  Camera,
  Globe,
  PenTool,
  History,
  Settings,
  Mic,
  Maximize2,
  X,
  Zap,
  Brain,
  Scale,
  ShieldCheck,
  Palette,
  Volume2,
  VolumeX,
  ChevronRight,
  ExternalLink,
  Laptop,
} from '../common/Icons';
import { audio } from '../common/AudioEngine';

/**
 * ScreenXpertGameBar — Luxury ASUS ScreenXpert-inspired Floating Game Bar & Utility Overlay.
 * Directly modeled from the ASUS ScreenXpert reference:
 * - 3-column squircle action grid
 * - Quick task workflow groups
 * - System & AI model telemetry
 * - Floating edge handle integration
 */
export default function ScreenXpertGameBar({
  onSelectAction,
  onOpenFullAssistant,
  onClose,
  thinkingLevel = 2,
  onThinkingLevelChange,
  selectedModel = 'gemini-3.5-flash',
  onSelectModel,
  onTriggerSnip,
  audioEnabled = true,
  onToggleAudio,
  theme,
}) {
  const [activeTaskGroup, setActiveTaskGroup] = useState('Task Group 1');
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isBarDragging, setIsBarDragging] = useState(false);
  const barDragRef = useRef({
    isDown: false,
    startX: 0,
    startY: 0,
    initialOffsetX: 0,
    initialOffsetY: 0,
    pointerId: null,
  });

  const handleHeaderPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    if (e.target.closest('button')) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    barDragRef.current = {
      isDown: true,
      startX: e.clientX,
      startY: e.clientY,
      initialOffsetX: dragOffset.x,
      initialOffsetY: dragOffset.y,
      pointerId: e.pointerId,
    };
    setIsBarDragging(true);
  };

  const handleHeaderPointerMove = (e) => {
    if (!barDragRef.current.isDown) return;
    const dx = e.clientX - barDragRef.current.startX;
    const dy = e.clientY - barDragRef.current.startY;
    setDragOffset({
      x: barDragRef.current.initialOffsetX + dx,
      y: barDragRef.current.initialOffsetY + dy,
    });
  };

  const handleHeaderPointerUp = (e) => {
    if (!barDragRef.current.isDown) return;
    barDragRef.current.isDown = false;
    setIsBarDragging(false);
    try {
      if (barDragRef.current.pointerId !== null) {
        e.currentTarget.releasePointerCapture(barDragRef.current.pointerId);
      }
    } catch {}
  };

  // 12 Exact ASUS ScreenXpert Layout Tiles matching screenshot
  const TILES = [
    {
      id: 'chat',
      label: 'Armoury Crate',
      sub: 'Ask L (AI Core)',
      icon: Sparkles,
      color: 'text-rose-400',
      action: () => onSelectAction('chat'),
    },
    {
      id: 'mode',
      label: 'Operation Mode',
      sub: thinkingLevel === 1 ? 'Performance' : thinkingLevel === 2 ? 'Balanced' : 'Deep Thinking',
      icon: thinkingLevel === 1 ? Zap : thinkingLevel === 2 ? Scale : Brain,
      color: 'text-cyan-400',
      action: () => {
        const nextLvl = thinkingLevel === 1 ? 2 : thinkingLevel === 2 ? 3 : 1;
        onThinkingLevelChange?.(nextLvl);
      },
    },
    {
      id: 'mic',
      label: 'Mic',
      sub: 'Voice Input',
      icon: Mic,
      color: 'text-rose-400',
      action: () => onSelectAction('chat'),
    },
    {
      id: 'watch',
      label: 'Screen Recorder',
      sub: 'Screen Watch AI',
      icon: Monitor,
      color: 'text-cyan-400',
      action: () => onSelectAction('watch'),
    },
    {
      id: 'system',
      label: 'Battery Care Mode',
      sub: 'AI Diagnostics',
      icon: ShieldCheck,
      color: 'text-emerald-400',
      action: () => onSelectAction('settings'),
    },
    {
      id: 'draw',
      label: 'Game Visual',
      sub: 'Draw & Annotate',
      icon: PenTool,
      color: 'text-purple-400',
      action: () => onSelectAction('draw'),
    },
    {
      id: 'lighting',
      label: 'PC Lighting',
      sub: 'Aura RGB Themes',
      icon: Palette,
      color: 'text-fuchsia-400',
      action: () => onSelectAction('settings'),
    },
    {
      id: 'printscreen',
      label: 'Print Screen',
      sub: 'Instant Snapshot',
      icon: Camera,
      color: 'text-amber-400',
      action: () => {
        if (onTriggerSnip) onTriggerSnip();
        else onSelectAction('snip');
      },
    },
    {
      id: 'snip',
      label: 'Snipping Tool',
      sub: 'Alt+S Crop & Ask',
      icon: Scissors,
      color: 'text-rose-400',
      action: () => {
        if (onTriggerSnip) onTriggerSnip();
        else onSelectAction('snip');
      },
    },
    {
      id: 'desktop',
      label: 'Back to Desktop',
      sub: 'Dock to Edge',
      icon: Laptop,
      color: 'text-neutral-300',
      action: () => onClose?.(),
    },
    {
      id: 'history',
      label: 'Clipboard',
      sub: 'History Vault',
      icon: History,
      color: 'text-stone-300',
      action: () => onSelectAction('history'),
    },
    {
      id: 'browser',
      label: 'Web & YouTube',
      sub: 'Cinema Browser',
      icon: Globe,
      color: 'text-blue-400',
      action: () => onSelectAction('browser'),
    },
  ];

  return (
    <>
      {isBarDragging && (
        <div className="fixed inset-0 z-[9998] cursor-grabbing select-none bg-transparent pointer-events-auto" />
      )}
      <div
        className="w-[360px] sm:w-[390px] max-w-[94vw] max-h-[92vh] overflow-y-auto overflow-x-hidden bg-[#0f1013]/95 backdrop-blur-2xl border border-white/[0.09] rounded-2xl p-4 shadow-2xl text-[#f1f2f4] select-none flex flex-col space-y-3 font-sans animate-fadeIn relative z-50 transition-shadow"
        style={{
          transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)`,
          boxShadow: isBarDragging
            ? '0 30px 70px -10px rgba(244, 63, 94, 0.35), 0 0 35px rgba(0, 0, 0, 0.9), 0 0 1px 1px rgba(255, 255, 255, 0.15)'
            : '0 25px 60px -15px rgba(0, 0, 0, 0.95), 0 0 30px rgba(0, 0, 0, 0.8), 0 0 1px 1px rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* 1. TOP HEADER (ScreenXpert Branded, Draggable) */}
        <div
          onPointerDown={handleHeaderPointerDown}
          onPointerMove={handleHeaderPointerMove}
          onPointerUp={handleHeaderPointerUp}
          onPointerCancel={handleHeaderPointerUp}
          onDoubleClick={() => setDragOffset({ x: 0, y: 0 })}
          title="Drag header to move ScreenXpert Game Bar • Double-click to reset position"
          className="flex items-center justify-between px-1.5 pb-2.5 border-b border-white/[0.08] cursor-grab active:cursor-grabbing select-none touch-none group"
        >
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center p-1 shadow-md shadow-rose-950/50">
            <img
              src="/l-triangle-logo.svg"
              alt="L"
              className="w-full h-full object-contain pointer-events-none"
              style={{ mixBlendMode: 'screen' }}
            />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-wide text-white flex items-center space-x-1.5">
              <span>ScreenXpert</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                L-OS
              </span>
            </div>
            <div className="text-[10px] text-white/40 tracking-wider">
              ASUS ROG Gaming & AI Command Bar
            </div>
          </div>
        </div>

        {/* Right Header Action Icons */}
        <div className="flex items-center space-x-1">
          {/* Sound Toggle */}
          <button
            onClick={() => {
              audio.playClick();
              onToggleAudio?.(!audioEnabled);
            }}
            title={audioEnabled ? 'Mute Sounds' : 'Enable Sounds'}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            {audioEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
          </button>

          {/* Settings */}
          <button
            onClick={() => {
              audio.playClick();
              onSelectAction('settings');
            }}
            title="Open Settings"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <Settings size={13} />
          </button>

          {/* Expand to Full Assistant Window */}
          <button
            onClick={() => {
              audio.playClick();
              onOpenFullAssistant?.();
            }}
            title="Expand Full Assistant Window"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <Maximize2 size={13} />
          </button>

          {/* Close / Minimize */}
          <button
            onClick={() => {
              audio.playCollapse();
              onClose?.();
            }}
            title="Minimize to Screen Edge"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/60 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-0.5"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* 2. 3x4 SQUIRCLE ACTION GRID (Exact ASUS ScreenXpert Layout) */}
      <div className="grid grid-cols-3 gap-2.5">
        {TILES.map((tile) => {
          const Icon = tile.icon;
          return (
            <button
              key={tile.id}
              onClick={() => {
                audio.playClick();
                tile.action();
              }}
              className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.07] hover:border-rose-500/50 shadow-sm transition-all duration-200 cursor-pointer active:scale-95 text-center min-h-[76px]"
            >
              <div className="w-8 h-8 rounded-xl bg-white/[0.04] group-hover:bg-rose-500/20 border border-white/[0.05] group-hover:border-rose-500/40 flex items-center justify-center mb-1.5 transition-all">
                <Icon size={16} className={`${tile.color} group-hover:scale-110 transition-transform`} />
              </div>
              <span className="text-[11px] font-medium text-white/90 group-hover:text-white leading-tight">
                {tile.label}
              </span>
              <span className="text-[9px] text-white/40 group-hover:text-rose-300 mt-0.5">
                {tile.sub}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. TASK GROUP CARD (From Image 1) */}
      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.07] p-3 flex flex-col space-y-2">
        <div className="flex items-center justify-between text-xs text-white/80 font-medium">
          <div className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[11px] uppercase tracking-wider text-white/60 font-semibold">
              Task Group
            </span>
          </div>
          <span className="text-[10px] text-white/40">1-Click AI Workflows</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              audio.playClick();
              onSelectAction('watch');
            }}
            className="flex items-center space-x-2 p-2 rounded-xl bg-black/40 hover:bg-white/[0.06] border border-white/[0.06] hover:border-rose-500/40 transition-all text-left cursor-pointer"
          >
            <Monitor size={14} className="text-cyan-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-white truncate">Task Group 1</div>
              <div className="text-[9.5px] text-white/40 truncate">Screen AI Summary</div>
            </div>
          </button>

          <button
            onClick={() => {
              audio.playClick();
              onSelectAction('browser');
            }}
            className="flex items-center space-x-2 p-2 rounded-xl bg-black/40 hover:bg-white/[0.06] border border-white/[0.06] hover:border-rose-500/40 transition-all text-left cursor-pointer"
          >
            <Globe size={14} className="text-rose-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-white truncate">YouTube Cinema</div>
              <div className="text-[9.5px] text-white/40 truncate">Ambient Videos</div>
            </div>
          </button>
        </div>
      </div>

      {/* 4. BLUETOOTH DEVICE BATTERY & TELEMETRY (1-to-1 match to Image 1) */}
      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.07] p-3 flex flex-col space-y-2">
        <div className="flex items-center justify-between text-xs text-white/80 font-medium">
          <div className="flex items-center space-x-2">
            <span className="text-[12px]">🖵</span>
            <span className="text-[11px] font-semibold text-white/80">
              Bluetooth Device Battery
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Ready</span>
          </span>
        </div>
        <div className="text-center py-2 text-[11px] text-white/40 font-normal">
          No device battery detected
        </div>
      </div>

      {/* 5. SYSTEM & AI MODEL TELEMETRY BAR */}
      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.07] p-2.5 flex items-center justify-between text-[11px]">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-white/60 font-medium">AI Core:</span>
          <span className="text-white font-semibold font-mono text-[10px]">
            {selectedModel}
          </span>
        </div>
        <button
          onClick={() => {
            audio.playClick();
            onOpenFullAssistant?.();
          }}
          className="px-3 py-1 rounded-full text-[10px] font-semibold text-white bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 shadow-sm transition-all flex items-center space-x-1 cursor-pointer"
        >
          <span>Open Full Workspace</span>
          <ChevronRight size={10} />
        </button>
      </div>
    </div>
  </>
  );
}
