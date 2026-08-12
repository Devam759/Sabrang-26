'use client';

import { useRef } from 'react';
import { Zen_Dots } from 'next/font/google';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Using a custom font "Cyberpunk" which requires the TTF to be in public/fonts/

export default function GsapCyberText({ text = 'SABRANG 2026' }: { text?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const charsRef = useRef<(HTMLSpanElement | null)[]>([]);
  
  useGSAP(() => {
    if (!containerRef.current) return;
    
    const chars = charsRef.current.filter(Boolean);
    if (!chars.length) return;

    // Phase 1: Initial load animation (Decoding effect)
    gsap.fromTo(chars, 
      { 
        opacity: 0, 
        y: 50, 
        scale: 1.5,
        filter: 'blur(10px) hue-rotate(90deg)',
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px) hue-rotate(0deg)',
        duration: 1,
        stagger: {
          each: 0.05,
          from: 'random'
        },
        ease: 'power4.out',
        onComplete: () => {
          // Phase 2: Initialize ScrollTrigger ONLY after the intro finishes
          // This ensures ScrollTrigger records opacity: 1 as the baseline
          gsap.to(chars, {
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top top",
              end: "+=600",
              scrub: 1,
            },
            y: () => (Math.random() - 0.5) * 800,
            x: () => (Math.random() - 0.5) * 800,
            rotationZ: () => (Math.random() - 0.5) * 90,
            rotationX: () => (Math.random() - 0.5) * 90,
            opacity: 0,
            scale: () => Math.random() * 2,
            filter: 'blur(20px)',
            ease: 'none',
          });
        }
      }
    );
  }, { scope: containerRef });

  const handleHover = () => {
    const chars = charsRef.current.filter(Boolean);
    
    // Trigger localized hardware glitch on hover
    gsap.to(chars, {
      duration: 0.1,
      x: () => (Math.random() - 0.5) * 10,
      y: () => (Math.random() - 0.5) * 10,
      skewX: () => (Math.random() - 0.5) * 20,
      filter: 'hue-rotate(90deg) brightness(1.5)',
      opacity: () => 0.5 + Math.random() * 0.5,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        gsap.to(chars, { x: 0, y: 0, skewX: 0, filter: 'hue-rotate(0deg) brightness(1)', opacity: 1, duration: 0.2 });
      }
    });
  };

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-auto"
    >
      <style>{`
        @font-face {
          font-family: 'Cyberpunk';
          src: url('/fonts/Cyberpunk.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
        }
        
        .cyber-gsap-text {
          font-family: 'Cyberpunk', 'Black Ops One', sans-serif;
          color: white;
          text-transform: uppercase;
          line-height: 0.85;
          text-shadow: 0 0 10px rgba(0, 255, 255, 0.3), 0 0 30px rgba(255, 0, 255, 0.3);
          -webkit-text-stroke: 1px rgba(255, 255, 255, 0.5);
          cursor: crosshair;
        }
        
        .char {
          display: inline-block;
          transform-style: preserve-3d;
          /* Preserve whitespace for spaces */
          white-space: pre;
        }
      `}</style>

      <h1 
        onMouseEnter={handleHover}
        className="cyber-gsap-text font-bold text-6xl md:text-[8rem] tracking-tighter select-none"
      >
        {text.split('').map((char, index) => (
          <span
            key={index}
            ref={(el) => {
              charsRef.current[index] = el;
            }}
            className="char"
          >
            {char}
          </span>
        ))}
      </h1>
    </div>
  );
}
