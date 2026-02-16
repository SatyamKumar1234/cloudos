
import React, { useRef, useState, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { FileSystemItem } from '../../types';
import { getChildren, getUniqueName, processFileEntry, detectFileType } from '../../utils/fs';
import { FileText, Folder, Image, Music, Video, Box, FolderPlus, Trash2, Palette, FileQuestion } from 'lucide-react';
import { ContextMenu, ContextMenuItem } from '../ui/ContextMenu';

// Grid Configuration
const GRID_W = 100;
const GRID_H = 110;
const START_X = 20;
const START_Y = 20;

export const Desktop: React.FC = () => {
  const { fileSystem, openWindow, theme, createFile, deleteFile, updateFile } = useOS();
  const desktopItems = getChildren(fileSystem, 'desktop');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  
  // Selection Box State
  const [selectionBox, setSelectionBox] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
  const selectionStartRef = useRef<{ x: number, y: number } | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  
  // Icon Moving State
  const [movingItem, setMovingItem] = useState<{ id: string, startX: number, startY: number, initialLeft: number, initialTop: number } | null>(null);

  const [contextMenu, setContextMenu] = useState<{ 
    x: number; 
    y: number; 
    show: boolean; 
    itemId?: string 
  } | null>(null);

  // --- Grid & Collision Logic ---

  const isPositionOccupied = (x: number, y: number, excludeId?: string) => {
    // Check system icons (fixed positions)
    const systemSlots = [
        { c: 0, r: 0 },
        { c: 0, r: 1 },
        { c: 0, r: 2 }
    ];

    const targetCol = Math.round((x - START_X) / GRID_W);
    const targetRow = Math.round((y - START_Y) / GRID_H);

    if (systemSlots.some(s => s.c === targetCol && s.r === targetRow)) return true;

    // Check existing files
    return desktopItems.some(item => {
        if (item.id === excludeId) return false;
        if (!item.position) return false;
        const itemCol = Math.round((item.position.x - START_X) / GRID_W);
        const itemRow = Math.round((item.position.y - START_Y) / GRID_H);
        return itemCol === targetCol && itemRow === targetRow;
    });
  };

  const findNearestEmptySlot = (preferredX: number, preferredY: number, excludeId?: string) => {
      let col = Math.max(0, Math.round((preferredX - START_X) / GRID_W));
      let row = Math.max(0, Math.round((preferredY - START_Y) / GRID_H));

      // Spiral search for empty slot
      let radius = 0;
      const maxRadius = 10;
      
      while (radius <= maxRadius) {
          for (let r = row - radius; r <= row + radius; r++) {
              for (let c = col - radius; c <= col + radius; c++) {
                  if (r < 0 || c < 0) continue;
                  
                  const x = START_X + (c * GRID_W);
                  const y = START_Y + (r * GRID_H);
                  
                  if (!isPositionOccupied(x, y, excludeId)) {
                      return { x, y };
                  }
              }
          }
          radius++;
      }
      return { x: preferredX, y: preferredY };
  };

  // --- Initialization ---

  // Ensure items have positions if new (Auto-arrange)
  useEffect(() => {
     const itemsWithoutPos = desktopItems.filter(i => !i.position);
     if (itemsWithoutPos.length > 0) {
         let occupied = new Set<string>();
         
         const isTempOccupied = (c: number, r: number) => {
            if (c === 0 && r <= 2) return true; // System icons
            const key = `${c},${r}`;
            if (occupied.has(key)) return true;
            
            return desktopItems.some(item => {
                if (!item.position) return false;
                const ic = Math.round((item.position.x - START_X) / GRID_W);
                const ir = Math.round((item.position.y - START_Y) / GRID_H);
                return ic === c && ir === r;
            });
         };

         itemsWithoutPos.forEach(item => {
             let c = 1; 
             let r = 0;
             while (isTempOccupied(c, r)) {
                 r++;
                 if (r > 6) { r = 0; c++; }
             }
             
             occupied.add(`${c},${r}`);
             updateFile(item.id, {
                 position: { x: START_X + (c * GRID_W), y: START_Y + (r * GRID_H) }
             });
         });
     }
  }, [desktopItems.length]);

  // --- Handlers ---

  const handleDoubleClick = (item: FileSystemItem) => {
    // Explicit check for unknown types
    if (item.type === 'unknown') {
      window.alert(`Cannot open "${item.name}".\n\nFile type is not supported.`);
      return;
    }

    if (item.type === 'folder') {
      openWindow('file-manager', { path: item.id });
    } else if (item.type === 'text') {
      openWindow('text-editor', { fileId: item.id });
    } else if (item.type === 'image') {
      openWindow('image-viewer', { fileId: item.id });
    } else if (item.name.endsWith('.gguf')) {
      openWindow('ai-runner');
    } else {
      // Last resort fallback
      openWindow('text-editor', { fileId: item.id });
    }
  };

  const handleRecycleBinClick = () => {
      openWindow('file-manager', { path: 'recycle-bin' });
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (selectionBox || movingItem) return;

    const target = (e.target as HTMLElement).closest('[data-file-id]');
    const fileId = target?.getAttribute('data-file-id');
    const isTrash = (e.target as HTMLElement).closest('#recycle-bin-icon');
    
    setContextMenu({ 
      x: e.clientX, 
      y: e.clientY, 
      show: true,
      itemId: isTrash ? 'recycle-bin' : (fileId || undefined)
    });
  };

  // --- Mouse Handling for Selection & Moving ---
  
  const handleMouseDown = (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('.window-frame') || (e.target as HTMLElement).closest('#taskbar')) return;
      if (e.button !== 0) return;

      const clickedIcon = (e.target as HTMLElement).closest('[data-file-id]');
      
      if (clickedIcon) {
          const id = clickedIcon.getAttribute('data-file-id');
          if (!id) return;
          
          if (!selectedItemIds.includes(id) && !e.ctrlKey) {
             setSelectedItemIds([id]);
          } else if (e.ctrlKey) {
             setSelectedItemIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
             return;
          }

          const item = fileSystem.find(i => i.id === id);
          if (item?.position) {
             setMovingItem({
                 id,
                 startX: e.clientX,
                 startY: e.clientY,
                 initialLeft: item.position.x,
                 initialTop: item.position.y
             });
          }
      } else {
          if (!(e.target as HTMLElement).closest('.system-icon')) {
            selectionStartRef.current = { x: e.clientX, y: e.clientY };
            setSelectionBox({ x: e.clientX, y: e.clientY, w: 0, h: 0 });
            setSelectedItemIds([]);
          }
      }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (movingItem) {
          // Visual logic
      } else if (selectionStartRef.current) {
          const startX = selectionStartRef.current.x;
          const startY = selectionStartRef.current.y;
          const currentX = e.clientX;
          const currentY = e.clientY;

          const x = Math.min(startX, currentX);
          const y = Math.min(startY, currentY);
          const w = Math.abs(currentX - startX);
          const h = Math.abs(currentY - startY);

          setSelectionBox({ x, y, w, h });

          const newSelection: string[] = [];
          const icons = document.querySelectorAll('[data-file-id]');
          icons.forEach(icon => {
              const rect = icon.getBoundingClientRect();
              if (rect.left < x + w && rect.right > x && rect.top < y + h && rect.bottom > y) {
                  const id = icon.getAttribute('data-file-id');
                  if (id) newSelection.push(id);
              }
          });
          setSelectedItemIds(newSelection);
      }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
      if (movingItem) {
          const deltaX = e.clientX - movingItem.startX;
          const deltaY = e.clientY - movingItem.startY;
          
          const rawX = movingItem.initialLeft + deltaX;
          const rawY = movingItem.initialTop + deltaY;

          if (selectedItemIds.length > 0) {
               const snapPos = findNearestEmptySlot(rawX, rawY, movingItem.id);
               updateFile(movingItem.id, { position: snapPos });
          } else {
               const snapPos = findNearestEmptySlot(rawX, rawY, movingItem.id);
               updateFile(movingItem.id, { position: snapPos });
          }

          setMovingItem(null);
      }
      
      selectionStartRef.current = null;
      setSelectionBox(null);
  };

  // --- File Drop / Upload ---

  const handleDrop = async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingFile(false);

      const items = e.dataTransfer.items;
      if (items) {
          for (let i = 0; i < items.length; i++) {
              const item = items[i];
              const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
              if (entry) {
                  await processFileEntry(entry, 'desktop', createFile);
              } else if (item.kind === 'file') {
                   const file = item.getAsFile();
                   if (file) {
                        const type = detectFileType(file);
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                             createFile('desktop', file.name, type, ev.target?.result as string);
                        };
                        
                        if (type === 'text') {
                            reader.readAsText(file);
                        } else {
                            reader.readAsDataURL(file);
                        }
                   }
              }
          }
      }
  };

  // --- Actions ---

  const handleCreateFolder = () => {
    const name = getUniqueName(fileSystem, 'desktop', 'New Folder');
    createFile('desktop', name, 'folder');
  };

  const handleCreateTextFile = () => {
    const name = getUniqueName(fileSystem, 'desktop', 'New Text Document.txt');
    createFile('desktop', name, 'text', '');
  };

  const handleDelete = (id: string) => {
    if (id === 'recycle-bin') {
        window.alert('To empty the recycle bin, please open it and delete items individually.');
        return;
    }
    deleteFile(id);
  };

  const handleRename = (id: string) => {
    const item = fileSystem.find(i => i.id === id);
    if (!item) return;
    const newName = window.prompt('Rename item:', item.name);
    if (newName && newName !== item.name) {
      updateFile(id, { name: newName });
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 300);
  };

  // --- Rendering ---

  const getMenuItems = (): ContextMenuItem[] => {
    if (contextMenu?.itemId) {
      const id = contextMenu.itemId;
      if (id === 'recycle-bin') {
           return [
               { label: 'Open', action: handleRecycleBinClick },
           ]
      }
      
      const item = fileSystem.find(i => i.id === id);
      if (!item) return [];

      return [
        { label: 'Open', action: () => handleDoubleClick(item) },
        { separator: true },
        { label: 'Rename', action: () => handleRename(id) },
        { label: 'Delete', danger: true, action: () => handleDelete(id) },
      ];
    } else {
      return [
        { label: 'New Folder', icon: <FolderPlus size={14} />, action: handleCreateFolder },
        { label: 'New Text File', icon: <FileText size={14} />, action: handleCreateTextFile },
        { separator: true },
        { label: 'Refresh', icon: <Box size={14} />, action: handleRefresh },
        { label: 'Personalize', icon: <Palette size={14} />, action: () => openWindow('settings') },
      ];
    }
  };

  const getIcon = (type: string, name: string) => {
    if (name.endsWith('.gguf')) return <Box className="text-emerald-400 fill-emerald-500/20" size={48} />;
    
    switch(type) {
      case 'folder': return <Folder className="text-blue-400 fill-blue-500/20" size={48} />;
      case 'text': return <FileText className="text-slate-100 fill-slate-700/50" size={48} />;
      case 'image': return <Image className="text-purple-400 fill-purple-500/20" size={48} />;
      case 'audio': return <Music className="text-pink-400 fill-pink-500/20" size={48} />;
      case 'video': return <Video className="text-red-400 fill-red-500/20" size={48} />;
      case 'unknown': return <FileQuestion className="text-gray-400 fill-gray-500/20" size={48} />;
      default: return <FileText className="text-slate-400" size={48} />;
    }
  };

  const bgImage = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop";

  return (
    <div 
      className={`absolute inset-0 z-0 bg-cover bg-center overflow-hidden transition-all duration-500 ${isDraggingFile ? 'brightness-50' : ''}`}
      style={{ backgroundImage: `url(${theme.background || bgImage})` }}
      onContextMenu={handleContextMenu}
      onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
      onDragLeave={() => setIsDraggingFile(false)}
      onDrop={handleDrop}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />

      {selectionBox && (
          <div 
            className="absolute bg-blue-500/20 border border-blue-500/50 z-50 pointer-events-none"
            style={{
                left: selectionBox.x,
                top: selectionBox.y,
                width: selectionBox.w,
                height: selectionBox.h
            }}
          />
      )}

      <div className={`absolute inset-0 ${isRefreshing ? 'animate-refresh' : ''}`}>
        
        {/* System Shortcut: This PC */}
        <div
          className="system-icon absolute group flex flex-col items-center justify-start p-2 rounded-xl hover:bg-white/10 w-[100px] h-[110px] cursor-pointer transition-colors border border-transparent hover:border-white/5 active:bg-white/20"
          style={{ left: 20, top: 20 }}
          onDoubleClick={() => openWindow('file-manager', { path: 'root' })}
        >
          <div className="mb-2 drop-shadow-2xl filter brightness-110">
            <Box className="text-blue-300 fill-blue-500/30" size={48} />
          </div>
          <span className="text-white text-[11px] text-center drop-shadow-md font-medium px-2 py-0.5 rounded-md bg-black/0 group-hover:bg-black/30 line-clamp-2 break-all leading-tight">
            This PC
          </span>
        </div>
        
        {/* System Shortcut: Recycle Bin */}
        <div
          id="recycle-bin-icon"
          className="system-icon absolute group flex flex-col items-center justify-start p-2 rounded-xl hover:bg-white/10 w-[100px] h-[110px] cursor-pointer transition-colors border border-transparent hover:border-white/5 active:bg-white/20"
          style={{ left: 20, top: 140 }}
          onDoubleClick={handleRecycleBinClick}
        >
          <div className="mb-2 drop-shadow-2xl filter brightness-110">
            <Trash2 className="text-slate-300 fill-slate-500/30" size={48} />
          </div>
          <span className="text-white text-[11px] text-center drop-shadow-md font-medium px-2 py-0.5 rounded-md bg-black/0 group-hover:bg-black/30 line-clamp-2 break-all leading-tight">
            Recycle Bin
          </span>
        </div>

        {/* System Shortcut: Paint */}
        <div
          className="system-icon absolute group flex flex-col items-center justify-start p-2 rounded-xl hover:bg-white/10 w-[100px] h-[110px] cursor-pointer transition-colors border border-transparent hover:border-white/5 active:bg-white/20"
          style={{ left: 20, top: 260 }}
          onDoubleClick={() => openWindow('paint')}
        >
          <div className="mb-2 drop-shadow-2xl">
            <Palette className="text-pink-400 fill-pink-900/50" size={48} />
          </div>
          <span className="text-white text-[11px] text-center drop-shadow-md font-medium px-2 py-0.5 rounded-md bg-black/0 group-hover:bg-black/30 line-clamp-2 break-all leading-tight">
            Canvas
          </span>
        </div>

        {/* Files */}
        {desktopItems.map(item => (
          <div
            key={item.id}
            data-file-id={item.id}
            className={`
                absolute group flex flex-col items-center justify-start p-2 rounded-xl w-[100px] h-[110px] cursor-pointer border border-transparent 
                ${selectedItemIds.includes(item.id) ? 'bg-white/20 border-white/20' : 'hover:bg-white/10 hover:border-white/5 active:bg-white/20'}
            `}
            style={{ 
                left: movingItem?.id === item.id 
                    ? (movingItem.initialLeft + (selectionBox ? 0 : (movingItem.startX - movingItem.startX))) 
                    : (item.position?.x || 140), 
                top: movingItem?.id === item.id 
                    ? (item.position?.y) 
                    : (item.position?.y || 20),
                transform: movingItem?.id === item.id ? 'scale(1.05)' : 'none',
                zIndex: movingItem?.id === item.id ? 50 : 1
            }}
            onDoubleClick={() => handleDoubleClick(item)}
          >
            <div className="mb-2 drop-shadow-2xl filter brightness-110 pointer-events-none">
              {getIcon(item.type, item.name)}
            </div>
            <span className={`text-white text-[11px] text-center drop-shadow-md font-medium px-2 py-0.5 rounded-md line-clamp-2 break-all leading-tight ${selectedItemIds.includes(item.id) ? 'bg-blue-600' : 'bg-black/0 group-hover:bg-black/30'}`}>
              {item.name}
            </span>
          </div>
        ))}
      </div>

      {contextMenu?.show && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getMenuItems()}
          onClose={() => setContextMenu(null)}
        />
      )}
      
      {isDraggingFile && (
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
              <div className="bg-black/80 text-white px-8 py-4 rounded-xl border-2 border-dashed border-white/50 text-xl font-medium animate-pulse">
                  Drop items to upload to Desktop
              </div>
          </div>
      )}
    </div>
  );
};
