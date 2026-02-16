import React, { useState, useRef, useEffect } from 'react';
import { Send, BrainCircuit, Bot, User, Trash2, Loader2, Sparkles } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const AiRunner: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm your Gemini-powered assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Initialize Google GenAI client
  // API Key is assumed to be available in process.env.API_KEY as per guidelines
  const [ai] = useState(() => new GoogleGenAI({ apiKey: process.env.API_KEY }));

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
      });

      const text = response.text || "I couldn't generate a response.";
      setMessages(prev => [...prev, { role: 'assistant', content: text }]);
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      setMessages(prev => [...prev, { role: 'system', content: `Error: ${error.message || 'Failed to connect to Gemini API'}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#18181b] text-zinc-100 font-sans relative overflow-hidden">
      {/* Header */}
      <div className="h-12 border-b border-white/5 bg-[#27272a] flex items-center px-4 justify-between shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-2">
              <Sparkles className="text-blue-400" size={18} />
              <span className="font-medium text-sm">Gemini AI</span>
              <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">gemini-3-flash</span>
          </div>
          <button onClick={() => setMessages([])} className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-red-400 transition-colors">
              <Trash2 size={16} />
          </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar scroll-smooth">
          <div className="flex flex-col gap-4 max-w-2xl mx-auto">
              {messages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role !== 'user' && (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'system' ? 'bg-red-500/10 text-red-500' : 'bg-blue-600 text-white'}`}>
                              {msg.role === 'system' ? <Bot size={16} /> : <Sparkles size={16} />}
                          </div>
                      )}
                      
                      <div 
                        className={`
                            max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap
                            ${msg.role === 'user' 
                                ? 'bg-blue-600 text-white rounded-br-none' 
                                : msg.role === 'system'
                                    ? 'bg-red-500/10 text-red-200 border border-red-500/20 rounded-xl w-full'
                                    : 'bg-[#27272a] border border-white/5 text-zinc-100 rounded-bl-none'
                            }
                        `}
                      >
                          {msg.content}
                      </div>

                      {msg.role === 'user' && (
                          <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
                              <User size={18} />
                          </div>
                      )}
                  </div>
              ))}
              {isLoading && (
                  <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <Sparkles size={16} />
                      </div>
                      <div className="bg-[#27272a] border border-white/5 px-4 py-3 rounded-2xl rounded-bl-none flex items-center gap-2">
                          <Loader2 size={16} className="animate-spin text-zinc-400" />
                          <span className="text-xs text-zinc-400">Gemini is thinking...</span>
                      </div>
                  </div>
              )}
              <div ref={messagesEndRef} />
          </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#18181b] border-t border-white/5 shrink-0">
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto relative flex items-end gap-2">
              <div className="flex-1 relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask Gemini anything..."
                    className="w-full bg-[#27272a] text-zinc-100 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 border border-transparent focus:border-blue-500/50 transition-all placeholder:text-zinc-500"
                    disabled={isLoading}
                  />
              </div>

              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-blue-900/20"
              >
                  <Send size={18} />
              </button>
          </form>
          <div className="text-center mt-2">
             <span className="text-[10px] text-zinc-600">Powered by Google Gemini</span>
          </div>
      </div>
    </div>
  );
};
