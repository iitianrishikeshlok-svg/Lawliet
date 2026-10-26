import React, { useState, useEffect, useRef } from 'react';
import { audio } from '../common/AudioEngine';

/**
 * L — Persistent Floating Desktop Icon
 * Designed as a separate native Windows desktop window.
 * 
 * - Single click opens the Assistant HUD so the user can immediately interact!
 * - Right click opens the Action Menu.
 * - Dragging moves the icon without triggering click/open.
 * - Understated hover response, restrained active-state indicators.
 * - Fully configurable: size, accent color, background, opacity, shadow.
 */
export default function FloatingIcon({
  theme,
  iconSize = 52,
  iconOpacity = 0.95,
  iconShadow = 'subtle',
  iconBackground = 'graphite',
  isThinking = false,
  isWatching = false,
  firstRunHintSeen = false,
  onDismissHint = null,
  onClick = null,
  onOpenActionMenu = null,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [showHint, setShowHint] = useState(!firstRunHintSeen);
  const dragStartRef = useRef({ x: 0, y: 0, time: 0, isDragging: false });

  // Shadow classes based on user preference
  const shadowStyles = {
    none: 'none',
    subtle: '0 4px 16px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.2)',
    medium: '0 8px 24px rgba(0, 0, 0, 0.6), 0 2px 6px rgba(0, 0, 0, 0.3)',
    deep: '0 12px 36px rgba(0, 0, 0, 0.8), 0 4px 12px rgba(0, 0, 0, 0.5)',
  };

  // Background appearance based on user preference
  const getBackgroundStyle = () => {
    if (iconBackground === 'glass') {
      return {
        background: 'rgba(20, 22, 28, 0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${isHovered ? theme.accent : 'rgba(255, 255, 255, 0.12)'}`,
      };
    }
    if (iconBackground === 'outline') {
      return {
        background: 'rgba(14, 15, 18, 0.92)',
        border: `1.5px solid ${isHovered ? theme.accent : 'rgba(255, 255, 255, 0.22)'}`,
      };
    }
    // Default: graphite solid
    return {
      background: '#16171b',
      border: `1px solid ${isHovered ? theme.accent : 'rgba(255, 255, 255, 0.10)'}`,
    };
  };

  // Auto-dismiss hint after 8 seconds
  useEffect(() => {
    if (showHint) {
      const timer = setTimeout(() => {
        setShowHint(false);
        onDismissHint?.();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [showHint, onDismissHint]);

  // Pointer down: initiate tracking to distinguish drag vs click
  const handlePointerDown = (e) => {
    dragStartRef.current = {
      x: e.screenX,
      y: e.screenY,
      time: Date.now(),
      isDragging: false,
    };
  };

  // Click handler: opens Assistant HUD!
  const handleClick = (e) => {
    const dx = Math.abs(e.screenX - dragStartRef.current.x);
    const dy = Math.abs(e.screenY - dragStartRef.current.y);
    const elapsed = Date.now() - dragStartRef.current.time;

    // If dragged or held for long drag, ignore
    if (dx > 5 || dy > 5 || elapsed > 500) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    audio.playClick();

    if (onClick) {
      onClick();
    } else if (window.electronAPI?.openAssistant) {
      window.electronAPI.openAssistant('chat');
    }
  };

  // Right click handler: open Action Menu
  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    audio.playClick();

    if (onOpenActionMenu) {
      onOpenActionMenu();
    } else if (window.electronAPI?.openActionMenu) {
      window.electronAPI.openActionMenu();
    }
  };

  return (
    <div
      className="draggable relative w-full h-full flex items-center justify-center select-none"
      style={{ opacity: iconOpacity }}
      onPointerDown={handlePointerDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onContextMenu={handleContextMenu}
    >
      {/* Onboarding hint */}
      {showHint && (
        <div
          className="non-draggable absolute -bottom-9 right-0 bg-[#121316] text-[#f1f2f4] text-[10px] px-2.5 py-1 rounded-md border border-white/10 shadow-lg whitespace-nowrap z-50 flex items-center gap-1.5 animate-fadeIn"
          onClick={(e) => {
            e.stopPropagation();
            setShowHint(false);
            onDismissHint?.();
          }}
        >
          <span>Click to open L • Alt+L to toggle</span>
          <button className="text-white/40 hover:text-white text-[10px] ml-1">✕</button>
        </div>
      )}

      {/* Main Floating "L" Icon Button */}
      <button
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className="non-draggable relative flex items-center justify-center p-0 rounded-2xl cursor-pointer transition-all duration-150 focus:outline-none group active:scale-95"
        style={{
          width: `${iconSize}px`,
          height: `${iconSize}px`,
          ...getBackgroundStyle(),
          boxShadow: isHovered
            ? `${shadowStyles[iconShadow] || shadowStyles.subtle}, 0 0 14px ${theme.accentGlow || 'rgba(59, 130, 246, 0.25)'}`
            : shadowStyles[iconShadow] || shadowStyles.subtle,
        }}
        title="L — Click to open Assistant • Right-click for Action Menu • Alt+L"
        aria-label="L Assistant"
      >
        {/* Crisp Capital "L" Logo */}
        <div className="relative flex items-center justify-center w-full h-full p-2">
          <img
            src="/l-triangle-logo.svg"
            alt="L"
            className="w-full h-full object-contain pointer-events-none transition-transform duration-150 group-hover:scale-105 drop-shadow-[0_0_8px_rgba(225,29,72,0.5)]"
            style={{ mixBlendMode: 'screen', background: 'transparent' }}
            onError={(e) => {
              e.target.style.display = 'none';
              if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
            }}
          />
          <svg
            width={Math.round(iconSize * 0.48)}
            height={Math.round(iconSize * 0.48)}
            viewBox="0 0 24 24"
            fill="none"
            className="hidden transition-transform duration-150 group-hover:scale-105"
          >
            <path
              d="M7 4.5 V17.5 H17.5 V15 H9.5 V4.5 Z"
              fill={isHovered ? '#ffffff' : '#f1f2f4'}
              className="transition-colors duration-150"
            />
          </svg>
        </div>

        {/* Status Indicator (Thinking / Screen Watch) */}
        <div className="absolute top-1.5 right-1.5 flex items-center justify-center">
          {isThinking ? (
            <span
              className="w-2 h-2 rounded-full animate-ping"
              style={{ backgroundColor: theme.accent || '#3b82f6' }}
            />
          ) : isWatching ? (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          ) : (
            <span
              className="w-1.5 h-1.5 rounded-full transition-colors duration-150"
              style={{
                backgroundColor: isHovered ? theme.accent : 'rgba(255, 255, 255, 0.25)',
              }}
            />
          )}
        </div>

        {/* Quick Action Menu Trigger Button (shown on hover) */}
        {isHovered && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleContextMenu(e);
            }}
            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#1e2025] border border-white/20 flex items-center justify-center text-white/70 hover:text-white shadow-sm hover:scale-110 transition-all"
            title="Open 7 Actions Menu"
          >
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="19" cy="12" r="1.5" />
              <circle cx="5" cy="12" r="1.5" />
            </svg>
          </button>
        )}
      </button>
    </div>
  );
}
