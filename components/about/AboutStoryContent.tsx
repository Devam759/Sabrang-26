import React from "react";
import PillarAccordion from "./PillarAccordion";

export default function AboutStoryContent() {
  return (
    <div className="relative w-full bg-[#000000] text-white pt-4 pb-20 px-4 sm:px-8 md:px-16 overflow-hidden border-t border-white/10">
      {/* Background Lighting Accents synced with Sabrang Theme */}
      <div className="absolute top-1/4 right-0 w-[550px] h-[550px] bg-purple-600/15 rounded-full blur-[170px] pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-[650px] h-[650px] bg-cyan-500/15 rounded-full blur-[190px] pointer-events-none" />

      <div className="max-w-6xl mx-auto">
        {/* Flagship Events Accordion Showcase */}
        <PillarAccordion />
      </div>
    </div>
  );
}
