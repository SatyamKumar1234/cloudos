
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { APPS } from '../../constants';
import { Search, Power, Edit2, Check } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const StartMenu: React.FC<Props> = ({ onClose }) => {
  const { openWindow, userName, setUserName } = useOS();
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredApps = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return Object.values(APPS).filter(app => 
      app.name.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleAppClick = (appId: string) => {
    openWindow(appId as any);
    onClose();
  };

  const handleNameSave = () => {
    if (tempName.trim()) {
        setUserName(tempName.trim());
    } else {
        setTempName(userName);
    }
    setIsEditingName(false);
  };

  useEffect(() => {
    if (isEditingName && inputRef.current) {
        inputRef.current.focus();
    }
  }, [isEditingName]);

  return (
    <div 
      id="start-menu"
      className="fixed bottom-28 left-6 w-80 sm:w-[28rem] bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl z-[9999] overflow-hidden flex flex-col animate-in slide-in-from-bottom-6 fade-in duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
    >
      <div className="p-5 border-b border-white/5">
        <div className="relative group">
          <Search className="absolute left-3 top-2.5 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search for apps..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111] text-slate-200 pl-10 pr-4 py-2.5 rounded-xl border border-[#333] focus:outline-none focus:bg-black focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 text-sm placeholder:text-slate-600 transition-all"
            autoFocus
          />
        </div>
      </div>

      <div className="p-4 grid grid-cols-4 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar min-h-[200px] content-start">
        {filteredApps.length > 0 ? (
            filteredApps.map((app) => {
            const Icon = app.icon;
            return (
                <button
                key={app.id}
                onClick={() => handleAppClick(app.id)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-white/5 transition-all group duration-200 hover:scale-105 active:scale-95"
                >
                <div className="w-12 h-12 rounded-xl bg-[#252525] flex items-center justify-center mb-2 group-hover:bg-blue-600 group-hover:text-white text-slate-400 transition-colors shadow-lg group-hover:shadow-blue-500/30 border border-white/5">
                    <Icon size={24} />
                </div>
                <span className="text-xs text-slate-400 group-hover:text-white font-medium truncate w-full text-center transition-colors">
                    {app.name}
                </span>
                </button>
            );
            })
        ) : (
            <div className="col-span-4 flex flex-col items-center justify-center h-32 text-slate-500">
                <Search size={32} className="mb-2 opacity-20" />
                <p>No apps found</p>
            </div>
        )}
      </div>

      <div className="mt-auto p-4 bg-black/40 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center text-sm font-bold text-white shadow-lg border border-white/10 shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col justify-center">
            {isEditingName ? (
                <div className="flex items-center gap-2">
                    <input 
                        ref={inputRef}
                        type="text" 
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                        onBlur={handleNameSave}
                        className="bg-[#111] text-white text-sm border border-blue-500 rounded px-1 py-0.5 w-32 focus:outline-none"
                    />
                    <button onMouseDown={(e) => e.preventDefault()} onClick={handleNameSave} className="text-green-500 hover:text-green-400"><Check size={14} /></button>
                </div>
            ) : (
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsEditingName(true)}>
                    <span className="text-sm font-medium text-slate-200 hover:text-white transition-colors">{userName}</span>
                    <Edit2 size={10} className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            )}
            {!isEditingName && <span className="text-[10px] text-slate-500">Administrator</span>}
          </div>
        </div>
        <button className="p-2.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-red-500 transition-colors active:scale-95 border border-transparent hover:border-white/5">
          <Power size={20} />
        </button>
      </div>
    </div>
  );
};
