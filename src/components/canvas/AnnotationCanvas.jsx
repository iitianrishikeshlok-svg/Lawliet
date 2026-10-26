import React, { useRef, useState, useEffect } from 'react';
import { PenTool, ArrowUpRight, Square, Type, Undo, Trash2, Check, Scissors } from '../../common/Icons';
import { audio } from '../../common/AudioEngine';

const COLORS = [
  { id: 'cyan', hex: '#06b6d4', name: 'Electric Cyan' },
  { id: 'amber', hex: '#f59e0b', name: 'Amber Glow' },
  { id: 'crimson', hex: '#ef4444', name: 'Neon Crimson' },
  { id: 'lime', hex: '#10b981', name: 'Matrix Lime' },
  { id: 'white', hex: '#ffffff', name: 'Crisp White' },
];

export default function AnnotationCanvas({
  imageSrc,
  onFinishAnnotation,
  onCancel,
  theme,
  isEmbedded = false,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  const [tool, setTool] = useState('pen'); // pen | arrow | highlighter | text | crop
  const [color, setColor] = useState('#06b6d4');
  const [lineWidth, setLineWidth] = useState(3);
  const [history, setHistory] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [textInput, setTextInput] = useState({ visible: false, x: 0, y: 0, value: '' });

  // Base image holder
  const baseImageRef = useRef(null);

  // Initialize canvas with image
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      baseImageRef.current = img;
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      // Save initial state to history
      saveState();
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-15), imageData]); // Keep last 15 states
  };

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e) => {
    if (textInput.visible) return;
    const pos = getCanvasCoords(e);
    setIsDrawing(true);
    setStartPos(pos);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (tool === 'pen') {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    } else if (tool === 'text') {
      setTextInput({ visible: true, x: pos.x, y: pos.y, value: '' });
      setIsDrawing(false);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const pos = getCanvasCoords(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (tool === 'pen') {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (tool === 'arrow' || tool === 'highlighter' || tool === 'crop') {
      // Restore previous state to show live preview of shape
      if (history.length > 0) {
        ctx.putImageData(history[history.length - 1], 0, 0);
      }

      if (tool === 'highlighter') {
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.35;
        ctx.fillRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
        ctx.globalAlpha = 1.0;
      } else if (tool === 'arrow') {
        drawArrow(ctx, startPos.x, startPos.y, pos.x, pos.y, color, lineWidth);
      } else if (tool === 'crop') {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
        ctx.setLineDash([]);
      }
    }
  };

  const handleMouseUp = (e) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const pos = getCanvasCoords(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (tool === 'crop') {
      // Execute crop if dimensions are valid
      const x = Math.min(startPos.x, pos.x);
      const y = Math.min(startPos.y, pos.y);
      const w = Math.abs(pos.x - startPos.x);
      const h = Math.abs(pos.y - startPos.y);

      if (w > 20 && h > 20) {
        const cropped = ctx.getImageData(x, y, w, h);
        canvas.width = w;
        canvas.height = h;
        ctx.putImageData(cropped, 0, 0);
        setTool('pen');
      }
    }

    saveState();
  };

  // Vector Arrow Drawing Math
  const drawArrow = (ctx, fromX, fromY, toX, toY, strokeColor, width) => {
    const headlen = 16;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);

    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = strokeColor;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';

    // Shaft
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headlen * Math.cos(angle - Math.PI / 6),
      toY - headlen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX - headlen * Math.cos(angle + Math.PI / 6),
      toY - headlen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    audio.playClick();
    const newHistory = [...history];
    newHistory.pop(); // Remove current state
    const prevState = newHistory[newHistory.length - 1];
    setHistory(newHistory);

    const canvas = canvasRef.current;
    if (canvas && prevState) {
      const ctx = canvas.getContext('2d');
      canvas.width = prevState.width;
      canvas.height = prevState.height;
      ctx.putImageData(prevState, 0, 0);
    }
  };

  const handleClear = () => {
    if (!baseImageRef.current) return;
    audio.playClick();
    const canvas = canvasRef.current;
    const img = baseImageRef.current;
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    saveState();
  };

  const handleCommitText = () => {
    if (!textInput.value.trim()) {
      setTextInput({ visible: false, x: 0, y: 0, value: '' });
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillStyle = color;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 6;
    ctx.fillText(textInput.value, textInput.x, textInput.y);
    ctx.shadowBlur = 0;
    setTextInput({ visible: false, x: 0, y: 0, value: '' });
    saveState();
  };

  const handleExport = () => {
    audio.playSuccess();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onFinishAnnotation(dataUrl);
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col items-center justify-center w-full h-full select-none ${
        isEmbedded ? 'p-2' : 'p-4'
      }`}
    >
      {/* Floating Pill Annotation Toolbar */}
      <div
        className="absolute top-3 z-30 flex items-center space-x-1.5 px-3 py-1.5 rounded-full glass-panel shadow-2xl border border-white/10"
        style={{ backdropFilter: 'blur(20px)' }}
      >
        {/* Tool Buttons */}
        {[
          { id: 'pen', icon: PenTool, label: 'Freehand Pen' },
          { id: 'arrow', icon: ArrowUpRight, label: 'Direction Arrow' },
          { id: 'highlighter', icon: Square, label: 'Highlighter' },
          { id: 'text', icon: Type, label: 'Text Callout' },
          { id: 'crop', icon: Scissors, label: 'Crop Region' },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = tool === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                audio.playClick();
                setTool(item.id);
              }}
              title={item.label}
              className={`p-1.5 rounded-full transition-colors ${
                isActive
                  ? 'bg-white text-black shadow-md'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon size={14} />
            </button>
          );
        })}

        <div className="w-[1px] h-4 bg-white/20 mx-1" />

        {/* Color Palette */}
        <div className="flex items-center space-x-1">
          {COLORS.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                audio.playClick();
                setColor(c.hex);
              }}
              title={c.name}
              className={`w-4 h-4 rounded-full transition-transform ${
                color === c.hex ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
              }`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>

        <div className="w-[1px] h-4 bg-white/20 mx-1" />

        {/* Undo & Clear */}
        <button
          onClick={handleUndo}
          title="Undo (Ctrl+Z)"
          className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10"
        >
          <Undo size={14} />
        </button>
        <button
          onClick={handleClear}
          title="Reset Annotations"
          className="p-1.5 rounded-full text-white/60 hover:text-rose-400 hover:bg-white/10"
        >
          <Trash2 size={14} />
        </button>

        <div className="w-[1px] h-4 bg-white/20 mx-1" />

        {/* Complete / Analyze Button */}
        <button
          onClick={handleExport}
          className="flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold text-white shadow-lg transition-transform active:scale-95"
          style={{
            background: theme.accent,
            boxShadow: `0 0 14px ${theme.accentGlow}`,
          }}
        >
          <Check size={13} />
          <span>Send to L</span>
        </button>
      </div>

      {/* Main Canvas Container with Auto Scale */}
      <div className="relative flex items-center justify-center max-w-full max-h-[75vh] overflow-hidden rounded-lg border border-white/10 shadow-2xl bg-black/60">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="max-w-full max-h-[75vh] object-contain cursor-crosshair"
        />

        {/* In-place Text Annotation Input */}
        {textInput.visible && (
          <div
            className="absolute z-40 flex items-center space-x-1 bg-black/90 p-1.5 rounded-md border border-cyan-500 shadow-2xl"
            style={{
              left: `${textInput.x}px`,
              top: `${textInput.y}px`,
              transform: 'translate(-10px, -50%)',
            }}
          >
            <input
              type="text"
              autoFocus
              value={textInput.value}
              onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCommitText();
                if (e.key === 'Escape') setTextInput({ visible: false, x: 0, y: 0, value: '' });
              }}
              placeholder="Type note and hit Enter..."
              className="bg-transparent text-sm text-white px-2 py-1 outline-none font-sans w-48"
            />
            <button
              onClick={handleCommitText}
              className="px-2 py-1 bg-cyan-500 text-black font-bold text-xs rounded hover:bg-cyan-400"
            >
              OK
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
