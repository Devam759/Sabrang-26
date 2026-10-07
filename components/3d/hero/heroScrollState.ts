// Mutable singletons for the hero WebGL scene.
// GSAP / DOM listeners write here every frame; the single R3F useFrame loop reads.
// Kept outside React so nothing re-renders per frame.

export const heroScrollState = {
  progress: 0
}

/**
 * How far the hero sequence is pinned, and how hard it is scrubbed.
 *
 * A FUNCTION returning pixels, never a string like '+=200vh'. GSAP's end parser
 * (_offsetToPx) understands keywords, `%` and bare numbers only -- any other unit
 * is dropped by parseFloat, so '+=200vh' silently means 200 PIXELS. That pinned
 * the hero for 200px instead of ~1136px and let a single wheel notch skip the
 * whole sequence.
 *
 * Function form also re-evaluates on every ScrollTrigger.refresh(), so the range
 * follows a resized viewport instead of freezing at first paint.
 *
 * All three triggers on #scroll-trigger (the pin in HeroSection, the phase
 * readout in HomeClient, the card timeline in AboutSection) must share this exact
 * range, or they desync and the cards play against a different clock than the hero.
 */
/** Viewport heights of scroll the whole pinned hero sequence spans. Raise to slow
 * every phase down, lower to speed them up -- it is the only pacing knob.
 *
 * On mobile (≤768px) we use a larger value so touchscreen swipes don't skip the
 * whole sequence in a single flick. */
export const HERO_PIN_VH_DESKTOP = 1.5
export const HERO_PIN_VH_MOBILE = 4

export function getHeroPinVh() {
  if (typeof window === 'undefined') return HERO_PIN_VH_DESKTOP
  return window.innerWidth <= 768 ? HERO_PIN_VH_MOBILE : HERO_PIN_VH_DESKTOP
}

export const HERO_PIN_END = () => '+=' + window.innerHeight * getHeroPinVh()

/** One scrub value everywhere, so nothing lags anything else while scrubbing. */
export const HERO_SCRUB = 0.8

/** Normalised pointer, -1..1, written by a window listener (canvas is pointer-events:none). */
export const heroInput = {
  x: 0,
  y: 0
}

/** Attaches the pointer listeners. Returns the cleanup fn. */
export function startHeroInput() {
  const onMove = (e: PointerEvent) => {
    heroInput.x = (e.clientX / window.innerWidth) * 2 - 1
    heroInput.y = -((e.clientY / window.innerHeight) * 2 - 1)
  }
  window.addEventListener('pointermove', onMove, { passive: true })
  return () => window.removeEventListener('pointermove', onMove)
}
