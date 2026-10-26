import React, { useState, useEffect, useRef } from 'react';
import { audio } from '../common/AudioEngine';

/**
 * DraggableWebIcon — Persistent Floating L Icon for Web / Standalone mode.
 * Draggable across the viewport, stays within screen boundaries,
 * distinguishes drag from click, persists position, and provides
 * smooth hover effects with restrained crimson/violet lighting.
 */
export default function DraggableWebIcon({
  theme,
  iconSize = 52,
  iconOpacity = 0.95,
  iconShadow = 'subtle',
  iconBackground = 'graphite',
  isThinking = false,
  isWatching = false,
  onClick,
  onReopenIntro,
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
      x: typeof window !== 'undefined' ? Math.max(16, window.innerWidth - 80) : 100,
      y: typeof window !== 'undefined' ? 90 : 90,
    };
  });

  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    startTime: 0,
    hasMoved: false,
  });

  // Clamp position on window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        const maxX = Math.max(12, window.innerWidth - iconSize - 12);
        const maxY = Math.max(12, window.innerHeight - iconSize - 12);
        return {
          x: Math.min(Math.max(12, prev.x), maxX),
          y: Math.min(Math.max(12, prev.y), maxY),
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [iconSize]);

  // Pointer drag events
  const handlePointerDown = (e) => {
    // Only left clicks
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

      if (Math.hypot(dx, dy) > 4) {
        dragRef.current.hasMoved = true;
      }

      const maxX = Math.max(12, window.innerWidth - iconSize - 12);
      const maxY = Math.max(12, window.innerHeight - iconSize - 12);

      const nextX = Math.min(Math.max(12, dragRef.current.initialX + dx), maxX);
      const nextY = Math.min(Math.max(12, dragRef.current.initialY + dy), maxY);

      setPosition({ x: nextX, y: nextY });
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      setIsDragging(false);

      const elapsed = Date.now() - dragRef.current.startTime;

      // Click detection: minimal movement and short duration
      if (!dragRef.current.hasMoved && elapsed < 400) {
        audio.playClick();
        onClick?.();
      } else if (dragRef.current.hasMoved) {
        // Save position to localStorage
        try {
          localStorage.setItem('l_web_icon_pos', JSON.stringify(position));
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Keyboard accessibility (Enter or Space to activate)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      audio.playClick();
      onClick?.();
    }
  };

  // Shadow styles
  const shadowStyles = {
    none: 'none',
    subtle: '0 4px 16px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.2)',
    medium: '0 8px 24px rgba(0, 0, 0, 0.6), 0 2px 6px rgba(0, 0, 0, 0.3)',
    deep: '0 12px 36px rgba(0, 0, 0, 0.8), 0 4px 12px rgba(0, 0, 0, 0.5)',
  };

  // Background style
  const getBackgroundStyle = () => {
    if (iconBackground === 'glass') {
      return {
        background: 'rgba(20, 22, 28, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${isHovered ? theme?.accent || '#e11d48' : 'rgba(255, 255, 255, 0.12)'}`,
      };
    }
    if (iconBackground === 'outline') {
      return {
        background: 'rgba(14, 15, 18, 0.94)',
        border: `1.5px solid ${isHovered ? theme?.accent || '#e11d48' : 'rgba(255, 255, 255, 0.22)'}`,
      };
    }
    // Default graphite solid
    return {
      background: '#141518',
      border: `1px solid ${isHovered ? theme?.accent || '#e11d48' : 'rgba(255, 255, 255, 0.12)'}`,
    };
  };

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden select-none pointer-events-none z-50">
      {/* Draggable Icon Container */}
      <div
        className="absolute pointer-events-auto touch-none"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${iconSize}px`,
          height: `${iconSize}px`,
          cursor: isDragging ? 'grabbing' : 'grab',
          transition: isDragging ? 'none' : 'box-shadow 0.2s ease, transform 0.2s ease',
        }}
        onPointerDown={handlePointerDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Floating Button */}
        <button
          type="button"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className="relative w-full h-full flex items-center justify-center p-0 rounded-none bg-black border-2 border-[#ff1e2e] shadow-[4px_4px_0px_#000,4px_4px_0px_#ff1e2e] hover:shadow-[5px_5px_0px_#ff1e2e] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#ff1e2e] transition-all cursor-grab active:cursor-grabbing group"
          style={{
            opacity: iconOpacity,
          }}
          title="L Assistant — Click to open • Drag to reposition • Alt+L"
          aria-label="Open L Assistant"
        >
          {/* Iconic Capital L Logo */}
          <div className="relative flex items-center justify-center w-full h-full p-2">
            <img
              src="/l-triangle-logo.svg"
              alt="L"
              className="w-full h-full object-contain pointer-events-none transition-transform duration-200 group-hover:scale-110 drop-shadow-[0_0_8px_rgba(225,29,72,0.5)]"
              style={{ mixBlendMode: 'screen', background: 'transparent' }}
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
              }}
            />
            <span className="hidden font-monogram font-black text-2xl text-white group-hover:text-rose-100 transition-colors drop-shadow-[0_2px_8px_rgba(255,255,255,0.4)]">
              L
            </span>
          </div>

          {/* Status Indicator Dot */}
          <div className="absolute top-1 right-1 flex items-center justify-center">
            {isThinking ? (
              <span
                className="w-2 h-2 rounded-none animate-ping shadow-[0_0_6px_#ff1e2e]"
                style={{ backgroundColor: theme?.accent || '#e11d48' }}
              />
            ) : isWatching ? (
              <span className="w-2 h-2 rounded-none bg-emerald-400 animate-pulse shadow-[0_0_6px_#00ff66]" />
            ) : (
              <span
                className="w-1.5 h-1.5 rounded-none transition-colors duration-150"
                style={{
                  backgroundColor: isHovered ? theme?.accent || '#e11d48' : 'rgba(255, 30, 46, 0.7)',
                }}
              />
            )}
          </div>
        </button>

        {/* Hover Action Badge */}
        {isHovered && !isDragging && (
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black border-2 border-[#ff1e2e] px-2.5 py-0.5 rounded-none text-[10px] text-white whitespace-nowrap shadow-[3px_3px_0px_#000] font-mono font-bold uppercase pointer-events-none flex items-center space-x-1.5">
            <span className="font-black text-rose-400">[ CLICK ]</span>
            <span>OPEN L</span>
            <span className="text-white/40 font-mono text-[9px]">(ALT+L)</span>
          </div>
        )}
      </div>

      {/* Discreet Bottom Bar Controls in Standalone Mode */}
      <div className="absolute bottom-3 right-4 pointer-events-auto flex items-center space-x-2 text-[11px] font-mono">
        {onReopenIntro && (
          <button
            onClick={() => {
              audio.playClick();
              onReopenIntro();
            }}
            className="brutal-btn rounded-none text-[10px] !py-1 !px-2.5 border-2 border-neutral-700 hover:border-[#ff1e2e] shadow-[2px_2px_0px_#000] uppercase font-mono cursor-pointer"
            title="Replay Cinematic Opening Screen"
          >
            [ REPLAY INTRO ]
          </button>
        )}
        <button
          onClick={() => {
            audio.playClick();
            onClick?.();
          }}
          className="brutal-btn-solid rounded-none text-[10px] !py-1 !px-3 border-2 border-black shadow-[2px_2px_0px_#ffffff] flex items-center space-x-1.5 uppercase font-mono cursor-pointer"
          title="Open L Assistant Window"
        >
          <span
            className="w-1.5 h-1.5 rounded-none bg-black"
          />
          <span className="font-black text-black">[ OPEN ASSISTANT ]</span>
        </button>
      </div>
    </div>
  );
}
