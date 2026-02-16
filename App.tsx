
import React from 'react';
import { OSProvider, useOS } from './context/OSContext';
import { Desktop } from './components/os/Desktop';
import { Taskbar } from './components/os/Taskbar';
import { WindowFrame } from './components/os/WindowFrame';
import { FileManager } from './components/apps/FileManager';
import { TextEditor } from './components/apps/TextEditor';
import { Browser } from './components/apps/Browser';
import { Calculator } from './components/apps/Calculator';
import { Settings } from './components/apps/Settings';
import { Terminal } from './components/apps/Terminal';
import { TicTacToe } from './components/apps/TicTacToe';
import { Paint } from './components/apps/Paint';
import { MusicPlayer } from './components/apps/MusicPlayer';
import { Clock } from './components/apps/Clock';
import { CodeEditor } from './components/apps/CodeEditor';
import { VideoPlayer } from './components/apps/VideoPlayer';
import { CameraApp } from './components/apps/Camera';
import { CalendarApp } from './components/apps/Calendar';
import { Doom } from './components/apps/Doom';
import { V86 } from './components/apps/V86';
import { AiRunner } from './components/apps/AiRunner';
import { ImageViewer } from './components/apps/ImageViewer';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { AppId } from './types';

const OSContent: React.FC = () => {
  const { windows } = useOS();

  const renderApp = (appId: AppId, data?: any) => {
    switch (appId) {
      case 'file-manager': return <FileManager initialPath={data?.path} />;
      case 'text-editor': return <TextEditor fileId={data?.fileId} />;
      case 'code-editor': return <CodeEditor />;
      case 'browser': return <Browser htmlContent={data?.htmlContent} title={data?.title} />;
      case 'calculator': return <Calculator />;
      case 'settings': return <Settings />;
      case 'terminal': return <Terminal />;
      case 'tictactoe': return <TicTacToe />;
      case 'paint': return <Paint />;
      case 'music': return <MusicPlayer />;
      case 'video-player': return <VideoPlayer />;
      case 'clock': return <Clock />;
      case 'camera': return <CameraApp />;
      case 'calendar': return <CalendarApp />;
      case 'doom': return <Doom />;
      case 'v86': return <V86 />;
      case 'ai-runner': return <AiRunner />;
      case 'image-viewer': return <ImageViewer fileId={data?.fileId} />;
      default: return <div className="p-4 text-white">App not found</div>;
    }
  };

  return (
    <div className="h-full w-full relative overflow-hidden bg-black select-none font-sans">
      <Desktop />
      
      {/* Window Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {windows.map(window => (
          <div key={window.id} className="pointer-events-auto">
             <WindowFrame window={window}>
                <ErrorBoundary>
                   {renderApp(window.appId, window.data)}
                </ErrorBoundary>
             </WindowFrame>
          </div>
        ))}
      </div>

      <Taskbar />
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <OSProvider>
        <OSContent />
      </OSProvider>
    </ErrorBoundary>
  );
}

export default App;
