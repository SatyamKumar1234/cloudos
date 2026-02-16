
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Files, Search, GitGraph, Play, Settings as SettingsIcon, Menu, Terminal, Plus, X, Upload, Download, Save } from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { FileSystemItem } from '../../types';

declare global {
  interface Window {
    loadPyodide: any;
  }
}

export const CodeEditor: React.FC = () => {
  const { fileSystem, updateFileContent, createFile, openWindow } = useOS();
  
  // Filter for text files specifically in the 'codes' folder
  const textFiles = useMemo(() => {
    return fileSystem.filter(f => f.type === 'text' && f.parentId === 'codes');
  }, [fileSystem]);

  const [activeFileId, setActiveFileId] = useState<string | null>(textFiles.length > 0 ? textFiles[0].id : null);
  const [output, setOutput] = useState<string[]>(['Ready to run.']);
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [pyodide, setPyodide] = useState<any>(null);
  const [isLoadingPyodide, setIsLoadingPyodide] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [wordWrap, setWordWrap] = useState(false);
  
  // Modal State
  const [showNewFile, setShowNewFile] = useState(false);
  const [newFileName, setNewFileName] = useState('untitled.js');
  
  // Local state for editing content before saving
  const [localContent, setLocalContent] = useState('');
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeFile = textFiles.find(f => f.id === activeFileId);

  // Sync local content when active file changes
  useEffect(() => {
      if (activeFile) {
          setLocalContent(activeFile.content || '');
      } else {
          setLocalContent('');
      }
  }, [activeFileId, activeFile]);

  // Load Pyodide
  useEffect(() => {
    if (!document.getElementById('pyodide-script')) {
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js";
        script.id = 'pyodide-script';
        script.onload = () => {
             initPyodide();
        };
        document.body.appendChild(script);
    } else if (window.loadPyodide && !pyodide) {
        initPyodide();
    }
  }, []);

  const initPyodide = async () => {
    if (pyodide || isLoadingPyodide) return;
    setIsLoadingPyodide(true);
    try {
        const py = await window.loadPyodide();
        setPyodide(py);
        setOutput(prev => [...prev, '> Python runtime loaded successfully.']);
    } catch (e) {
        console.error("Failed to load pyodide", e);
        setOutput(prev => [...prev, '> Error loading Python runtime.']);
    }
    setIsLoadingPyodide(false);
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  const handleContentChange = (newContent: string) => {
    setLocalContent(newContent);
  };
  
  const handleSave = () => {
      if (activeFileId) {
          updateFileContent(activeFileId, localContent);
          setOutput(prev => [...prev, `> Saved ${activeFile?.name}`]);
      }
  };

  const confirmCreateFile = () => {
    if (newFileName.trim()) {
      createFile('codes', newFileName.trim(), 'text', '');
      setOutput(prev => [...prev, `> Created ${newFileName} in Codes folder`]);
      setShowNewFile(false);
      setNewFileName('untitled.js');
    }
  };

  const closeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveFileId(null);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
          const content = ev.target?.result as string;
          // IMPORTANT: Save to 'codes' folder
          createFile('codes', file.name, 'text', content);
          setOutput(prev => [...prev, `> Imported ${file.name} to Codes folder`]);
      };
      reader.readAsText(file);
  };

  const handleExport = () => {
      if (!activeFile) return;
      const blob = new Blob([localContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = activeFile.name;
      link.click();
      URL.revokeObjectURL(url);
  };

  const runCode = async () => {
    setIsTerminalOpen(true);
    if (!activeFile) return;
    handleSave(); // Save before running

    const ext = activeFile.name.split('.').pop()?.toLowerCase();

    if (ext === 'html') {
        const finalHtml = localContent; 
        openWindow('browser', { htmlContent: finalHtml, title: activeFile.name });
        setOutput(prev => [...prev, `> Opening ${activeFile.name} in Browser...`]);
        return;
    }

    if (ext === 'py') {
        if (!pyodide) {
            setOutput(['> Python runtime is still loading... please wait.']);
            return;
        }
        setOutput(['> Running python script...']);
        
        pyodide.setStdout({ batched: (msg: string) => {
             setOutput(prev => [...prev, msg]);
        }});

        try {
            await pyodide.runPythonAsync(localContent);
        } catch (err: any) {
             setOutput(prev => [...prev, `Error: ${err.message}`]);
        }
        return;
    }

    if (ext === 'js') {
        setOutput(['> Running javascript...']);
        
        const originalLog = console.log;
        const originalError = console.error;

        console.log = (...args) => {
            const line = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
            setOutput(prev => [...prev, line]);
        };

        console.error = (...args) => {
            const line = '[Error] ' + args.join(' ');
            setOutput(prev => [...prev, line]);
        };

        try {
            // eslint-disable-next-line no-new-func
            const run = new Function(localContent);
            run();
        } catch (err: any) {
            console.error(err.message);
        } finally {
            console.log = originalLog;
            console.error = originalError;
        }
        return;
    }

    setOutput(prev => [...prev, `> Running .${ext} files is not supported locally.`]);
  };

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current && preRef.current) {
        const scrollTop = textareaRef.current.scrollTop;
        const scrollLeft = textareaRef.current.scrollLeft;
        
        lineNumbersRef.current.scrollTop = scrollTop;
        preRef.current.scrollTop = scrollTop;
        preRef.current.scrollLeft = scrollLeft;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      
      const newValue = localContent.substring(0, start) + "    " + localContent.substring(end);
      handleContentChange(newValue);
      
      setTimeout(() => {
          if (textareaRef.current) {
              textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
          }
      }, 0);
    }
    
    // Ctrl + S
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
    }
  };

  const highlightCode = (code: string) => {
    if (!code) return '';
    
    let escaped = code.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    // Basic Highlighting
    escaped = escaped.replace(/(&quot;.*?&quot;|&#039;.*?&#039;)/g, '<span class="text-orange-300">$1</span>');
    const keywords = /\b(const|let|var|function|return|if|else|for|while|import|from|class|export|default|async|await|try|catch|def|print|import|class|return)\b/g;
    escaped = escaped.replace(keywords, '<span class="text-purple-400 font-bold">$1</span>');
    escaped = escaped.replace(/\b(true|false|null|undefined|\d+)\b/g, '<span class="text-blue-400">$1</span>');
    escaped = escaped.replace(/(\/\/.*$)/gm, '<span class="text-green-600">$1</span>');
    
    return escaped;
  };

  const lines = localContent.split('\n');

  const getLangLabel = (name: string) => {
      if(name.endsWith('.js')) return 'JS';
      if(name.endsWith('.ts')) return 'TS';
      if(name.endsWith('.html')) return 'HTML';
      if(name.endsWith('.css')) return 'CSS';
      if(name.endsWith('.py')) return 'PY';
      return 'TXT';
  };
  
  const getLangColor = (name: string) => {
      if(name.endsWith('.js')) return 'text-yellow-400';
      if(name.endsWith('.html')) return 'text-orange-400';
      if(name.endsWith('.css')) return 'text-blue-400';
      if(name.endsWith('.py')) return 'text-blue-300';
      return 'text-slate-400';
  }

  return (
    <div className="h-full flex bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm overflow-hidden relative">
      
      {/* Settings Modal */}
      {showSettings && (
          <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm" onClick={() => setShowSettings(false)}>
              <div className="bg-[#252526] p-6 rounded-xl border border-white/10 w-80 shadow-2xl" onClick={e => e.stopPropagation()}>
                  <h2 className="text-white text-lg font-bold mb-4 flex items-center gap-2"><SettingsIcon size={18} /> Editor Settings</h2>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs text-slate-400 mb-1">Font Size ({fontSize}px)</label>
                          <input type="range" min="10" max="24" value={fontSize} onChange={e => setFontSize(parseInt(e.target.value))} className="w-full accent-blue-500" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                          <label className="text-sm text-slate-200">Word Wrap</label>
                          <input type="checkbox" checked={wordWrap} onChange={e => setWordWrap(e.target.checked)} className="accent-blue-500 w-4 h-4" />
                      </div>
                  </div>

                  <button onClick={() => setShowSettings(false)} className="mt-6 w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors">Close</button>
              </div>
          </div>
      )}

      {/* New File Modal */}
      {showNewFile && (
          <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm" onClick={() => setShowNewFile(false)}>
              <div className="bg-[#252526] p-6 rounded-xl border border-white/10 w-80 shadow-2xl" onClick={e => e.stopPropagation()}>
                  <h2 className="text-white text-lg font-bold mb-4">New File</h2>
                  
                  <div className="mb-4">
                      <label className="block text-xs text-slate-400 mb-1">Filename</label>
                      <input 
                        type="text" 
                        value={newFileName} 
                        onChange={e => setNewFileName(e.target.value)} 
                        className="w-full bg-black/50 border border-white/10 rounded px-2 py-1.5 text-white outline-none focus:border-blue-500"
                        onKeyDown={e => e.key === 'Enter' && confirmCreateFile()}
                        autoFocus
                      />
                  </div>

                  <div className="flex justify-end gap-2">
                      <button onClick={() => setShowNewFile(false)} className="px-3 py-1.5 rounded text-white hover:bg-white/10">Cancel</button>
                      <button onClick={confirmCreateFile} className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-500">Create</button>
                  </div>
              </div>
          </div>
      )}

      {/* Activity Bar */}
      <div className="w-12 bg-[#333333] flex flex-col items-center py-2 gap-4 text-[#858585] border-r border-[#1e1e1e]">
        <button className="p-2 text-white border-l-2 border-white"><Files size={24} /></button>
        <button className="p-2 hover:text-white" onClick={() => fileInputRef.current?.click()} title="Import File"><Upload size={24} /></button>
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleImport} />
        <button className="p-2 hover:text-white" onClick={handleExport} title="Download File"><Download size={24} /></button>
        <div className="mt-auto flex flex-col gap-4 pb-2">
             <button className="p-2 hover:text-white" onClick={() => setShowSettings(true)}><SettingsIcon size={24} /></button>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-48 bg-[#252526] flex flex-col border-r border-black/20">
        <div className="h-9 flex items-center justify-between px-4 text-xs font-bold uppercase tracking-wide text-[#bbbbbb] bg-[#252526]">
            <span>Code Files</span>
            <button onClick={() => setShowNewFile(true)} className="hover:bg-white/10 p-1 rounded" title="New File"><Plus size={14}/></button>
        </div>
        <div className="flex-1 overflow-y-auto">
            <div className="px-2 py-1 text-[#e7e7e7] font-bold text-xs bg-[#37373d] flex items-center gap-1">
                <Menu size={10} /> WORKSPACE
            </div>
            <div className="flex flex-col mt-1">
                {textFiles.length === 0 ? (
                    <div className="p-4 text-xs text-[#666] italic text-center">No files in "Codes" folder</div>
                ) : (
                    textFiles.map((file) => (
                        <div 
                            key={file.id}
                            onClick={() => setActiveFileId(file.id)}
                            className={`px-4 py-1 cursor-pointer flex items-center gap-2 text-[#d4d4d4] border-l-2 ${activeFileId === file.id ? 'bg-[#37373d] border-blue-400' : 'hover:bg-[#2a2d2e] border-transparent'}`}
                        >
                            <span className={`font-bold text-[10px] w-6 ${getLangColor(file.name)}`}>
                                {getLangLabel(file.name)}
                            </span> 
                            <span className="truncate">{file.name}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 flex flex-col bg-[#1e1e1e] min-w-0">
        
        {/* Tabs */}
        {activeFile ? (
            <>
                <div className="h-9 bg-[#252526] flex items-center overflow-x-auto custom-scrollbar border-b border-black/10 shrink-0">
                    <div 
                        className={`
                            px-3 py-2 text-xs flex items-center gap-2 border-r border-black/20 cursor-pointer min-w-[120px] max-w-[200px] group relative bg-[#1e1e1e] text-white border-t-2 border-t-blue-500
                        `}
                    >
                        <span className={getLangColor(activeFile.name)}>
                            {getLangLabel(activeFile.name)}
                        </span>
                        <span className="truncate flex-1">{activeFile.name}</span>
                        <button 
                            onClick={closeFile}
                            className={`opacity-0 group-hover:opacity-100 hover:bg-white/20 rounded p-0.5`}
                        >
                            <X size={12} />
                        </button>
                    </div>
                    
                    <div className="ml-auto flex items-center px-2 gap-2">
                        <button onClick={handleSave} className="p-1.5 hover:bg-white/10 rounded text-slate-300" title="Save (Ctrl+S)">
                            <Save size={14} />
                        </button>
                        {activeFile.name.endsWith('.py') && !pyodide && (
                             <span className="text-xs text-yellow-500 animate-pulse mr-2">Loading Python...</span>
                        )}
                        <button 
                            onClick={runCode}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded-sm transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={activeFile.name.endsWith('.py') && !pyodide}
                        >
                            <Play size={12} fill="currentColor" /> Run
                        </button>
                    </div>
                </div>

                {/* Breadcrumbs */}
                <div className="h-6 flex items-center px-4 text-xs text-[#a9a9a9] gap-2 bg-[#1e1e1e] border-b border-white/5 shrink-0">
                    <span>Codes</span> <span>›</span> <span>{activeFile.name}</span>
                </div>

                {/* Editor Area */}
                <div className="flex-1 relative flex overflow-hidden">
                    {/* Line Numbers */}
                    <div 
                        ref={lineNumbersRef}
                        className="w-12 text-right pr-4 pt-4 text-[#858585] select-none bg-[#1e1e1e] leading-6 font-mono overflow-hidden"
                        style={{ fontSize: `${fontSize}px` }}
                    >
                        {lines.map((_, i) => (
                            <div key={i}>{i + 1}</div>
                        ))}
                    </div>
                    
                    {/* Code Container */}
                    <div className="flex-1 relative overflow-hidden">
                        {/* Syntax Highlight Overlay */}
                        <pre
                            ref={preRef}
                            className="absolute inset-0 m-0 p-4 pl-0 pointer-events-none whitespace-pre leading-6 font-mono"
                            style={{ 
                                fontSize: `${fontSize}px`, 
                                tabSize: 4,
                                whiteSpace: wordWrap ? 'pre-wrap' : 'pre'
                            }}
                            dangerouslySetInnerHTML={{ __html: highlightCode(localContent) }}
                        />

                        {/* Input Area */}
                        <textarea 
                            ref={textareaRef}
                            value={localContent}
                            onChange={(e) => handleContentChange(e.target.value)}
                            onScroll={handleScroll}
                            onKeyDown={handleKeyDown}
                            className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-white p-4 pl-0 outline-none resize-none leading-6 font-mono"
                            style={{ 
                                fontSize: `${fontSize}px`, 
                                tabSize: 4,
                                whiteSpace: wordWrap ? 'pre-wrap' : 'pre'
                            }}
                            spellCheck={false}
                            autoCapitalize="off"
                            autoComplete="off"
                        />
                    </div>
                </div>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[#555]">
                <div className="mb-4">Select a file from the explorer or create a new one.</div>
                <button onClick={() => setShowNewFile(true)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500">Create New File</button>
            </div>
        )}

        {/* Output Panel */}
        {isTerminalOpen && (
            <div className="h-48 border-t border-white/10 bg-[#1e1e1e] flex flex-col transition-all duration-300 shrink-0">
                <div className="h-8 flex items-center justify-between px-4 border-b border-white/5 bg-[#252526]">
                    <div className="flex gap-4 text-xs uppercase font-bold tracking-wide text-[#bbbbbb]">
                        <span className="cursor-pointer text-white border-b border-white py-2">
                           Console
                        </span>
                        <span className="cursor-pointer hover:text-white py-2">Problems</span>
                    </div>
                    <div className="flex items-center gap-2">
                         <button onClick={() => setOutput([])} className="p-1 hover:bg-white/10 rounded" title="Clear">
                            <X size={12} />
                         </button>
                         <button onClick={() => setIsTerminalOpen(false)} className="p-1 hover:bg-white/10 rounded">
                            <X size={14} />
                         </button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-hidden relative">
                    <div ref={terminalRef} className="h-full p-3 overflow-y-auto font-mono text-xs custom-scrollbar">
                        {output.map((line, i) => (
                            <div key={i} className={`${line.startsWith('[Error]') || line.startsWith('Error:') ? 'text-red-400' : line.startsWith('>') ? 'text-blue-400' : 'text-[#d4d4d4]'} mb-1 whitespace-pre-wrap`}>
                                {line}
                            </div>
                        ))}
                        <div className="flex items-center text-blue-400 mt-2">
                            <span>➜</span>
                            <span className="ml-2 text-[#d4d4d4] animate-pulse">_</span>
                        </div>
                    </div>
                </div>
            </div>
        )}
        
        {/* Status Bar */}
        <div className="h-6 bg-[#007acc] text-white text-xs flex items-center px-3 gap-4 justify-end select-none shrink-0 z-10">
            <button onClick={() => setIsTerminalOpen(!isTerminalOpen)} className="mr-auto hover:bg-white/20 px-2 rounded flex items-center gap-2">
                <Terminal size={12} /> {isTerminalOpen ? 'Hide Panel' : 'Show Panel'}
            </button>
            <div className="hover:bg-white/20 px-1 rounded cursor-pointer">Ln {lines.length}, Col {lines[lines.length-1].length}</div>
            <div className="hover:bg-white/20 px-1 rounded cursor-pointer">UTF-8</div>
            <div className="hover:bg-white/20 px-1 rounded cursor-pointer">
                {activeFile ? getLangLabel(activeFile.name) : 'None'}
            </div>
        </div>
      </div>
    </div>
  );
};
