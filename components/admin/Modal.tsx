import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans text-slate-900">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" onClick={onClose} />
      
      {/* Modal Dialog */}
      <div className="relative bg-white/90 backdrop-blur-[40px] border border-slate-200 rounded-3xl w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] z-10 animate-in zoom-in-95 duration-200">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[60px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
        
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-200 relative z-10">
          <h2 className="text-lg font-light text-slate-900 font-space-grotesk tracking-wide">{title}</h2>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all cursor-pointer focus:outline-none border border-transparent hover:border-slate-200"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="p-6 overflow-y-auto relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}
