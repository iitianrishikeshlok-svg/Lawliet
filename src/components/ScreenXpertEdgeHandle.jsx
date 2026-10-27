import React, { useState, useEffect, useRef } from 'react';
import { audio } from '../common/AudioEngine';

/**
 * ScreenXpertEdgeHandle — Movable, draggable ASUS ScreenXpert Edge Handle.
 * Modeled 1-to-1 from ASUS ScreenXpert hardware styling.
 * 
 * Capabilities:
 * - Drag up and down along the screen edge to any height.
 * - Drag across to dock on either the right or left edge.
 * - Remembers position in localStorage ('l_screenxpert_handle_pos').
 * - Clicking without dragging toggles the ASUS ScreenXpert Game Bar.
 * - Always stays on screen even when main app panels are closed.
 */
export default function ScreenXpertEdgeHandle({
  isOpen,
  onToggle,
  onPositionChange,
}) {
  const [handlePos, setHandlePos] = useState(() => {
    try {
      const saved = localStorage.getItem('l_screenxpert_handle_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.y === 'number' && (parsed.side === 'right' || parsed.side === 'left')) {
          return parsed;
        }
      }
    } catch {}
    return { y: 50, side: 'right' }; // percentage Y (50% = middle), right side
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({
    isDown: false,
    hasMoved: false,
    startY: 0,
    startX: 0,
    startPercentY: 50,
  });

  // Notify parent of current position so Game Bar can open aligned with handle
  useEffect(() => {
    onPositionChange?.(handlePos);
  }, [handlePos, onPositionChange]);

  const handlePointerDown = (e) => {
    dragRef.current = {
      isDown: true,
      hasMoved: false,
      startY: e.clientY || e.touches?.[0]?.clientY || 0,
      startX: e.clientX || e.touches?.[0]?.clientX || 0,
      startPercentY: handlePos.y,
    };
  };

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!dragRef.current.isDown) return;

      const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : null);
      const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : null);
      if (clientY === null) return;

      const deltaY = clientY - dragRef.current.startY;
      const deltaX = (clientX !== null ? clientX - dragRef.current.startX : 0);

      if (Math.abs(deltaY) > 4 || Math.abs(deltaX) > 8) {
        dragRef.current.hasMoved = true;
        setIsDragging(true);

        // Calculate new percentage Y clamped between 8% and 92%
        const viewportHeight = window.innerHeight || 800;
        const newPixelY = (dragRef.current.startPercentY / 100) * viewportHeight + deltaY;
        const clampedPixelY = Math.max(50, Math.min(viewportHeight - 70, newPixelY));
        const newPercentY = Math.round((clampedPixelY / viewportHeight) * 100);

        // Check if dragged to opposite side
        const viewportWidth = window.innerWidth || 1200;
        const side = (clientX !== null && clientX < viewportWidth / 2) ? 'left' : 'right';

        setHandlePos({ y: newPercentY, side });
      }
    };

    const handlePointerUp = () => {
      if (!dragRef.current.isDown) return;
      dragRef.current.isDown = false;

      if (dragRef.current.hasMoved) {
        // Drag finished — persist position
        setIsDragging(false);
        try {
          localStorage.setItem('l_screenxpert_handle_pos', JSON.stringify(handlePos));
        } catch {}
      } else {
        // Normal click — toggle Game Bar
        audio.playClick();
        onToggle?.();
      }
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [handlePos, onToggle]);

  const isRight = handlePos.side === 'right';

  return (
    <div
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
      style={{
        top: `${handlePos.y}%`,
        transform: 'translateY(-50%)',
        filter: 'drop-shadow(0 12px 28px rgba(0, 0, 0, 0.85))',
      }}
      className={`fixed ${isRight ? 'right-0' : 'left-0'} z-50 select-none touch-none ${
        isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab'
      }`}
      title="ASUS ScreenXpert Handle • Drag up/down to move • Click to toggle Game Bar"
    >
      <div
        className={`w-12 h-18 bg-gradient-to-l from-[#111216] to-[#1e1f26] border-y ${
          isRight
            ? 'rounded-l-2xl border-l border-white/[0.18] hover:border-rose-500/50'
            : 'rounded-r-2xl border-r border-white/[0.18] hover:border-rose-500/50'
        } flex flex-col items-center justify-between py-2 shadow-2xl transition-all duration-200 relative overflow-hidden group`}
      >
        {/* Top Gloss Reflection Line */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/[0.1] to-transparent pointer-events-none" />

        {/* Vertical Drag Ribs (Grip) */}
        <div className="flex space-x-1 opacity-40 group-hover:opacity-75 transition-opacity">
          <span className="w-1 h-2 rounded-full bg-white/50" />
          <span className="w-1 h-2 rounded-full bg-white/50" />
        </div>

        {/* ASUS ScreenXpert Icon (Double parallel diagonal slash bars) */}
        <div className="w-6 h-6 flex flex-col items-center justify-center space-y-1 transform -rotate-12 group-hover:scale-110 transition-transform">
          <span className="w-4 h-1.5 rounded-full bg-gradient-to-r from-white to-neutral-300 shadow-sm shadow-white/30" />
          <span className="w-4 h-1.5 rounded-full bg-gradient-to-r from-rose-400 to-rose-600 shadow-sm shadow-rose-950/60" />
        </div>

        {/* Indicator Status LED Dot */}
        <div className="flex items-center space-x-1">
          <span
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              isOpen
                ? 'bg-rose-500 shadow-[0_0_8px_#ff1e2e] animate-pulse'
                : 'bg-white/40 group-hover:bg-rose-400'
            }`}
          />
        </div>
      </div>
    </div>
  );
}
