"use client";

import React from "react";
import LogoLoop from "@/components/ui/LogoLoop";
import { PAST_SPONSORS } from "@/lib/constants";
import Image from "next/image";

export default function SponsorsClient() {
  return (
    <div className="relative min-h-[85vh] flex flex-col items-center py-20 w-full overflow-hidden bg-[#030005] text-white">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-r from-amber-500/8 via-yellow-500/10 to-amber-600/8 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-blue-600/10 blur-[120px] pointer-events-none rounded-full" />

      {/* ═══════════ TITLE SPONSOR ═══════════ */}
      <section className="relative z-10 text-center space-y-6 px-4 mt-8 mb-4">
        <h1
          className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tight uppercase"
          style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}
        >
          Our Sponsors
        </h1>
        <p className="text-white/60 text-sm md:text-base max-w-lg mx-auto font-light tracking-wide">
          Powering Sabrang 2026
        </p>
      </section>

      <section className="relative z-10 w-full max-w-3xl mx-auto px-6 py-12">
        {/* Label */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <span className="h-px flex-1 max-w-[120px] bg-gradient-to-r from-transparent to-amber-500/50" />
          <span
            className="text-base md:text-xl font-semibold tracking-[0.3em] uppercase text-amber-400/90"
            style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}
          >
            Title Sponsor
          </span>
          <span className="h-px flex-1 max-w-[120px] bg-gradient-to-l from-transparent to-amber-500/50" />
        </div>

        {/* Logo */}
        <div className="group relative flex items-center justify-center">
          {/* Glow behind logo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[400px] h-[220px] md:w-[520px] md:h-[280px] rounded-full bg-blue-500/10 blur-[80px] group-hover:bg-blue-500/15 transition-all duration-700" />
          </div>

          <Image
            src="/images/jk-paper-blue.png"
            alt="JK Paper - Title Sponsor"
            width={500}
            height={200}
            className="relative h-28 md:h-40 lg:h-48 w-auto object-contain drop-shadow-[0_0_30px_rgba(0,120,220,0.25)] transition-transform duration-500 group-hover:scale-105"
            priority
          />
        </div>
      </section>
      {/* ═══════════ DIVIDER ═══════════ */}
      <div className="relative z-10 w-full max-w-xl mx-auto py-6 flex items-center gap-4 px-8">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* ═══════════ EVENT SPONSORS ═══════════ */}
      <section className="relative z-10 w-full max-w-4xl mx-auto px-6 py-8">
        {/* Label */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <span className="h-px flex-1 max-w-[120px] bg-gradient-to-r from-transparent to-purple-500/50" />
          <span
            className="text-base md:text-xl font-semibold tracking-[0.3em] uppercase text-purple-400/90"
            style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}
          >
            Event Sponsors
          </span>
          <span className="h-px flex-1 max-w-[120px] bg-gradient-to-l from-transparent to-purple-500/50" />
        </div>

        {/* Logos */}
        <div className="flex flex-wrap items-center justify-center gap-12 md:gap-20">
          <div className="group relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[200px] h-[120px] rounded-full bg-purple-500/5 blur-[60px] group-hover:bg-purple-500/10 transition-all duration-700" />
            </div>
            <Image
              src="/images/krafton.png"
              alt="Krafton - Event Sponsor"
              width={300}
              height={120}
              className="relative h-28 md:h-40 lg:h-48 w-auto object-contain drop-shadow-[0_0_20px_rgba(168,130,255,0.15)] transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="group relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[200px] h-[120px] rounded-full bg-purple-500/5 blur-[60px] group-hover:bg-purple-500/10 transition-all duration-700" />
            </div>
            <Image
              src="/images/garena.jpg"
              alt="Garena - Event Sponsor"
              width={300}
              height={120}
              className="relative h-28 md:h-40 lg:h-48 w-auto object-contain drop-shadow-[0_0_20px_rgba(168,130,255,0.15)] transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        </div>
      </section>

      {/* ═══════════ DIVIDER ═══════════ */}
      <div className="relative z-10 w-full max-w-xl mx-auto py-6 flex items-center gap-4 px-8">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* ═══════════ FOOD PARTNERS ═══════════ */}
      <section className="relative z-10 w-full max-w-5xl mx-auto px-6 py-8">
        {/* Label */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <span className="h-px flex-1 max-w-[120px] bg-gradient-to-r from-transparent to-emerald-500/50" />
          <span
            className="text-base md:text-xl font-semibold tracking-[0.3em] uppercase text-emerald-400/90"
            style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}
          >
            Food Partners
          </span>
          <span className="h-px flex-1 max-w-[120px] bg-gradient-to-l from-transparent to-emerald-500/50" />
        </div>

        {/* Logos in rows of 3 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-10 md:gap-14 place-items-center">
          {[
            { src: "/images/belgian-waffle-v2.jpg", alt: "Belgian Waffle" },
            { src: "/images/momo-miaa.jpeg", alt: "Momo Miaa" },
            { src: "/images/ocb.jpeg", alt: "OCB" },
            { src: "/images/otter-and-batter.jpeg", alt: "Otter and Batter" },
            { src: "/images/salt-sprayy.png", alt: "Salt Sprayy" },
            { src: "/images/the-sweet-theory-v2.jpeg", alt: "The Sweet Theory" },
          ].map((logo) => (
            <div key={logo.alt} className="group relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[160px] h-[100px] rounded-full bg-emerald-500/5 blur-[50px] group-hover:bg-emerald-500/10 transition-all duration-700" />
              </div>
              <Image
                src={logo.src}
                alt={`${logo.alt} - Food Partner`}
                width={300}
                height={120}
                className="relative h-28 md:h-36 lg:h-44 w-auto object-contain drop-shadow-[0_0_20px_rgba(100,220,160,0.15)] transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ DIVIDER ═══════════ */}
      <div className="relative z-10 w-full max-w-xl mx-auto py-6 flex items-center gap-4 px-8">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* ═══════════ PAST PARTNERS ═══════════ */}
      <section className="relative z-10 text-center space-y-4 px-4">
        <h2
          className="text-2xl md:text-4xl lg:text-5xl font-black text-white tracking-tight uppercase"
          style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}
        >
          Past Partners
        </h2>
        <p className="text-white/60 text-sm md:text-base max-w-lg mx-auto font-light tracking-wide">
          National and global brand collaborations
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
