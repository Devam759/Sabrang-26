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
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { galleryItems, type GalleryItem } from "@/lib/highlights-data";
import { createWheelGesture } from "@/lib/gestureStepper";
import PosterDetailModal from "./PosterDetailModal";
import EventsFilterDropdown from "./EventsFilterDropdown";

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
          className={`relative aspect-[3/4] w-full object-cover transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"
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
 *
 * The optional `dropdownProps` attach the EventsFilterDropdown to the right
 * edge of the heading bar so both elements share the same baseline.
 */
function ArchiveHeading({
  className = "",
  dropdownProps,
}: {
  className?: string;
  dropdownProps?: {
    items: GalleryItem[];
    focusedIndex: number;
    onSelect: (index: number) => void;
  };
}) {
  return (
    <header
      className={`mx-auto max-w-6xl px-6 flex items-center justify-between gap-4 ${className}`}
    >
      <h1
        id="gallery-highlights-heading"
        className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white font-[family-name:var(--font-space-grotesk)] text-neon-rgb"
      >
        Events
      </h1>

      {/* Dropdown sits to the right of the title, pointer-events enabled even
          when the heading is inside the pointer-events-none overlay layer. */}
      {dropdownProps && (
        <div style={{ pointerEvents: "auto" }}>
          <EventsFilterDropdown
            items={dropdownProps.items}
            focusedIndex={dropdownProps.focusedIndex}
            onSelect={dropdownProps.onSelect}
          />
        </div>
      )}
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
          {/* Cube video background */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
            src="https://res.cloudinary.com/eprhemvt/video/upload/v1787082832/sabrang-2026/root/cube.mp4"
          />
          {/* Dark overlay so content stays readable */}
          <div className="absolute inset-0 bg-black/50" />
        </div>

        <div className="relative z-10 h-full">
          {mode === "static" ? (
            <>
              <ArchiveHeading
                className="pt-16 md:pt-20"
                dropdownProps={{
                  items,
                  focusedIndex,
                  onSelect: (index) => {
                    setFocusedIndex(index);
                  },
                }}
              />
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
                  <ArchiveHeading
                    dropdownProps={{
                      items,
                      focusedIndex,
                      onSelect: (index) => {
                        setFocusedIndex(index);
                        focusRequestRef.current?.(index);
                      },
                    }}
                  />
                </div>

                {/* METADATA */}
                <div
                  aria-live="polite"
                  className={`pointer-events-none absolute inset-x-0 bottom-0 px-5 pb-6 transition-opacity duration-500 sm:px-8 sm:pb-8 md:px-12 md:pb-12 ${ready ? "opacity-100" : "opacity-0"
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

        {/* Footer bar */}
        <footer className="absolute bottom-0 inset-x-0 z-20 py-1.5 border-t border-white/10 bg-black/80 backdrop-blur-sm text-center text-white/50 text-[10px] flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 px-4">
          <span>&copy; 2026 Sabrang. All rights reserved.</span>
          <span className="hidden sm:inline text-white/20">&bull;</span>
          <Link
            href="/credits"
            className="inline-flex items-center gap-1 text-white/70 hover:text-purple-400 transition-colors group font-medium"
          >
            <span>Made with</span>
            <svg className="w-3.5 h-3.5 text-red-500 fill-red-500 inline-block group-hover:scale-125 transition-transform" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span>by Tech Team</span>
          </Link>
        </footer>
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
