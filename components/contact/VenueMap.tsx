'use client';

/**
 * VenueMap — Sabrang Contact Page Interactive GSAP Map Section
 *
 * Replicates the CodePen scroll-driven map pattern:
 *   - Custom JKLU Jaipur map image as the SVG <image> background
 *   - Animated SVG dot traveling a MotionPath route over real roads
 *   - Camera pans/zooms to follow the dot via GSAP quickTo x/y
 *   - Expand Map button → full-screen overlay
 *   - Close Map button → collapse back
 */

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, MotionPathPlugin, DrawSVGPlugin);
}

const SCHEDULE = [
  { time: 'Day 1 – Oct 24', detail: 'Grand Opening Ceremony & Pronite — White Amphitheatre, JKLU' },
  { time: 'Day 2 – Oct 25', detail: 'Flagship Events: Panache, Versevaad, Band Jam, Step Up & more' },
  { time: 'Day 3 – Oct 26', detail: 'Finals, Cultural Gala & Closing Pronite Spectacular' },
];

export default function VenueMap() {
  const sectionRef   = useRef<HTMLElement>(null);
  const mapWrapRef   = useRef<HTMLDivElement>(null);
  const svgRef       = useRef<SVGSVGElement>(null);
  const povGroupRef  = useRef<SVGGElement>(null);
  const dotRef       = useRef<SVGCircleElement>(null);
  const closeBtnRef  = useRef<HTMLButtonElement>(null);
  const mainTlRef    = useRef<gsap.core.Timeline | null>(null);

  /* ── GSAP: MotionPath dot + camera pan + ScrollTrigger pin ─────────── */
  useEffect(() => {
    const section  = sectionRef.current;
    const svg      = svgRef.current;
    const pov      = povGroupRef.current;
    const dot      = dotRef.current;
    if (!section || !svg || !pov || !dot) return;

    const ctx = gsap.context(() => {
      // Quick setters for smooth camera pan (follow dot)
      const xTo = gsap.quickTo(pov, 'x', { duration: 1, ease: 'expo' });
      const yTo = gsap.quickTo(pov, 'y', { duration: 1, ease: 'expo' });

      // Initial camera offset: explicitly 0, 0 so the whole map renders first
      gsap.set(pov, { x: 0, y: 0, scale: 1 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          pin: mapWrapRef.current,
          anticipatePin: 1,
          scrub: 1,
        },
        onUpdate: () => {
          // Camera pan disabled to ensure full map is visible at all times
          // xTo(0);
          // yTo(0);
        },
      })
        .to(dot, { motionPath: { path: '.venue-path', align: '.venue-path' }, immediateRender: true, ease: 'none' }, 0)
        .from('.venue-path', { drawSVG: '0 0', ease: 'none' }, 0);
        // Removed the fromTo(pov) animation that was shifting the map off-screen

      mainTlRef.current = tl;
    }, section);

    return () => ctx.revert();
  }, []);

  /* ── Expand map ────────────────────────────────────────────────────── */
  function expandMap() {
    const mapWrap  = mapWrapRef.current;
    const closeBtn = closeBtnRef.current;
    const tl       = mainTlRef.current;
    if (!mapWrap || !closeBtn) return;
    document.body.style.overflow = 'hidden';
    gsap.timeline()
      .set(mapWrap, { position: 'fixed', top: 0, left: 0, zIndex: 9999 })
      .to(mapWrap, { width: '100vw', height: '100vh', borderRadius: 0, duration: 0.55, ease: 'power3.inOut' })
      .to(tl, { progress: 1, ease: 'power2.inOut' }, 0)
      .to(closeBtn, { autoAlpha: 1, duration: 0.25 }, 0.3);
  }

  /* ── Collapse map ──────────────────────────────────────────────────── */
  function collapseMap() {
    const mapWrap  = mapWrapRef.current;
    const closeBtn = closeBtnRef.current;
    if (!mapWrap || !closeBtn) return;
    gsap.timeline({
      onComplete: () => {
        document.body.style.overflow = '';
        gsap.set(mapWrap, { clearProps: 'position,top,left,zIndex,width,height,borderRadius' });
        ScrollTrigger.refresh();
      },
    })
      .to(closeBtn, { autoAlpha: 0, duration: 0.2 })
      .to(mapWrap, { width: '100%', height: '100vh', borderRadius: 0, duration: 0.5, ease: 'expo.inOut' }, 0);
  }

  return (
    <>
      <style>{`
        @keyframes venuePing {
          0%, 100% { r: 4px; opacity: 1; }
          50%       { r: 9px; opacity: 0; }
        }
        .dot-start-ring { animation: venuePing 2s ease-out infinite; }
      `}</style>

      {/* Fixed close button */}
      <button
        ref={closeBtnRef}
        onClick={collapseMap}
        aria-label="Collapse map"
        style={{ opacity: 0, visibility: 'hidden' }}
        className="fixed bottom-6 right-6 z-[10000] flex items-center gap-2 px-5 py-3
                   bg-[#1B2D52]/95 backdrop-blur-xl border border-white/20 rounded-2xl
                   text-white font-bold text-xs uppercase tracking-widest
                   shadow-2xl hover:bg-[#223e6b] transition-colors"
      >
        <svg width="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.58.33a1.1 1.1 0 0 1 1.59 0l1.5 1.5c.44.44.44 1.15 0 1.59L19.59 7.5l1.83 1.83a1.13 1.13 0 0 1-.8 1.93h-6.75c-.62 0-1.12-.5-1.12-1.12V3.38a1.12 1.12 0 0 1 1.92-.8l1.83 1.83zM3.37 12.75h6.75c.62 0 1.12.5 1.12 1.12v6.75a1.12 1.12 0 0 1-1.92.8l-1.83-1.83-4.08 4.08c-.44.44-1.15.44-1.59 0l-1.5-1.5a1.1 1.1 0 0 1 0-1.59L4.4 16.5l-1.83-1.83a1.1 1.1 0 0 1-.24-1.23c.17-.42.58-.7 1.04-.7Z"/>
        </svg>
        Collapse Map
      </button>

      {/* ── Outer scroll container (extra height for GSAP pin room) ──── */}
      <section
        ref={sectionRef}
        id="venue-map-section"
        className="relative w-full"
        style={{ minHeight: '170vh', background: '#050508' }}
      >
        {/* Badge label */}
        <div className="relative z-10 text-center pt-16 pb-2 pointer-events-none">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                           bg-[#1B2D52]/60 border border-[#223e6b]/60
                           text-blue-200 text-xs font-mono tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            Festival Venue · JK Lakshmipat University · Jaipur
          </span>
        </div>

        {/* Split layout */}
        <div className="flex flex-col lg:flex-row w-full" style={{ minHeight: '100vh' }}>

          {/* LEFT — sticky map panel */}
          <div
            ref={mapWrapRef}
            className="relative w-full lg:w-1/2 overflow-hidden bg-[#F8F5EE]"
            style={{ height: '100vh', top: 0 }}
          >
            {/* ── SVG map container ──────────────────────────────────── */}
            <svg
              ref={svgRef}
              className="absolute inset-0 w-full h-full block"
              viewBox="0 0 1500 1500"
              preserveAspectRatio="xMidYMid slice"
              fill="none"
              style={{ width: '100%', height: '100%' }}
            >
              {/* Camera / POV group */}
              <g
                ref={povGroupRef}
                style={{ transformOrigin: '750px 750px', transformBox: 'fill-box' }}
              >
                {/* Map background image */}
                <image href="/jklu_map.png" x="0" y="0" width="1500" height="1500" preserveAspectRatio="xMidYMid slice" />

                {/*
                    Animated Route Path / Route Polyline
                    Traced to match the visual style of the reference image:
                    Start: JKLU entrance
                    End: Quartz Components (North)
                */}
                <path
                  className="venue-path"
                  stroke="#1B2D52"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  d="
                    M 1035 170
                    L 1025 320
                    L 1015 520
                    L 1005 720
                    L 995 920
                    L 985 970
                    L 965 990
                    L 865 970
                    L 765 950
                    L 645 930
                    L 585 920
                  "
                />

                {/* START MARKER */}
                <circle
                  cx="585" cy="920"
                  r="10"
                  fill="#ffffff"
                  stroke="#1B2D52"
                  strokeWidth="3"
                />

                {/* END MARKER */}
                <circle
                  cx="1035" cy="170"
                  r="10"
                  fill="#ffffff"
                  stroke="#1B2D52"
                  strokeWidth="3"
                />

                {/* Moving animated dot (travels the route) */}
                <circle
                  ref={dotRef}
                  r="8"
                  fill="#ffffff"
                  stroke="#1B2D52"
                  strokeWidth="3"
                  cx="1035"
                  cy="170"
                />
              </g>
            </svg>

            {/* Soft right-edge fade into the info panel, heavily reduced to not hide map */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(to right, transparent 90%, rgba(5,5,10,0.85) 100%)' }}
            />

            {/* Expand button */}
            <button
              onClick={expandMap}
              className="absolute bottom-6 right-6 z-10 flex items-center gap-2.5
                         px-5 py-3 rounded-2xl bg-[#1B2D52]/85 backdrop-blur-xl
                         border border-[#223e6b]/60 text-white font-bold text-xs
                         uppercase tracking-widest shadow-xl
                         hover:bg-[#223e6b] transition-all duration-300"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                <path d="m11.39 15.18-4.97 4.97 1.76 1.66c.81.81.24 2.19-.91 2.19H1.28C.57 24 0 23.42 0 22.71v-6a1.28 1.28 0 0 1 2.19-.91l1.66 1.77 4.97-4.97a.86.86 0 0 1 1.21 0l1.36 1.36c.33.33.33.88 0 1.21Zm1.22-6.36 4.97-4.97-1.76-1.66A1.28 1.28 0 0 1 16.73 0h6c.71 0 1.28.58 1.28 1.29v6a1.28 1.28 0 0 1-2.19.91l-1.66-1.77-4.97 4.97a.86.86 0 0 1-1.21 0l-1.36-1.36a.86.86 0 0 1 0-1.21Z"/>
              </svg>
              Expand Map
            </button>

            {/* Coordinate watermark */}
            <div className="absolute bottom-6 left-5 font-mono text-[10px] text-[#1B2D52]/50 tracking-widest select-none pointer-events-none">
              26.8385°N · 75.6463°E
            </div>
          </div>

          {/* RIGHT — venue info panel */}
          <div
            className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-14 py-16 space-y-10"
            style={{ background: 'rgba(5,5,10,0.97)' }}
          >
            <div className="space-y-3">
              <p className="font-mono text-xs text-blue-400/80 tracking-widest uppercase">Where the magic happens</p>
              <h2
                className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-tight"
                style={{ fontFamily: '"Syne","Outfit","Inter",sans-serif' }}
              >
                JK Lakshmipat<br />University
              </h2>
              <p className="text-white/50 text-sm leading-relaxed">Mahapura, Ajmer Road, Jaipur, Rajasthan 302026</p>
            </div>

            <div className="w-12 h-px bg-[#223e6b]" />

            <div className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-[#1B2D52]/30 border border-[#223e6b]/40 text-blue-300">
                <svg className="w-5 h-5" viewBox="0 0 384 512" fill="currentColor">
                  <path d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z"/>
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Campus Address</p>
                <p className="text-white/60 text-sm leading-relaxed mt-1">
                  JK Lakshmipat University<br />
                  Mahapura, Ajmer Road<br />
                  Jaipur, Rajasthan — 302 026
                </p>
              </div>
            </div>

            <div className="w-12 h-px bg-white/10" />

            <div className="space-y-5">
              <div className="flex items-center gap-2.5 text-white/80 text-xs font-mono tracking-widest uppercase">
                <svg className="w-4 h-4 text-blue-400" viewBox="0 0 448 512" fill="currentColor">
                  <path d="M0 464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V192H0v272zm320-196c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zm0 128c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zM192 268c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zm0 128c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zM64 268c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12H76c-6.6 0-12-5.4-12-12v-40zm0 128c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12H76c-6.6 0-12-5.4-12-12v-40zM400 64h-48V16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v48H160V16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v48H48C21.5 64 0 85.5 0 112v48h448v-48c0-26.5-21.5-48-48-48z"/>
                </svg>
                Sabrang 2026 Schedule
              </div>
              <ul className="space-y-4">
                {SCHEDULE.map((item, i) => (
                  <li key={i} className="flex gap-4 items-start bg-white/[0.03] border border-white/[0.07] rounded-xl px-5 py-4">
                    <span className="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
                    <div>
                      <p className="text-blue-300 font-bold text-xs font-mono tracking-wider uppercase">{item.time}</p>
                      <p className="text-white/70 text-sm leading-relaxed mt-0.5">{item.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="w-12 h-px bg-white/10" />

            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href="https://maps.google.com/?q=JK+Lakshmipat+University+Jaipur"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl
                           bg-[#1B2D52] hover:bg-[#223e6b] text-white font-bold text-xs
                           uppercase tracking-widest shadow-lg shadow-[#1B2D52]/40 transition-all duration-200"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open in Google Maps
              </a>
              <a
                href="https://www.jklu.edu.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl
                           bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20
                           text-white font-bold text-xs uppercase tracking-widest transition-all duration-200"
              >
                JKLU Website ↗
              </a>
            </div>

            <div className="pt-6 border-t border-white/[0.06]">
              <p className="font-mono text-[10px] text-white/25 tracking-widest">SABRANG 2026 · JKLU JAIPUR · ALL SHADES OF CREATIVITY</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
