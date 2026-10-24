"use client";

/**
 * GALLERY HIGHLIGHTS - the section shell.
 *
 * Owns the four beats of the experience: the editorial introduction, the dark
 * chamber the page scrolls into, the metadata that accompanies whichever
 * photograph currently holds focus, and the fade back out into the page.
 *
 * The WebGL archive is loaded only where it can actually run. Without WebGL,
 * or when the visitor prefers reduced motion, the same photographs render as a
 * quiet static archive instead - never an empty black rectangle.
 */

import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Download, FileText, Users, ArrowRight, Gamepad2 } from "lucide-react";
import { galleryItems, findGalleryItem, type GalleryItem } from "@/lib/highlights-data";
import { isEventRegistrationClosed } from "@/lib/eventPricing";
import { createWheelGesture } from "@/lib/gestureStepper";
import PosterDetailModal from "./PosterDetailModal";
import EventsFilterDropdown from "./EventsFilterDropdown";
import EventCoordinatorsDirectory from "./EventCoordinatorsDirectory";

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
function ArchivePlate({ item, index, onSelect }: { item: GalleryItem; index: number; onSelect?: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <figure
      onClick={onSelect}
      className="group relative overflow-hidden bg-[#0c0d16] outline outline-white/10 rounded-2xl cursor-pointer hover:outline-purple-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.25)] transition-all duration-300 hover:scale-[1.02] shadow-xl"
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center pointer-events-none">
        <span className="text-4xl font-black tracking-tighter text-white/85">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-indigo-300/70">
          {item.category}
        </span>
      </div>

      {!failed && (
        <img
          src={item.image}
          alt={item.alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`relative aspect-[3/4] w-full object-cover transition-all duration-500 group-hover:scale-105 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {failed && <div className="aspect-[3/4] w-full" />}

      {/* Subtle top badge for category and closed status */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-10 pointer-events-none flex items-center justify-between gap-1">
        <span className="text-[9px] font-mono font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-slate-300 border border-white/10">
          {item.category.split("-")[0]?.trim()}
        </span>
        {item.eventId && isEventRegistrationClosed(item.eventId) && (
          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/80 backdrop-blur-md text-white border border-rose-400/40 shadow-sm">
            Closed
          </span>
        )}
      </div>

      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-3.5 sm:p-4 flex flex-col gap-1.5 z-10">
        <p className="text-sm font-black uppercase tracking-tight text-white font-[family-name:var(--font-space-grotesk)] text-neon-rgb transition-colors">
          {item.title}
        </p>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-purple-950/60 text-purple-200 border border-purple-500/30">
            {typeof item.totalCash === "number"
              ? `₹${item.totalCash.toLocaleString("en-IN")}`
              : item.totalCash || (item.prizesRemarks || "Prize Pool")}
          </span>
          <span className="text-[10px] font-medium text-slate-300 flex items-center gap-1">
            <Users className="w-3 h-3 text-[#e6e6fa]" />
            {item.minTeam === 1 && item.maxTeam === 1
              ? "Solo"
              : item.minTeam
              ? `${item.minTeam}-${item.maxTeam} Mem`
              : ""}
          </span>
        </div>
        {item.coordinators && item.coordinators.length > 0 && (
          <div className="text-[10px] text-slate-400 font-mono mt-0.5 line-clamp-1">
            Head: {item.coordinators[0].name}
          </div>
        )}
      </figcaption>
    </figure>
  );
}

/**
 * One heading, rendered either as an overlay on the pinned stage or in normal
 * flow above the static archive - never twice, never in two different voices.
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
      suppressHydrationWarning
      className={`mx-auto w-full max-w-[1440px] px-6 sm:px-10 md:px-14 flex items-center justify-between gap-4 ${className}`}
    >
      <div className="flex items-center gap-3 sm:gap-5 flex-wrap">
        <h1
          id="gallery-highlights-heading"
          className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white font-[family-name:var(--font-space-grotesk)] text-neon-rgb"
        >
          Events
        </h1>

        {/* Action & download links */}
        <div className="pointer-events-auto flex items-center gap-2 sm:gap-2.5 flex-wrap">
          <a
            href="/docs/Sabrang_2026_Brochure.pdf"
            target="_blank"
            rel="noopener noreferrer"
            download="Sabrang_2026_Brochure.pdf"
            className="group relative overflow-hidden inline-flex items-center px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-md border border-purple-500/40 hover:border-purple-400 bg-black/60 hover:bg-[#120b1e]/80 backdrop-blur-md transition-all duration-200 active:scale-95 shadow-[0_0_12px_rgba(168,85,247,0.15)] before:absolute before:top-0 before:left-0 before:w-8 before:h-8 before:bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.7)_0%,rgba(168,85,247,0.35)_35%,transparent_70%)] before:pointer-events-none"
            title="Download Sabrang 2026 Brochure (PDF)"
          >
            <Download className="w-3.5 h-3.5 text-purple-300 shrink-0" />
            <span className="h-4 w-[1px] bg-white/20 mx-1.5 sm:mx-2 shrink-0" />
            <span className="text-[11px] sm:text-xs font-semibold tracking-normal text-white font-[family-name:var(--font-space-grotesk)] whitespace-nowrap">
              Festival Brochure
            </span>
            <ArrowRight className="w-3 h-3 text-purple-300 ml-1.5 sm:ml-2 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </a>

          <a
            href="/docs/Sabrang%20Rule%20Book'26_20261009_233355_0000.pdf"
            target="_blank"
            rel="noopener noreferrer"
            download="Sabrang Rule Book'26_20261009_233355_0000.pdf"
            className="group relative overflow-hidden inline-flex items-center px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-md border border-cyan-400/40 hover:border-cyan-300 bg-black/60 hover:bg-[#06141a]/80 backdrop-blur-md transition-all duration-200 active:scale-95 shadow-[0_0_12px_rgba(6,182,212,0.15)] before:absolute before:top-0 before:left-0 before:w-8 before:h-8 before:bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.7)_0%,rgba(6,182,212,0.35)_35%,transparent_70%)] before:pointer-events-none"
            title="Download Sabrang 2026 Event Rulebook (PDF)"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
            <span className="h-4 w-[1px] bg-white/20 mx-1.5 sm:mx-2 shrink-0" />
            <span className="text-[11px] sm:text-xs font-semibold tracking-normal text-white font-[family-name:var(--font-space-grotesk)] whitespace-nowrap">
              Event Rulebook
            </span>
            <ArrowRight className="w-3 h-3 text-cyan-300 ml-1.5 sm:ml-2 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </a>

          <a
            href="/docs/E-sports%20rule%20book.pdf"
            target="_blank"
            rel="noopener noreferrer"
            download="E-sports rule book.pdf"
            className="group relative overflow-hidden inline-flex items-center px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-md border border-emerald-400/40 hover:border-emerald-300 bg-black/60 hover:bg-[#061a12]/80 backdrop-blur-md transition-all duration-200 active:scale-95 shadow-[0_0_12px_rgba(16,185,129,0.15)] before:absolute before:top-0 before:left-0 before:w-8 before:h-8 before:bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.7)_0%,rgba(16,185,129,0.35)_35%,transparent_70%)] before:pointer-events-none"
            title="Download Sabrang 2026 E-sports Rulebook (PDF)"
          >
            <Gamepad2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span className="h-4 w-[1px] bg-white/20 mx-1.5 sm:mx-2 shrink-0" />
            <span className="text-[11px] sm:text-xs font-semibold tracking-normal text-white font-[family-name:var(--font-space-grotesk)] whitespace-nowrap">
              E-sports Rulebook
            </span>
            <ArrowRight className="w-3 h-3 text-emerald-300 ml-1.5 sm:ml-2 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </a>
        </div>
      </div>

      {/* Dropdown sits to the right of the title */}
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

function StaticArchive({
  items,
  onSelect,
}: {
  items: GalleryItem[];
  onSelect: (item: GalleryItem) => void;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-10">
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 mb-8">
        <a
          href="/docs/Sabrang_2026_Brochure.pdf"
          target="_blank"
          rel="noopener noreferrer"
          download="Sabrang_2026_Brochure.pdf"
          className="group relative overflow-hidden inline-flex items-center px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-md border border-purple-500/40 hover:border-purple-400 bg-black/60 hover:bg-[#120b1e]/80 backdrop-blur-md transition-all duration-200 active:scale-95 shadow-[0_0_12px_rgba(168,85,247,0.15)] before:absolute before:top-0 before:left-0 before:w-8 before:h-8 before:bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.7)_0%,rgba(168,85,247,0.35)_35%,transparent_70%)] before:pointer-events-none"
        >
          <Download className="w-3.5 h-3.5 text-purple-300 shrink-0" />
          <span className="h-4 w-[1px] bg-white/20 mx-1.5 sm:mx-2 shrink-0" />
          <span className="text-[11px] sm:text-xs font-semibold tracking-normal text-white font-[family-name:var(--font-space-grotesk)]">
            Festival Brochure
          </span>
          <ArrowRight className="w-3 h-3 text-purple-300 ml-1.5 sm:ml-2 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </a>

        <a
          href="/docs/Sabrang%20Rule%20Book'26_20261009_233355_0000.pdf"
          target="_blank"
          rel="noopener noreferrer"
          download="Sabrang Rule Book'26_20261009_233355_0000.pdf"
          className="group relative overflow-hidden inline-flex items-center px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-md border border-cyan-400/40 hover:border-cyan-300 bg-black/60 hover:bg-[#06141a]/80 backdrop-blur-md transition-all duration-200 active:scale-95 shadow-[0_0_12px_rgba(6,182,212,0.15)] before:absolute before:top-0 before:left-0 before:w-8 before:h-8 before:bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.7)_0%,rgba(6,182,212,0.35)_35%,transparent_70%)] before:pointer-events-none"
        >
          <FileText className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
          <span className="h-4 w-[1px] bg-white/20 mx-1.5 sm:mx-2 shrink-0" />
          <span className="text-[11px] sm:text-xs font-semibold tracking-normal text-white font-[family-name:var(--font-space-grotesk)]">
            Event Rulebook
          </span>
          <ArrowRight className="w-3 h-3 text-cyan-300 ml-1.5 sm:ml-2 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </a>

        <a
          href="/docs/E-sports%20rule%20book.pdf"
          target="_blank"
          rel="noopener noreferrer"
          download="E-sports rule book.pdf"
          className="group relative overflow-hidden inline-flex items-center px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-md border border-emerald-400/40 hover:border-emerald-300 bg-black/60 hover:bg-[#061a12]/80 backdrop-blur-md transition-all duration-200 active:scale-95 shadow-[0_0_12px_rgba(16,185,129,0.15)] before:absolute before:top-0 before:left-0 before:w-8 before:h-8 before:bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.7)_0%,rgba(16,185,129,0.35)_35%,transparent_70%)] before:pointer-events-none"
        >
          <Gamepad2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
          <span className="h-4 w-[1px] bg-white/20 mx-1.5 sm:mx-2 shrink-0" />
          <span className="text-[11px] sm:text-xs font-semibold tracking-normal text-white font-[family-name:var(--font-space-grotesk)]">
            E-sports Rulebook
          </span>
          <ArrowRight className="w-3 h-3 text-emerald-300 ml-1.5 sm:ml-2 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </a>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item, index) => (
          <div key={item.id} id={`event-card-${item.eventId || item.id}`}>
            <ArchivePlate item={item} index={index} onSelect={() => onSelect(item)} />
          </div>
        ))}
      </div>

      {/* Embedded Event Coordinators Section */}
      <div className="mt-16 pt-12 border-t border-white/10">
        <EventCoordinatorsDirectory />
      </div>
    </div>
  );
}

export default function GalleryHighlights({
  items = galleryItems,
}: {
  items?: GalleryItem[];
}) {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<StageMode>("pending");
  const [active, setActive] = useState(false);
  const [ready, setReady] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [expandedItem, setExpandedItem] = useState<GalleryItem | null>(null);
  const [isMobileOrLowData, setIsMobileOrLowData] = useState(true);

  const stageRef = useRef<HTMLDivElement>(null);
  const focusRequestRef = useRef<((itemIndex: number) => void) | null>(null);

  // Deep-link integration: automatically open event poster detail if navigated with ?event=... or ?id=...
  useEffect(() => {
    const eventParam = searchParams?.get("event") || searchParams?.get("id");
    let target = eventParam;
    if (!target && typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      target =
        urlParams.get("event") ||
        urlParams.get("id") ||
        (window.location.hash ? window.location.hash.replace("#", "") : null);
    }

    if (target) {
      const matched = findGalleryItem(target, items);
      if (matched) {
        setExpandedItem(matched);
        const index = items.findIndex((it) => it.id === matched.id);
        if (index !== -1) {
          setFocusedIndex(index);
          focusRequestRef.current?.(index);
          if (mode === "static" && typeof document !== "undefined") {
            setTimeout(() => {
              const el = document.getElementById(`event-card-${matched.eventId || matched.id}`);
              el?.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 200);
          }
        }
      }
    }
  }, [searchParams, items, mode]);

  useEffect(() => {
    const checkViewport = () => {
      const isMobile = window.innerWidth < 768;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setIsMobileOrLowData(isMobile || reducedMotion);
    };
    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

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
      const next = ((((focusedIndex + delta) % items.length) + items.length) % items.length);
      setFocusedIndex(next);
      focusRequestRef.current?.(next);
    },
    [focusedIndex, items.length],
  );

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

  // Global keyboard listener so arrow keys work without clicking into the 3D area first.
  const stepRef = useRef(step);
  stepRef.current = step;

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        stepRef.current(1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        stepRef.current(-1);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const onReady = useCallback(() => {
    setReady(true);
    if (focusedIndex !== 0) {
      focusRequestRef.current?.(focusedIndex);
    }
  }, [focusedIndex]);

  return (
    <>
      <section
        aria-labelledby="gallery-highlights-heading"
        className="fixed inset-0 z-0 overflow-y-auto bg-[#07080f] text-white"
      >
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden flex items-center justify-center mix-blend-screen">
          {isMobileOrLowData ? (
            <img
              src="/videos/cube.jpg"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-contain scale-[0.85] sm:scale-[0.8] opacity-60 pointer-events-none select-none"
            />
          ) : (
            <video
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              disablePictureInPicture
              disableRemotePlayback
              controlsList="nodownload noplaybackrate nofullscreen"
              onContextMenu={(e) => e.preventDefault()}
              tabIndex={-1}
              className="absolute inset-0 h-full w-full object-contain scale-[0.85] sm:scale-[0.8] md:scale-[0.78] opacity-75 transition-transform duration-700 pointer-events-none select-none"
              poster="/videos/cube.jpg"
              src="/videos/cube.mp4"
            />
          )}
          <div className="absolute inset-0 bg-black/40 pointer-events-none" />
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
              <StaticArchive
                items={items}
                onSelect={(item) => setExpandedItem(item)}
              />
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
                        setExpandedItem(items[itemIndex]);
                      }}
                    />
                  )}
                </div>

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

                {/* Navigation Buttons - centered */}
                <div
                  aria-live="polite"
                  className={`pointer-events-none absolute inset-x-0 bottom-0 pb-16 sm:pb-14 md:pb-10 transition-opacity duration-500 flex flex-col items-center gap-3 px-4 ${
                    ready ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <div className="pointer-events-auto flex items-center gap-3 sm:gap-4 md:gap-6 z-20">
                    <button
                      onClick={() => step(-1)}
                      className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/15 bg-black/50 backdrop-blur-md text-white transition-all hover:bg-white/15 hover:border-white/30 active:scale-90"
                      aria-label="Previous image"
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                    </button>

                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-bold tracking-[0.2em] font-mono select-none">
                      <span className="text-white">{String(focusedIndex + 1).padStart(2, "0")}</span>
                      <span className="text-white/25">/</span>
                      <span className="text-white/45">{String(items.length).padStart(2, "0")}</span>
                    </div>

                    <button
                      onClick={() => step(1)}
                      className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/15 bg-black/50 backdrop-blur-md text-white transition-all hover:bg-white/15 hover:border-white/30 active:scale-90"
                      aria-label="Next image"
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <ul className="sr-only">
            {items.map((item) => (
              <li key={item.id}>
                {item.title} - {item.category}, {item.venue}, {item.year}.{" "}
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
          onClose={() => {
            setExpandedItem(null);
            if (typeof window !== "undefined" && window.history?.replaceState) {
              const cleanUrl = window.location.pathname;
              window.history.replaceState({}, document.title, cleanUrl);
            }
          }}
        />
      )}
    </>
  );
}
