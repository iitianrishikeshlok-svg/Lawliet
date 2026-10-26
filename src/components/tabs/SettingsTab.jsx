import React, { useState } from 'react';
import { THEMES, ACCENT_COLORS } from '../../themes/themeConfig';
import { testGeminiConnection } from '../../services/gemini';
import { Settings, Eye, EyeOff, Volume2, VolumeX, Check, RefreshCw, Sparkles, Sliders } from '../../common/Icons';
import { audio } from '../../common/AudioEngine';

export default function SettingsTab({
  currentThemeId = 'graphite',
  onThemeSelect,
  currentAccentId = 'cobalt',
  onAccentSelect,
  iconState = 'visible',
  onIconStateChange,
  iconSize = 52,
  onIconSizeChange,
  iconOpacity = 0.95,
  onIconOpacityChange,
  iconShadow = 'subtle',
  onIconShadowChange,
  iconBackground = 'graphite',
  onIconBackgroundChange,
  dockingEnabled = true,
  onToggleDocking,
  apiKey = '',
  onSaveApiKey,
  selectedModel = 'gemini-2.5-flash',
  onSelectModel,
  audioEnabled = true,
  onToggleAudio,
  theme,
}) {
  const [keyInput, setKeyInput] = useState(apiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveKey = () => {
    audio.playClick();
    onSaveApiKey?.(keyInput.trim());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleTestKey = async () => {
    audio.playClick();
    setTestingKey(true);
    setTestResult(null);
    const result = await testGeminiConnection(keyInput || apiKey, selectedModel);
    setTestingKey(false);
    setTestResult(result);
    if (result.success) {
      audio.playSuccess();
    }
  };

  return (
    <div className="flex flex-col w-full h-full p-4 overflow-y-auto space-y-4 select-none text-xs text-[#f1f2f4] font-sans">
      {/* 1. FLOATING ICON CONFIGURATION */}
      <div className="flex flex-col space-y-3.5 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl shadow-lg">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
          <span className="font-semibold text-rose-400 uppercase tracking-wider text-[11px]">
            Floating Icon Preferences
          </span>
          <span className="text-[10px] text-white/40 uppercase font-medium">Native Window</span>
        </div>

        {/* State Toggle: Visible vs Disabled */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-medium">Desktop Icon Mode</div>
            <div className="text-[10px] text-white/50">Show persistent icon on desktop</div>
          </div>
          <button
            onClick={() => {
              audio.playClick();
              const next = iconState === 'disabled' ? 'visible' : 'disabled';
              onIconStateChange?.(next);
            }}
            className={`px-3.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
              iconState !== 'disabled'
                ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md shadow-rose-950/40 border border-rose-400/20'
                : 'bg-white/[0.04] text-white/50 border border-white/[0.08] hover:text-white'
            }`}
          >
            {iconState !== 'disabled' ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {/* Size Selection */}
        <div className="flex items-center justify-between">
          <span className="text-white/80 font-medium">Icon Size</span>
          <div className="flex items-center space-x-1.5">
            {[
              { label: '44px', val: 44 },
              { label: '52px', val: 52 },
              { label: '60px', val: 60 },
            ].map((s) => (
              <button
                key={s.val}
                onClick={() => {
                  audio.playClick();
                  onIconSizeChange?.(s.val);
                }}
                className={`px-3 py-1 rounded-full text-[10px] font-medium border transition-all cursor-pointer ${
                  iconSize === s.val
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-white/[0.02] text-white/50 border-white/[0.08] hover:border-white/20'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Background Style */}
        <div className="flex items-center justify-between">
          <span className="text-stone-300 font-bold uppercase">[ BACKGROUND STYLE ]</span>
          <div className="flex items-center space-x-1.5">
            {[
              { id: 'graphite', label: 'Graphite' },
              { id: 'glass', label: 'Glass' },
              { id: 'outline', label: 'Outline' },
            ].map((bg) => (
              <button
                key={bg.id}
                onClick={() => {
                  audio.playClick();
                  onIconBackgroundChange?.(bg.id);
                }}
                className={`px-2 py-0.5 rounded text-[11px] border transition-colors ${
                  iconBackground === bg.id
                    ? 'bg-white/[0.12] text-white border-white/30'
                    : 'bg-white/[0.02] text-white/50 border-white/5 hover:border-white/10'
                }`}
              >
                {bg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Shadow Intensity */}
        <div className="flex items-center justify-between">
          <span className="text-white/80">Shadow Intensity</span>
          <div className="flex items-center space-x-1">
            {['none', 'subtle', 'medium', 'deep'].map((sh) => (
              <button
                key={sh}
                onClick={() => {
                  audio.playClick();
                  onIconShadowChange?.(sh);
                }}
                className={`px-2 py-0.5 rounded text-[11px] capitalize border transition-colors ${
                  iconShadow === sh
                    ? 'bg-white/[0.12] text-white border-white/30'
                    : 'bg-white/[0.02] text-white/50 border-white/5 hover:border-white/10'
                }`}
              >
                {sh}
              </button>
            ))}
          </div>
        </div>

        {/* Opacity Slider */}
        <div className="flex flex-col space-y-1">
          <div className="flex justify-between text-white/80">
            <span>Icon Opacity</span>
            <span className="font-mono text-[10px] text-white/50">{Math.round(iconOpacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.3"
            max="1.0"
            step="0.05"
            value={iconOpacity}
            onChange={(e) => onIconOpacityChange?.(parseFloat(e.target.value))}
            className="w-full accent-blue-500 cursor-pointer h-1 bg-white/10 rounded"
          />
        </div>

        {/* Screen Edge Docking Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-medium">Screen-Edge Docking</div>
            <div className="text-[10px] text-white/50">Snap to screen margins automatically</div>
          </div>
          <button
            onClick={() => {
              audio.playClick();
              onToggleDocking?.(!dockingEnabled);
            }}
            className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
              dockingEnabled
                ? 'bg-blue-600/30 text-blue-300 border-blue-500/40'
                : 'bg-white/[0.04] text-white/40 border-white/10'
            }`}
          >
            {dockingEnabled ? 'Active' : 'Off'}
          </button>
        </div>
      </div>

      {/* 2. THEMES & COLOR SYSTEM */}
      <div className="flex flex-col space-y-3 p-3 rounded-lg utility-card border border-white/[0.08]">
        <span className="font-semibold text-white uppercase tracking-wider text-[11px]">
          Visual Themes & Mode
        </span>

        {/* Theme Cards (Supports Dark and Light Mode) */}
        <div className="grid grid-cols-2 gap-2">
          {Object.values(THEMES).map((th) => {
            const isSelected = currentThemeId === th.id;
            return (
              <button
                key={th.id}
                onClick={() => {
                  audio.playClick();
                  onThemeSelect?.(th.id);
                }}
                className={`flex flex-col text-left p-2 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-white/40 bg-white/[0.08] shadow-sm'
                    : 'border-white/[0.06] bg-black/20 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[11px] font-medium text-white">{th.name}</span>
                  <span className="text-[9px] font-mono px-1 rounded bg-white/10 text-white/60">
                    {th.mode}
                  </span>
                </div>
                <span className="text-[10px] text-white/40 mt-1 line-clamp-1">
                  {th.tagline}
                </span>
              </button>
            );
          })}
        </div>

        {/* Configurable Accent Colors */}
        <div className="flex flex-col space-y-1.5 pt-1 border-t border-white/[0.06]">
          <span className="text-white/80">Accent Color</span>
          <div className="flex items-center space-x-2">
            {Object.values(ACCENT_COLORS).map((acc) => {
              const isSelected = currentAccentId === acc.id;
              return (
                <button
                  key={acc.id}
                  onClick={() => {
                    audio.playClick();
                    onAccentSelect?.(acc.id);
                  }}
                  title={acc.name}
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform ${
                    isSelected ? 'scale-110 ring-2 ring-white/60' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: acc.color }}
                >
                  {isSelected && <Check size={12} className="text-white" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. GEMINI API CONFIGURATION */}
      <div className="flex flex-col space-y-3.5 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl shadow-lg">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
          <span className="font-semibold text-rose-400 uppercase tracking-wider text-[11px]">
            Google Gemini API
          </span>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-rose-400 hover:text-rose-300 font-medium transition-colors"
          >
            Get Free API Key ↗
          </a>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <input
              type={showKey ? 'text' : 'password'}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Paste Gemini API Key..."
              className="w-full bg-white/[0.04] px-4 py-1.5 text-xs text-white placeholder-white/35 rounded-full border border-white/[0.08] focus:border-rose-500/40 outline-none"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-2 text-white/40 hover:text-white"
            >
              {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
          <button
            onClick={handleSaveKey}
            className="rounded-full text-xs py-1.5 px-4 font-semibold text-white bg-gradient-to-r from-rose-500 to-rose-600 shadow-[0_2px_15px_rgba(244,63,94,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
          >
            {savedSuccess ? 'Saved!' : 'Save'}
          </button>
          <button
            onClick={handleTestKey}
            disabled={testingKey}
            className="rounded-full text-xs py-1.5 px-3.5 bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white border border-white/10 transition-all cursor-pointer shrink-0"
            title="Test Connection"
          >
            {testingKey ? <RefreshCw size={12} className="animate-spin" /> : 'Ping'}
          </button>
        </div>

        {testResult && (
          <div
            className={`text-[10px] px-3 py-1.5 rounded-xl border font-medium ${
              testResult.success
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
            }`}
          >
            {testResult.message}
          </div>
        )}

        {/* Model Selection */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-white/60 font-medium text-xs">AI Reasoning Model</span>
          <select
            value={selectedModel}
            onChange={(e) => onSelectModel?.(e.target.value)}
            className="bg-black/60 text-xs text-white border border-white/10 rounded-full px-3 py-1 outline-none"
          >
            <option value="gemini-3.5-flash">gemini-3.5-flash (Fast & Live)</option>
            <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite (Ultra Fast)</option>
            <option value="gemini-2.5-flash">gemini-2.5-flash (Balanced)</option>
            <option value="gemini-2.5-pro">gemini-2.5-pro (Deep Reasoning)</option>
            <option value="gemini-1.5-flash">gemini-1.5-flash (Standard)</option>
          </select>
        </div>
      </div>

      {/* 4. KEYBOARD SHORTCUTS & AUDIO */}
      <div className="flex flex-col space-y-2.5 p-3 rounded-lg utility-card border border-white/[0.08]">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-white uppercase tracking-wider text-[11px]">
            Audio & Shortcuts
          </span>
          <button
            onClick={() => {
              const next = !audioEnabled;
              onToggleAudio?.(next);
              audio.setEnabled(next);
            }}
            className="text-white/60 hover:text-white flex items-center space-x-1"
          >
            {audioEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            <span className="text-[10px]">{audioEnabled ? 'Sound On' : 'Muted'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-white/[0.06]">
          <div className="flex justify-between py-0.5">
            <span className="text-white/50">Restore / Toggle Icon</span>
            <kbd className="font-mono text-white/80 bg-white/10 px-1 rounded">Alt + L</kbd>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="text-white/50">Take Screenshot</span>
            <kbd className="font-mono text-white/80 bg-white/10 px-1 rounded">Alt + S</kbd>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="text-white/50">Close Open Panel</span>
            <kbd className="font-mono text-white/80 bg-white/10 px-1 rounded">Esc</kbd>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="text-white/50">Send Prompt</span>
            <kbd className="font-mono text-white/80 bg-white/10 px-1 rounded">Enter</kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
