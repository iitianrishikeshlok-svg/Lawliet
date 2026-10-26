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
  const accentColor = theme?.accent || '#e11d48';

  return (
    <nav className="non-draggable flex items-center justify-between w-full px-2.5 py-2 bg-[#060709] border-b-[3px] border-black select-none shadow-[0_3px_0px_#000]">
      <div className="flex items-center space-x-2 w-full justify-between overflow-x-auto no-scrollbar">
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
              className={`relative flex items-center space-x-1.5 px-3 py-1.5 rounded-none font-mono text-xs uppercase tracking-wider shrink-0 cursor-pointer transition-all duration-150 active:translate-x-[1px] active:translate-y-[1px] ${
                isActive
                  ? 'bg-[#ff1e2e] text-black font-black border-2 border-black shadow-[3px_3px_0px_#ffffff]'
                  : 'bg-black text-stone-300 font-bold border-2 border-neutral-800 hover:border-[#ff1e2e] hover:text-white shadow-[2px_2px_0px_#000]'
              }`}
            >
              <Icon
                size={13}
                className={isActive ? 'text-black stroke-[2.5]' : 'text-rose-400'}
              />
              <span className="tracking-wider">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
