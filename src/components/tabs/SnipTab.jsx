import React, { useState, useRef } from 'react';
import { Scissors, Sparkles, Check, Trash2, ArrowUpRight, Crosshair, Paperclip } from '../../common/Icons';
import AnnotationCanvas from '../canvas/AnnotationCanvas';
import { audio } from '../../common/AudioEngine';

export default function SnipTab({
  lastSnipUrl,
  onTriggerScreenSnip,
  onSendToChat,
  onAttachImage,
  theme,
}) {
  const [activeImage, setActiveImage] = useState(lastSnipUrl);
  const fileInputRef = useRef(null);

  const isSecure = typeof window !== 'undefined' ? window.isSecureContext : true;
  const isElectron = typeof window !== 'undefined' ? !!window.electronAPI : false;

  const handleLaunchSnip = async () => {
    audio.playShutter();
    try {
      if (!isSecure && !isElectron) {
        alert(
          'Screen sharing is restricted by Chrome on raw HTTP network IPs (http://172.21.16.52:5173).\n\n1) To snip your screen: Open on desktop at http://localhost:5173/\n2) Or click "Upload Screenshot" / "Paste Screenshot" to analyze any image!'
        );
      }
      await onTriggerScreenSnip();
    } catch (err) {
      alert('Screen sharing access denied or restricted by browser. Please use Upload or Paste Screenshot.');
    }
  };

  const handleFinishAnnotation = (annotatedDataUrl) => {
    setActiveImage(annotatedDataUrl);
    if (typeof onAttachImage === 'function') {
      onAttachImage(annotatedDataUrl);
    }
    onSendToChat(annotatedDataUrl, 'Analyze this annotated screen region in detail.');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const dataUrl = loadEvt.target?.result;
      if (dataUrl) {
        audio.playSuccess();
        setActiveImage(dataUrl);
        if (typeof onAttachImage === 'function') {
          onAttachImage(dataUrl);
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handlePasteClipboard = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            const reader = new FileReader();
            reader.onload = (loadEvt) => {
              const dataUrl = loadEvt.target?.result;
              if (dataUrl) {
                audio.playSuccess();
                setActiveImage(dataUrl);
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
      alert('No image found in clipboard. Press Win+Shift+S or PrtScn first.');
    } catch {
      alert('Clipboard access not granted. Use Ctrl+V or the Upload button.');
    }
  };

  return (
    <div className="flex flex-col w-full h-full p-4 overflow-y-auto space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Insecure Origin Guidance Pill */}
      {/* Insecure Origin Guidance Pill */}
      {!isSecure && !isElectron && (
        <div className="flex items-center space-x-2.5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs shadow-sm">
          <span className="text-base shrink-0">⚠️</span>
          <div className="flex-1 text-[11px] leading-relaxed">
            <strong className="text-amber-200">Network IP (HTTP):</strong> Chrome locks screen sharing on raw IP origins. For instant desktop screen capture, open at <a href="http://localhost:5173/" className="underline font-medium text-white">localhost:5173</a>, or use <strong>Upload Image</strong> / <strong>Paste Screenshot</strong> below!
          </div>
        </div>
      )}

      {/* Primary Action Hero */}
      <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl text-center relative overflow-hidden group shadow-xl">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3 bg-gradient-to-br from-rose-500/20 to-purple-600/10 border border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.25)]">
          <Scissors size={24} className="text-rose-400" />
        </div>

        <h3 className="text-sm sm:text-base font-semibold text-white tracking-wide mb-1">
          Instant Screen Snip & Vision OCR
        </h3>
        <p className="text-xs text-white/50 max-w-sm mb-5 leading-relaxed">
          Freeze your display, upload any screenshot, or paste from clipboard to draw callouts and query L.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <button
            onClick={handleLaunchSnip}
            className="relative overflow-hidden flex items-center space-x-2 px-5 py-2.5 rounded-full text-xs font-semibold text-white color-cycle-pill shadow-[0_4px_22px_rgba(244,63,94,0.45)] hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/20"
          >
            <Crosshair size={14} className="text-white" />
            <span>Freeze & Snip (Alt+S)</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-full text-xs font-medium text-white/80 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] transition-all cursor-pointer shadow-sm"
            title="Upload image or screenshot file"
          >
            <Paperclip size={13} className="text-rose-400" />
            <span>Upload Image</span>
          </button>

          <button
            onClick={handlePasteClipboard}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-full text-xs font-medium text-white/80 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] transition-all cursor-pointer shadow-sm"
            title="Paste image from clipboard"
          >
            <span>📋 Paste Screenshot</span>
          </button>
        </div>
      </div>

      {/* Embedded Annotation Preview / Editor */}
      {lastSnipUrl ? (
        <div className="flex flex-col space-y-2.5">
          <div className="flex items-center justify-between text-xs text-white/70 px-1">
            <span className="font-semibold text-white">
              Active Snip Buffer
            </span>
            <button
              onClick={() => onSendToChat(lastSnipUrl, 'Explain what is shown in this snip.')}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-600 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles size={11} />
              <span>Ask AI About Snip</span>
            </button>
          </div>

          <div className="rounded-2xl border border-white/[0.1] overflow-hidden bg-black/50 shadow-xl">
            <AnnotationCanvas
              imageSrc={lastSnipUrl}
              theme={theme}
              isEmbedded={true}
              onFinishAnnotation={handleFinishAnnotation}
              onCancel={() => {}}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] text-center">
          <Scissors size={26} className="text-white/30 mb-2" />
          <p className="text-xs text-white/40">
            No active snip in buffer • Press Alt + S or click button above
          </p>
        </div>
      )}

      {/* Snipping Pro Tips */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-xs text-white/60 space-y-1.5">
        <div className="font-semibold text-rose-400">Pro Tips</div>
        <p>• Use the <strong>Arrow tool</strong> to point directly at code errors or bugs before sending to L.</p>
        <p>• Use the <strong>Highlighter tool</strong> to mark specific lines or math symbols.</p>
        <p>• Your selection bypasses DRM and video overlays automatically.</p>
      </div>
    </div>
  );
}
