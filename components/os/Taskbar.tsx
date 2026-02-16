
import React, { useState, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { StartMenu } from './StartMenu';
import { LayoutGrid } from 'lucide-react';
import { APPS } from '../../constants';

export const Taskbar: React.FC = () => {
  const { windows, activeWindowId, focusWindow, openWindow } = useOS();
  const [isStartOpen, setIsStartOpen] = useState(false);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#start-menu') && !target.closest('#dock-start')) {
        setIsStartOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <>
      {isStartOpen && <StartMenu onClose={() => setIsStartOpen(false)} />}
      
      {/* Floating Dock - Positioned Bottom Left */}
      <div className="fixed bottom-6 left-6 z-[9999] flex items-end gap-2">
        <div className="flex items-center gap-3 px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-2xl shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:scale-[1.03]">
            
            {/* Start Button */}
            <button
                id="dock-start"
                onClick={() => setIsStartOpen(!isStartOpen)}
                className="relative group p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-blue-600 hover:border-blue-500 transition-all duration-300 ease-out active:scale-95"
            >
                <LayoutGrid size={24} className="text-slate-200 group-hover:text-white transition-colors" />
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#1a1a1a] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-[#333] shadow-lg translate-y-2 group-hover:translate-y-0">Start</span>
            </button>

            <div className="w-px h-8 bg-white/10 mx-1" />

            {/* Pinned Apps */}
            {['file-manager', 'browser', 'code-editor', 'ai-runner', 'terminal'].map(appId => {
                const app = APPS[appId as keyof typeof APPS];
                if (!app) return null;
                
                const isOpen = windows.some(w => w.appId === appId);
                const isActive = activeWindowId && windows.find(w => w.id === activeWindowId)?.appId === appId;
                
                return (
                    <button
                        key={appId}
                        onClick={() => openWindow(appId as any)}
                        className={`relative group p-2 rounded-xl transition-all duration-300 ease-out hover:-translate-y-2 active:scale-95 ${isOpen ? 'bg-white/5' : 'hover:bg-white/5'}`}
                    >
                        <div className="p-1.5 rounded-lg">
                            <app.icon size={24} className="text-white drop-shadow-lg" />
                        </div>
                        {isOpen && (
                            <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all duration-300 ${isActive ? 'bg-blue-500 w-1.5 h-1.5' : 'bg-white/50 w-1 h-1'}`} />
                        )}
                        <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#1a1a1a] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap border border-[#333] shadow-lg translate-y-2 group-hover:translate-y-0">
                            {app.name}
                        </span>
                    </button>
                )
            })}

            <div className="w-px h-8 bg-white/10 mx-1" />

            {/* Active Apps (not pinned) */}
            {windows.filter(w => !['file-manager', 'browser', 'code-editor', 'ai-runner', 'terminal'].includes(w.appId)).map((window, idx, arr) => {
                 if (idx > 0 && arr.findIndex(w2 => w2.appId === window.appId) < idx) return null;
                 
                 const app = APPS[window.appId];
                 const isActive = activeWindowId === window.id;

                 return (
                    <button
                        key={window.id}
                        onClick={() => focusWindow(window.id)}
                        className={`relative group p-2 rounded-xl transition-all duration-300 ease-out hover:-translate-y-2 active:scale-95 hover:bg-white/5`}
                    >
                        <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                            <app.icon size={24} className="text-white drop-shadow-lg" />
                        </div>
                        <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all duration-300 ${isActive ? 'bg-blue-500 w-1.5 h-1.5' : 'bg-white/50 w-1 h-1'}`} />
                        <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#1a1a1a] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap border border-[#333] shadow-lg translate-y-2 group-hover:translate-y-0">
                            {window.title}
                        </span>
                    </button>
                 );
            })}
        </div>
      </div>
    </>
  );
};
