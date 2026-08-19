"use client";

/**
 * CinematicPreview — a composed cinematic scene, not a slideshow.
 *
 * Depth planes, back to front:
 *   1  atmosphere      volumetric cyan light + fog, painted at 96x54 and scaled up
 *   2  far dust        particles that brighten as the light passes over them
 *   3  editorial type  oversized title, bled past the card's left edge
 *   4  signal wave     one organic thread, drawn once behind and once in front
 *   5  media frame     a dark viewport, sliced into three bands
 *   6  frame echoes    the same frame pulled apart in time, R/C separated
 *   7  optical         scanlines, grain, vignette
 *
 * One rAF drives all of it: it paints both canvases and writes transforms
 * straight to refs, so the scene animates without a single React render. React
 * re-renders once per frame change (SLIDE_MS) and never during motion. The loop
 * is paused by IntersectionObserver whenever the section is off-screen.
 */

import Image from "next/image";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion, useScroll } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export type PreviewSlide = {
  kicker: string;
  title: string;
  copy: string;
  accent: string;
  background: string;
  alt: string;
};

const SLIDE_MS = 3000;
/** where in the cycle the signal breaks up hardest — the frame changes under it */
const SWAP = 0.82;
/** the outgoing frame dissolves out over this much of the cycle after the change */
const DISSOLVE = 0.22;
/** every text beat is scaled to the frame, so nothing outlives the frame it belongs to */
const BEAT = SLIDE_MS / 1000;

const META_LEFT = ["SABRANG_2026", "RX / 04"];
const META_RIGHT = ["JKLU · JAIPUR", "SYSTEM ACTIVE"];

/** cheap smooth noise — layered irrational sines, no library, no lookup table */
const noise = (t: number, seed: number) =>
  (Math.sin(t * 0.7 + seed) +
    Math.sin(t * 1.3 + seed * 2.1) * 0.6 +
    Math.sin(t * 2.9 + seed * 4.7) * 0.25) /
  1.85;

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** 0 → 1 → 0 across the distortion window, with the climax weighted late */
const bell = (p: number) =>
  p < 0.58 || p > 0.99 ? 0 : p <= SWAP ? smoothstep(0.58, SWAP, p) : 1 - smoothstep(SWAP, 0.99, p);

/** masked line wipe — each line rises out from under its own edge */
const LINE_IN = { y: "115%" };
const LINE_AT = { y: "0%" };
const LINE_OUT = { y: "-115%" };
const EASE = [0.22, 1, 0.36, 1] as const;

export default function CinematicPreview({ slides }: { slides: PreviewSlide[] }) {
  const [i, setI] = useState(0);
  const [prev, setPrev] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const reduceMotion = useReducedMotion();

  const rootRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLCanvasElement>(null);
  const fgRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const echoRRef = useRef<HTMLDivElement>(null);
  const echoCRef = useRef<HTMLDivElement>(null);
  const bandA = useRef<HTMLDivElement>(null);
  const bandB = useRef<HTMLDivElement>(null);
  const bandC = useRef<HTMLDivElement>(null);
  const typeBackRef = useRef<HTMLDivElement>(null);
  const typeFrontRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  /** the loop owns the index; state only mirrors it for rendering */
  const idxRef = useRef(0);

  /** mutable input the loop reads without re-subscribing */
  const pointerRef = useRef({ x: 0, y: 0 });

  const { scrollYProgress } = useScroll({
    target: rootRef,
    offset: ["start end", "end start"],
  });

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setExpanded(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  useEffect(() => {
    const root = rootRef.current;
    const bg = bgRef.current;
    const fg = fgRef.current;
    if (!root || !bg || !fg) return;

    const bctx = bg.getContext("2d");
    const fctx = fg.getContext("2d");
    if (!bctx || !fctx) return;

    // atmosphere is painted tiny and scaled up: volumetric for free, and cheap
    const low = document.createElement("canvas");
    low.width = 96;
    low.height = 54;
    const lctx = low.getContext("2d");
    if (!lctx) return;

    const bands = [bandA, bandB, bandC];
    let w = 1;
    let h = 1;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const r = root.getBoundingClientRect();
      w = r.width;
      h = r.height;
      for (const c of [bg, fg]) {
        c.width = Math.max(1, (w * dpr) | 0);
        c.height = Math.max(1, (h * dpr) | 0);
        c.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(root);

    const small = window.matchMedia("(max-width: 640px)").matches;
    const dust = Array.from({ length: small ? 22 : 58 }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: 0.25 + Math.random() * 0.75,
      seed: Math.random() * 100,
    }));

    const paint = (now: number, p: number, d: number, intro: number, scroll: number) => {
      const T = now / 1000;
      const par = pointerRef.current;

      // ── 1: light + fog, low res ─────────────────────────────────────────
      lctx.globalCompositeOperation = "source-over";
      lctx.fillStyle = "#04070b";
      lctx.fillRect(0, 0, 96, 54);
      lctx.globalCompositeOperation = "lighter";

      const lx = 62 + noise(T * 0.06, 1.7) * 16;
      const ly = 16 + noise(T * 0.05, 4.2) * 9;
      const breathe = 0.5 + 0.5 * Math.sin(T * 0.23);
      const lr = 34 + breathe * 10 + d * 6;
      const la = (0.34 + breathe * 0.16 + d * 0.16) * intro;
      const g = lctx.createRadialGradient(lx, ly, 0, lx, ly, lr);
      g.addColorStop(0, `rgba(120,225,240,${la})`);
      g.addColorStop(0.38, `rgba(28,120,150,${la * 0.42})`);
      g.addColorStop(1, "rgba(4,10,16,0)");
      lctx.fillStyle = g;
      lctx.fillRect(0, 0, 96, 54);

      for (let k = 0; k < 4; k++) {
        const fx = 48 + noise(T * 0.045 + k, k * 3.1) * 44;
        const fy = 30 + noise(T * 0.038 + k, k * 5.7) * 22;
        const fr = 20 + k * 5;
        const fogG = lctx.createRadialGradient(fx, fy, 0, fx, fy, fr);
        fogG.addColorStop(0, `rgba(30,86,104,${0.09 * intro})`);
        fogG.addColorStop(1, "rgba(0,0,0,0)");
        lctx.fillStyle = fogG;
        lctx.fillRect(0, 0, 96, 54);
      }

      bctx.globalCompositeOperation = "source-over";
      bctx.clearRect(0, 0, w, h);
      bctx.drawImage(low, par.x * 3 - 4, par.y * 3 - 4, w + 8, h + 8);

      // ── 2: far dust ─────────────────────────────────────────────────────
      bctx.globalCompositeOperation = "lighter";
      for (const q of dust) {
        if (q.z > 0.55) continue;
        const x = (q.x + noise(T * 0.02, q.seed) * 0.04) * w + par.x * q.z * 8;
        const y = ((q.y + T * 0.004 * q.z) % 1) * h + par.y * q.z * 8;
        const lit = 1 - Math.min(1, Math.hypot(x / w - lx / 96, y / h - ly / 54) * 1.6);
        bctx.fillStyle = `rgba(180,225,235,${(0.05 + lit * 0.16) * q.z * intro})`;
        bctx.fillRect(x, y, q.z * 1.4, q.z * 1.4);
      }

      // ── 4: the signal wave — same generator, once behind, once in front ──
      const wave = (ctx: CanvasRenderingContext2D, front: boolean) => {
        const drift = noise(T * 0.07, front ? 9.1 : 3.3);
        const baseX = w * (front ? 0.66 : 0.28) + drift * w * 0.08 + par.x * (front ? 8 : 3);
        const amp = w * (0.05 + 0.03 * (0.5 + 0.5 * Math.sin(T * 0.19))) * (1 + d * 0.6);
        const at = (u: number) =>
          baseX +
          Math.sin(u * 5.2 + T * 0.55 + (front ? 0 : 1.9)) * amp +
          noise(u * 3.1 + T * 0.28, front ? 2.2 : 7.4) * amp * 0.7;

        ctx.beginPath();
        for (let k = 0; k <= 44; k++) {
          const u = k / 44;
          const y = u * (h + 40) - 20;
          if (k === 0) ctx.moveTo(at(u), y);
          else ctx.lineTo(at(u), y);
        }
        const a = (front ? 0.5 : 0.24) * intro * (0.55 + d * 0.45);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        for (const [width, alpha, color] of [
          [7, a * 0.07, "120,235,255"],
          [3, a * 0.16, "150,240,255"],
          [1.1, a, front ? "205,250,255" : "110,190,215"],
        ] as const) {
          ctx.strokeStyle = `rgba(${color},${alpha})`;
          ctx.lineWidth = width;
          ctx.stroke();
        }
        if (front) {
          // one warm node riding the thread
          const u = (T * 0.06 + 0.3) % 1;
          const x = at(u);
          const y = u * h;
          const ng = ctx.createRadialGradient(x, y, 0, x, y, 26);
          ng.addColorStop(0, `rgba(255,190,120,${0.28 * intro})`);
          ng.addColorStop(1, "rgba(255,140,60,0)");
          ctx.fillStyle = ng;
          ctx.fillRect(x - 26, y - 26, 52, 52);
        }
      };
      wave(bctx, false);

      // ── front pass: wave + near dust ────────────────────────────────────
      fctx.globalCompositeOperation = "source-over";
      fctx.clearRect(0, 0, w, h);
      fctx.globalCompositeOperation = "lighter";
      wave(fctx, true);

      for (const q of dust) {
        if (q.z <= 0.55) continue;
        const x = (q.x + noise(T * 0.03, q.seed) * 0.05) * w + par.x * q.z * 14;
        const y = ((q.y + T * 0.012 * q.z) % 1) * h + par.y * q.z * 14;
        const lit = 1 - Math.min(1, Math.hypot(x / w - lx / 96, y / h - ly / 54) * 1.5);
        fctx.fillStyle = `rgba(200,238,246,${(0.04 + lit * 0.2) * q.z * intro})`;
        fctx.fillRect(x, y, q.z * 1.8, q.z * 1.8);
      }

      // ── DOM planes ──────────────────────────────────────────────────────
      const drift = noise(T * 0.09, 12.4);
      const sep = d * (small ? 8 : 14);
      const rgb = d * 2.4;
      const offsets = [1, -1.6, 0.7];

      if (frameRef.current) {
        frameRef.current.style.transform = `translate3d(${par.x * 2 - scroll * 6}px, ${
          par.y * 2 - scroll * 14
        }px, 0) scale(${1 + scroll * 0.04 + d * 0.012})`;
      }
      if (echoRRef.current) {
        echoRRef.current.style.transform = `translate3d(${-rgb - sep * 0.15}px, ${-sep}px, 0)`;
        echoRRef.current.style.opacity = `${(0.14 + d * 0.4) * intro}`;
      }
      if (echoCRef.current) {
        echoCRef.current.style.transform = `translate3d(${rgb + sep * 0.15}px, ${sep * 0.8}px, 0)`;
        echoCRef.current.style.opacity = `${(0.14 + d * 0.4) * intro}`;
      }
      bands.forEach((r, k) => {
        if (!r.current) return;
        r.current.style.transform = `translate3d(${d * noise(T * 0.6 + k * 2, k * 3.3) * 2.5}px, ${
          d * offsets[k] * (small ? 5 : 8)
        }px, 0)`;
      });
      if (typeBackRef.current) {
        typeBackRef.current.style.transform = `translate3d(${
          drift * 14 - scroll * 26 + par.x * 4
        }px, ${par.y * 3}px, 0)`;
        typeBackRef.current.style.opacity = `${intro}`;
      }
      if (typeFrontRef.current) {
        typeFrontRef.current.style.transform = `translate3d(${
          -drift * 9 + scroll * 16 + par.x * 3
        }px, ${par.y * 2}px, 0)`;
      }
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
    };

    let raf = 0;
    let running = false;
    let cycle = performance.now();
    let swapped = false;
    let born = 0;

    const loop = (now: number) => {
      if (!born) born = now;
      if (now - cycle >= SLIDE_MS) {
        cycle += SLIDE_MS;
        swapped = false;
      }
      const p = Math.min(1, (now - cycle) / SLIDE_MS);
      if (p >= SWAP && !swapped) {
        swapped = true;
        const cur = idxRef.current;
        idxRef.current = (cur + 1) % slides.length;
        setPrev(cur);
        setI(idxRef.current);
      }
      paint(now, p, bell(p), smoothstep(0, 1600, now - born), scrollYProgress.get());
      raf = requestAnimationFrame(loop);
    };

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting === running) return;
        running = e.isIntersecting;
        if (running) {
          cycle = performance.now();
          swapped = false;
          raf = requestAnimationFrame(loop);
        } else {
          cancelAnimationFrame(raf);
        }
      },
      { threshold: 0.02 }
    );

    if (reduceMotion) {
      born = performance.now();
      paint(born, 0, 0, 1, 0); // one static, composed frame
    } else {
      io.observe(root);
    }

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion, slides.length, expanded]);

  const s = slides[i];
  const next = slides[(i + 1) % slides.length];
  /** the tallest title / longest copy reserve the blocks' boxes, so nothing jumps */
  const lines = (t: string) => t.split("\n").length;
  const tallestTitle = slides.reduce((a, b) => (lines(a.title) >= lines(b.title) ? a : b)).title;
  const longestCopy = slides.reduce((a, b) => (a.copy.length >= b.copy.length ? a : b)).copy;

  /**
   * One band's content: the outgoing frame sits underneath and the incoming one
   * dissolves in over it. Keying the top layer restarts its CSS fade in the same
   * commit that changes its `src`, so the swap can never show through unfaded.
   */
  const band = (alt?: string) => (
    <>
      <Image
        src={slides[prev].background}
        alt=""
        fill
        sizes="(max-width: 640px) 88vw, 46vw"
        className="object-cover"
        aria-hidden
      />
      <div
        key={i}
        className="absolute inset-0 cp-in"
        style={{ animationDuration: `${SLIDE_MS * DISSOLVE}ms` }}
      >
        <Image
          src={s.background}
          alt={alt ?? ""}
          fill
          sizes="(max-width: 640px) 88vw, 46vw"
          priority={!!alt}
          className="object-cover"
        />
      </div>
    </>
  );

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || e.pointerType !== "mouse") return;
    const r = rootRef.current?.getBoundingClientRect();
    if (!r) return;
    pointerRef.current = {
      x: ((e.clientX - r.left) / r.width) * 2 - 1,
      y: ((e.clientY - r.top) / r.height) * 2 - 1,
    };
  };

  const card = (
    <div
      ref={rootRef}
      onPointerMove={onPointerMove}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") pointerRef.current = { x: 0, y: 0 };
      }}
      onClick={() => setExpanded((v) => !v)}
      onKeyDown={(e) => e.key === "Enter" && setExpanded((v) => !v)}
      role="button"
      tabIndex={0}
      aria-label={`${s.title.replace(/\n/g, " ")} — ${expanded ? "close" : "expand"}`}
      className="relative w-full aspect-[4/3] sm:aspect-video overflow-hidden rounded-2xl sm:rounded-3xl bg-[#04070b] cursor-pointer select-none isolate"
      style={{ boxShadow: "0 40px 120px -30px rgba(0,0,0,0.95)" }}
    >
      {/* 1–2 atmosphere + far dust */}
      <canvas ref={bgRef} className="absolute inset-0 w-full h-full z-0" aria-hidden />

      {/* 3 editorial type — on the same left rail as the caption, tail clipped by the frame */}
      <div
        ref={typeBackRef}
        className="absolute inset-y-0 left-0 flex items-center pl-[5%] z-10 will-change-transform pointer-events-none"
      >
        <h3
          className="relative block uppercase text-[clamp(2rem,5.6vw,4rem)] leading-[0.86] font-semibold text-white/25 -ml-[0.05em] whitespace-nowrap"
          style={{ fontFamily: '"Syne", sans-serif', letterSpacing: "-0.04em" }}
        >
          <AnimatePresence mode="sync" initial={false}>
            <motion.span key={i} className="block absolute top-0 left-0">
              {s.title.split("\n").map((line, k) => (
                <span key={k} className="block overflow-hidden pb-[0.06em]">
                  <motion.span
                    className="block"
                    initial={reduceMotion ? LINE_AT : LINE_IN}
                    animate={LINE_AT}
                    exit={reduceMotion ? LINE_AT : LINE_OUT}
                    transition={{ duration: reduceMotion ? 0 : BEAT * 0.42, ease: EASE, delay: k * BEAT * 0.05 }}
                  >
                    {line}
                  </motion.span>
                </span>
              ))}
            </motion.span>
          </AnimatePresence>
          {/* reserves the block's height without ever being visible */}
          <span className="block invisible" aria-hidden>
            {tallestTitle.split("\n").map((line, k) => (
              <span key={k} className="block pb-[0.06em]">
                {line}
              </span>
            ))}
          </span>
        </h3>
      </div>

      {/* 5–6 the frame: echoes first, then the sliced signal */}
      <div
        ref={frameRef}
        className="absolute left-1/2 sm:left-[57%] top-[44%] -translate-x-1/2 -translate-y-1/2 w-[86%] sm:w-[58%] max-w-[700px] aspect-video z-20 will-change-transform"
      >
        <div className="absolute -inset-8 rounded-[2rem] blur-2xl bg-[radial-gradient(60%_60%_at_50%_50%,rgba(30,150,180,0.22),transparent_72%)]" />

        <div
          ref={echoRRef}
          className="absolute inset-0 overflow-hidden rounded-md mix-blend-screen will-change-transform opacity-0 hidden sm:block"
          aria-hidden
        >
          <Image src={s.background} alt="" fill sizes="46vw" className="object-cover" />
          <div className="absolute inset-0 bg-[#ff3030] mix-blend-color" />
        </div>
        <div
          ref={echoCRef}
          className="absolute inset-0 overflow-hidden rounded-md mix-blend-screen will-change-transform opacity-0"
          aria-hidden
        >
          <Image src={s.background} alt="" fill sizes="46vw" className="object-cover" />
          <div className="absolute inset-0 bg-[#00e5ff] mix-blend-color" />
        </div>

        <div className="absolute inset-0 overflow-hidden rounded-md ring-1 ring-white/10 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.95)]">
          <div ref={bandA} className="absolute inset-0 will-change-transform [clip-path:inset(0_0_66.67%_0)]">
            {band(s.alt)}
          </div>
          <div ref={bandB} className="absolute inset-0 will-change-transform [clip-path:inset(33.34%_0_33.33%_0)]">
            {band()}
          </div>
          <div ref={bandC} className="absolute inset-0 will-change-transform [clip-path:inset(66.67%_0_0_0)]">
            {band()}
          </div>
          {/* a dark screen, not a photo */}
          <div className="absolute inset-0 bg-[#04070b]/45" />
          <div className="absolute inset-0 bg-[radial-gradient(110%_80%_at_62%_28%,rgba(0,0,0,0)_0%,rgba(4,7,11,0.72)_100%)]" />
          <div className="absolute inset-0 cp-scan" />
        </div>
        <div className="absolute inset-0 rounded-md ring-1 ring-inset ring-white/[0.07]" />
      </div>

      {/* 4/7 wave + near dust, over the frame */}
      <canvas
        ref={fgRef}
        className="absolute inset-0 w-full h-full z-30 pointer-events-none"
        aria-hidden
      />

      {/* 3b type in front, clipped by the card edge */}
      <div
        ref={typeFrontRef}
        className="absolute left-0 bottom-[7%] w-[92%] sm:w-[52%] pl-[5%] pr-4 z-40 will-change-transform"
      >
        <div className="relative">
          <AnimatePresence mode="sync" initial={false}>
            <motion.div key={i} className="absolute bottom-0 left-0 w-full">
              <span className="block overflow-hidden">
                <motion.span
                  className="block font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-white/60"
                  initial={reduceMotion ? LINE_AT : LINE_IN}
                  animate={LINE_AT}
                  exit={reduceMotion ? LINE_AT : LINE_OUT}
                  transition={{ duration: reduceMotion ? 0 : BEAT * 0.4, ease: EASE }}
                >
                  {s.kicker}
                </motion.span>
              </span>
              <motion.p
                className="hidden sm:block mt-3 max-w-[42ch] text-[11px] font-light leading-relaxed text-white/65"
                initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduceMotion ? 0 : -10 }}
                transition={{ duration: reduceMotion ? 0 : BEAT * 0.38, ease: EASE, delay: reduceMotion ? 0 : BEAT * 0.06 }}
              >
                {s.copy}
              </motion.p>
            </motion.div>
          </AnimatePresence>
          {/* reserves height so the bottom-anchored block never jumps */}
          <div className="invisible" aria-hidden>
            <span className="block font-mono text-[9px] sm:text-[10px] tracking-[0.3em]">&nbsp;</span>
            <p className="hidden sm:block mt-3 max-w-[42ch] text-[11px] leading-relaxed">
              {longestCopy}
            </p>
          </div>
        </div>
      </div>

      {/* production metadata */}
      <div
        className="absolute inset-0 z-40 pointer-events-none font-mono text-[8px] uppercase tracking-[0.25em] text-white/25"
        aria-hidden
      >
        <div className="absolute top-[5%] left-[5%] space-y-1.5">
          {META_LEFT.map((m) => (
            <span key={m} className="block">
              {m}
            </span>
          ))}
        </div>
        <div className="absolute top-[5%] right-[5%] space-y-1.5 text-right">
          {META_RIGHT.map((m) => (
            <span key={m} className="block">
              {m}
            </span>
          ))}
        </div>
        <span className="absolute bottom-[5%] right-[5%]">
          FRAME {String(127 + i * 43).padStart(5, "0")} · SIGNAL {String(i + 1).padStart(2, "0")}
        </span>
      </div>

      {/* 7 optical */}
      <div className="absolute inset-0 z-50 pointer-events-none cp-grain" aria-hidden />
      <div className="absolute inset-0 z-50 pointer-events-none cp-lines" aria-hidden />
      <div
        className="absolute inset-0 z-50 pointer-events-none"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 45%, rgba(0,0,0,0) 40%, rgba(2,4,7,0.5) 78%, rgba(2,4,7,0.88) 100%)",
        }}
        aria-hidden
      />

      <div className="absolute inset-x-0 bottom-0 h-px bg-white/10 z-50" aria-hidden>
        <span
          ref={barRef}
          className="block h-full w-full origin-left will-change-transform"
          style={{ background: s.accent, transform: "scaleX(0)" }}
        />
      </div>

      {/* keeps the next frame warm so the change never pops */}
      <Image
        src={next.background}
        alt=""
        fill
        sizes="(max-width: 640px) 88vw, 46vw"
        className="opacity-0 pointer-events-none"
        aria-hidden
      />

      {expanded && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(false);
          }}
          aria-label="Close"
          className="absolute top-4 right-4 z-[60] grid place-items-center w-9 h-9 rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-white/80 hover:text-white hover:bg-black/70 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      )}

      <style>{`
        .cp-lines {
          background-image: repeating-linear-gradient(to bottom, rgba(255,255,255,0.035) 0 1px, transparent 1px 3px);
          animation: cp-lines 9s linear infinite;
        }
        @keyframes cp-lines { to { background-position: 0 -120px; } }
        @keyframes cp-in { from { opacity: 0; } to { opacity: 1; } }
        .cp-in { animation-name: cp-in; animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1); animation-fill-mode: both; }
        .cp-scan {
          background-image: repeating-linear-gradient(to bottom, rgba(0,0,0,0.22) 0 1px, transparent 1px 3px);
          mix-blend-mode: multiply;
        }
        .cp-grain {
          opacity: 0.09;
          mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E");
          animation: cp-grain 0.7s steps(6) infinite;
        }
        @keyframes cp-grain {
          0%   { background-position: 0 0; }
          20%  { background-position: -22px 14px; }
          40%  { background-position: 18px -20px; }
          60%  { background-position: -14px -10px; }
          80%  { background-position: 24px 18px; }
          100% { background-position: 0 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .cp-lines, .cp-grain { animation: none; }
          .cp-in { animation: none; opacity: 1; }
        }
      `}</style>
    </div>
  );

  if (!expanded) return card;

  return createPortal(
    <div className="fixed inset-0 z-[120] grid place-items-center p-4 sm:p-10">
      <motion.div
        className="absolute inset-0 bg-black/80 backdrop-blur-xl saturate-[0.6]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => setExpanded(false)}
      />
      <div className="relative w-full max-w-6xl">{card}</div>
    </div>,
    document.body
  );
}
