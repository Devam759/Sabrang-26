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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 pt-16 sm:pt-4 font-sans text-slate-900">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md transition-opacity z-[100]" onClick={onClose} />
      
      {/* Modal Dialog */}
      <div className="relative bg-white/95 backdrop-blur-[40px] border border-slate-200 rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-[0_10px_50px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh] z-[105] animate-in zoom-in-95 duration-200">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[60px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
        
        {/* Modal Header */}
        <div className="flex justify-between items-center px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl relative z-20 shrink-0">
          <h2 className="text-base sm:text-lg font-bold sm:font-light text-slate-900 font-space-grotesk tracking-tight sm:tracking-wide truncate pr-2">{title}</h2>
          <button 
            onClick={onClose} 
            type="button"
            className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 flex items-center justify-center text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 active:scale-90 rounded-full transition-all cursor-pointer focus:outline-none border border-slate-200 shadow-xs"
            aria-label="Close dialog"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto relative z-10 flex-1 overscroll-contain admin-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
