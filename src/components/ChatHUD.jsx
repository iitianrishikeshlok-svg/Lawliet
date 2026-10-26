import React, { useState, useRef, useEffect } from 'react';
import { Send, Copy, Check, ChevronDown, ChevronRight, X, Brain, Trash2, Paperclip, Scissors, RotateCcw } from '../common/Icons';
import { audio } from '../common/AudioEngine';

const QUICK_PROMPTS = [
  'Explain an error in this code.',
  'Summarize visual context.',
  'Find bugs or security issues.',
  'Solve a problem step by step.',
];

export default function ChatHUD({
  messages = [],
  onSendMessage,
  onCancelGeneration,
  isThinking = false,
  thinkingLevel = 2,
  attachedImage = null,
  onAttachImage,
  onClearAttachedImage,
  onTriggerSnip,
  onClearChat,
  theme,
}) {
  const [inputText, setInputText] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [expandedThoughts, setExpandedThoughts] = useState({});
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll to latest response
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    const text = inputText.trim();
    if (!text && !attachedImage) return;

    audio.playClick();
    onSendMessage(text, attachedImage);
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Direct file attachment handler
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image or screenshot file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const dataUrl = loadEvt.target?.result;
      if (dataUrl) {
        audio.playSuccess();
        if (typeof onAttachImage === 'function') {
          onAttachImage(dataUrl);
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Clipboard Paste Handler (Ctrl+V for screenshots)
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const blob = item.getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (loadEvt) => {
            const dataUrl = loadEvt.target?.result;
            if (dataUrl) {
              audio.playSuccess();
              if (typeof onAttachImage === 'function') {
                onAttachImage(dataUrl);
              }
            }
          };
          reader.readAsDataURL(blob);
          return;
        }
      }
    }
  };

  // Drag and Drop handlers for screenshots
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (loadEvt) => {
          const dataUrl = loadEvt.target?.result;
          if (dataUrl) {
            audio.playSuccess();
            if (typeof onAttachImage === 'function') {
              onAttachImage(dataUrl);
            }
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const toggleThought = (idx) => {
    audio.playClick();
    setExpandedThoughts((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const copyText = (content, id) => {
    audio.playClick();
    navigator.clipboard.writeText(content);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Render markdown-like blocks
  const renderMessageContent = (text, msgIdx) => {
    if (!text) return null;
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, pIdx) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        const lang = lines[0].trim();
        const code = lines.slice(1).join('\n') || lines[0];
        const blockId = `${msgIdx}-${pIdx}`;

        return (
          <div
            key={pIdx}
            className="my-2 rounded-md overflow-hidden border border-white/10 bg-[#0d0e12] font-mono text-[11px]"
          >
            <div className="flex items-center justify-between px-2.5 py-1 bg-white/[0.03] border-b border-white/[0.05] text-white/50">
              <span className="uppercase text-[9px] tracking-wider text-white/60">
                {lang || 'code'}
              </span>
              <button
                onClick={() => copyText(code, blockId)}
                className="flex items-center space-x-1 hover:text-white transition-colors text-[10px]"
              >
                {copiedIndex === blockId ? (
                  <Check size={11} className="text-emerald-400" />
                ) : (
                  <Copy size={11} />
                )}
                <span>{copiedIndex === blockId ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-2.5 overflow-x-auto text-white/90 leading-relaxed font-mono">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      return (
        <div key={pIdx} className="whitespace-pre-wrap leading-relaxed text-xs">
          {part}
        </div>
      );
    });
  };

  return (
    <div
      className="flex flex-col w-full h-full flex-1 min-h-0 overflow-hidden select-none bg-transparent relative"
      onPaste={handlePaste}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden file input for attachments */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Drag & Drop Visual Backdrop */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-blue-600/20 backdrop-blur-sm border-2 border-dashed border-blue-400 flex flex-col items-center justify-center pointer-events-none rounded-xl m-2">
          <Paperclip size={32} className="text-blue-300 animate-bounce mb-2" />
          <p className="text-xs font-semibold text-white">Drop screenshot or image here</p>
          <p className="text-[10px] text-white/60">L will attach it for instant visual analysis</p>
        </div>
      )}

      {/* Conversation Stream */}
      <div className="flex-1 w-full overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4 space-y-4">
            {/* Centerpiece Monogram Logo with Ambient Glow */}
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-rose-500/20 via-purple-600/10 to-transparent border border-rose-500/30 shadow-[0_0_35px_rgba(244,63,94,0.3)] p-3 flex items-center justify-center transition-transform hover:scale-105">
              <img
                src="/l-triangle-logo.svg"
                alt="L"
                className="w-full h-full object-contain"
                style={{ mixBlendMode: 'screen', background: 'transparent' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div
                className="hidden w-10 h-10 rounded-full items-center justify-center font-black text-lg text-white"
                style={{ backgroundColor: theme.accent || '#e11d48' }}
              >
                L
              </div>
            </div>
            <div className="space-y-1">
              <h2 className="text-sm sm:text-base font-semibold text-white tracking-wide">
                How can I assist your investigation?
              </h2>
              <p className="text-xs text-white/50 max-w-[340px] leading-relaxed">
                Ask reasoning queries, analyze screenshots, debug code, or browse the web.
              </p>
            </div>

            {/* Quick Prompt Pills */}
            <div className="flex flex-wrap gap-2 justify-center max-w-[380px] pt-2">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputText(prompt);
                    textareaRef.current?.focus();
                  }}
                  className="relative overflow-hidden px-3.5 py-1.5 rounded-full text-[11px] font-medium bg-white/[0.03] hover:bg-white/[0.08] text-white/75 hover:text-white border border-white/[0.08] hover:border-white/25 shadow-sm transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 hover:shadow-[0_0_15px_rgba(244,63,94,0.25)]"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            const msgId = `msg-${idx}`;

            return (
              <div
                key={idx}
                className={`flex flex-col space-y-1.5 ${isUser ? 'items-end' : 'items-start'}`}
              >
                {/* User Attachment Thumbnail */}
                {msg.imageDataUrl && (
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 max-w-[200px] shadow-lg">
                    <img
                      src={msg.imageDataUrl}
                      alt="Attachment context"
                      className="w-full h-auto object-cover max-h-[140px]"
                    />
                    <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-medium text-white/80">
                      Visual Context
                    </div>
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`relative px-4 py-3 rounded-2xl text-xs max-w-[90%] select-text leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white rounded-br-sm shadow-[0_4px_16px_rgba(225,29,72,0.35)] font-sans'
                      : 'bg-white/[0.04] text-white/95 rounded-bl-sm border border-white/[0.08] backdrop-blur-xl shadow-lg'
                  }`}
                >
                  {/* Assistant Header Tag */}
                  {!isUser && (
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.06] text-[10px] text-white/50">
                      <div className="flex items-center space-x-1.5">
                        <img
                          src="/l-triangle-logo.svg"
                          alt="L"
                          className="w-3.5 h-3.5 object-contain"
                          style={{ mixBlendMode: 'screen', background: 'transparent' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <span className="font-semibold text-rose-400">L Detective</span>
                        {msg.latency && (
                          <span className="font-mono text-emerald-400 text-[9px]">
                            • {msg.latency}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => copyText(msg.text, msgId)}
                        className="hover:text-white flex items-center space-x-1 transition-colors text-[10px] text-white/40 hover:text-white"
                        title="Copy Response"
                      >
                        {copiedIndex === msgId ? (
                          <span className="text-emerald-400 font-medium">Copied</span>
                        ) : (
                          <span>Copy</span>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Collapsible Step-by-Step Reasoning Drawer */}
                  {msg.thought && (
                    <div className="mb-2.5 rounded-xl border border-indigo-500/25 bg-indigo-950/20 backdrop-blur-md overflow-hidden text-[11px]">
                      <button
                        onClick={() => toggleThought(idx)}
                        className="flex items-center justify-between w-full px-3 py-1.5 text-white/70 hover:text-white bg-white/[0.02] text-[11px] font-medium"
                      >
                        <div className="flex items-center space-x-1.5">
                          <Brain size={12} className="text-indigo-400" />
                          <span>Reasoning Deduction</span>
                        </div>
                        {expandedThoughts[idx] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      </button>
                      {expandedThoughts[idx] && (
                        <div className="p-3 border-t border-white/[0.06] text-white/60 font-mono text-[10px] leading-relaxed whitespace-pre-wrap">
                          {msg.thought}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Body Content */}
                  <div>{renderMessageContent(msg.text, idx)}</div>
                </div>
              </div>
            );
          })
        )}

        {/* Real-time Thinking Indicator */}
        {isThinking && (
          <div className="flex items-center justify-between px-3.5 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md text-xs text-white/80 animate-pulse max-w-fit">
            <div className="flex items-center space-x-2">
              <Brain size={13} className="text-indigo-400 animate-spin" />
              <span className="text-[11px]">Synthesizing deductive reasoning...</span>
            </div>
            {onCancelGeneration && (
              <button
                onClick={onCancelGeneration}
                className="text-[10px] text-white/50 hover:text-white ml-3 px-2 py-0.5 rounded-full border border-white/10 hover:bg-white/[0.08]"
              >
                Stop
              </button>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Modern Floating Minimalist Input Bar Area */}
      <div className="w-full px-4 pb-3 pt-1 bg-transparent">
        {/* Active Attachment Preview Chip */}
        {attachedImage && (
          <div className="flex items-center justify-between px-3 py-1.5 mb-2 rounded-2xl bg-white/[0.04] border border-rose-500/30 backdrop-blur-md shadow-md text-xs">
            <div className="flex items-center space-x-2.5 min-w-0">
              <img
                src={attachedImage}
                alt="Attachment preview"
                className="w-8 h-8 rounded-xl object-cover border border-rose-500/40 shadow-sm"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-medium text-white truncate">Screenshot Attached</span>
                <span className="text-[9px] text-white/40">Ready for visual analysis with Gemini</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClearAttachedImage}
              className="w-6 h-6 rounded-full flex items-center justify-center text-white/50 hover:text-rose-400 hover:bg-white/[0.08] transition-colors"
              title="Remove Attachment"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Modern Capsule Input Bar */}
        <form onSubmit={handleSubmit} className="flex items-center space-x-1.5 p-1.5 pl-3 rounded-full bg-white/[0.04] backdrop-blur-2xl border border-white/[0.09] shadow-[0_8px_32px_rgba(0,0,0,0.5)] focus-within:border-rose-500/40 focus-within:shadow-[0_0_25px_rgba(244,63,94,0.2)] transition-all">
          {/* File Upload / Attach Screenshot Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach Screenshot or Image File (or press Ctrl+V to paste)"
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer shrink-0"
          >
            <Paperclip size={14} />
          </button>

          {/* Snip Action Button */}
          {onTriggerSnip && (
            <button
              type="button"
              onClick={onTriggerSnip}
              title="Take Screenshot Snip (Alt + S)"
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer shrink-0"
            >
              <Scissors size={14} />
            </button>
          )}

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={attachedImage ? 'Ask about this screenshot (Enter to send)...' : 'Ask L anything, or paste an image (Ctrl+V)...'}
            className="flex-1 bg-transparent px-2 py-1 text-xs text-white placeholder-white/35 resize-none max-h-[120px] focus:outline-none leading-relaxed border-none"
          />

          {/* Send / Stop Button */}
          {isThinking ? (
            <button
              type="button"
              onClick={onCancelGeneration}
              title="Stop generating"
              className="w-8 h-8 rounded-full bg-rose-600/80 text-white flex items-center justify-center hover:bg-rose-600 transition-all shrink-0 cursor-pointer animate-pulse"
            >
              <X size={14} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!inputText.trim() && !attachedImage}
              title="Send query"
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 ${
                inputText.trim() || attachedImage
                  ? 'color-cycle-pill text-white shadow-[0_2px_15px_rgba(244,63,94,0.45)] hover:scale-110 active:scale-95 cursor-pointer border border-white/20'
                  : 'bg-white/[0.06] text-white/20 cursor-not-allowed'
              }`}
            >
              <Send size={13} />
            </button>
          )}

          {/* Clear chat history */}
          {messages.length > 0 && onClearChat && (
            <button
              type="button"
              onClick={onClearChat}
              title="Clear Conversation"
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-rose-400 hover:bg-white/[0.08] transition-all cursor-pointer shrink-0"
            >
              <Trash2 size={13} />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
