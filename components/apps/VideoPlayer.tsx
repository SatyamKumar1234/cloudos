
import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, Upload, Maximize, FileVideo, Volume1, VolumeX } from 'lucide-react';

export const VideoPlayer: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('No video selected');
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
        if (video.duration) {
            setProgress((video.currentTime / video.duration) * 100);
        }
    };

    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('ended', () => setIsPlaying(false));
    return () => {
        video.removeEventListener('timeupdate', updateProgress);
        video.removeEventListener('ended', () => setIsPlaying(false));
    };
  }, [videoSrc]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setFileName(file.name);
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
      const video = videoRef.current;
      if (!video) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      video.currentTime = pos * video.duration;
  };

  const toggleFullscreen = () => {
      if (document.fullscreenElement) {
          document.exitFullscreen();
      } else {
          containerRef.current?.requestFullscreen();
      }
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      setVolume(val);
      if (videoRef.current) videoRef.current.volume = val;
  };

  return (
    <div ref={containerRef} className="h-full flex flex-col bg-black group relative select-none">
      <div className="flex-1 flex items-center justify-center bg-black overflow-hidden relative" onClick={togglePlay}>
        {videoSrc ? (
          <video 
            ref={videoRef}
            src={videoSrc} 
            className="w-full h-full object-contain"
            autoPlay
          />
        ) : (
          <div className="text-center text-slate-500 flex flex-col items-center">
             <FileVideo size={64} className="mb-4 opacity-50" />
             <p>Select a video file from your computer</p>
          </div>
        )}
      </div>

      {/* Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pt-12 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        
        {/* Progress Bar */}
        <div className="h-1.5 bg-white/20 rounded-full mb-4 cursor-pointer hover:h-2 transition-all relative group/progress" onClick={handleSeek}>
             <div className="h-full bg-blue-500 rounded-full relative" style={{ width: `${progress}%` }}>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 shadow-lg" />
             </div>
        </div>

        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button 
                    onClick={togglePlay}
                    className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
                    disabled={!videoSrc}
                >
                    {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                </button>
                
                <div className="flex items-center gap-2 group/volume">
                    <button onClick={() => { setVolume(volume === 0 ? 1 : 0); if(videoRef.current) videoRef.current.volume = volume === 0 ? 1 : 0; }}>
                        {volume === 0 ? <VolumeX size={20} className="text-white" /> : <Volume2 size={20} className="text-white" />}
                    </button>
                    <input 
                        type="range" 
                        min="0" max="1" step="0.1" 
                        value={volume} 
                        onChange={handleVolume}
                        className="w-0 overflow-hidden group-hover/volume:w-24 transition-all h-1 bg-white/20 rounded-lg accent-blue-500 cursor-pointer" 
                    />
                </div>

                <div className="text-white text-sm font-medium opacity-80">{fileName}</div>
            </div>

            <div className="flex items-center gap-2">
                <label className="p-2 text-white hover:bg-white/20 rounded-lg cursor-pointer transition-colors" title="Open File">
                    <Upload size={20} />
                    <input type="file" accept="video/*" className="hidden" onChange={handleFileUpload} />
                </label>
                <button onClick={toggleFullscreen} className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors">
                    <Maximize size={20} />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
