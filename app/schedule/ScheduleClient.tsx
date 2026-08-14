"use client";

import React, { useState } from "react";
import ScheduleCarousel from "./ScheduleCarousel";

type ScheduleEvent = {
  time: string;
  event: string;
  venue: string;
  type: string;
};

type ScheduleData = Record<string, ScheduleEvent[]>;

export default function ScheduleClient({ schedule }: { schedule: ScheduleData }) {
  const days = Object.keys(schedule);
  const [activeDay, setActiveDay] = useState(days[0]);

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      Flagship: "bg-purple-900/60 text-purple-300 border border-purple-500/30",
      Cultural: "bg-blue-900/60 text-blue-300 border border-blue-500/30",
      Technical:
        "bg-emerald-900/60 text-emerald-300 border border-emerald-500/30",
      "E-Sports": "bg-rose-900/60 text-rose-300 border border-rose-500/30",
      Management: "bg-amber-900/60 text-amber-300 border border-amber-500/30",
      Literary: "bg-indigo-900/60 text-indigo-300 border border-indigo-500/30",
      Ceremony: "bg-slate-800/80 text-slate-300 border border-slate-600/30",
      Entertainment: "bg-pink-900/60 text-pink-300 border border-pink-500/30",
    };
    return colors[type] || "bg-gray-800 text-gray-300";
  };

  const activeEvents = schedule[activeDay];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
      {/* Day Selector - Editorial Style */}
      <div className="flex justify-center gap-8 md:gap-16 mb-16 border-b border-white/10 pb-6 overflow-x-auto no-scrollbar">
        {days.map((day, index) => {
          const isActive = activeDay === day;
          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`relative flex flex-col items-start pb-2 transition-all duration-300 group ${
                isActive ? "opacity-100" : "opacity-40 hover:opacity-70"
              }`}
            >
              <span className="text-3xl font-black mb-1 font-mono">{String(index + 1).padStart(2, '0')}</span>
              <span className="text-sm tracking-[0.2em] font-bold uppercase">{day}</span>
              
              {/* Active Underline */}
              {isActive && (
                <span className="absolute -bottom-[17px] left-0 w-full h-[2px] bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Schedule Carousel for active day */}
      <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full overflow-visible">
        <ScheduleCarousel events={activeEvents} />
      </section>
    </div>
  );
}
