"use client";

/**
 * SabrangSpectrumReel — 3D Holographic Stage & Kinetic Soundwave Reel
 *
 * A stunning, non-formal, high-energy festival experience:
 *   - Central 3D Holographic Stage featuring active realm photography with film lighting.
 *   - 4 Interactive Floating Neon Ring Apertures (01 SOUND, 02 STYLE, 03 TECH, 04 ARTS).
 *   - Live Audio Equalizer Pulse Bar (|||||||||||||).
 *   - Interactive 3D Perspective Gyro Tilt & Dynamic Sabrang Theme Color Swaps.
 */

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface RealmItem {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  tag: string;
  desc: string;
  gradient: string;
  glowColor: string;
  activeRing: string;
  badgeBg: string;
  accentText: string;
  btnGradient: string;
  image: string;
  eventsCount: string;
  highlights: string[];
}

const REALMS: RealmItem[] = [
  {
    id: "01",
    number: "01 / PANACHE",
    title: "PANACHE",
    subtitle: "HAUTE COUTURE · RUNWAY · HIGH ART",
    tag: "THE SOUL OF FASHION",
    desc: "The signature haute couture runway where fashion design meets theatrical choreography and fierce personal expression on a grand national stage.",
    gradient: "from-cyan-400 via-sky-500 to-blue-600",
    glowColor: "rgba(0, 255, 255, 0.45)",
    activeRing:
      "border-cyan-400 shadow-[0_0_35px_rgba(0,255,255,0.6)] text-cyan-300",
    badgeBg: "bg-cyan-500/20 text-cyan-300 border-cyan-400/40",
    accentText: "text-cyan-300",
    btnGradient: "from-cyan-600 via-sky-600 to-blue-600 shadow-cyan-600/40",
    image: "/panache-runway.png",
    eventsCount: "12+ Runway Shows",
    highlights: [
      "◆ Haute Couture Runway",
      "✦ Theatrical Styling",
      "✧ Designer Portfolios",
    ],
  },
  {
    id: "02",
    number: "02 / VERSEVAAD",
    title: "VERSEVAAD",
    subtitle: "LITERARY DEBATES · POETRY · SLAM",
    tag: "THE SOUL OF WORDS",
    desc: "An intense arena of spoken word, poetic rap battles, fierce literary debates, and high-impact verbal expression.",
    gradient: "from-amber-400 via-yellow-500 to-orange-500",
    glowColor: "rgba(255, 215, 0, 0.45)",
    activeRing:
      "border-amber-400 shadow-[0_0_35px_rgba(255,215,0,0.6)] text-amber-300",
    badgeBg: "bg-amber-500/20 text-amber-300 border-amber-400/40",
    accentText: "text-amber-300",
    btnGradient:
      "from-amber-500 via-yellow-500 to-orange-600 shadow-amber-500/40",
    image: "/versevaad.jpg",
    eventsCount: "10+ Literary Stages",
    highlights: [
      "🎤 Spoken Word Slam",
      "⚡ Parliamentary Debate",
      "📜 Slam Poetry",
    ],
  },
  {
    id: "03",
    number: "03 / ECHOS OF NOOR",
    title: "ECHOS OF NOOR",
    subtitle: "SUFI NIGHT · ACOUSTIC · CELEBRITY",
    tag: "THE SOUL OF MUSIC",
    desc: "Mesmerizing Sufi melodies, divine unplugged acoustics, and soul-stirring live musical performances illuminated under the stars.",
    gradient: "from-purple-500 via-violet-500 to-pink-500",
    glowColor: "rgba(157, 78, 221, 0.45)",
    activeRing:
      "border-purple-400 shadow-[0_0_35px_rgba(157,78,221,0.6)] text-purple-300",
    badgeBg: "bg-purple-500/20 text-purple-300 border-purple-400/40",
    accentText: "text-purple-300",
    btnGradient:
      "from-purple-600 via-violet-600 to-pink-600 shadow-purple-600/40",
    image: "/echos-of-noor.png",
    eventsCount: "Soulful Live Night",
    highlights: [
      "✦ Sufi & Classical Night",
      "♬ Acoustic Unplugged",
      "✨ Candlelight Melodies",
    ],
  },
  {
    id: "04",
    number: "04 / BAND JAM",
    title: "BAND JAM",
    subtitle: "BATTLE OF THE BANDS · ROCK · EDM",
    tag: "THE SOUL OF ROCK",
    desc: "Pure sonic warfare under the open sky — head-to-head rock battles, roaring drum solos, electric guitar riffs, and explosive band performances.",
    gradient: "from-fuchsia-500 via-pink-500 to-purple-600",
    glowColor: "rgba(255, 0, 255, 0.45)",
    activeRing:
      "border-fuchsia-400 shadow-[0_0_35px_rgba(255,0,255,0.6)] text-fuchsia-300",
    badgeBg: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-400/40",
    accentText: "text-fuchsia-400",
    btnGradient:
      "from-fuchsia-600 via-pink-600 to-purple-600 shadow-fuchsia-600/40",
    image: "/events_posters/BANDJAM.webp",
    eventsCount: "Battle of the Bands",
    highlights: [
      "⚡ Rock Battle Royale",
      "🎸 High Octane Riffs",
      "🥁 Live Open Air Stage",
    ],
  },
];

export default function SabrangSpectrumReel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const isHoveredRef = useRef<boolean>(false);

  // Auto-cycle through stages if user is not hovering
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isHoveredRef.current) {
        setActiveIdx((prev) => (prev + 1) % REALMS.length);
      }
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // GSAP Entrance animation
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        stage,
        { y: 70, opacity: 0, scale: 0.94 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: stage,
            start: "top 80%",
          },
        },
      );
    }, stage);

    return () => ctx.revert();
  }, []);

  // 3D Perspective Gyro Tilt on mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    gsap.to(stage, {
      rotateY: x * 8,
      rotateX: -y * 8,
      transformPerspective: 1400,
      duration: 0.4,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = () => {
    isHoveredRef.current = false;
    const stage = stageRef.current;
    if (stage) {
      gsap.to(stage, {
        rotateY: 0,
        rotateX: 0,
        duration: 0.6,
        ease: "power2.out",
      });
    }
  };

  const activeRealm = REALMS[activeIdx];

  return (
    <section
      ref={containerRef}
      className="relative w-full space-y-10 py-12 my-0 overflow-visible"
    >
      {/* Dynamic Ambient Glow Behind Holographic Stage */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[550px] rounded-full blur-[220px] pointer-events-none transition-all duration-1000 z-0"
        style={{ background: activeRealm.glowColor }}
      />

      {/* Kinetic Section Header */}
      <div className="relative z-20 text-center space-y-4 max-w-4xl mx-auto px-4">
        <div className="inline-flex items-center space-x-2.5 text-purple-300 text-xs font-mono tracking-[0.35em] uppercase bg-purple-500/10 px-4 py-1.5 rounded-full border border-purple-500/25 shadow-lg shadow-purple-500/10">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
          <span>SABRANG 2026 · FESTIVAL SPECTRUM</span>
        </div>

        <h3
          className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-white/40 drop-shadow-2xl"
          style={{ fontFamily: '"Syne", "Outfit", "Inter", sans-serif' }}
        >
          Experience The Spectrum
        </h3>

        <p className="text-slate-300 text-sm sm:text-base font-light max-w-xl mx-auto leading-relaxed">
          Four distinct dimensions of sound, style, technology, and expression.
        </p>
      </div>

      {/* Interactive Realm Ring Selectors (01 SOUND | 02 STYLE | 03 TECH | 04 ARTS) */}
      <div className="relative z-20 flex flex-wrap justify-center items-center gap-3 sm:gap-4 px-4">
        {REALMS.map((realm, i) => {
          const isSelected = i === activeIdx;

          return (
            <button
              key={realm.id}
              onClick={() => setActiveIdx(i)}
              onMouseEnter={() => {
                isHoveredRef.current = true;
                setActiveIdx(i);
              }}
              onMouseLeave={() => {
                isHoveredRef.current = false;
              }}
              className={`px-5 py-2.5 rounded-2xl font-mono text-xs tracking-wider uppercase transition-all duration-500 border backdrop-blur-xl flex items-center space-x-2.5 cursor-pointer ${
                isSelected
                  ? `bg-black/90 ${realm.activeRing} scale-105`
                  : "bg-black/40 border-white/15 text-slate-400 hover:text-white hover:border-white/30 hover:bg-black/70"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${isSelected ? "bg-current animate-pulse" : "bg-slate-600"}`}
              />
              <span className="font-bold">{realm.number}</span>
            </button>
          );
        })}
      </div>

      {/* STUNNING 3D HOLOGRAPHIC FESTIVAL STAGE */}
      <div className="relative z-10 max-w-5xl mx-auto px-4">
        <div
          ref={stageRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onMouseEnter={() => {
            isHoveredRef.current = true;
          }}
          className="relative w-full rounded-3xl overflow-hidden bg-black/85 border border-white/20 shadow-[0_30px_90px_rgba(0,0,0,0.9)] min-h-[480px] sm:min-h-[520px] flex flex-col justify-between p-7 sm:p-10 transition-all duration-700"
          style={{ transformStyle: "preserve-3d", willChange: "transform" }}
        >
          {/* Active Photo Background */}
          {REALMS.map((realm, idx) => (
            <div
              key={realm.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                idx === activeIdx
                  ? "opacity-100 z-0"
                  : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              <Image
                src={realm.image}
                alt={realm.title}
                fill
                sizes="(max-width: 1200px) 100vw, 1200px"
                quality={90}
                className="object-cover filter brightness-[0.55] scale-105 transition-transform duration-1000"
                priority={true}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
            </div>
          ))}

          {/* Accent Neon Top Sweep Line */}
          <div
            className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${activeRealm.gradient} z-20 transition-all duration-500`}
          />

          {/* Stage Header Info Bar */}
          <div className="relative z-20 flex justify-between items-start">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`text-xs font-mono tracking-widest uppercase px-3.5 py-1.5 rounded-full border backdrop-blur-md ${activeRealm.badgeBg}`}
              >
                {activeRealm.subtitle}
              </span>
              <span className="text-xs font-mono font-bold px-3.5 py-1.5 rounded-full bg-black/85 backdrop-blur-md text-white/90 border border-white/20 shadow-md">
                {activeRealm.eventsCount}
              </span>
            </div>

            {/* Live Audio Equalizer Pulse Meter */}
            <div className="hidden sm:flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/15">
              <div
                className="w-1 h-4 bg-cyan-400 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="w-1 h-6 bg-purple-400 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <div
                className="w-1 h-3 bg-pink-400 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
              <div
                className="w-1 h-5 bg-amber-400 rounded-full animate-bounce"
                style={{ animationDelay: "450ms" }}
              />
              <span className="text-[10px] font-mono text-white/60 pl-1">
                LIVE STAGE
              </span>
            </div>
          </div>

          {/* Main Stage Text Content */}
          <div className="relative z-20 space-y-4 pt-16 max-w-2xl">
            <div
              className={`text-xs sm:text-sm font-mono tracking-[0.3em] font-bold uppercase ${activeRealm.accentText}`}
            >
              {activeRealm.tag}
            </div>

            <h4
              className="text-4xl sm:text-6xl font-black text-white uppercase tracking-tight leading-none drop-shadow-2xl transition-all duration-500"
              style={{ fontFamily: '"Syne", "Outfit", "Inter", sans-serif' }}
            >
              {activeRealm.title}
            </h4>

            <p className="text-slate-200 text-sm sm:text-base leading-relaxed font-light drop-shadow-md">
              {activeRealm.desc}
            </p>

            {/* Highlight tags */}
            <div className="flex flex-wrap gap-2 pt-2">
              {activeRealm.highlights.map((tag, tIdx) => (
                <span
                  key={tIdx}
                  className="text-xs font-mono px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-md text-slate-200 border border-white/20 shadow-sm"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Explore Button */}
            <div className="pt-4">
              <Link
                href="/events"
                className={`inline-flex items-center space-x-3 px-7 py-3.5 rounded-2xl bg-gradient-to-r ${activeRealm.btnGradient} text-white font-bold text-xs font-mono uppercase tracking-widest transition-all duration-300 shadow-2xl hover:scale-105`}
              >
                <span>EXPLORE {activeRealm.title}</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
