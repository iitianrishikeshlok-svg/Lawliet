import React, { useRef, useState, useEffect } from 'react';
import { Crosshair, Check, X, Scissors, RefreshCw } from '../../common/Icons';
import AnnotationCanvas from './AnnotationCanvas';
import { audio } from '../../common/AudioEngine';

export default function SnippingOverlay({ bufferUrl, theme, onFinishSnip, onCancel }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  const [isSelecting, setIsSelecting] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [currentPoint, setCurrentPoint] = useState({ x: 0, y: 0 });
  const [selectedCrop, setSelectedCrop] = useState(null); // { x, y, width, height, dataUrl }
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [loupeColor, setLoupeColor] = useState('#000000');
  const [stage, setStage] = useState('select'); // 'select' | 'annotate'

  const imgRef = useRef(null);

  // Load screen buffer image
  useEffect(() => {
    if (!bufferUrl) return;
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
    };
    img.src = bufferUrl;
  }, [bufferUrl]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (stage === 'annotate') {
          setStage('select');
          setSelectedCrop(null);
        } else {
          onCancel();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stage, onCancel]);

  const handleMouseDown = (e) => {
    if (stage !== 'select') return;
    setIsSelecting(true);
    setStartPoint({ x: e.clientX, y: e.clientY });
    setCurrentPoint({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });

    // Pick pixel color for the magnifying loupe
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      try {
        const pixel = ctx.getImageData(e.clientX, e.clientY, 1, 1).data;
        setLoupeColor(
          `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1)}`
        );
      } catch (err) {}
    }

    if (!isSelecting) return;
    setCurrentPoint({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    if (!isSelecting) return;
    setIsSelecting(false);

    const x = Math.min(startPoint.x, currentPoint.x);
    const y = Math.min(startPoint.y, currentPoint.y);
    const w = Math.abs(currentPoint.x - startPoint.x);
    const h = Math.abs(currentPoint.y - startPoint.y);

    if (w > 20 && h > 20) {
      audio.playShutter();
      // Extract crop data URL
      const canvas = canvasRef.current;
      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = w;
      cropCanvas.height = h;
      const ctx = cropCanvas.getContext('2d');
      ctx.drawImage(canvas, x, y, w, h, 0, 0, w, h);

      setSelectedCrop({
        x,
        y,
        width: w,
        height: h,
        dataUrl: cropCanvas.toDataURL('image/png'),
      });
      setStage('annotate');
    }
  };

  const handleSnipEntireScreen = () => {
    audio.playShutter();
    if (bufferUrl) {
      setSelectedCrop({
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
        dataUrl: bufferUrl,
      });
      setStage('annotate');
    }
  };

  // Selection box geometry
  const selX = Math.min(startPoint.x, currentPoint.x);
  const selY = Math.min(startPoint.y, currentPoint.y);
  const selW = Math.abs(currentPoint.x - startPoint.x);
  const selH = Math.abs(currentPoint.y - startPoint.y);

  if (stage === 'annotate' && selectedCrop) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md">
        <AnnotationCanvas
          imageSrc={selectedCrop.dataUrl}
          theme={theme}
          onFinishAnnotation={(finalDataUrl) => onFinishSnip(finalDataUrl)}
          onCancel={() => {
            setStage('select');
            setSelectedCrop(null);
          }}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="fixed inset-0 z-50 cursor-crosshair select-none overflow-hidden"
    >
      {/* Background Screen Capture Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Dimming Mask with Selection Cutout */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none">
        {isSelecting && selW > 0 && selH > 0 && (
          <div
            className="absolute border-2 border-cyan-400 bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
            style={{
              left: `${selX}px`,
              top: `${selY}px`,
              width: `${selW}px`,
              height: `${selH}px`,
            }}
          >
            {/* Dimensions Badge */}
            <div className="absolute -top-7 left-0 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-cyan-300 border border-cyan-500/30">
              {selW} × {selH}px
            </div>
          </div>
        )}
      </div>

      {/* Magnifying Loupe with RGB & Coordinate Telemetry */}
      {!isSelecting && (
        <div
          className="pointer-events-none fixed z-40 rounded-full border-2 border-cyan-400 shadow-2xl bg-black/80 flex flex-col items-center justify-center text-[10px] font-mono overflow-hidden"
          style={{
            left: `${mousePos.x + 20}px`,
            top: `${mousePos.y + 20}px`,
            width: '90px',
            height: '90px',
          }}
        >
          <div className="flex items-center space-x-1 text-white">
            <span>{mousePos.x}</span>
            <span>,</span>
            <span>{mousePos.y}</span>
          </div>
          <div className="flex items-center space-x-1.5 mt-1">
            <span
              className="w-3 h-3 rounded-full border border-white/40"
              style={{ backgroundColor: loupeColor }}
            />
            <span className="text-[9px] text-white/70">{loupeColor}</span>
          </div>
          <Crosshair size={14} className="text-cyan-400 mt-1 opacity-70" />
        </div>
      )}

      {/* Top Banner Guide */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center space-x-3 px-4 py-2 rounded-full glass-panel shadow-2xl text-xs font-medium text-white select-none">
        <span className="flex items-center space-x-1.5 text-cyan-400">
          <Scissors size={14} />
          <span>Drag to snip region</span>
        </span>
        <span className="text-white/30">•</span>
        <button
          onClick={handleSnipEntireScreen}
          className="hover:text-cyan-300 transition-colors underline cursor-pointer"
        >
          Capture Full Screen
        </button>
        <span className="text-white/30">•</span>
        <button
          onClick={onCancel}
          className="flex items-center space-x-1 text-white/50 hover:text-rose-400 transition-colors"
        >
          <X size={12} />
          <span>Cancel (Esc)</span>
        </button>
      </div>
    </div>
  );
}
