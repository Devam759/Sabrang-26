'use client'

import React, { useRef, useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { Volume2, VolumeX } from 'lucide-react'
import { RADIAL_ARTISTS, type HapticStyle } from './radialStageData'

interface CoutureStageDiscProps {
  currentAngle?: number // optional backwards compatibility
  onAngleChange?: (angle: number) => void
  onSelectArtist?: (index: number) => void
  activeIndex?: number
  selectedPhotoIndex: number
  onSelectPhotoIndex: (index: number) => void
  artistIndex?: number
  hideDock?: boolean
  soundEnabled?: boolean
  onToggleSound?: () => void
  isActive?: boolean
}

export default function CoutureStageDisc({
  onSelectArtist,
  activeIndex = 0,
  selectedPhotoIndex,
  onSelectPhotoIndex,
  artistIndex,
  hideDock = false,
  soundEnabled: externalSoundEnabled,
  onToggleSound,
  isActive = true,
}: CoutureStageDiscProps) {
  const discRef = useRef<HTMLDivElement>(null)
  const turntablePlatterRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const lastAngleRef = useRef(0)
  const currentAngleRef = useRef(selectedPhotoIndex * 90)
  const currentPhotoIndexRef = useRef(selectedPhotoIndex)
  const velocityRef = useRef(0)
  const lastTimeRef = useRef(Date.now())
  const frictionRafRef = useRef<number | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const lastStationIndexRef = useRef(activeIndex)
  const lastTickAngleRef = useRef(0)

  const [internalSoundEnabled, setInternalSoundEnabled] = useState(true)
  const soundEnabled = externalSoundEnabled !== undefined ? externalSoundEnabled : internalSoundEnabled
  const isMotorActiveRef = useRef(true)
  const dragStartPosRef = useRef({ x: 0, y: 0 })
  const hasMovedPastThresholdRef = useRef(false)

  const discArtistIndex = artistIndex !== undefined ? artistIndex : activeIndex
  const activeArtist = RADIAL_ARTISTS[discArtistIndex] || RADIAL_ARTISTS[0]

  // Direct DOM GPU rotation (0 React re-renders during scrubbing & inertia)
  const applyTurntableRotation = useCallback((angle: number) => {
    currentAngleRef.current = angle
    const platter = turntablePlatterRef.current
    if (platter) {
      platter.style.transform = `rotate3d(0, 0, 1, ${-angle}deg) translateZ(0)`
      platter.style.setProperty('--disc-rot', `${angle}deg`)
    }
  }, [])

  // Track mouse coordinates over disc for 3D holographic lens parallax via CSS variables (0 React re-renders)
  const handlePointerMoveLens = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const disc = discRef.current
    if (!disc) return
    const rect = disc.getBoundingClientRect()
    const nx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)
    const ny = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)
    disc.style.setProperty('--tilt-x', `${(nx * 14).toFixed(2)}px`)
    disc.style.setProperty('--tilt-y', `${(ny * 14).toFixed(2)}px`)
  }, [])

  const handlePointerLeaveLens = useCallback(() => {
    const disc = discRef.current
    if (!disc) return
    disc.style.setProperty('--tilt-x', '0px')
    disc.style.setProperty('--tilt-y', '0px')
  }, [])

  // Subtle physical bezel micro-tick during rotational scrubbing
  const playMicroTick = useCallback(() => {
    if (typeof window === 'undefined' || !soundEnabled) return
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        if (AudioContextClass) {
          audioCtxRef.current = new AudioContextClass()
        }
      }
      const ctx = audioCtxRef.current
      if (!ctx) return
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {})
      }
      const now = ctx.currentTime
      const tick = ctx.createOscillator()
      const gain = ctx.createGain()
      tick.type = 'sine'
      tick.frequency.setValueAtTime(1400, now)
      tick.frequency.exponentialRampToValueAtTime(320, now + 0.007)
      gain.gain.setValueAtTime(0.015, now)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.008)
      tick.connect(gain)
      gain.connect(ctx.destination)
      tick.start(now)
      tick.stop(now + 0.008)
    } catch {
      // Audio autoplay policy fallback
    }
  }, [soundEnabled])

  // Native Web Audio Synthesizer: Multi-layered studio-grade tactile soundscapes
  const playCoutureHaptic = useCallback((style: HapticStyle) => {
    if (typeof window === 'undefined' || !soundEnabled) return
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        if (AudioContextClass) {
          audioCtxRef.current = new AudioContextClass()
        }
      }
      const ctx = audioCtxRef.current
      if (!ctx) return
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {})
      }

      const now = ctx.currentTime

      if (style === 'subbass') {
        const subOsc = ctx.createOscillator()
        const subGain = ctx.createGain()
        subOsc.type = 'sine'
        subOsc.frequency.setValueAtTime(130, now)
        subOsc.frequency.exponentialRampToValueAtTime(36, now + 0.22)
        subGain.gain.setValueAtTime(0.09, now)
        subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25)
        subOsc.connect(subGain)
        subGain.connect(ctx.destination)
        subOsc.start(now)
        subOsc.stop(now + 0.25)

        const harmOsc = ctx.createOscillator()
        const harmFilter = ctx.createBiquadFilter()
        const harmGain = ctx.createGain()
        harmOsc.type = 'triangle'
        harmOsc.frequency.setValueAtTime(90, now)
        harmOsc.frequency.exponentialRampToValueAtTime(45, now + 0.18)
        harmFilter.type = 'lowpass'
        harmFilter.frequency.setValueAtTime(180, now)
        harmGain.gain.setValueAtTime(0.045, now)
        harmGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.20)
        harmOsc.connect(harmFilter)
        harmFilter.connect(harmGain)
        harmGain.connect(ctx.destination)
        harmOsc.start(now)
        harmOsc.stop(now + 0.20)

        const clickOsc = ctx.createOscillator()
        const clickGain = ctx.createGain()
        clickOsc.type = 'sine'
        clickOsc.frequency.setValueAtTime(650, now)
        clickOsc.frequency.exponentialRampToValueAtTime(80, now + 0.016)
        clickGain.gain.setValueAtTime(0.065, now)
        clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018)
        clickOsc.connect(clickGain)
        clickGain.connect(ctx.destination)
        clickOsc.start(now)
        clickOsc.stop(now + 0.018)
      } else if (style === 'electro') {
        const sawOsc = ctx.createOscillator()
        const sawFilter = ctx.createBiquadFilter()
        const sawGain = ctx.createGain()
        sawOsc.type = 'sawtooth'
        sawOsc.frequency.setValueAtTime(460, now)
        sawOsc.frequency.exponentialRampToValueAtTime(90, now + 0.09)
        sawFilter.type = 'bandpass'
        sawFilter.Q.setValueAtTime(4.8, now)
        sawFilter.frequency.setValueAtTime(3400, now)
        sawFilter.frequency.exponentialRampToValueAtTime(380, now + 0.09)
        sawGain.gain.setValueAtTime(0.06, now)
        sawGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.10)
        sawOsc.connect(sawFilter)
        sawFilter.connect(sawGain)
        sawGain.connect(ctx.destination)
        sawOsc.start(now)
        sawOsc.stop(now + 0.10)

        const sparkOsc = ctx.createOscillator()
        const sparkFilter = ctx.createBiquadFilter()
        const sparkGain = ctx.createGain()
        sparkOsc.type = 'square'
        sparkOsc.frequency.setValueAtTime(1400, now)
        sparkFilter.type = 'highpass'
        sparkFilter.frequency.setValueAtTime(2200, now)
        sparkGain.gain.setValueAtTime(0.035, now)
        sparkGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.022)
        sparkOsc.connect(sparkFilter)
        sparkFilter.connect(sparkGain)
        sparkGain.connect(ctx.destination)
        sparkOsc.start(now)
        sparkOsc.stop(now + 0.022)
      } else {
        const ch1 = ctx.createOscillator()
        const g1 = ctx.createGain()
        ch1.type = 'sine'
        ch1.frequency.setValueAtTime(528, now)
        g1.gain.setValueAtTime(0.001, now)
        g1.gain.exponentialRampToValueAtTime(0.05, now + 0.008)
        g1.gain.exponentialRampToValueAtTime(0.0001, now + 0.38)
        ch1.connect(g1)
        g1.connect(ctx.destination)
        ch1.start(now)
        ch1.stop(now + 0.38)

        const ch2 = ctx.createOscillator()
        const g2 = ctx.createGain()
        ch2.type = 'sine'
        ch2.frequency.setValueAtTime(1056, now)
        g2.gain.setValueAtTime(0.001, now)
        g2.gain.exponentialRampToValueAtTime(0.028, now + 0.01)
        g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.28)
        ch2.connect(g2)
        g2.connect(ctx.destination)
        ch2.start(now)
        ch2.stop(now + 0.28)

        const ch3 = ctx.createOscillator()
        const g3 = ctx.createGain()
        ch3.type = 'sine'
        ch3.frequency.setValueAtTime(1584, now)
        g3.gain.setValueAtTime(0.001, now)
        g3.gain.exponentialRampToValueAtTime(0.016, now + 0.012)
        g3.gain.exponentialRampToValueAtTime(0.0001, now + 0.20)
        ch3.connect(g3)
        g3.connect(ctx.destination)
        ch3.start(now)
        ch3.stop(now + 0.20)
      }
    } catch {
      // Audio autoplay policy fallback
    }
  }, [soundEnabled])

  // Unlock AudioContext on first user interaction
  useEffect(() => {
    const unlockAudio = () => {
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {})
      }
    }
    window.addEventListener('pointerdown', unlockAudio, { passive: true, once: true })
    window.addEventListener('touchstart', unlockAudio, { passive: true, once: true })
    return () => {
      window.removeEventListener('pointerdown', unlockAudio)
      window.removeEventListener('touchstart', unlockAudio)
    }
  }, [])

  // Trigger bespoke genre haptic when snapping or crossing into an artist station
  useEffect(() => {
    if (activeIndex !== lastStationIndexRef.current) {
      lastStationIndexRef.current = activeIndex
      const current = RADIAL_ARTISTS[activeIndex]
      if (current) {
        playCoutureHaptic(current.hapticType)
      }
    }
  }, [activeIndex, playCoutureHaptic])

  // Get pointer angle relative to center of disc
  const getAngleFromPointer = useCallback((clientX: number, clientY: number) => {
    const disc = discRef.current
    if (!disc) return 0

    const rect = disc.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const dx = clientX - centerX
    const dy = clientY - centerY

    let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90
    if (deg < 0) deg += 360
    return deg
  }, [])

  // Continuous smooth ease to target unwrapped angle
  const animateToAngle = useCallback(
    (targetAngle: number, targetIdx: number, duration = 450, onComplete?: () => void) => {
      if (frictionRafRef.current) {
        cancelAnimationFrame(frictionRafRef.current)
        frictionRafRef.current = null
      }

      const startAngle = currentAngleRef.current
      const delta = targetAngle - startAngle
      if (Math.abs(delta) < 0.1) {
        applyTurntableRotation(targetAngle)
        currentPhotoIndexRef.current = targetIdx
        onSelectPhotoIndex(targetIdx)
        onComplete?.()
        return
      }

      const startTime = performance.now()

      const step = (now: number) => {
        const elapsed = now - startTime
        const progress = Math.min(1, elapsed / duration)
        // Ease-out cubic: 1 - (1 - progress)^3
        const ease = 1 - Math.pow(1 - progress, 3)
        const current = startAngle + delta * ease
        applyTurntableRotation(current)

        if (progress < 1) {
          frictionRafRef.current = requestAnimationFrame(step)
        } else {
          applyTurntableRotation(targetAngle)
          currentPhotoIndexRef.current = targetIdx
          onSelectPhotoIndex(targetIdx)
          frictionRafRef.current = null
          onComplete?.()
        }
      }

      frictionRafRef.current = requestAnimationFrame(step)
    },
    [applyTurntableRotation, onSelectPhotoIndex]
  )

  // Rotate platter so that a specific photo port aligns directly under the 12 o'clock needle
  const rotateToPhoto = useCallback(
    (idx: number, animate = true) => {
      const currIdx = currentPhotoIndexRef.current
      // Find shortest rotational difference in 90-degree steps (-2, -1, 0, 1, 2)
      let stepDiff = (idx - currIdx) % 4
      if (stepDiff > 2) stepDiff -= 4
      if (stepDiff < -2) stepDiff += 4

      // Immediately set active photo index for instant visual feedback!
      currentPhotoIndexRef.current = idx
      onSelectPhotoIndex(idx)

      const currentSnapped = Math.round(currentAngleRef.current / 90) * 90
      const targetAngle = currentSnapped + stepDiff * 90
      if (!animate) {
        if (frictionRafRef.current) {
          cancelAnimationFrame(frictionRafRef.current)
          frictionRafRef.current = null
        }
        applyTurntableRotation(targetAngle)
        return
      }
      animateToAngle(targetAngle, idx, 450)
    },
    [animateToAngle, applyTurntableRotation, onSelectPhotoIndex]
  )

  // Continuous Ambient Vinyl Turntable Motor Spin (Subtle, luxurious 33⅓ RPM feel)
  useEffect(() => {
    if (!isActive) return

    let lastMotorTime = performance.now()
    let motorRaf: number

    const motorTick = (now: number) => {
      const dt = Math.min(32, now - lastMotorTime)
      lastMotorTime = now

      // Spin continuously when user is not dragging or animating
      if (isMotorActiveRef.current && !isDraggingRef.current && !frictionRafRef.current) {
        // Smooth 0.18 deg per frame (~11 RPM - smooth, hypnotic, and legible)
        currentAngleRef.current += (dt / 16) * 0.18
        applyTurntableRotation(currentAngleRef.current)
      }

      motorRaf = requestAnimationFrame(motorTick)
    }

    motorRaf = requestAnimationFrame(motorTick)
    return () => cancelAnimationFrame(motorRaf)
  }, [applyTurntableRotation, isActive])

  // Initial mount positioning
  const isMountedRef = useRef(false)
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true
      const initialAngle = selectedPhotoIndex * 90
      currentAngleRef.current = initialAngle
      currentPhotoIndexRef.current = selectedPhotoIndex
      applyTurntableRotation(initialAngle)
    }
  }, [applyTurntableRotation, selectedPhotoIndex])

  // When switching artists (in single disc mode), smoothly reset disc to Photo 01 (0°)
  useEffect(() => {
    if (artistIndex === undefined) {
      if (frictionRafRef.current) {
        cancelAnimationFrame(frictionRafRef.current)
        frictionRafRef.current = null
      }
      currentAngleRef.current = 0
      currentPhotoIndexRef.current = 0
      applyTurntableRotation(0)
    }
  }, [activeIndex, artistIndex, applyTurntableRotation])

  // Sync if selectedPhotoIndex changes from outside while not dragging
  useEffect(() => {
    if (!isDraggingRef.current && currentPhotoIndexRef.current !== selectedPhotoIndex) {
      rotateToPhoto(selectedPhotoIndex, true)
    }
  }, [selectedPhotoIndex, rotateToPhoto])

  // 100% UNBREAKABLE TURNABLE VINYL DRAG HANDLER (Captures pointer anywhere across the disc)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // If user clicks directly on an aperture button or interactive control, do not hijack pointer
    if ((e.target as HTMLElement).closest('button, a')) {
      return
    }

    if (frictionRafRef.current) {
      cancelAnimationFrame(frictionRafRef.current)
      frictionRafRef.current = null
    }

    // Capture pointer for buttery-smooth mobile touch tracking
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}

    // Immediately pause ambient motor when user touches
    isMotorActiveRef.current = false

    dragStartPosRef.current = { x: e.clientX, y: e.clientY }
    hasMovedPastThresholdRef.current = false
    isDraggingRef.current = false

    lastAngleRef.current = getAngleFromPointer(e.clientX, e.clientY)
    lastTimeRef.current = performance.now()
    velocityRef.current = 0

    const onWindowPointerMove = (ev: PointerEvent) => {
      const dist = Math.hypot(ev.clientX - dragStartPosRef.current.x, ev.clientY - dragStartPosRef.current.y)
      if (dist > 4) {
        hasMovedPastThresholdRef.current = true
        isDraggingRef.current = true
      }

      if (!isDraggingRef.current) return

      const now = performance.now()
      const dt = Math.max(8, now - lastTimeRef.current)
      const newPointerAngle = getAngleFromPointer(ev.clientX, ev.clientY)

      let delta = newPointerAngle - lastAngleRef.current
      if (delta > 180) delta -= 360
      if (delta < -180) delta += 360

      if (Math.abs(delta) < 0.05) return

      const rawVel = delta / (dt / 16)
      velocityRef.current = velocityRef.current * 0.35 + rawVel * 0.65
      lastAngleRef.current = newPointerAngle
      lastTimeRef.current = now

      const nextAngle = currentAngleRef.current + delta
      applyTurntableRotation(nextAngle)

      if (Math.abs(nextAngle - lastTickAngleRef.current) >= 12) {
        playMicroTick()
        lastTickAngleRef.current = nextAngle
      }
    }

    const onWindowPointerUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onWindowPointerMove)
      window.removeEventListener('pointerup', onWindowPointerUp)
      window.removeEventListener('pointercancel', onWindowPointerUp)

      try {
        if (discRef.current) {
          discRef.current.releasePointerCapture(ev.pointerId)
        }
      } catch {}

      if (!isDraggingRef.current) {
        // Was a tap/click, resume motor after brief pause
        setTimeout(() => {
          isMotorActiveRef.current = true
        }, 800)
        return
      }

      isDraggingRef.current = false

      // Rotational momentum inertia with smooth snap
      const inertiaBoost = Math.max(-180, Math.min(180, velocityRef.current * 16))
      const projectedAngle = currentAngleRef.current + inertiaBoost
      const targetStep = Math.round(projectedAngle / 90)
      const targetAngle = targetStep * 90
      const snapIdx = ((targetStep % 4) + 4) % 4

      animateToAngle(targetAngle, snapIdx, 450, () => {
        setTimeout(() => {
          isMotorActiveRef.current = true
        }, 1200)
      })
    }

    window.addEventListener('pointermove', onWindowPointerMove)
    window.addEventListener('pointerup', onWindowPointerUp)
    window.addEventListener('pointercancel', onWindowPointerUp)
  }

  // Exact mathematically centered quadrant coordinates
  const APERTURE_SLOTS = [
    { top: '16%', left: '50%' }, // 0° (Top / 12 o'clock)
    { top: '50%', left: '84%' }, // 90° (Right / 3 o'clock)
    { top: '84%', left: '50%' }, // 180° (Bottom / 6 o'clock)
    { top: '50%', left: '16%' }, // 270° (Left / 9 o'clock)
  ] as const

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      {/* ── THE PRISMATIC LIQUID VINYL DISC CHASSIS (100% TURNABLE BY TOUCH OR MOUSE) ── */}
      <div
        ref={discRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMoveLens}
        onPointerLeave={handlePointerLeaveLens}
        className="relative w-52 h-52 sm:w-60 sm:h-60 md:w-72 md:h-72 lg:w-80 lg:h-80 xl:w-96 xl:h-96 rounded-full border border-white/20 bg-gradient-to-b from-white/[0.04] to-black/95 backdrop-blur-3xl shadow-[0_30px_90px_rgba(0,0,0,0.95),inset_0_0_50px_rgba(255,255,255,0.05)] cursor-grab active:cursor-grabbing touch-none flex items-center justify-center overflow-hidden"
      >
        {/* Top 12 o'clock Precision Starlight Stylus Marker (Contained within disc rim) */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none">
          <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_#ffffff]" />
          <div className="w-[1px] h-2.5 bg-gradient-to-b from-white via-white/60 to-transparent" />
        </div>

        {/* Subtle Optical Refractive Vinyl Rim */}
        <div className="absolute inset-0 rounded-full border border-white/10 pointer-events-none opacity-60 z-20" />
        <div className="absolute inset-1.5 sm:inset-2 rounded-full border border-white/5 pointer-events-none z-20" />

        {/* ── THE ROTATING TURNTABLE PLATTER (120FPS GPU SPINS & DRAGS WITH INERTIA) ── */}
        <div
          ref={turntablePlatterRef}
          className="absolute inset-0 rounded-full will-change-transform"
        >
          {/* Dynamic Anisotropic Light Reflection Cones (Real Vinyl Optical Sheen) */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none opacity-30 mix-blend-screen"
            style={{
              background: `conic-gradient(from 45deg at 50% 50%, rgba(255,255,255,0.22) 0deg, transparent 40deg, rgba(255,255,255,0.08) 90deg, transparent 135deg, rgba(255,255,255,0.22) 180deg, transparent 220deg, rgba(255,255,255,0.08) 270deg, transparent 315deg, rgba(255,255,255,0.22) 360deg)`,
            }}
          />

          {/* Micro-Soundtrack Grooves */}
          <div className="absolute inset-2 sm:inset-4 rounded-full border border-white/[0.05] pointer-events-none" />
          <div className="absolute inset-4 sm:inset-7 rounded-full border border-white/[0.03] pointer-events-none" />
          <div className="absolute inset-6 sm:inset-10 rounded-full border border-white/[0.04] pointer-events-none" />
          <div className="absolute inset-8 sm:inset-13 rounded-full border border-white/[0.03] pointer-events-none" />
          <div className="absolute inset-10 sm:inset-16 rounded-full border border-white/[0.04] pointer-events-none" />

          {/* Run-Out Mirror Groove */}
          <div className="absolute inset-12 sm:inset-20 rounded-full border border-white/[0.08] bg-white/[0.01] pointer-events-none" />

          {/* Recessed Horological Annular Channel */}
          <div className="absolute inset-4 sm:inset-6 md:inset-8 rounded-full border border-white/10 pointer-events-none shadow-[inset_0_2px_8px_rgba(0,0,0,0.85)]" />

          {/* ── 4 GYROSCOPIC INSET LENS PORTS (Mounted at 0°, 90°, 180°, 270°) ── */}
          {activeArtist.galleryImages &&
            activeArtist.galleryImages.slice(0, 4).map((img, idx) => {
              const isSelected = selectedPhotoIndex === idx
              const slot = APERTURE_SLOTS[idx]

              return (
                <div
                  key={idx}
                  className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-30"
                  style={{ top: slot.top, left: slot.left }}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      rotateToPhoto(idx, true)
                      playMicroTick()
                    }}
                    onPointerUp={(e) => {
                      e.stopPropagation()
                      rotateToPhoto(idx, true)
                      playMicroTick()
                    }}
                    className={`group relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-15 lg:h-15 xl:w-16 xl:h-16 rounded-full cursor-pointer transition-all duration-300 p-0.5 bg-black shadow-[0_6px_25px_rgba(0,0,0,0.95)] flex items-center justify-center pointer-events-auto ${
                      isSelected
                        ? 'z-40 ring-2 ring-white shadow-[0_0_24px_#ffffff,0_0_42px_rgba(255,255,255,0.7),0_8px_25px_rgba(0,0,0,0.95)] scale-110'
                        : 'opacity-80 hover:opacity-100 hover:scale-105 ring-1 ring-white/25 hover:ring-white/60'
                    }`}
                    style={{
                      minWidth: '2.5rem',
                      minHeight: '2.5rem',
                    }}
                    title={`${activeArtist.artistName} Perspective 0${idx + 1}`}
                    aria-label={`Select perspective 0${idx + 1}`}
                  >
                    {/* GYROSCOPIC COUNTER-ROTATED CONTAINER: Stays 100% upright at all times! */}
                    <div
                      className="relative w-full h-full rounded-full overflow-hidden border border-white/20 will-change-transform bg-black"
                      style={{ transform: 'rotate(var(--disc-rot, 0deg))' }}
                    >
                      <Image
                        src={img}
                        alt={`${activeArtist.artistName} perspective 0${idx + 1}`}
                        fill
                        sizes="80px"
                        className="object-cover object-[center_top] filter contrast-110 saturate-105 group-hover:scale-110 transition-transform duration-500"
                        priority={idx < 2}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/10 pointer-events-none" />
                      {/* Always-upright, crystal-clear index badge */}
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[7px] sm:text-[8px] font-['FlorasDisplay',serif] font-bold text-white bg-black/85 px-1 py-0.5 rounded-full border border-white/20 leading-none shadow">
                        0{idx + 1}
                      </span>
                    </div>
                  </button>
                </div>
              )
            })}
        </div>

        {/* ── CENTRAL 3D HOLOGRAPHIC LENS (Liquid Mercury Iris — Drag to Turn or Tap to Cycle) ── */}
        <div
          onClick={(e) => {
            e.stopPropagation()
            const total = activeArtist.galleryImages?.length || 4
            const nextIdx = (currentPhotoIndexRef.current + 1) % total
            rotateToPhoto(nextIdx, true)
            playMicroTick()
          }}
          className="relative z-30 w-22 h-22 sm:w-26 sm:h-26 md:w-30 md:h-30 lg:w-36 lg:h-36 xl:w-40 xl:h-40 rounded-full overflow-hidden bg-gradient-to-b from-white/[0.08] to-black/95 border-2 border-white/30 backdrop-blur-3xl flex flex-col items-center justify-center p-2 text-center shadow-[inset_0_0_40px_rgba(255,255,255,0.08),0_20px_50px_rgba(0,0,0,0.9)] cursor-pointer active:scale-95 pointer-events-auto hover:border-white/60 transition-all"
          title="Drag to turn vinyl or tap to cycle stage perspective"
        >
          {/* 3D Holographic Artist Silhouette with Mouse Parallax Depth */}
          <div
            className="absolute inset-0 pointer-events-none will-change-transform"
            style={{
              transform: 'translate3d(var(--tilt-x, 0px), var(--tilt-y, 0px), 0) scale(1.05)',
            }}
          >
            <Image
              src={
                activeArtist.galleryImages && activeArtist.galleryImages[selectedPhotoIndex]
                  ? activeArtist.galleryImages[selectedPhotoIndex]
                  : activeArtist.image
              }
              alt={activeArtist.artistName}
              fill
              sizes="200px"
              className="object-cover object-[center_top] filter contrast-125 saturate-110 opacity-75 transition-all duration-500"
            />
            {/* Radial Vignette to seamlessly blend into obsidian rim */}
            <div className="absolute inset-0 bg-radial from-transparent via-black/35 to-black/90" />
          </div>

          {/* Specular Crystal Glare Sweep across the lens */}
          <div className="absolute -inset-full bg-gradient-to-br from-white/15 via-transparent to-transparent opacity-60 pointer-events-none rounded-full" />

          {/* Dynamic Starlight Corona */}
          <div
            className="absolute inset-2 rounded-full filter blur-xl opacity-35 pointer-events-none transition-colors duration-700"
            style={{ backgroundColor: activeArtist.atmosphericAccent }}
          />

          {/* Architectural Day Numeral in 3D Foreground */}
          <span className="relative z-10 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-['FlorasDisplay',serif] text-white leading-none tracking-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.7)]">
            {activeArtist.day}
          </span>

          {/* Artist Monolithic Display Name */}
          <span className="relative z-10 text-[9px] sm:text-[10px] md:text-xs font-['FlorasDisplay',serif] text-white tracking-[0.2em] uppercase mt-0.5 leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            {activeArtist.displayName}
          </span>

          <span className="relative z-10 text-[7px] sm:text-[8px] md:text-[9px] font-['FlorasDisplay',serif] tracking-[0.22em] text-white/60 uppercase mt-0.5">
            {activeArtist.dateShort} 2026
          </span>
        </div>
      </div>

      {/* ── THE HI-FI FLOATING GLASS CAPSULE DOCK (STREAMLINED LUXURY DOCK) ── */}
      {!hideDock && onSelectArtist && (
        <div className="mt-2.5 sm:mt-4 lg:mt-6 inline-flex items-center p-1 sm:p-1.5 rounded-full bg-black/75 backdrop-blur-2xl border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.85),inset_0_1px_2px_rgba(255,255,255,0.15)] max-w-full pointer-events-auto">
          <div className="flex items-center gap-1 sm:gap-1.5">
            {RADIAL_ARTISTS.map((artist, idx) => {
              const isSelected = activeIndex === idx
              return (
                <button
                  key={artist.id}
                  type="button"
                  onClick={() => onSelectArtist(idx)}
                  className={`group relative px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[11px] font-['FlorasDisplay',serif] tracking-wider transition-all duration-300 flex items-center gap-1 sm:gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-white text-black font-bold shadow-[0_0_20px_rgba(255,255,255,0.5),0_2px_8px_rgba(0,0,0,0.6)] scale-[1.02]'
                      : 'text-white/55 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <span className={`text-[8px] sm:text-[9px] font-bold ${isSelected ? 'text-black/70' : 'text-white/40'}`}>
                    {artist.day}
                  </span>
                  <span className="tracking-wider uppercase font-semibold">
                    {artist.displayName}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Sleek Vertical Capsule Divider */}
          <div className="w-[1px] h-3.5 sm:h-4 bg-white/20 mx-1 sm:mx-1.5" />

          {/* Integrated Tactile Audio FX Micro-Toggle */}
          <button
            type="button"
            onClick={onToggleSound ? onToggleSound : () => setInternalSoundEnabled((prev) => !prev)}
            className={`p-1.5 sm:p-2 rounded-full transition-all duration-300 flex items-center justify-center cursor-pointer ${
              soundEnabled
                ? 'text-white bg-white/10 hover:bg-white/20 shadow-[0_0_12px_rgba(255,255,255,0.2)]'
                : 'text-white/35 hover:text-white/60 hover:bg-white/[0.04]'
            }`}
            title={soundEnabled ? 'Haptic Sound Active (Click to Mute)' : 'Haptic Sound Muted (Click to Enable)'}
            aria-label="Toggle haptic audio"
          >
            {soundEnabled ? (
              <Volume2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            ) : (
              <VolumeX className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            )}
          </button>
        </div>
      )}
    </div>
  )
}
