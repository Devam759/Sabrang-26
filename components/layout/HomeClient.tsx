'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import AboutSection from '@/components/sections/AboutSection'
import HeroSection from '@/components/sections/HeroSection'
import HeroScene from '@/components/3d/hero/HeroScene'
import ArtistReveal from '@/components/artist_reveal/ArtistReveal'
import { heroScrollState } from '@/components/3d/hero/heroScrollState'
import './hero-theme.css'

export default function HomeClient() {
  const btnRef = useRef<HTMLAnchorElement>(null)

  // Force scroll to top on mount/reload and prevent browser from jumping
  // back to previous scroll position automatically.
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
    window.scrollTo(0, 0)
  }, [])

  // Entrance fade-in + scroll-based fade-out tied to hero progress
  useEffect(() => {
    const btn = btnRef.current
    if (!btn) return

    // Entrance: reveal after a short delay
    btn.style.opacity = '0'
    btn.style.transform = 'translateY(12px)'
    const entranceTimer = setTimeout(() => {
      btn.style.transition = 'opacity 0.8s ease 0.6s, transform 0.8s ease 0.6s'
      btn.style.opacity = '1'
      btn.style.transform = 'translateY(0)'
    }, 200)

    // Scroll: fade out as hero progress advances past 10%
    let raf: number
    const tick = () => {
      const p = heroScrollState.progress
      if (p > 0.05) {
        const fade = Math.max(0, 1 - (p - 0.05) / 0.15)
        btn.style.opacity = String(fade)
        btn.style.pointerEvents = fade < 0.05 ? 'none' : 'auto'
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      clearTimeout(entranceTimer)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <main className="hero-theme relative w-full">
      <HeroScene />

      {/* Register Now — fixed at z-[45]: above film strip overlay (z-40),
          below navbar header (z-50). Guaranteed clickable with no overlay interference. */}
      <Link
        ref={btnRef}
        href="/register"
        className="group fixed bottom-8 right-10 z-[45] hidden md:flex items-center gap-2.5 bg-white/10 hover:bg-white/20 border border-white/25 hover:border-white/40 backdrop-blur-md px-6 py-3 rounded-full text-white text-[11px] font-bold tracking-widest uppercase shadow-[0_0_24px_rgba(255,255,255,0.08)] hover:shadow-[0_0_36px_rgba(255,255,255,0.18)] transition-all duration-300"
        style={{ willChange: 'opacity, transform' }}
      >
        REGISTER NOW
        <svg
          className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-200"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M1 6h10M6 1l5 5-5 5" />
        </svg>
      </Link>

      <div className="relative w-full">
        <HeroSection />

        {/* Scroll Triggers (Main Hero Logic) — the pin adds the real scroll
            length, see HERO_PIN_END. The page ends when the pin releases,
            with PHASE_03 still on screen. */}
        <div id="scroll-trigger" className="relative w-full z-10 pointer-events-none -mt-[100vh]">
          <section className="h-[100vh] pointer-events-none" data-label="Zoom Phase" />
          <section className="h-[100vh] pointer-events-none" data-label="Scatter/DNA Phase" />
        </div>
      </div>

      <ArtistReveal />
    </main>
  )
}
