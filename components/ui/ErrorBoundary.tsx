
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("CloudOS System Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full bg-[#0a0a0a] text-slate-300 flex flex-col items-center justify-center p-8 font-sans selection:bg-red-900 selection:text-white">
          <div className="max-w-md w-full bg-[#111] border border-red-900/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-orange-600" />
            
            <div className="flex items-center gap-3 mb-6 text-red-500">
                <AlertTriangle size={32} />
                <h1 className="text-xl font-bold tracking-tight text-white">System Exception</h1>
            </div>

            <p className="text-sm mb-6 leading-relaxed text-slate-400">
              A critical error has occurred in the process. The application state has been halted to prevent data corruption.
            </p>

            <div className="bg-black/50 rounded-lg p-4 mb-6 border border-white/5 font-mono text-xs text-red-400 overflow-auto max-h-32">
                {this.state.error?.message || "Unknown Runtime Error"}
            </div>

            <button 
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-red-900/20"
            >
                <RefreshCw size={16} /> Restart System
            </button>
          </div>
          <div className="mt-8 text-xs text-slate-600 font-mono">
              CloudOS v2.4 • Error Code: 0xCRASH
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
