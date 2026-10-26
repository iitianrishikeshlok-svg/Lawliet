import React, { useState, useEffect } from 'react';
import { History, Search, Copy, Check, Trash2, Download, Sparkles, ExternalLink } from '../../common/Icons';
import { storageService } from '../../services/storage';
import { audio } from '../../common/AudioEngine';

export default function HistoryTab({ onRestoreChat, theme }) {
  const [historyItems, setHistoryItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const items = await storageService.getHistory();
    setHistoryItems(items || []);
  };

  const handleCopyMarkdown = (item) => {
    audio.playClick();
    const md = `### Query:\n${item.prompt || item.query || ''}\n\n### Response:\n${item.response || item.text || ''}`;
    navigator.clipboard.writeText(md);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteItem = async (id, e) => {
    e.stopPropagation();
    audio.playClick();
    const updated = historyItems.filter((it) => it.id !== id);
    setHistoryItems(updated);
    // Overwrite storage
    await storageService.set('history', updated);
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all history from the Vault?')) {
      audio.playClick();
      await storageService.clearHistory();
      setHistoryItems([]);
    }
  };

  const handleExport = async (format) => {
    audio.playSuccess();
    await storageService.exportHistory(format);
  };

  const filteredItems = historyItems.filter((item) => {
    const matchesSearch =
      (item.prompt || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.response || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (filterType === 'images') {
      return matchesSearch && !!item.imageDataUrl;
    }
    return matchesSearch;
  });

  return (
    <div className="flex flex-col w-full h-full p-4 overflow-hidden select-none space-y-3.5">
      {/* Search & Export Header */}
      <div className="flex flex-col space-y-2.5 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl shadow-lg">
        <div className="flex items-center space-x-2">
          {/* Search Bar */}
          <div className="relative flex-1 flex items-center">
            <Search size={13} className="absolute left-3 text-white/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search past inquiries & code..."
              className="w-full bg-white/[0.04] text-xs text-white pl-9 pr-3 py-1.5 rounded-full border border-white/[0.08] focus:border-rose-500/40 outline-none"
            />
          </div>

          {/* Export Dropdown / Actions */}
          <button
            onClick={() => handleExport('markdown')}
            title="Export as Markdown"
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white border border-white/[0.1] transition-all cursor-pointer shadow-sm"
          >
            <Download size={12} />
            <span>Export</span>
          </button>

          {historyItems.length > 0 && (
            <button
              onClick={handleClearAll}
              title="Clear Vault"
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] text-white/40 hover:text-rose-400 border border-white/[0.08] transition-colors cursor-pointer"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>

        {/* Filter Badges */}
        <div className="flex items-center justify-between text-[11px] text-white/50 pt-2 border-t border-white/[0.06]">
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-sm'
                  : 'text-white/50 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              All Logs ({historyItems.length})
            </button>
            <button
              onClick={() => setFilterType('images')}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                filterType === 'images'
                  ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-sm'
                  : 'text-white/50 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              With Visuals
            </button>
          </div>
          <span className="text-[10px] text-white/40">Vault Storage</span>
        </div>
      </div>

      {/* History Items Scroll List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-white/40 space-y-2 border border-dashed border-white/10 rounded-2xl p-6 bg-white/[0.01]">
            <History size={26} className="text-white/20 mb-1" />
            <p className="text-xs">No records found in history vault</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onRestoreChat(item)}
              className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] hover:border-rose-500/30 transition-all cursor-pointer group space-y-2 shadow-sm"
            >
              {/* Card Meta Row */}
              <div className="flex items-center justify-between text-[11px] text-white/40">
                <span>
                  {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : 'Just now'}
                </span>
                <div className="flex items-center space-x-1.5">
                  {item.latency && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                      {item.latency}
                    </span>
                  )}
                  {item.thinkingLevel && (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px]">
                      Lvl {item.thinkingLevel}
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyMarkdown(item);
                    }}
                    title="Copy Markdown"
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.08]"
                  >
                    {copiedId === item.id ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  </button>
                  <button
                    onClick={(e) => handleDeleteItem(item.id, e)}
                    title="Delete Record"
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white/40 hover:text-rose-400 hover:bg-white/[0.08]"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>

              {/* Prompt and Thumbnail */}
              <div className="flex items-start space-x-3">
                {item.imageDataUrl && (
                  <img
                    src={item.imageDataUrl}
                    alt="Context"
                    className="w-12 h-12 rounded-xl object-cover border border-white/10 shadow-sm shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white line-clamp-2">
                    {item.prompt || item.query || 'Visual Analysis'}
                  </p>
                  <p className="text-[11px] text-white/50 line-clamp-2 mt-1">
                    {item.response || item.text || ''}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
