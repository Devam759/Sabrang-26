"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { GalleryItem } from "@/lib/highlights-data";

/**
 * Full-screen event detail overlay — poster on the left, info on the right.
 * Shared across Events page archive and About page Pillars of Sabrang showcase.
 */
export default function PosterDetailModal({
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
      role="dialog"
      aria-modal="true"
      aria-label={`${item.title} event details`}
    >
      <div
        className={`relative my-auto flex max-h-[90vh] max-w-5xl flex-col md:flex-row gap-6 md:gap-8 transition-all duration-500 overflow-y-auto p-4 sm:p-6 bg-neutral-950/90 border border-white/10 rounded-2xl shadow-2xl ${
          visible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/20 bg-black/70 backdrop-blur-md text-white/80 hover:text-white hover:border-white/40 hover:bg-white/15 active:scale-90 transition-all shadow-lg cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60"
          aria-label="Close modal"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Poster image */}
        <div className="relative flex-shrink-0 w-full md:w-[320px] lg:w-[380px] overflow-hidden rounded-xl shadow-2xl shadow-indigo-500/10 ring-1 ring-white/10 mt-0">
          <Image
            src={item.image}
            alt={item.alt || item.title}
            width={380}
            height={540}
            sizes="(max-width: 768px) 100vw, 380px"
            className="w-full object-cover"
            style={{ width: "100%", height: "auto" }}
            loading="eager"
            fetchPriority="high"

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
