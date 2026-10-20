'use client'

import React, { useEffect, useRef } from 'react'

interface SonicAuroraWaveProps {
  bpm: number
  waveSpeed: number
  waveTurbulence: number
  accentColor: string
  isActive?: boolean
}

function withAlpha(color: string, alpha: number): string {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (match) {
    return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${alpha})`
  }
  return color
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  life: number
  maxLife: number
}

export default function SonicAuroraWave({
  bpm,
  waveSpeed,
  waveTurbulence,
  accentColor,
  isActive = true,
}: SonicAuroraWaveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointerRef = useRef({ x: 0.5, y: 0.5, speed: 0 })
  const lastPointerRef = useRef({ x: 0.5, y: 0.5, time: Date.now() })
  const particlesRef = useRef<Particle[]>([])

  // Track pointer for fluid wave ripple excitation and spark burst
  useEffect(() => {
    if (!isActive) return

    const handlePointerMove = (e: PointerEvent) => {
      const now = Date.now()
      const dt = Math.max(16, now - lastPointerRef.current.time)
      const nx = e.clientX / window.innerWidth
      const ny = e.clientY / window.innerHeight
      const dist = Math.hypot(nx - lastPointerRef.current.x, ny - lastPointerRef.current.y)
      const speed = Math.min(dist / (dt / 1000), 4.0)

      pointerRef.current = { x: nx, y: ny, speed }
      lastPointerRef.current = { x: nx, y: ny, time: now }
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    return () => window.removeEventListener('pointermove', handlePointerMove)
  }, [isActive])

  useEffect(() => {
    if (!isActive) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let phase = 0
    let pointerEnergy = 0

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.resetTransform()
      ctx.scale(dpr, dpr)
    }

    resize()
    window.addEventListener('resize', resize)

    const render = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = canvas.width / dpr
      const height = canvas.height / dpr

      ctx.clearRect(0, 0, width, height)

      // Time step scaled by BPM and custom artist speed
      const baseSpeed = (bpm / 120) * 0.028 * waveSpeed
      phase += baseSpeed

      // Decay pointer ripple energy
      pointerEnergy = pointerEnergy * 0.94 + pointerRef.current.speed * 0.06
      pointerRef.current.speed *= 0.95

      const midY = height * 0.65

      // ─────────────────────────────────────────────────────────────
      // 1. DEEP VOLUMETRIC AURORA FILL (Under-Glow Horizon)
      // ─────────────────────────────────────────────────────────────
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(0, height)

      for (let x = 0; x <= width; x += 4) {
        const u = x / width
        const envelope = Math.sin(u * Math.PI)

        const w1 = Math.sin(x * 0.008 + phase * 0.8) * (height * 0.3 * waveTurbulence)
        const w2 = Math.cos(x * 0.018 - phase * 1.2) * (height * 0.16 * waveTurbulence)
        const w3 = Math.sin(x * 0.003 + phase * 0.4) * (height * 0.12)

        const dx = Math.abs(u - pointerRef.current.x)
        const ripple = Math.exp(-dx * 12) * Math.sin(dx * 40 - phase * 4) * (height * 0.28 * pointerEnergy)

        const y = midY + (w1 + w2 + w3 + ripple) * envelope

        if (x === 0) ctx.lineTo(x, y)
        else ctx.lineTo(x, y)
      }

      ctx.lineTo(width, height)
      ctx.closePath()

      const fillGrad = ctx.createLinearGradient(0, midY - 30, 0, height)
      fillGrad.addColorStop(0, withAlpha(accentColor, 0.22))
      fillGrad.addColorStop(0.5, withAlpha(accentColor, 0.06))
      fillGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = fillGrad
      ctx.fill()
      ctx.restore()

      // ─────────────────────────────────────────────────────────────
      // 2. HARMONIC SECONDARY RIBBON (Fluid Chromatic Echo)
      // ─────────────────────────────────────────────────────────────
      ctx.save()
      ctx.beginPath()
      for (let x = 0; x <= width; x += 3) {
        const u = x / width
        const envelope = Math.sin(u * Math.PI)

        const w1 = Math.cos(x * 0.012 - phase * 0.9) * (height * 0.24 * waveTurbulence)
        const w2 = Math.sin(x * 0.024 + phase * 1.4) * (height * 0.11)

        const dx = Math.abs(u - pointerRef.current.x)
        const ripple = Math.exp(-dx * 10) * Math.sin(dx * 35 - phase * 3.5) * (height * 0.2 * pointerEnergy)

        const y = midY + 4 + (w1 + w2 + ripple) * envelope

        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }

      ctx.lineWidth = 1.4
      const secGrad = ctx.createLinearGradient(0, 0, width, 0)
      secGrad.addColorStop(0, 'rgba(255, 255, 255, 0.04)')
      secGrad.addColorStop(0.3, accentColor)
      secGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.55)')
      secGrad.addColorStop(1, 'rgba(255, 255, 255, 0.04)')
      ctx.strokeStyle = secGrad
      ctx.stroke()
      ctx.restore()

      // ─────────────────────────────────────────────────────────────
      // 3. CORE STARLIGHT CREST (Ultra-Crisp Titanium Peak Ribbon)
      // ─────────────────────────────────────────────────────────────
      ctx.save()
      ctx.beginPath()
      for (let x = 0; x <= width; x += 2) {
        const u = x / width
        const envelope = Math.sin(u * Math.PI)

        const w1 = Math.sin(x * 0.008 + phase) * (height * 0.28 * waveTurbulence)
        const w2 = Math.cos(x * 0.02 - phase * 1.3) * (height * 0.15 * waveTurbulence)
        const w3 = Math.sin(x * 0.038 + phase * 2.1) * (height * 0.07 * waveTurbulence)

        const dx = Math.abs(u - pointerRef.current.x)
        const ripple = Math.exp(-dx * 14) * Math.sin(dx * 45 - phase * 4) * (height * 0.3 * pointerEnergy)

        const y = midY + (w1 + w2 + w3 + ripple) * envelope

        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)

        // Spawn starlight ember particles occasionally at high wave peaks
        if (x % 32 === 0 && Math.random() < 0.12 && particlesRef.current.length < 50) {
          particlesRef.current.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 0.8,
            vy: -(Math.random() * 1.2 + 0.6),
            size: Math.random() * 2.2 + 0.8,
            alpha: 1,
            life: 0,
            maxLife: Math.floor(Math.random() * 45 + 30),
          })
        }
      }

      ctx.lineWidth = 2.2
      ctx.shadowColor = '#ffffff'
      ctx.shadowBlur = 14

      const coreGrad = ctx.createLinearGradient(0, 0, width, 0)
      coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.1)')
      coreGrad.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)')
      coreGrad.addColorStop(0.5, '#ffffff')
      coreGrad.addColorStop(0.8, 'rgba(255, 255, 255, 0.8)')
      coreGrad.addColorStop(1, 'rgba(255, 255, 255, 0.1)')

      ctx.strokeStyle = coreGrad
      ctx.stroke()
      ctx.restore()

      // ─────────────────────────────────────────────────────────────
      // 4. FLOATING CONCERT EMBERS & SPARKS (Ascending Starlight)
      // ─────────────────────────────────────────────────────────────
      ctx.save()
      const particles = particlesRef.current
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.life++
        p.x += p.vx
        p.y += p.vy
        p.alpha = Math.max(0, 1 - p.life / p.maxLife)

        if (p.life >= p.maxLife) {
          particles.splice(i, 1)
          continue
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = withAlpha(accentColor, p.alpha * 0.75)
        ctx.shadowColor = '#ffffff'
        ctx.shadowBlur = 6
        ctx.fill()
      }
      ctx.restore()

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [bpm, waveSpeed, waveTurbulence, accentColor, isActive])

  return (
    <div className="relative w-full h-10 sm:h-16 md:h-24 lg:h-32 flex items-center justify-center pointer-events-none select-none overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}

