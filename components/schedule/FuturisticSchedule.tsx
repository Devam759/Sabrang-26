"use client";

import React, { useState, useMemo } from "react";
import { MapPin } from "lucide-react";
import { ShaderBackground } from "@/components/ui/neuro-noise";

/* ─────────────────────────────────────────────────────────────
   TYPES & CONSTANTS
────────────────────────────────────────────────────────────── */

export type ScheduleEvent = {
  time: string;
  event: string;
  venue: string;
  category: "Mandatory" | "Fun" | "Competition" | "Mentoring" | "Session";
  description?: string;
};

export type ScheduleData = {
  date: string;
  label: string;
  events: ScheduleEvent[];
}[];

const CATEGORIES = ["ALL", "MANDATORY", "FUN", "COMPETITION", "MENTORING", "SESSION"];

/* ─────────────────────────────────────────────────────────────
   3D ATMOSPHERIC BACKGROUND OVERLAYS
────────────────────────────────────────────────────────────── */

function WebGLBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none hidden md:block">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_100%_100%_at_50%_0%,#000_60%,transparent_100%)]" />
      <div className="absolute top-0 right-[15%] w-[1.5px] h-[85%] bg-gradient-to-b from-transparent via-purple-500/25 to-transparent transform rotate-[16deg]" />
      <div className="absolute bottom-[10%] left-[8%] w-[1px] h-[65%] bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent transform -rotate-[22deg]" />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   CATEGORY BADGES & STYLING
────────────────────────────────────────────────────────────── */

const CAT_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  MANDATORY:   { bg: "rgba(220, 38, 38, 0.2)", text: "#fca5a5", border: "rgba(239, 68, 68, 0.35)" },
  FUN:         { bg: "rgba(16, 185, 129, 0.18)", text: "#6ee7b7", border: "rgba(16, 185, 129, 0.35)" },
  COMPETITION: { bg: "rgba(168, 85, 247, 0.2)", text: "#e9d5ff", border: "rgba(168, 85, 247, 0.35)" },
  MENTORING:   { bg: "rgba(59, 130, 246, 0.18)", text: "#93c5fd", border: "rgba(59, 130, 246, 0.35)" },
  SESSION:     { bg: "rgba(217, 70, 239, 0.2)", text: "#f5d0fe", border: "rgba(217, 70, 239, 0.35)" },
};

const getCatStyle = (cat: string) =>
  CAT_STYLES[cat] || {
    bg: "rgba(148, 163, 184, 0.15)",
    text: "#cbd5e1",
    border: "rgba(148, 163, 184, 0.25)",
  };

/* ─────────────────────────────────────────────────────────────
   EVENT ROW WITH RESPONSIVE TIMELINE GUTTER & CARDS
────────────────────────────────────────────────────────────── */

function EventRow({ evt }: { evt: ScheduleEvent }) {
  const catStyle = getCatStyle(evt.category.toUpperCase());

  return (
    <div className="relative flex items-stretch group mb-4 sm:mb-6">
      {/* Time Gutter (Left): Responsive width and padding */}
      <div className="w-[50px] sm:w-[58px] flex-shrink-0 pt-3.5 sm:pt-4 text-right pr-2 sm:pr-3 flex flex-col justify-start select-none">
        <span className="text-[11px] sm:text-[12px] font-mono font-semibold text-slate-300 tracking-tight block leading-tight">
          {evt.time.split(" ")[0]}
        </span>
        <span className="text-[9px] sm:text-[9.5px] font-mono text-purple-400 tracking-widest uppercase block mt-0.5 font-bold">
          {evt.time.split(" ")[1] || ""}
        </span>
      </div>

      {/* Timeline Spine & Circular Node */}
      <div className="relative w-3.5 sm:w-4 flex-shrink-0 flex justify-center">
        {/* Continuous vertical timeline line */}
        <div className="absolute top-0 bottom-0 w-[1.5px] bg-[#29212F] group-hover:bg-purple-500/70 transition-colors duration-200" />

        {/* Circular Node Marker */}
        <div className="absolute top-[16px] sm:top-[18px] w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full border border-[#3d2f47] bg-[#0B0A0E] group-hover:scale-125 group-hover:border-purple-400 group-hover:bg-purple-500 group-hover:shadow-[0_0_8px_rgba(168,85,247,0.8)] transition-all duration-200 z-10" />

        {/* Horizontal Connector Branch */}
        <div className="absolute top-[20px] sm:top-[22px] left-[50%] w-[10px] sm:w-[12px] h-[1px] bg-[#29212F] group-hover:bg-purple-400/80 transition-colors duration-200" />
      </div>

      {/* Event Card: Near-black #0B0A0E with subtle violet-gray border #29212F */}
      <div className="flex-1 min-w-0 pl-1.5 sm:pl-2">
        <div className="relative min-h-[110px] sm:min-h-[118px] rounded-lg bg-[#0B0A0E] border border-[#29212F] p-3.5 sm:p-[18px] flex flex-col justify-between transition-all duration-200 group-hover:-translate-y-[1px] group-hover:bg-[#15111C] group-hover:border-purple-500/40 group-hover:shadow-[0_8px_24px_-6px_rgba(147,51,234,0.25)] shadow-md">
          {/* Subtle top glare line on hover */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/10 to-transparent group-hover:via-purple-400/40 transition-colors" />

          {/* Upper Section: Title + Category Badge */}
          <div className="flex justify-between items-start gap-2 sm:gap-3">
            <h3 className="text-white font-semibold text-[14px] sm:text-[16px] leading-snug font-sans tracking-wide group-hover:text-purple-100 transition-colors">
              {evt.event}
            </h3>
            <span
              className="flex-shrink-0 text-[8.5px] sm:text-[9px] font-mono font-bold tracking-wider px-2 sm:px-2.5 py-0.5 rounded-[4px] border backdrop-blur-sm uppercase"
              style={{
                backgroundColor: catStyle.bg,
                color: catStyle.text,
                borderColor: catStyle.border,
              }}
            >
              {evt.category}
            </span>
          </div>

          {/* Lower Section: Venue with Location Pin */}
          <div className="flex items-center justify-between text-slate-400 text-[10px] sm:text-[11px] font-mono pt-2 border-t border-white/[0.04]">
            <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-purple-300 transition-colors min-w-0">
              <MapPin size={11} className="text-purple-400 flex-shrink-0" />
              <span className="tracking-wide uppercase font-medium truncate">
                {evt.venue}
              </span>
            </div>
            {evt.description && (
              <span className="text-[9.5px] sm:text-[10px] text-slate-500 font-mono tracking-tight flex-shrink-0 ml-2">
                {evt.description}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   DAY COLUMN WITH DEEP VIOLET-BLACK PANELS (#09080C)
────────────────────────────────────────────────────────────── */

function DayColumn({
  day,
  events,
  index,
}: {
  day: ScheduleData[0];
  events: ScheduleEvent[];
  index: number;
}) {
  const dayNumber = String(index + 1).padStart(2, "0");

  return (
    <div className="flex flex-col h-full w-full rounded-xl border border-[#29212F] bg-[#09080C] overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.7)] transition-all duration-300 hover:border-purple-500/30">
      {/* Header: #09080C with 96px Oversized Numeral Watermark */}
      <div className="relative h-[78px] sm:h-[88px] px-4 sm:px-6 border-b border-[#29212F] bg-[#09080C] flex items-center justify-between overflow-hidden select-none">
        {/* Top subtle glow edge */}
        <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

        {/* Left: Day Label (18px, bold, 4px tracking) & Lavender Date */}
        <div className="relative z-10 flex flex-col justify-center">
          <h2 className="text-white font-mono font-bold text-[16px] sm:text-[18px] tracking-[3px] sm:tracking-[4px] uppercase leading-none">
            {day.label}
          </h2>
          <p className="text-[#c4b5fd] font-mono text-[10px] sm:text-[11px] tracking-[2px] sm:tracking-[2.5px] font-medium uppercase mt-1.5 sm:mt-2">
            {day.date}
          </p>
        </div>

        {/* Right: Oversized Low-Opacity Watermark Number */}
        <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none select-none z-0">
          <span className="font-mono font-black text-[72px] sm:text-[96px] tracking-tighter text-white/[0.10] leading-none block">
            {dayNumber}
          </span>
        </div>
      </div>

      {/* Events Body */}
      <div className="flex-1 p-3 sm:p-5 pt-5 sm:pt-6 pb-6 sm:pb-8 bg-[#09080C] flex flex-col justify-start lg:min-h-[1100px]">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-slate-500 font-mono text-xs tracking-widest uppercase">
            <span className="w-8 h-8 rounded-full border border-dashed border-slate-700 flex items-center justify-center mb-2 text-slate-600">
              0
            </span>
            No events match this filter
          </div>
        ) : (
          <div className="flex flex-col relative flex-1">
            {events.map((evt, idx) => (
              <EventRow key={idx} evt={evt} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT — RESPONSIVE MOBILE OPTIMUM
────────────────────────────────────────────────────────────── */

export default function FuturisticSchedule({ schedule }: { schedule?: ScheduleData }) {
  const [activeCat, setActiveCat] = useState("ALL");

  const filtered = useMemo(() => {
    return schedule?.map((day) => ({
      ...day,
      events:
        activeCat === "ALL"
          ? day.events
          : day.events.filter((e) => e.category.toUpperCase() === activeCat),
    }));
  }, [schedule, activeCat]);

  return (
    <div className="relative min-h-screen w-full bg-[#030305] text-white font-sans overflow-x-hidden">
      {/* Background Neuro-Noise Shader & Grid */}
      <div className="fixed inset-0 z-0 bg-[#020202]">
        <ShaderBackground className="absolute inset-0" />
      </div>
      <WebGLBackground />

      {/* Main Schedule Container */}
      <main className="relative z-10 w-full max-w-[1260px] mx-auto px-3.5 sm:px-6 lg:px-8 pt-28 sm:pt-36 lg:pt-[180px] pb-16 sm:pb-24 flex flex-col items-center">
        {/* Title Header */}
        <div className="text-center mb-5 sm:mb-6">
          <h1 className="text-[34px] sm:text-[50px] md:text-[62px] font-extrabold tracking-[0.2em] sm:tracking-[0.22em] text-white uppercase font-mono leading-none drop-shadow-[0_4px_24px_rgba(168,85,247,0.35)]">
            SCHEDULE
          </h1>
          <p className="text-[#c4b5fd] font-mono text-[11px] sm:text-[12px] tracking-[3.5px] sm:tracking-[5px] uppercase mt-3 sm:mt-4 font-semibold">
            23 – 25 OCTOBER 2026
          </p>
        </div>

        {/* Category Filters: Cleanly wrap on mobile so no pills get cut off */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 mb-8 sm:mb-10 max-w-2xl px-2">
          {CATEGORIES.map((cat) => {
            const isActive = activeCat === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                className={`inline-flex items-center justify-center h-[34px] sm:h-[38px] px-3.5 sm:px-4 rounded-full text-[10px] sm:text-[10.5px] font-mono font-bold tracking-wider uppercase transition-all duration-200 border ${
                  isActive
                    ? "bg-purple-600 border-purple-500 text-white shadow-[0_0_16px_rgba(147,51,234,0.5)]"
                    : "bg-[#09080C] border-[#29212F] text-slate-400 hover:bg-[#15111C] hover:text-white"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* 3 Day Columns: 1 col on mobile, 2 cols on tablet, 3 cols on desktop */}
        <div className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 items-stretch w-full">
            {filtered?.map((day, idx) => (
              <DayColumn key={idx} day={day} events={day.events} index={idx} />
            ))}
          </div>
        </div>
      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
