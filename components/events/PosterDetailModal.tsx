"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Download, FileText, Trophy, Users, ChevronRight, Phone, Gamepad2 } from "lucide-react";
import { GalleryItem } from "@/lib/highlights-data";

/**
 * Full-screen event detail overlay - poster on the left, info on the right.
 * Redesigned to match reference specifications:
 * - Purple pill category tag with chevron
 * - High-contrast Prize Money Pool card
 * - Event Coordinators direct contact section with tap-to-call
 * - Lavender-indigo primary 'REGISTER NOW >' button
 * - Sleek Rulebook & Brochure PDF action buttons
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
    requestAnimationFrame(() => setVisible(true));

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 transition-all duration-400 overflow-y-auto ${
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
        className={`relative my-auto flex max-h-[92vh] max-w-5xl flex-col md:flex-row gap-6 md:gap-8 transition-all duration-400 overflow-y-auto p-5 sm:p-7 md:p-8 bg-[#0a0b12] border border-white/10 rounded-2xl shadow-2xl ${
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
        <div className="relative flex-shrink-0 w-full md:w-[320px] lg:w-[380px] aspect-[380/540] overflow-hidden rounded-xl shadow-2xl shadow-indigo-500/10 ring-1 ring-white/10 mt-0">
          <Image
            src={item.image}
            alt={item.alt || item.title}
            fill
            sizes="(max-width: 768px) 100vw, 380px"
            className="object-cover"
            loading="eager"
            fetchPriority="high"
          />
        </div>

        {/* Info panel */}
        <div className="flex flex-col justify-between py-1 md:py-2 flex-1">
          <div>
            {/* Subtle category indicator */}
            <div className="text-[11px] font-mono tracking-[0.2em] text-slate-400 uppercase mb-2">
              {item.category}
            </div>

            {/* Title & subtitle */}
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white font-[family-name:var(--font-space-grotesk)] text-neon-rgb">
              {item.title}
            </h3>
            <p className="mt-2 text-sm sm:text-base leading-relaxed text-slate-300 font-medium">
              {item.description}
            </p>

            {/* Prize Money Pool Card */}
            <div className="mt-4 p-4 sm:p-5 rounded-xl bg-[#0c0d15] border border-white/10 shadow-lg">
              <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-slate-300" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                    PRIZE MONEY POOL
                  </span>
                </div>
                <span className="font-sans font-black text-xl sm:text-2xl text-white tracking-tight">
                  {typeof item.totalCash === "number"
                    ? `₹${item.totalCash.toLocaleString("en-IN")}`
                    : item.totalCash || (item.prizesRemarks ? item.prizesRemarks : "Competitive")}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {item.winnerCash !== undefined && (
                  <div className="p-3 rounded-lg bg-black/60 border border-white/5">
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                      WINNER (1ST)
                    </div>
                    <div className="font-sans font-black text-base sm:text-lg text-[#D8BFD8] mt-1">
                      {typeof item.winnerCash === "number"
                        ? `₹${item.winnerCash.toLocaleString("en-IN")}`
                        : item.winnerCash}
                    </div>
                  </div>
                )}

                {item.runnerUpCash !== undefined && (
                  <div className="p-3 rounded-lg bg-black/60 border border-white/5">
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                      RUNNER-UP (2ND)
                    </div>
                    <div className="font-sans font-black text-base sm:text-lg text-white mt-1">
                      {typeof item.runnerUpCash === "number"
                        ? `₹${item.runnerUpCash.toLocaleString("en-IN")}`
                        : item.runnerUpCash}
                    </div>
                  </div>
                )}

                {item.prizesRemarks && (
                  <div className="col-span-2 p-2.5 rounded-lg bg-purple-950/30 border border-purple-500/20 text-purple-200 text-xs">
                    {item.prizesRemarks}
                  </div>
                )}
              </div>

              {/* Team Size specifications */}
              <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#e6e6fa]" />
                  TEAM SIZE
                </span>
                <span className="font-bold text-white text-xs sm:text-sm">
                  {item.minTeam === 1 && item.maxTeam === 1
                    ? "Solo (1 Member)"
                    : item.minTeam === item.maxTeam
                    ? `${item.minTeam} Members`
                    : `${item.minTeam} - ${item.maxTeam} Members`}
                </span>
              </div>
            </div>


            {/* Event Coordinators Section */}
            {item.coordinators && item.coordinators.length > 0 && (
              <div className="mt-4 p-3.5 rounded-xl bg-white/[0.02] border border-white/10">
                <div className="flex items-center gap-1.5 text-slate-300 text-[10px] font-bold tracking-widest uppercase mb-2.5">
                  <Phone className="w-3.5 h-3.5 text-purple-400" />
                  <span>EVENT COORDINATORS</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {item.coordinators.map((coord, cIdx) => {
                    const isPlaceholder =
                      !coord.phone ||
                      /[a-zA-Z]/.test(coord.phone) ||
                      coord.phone.toLowerCase().includes("tba");

                    if (isPlaceholder) {
                      return (
                        <div
                          key={cIdx}
                          className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-dashed border-purple-400/30 text-slate-400"
                        >
                          <span className="text-xs font-medium text-slate-400">
                            {coord.name}
                          </span>
                          <span className="font-mono text-[10px] font-semibold text-purple-300/80 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-500/20">
                            {coord.phone || "To be updated"}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <a
                        key={cIdx}
                        href={`tel:${coord.phone}`}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-black/60 border border-white/5 hover:border-purple-500/40 hover:bg-purple-950/20 active:scale-95 transition-all group"
                        title={`Call ${coord.name} (${coord.phone})`}
                      >
                        <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                          {coord.name}
                        </span>
                        <span className="font-mono text-[11px] font-bold text-purple-300 group-hover:text-purple-200 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-purple-400 opacity-80" />
                          {coord.phone}
                        </span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons following reference image 2 */}
          <div className="mt-5 pt-3 border-t border-white/10 flex flex-wrap items-center gap-3">
            {item.category === "Activities - Gifts & Hampers" ? (
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 text-white/50 text-xs font-black uppercase tracking-wider cursor-not-allowed">
                <span>Opening Soon</span>
              </span>
            ) : item.eventId === "inaugural" ? (
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-500/20 border border-purple-400/40 text-purple-200 text-xs font-black uppercase tracking-wider">
                <span>Festival Showcase &bull; Open Entry</span>
              </span>
            ) : (
              <Link
                href={item.eventId ? `/register?event=${item.eventId}` : "/register"}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#8ea5fe] hover:bg-[#9cb1ff] text-zinc-950 text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(142,165,254,0.35)] active:scale-95"
              >
                <span>REGISTER NOW</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </Link>
            )}

            <a
              href="/docs/Sabrang%20Rule%20Book'26_20261009_233355_0000.pdf"
              target="_blank"
              rel="noopener noreferrer"
              download="Sabrang Rule Book'26_20261009_233355_0000.pdf"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-400/30 bg-black/50 hover:bg-indigo-950/40 text-slate-200 text-xs font-semibold transition-all shadow-sm active:scale-95"
            >
              <FileText className="w-4 h-4 text-indigo-300" />
              <span>Rulebook (PDF)</span>
            </a>

            {(item.category?.toLowerCase().includes("esport") ||
              item.title?.toLowerCase().includes("bgmi") ||
              item.title?.toLowerCase().includes("free fire") ||
              item.title?.toLowerCase().includes("valorant")) && (
              <a
                href="/docs/E-sports%20rule%20book.pdf"
                target="_blank"
                rel="noopener noreferrer"
                download="E-sports rule book.pdf"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-400/40 bg-black/50 hover:bg-emerald-950/40 text-emerald-200 text-xs font-semibold transition-all shadow-sm active:scale-95"
              >
                <Gamepad2 className="w-4 h-4 text-emerald-300" />
                <span>E-sports Rulebook (PDF)</span>
              </a>
            )}

            <a
              href="/docs/Sabrang_2026_Brochure.pdf"
              target="_blank"
              rel="noopener noreferrer"
              download="Sabrang_2026_Brochure.pdf"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-purple-500/60 bg-black/50 hover:bg-purple-950/40 text-purple-200 text-xs font-semibold transition-all shadow-sm active:scale-95"
            >
              <Download className="w-4 h-4 text-purple-400" />
              <span>Brochure (PDF)</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
