'use client';

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

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// ── SSR-safe Three.js canvas ──────────────────────────────────────────────────
const HeroTunnelScene = dynamic(() => import('./HeroTunnelScene'), {
  ssr: false,
  loading: () => <div style={{ position: 'absolute', inset: 0, background: '#080809' }} />,
});

// ── Gallery ────────────────────────────────────────────────────────────────────
const GALLERY = [
  '/gallery/DSC00024.webp',
  '/gallery/121A0025.webp',
  '/gallery/DSC02686.webp',
  '/gallery/DSC09000.webp',
  '/gallery/121A0057.webp',
  '/gallery/DSC01910.webp',
  '/gallery/DSC_0192.webp',
  '/gallery/121A0094.webp',
];

// ─── 3D Per-Letter Trajectories for Scroll Zoom-Through ────────────────────────
// Defines individual 3D perspective paths for S-A-B-R-A-N-G as user scrolls.
const LETTER_CONFIGS = [
  // S (0) — flies left & forward, counter-clockwise tilt
  { x: -380, y: -40,  z: 550, rotateX: 12,  rotateY: -32, rotateZ: -12, scale: 3.6 },
  // A (1) — flies up-left & forward
  { x: -200, y: -140, z: 750, rotateX: 24,  rotateY: -18, rotateZ: -8,  scale: 4.2 },
  // B (2) — flies forward-center, tilting up
  { x: -60,  y: -50,  z: 950, rotateX: -18, rotateY: -10, rotateZ: 5,   scale: 5.2 },
  // R (3) — flies dead-center deep forward past camera lens
  { x: 0,    y: 20,   z: 1250, rotateX: 15,  rotateY: 15,  rotateZ: -6,  scale: 6.5 },
  // A (4) — flies up-right & forward
  { x: 110,  y: -100, z: 850, rotateX: -16, rotateY: 18,  rotateZ: 7,   scale: 4.8 },
  // N (5) — flies down-right & forward
  { x: 240,  y: 130,  z: 680, rotateX: -22, rotateY: 26,  rotateZ: 11,  scale: 4.0 },
  // G (6) — flies right & forward, clockwise tilt
  { x: 410,  y: 40,   z: 520, rotateX: 14,  rotateY: 36,  rotateZ: 16,  scale: 3.5 },
];

// Resting tilt per letter (set to 0 for perfectly straight typography)
const RESTING_TILTS = [0, 0, 0, 0, 0, 0, 0];

// ─── Component ────────────────────────────────────────────────────────────────
export default function AboutHero() {
  // Scroll wrappers
  const wrapperRef = useRef<HTMLDivElement>(null); // 520vh scroll space
  const stageRef   = useRef<HTMLDivElement>(null); // pinned 100vh viewport

  // Shared ref: GSAP writes it, R3F useFrame reads it every frame.
  const scrollProgressRef = useRef<number>(0);

  // DOM elements GSAP animates
  const titleRef     = useRef<HTMLDivElement>(null);
  const galleryRef   = useRef<HTMLDivElement>(null);
  const storyRef     = useRef<HTMLDivElement>(null);
  const curtainRef   = useRef<HTMLDivElement>(null);
  const scrollIndRef = useRef<HTMLDivElement>(null);

  // ── Page-load entrance animation + float suspension ─────────────────────────
  useEffect(() => {
    const stage = stageRef.current;
    const title = titleRef.current;
    const ind   = scrollIndRef.current;
    if (!stage || !title) return;

    const ctx = gsap.context(() => {
      const letters = title.querySelectorAll<HTMLElement>('.hero-letter');

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
          ease: 'power3.out',
          delay: 0.35,
          onComplete: () => {
            // 2. Continuous floating suspension motion per letter
            // Wrapped in ctx.add so GSAP context tracks and reverts these tweens
            ctx.add(() => {
              letters.forEach((el, i) => {
                gsap.to(el, {
                  y: (i % 2 === 0 ? -1 : 1) * (3.5 + (i % 3) * 1.5),
                  duration: 2.8 + i * 0.35,
                  repeat: -1,
                  yoyo: true,
                  ease: 'sine.inOut',
                });
              });
            });
          },
        }
      );

      // Tagline fades in after letters settle
      const tagline = title.querySelector('.hero-tagline');
      if (tagline) {
        gsap.fromTo(
          tagline,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out', delay: 1.2 }
        );
      }

      // Scroll indicator
      if (ind) {
        gsap.fromTo(ind, { opacity: 0 }, { opacity: 1, duration: 0.7, delay: 1.8 });
      }
    }, stage);

    return () => ctx.revert();
  }, []);

  // ── GSAP ScrollTrigger master timeline ──────────────────────────────────────
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const stage   = stageRef.current;
    const title   = titleRef.current;
    const gallery = galleryRef.current;
    const story   = storyRef.current;
    const curtain = curtainRef.current;
    const ind     = scrollIndRef.current;

    if (!wrapper || !stage || !title) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.refresh();

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapper,
          start: 'top top',
          end:   'bottom bottom',
          pin:   stage,
          scrub: 1.0, // 1s inertia momentum matching Shopify reference
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
      const letters = title.querySelectorAll<HTMLElement>('.hero-letter');
      const isMobile = window.innerWidth < 768;
      const factor   = isMobile ? 0.55 : 1.0;

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
            ease: 'power2.in',
            transformOrigin: 'center center',
          },
          0
        );
      });

      // Tagline fades out early in scroll (fromTo for 100% bi-directional scroll)
      const tagline = title.querySelector('.hero-tagline');
      if (tagline) {
        tl.fromTo(
          tagline,
          { opacity: 1, y: 0 },
          { opacity: 0, y: -20, duration: 0.15 },
          0
        );
      }

      // ── PHASE 2: Story Intro Text Fade In (35% → 72%) ─────────────────────
      if (story) {
        tl.fromTo(
          story.querySelectorAll<HTMLElement>('.story-el'),
          { opacity: 0, y: 40, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.25, ease: 'power3.out', stagger: 0.06 },
          0.35
        );
      }

      // ── PHASE 3: Seamless Transition to Next Page Section (75% → 100%) ────
      if (story) {
        tl.to(
          story.querySelectorAll<HTMLElement>('.story-el'),
          { opacity: 0, y: -45, scale: 1.08, duration: 0.20, ease: 'power2.in' },
          0.78
        );
      }

      if (curtain) {
        tl.fromTo(
          curtain,
          { yPercent: 100, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.22, ease: 'power2.inOut' },
          0.78
        );
      }
    }, wrapper);

    return () => ctx.revert();
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div ref={wrapperRef} style={{ height: '240vh', background: '#080809' }}>

      {/* Pinned 100vh stage */}
      <div
        ref={stageRef}
        style={{
          position: 'relative',
          width:    '100%',
          height:   '100vh',
          overflow: 'hidden',
          background: '#080809',
        }}
      >

        {/* Layer 0: Three.js particle tunnel */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <HeroTunnelScene scrollProgress={scrollProgressRef} />
        </div>

        {/* Layer 1: Ambient radial glow */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset:    0,
            zIndex:   2,
            pointerEvents: 'none',
            background: 'radial-gradient(ellipse 42% 36% at 50% 50%, rgba(55,95,255,0.07) 0%, transparent 70%)',
          }}
        />

        {/* Layer 2: Radial vignette */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset:    0,
            zIndex:   3,
            pointerEvents: 'none',
            background: 'radial-gradient(ellipse 75% 65% at 50% 50%, transparent 20%, rgba(6,6,8,0.82) 100%)',
          }}
        />

        {/* Layer 3: Film grain overlay */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset:    0,
            zIndex:   4,
            pointerEvents: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.10'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize:   '220px 220px',
            mixBlendMode:     'overlay',
            opacity:          0.72,
          }}
        />

        {/* Layer 5: Corner nav labels */}
        <div
          style={{
            position:       'absolute',
            top: 0, left: 0, right: 0,
            zIndex:         60,
            display:        'flex',
            justifyContent: 'space-between',
            padding:        '18px 28px',
            pointerEvents:  'none',
          }}
        >
          <span style={CORNER_LABEL}>Sabrang — About</span>
          <span style={CORNER_LABEL}>2025 Edition</span>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════
            Layer 10: 3D EDITORIAL TYPOGRAPHY "SABRANG"
            3D perspective container allowing letters to curve through space.
        ═════════════════════════════════════════════════════════════════════ */}
        <div
          ref={titleRef}
          style={{
            position:          'absolute',
            inset:             0,
            zIndex:            10,
            display:           'flex',
            flexDirection:     'column',
            alignItems:        'center',
            justifyContent:    'center',
            pointerEvents:     'none',
            perspective:       '1200px',
            perspectiveOrigin: '50% 50%',
            transformStyle:    'preserve-3d',
            willChange:        'transform',
          }}
        >
          {/* Primary word — 7 individually animated 3D letter spans */}
          <div
            style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            '0.04em',
              fontFamily:     '"Syne", "Outfit", "Inter", sans-serif',
              fontWeight:     850,
              fontSize:       'clamp(3.5rem, 14.5vw, 13.5rem)',
              letterSpacing:  '-0.02em',
              lineHeight:     1,
              userSelect:     'none',
              transformStyle: 'preserve-3d',
            }}
          >
            {'SABRANG'.split('').map((char, i) => (
              <span
                key={i}
                className="hero-letter"
                style={{
                  display:            'inline-block',
                  color:              '#fcfcff',
                  textShadow:         '0 8px 36px rgba(0,0,0,0.85), 0 0 25px rgba(255,255,255,0.08)',
                  transformStyle:     'preserve-3d',
                  backfaceVisibility: 'hidden',
                  willChange:         'transform, opacity',
                }}
              >
                {char}
              </span>
            ))}
          </div>

          {/* Subtitle / Tagline below the editorial title */}
          <p
            className="hero-tagline"
            style={{
              margin:        '26px 0 0',
              opacity:       0,
              fontFamily:    '"Inter", sans-serif',
              fontWeight:    500,
              fontSize:      'clamp(0.55rem, 1vw, 0.75rem)',
              letterSpacing: '0.36em',
              color:         'rgba(255,255,255,0.78)',
              textShadow:    '0 2px 10px rgba(0,0,0,0.9)',
              textTransform: 'uppercase',
              whiteSpace:    'nowrap',
              userSelect:    'none',
            }}
          >
            All Shades of Creativity&nbsp;&nbsp;·&nbsp;&nbsp;JKLU Jaipur&nbsp;&nbsp;·&nbsp;&nbsp;2025
          </p>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════
            Layer 50: Page Transition Curtain Overlay (Wipes up into next section)
        ═════════════════════════════════════════════════════════════════════ */}
        <div
          ref={curtainRef}
          style={{
            position:      'absolute',
            inset:         0,
            zIndex:        50,
            pointerEvents: 'none',
            background:    'linear-gradient(to bottom, transparent 0%, rgba(5,5,8,0.95) 40%, #050508 100%)',
            borderTop:     '1px solid rgba(56, 189, 248, 0.25)',
            willChange:    'transform, opacity',
          }}
        />

        {/* Layer 30: Story intro text */}
        <div
          ref={storyRef}
          style={{
            position:       'absolute',
            inset:          0,
            zIndex:         30,
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            20,
            padding:        '0 24px',
            textAlign:      'center',
            pointerEvents:  'none',
          }}
        >
          <p
            className="story-el"
            style={{
              margin:        0,
              opacity:       0,
              fontFamily:    'monospace',
              fontSize:      'clamp(0.52rem, 0.85vw, 0.68rem)',
              letterSpacing: '0.28em',
              color:         'rgba(255,255,255,0.32)',
              textTransform: 'uppercase',
            }}
          >
            Sabrang · About
          </p>

          <h2
            className="story-el"
            style={{
              margin:        0,
              opacity:       0,
              fontFamily:    '"Syne", "Outfit", "Inter", sans-serif',
              fontWeight:    800,
              fontSize:      'clamp(2.2rem, 5.2vw, 4.8rem)',
              letterSpacing: '-0.02em',
              color:         '#ffffff',
              lineHeight:    1.08,
              textTransform: 'uppercase',
              textShadow:    '0 4px 24px rgba(0,0,0,0.95)',
            }}
          >
            Where Passion<br />Becomes Legend
          </h2>

          <p
            className="story-el"
            style={{
              margin:     0,
              opacity:    0,
              fontFamily: '"Inter", sans-serif',
              fontWeight: 400,
              fontSize:   'clamp(0.85rem, 1.35vw, 1.05rem)',
              color:      'rgba(255,255,255,0.48)',
              lineHeight: 1.75,
              maxWidth:   '36ch',
            }}
          >
            The annual flagship cultural and techno-management festival of
            JK Lakshmipat University — three electric days where art,
            technology, and raw talent collide.
          </p>

          <div
            className="story-el"
            style={{ opacity: 0, width: 28, height: 1, background: 'rgba(255,255,255,0.14)' }}
          />
        </div>

        {/* Scroll indicator */}
        <div
          ref={scrollIndRef}
          style={{
            position:       'absolute',
            bottom:         28,
            left:           '50%',
            transform:      'translateX(-50%)',
            zIndex:         60,
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            gap:            9,
            opacity:        0,
            pointerEvents:  'none',
          }}
        >
          <div
            style={{
              width:           20,
              height:          32,
              borderRadius:    10,
              border:          '1.5px solid rgba(255,255,255,0.18)',
              display:         'flex',
              justifyContent:  'center',
              paddingTop:      6,
            }}
          >
            <div className="sd-dot" />
          </div>
          <span
            style={{
              fontFamily:    'monospace',
              fontSize:      '0.58rem',
              letterSpacing: '0.24em',
              color:         'rgba(255,255,255,0.28)',
              textTransform: 'uppercase',
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

// ─── Shared style objects ─────────────────────────────────────────────────────
const CORNER_LABEL: React.CSSProperties = {
  fontFamily:    'monospace',
  fontSize:      '0.62rem',
  letterSpacing: '0.2em',
  color:         'rgba(255,255,255,0.65)',
  textShadow:    '0 1px 6px rgba(0,0,0,0.9)',
  textTransform: 'uppercase',
};
