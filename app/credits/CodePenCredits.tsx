'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import Link from 'next/link';

/* ──────────────────────────────────────────────
   TEAM DATA  — update names / links as needed
   ────────────────────────────────────────────── */
const devTeam = [
  {
    name: 'Devam Sharma',
    role: 'Lead Web Architect & Fullstack Developer',
    tag: 'CORE',
    avatar: '/team-carousel/1.jpg',
    linkedin: 'https://linkedin.com/in/devamsharma',
    github: 'https://github.com/devamsharma',
    email: 'devam@sabrang.in',
  },
  {
    name: 'Tech Advisory',
    role: 'UI/UX & WebGL Shader Design',
    tag: 'CO-ORDINATOR',
    avatar: '/team-carousel/2.jpg',
    linkedin: 'https://linkedin.com/in/techadvisory',
    github: 'https://github.com/techadvisory',
    email: 'design@sabrang.in',
  },
  {
    name: 'Frontend Team',
    role: 'React, Next.js & Animation Engineering',
    tag: 'CO-ORDINATOR',
    avatar: '/team-carousel/3.jpg',
    linkedin: 'https://linkedin.com/in/frontendteam',
    github: 'https://github.com/frontendteam',
    email: 'frontend@sabrang.in',
  },
  {
    name: 'Backend & Cloud',
    role: 'Firebase Infrastructure & Auth Services',
    tag: 'CO-ORDINATOR',
    avatar: '/team-carousel/4.jpg',
    linkedin: 'https://linkedin.com/in/backendcloud',
    github: 'https://github.com/backendcloud',
    email: 'backend@sabrang.in',
  },
  {
    name: 'QA & Testing',
    role: 'Quality Assurance & Automated Testing',
    tag: 'CO-ORDINATOR',
    avatar: '/team-carousel/5.jpg',
    linkedin: 'https://linkedin.com/in/qateam',
    github: 'https://github.com/qateam',
    email: 'qa@sabrang.in',
  },
  {
    name: 'DevOps & SecOps',
    role: 'CI/CD Pipelines & Platform Security',
    tag: 'CO-ORDINATOR',
    avatar: '/team-carousel/6.jpg',
    linkedin: 'https://linkedin.com/in/devops',
    github: 'https://github.com/devops',
    email: 'devops@sabrang.in',
  },
  {
    name: 'Content & Strategy',
    role: 'Digital Strategy & Content Management',
    tag: 'CO-ORDINATOR',
    avatar: '/team-carousel/7.jpg',
    linkedin: 'https://linkedin.com/in/contentstrat',
    github: 'https://github.com/contentstrat',
    email: 'content@sabrang.in',
  },
];

const NAV_LINKS = [
  { href: '/',          label: 'Home' },
  { href: '/about',     label: 'About' },
  { href: '/gallery',   label: 'Gallery' },
  { href: '/team',      label: 'Our Team' },
  { href: '/sponsors',  label: 'Sponsors' },
  { href: '/events',    label: 'Events' },
  { href: '/schedule',  label: 'Schedule' },
  { href: '/register',  label: 'Registration' },
  { href: '/faq',       label: 'FAQ' },
  { href: '/contact',   label: 'Contact Us' },
];

const N = devTeam.length;
const AUTO_ADVANCE_MS = 8000;
const imgCls = (i: number) => `img-seq-${i}`;

const LinkedInIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const GithubIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
  </svg>
);

const MailIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

export default function CodePenCredits() {
  const rootRef     = useRef<HTMLDivElement>(null);
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progRef     = useRef<HTMLDivElement>(null);
  const progAnimRef = useRef<gsap.core.Tween | null>(null);
  const curRef      = useRef(0);
  const busyRef     = useRef(false);
  const advanceRef  = useRef<() => void>(() => {});

  const [activeIdx, setActiveIdx] = useState(0);
  const [menuOpen,  setMenuOpen]  = useState(false);

  /* ── Progress bar ── */
  const startProgress = useCallback(() => {
    if (!progRef.current) return;
    progAnimRef.current?.kill();
    gsap.set(progRef.current, { scaleX: 0, transformOrigin: 'left center' });
    progAnimRef.current = gsap.to(progRef.current, {
      scaleX: 1, duration: AUTO_ADVANCE_MS / 1000, ease: 'none',
    });
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    startProgress();
    timerRef.current = setTimeout(() => advanceRef.current(), AUTO_ADVANCE_MS);
  }, [startProgress]);

  /* ── GSAP ── */
  useEffect(() => {
    if (!rootRef.current) return;
    gsap.registerPlugin(CustomEase);
    CustomEase.create('hop', 'M0,0 C0.3,0 0.1,1 1,1');

    const ctx = gsap.context(() => {
      const root        = rootRef.current!;
      const wrapperLeft = root.querySelector<HTMLElement>('.cc-wrapper-left')!;
      const leftBoxes   = root.querySelectorAll<HTMLElement>('.cc-box-left');
      const centerImgs  = root.querySelectorAll<HTMLElement>('.cc-center-box img');
      const countTry    = root.querySelector<HTMLElement>('.cc-try')!;
      const arrowL      = root.querySelector<HTMLElement>('.cc-arrow-left')!;
      const arrowR      = root.querySelector<HTMLElement>('.cc-arrow-right')!;

      /* init center images */
      centerImgs.forEach((el, i) => { el.style.display = i === 0 ? 'block' : 'none'; });

      gsap.to(wrapperLeft, {
        y: '-50%', duration: 20, ease: 'none', repeat: -1,
        onRepeat: () => gsap.set(wrapperLeft, { y: '0%' }),
      });

      const centerBox = root.querySelector<HTMLElement>('.cc-center-box')!;
      gsap.to(centerBox, { height: '420px', duration: 1.2, ease: 'hop' });
      gsap.to(leftBoxes, { clipPath: 'polygon(0 0,100% 0,100% 100%,0 100%)', ease: 'hop', duration: 1, stagger: 0.08 });
      root.querySelector('.cc-arrows')?.classList.add('cc-show');

      const slideCenter = (from: number, to: number, forward: boolean) => {
        const old_ = centerImgs[from] as HTMLElement;
        const new_ = centerImgs[to]  as HTMLElement;
        gsap.set(new_, { display: 'block', clipPath: forward ? 'polygon(100% 100%,100% 100%,100% 100%,100% 100%)' : 'polygon(0 0,0 0,0 100%,0 100%)', zIndex: 2 });
        gsap.to(new_, { clipPath: 'polygon(0% 0%,100% 0%,100% 100%,0% 100%)', duration: 1, ease: 'hop',
          onComplete: () => { old_.style.display = 'none'; new_.style.zIndex = '1'; } });
      };

      const slideLeft = (fromCls: string, toCls: string, forward: boolean) => {
        leftBoxes.forEach((box, bi) => {
          const fromImg = box.querySelector<HTMLElement>(`.${fromCls}`)!;
          const toImg   = box.querySelector<HTMLElement>(`.${toCls}`)!;
          if (!fromImg || !toImg) return;
          gsap.set(toImg, { display: 'block', clipPath: forward ? 'polygon(0 100%,100% 100%,100% 100%,0% 100%)' : 'polygon(0 0%,100% 0%,100% 0%,0% 0%)', zIndex: 2, scale: 2 });
          gsap.to(toImg, { clipPath: 'polygon(0 0%,100% 0%,100% 100%,0% 100%)', ease: 'hop', duration: 1, scale: 1, delay: 0.06 * bi,
            onComplete: () => { fromImg.style.display = 'none'; toImg.style.zIndex = '1'; } });
        });
      };

      const go = (forward: boolean) => {
        if (busyRef.current) return;
        busyRef.current = true;
        const prev = curRef.current;
        curRef.current = forward ? (prev + 1) % N : (prev - 1 + N) % N;
        const next = curRef.current;
        gsap.to(countTry, { y: `${next * -14}px`, ease: 'hop', duration: 0.35 });
        slideCenter(prev, next, forward);
        slideLeft(imgCls(prev), imgCls(next), forward);
        setActiveIdx(next);
        setTimeout(() => { busyRef.current = false; }, 1100);
        resetTimer();
      };

      advanceRef.current = () => go(true);
      arrowR.addEventListener('click', () => go(true));
      arrowL.addEventListener('click', () => go(false));

      setTimeout(() => startProgress(), 1300);
      timerRef.current = setTimeout(() => advanceRef.current(), AUTO_ADVANCE_MS + 1300);
    }, rootRef);

    return () => {
      ctx.revert();
      if (timerRef.current) clearTimeout(timerRef.current);
      progAnimRef.current?.kill();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* close menu on escape */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const member = devTeam[activeIdx];

  return (
    <div ref={rootRef} className="cc-root">

      {/* ── HEADER ── */}
      <header className="cc-header">

        <Link href="/" className="cc-logo-link">
          <img src="/sabrang logo.png" alt="Sabrang" />
        </Link>

        <div className="cc-header-center">
          <span className="cc-eyebrow">SABRANG 2026 · DIGITAL PLATFORM</span>
          <h1 className="cc-title">TECH TEAM CREDITS</h1>
        </div>

        <button
          className={`cc-menu-btn ${menuOpen ? 'cc-menu-btn--open' : ''}`}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg className="cc-menu-icon-x" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <span className="cc-hamburger">
              <span/><span/><span/>
            </span>
          )}
          <span className="cc-menu-label">{menuOpen ? '' : 'Menu'}</span>
        </button>

      </header>

      {/* ── FULL-SCREEN MENU OVERLAY ── */}
      {menuOpen && (
        <div className="cc-nav-overlay" onClick={() => setMenuOpen(false)}>
          <div className="cc-nav-inner" onClick={e => e.stopPropagation()}>
            <div className="cc-nav-grid">
              {NAV_LINKS.map((link, i) => (
                <Link key={link.href} href={link.href} className="cc-nav-item" onClick={() => setMenuOpen(false)}>
                  <span className="cc-nav-num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="cc-nav-label">{link.label}</span>
                </Link>
              ))}
            </div>
            <div className="cc-nav-footer">
              <p>Join Sabrang 2026</p>
              <Link href="/register" className="cc-nav-cta" onClick={() => setMenuOpen(false)}>
                Register Now
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── LEFT MARQUEE STRIP ── */}
      <div className="cc-wrapper-left">
        {[0, 1].map(g => (
          <div key={g}>
            {[0, 1, 2, 3].map(b => (
              <div key={b} className="cc-box-left">
                {devTeam.map((m, i) => (
                  <img key={i} className={imgCls(i)} src={m.avatar} alt={m.name}
                    style={{
                      display: i === 0 ? 'block' : 'none',
                      clipPath: i === 0 ? 'polygon(0 0,100% 0,100% 100%,0 100%)' : 'polygon(0 100%,100% 100%,100% 100%,0 100%)',
                    }} />
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ── CENTER WRAPPER ── */}
      <div className="cc-wrapper">

        {/* counter — top right of image */}
        <div className="cc-counter-badge">
          <div className="cc-counter-try-wrap">
            <div className="cc-try">
              {devTeam.map((_, i) => <span key={i}>{String(i + 1).padStart(2, '0')}</span>)}
            </div>
          </div>
          <span className="cc-counter-sep">/</span>
          <span className="cc-counter-total">{String(N).padStart(2, '0')}</span>
        </div>

        {/* center image */}
        <div className="cc-center-box">
          {devTeam.map((m, i) => (
            <img key={i} src={m.avatar} alt={m.name}
              style={{ display: i === 0 ? 'block' : 'none', zIndex: 1 }} />
          ))}

          {/* Name card overlay */}
          <div className="cc-name-card">
            <span className="cc-name-tag">{member.tag}</span>
            <h2 className="cc-name-title">{member.name}</h2>
            <p className="cc-name-role">{member.role}</p>
            <div className="cc-name-links">
              <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="cc-link-btn cc-link-li">
                <LinkedInIcon /> LinkedIn
              </a>
              <a href={member.github} target="_blank" rel="noopener noreferrer" className="cc-link-btn cc-link-gh">
                <GithubIcon /> GitHub
              </a>
              <a href={`mailto:${member.email}`} className="cc-link-btn cc-link-mail">
                <MailIcon /> Email
              </a>
            </div>
          </div>

          {/* progress bar */}
          <div className="cc-progress-track">
            <div ref={progRef} className="cc-progress-bar" />
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="cc-wrapper-right">

        {/* Next-person preview box */}
        <div className="cc-next-label">NEXT ↓</div>
        <div className="cc-box-right">
          <img
            key={activeIdx}
            src={devTeam[(activeIdx + 1) % N].avatar}
            alt={devTeam[(activeIdx + 1) % N].name}
            className="cc-next-img"
          />
          <div className="cc-next-name-card">
            <span className="cc-next-tag">{devTeam[(activeIdx + 1) % N].tag}</span>
            <span className="cc-next-nm">{devTeam[(activeIdx + 1) % N].name}</span>
          </div>
        </div>

        <div className="cc-arrows">
          <button className="cc-arrow-left"  aria-label="prev">←</button>
          <button className="cc-arrow-right" aria-label="next">→</button>
        </div>

        <div className="cc-dots">
          {devTeam.map((_, i) => (
            <div key={i} className={`cc-dot${i === activeIdx ? ' cc-dot-active' : ''}`} />
          ))}
        </div>
      </div>

      {/* ── STYLES ── */}
      <style>{`
        /* ─── Root ─── */
        .cc-root {
          position: fixed; inset: 0;
          background: #070707;
          overflow: hidden;
          font-family: 'Inter', monospace;
          color: #fff;
          z-index: 0;
        }

        /* ─── Header ─── */
        .cc-header {
          position: absolute; top: 0; left: 0; right: 0;
          height: 80px;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 28px;
          z-index: 200;
          background: linear-gradient(to bottom, rgba(7,7,7,0.9) 0%, transparent 100%);
        }

        /* logo */
        .cc-logo-link {
          display: flex; align-items: center; flex-shrink: 0;
          text-decoration: none;
        }
        .cc-logo-link img {
          height: 56px; width: auto; object-fit: contain;
          transition: transform 0.3s;
        }
        .cc-logo-link:hover img { transform: scale(1.05); }

        /* center title */
        .cc-header-center {
          position: absolute; left: 50%; transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center; gap: 3px;
          pointer-events: none; text-align: center;
        }
        .cc-eyebrow {
          font-size: 8px; letter-spacing: 3px; text-transform: uppercase;
          color: rgba(255,255,255,0.35); font-family: monospace;
        }
        .cc-title {
          font-size: 22px; font-weight: 900; letter-spacing: 7px;
          text-transform: uppercase; color: #fff;
          font-family: 'Inter', sans-serif;
          margin: 0; line-height: 1;
          text-shadow: 0 0 40px rgba(255,255,255,0.2);
          white-space: nowrap;
        }

        /* menu button — pill style matching site nav */
        .cc-menu-btn {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 22px; border-radius: 999px;
          border: 1.5px solid rgba(255,255,255,0.22);
          background: rgba(255,255,255,0.07);
          backdrop-filter: blur(16px);
          color: #fff; cursor: pointer; flex-shrink: 0;
          transition: background 0.25s, border-color 0.25s;
          min-width: 90px; justify-content: center;
        }
        .cc-menu-btn:hover {
          background: rgba(255,255,255,0.15);
          border-color: rgba(255,255,255,0.45);
        }
        .cc-menu-btn--open {
          background: rgba(255,255,255,0.12);
          border-color: rgba(255,255,255,0.5);
        }
        .cc-hamburger {
          display: flex; flex-direction: column; gap: 4px; width: 16px;
        }
        .cc-hamburger span {
          display: block; height: 1.5px; width: 100%;
          background: #fff; border-radius: 2px;
        }
        .cc-menu-icon-x {
          width: 18px; height: 18px; color: #fff;
        }
        .cc-menu-label {
          font-size: 11px; letter-spacing: 2px; font-family: monospace;
          text-transform: uppercase; color: #fff; font-weight: 600;
        }

        /* ─── Nav Overlay ─── */
        .cc-nav-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.96);
          z-index: 500;
          display: flex; align-items: center; justify-content: center;
          animation: cc-fade-in 0.25s ease;
        }
        @keyframes cc-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .cc-nav-inner {
          width: 100%; max-width: 860px;
          padding: 0 32px;
          display: flex; flex-direction: column; gap: 48px;
        }
        .cc-nav-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
        }
        .cc-nav-item {
          display: flex; align-items: center; gap: 14px;
          padding: 18px 22px; border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          text-decoration: none;
          transition: background 0.2s, border-color 0.2s, transform 0.2s;
        }
        .cc-nav-item:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.18);
          transform: translateY(-2px);
        }
        .cc-nav-num {
          font-size: 10px; letter-spacing: 1px; font-family: monospace;
          color: rgba(255,255,255,0.3); flex-shrink: 0;
        }
        .cc-nav-label {
          font-size: 20px; font-weight: 700; color: #fff;
          font-family: 'Inter', sans-serif;
        }
        .cc-nav-footer {
          display: flex; align-items: center; justify-content: space-between;
          padding: 22px 24px; border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.03);
        }
        .cc-nav-footer p {
          font-size: 16px; font-weight: 700; color: #fff;
          margin: 0; font-family: 'Inter', sans-serif;
        }
        .cc-nav-cta {
          padding: 10px 24px; border-radius: 999px;
          background: #fff; color: #000;
          font-size: 13px; font-weight: 700;
          text-decoration: none; font-family: 'Inter', sans-serif;
          transition: opacity 0.2s;
        }
        .cc-nav-cta:hover { opacity: 0.85; }

        /* ─── Left marquee ─── */
        .cc-wrapper-left {
          position: absolute; top: 0; left: 0;
          width: 280px; display: flex; flex-direction: column;
          overflow: hidden; height: 200vh; z-index: 0;
        }
        .cc-box-left {
          position: relative; width: 280px; height: 420px;
          overflow: hidden; margin-bottom: 12px; flex-shrink: 0;
          clip-path: polygon(0 0,0 0,0 100%,0 100%);
        }
        .cc-box-left img {
          position: absolute; width: 280px; height: 100%;
          object-fit: cover; transform: scale(1.05); top: 0; left: 0;
        }

        /* ─── Center ─── */
        .cc-wrapper {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          display: flex; flex-direction: column; align-items: center;
          z-index: 10; width: 420px;
        }

        /* counter badge top-right */
        .cc-counter-badge {
          align-self: flex-end;
          display: flex; align-items: center; gap: 2px;
          margin-bottom: 10px;
        }
        .cc-counter-try-wrap { height: 14px; overflow: hidden; }
        .cc-try {
          display: flex; flex-direction: column; transform: translateY(0px);
          line-height: 14px;
        }
        .cc-try span {
          font-size: 11px; font-family: monospace; color: #fff;
          height: 14px; display: flex; align-items: center;
        }
        .cc-counter-sep, .cc-counter-total {
          font-size: 11px; font-family: monospace; color: rgba(255,255,255,0.5);
        }

        /* center image box */
        .cc-center-box {
          position: relative; width: 420px; height: 268px;
          overflow: hidden;
          clip-path: polygon(0% 0%,100% 0%,100% 100%,0% 100%);
          z-index: 1;
        }
        .cc-center-box > img {
          position: absolute; inset: 0;
          width: 100%; height: 100%; object-fit: cover;
        }

        /* name card */
        .cc-name-card {
          position: absolute; bottom: 0; left: 0; right: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.55) 60%, transparent 100%);
          padding: 20px 16px 16px;
          z-index: 10;
          display: flex; flex-direction: column; gap: 5px;
        }
        .cc-name-tag {
          font-size: 8px; letter-spacing: 2px; font-family: monospace;
          text-transform: uppercase; color: rgba(255,255,255,0.45);
          border: 1px solid rgba(255,255,255,0.18);
          padding: 2px 7px; border-radius: 2px;
          width: fit-content;
        }
        .cc-name-title {
          font-size: 22px; font-weight: 900; letter-spacing: -0.3px;
          color: #fff; margin: 0; line-height: 1.1;
          font-family: 'Inter', sans-serif; text-transform: uppercase;
        }
        .cc-name-role {
          font-size: 9px; letter-spacing: 0.8px; text-transform: uppercase;
          color: rgba(255,255,255,0.5); margin: 0; font-family: monospace;
        }
        .cc-name-links { display: flex; gap: 6px; margin-top: 6px; flex-wrap: wrap; }
        .cc-link-btn {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 9px; letter-spacing: 0.8px; text-transform: uppercase;
          font-family: monospace; text-decoration: none;
          padding: 4px 10px; border-radius: 3px; border: 1px solid;
          transition: all 0.22s ease; cursor: pointer;
        }
        .cc-link-li  { color: #4f9cf9; border-color: rgba(79,156,249,0.4); background: rgba(79,156,249,0.08); }
        .cc-link-li:hover  { background: rgba(79,156,249,0.22); }
        .cc-link-gh  { color: rgba(255,255,255,0.8); border-color: rgba(255,255,255,0.18); background: rgba(255,255,255,0.05); }
        .cc-link-gh:hover  { background: rgba(255,255,255,0.14); }
        .cc-link-mail{ color: rgba(255,255,255,0.65); border-color: rgba(255,255,255,0.12); background: rgba(255,255,255,0.03); }
        .cc-link-mail:hover{ background: rgba(255,255,255,0.1); }

        /* progress bar */
        .cc-progress-track {
          position: absolute; bottom: 0; left: 0; right: 0;
          height: 2px; background: rgba(255,255,255,0.08); z-index: 20;
        }
        .cc-progress-bar {
          height: 100%; width: 100%;
          background: linear-gradient(90deg, rgba(255,255,255,0.2), #fff);
          transform: scaleX(0); transform-origin: left center;
        }

        /* ─── Right panel ─── */
        .cc-wrapper-right {
          position: absolute; right: 24px; bottom: 80px;
          width: 180px; z-index: 5; display: flex; flex-direction: column;
        }
        .cc-next-label {
          font-size: 8px; letter-spacing: 2.5px; font-family: monospace;
          text-transform: uppercase; color: rgba(255,255,255,0.35);
          margin-bottom: 6px;
        }
        .cc-box-right {
          position: relative; width: 180px; height: 200px;
          overflow: hidden; border-radius: 4px;
        }
        .cc-next-img {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover; transform: scale(1.08);
          transition: opacity 0.5s ease;
        }
        .cc-next-name-card {
          position: absolute; bottom: 0; left: 0; right: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%);
          padding: 14px 10px 10px;
          display: flex; flex-direction: column; gap: 3px;
        }
        .cc-next-tag {
          font-size: 7px; letter-spacing: 1.5px; font-family: monospace;
          text-transform: uppercase; color: rgba(255,255,255,0.4);
        }
        .cc-next-nm {
          font-size: 11px; font-weight: 700; font-family: 'Inter', sans-serif;
          color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        /* arrows */
        .cc-arrows {
          display: flex; gap: 8px; margin-top: 12px;
          opacity: 0; transition: opacity 0.6s ease;
        }
        .cc-arrows.cc-show { opacity: 1; }
        .cc-arrow-left, .cc-arrow-right {
          width: 36px; height: 36px; border-radius: 50%;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          color: #fff; font-size: 15px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.25s; padding: 0;
        }
        .cc-arrow-left:hover, .cc-arrow-right:hover { background: rgba(255,255,255,0.18); }

        /* dots */
        .cc-dots {
          display: flex; gap: 5px; margin-top: 10px; justify-content: center;
        }
        .cc-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: rgba(255,255,255,0.22);
          transition: background 0.35s, transform 0.35s;
        }
        .cc-dot-active { background: #fff; transform: scale(1.5); }
      `}</style>
    </div>
  );
}
