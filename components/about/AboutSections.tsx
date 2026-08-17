"use client";

/**
 * AboutSections — The Sabrang 2026 Spectrum Narrative Sections
 *
 * SECTION 02: THE CORE SPECTRUMS (The Four Foundation Pillars)
 * SECTION 04: WHY IS SABRANG OP? (Bespoke Kinetic Spectrum Console & Editorial Metrics)
 * SECTION 05: BEYOND COMPETITIONS (The Space Between Wavelengths)
 * SECTION 06: FINAL RECOMBINATION (Colors Merge into Pure White Light + Statement)
 */

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export interface PillarData {
  id: string;
  number: string;
  name: string;
  subtitle: string;
  description: string;
  color: string;
  defaultRatioX: number;
  keyword: string;
  image?: string;
}

export const SABRANG_PILLARS: PillarData[] = [
  {
    id: "techno",
    number: "01",
    name: "TECHNO & INNOVATION",
    subtitle: "Technical Genius & Code",
    description: "National hackathons, robotics arenas, AI showdowns, and high-stakes coding duels.",
    color: "#22d3ee",
    defaultRatioX: 0.15,
    keyword: "TECHNICAL GENIUS",
    image: "/versevaad.jpg",
  },
  {
    id: "cultural",
    number: "02",
    name: "CULTURAL & PERFORMING",
    subtitle: "Artistic Rebellion & Stage",
    description: "Live band clashes, battle of the dance troupes, fashion runways, and mainstage concerts.",
    color: "#a855f7",
    defaultRatioX: 0.38,
    keyword: "ARTISTIC REBELLION",
    image: "/dance-battle.png",
  },
  {
    id: "management",
    number: "03",
    name: "MANAGEMENT & STRATEGY",
    subtitle: "Business Vision & Pitch",
    description: "B-plan pitching, stock market simulations, crisis management, and executive leadership.",
    color: "#f59e0b",
    defaultRatioX: 0.62,
    keyword: "STRATEGIC VISION",
    image: "/sabrang-live.png",
  },
  {
    id: "design",
    number: "04",
    name: "DESIGN & EXPRESSION",
    subtitle: "Visual Arts & Aesthetics",
    description: "UI/UX sprint challenges, fine art installations, multimedia storytelling, and digital craft.",
    color: "#ec4899",
    defaultRatioX: 0.85,
    keyword: "CREATIVE AESTHETICS",
    image: "/panache-runway.png",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 02 — THE FOUR PILLARS OF SABRANG (The Core Spectrums)
// ─────────────────────────────────────────────────────────────────────────────
export function CoreSpectrumsSection() {
  const [activePillarId, setActivePillarId] = useState<string | null>(null);

  return (
    <section
      id="four-pillars"
      className="relative w-full py-20 sm:py-28 px-6 sm:px-12 md:px-20 bg-[#030206] text-white overflow-hidden select-none border-b border-white/10"
    >
      {/* Subtle ambient multi-color backdrop gradient */}
      <div className="pointer-events-none absolute inset-0 opacity-20" aria-hidden>
        <div
          className="absolute top-1/3 left-1/4 w-[45vw] h-[45vw] max-w-[500px] max-h-[500px] rounded-full blur-[160px]"
          style={{ background: "radial-gradient(circle, rgba(34,211,238,0.25) 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-[45vw] h-[45vw] max-w-[500px] max-h-[500px] rounded-full blur-[160px]"
          style={{ background: "radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)" }}
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
            Four distinct forces emerging from the same unified core. Hover or tap to explore each dimension.
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

                <div className="pt-2">

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
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BESPOKE EDITORIAL OP METRICS DATA (VERIFIED CONTENT SPECIFICATION)
// ─────────────────────────────────────────────────────────────────────────────
const OP_SPECS = [
  {
    num: "01",
    stat: "50–60+",
    keyword: "COLLEGES NATIONALLY",
    accent: "#22d3ee",
    role: "National Turnout",
    details: "Over 2,000+ registered delegates and university teams from 50–60+ colleges across India descending on Jaipur for 3 days of multi-disciplinary rivalry.",
    tags: ["50–60+ COLLEGES", "2,000+ DELEGATES", "3 DAYS DURATION"],
  },
  {
    num: "02",
    stat: "₹3,00,000+",
    keyword: "VERIFIED CASH POOL",
    accent: "#a855f7",
    role: "Championship Bounty",
    details: "Direct cash rewards, certified trophies, and national championship titles contested across marquee technical, cultural, management, and design arenas.",
    tags: ["₹3,00,000+ POOL", "VERIFIED BOUNTY", "OFFICIAL MEMENTOS"],
  },
  {
    num: "03",
    stat: "4-IN-1",
    keyword: "CROSS-DOMAIN FEST",
    accent: "#f59e0b",
    role: "Techno · Cultural · Management · Design",
    details: "A rare national convergence of 4 pillars under one festival: from Panache fashion runway and Band Jam to AI coding duels, VerseVaad, and Seal the Deal.",
    tags: ["PANACHE RUNWAY", "BAND JAM", "TECH HACKATHON", "VERSEVAAD"],
  },
  {
    num: "04",
    stat: "SINCE 2011",
    keyword: "HEROIC 15-YR LEGACY",
    accent: "#ec4899",
    role: "Headliners & Pro-Nites",
    details: "15 editions of pioneering campus culture at JKLU, celebrated with headlining live celebrity concerts, high-energy DJ nights, and open-air acoustic Sufi performances.",
    tags: ["RUNNING SINCE 2011", "LIVE CONCERTS", "DJ NIGHTS", "SUFI ACOUSTICS"],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CONTENT SECTIONS: OP STATS, BEYOND COMPETITIONS, AND FINAL RECOMBINATION
// ─────────────────────────────────────────────────────────────────────────────
export function AboutContentSections() {
  const [activeSpecIndex, setActiveSpecIndex] = useState<number>(0);

  const activeSpec = OP_SPECS[activeSpecIndex];

  return (
    <div className="relative w-full bg-[#030206] text-white selection:bg-purple-500 selection:text-white overflow-hidden">
      {/* ───────────────────────────────────────────────────────────────── */}
      {/* SECTION 04 — WHY IS SABRANG OP? (BESPOKE EDITORIAL CONSOLE)      */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <section
        id="why-sabrang-op"
        className="relative w-full py-28 px-6 sm:px-12 md:px-20 bg-[#030206] border-t border-white/10 overflow-hidden select-none"
      >
        {/* Prismatic ambient light shafts */}
        <div className="pointer-events-none absolute inset-0 opacity-25" aria-hidden>
          <div
            className="absolute top-1/3 left-1/4 w-[55vw] h-[55vw] max-w-[650px] max-h-[650px] rounded-full blur-[170px]"
            style={{ background: `radial-gradient(circle, ${activeSpec.accent}30 0%, transparent 70%)`, transition: "background 0.6s ease" }}
          />
          <div
            className="absolute bottom-1/4 right-1/4 w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full blur-[170px]"
            style={{ background: "radial-gradient(circle, rgba(168,85,247,0.18) 0%, transparent 70%)" }}
          />
        </div>

        <div className="max-w-6xl mx-auto space-y-16 relative z-10">
          {/* Editorial Section Header with Live Status Ticker */}
          <div className="space-y-4 max-w-3xl">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-[11px] font-mono uppercase tracking-[0.35em] text-cyan-400">
                04 // SCALE, IMPACT &amp; PULSE
              </span>
            </div>
            <h2
              className="text-4xl sm:text-6xl md:text-7xl font-black uppercase text-white tracking-tight leading-none"
              style={{
                fontFamily: '"Syne", "Outfit", "Inter", sans-serif',
                fontWeight: 850,
                textShadow: "0 0 30px rgba(255,255,255,0.7), 0 0 60px rgba(34,211,238,0.4)",
              }}
            >
              The Sabrang <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">Phenomenon</span>
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm font-light max-w-xl leading-relaxed pt-1">
              A 3-day techno-cultural-management-design immersion at JK Lakshmipat University — uniting national talent, high stakes, and unforgettable pro-nites.
            </p>
          </div>

          {/* Bespoke Editorial Spectrum Console (Interactive Split-Flap Ribbon System) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-4">
            {/* LEFT COLUMN: Interactive Spec Selector Tabs */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
              {OP_SPECS.map((spec, idx) => {
                const isSelected = activeSpecIndex === idx;
                return (
                  <button
                    key={spec.num}
                    onClick={() => setActiveSpecIndex(idx)}
                    onMouseEnter={() => setActiveSpecIndex(idx)}
                    className={`group relative text-left p-5 rounded-2xl border transition-all duration-400 overflow-hidden ${
                      isSelected
                        ? "bg-white/[0.08] border-white/40 shadow-2xl translate-x-2"
                        : "bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]"
                    }`}
                    style={{
                      boxShadow: isSelected ? `0 10px 30px ${spec.accent}20` : "none",
                    }}
                  >
                    {/* Left active colored laser bar */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300"
                      style={{
                        background: spec.accent,
                        opacity: isSelected ? 1 : 0.2,
                        boxShadow: isSelected ? `0 0 14px ${spec.accent}` : "none",
                      }}
                    />

                    <div className="flex items-center justify-between pl-3">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-slate-400 block mb-1">
                          {spec.role}
                        </span>
                        <h4
                          className="text-lg sm:text-xl font-bold uppercase text-white tracking-tight"
                          style={{ fontFamily: '"Syne", sans-serif' }}
                        >
                          {spec.keyword}
                        </h4>
                      </div>

                      <span
                        className="text-2xl sm:text-3xl font-black font-mono tracking-tight transition-all duration-300"
                        style={{
                          color: isSelected ? spec.accent : "rgba(255,255,255,0.4)",
                          textShadow: isSelected ? `0 0 18px ${spec.accent}` : "none",
                        }}
                      >
                        {spec.stat}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* RIGHT COLUMN: Cinematic Holographic Showcase Plaque */}
            <div className="lg:col-span-7 relative min-h-[420px] rounded-3xl border border-white/20 p-8 sm:p-12 flex flex-col justify-between overflow-hidden backdrop-blur-3xl bg-gradient-to-br from-white/[0.08] via-white/[0.02] to-transparent shadow-2xl">
              {/* Dynamic Laser Grid Wireframe & Vignette */}
              <div
                className="absolute inset-0 pointer-events-none opacity-30 transition-all duration-700"
                style={{
                  background: `radial-gradient(ellipse at 85% 15%, ${activeSpec.accent}40 0%, transparent 65%)`,
                }}
              />

              {/* Plaque Header: Clean minimal status */}
              <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-5">
                <span
                  className="text-xs font-mono font-bold uppercase tracking-widest block"
                  style={{ color: activeSpec.accent }}
                >
                  {activeSpec.keyword}
                </span>

                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full animate-ping"
                    style={{ background: activeSpec.accent }}
                  />
                  <span
                    className="text-[10px] font-mono uppercase tracking-widest px-3 py-1 rounded-full border"
                    style={{
                      borderColor: `${activeSpec.accent}50`,
                      color: activeSpec.accent,
                      background: `${activeSpec.accent}15`,
                    }}
                  >
                    {activeSpec.role}
                  </span>
                </div>
              </div>

              {/* Plaque Body: Giant Glowing Typography */}
              <div className="relative z-10 py-6 space-y-4">
                <span
                  className="text-6xl sm:text-7xl md:text-8xl font-black font-mono tracking-tighter block leading-none"
                  style={{
                    color: "#ffffff",
                    textShadow: `0 0 40px ${activeSpec.accent}, 0 0 80px ${activeSpec.accent}60`,
                  }}
                >
                  {activeSpec.stat}
                </span>

                <h3
                  className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight"
                  style={{ fontFamily: '"Syne", sans-serif' }}
                >
                  {activeSpec.keyword}
                </h3>

                <p className="text-slate-300 text-sm sm:text-base font-light leading-relaxed max-w-lg">
                  {activeSpec.details}
                </p>
              </div>

              {/* Plaque Footer: Feature Pill Badges */}
              <div className="relative z-10 pt-6 border-t border-white/10 flex flex-wrap gap-2.5">
                {activeSpec.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-mono uppercase tracking-wider px-3.5 py-1.5 rounded-full border bg-white/[0.04] transition-all duration-300 hover:border-white/40"
                    style={{
                      borderColor: `${activeSpec.accent}40`,
                      color: "#ffffff",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* SECTION 05 — BEYOND THE COMPETITIONS (Space Between Wavelengths)  */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <section className="relative w-full py-28 px-6 sm:px-12 md:px-20 bg-[#030206]/75 backdrop-blur-sm border-t border-white/10 overflow-hidden">
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

export default function AboutSections() {
  return (
    <>
      <CoreSpectrumsSection />
      <AboutContentSections />
    </>
  );
}
