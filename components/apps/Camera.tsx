
import React, { useRef, useState, useEffect } from 'react';
import { Camera as CameraIcon, Video, Square, Circle } from 'lucide-react';

export const CameraApp: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      setError("Could not access camera. Please allow permissions.");
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
        setIsFlashing(true);
        setTimeout(() => setIsFlashing(false), 100);

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const photoUrl = canvas.toDataURL('image/png');
            setPhotos(prev => [photoUrl, ...prev]);
        }
    }
  };

  return (
    <div className="h-full flex flex-col bg-black text-white relative overflow-hidden">
      {/* Viewport */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="text-center p-8 text-red-400">
            <CameraIcon size={48} className="mx-auto mb-4 opacity-50" />
            <p>{error}</p>
          </div>
        ) : (
          <video 
            ref={videoRef}
            autoPlay 
            playsInline
            muted 
            className="h-full w-full object-cover scale-x-[-1]" // Mirror effect
          />
        )}
        
        {/* Flash Effect */}
        <div className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-100 ${isFlashing ? 'opacity-100' : 'opacity-0'}`} />
      </div>

      {/* Gallery Strip */}
      {photos.length > 0 && (
         <div className="h-20 bg-black/80 flex items-center gap-2 px-4 overflow-x-auto custom-scrollbar border-t border-white/10">
             {photos.map((photo, i) => (
                 <a key={i} href={photo} download={`photo-${i}.png`} className="h-16 w-24 shrink-0 rounded-lg overflow-hidden border border-white/20 hover:border-blue-500 transition-colors">
                     <img src={photo} alt={`Capture ${i}`} className="h-full w-full object-cover" />
                 </a>
             ))}
         </div>
      )}

      {/* Controls */}
      <div className="h-24 bg-black/90 flex items-center justify-center gap-8 relative z-10">
         <button 
           onClick={takePhoto}
           disabled={!!error}
           className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
         >
            <div className="w-12 h-12 bg-white rounded-full" />
         </button>
      </div>
      
      {/* Hidden Canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
