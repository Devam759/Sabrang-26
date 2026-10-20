'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowUpRight, Volume2, VolumeX } from 'lucide-react'
import { RADIAL_ARTISTS, type RadialArtist } from './radialStageData'
import CoutureStageDisc from './CoutureStageDisc'
import SonicAuroraWave from './SonicAuroraWave'
import './RadialSoundstage.css'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export default function RadialSoundstage() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const runwayRef = useRef<HTMLDivElement>(null)

  const [activeIndex, setActiveIndex] = useState(0)
  const [selectedPhotoIndices, setSelectedPhotoIndices] = useState<number[]>([0, 0, 0])
  const [strobeIndex, setStrobeIndex] = useState<number | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isSectionVisible, setIsSectionVisible] = useState(false)

  // Viewport Occlusion Culling: Track section visibility to pause heavy render loops when off-screen
  useEffect(() => {
    const section = sectionRef.current
    if (!section || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSectionVisible(entry.isIntersecting)
      },
      { rootMargin: '150px 0px' }
    )
    observer.observe(section)

    return () => observer.disconnect()
  }, [])

  // Track pointer coordinates for ambient lighting dynamics (only when section is visible)
  useEffect(() => {
    const section = sectionRef.current
    if (!section || !isSectionVisible) return
    let rafId: number | null = null

    const handlePointerMove = (e: PointerEvent) => {
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        if (!section) return
        const nx = (e.clientX / window.innerWidth - 0.5) * 2
        const ny = (e.clientY / window.innerHeight - 0.5) * 2
        section.style.setProperty('--mx', nx.toFixed(4))
        section.style.setProperty('--my', ny.toFixed(4))
      })
    }
    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [isSectionVisible])

  // Photo selection handler per artist panel
  const handlePhotoSelect = useCallback((artistIdx: number, photoIdx: number) => {
    setSelectedPhotoIndices((prev) => {
      const next = [...prev]
      next[artistIdx] = photoIdx
      return next
    })
    setStrobeIndex(artistIdx)
    setTimeout(() => setStrobeIndex(null), 140)
  }, [])

  // ══════════════════════════════════════════════════════════════
  // GSAP SCROLLTRIGGER: THE CONTINUOUS HORIZONTAL RUNWAY
  // ══════════════════════════════════════════════════════════════
  useEffect(() => {
    const section = sectionRef.current
    const runway = runwayRef.current
    const viewport = viewportRef.current
    if (!section || !runway) return

    const ctx = gsap.context(() => {
      // 1. Viewport Atmospheric Crossfade on Enter
      if (viewport) {
        gsap.fromTo(
          viewport,
          { opacity: 0 },
          {
            opacity: 1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 85%',
              end: 'top top',
              scrub: 0.6,
            },
          }
        )
      }

      // 2. Buttery-Smooth Continuous Horizontal Runway Scrub (0vw -> -200vw)
      gsap.to(runway, {
        x: () => -(runway.scrollWidth - window.innerWidth),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.8,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress // 0.0 to 1.0
            // Exact symmetrical boundaries for 3 artists
            let currentIdx = 0
            if (p >= 0.66) {
              currentIdx = 2
            } else if (p >= 0.33) {
              currentIdx = 1
            } else {
              currentIdx = 0
            }
            setActiveIndex(currentIdx)
          },
        },
      })
    }, section)

    return () => ctx.revert()
  }, [])

  // Smooth scroll jump to exact station when tapping the bottom capsule dock
  const handleSelectArtist = (index: number) => {
    setActiveIndex(index)
    const section = sectionRef.current
    if (!section) return

    const scrollDistance = section.offsetHeight - window.innerHeight
    const targetProgress = index / (RADIAL_ARTISTS.length - 1) // 0, 0.5, 1.0
    const targetScroll = section.offsetTop + targetProgress * scrollDistance

    window.scrollTo({
      top: targetScroll,
      behavior: 'smooth',
    })
  }

  // Mobile horizontal touch swipe support with RAF-coalesced momentum
  const touchStartXRef = useRef(0)
  const touchStartYRef = useRef(0)
  const isSwipingHorizontalRef = useRef(false)
  const touchRafRef = useRef<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button, a, .cursor-grab, .touch-none')) {
      return
    }
    touchStartXRef.current = e.touches[0].clientX
    touchStartYRef.current = e.touches[0].clientY
    isSwipingHorizontalRef.current = false
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button, a, .cursor-grab, .touch-none')) {
      return
    }
    const currentX = e.touches[0].clientX
    const currentY = e.touches[0].clientY
    const dx = currentX - touchStartXRef.current
    const dy = currentY - touchStartYRef.current

    if (!isSwipingHorizontalRef.current && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      isSwipingHorizontalRef.current = true
    }

    if (isSwipingHorizontalRef.current) {
      const section = sectionRef.current
      if (section && !touchRafRef.current) {
        touchRafRef.current = requestAnimationFrame(() => {
          touchRafRef.current = null
          const scrollRatio = (section.offsetHeight - window.innerHeight) / (window.innerWidth * 2)
          window.scrollBy({ top: -dx * scrollRatio * 0.45, behavior: 'auto' })
        })
        touchStartXRef.current = currentX
      }
    }
  }

  const currentArtist = RADIAL_ARTISTS[activeIndex] || RADIAL_ARTISTS[0]

  return (
    <section
      id="artist-radial"
      ref={sectionRef}
      className="radial-soundstage-section relative w-full"
    >
      <div ref={viewportRef} className="radial-soundstage-viewport">
        {/* Subtle Cinematic Film Grain Overlay */}
        <div className="radial-noise-overlay" />

        {/* ══════════════════════════════════════════════════════════════
            THE CONTINUOUS 300VW HORIZONTAL RUNWAY FILMSTRIP
            ══════════════════════════════════════════════════════════════ */}
        <div
          ref={runwayRef}
          className="radial-runway-track flex-1 overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
        >
          {RADIAL_ARTISTS.map((artist, aIdx) => {
            const selectedPhoto = selectedPhotoIndices[aIdx] ?? 0
            const images = artist.galleryImages || [artist.image]
            const isPanelStrobing = strobeIndex === aIdx

            return (
              <div
                key={artist.id}
                className="radial-artist-panel relative flex items-center justify-center"
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

                  {/* Dedicated Atmospheric Artist Stage Photography (Positioned behind turntable) */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 flex items-center justify-end">
                    <div
                      className="relative w-full lg:w-[68vw] xl:w-[62vw] h-full flex items-center justify-center lg:justify-end"
                      style={{
                        maskImage:
                          'radial-gradient(ellipse 72% 68% at 60% 45%, #000 15%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,0.2) 70%, transparent 95%)',
                        WebkitMaskImage:
                          'radial-gradient(ellipse 72% 68% at 60% 45%, #000 15%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,0.2) 70%, transparent 95%)',
                      }}
                    >
                      {/* Pre-rendered hardware-accelerated artist stage photography with smooth crossfade */}
                      {images.map((img, pIdx) => {
                        const isVisible = selectedPhoto === pIdx
                        return (
                          <div
                            key={`${artist.id}-${pIdx}`}
                            className={`absolute inset-0 transition-opacity duration-500 ease-out will-change-[opacity] ${
                              isVisible ? 'opacity-40 lg:opacity-85 z-10' : 'opacity-0 z-0 pointer-events-none'
                            }`}
                          >
                            <Image
                              src={img}
                              alt={`${artist.artistName} Perspective ${pIdx + 1}`}
                              fill
                              sizes="(max-width: 1024px) 100vw, 65vw"
                              className="object-cover object-[center_top] filter contrast-110 saturate-105 pointer-events-none"
                              priority={aIdx === 0 && pIdx === 0}
                            />
                          </div>
                        )
                      })}

                      {/* Deep Obsidian Edge Dissolves: Melting completely into the deep dark background */}
                      <div className="absolute inset-y-0 left-0 w-3/5 bg-gradient-to-r from-[#08080c] via-[#08080c]/85 to-transparent pointer-events-none hidden lg:block" />
                      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#020204] via-[#08080c]/80 to-transparent pointer-events-none" />
                      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#020204] via-[#08080c]/60 to-transparent pointer-events-none" />
                      <div className="absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-[#020204] via-[#08080c]/40 to-transparent pointer-events-none" />
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,#08080c_95%)] pointer-events-none" />

                      {/* Instantaneous Concert Strobe Flash on Angle Switch */}
                      <div
                        className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-150 z-20 mix-blend-screen ${
                          isPanelStrobing ? 'opacity-30' : 'opacity-0'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* ── CENTER ARENA: Sculpted Editorial Typography + Prismatic Vinyl ── */}
                <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 md:px-14 my-auto grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-center">
                  {/* LEFT: Monumental Editorial Typography & Action Hub (7 Cols) */}
                  <div className="lg:col-span-7 flex flex-col justify-center order-1">
                    {/* Architectural Day Numeral, Date & Runway Instagram Tag */}
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

                    {/* Monumental Headliner Name with Kinetic Sub-Bass Pulse & FlorasDisplay Kerning */}
                    <h2
                      className="radial-headline-display radial-headline-pulse text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-white mb-3 sm:mb-6 pt-1 select-none flex flex-wrap items-baseline gap-x-3 sm:gap-x-4 gap-y-1 origin-left font-['FlorasDisplay',serif]"
                      style={{
                        '--beat-duration': `${(60 / artist.bpm).toFixed(3)}s`,
                      } as React.CSSProperties}
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

                    {/* ── VARUN JAIN SIGNATURE HIT SOUNDTRACKS (DIRECT SPOTIFY STREAMING) ── */}
                    {artist.topTracks && artist.topTracks.length > 0 && (
                      <div className="radial-editorial-credit mb-4 sm:mb-6 pointer-events-auto max-w-xl hidden lg:block">
                        {/* Header Tag with Ambient Champagne / Starlight Accent */}
                        <div className="flex items-center gap-2 mb-2 sm:mb-2.5">
                          <span
                            className="w-1.5 h-1.5 rounded-full animate-pulse"
                            style={{
                              backgroundColor: artist.atmosphericAccent,
                              boxShadow: `0 0 10px ${artist.atmosphericAccent}`,
                            }}
                          />
                          <span className="text-[10px] sm:text-xs font-['FlorasDisplay',serif] tracking-[0.22em] uppercase text-white/90">
                            SIGNATURE SOUNDTRACKS
                          </span>
                          <span className="text-white/25 text-[10px]">•</span>
                          <span className="text-[9px] sm:text-[10px] font-['FlorasDisplay',serif] tracking-wider text-white/50 uppercase">
                            1B+ STREAMS
                          </span>
                        </div>

                        {/* 2-Column Responsive Soundtrack Grid */}
                        <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                          {artist.topTracks.map((track, i) => (
                            <a
                              key={i}
                              href={track.spotifyUrl || 'https://open.spotify.com'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group relative flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-amber-200/40 backdrop-blur-md transition-all duration-300 shadow-[0_4px_16px_rgba(0,0,0,0.5)] hover:shadow-[0_0_24px_rgba(255,225,170,0.2)] hover:scale-[1.02] cursor-pointer overflow-hidden"
                              title={`Listen to "${track.title}" on Spotify`}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-amber-200/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                              <div className="flex flex-col min-w-0 pr-1.5">
                                <span className="font-['FlorasDisplay',serif] font-bold text-white text-[11px] sm:text-xs truncate group-hover:text-amber-200 transition-colors">
                                  {track.title}
                                </span>
                                <span className="font-['FlorasDisplay',serif] text-white/50 text-[9px] sm:text-[10px] truncate mt-0.5">
                                  {track.movieOrAlbum} • {track.year}
                                </span>
                              </div>

                              {/* Spotify Micro-Icon Pill */}
                              <div className="shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/[0.08] group-hover:bg-[#1DB954] flex items-center justify-center transition-all duration-300 shadow">
                                <svg
                                  className="w-3 h-3 text-white/80 group-hover:text-black transition-colors"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                >
                                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.487 17.299c-.215.353-.674.465-1.027.249-2.812-1.718-6.353-2.107-10.523-1.155-.404.093-.806-.157-.899-.562-.093-.404.157-.806.562-.899 4.568-1.044 8.486-.604 11.639 1.34.353.216.465.674.248 1.027zm1.464-3.261c-.27.439-.844.58-1.282.31-3.219-1.978-8.126-2.55-11.932-1.394-.494.15-1.021-.133-1.171-.627-.15-.494.133-1.021.627-1.171 4.354-1.321 9.771-.684 13.448 1.579.439.27.58.844.31 1.282zm.126-3.41c-3.86-2.292-10.228-2.504-13.899-1.389-.59.18-1.218-.16-1.398-.75-.18-.59.16-1.218.75-1.398 4.225-1.283 11.246-1.037 15.684 1.597.531.315.705 1.004.39 1.535-.315.531-1.004.705-1.535.39z" />
                                </svg>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* High-Fashion Nocturnal Luxury CTAs */}
                    <div className="flex items-center gap-3 sm:gap-4 pointer-events-auto">
                      <Link
                        href="/register"
                        className="group radial-cta-btn inline-flex items-center gap-2 px-6 py-3 sm:px-7 sm:py-3.5 rounded-full text-xs font-['FlorasDisplay',serif] font-bold bg-white text-black hover:bg-white/90 hover:scale-105 transition-all duration-300 shadow-[0_0_28px_rgba(255,255,255,0.3)] tracking-widest"
                      >
                        RESERVE PASS
                        <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </Link>

                      <Link
                        href="/events"
                        className="radial-cta-btn inline-flex items-center gap-2 px-5 py-3 sm:px-6 sm:py-3.5 rounded-full text-xs font-['FlorasDisplay',serif] font-bold text-white/80 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/20 hover:border-white/40 transition-all duration-300 backdrop-blur-md tracking-widest"
                      >
                        ALL EVENTS
                      </Link>
                    </div>
                  </div>

                  {/* RIGHT: Haute Couture Liquid Vinyl Disc (5 Cols) */}
                  <div className="lg:col-span-5 flex flex-col items-center justify-center order-2">
                    <CoutureStageDisc
                      artistIndex={aIdx}
                      activeIndex={activeIndex}
                      selectedPhotoIndex={selectedPhoto}
                      onSelectPhotoIndex={(pIdx) => handlePhotoSelect(aIdx, pIdx)}
                      soundEnabled={soundEnabled}
                      onToggleSound={() => setSoundEnabled((p) => !p)}
                      hideDock={true}
                      isActive={isSectionVisible && activeIndex === aIdx}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ══════════════════════════════════════════════════════════════
            STATIONARY GLASS CAPSULE DOCK & SONIC AURORA HORIZON
            ══════════════════════════════════════════════════════════════ */}
        <footer className="relative z-30 w-full px-3 sm:px-8 pb-1.5 sm:pb-3 lg:pb-4 pointer-events-auto flex flex-col items-center">
          {/* Streamlined Luxury Glass Capsule Dock */}
          <div className="mb-2 sm:mb-3 inline-flex items-center p-1 sm:p-1.5 rounded-full bg-black/75 backdrop-blur-2xl border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.85),inset_0_1px_2px_rgba(255,255,255,0.15)] max-w-full pointer-events-auto">
            <div className="flex items-center gap-1 sm:gap-1.5">
              {RADIAL_ARTISTS.map((artist, idx) => {
                const isSelected = activeIndex === idx
                return (
                  <button
                    key={artist.id}
                    type="button"
                    onClick={() => handleSelectArtist(idx)}
                    className={`group relative px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[11px] font-['FlorasDisplay',serif] tracking-wider transition-all duration-300 flex items-center gap-1 sm:gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-white text-black font-bold shadow-[0_0_20px_rgba(255,255,255,0.5),0_2px_8px_rgba(0,0,0,0.6)] scale-[1.02]'
                        : 'text-white/55 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    <span className={`text-[8px] sm:text-[9px] font-bold ${isSelected ? 'text-black/70' : 'text-white/40'}`}>
                      {artist.day}
                    </span>
                    <span className="tracking-wider uppercase font-semibold">
                      {artist.displayName}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Vertical Capsule Divider */}
            <div className="w-[1px] h-3.5 sm:h-4 bg-white/20 mx-1 sm:mx-1.5" />

            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled((prev) => !prev)}
              className={`p-1.5 sm:p-2 rounded-full transition-all duration-300 flex items-center justify-center cursor-pointer ${
                soundEnabled
                  ? 'text-white bg-white/10 hover:bg-white/20 shadow-[0_0_12px_rgba(255,255,255,0.2)]'
                  : 'text-white/35 hover:text-white/60 hover:bg-white/[0.04]'
              }`}
              title={soundEnabled ? 'Haptic Sound Active (Click to Mute)' : 'Haptic Sound Muted (Click to Enable)'}
              aria-label="Toggle haptic audio"
            >
              {soundEnabled ? (
                <Volume2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              ) : (
                <VolumeX className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              )}
            </button>
          </div>

          {/* Multi-Ribbon Sonic Aurora Fluid Wave with Floating Embers */}
          <SonicAuroraWave
            bpm={currentArtist.bpm}
            waveSpeed={currentArtist.sonicWaveSpeed}
            waveTurbulence={currentArtist.sonicTurbulence}
            accentColor={currentArtist.atmosphericAccent}
            isActive={isSectionVisible}
          />
        </footer>
      </div>
    </section>
  )
}
