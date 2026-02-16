
import React, { useState, useRef, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { Image as ImageIcon, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface Props {
  fileId?: string;
}

export const ImageViewer: React.FC<Props> = ({ fileId }) => {
  const { fileSystem } = useOS();
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  
  const file = fileSystem.find(f => f.id === fileId);

  useEffect(() => {
    // Reset state when opening a new file
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [fileId]);

  if (!file) {
      return (
          <div className="h-full w-full bg-[#111] flex flex-col items-center justify-center text-slate-500">
              <ImageIcon size={64} className="mb-4 opacity-50" />
              <p>Image not found</p>
          </div>
      );
  }

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 5));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.1));
  const handleReset = () => {
      setScale(1);
      setPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
      // Zoom with wheel
      const delta = e.deltaY * -0.001;
      setScale(prev => Math.min(Math.max(prev + delta, 0.1), 5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (isDragging) {
          setPosition({
              x: e.clientX - dragStart.current.x,
              y: e.clientY - dragStart.current.y
          });
      }
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="h-full w-full bg-[#111] flex flex-col relative overflow-hidden text-slate-200 select-none">
        {/* Toolbar */}
        <div className="h-12 bg-[#222] border-b border-white/10 flex items-center justify-center gap-4 z-20 shrink-0 shadow-lg">
            <button 
                onClick={handleZoomOut} 
                className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-95" 
                title="Zoom Out"
            >
                <ZoomOut size={18}/>
            </button>
            
            <div className="w-16 text-center text-xs font-mono bg-black/30 rounded py-1 border border-white/5">
                {Math.round(scale * 100)}%
            </div>
            
            <button 
                onClick={handleZoomIn} 
                className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-95" 
                title="Zoom In"
            >
                <ZoomIn size={18}/>
            </button>
            
            <div className="w-px h-6 bg-white/10 mx-2" />
            
            <button 
                onClick={handleReset} 
                className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-95" 
                title="Reset View"
            >
                <RotateCcw size={18}/>
            </button>
        </div>

        {/* Image Area */}
        <div 
            className="flex-1 overflow-hidden relative flex items-center justify-center bg-[#0d0d0d] cursor-grab active:cursor-grabbing"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
                backgroundImage: 'radial-gradient(#333 1px, transparent 1px)',
                backgroundSize: '20px 20px'
            }}
        >
            <img 
                src={file.content} 
                alt={file.name} 
                draggable={false}
                className="transition-transform duration-75 ease-out max-w-none shadow-2xl"
                style={{ 
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    maxHeight: scale === 1 ? '90%' : 'none',
                    maxWidth: scale === 1 ? '90%' : 'none',
                }}
            />
        </div>
        
        {/* Status Bar */}
        <div className="h-6 bg-black border-t border-white/10 flex items-center justify-between px-4 text-[10px] text-slate-500 z-20">
            <span>{file.name}</span>
            <span>Drag to pan • Scroll to zoom</span>
        </div>
    </div>
  );
};
