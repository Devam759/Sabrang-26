/**
 * ┌─────────────────────────────────────────────────────────┐
 * │           SCROLL PHASE CONFIG — SINGLE SOURCE OF TRUTH  │
 * │                                                         │
 * │  Every scroll-dependent threshold in the project reads  │
 * │  from this file. To shift timing, change ONE number.    │
 * └─────────────────────────────────────────────────────────┘
 */

export const PHASES = {

    /* ─── HEAD SECTION ─── */
    HEAD_CAMERA_ORBIT: { start: 0.00, end: 0.10 },
    HEAD_CAMERA_ZOOM: { start: 0.10, end: 0.18 },
    HEAD_CAMERA_RETURN: { start: 0.18, end: 0.32 },
    HEAD_VISIBLE: { start: 0.00, end: 0.18 },
    HEAD_LIGHT_FADE: { start: 0.18, end: 0.22 },

    /* ─── PARTICLES (Brain) ─── */
    PARTICLE_SCATTER: { start: 0.10, end: 0.15 },
    PARTICLE_IMPLODE: { start: 0.16, end: 0.20 },
    PARTICLE_FADEOUT: { start: 0.14, end: 0.19 },  // smooth fade

    /* ─── DNA ─── */
    DNA_SCATTER: { start: 0.16, end: 0.17 },
    DNA_MORPH: { start: 0.25, end: 0.30 },
    DNA_ROTATION: { start: 0.25, end: 0.35 },
    DNA_FADEIN: { start: 0.15, end: 0.20 },  // smooth fade
    DNA_FADEOUT: { start: 0.25, end: 0.50 },

    /* ─── NEBULA ─── */
    NEBULA_APPEAR: { start: 0.48, end: 0.52 },
    NEBULA_VANISH: { start: 0.90, end: 0.99 },

} as const


/* ─── Type for a single phase ─── */
export type Phase = { start: number; end: number }


/**
 * Get local 0→1 progress for a given phase.
 *
 *   phaseProgress(0.12, PHASES.PARTICLE_SCATTER)
 *   // → 0.4  (40% through particle scatter)
 */
export function phaseProgress(globalP: number, phase: Phase): number {
    if (phase.end === phase.start) return globalP >= phase.start ? 1 : 0  // hard step
    if (globalP <= phase.start) return 0
    if (globalP >= phase.end) return 1
    return (globalP - phase.start) / (phase.end - phase.start)
}
