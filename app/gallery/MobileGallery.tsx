"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, type PanInfo, type Variants } from "framer-motion";
import { GALLERY_IMAGES } from "@/lib/constants";

const slideVariants: Variants = {
  enter: (d: number) => ({
    opacity: 0,
    x: d > 0 ? 100 : d < 0 ? -100 : 0,
    scale: 0.96,
  }),
  center: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 350, damping: 30 },
  },
  exit: (d: number) => ({
    opacity: 0,
    x: d > 0 ? -100 : d < 0 ? 100 : 0,
    scale: 0.96,
    transition: { duration: 0.18 },
  }),
};

export default function MobileGallery() {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [dir, setDir] = useState<number>(0);

  const handleNext = useCallback(() => {
    if (selectedIdx !== null) {
      setDir(1);
      setSelectedIdx((selectedIdx + 1) % GALLERY_IMAGES.length);
    }
  }, [selectedIdx]);

  const handlePrev = useCallback(() => {
    if (selectedIdx !== null) {
      setDir(-1);
      setSelectedIdx((selectedIdx - 1 + GALLERY_IMAGES.length) % GALLERY_IMAGES.length);
    }
  }, [selectedIdx]);

  // Keyboard navigation
  useEffect(() => {
    if (selectedIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedIdx(null);
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedIdx, handleNext, handlePrev]);

  // Lightbox swipe gesture
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const swipeThreshold = 40;
    const velocityThreshold = 350;

    if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      handleNext();
    } else if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      handlePrev();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-3 pt-24 pb-24 overflow-y-auto">
      {/* Header */}
      <div className="max-w-xl mx-auto mb-4 px-1 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white">
            Gallery
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5 font-mono tracking-wider">
            {GALLERY_IMAGES.length} FESTIVAL MEMORIES
          </p>
        </div>
      </div>

      {/* High-Performance 2-Column Grid with Next.js Auto-Optimized Thumbnails */}
      <div className="grid grid-cols-2 gap-2 max-w-xl mx-auto">
        {GALLERY_IMAGES.map((item, idx) => (
          <div
            key={item.id}
            onClick={() => {
              setDir(0);
              setSelectedIdx(idx);
            }}
            style={{
              contentVisibility: "auto",
              containIntrinsicSize: "0 220px",
            }}
            className="group relative aspect-[3/4] w-full overflow-hidden rounded-md bg-neutral-900 border border-white/10 active:scale-[0.98] transition-transform duration-150 cursor-pointer select-none"
          >
            <Image
              src={item.src}
              alt={item.title}
              fill
              sizes="(max-width: 640px) 48vw, 240px"
              quality={65}
              loading="lazy"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {/* Subtle corner badge */}
            <div className="pointer-events-none absolute bottom-1.5 left-1.5 text-[9px] font-mono text-white/50 bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-sm">
              #{String(idx + 1).padStart(2, "0")}
            </div>
          </div>
        ))}
      </div>

      {/* Fullscreen Lightbox with Swipe Physics */}
      <AnimatePresence>
        {selectedIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/95 backdrop-blur-xl p-4 touch-none select-none"
            onClick={() => setSelectedIdx(null)}
          >
            {/* Top Bar */}
            <div className="w-full flex items-center justify-between z-20 pt-3 px-2">
              <span className="font-mono text-xs font-bold tracking-widest text-slate-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                {String(selectedIdx + 1).padStart(2, "0")} / {String(GALLERY_IMAGES.length).padStart(2, "0")}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIdx(null);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white active:scale-90 transition-transform"
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            {/* Centered Image with Horizontal Swipe Physics */}
            <div
              className="relative w-full max-w-md max-h-[72vh] my-auto flex items-center justify-center overflow-visible"
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence mode="popLayout" custom={dir} initial={false}>
                <motion.div
                  key={selectedIdx}
                  custom={dir}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={handleDragEnd}
                  className="relative w-full aspect-[3/4] max-h-[72vh] flex items-center justify-center cursor-grab active:cursor-grabbing"
                >
                  <Image
                    src={GALLERY_IMAGES[selectedIdx].src}
                    alt={GALLERY_IMAGES[selectedIdx].title}
                    fill
                    sizes="(max-width: 640px) 100vw, 600px"
                    quality={85}
                    priority
                    className="object-contain rounded-lg shadow-2xl pointer-events-none"
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Controls */}
            <div
              className="w-full flex items-center justify-center gap-6 pb-6 z-20"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handlePrev}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md active:scale-90 transition-all hover:bg-white/20"
                aria-label="Previous"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <button
                onClick={handleNext}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md active:scale-90 transition-all hover:bg-white/20"
                aria-label="Next"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
