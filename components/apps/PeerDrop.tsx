
import React, { useState, useEffect, useRef } from 'react';
import { Share2, Copy, Download, Upload, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import Peer, { DataConnection } from 'peerjs';
import { useOS } from '../../context/OSContext';

interface TransferItem {
  id: string;
  fileName: string;
  type: 'incoming' | 'outgoing';
  status: 'pending' | 'completed' | 'failed';
  timestamp: number;
}

export const PeerDrop: React.FC = () => {
  const { createFile } = useOS();
  const [peer, setPeer] = useState<Peer | null>(null);
  const [myId, setMyId] = useState<string>('');
  const [targetId, setTargetId] = useState('');
  const [connection, setConnection] = useState<DataConnection | null>(null);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    // Initialize Peer
    const newPeer = new Peer();

    newPeer.on('open', (id) => {
      setMyId(id);
    });

    newPeer.on('connection', (conn) => {
      handleConnection(conn);
    });

    newPeer.on('error', (err) => {
      console.error(err);
      setStatus('disconnected');
    });

    setPeer(newPeer);

    return () => {
      newPeer.destroy();
    };
  }, []);

  const handleConnection = (conn: DataConnection) => {
    setConnection(conn);
    setStatus('connected');
    setTargetId(conn.peer);

    conn.on('data', (data: any) => {
      if (data && data.fileName && data.fileData) {
        // Received file
        createFile('downloads', data.fileName, 'text', data.fileData); // Saving as text/base64 for simplicity in this demo
        
        setTransfers(prev => [{
            id: Math.random().toString(36),
            fileName: data.fileName,
            type: 'incoming',
            status: 'completed',
            timestamp: Date.now()
        }, ...prev]);
      }
    });

    conn.on('close', () => {
      setStatus('disconnected');
      setConnection(null);
    });
  };

  const connectToPeer = () => {
    if (!peer || !targetId) return;
    setStatus('connecting');
    const conn = peer.connect(targetId);
    handleConnection(conn);
  };

  const copyId = () => {
    navigator.clipboard.writeText(myId);
    alert('ID Copied to clipboard!');
  };

  // Drag and Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (status !== 'connected' || !connection) {
        alert("Please connect to a peer first.");
        return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
       sendFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (status !== 'connected' || !connection) {
        alert("Please connect to a peer first.");
        return;
      }
      if (e.target.files && e.target.files[0]) {
          sendFile(e.target.files[0]);
      }
  };

  const sendFile = (file: File) => {
      if (!connection) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
          const result = ev.target?.result;
          connection.send({
              fileName: file.name,
              fileData: result
          });

          setTransfers(prev => [{
            id: Math.random().toString(36),
            fileName: file.name,
            type: 'outgoing',
            status: 'completed',
            timestamp: Date.now()
          }, ...prev]);
      };
      reader.readAsText(file); // sending as text/dataURL for simplicity
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white p-6 relative" onDragEnter={handleDrag}>
      <div className="text-center mb-8">
          <div className="inline-block p-4 rounded-full bg-blue-600/20 mb-4">
              <Share2 size={32} className="text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold mb-1">PeerDrop</h2>
          <p className="text-slate-400 text-sm">P2P File Transfer over WebRTC</p>
      </div>

      <div className="space-y-6 max-w-sm mx-auto w-full">
          {/* My Identity */}
          <div className="bg-slate-800 p-4 rounded-xl border border-white/5">
              <label className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2 block">Your ID</label>
              <div className="flex gap-2">
                  <div className="flex-1 bg-black/50 p-2 rounded font-mono text-sm truncate text-slate-300">
                      {myId || 'Generating...'}
                  </div>
                  <button onClick={copyId} className="p-2 bg-blue-600 rounded hover:bg-blue-500 transition-colors" title="Copy ID">
                      <Copy size={16} />
                  </button>
              </div>
          </div>

          {/* Connection */}
          <div className="bg-slate-800 p-4 rounded-xl border border-white/5">
              <label className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2 block">Connect to Peer</label>
              <div className="flex gap-2 mb-3">
                  <input 
                    type="text" 
                    placeholder="Enter Peer ID"
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    className="flex-1 bg-black/50 p-2 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={status === 'connected'}
                  />
                  {status === 'connected' ? (
                       <button onClick={() => { setConnection(null); setStatus('disconnected'); }} className="px-4 py-2 bg-red-600 rounded hover:bg-red-500 text-sm font-medium transition-colors">
                           Disconnect
                       </button>
                  ) : (
                       <button onClick={connectToPeer} disabled={status === 'connecting' || !targetId} className="px-4 py-2 bg-green-600 rounded hover:bg-green-500 text-sm font-medium transition-colors disabled:opacity-50">
                           {status === 'connecting' ? '...' : 'Connect'}
                       </button>
                  )}
              </div>
              
              <div className="flex items-center gap-2 text-sm justify-center">
                  Status: 
                  <span className={`flex items-center gap-1 font-medium ${status === 'connected' ? 'text-green-400' : status === 'connecting' ? 'text-yellow-400' : 'text-red-400'}`}>
                      {status === 'connected' ? <CheckCircle2 size={14}/> : status === 'connecting' ? <RefreshCw size={14} className="animate-spin"/> : <XCircle size={14}/>}
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
              </div>
          </div>

          {/* Drop Zone / Action */}
          <div 
             className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-slate-500'}`}
             onDragEnter={handleDrag} 
             onDragLeave={handleDrag} 
             onDragOver={handleDrag} 
             onDrop={handleDrop}
          >
              <Upload size={32} className="mx-auto mb-2 text-slate-500" />
              <p className="text-sm text-slate-300 mb-4">Drag & Drop files here or</p>
              <label className={`px-4 py-2 bg-slate-700 rounded-lg text-sm font-medium cursor-pointer hover:bg-slate-600 transition-colors ${status !== 'connected' ? 'opacity-50 pointer-events-none' : ''}`}>
                  Browse Files
                  <input type="file" className="hidden" onChange={handleFileSelect} disabled={status !== 'connected'} />
              </label>
          </div>
      </div>

      {/* History */}
      <div className="mt-8 flex-1 overflow-y-auto">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">Transfer History</h3>
          <div className="space-y-2">
              {transfers.length === 0 && <p className="text-slate-600 text-center text-sm italic">No transfers yet</p>}
              {transfers.map(item => (
                  <div key={item.id} className="bg-slate-800/50 p-3 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${item.type === 'incoming' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                              {item.type === 'incoming' ? <Download size={16} /> : <Upload size={16} />}
                          </div>
                          <div>
                              <div className="text-sm font-medium truncate max-w-[150px]">{item.fileName}</div>
                              <div className="text-[10px] text-slate-500">{new Date(item.timestamp).toLocaleTimeString()}</div>
                          </div>
                      </div>
                      <span className="text-xs text-green-500 font-medium">Completed</span>
                  </div>
              ))}
          </div>
      </div>

      {dragActive && (
        <div className="absolute inset-0 bg-blue-600/90 z-50 flex items-center justify-center rounded-xl backdrop-blur-sm animate-in fade-in">
            <div className="text-center">
                <Upload size={48} className="mx-auto mb-4 text-white animate-bounce" />
                <h3 className="text-2xl font-bold text-white">Drop to Send</h3>
            </div>
        </div>
      )}
    </div>
  );
};
