'use client';

/**
 * PillarAccordion — Sabrang About Page Ultra-Cinematic Expandable Accordion
 *
 * Renders the 4 Core Pillars of Sabrang (Panache, Pronites, Battlegrounds, Cultural Arts)
 * with high-end cinematic micro-animations, 3D gyro tilt, ambient color glows,
 * smooth auto-rotation slideshow, and instant hover/click expansion.
 */

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export interface PillarItem {
  id: string;
  title: string;
  category: string;
  desc: string;
  gradient: string;
  ambientGlow: string;
  image: string;
  eventsCount: string;
  highlights: string[];
}

const PILLARS: PillarItem[] = [
  {
    id: '01',
    title: 'PANACHE',
    category: 'Fashion & High Art',
    desc: 'The signature haute couture runway where fashion design meets theatrical choreography on a grand national stage.',
    gradient: 'from-cyan-400 via-sky-500 to-indigo-600',
    ambientGlow: 'rgba(56, 189, 248, 0.22)',
    image: '/gallery/121A0025.webp',
    eventsCount: '12+ Runway Events',
    highlights: ['Haute Couture Runway', 'Theatrical Design', 'Model Portfolios'],
  },
  {
    id: '02',
    title: 'PRONITES',
    category: 'Live Concerts & Star Nights',
    desc: 'Electrifying live performances featuring headlining artists, acoustic unplugged stages, and high-energy DJ drops.',
    gradient: 'from-indigo-500 via-purple-500 to-pink-600',
    ambientGlow: 'rgba(129, 140, 248, 0.22)',
    image: '/gallery/DSC09000.webp',
    eventsCount: '3 Pro-Show Nights',
    highlights: ['Celebrity Concerts', 'EDM Night', 'Acoustic Unplugged'],
  },
  {
    id: '03',
    title: 'BATTLEGROUNDS',
    category: 'E-Sports & Tech Arenas',
    desc: 'High-stakes gaming tournaments, hackathons, and technical showdowns for top-tier competitive minds.',
    gradient: 'from-purple-500 via-pink-500 to-rose-600',
    ambientGlow: 'rgba(192, 132, 252, 0.22)',
    image: '/gallery/121A0057.webp',
    eventsCount: '18+ Tech Arenas',
    highlights: ['Valorant & BGMI LAN', '24H Hackathon', 'RoboWars'],
  },
  {
    id: '04',
    title: 'CULTURAL ARTS',
    category: 'Dance, Drama & Music',
    desc: 'Battle of the bands, street theater (Nukkad Natak), choreography showdowns, and fine arts showcases.',
    gradient: 'from-pink-500 via-rose-500 to-amber-500',
    ambientGlow: 'rgba(251, 113, 133, 0.22)',
    image: '/gallery/DSC_0192.webp',
    eventsCount: '20+ Cultural Stages',
    highlights: ['Battle of the Bands', 'Nukkad Natak', 'Western Choreo'],
  },
];

export default function PillarAccordion() {
  const containerRef = useRef<HTMLDivElement>(null);
  const panelsRef    = useRef<HTMLDivElement>(null);

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const isHoveredRef = useRef<boolean>(false);

  // 1. Entrance Animation via GSAP ScrollTrigger
  useEffect(() => {
    const panels = panelsRef.current;
    if (!panels) return;

    const ctx = gsap.context(() => {
      const cardEls = panels.querySelectorAll('.accordion-panel');
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
          stagger: 0.12,
          duration: 1.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: panels,
            start: 'top 82%',
          },
        }
      );
    }, panels);

    return () => ctx.revert();
  }, []);

  // 2. Smooth Auto-Advance Slideshow (Pauses when user hovers)
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isHoveredRef.current) {
        setActiveIndex((prev) => (prev + 1) % PILLARS.length);
      }
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  // 3. Interactive Mouse 3D Gyro Tilt Effect
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
      ease: 'power2.out',
    });
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    isHoveredRef.current = false;
    gsap.to(e.currentTarget, {
      rotateY: 0,
      rotateX: 0,
      duration: 0.6,
      ease: 'power2.out',
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
        <div className="inline-flex items-center space-x-2.5 text-cyan-400 text-xs font-mono tracking-widest uppercase bg-cyan-500/10 px-3.5 py-1.5 rounded-full border border-cyan-500/20 shadow-lg shadow-cyan-500/10">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>CINEMATIC SHOWCASE • CORE PILLARS</span>
        </div>

        <h3
          className="text-3xl sm:text-5xl font-black uppercase text-white tracking-tight"
          style={{ fontFamily: '"Syne", "Outfit", "Inter", sans-serif' }}
        >
          The Pillars of Sabrang
        </h3>

        <p className="text-slate-400 text-xs sm:text-sm font-light max-w-lg mx-auto">
          Explore the four core realms crafted to celebrate every dimension of youth, innovation, and art.
        </p>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════
          ULTRA-CINEMATIC ACCORDION CONTAINER
      ═════════════════════════════════════════════════════════════════════ */}
      <div
        ref={panelsRef}
        onMouseEnter={() => { isHoveredRef.current = true; }}
        onMouseLeave={() => { isHoveredRef.current = false; }}
        className="relative z-10 w-full h-[520px] sm:h-[600px] flex flex-col md:flex-row gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-3xl bg-slate-950/80 border border-white/10 backdrop-blur-2xl shadow-2xl overflow-hidden"
        style={{
          perspective: '1400px',
        }}
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
              className={`accordion-panel relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col justify-between p-6 sm:p-8 ${
                isActive
                  ? 'flex-[3.8] border border-cyan-400/70 shadow-2xl shadow-cyan-500/25 ring-1 ring-cyan-400/30'
                  : 'flex-1 border border-white/10 opacity-70 hover:opacity-100 hover:border-white/30'
              }`}
              style={{
                transformStyle: 'preserve-3d',
                willChange: 'transform, flex-grow',
              }}
            >
              {/* Background Photo with Parallax Camera Zoom */}
              <Image
                src={pillar.image}
                alt={pillar.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                quality={75}
                className={`object-cover transition-transform duration-1000 ease-out ${
                  isActive ? 'scale-108 filter brightness-95' : 'scale-100 filter brightness-45'
                }`}
              />

              {/* Gradient Dark Overlay */}
              <div
                className={`absolute inset-0 transition-opacity duration-700 ${
                  isActive
                    ? 'bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/20'
                    : 'bg-gradient-to-t from-slate-950/95 via-slate-950/75 to-slate-950/50'
                }`}
              />

              {/* Accent Top Glow Sweep Line */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${pillar.gradient} z-20`} />

              {/* Micro Film Grain Texture */}
              <div
                className="absolute inset-0 opacity-15 pointer-events-none mix-blend-overlay z-10"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                }}
              />

              {/* ── EXPANDED STATE CONTENT ─────────────────────────────────── */}
              {isActive ? (
                <div className="relative z-20 h-full flex flex-col justify-between space-y-6 animate-fadeIn">
                  {/* Top Bar Badges */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-cyan-300 border border-white/15 shadow-md">
                        {pillar.category}
                      </span>
                      <span className="text-xs font-mono px-3 py-1 rounded-full bg-cyan-500/20 backdrop-blur-md text-cyan-200 border border-cyan-400/30 shadow-md">
                        {pillar.eventsCount}
                      </span>
                    </div>

                    <span className="text-3xl font-mono font-black text-white/30 tracking-widest select-none">
                      {pillar.id}
                    </span>
                  </div>

                  {/* Bottom Text & Interactive Actions */}
                  <div className="space-y-4 max-w-xl">
                    <h4
                      className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]"
                      style={{ fontFamily: '"Syne", "Outfit", "Inter", sans-serif' }}
                    >
                      {pillar.title}
                    </h4>

                    <p className="text-slate-200 text-xs sm:text-sm md:text-base leading-relaxed font-light drop-shadow-md">
                      {pillar.desc}
                    </p>

                    {/* Highlights pill tags */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {pillar.highlights.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="text-[11px] font-mono px-3 py-1 rounded-lg bg-white/10 backdrop-blur-md text-slate-200 border border-white/15 shadow-sm"
                        >
                          ✓ {tag}
                        </span>
                      ))}
                    </div>

                    <div className="pt-2">
                      <Link
                        href="/events"
                        className="inline-flex items-center space-x-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold text-xs font-mono uppercase tracking-widest transition-all shadow-xl shadow-cyan-600/30 hover:scale-[1.02]"
                      >
                        <span>EXPLORE {pillar.title} EVENTS</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                /* ── COLLAPSED STATE PREVIEW ───────────────────────────────── */
                <div className="relative z-20 h-full flex flex-row md:flex-col justify-between items-center md:items-start transition-all duration-500">
                  <span className="text-2xl font-mono font-bold text-white/40 select-none">
                    {pillar.id}
                  </span>

                  {/* Vertical title for desktop collapsed bar */}
                  <div className="hidden md:block my-auto transform -rotate-90 origin-left text-lg font-black uppercase text-white/70 tracking-wider whitespace-nowrap">
                    {pillar.title}
                  </div>

                  {/* Horizontal title for mobile collapsed bar */}
                  <div className="block md:hidden text-lg font-black uppercase text-white/80 tracking-wider">
                    {pillar.title}
                  </div>

                  <span className="text-xs font-mono text-cyan-400">0{i + 1}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Accordion Progress Dots with Active Glow Line */}
      <div className="relative z-20 flex justify-center items-center gap-3 pt-2">
        {PILLARS.map((p, idx) => (
          <button
            key={p.id}
            onClick={() => setActiveIndex(idx)}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              idx === activeIndex
                ? 'w-10 bg-cyan-400 shadow-lg shadow-cyan-400/60'
                : 'w-2 bg-white/20 hover:bg-white/40'
            }`}
            aria-label={`Go to pillar ${p.title}`}
          />
        ))}
      </div>
    </section>
  );
}
