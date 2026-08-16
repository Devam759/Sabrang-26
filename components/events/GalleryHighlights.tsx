"use client";

/**
 * GALLERY HIGHLIGHTS — the section shell.
 *
 * Owns the four beats of the experience: the editorial introduction, the dark
 * chamber the page scrolls into, the metadata that accompanies whichever
 * photograph currently holds focus, and the fade back out into the page.
 *
 * The WebGL archive is loaded only where it can actually run. Without WebGL,
 * or when the visitor prefers reduced motion, the same photographs render as a
 * quiet static archive instead — never an empty black rectangle.
 */

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { galleryItems, type GalleryItem } from "@/lib/highlights-data";
import { createWheelGesture } from "@/lib/gestureStepper";
import PosterDetailModal from "./PosterDetailModal";

const ArchiveScene = dynamic(() => import("./ArchiveScene"), { ssr: false });

type StageMode = "pending" | "webgl" | "static";

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") ??
      canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl"),
    );
  } catch {
    return false;
  }
}

/** Shared by the static archive and, on failure, by the 3D scene's placeholders. */
function ArchivePlate({ item, index }: { item: GalleryItem; index: number }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <figure className="group relative overflow-hidden bg-[#0e1018] outline outline-white/10">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
        <span className="text-4xl font-black tracking-tighter text-white/85">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-indigo-300/70">
          {item.category}
        </span>
      </div>

      {!failed && (
        // Plain img: these files are dropped in by hand and may not exist yet,
        // so a 404 has to degrade to the plate underneath rather than throw.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.image}
          alt={item.alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`relative aspect-[3/4] w-full object-cover transition-opacity duration-700 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {failed && <div className="aspect-[3/4] w-full" />}

      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-4">
        <p className="text-sm font-bold uppercase tracking-tight text-white">
          {item.title}
        </p>
        <p className="text-xs text-slate-300 line-clamp-1 truncate mt-0.5">
          {item.description}
        </p>
      </figcaption>
    </figure>
  );
}

/**
 * One heading, rendered either as an overlay on the pinned stage or in normal
 * flow above the static archive — never twice, never in two different voices.
 */
function ArchiveHeading({ className = "" }: { className?: string }) {
  return (
    <header className={`mx-auto max-w-6xl px-6 ${className}`}>
      <h1
        id="gallery-highlights-heading"
        className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white font-darknexis text-neon-rgb"
      >
        Events
      </h1>
    </header>
  );
}

function StaticArchive({ items }: { items: GalleryItem[] }) {
  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-3 px-6 py-16 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {items.map((item, index) => (
        <ArchivePlate key={item.id} item={item} index={index} />
      ))}
    </div>
  );
}

export default function GalleryHighlights({
  items = galleryItems,
}: {
  items?: GalleryItem[];
}) {
  const [mode, setMode] = useState<StageMode>("pending");
  const [active, setActive] = useState(false);
  const [ready, setReady] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [expandedItem, setExpandedItem] = useState<GalleryItem | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const focusRequestRef = useRef<((itemIndex: number) => void) | null>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const decide = () => {
      setMode(reducedMotion.matches || !supportsWebGL() ? "static" : "webgl");
    };

    decide();
    reducedMotion.addEventListener("change", decide);
    return () => reducedMotion.removeEventListener("change", decide);
  }, []);

  /** The render loop only runs while the chamber is actually on screen. */
  useEffect(() => {
    const element = stageRef.current;
    if (!element || mode !== "webgl") return;

    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { rootMargin: "10% 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [mode]);

  const step = useCallback(
    (delta: number) => {
      // Positive modulo: a fast trackpad flick can deliver a delta larger than
      // the archive, and `(i + delta + len) % len` goes negative past that,
      // indexing off the end of the array.
      const next = ((((focusedIndex + delta) % items.length) + items.length) % items.length);
      setFocusedIndex(next);
      focusRequestRef.current?.(next);
    },
    [focusedIndex, items.length],
  );

  /**
   * One gesture, one photograph — a hard flick and a gentle nudge both advance
   * exactly one, so the archive never overshoots what the user aimed at.
   *
   * Distance-based stepping is wrong for this surface. A mouse notch is a fixed
   * 100px so it looks fine, but a trackpad swipe is whatever distance the
   * fingers covered plus a long inertia tail, so the same flick that moved one
   * photograph on a mouse moved a handful here. lib/gestureStepper keys off
   * gesture BOUNDARIES instead of distance, which is also why it ports to touch
   * unchanged: a swipe's dy feeds the same core.
   */
  const stepperRef = useRef<ReturnType<typeof createWheelGesture> | null>(null);

  const onWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      stepperRef.current ??= createWheelGesture(window.innerHeight);
      const dir = stepperRef.current(event);
      if (dir !== 0) step(dir);
    },
    [step],
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        step(1);
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        step(-1);
      }
    },
    [step],
  );

  const onReady = useCallback(() => setReady(true), []);
  const focused = items[focusedIndex] ?? items[0];

  return (
    <>
      <section
        aria-labelledby="gallery-highlights-heading"
        className="fixed inset-0 z-0 overflow-y-auto bg-[#07080f] text-white"
      >
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          {/* Was a 13.5MB retrowave loop under two darkening overlays. The
              overlays left it a dim magenta-to-navy wash, which these two
              gradients paint outright — and they cost no decode on a page that
              is already running a WebGL archive. */}
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#1b1035_0%,#120c26_45%,#07080f_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_12%,rgba(236,72,153,0.16)_0%,transparent_58%)]" />
        </div>

        <div className="relative z-10 h-full">
          {mode === "static" ? (
            <>
              <ArchiveHeading className="pt-16 md:pt-20" />
              <StaticArchive items={items} />
            </>
          ) : (
            <div ref={stageRef} className="relative h-full">
              <div className="h-full w-full overflow-hidden">
                <div
                  role="group"
                  tabIndex={0}
                  onKeyDown={onKeyDown}
                  onWheel={onWheel}
                  aria-label="Festival photograph archive. Use the arrow keys to move between photographs."
                  className="absolute inset-0 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400"
                >
                  {mode === "webgl" && (
                    <ArchiveScene
                      items={items}
                      active={active}
                      onFocusChange={setFocusedIndex}
                      onReady={onReady}
                      focusRequestRef={focusRequestRef}
                      onTileTap={(itemIndex) => {
                        if (itemIndex === focusedIndex) {
                          setExpandedItem(items[itemIndex]);
                        }
                      }}
                    />
                  )}
                </div>

                {/* Edges fall away into the dark so photographs recede rather than crop. */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(7,8,15,0.55)_72%,#07080f_100%)]"
                />

                {/* Heading pinned to top, above the 3D canvas */}
                <div className="pointer-events-none absolute inset-x-0 top-0 z-10 pt-20 md:pt-24">
                  <ArchiveHeading />
                </div>

                {/* METADATA */}
                <div
                  aria-live="polite"
                  className={`pointer-events-none absolute inset-x-0 bottom-0 px-5 pb-6 transition-opacity duration-500 sm:px-8 sm:pb-8 md:px-12 md:pb-12 ${
                    ready ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {/* Navigation Buttons: Bottom-Right on mobile, Centered on Desktop */}
                  <div className="absolute right-5 bottom-6 md:left-1/2 md:-translate-x-1/2 md:right-auto md:bottom-12 flex items-center gap-2 sm:gap-3 md:gap-6 pointer-events-auto z-20">
                    <button
                      onClick={() => step(-1)}
                      className="flex h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 items-center justify-center rounded-full border border-white/15 bg-black/50 backdrop-blur-md text-white transition-all hover:bg-white/15 hover:border-white/30 active:scale-90"
                      aria-label="Previous image"
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                    </button>

                    <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-3 text-xs sm:text-[13px] font-bold tracking-wider sm:tracking-[0.2em] font-mono select-none">
                      <span className="text-white">{String(focusedIndex + 1).padStart(2, "0")}</span>
                      <span className="text-white/25">/</span>
                      <span className="text-white/45">{String(items.length).padStart(2, "0")}</span>
                    </div>

                    <button
                      onClick={() => step(1)}
                      className="flex h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 items-center justify-center rounded-full border border-white/15 bg-black/50 backdrop-blur-md text-white transition-all hover:bg-white/15 hover:border-white/30 active:scale-90"
                      aria-label="Next image"
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                    </button>
                  </div>

                  <div className="max-w-[48vw] sm:max-w-[50vw] md:max-w-[calc(50vw-4rem)]">
                    <h2 className="text-lg sm:text-2xl md:text-3xl font-black uppercase tracking-tight text-white truncate font-darknexis text-neon-rgb">
                      {focused.title}
                    </h2>
                    <p className="mt-0.5 sm:mt-1 max-w-md text-[11px] sm:text-xs md:text-sm font-medium leading-normal text-slate-300 line-clamp-1 truncate">
                      {focused.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* The full archive, always in the accessibility tree even in WebGL mode. */}
          <ul className="sr-only">
            {items.map((item) => (
              <li key={item.id}>
                {item.title} — {item.category}, {item.venue}, {item.year}.{" "}
                {item.alt}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Expanded poster detail overlay */}
      {expandedItem && (
        <PosterDetailModal
          item={expandedItem}
          onClose={() => setExpandedItem(null)}
        />
      )}
    </>
  );
}
