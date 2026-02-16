
import React, { useState, useRef, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { getChildren } from '../../utils/fs';

declare global {
  interface Window {
    loadPyodide: any;
  }
}

const ASCII_ART = [
  "   ____ _                 _  ___  ____  ",
  "  / ___| | ___  _   _  __| |/ _ \\/ ___| ",
  " | |   | |/ _ \\| | | |/ _` | | | \\___ \\ ",
  " | |___| | (_) | |_| | (_| | |_| |___) |",
  "  \\____|_|\\___/ \\__,_|\\__,_|\\___/|____/ ",
  "                                        ",
  " CloudOS v2.4 (WebAssembly Edition)     ",
  " Type 'help' for a list of commands.    ",
];

export const Terminal: React.FC = () => {
  const { fileSystem, createFile, deleteFile, openWindow } = useOS();
  const [history, setHistory] = useState<string[]>(ASCII_ART);
  const [input, setInput] = useState('');
  const [pyodide, setPyodide] = useState<any>(null);
  const [isLoadingPyodide, setIsLoadingPyodide] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  // Load Pyodide on mount
  useEffect(() => {
    const initPy = async () => {
        if (window.loadPyodide && !pyodide && !isLoadingPyodide) {
            setIsLoadingPyodide(true);
            try {
                const py = await window.loadPyodide();
                setPyodide(py);
                // Redirect python stdout to terminal
                py.setStdout({ batched: (msg: string) => {
                     setHistory(prev => [...prev, msg]);
                }});
            } catch (e) {
                console.error("Pyodide failed to load in terminal", e);
            }
            setIsLoadingPyodide(false);
        }
    };
    initPy();
  }, [pyodide, isLoadingPyodide]);

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const cmd = input.trim();
    const args = cmd.split(' ');
    const command = args[0].toLowerCase();
    
    setHistory(prev => [...prev, `user@cloudos:~$ ${cmd}`]);

    switch (command) {
      case 'help':
        setHistory(prev => [...prev, 
          'System Commands:',
          '  ls          List directory contents',
          '  clear       Clear terminal output',
          '  whoami      Print current user',
          '  date        Print current date',
          '  mkdir <name> Create a folder on Desktop',
          '  echo <msg>  Print a message',
          '',
          'Apps:',
          '  files       Open File Manager',
          '  editor      Open Text Editor',
          '  browser     Open Web Browser',
          '  calc        Open Calculator',
          '  paint       Open Canvas',
          '  code        Open Code Editor',
          '  camera      Open Camera',
          '  vm          Open Linux VM',
          '  doom        Run Doom',
          '',
          'Runtime:',
          '  python      Execute python code',
        ]);
        break;
      case 'ls':
        // For simplicity in this demo, ls always lists desktop
        const files = getChildren(fileSystem, 'desktop');
        const fileNames = files.map(f => f.type === 'folder' ? `[${f.name}]` : f.name).join('  ');
        setHistory(prev => [...prev, 'Listing Desktop/ ...', fileNames || '(empty)']);
        break;
      case 'clear':
        setHistory(ASCII_ART);
        break;
      case 'whoami':
        setHistory(prev => [...prev, 'user (admin)']);
        break;
      case 'date':
        setHistory(prev => [...prev, new Date().toString()]);
        break;
      case 'echo':
        setHistory(prev => [...prev, args.slice(1).join(' ')]);
        break;
      case 'mkdir':
        if (args[1]) {
            createFile('desktop', args[1], 'folder');
            setHistory(prev => [...prev, `Created directory: ${args[1]} on Desktop`]);
        } else {
            setHistory(prev => [...prev, 'Error: missing directory name']);
        }
        break;
      
      // App Launchers
      case 'files': openWindow('file-manager'); break;
      case 'editor': openWindow('text-editor'); break;
      case 'browser': openWindow('browser'); break;
      case 'calc': openWindow('calculator'); break;
      case 'paint': openWindow('paint'); break;
      case 'code': openWindow('code-editor'); break;
      case 'camera': openWindow('camera'); break;
      case 'vm': openWindow('v86'); break;
      case 'doom': openWindow('doom'); break;

      case 'python':
      case 'python3':
        if (!pyodide) {
             if (isLoadingPyodide) {
                 setHistory(prev => [...prev, 'Python is still loading (WASM)... please wait.']);
             } else {
                 setHistory(prev => [...prev, 'Python runtime not available.']);
             }
        } else {
             const code = args.slice(1).join(' ');
             if (!code) {
                  setHistory(prev => [...prev, 'Usage: python <code_string>']);
                  setHistory(prev => [...prev, 'Example: python print(1+1)']);
             } else {
                 try {
                     await pyodide.runPythonAsync(code);
                 } catch (err: any) {
                     setHistory(prev => [...prev, `Traceback (most recent call last):\n${err.message}`]);
                 }
             }
        }
        break;
      default:
        setHistory(prev => [...prev, `Command not found: ${command}`]);
    }

    setInput('');
  };

  return (
    <div className="h-full bg-[#0c0c0c] text-cyan-300 font-mono text-sm p-4 flex flex-col overflow-hidden shadow-inner" onClick={() => document.getElementById('term-input')?.focus()}>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {history.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap mb-1 leading-snug">{line}</div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleCommand} className="flex items-center gap-2 mt-2 border-t border-cyan-900/30 pt-2">
        <span className="text-pink-400 font-bold">user@cloudos:~$</span>
        <input 
          id="term-input"
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-cyan-200 focus:ring-0 placeholder-cyan-900/50"
          autoFocus
          autoComplete="off"
          placeholder="Type 'help'..."
        />
      </form>
    </div>
  );
};
