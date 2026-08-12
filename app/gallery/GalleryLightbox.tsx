"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

export type OriginRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Fits `aspect` inside the container, leaving room for the viewer chrome. */
function fitRect(aspect: number, w: number, h: number): OriginRect {
  const compact = w < 640;
  const maxW = w * (compact ? 0.9 : 0.8);
  const maxH = h * (compact ? 0.64 : 0.76);
  let width = maxW;
  let height = width / aspect;
  if (height > maxH) {
    height = maxH;
    width = height * aspect;
  }
  return { x: (w - width) / 2, y: (h - height) / 2, width, height };
}

export default function GalleryLightbox({
  images,
  index,
  aspect: initialAspect,
  origin,
  containerRef,
  measureOrigin,
  onIndexChange,
  onClose,
}: {
  images: ReadonlyArray<{ src: string; title: string }>;
  index: number;
  aspect: number;
  origin: OriginRect;
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Re-reads the screen rect of the tile that opened the viewer. */
  measureOrigin: () => OriginRect | null;
  onIndexChange: (next: number) => void;
  onClose: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const spring = reduceMotion
    ? ({ duration: 0.2 } as const)
    : ({ type: "spring", stiffness: 170, damping: 24, mass: 0.85 } as const);

  const [bounds, setBounds] = useState<{ w: number; h: number } | null>(null);
  const [aspect, setAspect] = useState(initialAspect);
  const [dir, setDir] = useState(1);
  const [exitRect, setExitRect] = useState<OriginRect | null>(null);
  const closing = exitRect !== null;

  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const touchStartX = useRef<number | null>(null);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const read = () => {
      const rect = el.getBoundingClientRect();
      setBounds({ w: rect.width, h: rect.height });
    };
    read();
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef]);

  // Reverse the shared-element move to wherever the source tile sits *now*.
  const close = useCallback(() => {
    setExitRect((current) => current ?? measureOrigin() ?? origin);
  }, [measureOrigin, origin]);

  // A dropped animation callback must never leave the viewer stuck open.
  useEffect(() => {
    if (!closing) return;
    const timer = window.setTimeout(onClose, 900);
    return () => window.clearTimeout(timer);
  }, [closing, onClose]);

  const go = useCallback(
    (delta: number) => {
      if (closing) return;
      setDir(delta);
      onIndexChange((index + delta + images.length) % images.length);
    },
    [closing, images.length, index, onIndexChange],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      else if (event.key === "ArrowLeft") go(-1);
      else if (event.key === "ArrowRight") go(1);
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, go]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    return () => previous?.focus?.();
  }, []);

  const target = bounds ? fitRect(aspect, bounds.w, bounds.h) : origin;
  const image = images[index];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${image.title}, image ${index + 1} of ${images.length}`}
      className="absolute inset-0 z-40 cursor-auto select-none"
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0].clientX;
      }}
      onTouchEnd={(event) => {
        const start = touchStartX.current;
        touchStartX.current = null;
        if (start === null) return;
        const dx = event.changedTouches[0].clientX - start;
        if (Math.abs(dx) > 48) go(dx < 0 ? 1 : -1);
      }}
    >
      <motion.div
        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: closing ? 0 : 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        onClick={close}
      />

      <motion.div
        className="absolute left-0 top-0 overflow-hidden bg-black/40 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)]"
        initial={{ ...origin, borderRadius: 3 }}
        animate={
          closing
            ? { ...exitRect, borderRadius: 3 }
            : { ...target, borderRadius: 10 }
        }
        transition={spring}
        onAnimationComplete={() => {
          if (closing) onClose();
        }}
      >
        <AnimatePresence initial={false}>
          <motion.img
            key={index}
            src={image.src}
            alt={image.title}
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover"
            initial={{ opacity: 0, x: dir * 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -28 }}
            transition={{
              duration: reduceMotion ? 0.15 : 0.32,
              ease: [0.22, 1, 0.36, 1],
            }}
            onLoad={(event) => {
              const el = event.currentTarget;
              if (el.naturalHeight > 0)
                setAspect(el.naturalWidth / el.naturalHeight);
            }}
          />
        </AnimatePresence>
      </motion.div>

      <motion.div
        className="pointer-events-none absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: closing ? 0 : 1 }}
        transition={{ duration: 0.3, delay: closing ? 0 : 0.18 }}
      >
        <div className="absolute left-5 top-6 md:left-10 md:top-9">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-white/90 md:text-base">
            {image.title}
          </p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-white/40">
            {String(index + 1).padStart(2, "0")} /{" "}
            {String(images.length).padStart(2, "0")}
          </p>
        </div>

        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Close image viewer"
          onClick={close}
          className="pointer-events-auto absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/60 text-white/70 transition hover:border-white/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60 md:right-10 md:top-8"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path d="M5 5l14 14M19 5L5 19" strokeLinecap="round" />
          </svg>
        </button>

        <button
          type="button"
          aria-label="Previous image"
          onClick={() => go(-1)}
          className="pointer-events-auto absolute left-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/50 text-white/60 transition hover:border-white/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60 md:left-8"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              d="M15 5l-7 7 7 7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <button
          type="button"
          aria-label="Next image"
          onClick={() => go(1)}
          className="pointer-events-auto absolute right-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/50 text-white/60 transition hover:border-white/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60 md:right-8"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              d="M9 5l7 7-7 7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <p className="absolute inset-x-0 bottom-7 text-center text-[10px] uppercase tracking-[0.3em] text-white/30">
          Esc to close
        </p>
      </motion.div>
    </div>
  );
}
