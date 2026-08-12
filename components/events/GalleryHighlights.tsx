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
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
          {item.venue} · {item.year}
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
      <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-indigo-400">
        Sabrang 2025
      </p>
      <h2
        id="gallery-highlights-heading"
        className="mt-1 text-2xl font-black uppercase leading-[0.92] tracking-tighter md:text-3xl"
      >
        Events
      </h2>
      <p className="mt-1 max-w-md text-xs font-medium leading-relaxed text-slate-400">
        Moments that made the fest.
      </p>
    </header>
  );
}

/**
 * Full-screen detail overlay — poster on the left, info on the right.
 * Shown when the user taps the currently focused poster.
 */
function PosterDetail({
  item,
  onClose,
}: {
  item: GalleryItem;
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation on next frame
    requestAnimationFrame(() => setVisible(true));

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-all duration-500 overflow-y-auto ${
        visible
          ? "bg-black/90 backdrop-blur-md opacity-100"
          : "bg-transparent opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div
        className={`relative my-auto flex max-h-[90vh] max-w-5xl flex-col md:flex-row gap-6 md:gap-8 transition-all duration-500 overflow-y-auto p-4 sm:p-6 bg-neutral-950/90 border border-white/10 rounded-2xl ${
          visible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors z-20 min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          ✕ Close
        </button>

        {/* Poster image */}
        <div className="relative flex-shrink-0 w-full md:w-[320px] lg:w-[380px] overflow-hidden rounded-xl shadow-2xl shadow-indigo-500/10 ring-1 ring-white/10 mt-6 md:mt-0">
          <Image
            src={item.image}
            alt={item.alt}
            width={380}
            height={540}
            style={{ width: "100%", height: "auto" }}
            className="h-auto w-full object-cover"
            priority
          />
        </div>

        {/* Info panel */}
        <div className="flex flex-col justify-center py-2 md:py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-indigo-400">
            {item.category}
          </p>
          <h3 className="mt-2 text-2xl sm:text-4xl font-black uppercase tracking-tight text-white md:text-5xl">
            {item.title}
          </h3>
          <p className="mt-3 max-w-sm text-sm sm:text-base leading-relaxed text-slate-300">
            {item.description}
          </p>
          <div className="mt-5 flex items-center gap-3 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
            <span>{item.venue}</span>
            <span className="h-1 w-1 rounded-full bg-slate-600" />
            <span>Sabrang {item.year}</span>
          </div>
        </div>
      </div>
    </div>
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
      const next = (focusedIndex + delta + items.length) % items.length;
      setFocusedIndex(next);
      focusRequestRef.current?.(next);
    },
    [focusedIndex, items.length],
  );

  /**
   * The wheel advances the archive one photograph per gesture — it never maps
   * a raw delta onto rotation. Doing that meant a trackpad's inertia dumped
   * thousands of pixels at once and the gallery spun; every event also moved
   * the sphere by a hard jump, which is what read as stutter. Now the wheel
   * only picks the next photograph and the scene's existing snap eases onto it.
   *
   * The threshold rejects trackpad jitter, the cooldown stops a single flick's
   * inertia from becoming five cards, and the idle reset keeps a slow scroll
   * from accumulating across unrelated gestures.
   */
  const wheelRef = useRef({ delta: 0, eventAt: 0, stepAt: 0 });

  const onWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      // deltaMode 1 is lines, 2 is pages — normalise both to something pixel-ish.
      const scale =
        event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 400 : 1;
      const wheel = wheelRef.current;
      const now = event.timeStamp;

      if (now - wheel.eventAt > 400) wheel.delta = 0;
      wheel.eventAt = now;
      wheel.delta += event.deltaY * scale;

      if (Math.abs(wheel.delta) < 40 || now - wheel.stepAt < 280) return;

      step(Math.sign(wheel.delta));
      wheel.delta = 0;
      wheel.stepAt = now;
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
        // One viewport, no page scroll: the chamber fills the screen and the wheel
        // turns the archive instead of moving the document. Below the navbar's
        // z-10 so the nav still floats over the dark.
        className="fixed inset-0 z-0 overflow-y-auto bg-[#07080f] text-white"
      >
        {mode === "static" ? (
          <>
            <ArchiveHeading className="pt-16 md:pt-20" />
            <StaticArchive items={items} />
          </>
        ) : (
          /* One screen, heading included. The wheel turns the archive forever —
             there is no track to run out of, so the gallery loops indefinitely. */
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
                      // If tapping the already-focused poster, expand it
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
                <p className="mx-auto max-w-6xl px-6 mt-1 text-[8px] font-semibold uppercase tracking-[0.3em] text-slate-600">
                  Scroll to move through the archive · Drag to look around
                </p>
              </div>

              {/* METADATA — supports the imagery, never competes with it. */}
              <div
                aria-live="polite"
                className={`pointer-events-none absolute inset-x-0 bottom-0 px-8 pb-8 transition-opacity duration-500 md:px-12 md:pb-12 ${
                  ready ? "opacity-100" : "opacity-0"
                }`}
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-indigo-400">
                  {String(focusedIndex + 1).padStart(2, "0")} /{" "}
                  {String(items.length).padStart(2, "0")}
                </p>
                <p className="mt-2 text-2xl font-black uppercase tracking-tight text-white md:text-3xl">
                  {focused.title}
                </p>
                <p className="mt-2 max-w-md text-sm font-medium leading-relaxed text-slate-300">
                  {focused.description}
                </p>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {focused.category} · {focused.venue}
                </p>
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
      </section>

      {/* Expanded poster detail overlay */}
      {expandedItem && (
        <PosterDetail
          item={expandedItem}
          onClose={() => setExpandedItem(null)}
        />
      )}
    </>
  );
}
