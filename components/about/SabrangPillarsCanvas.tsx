"use client";

/**
 * SabrangPillarsCanvas — Central Light & Emerging Wavelengths to Card Dots
 * 
 * Section 02 Visual System:
 * A unified central light source branches into 4 distinct light rays that connect
 * directly to the colored dots on top of each Pillar Card.
 */

import React, { useEffect, useRef, useState } from "react";

export interface PillarData {
  id: string;
  number: string;
  name: string;
  subtitle: string;
  description: string;
  color: string;
  defaultRatioX: number; // fallback relative X position
  keyword: string;
  image?: string;
}

export const SABRANG_PILLARS: PillarData[] = [
  {
    id: "techno",
    number: "01",
    name: "TECHNO & INNOVATION",
    subtitle: "Technical Genius & Code",
    description: "National hackathons, robotics arenas, AI showdowns, and high-stakes coding duels.",
    color: "#22d3ee",
    defaultRatioX: 0.15,
    keyword: "TECHNICAL GENIUS",
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060186/sabrang-2026/about/versevaad.jpg",
  },
  {
    id: "cultural",
    number: "02",
    name: "CULTURAL & PERFORMING",
    subtitle: "Artistic Rebellion & Stage",
    description: "Live band clashes, battle of the dance troupes, fashion runways, and mainstage concerts.",
    color: "#a855f7",
    defaultRatioX: 0.38,
    keyword: "ARTISTIC REBELLION",
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060179/sabrang-2026/about/dance-battle.png",
  },
  {
    id: "management",
    number: "03",
    name: "MANAGEMENT & STRATEGY",
    subtitle: "Business Vision & Pitch",
    description: "B-plan pitching, stock market simulations, crisis management, and executive leadership.",
    color: "#f59e0b",
    defaultRatioX: 0.62,
    keyword: "STRATEGIC VISION",
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060184/sabrang-2026/about/sabrang-live.png",
  },
  {
    id: "design",
    number: "04",
    name: "DESIGN & EXPRESSION",
    subtitle: "Visual Arts & Aesthetics",
    description: "UI/UX sprint challenges, fine art installations, multimedia storytelling, and digital craft.",
    color: "#ec4899",
    defaultRatioX: 0.85,
    keyword: "CREATIVE AESTHETICS",
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060183/sabrang-2026/about/panache-runway.png",
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
  progressRef?: React.MutableRefObject<number>;
  activePillarId?: string | null;
  onHoverPillar?: (id: string | null) => void;
  dotTargets?: { [key: string]: { x: number; y: number } };
}

export default function SabrangPillarsCanvas({
  progressRef,
  activePillarId = null,
  onHoverPillar,
  dotTargets,
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

      // Position central light source top-center
      const cx = W * 0.5;
      const cy = H * 0.16;

      const activeId = activePillarId || hoveredId;
      const isIsolated = Boolean(activeId);

      // ── 4 RAY PATHS EMANATING DIRECTLY TO CARD DOTS ──
      SABRANG_PILLARS.forEach((pillar, i) => {
        const startP = i * 0.12;
        const emergence = Math.min(1, Math.max(0, (p - startP) / 0.25));

        if (emergence <= 0.01) return;

        // Exact dot target coordinates or fallback ratio
        const destX = dotTargets && dotTargets[pillar.id]
          ? dotTargets[pillar.id].x
          : W * pillar.defaultRatioX;

        const destY = dotTargets && dotTargets[pillar.id]
          ? dotTargets[pillar.id].y
          : H * 0.52;

        const currentX = cx + (destX - cx) * emergence;
        const currentY = cy + (destY - cy) * emergence;

        const isThisActive = activeId === pillar.id;
        const alphaMultiplier = isIsolated ? (isThisActive ? 1.0 : 0.15) : 0.85;

        const rgb = hexToRgb(pillar.color);

        // Draw light path vector
        ctx.save();
        const beamGrad = ctx.createLinearGradient(cx, cy, currentX, currentY);
        beamGrad.addColorStop(0, `rgba(255, 255, 255, ${0.95 * alphaMultiplier})`);
        beamGrad.addColorStop(0.35, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.85 * alphaMultiplier})`);
        beamGrad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.3 * alphaMultiplier})`);

        ctx.lineWidth = isThisActive ? 4.5 : 2.5;
        ctx.strokeStyle = beamGrad;
        ctx.shadowColor = pillar.color;
        ctx.shadowBlur = isThisActive ? 30 : 14;

        ctx.beginPath();
        ctx.moveTo(cx, cy);

        // Curve vector cleanly to the card dot
        const midX = cx + (currentX - cx) * 0.5 + Math.sin(time * 2 + i) * 5;
        const midY = cy + (currentY - cy) * 0.5 + Math.cos(time * 2 + i) * 5;
        ctx.quadraticCurveTo(midX, midY, currentX, currentY);
        ctx.stroke();
        ctx.restore();

        // Target dot connector soft aura
        if (emergence > 0.4) {
          ctx.save();
          const nodeGlow = ctx.createRadialGradient(currentX, currentY, 0, currentX, currentY, isThisActive ? 40 : 22);
          nodeGlow.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.95 * alphaMultiplier})`);
          nodeGlow.addColorStop(1, "rgba(0,0,0,0)");

          ctx.fillStyle = nodeGlow;
          ctx.beginPath();
          ctx.arc(currentX, currentY, isThisActive ? 40 : 22, 0, Math.PI * 2);
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
  }, [activePillarId, hoveredId, progressRef, dotTargets]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full pointer-events-none"
    />
  );
}
