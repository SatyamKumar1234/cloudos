
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, ListMusic, Heart, Plus, Music } from 'lucide-react';

interface Song {
  id: string;
  title: string;
  artist: string;
  url: string;
  duration?: number;
}

export const MusicPlayer: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showPlaylist, setShowPlaylist] = useState(false);

  const [playlist, setPlaylist] = useState<Song[]>([
    { id: '1', title: "Demo Song", artist: "CloudOS Band", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" }
  ]);

  const currentSong = playlist[currentSongIndex];

  useEffect(() => {
    if (audioRef.current) {
        if (isPlaying) {
            audioRef.current.play().catch(e => {
                console.error("Autoplay prevented", e);
                setIsPlaying(false);
            });
        } else {
            audioRef.current.pause();
        }
    }
  }, [isPlaying, currentSong]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
        setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSongEnd = () => {
    handleNext();
  };

  const handleNext = () => {
    setCurrentSongIndex((prev) => (prev + 1) % playlist.length);
  };

  const handlePrev = () => {
    setCurrentSongIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
        audioRef.current.currentTime = time;
        setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (audioRef.current) {
        audioRef.current.volume = vol;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        const newSongs: Song[] = Array.from(e.target.files).map((file: File) => ({
            id: Math.random().toString(36),
            title: file.name.replace(/\.[^/.]+$/, ""),
            artist: "Local File",
            url: URL.createObjectURL(file)
        }));
        setPlaylist(prev => [...prev, ...newSongs]);
        if (playlist.length === 0) setIsPlaying(true);
    }
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-slate-900 to-black text-white relative overflow-hidden">
      
      <audio 
        ref={audioRef}
        src={currentSong?.url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleSongEnd}
        onLoadedMetadata={handleTimeUpdate}
      />

      {/* Main View */}
      <div className={`flex-1 flex flex-col relative z-10 transition-all duration-300 ${showPlaylist ? 'opacity-20 blur-sm pointer-events-none' : 'opacity-100'}`}>
          {/* Album Art / Visual */}
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className={`w-64 h-64 rounded-full shadow-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center mb-8 relative group transition-all duration-700 ${isPlaying ? 'scale-100 rotate-0' : 'scale-95'}`}>
                {/* Spinning Animation when playing */}
                 <div className={`absolute inset-0 rounded-full border-4 border-white/10 border-t-white/50 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
                 <Music size={64} className="text-white drop-shadow-lg" />
            </div>
            
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-2 tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">{currentSong?.title || "No Song Selected"}</h2>
                <p className="text-slate-400 font-medium">{currentSong?.artist || "Unknown Artist"}</p>
            </div>
          </div>
      </div>

      {/* Playlist Overlay */}
      <div className={`absolute inset-x-0 bottom-24 top-0 bg-black/80 backdrop-blur-xl p-4 transition-transform duration-300 z-20 flex flex-col ${showPlaylist ? 'translate-y-0' : 'translate-y-[110%]'}`}>
          <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
              <h3 className="font-bold text-lg">Queue ({playlist.length})</h3>
              <label className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 rounded-full text-xs cursor-pointer hover:bg-blue-500 transition-colors">
                  <Plus size={14} /> Add Songs
                  <input type="file" multiple accept="audio/*" className="hidden" onChange={handleFileUpload} />
              </label>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
              {playlist.map((song, idx) => (
                  <div 
                    key={song.id} 
                    onClick={() => { setCurrentSongIndex(idx); setIsPlaying(true); setShowPlaylist(false); }}
                    className={`p-3 rounded-xl flex items-center justify-between cursor-pointer mb-2 transition-colors ${currentSongIndex === idx ? 'bg-white/10 border border-blue-500/30' : 'hover:bg-white/5 border border-transparent'}`}
                  >
                      <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-500 w-4">{idx + 1}</span>
                          <div>
                              <div className={`text-sm font-medium ${currentSongIndex === idx ? 'text-blue-400' : 'text-white'}`}>{song.title}</div>
                              <div className="text-xs text-slate-500">{song.artist}</div>
                          </div>
                      </div>
                      {currentSongIndex === idx && isPlaying && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
                  </div>
              ))}
              {playlist.length === 0 && <div className="text-center text-slate-500 mt-10">Playlist is empty</div>}
          </div>
      </div>

      {/* Controls Bar */}
      <div className="h-24 bg-[#111] border-t border-white/5 px-6 flex flex-col justify-center z-30 relative">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800 cursor-pointer group" onMouseDown={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            if(audioRef.current) audioRef.current.currentTime = percent * (audioRef.current.duration || 0);
        }}>
            <div 
                className="h-full bg-blue-500 relative transition-all duration-100" 
                style={{ width: `${(currentTime / duration) * 100}%` }}
            >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-[0_0_10px_rgba(59,130,246,0.5)] transform scale-150" />
            </div>
        </div>

        <div className="flex items-center justify-between mt-2">
            {/* Info / Time */}
            <div className="w-20 text-xs text-slate-400 font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            {/* Main Controls */}
            <div className="flex items-center gap-6">
                <button onClick={handlePrev} className="text-slate-400 hover:text-white transition-colors active:scale-90"><SkipBack size={24} /></button>
                <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-white/10"
                >
                    {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                </button>
                <button onClick={handleNext} className="text-slate-400 hover:text-white transition-colors active:scale-90"><SkipForward size={24} /></button>
            </div>

            {/* Volume / Playlist */}
            <div className="flex items-center gap-4 w-auto justify-end">
                <div className="flex items-center gap-2 group w-24">
                    <Volume2 size={16} className="text-slate-400" />
                    <input 
                        type="range" 
                        min="0" max="1" step="0.05" 
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                </div>
                <button 
                    onClick={() => setShowPlaylist(!showPlaylist)}
                    className={`p-2 rounded-lg transition-colors ${showPlaylist ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                >
                    <ListMusic size={20} />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
