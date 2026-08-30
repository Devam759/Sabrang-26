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
    name: "LITERARY & ARTS",
    subtitle: "Creative Expression",
    description: "Poetry slams, creative writing, debate championships, and live art exhibitions.",
    color: "#22d3ee",
    defaultRatioX: 0.15,
    keyword: "CREATIVE EXPRESSION",
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060186/sabrang-2026/about/versevaad.jpg",
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
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060179/sabrang-2026/about/dance-battle.png",
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
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060184/sabrang-2026/about/sabrang-live.png",
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
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060183/sabrang-2026/about/panache-runway.png",
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
      className="relative w-full py-20 sm:py-28 px-6 sm:px-12 md:px-20 bg-[#030206]/70 backdrop-blur-[2px] text-white overflow-hidden select-none border-b border-white/10"
    >
      {/* Subtle ambient multi-color backdrop gradient */}
      <div className="pointer-events-none absolute inset-0 opacity-20" aria-hidden>
        <div
          className="absolute top-1/3 left-1/4 w-[45vw] h-[45vw] max-w-[500px] max-h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(34,211,238,0.25) 0%, rgba(34,211,238,0.06) 45%, transparent 70%)" }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-[45vw] h-[45vw] max-w-[500px] max-h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(236,72,153,0.2) 0%, rgba(236,72,153,0.05) 45%, transparent 70%)" }}
        />
      </div>

      <div className="max-w-6xl mx-auto space-y-12 relative z-10">
        {/* Section Heading */}
        <div className="space-y-4 max-w-2xl">
          <h2
            className="text-4xl sm:text-6xl font-black uppercase text-white tracking-tight leading-none"
            style={{
              fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif',
              fontWeight: 850,
              color: "#ffffff",
              textShadow:
                "0 0 24px rgba(255, 255, 255, 0.85), 0 0 45px rgba(56, 189, 248, 0.6), 0 4px 20px rgba(0,0,0,0.9)",
            }}
          >
            The Core Spectrums
          </h2>
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
                    ? "bg-gradient-to-b from-white/[0.09] to-white/[0.02] -translate-y-3"
                    : "bg-gradient-to-b from-white/[0.04] to-white/[0.01] hover:-translate-y-1.5"
                }`}
                style={{
                  borderColor: isActive ? `${p.color}55` : "rgba(255,255,255,0.1)",
                  boxShadow: isActive
                    ? `0 20px 45px ${p.color}25, 0 0 35px ${p.color}18, inset 0 1px 0 rgba(255,255,255,0.25)`
                    : "0 10px 30px rgba(0,0,0,0.5)",
                }}
              >
                {/* Ambient Internal Glow Aura */}
                <div
                  className="absolute -top-16 -left-16 w-44 h-44 rounded-full pointer-events-none transition-opacity duration-500 blur-3xl"
                  style={{
                    background: p.color,
                    opacity: isActive ? 0.22 : 0,
                  }}
                />

                {/* Monolith Background Photo */}
                {p.image && (
                  <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none rounded-2xl">
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      className="object-cover opacity-25 group-hover:opacity-45 scale-105 group-hover:scale-110 transition-all duration-700 mix-blend-luminosity"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#030206] via-[#030206]/80 to-transparent" />
                  </div>
                )}

                {/* Top Ambient Wavelength Light Bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] transition-all duration-500 rounded-t-2xl"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, ${p.color} 25%, ${p.color} 75%, transparent 100%)`,
                    opacity: isActive ? 1 : 0.7,
                    boxShadow: isActive
                      ? `0 0 18px ${p.color}, 0 0 32px ${p.color}90`
                      : `0 0 10px ${p.color}60`,
                  }}
                />

                <div className="pt-2">

                  {/* Pillar Title */}
                  <h3
                    className="text-xl sm:text-2xl font-bold uppercase text-white tracking-tight leading-snug mb-3 relative z-10"
                    style={{ fontFamily: '"Syne", sans-serif' }}
                  >
                    {p.name}
                  </h3>

                  {/* Pillar Description */}
                  <p className="text-slate-300/85 text-xs font-light leading-relaxed relative z-10">
                    {p.description}
                  </p>
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
    stat: "50-60+",
    keyword: "COLLEGES NATIONALLY",
    accent: "#22d3ee",
    role: "National Turnout",
    details: "Over 2,000+ registered delegates and university teams from 50-60+ colleges across India descending on Jaipur for 3 days of multi-disciplinary rivalry.",
    tags: ["50-60+ COLLEGES", "2,000+ DELEGATES", "3 DAYS DURATION"],
  },
  {
    num: "02",
    stat: "₹3,00,000+",
    keyword: "VERIFIED CASH POOL",
    accent: "#a855f7",
    role: "Championship Bounty",
    details: "Direct cash rewards, certified trophies, and national championship titles contested across marquee cultural, management, and design arenas.",
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
  const [activeExpIdx, setActiveExpIdx] = useState<number | null>(null);

  const activeSpec = OP_SPECS[activeSpecIndex];

  return (
    <div className="relative w-full bg-transparent text-white selection:bg-purple-500 selection:text-white overflow-hidden">


      {/* ───────────────────────────────────────────────────────────────── */}
      {/* SECTION 05 — BEYOND THE COMPETITIONS (Space Between Wavelengths)  */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <section className="relative w-full py-24 sm:py-32 px-6 sm:px-12 md:px-20 bg-black/40 backdrop-blur-[2px] border-t border-white/10 overflow-hidden select-none">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div
            className="absolute top-10 left-10 w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] opacity-25"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(168,85,247,0.2) 0%, rgba(168,85,247,0.05) 45%, transparent 70%)",
            }}
          />
          <div
            className="absolute bottom-10 right-10 w-[55vw] h-[55vw] max-w-[650px] max-h-[650px] opacity-20"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(6,182,212,0.18) 0%, rgba(6,182,212,0.04) 45%, transparent 70%)",
            }}
          />
        </div>

        <div className="max-w-6xl mx-auto space-y-12 relative z-10">
          <div className="space-y-4 max-w-2xl">
            <h2
              className="text-4xl sm:text-6xl font-black uppercase text-white tracking-tight leading-none"
              style={{
                fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif',
                fontWeight: 850,
                color: "#ffffff",
                textShadow:
                  "0 0 24px rgba(255, 255, 255, 0.85), 0 0 45px rgba(56, 189, 248, 0.6), 0 4px 20px rgba(0,0,0,0.9)",
              }}
            >
              Beyond Competitions
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            {[
              {
                category: "After-Dark Energy",
                title: "DJ Nights & Mainstage Concerts",
                description:
                  "High-octane EDM basslines, laser visual installations, and open-floor dancing till midnight every single day.",
                color: "#a855f7",
                image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060359/sabrang-2026/menu-scroll-covers/sabrang-live.png",
              },
              {
                category: "Interactive Zone",
                title: "Esports & Mini Games Arena",
                description:
                  "Casual arcade corners, console gaming duels, VR setups, and pop-up challenge booths scattered across campus.",
                color: "#22d3ee",
                image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060186/sabrang-2026/about/versevaad.jpg",
              },
              {
                category: "Spontaneous Culture",
                title: "Pre-Sabrang Flashmobs & Pop-ups",
                description:
                  "Acoustic jam circles, spontaneous street dance pop-ups, food carnivals, and neon photo installations.",
                color: "#ec4899",
                image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060179/sabrang-2026/about/dance-battle.png",
              },
            ].map((item, idx) => {
              const isExpActive = activeExpIdx === idx;
              return (
                <div
                  key={idx}
                  onMouseEnter={() => setActiveExpIdx(idx)}
                  onMouseLeave={() => setActiveExpIdx(null)}
                  className={`group relative min-h-[300px] flex flex-col justify-between p-7 rounded-2xl border transition-all duration-500 hover:-translate-y-2 overflow-hidden cursor-pointer backdrop-blur-2xl ${
                    isExpActive
                      ? "bg-gradient-to-b from-white/[0.09] to-white/[0.02]"
                      : "bg-gradient-to-b from-white/[0.06] to-white/[0.01]"
                  }`}
                  style={{
                    borderColor: isExpActive ? `${item.color}55` : "rgba(255,255,255,0.1)",
                    boxShadow: isExpActive
                      ? `0 20px 45px ${item.color}25, 0 0 35px ${item.color}18, inset 0 1px 0 rgba(255,255,255,0.25)`
                      : "0 10px 30px rgba(0,0,0,0.5)",
                  }}
                >
                  {/* Ambient Internal Glow Aura */}
                  <div
                    className="absolute -top-16 -left-16 w-44 h-44 rounded-full pointer-events-none transition-opacity duration-500 blur-3xl"
                    style={{
                      background: item.color,
                      opacity: isExpActive ? 0.22 : 0,
                    }}
                  />

                  {/* Background Photo with Luminosity */}
                  {item.image && (
                    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none rounded-2xl">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover opacity-20 group-hover:opacity-40 scale-105 group-hover:scale-110 transition-all duration-700 mix-blend-luminosity"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#030206] via-[#030206]/85 to-transparent" />
                    </div>
                  )}

                  {/* Top Ambient Wavelength Light Bar */}
                  <div
                    className="absolute top-0 left-0 right-0 h-[2px] transition-all duration-500 rounded-t-2xl"
                    style={{
                      background: `linear-gradient(90deg, transparent 0%, ${item.color} 25%, ${item.color} 75%, transparent 100%)`,
                      opacity: isExpActive ? 1 : 0.7,
                      boxShadow: isExpActive
                        ? `0 0 18px ${item.color}, 0 0 32px ${item.color}90`
                        : `0 0 10px ${item.color}60`,
                    }}
                  />

                <div className="pt-2 relative z-10">
                  <h3
                    className="text-xl sm:text-2xl font-bold uppercase text-white tracking-tight leading-snug mb-3"
                    style={{ fontFamily: '"Syne", sans-serif' }}
                  >
                    {item.title}
                  </h3>

                  <p className="text-slate-300/85 text-xs font-light leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
              );
            })}
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
