"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// ─── 3D Per-Letter Trajectories for Spatial Zoom-Through ──────────────────────
const LETTER_CONFIGS = [
  // A (0)
  { x: -520, y: -60, z: 500, rotateX: 15, rotateY: -35, rotateZ: -14, scale: 3.5 },
  // B (1)
  { x: -430, y: -120, z: 650, rotateX: 20, rotateY: -28, rotateZ: -10, scale: 3.8 },
  // O (2)
  { x: -340, y: -40, z: 800, rotateX: 18, rotateY: -22, rotateZ: -6, scale: 4.2 },
  // U (3)
  { x: -250, y: -140, z: 950, rotateX: -15, rotateY: -15, rotateZ: -4, scale: 4.8 },
  // T (4)
  { x: -160, y: 30, z: 1100, rotateX: -18, rotateY: -10, rotateZ: -2, scale: 5.5 },
  // S (5)
  { x: -60, y: 70, z: 1200, rotateX: -20, rotateY: -4, rotateZ: 2, scale: 6.0 },
  // A (6)
  { x: 40, y: -30, z: 1250, rotateX: -12, rotateY: 5, rotateZ: 3, scale: 6.2 },
  // B (7)
  { x: 140, y: 50, z: 1100, rotateX: -18, rotateY: 10, rotateZ: -2, scale: 5.5 },
  // R (8)
  { x: 240, y: -100, z: 950, rotateX: 15, rotateY: 15, rotateZ: 4, scale: 4.8 },
  // A (9)
  { x: 330, y: 40, z: 800, rotateX: -18, rotateY: 22, rotateZ: 6, scale: 4.2 },
  // N (10)
  { x: 420, y: 120, z: 650, rotateX: -20, rotateY: 28, rotateZ: 10, scale: 3.8 },
  // G (11)
  { x: 510, y: 60, z: 500, rotateX: 15, rotateY: 35, rotateZ: 14, scale: 3.5 },
];

export default function AboutHero() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const manifestoRef = useRef<HTMLDivElement>(null);

  // ── Entrance Animation ───────────────────────────────────────────────────
  useEffect(() => {
    const stage = stageRef.current;
    const heading = headingRef.current;
    const tagline = taglineRef.current;
    const manifesto = manifestoRef.current;
    if (!stage || !heading) return;

    const ctx = gsap.context(() => {
      const letters = heading.querySelectorAll<HTMLElement>(".hero-letter");

      // 1. Entrance staggered letters
      if (letters.length > 0) {
        gsap.fromTo(
          letters,
          { y: 50, opacity: 0, scale: 0.9 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            stagger: 0.035,
            duration: 0.9,
            ease: "power3.out",
            delay: 0.15,
          }
        );
      }

      // 2. Tagline entrance
      if (tagline) {
        gsap.fromTo(
          tagline,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power2.out", delay: 0.55 }
        );
      }

      // 3. Manifesto entrance
      if (manifesto) {
        gsap.fromTo(
          manifesto,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power2.out", delay: 0.75 }
        );
      }
    }, stage);

    return () => ctx.revert();
  }, []);

  // ── 3D Zoom-Through Scroll Animation (Perfect Pin & Handover) ─────────────
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const stage = stageRef.current;
    const heading = headingRef.current;
    const tagline = taglineRef.current;
    const manifesto = manifestoRef.current;

    if (!wrapper || !stage || !heading) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.refresh();

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapper,
          start: "top top",
          end: "+=100%", // Exactly 1 viewport of scroll
          pin: stage,
          scrub: true,
          anticipatePin: 1,
        },
      });

      const isMobile = window.innerWidth < 768;
      const factor = isMobile ? 0.55 : 1.0;

      // 1. Tagline and manifesto fade out swiftly on scroll start (0.00 -> 0.25)
      if (tagline) {
        tl.to(tagline, { opacity: 0, y: -20, duration: 0.25, ease: "power1.out" }, 0);
      }
      if (manifesto) {
        tl.to(manifesto, { opacity: 0, y: -20, duration: 0.25, ease: "power1.out" }, 0);
      }

      // 2. 3D Letters zoom through camera across the entire pin distance (0.05 -> 1.00)
      const letters = heading.querySelectorAll<HTMLElement>(".hero-letter");
      letters.forEach((letter, i) => {
        const cfg = LETTER_CONFIGS[i];
        if (!cfg) return;

        tl.fromTo(
          letter,
          {
            x: 0,
            y: 0,
            z: 0,
            rotateX: 0,
            rotateY: 0,
            rotateZ: 0,
            scale: 1,
            opacity: 1,
          },
          {
            x: cfg.x * factor,
            y: cfg.y * factor,
            z: cfg.z * factor,
            rotateX: cfg.rotateX,
            rotateY: cfg.rotateY,
            rotateZ: cfg.rotateZ,
            scale: cfg.scale,
            opacity: 0,
            duration: 0.95,
            ease: "power2.inOut",
            transformOrigin: "center center",
          },
          0.05
        );
      });
    }, wrapper);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full h-[100vh]" style={{ background: "transparent" }}>
      {/* Pinned 100vh stage */}
      <div
        ref={stageRef}
        className="relative w-full h-[100vh] flex flex-col items-center justify-center text-center px-6 py-24 select-none overflow-hidden"
        style={{
          background: "transparent",
          contain: "paint",
        }}
      >
        {/* Deep atmospheric vignette */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 45%, transparent 40%, rgba(0,0,0,0.75) 100%)",
          }}
        />

        <div className="max-w-5xl mx-auto flex flex-col items-center space-y-6 z-10">
          {/* Main Syne Display Title with 3D Preserved Perspective */}
          <div
            style={{
              perspective: "1200px",
              perspectiveOrigin: "50% 50%",
              transformStyle: "preserve-3d",
              willChange: "transform",
            }}
          >
            <div
              ref={headingRef}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.04em",
                fontFamily: '"Syne", "Outfit", "Inter", sans-serif',
                fontWeight: 850,
                fontSize: "clamp(2.6rem, 8.5vw, 7.5rem)",
                letterSpacing: "-0.01em",
                lineHeight: 1,
                userSelect: "none",
                transformStyle: "preserve-3d",
              }}
            >
              {"ABOUT SABRANG".split("").map((char, i) =>
                char === " " ? (
                  <span key={i} style={{ width: "0.3em", display: "inline-block" }}>
                    &nbsp;
                  </span>
                ) : (
                  <span
                    key={i}
                    className="hero-letter"
                    style={{
                      display: "inline-block",
                      color: "#ffffff",
                      textShadow:
                        "0 0 28px rgba(255, 255, 255, 0.85), 0 0 50px rgba(56, 189, 248, 0.55), 0 4px 20px rgba(0,0,0,0.9)",
                      transformStyle: "preserve-3d",
                      backfaceVisibility: "hidden",
                      willChange: "transform, opacity",
                    }}
                  >
                    {char}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Subtitle Badge / Tagline */}
          <p
            ref={taglineRef}
            style={{
              opacity: 0,
              fontFamily: '"Inter", sans-serif',
              fontWeight: 600,
              fontSize: "clamp(0.65rem, 1.1vw, 0.85rem)",
              letterSpacing: "0.32em",
              color: "rgba(255,255,255,0.85)",
              textShadow: "0 2px 10px rgba(0,0,0,0.9)",
              textTransform: "uppercase",
              textAlign: "center",
              userSelect: "none",
              willChange: "transform, opacity",
            }}
          >
            THE ANNUAL CULTURAL FESTIVAL OF JKLU&nbsp;&nbsp;·&nbsp;&nbsp;23 - 25 OCTOBER 2026
          </p>

          {/* Story Manifesto Callout */}
          <div
            ref={manifestoRef}
            className="max-w-2xl mt-4 pt-4 border-t border-white/10"
            style={{ opacity: 0 }}
          >
            <p className="text-slate-300 text-sm sm:text-base md:text-lg font-light leading-relaxed">
              Sabrang is the annual cultural festival of JK Lakshmipat University, Jaipur, bringing together music, dance, fashion, art, and youth energy under one grand stage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
