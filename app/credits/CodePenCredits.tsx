"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";

/* ──────────────────────────────────────────────
   TECH TEAM DATA
   ────────────────────────────────────────────── */
const devTeam = [
  {
    name: "Devam Gupta",
    tag: "CORE",
    avatar: "/team-carousel/Devansh Srivastava.png",
    linkedin: "https://linkedin.com/in/devamsharma",
    github: "https://github.com/devamsharma",
    email: "devam@sabrang.in",
    instagram: "https://instagram.com/devamsharma",
  },
  {
    name: "Shubh Dixit",
    tag: "CO-ORDINATOR",
    avatar: "/tech team credit/Shubh dixt.png",
    linkedin: "https://www.linkedin.com/in/shubhdixit0912",
    github: "https://github.com/Shubhdix9",
    email: "Shubhdixit@jklu.edu.in",
    instagram: "https://www.instagram.com/shubh_dixit__",
  },
  {
    name: "Kartik Saini",
    tag: "CO-ORDINATOR",
    avatar: "/tech team credit/Kartik Saini.png",
    linkedin: "https://linkedin.com/in/kartik-14saini",
    github: "https://github.com/PrimeKartik",
    email: "kartiksaini@jklu.edu.in",
    instagram: "https://www.instagram.com/kartik_14saini?igsh=dTV2MTc5M2p1bnZq",
  },
  {
    name: "Lakshya Gupta",
    tag: "CO-ORDINATOR",
    avatar: "/tech team credit/Lakshya.png",
    linkedin: "https://www.linkedin.com/in/lakshya-gupta-b87616370/",
    github: "https://github.com/Metamorpho-1",
    email: "lakshyagupta@jklu.edu.in",
    instagram: "https://instagram.com/lakshyagupta",
  },
  {
    name: "Aditya Singh Nayal",
    tag: "CO-ORDINATOR",
    avatar: "/tech team credit/Aditya.png",
    linkedin: "https://www.linkedin.com/in/aditya-singh-nayal-5678b3378",
    github: "https://github.com/Aston-09",
    email: "adityasinghnayal@jklu.edu.in",
    instagram: "https://www.instagram.com/aston_axn",
  },
  {
    name: "Pratham Lalwani",
    tag: "CO-ORDINATOR",
    avatar: "/tech team credit/Pratham.png",
    linkedin: "https://www.linkedin.com/in/pratham2k07",
    github: "https://github.com/Pratham2k07",
    email: "prathamlalwani@jklu.edu.in",
    instagram: "https://www.instagram.com/pratham_lalwani05",
  },
  {
    name: "Saurav Tank",
    tag: "CO-ORDINATOR",
    avatar: "/tech team credit/Saurav.png",
    linkedin: "https://www.linkedin.com/in/saurav-tank/",
    github: "https://github.com/sauravtank1507",
    email: "sauravtank@jklu.edu.in",
    instagram: "https://instagram.com/sauravtank",
  },
];

const N = devTeam.length;
const AUTO_ADVANCE_MS = 8000;
const imgCls = (i: number) => `img-seq-${i}`;

const LinkedInIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const GithubIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
);

const MailIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const InstagramIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

export default function CodePenCredits() {
  const rootRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progRef = useRef<HTMLDivElement>(null);
  const progAnimRef = useRef<gsap.core.Tween | null>(null);
  const curRef = useRef(0);
  const busyRef = useRef(false);
  const goActionRef = useRef<(forward: boolean) => void>(() => {});

  const [activeIdx, setActiveIdx] = useState(0);

  /* ── Progress bar ── */
  const startProgress = useCallback(() => {
    if (!progRef.current) return;
    progAnimRef.current?.kill();
    gsap.set(progRef.current, { scaleX: 0, transformOrigin: "left center" });
    progAnimRef.current = gsap.to(progRef.current, {
      scaleX: 1,
      duration: AUTO_ADVANCE_MS / 1000,
      ease: "none",
    });
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    startProgress();
    timerRef.current = setTimeout(() => {
      goActionRef.current(true);
    }, AUTO_ADVANCE_MS);
  }, [startProgress]);

  /* ── GSAP & Animation ── */
  useEffect(() => {
    if (!rootRef.current) return;
    gsap.registerPlugin(CustomEase);
    CustomEase.create("hop", "M0,0 C0.3,0 0.1,1 1,1");

    const ctx = gsap.context(() => {
      const root = rootRef.current!;
      const wrapperLeft = root.querySelector<HTMLElement>(".cc-wrapper-left")!;
      const wrapperRight = root.querySelector<HTMLElement>(
        ".cc-wrapper-right-marquee",
      )!;
      const leftBoxes = root.querySelectorAll<HTMLElement>(".cc-box-left");
      const rightBoxes = root.querySelectorAll<HTMLElement>(
        ".cc-box-right-marquee",
      );
      const centerImgs =
        root.querySelectorAll<HTMLElement>(".cc-center-box img");
      const countTry = root.querySelector<HTMLElement>(".cc-try")!;

      /* init center images */
      centerImgs.forEach((el, i) => {
        el.style.visibility = i === 0 ? "visible" : "hidden";
      });

      /* Marquees: Left moves up, Right moves down */
      gsap.to(wrapperLeft, {
        y: "-50%",
        duration: 24,
        ease: "none",
        repeat: -1,
        onRepeat: () => gsap.set(wrapperLeft, { y: "0%" }),
      });

      if (wrapperRight) {
        gsap.fromTo(
          wrapperRight,
          { y: "-50%" },
          {
            y: "0%",
            duration: 24,
            ease: "none",
            repeat: -1,
            onRepeat: () => gsap.set(wrapperRight, { y: "-50%" }),
          },
        );
      }

      /* Entrance Animation */
      const centerBox = root.querySelector<HTMLElement>(".cc-center-box")!;
      gsap.to(centerBox, { height: "440px", duration: 1.2, ease: "hop" });
      gsap.to(leftBoxes, {
        clipPath: "polygon(0 0,100% 0,100% 100%,0 100%)",
        ease: "hop",
        duration: 1,
        stagger: 0.08,
      });
      if (rightBoxes.length > 0) {
        gsap.to(rightBoxes, {
          clipPath: "polygon(0 0,100% 0,100% 100%,0 100%)",
          ease: "hop",
          duration: 1,
          stagger: 0.08,
        });
      }

      /* Slide Center */
      const slideCenter = (from: number, to: number, forward: boolean) => {
        const old_ = centerImgs[from] as HTMLElement;
        const new_ = centerImgs[to] as HTMLElement;
        if (!old_ || !new_) return;
        gsap.set(new_, {
          visibility: "visible",
          clipPath: forward
            ? "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)"
            : "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)",
          zIndex: 2,
          scale: 1.08,
        });
        gsap.to(new_, {
          clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
          scale: 1,
          duration: 0.9,
          ease: "hop",
          onComplete: () => {
            old_.style.visibility = "hidden";
            new_.style.zIndex = "1";
          },
        });
      };

      /* Slide Side Boxes */
      const slideSideStrip = (
        boxes: NodeListOf<HTMLElement>,
        fromCls: string,
        toCls: string,
        forward: boolean,
      ) => {
        boxes.forEach((box, bi) => {
          const fromImg = box.querySelector<HTMLElement>(`.${fromCls}`)!;
          const toImg = box.querySelector<HTMLElement>(`.${toCls}`)!;
          if (!fromImg || !toImg) return;
          gsap.set(toImg, {
            visibility: "visible",
            clipPath: forward
              ? "polygon(0 100%, 100% 100%, 100% 100%, 0% 100%)"
              : "polygon(0 0%, 100% 0%, 100% 0%, 0% 0%)",
            zIndex: 2,
            scale: 1.4,
          });
          gsap.to(toImg, {
            clipPath: "polygon(0 0%, 100% 0%, 100% 100%, 0% 100%)",
            ease: "hop",
            duration: 0.9,
            scale: 1,
            delay: 0.05 * bi,
            onComplete: () => {
              fromImg.style.visibility = "hidden";
              toImg.style.zIndex = "1";
            },
          });
        });
      };

      /* Transition Controller */
      const go = (forward: boolean) => {
        if (busyRef.current) return;
        busyRef.current = true;
        const prev = curRef.current;
        curRef.current = forward ? (prev + 1) % N : (prev - 1 + N) % N;
        const next = curRef.current;

        if (countTry) {
          gsap.to(countTry, {
            y: `${next * -14}px`,
            ease: "hop",
            duration: 0.35,
          });
        }
        slideCenter(prev, next, forward);
        slideSideStrip(leftBoxes, imgCls(prev), imgCls(next), forward);
        if (rightBoxes.length > 0) {
          slideSideStrip(rightBoxes, imgCls(prev), imgCls(next), forward);
        }

        setActiveIdx(next);
        setTimeout(() => {
          busyRef.current = false;
        }, 950);
        resetTimer();
      };

      goActionRef.current = go;

      setTimeout(() => startProgress(), 1300);
      timerRef.current = setTimeout(
        () => goActionRef.current(true),
        AUTO_ADVANCE_MS + 1300,
      );
    }, rootRef);

    return () => {
      ctx.revert();
      if (timerRef.current) clearTimeout(timerRef.current);
      progAnimRef.current?.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentMember = devTeam[activeIdx];
  const nextMember = devTeam[(activeIdx + 1) % N];

  const handlePrev = () => goActionRef.current(false);
  const handleNext = () => goActionRef.current(true);

  return (
    <div ref={rootRef} className="cc-root">
      {/* ── AMBIENT NEON GLOW EFFECTS ── */}
      <div className="cc-ambient-glow cc-glow-left" />
      <div className="cc-ambient-glow cc-glow-center" />
      <div className="cc-ambient-glow cc-glow-right" />

      {/* ── TOP CENTER PAGE TITLE (Inherits global Navbar for Logo & LiquidMetal Menu button) ── */}
      <div className="cc-top-header-bar">
        <h1 className="cc-title">TECH TEAM CREDITS</h1>
      </div>

      {/* ── LEFT MARQUEE GALLERY ── */}
      <div className="cc-gallery-side cc-gallery-left" aria-hidden="true">
        <div className="cc-gallery-overlay" />
        <div className="cc-wrapper-left">
          {[0, 1].map((g) => (
            <div key={g}>
              {[0, 1, 2, 3].map((b) => (
                <div key={b} className="cc-box-left">
                  {devTeam.map((m, i) => (
                    <img
                      key={i}
                      className={imgCls(i)}
                      src={m.avatar}
                      alt=""
                      style={{
                        visibility: i === 0 ? "visible" : "hidden",
                        clipPath:
                          i === 0
                            ? "polygon(0 0,100% 0,100% 100%,0 100%)"
                            : "polygon(0 100%,100% 100%,100% 100%,0 100%)",
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT MARQUEE GALLERY (SYMMETRICAL MIRROR) ── */}
      <div className="cc-gallery-side cc-gallery-right" aria-hidden="true">
        <div className="cc-gallery-overlay" />
        <div className="cc-wrapper-right-marquee">
          {[0, 1].map((g) => (
            <div key={g}>
              {[0, 1, 2, 3].map((b) => (
                <div key={b} className="cc-box-right-marquee">
                  {devTeam.map((m, i) => (
                    <img
                      key={i}
                      className={imgCls(i)}
                      src={m.avatar}
                      alt=""
                      style={{
                        visibility: i === 0 ? "visible" : "hidden",
                        clipPath:
                          i === 0
                            ? "polygon(0 0,100% 0,100% 100%,0 100%)"
                            : "polygon(0 100%,100% 100%,100% 100%,0 100%)",
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── CENTRAL PROFILE CARD ── */}
      <div className="cc-wrapper">
        {/* Counter Badge */}
        <div className="cc-counter-badge">
          <div className="cc-counter-try-wrap">
            <div className="cc-try">
              {devTeam.map((_, i) => (
                <span key={i}>{String(i + 1).padStart(2, "0")}</span>
              ))}
            </div>
          </div>
          <span className="cc-counter-sep">/</span>
          <span className="cc-counter-total">{String(N).padStart(2, "0")}</span>
        </div>

        {/* Center Image & Card */}
        <div className="cc-center-box-container">
          <div className="cc-center-card-halo" />
          <div className="cc-center-box">
            {devTeam.map((m, i) => (
              <img
                key={i}
                src={m.avatar}
                alt={m.name}
                style={{ visibility: i === 0 ? "visible" : "hidden", zIndex: 1 }}
              />
            ))}

            {/* Name Card Overlay */}
            <div className="cc-name-card">
              <span className="cc-name-tag">{currentMember.tag}</span>
              <h2 className="cc-name-title">{currentMember.name}</h2>
              <div className="cc-name-links">
                <a
                  href={currentMember.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cc-link-btn cc-link-li"
                >
                  <LinkedInIcon /> LinkedIn
                </a>
                <a
                  href={currentMember.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cc-link-btn cc-link-gh"
                >
                  <GithubIcon /> GitHub
                </a>
                <a
                  href={`mailto:${currentMember.email}`}
                  className="cc-link-btn cc-link-mail"
                >
                  <MailIcon /> Email
                </a>
                <a
                  href={currentMember.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cc-link-btn cc-link-ig"
                >
                  <InstagramIcon /> Instagram
                </a>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="cc-progress-track">
              <div ref={progRef} className="cc-progress-bar" />
            </div>
          </div>
        </div>

        {/* ── BOTTOM CENTER NAVIGATION ── */}
        <div className="cc-bottom-nav">
          <button
            className="cc-nav-btn cc-nav-prev"
            onClick={handlePrev}
            aria-label="Previous profile"
          >
            <span className="cc-nav-btn-arrow">←</span>
            <span className="cc-nav-btn-text">PREV</span>
          </button>

          {/* Dots & Indicator */}
          <div className="cc-nav-dots-container">
            <div className="cc-nav-dots">
              {devTeam.map((_, i) => (
                <div
                  key={i}
                  className={`cc-nav-dot${i === activeIdx ? " cc-nav-dot-active" : ""}`}
                />
              ))}
            </div>
          </div>

          <button
            className="cc-nav-btn cc-nav-next"
            onClick={handleNext}
            aria-label="Next profile"
          >
            <div className="cc-next-meta">
              <span className="cc-next-sublabel">UP NEXT</span>
              <span className="cc-next-name-preview">{nextMember.name}</span>
            </div>
            <span className="cc-nav-btn-arrow">→</span>
          </button>
        </div>
      </div>

      {/* ── STYLES ── */}
      <style>{`
        /* ─── Root ─── */
        .cc-root {
          position: fixed; inset: 0;
          background: #050507;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
          color: #fff;
          z-index: 0;
        }

        /* ─── Ambient Glows ─── */
        .cc-ambient-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(130px);
          pointer-events: none;
          z-index: 1;
        }
        .cc-glow-left {
          width: 400px; height: 500px;
          top: 20%; left: -100px;
          background: radial-gradient(circle, rgba(235, 30, 80, 0.12) 0%, rgba(0,0,0,0) 70%);
        }
        .cc-glow-center {
          width: 550px; height: 550px;
          top: 30%; left: 50%;
          transform: translate(-50%, -20%);
          background: radial-gradient(circle, rgba(80, 40, 220, 0.16) 0%, rgba(220, 20, 90, 0.08) 50%, rgba(0,0,0,0) 75%);
        }
        .cc-glow-right {
          width: 400px; height: 500px;
          top: 20%; right: -100px;
          background: radial-gradient(circle, rgba(0, 180, 255, 0.12) 0%, rgba(0,0,0,0) 70%);
        }

        /* ─── Top Center Page Title ─── */
        .cc-top-header-bar {
          position: absolute; top: 0; left: 0; right: 0;
          height: 90px;
          display: flex; align-items: center; justify-content: center;
          z-index: 40;
          pointer-events: none;
        }
        .cc-title {
          font-size: 22px; font-weight: 900; letter-spacing: 7px;
          text-transform: uppercase; color: #fff;
          font-family: 'Inter', sans-serif;
          margin: 0; line-height: 1;
          text-shadow: 0 0 40px rgba(255,255,255,0.25);
          white-space: nowrap;
          pointer-events: none;
        }

        /* ─── Side Galleries (Framing) ─── */
        .cc-gallery-side {
          position: absolute; top: 0; bottom: 0;
          width: 250px;
          overflow: hidden;
          z-index: 2;
          pointer-events: none;
        }
        .cc-gallery-left {
          left: 0;
        }
        .cc-gallery-right {
          right: 0;
        }

        /* Subtle edge gradient to blend galleries with background */
        .cc-gallery-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to right, rgba(5,5,7,0.3) 0%, rgba(5,5,7,0.85) 100%);
          z-index: 3;
          pointer-events: none;
        }
        .cc-gallery-right .cc-gallery-overlay {
          background: linear-gradient(to left, rgba(5,5,7,0.3) 0%, rgba(5,5,7,0.85) 100%);
        }

        .cc-wrapper-left, .cc-wrapper-right-marquee {
          position: absolute; top: 0; left: 0;
          width: 100%; display: flex; flex-direction: column;
          overflow: hidden; height: 200vh;
        }
        .cc-box-left, .cc-box-right-marquee {
          position: relative; width: 250px; height: 380px;
          overflow: hidden; margin-bottom: 12px; flex-shrink: 0;
          clip-path: polygon(0 0,0 0,0 100%,0 100%);
          opacity: 0.55;
          filter: grayscale(30%) contrast(110%);
          transition: opacity 0.4s ease;
        }
        .cc-box-left img, .cc-box-right-marquee img {
          position: absolute; width: 250px; height: 100%;
          object-fit: cover; transform: scale(1.05); top: 0; left: 0;
        }

        /* ─── Central Card & Navigation ─── */
        .cc-wrapper {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -48%);
          display: flex; flex-direction: column; align-items: center;
          z-index: 10;
          width: 440px;
          max-width: 90vw;
        }

        /* Counter Badge */
        .cc-counter-badge {
          align-self: flex-end;
          display: flex; align-items: center; gap: 3px;
          margin-bottom: 10px;
          font-family: monospace;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 3px 8px;
          border-radius: 4px;
        }
        .cc-counter-try-wrap { height: 14px; overflow: hidden; }
        .cc-try {
          display: flex; flex-direction: column; transform: translateY(0px);
          line-height: 14px;
        }
        .cc-try span {
          font-size: 11px; font-family: monospace; color: #fff;
          height: 14px; display: flex; align-items: center; font-weight: 600;
        }
        .cc-counter-sep, .cc-counter-total {
          font-size: 11px; font-family: monospace; color: rgba(255,255,255,0.4);
        }

        /* Central Container */
        .cc-center-box-container {
          position: relative;
          width: 440px;
          max-width: 100%;
          display: flex;
          justify-content: center;
        }

        /* Cinematic halo behind center card */
        .cc-center-card-halo {
          position: absolute;
          inset: -20px;
          background: radial-gradient(circle, rgba(235, 30, 80, 0.18) 0%, rgba(80, 40, 220, 0.12) 50%, transparent 75%);
          filter: blur(25px);
          border-radius: 20px;
          pointer-events: none;
          z-index: 0;
        }

        /* Center Image Box */
        .cc-center-box {
          position: relative;
          width: 440px;
          height: 280px;
          overflow: hidden;
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.12);
          box-shadow: 0 25px 60px -15px rgba(0,0,0,0.85), 0 0 40px rgba(235, 30, 80, 0.15);
          z-index: 1;
          background: #000;
        }
        .cc-center-box > img {
          position: absolute; inset: 0;
          width: 100%; height: 100%; object-fit: cover;
        }

        /* Name Card Overlay */
        .cc-name-card {
          position: absolute; bottom: 0; left: 0; right: 0;
          background: linear-gradient(to top, rgba(5,5,7,0.98) 0%, rgba(5,5,7,0.7) 60%, transparent 100%);
          padding: 24px 20px 18px;
          z-index: 10;
          display: flex; flex-direction: column; gap: 6px;
        }
        .cc-name-tag {
          font-size: 8.5px; letter-spacing: 2.5px; font-family: monospace;
          text-transform: uppercase; color: rgba(255,255,255,0.6);
          border: 1px solid rgba(255,255,255,0.22);
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(8px);
          padding: 3px 9px; border-radius: 2px;
          width: fit-content;
          font-weight: 600;
        }
        .cc-name-title {
          font-size: 24px; font-weight: 900; letter-spacing: -0.2px;
          color: #fff; margin: 0; line-height: 1.1;
          font-family: 'Inter', sans-serif; text-transform: uppercase;
          text-shadow: 0 2px 10px rgba(0,0,0,0.8);
        }
        .cc-name-links {
          display: flex; gap: 8px; margin-top: 6px; flex-wrap: wrap;
        }
        .cc-link-btn {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 9.5px; letter-spacing: 0.8px; text-transform: uppercase;
          font-family: monospace; text-decoration: none;
          padding: 5px 12px; border-radius: 4px; border: 1px solid;
          transition: all 0.22s ease; cursor: pointer;
          backdrop-filter: blur(6px);
        }
        .cc-link-li {
          color: #4f9cf9;
          border-color: rgba(79,156,249,0.35);
          background: rgba(79,156,249,0.08);
        }
        .cc-link-li:hover {
          background: rgba(79,156,249,0.24);
          border-color: #4f9cf9;
          box-shadow: 0 0 12px rgba(79,156,249,0.3);
        }
        .cc-link-gh {
          color: rgba(255,255,255,0.9);
          border-color: rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.06);
        }
        .cc-link-gh:hover {
          background: rgba(255,255,255,0.16);
          border-color: rgba(255,255,255,0.4);
        }
        .cc-link-mail {
          color: rgba(255,255,255,0.75);
          border-color: rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.04);
        }
        .cc-link-mail:hover {
          background: rgba(255,255,255,0.12);
          border-color: rgba(255,255,255,0.3);
        }
        .cc-link-ig {
          color: #e1306c;
          border-color: rgba(225,48,108,0.35);
          background: rgba(225,48,108,0.08);
        }
        .cc-link-ig:hover {
          background: rgba(225,48,108,0.22);
          border-color: #e1306c;
          box-shadow: 0 0 12px rgba(225,48,108,0.35);
        }

        /* Progress Bar on Center Card */
        .cc-progress-track {
          position: absolute; bottom: 0; left: 0; right: 0;
          height: 2.5px; background: rgba(255,255,255,0.08); z-index: 20;
        }
        .cc-progress-bar {
          height: 100%; width: 100%;
          background: linear-gradient(90deg, rgba(235, 30, 80, 0.4), #fff);
          transform: scaleX(0); transform-origin: left center;
        }

        /* ─── Bottom Center Navigation Console ─── */
        .cc-bottom-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          margin-top: 18px;
          gap: 12px;
        }

        .cc-nav-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 999px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.14);
          backdrop-filter: blur(14px);
          color: #fff;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .cc-nav-btn:hover {
          background: rgba(255,255,255,0.12);
          border-color: rgba(255,255,255,0.4);
          box-shadow: 0 0 16px rgba(255,255,255,0.12);
          transform: translateY(-1px);
        }
        .cc-nav-btn-arrow {
          font-size: 13px;
          line-height: 1;
          color: rgba(255,255,255,0.85);
        }
        .cc-nav-btn-text {
          font-size: 10px;
          letter-spacing: 2px;
          font-family: monospace;
          font-weight: 700;
          text-transform: uppercase;
        }

        /* Next Button with Text-Only Preview */
        .cc-nav-next {
          padding: 7px 18px;
          text-align: right;
        }
        .cc-next-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          line-height: 1.1;
        }
        .cc-next-sublabel {
          font-size: 7.5px;
          letter-spacing: 1.5px;
          font-family: monospace;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
        }
        .cc-next-name-preview {
          font-size: 10.5px;
          letter-spacing: 1px;
          font-family: 'Inter', sans-serif;
          font-weight: 700;
          text-transform: uppercase;
          color: #fff;
          white-space: nowrap;
        }

        /* Dots Container */
        .cc-nav-dots-container {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
        }
        .cc-nav-dots {
          display: flex;
          gap: 6px;
          align-items: center;
        }
        .cc-nav-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: rgba(255,255,255,0.22);
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .cc-nav-dot-active {
          background: #fff;
          transform: scale(1.6);
          box-shadow: 0 0 8px rgba(255,255,255,0.7);
        }

        /* ─── Responsive Media Queries ─── */
        @media (max-width: 1280px) {
          .cc-gallery-side { width: 200px; }
          .cc-box-left, .cc-box-right-marquee { width: 200px; height: 320px; }
          .cc-box-left img, .cc-box-right-marquee img { width: 200px; }
        }

        @media (max-width: 1024px) {
          .cc-gallery-side { width: 140px; }
          .cc-box-left, .cc-box-right-marquee { width: 140px; height: 240px; }
          .cc-box-left img, .cc-box-right-marquee img { width: 140px; }
          .cc-wrapper { width: 400px; }
          .cc-center-box { width: 400px; }
        }

        @media (max-width: 820px) {
          .cc-gallery-side { display: none; }
          .cc-wrapper { width: 90vw; }
          .cc-center-box-container, .cc-center-box { width: 100%; }
          .cc-name-title { font-size: 20px; }
        }
      `}</style>
    </div>
  );
}
