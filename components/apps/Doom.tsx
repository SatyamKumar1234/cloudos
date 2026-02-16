
import React from 'react';

export const Doom: React.FC = () => {
  return (
    <div className="h-full w-full bg-black flex flex-col items-center justify-center overflow-hidden relative">
      <div className="z-10 w-full h-full">
         {/* Using dos.zone player for a reliable WASM Doom experience */}
         <iframe 
            src="https://dos.zone/player/?bundleUrl=https%3A%2F%2Fcdn.dos.zone%2Foriginal%2F2%2Fdoom.jsdos?anonymous=1"
            className="w-full h-full border-0"
            title="Doom"
            allow="autoplay; fullscreen; gamepad"
         />
      </div>
    </div>
  );
};
