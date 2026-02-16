
import React, { useEffect, useRef, useCallback } from 'react';
import { useOS } from '../../context/OSContext';
import { WindowState } from '../../types';

interface Props {
  window: WindowState;
  children: React.ReactNode;
}

export const WindowFrame: React.FC<Props> = ({ window: windowState, children }) => {
  const { closeWindow, minimizeWindow, maximizeWindow, focusWindow, updateWindowPosition, updateWindowSize } = useOS();
  const windowRef = useRef<HTMLDivElement>(null);
  
  // Refs for drag state
  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 }); // Mouse position at start
  const initialPos = useRef({ x: 0, y: 0, w: 0, h: 0 }); // Window position/size at start

  // Handler for mouse move (attached dynamically)
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!windowRef.current) return;

    if (isDragging.current) {
      e.preventDefault();
      const deltaX = e.clientX - dragStart.current.x;
      const deltaY = e.clientY - dragStart.current.y;
      
      const newX = initialPos.current.x + deltaX;
      const newY = initialPos.current.y + deltaY;

      windowRef.current.style.left = `${newX}px`;
      windowRef.current.style.top = `${newY}px`;
      windowRef.current.style.transform = ''; 
    } else if (isResizing.current) {
        e.preventDefault();
        const deltaX = e.clientX - dragStart.current.x;
        const deltaY = e.clientY - dragStart.current.y;
        
        const newW = Math.max(300, initialPos.current.w + deltaX);
        const newH = Math.max(200, initialPos.current.h + deltaY);
        
        windowRef.current.style.width = `${newW}px`;
        windowRef.current.style.height = `${newH}px`;
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // Safety check for blocker existence
    const blocker = document.getElementById('iframe-blocker');
    if (blocker && blocker.parentNode) {
      blocker.parentNode.removeChild(blocker);
    }

    if (windowRef.current) {
        const style = window.getComputedStyle(windowRef.current);
        const x = parseInt(style.left, 10);
        const y = parseInt(style.top, 10);
        const w = parseInt(style.width, 10);
        const h = parseInt(style.height, 10);

        if (isDragging.current) updateWindowPosition(windowState.id, x, y);
        if (isResizing.current) updateWindowSize(windowState.id, w, h);
    }

    isDragging.current = false;
    isResizing.current = false;
  }, [handleMouseMove, updateWindowPosition, updateWindowSize, windowState.id]);

  const onTitleMouseDown = (e: React.MouseEvent) => {
    if (windowState.isMaximized) return;
    if ((e.target as HTMLElement).closest('.window-controls-container')) return;
    
    focusWindow(windowState.id);
    
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    initialPos.current = { 
        x: windowState.x, 
        y: windowState.y,
        w: windowState.width,
        h: windowState.height
    };

    // Remove any existing blockers first
    const existingBlocker = document.getElementById('iframe-blocker');
    if (existingBlocker) existingBlocker.remove();

    const blocker = document.createElement('div');
    blocker.id = 'iframe-blocker';
    blocker.style.position = 'fixed';
    blocker.style.inset = '0';
    blocker.style.zIndex = '99999';
    blocker.style.cursor = 'move';
    document.body.appendChild(blocker);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const onResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    focusWindow(windowState.id);
    
    isResizing.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    initialPos.current = {
        x: windowState.x,
        y: windowState.y,
        w: windowState.width,
        h: windowState.height
    };

    const existingBlocker = document.getElementById('iframe-blocker');
    if (existingBlocker) existingBlocker.remove();

    const blocker = document.createElement('div');
    blocker.id = 'iframe-blocker';
    blocker.style.position = 'fixed';
    blocker.style.inset = '0';
    blocker.style.zIndex = '99999';
    blocker.style.cursor = 'se-resize';
    document.body.appendChild(blocker);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  if (windowState.isMinimized) return null;

  const frameStyle: React.CSSProperties = windowState.isMaximized ? {
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    transform: 'none',
    borderRadius: 0,
    zIndex: windowState.zIndex,
  } : {
    top: windowState.y,
    left: windowState.x,
    width: windowState.width,
    height: windowState.height,
    zIndex: windowState.zIndex,
  };

  return (
    <div
      ref={windowRef}
      className={`absolute flex flex-col bg-slate-900/80 backdrop-blur-2xl border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden window-enter transition-shadow duration-200 ${windowState.isMaximized ? '' : 'rounded-2xl ring-1 ring-white/10'}`}
      style={frameStyle}
      onMouseDown={() => focusWindow(windowState.id)}
    >
      {/* Title Bar */}
      <div
        className={`h-12 flex items-center px-4 cursor-default select-none shrink-0 relative ${windowState.isMaximized ? 'bg-black/40' : 'bg-transparent'}`}
        onMouseDown={!windowState.isMaximized ? onTitleMouseDown : undefined}
        onDoubleClick={() => maximizeWindow(windowState.id)}
      >
        {/* Floating "Dynamic Island" Traffic Lights Container */}
        <div className="window-controls-container absolute left-4 top-1/2 -translate-y-1/2 group">
             <div className="bg-black/40 border border-white/10 rounded-full p-1.5 flex items-center gap-2 backdrop-blur-md shadow-lg transition-transform duration-300 hover:scale-110 hover:bg-black/60">
                <button 
                    onClick={(e) => { e.stopPropagation(); closeWindow(windowState.id); }} 
                    className="w-3.5 h-3.5 rounded-full bg-[#FF5F56] border border-[#E0443E] flex items-center justify-center hover-wobble"
                >
                    <div className="hidden group-hover:block w-1.5 h-1.5 bg-[#4d0000] rounded-full opacity-50" />
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); minimizeWindow(windowState.id); }} 
                    className="w-3.5 h-3.5 rounded-full bg-[#FFBD2E] border border-[#DEA123] flex items-center justify-center hover-wobble"
                >
                    <div className="hidden group-hover:block w-2 h-0.5 bg-[#4d3d00] rounded-full opacity-50" />
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); maximizeWindow(windowState.id); }} 
                    className="w-3.5 h-3.5 rounded-full bg-[#27C93F] border border-[#1AAB29] flex items-center justify-center hover-wobble"
                >
                    <div className="hidden group-hover:block w-1.5 h-1.5 bg-[#002d0b] rounded-full opacity-50" />
                </button>
             </div>
        </div>

        <div className="mx-auto text-sm font-medium text-slate-300 opacity-90 pointer-events-none drop-shadow-md">
           {windowState.title}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative bg-slate-950/50">
        {children}
      </div>

      {/* Resize Handle */}
      {!windowState.isMaximized && (
        <div
          className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize flex items-end justify-end p-1.5 z-50 opacity-0 hover:opacity-100 transition-opacity"
          onMouseDown={onResizeMouseDown}
        >
          <div className="w-1.5 h-1.5 bg-slate-400/50 rounded-full" />
        </div>
      )}
    </div>
  );
};
