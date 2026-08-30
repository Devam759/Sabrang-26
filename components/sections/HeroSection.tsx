'use client'

import React, { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { heroScrollState, HERO_PIN_END, HERO_SCRUB } from '@/components/3d/hero/heroScrollState'
import './HeroSection.css'
import Link from 'next/link'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    const triggerEl = document.getElementById('scroll-trigger')

    const ctx = gsap.context(() => {
      // Entrance Animation
      const tl = gsap.timeline({ delay: 0.2 })
      
      tl.fromTo('.hero-anim', 
        { y: 30, opacity: 0, filter: 'blur(10px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.2, stagger: 0.15, ease: "power3.out" }
      )
      
      // Mouse Parallax for typography (scoped to container elements)
      const p1 = container.querySelector('.parallax-1')
      const p2 = container.querySelector('.parallax-2')
      const p3 = container.querySelector('.parallax-3')

      const handleMouseMove = (e: MouseEvent) => {
        if (!container.isConnected) return
        const x = (e.clientX / window.innerWidth - 0.5) * 20
        const y = (e.clientY / window.innerHeight - 0.5) * 20
        
        if (p1) gsap.to(p1, { x: -x, y: -y, duration: 0, overwrite: "auto" })
        if (p2) gsap.to(p2, { x: x * 0.8, y: y * 0.8, duration: 0, overwrite: "auto" })
        if (p3) gsap.to(p3, { x: -x * 0.5, y: y * 1.2, duration: 0, overwrite: "auto" })
      }
      
      window.addEventListener('mousemove', handleMouseMove)

      // MAIN HERO SCROLL TRIGGER
      if (triggerEl) {
        const actualTrigger = containerRef.current?.parentElement || triggerEl;
        
        ScrollTrigger.create({
          trigger: actualTrigger,
          start: 'top top',
          end: HERO_PIN_END,
          pin: triggerEl,
          scrub: HERO_SCRUB,
          onUpdate: (self) => {
            heroScrollState.progress = self.progress
          }
        })

        // Fade out the countdown smoothly as soon as scrolling starts
        gsap.timeline({
          scrollTrigger: {
            trigger: actualTrigger,
            start: 'top top',
            end: HERO_PIN_END,
            scrub: HERO_SCRUB,
          }
        })
          .to('.hero-countdown', {
            opacity: 0,
            y: -50,
            filter: 'blur(20px)',
            duration: 3,
            ease: 'power1.in',
          }, 0)
          .set({}, {}, 100) // force total duration to 100 == progress 1
      }
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
      }
    }, containerRef)
    
    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef} className="hero-section-container relative pointer-events-none">
      
      {/* HTML OVERLAYS */}
      
      {/* .hero-countdown carries the scroll transform, .hero-anim the entrance
          one -- separate elements so the two timelines don't fight over `y`. */}
      <div className="hero-countdown absolute inset-0 flex flex-col items-center justify-center mt-[28vh] pointer-events-none z-10">
        <div className="hero-anim pointer-events-auto">
          <HeroCountdown />
        </div>
      </div>
      
      <div className="hero-footer">
        <div className="hero-info hero-anim">
          <p className="hero-date">23 - 25 OCTOBER</p>
        </div>
        
        <Link href="/register" className="hero-anim group flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md px-6 py-3 rounded-full text-white text-xs font-bold tracking-widest uppercase transition-all duration-300 pointer-events-auto shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]">
          REGISTER NOW
          <span className="text-[10px] group-hover:translate-x-1 transition-transform">➔</span>
        </Link>
      </div>
    </div>
  )
}

function HeroCountdown() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    // Target date: October 23, 2026 09:00:00 IST
    const target = new Date('2026-10-23T09:00:00+05:30').getTime()
    
    const interval = setInterval(() => {
      const now = new Date().getTime()
      const diff = target - now
      if (diff <= 0) {
        clearInterval(interval)
        return
      }
      
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000)
      })
    }, 1000)
    
    // Initial call
    const diff = target - new Date().getTime()
    if (diff > 0) {
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000)
      })
    }
    
    return () => clearInterval(interval)
  }, [])

  const pad = (num: number) => num.toString().padStart(2, '0')

  return (
    <div className="flex items-center gap-4 sm:gap-6 select-none relative">
      {/* Subtle backdrop glow for the entire counter */}
      <div className="absolute inset-0 bg-white/5 blur-2xl rounded-full" />
      
      <TimeUnit value={pad(timeLeft.days)} label="DAYS" />
      <span className="text-white/30 text-2xl sm:text-4xl font-light mb-5 sm:mb-6">:</span>
      <TimeUnit value={pad(timeLeft.hours)} label="HRS" />
      <span className="text-white/30 text-2xl sm:text-4xl font-light mb-5 sm:mb-6">:</span>
      <TimeUnit value={pad(timeLeft.minutes)} label="MINS" />
      <span className="text-white/30 text-2xl sm:text-4xl font-light mb-5 sm:mb-6">:</span>
      <TimeUnit value={pad(timeLeft.seconds)} label="SECS" />
    </div>
  )
}

function TimeUnit({ value, label }: { value: string, label: string }) {
  return (
    <div className="flex flex-col items-center relative z-10">
      <div className="text-white/90 text-3xl sm:text-5xl font-light tracking-widest font-mono tabular-nums min-w-[3rem] sm:min-w-[4rem] text-center drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
        {value}
      </div>
      <span className="text-[0.6rem] sm:text-[0.65rem] text-white/50 tracking-[0.3em] mt-2 font-sans font-medium uppercase">{label}</span>
    </div>
  )
}
