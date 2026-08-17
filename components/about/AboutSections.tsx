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
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import dynamic from "next/dynamic";
import Prism from "./Prism";
import ThemeInstallation from "./ThemeInstallation";
import SabrangPillarsCanvas, { SABRANG_PILLARS } from "./SabrangPillarsCanvas";

const HeroTunnelScene = dynamic(() => import("./HeroTunnelScene"), {
  ssr: false,
});

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
  const dotRefs = useRef<{ [key: string]: HTMLSpanElement | null }>({});
  const [dotTargets, setDotTargets] = useState<{ [key: string]: { x: number; y: number } }>({});

  useEffect(() => {
    function updateDotPositions() {
      const section = document.getElementById("four-pillars");
      if (!section) return;
      const secRect = section.getBoundingClientRect();
      const newTargets: { [key: string]: { x: number; y: number } } = {};

      Object.entries(dotRefs.current).forEach(([id, el]) => {
        if (el) {
          const r = el.getBoundingClientRect();
          newTargets[id] = {
            x: r.left + r.width / 2 - secRect.left,
            y: r.top + r.height / 2 - secRect.top,
          };
        }
      });

      setDotTargets(newTargets);
    }

    updateDotPositions();
    const timer = setTimeout(updateDotPositions, 100);
    window.addEventListener("resize", updateDotPositions);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateDotPositions);
    };
  }, []);

  return (
    <div className="relative w-full bg-[#030206]/70 backdrop-blur-sm text-white selection:bg-purple-500 selection:text-white overflow-hidden">
      {/* Persistent Three.js 3D Particle Tunnel Background Scene */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-85">
        <HeroTunnelScene />
      </div>
      
      {/* ───────────────────────────────────────────────────────────────── */}
      {/* SECTION 02 — THE FOUR PILLARS OF SABRANG (Central Light System)   */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <section
        id="four-pillars"
        className="relative w-full py-20 sm:py-28 px-6 sm:px-12 md:px-20 bg-[#030206]/75 backdrop-blur-sm text-white overflow-hidden select-none border-b border-white/10"
      >
        {/* Central Canvas System */}
        <div className="absolute inset-0 z-1 pointer-events-none">
          <SabrangPillarsCanvas
            progressRef={pillarsProgressRef}
            activePillarId={activePillarId}
            onHoverPillar={setActivePillarId}
            dotTargets={dotTargets}
          />
        </div>

        <div className="max-w-6xl mx-auto space-y-12 relative z-10">
          {/* Section Heading */}
          <div className="space-y-4 max-w-2xl">
            <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-cyan-400 block">
              02 · THE FOUNDATION
            </span>
            <h2
              className="text-4xl sm:text-6xl font-black uppercase text-white tracking-tight leading-none"
              style={{
                fontFamily: '"Syne", "Outfit", "Inter", sans-serif',
                fontWeight: 850,
                color: "#ffffff",
                textShadow:
                  "0 0 24px rgba(255, 255, 255, 0.85), 0 0 45px rgba(56, 189, 248, 0.6), 0 4px 20px rgba(0,0,0,0.9)",
              }}
            >
              The Core Spectrums
            </h2>
            <p className="text-slate-300 text-sm sm:text-base font-light leading-relaxed pt-1">
              Four distinct forces emerging from the same unified core. Hover or tap to isolate each wavelength.
            </p>
          </div>

          {/* Interactive Architectural Glass Monolith Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
            {SABRANG_PILLARS.map((p) => {
              const isActive = activePillarId === p.id;
              return (
                <div
                  key={p.id}
                  onMouseEnter={() => setActivePillarId(p.id)}
                  onMouseLeave={() => setActivePillarId(null)}
                  className={`group relative min-h-[340px] flex flex-col justify-between p-7 rounded-2xl border transition-all duration-500 cursor-pointer backdrop-blur-2xl overflow-hidden ${
                    isActive
                      ? "bg-gradient-to-b from-white/[0.09] to-white/[0.02] border-white/40 -translate-y-3"
                      : "bg-gradient-to-b from-white/[0.04] to-white/[0.01] border-white/10 hover:border-white/25 hover:-translate-y-1.5"
                  }`}
                  style={{
                    boxShadow: isActive
                      ? `0 20px 45px ${p.color}35, inset 0 1px 0 rgba(255,255,255,0.3)`
                      : "none",
                  }}
                >
                  {/* Monolith Background Photo */}
                  {p.image && (
                    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none rounded-2xl">
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        className="object-cover opacity-25 group-hover:opacity-45 scale-105 group-hover:scale-110 transition-all duration-700 mix-blend-luminosity"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#030206] via-[#030206]/80 to-transparent" />
                    </div>
                  )}

                  {/* Top Ambient Wavelength Light Bar */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1 transition-all duration-500"
                    style={{
                      background: p.color,
                      opacity: isActive ? 1 : 0.4,
                      boxShadow: isActive ? `0 0 16px ${p.color}` : "none",
                    }}
                  />

                  {/* Watermark Pillar Number */}
                  <span
                    className="absolute top-3 right-4 font-mono font-black text-6xl select-none pointer-events-none transition-all duration-500"
                    style={{
                      color: p.color,
                      opacity: isActive ? 0.25 : 0.08,
                      transform: isActive ? "scale(1.08)" : "scale(1)",
                    }}
                  >
                    {p.number}
                  </span>

                  <div>
                    {/* Header: Badge + Target Dot */}
                    <div className="flex items-center justify-between mb-6 relative z-10">
                      <span
                        className="text-[10px] font-mono font-bold uppercase tracking-[0.25em] px-3 py-1 rounded-full border transition-all duration-300"
                        style={{
                          borderColor: `${p.color}50`,
                          color: p.color,
                          background: `${p.color}15`,
                          boxShadow: isActive ? `0 0 12px ${p.color}30` : "none",
                        }}
                      >
                        PILLAR {p.number}
                      </span>
                      
                      {/* Target Beacon Dot for Canvas Light Vector */}
                      <div className="relative flex items-center justify-center">
                        <span
                          ref={(el) => {
                            dotRefs.current[p.id] = el;
                          }}
                          className="w-3 h-3 rounded-full relative z-10 transition-transform duration-300"
                          style={{
                            background: p.color,
                            boxShadow: `0 0 14px ${p.color}`,
                            transform: isActive ? "scale(1.3)" : "scale(1)",
                          }}
                        />
                        {isActive && (
                          <span
                            className="absolute w-6 h-6 rounded-full animate-ping opacity-60 pointer-events-none"
                            style={{ background: p.color }}
                          />
                        )}
                      </div>
                    </div>

                    {/* Pillar Title & Subtitle */}
                    <h3
                      className="text-xl sm:text-2xl font-bold uppercase text-white tracking-tight leading-snug mb-1 relative z-10"
                      style={{ fontFamily: '"Syne", sans-serif' }}
                    >
                      {p.name}
                    </h3>
                    <span
                      className="text-[11px] font-mono uppercase tracking-widest block mb-4 relative z-10 font-semibold"
                      style={{ color: p.color }}
                    >
                      {p.subtitle}
                    </span>

                    {/* Pillar Description */}
                    <p className="text-slate-300/85 text-xs font-light leading-relaxed relative z-10">
                      {p.description}
                    </p>
                  </div>

                  {/* Bottom Keyword Badge Tag */}
                  <div className="pt-6 relative z-10">
                    <span
                      className="inline-block text-[9px] font-mono uppercase tracking-[0.2em] px-2.5 py-1 rounded border transition-all duration-300"
                      style={{
                        borderColor: isActive ? `${p.color}60` : "rgba(255,255,255,0.1)",
                        color: isActive ? "#ffffff" : "rgba(255,255,255,0.5)",
                        background: isActive ? `${p.color}25` : "rgba(255,255,255,0.03)",
                      }}
                    >
                      {p.keyword}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <ThemeInstallation />

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* SECTION 04 — WHY IS SABRANG OP?                                  */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <section
        id="why-sabrang-op"
        className="relative w-full py-28 px-6 sm:px-12 md:px-20 bg-[#030206]/85 backdrop-blur-sm border-t border-white/10 overflow-hidden select-none"
      >
        {/* Ambient Backlight Glows */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div
            className="absolute top-1/4 left-1/4 w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] opacity-25 blur-[160px]"
            style={{ background: "radial-gradient(circle at center, rgba(34,211,238,0.2) 0%, transparent 70%)" }}
          />
          <div
            className="absolute bottom-1/4 right-1/4 w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] opacity-25 blur-[160px]"
            style={{ background: "radial-gradient(circle at center, rgba(168,85,247,0.2) 0%, transparent 70%)" }}
          />
        </div>

        <div className="max-w-6xl mx-auto space-y-16 relative z-10">
          {/* Section Header */}
          <div className="space-y-4 max-w-2xl">
            <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-cyan-400 block">
              04 · SCALE &amp; IMPACT
            </span>
            <h2
              className="text-4xl sm:text-6xl font-black uppercase text-white tracking-tight leading-none"
              style={{
                fontFamily: '"Syne", "Outfit", "Inter", sans-serif',
                fontWeight: 850,
                color: "#ffffff",
                textShadow:
                  "0 0 24px rgba(255, 255, 255, 0.85), 0 0 45px rgba(56, 189, 248, 0.6), 0 4px 20px rgba(0,0,0,0.9)",
              }}
            >
              Why Is Sabrang OP?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base font-light leading-relaxed pt-1">
              Unmatched scale, wild crowd energy, massive prize pools, and 72 hours of unscripted mainstage euphoria.
            </p>
          </div>

          {/* OP Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-8 rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-cyan-500/10 to-transparent backdrop-blur-xl space-y-4 hover:border-cyan-400/50 hover:-translate-y-1.5 transition-all duration-300">
              <span className="text-4xl sm:text-5xl font-black font-mono text-cyan-400 block">15,000+</span>
              <h3 className="text-lg font-bold uppercase text-white tracking-tight" style={{ fontFamily: '"Syne", sans-serif' }}>
                Massive Footfall
              </h3>
              <p className="text-slate-400 text-xs font-light leading-relaxed">
                Multi-college student convergence, roaring mainstage crowds, and non-stop campus pulse across 3 days.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-purple-500/20 bg-gradient-to-b from-purple-500/10 to-transparent backdrop-blur-xl space-y-4 hover:border-purple-400/50 hover:-translate-y-1.5 transition-all duration-300">
              <span className="text-4xl sm:text-5xl font-black font-mono text-purple-400 block">₹3.5L+</span>
              <h3 className="text-lg font-bold uppercase text-white tracking-tight" style={{ fontFamily: '"Syne", sans-serif' }}>
                Cash Prize Pool
              </h3>
              <p className="text-slate-400 text-xs font-light leading-relaxed">
                High-stakes national competitions across Panache, Band Jam, Street Dance, Esports &amp; Hackathons.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/10 to-transparent backdrop-blur-xl space-y-4 hover:border-amber-400/50 hover:-translate-y-1.5 transition-all duration-300">
              <span className="text-4xl sm:text-5xl font-black font-mono text-amber-400 block">30+</span>
              <h3 className="text-lg font-bold uppercase text-white tracking-tight" style={{ fontFamily: '"Syne", sans-serif' }}>
                Marquee Arenas
              </h3>
              <p className="text-slate-400 text-xs font-light leading-relaxed">
                From high-fashion couture runways and rock band jams to AI hackathons and parliamentary debates.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-pink-500/20 bg-gradient-to-b from-pink-500/10 to-transparent backdrop-blur-xl space-y-4 hover:border-pink-400/50 hover:-translate-y-1.5 transition-all duration-300">
              <span className="text-4xl sm:text-5xl font-black font-mono text-pink-400 block">STAR</span>
              <h3 className="text-lg font-bold uppercase text-white tracking-tight" style={{ fontFamily: '"Syne", sans-serif' }}>
                Pro-Shows &amp; DJ Nights
              </h3>
              <p className="text-slate-400 text-xs font-light leading-relaxed">
                Headlining EDM DJs, indie rock bands, and celebrity artists under volumetric laser mainstages.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* SECTION 05 — BEYOND THE COMPETITIONS (Space Between Wavelengths)  */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <section className="relative w-full py-28 px-6 sm:px-12 md:px-20 bg-[#030206]/75 backdrop-blur-sm border-t border-white/10 overflow-hidden">
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
      <section className="relative w-full py-36 px-6 text-center bg-[#030206]/75 backdrop-blur-sm border-t border-white/10 overflow-hidden">
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
