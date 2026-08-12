"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import dynamic from "next/dynamic";
import SabrangLetterPortal from "./SabrangLetterPortal";
import FestivalFloatingCards from "./FestivalFloatingCards";

// Dynamically import Three.js Canvas with SSR disabled
const ShopifyStyle3DCanvas = dynamic(() => import("./ShopifyStyle3DCanvas"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#050508]" />,
});

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function SabrangShopifyHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinnedStageRef = useRef<HTMLDivElement>(null);
  const portalTypographyRef = useRef<HTMLDivElement>(null);
  const canvas3DRef = useRef<HTMLDivElement>(null);
  const floatingCardsRef = useRef<HTMLDivElement>(null);
  const storyIntroRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    const pinnedStage = pinnedStageRef.current;
    const portalTypography = portalTypographyRef.current;
    const canvas3D = canvas3DRef.current;
    const floatingCards = floatingCardsRef.current;
    const storyIntro = storyIntroRef.current;
    const scrollIndicator = scrollIndicatorRef.current;

    if (!container || !pinnedStage || !portalTypography) return;

    ScrollTrigger.refresh();

    const ctx = gsap.context(() => {
      // Main Master Pinned Timeline (400vh scroll height)
      const mainTl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "bottom bottom",
          pin: pinnedStage,
          scrub: 0.6, // Silky smooth scrub interpolation
          onUpdate: (self) => {
            setProgress(self.progress);
          },
        },
      });

      // ----------------------------------------------------
      // Phase 1: Spatial Zoom & Letter Portal Split (0 -> 45%)
      // GPU-accelerated transforms without expensive CSS blur filters
      // ----------------------------------------------------
      const letterS = portalTypography.querySelector(".letter-S");
      const letterA1 = portalTypography.querySelector(".letter-A1");
      const letterB = portalTypography.querySelector(".letter-B");
      const letterR = portalTypography.querySelector(".letter-R");
      const letterA2 = portalTypography.querySelector(".letter-A2");
      const letterN = portalTypography.querySelector(".letter-N");
      const letterG = portalTypography.querySelector(".letter-G");
      const subtitle = portalTypography.querySelector(".hero-subtitle");

      if (scrollIndicator) {
        mainTl.to(scrollIndicator, { opacity: 0, y: -20, duration: 0.1 }, 0);
      }

      if (subtitle) {
        mainTl.to(subtitle, { opacity: 0, scale: 0.8, duration: 0.2 }, 0);
      }

      // 3D Canvas zoom-in towards camera
      if (canvas3D) {
        mainTl.to(
          canvas3D,
          { scale: 4, opacity: 0.15, duration: 0.45, ease: "power2.inOut" },
          0,
        );
      }

      // Letterforms split outwards while expanding 20-35x in Z perspective
      if (letterS)
        mainTl.to(
          letterS,
          {
            xPercent: -200,
            yPercent: -50,
            scale: 14,
            opacity: 0,
            duration: 0.45,
          },
          0,
        );
      if (letterG)
        mainTl.to(
          letterG,
          {
            xPercent: 200,
            yPercent: 50,
            scale: 14,
            opacity: 0,
            duration: 0.45,
          },
          0,
        );
      if (letterA1)
        mainTl.to(
          letterA1,
          {
            xPercent: -130,
            yPercent: 35,
            scale: 18,
            opacity: 0,
            duration: 0.45,
          },
          0,
        );
      if (letterN)
        mainTl.to(
          letterN,
          {
            xPercent: 130,
            yPercent: -35,
            scale: 18,
            opacity: 0,
            duration: 0.45,
          },
          0,
        );
      if (letterB)
        mainTl.to(
          letterB,
          { xPercent: -75, scale: 24, opacity: 0, duration: 0.45 },
          0,
        );
      if (letterA2)
        mainTl.to(
          letterA2,
          { xPercent: 75, scale: 24, opacity: 0, duration: 0.45 },
          0,
        );
      if (letterR)
        mainTl.to(letterR, { scale: 40, opacity: 0, duration: 0.45 }, 0);

      mainTl.to(
        portalTypography,
        { scale: 4, opacity: 0.05, duration: 0.45 },
        0,
      );

      // ----------------------------------------------------
      // Phase 2: 3D Floating Cards & Energy Moments (28% -> 72%)
      // ----------------------------------------------------
      if (floatingCards) {
        const cards = floatingCards.querySelectorAll(".floating-card-item");
        mainTl.to(floatingCards, { opacity: 1, duration: 0.1 }, 0.25);

        cards.forEach((card, idx) => {
          const startT = 0.28 + idx * 0.08;

          mainTl.fromTo(
            card,
            { scale: 0.2, opacity: 0 },
            { scale: 1.15, opacity: 1, duration: 0.2, ease: "power2.out" },
            startT,
          );

          mainTl.to(
            card,
            { scale: 2.2, opacity: 0, duration: 0.15, ease: "power2.in" },
            startT + 0.18,
          );
        });

        mainTl.to(floatingCards, { opacity: 0, duration: 0.1 }, 0.68);
      }

      // ----------------------------------------------------
      // Phase 3: Story Reveal Header (65% -> 100%)
      // ----------------------------------------------------
      if (storyIntro) {
        mainTl.fromTo(
          storyIntro,
          { opacity: 0, scale: 0.9, y: 50 },
          { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: "power3.out" },
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
      {/* Background Volumetric Glow */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140vw] h-[85vh] rounded-b-[100%] bg-gradient-to-b from-indigo-900/40 via-purple-900/20 to-transparent opacity-70" />
      </div>

      {/* 3D WebGL Canvas Layer (Three.js Refractive Torus + Particle Rain) */}
      <div
        ref={canvas3DRef}
        className="absolute inset-0 z-0 pointer-events-auto"
      >
        <ShopifyStyle3DCanvas />
      </div>

      {/* Sticky Viewport Stage */}
      <div
        ref={pinnedStageRef}
        className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden z-10"
        style={{ perspective: "1200px" }}
      >
        {/* SHOPIFY-STYLE MONOSPACE BRANDING HEADER */}
        <div className="absolute top-6 left-6 md:left-12 right-6 md:right-12 flex justify-between items-center z-30 pointer-events-none">
          <div className="flex items-center space-x-3 bg-black/50 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/15 shadow-xl">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-[11px] font-mono tracking-widest text-cyan-200 uppercase">
              Sabrang Editions • Spring '25
            </span>
          </div>

          <div className="hidden sm:flex items-center space-x-3 bg-black/50 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/15 shadow-xl">
            <span className="text-[11px] font-mono tracking-widest text-white/70 uppercase">
              [ SPATIAL FEST CANVAS ]
            </span>
          </div>
        </div>

        {/* HERO PORTAL TYPOGRAPHY */}
        <div
          ref={portalTypographyRef}
          className="relative z-20 w-full flex flex-col items-center justify-center pointer-events-none"
        >
          <SabrangLetterPortal />

          <div className="hero-subtitle mt-6 md:mt-10 text-center px-4 max-w-3xl">
            <p className="text-xs sm:text-base md:text-xl font-semibold tracking-[0.2em] text-white/90 uppercase drop-shadow-md">
              The Grandest Cultural & Techno-Management Festival of Rajasthan •
              JKLU Jaipur
            </p>
          </div>
        </div>

        {/* 3D FLOATING GALLERY CARDS (PORTAL FLY-THROUGH) */}
        <div
          ref={floatingCardsRef}
          className="absolute inset-0 z-20 pointer-events-none opacity-0"
        >
          <FestivalFloatingCards />
        </div>

        {/* REVEAL ABOUT STORY HEADER (PHASE 3) */}
        <div
          ref={storyIntroRef}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto opacity-0 pointer-events-auto"
        >
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full border border-indigo-500/40 bg-indigo-950/60 backdrop-blur-xl text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6 shadow-xl">
            <span>Discover The Realm</span>
          </div>

          <h2 className="text-4xl md:text-7xl font-black tracking-tight text-white uppercase leading-none mb-6">
            Where Passion Meets <br />
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-pink-400 bg-clip-text text-transparent">
              The Spectacle
            </span>
          </h2>

          <p className="text-lg md:text-2xl text-slate-200 max-w-2xl font-light leading-relaxed mb-8">
            Sabrang is not just an event—it is a living pulse of artistic
            expression, high-stakes competition, and legendary nights at JK
            Lakshmipat University.
          </p>

          <div className="flex items-center gap-4 text-xs font-mono text-cyan-300">
            <span>SCROLL DOWN TO EXPLORE STORY</span>
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

        {/* BOTTOM SCROLL INDICATOR */}
        <div
          ref={scrollIndicatorRef}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center space-y-2 pointer-events-none"
        >
          <span className="text-[10px] font-mono tracking-widest text-white/70 uppercase">
            Scroll to Enter Sabrang
          </span>
          <div className="w-5 h-9 rounded-full border border-white/30 p-1 flex justify-center items-start bg-black/30 backdrop-blur-md">
            <div className="w-1.5 h-2.5 bg-cyan-400 rounded-full animate-bounce mt-0.5" />
          </div>
        </div>
      </div>
    </div>
  );
}
