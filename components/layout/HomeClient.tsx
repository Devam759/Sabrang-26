'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import HeroSection from '@/components/sections/HeroSection'
import HeroScene from '@/components/3d/hero/HeroScene'
import RadialSoundstage from '@/components/sections/RadialSoundstage/RadialSoundstage'
import { heroScrollState } from '@/components/3d/hero/heroScrollState'
import './hero-theme.css'

export default function HomeClient() {
  const btnRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const btn = btnRef.current
    if (!btn) return

    // Entrance: reveal after a short delay
    btn.style.opacity = '0'
    btn.style.transform = 'translateY(12px)'
    btn.style.transition = 'opacity 0.3s ease, transform 0.3s ease'
    const entranceTimer = setTimeout(() => {
      btn.style.opacity = '1'
      btn.style.transform = 'translateY(0)'
    }, 400)

    // Mirror Navbar behavior: hide when menu opens, show when it closes
    // Matches exactly how the Navbar hides its logo (opacity-0 pointer-events-none)
    const observer = new MutationObserver(() => {
      const menuOpen = document.body.hasAttribute('data-menu-open')
      btn.style.opacity = menuOpen ? '0' : '1'
      btn.style.pointerEvents = menuOpen ? 'none' : 'auto'
    })
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-menu-open'] })

    return () => {
      clearTimeout(entranceTimer)
      observer.disconnect()
    }
  }, [])

  return (
    <main className="hero-theme relative w-full">
      <h1 className="sr-only">Sabrang 2026 - JK Lakshmipat University Annual Cultural Fest</h1>
      <HeroScene />

      {/* Register Now - fixed at z-[45]: above film strip overlay (z-40),
          below navbar header (z-50). Guaranteed clickable with no overlay interference. */}
      <Link
        ref={btnRef}
        href="/register"
        className="register-now-btn group fixed bottom-8 right-6 md:right-10 z-[45] flex items-center gap-2.5 bg-white/10 hover:bg-white/20 border border-white/25 hover:border-white/40 backdrop-blur-md px-5 py-2.5 md:px-6 md:py-3 rounded-full text-white text-[10px] md:text-[11px] font-['FlorasDisplay',serif] font-bold tracking-widest uppercase shadow-[0_0_24px_rgba(255,255,255,0.08)] hover:shadow-[0_0_36px_rgba(255,255,255,0.18)] transition-all duration-300"
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

      <div id="hero-scroll-track" className="relative w-full h-[200vh]">
        <HeroSection />
      </div>

      <RadialSoundstage />
    </main>
  )
}
