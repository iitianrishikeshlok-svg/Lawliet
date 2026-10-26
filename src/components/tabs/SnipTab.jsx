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
      {!isSecure && !isElectron && (
        <div className="flex items-center space-x-2 p-3 rounded-none bg-black border-2 border-amber-400 text-amber-300 text-xs shadow-[3px_3px_0px_#ffe600] font-mono">
          <span className="text-base shrink-0">⚠️</span>
          <div className="flex-1 text-[11px] leading-relaxed">
            <strong className="text-amber-300 font-bold">[ NETWORK IP (HTTP) ]:</strong> Chrome locks screen sharing on raw IP origins. For instant desktop screen capture, open at <a href="http://localhost:5173/" className="underline font-mono font-black text-white">localhost:5173</a>, or use <strong>[ UPLOAD ] / [ PASTE SCREENSHOT ]</strong> below!
          </div>
        </div>
      )}

      {/* Primary Action Hero */}
      <div className="flex flex-col items-center justify-center p-6 rounded-none bg-[#090a0d] border-[3px] border-[#ff1e2e] text-center relative overflow-hidden group shadow-[6px_6px_0px_#000,6px_6px_0px_#ff1e2e]">
        <div className="w-14 h-14 rounded-none flex items-center justify-center mb-3 shadow-[3px_3px_0px_#ff1e2e] border-2 border-[#ff1e2e] bg-black">
          <Scissors size={26} className="text-rose-400 drop-shadow-[0_0_8px_#ff1e2e]" />
        </div>

        <h3 className="text-sm sm:text-base font-black text-white tracking-widest mb-1 font-mono uppercase">
          [ INSTANT SCREEN SNIP & OCR ]
        </h3>
        <p className="text-xs text-stone-400 max-w-sm mb-4 leading-relaxed font-mono">
          Freeze your screen, upload any image, or paste from clipboard to draw callouts and ask L questions.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <button
            onClick={handleLaunchSnip}
            className="brutal-btn-solid flex items-center space-x-2 px-5 py-2.5 rounded-none text-xs font-black text-black border-2 border-black shadow-[3px_3px_0px_#ffffff] transition-all cursor-pointer font-mono uppercase tracking-wider"
          >
            <Crosshair size={14} className="text-black stroke-[2.5]" />
            <span>[ FREEZE & SNIP (ALT+S) ]</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="brutal-btn flex items-center space-x-1.5 px-4 py-2.5 rounded-none text-xs font-bold text-white border-2 border-[#ff1e2e] bg-black shadow-[3px_3px_0px_#ff1e2e] transition-all cursor-pointer font-mono uppercase tracking-wider"
            title="Upload image or screenshot file"
          >
            <Paperclip size={13} className="text-rose-400" />
            <span>[ UPLOAD IMAGE ]</span>
          </button>

          <button
            onClick={handlePasteClipboard}
            className="brutal-btn flex items-center space-x-1.5 px-4 py-2.5 rounded-none text-xs font-bold text-white border-2 border-[#ff1e2e] bg-black shadow-[3px_3px_0px_#ff1e2e] transition-all cursor-pointer font-mono uppercase tracking-wider"
            title="Paste image from clipboard"
          >
            <span>[ 📋 PASTE SCREENSHOT ]</span>
          </button>
        </div>
      </div>

      {/* Embedded Annotation Preview / Editor */}
      {lastSnipUrl ? (
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between text-xs text-white/70 px-1 font-mono">
            <span className="font-bold uppercase tracking-wider text-white">
              [ ACTIVE SNIP BUFFER ]
            </span>
            <button
              onClick={() => onSendToChat(lastSnipUrl, 'Explain what is shown in this snip.')}
              className="brutal-btn !py-1 !px-2.5 text-[10px] text-cyan-300 border-2 border-cyan-400 bg-black shadow-[2px_2px_0px_#06b6d4] font-bold uppercase cursor-pointer"
            >
              <Sparkles size={11} />
              <span>[ ASK AI ABOUT SNIP ]</span>
            </button>
          </div>

          <div className="rounded-none border-2 border-[#ff1e2e] overflow-hidden bg-black shadow-[4px_4px_0px_#000]">
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
        <div className="flex flex-col items-center justify-center p-8 rounded-none border-2 border-dashed border-stone-700 bg-black/40 text-center shadow-[3px_3px_0px_#000]">
          <Scissors size={28} className="text-stone-600 mb-2" />
          <p className="text-xs text-stone-400 font-mono uppercase font-bold tracking-wider">
            [ NO ACTIVE SNIP IN BUFFER // PRESS ALT + S OR CLICK ABOVE ]
          </p>
        </div>
      )}

      {/* Snipping Pro Tips */}
      <div className="p-3.5 rounded-none bg-black border-2 border-stone-800 text-xs text-stone-300 space-y-1.5 font-mono shadow-[3px_3px_0px_#000]">
        <div className="font-black text-rose-400 uppercase tracking-widest">[ PRO TIPS: ]</div>
        <p>• Use the <strong>Arrow tool</strong> to point directly at code errors or bugs before sending to L.</p>
        <p>• Use the <strong>Highlighter tool</strong> to mark specific lines or math symbols.</p>
        <p>• Your selection bypasses DRM and video overlays automatically.</p>
      </div>
    </div>
  );
}
