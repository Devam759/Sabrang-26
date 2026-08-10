'use client';

import { useEffect, useState } from 'react';

export default function MissionScreen({ 
  isOpen, 
  onClose, 
  title, 
  content 
}: { 
  isOpen: boolean, 
  onClose: () => void,
  title: string,
  content: React.ReactNode
}) {
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setGlitch(true);
      const t = setTimeout(() => setGlitch(false), 800);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
      <div 
        className={`relative w-full max-w-4xl bg-black/80 border border-cyan-500/30 p-8 shadow-[0_0_50px_rgba(0,255,255,0.1)] ${glitch ? 'animate-pulse' : ''}`}
        style={{
          boxShadow: 'inset 0 0 20px rgba(0,255,255,0.05), 0 0 50px rgba(0,255,255,0.1)'
        }}
      >
        {/* Holographic Scanlines Overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
          <div className="w-full h-2 bg-cyan-400 blur-sm animate-[scan_2s_linear_infinite]" />
        </div>

        {/* HUD Elements */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />

        <div className="flex justify-between items-start mb-12 border-b border-cyan-500/20 pb-4">
          <div>
            <h2 className="text-3xl font-black text-cyan-400 uppercase tracking-widest">{title}</h2>
            <div className="text-xs text-cyan-500/50 mt-1 font-mono">SYS.REQ // AUTHORIZED</div>
          </div>
          <button 
            onClick={onClose}
            className="text-cyan-400 hover:text-white hover:bg-cyan-900/50 px-4 py-2 text-sm font-mono tracking-widest transition-colors border border-cyan-500/30"
          >
            [ CLOSE ]
          </button>
        </div>

        <div className="text-slate-300 font-mono text-lg leading-relaxed space-y-6">
          {content}
        </div>

        {/* Decorative Grid */}
        <div className="absolute bottom-4 right-4 flex gap-1">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`w-1 h-4 ${i % 2 === 0 ? 'bg-cyan-500/50' : 'bg-cyan-500/20'}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
