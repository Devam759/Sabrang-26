import { useEffect } from 'react';

interface CarouselControlsProps {
  onPrev: () => void;
  onNext: () => void;
}

// DOM arrows pinned to the bottom corners of the section + arrow-key support.
export default function CarouselControls({ onPrev, onNext }: CarouselControlsProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') onPrev();
      else if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onPrev, onNext]);

  return (
    <>
      <button
        type="button"
        className="fsc-arrow fsc-arrow-left"
        aria-label="Previous"
        onClick={onPrev}
      >
        ←
      </button>
      <button
        type="button"
        className="fsc-arrow fsc-arrow-right"
        aria-label="Next"
        onClick={onNext}
      >
        →
      </button>
    </>
  );
}
