"use client";

/**
 * AboutSections — The Sabrang 2026 Spectrum Narrative
 *
 * Cinematic narrative arc after the locked landing page:
 * SECTION 01: WHAT IS SABRANG? (Editorial Story & SAB + RANG = ALL COLORS)
 * SECTION 02: THE FOUR PILLARS (Central Light System & 4 Emerging Wavelengths)
 * SECTION 03: SPECTRUM TRANSITION (Wavelengths Merging)
 * SECTION 04: THE SPECTRUM / FLAGSHIP EXPERIENCES (Scroll-Driven Event Wavelengths)
 * SECTION 05: BEYOND COMPETITIONS (The Space Between Wavelengths)
 * SECTION 06: FINAL RECOMBINATION (Colors Merge into Pure White Light + Statement)
 */

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Prism from "./Prism";
import ThemeInstallation from "./ThemeInstallation";
import SabrangPillarsCanvas, { SABRANG_PILLARS } from "./SabrangPillarsCanvas";

gsap.registerPlugin(ScrollTrigger);

// Flagship Event Wavelength Data
const SPECTRUM_EVENTS = [
  {
    colorName: "VIOLET",
    colorHex: "#8b5cf6",
    eventName: "Panache",
    hook: "The High-Fashion Runway Spectacle",
    description: "Couture meets avant-garde art as top collegiate design houses battle under volumetric mainstage lights.",
    prizePool: "₹65,000+",
  },
  {
    colorName: "RED",
    colorHex: "#ef4444",
    eventName: "Dance Battle",
    hook: "Choreography & Group Synergy Clash",
    description: "High-octane group choreography, synchronization, and raw street energy on the main stage.",
    prizePool: "₹55,000+",
  },
  {
    colorName: "ORANGE",
    colorHex: "#f97316",
    eventName: "Band Jam",
    hook: "Live Rock & Fusion Battle of the Bands",
    description: "Electrifying guitar solos, explosive drumming, and original indie rock anthems.",
    prizePool: "₹50,000+",
  },
  {
    colorName: "YELLOW",
    colorHex: "#eab308",
    eventName: "Step Up",
    hook: "Solo & Duo Street Dance Duel",
    description: "1v1 popping, locking, and hip-hop duels judged by national dance icons.",
    prizePool: "₹35,000+",
  },
  {
    colorName: "BLUE",
    colorHex: "#3b82f6",
    eventName: "Echoes of Noor",
    hook: "Slam Poetry & Acoustic Expressions",
    description: "Intimate acoustic melodies, spoken word poetry, and soulful vocal acts.",
    prizePool: "₹30,00,0+",
  },
  {
    colorName: "INDIGO",
    colorHex: "#6366f1",
    eventName: "VerseVaad",
    hook: "National Parliamentary Debate & Oratory",
    description: "High-level intellectual clash on contemporary ethics, technology, and global policy.",
    prizePool: "₹25,000+",
  },
];

export default function AboutSections() {
  const pillarsProgressRef = useRef(1);
  const [activePillarId, setActivePillarId] = useState<string | null>(null);

  return (
    <div className="w-full bg-[#030206] text-white selection:bg-purple-500 selection:text-white overflow-hidden">
      
      {/* ───────────────────────────────────────────────────────────────── */}
      {/* SECTION 02 — THE FOUR PILLARS OF SABRANG (Central Light System)   */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <section
        id="four-pillars"
        className="relative w-full py-20 sm:py-28 px-6 sm:px-12 md:px-20 bg-[#030206] text-white overflow-hidden select-none border-b border-white/10"
      >
        {/* Central Canvas System */}
        <div className="absolute inset-0 z-1 pointer-events-none">
          <SabrangPillarsCanvas
            progressRef={pillarsProgressRef}
            activePillarId={activePillarId}
            onHoverPillar={setActivePillarId}
          />
        </div>

        <div className="max-w-6xl mx-auto space-y-12 relative z-10">
          {/* Section Heading */}
          <div className="space-y-3 max-w-xl">
            <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-purple-400 block">
              02 · THE FOUNDATION
            </span>
            <h2
              className="text-3xl sm:text-5xl font-light uppercase text-white tracking-tight leading-none"
              style={{ fontFamily: '"Syne", sans-serif' }}
            >
              The Four Pillars <br />
              <span className="font-bold text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text">
                of Sabrang
              </span>
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm font-light leading-relaxed">
              Four distinct forces emerging from the same unified core. Hover or tap to isolate each wavelength.
            </p>
          </div>

          {/* Interactive Pillar Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
            {SABRANG_PILLARS.map((p) => {
              const isActive = activePillarId === p.id;
              return (
                <div
                  key={p.id}
                  onMouseEnter={() => setActivePillarId(p.id)}
                  onMouseLeave={() => setActivePillarId(null)}
                  className={`p-6 rounded-3xl border transition-all duration-500 cursor-pointer backdrop-blur-2xl ${
                    isActive
                      ? "bg-white/[0.08] border-white/40 shadow-[0_0_30px_rgba(168,85,247,0.3)] -translate-y-2"
                      : "bg-white/[0.03] border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className="text-xs font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border"
                      style={{
                        borderColor: `${p.color}40`,
                        color: p.color,
                        background: `${p.color}15`,
                      }}
                    >
                      PILLAR {p.number}
                    </span>
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: p.color, boxShadow: `0 0 10px ${p.color}` }}
                    />
                  </div>

                  <h3
                    className="text-lg sm:text-xl font-bold uppercase text-white tracking-tight mb-1"
                    style={{ fontFamily: '"Syne", sans-serif' }}
                  >
                    {p.name}
                  </h3>
                  <span className="text-[10px] font-mono text-cyan-300/80 uppercase tracking-widest block mb-3">
                    {p.subtitle}
                  </span>

                  <p className="text-slate-300/80 text-xs font-light leading-relaxed">
                    {p.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <ThemeInstallation />

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* SECTION 05 — BEYOND THE COMPETITIONS (Space Between Wavelengths)  */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <section className="relative w-full py-28 px-6 sm:px-12 md:px-20 bg-[#030206] border-t border-white/10 overflow-hidden">
        {/* Ambient atmospheric backlight blobs */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute top-10 left-10 w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] opacity-25 blur-[140px]"
            style={{ background: "radial-gradient(ellipse at center, rgba(168,85,247,0.16) 0%, transparent 70%)" }} />
          <div className="absolute bottom-10 right-10 w-[55vw] h-[55vw] max-w-[650px] max-h-[650px] opacity-20 blur-[150px]"
            style={{ background: "radial-gradient(ellipse at center, rgba(6,182,212,0.15) 0%, transparent 70%)" }} />
        </div>

        <div className="max-w-6xl mx-auto space-y-16 relative z-10">
          
          <div className="space-y-3 max-w-xl">
            <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-purple-400 block">
              05 · THE FEST ATMOSPHERE
            </span>
            <h2
              className="text-3xl sm:text-5xl font-black uppercase text-white tracking-tight"
              style={{ fontFamily: '"Syne", sans-serif' }}
            >
              Beyond <span className="text-cyan-300">Competitions</span>
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm font-light">
              The space between wavelengths — 72 hours of unscripted music, people, energy, and late-night campus discoveries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3 border-l border-purple-500/40 pl-6">
              <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400">
                After-Dark Energy
              </span>
              <h3 className="text-xl font-bold uppercase text-white" style={{ fontFamily: '"Syne", sans-serif' }}>
                DJ Nights &amp; Mainstage Concerts
              </h3>
              <p className="text-slate-400 text-xs font-light leading-relaxed">
                High-octane EDM basslines, laser visual installations, and open-floor dancing till midnight every single day.
              </p>
            </div>

            <div className="space-y-3 border-l border-cyan-500/40 pl-6">
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
                Interactive Zone
              </span>
              <h3 className="text-xl font-bold uppercase text-white" style={{ fontFamily: '"Syne", sans-serif' }}>
                Esports &amp; Mini Games Arena
              </h3>
              <p className="text-slate-400 text-xs font-light leading-relaxed">
                Casual arcade corners, console gaming duels, VR setups, and pop-up challenge booths scattered across campus.
              </p>
            </div>

            <div className="space-y-3 border-l border-pink-500/40 pl-6">
              <span className="text-[10px] font-mono uppercase tracking-widest text-pink-400">
                Spontaneous Culture
              </span>
              <h3 className="text-xl font-bold uppercase text-white" style={{ fontFamily: '"Syne", sans-serif' }}>
                Pre-Sabrang Flashmobs &amp; Pop-ups
              </h3>
              <p className="text-slate-400 text-xs font-light leading-relaxed">
                Acoustic jam circles, spontaneous street dance pop-ups, food carnivals, and neon photo installations.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* SECTION 06 — THE FINAL RECOMBINATION & STATEMENT                   */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <section className="relative w-full py-36 px-6 text-center bg-[#030206] border-t border-white/10 overflow-hidden">
        {/* Ambient atmospheric backlight blobs */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[900px] max-h-[900px] opacity-30 blur-[170px]"
            style={{ background: "radial-gradient(circle at center, rgba(255,255,255,0.2) 0%, rgba(6,182,212,0.15) 35%, rgba(168,85,247,0.1) 60%, transparent 80%)" }} />
        </div>

        <div className="max-w-3xl mx-auto space-y-10 relative z-10">
          <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-cyan-300 block">
            06 · THE RECOMBINATION
          </span>

          <div className="space-y-2">
            <h2
              className="text-4xl sm:text-6xl md:text-7xl font-black uppercase text-white tracking-tight"
              style={{ fontFamily: '"Syne", sans-serif', letterSpacing: "-0.02em" }}
            >
              Sab rang.
            </h2>
            <h3
              className="text-3xl sm:text-5xl font-light uppercase text-transparent bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text tracking-tight"
              style={{ fontFamily: '"Syne", sans-serif' }}
            >
              All color.
            </h3>
            <h4
              className="text-2xl sm:text-4xl font-extralight uppercase text-white/80 tracking-widest"
              style={{ fontFamily: '"Syne", sans-serif' }}
            >
              One light.
            </h4>
          </div>

          <p
            className="text-slate-400 text-xs sm:text-sm font-light leading-relaxed max-w-md mx-auto"
            style={{ fontFamily: '"Inter", sans-serif' }}
          >
            Whether you come to perform, create, compete, or simply absorb the energy — Sabrang 2026 welcomes you to step into the light.
          </p>

          <div className="pt-6">
            <Link
              href="/events"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white text-black font-bold text-xs uppercase tracking-widest shadow-2xl hover:bg-slate-200 hover:scale-105 transition duration-300"
            >
              Explore Flagship Arenas
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
