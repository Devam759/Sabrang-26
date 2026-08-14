"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useAuth } from "@/components/auth/AuthProvider";
import ThreeBackground from "@/components/effects/ThreeBackground";
import { useInteraction } from "@/components/InteractionContext";
import CountdownTimer from "@/components/home/CountdownTimer";
import FloatingParticles from "@/components/home/FloatingParticles";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const EVENTS = [
  {
    num: "01",
    title: "PANACHE",
    subtitle: "THE RUNWAY",
    desc: "The ultimate fashion showdown. Assert dominance on the runway with style that speaks volumes.",
    image: "/panache-runway.png",
    state: "primary" as const,
  },
  {
    num: "02",
    title: "BANDJAM",
    subtitle: "THE SOUND",
    desc: "Pure sonic warfare under the open sky. The battle of the bands — raw, unfiltered, electric.",
    image: "/sabrang-live.png",
    state: "secondary" as const,
  },
  {
    num: "03",
    title: "STEP-UP",
    subtitle: "THE MOVEMENT",
    desc: "Synchronized tactical dance battles. Flawless execution required. No mercy on the floor.",
    image: "/step-up.jpg",
    state: "tertiary" as const,
  },
];

const MANIFESTO =
  "We don't just host events. We create experiences that shatter boundaries, ignite passions, and redefine what a cultural festival can be.";

const STATS = [
  { value: "50+", label: "Events", accent: "#9d4edd" },
  { value: "₹2.5L", label: "Prize Pool", accent: "#ff00ff" },
  { value: "5000+", label: "Attendees", accent: "#00e5ff" },
  { value: "3", label: "Days", accent: "#ffc800" },
];

export default function HomeClient() {
  const { user } = useAuth();
  const { setHoverState } = useInteraction();
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const manifestoRef = useRef<HTMLDivElement>(null);
  const eventsRef = useRef<HTMLDivElement>(null);
  const countdownRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const mX = useMotionValue(0);
  const mY = useMotionValue(0);
  const x = useSpring(mX, { damping: 15, stiffness: 150 });
  const y = useSpring(mY, { damping: 15, stiffness: 150 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (typeof window === "undefined") return;
    mX.set((e.clientX - window.innerWidth / 2) * 0.05);
    mY.set((e.clientY - window.innerHeight / 2) * 0.05);
  };
  const handleMouseLeave = () => {
    mX.set(0);
    mY.set(0);
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      const isMobile = window.innerWidth < 768;
      const splitScrub = isMobile ? 0.35 : 0.6;
      const splitY = isMobile ? 135 : 180;
      const splitScale = isMobile ? 1.15 : 1.3;

      // ── HERO: split title apart on scroll ──
      gsap.to(".hero-top-half", {
        yPercent: -splitY,
        opacity: 0,
        scale: splitScale,
        force3D: true,
        ease: "power1.out",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: isMobile ? "48% top" : "55% top",
          scrub: splitScrub,
        },
      });
      gsap.to(".hero-bottom-half", {
        yPercent: splitY,
        opacity: 0,
        scale: splitScale,
        force3D: true,
        ease: "power1.out",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: isMobile ? "48% top" : "55% top",
          scrub: splitScrub,
        },
      });
      gsap.to(".hero-year-badge", {
        opacity: 0,
        scale: 0.5,
        force3D: true,
        ease: "power1.out",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "38% top",
          scrub: splitScrub,
        },
      });
      gsap.to(".hero-scroll-hint", {
        opacity: 0,
        y: -25,
        force3D: true,
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "15% top",
          scrub: 0.3,
        },
      });

      // Subtitle + CTA reveal after split
      gsap.from(".hero-reveal", {
        opacity: 0,
        y: isMobile ? 45 : 80,
        scale: 0.94,
        force3D: true,
        ease: "power2.out",
        scrollTrigger: {
          trigger: heroRef.current,
          start: isMobile ? "30% top" : "35% top",
          end: isMobile ? "58% top" : "65% top",
          scrub: isMobile ? 0.4 : 0.8,
        },
      });
      gsap.from(".hero-cta-wrap", {
        opacity: 0,
        y: 40,
        force3D: true,
        ease: "power2.out",
        scrollTrigger: {
          trigger: heroRef.current,
          start: isMobile ? "35% top" : "40% top",
          end: isMobile ? "60% top" : "68% top",
          scrub: isMobile ? 0.4 : 0.8,
        },
      });

      // ── MARQUEE: parallax speed differential ──
      gsap.to(".mq-track-1", {
        xPercent: -15,
        ease: "none",
        scrollTrigger: {
          trigger: ".mq-section",
          start: "top bottom",
          end: "bottom top",
          scrub: 0.3,
        },
      });
      gsap.to(".mq-track-2", {
        xPercent: 15,
        ease: "none",
        scrollTrigger: {
          trigger: ".mq-section",
          start: "top bottom",
          end: "bottom top",
          scrub: 0.3,
        },
      });

      // ── MANIFESTO: word-by-word reveal ──
      gsap.from(".m-word", {
        opacity: 0.06,
        stagger: 0.015,
        ease: "none",
        scrollTrigger: {
          trigger: manifestoRef.current,
          start: "top 65%",
          end: "center 35%",
          scrub: 0.5,
        },
      });

      // Stats fly in
      gsap.from(".stat-card", {
        y: 90,
        opacity: 0,
        scale: 0.85,
        stagger: 0.12,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".stats-row",
          start: "top 82%",
          toggleActions: "play none none reverse",
        },
      });

      // ── EVENT CARDS: alternating slide-in ──
      document.querySelectorAll(".ev-card").forEach((card, i) => {
        const dir = i % 2 === 0 ? -1 : 1;
        gsap.from(card, {
          x: dir * 180,
          opacity: 0,
          scale: 0.88,
          rotateY: dir * 12,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 88%",
            toggleActions: "play none none reverse",
          },
        });
        const img = card.querySelector(".ev-img");
        if (img) {
          gsap.to(img, {
            yPercent: -12,
            ease: "none",
            scrollTrigger: {
              trigger: card,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.4,
            },
          });
        }
      });

      gsap.from(".ev-section-title", {
        x: -160,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: eventsRef.current,
          start: "top 82%",
          toggleActions: "play none none reverse",
        },
      });

      // ── COUNTDOWN: scale in ──
      gsap.from(".cd-content", {
        scale: 0.6,
        opacity: 0,
        duration: 1.5,
        ease: "power3.out",
        scrollTrigger: {
          trigger: countdownRef.current,
          start: "top 72%",
          toggleActions: "play none none reverse",
        },
      });

      // ── CTA: dramatic reveal ──
      gsap.from(".cta-inner", {
        y: 120,
        opacity: 0,
        scale: 0.85,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ctaRef.current,
          start: "top 72%",
          toggleActions: "play none none reverse",
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative bg-transparent font-sans">
      <ThreeBackground />
      <FloatingParticles />

      {/* ═══ HERO ═══ */}
      <div ref={heroRef} className="h-[280vh] relative z-10">
        <div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center"
        >
          {/* Split title – top half */}
          <div
            className="hero-top-half absolute inset-0 flex items-center justify-center z-20 pointer-events-none will-change-transform will-change-opacity transform-gpu"
            style={{
              clipPath: "inset(0% 0% 50% 0%)",
              WebkitClipPath: "inset(0% 0% 50% 0%)",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            <motion.h1
              className="text-[16vw] sm:text-[15vw] md:text-[14vw] font-black tracking-[-0.06em] uppercase text-white leading-[0.85]"
              style={{ x, y, textShadow: "0 0 60px rgba(157,78,221,0.25)" }}
            >
              SABRANG
            </motion.h1>
          </div>
          {/* Split title – bottom half */}
          <div
            className="hero-bottom-half absolute inset-0 flex items-center justify-center z-20 pointer-events-none will-change-transform will-change-opacity transform-gpu"
            style={{
              clipPath: "inset(50% 0% 0% 0%)",
              WebkitClipPath: "inset(50% 0% 0% 0%)",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            <motion.h1
              className="text-[16vw] sm:text-[15vw] md:text-[14vw] font-black tracking-[-0.06em] uppercase text-white leading-[0.85]"
              style={{ x, y, textShadow: "0 0 60px rgba(157,78,221,0.25)" }}
            >
              SABRANG
            </motion.h1>
          </div>

          {/* Year badge */}
          <div className="hero-year-badge absolute top-1/2 left-1/2 -translate-x-1/2 mt-[7vh] sm:mt-[9vh] z-20 pointer-events-none">
            <span className="text-sm sm:text-lg md:text-2xl font-extralight tracking-[0.4em] sm:tracking-[0.6em] text-white/40 uppercase">
              — 2026 —
            </span>
          </div>

          {/* Reveal content (appears after title splits) */}
          <div className="hero-reveal absolute inset-0 flex flex-col items-center justify-center z-15 pointer-events-none">
            <div className="text-center px-4 sm:px-6">
              <div className="text-[9px] sm:text-[10px] md:text-xs tracking-[0.35em] sm:tracking-[0.5em] text-white/35 uppercase mb-4 sm:mb-5 font-light">
                JK Lakshmipat University Presents
              </div>
              <h2 className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-extralight text-white tracking-tight mb-4 sm:mb-6">
                The Cultural{" "}
                <span className="font-bold bg-gradient-to-r from-[#9d4edd] via-[#ff00ff] to-[#00e5ff] bg-clip-text text-transparent">
                  Phenomenon
                </span>
              </h2>
              <p className="text-sm sm:text-base md:text-xl text-white/50 font-light max-w-xl mx-auto leading-relaxed">
                Three days of art, music, dance, and unbridled creativity.
              </p>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="hero-cta-wrap absolute bottom-14 sm:bottom-20 left-1/2 -translate-x-1/2 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 z-30 pointer-events-auto w-[85%] sm:w-auto">
            <Link
              href="/register"
              className="w-full sm:w-auto text-center group relative px-8 sm:px-10 py-3.5 sm:py-4 bg-white text-black font-bold text-xs sm:text-sm tracking-widest uppercase overflow-hidden transition-all duration-500 hover:shadow-[0_0_50px_rgba(157,78,221,0.5)] min-h-[44px] flex items-center justify-center"
            >
              <span className="relative z-10 group-hover:text-white transition-colors duration-300">
                Register Now
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#9d4edd] to-[#ff00ff] translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            </Link>
            <Link
              href="/events"
              className="w-full sm:w-auto text-center px-8 sm:px-10 py-3.5 sm:py-4 border border-white/25 text-white/80 font-light text-xs sm:text-sm tracking-widest uppercase hover:bg-white/10 hover:border-white/50 transition-all duration-300 min-h-[44px] flex items-center justify-center"
            >
              Explore Events
            </Link>
          </div>

          {/* Scroll hint */}
          <div className="hero-scroll-hint absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none">
            <span className="text-[8px] sm:text-[9px] tracking-[0.4em] sm:tracking-[0.5em] text-white/25 uppercase font-light">
              Scroll
            </span>
            <div className="w-px h-8 sm:h-10 bg-gradient-to-b from-white/40 to-transparent animate-pulse" />
          </div>

          {/* Corner HUD accents */}
          <div className="absolute top-4 left-4 sm:top-10 sm:left-10 w-6 h-6 sm:w-10 sm:h-10 border-t border-l border-white/15 pointer-events-none z-20" />
          <div className="absolute top-4 right-4 sm:top-10 sm:right-10 w-6 h-6 sm:w-10 sm:h-10 border-t border-r border-white/15 pointer-events-none z-20" />
          <div className="absolute bottom-4 left-4 sm:bottom-10 sm:left-10 w-6 h-6 sm:w-10 sm:h-10 border-b border-l border-white/15 pointer-events-none z-20" />
          <div className="absolute bottom-4 right-4 sm:bottom-10 sm:right-10 w-6 h-6 sm:w-10 sm:h-10 border-b border-r border-white/15 pointer-events-none z-20" />
        </div>
      </div>

      {/* ═══ MARQUEE ═══ */}
      <div className="mq-section relative z-20 py-10 md:py-14 overflow-hidden border-y border-white/[0.04] bg-black/40 backdrop-blur-sm">
        <div className="mq-track-1 flex whitespace-nowrap mb-3">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="text-5xl md:text-8xl font-black uppercase tracking-[-0.02em] mx-4 select-none text-white/[0.04]"
              style={{ WebkitTextStroke: "1px rgba(255,255,255,0.07)" }}
            >
              CULTURE ✦ MUSIC ✦ DANCE ✦ ART ✦ FASHION ✦ DRAMA ✦ INNOVATION
              ✦&nbsp;
            </span>
          ))}
        </div>
        <div className="mq-track-2 flex whitespace-nowrap">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="text-5xl md:text-8xl font-black uppercase tracking-[-0.02em] mx-4 select-none text-white/[0.03]"
              style={{ WebkitTextStroke: "1px rgba(255,255,255,0.05)" }}
            >
              SABRANG ✦ JKLU ✦ FESTIVAL ✦ EXPERIENCE ✦ CREATE ✦ PERFORM ✦
              INSPIRE ✦&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ═══ MANIFESTO ═══ */}
      <div
        ref={manifestoRef}
        className="relative z-20 min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 md:px-16 py-20 sm:py-32"
      >
        <div className="max-w-6xl w-full">
          <div className="text-[9px] sm:text-[10px] tracking-[0.4em] sm:tracking-[0.5em] text-white/25 uppercase mb-8 sm:mb-14 font-light">
            ◈ Our Manifesto
          </div>
          <p className="text-2xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-light text-white leading-[1.35] tracking-tight mb-16 sm:mb-28">
            {MANIFESTO.split(" ").map((w, i) => (
              <span key={i} className="m-word inline-block mr-[0.32em]">
                {w}
              </span>
            ))}
          </p>
          <div className="stats-row grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.04]">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="stat-card bg-black/50 backdrop-blur-xl p-5 sm:p-8 md:p-14 flex flex-col items-center text-center group hover:bg-white/[0.03] transition-colors duration-500"
              >
                <div
                  className="text-3xl sm:text-4xl md:text-6xl font-black text-white mb-2 sm:mb-3 tracking-tighter"
                  style={{ textShadow: `0 0 40px ${s.accent}35` }}
                >
                  {s.value}
                </div>
                <div className="text-[8px] sm:text-[9px] md:text-[11px] tracking-[0.25em] sm:tracking-[0.3em] text-white/35 uppercase font-light">
                  {s.label}
                </div>
                <div
                  className="w-6 sm:w-8 h-px mt-4 sm:mt-5 transition-all duration-500 group-hover:w-20"
                  style={{ background: s.accent }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ FEATURED EVENTS ═══ */}
      <div
        ref={eventsRef}
        className="relative z-20 py-20 sm:py-28 md:py-44 px-4 sm:px-6 md:px-16"
      >
        <div className="max-w-7xl mx-auto">
          <div className="ev-section-title mb-16 sm:mb-24 md:mb-36">
            <div className="text-[9px] sm:text-[10px] tracking-[0.4em] sm:tracking-[0.5em] text-white/25 uppercase mb-4 sm:mb-5 font-light">
              ◈ Flagship Events
            </div>
            <h2 className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-black text-white tracking-[-0.04em] uppercase leading-[0.9]">
              Core
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9d4edd] to-[#ff00ff]">
                Directives
              </span>
            </h2>
          </div>

          <div className="space-y-20 sm:space-y-28 md:space-y-44">
            {EVENTS.map((ev, i) => (
              <div
                key={ev.num}
                className="ev-card group"
                onMouseEnter={() => setHoverState(ev.state)}
                onMouseLeave={() => setHoverState("idle")}
              >
                <div
                  className={`flex flex-col ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} items-center gap-6 sm:gap-10 md:gap-20`}
                >
                  {/* Image */}
                  <div className="w-full md:w-1/2 relative overflow-hidden aspect-[16/10] sm:aspect-[4/3] rounded-xl sm:rounded-none">
                    <div className="ev-img absolute inset-0 w-full h-[125%] -top-[12%]">
                      <img
                        src={ev.image}
                        alt={ev.title}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    </div>
                    <div className="absolute top-2 left-3 sm:top-4 sm:left-5 text-6xl sm:text-[10rem] md:text-[14rem] font-black text-white/[0.06] sm:text-white/[0.04] leading-none pointer-events-none select-none">
                      {ev.num}
                    </div>
                  </div>
                  {/* Text */}
                  <div className="w-full md:w-1/2 relative">
                    <div className="text-[9px] sm:text-[10px] tracking-[0.35em] sm:tracking-[0.4em] text-white/25 uppercase mb-3 sm:mb-4 font-light">
                      {ev.subtitle}
                    </div>
                    <h3 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-white uppercase tracking-[-0.04em] mb-4 sm:mb-6 transition-all duration-500 group-hover:tracking-[-0.02em]">
                      {ev.title}
                    </h3>
                    <p className="text-sm sm:text-base md:text-lg text-white/45 font-light leading-relaxed mb-6 sm:mb-10 max-w-lg">
                      {ev.desc}
                    </p>
                    <Link
                      href="/events"
                      className="inline-flex items-center gap-3 text-xs tracking-[0.25em] text-white/50 uppercase font-light group-hover:text-white transition-colors duration-300 min-h-[44px]"
                    >
                      <span>Learn More</span>
                      <svg
                        className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    </Link>
                    <div className="absolute -bottom-10 sm:-bottom-14 left-0 w-full h-px bg-gradient-to-r from-white/8 to-transparent" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ COUNTDOWN ═══ */}
      <div
        ref={countdownRef}
        className="relative z-20 min-h-screen flex items-center justify-center px-4 sm:px-6 py-20 sm:py-32"
      >
        <div className="cd-content text-center w-full max-w-4xl">
          <div className="text-[9px] sm:text-[10px] tracking-[0.4em] sm:tracking-[0.5em] text-white/25 uppercase mb-4 sm:mb-6 font-light">
            ◈ Mark Your Calendar
          </div>
          <h2 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-white uppercase tracking-[-0.04em] mb-12 sm:mb-20 leading-[0.95]">
            The Countdown{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff00ff] to-[#00e5ff]">
              Begins
            </span>
          </h2>
          <CountdownTimer targetDate="2026-10-23T00:00:00" />
          <div className="mt-12 sm:mt-20 flex items-center justify-center gap-3 sm:gap-5">
            <div className="w-8 sm:w-16 h-px bg-white/15" />
            <span className="text-[9px] sm:text-[10px] tracking-[0.25em] sm:tracking-[0.35em] text-white/25 uppercase font-light">
              October 23–25, 2026
            </span>
            <div className="w-8 sm:w-16 h-px bg-white/15" />
          </div>
        </div>
      </div>

      {/* ═══ CTA ═══ */}
      <div
        ref={ctaRef}
        className="relative z-20 min-h-[85vh] flex items-center justify-center px-4 sm:px-6 py-20 sm:py-32 overflow-hidden"
      >
        <div className="cta-inner text-center relative w-full max-w-2xl">
          <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none">
            <div className="w-full max-w-[300px] sm:max-w-[500px] h-[300px] sm:h-[500px] rounded-full bg-[#9d4edd]/8 blur-[100px] sm:blur-[140px]" />
          </div>
          <div className="text-[9px] sm:text-[10px] tracking-[0.4em] sm:tracking-[0.5em] text-white/25 uppercase mb-4 sm:mb-6 font-light">
            ◈ Be Part Of It
          </div>
          <h2 className="text-4xl sm:text-7xl md:text-8xl lg:text-[10rem] font-black text-white uppercase tracking-[-0.05em] mb-2 sm:mb-4 leading-[0.85]">
            Ready
          </h2>
          <h2 className="text-4xl sm:text-7xl md:text-8xl lg:text-[10rem] font-black uppercase tracking-[-0.05em] mb-8 sm:mb-10 leading-[0.85] text-transparent bg-clip-text bg-gradient-to-r from-[#9d4edd] via-[#ff00ff] to-[#00e5ff]">
            To Join?
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-white/35 font-light mb-10 sm:mb-14 max-w-md mx-auto leading-relaxed">
            Secure your spot at the most anticipated cultural festival of 2026.
          </p>
          <Link
            href="/register"
            className="group relative inline-flex items-center justify-center gap-4 px-10 sm:px-14 py-4 sm:py-6 bg-white text-black font-black text-sm sm:text-base tracking-widest uppercase overflow-hidden transition-all duration-500 hover:shadow-[0_0_100px_rgba(157,78,221,0.5)] min-h-[48px] w-[90%] sm:w-auto"
          >
            <span className="relative z-10 group-hover:text-white transition-colors duration-300">
              Register Now
            </span>
            <svg
              className="w-5 h-5 relative z-10 group-hover:translate-x-2 group-hover:text-white transition-all duration-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
            <div className="absolute inset-0 bg-gradient-to-r from-[#9d4edd] to-[#ff00ff] translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          </Link>
          <div className="mt-16 sm:mt-28 flex items-center justify-center gap-1">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-white/15"
                style={{ height: `${10 + Math.sin(i * 0.9) * 8}px` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
