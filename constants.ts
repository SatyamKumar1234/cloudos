
import { FileText, Folder, Globe, Calculator, Settings, MonitorPlay, TerminalSquare, Gamepad2, Palette, Music, Clock, Code2, Camera, Calendar, Trash2, Skull, Cpu, BrainCircuit, Image as ImageIcon } from 'lucide-react';
import { AppConfig, FileSystemItem, AppId } from './types';

export const APPS: Record<AppId, AppConfig> = {
  'file-manager': {
    id: 'file-manager',
    name: 'Files',
    icon: Folder,
    defaultWidth: 800,
    defaultHeight: 550,
  },
  'text-editor': {
    id: 'text-editor',
    name: 'Notes',
    icon: FileText,
    defaultWidth: 600,
    defaultHeight: 450,
  },
  'code-editor': {
    id: 'code-editor',
    name: 'Code',
    icon: Code2,
    defaultWidth: 900,
    defaultHeight: 600,
  },
  'browser': {
    id: 'browser',
    name: 'Web',
    icon: Globe,
    defaultWidth: 1000,
    defaultHeight: 650,
  },
  'v86': {
    id: 'v86',
    name: 'Linux VM',
    icon: Cpu,
    defaultWidth: 800,
    defaultHeight: 600,
  },
  'ai-runner': {
    id: 'ai-runner',
    name: 'AI Runner',
    icon: BrainCircuit,
    defaultWidth: 450,
    defaultHeight: 650,
  },
  'image-viewer': {
    id: 'image-viewer',
    name: 'Photos',
    icon: ImageIcon,
    defaultWidth: 600,
    defaultHeight: 500,
  },
  'doom': {
    id: 'doom',
    name: 'Doom',
    icon: Skull,
    defaultWidth: 660,
    defaultHeight: 440,
  },
  'paint': {
    id: 'paint',
    name: 'Canvas',
    icon: Palette,
    defaultWidth: 800,
    defaultHeight: 600,
  },
  'music': {
    id: 'music',
    name: 'Groove',
    icon: Music,
    defaultWidth: 350,
    defaultHeight: 500,
  },
  'video-player': {
    id: 'video-player',
    name: 'Player',
    icon: MonitorPlay,
    defaultWidth: 800,
    defaultHeight: 500,
  },
  'camera': {
    id: 'camera',
    name: 'Camera',
    icon: Camera,
    defaultWidth: 700,
    defaultHeight: 520,
  },
  'calendar': {
    id: 'calendar',
    name: 'Calendar',
    icon: Calendar,
    defaultWidth: 800,
    defaultHeight: 600,
  },
  'clock': {
    id: 'clock',
    name: 'Time',
    icon: Clock,
    defaultWidth: 300,
    defaultHeight: 450,
  },
  'calculator': {
    id: 'calculator',
    name: 'Calc',
    icon: Calculator,
    defaultWidth: 320,
    defaultHeight: 480,
  },
  'settings': {
    id: 'settings',
    name: 'Settings',
    icon: Settings,
    defaultWidth: 700,
    defaultHeight: 500,
  },
  'terminal': {
    id: 'terminal',
    name: 'Term',
    icon: TerminalSquare,
    defaultWidth: 600,
    defaultHeight: 400,
  },
  'tictactoe': {
    id: 'tictactoe',
    name: 'Games',
    icon: Gamepad2,
    defaultWidth: 340,
    defaultHeight: 440,
  }
};

const now = Date.now();

export const INITIAL_FS: FileSystemItem[] = [
  // Root folders
  { id: 'root', parentId: null, name: 'root', type: 'folder', createdAt: now, modifiedAt: now },
  { id: 'desktop', parentId: 'root', name: 'Desktop', type: 'folder', createdAt: now, modifiedAt: now },
  { id: 'documents', parentId: 'root', name: 'Documents', type: 'folder', createdAt: now, modifiedAt: now },
  { id: 'downloads', parentId: 'root', name: 'Downloads', type: 'folder', createdAt: now, modifiedAt: now },
  { id: 'pictures', parentId: 'root', name: 'Pictures', type: 'folder', createdAt: now, modifiedAt: now },
  { id: 'codes', parentId: 'root', name: 'Codes', type: 'folder', createdAt: now, modifiedAt: now },
  { id: 'recycle-bin', parentId: 'root', name: 'Recycle Bin', type: 'folder', createdAt: now, modifiedAt: now },
  
  // Desktop Items
  { id: 'welcome', parentId: 'desktop', name: 'Read Me.txt', type: 'text', content: 'Welcome to CloudOS Pro!\n\nNew Features:\n- Drag & Drop GGUF files to run Local AI!\n- Improved window snapping\n- Photo Viewer\n\nEnjoy!', createdAt: now, modifiedAt: now },
  
  // Documents
  { id: 'project', parentId: 'documents', name: 'Project Plans.txt', type: 'text', content: '# Q4 Goals\n1. Launch CloudOS v3\n2. Add multiplayer games\n3. Implement dark mode', createdAt: now, modifiedAt: now },
  
  // Codes (Default Files)
  { id: 'web-demo', parentId: 'codes', name: 'index.html', type: 'text', content: '<!DOCTYPE html>\n<html>\n<style>\n  body { background: linear-gradient(to right, #4facfe, #00f2fe); color: white; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }\n  .card { background: rgba(255,255,255,0.2); padding: 40px; border-radius: 20px; backdrop-filter: blur(10px); box-shadow: 0 10px 30px rgba(0,0,0,0.2); text-align: center; }\n  button { padding: 10px 20px; border: none; border-radius: 5px; background: white; color: #333; cursor: pointer; font-weight: bold; margin-top: 20px; }\n  button:hover { transform: scale(1.05); }\n</style>\n<body>\n  <div class="card">\n    <h1>CloudOS Browser Preview</h1>\n    <p>This page is running from your virtual file system!</p>\n    <button onclick="alert(\'JavaScript Works!\')">Test Button</button>\n  </div>\n</body>\n</html>', createdAt: now, modifiedAt: now },
  { id: 'script', parentId: 'codes', name: 'hello.js', type: 'text', content: 'console.log("Hello World");\n\nfunction greet(name) {\n  return `Hello ${name}!`;\n}', createdAt: now, modifiedAt: now },
  { id: 'pyscript', parentId: 'codes', name: 'calc.py', type: 'text', content: 'def add(a, b):\n    return a + b\n\nprint(f"5 + 10 = {add(5, 10)}")\nprint("Python is running in the browser!")', createdAt: now, modifiedAt: now },
];
