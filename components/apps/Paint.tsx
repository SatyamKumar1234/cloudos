
import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Download, Trash2, Undo, Palette, Square, Circle, Minus, PaintBucket, SprayCan, FilePlus, Upload, Save, HardDrive } from 'lucide-react';
import { useOS } from '../../context/OSContext';

type Tool = 'brush' | 'eraser' | 'rect' | 'circle' | 'line' | 'fill' | 'spray';

export const Paint: React.FC = () => {
  const { createFile } = useOS();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState<Tool>('brush');
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [snapshot, setSnapshot] = useState<ImageData | null>(null);
  const [history, setHistory] = useState<ImageData[]>([]);

  // Initialize Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    
    if (canvas && container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        saveHistory();
      }
    }
  }, []);

  const getCoordinates = (e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
          x: Math.floor(e.clientX - rect.left),
          y: Math.floor(e.clientY - rect.top)
      };
  };

  const saveHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const newHistory = [...history, ctx.getImageData(0, 0, canvas.width, canvas.height)];
    if (newHistory.length > 20) newHistory.shift();
    setHistory(newHistory);
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHistory = [...history];
    newHistory.pop(); 
    const previousState = newHistory[newHistory.length - 1];
    if (previousState) {
        ctx.putImageData(previousState, 0, 0);
        setHistory(newHistory);
    }
  };

  // --- Drawing Logic ---

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const floodFill = (ctx: CanvasRenderingContext2D, x: number, y: number, fillColor: string) => {
    const canvas = ctx.canvas;
    const w = canvas.width;
    const h = canvas.height;
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    
    const { r: fr, g: fg, b: fb } = hexToRgb(fillColor);
    const startPos = (y * w + x) * 4;
    const startR = data[startPos];
    const startG = data[startPos + 1];
    const startB = data[startPos + 2];
    const startA = data[startPos + 3];

    // Don't fill if color is same
    if (startR === fr && startG === fg && startB === fb && startA === 255) return;

    const matchStartColor = (pos: number) => {
        return data[pos] === startR && data[pos + 1] === startG && data[pos + 2] === startB && data[pos + 3] === startA;
    };

    const colorPixel = (pos: number) => {
        data[pos] = fr;
        data[pos + 1] = fg;
        data[pos + 2] = fb;
        data[pos + 3] = 255;
    };

    const stack = [[x, y]];

    while (stack.length) {
        const [cx, cy] = stack.pop()!;
        let pos = (cy * w + cx) * 4;

        if (matchStartColor(pos)) {
            let left = cx;
            let right = cx;
            
            // Move left
            while (left >= 0 && matchStartColor((cy * w + left) * 4)) {
                colorPixel((cy * w + left) * 4);
                left--;
            }
            // Move right
            while (right < w && matchStartColor((cy * w + right) * 4)) {
                colorPixel((cy * w + right) * 4);
                right++;
            }

            // Scan scanlines above and below
            for (let i = left + 1; i < right; i++) {
                if (cy > 0 && matchStartColor(((cy - 1) * w + i) * 4)) stack.push([i, cy - 1]);
                if (cy < h - 1 && matchStartColor(((cy + 1) * w + i) * 4)) stack.push([i, cy + 1]);
            }
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
  };

  const startDrawing = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);

    if (tool === 'fill') {
        floodFill(ctx, x, y, color);
        saveHistory();
        return;
    }

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setStartPos({ x, y });
    setSnapshot(ctx.getImageData(0, 0, canvas.width, canvas.height));
    
    if (tool === 'brush' || tool === 'eraser') {
        ctx.lineTo(x, y); // Draw single dot
        ctx.stroke();
    }
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);

    if (tool === 'brush' || tool === 'eraser') {
        ctx.lineTo(x, y);
        ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
        ctx.lineWidth = brushSize;
        ctx.stroke();
    } else if (tool === 'spray') {
        ctx.fillStyle = color;
        for (let i = 0; i < brushSize * 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * brushSize * 2;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            ctx.fillRect(px, py, 1, 1);
        }
    } else if (snapshot) {
        ctx.putImageData(snapshot, 0, 0);
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;

        if (tool === 'rect') {
            ctx.strokeRect(startPos.x, startPos.y, x - startPos.x, y - startPos.y);
        } else if (tool === 'circle') {
            const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2));
            ctx.beginPath();
            ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
            ctx.stroke();
        } else if (tool === 'line') {
            ctx.moveTo(startPos.x, startPos.y);
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
        setIsDrawing(false);
        saveHistory();
    }
  };

  // --- Actions ---

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveHistory();
  };

  const handleNew = () => {
    if (confirm("Create new drawing? Unsaved changes will be lost.")) {
        clearCanvas();
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'drawing.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  const handleSaveToSystem = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dataUrl = canvas.toDataURL('image/png');
      const filename = prompt("Enter filename:", "my-drawing.png");
      if (filename) {
          createFile('pictures', filename, 'image', dataUrl);
          alert('Saved to Pictures folder!');
      }
  };

  const handleLoadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              const img = new Image();
              img.onload = () => {
                  const canvas = canvasRef.current;
                  const ctx = canvas?.getContext('2d');
                  if (canvas && ctx) {
                      // Center image
                      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
                      const x = (canvas.width / 2) - (img.width / 2) * scale;
                      const y = (canvas.height / 2) - (img.height / 2) * scale;
                      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
                      saveHistory();
                  }
              };
              img.src = ev.target?.result as string;
          };
          reader.readAsDataURL(file);
      }
  };

  const colors = ['#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#ffffff'];

  return (
    <div className="h-full flex flex-col bg-slate-100">
      {/* Toolbar - Made scrollable for smaller screens */}
      <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 shadow-sm z-10 select-none overflow-x-auto overflow-y-hidden whitespace-nowrap">
        <div className="flex items-center gap-4 min-w-max">
            {/* Tools */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                {[
                    { t: 'brush', icon: Palette },
                    { t: 'spray', icon: SprayCan },
                    { t: 'fill', icon: PaintBucket },
                    { t: 'line', icon: Minus },
                    { t: 'rect', icon: Square },
                    { t: 'circle', icon: Circle },
                    { t: 'eraser', icon: Eraser },
                ].map((item) => (
                    <button 
                        key={item.t}
                        onClick={() => setTool(item.t as Tool)}
                        className={`p-2 rounded-md transition-all ${tool === item.t ? 'bg-white shadow text-blue-500 scale-105' : 'text-slate-500 hover:bg-slate-200'}`}
                        title={item.t}
                    >
                        <item.icon size={18} />
                    </button>
                ))}
            </div>

            <div className="h-8 w-px bg-slate-200" />

            {/* Size */}
            <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500 uppercase">Size: {brushSize}px</span>
                <input 
                    type="range" 
                    min="1" 
                    max="50" 
                    value={brushSize} 
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="w-24 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
            </div>

            <div className="h-8 w-px bg-slate-200" />

            {/* Colors */}
            <div className="flex gap-1.5">
                {colors.map(c => (
                    <button
                        key={c}
                        onClick={() => { setColor(c); if(tool === 'eraser') setTool('brush'); }}
                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 shadow-sm ${color === c && tool !== 'eraser' ? 'border-slate-900 scale-110' : 'border-slate-200'}`}
                        style={{ backgroundColor: c }}
                    />
                ))}
                <input 
                    type="color" 
                    value={color}
                    onChange={(e) => { setColor(e.target.value); if(tool === 'eraser') setTool('brush'); }}
                    className="w-6 h-6 rounded-full overflow-hidden border-0 p-0 cursor-pointer"
                />
            </div>
        </div>

        {/* Actions - Pushed to right, min-w-max to prevent shrinking */}
        <div className="flex gap-2 ml-4 min-w-max">
            <button onClick={handleUndo} className="p-2 text-slate-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Undo">
                <Undo size={18} />
            </button>
            <div className="h-8 w-px bg-slate-200" />
            
            <button onClick={handleNew} className="p-2 text-slate-500 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors" title="New Canvas">
                <FilePlus size={18} />
            </button>
            
            <label className="p-2 text-slate-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="Load Image">
                <Upload size={18} />
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLoadImage} />
            </label>

            <button onClick={handleSaveToSystem} className="p-2 text-slate-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Save to CloudOS">
                <HardDrive size={18} />
            </button>
            
            <button onClick={handleDownload} className="p-2 text-slate-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Download to PC">
                <Download size={18} />
            </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div ref={containerRef} className="flex-1 bg-slate-200 overflow-hidden relative cursor-crosshair">
        <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="absolute inset-0 block touch-none"
        />
      </div>
    </div>
  );
};
