'use client'

import React, { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { RADIAL_ARTISTS } from './radialStageData'
import './RadialSoundstage.css'

export default function RadialSoundstage() {
  const sectionRef = useRef<HTMLDivElement>(null)
  return (
    <section
      id="artist-radial"
      ref={sectionRef}
      className="radial-soundstage-section relative w-full bg-radial from-[#08080c] to-[#020204]"
    >
      {/* Subtle Cinematic Film Grain Overlay */}
      <div className="radial-noise-overlay" />

      {/* ══════════════════════════════════════════════════════════════
          THE 3 DAYS OF HEADLINER ARTISTS (NATURAL TOP-TO-BOTTOM SCROLL)
          ══════════════════════════════════════════════════════════════ */}
      <div className="radial-runway-track flex flex-col w-full">
        {RADIAL_ARTISTS.map((artist, aIdx) => {
          return (
            <article
              key={artist.id}
              className="radial-artist-panel relative flex items-center justify-center w-full min-h-[90vh] py-16 sm:py-24"
            >
              {/* ── BACKGROUND STAGE PROJECTION & ATMOSPHERIC LIGHTING (PER ARTIST) ── */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                {/* Volumetric Stage Beams */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden mix-blend-screen opacity-25">
                  <div
                    className="absolute -top-[25%] right-[22%] w-[42vw] h-[145vh] origin-top -rotate-[22deg] filter blur-[75px] pointer-events-none transition-all duration-1000"
                    style={{
                      background: `linear-gradient(to bottom, ${artist.atmosphericAccent}, transparent 80%)`,
                    }}
                  />
                  <div
                    className="absolute -top-[25%] right-[38%] w-[32vw] h-[145vh] origin-top rotate-[16deg] filter blur-[85px] pointer-events-none transition-all duration-1000"
                    style={{
                      background: `linear-gradient(to bottom, rgba(255, 255, 255, 0.16), transparent 75%)`,
                    }}
                  />
                </div>

                {/* Stage Color Highlight Halo */}
                <div
                  className="absolute top-1/2 right-[10%] -translate-y-1/2 w-[55vw] h-[55vw] max-w-[850px] max-h-[850px] rounded-full pointer-events-none filter blur-[130px] opacity-65 mix-blend-screen"
                  style={{
                    background: `radial-gradient(circle, ${artist.atmosphericAccent} 0%, ${artist.atmosphericGlow} 45%, transparent 75%)`,
                  }}
                />

                {/* Secondary Rim Glow */}
                <div
                  className="absolute top-[30%] right-[26%] -translate-y-1/2 w-[34vw] h-[34vw] rounded-full pointer-events-none filter blur-[140px] opacity-40 mix-blend-color-dodge"
                  style={{
                    backgroundColor: artist.atmosphericAccent,
                  }}
                />

                {/* Artist Stage Backdrop Photography */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 flex items-center justify-end">
                  <div
                    className="relative w-full lg:w-[65vw] h-full flex items-center justify-center lg:justify-end opacity-40 lg:opacity-75"
                    style={{
                      maskImage:
                        'radial-gradient(ellipse 75% 75% at 60% 45%, #000 25%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,0.2) 75%, transparent 100%)',
                      WebkitMaskImage:
                        'radial-gradient(ellipse 75% 75% at 60% 45%, #000 25%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,0.2) 75%, transparent 100%)',
                    }}
                  >
                    <Image
                      src={artist.image}
                      alt={artist.artistName}
                      fill
                      sizes="(max-width: 1024px) 100vw, 65vw"
                      className="object-cover object-[center_top] filter contrast-110 saturate-105 pointer-events-none"
                      priority={aIdx === 0}
                    />

                    {/* Edge Dissolves */}
                    <div className="absolute inset-y-0 left-0 w-2/5 bg-gradient-to-r from-[#08080c] to-transparent pointer-events-none hidden lg:block" />
                    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#020204] via-[#08080c]/80 to-transparent pointer-events-none" />
                    <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#020204] via-[#08080c]/60 to-transparent pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* ── CENTER ARENA: Editorial Content ── */}
              <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 md:px-14 my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Editorial Typography & Action Hub (8 Cols) */}
                <div className="lg:col-span-8 flex flex-col justify-center">
                  {/* Day Numeral, Date & Runway Instagram Tag */}
                  <div className="flex items-center gap-4 sm:gap-6 mb-3 sm:mb-5 flex-wrap">
                    <span className="font-['FlorasDisplay',serif] text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white/30 tracking-tight leading-none select-none shrink-0">
                      {artist.day}
                    </span>
                    <div className="flex flex-col gap-1.5 sm:gap-2">
                      <span className="text-[11px] sm:text-xs font-['FlorasDisplay',serif] tracking-[0.25em] uppercase text-white/80">
                        {artist.date}
                      </span>
                      {/* Official Verified Instagram Badge */}
                      <a
                        href={artist.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.12] border border-white/20 hover:border-white/50 text-[11px] sm:text-xs font-['FlorasDisplay',serif] tracking-wider text-white/90 hover:text-white transition-all duration-300 w-fit pointer-events-auto backdrop-blur-md shadow-[0_2px_12px_rgba(0,0,0,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105"
                        title={`Follow ${artist.artistName} on Instagram`}
                      >
                        <svg
                          className="w-3.5 h-3.5 text-pink-400 group-hover:text-pink-300 group-hover:scale-110 transition-all duration-300"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                        </svg>
                        <span className="font-semibold text-white/95 group-hover:text-white transition-colors">
                          {artist.instagramHandle}
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </a>
                    </div>
                  </div>

                  {/* Monumental Headliner Name */}
                  <h2
                    className="radial-headline-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-white mb-4 sm:mb-6 pt-1 select-none flex flex-wrap items-baseline gap-x-3 sm:gap-x-4 gap-y-1 origin-left font-['FlorasDisplay',serif]"
                  >
                    <span className="radial-headline-word">{artist.firstName}</span>
                    <span className="radial-headline-word text-white">
                      {artist.lastName.split('').map((char, i) => (
                        <span key={i} className="inline-block mx-[0.025em]">
                          {char}
                        </span>
                      ))}
                    </span>
                  </h2>

                  {/* Nocturnal Luxury CTAs */}
                  <div className="flex items-center gap-4 pointer-events-auto mt-4 sm:mt-6">
                    <Link
                      href="/register"
                      className="group radial-cta-btn inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-xs font-['FlorasDisplay',serif] font-bold bg-white text-black hover:bg-white/90 hover:scale-105 transition-all duration-300 shadow-[0_0_28px_rgba(255,255,255,0.3)] tracking-widest"
                    >
                      REGISTRATIONS CLOSED
                      <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </Link>

                    <Link
                      href="/events"
                      className="radial-cta-btn inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-xs font-['FlorasDisplay',serif] font-bold text-white/80 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/20 hover:border-white/40 transition-all duration-300 backdrop-blur-md tracking-widest"
                    >
                      ALL EVENTS
                    </Link>
                  </div>
                </div>

                {/* Right Hero Portrait Frame (4 Cols) */}
                <div className="lg:col-span-4 flex justify-center items-center">
                  <div className="relative w-64 h-80 sm:w-72 sm:h-96 rounded-3xl overflow-hidden border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-md">
                    <Image
                      src={artist.image}
                      alt={artist.artistName}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 256px, 288px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <span className="text-[10px] uppercase tracking-widest text-white/60 font-mono">
                        DAY {artist.day} HEADLINER
                      </span>
                      <p className="font-['FlorasDisplay',serif] text-lg font-bold text-white">
                        {artist.artistName}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
