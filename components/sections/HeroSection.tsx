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
      const tl = gsap.timeline({ delay: 0.2 })
      
      tl.fromTo('.hero-anim', 
        { y: 30, opacity: 0, filter: 'blur(10px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.2, stagger: 0.15, ease: "power3.out" }
      )
      
      // Mouse Parallax for typography
      const handleMouseMove = (e: MouseEvent) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 20
        const y = (e.clientY / window.innerHeight - 0.5) * 20
        
        gsap.to('.parallax-1', { x: -x, y: -y, duration: 1, ease: "power2.out" })
        gsap.to('.parallax-2', { x: x * 0.8, y: y * 0.8, duration: 1.5, ease: "power2.out" })
        gsap.to('.parallax-3', { x: -x * 0.5, y: y * 1.2, duration: 2, ease: "power2.out" })
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
          ease: "none"
        })
      })
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
      }
    }, containerRef)
    
    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef} className="hero-section-container">
      <div className="hero-content">
        <p className="hero-label hero-anim parallax-2">JK LAKSHMIPAT UNIVERSITY</p>
        <h1 className="hero-title hero-anim parallax-1">SABRANG</h1>
        <p className="hero-year hero-anim parallax-3">2026</p>
      </div>
      
      <div className="hero-footer">
        <div className="hero-info hero-anim">
          <p>THE CULTURAL FESTIVAL OF JKLU</p>
          <p className="hero-date">14 &mdash; 16 MARCH</p>
        </div>
        
        <div className="hero-scroll hero-anim">
          <span className="scroll-text">SCROLL TO EXPLORE</span>
          <div className="scroll-arrow">&darr;</div>
        </div>
      </div>
    </div>
  )
}
