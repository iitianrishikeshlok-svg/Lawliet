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
    <div className="flex flex-col w-full h-full p-3.5 overflow-hidden select-none space-y-3 font-mono">
      {/* Search & Export Header */}
      <div className="flex flex-col space-y-2 p-3 rounded-none bg-[#090a0d] border-2 border-stone-800 shadow-[3px_3px_0px_#000]">
        <div className="flex items-center space-x-2">
          {/* Search Bar */}
          <div className="relative flex-1 flex items-center">
            <Search size={13} className="absolute left-2.5 text-stone-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search past inquiries & code..."
              className="w-full brutal-input text-xs text-white pl-8 pr-3 py-1.5 rounded-none border-2 border-neutral-700 focus:border-[#ff1e2e] outline-none font-mono"
            />
          </div>

          {/* Export Dropdown / Actions */}
          <button
            onClick={() => handleExport('markdown')}
            title="Export as Markdown"
            className="brutal-btn rounded-none !text-xs !py-1.5 !px-3 border-2 border-neutral-700 bg-black text-white/80 hover:text-white shadow-[2px_2px_0px_#000] cursor-pointer flex items-center space-x-1 uppercase"
          >
            <Download size={12} />
            <span>[ EXPORT ]</span>
          </button>

          {historyItems.length > 0 && (
            <button
              onClick={handleClearAll}
              title="Clear Vault"
              className="p-1.5 rounded-none border-2 border-neutral-700 hover:border-[#ff1e2e] bg-black text-white/50 hover:text-rose-400 shadow-[2px_2px_0px_#000] transition-colors cursor-pointer"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>

        {/* Filter Badges */}
        <div className="flex items-center justify-between text-[10px] text-white/50 pt-1.5 border-t border-neutral-800">
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-0.5 rounded-none font-mono uppercase font-bold transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-[#ff1e2e] text-black border-2 border-black shadow-[2px_2px_0px_#fff]'
                  : 'bg-black text-stone-400 border border-neutral-800 hover:border-neutral-500 hover:text-white'
              }`}
            >
              [ ALL LOGS ({historyItems.length}) ]
            </button>
            <button
              onClick={() => setFilterType('images')}
              className={`px-2.5 py-0.5 rounded-none font-mono uppercase font-bold transition-all cursor-pointer ${
                filterType === 'images'
                  ? 'bg-[#ff1e2e] text-black border-2 border-black shadow-[2px_2px_0px_#fff]'
                  : 'bg-black text-stone-400 border border-neutral-800 hover:border-neutral-500 hover:text-white'
              }`}
            >
              [ WITH VISUALS ]
            </button>
          </div>
          <span className="font-mono text-stone-500 uppercase font-bold">[ VAULT STORAGE ]</span>
        </div>
      </div>

      {/* History Items Scroll List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-stone-500 space-y-2 border-2 border-dashed border-neutral-800 p-6">
            <History size={28} className="text-stone-600 mb-1" />
            <p className="text-xs font-mono uppercase font-bold">[ NO VAULT RECORDS FOUND ]</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onRestoreChat(item)}
              className="p-3.5 rounded-none bg-[#090a0d] border-2 border-neutral-800 hover:border-[#ff1e2e] shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer group space-y-2 font-mono"
            >
              {/* Card Meta Row */}
              <div className="flex items-center justify-between text-[10px] text-stone-400">
                <span className="font-mono text-stone-400 font-bold uppercase">
                  [ {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : 'JUST NOW'} ]
                </span>
                <div className="flex items-center space-x-1.5">
                  {item.latency && (
                    <span className="font-mono px-1.5 py-0.5 rounded-none bg-black text-emerald-400 border border-emerald-500 font-bold">
                      {item.latency}
                    </span>
                  )}
                  {item.thinkingLevel && (
                    <span className="font-mono px-1.5 py-0.5 rounded-none bg-black text-indigo-300 border border-indigo-500 font-bold">
                      LVL {item.thinkingLevel}
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyMarkdown(item);
                    }}
                    title="Copy Markdown"
                    className="p-1 rounded-none border border-neutral-800 hover:border-white text-stone-400 hover:text-white"
                  >
                    {copiedId === item.id ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  </button>
                  <button
                    onClick={(e) => handleDeleteItem(item.id, e)}
                    title="Delete Record"
                    className="p-1 rounded-none border border-neutral-800 hover:border-rose-500 text-stone-400 hover:text-rose-400"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>

              {/* Prompt and Thumbnail */}
              <div className="flex items-start space-x-2.5">
                {item.imageDataUrl && (
                  <img
                    src={item.imageDataUrl}
                    alt="Context"
                    className="w-12 h-12 rounded-none object-cover border-2 border-[#ff1e2e] shadow-sm shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white line-clamp-2 uppercase">
                    {item.prompt || item.query || '[ VISUAL ANALYSIS ]'}
                  </p>
                  <p className="text-[11px] text-stone-400 font-sans line-clamp-2 mt-1">
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
