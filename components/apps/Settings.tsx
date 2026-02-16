import React from 'react';
import { useOS } from '../../context/OSContext';
import { Palette, Monitor, Info, Upload } from 'lucide-react';

export const Settings: React.FC = () => {
  const { theme, setTheme } = useOS();

  const wallpapers = [
    'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?auto=format&fit=crop&q=80&w=3270&ixlib=rb-4.0.3', // Mountains
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=3270&ixlib=rb-4.0.3', // Yosemite
    'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=3270&ixlib=rb-4.0.3', // Code
    'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=3270&ixlib=rb-4.0.3', // Gradient
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
            setTheme({ background: ev.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="h-full flex text-slate-200 bg-slate-900">
      {/* Sidebar */}
      <div className="w-48 bg-slate-950 border-r border-slate-800 p-4 flex flex-col gap-2">
        <button className="flex items-center gap-2 p-2 rounded bg-slate-800 text-white">
          <Palette size={16} /> Appearance
        </button>
        <button className="flex items-center gap-2 p-2 rounded hover:bg-slate-800 text-slate-400">
          <Monitor size={16} /> Display
        </button>
        <button className="flex items-center gap-2 p-2 rounded hover:bg-slate-800 text-slate-400">
          <Info size={16} /> About
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <h2 className="text-2xl font-light mb-6">Personalization</h2>
        
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Wallpaper</h3>
              <label className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-medium cursor-pointer transition-colors shadow">
                  <Upload size={14} />
                  Upload from PC
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {wallpapers.map((wp, i) => (
              <button
                key={i}
                onClick={() => setTheme({ background: wp })}
                className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${theme.background === wp ? 'border-blue-500' : 'border-transparent hover:border-slate-600'}`}
              >
                <img src={wp} alt="Wallpaper" className="w-full h-full object-cover" />
              </button>
            ))}
             {/* Show current custom wallpaper if it's not in the list */}
             {!wallpapers.includes(theme.background) && (
                 <button
                    className={`relative aspect-video rounded-lg overflow-hidden border-2 border-blue-500`}
                  >
                    <img src={theme.background} alt="Custom Wallpaper" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-xs font-medium">Custom Upload</div>
                  </button>
             )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">Theme Mode</h3>
          <div className="flex items-center gap-4 bg-slate-800 p-4 rounded-lg">
             <span className="text-sm">Dark Mode</span>
             <div className="ml-auto w-10 h-6 bg-blue-600 rounded-full relative">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
