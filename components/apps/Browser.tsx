
import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Lock, Star, Plus, X, Search, HardDrive, Code, Menu, Globe } from 'lucide-react';
import { useOS } from '../../context/OSContext';

interface Tab {
  id: number;
  title: string;
  url: string;
  history: string[];
  historyIndex: number;
  isLoading: boolean;
  isLocal?: boolean;
}

interface BrowserProps {
    htmlContent?: string;
    title?: string;
}

export const Browser: React.FC<BrowserProps> = ({ htmlContent, title }) => {
  const { fileSystem } = useOS();
  
  const [tabs, setTabs] = useState<Tab[]>(() => {
      if (htmlContent) {
          const blob = new Blob([htmlContent], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          return [{
              id: 1,
              title: title || 'Preview',
              url: 'local://preview', 
              history: [url], 
              historyIndex: 0,
              isLoading: false,
              isLocal: true
          }];
      }
      return [{ 
        id: 1, 
        title: 'New Tab', 
        url: 'home', 
        history: ['home'], 
        historyIndex: 0,
        isLoading: false 
      }];
  });

  const [activeTabId, setActiveTabId] = useState(1);
  const [addressBarInput, setAddressBarInput] = useState('');
  const [searchValue, setSearchValue] = useState('');

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  useEffect(() => {
    if (activeTab.url === 'home') {
        setAddressBarInput('');
    } else if (activeTab.history[activeTab.historyIndex].startsWith('blob:')) {
        setAddressBarInput('local://preview');
    } else {
        setAddressBarInput(activeTab.url);
    }
  }, [activeTabId, activeTab]);

  const updateTab = (id: number, updates: Partial<Tab>) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const getLocalFileUrl = (filename: string): string | null => {
    const name = filename.replace('local://', '');
    const file = fileSystem.find(f => f.name.toLowerCase() === name.toLowerCase());
    
    if (file && file.content) {
        let mimeType = 'text/plain';
        if (file.name.endsWith('.html')) mimeType = 'text/html';
        if (file.name.endsWith('.png')) mimeType = 'image/png';
        if (file.name.endsWith('.jpg')) mimeType = 'image/jpeg';
        
        const blob = new Blob([file.content], { type: mimeType });
        return URL.createObjectURL(blob);
    }
    return null;
  };

  const navigate = (inputUrl: string) => {
    if (!inputUrl.trim()) return;

    let target = inputUrl;
    let isLocal = false;
    let iframeSrc = target;
    let displayTitle = target;

    if (target === 'home') {
        iframeSrc = 'home';
        displayTitle = 'New Tab';
    } else if (target.startsWith('local://') || fileSystem.some(f => f.name.toLowerCase() === target.toLowerCase())) {
        const fileUrl = getLocalFileUrl(target);
        if (fileUrl) {
            iframeSrc = fileUrl;
            isLocal = true;
            displayTitle = target.replace('local://', '');
        } else {
            alert('File not found in CloudOS');
            return;
        }
    } else {
        if (!target.includes('.') && !target.startsWith('http') && !target.startsWith('localhost')) {
            // Search Query
            target = `https://www.bing.com/search?q=${encodeURIComponent(target)}`;
            iframeSrc = target;
            displayTitle = inputUrl;
        } else if (!target.startsWith('http')) {
            target = 'https://' + target;
            iframeSrc = target;
            displayTitle = target.replace('https://', '');
        }
    }

    const newHistory = activeTab.history.slice(0, activeTab.historyIndex + 1);
    newHistory.push(iframeSrc);

    updateTab(activeTabId, {
      url: target,
      title: displayTitle,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      isLoading: target !== 'home',
      isLocal: isLocal
    });
  };

  const handleBack = () => {
    if (activeTab.historyIndex > 0) {
      const newIndex = activeTab.historyIndex - 1;
      const prevUrl = activeTab.history[newIndex];
      const isBlob = prevUrl.startsWith('blob:');

      updateTab(activeTabId, {
        historyIndex: newIndex,
        url: prevUrl === 'home' ? 'home' : (isBlob ? 'local://preview' : prevUrl),
        isLoading: prevUrl !== 'home',
        isLocal: isBlob
      });
    }
  };

  const handleForward = () => {
    if (activeTab.historyIndex < activeTab.history.length - 1) {
      const newIndex = activeTab.historyIndex + 1;
      const nextUrl = activeTab.history[newIndex];
      const isBlob = nextUrl.startsWith('blob:');

      updateTab(activeTabId, {
        historyIndex: newIndex,
        url: nextUrl === 'home' ? 'home' : (isBlob ? 'local://preview' : nextUrl),
        isLoading: nextUrl !== 'home',
        isLocal: isBlob
      });
    }
  };

  const addTab = () => {
    const newId = Math.max(...tabs.map(t => t.id)) + 1;
    setTabs([...tabs, {
      id: newId,
      title: 'New Tab',
      url: 'home',
      history: ['home'],
      historyIndex: 0,
      isLoading: false
    }]);
    setActiveTabId(newId);
  };

  const closeTab = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(addressBarInput);
  };

  const handleHomeSearch = (e: React.FormEvent) => {
      e.preventDefault();
      navigate(searchValue);
  };

  return (
    <div className="h-full flex flex-col bg-[#202124] text-slate-200">
      {/* Tabs Bar */}
      <div className="h-10 flex items-end px-2 pt-2 bg-[#000] gap-1 overflow-x-auto custom-scrollbar">
        {tabs.map(tab => {
            const isActive = activeTabId === tab.id;
            return (
               <div 
                 key={tab.id}
                 onClick={() => setActiveTabId(tab.id)}
                 className={`
                    w-60 h-full flex items-center px-3 text-xs gap-2 relative group cursor-pointer transition-all duration-100 rounded-t-lg
                    ${isActive ? 'bg-[#35363A] text-white z-10' : 'bg-transparent text-slate-400 hover:bg-[#35363A]/50 hover:text-white'}
                 `}
                 style={{
                    clipPath: isActive ? 'polygon(5% 0, 95% 0, 100% 100%, 0% 100%)' : undefined,
                    paddingLeft: isActive ? '20px' : '12px',
                    paddingRight: isActive ? '20px' : '12px',
                 }}
               >
                 <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0">
                    {tab.isLoading ? <RotateCw size={12} className="animate-spin text-blue-400" /> : tab.isLocal ? <Code size={12} className="text-yellow-400"/> : tab.url === 'home' ? <Globe size={12} className="text-slate-400"/> : <img src={`https://www.google.com/s2/favicons?domain=${tab.url}`} alt="" className="w-4 h-4 rounded-full" />}
                 </div>
                 <span className="truncate flex-1 font-medium">{tab.title}</span>
                 <button 
                    onClick={(e) => closeTab(e, tab.id)}
                    className={`rounded-full p-1 hover:bg-white/20 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                 >
                   <X size={10} />
                 </button>
               </div>
            )
        })}
        <button onClick={addTab} className="p-2 hover:bg-white/10 rounded-full text-slate-400 ml-1 transition-colors"><Plus size={16} /></button>
      </div>

      {/* Address Bar Area */}
      <div className="bg-[#35363A] p-2 flex items-center gap-2 px-3 shadow-sm z-20">
        <div className="flex items-center gap-1 text-slate-300">
          <button onClick={handleBack} disabled={activeTab.historyIndex === 0} className="p-1.5 hover:bg-white/10 rounded-full transition-colors disabled:opacity-30"><ArrowLeft size={16} /></button>
          <button onClick={handleForward} disabled={activeTab.historyIndex === activeTab.history.length - 1} className="p-1.5 hover:bg-white/10 rounded-full transition-colors disabled:opacity-30"><ArrowRight size={16} /></button>
          <button onClick={() => { 
              if (activeTab.url !== 'home') {
                updateTab(activeTabId, { isLoading: true }); 
                const iframe = document.getElementById(`iframe-${activeTab.id}`) as HTMLIFrameElement; 
                if(iframe) iframe.src = iframe.src; 
              }
          }} className="p-1.5 hover:bg-white/10 rounded-full transition-colors"><RotateCw size={14} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1">
          <div className="relative group w-full">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
               {activeTab.isLocal ? <HardDrive size={12} className="text-blue-500" /> : activeTab.url.startsWith('https') ? <Lock size={12} className="text-green-500" /> : <Search size={14} className="text-slate-500" />}
            </div>
            <input
              type="text"
              value={addressBarInput}
              onChange={(e) => setAddressBarInput(e.target.value)}
              onFocus={(e) => e.target.select()}
              className="w-full bg-[#202124] text-white text-sm rounded-full py-1.5 pl-10 pr-10 border border-transparent focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:bg-[#202124] focus:outline-none transition-all shadow-inner placeholder:text-slate-500"
              placeholder="Search Google or type a URL"
            />
             <div className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-slate-500 hover:text-yellow-500">
               <Star size={14} />
            </div>
          </div>
        </form>

        <button className="p-1.5 hover:bg-white/10 rounded-full text-slate-400"><Menu size={16} /></button>
      </div>

      {/* Bookmarks Bar Placeholder */}
      <div className="h-8 bg-[#35363A] border-b border-black/20 flex items-center px-4 gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-1 cursor-pointer hover:bg-white/10 px-2 py-1 rounded"><img src="https://www.google.com/s2/favicons?domain=youtube.com" className="w-3 h-3" /> YouTube</div>
          <div className="flex items-center gap-1 cursor-pointer hover:bg-white/10 px-2 py-1 rounded"><img src="https://www.google.com/s2/favicons?domain=github.com" className="w-3 h-3" /> GitHub</div>
          <div className="flex items-center gap-1 cursor-pointer hover:bg-white/10 px-2 py-1 rounded"><img src="https://www.google.com/s2/favicons?domain=gmail.com" className="w-3 h-3" /> Gmail</div>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative bg-white">
        {tabs.map(tab => (
            <div key={tab.id} className={`absolute inset-0 w-full h-full ${activeTabId === tab.id ? 'z-10 visible' : 'z-0 invisible'}`}>
                {tab.url === 'home' && tab.history[tab.historyIndex] === 'home' ? (
                    // Home Page View
                    <div className="w-full h-full bg-[#202124] flex flex-col items-center justify-center p-4">
                        <div className="flex flex-col items-center max-w-lg w-full -mt-20">
                            <h1 className="text-6xl font-medium text-white mb-8 tracking-tight">Cloud<span className="text-blue-500">Search</span></h1>
                            <form onSubmit={handleHomeSearch} className="w-full relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input 
                                    type="text" 
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    className="w-full bg-[#303134] hover:bg-[#303134] text-white rounded-full py-3 pl-12 pr-4 border border-transparent hover:border-white/10 hover:shadow-lg focus:bg-[#303134] focus:outline-none focus:border-white/30 transition-all"
                                    placeholder="Search the web"
                                    autoFocus
                                />
                            </form>
                            <div className="flex gap-4 mt-8">
                                <button className="px-4 py-2 bg-[#303134] hover:border-white/30 border border-transparent rounded text-sm text-slate-200">Google Search</button>
                                <button className="px-4 py-2 bg-[#303134] hover:border-white/30 border border-transparent rounded text-sm text-slate-200">I'm Feeling Lucky</button>
                            </div>
                        </div>
                    </div>
                ) : (
                    // Iframe View
                    <>
                        {tab.isLoading && (
                            <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-100 overflow-hidden z-20">
                                <div className="w-full h-full bg-blue-500 animate-[loading_1.5s_ease-in-out_infinite] origin-left" />
                            </div>
                        )}
                        <iframe 
                        id={`iframe-${tab.id}`}
                        src={tab.history[tab.historyIndex]} 
                        className="w-full h-full border-0"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                        onLoad={() => updateTab(tab.id, { isLoading: false })}
                        title={`browser-frame-${tab.id}`}
                        />
                    </>
                )}
            </div>
        ))}
        
        {!htmlContent && activeTab.url !== 'home' && (
            <div className="absolute bottom-0 left-0 right-0 bg-yellow-100 text-yellow-800 text-[10px] px-2 py-1 text-center opacity-80 hover:opacity-0 transition-opacity z-50 pointer-events-none">
                Tip: Type "local://index.html" to open files from your Codes folder.
            </div>
        )}
      </div>
      <style>{`
        @keyframes loading {
            0% { transform: scaleX(0); }
            50% { transform: scaleX(0.5); }
            100% { transform: scaleX(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
};
