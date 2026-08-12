"use client";

import React, { forwardRef } from "react";

// ------------------------------------------------------------------
// HeroTypography
//
// Reproduces the Shopify Spring 2026 "Everywhere" hero typography:
//   - Large primary word centered in viewport
//   - Secondary echo word behind at smaller scale + different opacity
//   - Sub-label text ("SABRANG '25") at smaller scale, offset
//   - Slight rotation on layers for depth/dimension
//   - Each letter is individually targetable by GSAP (data-letter)
//   - Grain texture is handled at parent level
// ------------------------------------------------------------------

interface HeroTypographyProps {
  className?: string;
}

const LETTERS = ["S", "A", "B", "R", "A", "N", "G"];

const HeroTypography = forwardRef<HTMLDivElement, HeroTypographyProps>(
  ({ className = "" }, ref) => {
    return (
      <div
        ref={ref}
        className={`hero-typography relative w-full h-full flex items-center justify-center select-none pointer-events-none ${className}`}
        style={{ willChange: "transform, opacity" }}
      >
        {/* ── Layer 0: Ultra-far ghost echo (barely visible, rotated) ── */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: "rotate(-3deg) scale(1.35)",
            opacity: 0.04,
            willChange: "transform",
          }}
          aria-hidden="true"
        >
          <span
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
              fontWeight: 900,
              fontSize: "clamp(8rem, 24vw, 22rem)",
              letterSpacing: "-0.04em",
              color: "#ffffff",
              lineHeight: 1,
              whiteSpace: "nowrap",
            }}
          >
            SABRANG
          </span>
        </div>

        {/* ── Layer 1: Secondary echo — slightly smaller, offset up, faint ── */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: "translateY(-38%) rotate(1.2deg) scale(0.52)",
            opacity: 0.12,
            willChange: "transform",
          }}
          aria-hidden="true"
        >
          <span
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
              fontWeight: 900,
              fontSize: "clamp(8rem, 24vw, 22rem)",
              letterSpacing: "-0.03em",
              color: "#e0e7ff",
              lineHeight: 1,
              whiteSpace: "nowrap",
            }}
          >
            SABRANG
          </span>
        </div>

        {/* ── Layer 2: PRIMARY "SABRANG" — per-letter spans for GSAP ── */}
        <div
          className="hero-primary-word absolute inset-0 flex items-center justify-center"
          style={{ willChange: "transform, opacity" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.01em",
              fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
              fontWeight: 900,
              fontSize: "clamp(5rem, 19vw, 18rem)",
              letterSpacing: "-0.045em",
              lineHeight: 1,
              whiteSpace: "nowrap",
            }}
          >
            {LETTERS.map((char, i) => (
              <span
                key={i}
                data-letter={i}
                className={`hero-letter hero-letter-${i}`}
                style={{
                  display: "inline-block",
                  willChange: "transform, opacity",
                  // Slight individual rotations for organic feel (like reference)
                  transform: [
                    "rotate(-0.8deg)",
                    "rotate(0.4deg)",
                    "rotate(-0.3deg)",
                    "rotate(0.6deg)",
                    "rotate(-0.5deg)",
                    "rotate(0.3deg)",
                    "rotate(-0.7deg)",
                  ][i],
                  // White with very subtle gradient treatment
                  color: "transparent",
                  backgroundImage:
                    "linear-gradient(180deg, #ffffff 0%, #d1d5e8 60%, #9ca3c0 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  // Faint stroke for edge definition
                  WebkitTextStroke: "0.5px rgba(255,255,255,0.15)",
                }}
              >
                {char}
              </span>
            ))}
          </div>
        </div>

        {/* ── Layer 3: "ALL SHADES OF CREATIVITY" tagline — below word ── */}
        <div
          className="hero-tagline absolute"
          style={{
            bottom: "22%",
            left: "50%",
            transform: "translateX(-50%)",
            willChange: "transform, opacity",
          }}
        >
          <p
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
              fontWeight: 500,
              fontSize: "clamp(0.55rem, 1.2vw, 1.1rem)",
              letterSpacing: "0.32em",
              color: "rgba(255,255,255,0.55)",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              textAlign: "center",
            }}
          >
            All Shades of Creativity&nbsp;&nbsp;·&nbsp;&nbsp;JKLU
            Jaipur&nbsp;&nbsp;·&nbsp;&nbsp;2025
          </p>
        </div>

        {/* ── Layer 4: Edition badge — top-right of word cluster ── */}
        <div
          className="hero-badge absolute"
          style={{
            top: "28%",
            right: "8%",
            willChange: "transform, opacity",
          }}
          aria-hidden="true"
        >
          <div
            style={{
              fontFamily: "'Inter', monospace",
              fontWeight: 700,
              fontSize: "clamp(0.45rem, 0.9vw, 0.75rem)",
              letterSpacing: "0.18em",
              color: "rgba(255,255,255,0.22)",
              textTransform: "uppercase",
              lineHeight: 1.5,
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
            }}
          >
            Sabrang&nbsp;'25
          </div>
        </div>
      </div>
    );
  },
);

HeroTypography.displayName = "HeroTypography";
export default HeroTypography;
