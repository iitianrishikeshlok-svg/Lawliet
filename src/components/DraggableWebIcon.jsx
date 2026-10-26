import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Scissors,
  Globe,
  Monitor,
  Camera,
  Zap,
  Brain,
  Scale,
  Maximize2,
  X,
  ChevronDown,
} from '../common/Icons';
import { audio } from '../common/AudioEngine';
import { GEMINI_MODELS, THINKING_LEVELS } from '../services/gemini';

/**
 * DraggableWebIcon — Persistent Floating L Icon with Circular Layout Menu.
 *
 * Requirements fulfilled:
 * 1. When clicking Float PiP, minimizes to real home page with circular layout menu active.
 * 2. Circular layout of useful action icons:
 *    - 📸 SS (Screenshot / Snipping Tool)
 *    - 💬 Chat Bot (Ask L AI Assistant)
 *    - 🌐 Browser (Mini Web Browser & YouTube)
 *    - 👁️ Watch (Screen Vision Watcher)
 *    - 📷 Camera (Optical Camera Feed)
 * 3. Selection Option of AI Models (gemini-3.5-flash, gemini-2.5-flash, gemini-2.5-pro, etc.).
 * 4. Speed of Answering Selector (Fast Lv 1, Balanced Lv 2, Deep Lv 3).
 * 5. Draggable across screen, boundary-clamped, persistent position, maximalist cyber-gothic styling.
 */
export default function DraggableWebIcon({
  theme,
  iconSize = 56,
  iconOpacity = 0.98,
  iconShadow = 'medium',
  iconBackground = 'graphite',
  isThinking = false,
  isWatching = false,
  selectedModel = 'gemini-3.5-flash',
  onSelectModel,
  thinkingLevel = 2,
  onThinkingLevelChange,
  onSelectTab,
  onTriggerSnip,
  onExpand,
  onReopenIntro,
  initialRadialOpen = true,
}) {
  const [position, setPosition] = useState(() => {
    try {
      const saved = localStorage.getItem('l_web_icon_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return {
      x: typeof window !== 'undefined' ? Math.max(80, Math.floor(window.innerWidth / 2) - 30) : 300,
      y: typeof window !== 'undefined' ? Math.max(80, Math.floor(window.innerHeight / 2) - 40) : 300,
    };
  });

  const [radialOpen, setRadialOpen] = useState(initialRadialOpen);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showSpeedPicker, setShowSpeedPicker] = useState(false);

  const dragRef = useRef({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    startTime: 0,
    hasMoved: false,
  });

  // Keep position clamped within screen bounds
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        const maxX = Math.max(16, window.innerWidth - iconSize - 16);
        const maxY = Math.max(16, window.innerHeight - iconSize - 16);
        return {
          x: Math.min(Math.max(16, prev.x), maxX),
          y: Math.min(Math.max(16, prev.y), maxY),
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [iconSize]);

  // Pointer drag events on the central icon
  const handlePointerDown = (e) => {
    if (e.button !== 0) return;

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
      startTime: Date.now(),
      hasMoved: false,
    };

    setIsDragging(true);

    const handlePointerMove = (moveEvt) => {
      const dx = moveEvt.clientX - dragRef.current.startX;
      const dy = moveEvt.clientY - dragRef.current.startY;

      if (Math.hypot(dx, dy) > 5) {
        dragRef.current.hasMoved = true;
      }

      const maxX = Math.max(16, window.innerWidth - iconSize - 16);
      const maxY = Math.max(16, window.innerHeight - iconSize - 16);

      const nextX = Math.min(Math.max(16, dragRef.current.initialX + dx), maxX);
      const nextY = Math.min(Math.max(16, dragRef.current.initialY + dy), maxY);

      setPosition({ x: nextX, y: nextY });
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      setIsDragging(false);

      const elapsed = Date.now() - dragRef.current.startTime;

      // Click detection: minimal movement and short duration
      if (!dragRef.current.hasMoved && elapsed < 350) {
        audio.playClick();
        setRadialOpen((prev) => !prev);
      } else if (dragRef.current.hasMoved) {
        try {
          localStorage.setItem('l_web_icon_pos', JSON.stringify(position));
        } catch {}
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Launch a specific tab directly
  const launchTab = (tabId) => {
    audio.playClick();
    if (tabId === 'snip' && onTriggerSnip) {
      onTriggerSnip();
    }
    onSelectTab?.(tabId);
    onExpand?.();
  };

  // Circular layout action items definition
  // Positioned symmetrically around the circle (radius R = 100px)
  const CIRCLE_RADIUS = 102;
  const CIRCLE_ACTIONS = [
    {
      id: 'chat',
      label: 'CHAT BOT',
      desc: 'Ask L Detective AI',
      icon: Sparkles,
      angle: -90, // Top (12 o'clock)
      color: '#ff1e2e',
    },
    {
      id: 'snip',
      label: 'SS / SNIP',
      desc: 'Screen Snip & OCR',
      icon: Scissors,
      angle: -18, // Top-Right (approx 2 o'clock)
      color: '#f43f5e',
    },
    {
      id: 'browser',
      label: 'BROWSER',
      desc: 'Mini Web & Cinema',
      icon: Globe,
      angle: 54, // Bottom-Right (approx 4 o'clock)
      color: '#38bdf8',
    },
    {
      id: 'watch',
      label: 'WATCH',
      desc: 'Screen Vision Stream',
      icon: Monitor,
      angle: 126, // Bottom-Left (approx 7 o'clock)
      color: '#10b981',
    },
    {
      id: 'camera',
      label: 'CAMERA',
      desc: 'Live Optical Feed',
      icon: Camera,
      angle: 198, // Top-Left (approx 10 o'clock)
      color: '#a855f7',
    },
  ];

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden select-none pointer-events-none z-50">
      {/* Container anchored to draggable position */}
      <div
        className="absolute pointer-events-auto"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${iconSize}px`,
          height: `${iconSize}px`,
        }}
      >
        {/* ============================================================ */}
        {/* CIRCULAR / RADIAL ORBIT LAYOUT MENU                          */}
        {/* ============================================================ */}
        {radialOpen && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-40">
            {/* Ambient Red Glow Halo */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full pointer-events-none blur-2xl opacity-40"
              style={{
                background:
                  'radial-gradient(circle, rgba(255, 30, 46, 0.45) 0%, rgba(180, 10, 30, 0.2) 60%, transparent 80%)',
              }}
            />

            {/* Futuristic Rotating Cybernetic Reticle Ring */}
            <svg
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] pointer-events-none"
              viewBox="0 0 240 240"
            >
              <circle
                cx="120"
                cy="120"
                r={CIRCLE_RADIUS}
                fill="none"
                stroke="#ff1e2e"
                strokeWidth="1.5"
                strokeDasharray="6 8"
                opacity="0.45"
              />
              <circle
                cx="120"
                cy="120"
                r={CIRCLE_RADIUS - 16}
                fill="none"
                stroke="#ffffff"
                strokeWidth="1"
                strokeDasharray="2 14"
                opacity="0.25"
              />
            </svg>

            {/* Orbiting Action Buttons in Circle Layout */}
            {CIRCLE_ACTIONS.map((act) => {
              const rad = (act.angle * Math.PI) / 180;
              const x = Math.round(Math.cos(rad) * CIRCLE_RADIUS);
              const y = Math.round(Math.sin(rad) * CIRCLE_RADIUS);
              const Icon = act.icon;

              return (
                <div
                  key={act.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 group"
                  style={{
                    left: `${x}px`,
                    top: `${y}px`,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => launchTab(act.id)}
                    className="brutal-btn rounded-none w-11 h-11 sm:w-12 sm:h-12 border-2 border-[#ff1e2e] bg-black text-white shadow-[3px_3px_0px_#ff1e2e] hover:shadow-[4px_4px_0px_#ffffff] hover:scale-110 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer flex flex-col items-center justify-center p-0 transition-transform"
                    title={`${act.label} — ${act.desc}`}
                  >
                    <Icon size={16} className="text-white group-hover:text-rose-400 stroke-[2.5]" />
                    <span className="text-[7.5px] font-mono font-black tracking-tighter text-stone-300 mt-0.5 leading-none">
                      {act.label.split(' ')[0]}
                    </span>
                  </button>

                  {/* Tooltip Tag on Hover */}
                  <div className="absolute left-1/2 -translate-x-1/2 -bottom-6 bg-black border border-[#ff1e2e] px-1.5 py-0.5 rounded-none text-[8.5px] font-mono font-black text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-[2px_2px_0px_#000] z-50">
                    [ {act.label} ]
                  </div>
                </div>
              );
            })}

            {/* ======================================================== */}
            {/* TOP DOCK: AI MODEL SELECTOR PILL                         */}
            {/* ======================================================== */}
            <div className="absolute -top-[160px] left-1/2 -translate-x-1/2 flex flex-col items-center z-50 w-60">
              <button
                type="button"
                onClick={() => {
                  audio.playClick();
                  setShowModelPicker((prev) => !prev);
                  setShowSpeedPicker(false);
                }}
                className="brutal-btn rounded-none text-[10px] font-mono font-black px-3 py-1.5 border-2 border-[#ff1e2e] bg-black text-white shadow-[3px_3px_0px_#ff1e2e] hover:shadow-[4px_4px_0px_#ffffff] flex items-center justify-between w-full cursor-pointer"
                title="Select Gemini AI Model"
              >
                <div className="flex items-center space-x-1.5 truncate">
                  <Brain size={12} className="text-rose-400 shrink-0" />
                  <span className="text-stone-400">AI:</span>
                  <span className="text-white truncate font-bold">{selectedModel}</span>
                </div>
                <ChevronDown size={11} className="text-rose-400 shrink-0 ml-1" />
              </button>

              {/* Model Picker Dropdown Menu */}
              {showModelPicker && (
                <div className="mt-1 w-full bg-black border-2 border-[#ff1e2e] shadow-[4px_4px_0px_#000] p-1 flex flex-col space-y-1 text-left z-50">
                  {Object.entries(GEMINI_MODELS).map(([mId, mInfo]) => (
                    <button
                      key={mId}
                      type="button"
                      onClick={() => {
                        audio.playClick();
                        onSelectModel?.(mId);
                        setShowModelPicker(false);
                      }}
                      className={`px-2 py-1 text-[9.5px] font-mono flex items-center justify-between transition-colors text-left cursor-pointer ${
                        selectedModel === mId
                          ? 'bg-[#ff1e2e] text-black font-black'
                          : 'text-stone-300 hover:bg-neutral-900 hover:text-white font-bold'
                      }`}
                    >
                      <span className="truncate">{mInfo.label}</span>
                      {selectedModel === mId && <span className="ml-1 text-[8px]">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ======================================================== */}
            {/* BOTTOM DOCK: SPEED OF ANSWERING (THINKING LEVEL)         */}
            {/* ======================================================== */}
            <div className="absolute top-[148px] left-1/2 -translate-x-1/2 flex flex-col items-center z-50 w-64">
              <div className="flex items-center space-x-1 p-1 bg-black border-2 border-[#ff1e2e] shadow-[3px_3px_0px_#ff1e2e] w-full justify-between">
                <span className="text-[9px] font-mono font-black text-stone-400 pl-1 shrink-0">
                  ⚡ SPEED:
                </span>
                <div className="flex items-center space-x-1">
                  {[
                    { lvl: 1, label: 'FAST', icon: Zap },
                    { lvl: 2, label: 'BALANCED', icon: Scale },
                    { lvl: 3, label: 'DEEP', icon: Brain },
                  ].map((s) => {
                    const SIcon = s.icon;
                    const isActive = thinkingLevel === s.lvl;
                    return (
                      <button
                        key={s.lvl}
                        type="button"
                        onClick={() => {
                          audio.playClick();
                          onThinkingLevelChange?.(s.lvl);
                        }}
                        className={`px-2 py-1 text-[9px] font-mono font-black rounded-none transition-all cursor-pointer flex items-center space-x-1 ${
                          isActive
                            ? 'bg-[#ff1e2e] text-black border border-black shadow-[1px_1px_0px_#fff]'
                            : 'bg-neutral-900 text-stone-400 hover:text-white hover:bg-neutral-800'
                        }`}
                        title={`Answering Speed: ${s.label}`}
                      >
                        <SIcon size={10} />
                        <span>{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Full Window Expand Button */}
              <button
                type="button"
                onClick={() => {
                  audio.playClick();
                  onExpand?.();
                }}
                className="mt-1.5 brutal-btn-solid text-[9.5px] font-mono font-black px-3 py-1 border-2 border-black shadow-[2px_2px_0px_#ffffff] flex items-center space-x-1.5 cursor-pointer uppercase"
                title="Expand Full Assistant Window"
              >
                <Maximize2 size={10} />
                <span>[ ⛶ EXPAND FULL HUD ]</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* CENTRAL DRAGGABLE L ICON BUTTON                              */}
        {/* ============================================================ */}
        <div
          className="relative w-full h-full cursor-grab active:cursor-grabbing z-50"
          onPointerDown={handlePointerDown}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <button
            type="button"
            className={`relative w-full h-full flex items-center justify-center p-0 rounded-none bg-black border-2 border-[#ff1e2e] shadow-[4px_4px_0px_#000,4px_4px_0px_#ff1e2e] hover:shadow-[6px_6px_0px_#ff1e2e] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer group ${
              radialOpen ? 'ring-2 ring-rose-500' : ''
            }`}
            style={{ opacity: iconOpacity }}
            title={radialOpen ? 'Click to close Circular Menu' : 'Click to open Circular Menu'}
          >
            {/* Iconic Capital L Triangle Logo */}
            <div className="relative flex items-center justify-center w-full h-full p-2">
              <img
                src="/l-triangle-logo.svg"
                alt="L"
                className="w-full h-full object-contain pointer-events-none transition-transform duration-200 group-hover:scale-110 drop-shadow-[0_0_10px_rgba(255,30,46,0.6)]"
                style={{ mixBlendMode: 'screen', background: 'transparent' }}
              />
            </div>

            {/* Status Ping Dot */}
            <div className="absolute top-1 right-1 flex items-center justify-center">
              {isThinking ? (
                <span className="w-2 h-2 rounded-none bg-rose-500 animate-ping shadow-[0_0_6px_#ff1e2e]" />
              ) : isWatching ? (
                <span className="w-2 h-2 rounded-none bg-emerald-400 animate-pulse shadow-[0_0_6px_#00ff66]" />
              ) : (
                <span
                  className={`w-1.5 h-1.5 rounded-none transition-colors duration-150 ${
                    radialOpen ? 'bg-[#ff1e2e] shadow-[0_0_6px_#ff1e2e]' : 'bg-rose-600'
                  }`}
                />
              )}
            </div>
          </button>

          {/* Hover Status Tag */}
          {isHovered && !isDragging && !radialOpen && (
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black border-2 border-[#ff1e2e] px-2 py-0.5 rounded-none text-[9.5px] text-white whitespace-nowrap shadow-[3px_3px_0px_#000] font-mono font-bold uppercase pointer-events-none flex items-center space-x-1 z-50">
              <span className="text-rose-400 font-black">[ CLICK ]</span>
              <span>CIRCULAR MENU</span>
            </div>
          )}
        </div>
      </div>

      {/* Discreet Bottom Bar Controls in Standalone Mode */}
      <div className="absolute bottom-3 right-4 pointer-events-auto flex items-center space-x-2 text-[11px] font-mono z-40">
        {onReopenIntro && (
          <button
            onClick={() => {
              audio.playClick();
              onReopenIntro();
            }}
            className="brutal-btn rounded-none text-[10px] !py-1 !px-2.5 border-2 border-neutral-700 hover:border-[#ff1e2e] bg-black text-stone-300 shadow-[2px_2px_0px_#000] uppercase font-mono cursor-pointer"
            title="Replay Cinematic Opening Screen"
          >
            [ REPLAY INTRO ]
          </button>
        )}
        <button
          onClick={() => {
            audio.playClick();
            onExpand?.();
          }}
          className="brutal-btn-solid rounded-none text-[10px] !py-1 !px-3 border-2 border-black shadow-[2px_2px_0px_#ffffff] flex items-center space-x-1.5 uppercase font-mono cursor-pointer"
          title="Open Full Assistant Window"
        >
          <span className="font-black text-black">[ OPEN FULL ASSISTANT ]</span>
        </button>
      </div>
    </div>
  );
}
