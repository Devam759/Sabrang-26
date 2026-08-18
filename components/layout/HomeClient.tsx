'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Wheel, { type WheelHandle } from '@/components/ui/Wheel'
import AboutSection from '@/components/sections/AboutSection'
import HeroSection from '@/components/sections/HeroSection'
import HeroConclusion from '@/components/sections/HeroConclusion'
import AmbientAurora from '@/components/common/AmbientAurora'
import './hero-theme.css'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

const HeroHead = dynamic(() => import('@/components/3d/Scene'), { ssr: false })

interface HomeClientProps {
  summitImages: string[]
  summitNames: string[]
  summitBriefs: string[]
}

export default function HomeClient({ 
  summitImages, 
  summitNames, 
  summitBriefs 
}: HomeClientProps) {
  const [mounted, setMounted] = useState(false)
  const [currentSummit, setCurrentSummit] = useState(0)
  const wheelRef = useRef<WheelHandle>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const cardVisibleRef = useRef(false)
  const wheelSectionRef = useRef<HTMLDivElement>(null)
  const lenisRef = useRef<Lenis | null>(null)
  const phaseRef = useRef(0)

  const handleSummitSelect = useCallback((index: number) => {
    setCurrentSummit(index)
  }, [])

  useEffect(() => {
    setMounted(true)
    const lenis = new Lenis()
    lenisRef.current = lenis

    // Bridge Lenis scroll events to GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update)

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000)
    })
    gsap.ticker.lagSmoothing(0)

    // Phases: 0 = Head Zoom, 1 = Explosion/DNA, 2 = Space
    ScrollTrigger.create({
      trigger: '#scroll-trigger',
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress
        if (p < 0.45) {
          phaseRef.current = 0
        } else if (p < 0.55) {
          phaseRef.current = 1
        } else {
          phaseRef.current = 2
        }
      }
    });

    return () => {
      lenis.destroy()
      ScrollTrigger.getAll().forEach(t => t.kill())
    }
  }, [])



  // Separate effect for wheel pin — runs after mount so ref is valid
  useEffect(() => {
    if (!wheelSectionRef.current) return

    const trigger = ScrollTrigger.create({
      trigger: wheelSectionRef.current,
      start: 'top top',
      end: '+=400%',
      pin: true,
      scrub: true,
      onUpdate: (self) => {
        if (wheelRef.current) {
          wheelRef.current.setScrollDrive(self.progress)
        }

        // Direct DOM update for preview visibility to avoid re-renders
        if (previewRef.current) {
          const isVisible = self.progress > 0.01
          if (isVisible !== cardVisibleRef.current) {
            cardVisibleRef.current = isVisible
            if (isVisible) {
              previewRef.current.classList.replace('opacity-0', 'opacity-100')
              previewRef.current.classList.replace('translate-y-12', 'translate-y-0')
              previewRef.current.classList.replace('scale-95', 'scale-100')
              previewRef.current.classList.remove('pointer-events-none')
            } else {
              previewRef.current.classList.replace('opacity-100', 'opacity-0')
              previewRef.current.classList.replace('translate-y-0', 'translate-y-12')
              previewRef.current.classList.replace('scale-100', 'scale-95')
              previewRef.current.classList.add('pointer-events-none')
            }
          }
        }
      }
    })

    return () => {
      trigger.kill()
    }
  }, [])

  return (
    <main className="hero-theme relative w-full bg-[var(--bg-primary)]">
      <AmbientAurora />
      
      {/* 3D Background Layer */}
      <div className="fixed top-0 left-0 w-full h-[100vh] z-0 pointer-events-none">
        <div className="absolute inset-0">
          <HeroHead />
        </div>
      </div>

      <HeroSection />

      {/* Scroll Triggers (Main Hero Logic) */}
      <div id="scroll-trigger" className="relative w-full z-10 pointer-events-none">
        <section className="h-[200vh]" data-label="Zoom Phase" />
        <section className="h-[200vh]" data-label="Scatter/DNA Phase" />
        <section className="h-[200vh]" data-label="Space Phase" />
        <section className="h-[200vh]" data-label="Space Phase" />
      </div>

      <AboutSection />
      
      {/* Interactive Wheel Section - Locked until completion */}
      <div ref={wheelSectionRef} className="w-full relative h-[100vh] flex flex-col lg:flex-row items-center overflow-hidden">
        
        {/* Summit Visual Preview */}
        <div 
          ref={previewRef}
          className="absolute right-1/2 translate-x-1/2 lg:right-[6%] lg:translate-x-0 top-[10%] lg:top-1/2 lg:-translate-y-1/2 w-[85vw] lg:w-[28vw] lg:max-w-[520px] lg:min-w-[420px] h-[30vh] lg:h-auto lg:aspect-[4/5] rounded-[24px] lg:rounded-[48px] overflow-hidden border border-white/10 z-20 shadow-[0_40px_100px_rgba(var(--color-black-rgb),0.7)] transition-all duration-1000 ease-out opacity-0 translate-y-12 scale-95 pointer-events-none"
        >
           <Image 
             src={summitImages[currentSummit] || summitImages[0]}
             alt={summitNames[currentSummit]}
             fill
             className="object-cover animate-fade-in transition-opacity duration-500"
             sizes="(max-width: 1024px) 85vw, 30vw"
             priority={currentSummit === 0}
             style={{ 
               filter: 'contrast(1.1) brightness(0.8)',
             }}
           />
           <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
           
           {/* Details Layer */}
           <div 
             key={`text-${currentSummit}`}
             className="absolute bottom-6 lg:bottom-12 left-6 lg:left-10 right-6 lg:right-10 transform animate-text-reveal"
             style={{ animationDelay: '0.1s' }}
           >
              <h3 className="text-xl lg:text-3xl font-bold tracking-tight text-white uppercase mb-1 lg:mb-3 leading-tight" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
                {summitNames[currentSummit]}
              </h3>
              <p className="text-white/60 text-[10px] lg:text-sm leading-relaxed max-w-[95%] font-light tracking-wide">
                {summitBriefs[currentSummit]}
              </p>
           </div>
        </div>

        <div className="w-full h-full mt-[20vh] lg:mt-0 flex items-center justify-center">
          <Wheel 
            ref={wheelRef}
            data={summitNames}
            onSelect={handleSummitSelect}
          />
        </div>
      </div>

      <HeroConclusion />
    </main>
  )
}

