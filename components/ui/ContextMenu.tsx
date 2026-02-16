
import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

export type ContextMenuItem = 
  | {
      separator: true;
    }
  | {
      separator?: false;
      label: string;
      action?: () => void;
      icon?: React.ReactNode;
      disabled?: boolean;
      danger?: boolean;
    };

interface Props {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export const ContextMenu: React.FC<Props> = ({ x, y, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({ opacity: 0 });

  useEffect(() => {
    // Calculate position
    if (menuRef.current) {
        const { width, height } = menuRef.current.getBoundingClientRect();
        
        let newX = x;
        let newY = y;

        // Ensure it doesn't go off screen
        if (x + width > window.innerWidth) {
            newX = x - width;
        }
        if (y + height > window.innerHeight) {
            newY = y - height;
        }

        setStyle({ 
            top: Math.max(0, newY), 
            left: Math.max(0, newX),
            opacity: 1
        });
    }
  }, [x, y]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('click', handleClickOutside);
    }, 50);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [onClose]);

  // Use Portal to render outside of any transformed parents (like windows)
  return ReactDOM.createPortal(
    <div 
      ref={menuRef}
      className="fixed z-[999999] w-56 bg-slate-800/95 backdrop-blur-md border border-slate-700 rounded-lg shadow-2xl py-1 animate-in fade-in zoom-in-95 duration-75 origin-top-left"
      style={style}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item, index) => {
        if ('separator' in item && item.separator) {
          return <div key={index} className="h-px bg-slate-700 my-1 mx-2" />;
        }
        
        const menuItem = item as Extract<ContextMenuItem, { label: string }>;
        
        return (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              if (!menuItem.disabled && menuItem.action) {
                menuItem.action();
                onClose();
              }
            }}
            disabled={menuItem.disabled}
            className={`w-full text-left px-3 py-1.5 flex items-center gap-2 text-sm transition-colors
              ${menuItem.disabled 
                ? 'text-slate-500 cursor-default' 
                : menuItem.danger 
                    ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300' 
                    : 'text-slate-200 hover:bg-blue-600 hover:text-white'
              }
            `}
          >
            {menuItem.icon && <span className="w-4 h-4 flex items-center justify-center">{menuItem.icon}</span>}
            <span className="flex-1 truncate">{menuItem.label}</span>
          </button>
        );
      })}
    </div>,
    document.body
  );
};
