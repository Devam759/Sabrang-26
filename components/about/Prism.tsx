"use client";

/**
 * Prism — Optical Ray Physics & Refraction Engine
 * 
 * Standalone 2D Canvas Ray Physics Component for Sabrang 2026: "Shades & Colors of Light".
 * 
 * Conceptual Flow:
 * MONOLITH LIGHT SOURCE → OPTICAL GLASS PRISM → SPECTRAL DISPERSION → SABRANG CONVERGENCE
 */

import React, { useEffect, useRef } from "react";

export interface SpectralRay {
  label: string;
  color: string;
  angle: number; // relative refraction angle in degrees
  speed: number;
}

export const SPECTRUM_RAYS: SpectralRay[] = [
  { label: "DANCE",       color: "#ff3b5c", angle: -54, speed: 1.0 },
  { label: "DESIGN",      color: "#ff7b2c", angle: -36, speed: 0.95 },
  { label: "LITERATURE",  color: "#f5d800", angle: -18, speed: 1.05 },
  { label: "TECHNOLOGY",  color: "#22d3ee", angle: 0,   speed: 1.1 },
  { label: "MANAGEMENT",  color: "#3b82f6", angle: 18,  speed: 0.9 },
  { label: "CULTURE",     color: "#8b5cf6", angle: 36,  speed: 1.0 },
  { label: "MUSIC",       color: "#ec4899", angle: 54,  speed: 1.05 },
];

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace("#", "");
  const num = parseInt(cleanHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export interface PrismProps {
  /** 
   * Scrub progress from 0.0 (white light origin) to 1.0 (Sabrang chromatic convergence).
   * If not provided or driven externally, progress defaults to 0 or reads from progressRef.
   */
  progress?: number;
  progressRef?: React.MutableRefObject<number>;
  className?: string;
}

export default function Prism({ progress = 0, progressRef, className = "" }: PrismProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0;
    let H = 0;
    let dpr = 1;

    function handleResize() {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx?.scale(dpr, dpr);
    }

    handleResize();
    const ro = new ResizeObserver(handleResize);
    ro.observe(canvas);

    // Particle pool for photon dust inside light paths
    const particleCount = 140;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() * 1.8 + 0.5,
      alpha: Math.random() * 0.5 + 0.2,
      rayIndex: Math.floor(Math.random() * SPECTRUM_RAYS.length),
      offset: Math.random() * 100,
      speed: Math.random() * 0.003 + 0.001,
    }));

    let time = 0;

    function render() {
      if (!ctx) return;
      time += 0.012;

      // Determine progress value: external ref (for high-fps scroll scrub) or state prop (default 0.65)
      const p = progressRef && progressRef.current > 0 ? progressRef.current : (progress || 0.65);

      ctx.clearRect(0, 0, W, H);

      const cx = W * 0.5;
      const cy = H * 0.5;

      // ── MOMENT 01: DARKNESS & MONOLITH SOURCE ──
      const sourceX = W * 0.2;
      const sourceY = cy;

      const sourceAlpha = Math.min(1, Math.max(0, (0.25 - p) / 0.25));
      const pulseRadius = 6 + Math.sin(time * 2.5) * 2;

      // Deep atmospheric background gradient
      const bgGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(W, H) * 0.75);
      bgGrad.addColorStop(0, "rgba(8, 8, 16, 0.4)");
      bgGrad.addColorStop(0.5, "rgba(3, 3, 7, 0.9)");
      bgGrad.addColorStop(1, "rgba(0, 0, 0, 1)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Light Point Source
      if (sourceAlpha > 0.01) {
        const lightGlow = ctx.createRadialGradient(
          sourceX,
          sourceY,
          0,
          sourceX,
          sourceY,
          120
        );
        lightGlow.addColorStop(0, `rgba(255, 255, 255, ${0.95 * sourceAlpha})`);
        lightGlow.addColorStop(0.15, `rgba(220, 240, 255, ${0.6 * sourceAlpha})`);
        lightGlow.addColorStop(0.4, `rgba(160, 200, 255, ${0.15 * sourceAlpha})`);
        lightGlow.addColorStop(1, "rgba(0,0,0,0)");

        ctx.fillStyle = lightGlow;
        ctx.beginPath();
        ctx.arc(sourceX, sourceY, 120, 0, Math.PI * 2);
        ctx.fill();

        // Core dot
        ctx.fillStyle = `rgba(255, 255, 255, ${sourceAlpha})`;
        ctx.beginPath();
        ctx.arc(sourceX, sourceY, pulseRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── MOMENT 02: BEAM PROPAGATION ──
      const prismX = W * 0.48;
      const prismY = cy;

      if (p > 0.12) {
        const beamProgress = Math.min(1, (p - 0.12) / 0.28);
        const currentBeamX = sourceX + (prismX - sourceX) * beamProgress;
        const beamFade = p > 0.75 ? Math.max(0, 1 - (p - 0.75) / 0.2) : 1;

        if (beamProgress > 0 && beamFade > 0) {
          // Primary Volumetric Light Shaft
          const shaftGrad = ctx.createLinearGradient(sourceX, sourceY, currentBeamX, prismY);
          shaftGrad.addColorStop(0, `rgba(255, 255, 255, ${0.9 * beamFade})`);
          shaftGrad.addColorStop(0.7, `rgba(240, 248, 255, ${0.7 * beamFade})`);
          shaftGrad.addColorStop(1, `rgba(255, 255, 255, ${0.95 * beamFade})`);

          // Soft volumetric beam glow width
          ctx.save();
          ctx.lineWidth = 4 + Math.sin(time * 3) * 1;
          ctx.strokeStyle = shaftGrad;
          ctx.shadowColor = "rgba(200, 230, 255, 0.8)";
          ctx.shadowBlur = 24;
          ctx.beginPath();
          ctx.moveTo(sourceX, sourceY);
          ctx.lineTo(currentBeamX, prismY);
          ctx.stroke();
          ctx.restore();

          // Core tight laser center line
          ctx.save();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = `rgba(255, 255, 255, ${beamFade})`;
          ctx.beginPath();
          ctx.moveTo(sourceX, sourceY);
          ctx.lineTo(currentBeamX, prismY);
          ctx.stroke();
          ctx.restore();
        }
      }

      // Faint Optical Glass Boundary at Prism position
      if (p > 0.25 && p < 0.85) {
        const prismAlpha = Math.min(1, (p - 0.25) / 0.15) * Math.max(0, 1 - (p - 0.75) / 0.1);
        ctx.save();
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.12 * prismAlpha})`;
        ctx.lineWidth = 1;
        ctx.shadowColor = "rgba(255, 255, 255, 0.3)";
        ctx.shadowBlur = 10;

        // Draw elegant optical prism silhouette
        ctx.beginPath();
        const pSize = 42;
        ctx.moveTo(prismX, prismY - pSize);
        ctx.lineTo(prismX + pSize * 0.86, prismY + pSize * 0.5);
        ctx.lineTo(prismX - pSize * 0.86, prismY + pSize * 0.5);
        ctx.closePath();
        ctx.stroke();

        // Soft glass interior sheen
        const prismSheen = ctx.createLinearGradient(prismX - 20, prismY - 20, prismX + 20, prismY + 20);
        prismSheen.addColorStop(0, `rgba(255, 255, 255, ${0.04 * prismAlpha})`);
        prismSheen.addColorStop(0.5, `rgba(180, 220, 255, ${0.08 * prismAlpha})`);
        prismSheen.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = prismSheen;
        ctx.fill();
        ctx.restore();
      }

      // ── MOMENT 03: REFRACTION & SPECTRAL DISPERSION ──
      const targetX = W * 0.82;

      if (p > 0.35) {
        const refractProgress = Math.min(1, (p - 0.35) / 0.4);
        const convergeProgress = p > 0.72 ? Math.min(1, (p - 0.72) / 0.22) : 0;

        SPECTRUM_RAYS.forEach((ray, index) => {
          const rayLength = (targetX - prismX) * refractProgress;
          const rad = (ray.angle * Math.PI) / 180;

          const spreadY = Math.tan(rad) * rayLength * (1 - convergeProgress * 0.95);
          const endX = prismX + rayLength;
          const endY = prismY + spreadY;

          const rgb = hexToRgb(ray.color);
          const rayAlpha = Math.min(1, refractProgress * 1.5) * (1 - convergeProgress * 0.2);

          // Render spectral volumetric ray line
          ctx.save();
          const rayGrad = ctx.createLinearGradient(prismX, prismY, endX, endY);
          rayGrad.addColorStop(0, `rgba(255, 255, 255, ${0.9 * rayAlpha})`);
          rayGrad.addColorStop(0.25, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.85 * rayAlpha})`);
          rayGrad.addColorStop(0.85, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.4 * rayAlpha})`);
          rayGrad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

          ctx.lineWidth = 2 + (1 - convergeProgress) * 1.5;
          ctx.strokeStyle = rayGrad;
          ctx.shadowColor = ray.color;
          ctx.shadowBlur = 18 * rayAlpha;

          ctx.beginPath();
          ctx.moveTo(prismX, prismY);
          
          const controlX = prismX + rayLength * 0.5;
          const controlY = prismY + spreadY * 0.4;
          ctx.quadraticCurveTo(controlX, controlY, endX, endY);
          ctx.stroke();

          // Floating Light Tip Glow
          if (refractProgress > 0.2) {
            const tipGlow = ctx.createRadialGradient(endX, endY, 0, endX, endY, 35 * refractProgress);
            tipGlow.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.4 * rayAlpha})`);
            tipGlow.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = tipGlow;
            ctx.beginPath();
            ctx.arc(endX, endY, 35 * refractProgress, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();

          // ── FLOATING DISCIPLINE TEXT EMBEDDED IN LIGHT PATH ──
          if (refractProgress > 0.4 && convergeProgress < 0.7) {
            const textX = prismX + (endX - prismX) * 0.65;
            const textY = prismY + (endY - prismY) * 0.65;

            const labelFade = Math.min(
              1,
              Math.max(0, (refractProgress - 0.3) / 0.3)
            ) * (1 - convergeProgress * 1.5);

            if (labelFade > 0.01) {
              ctx.save();
              ctx.font = "900 10px 'Syne', sans-serif";
              ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.9 * labelFade})`;
              ctx.shadowColor = ray.color;
              ctx.shadowBlur = 12 * labelFade;
              ctx.textAlign = "left";
              ctx.textBaseline = "middle";
              ctx.letterSpacing = "0.25em";
              ctx.fillText(ray.label, textX + 10, textY - 8);
              ctx.restore();
            }
          }
        });
      }

      // ── PHOTON DUST PARTICLES ──
      if (p > 0.15 && p < 0.95) {
        ctx.save();
        particles.forEach((part) => {
          part.offset += part.speed;
          if (part.offset > 1) part.offset = 0;

          const ray = SPECTRUM_RAYS[part.rayIndex];
          const rgb = hexToRgb(ray.color);

          const startX = prismX;
          const startY = prismY;
          const rad = (ray.angle * Math.PI) / 180;
          const len = (targetX - prismX) * Math.min(1, (p - 0.3) / 0.4);

          const px = startX + len * part.offset;
          const py = startY + Math.tan(rad) * len * part.offset;
          const pAlpha = part.alpha * Math.sin(part.offset * Math.PI);

          ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${pAlpha})`;
          ctx.shadowColor = ray.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(px, py, part.size, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      }

      // ── MOMENT 04: SABRANG CHROMATIC CONVERGENCE BLOOM ──
      if (p > 0.72) {
        const cProgress = Math.min(1, (p - 0.72) / 0.25);
        const coreX = targetX;
        const coreY = cy;

        const bloomRadius = 180 * cProgress;
        const cBloom = ctx.createRadialGradient(coreX, coreY, 0, coreX, coreY, bloomRadius);
        cBloom.addColorStop(0, `rgba(255, 255, 255, ${0.95 * cProgress})`);
        cBloom.addColorStop(0.2, `rgba(34, 211, 238, ${0.5 * cProgress})`);
        cBloom.addColorStop(0.45, `rgba(168, 85, 247, ${0.35 * cProgress})`);
        cBloom.addColorStop(0.7, `rgba(236, 72, 153, ${0.2 * cProgress})`);
        cBloom.addColorStop(1, "rgba(0,0,0,0)");

        ctx.fillStyle = cBloom;
        ctx.beginPath();
        ctx.arc(coreX, coreY, bloomRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(render);
    }

    render();

    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, [progress, progressRef]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full pointer-events-none ${className}`}
    />
  );
}
