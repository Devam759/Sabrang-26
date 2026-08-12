"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SabrangLetterPortal from "./SabrangLetterPortal";
import FestivalFloatingCards from "./FestivalFloatingCards";

// Register ScrollTrigger plugin safely on client
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function SabrangHeroContainer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinnedSectionRef = useRef<HTMLDivElement>(null);
  const portalWrapperRef = useRef<HTMLDivElement>(null);
  const floatingCardsRef = useRef<HTMLDivElement>(null);
  const storyIntroRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    const pinnedSection = pinnedSectionRef.current;
    const portalWrapper = portalWrapperRef.current;
    const floatingCards = floatingCardsRef.current;
    const storyIntro = storyIntroRef.current;
    const scrollIndicator = scrollIndicatorRef.current;

    if (!container || !pinnedSection || !portalWrapper) return;

    // Refresh GSAP ScrollTrigger to capture accurate dimensions
    ScrollTrigger.refresh();

    const ctx = gsap.context(() => {
      // Main Master Timeline pinned for 3.5 viewport heights
      const mainTl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "bottom bottom",
          pin: pinnedSection,
          scrub: 0.8,
          onUpdate: (self) => {
            setScrollProgress(self.progress);
          },
        },
      });

      // ----------------------------------------------------
      // Phase 1: Letter Portal Zoom & Spatial Separation (0 -> 45%)
      // ----------------------------------------------------
      const letterS = portalWrapper.querySelector(".letter-S");
      const letterA1 = portalWrapper.querySelector(".letter-A1");
      const letterB = portalWrapper.querySelector(".letter-B");
      const letterR = portalWrapper.querySelector(".letter-R");
      const letterA2 = portalWrapper.querySelector(".letter-A2");
      const letterN = portalWrapper.querySelector(".letter-N");
      const letterG = portalWrapper.querySelector(".letter-G");
      const subtitleEl = portalWrapper.querySelector(".hero-subtitle");

      // Hide scroll indicator quickly on initial scroll
      if (scrollIndicator) {
        mainTl.to(scrollIndicator, { opacity: 0, y: -20, duration: 0.1 }, 0);
      }

      // Subtitle fade and drop
      if (subtitleEl) {
        mainTl.to(
          subtitleEl,
          { opacity: 0, scale: 0.8, filter: "blur(10px)", duration: 0.2 },
          0,
        );
      }

      // Outer letters split outwards violently while scaling up into camera
      if (letterS) {
        mainTl.to(
          letterS,
          {
            xPercent: -180,
            yPercent: -40,
            scale: 12,
            opacity: 0,
            filter: "blur(12px)",
            duration: 0.45,
          },
          0,
        );
      }
      if (letterG) {
        mainTl.to(
          letterG,
          {
            xPercent: 180,
            yPercent: 40,
            scale: 12,
            opacity: 0,
            filter: "blur(12px)",
            duration: 0.45,
          },
          0,
        );
      }
      if (letterA1) {
        mainTl.to(
          letterA1,
          {
            xPercent: -120,
            yPercent: 30,
            scale: 16,
            opacity: 0,
            filter: "blur(8px)",
            duration: 0.45,
          },
          0,
        );
      }
      if (letterN) {
        mainTl.to(
          letterN,
          {
            xPercent: 120,
            yPercent: -30,
            scale: 16,
            opacity: 0,
            filter: "blur(8px)",
            duration: 0.45,
          },
          0,
        );
      }
      if (letterB) {
        mainTl.to(
          letterB,
          {
            xPercent: -60,
            scale: 22,
            opacity: 0,
            filter: "blur(6px)",
            duration: 0.45,
          },
          0,
        );
      }
      if (letterA2) {
        mainTl.to(
          letterA2,
          {
            xPercent: 60,
            scale: 22,
            opacity: 0,
            filter: "blur(6px)",
            duration: 0.45,
          },
          0,
        );
      }
      // Center letter 'R' acts as the primary camera gateway aperture
      if (letterR) {
        mainTl.to(
          letterR,
          { scale: 35, opacity: 0, filter: "blur(20px)", duration: 0.45 },
          0,
        );
      }

      // Portal wrapper overall depth scale (camera moving through)
      mainTl.to(portalWrapper, { scale: 3.5, opacity: 0.1, duration: 0.45 }, 0);

      // ----------------------------------------------------
      // Phase 2: 3D Floating Fest Cards & Energy Particles (30% -> 75%)
      // ----------------------------------------------------
      if (floatingCards) {
        const cards = floatingCards.querySelectorAll(".floating-card-item");

        // Reset visibility
        mainTl.to(floatingCards, { opacity: 1, duration: 0.1 }, 0.25);

        cards.forEach((card, index) => {
          const depthStart = 0.28 + index * 0.08;

          // Spatial fly-through: starting far away in Z, scaling up past viewer
          mainTl.fromTo(
            card,
            {
              scale: 0.2,
              z: -1200,
              opacity: 0,
              filter: "blur(15px)",
            },
            {
              scale: 1.15,
              z: 200,
              opacity: 1,
              filter: "blur(0px)",
              duration: 0.2,
              ease: "power2.out",
            },
            depthStart,
          );

          mainTl.to(
            card,
            {
              scale: 2.2,
              z: 800,
              opacity: 0,
              filter: "blur(12px)",
              duration: 0.15,
              ease: "power2.in",
            },
            depthStart + 0.18,
          );
        });

        // Hide floating container after cards fly by
        mainTl.to(floatingCards, { opacity: 0, duration: 0.1 }, 0.68);
      }

      // ----------------------------------------------------
      // Phase 3: Reveal Story Header (65% -> 100%)
      // ----------------------------------------------------
      if (storyIntro) {
        mainTl.fromTo(
          storyIntro,
          {
            opacity: 0,
            scale: 0.85,
            y: 60,
            filter: "blur(15px)",
          },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.3,
            ease: "power3.out",
          },
          0.65,
        );
      }
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[400vh] bg-[#050508] text-white overflow-hidden"
    >
      {/* Ambient background glowing mesh */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-indigo-900/40 via-purple-600/30 to-pink-500/20 rounded-full blur-[140px] opacity-70 animate-pulse" />
        <div className="absolute bottom-1/3 left-1/3 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[160px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:32px_32px] opacity-40" />
      </div>

      {/* Sticky Full-Viewport Stage */}
      <div
        ref={pinnedSectionRef}
        className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden z-10"
        style={{ perspective: "1200px" }}
      >
        {/* TOP BRANDING ACCENT */}
        <div className="absolute top-8 left-6 md:left-12 right-6 md:right-12 flex justify-between items-center z-30 pointer-events-none">
          <div className="flex items-center space-x-3">
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
            <span className="text-xs font-mono tracking-widest text-indigo-300 uppercase">
              Sabrang 2025 • JKLU Jaipur
            </span>
          </div>
          <div className="hidden sm:block text-xs font-mono tracking-widest text-white/40 uppercase">
            [ Spatial Fest Portal ]
          </div>
        </div>

        {/* HERO PORTAL TYPOGRAPHY */}
        <div
          ref={portalWrapperRef}
          className="relative z-20 w-full flex flex-col items-center justify-center pointer-events-none"
        >
          <SabrangLetterPortal />

          <div className="hero-subtitle mt-6 md:mt-10 text-center px-4">
            <p className="text-sm md:text-xl font-medium tracking-widest text-white/70 uppercase">
              The Grandest Cultural & Techno-Management Fest of Rajasthan
            </p>
          </div>
        </div>

        {/* 3D FLOATING FEST MOMENT CARDS (INSIDE THE PORTAL) */}
        <div
          ref={floatingCardsRef}
          className="absolute inset-0 z-20 pointer-events-none opacity-0"
        >
          <FestivalFloatingCards />
        </div>

        {/* EMERGING ABOUT STORY INTRO (PHASE 3) */}
        <div
          ref={storyIntroRef}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto opacity-0 pointer-events-auto"
        >
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-950/40 backdrop-blur-md text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6">
            <span>Discover The Realm</span>
          </div>

          <h2 className="text-4xl md:text-7xl font-black tracking-tight text-white uppercase leading-none mb-6">
            Where Passion Meets <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              The Spectacle
            </span>
          </h2>

          <p className="text-lg md:text-2xl text-slate-300 max-w-2xl font-light leading-relaxed mb-8">
            Sabrang is not just an event—it is a living pulse of artistic
            expression, high-stakes competition, and legendary nights at JK
            Lakshmipat University.
          </p>

          <div className="flex items-center gap-4 text-xs font-mono text-indigo-400/80">
            <span>SCROLL DOWN TO EXPLORE</span>
            <svg
              className="w-4 h-4 animate-bounce"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </div>

        {/* BOTTOM SCROLL INDICATOR (INITIAL VIEW) */}
        <div
          ref={scrollIndicatorRef}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center space-y-3 pointer-events-none"
        >
          <span className="text-[10px] font-mono tracking-widest text-white/50 uppercase">
            Scroll to Enter Sabrang
          </span>
          <div className="w-6 h-10 rounded-full border border-white/20 p-1 flex justify-center items-start">
            <div className="w-1.5 h-2.5 bg-indigo-400 rounded-full animate-bounce mt-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
