import React, { useState, useEffect, useRef } from 'react';
import { audio } from '../common/AudioEngine';

/**
 * ScreenXpertEdgeHandle — Movable, draggable ASUS ScreenXpert Floating Icon.
 * Modeled 1-to-1 from ASUS ScreenXpert hardware styling.
 * 
 * Capabilities:
 * - Drag freely anywhere across the screen (X and Y coordinates).
 * - Smooth real-time cursor following with GPU translate3d.
 * - Magnetic edge snapping when dropped near left or right screen edge.
 * - Free-floating luxury ASUS capsule/pill state when placed in open screen space.
 * - Remembers exact position in localStorage ('l_screenxpert_handle_pos').
 * - Pointer capture and transparent drag overlay to prevent iframe event interception.
 * - Clicking without dragging toggles the ASUS ScreenXpert Game Bar.
 */
export default function ScreenXpertEdgeHandle({
  isOpen,
  onToggle,
  onPositionChange,
}) {
  const [pos, setPos] = useState(() => {
    const defaultWinW = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const defaultWinH = typeof window !== 'undefined' ? window.innerHeight : 800;
    try {
      const saved = localStorage.getItem('l_screenxpert_handle_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return {
            x: Math.max(0, Math.min(defaultWinW - 48, parsed.x)),
            y: Math.max(10, Math.min(defaultWinH - 84, parsed.y)),
            isDocked: Boolean(parsed.isDocked),
            dockSide: parsed.dockSide || (parsed.x < defaultWinW / 2 ? 'left' : 'right'),
            side: parsed.side || (parsed.x < defaultWinW / 2 ? 'left' : 'right'),
            isPixel: true,
          };
        }
        // Legacy { y: 50, side: 'right' }
        if (typeof parsed.y === 'number') {
          const side = parsed.side === 'left' ? 'left' : 'right';
          const pixelX = side === 'left' ? 0 : defaultWinW - 48;
          const pixelY = Math.round((parsed.y / 100) * defaultWinH);
          return {
            x: pixelX,
            y: Math.max(10, Math.min(defaultWinH - 84, pixelY)),
            isDocked: true,
            dockSide: side,
            side,
            isPixel: true,
          };
        }
      }
    } catch {}
    return {
      x: defaultWinW - 48,
      y: Math.round(defaultWinH * 0.45),
      isDocked: true,
      dockSide: 'right',
      side: 'right',
      isPixel: true,
    };
  });

  const [isDragging, setIsDragging] = useState(false);
  const [snapCandidate, setSnapCandidate] = useState(null); // 'left' | 'right' | null
  const handleRef = useRef(null);

  const dragRef = useRef({
    isDown: false,
    hasMoved: false,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    pointerId: null,
  });

  // Notify parent whenever pos changes so Game Bar aligns with handle
  useEffect(() => {
    onPositionChange?.(pos);
  }, [pos, onPositionChange]);

  // Keep position clamped on window resize
  useEffect(() => {
    const handleResize = () => {
      setPos((prev) => {
        const winW = window.innerWidth;
        const winH = window.innerHeight;
        let newX = prev.x;
        let newY = prev.y;

        if (prev.isDocked && prev.dockSide === 'right') {
          newX = winW - 48;
        } else {
          newX = Math.max(0, Math.min(winW - 48, prev.x));
        }
        newY = Math.max(10, Math.min(winH - 84, prev.y));

        return {
          ...prev,
          x: newX,
          y: newY,
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePointerDown = (e) => {
    // Left mouse click or touch only
    if (e.button !== undefined && e.button !== 0) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    dragRef.current = {
      isDown: true,
      hasMoved: false,
      startX: e.clientX,
      startY: e.clientY,
      initialX: pos.x,
      initialY: pos.y,
      pointerId: e.pointerId,
    };
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current.isDown) return;
    if (dragRef.current.pointerId !== null && e.pointerId !== dragRef.current.pointerId) return;

    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    if (!dragRef.current.hasMoved && Math.hypot(dx, dy) > 4) {
      dragRef.current.hasMoved = true;
      setIsDragging(true);
    }

    if (dragRef.current.hasMoved) {
      const winW = window.innerWidth || 1280;
      const winH = window.innerHeight || 800;

      const rawX = dragRef.current.initialX + dx;
      const rawY = dragRef.current.initialY + dy;

      const clampedX = Math.max(0, Math.min(winW - 48, rawX));
      const clampedY = Math.max(10, Math.min(winH - 84, rawY));

      // Magnetic snap hint near edges (< 45px)
      let snap = null;
      if (clampedX <= 45) {
        snap = 'left';
      } else if (clampedX >= winW - 48 - 45) {
        snap = 'right';
      }
      setSnapCandidate(snap);

      const side = clampedX < winW / 2 ? 'left' : 'right';

      setPos({
        x: clampedX,
        y: clampedY,
        isDocked: false,
        dockSide: null,
        side,
        isPixel: true,
      });
    }
  };

  const handlePointerUp = (e) => {
    if (!dragRef.current.isDown) return;
    dragRef.current.isDown = false;
    setIsDragging(false);

    try {
      if (dragRef.current.pointerId !== null) {
        e.currentTarget.releasePointerCapture(dragRef.current.pointerId);
      }
    } catch {}

    if (dragRef.current.hasMoved) {
      const winW = window.innerWidth || 1280;
      const winH = window.innerHeight || 800;

      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const rawX = dragRef.current.initialX + dx;
      const rawY = dragRef.current.initialY + dy;

      let finalX = Math.max(0, Math.min(winW - 48, rawX));
      const finalY = Math.max(10, Math.min(winH - 84, rawY));
      let isDocked = false;
      let dockSide = null;

      // Magnetic snap within 50px of either edge
      if (finalX <= 50) {
        finalX = 0;
        isDocked = true;
        dockSide = 'left';
        try { audio.playToggle?.(); } catch {}
      } else if (finalX >= winW - 48 - 50) {
        finalX = winW - 48;
        isDocked = true;
        dockSide = 'right';
        try { audio.playToggle?.(); } catch {}
      }

      setSnapCandidate(null);

      const side = finalX < winW / 2 ? 'left' : 'right';
      const finalPos = {
        x: finalX,
        y: finalY,
        isDocked,
        dockSide,
        side,
        isPixel: true,
      };

      setPos(finalPos);
      try {
        localStorage.setItem('l_screenxpert_handle_pos', JSON.stringify(finalPos));
      } catch {}
      onPositionChange?.(finalPos);
    } else {
      // Clean click — toggle Game Bar
      setSnapCandidate(null);
      audio.playClick();
      onToggle?.();
    }
  };

  const isDockedLeft = pos.isDocked && pos.dockSide === 'left';
  const isDockedRight = pos.isDocked && pos.dockSide === 'right';
  const isDocked = isDockedLeft || isDockedRight;

  return (
    <>
      {/* Fullscreen transparent drag shield overlay to block iframe event-swallowing */}
      {isDragging && (
        <div className="fixed inset-0 z-[9998] cursor-grabbing select-none bg-transparent pointer-events-auto" />
      )}

      {/* Magnetic Edge Snap Visual Guide */}
      {isDragging && snapCandidate === 'left' && (
        <div className="fixed left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-rose-500/80 to-transparent z-[9990] animate-pulse pointer-events-none" />
      )}
      {isDragging && snapCandidate === 'right' && (
        <div className="fixed right-0 top-0 bottom-0 w-3 bg-gradient-to-l from-rose-500/80 to-transparent z-[9990] animate-pulse pointer-events-none" />
      )}

      {/* ASUS ScreenXpert Movable Icon */}
      <div
        ref={handleRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
          filter: isDragging
            ? 'drop-shadow(0 16px 36px rgba(244, 63, 94, 0.4)) drop-shadow(0 4px 12px rgba(0, 0, 0, 0.9))'
            : 'drop-shadow(0 12px 28px rgba(0, 0, 0, 0.85))',
        }}
        className={`fixed top-0 left-0 z-[9999] select-none touch-none ${
          isDragging ? 'cursor-grabbing scale-105 duration-0' : 'cursor-grab transition-transform duration-150 ease-out'
        }`}
        title="ASUS ScreenXpert Icon • Drag anywhere on screen • Snap to edges • Click to toggle Game Bar"
      >
        <div
          className={`w-12 h-[74px] bg-gradient-to-b from-[#181920] via-[#121317] to-[#0d0e12] flex flex-col items-center justify-between py-2 shadow-2xl relative overflow-hidden group border ${
            isDockedRight
              ? 'rounded-l-2xl rounded-r-none border-l border-y border-r-0 border-white/[0.22] hover:border-rose-500/60'
              : isDockedLeft
              ? 'rounded-r-2xl rounded-l-none border-r border-y border-l-0 border-white/[0.22] hover:border-rose-500/60'
              : 'rounded-2xl border-white/[0.25] hover:border-rose-500/60 ring-1 ring-white/[0.08] hover:ring-rose-500/40'
          }`}
        >
          {/* Top Gloss Reflection Line */}
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/[0.12] to-transparent pointer-events-none" />

          {/* Vertical Drag Grip Ribs */}
          <div className="flex space-x-1 opacity-50 group-hover:opacity-90 transition-opacity">
            <span className="w-1 h-2 rounded-full bg-white/60 shadow-sm" />
            <span className="w-1 h-2 rounded-full bg-white/60 shadow-sm" />
          </div>

          {/* ASUS ScreenXpert Icon (Double parallel diagonal slash bars) */}
          <div className="w-7 h-7 flex flex-col items-center justify-center space-y-1.5 transform -rotate-12 group-hover:scale-110 transition-transform">
            <span className="w-4.5 h-1.5 rounded-full bg-gradient-to-r from-white via-neutral-200 to-neutral-400 shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
            <span className="w-4.5 h-1.5 rounded-full bg-gradient-to-r from-rose-400 to-rose-600 shadow-[0_0_10px_rgba(244,63,94,0.6)]" />
          </div>

          {/* Indicator Status LED Dot */}
          <div className="flex items-center space-x-1">
            <span
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                isOpen
                  ? 'bg-rose-500 shadow-[0_0_10px_#ff1e2e] animate-pulse scale-110'
                  : 'bg-emerald-400/80 group-hover:bg-rose-400 shadow-[0_0_6px_#10b981]'
              }`}
            />
          </div>

          {/* Floating badge subtle bottom border highlight when undocked */}
          {!isDocked && (
            <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />
          )}
        </div>
      </div>
    </>
  );
}
