"use client";

/**
 * AboutHero — Sabrang About Page Hero
 *
 * High-end editorial typography + 3D spatial zoom-through hero section.
 *
 * TYPOGRAPHY DESIGN:
 *   - Custom Google Display Typeface ('Cinzel' / 'Bodoni Moda' luxury serif).
 *   - Upper-case SABRANG with refined tracking and high-contrast letterforms.
 *   - Page-load entrance: 7-letter staggered reveal (y: 55 → 0, opacity: 0 → 1)
 *     followed by per-letter continuous atmospheric floating suspension.
 *
 * 3D SCROLL ANIMATION:
 *   - As user scrolls (Phase 1, 0 → 42% progress), each letter explodes along
 *     its own 3D spatial trajectory (x, y, z, rotateX, rotateY, rotateZ, scale).
 *   - The word expands through 3D space toward the camera, creating an immersive
 *     crash-through illusion into the particle tunnel space.
 *   - Phase 2: 4-column festival photo gallery reveal.
 *   - Phase 3: Story intro text.
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

// ── Gallery ────────────────────────────────────────────────────────────────────
const GALLERY = [
  "/events_posters/art.webp",
  "/events_posters/PANACHE.webp",
  "/events_posters/STEPUP.webp",
  "/events_posters/echoesofnoor.webp",
  "/events_posters/bgmi.webp",
  "/events_posters/VERSVAAD.webp",
  "/events_posters/BANDJAM.webp",
  "/events_posters/DANCE_BATTLE.webp",
];

// ─── 3D Per-Letter Trajectories for Scroll Zoom-Through ────────────────────────
// Defines individual 3D perspective paths for A-B-O-U-T S-A-B-R-A-N-G as user scrolls.
const LETTER_CONFIGS = [
  // A (0)
  {
    x: -520,
    y: -60,
    z: 500,
    rotateX: 15,
    rotateY: -35,
    rotateZ: -14,
    scale: 3.5,
  },
  // B (1)
  {
    x: -430,
    y: -120,
    z: 650,
    rotateX: 20,
    rotateY: -28,
    rotateZ: -10,
    scale: 3.8,
  },
  // O (2)
  {
    x: -340,
    y: -40,
    z: 800,
    rotateX: 18,
    rotateY: -22,
    rotateZ: -6,
    scale: 4.2,
  },
  // U (3)
  {
    x: -250,
    y: -140,
    z: 950,
    rotateX: -15,
    rotateY: -15,
    rotateZ: -4,
    scale: 4.8,
  },
  // T (4)
  {
    x: -160,
    y: -50,
    z: 1100,
    rotateX: -20,
    rotateY: -10,
    rotateZ: 2,
    scale: 5.5,
  },
  // S (5)
  { x: -60, y: 30, z: 1250, rotateX: 12, rotateY: -5, rotateZ: -3, scale: 6.2 },
  // A (6)
  { x: 40, y: -30, z: 1250, rotateX: -12, rotateY: 5, rotateZ: 3, scale: 6.2 },
  // B (7)
  {
    x: 140,
    y: 50,
    z: 1100,
    rotateX: -18,
    rotateY: 10,
    rotateZ: -2,
    scale: 5.5,
  },
  // R (8)
  { x: 240, y: -100, z: 950, rotateX: 15, rotateY: 15, rotateZ: 4, scale: 4.8 },
  // A (9)
  { x: 330, y: 40, z: 800, rotateX: -18, rotateY: 22, rotateZ: 6, scale: 4.2 },
  // N (10)
  {
    x: 420,
    y: 120,
    z: 650,
    rotateX: -20,
    rotateY: 28,
    rotateZ: 10,
    scale: 3.8,
  },
  // G (11)
  { x: 510, y: 60, z: 500, rotateX: 15, rotateY: 35, rotateZ: 14, scale: 3.5 },
];

// Resting tilt per letter (set to 0 for perfectly straight typography)
const RESTING_TILTS = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

// ─── Component ────────────────────────────────────────────────────────────────
export default function AboutHero() {
  // Scroll wrappers
  const wrapperRef = useRef<HTMLDivElement>(null); // 520vh scroll space
  const stageRef = useRef<HTMLDivElement>(null); // pinned 100vh viewport

  // Shared ref: GSAP writes it, R3F useFrame reads it every frame.
  const scrollProgressRef = useRef<number>(0);

  // DOM elements GSAP animates
  const titleRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const curtainRef = useRef<HTMLDivElement>(null);
  const scrollIndRef = useRef<HTMLDivElement>(null);

  // ── Page-load entrance animation + float suspension ─────────────────────────
  useEffect(() => {
    const stage = stageRef.current;
    const title = titleRef.current;
    const ind = scrollIndRef.current;
    if (!stage || !title) return;

    const ctx = gsap.context(() => {
      const letters = title.querySelectorAll<HTMLElement>(".hero-letter");

      // 1. Staggered letter entrance animation
      gsap.fromTo(
        letters,
        { y: 55, opacity: 0, scale: 0.85 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          stagger: 0.08,
          duration: 1.25,
          ease: "power3.out",
          delay: 0.35,
        },
      );

      // Tagline fades in after letters settle
      const tagline = title.querySelector(".hero-tagline");
      if (tagline) {
        gsap.fromTo(
          tagline,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.9, ease: "power2.out", delay: 1.2 },
        );
      }

      // Scroll indicator
      if (ind) {
        gsap.fromTo(
          ind,
          { opacity: 0 },
          { opacity: 1, duration: 0.7, delay: 1.8 },
        );
      }
    }, stage);

    return () => ctx.revert();
  }, []);

  // ── GSAP ScrollTrigger master timeline ──────────────────────────────────────
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const stage = stageRef.current;
    const title = titleRef.current;
    const gallery = galleryRef.current;
    const story = storyRef.current;
    const curtain = curtainRef.current;
    const ind = scrollIndRef.current;

    if (!wrapper || !stage || !title) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.refresh();

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapper,
          start: "top top",
          end: "bottom bottom",
          pin: stage,
          scrub: true, // Synced seamlessly with Lenis smooth scroll
          anticipatePin: 1,
          onUpdate: (self) => {
            scrollProgressRef.current = self.progress;
          },
        },
      });

      // ── Immediate: scroll indicator exits ──────────────────────────────────
      if (ind) tl.to(ind, { opacity: 0, y: -12, duration: 0.05 }, 0);

      // ── PHASE 1: 3D Typography Spatial Zoom-Through (0 → 42%) ─────────────
      // Each letter in "SABRANG" accelerates along its unique 3D vector into camera space.
      // Using explicit fromTo ensures scrolling UP smoothly restores opacity and 3D position.
      const letters = title.querySelectorAll<HTMLElement>(".hero-letter");
      const isMobile = window.innerWidth < 768;
      const factor = isMobile ? 0.55 : 1.0;

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
            rotateZ: RESTING_TILTS[i] ?? 0,
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
            duration: 0.42,
            ease: "power2.in",
            transformOrigin: "center center",
          },
          0,
        );
      });

      // Tagline fades out early in scroll (fromTo for 100% bi-directional scroll)
      const tagline = title.querySelector(".hero-tagline");
      if (tagline) {
        tl.fromTo(
          tagline,
          { opacity: 1, y: 0 },
          { opacity: 0, y: -20, duration: 0.15 },
          0,
        );
      }

      // ── PHASE 2: Story Intro Text Fade In (35% → 72%) ─────────────────────
      if (story) {
        tl.fromTo(
          story.querySelectorAll<HTMLElement>(".story-el"),
          { opacity: 0, y: 40, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.25,
            ease: "power3.out",
            stagger: 0.06,
          },
          0.35,
        );
      }

      // ── PHASE 3: Seamless Transition to Next Page Section (75% → 100%) ────
      if (story) {
        tl.to(
          story.querySelectorAll<HTMLElement>(".story-el"),
          { opacity: 0, y: -45, scale: 1.08, duration: 0.2, ease: "power2.in" },
          0.78,
        );
      }

      if (curtain) {
        tl.fromTo(
          curtain,
          { yPercent: 100, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.22, ease: "power2.inOut" },
          0.78,
        );
      }
    }, wrapper);

    return () => ctx.revert();
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div ref={wrapperRef} style={{ height: "240vh", background: "#000000" }}>
      {/* Pinned 100vh stage */}
      <div
        ref={stageRef}
        style={{
          position: "relative",
          width: "100%",
          height: "100vh",
          overflow: "hidden",
          background: "#000000",
          contain: "paint",
        }}
      >
        {/* Layer 0: Three.js "Colours Over Black" 3D Fluid Ribbon Sculpture background */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <HeroColoursOverBlack scrollProgress={scrollProgressRef} />
        </div>

        {/* Layer 1: Deep atmospheric texture — soft edge vignette */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            pointerEvents: "none",
            background:
              "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 60%, rgba(0,0,0,0.55) 100%)",
          }}
        />

        {/* ═════════════════════════════════════════════════════════════════════
            Layer 10: 3D EDITORIAL TYPOGRAPHY "SABRANG"
            3D perspective container allowing letters to curve through space.
        ═════════════════════════════════════════════════════════════════════ */}
        <div
          ref={titleRef}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            perspective: "1200px",
            perspectiveOrigin: "50% 50%",
            transformStyle: "preserve-3d",
            willChange: "transform",
          }}
        >
          {/* Primary word — 7 individually animated 3D letter spans */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.05em",
              fontFamily: '"Syne", "Outfit", "Inter", sans-serif',
              fontWeight: 850,
              fontSize: "clamp(2.0rem, 7.5vw, 7.5rem)",
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
            className="hero-tagline"
            style={{
              margin: "26px 0 0",
              opacity: 0,
              fontFamily: '"Inter", sans-serif',
              fontWeight: 500,
              fontSize: "clamp(0.55rem, 1vw, 0.75rem)",
              letterSpacing: "0.36em",
              color: "rgba(255,255,255,0.78)",
              textShadow: "0 2px 10px rgba(0,0,0,0.9)",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              userSelect: "none",
            }}
          >
            ALL SHADES OF CREATIVITY&nbsp;&nbsp;·&nbsp;&nbsp;JKLU
            JAIPUR&nbsp;&nbsp;·&nbsp;&nbsp;2026
          </p>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════
            Layer 50: Page Transition Curtain Overlay (Wipes up into next section)
        ═════════════════════════════════════════════════════════════════════ */}
        <div
          ref={curtainRef}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 50,
            pointerEvents: "none",
            background:
              "linear-gradient(to bottom, transparent 0%, rgba(5,5,8,0.95) 40%, #050508 100%)",
            borderTop: "1px solid rgba(56, 189, 248, 0.25)",
            willChange: "transform, opacity",
          }}
        />

        {/* Layer 30: Story intro — Split Layout (Image Left, Text Right) */}
        <div
          ref={storyRef}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 5vw",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "clamp(20px, 4vw, 48px)",
              alignItems: "center",
              width: "100%",
              maxWidth: "1100px",
            }}
          >
            {/* LEFT SIDE: Concert Image Showcase */}
            <div
              className="story-el"
              style={{
                opacity: 0,
                position: "relative",
                width: "100%",
                aspectRatio: "16 / 10",
                maxHeight: "340px",
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid rgba(255, 255, 255, 0.16)",
                boxShadow:
                  "0 24px 60px rgba(157, 78, 221, 0.35), 0 0 35px rgba(0, 255, 255, 0.18)",
              }}
            >
              <Image
                src="/menu-scroll-covers/sabrang-live.png"
                alt="Sabrang Live Concert Performance"
                fill
                sizes="(max-width: 768px) 90vw, 45vw"
                style={{ objectFit: "cover" }}
                loading="eager"
                fetchPriority="high"

              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to top, rgba(3,0,5,0.65) 0%, transparent 60%)",
                }}
              />
            </div>

            {/* RIGHT SIDE: Text Content */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                textAlign: "left",
                gap: 16,
              }}
            >
              <p
                className="story-el"
                style={{
                  margin: 0,
                  opacity: 0,
                  fontFamily: "monospace",
                  fontSize: "clamp(0.58rem, 0.9vw, 0.72rem)",
                  letterSpacing: "0.28em",
                  color: "rgba(255,255,255,0.48)",
                  textTransform: "uppercase",
                }}
              >
                Sabrang · About
              </p>

              <h2
                className="story-el"
                style={{
                  margin: 0,
                  opacity: 0,
                  fontFamily: '"Syne", "Outfit", "Inter", sans-serif',
                  fontWeight: 800,
                  fontSize: "clamp(2.0rem, 3.8vw, 3.6rem)",
                  letterSpacing: "-0.02em",
                  color: "#ffffff",
                  lineHeight: 1.1,
                  textTransform: "uppercase",
                  textShadow: "0 4px 24px rgba(0,0,0,0.95)",
                }}
              >
                About Sabrang
              </h2>

              <p
                className="story-el"
                style={{
                  margin: 0,
                  opacity: 0,
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: 400,
                  fontSize: "clamp(0.85rem, 1.15vw, 1.02rem)",
                  color: "rgba(255,255,255,0.85)",
                  lineHeight: 1.68,
                  maxWidth: "46ch",
                }}
              >
                Sabrang isn't just a fest — it's an explosion of talent,
                creativity, and cosmic energy. Over three thrilling days, JKLU
                transforms into a universe of music, dance, art, technology, and
                pure celebration. With a massive prize pool, flagship events,
                celebrity performances, and non-stop entertainment, Sabrang is
                where memories are made and legends are born.
              </p>

              <div
                className="story-el"
                style={{
                  opacity: 0,
                  width: 36,
                  height: 1,
                  background: "rgba(255,255,255,0.22)",
                  marginTop: 4,
                }}
              />
            </div>
          </div>
        </div>

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
            gap: 9,
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
              color: "rgba(255,255,255,0.28)",
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
