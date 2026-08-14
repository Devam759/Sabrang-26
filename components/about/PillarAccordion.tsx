"use client";

/**
 * PillarAccordion — Pillars of Sabrang Showcase using AccordionGallery
 */

import React from "react";
import AccordionGallery, { AccordionGalleryItem } from "./AccordionGallery";

const PILLARS: AccordionGalleryItem[] = [
  {
    id: "01",
    label: "PANACHE",
    category: "Fashion & High Art",
    desc: "The signature haute couture runway where fashion design meets theatrical choreography and fierce personal expression on a grand national stage.",
    image: "/panache-runway.png",
    eventsCount: "12+ Runway Events",
    highlights: ["Haute Couture Runway", "Theatrical Styling", "Model Portfolios"],
    link: "/events",
  },
  {
    id: "02",
    label: "VERSEVAAD",
    category: "Literary Debates & Slam",
    desc: "An intense arena of spoken word, poetic rap battles, fierce literary debates, and high-impact verbal expression.",
    image: "/versevaad.jpg",
    eventsCount: "10+ Literary Stages",
    highlights: ["Spoken Word Slam", "Parliamentary Debate", "Slam Poetry"],
    link: "/events",
  },
  {
    id: "03",
    label: "ECHOS OF NOOR",
    category: "Sufi Night & Acoustics",
    desc: "Mesmerizing Sufi melodies, divine unplugged acoustics, and soul-stirring live musical performances illuminated under the stars.",
    image: "/echos-of-noor.png",
    eventsCount: "Soulful Live Night",
    highlights: ["Sufi & Classical Night", "Acoustic Unplugged", "Candlelight Melodies"],
    link: "/events",
  },
  {
    id: "04",
    label: "BAND JAM",
    category: "Battle of the Bands & Rock",
    desc: "Pure sonic warfare under the open sky — head-to-head rock battles, roaring drum solos, electric guitar riffs, and explosive band performances.",
    image: "/events_posters/BANDJAM.webp",
    eventsCount: "Battle of the Bands",
    highlights: ["Rock Battle Royale", "High Octane Riffs", "Live Open Air Stage"],
    link: "/events",
  },
  {
    id: "05",
    label: "DANCE BATTLES",
    category: "Solo & Street Dance Showcase",
    desc: "High-octane solo and duo street dance battles featuring hip-hop, popping, locking, and freestyle dance showdowns.",
    image: "/dance-battle.png",
    eventsCount: "8+ Dance Battles",
    highlights: ["Hip-Hop & Street Dance", "Solo & Group Battles", "High Energy Drops"],
    link: "/events",
  },
  {
    id: "06",
    label: "STEP UP",
    category: "Group Choreography Showdown",
    desc: "Flawless synchronized group dance battles featuring power-packed choreography, thematic storytelling, and explosive energy.",
    image: "/step-up.jpg",
    eventsCount: "Choreo Showdown",
    highlights: ["Flawless Group Choreo", "Tactical Dance Battles", "National Trophy"],
    link: "/events",
  },
];

export default function PillarAccordion() {
  return (
    <section className="relative w-full space-y-8 py-4 my-0">
      {/* Background Lighting Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[480px] rounded-full bg-purple-600/10 blur-[190px] pointer-events-none" />

      {/* Section Header */}
      <div className="relative z-20 text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2.5 text-purple-300 text-xs font-mono tracking-widest uppercase bg-purple-500/10 px-3.5 py-1.5 rounded-full border border-purple-500/20 shadow-lg shadow-purple-500/10">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
          <span>PILLARS OF SABRANG • ACCORDION SHOWCASE</span>
        </div>

        <h3
          className="text-3xl sm:text-5xl font-black uppercase text-white tracking-tight"
          style={{ fontFamily: '"Syne", "Outfit", "Inter", sans-serif' }}
        >
          Pillars of Sabrang
        </h3>

        <p className="text-slate-400 text-xs sm:text-sm font-light max-w-lg mx-auto">
          Explore the flagship events and artistic pillars crafted to celebrate every dimension of sound, fashion, and art.
        </p>
      </div>

      {/* Accordion Gallery Showcase */}
      <div className="relative z-10">
        <AccordionGallery
          items={PILLARS}
          defaultIndex={2}
          expandRatio={0.52}
          trigger="hover"
        />
      </div>
    </section>
  );
}
