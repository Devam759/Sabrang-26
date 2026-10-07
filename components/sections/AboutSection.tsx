"use client"

import React, { useEffect, useRef } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { HERO_PIN_END, HERO_SCRUB } from '@/components/3d/hero/heroScrollState'
import './AboutSection.css'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export default function AboutSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const step1Ref = useRef<HTMLDivElement>(null)
  const step2Ref = useRef<HTMLDivElement>(null)
  const step3Ref = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Refresh ScrollTrigger after a short delay to ensure everything is in place
    const timer = setTimeout(() => {
      ScrollTrigger.refresh()
    }, 500)

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: "#scroll-trigger",
          start: "top top",
          // identical range to the hero pin -- see HERO_PIN_END
          end: HERO_PIN_END,
          scrub: HERO_SCRUB,
        }
      });

      // Total duration 100 virtual units to represent 0 -> 1 progress
      // PHASE 01: ROBOT (30 - 50)
      tl.fromTo(step1Ref.current, { autoAlpha: 0, y: 60, yPercent: -50 }, { autoAlpha: 1, y: 0, yPercent: -50, duration: 8 }, 30)
        .to(step1Ref.current, { autoAlpha: 0, y: -60, yPercent: -50, duration: 8 }, 42)

      // PHASE 02: DNA (50 - 70)
      tl.fromTo(step2Ref.current, { autoAlpha: 0, y: 60, yPercent: -50 }, { autoAlpha: 1, y: 0, yPercent: -50, duration: 8 }, 50)
        .to(step2Ref.current, { autoAlpha: 0, y: -60, yPercent: -50, duration: 8 }, 62)

      // PHASE 03: SPACE (70 -> end). No fade-out: the page ends on this card,
      // so it has to still be on screen at progress 1.
      tl.fromTo(step3Ref.current, 
        { autoAlpha: 0, y: 60, yPercent: -50 }, 
        { autoAlpha: 1, y: 0, yPercent: -50, duration: 8 }, 70)

      // Background glow sync (delay until hero atmosphere is fading)
      tl.to(glowRef.current, { left: "0%", duration: 5, top: '40%' }, 20)
        .to(glowRef.current, { left: "60%", duration: 20, top: '50%' }, 30)
        .to(glowRef.current, { left: "0%", duration: 20, top: '60%' }, 50)
        .to(glowRef.current, { autoAlpha: 0, duration: 10 }, 80);

      // Force total duration to exactly 100 so `30` maps perfectly to 0.3 progress
      tl.set({}, {}, 100);
    });

    return () => {
      ctx.revert()
      clearTimeout(timer)
    };
  }, []);

  return (
    <div id="about" ref={containerRef} className="fixed inset-0 z-30 pointer-events-none overflow-hidden">


      <div className="relative w-full h-full flex items-center">
        
        {/* Subtle glow for background depth */}
        <div 
          ref={glowRef}
          style={{
            position: 'absolute',
            width: '50vw',
            height: '50vw',
            background: 'radial-gradient(circle, var(--white-subtle) 0%, rgba(0,0,0,0) 70%)',
            pointerEvents: 'none',
            zIndex: -1,
            transform: 'translateY(-50%)',
          }}
        ></div>

        {/* STEP 1: LEFT ALIGNED — Varun Jain Featured Artist */}
        <div ref={step1Ref} className="about-card about-card--artist invisible" style={{ left: '5%' }}>
          <div className="artist-card-inner">
            <div className="artist-image-wrapper">
              <Image
                src="/images/varun-jain.jpg"
                alt="Varun Jain performing live"
                width={400}
                height={400}
                className="artist-image"
                priority
              />
              <div className="artist-image-glow" />
            </div>
            <div className="artist-info">
              <span className="text-[var(--text-muted)] tracking-[4px] mb-4 block text-[0.75rem]" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>/ PHASE_01</span>
              <h2 className="about-heading">Varun Jain<br /><i>Live</i></h2>
              <p className="text-lg text-[var(--text-muted)] font-light leading-relaxed">
                Get ready for an electrifying night as Varun Jain takes the stage at Sabrang &apos;26 — bringing soulful melodies and raw energy to the heart of the fest.
              </p>
            </div>
          </div>
        </div>

        {/* STEP 2: RIGHT ALIGNED (DNA) */}
        <div ref={step2Ref} className="about-card invisible" style={{ right: '5%' }}>
          <span className="text-[var(--text-muted)] tracking-[4px] mb-4 block text-[0.75rem]" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>/ PHASE_02</span>
          <h2 className="about-heading">Creativity meets <br />Culture</h2>
          <p className="text-lg text-[var(--text-muted)] font-light leading-relaxed">
            More than just a fest, Sabrang &apos;26 is a space where people come together to celebrate, compete, perform, and create unforgettable memories.
          </p>
        </div>

        {/* STEP 3: LEFT ALIGNED (Space) */}
        <div ref={step3Ref} className="about-card invisible" style={{ left: '5%' }}>
          <span className="text-[var(--text-muted)] tracking-[4px] mb-4 block text-[0.75rem]" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>/ PHASE_03</span>
          <h2 className="about-heading">Where Culture <br />Comes Alive</h2>
          <p className="text-lg text-[var(--text-muted)] font-light leading-relaxed">
            From electrifying performances and high-energy nights to engaging competitions and artistic showcases, every corner of the fest is designed to keep the energy alive.
          </p>
        </div>

      </div>
    </div>
  )
}
