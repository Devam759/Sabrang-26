'use client'

import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './HeroSection.css'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Entrance Animation
      const tl = gsap.timeline({ delay: 3.8 }) // Delay until IntroReveal finishes
      
      // Animate secondary labels
      tl.fromTo('.hero-anim-label', 
        { y: 30, opacity: 0, filter: 'blur(10px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.2, stagger: 0.1, ease: "power3.out" }
      )
      
      // Animate title characters
      tl.fromTo('.hero-char',
        { y: 60, opacity: 0, filter: 'blur(20px)', rotateX: -90 },
        { y: 0, opacity: 1, filter: 'blur(0px)', rotateX: 0, duration: 1.2, stagger: 0.05, ease: "expo.out" },
        "-=1.0" // overlap with labels
      )

      // Animate footer
      tl.fromTo('.hero-footer-anim',
        { y: 20, opacity: 0, filter: 'blur(5px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1, stagger: 0.1, ease: "power2.out" },
        "-=0.5"
      )
      
      // Mouse Parallax for typography
      const handleMouseMove = (e: MouseEvent) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 30
        const y = (e.clientY / window.innerHeight - 0.5) * 30
        
        gsap.to('.parallax-1', { x: -x, y: -y, duration: 1.5, ease: "power2.out" })
        gsap.to('.parallax-2', { x: x * 0.8, y: y * 0.8, duration: 2, ease: "power2.out" })
        gsap.to('.parallax-3', { x: -x * 0.5, y: y * 1.2, duration: 2.5, ease: "power2.out" })
      }
      
      window.addEventListener('mousemove', handleMouseMove)

      // Scroll transition
      ScrollTrigger.create({
        trigger: '#scroll-trigger',
        start: 'top top',
        end: '+=100vh',
        scrub: 1,
        animation: gsap.to('.hero-section-container', {
          y: -150,
          opacity: 0,
          scale: 0.95,
          filter: 'blur(10px)',
          ease: "none"
        })
      })
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
      }
    }, containerRef)
    
    return () => ctx.revert()
  }, [])

  const splitTitle = "SABRANG".split("").map((char, i) => (
    <span key={i} className="hero-char inline-block origin-bottom">{char}</span>
  ));

  return (
    <div ref={containerRef} className="hero-section-container">
      
      {/* Cyber-Noir Background Accents */}
      <div className="hero-accent-circle absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full pointer-events-none" />
      <div className="hero-accent-circle absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] border border-white/[0.02] rounded-full pointer-events-none" />

      <div className="hero-content relative z-10">
        <div className="parallax-2">
          <p className="hero-label hero-anim-label">JK LAKSHMIPAT UNIVERSITY</p>
        </div>
        <div className="parallax-1" style={{ perspective: '1000px' }}>
          <h1 className="hero-title">{splitTitle}</h1>
        </div>
        <div className="parallax-3">
          <p className="hero-year hero-anim-label">2026</p>
        </div>
      </div>
      
      <div className="hero-footer relative z-10">
        <div className="hero-info hero-footer-anim">
          <p>THE CULTURAL FESTIVAL OF JKLU</p>
          <div className="hero-date-box">
            <span className="hero-date">14 &mdash; 16 MARCH</span>
          </div>
        </div>
        
        <div className="hero-scroll hero-footer-anim">
          <span className="scroll-text">SCROLL TO EXPLORE</span>
          <div className="scroll-arrow">
            <svg width="18" height="32" viewBox="0 0 18 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="16" height="30" rx="8" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
              <circle cx="9" cy="8" r="3" fill="white" className="scroll-dot" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
