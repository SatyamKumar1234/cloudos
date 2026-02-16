
import { LucideIcon } from 'lucide-react';

export type AppId = 'file-manager' | 'text-editor' | 'calculator' | 'browser' | 'settings' | 'video-player' | 'terminal' | 'tictactoe' | 'paint' | 'music' | 'clock' | 'code-editor' | 'camera' | 'calendar' | 'doom' | 'v86' | 'ai-runner' | 'image-viewer';

export interface AppConfig {
  id: AppId;
  name: string;
  icon: LucideIcon;
  defaultWidth: number;
  defaultHeight: number;
}

export interface WindowState {
  id: string;
  appId: AppId;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  data?: any; // For opening specific files
}

export type FileType = 'folder' | 'text' | 'image' | 'audio' | 'video' | 'app' | 'unknown';

export interface FileSystemItem {
  id: string;
  parentId: string | null;
  name: string;
  type: FileType;
  content?: string; // For text files or base64 data
  createdAt: number;
  modifiedAt: number;
  position?: { x: number, y: number }; // For Desktop icons
}

export interface Theme {
  background: string; // url or hex
  accentColor: string;
  darkMode: boolean;
}
