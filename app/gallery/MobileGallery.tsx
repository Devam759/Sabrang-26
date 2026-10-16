"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { GALLERY_IMAGES } from "@/lib/constants";
import type Hammer from "hammerjs";

const slideVariants: Variants = {
  enter: (d: number) => ({
    opacity: 0,
    x: d > 0 ? 90 : d < 0 ? -90 : 0,
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
    x: d > 0 ? -90 : d < 0 ? 90 : 0,
    scale: 0.96,
    transition: { duration: 0.16 },
  }),
};

export default function MobileGallery() {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [dir, setDir] = useState<number>(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [zoomScaleDisplay, setZoomScaleDisplay] = useState(1);

  // References for live gestures on the image container
  const lightboxContainerRef = useRef<HTMLDivElement>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const hammerManagerRef = useRef<HammerManager | null>(null);

  // Gesture transform trackers
  const scaleRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const baseScaleRef = useRef(1);
  const basePanRef = useRef({ x: 0, y: 0 });
  const isPinchingRef = useRef(false);
  const isPanningRef = useRef(false);

  const applyTransform = useCallback((s: number, x: number, y: number, transition = false) => {
    const el = imageWrapperRef.current;
    if (!el) return;
    el.style.transition = transition ? "transform 0.26s cubic-bezier(0.2, 0.8, 0.25, 1)" : "none";
    el.style.transform = `translate3d(${x}px, ${y}px, 0px) scale(${s})`;
  }, []);

  const resetZoom = useCallback((withTransition = true) => {
    scaleRef.current = 1;
    panRef.current = { x: 0, y: 0 };
    baseScaleRef.current = 1;
    basePanRef.current = { x: 0, y: 0 };
    setIsZoomed(false);
    setZoomScaleDisplay(1);
    applyTransform(1, 0, 0, withTransition);
    if (backdropRef.current) {
      backdropRef.current.style.opacity = "1";
    }
  }, [applyTransform]);

  const handleNext = useCallback(() => {
    resetZoom(false);
    if (selectedIdx !== null) {
      setDir(1);
      setSelectedIdx((selectedIdx + 1) % GALLERY_IMAGES.length);
    }
  }, [selectedIdx, resetZoom]);

  const handlePrev = useCallback(() => {
    resetZoom(false);
    if (selectedIdx !== null) {
      setDir(-1);
      setSelectedIdx((selectedIdx - 1 + GALLERY_IMAGES.length) % GALLERY_IMAGES.length);
    }
  }, [selectedIdx, resetZoom]);

  const closeLightbox = useCallback(() => {
    resetZoom(false);
    setSelectedIdx(null);
  }, [resetZoom]);

  // Keyboard navigation
  useEffect(() => {
    if (selectedIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedIdx, handleNext, handlePrev, closeLightbox]);

  // Reset transform whenever active image changes
  useEffect(() => {
    resetZoom(false);
  }, [selectedIdx, resetZoom]);

  // Initialize Hammer.js on mobile lightbox viewport
  useEffect(() => {
    if (selectedIdx === null) return;

    let isMounted = true;
    let hammerInstance: HammerManager | null = null;

    // Dynamically import Hammer.js (SSR safe)
    import("hammerjs").then((module) => {
      if (!isMounted) return;
      const HammerLib = (module.default || module) as typeof Hammer;

      const container = lightboxContainerRef.current;
      if (!container) return;

      // Create Hammer Manager with full multi-touch recognition
      const mc = new HammerLib.Manager(container, {
        touchAction: "none",
      });
      hammerInstance = mc;
      hammerManagerRef.current = mc;

      // Recognizers
      const pinch = new HammerLib.Pinch({ enable: true, threshold: 0 });
      const pan = new HammerLib.Pan({
        direction: HammerLib.DIRECTION_ALL,
        threshold: 8,
      });
      const swipe = new HammerLib.Swipe({
        direction: HammerLib.DIRECTION_ALL,
        velocity: 0.28,
        threshold: 20,
      });
      const doubleTap = new HammerLib.Tap({
        event: "doubletap",
        taps: 2,
        posThreshold: 35,
        interval: 280,
      });
      const singleTap = new HammerLib.Tap({
        event: "singletap",
        taps: 1,
      });

      // Simultaneous and failure relations
      singleTap.requireFailure(doubleTap);
      pinch.recognizeWith(pan);
      swipe.recognizeWith(pan);

      mc.add([pinch, pan, swipe, doubleTap, singleTap]);

      // --- 1. PINCH TO ZOOM ---
      mc.on("pinchstart", (e) => {
        isPinchingRef.current = true;
        baseScaleRef.current = scaleRef.current;
        basePanRef.current = { ...panRef.current };
      });

      mc.on("pinchmove", (e) => {
        if (!isPinchingRef.current) return;
        const targetScale = Math.min(Math.max(baseScaleRef.current * e.scale, 0.85), 4.2);
        scaleRef.current = targetScale;
        setIsZoomed(targetScale > 1.08);
        setZoomScaleDisplay(Number(targetScale.toFixed(1)));
        applyTransform(targetScale, panRef.current.x, panRef.current.y, false);
      });

      mc.on("pinchend pinchcancel", () => {
        isPinchingRef.current = false;
        if (scaleRef.current < 1.08) {
          // Snap back to 1x
          resetZoom(true);
        } else {
          // Keep zoomed in, clamp scale within 1 - 4
          const clampedScale = Math.min(Math.max(scaleRef.current, 1), 4);
          scaleRef.current = clampedScale;
          setIsZoomed(true);
          setZoomScaleDisplay(Number(clampedScale.toFixed(1)));
          applyTransform(clampedScale, panRef.current.x, panRef.current.y, true);
        }
      });

      // --- 2. DOUBLE TAP TO ZOOM IN / RESET ---
      mc.on("doubletap", (e) => {
        if (scaleRef.current > 1.1) {
          // Reset to normal
          resetZoom(true);
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(10);
          }
        } else {
          // Zoom to 2.4x
          const targetScale = 2.4;
          scaleRef.current = targetScale;
          setIsZoomed(true);
          setZoomScaleDisplay(2.4);

          // Calculate focal point offset relative to container center
          const rect = container.getBoundingClientRect();
          const offsetX = (rect.width / 2 - e.center.x) * 0.7;
          const offsetY = (rect.height / 2 - e.center.y) * 0.7;

          panRef.current = { x: offsetX, y: offsetY };
          applyTransform(targetScale, offsetX, offsetY, true);

          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(15);
          }
        }
      });

      // --- 3. SINGLE TAP (TOGGLE CONTROLS) ---
      mc.on("singletap", () => {
        setShowControls((prev) => !prev);
      });

      // --- 4. PAN / DRAG GESTURES ---
      mc.on("panstart", () => {
        if (isPinchingRef.current) return;
        isPanningRef.current = true;
        basePanRef.current = { ...panRef.current };
      });

      mc.on("panmove", (e) => {
        if (isPinchingRef.current) return;

        // A) If Zoomed in: pan photo freely within bounds
        if (scaleRef.current > 1.08) {
          const maxPanX = (window.innerWidth * (scaleRef.current - 1)) / 1.8;
          const maxPanY = (window.innerHeight * (scaleRef.current - 1)) / 1.8;

          const targetX = Math.min(Math.max(basePanRef.current.x + e.deltaX, -maxPanX), maxPanX);
          const targetY = Math.min(Math.max(basePanRef.current.y + e.deltaY, -maxPanY), maxPanY);

          panRef.current = { x: targetX, y: targetY };
          applyTransform(scaleRef.current, targetX, targetY, false);
          return;
        }

        // B) If Normal (1x): check for pull-down to dismiss or horizontal slide drag
        const isPullDown = e.deltaY > 0 && Math.abs(e.deltaY) > Math.abs(e.deltaX) * 0.75;

        if (isPullDown) {
          // Pull-to-dismiss interactive rubberband
          const dampY = e.deltaY * 0.85;
          const dismissScale = Math.max(1 - dampY / 1200, 0.82);
          applyTransform(dismissScale, 0, dampY, false);

          if (backdropRef.current) {
            const opacity = Math.max(1 - dampY / 320, 0.2);
            backdropRef.current.style.opacity = opacity.toString();
          }
        } else {
          // Horizontal slide drag with gentle resistance
          const dragX = e.deltaX * 0.8;
          applyTransform(1, dragX, 0, false);
        }
      });

      mc.on("panend pancancel", (e) => {
        isPanningRef.current = false;
        if (isPinchingRef.current) return;

        // If zoomed in: preserve current pan position
        if (scaleRef.current > 1.08) {
          return;
        }

        // Pull down threshold to close
        const isPullDown = e.deltaY > 0 && Math.abs(e.deltaY) > Math.abs(e.deltaX);
        if (isPullDown && (e.deltaY > 90 || e.velocityY > 0.45)) {
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(12);
          }
          closeLightbox();
          return;
        }

        // Horizontal swipe thresholds
        if (e.deltaX < -65 || e.velocityX < -0.35) {
          handleNext();
          return;
        }
        if (e.deltaX > 65 || e.velocityX > 0.35) {
          handlePrev();
          return;
        }

        // Snap back to neutral
        applyTransform(1, 0, 0, true);
        if (backdropRef.current) {
          backdropRef.current.style.transition = "opacity 0.2s ease";
          backdropRef.current.style.opacity = "1";
        }
      });

      // --- 5. FAST FLICK / SWIPE GESTURES ---
      mc.on("swipeleft", (e) => {
        if (scaleRef.current <= 1.08) {
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(8);
          }
          handleNext();
        }
      });

      mc.on("swiperight", (e) => {
        if (scaleRef.current <= 1.08) {
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(8);
          }
          handlePrev();
        }
      });

      mc.on("swipedown", (e) => {
        if (scaleRef.current <= 1.08 && e.velocity > 0.35) {
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(10);
          }
          closeLightbox();
        }
      });
    });

    return () => {
      isMounted = false;
      if (hammerInstance) {
        hammerInstance.destroy();
        hammerManagerRef.current = null;
      }
    };
  }, [selectedIdx, handleNext, handlePrev, closeLightbox, applyTransform, resetZoom]);

  return (
    <div className="min-h-screen bg-black text-white px-3 pt-24 pb-24 overflow-y-auto">
      {/* Header */}
      <div className="max-w-xl mx-auto mb-4 px-1 flex items-center justify-between">
        <div>
          <h1
            className="text-3xl font-black uppercase tracking-tight text-white"
            style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}
          >
            Gallery
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5 font-mono tracking-wider flex items-center gap-1.5">
            <span>{GALLERY_IMAGES.length} FESTIVAL MEMORIES</span>
            <span className="inline-block w-1 h-1 rounded-full bg-purple-500" />
            <span className="text-purple-400 text-[10px]">TAP TO EXPAND</span>
          </p>
        </div>
      </div>

      {/* High-Performance 2-Column Grid */}
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
            className="group relative aspect-[3/4] w-full overflow-hidden rounded-md bg-neutral-900 border border-white/10 active:scale-[0.97] transition-all duration-150 cursor-pointer select-none"
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
            {/* Corner Badge */}
            <div className="pointer-events-none absolute bottom-1.5 left-1.5 text-[9px] font-mono text-white/60 bg-black/50 px-1.5 py-0.5 rounded backdrop-blur-sm border border-white/10">
              #{String(idx + 1).padStart(2, "0")}
            </div>
          </div>
        ))}
      </div>

      {/* Fullscreen Mobile Lightbox with Hammer.js Touch Optimizations */}
      <AnimatePresence>
        {selectedIdx !== null && (
          <div
            ref={lightboxContainerRef}
            className="fixed inset-0 z-50 flex flex-col items-center justify-between overflow-hidden touch-none select-none"
            style={{ touchAction: "none" }}
          >
            {/* Backdrop */}
            <div
              ref={backdropRef}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl transition-opacity duration-200 pointer-events-none"
            />

            {/* Top Bar Controls */}
            <AnimatePresence>
              {showControls && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.18 }}
                  className="w-full flex items-center justify-between z-30 pt-4 px-4 pointer-events-auto"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold tracking-widest text-slate-300 bg-white/10 px-3 py-1.5 rounded-full border border-white/15 backdrop-blur-md shadow-lg">
                      {String(selectedIdx + 1).padStart(2, "0")} / {String(GALLERY_IMAGES.length).padStart(2, "0")}
                    </span>

                    {/* Active Zoom Badge */}
                    {isZoomed && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          resetZoom(true);
                        }}
                        className="font-mono text-[11px] font-bold tracking-wide text-purple-300 bg-purple-950/70 border border-purple-500/40 px-2.5 py-1.5 rounded-full backdrop-blur-md active:scale-95 transition-all flex items-center gap-1"
                      >
                        <span>{zoomScaleDisplay}x</span>
                        <span className="text-[9px] text-purple-400 uppercase">Reset</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeLightbox();
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md active:scale-90 transition-transform shadow-lg"
                    aria-label="Close image viewer"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Gesture-Driven Centered Image Container */}
            <div className="relative w-full max-w-md max-h-[72vh] my-auto flex items-center justify-center overflow-visible z-20">
              <div
                ref={imageWrapperRef}
                className="relative w-full aspect-[3/4] max-h-[72vh] flex items-center justify-center will-change-transform"
                style={{
                  transformOrigin: "center center",
                  touchAction: "none",
                }}
              >
                <AnimatePresence mode="popLayout" custom={dir} initial={false}>
                  <motion.div
                    key={selectedIdx}
                    custom={dir}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="relative w-full h-full flex items-center justify-center pointer-events-none"
                  >
                    <Image
                      src={GALLERY_IMAGES[selectedIdx].src}
                      alt={GALLERY_IMAGES[selectedIdx].title}
                      fill
                      sizes="(max-width: 640px) 100vw, 600px"
                      quality={85}
                      loading="eager"
                      fetchPriority="high"
                      draggable={false}
                      className="object-contain rounded-lg shadow-2xl pointer-events-none select-none"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Bottom Controls & Gesture Hints */}
            <AnimatePresence>
              {showControls && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.18 }}
                  className="w-full flex flex-col items-center gap-2 pb-6 z-30 pointer-events-auto"
                >
                  {/* Subtle touch gesture pill helper */}
                  <div className="text-[10px] font-mono text-slate-400 tracking-wider bg-black/60 border border-white/10 px-3 py-1 rounded-full backdrop-blur-md">
                    {isZoomed ? "PAN TO EXPLORE • DOUBLE-TAP TO RESET" : "SWIPE OR PINCH TO ZOOM • PULL DOWN TO CLOSE"}
                  </div>

                  <div className="flex items-center justify-center gap-6 mt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrev();
                      }}
                      className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md active:scale-90 transition-all hover:bg-white/20 shadow-lg"
                      aria-label="Previous image"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNext();
                      }}
                      className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md active:scale-90 transition-all hover:bg-white/20 shadow-lg"
                      aria-label="Next image"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
