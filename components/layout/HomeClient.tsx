'use client'

import AboutSection from '@/components/sections/AboutSection'
import HeroSection from '@/components/sections/HeroSection'
import HeroScene from '@/components/3d/hero/HeroScene'
import './hero-theme.css'

export default function HomeClient() {
  return (
    <main className="hero-theme relative w-full">
      <HeroScene />

      <div className="relative w-full">
        <HeroSection />

        {/* Scroll Triggers (Main Hero Logic) — the pin adds the real scroll
            length, see HERO_PIN_END. The page ends when the pin releases,
            with PHASE_03 still on screen. */}
        <div id="scroll-trigger" className="relative w-full z-10 pointer-events-none -mt-[100vh]">
          <section className="h-[100vh]" data-label="Zoom Phase" />
          <section className="h-[100vh]" data-label="Scatter/DNA Phase" />
        </div>
      </div>

      <AboutSection />
    </main>
  )
}
