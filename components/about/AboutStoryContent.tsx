import React from 'react';
import PillarAccordion from './PillarAccordion';

export default function AboutStoryContent() {
  return (
    <div className="relative w-full bg-[#050508] text-white pt-0 pb-16 px-4 sm:px-8 md:px-16 overflow-hidden">
      {/* Background Lighting Accents */}
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-[600px] h-[600px] bg-indigo-900/20 rounded-full blur-[180px] pointer-events-none" />

      <div className="max-w-6xl mx-auto">
        {/* Interactive Expandable Accordion for Sabrang Pillars */}
        <PillarAccordion />
      </div>
    </div>
  );
}
