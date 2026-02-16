
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WindowState, FileSystemItem, Theme, AppId } from '../types';
import { INITIAL_FS, APPS } from '../constants';

interface OSContextType {
  windows: WindowState[];
  activeWindowId: string | null;
  fileSystem: FileSystemItem[];
  theme: Theme;
  userName: string;
  setUserName: (name: string) => void;
  openWindow: (appId: AppId, data?: any) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindowPosition: (id: string, x: number, y: number) => void;
  updateWindowSize: (id: string, width: number, height: number) => void;
  
  // File System
  createFile: (parentId: string, name: string, type: FileSystemItem['type'], content?: string) => string;
  updateFileContent: (id: string, content: string) => void;
  updateFile: (id: string, updates: Partial<FileSystemItem>) => void;
  deleteFile: (id: string) => void;
  
  // Theme
  setTheme: (theme: Partial<Theme>) => void;
}

const OSContext = createContext<OSContextType | undefined>(undefined);

export const OSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // --- Window Management ---
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [nextZIndex, setNextZIndex] = useState(10);
  const [userName, setUserName] = useState('Cloud User');

  // --- File System ---
  const [fileSystem, setFileSystem] = useState<FileSystemItem[]>(() => {
    try {
      const saved = localStorage.getItem('cloudos-fs');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error("Failed to load file system from storage, resetting:", error);
    }
    return INITIAL_FS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('cloudos-fs', JSON.stringify(fileSystem));
    } catch (error) {
      console.error("Failed to save file system:", error);
    }
  }, [fileSystem]);

  // --- Theme ---
  const [theme, setThemeState] = useState<Theme>({
    background: 'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?auto=format&fit=crop&q=80&w=3270&ixlib=rb-4.0.3',
    accentColor: '#3b82f6',
    darkMode: true,
  });

  const setTheme = (newTheme: Partial<Theme>) => {
    setThemeState(prev => ({ ...prev, ...newTheme }));
  };

  // --- Actions ---

  const focusWindow = useCallback((id: string) => {
    setActiveWindowId(id);
    setWindows(prev => prev.map(w => {
      if (w.id === id) {
        return { ...w, zIndex: nextZIndex, isMinimized: false };
      }
      return w;
    }));
    setNextZIndex(prev => prev + 1);
  }, [nextZIndex]);

  const openWindow = useCallback((appId: AppId, data?: any) => {
    // Check if window is already open for single-instance apps or specific files
    const existing = windows.find(w => w.appId === appId && (data?.fileId ? w.data?.fileId === data.fileId : true));
    
    // For browser/files, we might allow multiple, but let's focus existing for now if it's the same app to keep it simple
    // Exception: text-editor with specific file
    
    if (existing && appId !== 'browser' && appId !== 'file-manager') {
       focusWindow(existing.id);
       return;
    }

    const config = APPS[appId];
    if (!config) return;

    const newWindow: WindowState = {
      id: Math.random().toString(36).substr(2, 9),
      appId,
      title: config.name,
      x: 100 + (windows.length * 30),
      y: 50 + (windows.length * 30),
      width: config.defaultWidth,
      height: config.defaultHeight,
      isMinimized: false,
      isMaximized: false,
      zIndex: nextZIndex,
      data,
    };
    
    setWindows(prev => [...prev, newWindow]);
    setNextZIndex(prev => prev + 1);
    setActiveWindowId(newWindow.id);
  }, [windows, nextZIndex, focusWindow]);

  const closeWindow = useCallback((id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
    if (activeWindowId === id) {
      setActiveWindowId(null);
    }
  }, [activeWindowId]);

  const minimizeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: true } : w));
    if (activeWindowId === id) setActiveWindowId(null);
  }, [activeWindowId]);

  const maximizeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMaximized: !w.isMaximized } : w));
    focusWindow(id);
  }, [focusWindow]);

  const updateWindowPosition = useCallback((id: string, x: number, y: number) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, x, y } : w));
  }, []);

  const updateWindowSize = useCallback((id: string, width: number, height: number) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, width, height } : w));
  }, []);

  // --- FS Actions ---

  const createFile = useCallback((parentId: string, name: string, type: FileSystemItem['type'], content: string = '') => {
    const id = Math.random().toString(36).substr(2, 9);
    const newItem: FileSystemItem = {
      id,
      parentId,
      name,
      type,
      content,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    };
    setFileSystem(prev => [...prev, newItem]);
    return id;
  }, []);

  const updateFileContent = useCallback((id: string, content: string) => {
    setFileSystem(prev => prev.map(item => 
      item.id === id ? { ...item, content, modifiedAt: Date.now() } : item
    ));
  }, []);

  const updateFile = useCallback((id: string, updates: Partial<FileSystemItem>) => {
    setFileSystem(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates, modifiedAt: Date.now() } : item
    ));
  }, []);

  const deleteFile = useCallback((id: string) => {
    setFileSystem(prev => {
        const itemToDelete = prev.find(i => i.id === id);
        if (!itemToDelete) return prev;

        // If already in recycle bin, permanently delete
        if (itemToDelete.parentId === 'recycle-bin') {
             // Recursive delete helper
            const getIdsToDelete = (rootId: string, fs: FileSystemItem[]): string[] => {
                const children = fs.filter(item => item.parentId === rootId);
                let ids = [rootId];
                children.forEach(child => {
                    ids = [...ids, ...getIdsToDelete(child.id, fs)];
                });
                return ids;
            };

            const idsToDelete = getIdsToDelete(id, prev);
            return prev.filter(item => !idsToDelete.includes(item.id));
        } else {
            // Move to Recycle Bin
            return prev.map(item => 
              item.id === id ? { ...item, parentId: 'recycle-bin', modifiedAt: Date.now() } : item
            );
        }
    });
  }, []);

  return (
    <OSContext.Provider value={{
      windows,
      activeWindowId,
      fileSystem,
      theme,
      userName,
      setUserName,
      openWindow,
      closeWindow,
      minimizeWindow,
      maximizeWindow,
      focusWindow,
      updateWindowPosition,
      updateWindowSize,
      createFile,
      updateFileContent,
      updateFile,
      deleteFile,
      setTheme,
    }}>
      {children}
    </OSContext.Provider>
  );
};

export const useOS = () => {
  const context = useContext(OSContext);
  if (!context) throw new Error("useOS must be used within OSProvider");
  return context;
};
