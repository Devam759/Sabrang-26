"use client";

import React, { useState } from "react";
import Link from "next/link";

export interface AccordionGalleryItem {
  image: string;
  label: string;
  link?: string;
  category?: string;
  desc?: string;
  id?: string | number;
  [key: string]: any;
}

export interface AccordionGalleryProps {
  items?: AccordionGalleryItem[];
  defaultIndex?: number;
  expandRatio?: number; // e.g. 0.52 for 52% of total gallery container width
  trigger?: "hover" | "click";
  className?: string;
}

const DEFAULT_SAMPLE_ITEMS: AccordionGalleryItem[] = [
  { image: "https://picsum.photos/id/1015/900/1200", label: "Canyon", link: "#" },
  { image: "https://picsum.photos/id/1018/900/1200", label: "Ridgeline", link: "#" },
  { image: "https://picsum.photos/id/1039/900/1200", label: "Falls", link: "#" },
  { image: "https://picsum.photos/id/1043/900/1200", label: "Harbour", link: "#" },
  { image: "https://picsum.photos/id/1044/900/1200", label: "Skyline", link: "#" },
];

export default function AccordionGallery({
  items = DEFAULT_SAMPLE_ITEMS,
  defaultIndex = 2,
  expandRatio = 0.52,
  trigger = "hover",
  className = "",
}: AccordionGalleryProps) {
  const galleryItems = items && items.length > 0 ? items : DEFAULT_SAMPLE_ITEMS;

  const initialIndex = Math.min(
    Math.max(0, defaultIndex),
    galleryItems.length - 1,
  );
  const [activeIndex, setActiveIndex] = useState<number>(initialIndex);

  // Calculate flex grow ratios based on expandRatio:
  // Active item ratio: expandRatio * 100 (e.g. 52)
  // Collapsed item ratio: ((1 - expandRatio) * 100) / (galleryItems.length - 1)
  const activeWeight = expandRatio * 100;
  const collapsedWeight =
    galleryItems.length > 1
      ? ((1 - expandRatio) * 100) / (galleryItems.length - 1)
      : activeWeight;

  return (
    <div
      className={`relative w-full h-[540px] sm:h-[600px] flex flex-col md:flex-row gap-3 p-3 rounded-3xl bg-black/80 border border-white/15 backdrop-blur-2xl shadow-2xl overflow-hidden select-none ${className}`}
    >
      {galleryItems.map((item, index) => {
        const isActive = index === activeIndex;
        const currentWeight = isActive ? activeWeight : collapsedWeight;

        return (
          <div
            key={item.id || item.label || index}
            onMouseEnter={
              trigger === "hover" ? () => setActiveIndex(index) : undefined
            }
            onClick={() => setActiveIndex(index)}
            style={{
              flexGrow: currentWeight,
              flexShrink: 1,
              flexBasis: "0%",
              transition:
                "flex-grow 600ms cubic-bezier(0.25, 1, 0.5, 1), opacity 500ms ease, border-color 500ms ease",
            }}
            className={`relative rounded-2xl overflow-hidden cursor-pointer flex flex-col justify-between p-5 sm:p-7 ${
              isActive
                ? "border border-purple-400/50 shadow-2xl ring-1 ring-purple-400/30 opacity-100"
                : "border border-white/10 opacity-60 hover:opacity-90 hover:border-white/30"
            }`}
          >
            {/* Background Image */}
            <img
              src={item.image}
              alt={item.label}
              className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out ${
                isActive
                  ? "scale-105 filter brightness-95"
                  : "scale-100 filter brightness-40"
              }`}
            />

            {/* Gradient Overlay */}
            <div
              className={`absolute inset-0 transition-opacity duration-500 ${
                isActive
                  ? "bg-gradient-to-t from-black/90 via-black/40 to-transparent"
                  : "bg-gradient-to-t from-black/90 via-black/70 to-black/30"
              }`}
            />

            {/* Top Accent Glowing Border Line */}
            <div
              className={`absolute top-0 left-0 right-0 h-1 z-20 transition-all duration-500 ${
                isActive
                  ? "bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 opacity-100"
                  : "bg-white/10 opacity-30"
              }`}
            />

            {/* Active Card Content */}
            {isActive ? (
              <div className="relative z-20 h-full flex flex-col justify-between space-y-4">
                {/* Top Category Badge & Index Counter */}
                <div className="flex items-center justify-between">
                  {item.category ? (
                    <span className="text-xs font-mono px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-purple-400/30 text-purple-300 shadow-md">
                      {item.category}
                    </span>
                  ) : (
                    <span className="text-xs font-mono px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-slate-300">
                      Pillars of Sabrang
                    </span>
                  )}

                  <span className="text-xs font-mono font-bold text-white/70 bg-black/60 px-2.5 py-1 rounded-md border border-white/10">
                    0{index + 1} / 0{galleryItems.length}
                  </span>
                </div>

                {/* Bottom Main Title & Description */}
                <div className="space-y-3 max-w-xl">
                  <h3
                    className="text-3xl sm:text-5xl font-black uppercase text-white tracking-tight leading-none drop-shadow-lg"
                    style={{
                      fontFamily: '"Syne", "Outfit", "Inter", sans-serif',
                    }}
                  >
                    {item.label}
                  </h3>

                  {item.desc && (
                    <p className="text-xs sm:text-sm md:text-base font-light text-slate-200 leading-relaxed">
                      {item.desc}
                    </p>
                  )}

                  {item.link && item.link !== "#" && (
                    <div className="pt-2">
                      {item.link.startsWith("http") ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 text-white font-bold text-xs font-mono uppercase tracking-wider transition-all hover:scale-105 shadow-lg shadow-purple-500/25"
                        >
                          <span>Explore {item.label}</span>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14 5l7 7m0 0l-7 7m7-7H3"
                            />
                          </svg>
                        </a>
                      ) : (
                        <Link
                          href={item.link}
                          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 text-white font-bold text-xs font-mono uppercase tracking-wider transition-all hover:scale-105 shadow-lg shadow-purple-500/25"
                        >
                          <span>Explore {item.label}</span>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14 5l7 7m0 0l-7 7m7-7H3"
                            />
                          </svg>
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Collapsed State */
              <div className="relative z-20 h-full flex flex-row md:flex-col justify-between items-center md:items-start">
                <div className="hidden md:block my-auto transform -rotate-90 origin-left text-xl font-black uppercase text-white/80 tracking-widest whitespace-nowrap">
                  {item.label}
                </div>

                <div className="block md:hidden text-base font-black uppercase text-white/90 tracking-wider">
                  {item.label}
                </div>

                <span className="text-sm font-mono font-bold text-white/50">
                  0{index + 1}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
