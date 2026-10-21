'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Smooth hardware-accelerated enter and exit animation lifecycle
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      const r1 = requestAnimationFrame(() => {
        const r2 = requestAnimationFrame(() => {
          setIsVisible(true);
        });
        return () => cancelAnimationFrame(r2);
      });
      return () => cancelAnimationFrame(r1);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsRendered(false);
      }, 180);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Lock background scrolling and handle Escape key while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isRendered || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3.5 sm:p-6 font-sans text-slate-900 overflow-hidden">
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-950/60 transition-opacity duration-200 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`} 
        onClick={onClose} 
      />
      
      {/* Modal Dialog */}
      <div 
        className={`relative bg-white border border-slate-200 rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-[0_20px_60px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col max-h-[85dvh] sm:max-h-[90vh] z-10 transform transition-all duration-200 cubic-bezier(0.16, 1, 0.3, 1) will-change-transform ${
          isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[60px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
        
        {/* Modal Header */}
        <div className="flex justify-between items-center px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-white relative z-20 shrink-0">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 font-space-grotesk tracking-tight truncate pr-3">{title}</h2>
          <button 
            onClick={onClose} 
            type="button"
            className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 flex items-center justify-center text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 active:scale-90 rounded-full transition-all cursor-pointer focus:outline-none border border-slate-200 shadow-xs touch-manipulation"
            aria-label="Close dialog"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto relative z-10 flex-1 overscroll-contain admin-scrollbar">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
