"use client";

/**
 * Prism — Cinematic Optical Refraction & Dispersion Simulation
 * 
 * Rebuilt completely from scratch for Sabrang 2026.
 * 
 * Continuous Physical Storyline:
 * 0%–15%:  Dark Empty Space (Zero visibility of prism or lights)
 * 15%–30%: White Light Source Appears (Intense pulsing white point on left)
 * 30%–45%: White Beam Travels (Focused pure white laser shoots to prism)
 * 45%–55%: Transparent Optical Glass Prism Reveals (Refractive 3D glass materializes)
 * 55%–65%: White Beam Enters Prism (Visibly travels through glass interior as PURE WHITE light)
 * 65%–80%: Gradual Spectral Dispersion Inside (Continuous physical split from white into 7 wavelengths)
 * 80%–100%: Rainbow Spectrum Exits & Expands (7 luminous volumetric rays fan out with labels & bloom)
 */

import React, { useEffect, useRef } from "react";

export interface SpectralRay {
  label: string;
  color: string;
  angle: number; // degrees
}

export const SPECTRUM_RAYS: SpectralRay[] = [
  { label: "DANCE",       color: "#ff3b5c", angle: -48 },
  { label: "DESIGN",      color: "#ff7b2c", angle: -32 },
  { label: "LITERATURE",  color: "#f5d800", angle: -16 },
  { label: "TECHNOLOGY",  color: "#22d3ee", angle: 0 },
  { label: "MANAGEMENT",  color: "#3b82f6", angle: 16 },
  { label: "CULTURE",     color: "#8b5cf6", angle: 32 },
  { label: "MUSIC",       color: "#ec4899", angle: 48 },
];

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function interpolateRgb(
  c1: { r: number; g: number; b: number },
  c2: { r: number; g: number; b: number },
  t: number
): { r: number; g: number; b: number } {
  const clampT = Math.min(1, Math.max(0, t));
  return {
    r: Math.round(c1.r + (c2.r - c1.r) * clampT),
    g: Math.round(c1.g + (c2.g - c1.g) * clampT),
    b: Math.round(c1.b + (c2.b - c1.b) * clampT),
  };
}

const WHITE_RGB = { r: 255, g: 255, b: 255 };

export interface PrismProps {
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
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      W = rect.width || canvas.offsetWidth || window.innerWidth;
      H = rect.height || canvas.offsetHeight || window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    handleResize();
    const ro = new ResizeObserver(handleResize);
    ro.observe(canvas);

    // Subtle photon dust particles for volumetric light feel
    const particles = Array.from({ length: 90 }, () => ({
      size: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.4 + 0.2,
      rayIndex: Math.floor(Math.random() * SPECTRUM_RAYS.length),
      offset: Math.random(),
      speed: Math.random() * 0.002 + 0.001,
    }));

    let time = 0;

    function render() {
      if (!ctx) return;
      time += 0.015;

      // ── GET EXACT SCROLL PROGRESS (0.00 to 1.00) ──
      let p = 0;
      if (progressRef && typeof progressRef.current === "number") {
        p = progressRef.current;
      } else {
        p = progress;
      }
      p = Math.min(1, Math.max(0, p));

      ctx.clearRect(0, 0, W, H);

      const cx = W * 0.5;
      const cy = H * 0.5;

      // ── SCENE 1: DARK CINEMATIC AMBIENT BACKGROUND ──
      const bgGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(W, H) * 0.75);
      bgGrad.addColorStop(0, "rgba(10, 9, 20, 0.4)");
      bgGrad.addColorStop(0.5, "rgba(3, 2, 7, 0.9)");
      bgGrad.addColorStop(1, "rgba(0, 0, 0, 1)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // If at start (0-15%), keep scene completely dark as requested
      if (p <= 0.01) {
        animRef.current = requestAnimationFrame(render);
        return;
      }

      // Geometry coordinates
      const sourceX = W * 0.14;
      const sourceY = cy;
      const prismX = W * 0.44;
      const prismY = cy;
      const pSize = 58; // Prism radius

      // Front Face Vertices (Equilateral Triangle)
      const topV = { x: prismX, y: prismY - pSize };
      const botRightV = { x: prismX + pSize * 0.866, y: prismY + pSize * 0.5 };
      const botLeftV = { x: prismX - pSize * 0.866, y: prismY + pSize * 0.5 };

      const entryX = prismX - pSize * 0.433;
      const entryY = cy;
      const exitBaseX = prismX + pSize * 0.433;

      // 7 distinct exit points along right prism edge (between topV and botRightV)
      const exitPoints = SPECTRUM_RAYS.map((ray, i) => {
        const factor = (i / (SPECTRUM_RAYS.length - 1) - 0.5) * 0.65;
        return {
          x: exitBaseX + factor * (pSize * 0.433),
          y: cy + factor * (pSize * 0.8),
        };
      });

      // ── SCENE 2: WHITE LIGHT SOURCE (Appears 15% -> 30%) ──
      const sourceProg = Math.min(1, Math.max(0, (p - 0.15) / 0.15));
      const sourceFade = p > 0.90 ? Math.max(0, 1 - (p - 0.90) / 0.10) : 1;
      const sourceAlpha = sourceProg * sourceFade;

      if (sourceAlpha > 0.01) {
        const pulseRadius = 7 + Math.sin(time * 2.5) * 2;

        // Outer radial glow
        const sGlow = ctx.createRadialGradient(sourceX, sourceY, 0, sourceX, sourceY, 130);
        sGlow.addColorStop(0, `rgba(255, 255, 255, ${0.95 * sourceAlpha})`);
        sGlow.addColorStop(0.2, `rgba(220, 240, 255, ${0.75 * sourceAlpha})`);
        sGlow.addColorStop(0.5, `rgba(160, 200, 255, ${0.25 * sourceAlpha})`);
        sGlow.addColorStop(1, "rgba(0,0,0,0)");

        ctx.fillStyle = sGlow;
        ctx.beginPath();
        ctx.arc(sourceX, sourceY, 130, 0, Math.PI * 2);
        ctx.fill();

        // Intense central white core
        ctx.fillStyle = `rgba(255, 255, 255, ${sourceAlpha})`;
        ctx.beginPath();
        ctx.arc(sourceX, sourceY, pulseRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── SCENE 3: TRANSPARENT GLASS PRISM REVEALS (Reveals 35% -> 50%) ──
      const prismReveal = Math.min(1, Math.max(0, (p - 0.35) / 0.15));
      const prismFade = p > 0.92 ? Math.max(0, 1 - (p - 0.92) / 0.08) : 1;
      const prismAlpha = prismReveal * prismFade;

      if (prismAlpha > 0.01) {
        const depthX = 16;
        const depthY = -14;

        const topVBack = { x: topV.x + depthX, y: topV.y + depthY };
        const botRightVBack = { x: botRightV.x + depthX, y: botRightV.y + depthY };
        const botLeftVBack = { x: botLeftV.x + depthX, y: botLeftV.y + depthY };

        ctx.save();
        ctx.globalAlpha = prismAlpha;

        // 1. Back 3D Face (Glass Volume)
        ctx.beginPath();
        ctx.moveTo(topVBack.x, topVBack.y);
        ctx.lineTo(botRightVBack.x, botRightVBack.y);
        ctx.lineTo(botLeftVBack.x, botLeftVBack.y);
        ctx.closePath();
        ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.20)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // 2. Connecting Bevel Lines (3D Prism Edges)
        const bevelGrad = ctx.createLinearGradient(topV.x, topV.y, topVBack.x, topVBack.y);
        bevelGrad.addColorStop(0, "rgba(255, 255, 255, 0.5)");
        bevelGrad.addColorStop(1, "rgba(180, 220, 255, 0.15)");
        ctx.strokeStyle = bevelGrad;
        ctx.lineWidth = 1.2;

        ctx.beginPath();
        ctx.moveTo(topV.x, topV.y);
        ctx.lineTo(topVBack.x, topVBack.y);
        ctx.moveTo(botRightV.x, botRightV.y);
        ctx.lineTo(botRightVBack.x, botRightVBack.y);
        ctx.moveTo(botLeftV.x, botLeftV.y);
        ctx.lineTo(botLeftVBack.x, botLeftVBack.y);
        ctx.stroke();

        // 3. Front Triangular Face Glass Sheen
        const glassFill = ctx.createLinearGradient(botLeftV.x, botLeftV.y, topV.x, topV.y);
        glassFill.addColorStop(0, "rgba(255, 255, 255, 0.10)");
        glassFill.addColorStop(0.5, "rgba(180, 230, 255, 0.25)");
        glassFill.addColorStop(1, "rgba(255, 255, 255, 0.06)");

        ctx.fillStyle = glassFill;
        ctx.beginPath();
        ctx.moveTo(topV.x, topV.y);
        ctx.lineTo(botRightV.x, botRightV.y);
        ctx.lineTo(botLeftV.x, botLeftV.y);
        ctx.closePath();
        ctx.fill();

        // 4. Front Glass Refractive Outline & Specular Highlight
        ctx.strokeStyle = "rgba(255, 255, 255, 0.70)";
        ctx.lineWidth = 1.8;
        ctx.shadowColor = "rgba(200, 240, 255, 0.85)";
        ctx.shadowBlur = 18;
        ctx.stroke();

        // 5. Corner Vertex Starlet Nodes
        [topV, botRightV, botLeftV].forEach((v) => {
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(v.x, v.y, 2.2, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.restore();
      }

      // ── SCENE 3: WHITE BEAM TRAVELS TOWARD PRISM (Travels 30% -> 45%) ──
      const beamTravelProg = Math.min(1, Math.max(0, (p - 0.30) / 0.15));

      if (beamTravelProg > 0 && sourceFade > 0) {
        const currentBeamX = sourceX + (entryX - sourceX) * beamTravelProg;

        // Volumetric Soft White Beam Shaft Glow
        const shaftGrad = ctx.createLinearGradient(sourceX, sourceY, currentBeamX, entryY);
        shaftGrad.addColorStop(0, `rgba(255, 255, 255, ${0.95 * sourceFade})`);
        shaftGrad.addColorStop(0.7, `rgba(240, 248, 255, ${0.85 * sourceFade})`);
        shaftGrad.addColorStop(1, `rgba(255, 255, 255, ${0.98 * sourceFade})`);

        ctx.save();
        ctx.lineWidth = 6 + Math.sin(time * 3) * 1.5;
        ctx.strokeStyle = shaftGrad;
        ctx.shadowColor = "rgba(255, 255, 255, 0.95)";
        ctx.shadowBlur = 28;
        ctx.beginPath();
        ctx.moveTo(sourceX, sourceY);
        ctx.lineTo(currentBeamX, entryY);
        ctx.stroke();
        ctx.restore();

        // Focused Core 100% PURE WHITE Laser Line
        ctx.save();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = `rgba(255, 255, 255, ${sourceFade})`;
        ctx.beginPath();
        ctx.moveTo(sourceX, sourceY);
        ctx.lineTo(currentBeamX, entryY);
        ctx.stroke();
        ctx.restore();
      }

      // ── SCENE 4: WHITE BEAM TOUCHES & ENTERS GLASS (Enters 45% -> 65%) ──
      // Entry Spark Flare on Glass Face
      if (p >= 0.45) {
        const sparkProg = Math.min(1, (p - 0.45) / 0.15);
        ctx.save();
        const sGlow = ctx.createRadialGradient(entryX, entryY, 0, entryX, entryY, 28 * sparkProg);
        sGlow.addColorStop(0, "rgba(255, 255, 255, 0.98)");
        sGlow.addColorStop(0.3, "rgba(210, 245, 255, 0.85)");
        sGlow.addColorStop(0.7, "rgba(150, 210, 255, 0.3)");
        sGlow.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = sGlow;
        ctx.beginPath();
        ctx.arc(entryX, entryY, 28 * sparkProg, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      const insideTravelProg = Math.min(1, Math.max(0, (p - 0.55) / 0.10));
      const dispersionProg = Math.min(1, Math.max(0, (p - 0.65) / 0.15));

      // ── SCENE 4 & 5: LIGHT INSIDE THE PRISM (Pure White at first, then gradual dispersion) ──
      if (p >= 0.55) {
        ctx.save();

        if (dispersionProg <= 0) {
          // Inside Glass: Beam is visibly 100% PURE WHITE traveling from entry to center
          const currentInsideX = entryX + (prismX - entryX) * insideTravelProg;
          const currentInsideY = cy;

          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2.5;
          ctx.shadowColor = "rgba(255, 255, 255, 0.95)";
          ctx.shadowBlur = 14;

          ctx.beginPath();
          ctx.moveTo(entryX, entryY);
          ctx.lineTo(currentInsideX, currentInsideY);
          ctx.stroke();
        } else {
          // Inside Glass: Continuous Physical Dispersion WHITE -> 7 Wavelengths
          SPECTRUM_RAYS.forEach((ray, i) => {
            const exitP = exitPoints[i];
            const currentExitX = prismX + (exitP.x - prismX) * Math.min(1, dispersionProg * 1.3);
            const currentExitY = cy + (exitP.y - cy) * Math.min(1, dispersionProg * 1.3);

            // Smooth physical color split: WHITE -> Spectral Color
            const rayRgb = interpolateRgb(WHITE_RGB, hexToRgb(ray.color), dispersionProg);

            ctx.strokeStyle = `rgb(${rayRgb.r}, ${rayRgb.g}, ${rayRgb.b})`;
            ctx.lineWidth = 2.0;
            ctx.shadowColor = `rgb(${rayRgb.r}, ${rayRgb.g}, ${rayRgb.b})`;
            ctx.shadowBlur = 12 * dispersionProg;

            ctx.beginPath();
            ctx.moveTo(entryX, entryY);
            ctx.lineTo(currentExitX, currentExitY);
            ctx.stroke();
          });
        }
        ctx.restore();
      }

      // ── SCENE 6: RAINBOW SPECTRUM EXITS & EXPANDS (80% -> 100%) ──
      const exitProg = Math.min(1, Math.max(0, (p - 0.80) / 0.20));
      const targetX = W * 0.88;

      if (exitProg > 0) {
        const convergeProg = p > 0.92 ? Math.min(1, (p - 0.92) / 0.08) : 0;

        SPECTRUM_RAYS.forEach((ray, i) => {
          const exitP = exitPoints[i];
          const maxRayLength = targetX - exitP.x;
          const currentRayLength = maxRayLength * exitProg;
          const rad = (ray.angle * Math.PI) / 180;

          const spreadY = Math.tan(rad) * currentRayLength * (1 - convergeProg * 0.95);
          const endX = exitP.x + currentRayLength;
          const endY = exitP.y + spreadY;

          const rgb = hexToRgb(ray.color);
          const rayAlpha = Math.min(1, exitProg * 1.6) * (1 - convergeProg * 0.15);

          // Volumetric Luminous Light Ray
          ctx.save();
          const rayGrad = ctx.createLinearGradient(exitP.x, exitP.y, endX, endY);
          rayGrad.addColorStop(0, `rgba(255, 255, 255, ${0.95 * rayAlpha})`);
          rayGrad.addColorStop(0.15, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.95 * rayAlpha})`);
          rayGrad.addColorStop(0.8, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.6 * rayAlpha})`);
          rayGrad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

          ctx.lineWidth = 2.4 + (1 - convergeProg) * 1.4;
          ctx.strokeStyle = rayGrad;
          ctx.shadowColor = ray.color;
          ctx.shadowBlur = 22 * rayAlpha;

          ctx.beginPath();
          ctx.moveTo(exitP.x, exitP.y);

          const controlX = exitP.x + currentRayLength * 0.5;
          const controlY = exitP.y + spreadY * 0.4;
          ctx.quadraticCurveTo(controlX, controlY, endX, endY);
          ctx.stroke();

          // Soft Ray Tip Glow
          if (exitProg > 0.15) {
            const tipGlow = ctx.createRadialGradient(endX, endY, 0, endX, endY, 34 * exitProg);
            tipGlow.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.5 * rayAlpha})`);
            tipGlow.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = tipGlow;
            ctx.beginPath();
            ctx.arc(endX, endY, 34 * exitProg, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();

          // Floating Discipline Text Label
          if (exitProg > 0.45 && convergeProg < 0.85) {
            const textX = exitP.x + (endX - exitP.x) * 0.62;
            const textY = exitP.y + (endY - exitP.y) * 0.62;

            const labelFade = Math.min(
              1,
              Math.max(0, (exitProg - 0.45) / 0.3)
            ) * (1 - convergeProg * 1.5);

            if (labelFade > 0.01) {
              ctx.save();
              ctx.font = "900 10px 'Syne', sans-serif";
              ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.95 * labelFade})`;
              ctx.shadowColor = ray.color;
              ctx.shadowBlur = 14 * labelFade;
              ctx.textAlign = "left";
              ctx.textBaseline = "middle";
              ctx.letterSpacing = "0.25em";
              ctx.fillText(ray.label, textX + 10, textY - 8);
              ctx.restore();
            }
          }
        });

        // Photon Dust Particles
        if (exitProg > 0.1 && p < 0.96) {
          ctx.save();
          particles.forEach((part) => {
            part.offset += part.speed;
            if (part.offset > 1) part.offset = 0;

            const ray = SPECTRUM_RAYS[part.rayIndex];
            const exitP = exitPoints[part.rayIndex];
            const rgb = hexToRgb(ray.color);

            const rad = (ray.angle * Math.PI) / 180;
            const len = (targetX - exitP.x) * Math.min(1, exitProg);

            const px = exitP.x + len * part.offset;
            const py = exitP.y + Math.tan(rad) * len * part.offset;
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
      }

      // ── CHROMATIC CONVERGENCE BLOOM (90% -> 100%) ──
      if (p >= 0.88) {
        const cProg = Math.min(1, (p - 0.88) / 0.12);
        const coreX = targetX;
        const coreY = cy;

        const bloomRadius = 180 * cProg;
        const cBloom = ctx.createRadialGradient(coreX, coreY, 0, coreX, coreY, bloomRadius);
        cBloom.addColorStop(0, `rgba(255, 255, 255, ${0.95 * cProg})`);
        cBloom.addColorStop(0.2, `rgba(34, 211, 238, ${0.55 * cProg})`);
        cBloom.addColorStop(0.45, `rgba(168, 85, 247, ${0.4 * cProg})`);
        cBloom.addColorStop(0.7, `rgba(236, 72, 153, ${0.25 * cProg})`);
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
