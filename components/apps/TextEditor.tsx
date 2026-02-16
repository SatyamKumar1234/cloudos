
import React, { useState, useEffect, useRef } from 'react';
import { useOS } from '../../context/OSContext';
import { Save, Type, FileText, FolderOpen, Download, Upload, Search, X, ArrowUp, ArrowDown } from 'lucide-react';
import { FileSystemItem } from '../../types';

interface Props {
  fileId?: string;
}

export const TextEditor: React.FC<Props> = ({ fileId }) => {
  const { fileSystem, updateFileContent, createFile } = useOS();
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('Untitled.txt');
  const [status, setStatus] = useState('Ready');
  const [fontSize, setFontSize] = useState(14);
  const [fontFamily, setFontFamily] = useState('font-mono');
  
  // Search State
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchIndex, setSearchIndex] = useState(0);
  const [matches, setMatches] = useState<number[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (fileId) {
      const file = fileSystem.find(f => f.id === fileId);
      if (file) {
        setContent(file.content || '');
        setFileName(file.name);
      }
    }
  }, [fileId, fileSystem]);

  // Search Logic
  useEffect(() => {
    if (!searchQuery) {
        setMatches([]);
        setSearchIndex(0);
        return;
    }
    
    const indices: number[] = [];
    let pos = content.indexOf(searchQuery);
    while (pos !== -1) {
        indices.push(pos);
        pos = content.indexOf(searchQuery, pos + 1);
    }
    setMatches(indices);
    setSearchIndex(0);
  }, [searchQuery, content]);

  const highlightSelection = (idx: number) => {
      if (matches.length > 0 && textareaRef.current) {
          const pos = matches[idx];
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(pos, pos + searchQuery.length);
      }
  };

  const handleNextMatch = () => {
      if (matches.length === 0) return;
      const next = (searchIndex + 1) % matches.length;
      setSearchIndex(next);
      highlightSelection(next);
  };

  const handlePrevMatch = () => {
      if (matches.length === 0) return;
      const next = (searchIndex - 1 + matches.length) % matches.length;
      setSearchIndex(next);
      highlightSelection(next);
  };

  const handleSave = () => {
    if (fileId) {
      updateFileContent(fileId, content);
      setStatus('Saved at ' + new Date().toLocaleTimeString());
      setTimeout(() => setStatus('Ready'), 2000);
    } else {
      createFile('documents', fileName, 'text', content);
      setStatus('Saved new file to Documents');
    }
  };

  const handleDownload = () => {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              if (ev.target?.result) {
                  setContent(ev.target.result as string);
                  setFileName(file.name);
              }
          };
          reader.readAsText(file);
      }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 text-slate-200 relative">
      {/* Toolbar */}
      <div className="h-12 border-b border-slate-700 flex items-center px-4 bg-slate-800 justify-between shrink-0">
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-300">
                <FileText size={16} className="text-blue-400" />
                <input 
                    type="text" 
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 w-32 font-medium"
                />
            </div>
            
            <div className="h-6 w-px bg-slate-700" />

            <div className="flex items-center gap-2">
                <select 
                    value={fontSize} 
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="bg-slate-700 border-none rounded text-xs py-1 pr-6 pl-2 focus:ring-1 focus:ring-blue-500"
                >
                    <option value="12">12px</option>
                    <option value="14">14px</option>
                    <option value="16">16px</option>
                    <option value="18">18px</option>
                    <option value="24">24px</option>
                </select>

                <select 
                    value={fontFamily} 
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="bg-slate-700 border-none rounded text-xs py-1 pr-6 pl-2 focus:ring-1 focus:ring-blue-500"
                >
                    <option value="font-mono">Monospace</option>
                    <option value="font-sans">Sans Serif</option>
                    <option value="font-serif">Serif</option>
                </select>
            </div>
        </div>

        <div className="flex items-center gap-2">
            <button onClick={() => setShowSearch(!showSearch)} className={`p-1.5 rounded transition-colors ${showSearch ? 'bg-blue-600 text-white' : 'hover:bg-slate-700'}`} title="Find">
                <Search size={14} />
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="p-1.5 hover:bg-slate-700 rounded transition-colors" title="Open from PC">
                <Upload size={14} />
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleImport} />
            </button>
            <button onClick={handleDownload} className="p-1.5 hover:bg-slate-700 rounded transition-colors" title="Download to PC">
                <Download size={14} />
            </button>
            <button 
                onClick={handleSave}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs transition-colors shadow-sm ml-2"
            >
                <Save size={14} />
                Save
            </button>
        </div>
      </div>

      {/* Search Bar Overlay */}
      {showSearch && (
          <div className="absolute top-14 right-4 bg-slate-800 border border-slate-600 shadow-xl rounded-lg p-2 flex items-center gap-2 z-10 animate-in slide-in-from-top-2">
              <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Find..." 
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500 w-32"
                  autoFocus
              />
              <span className="text-xs text-slate-400 w-12 text-center">
                  {matches.length > 0 ? `${searchIndex + 1}/${matches.length}` : '0/0'}
              </span>
              <button onClick={handlePrevMatch} className="p-1 hover:bg-slate-700 rounded"><ArrowUp size={14}/></button>
              <button onClick={handleNextMatch} className="p-1 hover:bg-slate-700 rounded"><ArrowDown size={14}/></button>
              <button onClick={() => setShowSearch(false)} className="p-1 hover:bg-slate-700 rounded"><X size={14}/></button>
          </div>
      )}

      {/* Editor Area */}
      <textarea
        ref={textareaRef}
        className={`flex-1 w-full p-6 bg-[#1a1a1a] text-slate-200 focus:outline-none resize-none leading-relaxed selection:bg-blue-500/30 ${fontFamily}`}
        style={{ fontSize: `${fontSize}px` }}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        spellCheck={false}
        placeholder="Start typing..."
      />

      {/* Status Bar */}
      <div className="h-6 border-t border-slate-700 bg-slate-800 flex items-center px-4 text-[10px] text-slate-400 justify-between shrink-0 select-none">
        <div className="flex gap-4">
            <span>{content.length} chars</span>
            <span>{content.split('\n').length} lines</span>
        </div>
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${status === 'Ready' ? 'bg-green-500' : 'bg-yellow-500'}`} />
            {status}
        </div>
      </div>
    </div>
  );
};
