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
      <div className="flex-1 w-full overflow-y-auto px-3.5 py-3 space-y-3.5">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10 px-4 space-y-4">
            {/* Centerpiece Monogram Logo */}
            <div
              className="w-16 h-16 rounded-none bg-black border-2 border-[#ff1e2e] shadow-[4px_4px_0px_#ff1e2e] p-2 flex items-center justify-center transition-all duration-300"
            >
              <img
                src="/l-triangle-logo.svg"
                alt="L"
                className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(225,29,72,0.5)]"
                style={{ mixBlendMode: 'screen', background: 'transparent' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div
                className="hidden w-10 h-10 rounded-none items-center justify-center font-monogram font-black text-lg text-white"
                style={{ backgroundColor: theme.accent || '#e11d48' }}
              >
                L
              </div>
            </div>
            <div className="space-y-1.5">
              <h2 className="text-sm sm:text-base font-black text-white font-mono uppercase tracking-widest">
                [ L // COGNITIVE ASSISTANT ]
              </h2>
              <p className="text-xs text-stone-400 max-w-[340px] leading-relaxed font-mono">
                Ask a question, inspect code, analyze an image, or share your screen.
              </p>
            </div>

            {/* Quick Prompt Pills */}
            <div className="flex flex-wrap gap-2 justify-center max-w-[360px] pt-1">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputText(prompt);
                    textareaRef.current?.focus();
                  }}
                  className="brutal-btn rounded-none !text-[11px] !py-1.5 !px-3 border-2 border-[#ff1e2e] bg-black text-white font-mono font-bold uppercase tracking-wider shadow-[3px_3px_0px_#ff1e2e] hover:shadow-[4px_4px_0px_#ff1e2e] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#ff1e2e] cursor-pointer"
                >
                  [ {prompt} ]
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
                  <div className="relative rounded-none overflow-hidden border-2 border-[#ff1e2e] max-w-[180px] shadow-[3px_3px_0px_#000]">
                    <img
                      src={msg.imageDataUrl}
                      alt="Attachment context"
                      className="w-full h-auto object-cover max-h-[120px]"
                    />
                    <div className="absolute top-1 left-1 bg-black px-1.5 py-0.5 border border-rose-500 text-[8px] font-mono font-bold text-white uppercase">
                      [ VISUAL CONTEXT ]
                    </div>
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`relative px-3.5 py-2.5 rounded-none text-xs max-w-[92%] select-text leading-relaxed border-2 ${
                    isUser
                      ? 'bg-[#0f1015] text-white border-stone-700 shadow-[3px_3px_0px_#000] font-mono'
                      : 'bg-[#06070a] text-white/95 border-[#ff1e2e] shadow-[4px_4px_0px_#000,4px_4px_0px_#ff1e2e]'
                  }`}
                >
                  {/* Assistant Header Tag */}
                  {!isUser && (
                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-rose-500/20 text-[10px] text-white/50 font-mono">
                      <div className="flex items-center space-x-1.5">
                        <img
                          src="/l-triangle-logo.svg"
                          alt="L"
                          className="w-3.5 h-3.5 object-contain"
                          style={{ mixBlendMode: 'screen', background: 'transparent' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <span className="font-bold text-rose-400 uppercase tracking-wider">[ L // DETECTIVE ]</span>
                        {msg.latency && (
                          <span className="font-mono text-emerald-400 text-[9px] font-bold">
                            {msg.latency}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => copyText(msg.text, msgId)}
                        className="hover:text-white flex items-center space-x-1 transition-colors uppercase font-mono text-[9px]"
                        title="Copy Response"
                      >
                        {copiedIndex === msgId ? (
                          <span className="text-emerald-400 font-bold">[ COPIED ]</span>
                        ) : (
                          <span className="text-stone-400 hover:text-white">[ COPY ]</span>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Collapsible Step-by-Step Reasoning Drawer */}
                  {msg.thought && (
                    <div className="mb-2 rounded-none border-2 border-indigo-500/40 bg-black shadow-[2px_2px_0px_#000] overflow-hidden text-[11px]">
                      <button
                        onClick={() => toggleThought(idx)}
                        className="flex items-center justify-between w-full px-2 py-1 text-white/70 hover:text-white bg-white/[0.02] font-mono uppercase tracking-wider font-bold"
                      >
                        <div className="flex items-center space-x-1">
                          <Brain size={11} className="text-indigo-400" />
                          <span className="text-[10px]">[ REASONING DEDUCTION ]</span>
                        </div>
                        {expandedThoughts[idx] ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                      </button>
                      {expandedThoughts[idx] && (
                        <div className="p-2 border-t border-white/5 text-white/60 font-mono text-[10px] leading-relaxed whitespace-pre-wrap">
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
          <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5 text-xs text-white/70 animate-pulse">
            <div className="flex items-center space-x-2">
              <Brain size={13} className="text-indigo-400 animate-spin" />
              <span className="text-[11px]">Reasoning with Gemini...</span>
            </div>
            {onCancelGeneration && (
              <button
                onClick={onCancelGeneration}
                className="text-[10px] text-white/50 hover:text-white px-1.5 py-0.5 rounded border border-white/10 hover:bg-white/[0.05]"
              >
                Cancel
              </button>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Control Area */}
      <div className="w-full p-2.5 border-t-[3px] border-black bg-[#06070a] shadow-[0_-3px_0px_#000]">
        {/* Active Attachment Preview Chip */}
        {attachedImage && (
          <div className="flex items-center justify-between px-3 py-1.5 mb-2 rounded-none bg-black border-2 border-[#ff1e2e] shadow-[3px_3px_0px_#000] text-xs">
            <div className="flex items-center space-x-2.5 min-w-0">
              <img
                src={attachedImage}
                alt="Attachment preview"
                className="w-7 h-7 rounded-none object-cover border-2 border-[#ff1e2e] shadow-sm"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-white font-mono uppercase truncate">[ SCREENSHOT ATTACHED ]</span>
                <span className="text-[9px] text-stone-400 font-mono">Ready for visual analysis with Gemini</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClearAttachedImage}
              className="text-white/60 hover:text-rose-400 p-1 border border-neutral-700 hover:border-rose-500 rounded-none transition-colors"
              title="Remove Attachment"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Multiline Input Bar */}
        <form onSubmit={handleSubmit} className="flex items-end space-x-1.5">
          {/* File Upload / Attach Screenshot Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach Screenshot or Image File (or press Ctrl+V to paste)"
            className="p-2 rounded-none border-2 border-neutral-800 hover:border-[#ff1e2e] bg-black text-white/70 hover:text-white shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer shrink-0"
          >
            <Paperclip size={14} />
          </button>

          {/* Snip Action Button */}
          {onTriggerSnip && (
            <button
              type="button"
              onClick={onTriggerSnip}
              title="Take Screenshot Snip (Alt + S)"
              className="p-2 rounded-none border-2 border-neutral-800 hover:border-[#ff1e2e] bg-black text-white/70 hover:text-white shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer shrink-0"
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
            placeholder={attachedImage ? 'Ask about this screenshot (Enter to send)...' : 'Ask L a question, or paste a screenshot (Ctrl+V)...'}
            className="flex-1 brutal-input px-3 py-2 text-xs text-white placeholder-stone-500 resize-none max-h-[120px] focus:outline-none leading-relaxed rounded-none border-2 border-neutral-700 focus:border-[#ff1e2e] shadow-[2px_2px_0px_#000]"
          />

          {/* Send / Stop Button */}
          {isThinking ? (
            <button
              type="button"
              onClick={onCancelGeneration}
              title="Stop generating"
              className="p-2 rounded-none bg-black text-white border-2 border-[#ff1e2e] shadow-[3px_3px_0px_#ff1e2e] active:translate-x-[1px] active:translate-y-[1px] transition-all shrink-0 cursor-pointer animate-pulse"
            >
              <X size={14} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!inputText.trim() && !attachedImage}
              title="Send (Enter)"
              className="p-2 rounded-none bg-[#ff1e2e] hover:bg-[#ff3344] disabled:opacity-30 text-black border-2 border-black shadow-[3px_3px_0px_#ffffff] active:translate-x-[1px] active:translate-y-[1px] transition-all shrink-0 cursor-pointer"
            >
              <Send size={14} />
            </button>
          )}

          {/* Clear chat history */}
          {messages.length > 0 && onClearChat && (
            <button
              type="button"
              onClick={onClearChat}
              title="Clear Conversation"
              className="p-2 rounded-none border-2 border-neutral-800 hover:border-[#ff1e2e] bg-black text-white/50 hover:text-white shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer shrink-0"
            >
              <Trash2 size={13} />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
