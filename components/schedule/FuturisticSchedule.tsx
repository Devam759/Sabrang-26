"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
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
   3D BACKGROUND SYSTEM (Three.js)
────────────────────────────────────────────────────────────── */

function WebGLBackground() {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none hidden md:block">
      {/* 
        Heavy WebGL 3D Canvas (ParticleSystem & GlassPrism) removed for 60fps performance. 
        2D Atmospheric Overlays and Grid preserved below.
      */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:30px_30px] [mask-image:radial-gradient(ellipse_100%_100%_at_50%_0%,#000_60%,transparent_100%)]" />
      <div className="absolute top-0 right-[10%] w-[1px] h-[80%] bg-gradient-to-b from-transparent via-violet-400 to-transparent opacity-20 transform rotate-[15deg]" />
      <div className="absolute bottom-[20%] left-[5%] w-[1px] h-[60%] bg-gradient-to-b from-transparent via-blue-400 to-transparent opacity-10 transform -rotate-[25deg]" />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   HACKJKLU v4.0 STYLE EVENTS & TIMELINE
────────────────────────────────────────────────────────────── */

const CAT_STYLES: Record<string, { bg: string; text: string }> = {
  MANDATORY:   { bg: "rgba(239,68,68,0.15)", text: "#fca5a5" },
  FUN:         { bg: "rgba(34,197,94,0.15)", text: "#86efac" },
  COMPETITION: { bg: "rgba(217,70,239,0.15)", text: "#f0abfc" },
  MENTORING:   { bg: "rgba(107,114,128,0.25)", text: "#d1d5db" },
  SESSION:     { bg: "rgba(168,85,247,0.15)", text: "#d8b4fe" },
};
const getCatStyle = (cat: string) => CAT_STYLES[cat] || { bg: "rgba(107,114,128,0.25)", text: "#d1d5db" };

function EventRow({ evt }: { evt: ScheduleEvent }) {
  const catStyle = getCatStyle(evt.category.toUpperCase());
  return (
    <div className="relative flex items-stretch group cursor-pointer mb-2">
      {/* Time Marker (Left Side) */}
      <div className="w-[50px] flex-shrink-0 pt-[14px] text-right pr-2">
        <span className="text-[9px] sm:text-[10px] font-mono text-white/60 tracking-tight block leading-tight">
          {evt.time.split(' ')[0]}
        </span>
        <span className="text-[8px] sm:text-[9px] font-mono text-white/40 tracking-tight block mt-0.5">
          {evt.time.split(' ')[1]}
        </span>
      </div>

      {/* Timeline Spine */}
      <div className="relative w-4 flex-shrink-0 flex justify-center">
         <div className="absolute top-0 bottom-0 w-[2px] bg-violet-600/40 group-hover:bg-violet-500/80 transition-colors" />
         {/* Subtle connector */}
         <div className="absolute top-[18px] left-[50%] w-[10px] h-[1px] bg-violet-600/40 group-hover:bg-violet-500/80 transition-colors" />
      </div>

      {/* Content Area */}
      <div className="flex-1 pb-4 pl-1">
        <div className="bg-[#0a0f18]/80 border border-[#1e293b] rounded-[6px] p-3 transition-all duration-200 group-hover:-translate-y-[1px] group-hover:border-[#334155] group-hover:bg-[#0f172a] shadow-sm">
          <div className="flex justify-between items-start gap-2 mb-2">
            <h3 className="text-white/90 font-medium text-[13px] leading-snug font-sans max-w-[75%] group-hover:text-white transition-colors">
              {evt.event}
            </h3>
            <span 
              className="flex-shrink-0 text-[9px] font-bold tracking-wider px-2 py-[2px] rounded-[4px]"
              style={{ backgroundColor: catStyle.bg, color: catStyle.text }}
            >
              {evt.category}
            </span>
          </div>
          <div className="flex items-center gap-1 uppercase text-white/40 text-[10px] font-mono">
            <MapPin size={9} />
            {evt.venue}
          </div>
        </div>
      </div>
    </div>
  );
}

function DayColumn({ day, events }: { day: ScheduleData[0], events: ScheduleEvent[] }) {
  return (
    <div className="flex flex-col h-full min-w-[300px] flex-1">
      {/* Header */}
      <div className="bg-[#0a0f18] border border-[#1e293b] rounded-t-[6px] p-3 text-center mb-0">
        <h2 className="text-slate-200 font-bold text-[13px] tracking-wider uppercase font-sans">
          {day.label}
        </h2>
        <p className="text-slate-500 text-[10px] font-mono mt-0.5">{day.date}</p>
      </div>

      {/* Body */}
      <div className="bg-[#05080f]/70 border-x border-b border-[#1e293b] rounded-b-[6px] flex-1 p-4 pt-6">
        {events.length === 0 ? (
          <div className="text-center py-10 text-[10px] text-white/20 font-mono tracking-widest">
            NO EVENTS
          </div>
        ) : (
          <div className="flex flex-col relative">
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
   MAIN COMPONENT
────────────────────────────────────────────────────────────── */

export default function FuturisticSchedule({ schedule }: { schedule?: ScheduleData }) {
  const [activeCat, setActiveCat] = useState("ALL");

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  const filtered = useMemo(() => {
    return schedule?.map(day => ({
      ...day,
      events: activeCat === "ALL" ? day.events : day.events.filter(e => e.category.toUpperCase() === activeCat)
    }));
  }, [schedule, activeCat]);

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden text-white font-sans flex flex-col">
      {/* Background (Preserved strictly as requested) */}
      <div className="fixed inset-0 z-0 bg-[#020202]">
        <ShaderBackground className="absolute inset-0" />
      </div>
      <WebGLBackground />

      <main className="relative z-10 w-full h-full max-w-[1100px] mx-auto flex flex-col px-4 sm:px-6 pt-12 pb-8 justify-center">
        
        {/* REVEALING SOON — Schedule temporarily hidden */}
        <div className="flex flex-col items-center justify-center flex-1 w-full text-center mt-[-10vh]">
          <h1 className="text-sm sm:text-base font-bold tracking-[0.5em] text-white/40 uppercase font-mono mb-6">
            SCHEDULE
          </h1>
          
          <div className="relative inline-block">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-[0.2em] text-white uppercase font-mono drop-shadow-[0_0_30px_rgba(124,58,237,0.3)]">
              REVEALING SOON
            </h2>
            <div className="absolute -bottom-4 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
          </div>

          <div className="flex gap-3 mt-8 opacity-50">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" style={{ animationDelay: "200ms" }}></span>
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" style={{ animationDelay: "400ms" }}></span>
          </div>
        </div>

        {/* 
          TEMPORARILY HIDDEN — SCHEDULE REVEAL

          Day 1, Day 2, and Day 3 schedule content is intentionally
          commented out and hidden for now.

          The schedule will be revealed at a later date.
          DO NOT DELETE this code.

          To restore the schedule:
          1. Uncomment the schedule rendering section below.
          2. Remove/disable the "REVEALING SOON" state above.
          3. Verify the Day 1, Day 2, and Day 3 layouts.

          This code is preserved intentionally so the original
          schedule implementation can be restored without rebuilding it.
        */}
        {/* 
        <div className="text-center mb-6 flex-shrink-0 mt-8 sm:mt-4">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-[0.25em] text-white uppercase font-mono drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
            SCHEDULE
          </h1>
          <p className="text-violet-400/80 font-mono text-[10px] sm:text-xs tracking-[0.3em] uppercase mt-3">
            23 — 25 OCTOBER 2026
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-8 flex-shrink-0">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`px-3 py-1.5 rounded-[4px] text-[10px] font-bold tracking-wider uppercase transition-all duration-200 border ${
                activeCat === cat
                  ? 'bg-violet-600 border-violet-500 text-white shadow-[0_0_10px_rgba(124,58,237,0.3)]'
                  : 'bg-[#0f172a]/80 border-[#1e293b] text-slate-400 hover:bg-[#1e293b] hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar pb-10">
          <div className="flex flex-col lg:flex-row gap-5 items-stretch h-full">
            {filtered?.map((day, idx) => (
              <DayColumn key={idx} day={day} events={day.events} />
            ))}
          </div>
        </div>
        */}
      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
