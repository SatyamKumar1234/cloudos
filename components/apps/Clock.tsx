import React, { useState, useEffect } from 'react';
import { Clock as ClockIcon, Timer, Hourglass } from 'lucide-react';
import { format } from 'date-fns';

export const Clock: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'clock' | 'stopwatch'>('clock');
  const [time, setTime] = useState(new Date());

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Stopwatch
  const [swTime, setSwTime] = useState(0);
  const [swRunning, setSwRunning] = useState(false);

  useEffect(() => {
    let interval: any;
    if (swRunning) {
      interval = setInterval(() => {
        setSwTime(prev => prev + 10);
      }, 10);
    }
    return () => clearInterval(interval);
  }, [swRunning]);

  const formatStopwatch = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const millis = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${millis.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-white">
      {/* Tab Bar */}
      <div className="flex p-1 bg-slate-900 m-4 rounded-xl">
        <button 
            onClick={() => setActiveTab('clock')}
            className={`flex-1 py-1.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${activeTab === 'clock' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
        >
            <ClockIcon size={16} /> Clock
        </button>
        <button 
            onClick={() => setActiveTab('stopwatch')}
            className={`flex-1 py-1.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${activeTab === 'stopwatch' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
        >
            <Timer size={16} /> Stopwatch
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        {activeTab === 'clock' ? (
            <div className="text-center">
                <h1 className="text-6xl font-light tracking-wider mb-2 font-mono">{format(time, 'HH:mm:ss')}</h1>
                <p className="text-blue-400 text-xl font-medium">{format(time, 'EEEE, MMMM do')}</p>
                
                <div className="mt-12 grid grid-cols-2 gap-8 text-left">
                    <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">New York</p>
                        <p className="text-xl font-medium">-</p>
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">London</p>
                        <p className="text-xl font-medium">-</p>
                    </div>
                </div>
            </div>
        ) : (
            <div className="text-center w-full">
                <div className="w-64 h-64 rounded-full border-4 border-slate-800 mx-auto flex items-center justify-center relative mb-8">
                     <div className="text-5xl font-mono font-variant-numeric tabular-nums">{formatStopwatch(swTime)}</div>
                     {/* Circular indicator simulation */}
                     <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin duration-[2000ms] ease-linear opacity-20" style={{ animationPlayState: swRunning ? 'running' : 'paused' }} />
                </div>
                
                <div className="flex justify-center gap-4">
                    <button 
                        onClick={() => setSwRunning(!swRunning)}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${swRunning ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-green-500/20 text-green-500 hover:bg-green-500/30'}`}
                    >
                        {swRunning ? 'Stop' : 'Start'}
                    </button>
                    <button 
                        onClick={() => { setSwRunning(false); setSwTime(0); }}
                        className="w-16 h-16 rounded-full bg-slate-800 text-white hover:bg-slate-700 flex items-center justify-center"
                    >
                        Reset
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
