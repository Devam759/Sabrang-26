"use client";

/**
 * AboutHero — Sabrang About Page Hero
 *
 * SCROLL CHOREOGRAPHY:
 *   1. Initial State: "ABOUT SABRANG" starts fixed in upper position with tagline & glowing aura.
 *   2. Image Entry: Second section image smoothly rises from below into the main visual area under the heading.
 *   3. Simultaneous Climax:
 *      - The image gradually fades out to opacity 0.
 *      - AT THE SAME TIME, "ABOUT SABRANG" smoothly glides from the upper position down into the EXACT CENTER of the viewport.
 *   4. 3D Per-Letter Spatial Trajectory & Core Spectrum Handover:
 *      - Once centered and focused, each letter explodes along its unique 3D spatial trajectory into the camera.
 *      - The sequence seamlessly dissolves into the Core Spectrum section.
 */

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// ── SSR-safe Three.js canvas ──────────────────────────────────────────────────
const HeroColoursOverBlack = dynamic(() => import("./HeroColoursOverBlack"), {
  ssr: false,
  loading: () => (
    <div style={{ position: "absolute", inset: 0, background: "#000000" }} />
  ),
});

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
  { x: -160, y: -50, z: 1100, rotateX: -20, rotateY: -10, rotateZ: 2, scale: 5.5 },
  // S (5)
  { x: -60, y: 30, z: 1250, rotateX: 12, rotateY: -5, rotateZ: -3, scale: 6.2 },
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

// ─── Component ────────────────────────────────────────────────────────────────
export default function AboutHero() {
  // Scroll wrappers
  const wrapperRef = useRef<HTMLDivElement>(null); // Scroll runway
  const stageRef = useRef<HTMLDivElement>(null); // Pinned 100vh viewport

  // Shared ref for Three.js background
  const scrollProgressRef = useRef<number>(0);

  // DOM elements
  const titleWrapperRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const imageSectionRef = useRef<HTMLDivElement>(null);
  const curtainRef = useRef<HTMLDivElement>(null);
  const scrollIndRef = useRef<HTMLDivElement>(null);

  // ── Page-load entrance animation ──────────────────────────────────────────
  useEffect(() => {
    const stage = stageRef.current;
    const heading = headingRef.current;
    const tagline = taglineRef.current;
    const ind = scrollIndRef.current;
    const imageSection = imageSectionRef.current;
    if (!stage || !heading) return;

    const ctx = gsap.context(() => {
      const letters = heading.querySelectorAll<HTMLElement>(".hero-letter");

      // 1. Staggered letter entrance animation for top heading
      gsap.fromTo(
        letters,
        { y: 45, opacity: 0, scale: 0.9 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          stagger: 0.05,
          duration: 1.0,
          ease: "power3.out",
          delay: 0.2,
        },
      );

      // 2. Showcase image is displayed already on page load
      if (imageSection) {
        gsap.fromTo(
          imageSection,
          { opacity: 0, y: 30, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1.1,
            ease: "power3.out",
            delay: 0.35,
          },
        );
      }

      // 3. Tagline fades in
      if (tagline) {
        gsap.fromTo(
          tagline,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power2.out", delay: 0.8 },
        );
      }

      // 4. Scroll indicator fades in
      if (ind) {
        gsap.fromTo(
          ind,
          { opacity: 0 },
          { opacity: 1, duration: 0.6, delay: 1.2 },
        );
      }
    }, stage);

    return () => ctx.revert();
  }, []);

  // ── GSAP ScrollTrigger master timeline ──────────────────────────────────────
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const stage = stageRef.current;
    const titleWrapper = titleWrapperRef.current;
    const heading = headingRef.current;
    const tagline = taglineRef.current;
    const imageSection = imageSectionRef.current;
    const curtain = curtainRef.current;
    const ind = scrollIndRef.current;

    if (!wrapper || !stage || !titleWrapper || !heading || !imageSection) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.refresh();

      // Master Timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapper,
          start: "top top",
          end: "bottom bottom",
          pin: stage,
          scrub: 1.2, // Smooth interpolation linked to scroll
          anticipatePin: 1,
          onUpdate: (self) => {
            scrollProgressRef.current = self.progress;
          },
        },
      });

      const isMobile = window.innerWidth < 768;
      const upperY = isMobile ? "-22vh" : "-26vh";
      const factor = isMobile ? 0.55 : 1.0;

      // 1. Initial State at Scroll = 0:
      // - Heading is in upper position
      // - Showcase image is already displayed underneath it
      gsap.set(titleWrapper, { y: upperY, scale: 1 });
      gsap.set(imageSection, { yPercent: 0, opacity: 1, scale: 1, y: 0 });

      // ── Step 0: Scroll indicator exits on scroll start (0.00 → 0.06) ─────
      if (ind) {
        tl.to(ind, { opacity: 0, y: -10, duration: 0.06 }, 0);
      }

      // ── Step 1: SIMULTANEOUS TRANSITION (0.02 → 0.46) ───────────────────────
      // - The displayed image smoothly fades out and disappears
      tl.to(
        imageSection,
        {
          opacity: 0,
          scale: 0.94,
          y: -28,
          duration: 0.44,
          ease: "power2.inOut",
        },
        0.02,
      );

      // - Simultaneously: ABOUT SABRANG heading smoothly descends to exact center (y: 0)
      tl.to(
        titleWrapper,
        {
          y: "0vh",
          scale: isMobile ? 1.05 : 1.08,
          duration: 0.44,
          ease: "power2.inOut",
        },
        0.02,
      );

      if (tagline) {
        tl.to(
          tagline,
          {
            opacity: 1,
            scale: 1.02,
            duration: 0.44,
            ease: "power2.inOut",
          },
          0.02,
        );
      }

      // ── Step 2: Centered Focus Moment (0.46 → 0.60) ─────────────────────────
      // Heading rests centered on screen with vibrant fluid background colors

      // ── Step 3: 3D LETTERS ZOOM-THROUGH INTO CAMERA (0.60 → 0.88) ───────────
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
            duration: 0.28,
            ease: "power2.in",
            transformOrigin: "center center",
          },
          0.60,
        );
      });

      // Tagline dissolves
      if (tagline) {
        tl.to(
          tagline,
          {
            opacity: 0,
            y: -15,
            duration: 0.18,
            ease: "power2.in",
          },
          0.60,
        );
      }

      // ── Step 4: Seamless Handover Curtain to Core Spectrum (0.75 → 1.00) ───
      if (curtain) {
        tl.fromTo(
          curtain,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.25,
            ease: "power1.inOut",
          },
          0.75,
        );
      }
    }, wrapper);

    return () => ctx.revert();
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div ref={wrapperRef} style={{ height: "350vh", background: "transparent" }}>
      {/* Pinned 100vh stage */}
      <div
        ref={stageRef}
        style={{
          position: "relative",
          width: "100%",
          height: "100vh",
          overflow: "hidden",
          background: "transparent",
          contain: "paint",
        }}
      >
        {/* Layer 1: Deep atmospheric texture — soft edge vignette */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            pointerEvents: "none",
            background:
              "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 55%, rgba(0,0,0,0.65) 100%)",
          }}
        />


        {/* ═════════════════════════════════════════════════════════════════════
            Layer 20: SECOND SECTION ENLARGED CINEMATIC IMAGE VISUAL
            Rises from below into the main area under the upper heading, then fades out.
        ═════════════════════════════════════════════════════════════════════ */}
        <div
          ref={imageSectionRef}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 4vw 40px",
            pointerEvents: "none",
            willChange: "transform, opacity",
          }}
        >
          {/* Enlarged Cinematic Showcase Image */}
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "min(88vw, 960px)",
              aspectRatio: "16 / 9",
              maxHeight: "clamp(300px, 48vh, 480px)",
              borderRadius: "24px",
              overflow: "hidden",
              border: "1.5px solid rgba(255, 255, 255, 0.22)",
              boxShadow:
                "0 28px 80px rgba(157, 78, 221, 0.45), 0 0 50px rgba(56, 189, 248, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
              background: "#08060f",
              marginTop: "clamp(70px, 13vh, 120px)",
            }}
          >
            <Image
              src="/menu-scroll-covers/sabrang-live.png"
              alt="Sabrang Live Concert Experience"
              fill
              sizes="(max-width: 768px) 92vw, 85vw"
              style={{ objectFit: "cover" }}
              loading="eager"
              fetchPriority="high"
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to top, rgba(3,0,5,0.6) 0%, transparent 60%)",
              }}
            />
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════
            Layer 30: "ABOUT SABRANG" 3D EDITORIAL TYPOGRAPHY
            Starts in UPPER position.
            When image fades out, smoothly glides down into the EXACT CENTER.
            Before unpinning, letters explode along 3D trajectories into the camera.
        ═════════════════════════════════════════════════════════════════════ */}
        <div
          ref={titleWrapperRef}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 30,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            perspective: "1200px",
            perspectiveOrigin: "50% 50%",
            transformStyle: "preserve-3d",
            willChange: "transform, opacity",
          }}
        >
          {/* Primary word — Syne Display font with signature glow */}
          <div
            ref={headingRef}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.04em",
              fontFamily: '"Syne", "Outfit", "Inter", sans-serif',
              fontWeight: 850,
              fontSize: "clamp(2.2rem, 7.5vw, 7.2rem)",
              letterSpacing: "-0.01em",
              lineHeight: 1,
              userSelect: "none",
              transformStyle: "preserve-3d",
            }}
          >
            {"ABOUT SABRANG".split("").map((char, i) =>
              char === " " ? (
                <span
                  key={i}
                  style={{ width: "0.32em", display: "inline-block" }}
                >
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
                      "0 0 24px rgba(255, 255, 255, 0.8), 0 0 45px rgba(56, 189, 248, 0.6), 0 4px 20px rgba(0,0,0,0.9)",
                    transformStyle: "preserve-3d",
                    backfaceVisibility: "hidden",
                    willChange: "transform, opacity",
                  }}
                >
                  {char}
                </span>
              ),
            )}
          </div>

          {/* Subtitle / Tagline below the editorial title */}
          <p
            ref={taglineRef}
            style={{
              margin: "20px 0 0",
              opacity: 0,
              fontFamily: '"Inter", sans-serif',
              fontWeight: 600,
              fontSize: "clamp(0.55rem, 0.95vw, 0.75rem)",
              letterSpacing: "0.36em",
              color: "rgba(255,255,255,0.85)",
              textShadow: "0 2px 10px rgba(0,0,0,0.9)",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              userSelect: "none",
              willChange: "transform, opacity",
            }}
          >
            JKLU JAIPUR&nbsp;&nbsp;·&nbsp;&nbsp;OCT 2026
          </p>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════
            Layer 50: Seamless Handover Curtain to Core Spectrum (#030206)
        ═════════════════════════════════════════════════════════════════════ */}
        <div
          ref={curtainRef}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 50,
            pointerEvents: "none",
            background:
              "linear-gradient(to bottom, transparent 0%, rgba(3,2,6,0.7) 50%, #030206 100%)",
            opacity: 0,
            willChange: "opacity",
          }}
        />

        {/* Scroll indicator */}
        <div
          ref={scrollIndRef}
          style={{
            position: "absolute",
            bottom: 28,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 60,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            opacity: 0,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width: 20,
              height: 32,
              borderRadius: 10,
              border: "1.5px solid rgba(255,255,255,0.18)",
              display: "flex",
              justifyContent: "center",
              paddingTop: 6,
            }}
          >
            <div className="sd-dot" />
          </div>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "0.58rem",
              letterSpacing: "0.24em",
              color: "rgba(255,255,255,0.32)",
              textTransform: "uppercase",
            }}
          >
            Scroll
          </span>
        </div>
      </div>

      <style>{`
        .sd-dot {
          width: 3px;
          height: 5px;
          border-radius: 2px;
          background: rgba(255,255,255,0.45);
          animation: sdBounce 1.6s ease-in-out infinite;
        }
        @keyframes sdBounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(8px); }
        }
      `}</style>
    </div>
  );
}
