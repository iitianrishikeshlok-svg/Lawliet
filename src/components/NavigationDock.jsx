import React from 'react';
import { Sparkles, Scissors, Monitor, Camera, Globe, History, Settings } from '../common/Icons';
import { audio } from '../common/AudioEngine';

const TABS = [
  { id: 'chat', label: 'Ask L', icon: Sparkles },
  { id: 'snip', label: 'Snip', icon: Scissors },
  { id: 'watch', label: 'Watch', icon: Monitor },
  { id: 'camera', label: 'Camera', icon: Camera },
  { id: 'browser', label: 'Browser', icon: Globe },
  { id: 'history', label: 'History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function NavigationDock({ activeTab, onSelectTab, theme }) {
  return (
    <nav className="non-draggable flex items-center justify-center w-full px-4 py-2.5 bg-transparent select-none z-10">
      <div className="flex items-center space-x-1 p-1 rounded-full bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-x-auto no-scrollbar max-w-full">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                audio.playClick();
                onSelectTab(tab.id);
              }}
              className={`relative overflow-hidden flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-medium shrink-0 cursor-pointer transition-all duration-300 hover:scale-[1.04] active:scale-95 ${
                isActive
                  ? 'color-cycle-pill text-white shadow-[0_4px_22px_rgba(244,63,94,0.45)] font-semibold border border-white/20'
                  : 'text-white/65 hover:text-white hover:bg-white/[0.07]'
              }`}
            >
              <Icon
                size={13}
                className={isActive ? 'text-white' : 'text-stone-400 group-hover:text-white'}
              />
              <span className="tracking-wide">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
