"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { GalleryItem } from "@/lib/highlights-data";
import "@/components/ui/StaggeredMenu.css";

const DROPDOWN_VARIANTS = {
  hidden: { opacity: 0, y: -8, scale: 0.97, transformOrigin: "top right" },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: {
      type: "spring" as const, stiffness: 340, damping: 28, mass: 0.7,
      staggerChildren: 0.028, delayChildren: 0.04,
    },
  },
  exit: { opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.16, ease: [0.4, 0, 1, 1] as const } },
};

const ITEM_VARIANTS = {
  hidden: { opacity: 0, x: 8 },
  visible: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 380, damping: 28 } },
};

const CATEGORY_COLORS: Record<string, string> = {
  Fashion: "#f967fb",
  "Live Music": "#ff8a00",
  "Group Dance": "#53bc28",
  "Solo Dance": "#00b3ff",
  Classical: "#ffd400",
  Literary: "#ff2d55",
  "Fine Arts": "#f967fb",
  "E-Sports": "#4b3bff",
  Photography: "#53bc28",
  Business: "#ff8a00",
  Debate: "#ff2d55",
  Speaking: "#00b3ff",
  Fun: "#ffd400",
  Sports: "#53bc28",
};

function categoryColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? "#ffffff";
}

function TriggerButton({ isOpen, onClick }: { isOpen: boolean; onClick: () => void }) {
  return (
    <button
      id="events-filter-trigger"
      onClick={onClick}
      aria-haspopup="listbox"
      aria-expanded={isOpen}
      aria-label="Filter or jump to an event"
      className="sm-toggle-btn efd-trigger-btn"
    >
      {/* Text matches the Events h1 font & glitch style, shrunk by 2 sizes */}
      <span className="efd-trigger-label">
        FILTER
      </span>
      {/* Downward pointing arrow indicating a dropdown */}
      <svg
        className={`efd-chevron ${isOpen ? "efd-chevron-open" : ""}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  );
}

function DropdownItem({
  item, index, isFocused, onSelect,
}: {
  item: GalleryItem; index: number; isFocused: boolean; onSelect: (index: number) => void;
}) {
  const accent = categoryColor(item.category);
  return (
    <motion.li variants={ITEM_VARIANTS} role="option" aria-selected={isFocused} id={`events-filter-option-${item.id}`}>
      <button
        onClick={() => onSelect(index)}
        style={{ width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer" }}
      >
        <div
          className="efd-row"
          data-active={isFocused || undefined}
          style={{ "--accent": accent } as React.CSSProperties}
        >
          <span className="efd-index">{String(index + 1).padStart(2, "0")}</span>
          <span className="efd-label-group">
            <span className="efd-title">{item.title}</span>
            <span className="efd-category" style={{ color: accent }}>{item.category}</span>
          </span>
          {isFocused && (
            <span
              className="efd-dot"
              style={{ background: accent, boxShadow: `0 0 6px 2px ${accent}55` }}
            />
          )}
        </div>
      </button>
    </motion.li>
  );
}

interface EventsFilterDropdownProps {
  items: GalleryItem[];
  focusedIndex: number;
  onSelect: (index: number) => void;
}

export default function EventsFilterDropdown({ items, focusedIndex, onSelect }: EventsFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") setIsOpen(false); };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const active = listRef.current.querySelector(
      `#events-filter-option-${items[focusedIndex]?.id}`
    ) as HTMLElement | null;
    active?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [isOpen, focusedIndex, items]);

  const handleSelect = useCallback((index: number) => { onSelect(index); setIsOpen(false); }, [onSelect]);

  const css = `
    /* ── Trigger button ── */
    .efd-trigger-btn {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: transparent;
      border: none;
      color: #ffffff;
      cursor: pointer;
      padding: 0.2rem 0;
      line-height: 1;
    }

    /* Title-matching label: Space Grotesk, black weight, responsive size, neon glitch */
    .efd-trigger-label {
      font-family: var(--font-space-grotesk, 'Space Grotesk', sans-serif);
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: -0.02em;
      /* Shrunk 2 sizes: 1.875rem/2.25rem/3rem -> 1.25rem/1.5rem/1.875rem */
      font-size: 1.25rem;
      /* Neon-RGB glitch: identical to .text-neon-rgb in globals.css */
      text-shadow:
        -2px 0px 0px rgba(255,0,0,0.65),
         2px 0px 0px rgba(0,255,0,0.6),
         3.5px 0px 0px rgba(0,0,255,0.7);
      transition: text-shadow 0.3s ease;
    }
    @media (min-width: 640px)  { .efd-trigger-label { font-size: 1.5rem; } }
    @media (min-width: 768px)  { .efd-trigger-label { font-size: 1.875rem; } }

    .efd-trigger-btn:hover .efd-trigger-label {
      text-shadow:
        -3px 0px 0px rgba(255,0,0,0.85),
         3px 0px 0px rgba(0,255,0,0.8),
         5px 0px 0px rgba(0,0,255,0.9);
    }

    /* Chevron arrow */
    .efd-chevron {
      width: 1rem;
      height: 1rem;
      color: #ffffff;
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), color 0.25s ease;
      filter: drop-shadow(0 2px 6px rgba(0,0,0,0.6));
    }
    @media (min-width: 640px) { .efd-chevron { width: 1.15rem; height: 1.15rem; } }
    @media (min-width: 768px) { .efd-chevron { width: 1.3rem; height: 1.3rem; } }

    .efd-chevron-open {
      transform: rotate(180deg);
      color: var(--sm-accent, #f967fb);
    }

    .efd-trigger-btn:hover .efd-chevron {
      color: var(--sm-accent, #f967fb);
    }

    /* ── Wrapper + dropdown shell ── */
    .efd-wrapper { position: relative; z-index: 30; pointer-events: auto; }

    /* Outer shell: clip-path + shadow only — NOT the scroll container */
    .efd-shell {
      position: absolute; top: calc(100% + 8px); right: 0; width: 260px;
      background: #070707; border: 1.5px solid rgba(255,255,255,0.13);
      clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
      box-shadow: 0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(249,103,251,0.06) inset;
      overflow: hidden;
    }

    /* Spectrum stripe — sits outside the scroll container so it never scrolls away */
    .efd-stripe {
      height: 2px; width: 100%; flex-shrink: 0;
      background: linear-gradient(90deg,#ff2d55,#ff8a00,#ffd400,#53bc28,#00b3ff,#4b3bff,#f967fb,#ff2d55);
      background-size: 300% 100%;
      animation: efd-spectrum 7s linear infinite;
    }
    @keyframes efd-spectrum { to { background-position: -300% 0; } }
    @media (prefers-reduced-motion: reduce) { .efd-stripe { animation: none; } }

    /* Scrollable list — independent of the shell */
    .efd-panel {
      max-height: min(400px, 55vh);
      overflow-y: scroll;
      overscroll-behavior: contain;
      list-style: none; margin: 0; padding: 4px 0;
    }
    .efd-panel::-webkit-scrollbar { display: none; }

    /* ── Rows ── */
    .efd-row {
      display: flex; align-items: center; gap: 10px; padding: 9px 14px;
      transition: background 0.18s ease, transform 0.22s cubic-bezier(0.16,1,0.3,1);
      border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer; width: 100%; text-align: left;
    }
    .efd-row:hover { background: rgba(255,255,255,0.06); transform: translateX(3px); }
    .efd-row[data-active] { background: rgba(249,103,251,0.08); }

    .efd-index {
      font-family: 'Space Mono', monospace; font-size: 0.62rem; font-weight: 700;
      color: rgba(255,255,255,0.22); letter-spacing: 0.06em; flex-shrink: 0; width: 20px; text-align: right;
    }
    .efd-label-group { display: flex; flex-direction: column; gap: 1px; flex: 1; min-width: 0; }
    .efd-title {
      font-family: 'Space Mono', monospace; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.06em;
      text-transform: uppercase; color: #ffffff; white-space: nowrap; overflow: hidden;
      text-overflow: ellipsis; line-height: 1.2; transition: color 0.2s ease;
    }
    .efd-row:hover .efd-title { color: var(--accent, #f967fb); }
    .efd-category {
      font-family: 'Space Mono', monospace; font-size: 0.58rem; font-weight: 400;
      letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.7; line-height: 1;
    }
    .efd-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

    @media (max-width: 400px) { .efd-shell { width: calc(100vw - 32px); right: -8px; } }
  `;

  return (
    <>
      <style>{css}</style>
      <div ref={containerRef} className="efd-wrapper">
        <TriggerButton isOpen={isOpen} onClick={() => setIsOpen((v) => !v)} />
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="efd-shell"
              className="efd-shell"
              variants={DROPDOWN_VARIANTS}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Spectrum stripe pinned above the scroll area */}
              <div className="efd-stripe" aria-hidden />

              {/* Scrollable list — wheel events stopped here so gallery doesn't react */}
              <motion.ul
                ref={listRef}
                role="listbox"
                aria-label="Jump to event"
                aria-activedescendant={`events-filter-option-${items[focusedIndex]?.id}`}
                className="efd-panel"
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
              >
                {items.map((item, index) => (
                  <DropdownItem
                    key={item.id}
                    item={item}
                    index={index}
                    isFocused={index === focusedIndex}
                    onSelect={handleSelect}
                  />
                ))}
              </motion.ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
