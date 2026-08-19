"use client";

import React from "react";
import LogoLoop from "@/components/ui/LogoLoop";
import { PAST_SPONSORS } from "@/lib/constants";

export default function SponsorsClient() {
  return (
    <div className="relative min-h-[85vh] flex flex-col items-center justify-center py-20 w-full space-y-16 overflow-hidden bg-[#030005] text-white">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-blue-600/10 blur-[120px] pointer-events-none rounded-full" />

      <section className="relative z-10 text-center space-y-4 px-4">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tight uppercase">
          Past Partners
        </h1>
        <p className="text-white/40 text-sm md:text-base max-w-md mx-auto font-light tracking-wide">
          Proudly supported by leading national and global brands
        </p>
      </section>

      <section className="relative z-10 w-full overflow-hidden py-8">
        <LogoLoop
          logos={PAST_SPONSORS}
          speed={50}
          direction="left"
          logoHeight={64}
          gap={60}
          pauseOnHover={true}
          scaleOnHover={true}
          fadeOut={false}
          ariaLabel="Past Partners Showcase"
        />
      </section>
    </div>
  );
}
