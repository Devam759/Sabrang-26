"use client";

/**
 * SabrangPillarsCanvas — Central Light & 4 Emerging Wavelengths
 * 
 * Section 02 Visual System:
 * A unified central light source branches into 4 distinct scroll-reactive wavelengths:
 * 1. TECHNO & INNOVATION (Cyan Wavelength)
 * 2. CULTURAL & PERFORMING (Purple Wavelength)
 * 3. MANAGEMENT & STRATEGY (Amber Wavelength)
 * 4. DESIGN & EXPRESSION (Pink Wavelength)
 */

import React, { useEffect, useRef, useState } from "react";

export interface PillarData {
  id: string;
  number: string;
  name: string;
  subtitle: string;
  description: string;
  color: string;
  angle: number; // in degrees relative to central point
  keyword: string;
}

export const SABRANG_PILLARS: PillarData[] = [
  {
    id: "techno",
    number: "01",
    name: "TECHNO & INNOVATION",
    subtitle: "Technical Genius & Code",
    description: "National hackathons, robotics arenas, AI showdowns, and high-stakes coding duels.",
    color: "#22d3ee",
    angle: -45,
    keyword: "TECHNICAL GENIUS",
  },
  {
    id: "cultural",
    number: "02",
    name: "CULTURAL & PERFORMING",
    subtitle: "Artistic Rebellion & Stage",
    description: "Live band clashes, battle of the dance troupes, fashion runways, and mainstage concerts.",
    color: "#a855f7",
    angle: -15,
    keyword: "ARTISTIC REBELLION",
  },
  {
    id: "management",
    number: "03",
    name: "MANAGEMENT & STRATEGY",
    subtitle: "Business Vision & Pitch",
    description: "B-plan pitching, stock market simulations, crisis management, and executive leadership.",
    color: "#f59e0b",
    angle: 15,
    keyword: "STRATEGIC VISION",
  },
  {
    id: "design",
    number: "04",
    name: "DESIGN & EXPRESSION",
    subtitle: "Visual Arts & Aesthetics",
    description: "UI/UX sprint challenges, fine art installations, multimedia storytelling, and digital craft.",
    color: "#ec4899",
    angle: 45,
    keyword: "CREATIVE AESTHETICS",
  },
];

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace("#", "");
  const num = parseInt(cleanHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export interface SabrangPillarsCanvasProps {
  progressRef: React.MutableRefObject<number>;
  activePillarId?: string | null;
  onHoverPillar?: (id: string | null) => void;
}

export default function SabrangPillarsCanvas({
  progressRef,
  activePillarId = null,
  onHoverPillar,
}: SabrangPillarsCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

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

    let time = 0;

    function render() {
      if (!ctx) return;
      time += 0.015;
      const p = progressRef && progressRef.current > 0 ? progressRef.current : 1;

      ctx.clearRect(0, 0, W, H);

      const cx = W * 0.5;
      const cy = H * 0.5;

      // ── CENTRAL UNIFIED LIGHT CORE ──
      const activeId = activePillarId || hoveredId;
      const isIsolated = Boolean(activeId);

      // Core pulse
      const pulse = Math.sin(time * 2.5) * 3;
      const coreRadius = 24 + pulse;

      // Draw central light aura
      const coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 140);
      coreGlow.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      coreGlow.addColorStop(0.2, "rgba(200, 230, 255, 0.6)");
      coreGlow.addColorStop(0.5, "rgba(168, 85, 247, 0.2)");
      coreGlow.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, 140, 0, Math.PI * 2);
      ctx.fill();

      // Core solid point
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();

      // ── 4 EMERGING WAVELENGTHS ──
      const maxDist = Math.min(W, H) * 0.38;

      SABRANG_PILLARS.forEach((pillar, i) => {
        // Individual pillar emergence thresholds: smooth emergence across scrub progress
        const startP = i * 0.12;
        const emergence = Math.min(1, Math.max(0, (p - startP) / 0.25));

        if (emergence <= 0.01) return;

        const rad = (pillar.angle * Math.PI) / 180;
        const currentDist = maxDist * emergence;

        const endX = cx + Math.cos(rad) * currentDist;
        const endY = cy + Math.sin(rad) * currentDist;

        const isThisActive = activeId === pillar.id;
        const alphaMultiplier = isIsolated ? (isThisActive ? 1.0 : 0.15) : 0.85;

        const rgb = hexToRgb(pillar.color);

        // Draw light path vector
        ctx.save();
        const beamGrad = ctx.createLinearGradient(cx, cy, endX, endY);
        beamGrad.addColorStop(0, `rgba(255, 255, 255, ${0.9 * alphaMultiplier})`);
        beamGrad.addColorStop(0.4, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.8 * alphaMultiplier})`);
        beamGrad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.1 * alphaMultiplier})`);

        ctx.lineWidth = isThisActive ? 4 : 2;
        ctx.strokeStyle = beamGrad;
        ctx.shadowColor = pillar.color;
        ctx.shadowBlur = isThisActive ? 28 : 14;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        
        // Curved wave line
        const midX = cx + (endX - cx) * 0.5 + Math.sin(time * 2 + i) * 8;
        const midY = cy + (endY - cy) * 0.5 + Math.cos(time * 2 + i) * 8;
        ctx.quadraticCurveTo(midX, midY, endX, endY);
        ctx.stroke();
        ctx.restore();

        // Tip node glow
        if (emergence > 0.5) {
          ctx.save();
          const nodeGlow = ctx.createRadialGradient(endX, endY, 0, endX, endY, isThisActive ? 45 : 25);
          nodeGlow.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.9 * alphaMultiplier})`);
          nodeGlow.addColorStop(1, "rgba(0,0,0,0)");

          ctx.fillStyle = nodeGlow;
          ctx.beginPath();
          ctx.arc(endX, endY, isThisActive ? 45 : 25, 0, Math.PI * 2);
          ctx.fill();

          // Core node point
          ctx.fillStyle = `rgba(255, 255, 255, ${alphaMultiplier})`;
          ctx.beginPath();
          ctx.arc(endX, endY, isThisActive ? 6 : 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      animRef.current = requestAnimationFrame(render);
    }

    render();

    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, [activePillarId, hoveredId, progressRef]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full pointer-events-none"
    />
  );
}
