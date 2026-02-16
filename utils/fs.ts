
import { FileSystemItem } from '../types';

export const getChildren = (fs: FileSystemItem[], parentId: string) => {
  return fs.filter(item => item.parentId === parentId);
};

export const getPath = (fs: FileSystemItem[], itemId: string): FileSystemItem[] => {
  const path: FileSystemItem[] = [];
  let current = fs.find(i => i.id === itemId);
  while (current) {
    path.unshift(current);
    if (!current.parentId) break;
    current = fs.find(i => i.id === current?.parentId);
  }
  return path;
};

export const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const getUniqueName = (fs: FileSystemItem[], parentId: string, baseName: string) => {
  const siblings = fs.filter(i => i.parentId === parentId);
  let name = baseName;
  let counter = 1;
  while (siblings.some(s => s.name === name)) {
    name = `${baseName} (${counter})`;
    counter++;
  }
  return name;
};

export const detectFileType = (file: File): 'image' | 'text' | 'audio' | 'video' | 'folder' | 'unknown' => {
  const type = file.type;
  const name = file.name.toLowerCase();

  // Images
  if (type.startsWith('image/')) return 'image';
  if (name.match(/\.(png|jpg|jpeg|gif|webp|svg|bmp|ico)$/i)) return 'image';

  // Audio
  if (type.startsWith('audio/')) return 'audio';
  if (name.match(/\.(mp3|wav|ogg|m4a|flac)$/i)) return 'audio';

  // Video
  if (type.startsWith('video/')) return 'video';
  if (name.match(/\.(mp4|webm|mkv|mov|avi)$/i)) return 'video';

  // Explicit Text formats
  if (
    type.startsWith('text/') || 
    name.match(/\.(txt|md|js|ts|tsx|jsx|css|html|json|xml|py|c|cpp|h|java|sql|log|csv|env|yml|yaml|ini|conf)$/i)
  ) {
    return 'text';
  }
  
  // Default to unknown for binaries or unknown extensions
  return 'unknown';
};

// Helper for recursive file/folder processing from DataTransferItem or FileSystemEntry
export const processFileEntry = async (entry: any, parentPathId: string, createFile: (parentId: string, name: string, type: any, content?: string) => string): Promise<void> => {
  if (entry.isFile) {
      const file = await new Promise<File>((resolve, reject) => entry.file(resolve, reject));
      const type = detectFileType(file);
      
      return new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => {
              const result = ev.target?.result as string;
              createFile(parentPathId, entry.name, type, result);
              resolve();
          };
          
          if (type === 'text') {
               reader.readAsText(file);
          } else {
               // Read everything else (images, audio, video, unknown) as Base64/DataURL
               // This preserves binary data for download/preview if supported later
               reader.readAsDataURL(file);
          }
      });
  } else if (entry.isDirectory) {
      const newFolderId = createFile(parentPathId, entry.name, 'folder');
      const dirReader = entry.createReader();
      
      const readEntries = async () => {
          const entries = await new Promise<any[]>((resolve) => dirReader.readEntries(resolve));
          if (entries.length > 0) {
              for (const childEntry of entries) {
                  await processFileEntry(childEntry, newFolderId, createFile);
              }
              await readEntries(); // Continue reading if there are more entries
          }
      };
      await readEntries();
  }
};
