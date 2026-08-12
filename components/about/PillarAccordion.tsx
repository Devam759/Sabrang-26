"use client";

/**
 * PillarAccordion — Sabrang Core Events Accordion Showcase
 *
 * 6 Core Events:
 *   1. PANACHE (/panache-runway.png)
 *   2. VERSEVAAD (/versevaad.jpg)
 *   3. ECHOS OF NOOR (/echos-of-noor.png)
 *   4. BAND JAM (/gallery/DSC_0192.webp)
 *   5. DANCE BATTLE (/gallery/121A0094.webp)
 *   6. STEP UP (/gallery/DSC02686.webp)
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
  ambientGlow: string;
  activeBorder: string;
  accentText: string;
  btnGradient: string;
  image: string;
  eventsCount: string;
  highlights: string[];
}

const PILLARS: PillarItem[] = [
  {
    id: "01",
    title: "PANACHE",
    category: "Fashion & High Art",
    desc: "The signature haute couture runway where fashion design meets theatrical choreography and fierce personal expression on a grand national stage.",
    gradient: "from-cyan-300 via-sky-300 to-indigo-300",
    ambientGlow: "rgba(103, 232, 249, 0.16)",
    activeBorder: "border-cyan-300/50 shadow-cyan-400/20 ring-cyan-300/20",
    accentText: "text-cyan-200",
    btnGradient:
      "from-cyan-500/80 via-sky-500/80 to-blue-600/80 shadow-cyan-500/20",
    image: "/panache-runway.png",
    eventsCount: "12+ Runway Events",
    highlights: [
      "◆ Haute Couture Runway",
      "✦ Theatrical Styling",
      "✧ Model Portfolios",
    ],
  },
  {
    id: "02",
    title: "VERSEVAAD",
    category: "Literary Debates & Slam",
    desc: "An intense arena of spoken word, poetic rap battles, fierce literary debates, and high-impact verbal expression.",
    gradient: "from-amber-200 via-yellow-300 to-orange-300",
    ambientGlow: "rgba(253, 224, 71, 0.16)",
    activeBorder: "border-amber-300/50 shadow-amber-400/20 ring-amber-300/20",
    accentText: "text-amber-200",
    btnGradient:
      "from-amber-500/80 via-yellow-500/80 to-orange-500/80 shadow-amber-500/20",
    image: "/versevaad.jpg",
    eventsCount: "10+ Literary Stages",
    highlights: [
      "🎤 Spoken Word Slam",
      "⚡ Parliamentary Debate",
      "📜 Slam Poetry",
    ],
  },
  {
    id: "03",
    title: "ECHOS OF NOOR",
    category: "Sufi Night & Acoustics",
    desc: "Mesmerizing Sufi melodies, divine unplugged acoustics, and soul-stirring live musical performances illuminated under the stars.",
    gradient: "from-purple-300 via-violet-300 to-pink-300",
    ambientGlow: "rgba(216, 180, 254, 0.16)",
    activeBorder:
      "border-purple-300/50 shadow-purple-400/20 ring-purple-300/20",
    accentText: "text-purple-200",
    btnGradient:
      "from-purple-500/80 via-violet-500/80 to-pink-500/80 shadow-purple-500/20",
    image: "/echos-of-noor.png",
    eventsCount: "Soulful Live Night",
    highlights: [
      "✦ Sufi & Classical Night",
      "♬ Acoustic Unplugged",
      "✨ Candlelight Melodies",
    ],
  },
  {
    id: "04",
    title: "BAND JAM",
    category: "Battle of the Bands & Rock",
    desc: "Pure sonic warfare under the open sky — head-to-head rock battles, roaring drum solos, electric guitar riffs, and explosive band performances.",
    gradient: "from-fuchsia-300 via-pink-300 to-purple-300",
    ambientGlow: "rgba(244, 114, 182, 0.16)",
    activeBorder:
      "border-fuchsia-300/50 shadow-fuchsia-400/20 ring-fuchsia-300/20",
    accentText: "text-fuchsia-200",
    btnGradient:
      "from-fuchsia-500/80 via-pink-500/80 to-purple-500/80 shadow-fuchsia-500/20",
    image: "/events_posters/BANDJAM.webp",
    eventsCount: "Battle of the Bands",
    highlights: [
      "⚡ Rock Battle Royale",
      "🎸 High Octane Riffs",
      "🥁 Live Open Air Stage",
    ],
  },
  {
    id: "05",
    title: "DANCE BATTLES",
    category: "Solo & Street Dance Showcase",
    desc: "High-octane solo and duo street dance battles featuring hip-hop, popping, locking, and freestyle dance showdowns.",
    gradient: "from-rose-300 via-pink-300 to-red-300",
    ambientGlow: "rgba(253, 164, 175, 0.16)",
    activeBorder: "border-rose-300/50 shadow-rose-400/20 ring-rose-300/20",
    accentText: "text-rose-200",
    btnGradient:
      "from-rose-500/80 via-pink-500/80 to-red-500/80 shadow-rose-500/20",
    image: "/dance-battle.png",
    eventsCount: "8+ Dance Battles",
    highlights: [
      "💃 Hip-Hop & Street Dance",
      "⚡ Solo & Group Battles",
      "🔥 High Energy Drops",
    ],
  },
  {
    id: "06",
    title: "STEP UP",
    category: "Group Choreography Showdown",
    desc: "Flawless synchronized group dance battles featuring power-packed choreography, thematic storytelling, and explosive energy.",
    gradient: "from-emerald-300 via-teal-300 to-cyan-300",
    ambientGlow: "rgba(110, 231, 183, 0.16)",
    activeBorder:
      "border-emerald-300/50 shadow-emerald-400/20 ring-emerald-300/20",
    accentText: "text-emerald-200",
    btnGradient:
      "from-emerald-500/80 via-teal-500/80 to-cyan-500/80 shadow-emerald-500/20",
    image: "/step-up.jpg",
    eventsCount: "Choreo Showdown",
    highlights: [
      "✨ Flawless Group Choreo",
      "✦ Tactical Dance Battles",
      "🏆 National Trophy",
    ],
  },
];

export default function PillarAccordion() {
  const containerRef = useRef<HTMLDivElement>(null);
  const panelsRef = useRef<HTMLDivElement>(null);

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const isHoveredRef = useRef<boolean>(false);

  // Entrance Animation via GSAP ScrollTrigger
  useEffect(() => {
    const panels = panelsRef.current;
    if (!panels) return;

    const ctx = gsap.context(() => {
      const cardEls = panels.querySelectorAll(".accordion-panel");
      gsap.fromTo(
        cardEls,
        {
          y: 60,
          opacity: 0,
          scale: 0.92,
          rotateY: 10,
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          rotateY: 0,
          stagger: 0.1,
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: panels,
            start: "top 82%",
          },
        },
      );
    }, panels);

    return () => ctx.revert();
  }, []);

  // Smooth Auto-Advance Slideshow (Pauses when user hovers)
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isHoveredRef.current) {
        setActiveIndex((prev) => (prev + 1) % PILLARS.length);
      }
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  // Interactive Mouse 3D Gyro Tilt Effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPercent = (x / rect.width - 0.5) * 2; // -1 to 1
    const yPercent = (y / rect.height - 0.5) * 2; // -1 to 1

    gsap.to(card, {
      rotateY: xPercent * 5,
      rotateX: -yPercent * 4,
      duration: 0.4,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    isHoveredRef.current = false;
    gsap.to(e.currentTarget, {
      rotateY: 0,
      rotateX: 0,
      duration: 0.6,
      ease: "power2.out",
    });
  };

  const activePillar = PILLARS[activeIndex] ?? PILLARS[0];

  return (
    <section ref={containerRef} className="relative w-full space-y-6 py-2 my-0">
      {/* Dynamic Ambient Background Lighting Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[480px] rounded-full blur-[190px] pointer-events-none transition-all duration-1000"
        style={{
          background: activePillar.ambientGlow,
        }}
      />

      {/* Section Header */}
      <div className="relative z-20 text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2.5 text-purple-300 text-xs font-mono tracking-widest uppercase bg-purple-500/10 px-3.5 py-1.5 rounded-full border border-purple-500/20 shadow-lg shadow-purple-500/10">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
          <span>CINEMATIC SHOWCASE • FLAGSHIP EVENTS</span>
        </div>

        <h3
          className="text-3xl sm:text-5xl font-black uppercase text-white tracking-tight"
          style={{ fontFamily: '"Syne", "Outfit", "Inter", sans-serif' }}
        >
          The Heart & Soul of Sabrang
        </h3>

        <p className="text-slate-400 text-xs sm:text-sm font-light max-w-lg mx-auto">
          Explore the 6 flagship events crafted to celebrate every dimension of
          youth, sound, fashion, and art.
        </p>
      </div>

      {/* Accordion Container */}
      <div
        ref={panelsRef}
        onMouseEnter={() => {
          isHoveredRef.current = true;
        }}
        onMouseLeave={() => {
          isHoveredRef.current = false;
        }}
        className="relative z-10 w-full min-h-[580px] sm:h-[600px] flex flex-col md:flex-row gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-3xl bg-black/80 border border-white/10 backdrop-blur-2xl shadow-2xl overflow-hidden"
        style={{ perspective: "1400px" }}
      >
        {PILLARS.map((pillar, i) => {
          const isActive = i === activeIndex;

          return (
            <div
              key={pillar.id}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => setActiveIndex(i)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className={`accordion-panel relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col justify-between p-5 sm:p-7 ${
                isActive
                  ? `flex-[3.5] border shadow-2xl ring-1 ${pillar.activeBorder}`
                  : "flex-1 border border-white/10 opacity-70 hover:opacity-100 hover:border-white/30"
              }`}
              style={{
                transformStyle: "preserve-3d",
                willChange: "transform, flex-grow",
              }}
            >
              {/* Background Photo */}
              <Image
                src={pillar.image}
                alt={pillar.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                quality={85}
                className={`object-cover transition-transform duration-1000 ease-out ${
                  isActive
                    ? "scale-108 filter brightness-95"
                    : "scale-100 filter brightness-45"
                }`}
                priority={i < 5}
              />

              {/* Gradient Dark Overlay */}
              <div
                className={`absolute inset-0 transition-opacity duration-700 ${
                  isActive
                    ? "bg-gradient-to-t from-black via-black/60 to-black/20"
                    : "bg-gradient-to-t from-black/95 via-black/75 to-black/50"
                }`}
              />

              {/* Accent Top Glow Sweep Line */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 opacity-70 bg-gradient-to-r ${pillar.gradient} z-20`}
              />

              {/* Micro Film Grain Texture */}
              <div
                className="absolute inset-0 opacity-15 pointer-events-none mix-blend-overlay z-10"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                }}
              />

              {/* Expanded State Content */}
              {isActive ? (
                <div className="relative z-20 h-full flex flex-col justify-between space-y-6 animate-fadeIn">
                  {/* Top Bar Badges */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`text-xs font-mono px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/15 shadow-md ${pillar.accentText}`}
                      >
                        {pillar.category}
                      </span>
                      <span
                        className={`text-xs font-mono px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-md ${pillar.accentText}`}
                      >
                        {pillar.eventsCount}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Text & Interactive Actions */}
                  <div className="space-y-4 max-w-xl">
                    <h4
                      className="-ml-3 sm:-ml-4.5 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight leading-[0.92] drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)] select-none break-normal [word-break:keep-all] max-w-[98%]"
                      style={{
                        fontFamily: '"Syne", "Outfit", "Inter", sans-serif',
                      }}
                    >
                      {pillar.title}
                    </h4>

                    <p className="-ml-3 sm:-ml-4.5 text-sm sm:text-base md:text-lg leading-relaxed font-light text-slate-200 drop-shadow-md">
                      {pillar.desc}
                    </p>

                    {/* Highlights pill tags */}
                    <div className="-ml-3 sm:-ml-4.5 flex flex-wrap gap-2 pt-1">
                      {pillar.highlights.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="text-xs sm:text-sm font-mono px-3.5 py-1.5 rounded-lg bg-white/10 backdrop-blur-md text-slate-200 border border-white/15 shadow-sm"
                        >
                          ✓ {tag}
                        </span>
                      ))}
                    </div>

                    <div className="-ml-3 sm:-ml-4.5 pt-2">
                      <Link
                        href="/events"
                        className={`inline-flex items-center space-x-2.5 px-6 py-3 rounded-xl bg-gradient-to-r ${pillar.btnGradient} text-white font-bold text-xs sm:text-sm font-mono uppercase tracking-widest transition-all hover:scale-[1.02]`}
                      >
                        <span>EXPLORE {pillar.title}</span>
                        <svg
                          className="w-4 h-4"
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
              ) : (
                /* Collapsed State Preview */
                <div className="relative z-20 h-full flex flex-row md:flex-col justify-between items-center md:items-start transition-all duration-500">
                  {/* Vertical title for desktop collapsed bar */}
                  <div className="hidden md:block my-auto transform -rotate-90 origin-left text-xl sm:text-2xl font-black uppercase text-white/80 tracking-widest whitespace-nowrap">
                    {pillar.title}
                  </div>

                  {/* Horizontal title for mobile collapsed bar */}
                  <div className="block md:hidden text-base sm:text-lg font-black uppercase text-white/90 tracking-wider">
                    {pillar.title}
                  </div>

                  <span
                    className={`text-sm sm:text-base font-mono font-bold ${pillar.accentText}`}
                  >
                    0{i + 1}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
