
import React, { useEffect, useRef, useState } from 'react';
import { Power, Cpu, AlertCircle, Wifi, Disc, Terminal, Monitor, HelpCircle, X } from 'lucide-react';

declare global {
  interface Window {
    V86Starter: any;
  }
}

type OSPreset = 'linux' | 'kolibri' | 'custom';

const OS_PRESETS = {
  linux: {
    name: 'Linux (Buildroot)',
    type: 'iso',
    url: 'https://dl.dropboxusercontent.com/s/13cc04w6l7338u2/linux3.iso?dl=0', // More reliable CORS-friendly mirror
    description: 'Minimal CLI Linux. Fast boot. Good for testing terminal.',
    memory: 128
  },
  kolibri: {
    name: 'KolibriOS',
    type: 'floppy',
    url: 'https://raw.githubusercontent.com/copy/v86/master/images/kolibri.img',
    description: 'Extremely lightweight GUI OS written in Assembly. Boots instantly.',
    memory: 64
  }
};

const PUBLIC_RELAYS = [
  { name: 'Official v86 Relay (US)', url: 'wss://relay.widgetry.org/' },
  { name: 'Localhost (Dev)', url: 'ws://localhost:8080/' },
];

export const V86: React.FC = () => {
  const screenRef = useRef<HTMLDivElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emulator, setEmulator] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Settings
  const [activePreset, setActivePreset] = useState<OSPreset>('linux');
  const [customUrl, setCustomUrl] = useState('');
  
  // Network Settings
  const [enableNetwork, setEnableNetwork] = useState(false);
  const [networkRelayUrl, setNetworkRelayUrl] = useState('wss://relay.widgetry.org/');
  
  const [showSettings, setShowSettings] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    // Load the v86 script dynamically
    if (!document.getElementById('v86-script')) {
      const script = document.createElement('script');
      script.id = 'v86-script';
      script.src = "https://unpkg.com/v86@latest/build/libv86.js";
      script.async = true;
      script.onload = () => console.log('v86 loaded');
      document.body.appendChild(script);
    }

    return () => {
      if (emulator) {
        try {
            emulator.destroy();
        } catch(e) {}
      }
    };
  }, []);

  const bootSystem = () => {
    if (!window.V86Starter) {
        setError("Emulator engine not loaded yet. Check your internet connection.");
        return;
    }
    
    setIsLoading(true);
    setError(null);
    setShowSettings(false);

    try {
        const preset = OS_PRESETS[activePreset as keyof typeof OS_PRESETS];
        const imagePath = activePreset === 'custom' ? customUrl : preset.url;
        
        // Configuration Object
        const config: any = {
            wasm_path: "https://unpkg.com/v86@latest/build/v86.wasm",
            memory_size: (activePreset === 'custom' ? 256 : preset.memory) * 1024 * 1024,
            vga_memory_size: 8 * 1024 * 1024,
            screen_container: screenRef.current,
            bios: { url: "https://unpkg.com/v86@latest/bios/seabios.bin" },
            vga_bios: { url: "https://unpkg.com/v86@latest/bios/vgabios.bin" },
            autostart: true,
            disable_mouse: false,
            disable_keyboard: false,
        };

        // Network Configuration
        if (enableNetwork && networkRelayUrl) {
            config.network_relay_url = networkRelayUrl; 
            console.log("Attempting to connect to network relay:", networkRelayUrl);
        }

        // Image Configuration
        if (activePreset === 'kolibri') {
            config.fda = { url: imagePath }; // Floppy
        } else {
            config.cdrom = { url: imagePath }; // ISO
        }

        const newEmulator = new window.V86Starter(config);

        newEmulator.add_listener("emulator-ready", () => {
            setIsLoading(false);
            setIsRunning(true);
        });

        setEmulator(newEmulator);
    } catch (err: any) {
        console.error(err);
        setError("Failed to initialize: " + err.message);
        setIsLoading(false);
        setShowSettings(true);
    }
  };

  const stop = () => {
      if (emulator) {
          emulator.destroy();
          setEmulator(null);
          setIsRunning(false);
          setShowSettings(true);
      }
  };

  return (
    <div className="h-full flex flex-col bg-[#111] text-white overflow-hidden font-sans relative">
      {/* Help Modal */}
      {showHelp && (
        <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-8">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-lg w-full shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold flex items-center gap-2"><Wifi size={24} className="text-blue-400" /> Network Relay Setup</h3>
                    <button onClick={() => setShowHelp(false)} className="hover:bg-white/10 p-1 rounded"><X size={20}/></button>
                </div>
                <div className="space-y-4 text-sm text-slate-300">
                    <p>Browsers cannot access the internet directly (TCP/UDP) from a VM. You need a <strong>WebSocket Proxy</strong> (Relay).</p>
                    
                    <div className="bg-black/50 p-3 rounded border border-white/10">
                        <p className="font-bold text-white mb-2">Option A: Use Public Relay</p>
                        <p>Try <code>wss://relay.widgetry.org/</code>. Note: Public relays are often overloaded or down.</p>
                    </div>

                    <div className="bg-black/50 p-3 rounded border border-white/10">
                        <p className="font-bold text-white mb-2">Option B: Host Your Own (Free)</p>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>Go to <a href="https://render.com" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Render.com</a> and create a "Web Service".</li>
                            <li>Use this valid repo URL: <br/> <code className="bg-slate-800 px-1 py-0.5 rounded text-xs select-all">https://github.com/novnc/websockify</code></li>
                            <li>Render will detect the Dockerfile automatically.</li>
                            <li>Once deployed, use your Render URL (e.g., <code className="text-xs">wss://your-app.onrender.com</code>) here.</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="h-12 bg-[#222] border-b border-white/10 flex items-center px-4 justify-between shrink-0">
          <div className="flex items-center gap-2">
              <Cpu className="text-blue-400" size={20} />
              <span className="font-bold tracking-wide">
                  {isRunning ? (activePreset === 'custom' ? 'Custom VM' : OS_PRESETS[activePreset].name) : 'Virtual Machine Manager'}
              </span>
          </div>
          <div className="flex items-center gap-3">
              {isRunning && enableNetwork && (
                   <div className="flex items-center gap-2 px-3 py-1 bg-black/50 rounded-full border border-white/10 text-xs">
                       <div className={`w-2 h-2 rounded-full ${networkRelayUrl ? 'bg-green-500' : 'bg-red-500'}`} />
                       Network On
                   </div>
              )}
              {isRunning && (
                  <button 
                    onClick={stop}
                    className="flex items-center gap-2 px-4 py-1.5 bg-red-600 hover:bg-red-500 rounded text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    <Power size={14} /> Power Off
                  </button>
              )}
          </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
          
          {/* Settings Screen */}
          {showSettings && !isLoading && (
              <div className="w-full max-w-2xl p-8 animate-in fade-in zoom-in-95 duration-200">
                  <div className="text-center mb-8">
                      <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/50">
                          <Cpu size={40} className="text-blue-400" />
                      </div>
                      <h2 className="text-2xl font-bold mb-2">Configure Virtual Machine</h2>
                      <p className="text-slate-400">Run real operating systems in your browser via WebAssembly</p>
                  </div>

                  {error && (
                      <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg flex items-center gap-3 text-red-200">
                          <AlertCircle size={20} />
                          {error}
                      </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      {/* OS Selection */}
                      <div className="space-y-4">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Operating System</label>
                          <div className="space-y-2">
                              <button 
                                onClick={() => setActivePreset('linux')}
                                className={`w-full p-3 rounded-lg border text-left flex items-center gap-3 transition-all ${activePreset === 'linux' ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-[#1a1a1a] border-white/10 hover:border-white/30 text-slate-300'}`}
                              >
                                  <Terminal size={20} />
                                  <div>
                                      <div className="font-bold">Linux (CLI)</div>
                                      <div className="text-xs opacity-70">Minimal Buildroot. Fast boot.</div>
                                  </div>
                              </button>
                              
                              <button 
                                onClick={() => setActivePreset('kolibri')}
                                className={`w-full p-3 rounded-lg border text-left flex items-center gap-3 transition-all ${activePreset === 'kolibri' ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-[#1a1a1a] border-white/10 hover:border-white/30 text-slate-300'}`}
                              >
                                  <Monitor size={20} />
                                  <div>
                                      <div className="font-bold">KolibriOS (GUI)</div>
                                      <div className="text-xs opacity-70">Graphical, tiny, ASM-based.</div>
                                  </div>
                              </button>

                              <button 
                                onClick={() => setActivePreset('custom')}
                                className={`w-full p-3 rounded-lg border text-left flex items-center gap-3 transition-all ${activePreset === 'custom' ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-[#1a1a1a] border-white/10 hover:border-white/30 text-slate-300'}`}
                              >
                                  <Disc size={20} />
                                  <div>
                                      <div className="font-bold">Custom ISO URL</div>
                                      <div className="text-xs opacity-70">Load from direct URL (CORS enabled).</div>
                                  </div>
                              </button>
                          </div>
                      </div>

                      {/* Advanced Config */}
                      <div className="space-y-4">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Configuration</label>
                          
                          {activePreset === 'custom' && (
                              <div>
                                  <label className="text-xs text-slate-400 mb-1 block">ISO / IMG URL</label>
                                  <input 
                                    type="text" 
                                    value={customUrl}
                                    onChange={(e) => setCustomUrl(e.target.value)}
                                    placeholder="https://example.com/os.iso"
                                    className="w-full bg-[#1a1a1a] border border-white/10 rounded p-2 text-sm focus:border-blue-500 outline-none transition-colors"
                                  />
                              </div>
                          )}

                          <div className="p-3 bg-[#1a1a1a] rounded border border-white/10">
                              <div className="flex items-center justify-between mb-2">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                      <input 
                                        type="checkbox" 
                                        checked={enableNetwork}
                                        onChange={(e) => setEnableNetwork(e.target.checked)}
                                        className="w-4 h-4 rounded bg-slate-700 border-none accent-blue-500"
                                      />
                                      <span className="text-sm font-medium">Enable Networking</span>
                                  </label>
                                  <button onClick={() => setShowHelp(true)} className="text-slate-500 hover:text-white transition-colors">
                                      <HelpCircle size={16} />
                                  </button>
                              </div>
                              
                              {enableNetwork && (
                                  <div className="space-y-2 mt-2 animate-in slide-in-from-top-2">
                                      <label className="text-xs text-slate-500 block">Relay URL</label>
                                      <select 
                                        onChange={(e) => setNetworkRelayUrl(e.target.value)}
                                        value={PUBLIC_RELAYS.find(r => r.url === networkRelayUrl)?.url ? networkRelayUrl : 'custom'}
                                        className="w-full bg-black/30 border border-white/10 rounded p-2 text-xs focus:border-blue-500 outline-none mb-2"
                                      >
                                          {PUBLIC_RELAYS.map(r => (
                                              <option key={r.url} value={r.url}>{r.name}</option>
                                          ))}
                                          <option value="custom">Custom URL...</option>
                                      </select>
                                      
                                      {(!PUBLIC_RELAYS.find(r => r.url === networkRelayUrl) || networkRelayUrl === 'custom') && (
                                        <input 
                                            type="text" 
                                            value={networkRelayUrl === 'custom' ? '' : networkRelayUrl}
                                            onChange={(e) => setNetworkRelayUrl(e.target.value)}
                                            placeholder="wss://your-relay.com/"
                                            className="w-full bg-black/30 border border-white/10 rounded p-2 text-xs focus:border-blue-500 outline-none"
                                        />
                                      )}
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>

                  <button 
                    onClick={bootSystem}
                    disabled={activePreset === 'custom' && !customUrl}
                    className="w-full py-4 bg-green-600 hover:bg-green-500 rounded-lg font-bold text-lg shadow-lg shadow-green-900/20 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                      <Power size={24} /> Boot System
                  </button>
              </div>
          )}
          
          {/* Emulator Screen */}
          <div 
            ref={screenRef} 
            className={`w-full h-full flex items-center justify-center bg-black ${!isRunning ? 'hidden' : ''}`}
            onClick={() => { if(emulator) emulator.lock_mouse(); }}
          >
              <div className="whitespace-pre text-black bg-white font-mono" style={{ display: 'none' }}></div>
          </div>

          {/* Loading State */}
          {isLoading && (
               <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-50">
                   <div className="relative">
                       <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                       <div className="absolute inset-0 flex items-center justify-center">
                           <Cpu size={24} className="text-blue-500 animate-pulse" />
                       </div>
                   </div>
                   <div className="mt-4 font-mono text-blue-400">Initializing BIOS & Memory...</div>
                   <div className="text-xs text-slate-500 mt-2">Downloading disk image (cached)</div>
               </div>
          )}
      </div>
    </div>
  );
};
