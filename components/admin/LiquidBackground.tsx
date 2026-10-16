'use client';

import React from 'react';

export default function LiquidBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-slate-50 pointer-events-none">
      {/* 
        High-performance ambient glow background:
        - On mobile/touch: Use a lightweight static CSS radial-gradient (0% GPU rasterization overhead, zero thermal throttling).
        - On desktop (md:): Render the full animated multi-blob ambient glow.
      */}

      {/* Mobile-optimized static subtle glow (zero CPU/GPU strain) */}
      <div 
        className="block md:hidden absolute inset-0 opacity-60 pointer-events-none" 
        style={{
          background: 'radial-gradient(circle at 15% 15%, rgba(216, 180, 254, 0.35) 0%, transparent 45%), radial-gradient(circle at 85% 75%, rgba(147, 197, 253, 0.3) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(244, 114, 182, 0.15) 0%, transparent 40%)'
        }}
      />

      {/* Desktop high-performance animated ambient glow */}
      <div className="hidden md:block absolute inset-0 opacity-40 mix-blend-multiply">
        {/* Blob 1: Bright Purple */}
        <div className="absolute w-[800px] h-[800px] bg-purple-300/40 rounded-full blur-[100px] animate-liquid-1"
             style={{ top: '0%', left: '10%', willChange: 'transform' }} />
             
        {/* Blob 2: Neon Blue */}
        <div className="absolute w-[700px] h-[700px] bg-blue-300/40 rounded-full blur-[90px] animate-liquid-2"
             style={{ top: '30%', right: '-10%', willChange: 'transform' }} />
             
        {/* Blob 3: Deep Indigo */}
        <div className="absolute w-[900px] h-[900px] bg-indigo-300/40 rounded-full blur-[120px] animate-liquid-3"
             style={{ bottom: '-20%', left: '20%', willChange: 'transform' }} />
             
        {/* Blob 4: Fuchsia */}
        <div className="absolute w-[600px] h-[600px] bg-fuchsia-300/40 rounded-full blur-[90px] animate-liquid-4"
             style={{ top: '15%', left: '45%', willChange: 'transform' }} />
      </div>

      {/* Noise grain texture for desktop (hidden on mobile to save raster cycles) */}
      <div className="hidden md:block absolute inset-0 opacity-[0.06] mix-blend-multiply pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
    </div>
  );
}