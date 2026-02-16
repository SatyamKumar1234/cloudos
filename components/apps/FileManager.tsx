
import React, { useState, useRef, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { getChildren, getPath, formatSize, getUniqueName, processFileEntry, detectFileType } from '../../utils/fs';
import { FileSystemItem } from '../../types';
import { Folder, FileText, ArrowLeft, ArrowUp, Home, Search, LayoutGrid, List, File, Image, Music, Video, FolderPlus, Trash2, Edit2, Info, ExternalLink, RefreshCw, Upload, UploadCloud, FileQuestion, X } from 'lucide-react';
import { ContextMenu, ContextMenuItem } from '../ui/ContextMenu';

interface Props {
  initialPath?: string;
}

export const FileManager: React.FC<Props> = ({ initialPath = 'root' }) => {
  const { fileSystem, openWindow, updateFile, createFile, deleteFile } = useOS();
  const [currentPathId, setCurrentPathId] = useState(initialPath);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDraggingExternal, setIsDraggingExternal] = useState(false);
  const [showProperties, setShowProperties] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [contextMenu, setContextMenu] = useState<{ 
    x: number; 
    y: number; 
    show: boolean; 
    targetId?: string 
  } | null>(null);

  const currentFolder = fileSystem.find(i => i.id === currentPathId);
  const path = getPath(fileSystem, currentPathId);
  const items = getChildren(fileSystem, currentPathId).filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Clear selections when path changes
  useEffect(() => {
    setSelectedIds([]);
    setContextMenu(null);
  }, [currentPathId]);

  // Keyboard Shortcuts
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
              // Select All
              if (document.activeElement?.closest('.file-manager-container')) {
                  e.preventDefault();
                  setSelectedIds(items.map(i => i.id));
              }
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items]);

  const navigateUp = () => {
    if (currentFolder?.parentId) {
      setCurrentPathId(currentFolder.parentId);
    }
  };

  const handleItemClick = (e: React.MouseEvent, item: FileSystemItem) => {
    e.stopPropagation();
    if (e.ctrlKey || e.metaKey) {
        setSelectedIds(prev => prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]);
    } else if (e.shiftKey && selectedIds.length > 0) {
        setSelectedIds(prev => [...prev, item.id]);
    } else {
        setSelectedIds([item.id]);
    }
  };

  const handleItemDoubleClick = (item: FileSystemItem) => {
    if (item.type === 'folder') {
      setCurrentPathId(item.id);
      setSelectedIds([]);
    } else if (item.type === 'text') {
      openWindow('text-editor', { fileId: item.id });
    } else if (item.type === 'image') {
      openWindow('image-viewer', { fileId: item.id });
    } else if (item.type === 'video') {
      openWindow('video-player'); 
    } else if (item.type === 'unknown') {
      alert(`Cannot open "${item.name}".\n\nFile type not supported or format is unknown.`);
    } else {
       openWindow('text-editor', { fileId: item.id });
    }
  };

  // --- Context Menu Handlers ---
  const handleContextMenu = (e: React.MouseEvent, itemId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If clicking an item that isn't selected, select it (exclusive)
    if (itemId && !selectedIds.includes(itemId)) {
        setSelectedIds([itemId]);
    }

    setContextMenu({
        x: e.clientX,
        y: e.clientY,
        show: true,
        targetId: itemId
    });
  };

  const handleBackgroundClick = () => {
      setSelectedIds([]);
      setContextMenu(null);
  };

  const handleCreateFolder = () => {
      const name = getUniqueName(fileSystem, currentPathId, 'New Folder');
      createFile(currentPathId, name, 'folder');
  };

  const handleCreateFile = () => {
      const name = getUniqueName(fileSystem, currentPathId, 'New File.txt');
      createFile(currentPathId, name, 'text', '');
  };

  const handleRename = (id?: string) => {
      const targetId = id || (selectedIds.length === 1 ? selectedIds[0] : null);
      if (!targetId) return;

      const item = fileSystem.find(i => i.id === targetId);
      if (!item) return;

      // Use timeout to allow context menu to close first and prevent focus blocking
      setTimeout(() => {
          const newName = window.prompt("Rename:", item.name);
          if(newName && newName !== item.name) {
              updateFile(targetId, { name: newName });
          }
      }, 50);
  };

  const handleDelete = (id?: string) => {
      // Prioritize the ID passed from context menu (right-clicked item)
      // Fallback to selected IDs if deleting via keyboard/toolbar
      const targetIds = id ? [id] : selectedIds;
      
      if (targetIds.length === 0) return;

      // Use timeout to allow context menu to close first
      setTimeout(() => {
          if(window.confirm(`Are you sure you want to delete ${targetIds.length} item(s)?`)) {
              targetIds.forEach(targetId => deleteFile(targetId));
              setSelectedIds([]);
          }
      }, 50);
  };

  const handleOpen = (id: string) => {
      const item = fileSystem.find(i => i.id === id);
      if(item) handleItemDoubleClick(item);
  }

  const handleProperties = (id: string) => {
      setShowProperties(id);
  }

  const getMenuItems = (): ContextMenuItem[] => {
      // Item Context Menu
      if (contextMenu?.targetId) {
          const id = contextMenu.targetId;
          return [
              { label: 'Open', icon: <ExternalLink size={14} />, action: () => handleOpen(id) },
              { separator: true },
              { label: 'Rename', icon: <Edit2 size={14} />, action: () => handleRename(id) },
              { label: 'Delete', icon: <Trash2 size={14} />, danger: true, action: () => handleDelete(id) },
              { separator: true },
              { label: 'Properties', icon: <Info size={14} />, action: () => handleProperties(id) },
          ];
      } 
      // Background Context Menu
      else {
          return [
              { label: 'New Folder', icon: <FolderPlus size={14} />, action: handleCreateFolder },
              { label: 'New Text File', icon: <FileText size={14} />, action: handleCreateFile },
              { separator: true },
              { label: 'Refresh', icon: <RefreshCw size={14} />, action: () => {} },
              { label: 'Select All', icon: <List size={14} />, action: () => setSelectedIds(items.map(i => i.id)) },
          ];
      }
  };

  // --- External File Upload & Drop ---
  const handleExternalDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingExternal(false);

    const fileId = e.dataTransfer.getData('fileId');
    if (fileId) return; // Internal drag handled elsewhere

    const dropItems = e.dataTransfer.items;
    if (dropItems) {
        for (let i = 0; i < dropItems.length; i++) {
            const item = dropItems[i];
            const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
            if (entry) {
                await processFileEntry(entry, currentPathId, createFile);
            } else if (item.kind === 'file') {
                 const file = item.getAsFile();
                 if (file) {
                    const type = detectFileType(file);
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        createFile(currentPathId, file.name, type, ev.target?.result as string);
                    };
                    if (type === 'text') reader.readAsText(file);
                    else reader.readAsDataURL(file);
                 }
            }
        }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          Array.from(e.target.files).forEach((file: File) => {
              const type = detectFileType(file);
              const reader = new FileReader();
              reader.onload = (ev) => {
                  createFile(currentPathId, file.name, type, ev.target?.result as string);
              };
              if (type === 'text') reader.readAsText(file);
              else reader.readAsDataURL(file);
          });
      }
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          const files = Array.from(e.target.files);
          const folderMap = new Map<string, string>();
          folderMap.set('', currentPathId);

          for (const file of files) {
              const pathParts = (file.webkitRelativePath || file.name).split('/');
              const fileName = pathParts.pop()!;
              const folderParts = pathParts;
              let currentParent = currentPathId;
              let currentPathStr = '';

              for (const part of folderParts) {
                  currentPathStr = currentPathStr ? `${currentPathStr}/${part}` : part;
                  if (folderMap.has(currentPathStr)) {
                      currentParent = folderMap.get(currentPathStr)!;
                  } else {
                      const newFolderId = createFile(currentParent, part, 'folder');
                      folderMap.set(currentPathStr, newFolderId);
                      currentParent = newFolderId;
                  }
              }
              const type = detectFileType(file);
              const reader = new FileReader();
              await new Promise<void>((resolve) => {
                  reader.onload = (ev) => {
                      createFile(currentParent, fileName, type, ev.target?.result as string);
                      resolve();
                  };
                  if (type === 'text') reader.readAsText(file);
                  else reader.readAsDataURL(file);
              });
          }
      }
  };

  // --- Internal Drag ---
  const handleDragStart = (e: React.DragEvent, item: FileSystemItem) => {
      e.dataTransfer.setData('fileId', item.id);
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, item: FileSystemItem) => {
      if (item.type === 'folder') {
          e.preventDefault(); 
          e.dataTransfer.dropEffect = 'move';
      }
  };

  const handleDropInternal = (e: React.DragEvent, targetFolder: FileSystemItem) => {
      e.preventDefault();
      e.stopPropagation();
      const fileId = e.dataTransfer.getData('fileId');
      if (fileId && fileId !== targetFolder.id) {
          updateFile(fileId, { parentId: targetFolder.id });
      }
  };

  // ---------------------------

  const getIcon = (type: string, size: number) => {
      switch(type) {
          case 'folder': return <Folder size={size} className="text-blue-400 fill-blue-500/20" />;
          case 'text': return <FileText size={size} className="text-slate-400" />;
          case 'image': return <Image size={size} className="text-purple-400" />;
          case 'audio': return <Music size={size} className="text-pink-400" />;
          case 'video': return <Video size={size} className="text-red-400" />;
          case 'unknown': return <FileQuestion size={size} className="text-gray-400" />;
          default: return <File size={size} className="text-slate-400" />;
      }
  }

  return (
    <div 
        ref={containerRef}
        className="file-manager-container h-full flex flex-col text-slate-200 bg-slate-900 relative outline-none" 
        tabIndex={0}
        onClick={handleBackgroundClick}
        onContextMenu={(e) => handleContextMenu(e)}
        onDragOver={(e) => { e.preventDefault(); setIsDraggingExternal(true); }}
        onDragLeave={() => setIsDraggingExternal(false)}
        onDrop={handleExternalDrop}
    >
      {/* Properties Modal */}
      {showProperties && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); setShowProperties(null); }}>
              <div className="bg-[#252526] border border-white/10 rounded-xl shadow-2xl w-80 overflow-hidden" onClick={e => e.stopPropagation()}>
                  <div className="h-10 bg-[#333] flex items-center justify-between px-4 border-b border-black/20">
                      <span className="text-sm font-bold">Properties</span>
                      <button onClick={() => setShowProperties(null)}><X size={16} /></button>
                  </div>
                  {(() => {
                      const item = fileSystem.find(i => i.id === showProperties);
                      if (!item) return <div className="p-4">Item not found</div>;
                      return (
                          <div className="p-6 space-y-4 text-sm">
                              <div className="flex flex-col items-center mb-4">
                                  {getIcon(item.type, 48)}
                                  <span className="mt-2 font-bold text-lg text-center break-all">{item.name}</span>
                              </div>
                              <div className="grid grid-cols-[80px_1fr] gap-2">
                                  <span className="text-slate-400">Type:</span>
                                  <span className="capitalize">{item.type}</span>
                                  
                                  <span className="text-slate-400">Location:</span>
                                  <span className="truncate">/{getPath(fileSystem, item.parentId || '').map(p => p.name).join('/')}</span>
                                  
                                  <span className="text-slate-400">Size:</span>
                                  <span>{item.type === 'folder' ? `${getChildren(fileSystem, item.id).length} items` : formatSize(item.content?.length || 0)}</span>
                                  
                                  <span className="text-slate-400">Created:</span>
                                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                  
                                  <span className="text-slate-400">Modified:</span>
                                  <span>{new Date(item.modifiedAt).toLocaleDateString()}</span>
                              </div>
                          </div>
                      );
                  })()}
                  <div className="p-4 border-t border-white/5 bg-[#1e1e1e] flex justify-end">
                      <button onClick={() => setShowProperties(null)} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-sm transition-colors">OK</button>
                  </div>
              </div>
          </div>
      )}

      {/* External Drag Overlay */}
      {isDraggingExternal && (
          <div className="absolute inset-0 bg-blue-500/20 z-40 flex items-center justify-center border-4 border-blue-500 border-dashed m-2 rounded-xl pointer-events-none">
              <div className="bg-slate-900/80 p-6 rounded-xl flex flex-col items-center">
                  <UploadCloud size={48} className="text-blue-400 mb-2" />
                  <span className="text-xl font-bold">Drop files to upload</span>
              </div>
          </div>
      )}

      {/* Toolbar */}
      <div className="h-12 border-b border-slate-700 flex items-center px-4 gap-2 bg-slate-800 shrink-0" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <button onClick={navigateUp} disabled={!currentFolder?.parentId} className="p-1.5 hover:bg-slate-700 rounded disabled:opacity-30 transition-colors">
            <ArrowUp size={16} />
          </button>
          <button onClick={() => setCurrentPathId('root')} className="p-1.5 hover:bg-slate-700 rounded transition-colors">
            <Home size={16} />
          </button>
        </div>
        
        {/* Address Bar */}
        <div className="flex-1 bg-slate-900 h-8 rounded px-3 flex items-center text-sm border border-slate-700 hover:border-slate-500 transition-colors">
          <span className="text-slate-500 mr-2">/</span>
          <div className="flex gap-1 overflow-hidden">
            {path.map((p, i) => (
                <React.Fragment key={p.id}>
                <button 
                    onClick={() => setCurrentPathId(p.id)}
                    className="hover:bg-slate-700 px-1 rounded transition-colors truncate max-w-[100px]"
                >
                    {p.name}
                </button>
                {i < path.length - 1 && <span className="text-slate-600">/</span>}
                </React.Fragment>
            ))}
          </div>
        </div>

        <div className="h-6 w-px bg-slate-700 mx-2" />
        
        {/* Upload Actions */}
        <button onClick={() => fileInputRef.current?.click()} className="p-1.5 hover:bg-slate-700 rounded transition-colors flex items-center gap-2 text-xs font-medium bg-slate-700 hover:bg-slate-600" title="Upload File">
            <Upload size={14} /> File
            <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
        </button>
        <button onClick={() => folderInputRef.current?.click()} className="p-1.5 hover:bg-slate-700 rounded transition-colors flex items-center gap-2 text-xs font-medium bg-slate-700 hover:bg-slate-600" title="Upload Folder">
            <UploadCloud size={14} /> Folder
            {/* @ts-ignore */}
            <input type="file" webkitdirectory="" directory="" ref={folderInputRef} className="hidden" onChange={handleFolderUpload} />
        </button>

        <div className="h-6 w-px bg-slate-700 mx-2" />

        {/* View Toggles */}
        <div className="flex bg-slate-900 rounded p-0.5 border border-slate-700">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-white'}`}
          >
            <LayoutGrid size={14} />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-white'}`}
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-48 bg-slate-900 border-r border-slate-700 p-2 hidden sm:flex flex-col gap-1 shrink-0" onClick={e => e.stopPropagation()}>
          {['root', 'desktop', 'documents', 'downloads', 'pictures', 'codes'].map(id => {
            const folder = fileSystem.find(f => f.id === id);
            if (!folder) return null;
            return (
              <button
                key={id}
                onClick={() => setCurrentPathId(id)}
                className={`flex items-center gap-2 px-3 py-2 rounded text-sm text-left transition-colors ${currentPathId === id ? 'bg-blue-600/20 text-blue-400 font-medium' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'}`}
              >
                <Folder size={16} className={currentPathId === id ? "fill-blue-500/20" : ""} />
                {folder.name}
              </button>
            )
          })}
        </div>

        {/* File Grid/List */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#111] relative">
          {items.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 select-none pointer-events-none">
              <Folder size={64} className="mb-4 opacity-10" />
              <p>This folder is empty</p>
              <p className="text-xs mt-2">Drag and drop files here</p>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-4 content-start" 
              : "flex flex-col gap-1"
            }>
              {items.map(item => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragOver={(e) => handleDragOver(e, item)}
                  onDrop={(e) => item.type === 'folder' ? handleDropInternal(e, item) : undefined}
                  onClick={(e) => handleItemClick(e, item)}
                  onDoubleClick={(e) => { e.stopPropagation(); handleItemDoubleClick(item); }}
                  onContextMenu={(e) => handleContextMenu(e, item.id)}
                  className={`
                    group cursor-pointer rounded-lg border transition-all duration-100 select-none
                    ${selectedIds.includes(item.id) 
                        ? 'bg-blue-600/20 border-blue-500/50' 
                        : 'border-transparent hover:bg-white/5'}
                    ${viewMode === 'grid' 
                      ? 'flex flex-col items-center p-3' 
                      : 'flex items-center px-3 py-2 justify-between'}
                  `}
                >
                  <div className={`flex items-center pointer-events-none ${viewMode === 'grid' ? 'flex-col gap-2' : 'gap-3'}`}>
                    <div className="drop-shadow-lg transition-transform group-hover:scale-105">
                        {getIcon(item.type, viewMode === 'grid' ? 42 : 20)}
                    </div>
                    <span className={`text-xs text-center truncate ${viewMode === 'grid' ? 'max-w-[80px]' : 'text-sm'} ${selectedIds.includes(item.id) ? 'text-white font-medium' : 'text-slate-300'}`}>
                      {item.name}
                    </span>
                  </div>
                  {viewMode === 'list' && (
                    <div className="text-xs text-slate-500 flex gap-8 font-mono pointer-events-none">
                      <span>{new Date(item.modifiedAt).toLocaleDateString()}</span>
                      <span className="w-16 text-right">{item.type === 'folder' ? '--' : formatSize(item.content?.length || 0)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-slate-800 border-t border-slate-700 flex items-center px-4 justify-between text-[10px] text-slate-400 select-none shrink-0" onClick={e => e.stopPropagation()}>
         <span>{items.length} items</span>
         <span>{selectedIds.length > 0 ? `${selectedIds.length} item(s) selected` : 'Drag files to upload or move'}</span>
      </div>

      {contextMenu?.show && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getMenuItems()}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};
