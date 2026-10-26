import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, Monitor } from '../common/Icons';
import { audio } from '../common/AudioEngine';

/**
 * Persistent Floating "L" Monogram Orb (56x56px).
 * Stays locked on screen across all apps and workspaces.
 * Features smart idle opacity, luxury glow, and spring expansion.
 */
export default function FloatingOrb({
  onExpand,
  theme,
  isThinking = false,
  isWatching = false,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isIdle, setIsIdle] = useState(false);

  // Smart idle opacity timer (fades to 40% when inactive for 3s)
  useEffect(() => {
    let idleTimer;
    const resetIdle = () => {
      setIsIdle(false);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        setIsIdle(true);
      }, 3500);
    };

    window.addEventListener('mousemove', resetIdle);
    idleTimer = setTimeout(() => setIsIdle(true), 3500);

    return () => {
      window.removeEventListener('mousemove', resetIdle);
      clearTimeout(idleTimer);
    };
  }, []);

  const handleClick = (e) => {
    e.stopPropagation();
    audio.playExpand();
    onExpand();
  };

  return (
    <div
      className={`draggable relative flex items-center justify-center select-none cursor-move transition-all duration-300 ${
        isHovered ? 'scale-105' : 'scale-100'
      }`}
      style={{
        width: '72px',
        height: '72px',
        opacity: isHovered || isThinking || isWatching ? 1.0 : isIdle ? 0.42 : 0.85,
      }}
      onMouseEnter={() => {
        setIsHovered(true);
        audio.playClick();
      }}
      onMouseLeave={() => setIsHovered(false)}
      title='Click to expand "L" Command HUD (or press Alt + L)'
    >
      {/* Outer Breathing Aura (Active during Thinking or Screen Watch) */}
      {(isThinking || isWatching) && (
        <div
          className="absolute inset-1 rounded-full animate-ping opacity-35"
          style={{
            background: isThinking ? 'radial-gradient(circle, #6366f1, transparent)' : 'radial-gradient(circle, #06b6d4, transparent)',
          }}
        />
      )}

      {/* Ambient Glow */}
      <div
        className="absolute inset-2 rounded-full blur-md transition-opacity duration-300"
        style={{
          background: theme.glowColor || 'rgba(99, 102, 241, 0.4)',
          opacity: isHovered ? 0.9 : 0.4,
        }}
      />

      {/* The 56x56 Core Orb Button */}
      <button
        onClick={handleClick}
        className={`non-draggable relative w-14 h-14 rounded-full flex items-center justify-center p-0 transition-transform duration-200 active:scale-95 group focus:outline-none`}
        style={{
          background: theme.bg || 'rgba(10, 11, 14, 0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1.5px solid ${isHovered ? theme.accent : theme.border}`,
          boxShadow: isHovered
            ? `0 0 25px ${theme.accentGlow}, inset 0 1px 1px rgba(255, 255, 255, 0.25)`
            : '0 8px 24px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Subtle Radial Refraction Gradient */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

        {/* Custom "L" Monogram */}
        <div className="relative flex items-center justify-center">
          <span
            className="font-monogram text-2xl font-black tracking-widest text-transparent bg-clip-text select-none transition-all duration-300"
            style={{
              backgroundImage: isHovered
                ? `linear-gradient(135deg, #ffffff 30%, ${theme.accent} 100%)`
                : 'linear-gradient(135deg, #ffffff 60%, #94a3b8 100%)',
              textShadow: isHovered ? `0 0 12px ${theme.accentGlow}` : 'none',
              transform: 'translateY(-1px)',
            }}
          >
            L
          </span>
        </div>

        {/* Real-time Status Badge Indicator */}
        <div className="absolute bottom-1 right-1.5 flex items-center justify-center">
          {isThinking ? (
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse border border-black/80" />
          ) : isWatching ? (
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping border border-black/80" />
          ) : (
            <span
              className="w-2 h-2 rounded-full border border-black/80 transition-colors duration-300"
              style={{
                backgroundColor: isHovered ? theme.accent : 'rgba(255, 255, 255, 0.3)',
              }}
            />
          )}
        </div>
      </button>
    </div>
  );
}
