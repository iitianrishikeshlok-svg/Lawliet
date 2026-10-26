import React, { useState, useEffect } from 'react';
import { Sparkles, Scissors, PenTool, Camera, Globe, History, Settings, X } from '../common/Icons';
import { audio } from '../common/AudioEngine';

const ACTIONS = [
  { id: 'chat', num: '1', label: 'Ask L', desc: 'AI reasoning & question answering', icon: Sparkles, shortcut: 'Enter' },
  { id: 'snip', num: '2', label: 'Screenshot', desc: 'Capture region with OCR & analysis', icon: Scissors, shortcut: 'Alt+S' },
  { id: 'draw', num: '3', label: 'Draw', desc: 'Annotate screen with vector tools', icon: PenTool, shortcut: 'Alt+D' },
  { id: 'camera', num: '4', label: 'Camera', desc: 'Optical feed with crosshair shutter', icon: Camera, shortcut: 'Alt+C' },
  { id: 'browser', num: '5', label: 'Browser', desc: 'Mini browser with opacity control', icon: Globe, shortcut: 'Alt+B' },
  { id: 'history', num: '6', label: 'History', desc: 'Saved sessions & Markdown export', icon: History, shortcut: 'Alt+H' },
  { id: 'settings', num: '7', label: 'Settings', desc: 'Themes, hotkeys & Gemini model', icon: Settings, shortcut: 'Alt+,' },
];

export default function ActionMenu({ theme, onSelectAction, onClose }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Keyboard navigation support: Arrow Up/Down, Number keys 1-7, Enter, Esc
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % ACTIONS.length);
        audio.playClick();
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + ACTIONS.length) % ACTIONS.length);
        audio.playClick();
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const action = ACTIONS[selectedIndex];
        if (action) {
          audio.playClick();
          onSelectAction(action.id);
        }
        return;
      }
      // Number keys 1-7
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 7) {
        e.preventDefault();
        const action = ACTIONS[num - 1];
        if (action) {
          audio.playClick();
          onSelectAction(action.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, onSelectAction, onClose]);

  return (
    <div
      className="w-[236px] bg-[#141518]/95 backdrop-blur-xl border border-white/10 rounded-xl p-1.5 shadow-2xl text-[#f1f2f4] select-none flex flex-col font-sans animate-fadeIn"
      style={{
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6), 0 2px 8px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Action Menu Header */}
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-white/[0.06] mb-1">
        <div className="flex items-center space-x-2">
          <div
            className="w-4 h-4 rounded font-monogram font-black text-[10px] text-white flex items-center justify-center"
            style={{ backgroundColor: theme.accent || '#3b82f6' }}
          >
            L
          </div>
          <span className="text-[11px] font-semibold tracking-wide text-white/90">
            Actions
          </span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="text-[9px] font-mono text-white/40 bg-white/[0.04] px-1 py-0.5 rounded border border-white/5">
            Esc
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white p-0.5 rounded hover:bg-white/[0.06] transition-colors"
            >
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      {/* 7 Prioritized Actions List */}
      <div className="flex flex-col space-y-0.5">
        {ACTIONS.map((action, idx) => {
          const Icon = action.icon;
          const isSelected = selectedIndex === idx;

          return (
            <button
              key={action.id}
              onClick={() => {
                audio.playClick();
                onSelectAction(action.id);
              }}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={`flex items-center justify-between w-full px-2 py-1.5 rounded-lg text-left transition-colors duration-100 ${
                isSelected
                  ? 'bg-white/[0.08] text-white'
                  : 'text-white/70 hover:bg-white/[0.04] hover:text-white'
              }`}
              style={{
                borderLeft: isSelected
                  ? `2px solid ${theme.accent || '#3b82f6'}`
                  : '2px solid transparent',
              }}
            >
              <div className="flex items-center space-x-2 min-w-0">
                <Icon
                  size={14}
                  className={isSelected ? 'text-white' : 'text-white/60'}
                  style={{ color: isSelected ? theme.accent : undefined }}
                />
                <span className="text-xs font-medium truncate">{action.label}</span>
              </div>
              <div className="flex items-center space-x-1 shrink-0">
                <span className="text-[9px] font-mono text-white/30 px-1 py-0.5 rounded">
                  {action.shortcut}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
