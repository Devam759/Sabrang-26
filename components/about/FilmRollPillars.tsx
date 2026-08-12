"use client";

/**
 * FilmRollPillars — Sabrang About Page Continuous 35mm Film Strip Reel
 *
 * Renders the 4 Core Pillars of Sabrang (Panache, Pronites, Battlegrounds, Cultural Arts)
 * inside a single, unbroken 35mm physical film strip ribbon curving in 3D space.
 *
 * SCROLL INTERACTION:
 *   - Driven by GSAP ScrollTrigger.
 *   - Pins the section and rotates/slides the continuous 35mm film reel smoothly from left to right.
 *   - Active center frame shines with high contrast while an editorial info panel below displays frame details.
 */

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export interface PillarItem {
  id: string;
  title: string;
  category: string;
  desc: string;
  gradient: string;
  image: string;
  eventsCount: string;
  frameCode: string;
}

const PILLARS: PillarItem[] = [
  {
    id: "01",
    title: "PANACHE",
    category: "Fashion & High Art",
    desc: "The signature haute couture runway where fashion design meets theatrical choreography on a grand stage.",
    gradient: "from-cyan-500 via-indigo-500 to-purple-600",
    image: "/events_posters/PANACHE.webp",
    eventsCount: "12+ Runway Events",
    frameCode: "KODAK 500T • 01A",
  },
  {
    id: "02",
    title: "PRONITES",
    category: "Live Concerts & Star Nights",
    desc: "Electrifying live performances featuring headlining artists, acoustic unplugged stages, and high-energy DJ drops.",
    gradient: "from-indigo-500 via-purple-600 to-pink-600",
    image: "/events_posters/echoesofnoor.webp",
    eventsCount: "3 Pro-Show Nights",
    frameCode: "FUJI 400H • 02A",
  },
  {
    id: "03",
    title: "BATTLEGROUNDS",
    category: "E-Sports & Tech Arenas",
    desc: "High-stakes gaming tournaments, hackathons, and technical showdowns for top-tier competitive minds.",
    gradient: "from-purple-600 via-pink-600 to-rose-600",
    image: "/events_posters/bgmi.webp",
    eventsCount: "18+ Tech Arenas",
    frameCode: "PORTRA 800 • 03A",
  },
  {
    id: "04",
    title: "CULTURAL ARTS",
    category: "Dance, Drama & Music",
    desc: "Battle of the bands, street theater (Nukkad Natak), choreography showdowns, and fine arts showcases.",
    gradient: "from-pink-600 via-rose-600 to-amber-500",
    image: "/events_posters/BANDJAM.webp",
    eventsCount: "20+ Cultural Stages",
    frameCode: "TRI-X 400 • 04A",
  },
];

export default function FilmRollPillars() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const strip = stripRef.current;
    if (!section || !stage || !strip) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.refresh();

      // Total horizontal translation for the continuous ribbon
      const totalWidth = strip.scrollWidth;
      const moveDistance = totalWidth * 0.68;

      gsap.fromTo(
        strip,
        {
          x: "38vw",
          rotateY: 22,
        },
        {
          x: `-${moveDistance}px`,
          rotateY: -22,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom bottom",
            pin: stage,
            scrub: 1.0,
            anticipatePin: 1,
            onUpdate: (self) => {
              const idx = Math.min(
                PILLARS.length - 1,
                Math.max(0, Math.floor(self.progress * PILLARS.length)),
              );
              setActiveIndex(idx);
            },
          },
        },
      );
    }, section);

    return () => ctx.revert();
  }, []);

  const activePillar = PILLARS[activeIndex] ?? PILLARS[0];

  return (
    <div
      ref={sectionRef}
      className="relative w-full bg-[#050508] text-white"
      style={{ height: "340vh" }}
    >
      {/* Pinned 100vh viewport */}
      <div
        ref={stageRef}
        className="sticky top-0 w-full h-screen overflow-hidden flex flex-col justify-between py-8 sm:py-10 px-4 sm:px-8"
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 50% 50%, #08080c 0%, #030305 100%)",
        }}
      >
        {/* Background ambient lighting */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-cyan-950/20 rounded-full blur-[180px] pointer-events-none" />

        {/* Section Header */}
        <div className="relative z-20 text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-2 text-cyan-400 text-xs font-mono tracking-widest uppercase bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>CONTINUOUS 35MM FILM STRIP REEL • CORE PILLARS</span>
          </div>

          <h3
            className="text-3xl sm:text-5xl font-black uppercase text-white tracking-tight"
            style={{ fontFamily: '"Syne", "Outfit", "Inter", sans-serif' }}
          >
            The Pillars of Sabrang
          </h3>

          <p className="text-slate-400 text-xs sm:text-sm font-light">
            Scroll to glide along the unbroken 35mm film strip.
          </p>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════
            CONTINUOUS UNBROKEN 35MM FILM RIBBON (3D ARC PERSPECTIVE)
        ═════════════════════════════════════════════════════════════════════ */}
        <div
          className="relative z-10 w-full flex-grow flex items-center justify-center overflow-visible my-2"
          style={{
            perspective: "1400px",
            perspectiveOrigin: "50% 50%",
          }}
        >
          {/* Continuous Curved Film Strip */}
          <div
            ref={stripRef}
            className="relative flex flex-col bg-[#0b0b10] border-y-2 border-black rounded-lg shadow-2xl shadow-cyan-950/30 overflow-hidden will-change-transform"
            style={{
              transformStyle: "preserve-3d",
            }}
          >
            {/* ── CONTINUOUS TOP SPROCKET BORDER ───────────────────────────── */}
            <div className="w-full h-8 bg-[#111116] border-b border-white/10 flex items-center px-3 justify-between select-none">
              <div className="flex gap-3 overflow-hidden">
                {[...Array(48)].map((_, spIdx) => (
                  <div
                    key={spIdx}
                    className="w-3.5 h-2.5 rounded-[1.5px] bg-[#020204] border border-white/10 shadow-inner flex-shrink-0"
                  />
                ))}
              </div>
              <span className="text-[9px] font-mono text-amber-400/70 tracking-widest uppercase pl-4 flex-shrink-0">
                EASTMAN KODAK 35MM • SAFETY FILM • SABRANG 2025
              </span>
            </div>

            {/* ── MIDDLE EXPOSURE STRIP (4 CONTINUOUS FRAMES SIDE-BY-SIDE) ──── */}
            <div className="flex items-stretch bg-black px-2 py-2">
              {PILLARS.map((pillar, i) => {
                const isActive = i === activeIndex;

                return (
                  <React.Fragment key={pillar.id}>
                    {/* Frame Divider Bar */}
                    {i > 0 && (
                      <div className="w-6 sm:w-8 bg-[#0a0a0f] border-x border-white/15 flex flex-col justify-between items-center py-2 text-[9px] font-mono text-amber-400/80 uppercase select-none flex-shrink-0">
                        <span>{pillar.id}A</span>
                        <div className="w-0.5 h-12 bg-white/10" />
                        <span>SABRANG</span>
                      </div>
                    )}

                    {/* Single Film Frame */}
                    <div
                      onClick={() => setActiveIndex(i)}
                      className={`relative flex-shrink-0 w-[280px] sm:w-[360px] md:w-[420px] h-[210px] sm:h-[260px] cursor-pointer transition-all duration-500 overflow-hidden border ${
                        isActive
                          ? "border-cyan-400/80 shadow-2xl shadow-cyan-500/30 scale-102 z-20 brightness-110"
                          : "border-white/15 opacity-65 scale-98 hover:opacity-90 filter brightness-75"
                      }`}
                    >
                      <Image
                        src={pillar.image}
                        alt={pillar.title}
                        fill
                        sizes="(max-width: 768px) 280px, 420px"
                        quality={75}
                        className={`object-cover transition-transform duration-700 ease-out ${
                          isActive ? "scale-105" : "scale-100"
                        }`}
                        priority={i < 4}
                      />

                      {/* Dark overlay for active frame contrast */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                      {/* Top frame info badges */}
                      <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-10">
                        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-cyan-300 border border-white/15">
                          {pillar.category}
                        </span>
                        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/20 backdrop-blur-md text-cyan-200 border border-cyan-400/30">
                          {pillar.eventsCount}
                        </span>
                      </div>

                      {/* Frame Title Overlay inside Frame */}
                      <div className="absolute bottom-3 left-4 right-4 z-10 flex justify-between items-end">
                        <h4
                          className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight"
                          style={{
                            fontFamily: '"Syne", "Outfit", "Inter", sans-serif',
                          }}
                        >
                          {pillar.title}
                        </h4>
                        <span className="text-2xl font-mono font-bold text-white/30 select-none">
                          {pillar.id}
                        </span>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {/* ── CONTINUOUS BOTTOM SPROCKET BORDER ────────────────────────── */}
            <div className="w-full h-8 bg-[#111116] border-t border-white/10 flex items-center px-3 justify-between select-none">
              <span className="text-[9px] font-mono text-amber-400/70 tracking-widest uppercase pr-4 flex-shrink-0">
                KODAK 500T • NITRATE FREE • 2025 EDITION
              </span>
              <div className="flex gap-3 overflow-hidden">
                {[...Array(48)].map((_, spIdx) => (
                  <div
                    key={spIdx}
                    className="w-3.5 h-2.5 rounded-[1.5px] bg-[#020204] border border-white/10 shadow-inner flex-shrink-0"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════
            EDITORIAL ACTIVE FRAME DETAIL DISPLAY PANEL
        ═════════════════════════════════════════════════════════════════════ */}
        <div className="relative z-20 max-w-2xl mx-auto w-full bg-slate-950/80 border border-white/10 backdrop-blur-xl rounded-2xl p-5 sm:p-6 transition-all duration-500 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono text-amber-400/90 tracking-widest uppercase">
              {activePillar.frameCode}
            </span>
            <div className="flex gap-2">
              {PILLARS.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => setActiveIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    idx === activeIndex
                      ? "w-8 bg-cyan-400 shadow-md shadow-cyan-400/50"
                      : "w-2 bg-white/20 hover:bg-white/40"
                  }`}
                  aria-label={`Go to frame ${p.title}`}
                />
              ))}
            </div>
          </div>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-light">
            {activePillar.desc}
          </p>

          <div className="flex justify-between items-center pt-1 border-t border-white/10 text-xs font-mono">
            <span className="text-cyan-300 font-bold">
              {activePillar.category}
            </span>
            <Link
              href="/events"
              className="inline-flex items-center text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <span className="tracking-widest uppercase font-bold">
                EXPLORE CATEGORY
              </span>
              <svg
                className="w-4 h-4 ml-1.5"
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
          </div>
        </div>
      </div>
    </div>
  );
}
