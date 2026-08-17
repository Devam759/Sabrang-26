"use client";

/**
 * ThemeInstallation — Shades & Colors of Light
 *
 * A cinematic, scroll-driven digital light installation experience for Sabrang 2026.
 *
 * Conceptual Arc:
 * LIGHT → REFRACTION → COLOR → EXPRESSION → SABRANG
 */

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Prism from "./Prism";

gsap.registerPlugin(ScrollTrigger);

export default function ThemeInstallation() {
  const sectionRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);

  // Overlay DOM phase references
  const p1Ref = useRef<HTMLDivElement>(null);
  const p2Ref = useRef<HTMLDivElement>(null);
  const p3Ref = useRef<HTMLDivElement>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // GSAP ScrollTrigger Scrubbing & Overlay Choreography
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const section = sectionRef.current;
    const trigger = triggerRef.current;
    if (!section || !trigger) return;

    const ctx = gsap.context(() => {
      // Single Master Pinned Timeline — 100% Synchronized with Prism Optics
      const master = gsap.timeline({
        scrollTrigger: {
          trigger: trigger,
          start: "top top",
          end: "+=180%",
          pin: true,
          pinSpacing: true,
          scrub: 0.6,
          onUpdate: (self) => {
            progressRef.current = self.progress;
          },
        },
      });

      // ── PHASE 1 OVERLAY (0.0 to 0.40): Title & White Beam Approach ──
      master
        .fromTo(p1Ref.current, { opacity: 1, y: 0 }, { opacity: 1, y: 0, duration: 0.36 }, 0)
        .to(p1Ref.current, { opacity: 0, y: -20, duration: 0.08 }, 0.38);

      // ── PHASE 2 OVERLAY (0.55 to 0.78): Light Dispersing Inside Prism ──
      master
        .fromTo(p2Ref.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.12 }, 0.55)
        .to(p2Ref.current, { opacity: 0, y: -20, duration: 0.08 }, 0.76);

      // ── PHASE 3 OVERLAY (0.82 to 1.0): Sabrang Spectral Convergence ──
      master
        .fromTo(p3Ref.current, { opacity: 0, scale: 0.95, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: 0.16 }, 0.82);
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="theme-statement"
      className="relative w-full bg-[#000000] text-white overflow-hidden select-none"
    >
      {/* Pinned Viewport Container */}
      <div
        ref={triggerRef}
        className="relative h-screen w-full overflow-hidden flex items-center justify-center"
      >
        {/* Extracted Standalone 2D Canvas Prism Optics Engine */}
        <Prism progressRef={progressRef} className="absolute inset-0 z-0 pointer-events-none" />

        {/* Ambient Film Grain Overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.035]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255, 255, 255, 0.8) 1px, transparent 0)",
            backgroundSize: "4px 4px",
            zIndex: 1,
          }}
          aria-hidden
        />

        {/* ── PHASE 1 OVERLAY: THEME TITLE & INITIAL SOURCE (Visible Immediately at 0% Scroll) ── */}
        <div
          ref={p1Ref}
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none max-w-2xl mx-auto"
          style={{ zIndex: 20, opacity: 1 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/15 text-[10px] font-mono text-cyan-300 tracking-[0.3em] uppercase mb-4 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> SABRANG 2026 · OFFICIAL THEME
          </div>

          <h2
            className="text-3xl sm:text-5xl md:text-6xl font-light text-white tracking-tight leading-[1.1] mb-4"
            style={{ fontFamily: '"Syne", sans-serif' }}
          >
            Shades &amp; Colors <br />
            <span className="font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              of Light
            </span>
          </h2>

          <p
            className="text-slate-300/80 text-xs sm:text-sm font-light leading-relaxed max-w-md"
            style={{ fontFamily: '"Inter", sans-serif' }}
          >
            Before color exists, there is light — undivided, continuous, and full of raw energy. Scroll to experience the optical transformation into Sabrang.
          </p>

          <div className="mt-6 flex items-center gap-3">
            <div className="w-8 h-px bg-cyan-400/40" />
            <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/40">
              Scroll to Refract
            </span>
            <div className="w-8 h-px bg-cyan-400/40" />
          </div>
        </div>

        {/* ── PHASE 2 OVERLAY: REFRACTION & EXPRESSION NARRATIVE ── */}
        <div
          ref={p2Ref}
          className="absolute inset-0 flex flex-col items-start justify-center px-8 sm:px-16 md:px-24 pointer-events-none opacity-0 max-w-lg"
          style={{ zIndex: 10 }}
        >
          <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-purple-400/80 mb-3 block">
            02 · REFRACTION
          </span>

          <h3
            className="text-2xl sm:text-4xl font-light text-white tracking-tight mb-3"
            style={{ fontFamily: '"Syne", sans-serif' }}
          >
            One Light. <br />
            <span className="font-bold text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text">
              Many Expressions.
            </span>
          </h3>

          <p
            className="text-slate-300/80 text-xs sm:text-sm font-light leading-relaxed"
            style={{ fontFamily: '"Inter", sans-serif' }}
          >
            As light strikes the prism, white reveals its hidden spectrum. Every ray becomes a distinct medium of expression — music, dance, code, fashion, and strategy.
          </p>
        </div>

        {/* ── PHASE 3 OVERLAY: SABRANG CONVERGENCE & MANIFESTO ── */}
        <div
          ref={p3Ref}
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none opacity-0 max-w-3xl mx-auto"
          style={{ zIndex: 10 }}
        >
          <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-pink-400/90 mb-4 block">
            03 · CONVERGENCE
          </span>

          <div
            className="text-white font-black tracking-tight uppercase text-4xl sm:text-6xl md:text-7xl mb-2"
            style={{
              fontFamily: '"Syne", sans-serif',
              letterSpacing: "-0.02em",
            }}
          >
            SABRANG
          </div>

          <div className="flex items-center justify-center gap-3 mb-8">
            <span
              className="text-white/60 text-xs sm:text-sm font-serif"
              style={{ fontFamily: '"Bodoni Moda", serif' }}
            >
              SAB
            </span>
            <span className="text-white/30 text-xs">+</span>
            <span
              className="text-white/60 text-xs sm:text-sm font-serif"
              style={{ fontFamily: '"Bodoni Moda", serif' }}
            >
              RANG
            </span>
            <span className="text-white/30 text-xs">·</span>
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan-300 font-semibold">
              ALL COLORS
            </span>
          </div>

          <div className="space-y-2 border-t border-white/10 pt-6 max-w-md mx-auto">
            <h4
              className="text-sm sm:text-base font-bold uppercase tracking-[0.3em] text-white/90"
              style={{ fontFamily: '"Syne", sans-serif' }}
            >
              ONE LIGHT. ENDLESS EXPRESSIONS.
            </h4>
            <p
              className="text-slate-300/70 text-xs font-light leading-relaxed tracking-wider"
              style={{ fontFamily: '"Inter", sans-serif' }}
            >
              Where every wavelength finds its voice and every color comes alive.
            </p>
          </div>
        </div>

        {/* Subdued Scroll Indicator */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
          style={{ zIndex: 15 }}
        >
          <div className="w-px h-6 bg-gradient-to-b from-transparent to-white/20" />
          <span className="text-[8px] font-mono uppercase tracking-[0.4em] text-white/25">
            SCROLL TO REFRACT
          </span>
        </div>
      </div>
    </section>
  );
}
