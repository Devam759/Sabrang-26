"use client";

import React, { useState, useMemo } from "react";
import { MapPin, Clock } from "lucide-react";
import { ShaderBackground } from "@/components/ui/neuro-noise";

/* ─────────────────────────────────────────────────────────────
   TYPES & CONSTANTS
────────────────────────────────────────────────────────────── */

export type ScheduleEvent = {
  time: string;
  timing?: string;
  event: string;
  venue: string;
  category: "Mandatory" | "Fun" | "Competition" | "Pro-Nite" | "Mentoring" | "Session" | "Ceremony";
  description?: string;
};

export type ScheduleData = {
  date: string;
  label: string;
  events: ScheduleEvent[];
}[];

const CATEGORIES = ["ALL", "COMPETITION", "PRO-NITE", "FUN", "MANDATORY"];

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
  "PRO-NITE":  { bg: "rgba(244, 63, 94, 0.22)", text: "#fda4af", border: "rgba(244, 63, 94, 0.4)" },
  PRO_NITE:    { bg: "rgba(244, 63, 94, 0.22)", text: "#fda4af", border: "rgba(244, 63, 94, 0.4)" },
  CEREMONY:    { bg: "rgba(245, 158, 11, 0.2)", text: "#fcd34d", border: "rgba(245, 158, 11, 0.35)" },
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
  const timePrimary = evt.time.split(" ")[0];
  const timeSecondary = evt.time.split(" ")[1] || "";
  const displayTiming = evt.timing || (evt.description && (evt.description.includes(" - ") || evt.description.includes("onwards")) ? evt.description : null);

  return (
    <div className="relative flex items-stretch group mb-3.5 sm:mb-5">
      {/* Time Gutter (Left): Responsive width and padding */}
      <div className="w-[44px] sm:w-[56px] flex-shrink-0 pt-3 sm:pt-4 text-right pr-2 sm:pr-3 flex flex-col justify-start select-none">
        <span className="text-[10.5px] sm:text-[12px] font-mono font-semibold text-slate-300 tracking-tight block leading-tight">
          {timePrimary}
        </span>
        {timeSecondary && (
          <span className="text-[8.5px] sm:text-[9.5px] font-mono text-purple-400 tracking-widest uppercase block mt-0.5 font-bold">
            {timeSecondary}
          </span>
        )}
      </div>

      {/* Timeline Spine & Circular Node */}
      <div className="relative w-3 sm:w-4 flex-shrink-0 flex justify-center">
        {/* Continuous vertical timeline line */}
        <div className="absolute top-0 bottom-0 w-[1.5px] bg-[#29212F] group-hover:bg-purple-500/70 transition-colors duration-200" />

        {/* Circular Node Marker */}
        <div className="absolute top-[15px] sm:top-[18px] w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full border border-[#3d2f47] bg-[#0B0A0E] group-hover:scale-125 group-hover:border-purple-400 group-hover:bg-purple-500 group-hover:shadow-[0_0_8px_rgba(168,85,247,0.8)] transition-all duration-200 z-10" />

        {/* Horizontal Connector Branch */}
        <div className="absolute top-[19px] sm:top-[22px] left-[50%] w-[8px] sm:w-[12px] h-[1px] bg-[#29212F] group-hover:bg-purple-400/80 transition-colors duration-200" />
      </div>

      {/* Event Card: Near-black #0B0A0E with subtle violet-gray border #29212F */}
      <div className="flex-1 min-w-0 pl-1.5 sm:pl-2">
        <div className="relative min-h-[70px] sm:min-h-[78px] rounded-xl bg-[#0B0A0E] border border-[#29212F] p-2.5 sm:p-3.5 flex flex-col justify-between transition-all duration-200 group-hover:-translate-y-[1px] group-hover:bg-[#15111C] group-hover:border-purple-500/40 group-hover:shadow-[0_8px_24px_-6px_rgba(147,51,234,0.25)] shadow-md">
          {/* Subtle top glare line on hover */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/10 to-transparent group-hover:via-purple-400/40 transition-colors" />

          {/* Upper Section: Title + Category Badge */}
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-white font-semibold text-[13px] sm:text-[15px] leading-snug font-sans tracking-wide group-hover:text-purple-100 transition-colors">
              {evt.event}
            </h3>
            <span
              className="flex-shrink-0 text-[7.5px] sm:text-[8.5px] font-mono font-bold tracking-wider px-1.5 sm:px-2 py-0.5 rounded-[4px] border backdrop-blur-sm uppercase"
              style={{
                backgroundColor: catStyle.bg,
                color: catStyle.text,
                borderColor: catStyle.border,
              }}
            >
              {evt.category}
            </span>
          </div>

          {/* Lower Section: Timing & Venue (No truncation) */}
          <div className="flex flex-col gap-1 sm:gap-1.5 pt-2 border-t border-white/[0.05] mt-1.5 text-[10px] sm:text-[11px] font-mono">
            {displayTiming && (
              <div className="flex items-center gap-1.5 text-purple-300/90 font-medium">
                <Clock size={10} className="text-purple-400 flex-shrink-0 sm:w-[11px] sm:h-[11px]" />
                <span>{displayTiming}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-slate-300 group-hover:text-purple-200 transition-colors">
              <MapPin size={10} className="text-purple-400 flex-shrink-0 sm:w-[11px] sm:h-[11px]" />
              <span className="tracking-wide uppercase font-medium">
                {evt.venue}
              </span>
            </div>
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
      {/* Header: #09080C with Oversized Numeral Watermark */}
      <div className="relative h-[68px] sm:h-[88px] px-3.5 sm:px-6 border-b border-[#29212F] bg-[#09080C] flex items-center justify-between overflow-hidden select-none">
        {/* Top subtle glow edge */}
        <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

        {/* Left: Day Label & Date */}
        <div className="relative z-10 flex flex-col justify-center">
          <h2 className="text-white font-mono font-bold text-[15px] sm:text-[18px] tracking-[2.5px] sm:tracking-[4px] uppercase leading-none">
            {day.label}
          </h2>
          <p className="text-[#c4b5fd] font-mono text-[9.5px] sm:text-[11px] tracking-[1.5px] sm:tracking-[2.5px] font-medium uppercase mt-1 sm:mt-2">
            {day.date}
          </p>
        </div>

        {/* Right: Oversized Low-Opacity Watermark Number */}
        <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none select-none z-0">
          <span className="font-mono font-black text-[56px] sm:text-[96px] tracking-tighter text-white/[0.08] leading-none block">
            {dayNumber}
          </span>
        </div>
      </div>

      {/* Events Body */}
      <div className="flex-1 p-2.5 sm:p-5 pt-3.5 sm:pt-6 pb-5 sm:pb-8 bg-[#09080C] flex flex-col justify-start min-h-[280px] md:min-h-[480px]">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-24 text-slate-500 font-mono text-xs tracking-widest uppercase">
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
  const [selectedMobileDay, setSelectedMobileDay] = useState<number | "ALL">(0);

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
      <main className="relative z-10 w-full max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8 pt-24 sm:pt-32 lg:pt-[170px] pb-20 sm:pb-24 flex flex-col items-center">
        {/* Title Header */}
        <div className="text-center mb-4 sm:mb-6">
          <h1 className="text-[28px] sm:text-[46px] md:text-[58px] font-extrabold tracking-[0.16em] sm:tracking-[0.22em] text-white uppercase font-mono leading-none drop-shadow-[0_4px_24px_rgba(168,85,247,0.35)]">
            SCHEDULE
          </h1>
          <p className="text-[#c4b5fd] font-mono text-[10px] sm:text-[12px] tracking-[2.5px] sm:tracking-[5px] uppercase mt-2.5 sm:mt-4 font-semibold">
            23 – 25 OCTOBER 2026
          </p>
        </div>

        {/* Mobile Day Selector Tabs (< md) */}
        <div className="w-full flex md:hidden items-center justify-between bg-[#0B0A0E] border border-[#29212F] p-1 rounded-xl mb-4 shadow-lg select-none">
          {schedule?.map((d, idx) => {
            const isSelected = selectedMobileDay === idx;
            return (
              <button
                key={idx}
                onClick={() => setSelectedMobileDay(idx)}
                className={`flex-1 py-1.5 px-1 text-center rounded-lg transition-all duration-200 flex flex-col items-center justify-center ${
                  isSelected
                    ? "bg-purple-600 text-white shadow-[0_0_12px_rgba(147,51,234,0.4)] font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span className="text-[11px] font-mono tracking-wider uppercase leading-tight font-semibold">
                  {`Day ${idx + 1}`}
                </span>
                <span className="text-[8.5px] font-mono opacity-80 tracking-tight mt-0.5">
                  {d.date.split(" ")[0]} {d.date.split(" ")[1]}
                </span>
              </button>
            );
          })}
          <button
            onClick={() => setSelectedMobileDay("ALL")}
            className={`py-1.5 px-3 text-center rounded-lg transition-all duration-200 flex flex-col items-center justify-center ${
              selectedMobileDay === "ALL"
                ? "bg-purple-600 text-white shadow-[0_0_12px_rgba(147,51,234,0.4)] font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span className="text-[11px] font-mono tracking-wider uppercase leading-tight font-semibold">
              ALL
            </span>
            <span className="text-[8.5px] font-mono opacity-80 tracking-tight mt-0.5">
              Feed
            </span>
          </button>
        </div>

        {/* Category Filters: Horizontal scroll on mobile, centered wrap on desktop */}
        <div className="w-full flex items-center justify-start md:justify-center overflow-x-auto no-scrollbar gap-1.5 sm:gap-2.5 mb-6 sm:mb-8 px-0.5 py-1">
          <div className="flex items-center gap-1.5 sm:gap-2.5 mx-auto">
            {CATEGORIES.map((cat) => {
              const isActive = activeCat === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCat(cat)}
                  className={`inline-flex items-center justify-center flex-shrink-0 h-[30px] sm:h-[38px] px-3 sm:px-4 rounded-full text-[9px] sm:text-[10.5px] font-mono font-bold tracking-wider uppercase transition-all duration-200 border whitespace-nowrap ${
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
        </div>

        {/* Desktop View (md:grid): 3 columns side-by-side */}
        <div className="hidden md:block w-full">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 items-stretch w-full">
            {filtered?.map((day, idx) => (
              <DayColumn key={idx} day={day} events={day.events} index={idx} />
            ))}
          </div>
        </div>

        {/* Mobile View (< md): Shows chosen day or all days */}
        <div className="block md:hidden w-full">
          {selectedMobileDay === "ALL" ? (
            <div className="flex flex-col gap-5 w-full">
              {filtered?.map((day, idx) => (
                <DayColumn key={idx} day={day} events={day.events} index={idx} />
              ))}
            </div>
          ) : (
            filtered && filtered[selectedMobileDay] && (
              <DayColumn
                day={filtered[selectedMobileDay]}
                events={filtered[selectedMobileDay].events}
                index={selectedMobileDay}
              />
            )
          )}
        </div>
      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
