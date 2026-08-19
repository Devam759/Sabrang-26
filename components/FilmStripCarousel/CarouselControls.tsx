import { useEffect, ReactNode } from 'react';

interface CarouselControlsProps {
  onPrev: () => void;
  onNext: () => void;
  children?: ReactNode;
}

// Arrow keys support + new UI buttons around the pagination
export default function CarouselControls({ onPrev, onNext, children }: CarouselControlsProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') onPrev();
      else if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onPrev, onNext]);

  return (
    <div className="absolute bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4 sm:gap-6 z-20 pointer-events-auto">
      <button
        type="button"
        aria-label="Previous"
        onClick={onPrev}
        className="flex h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 items-center justify-center rounded-full border border-white/15 bg-black/50 backdrop-blur-md text-white transition-all hover:bg-white/15 hover:border-white/30 active:scale-90"
      >
        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
      </button>
      
      {children}
      
      <button
        type="button"
        aria-label="Next"
        onClick={onNext}
        className="flex h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 items-center justify-center rounded-full border border-white/15 bg-black/50 backdrop-blur-md text-white transition-all hover:bg-white/15 hover:border-white/30 active:scale-90"
      >
        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
      </button>
    </div>
  );
}
