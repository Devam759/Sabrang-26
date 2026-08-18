'use client'

import React, { useEffect, useRef, useState } from 'react'
import './Preloader.css'

export default function Preloader({ onComplete }: { onComplete?: () => void }) {
    const [progress, setProgress] = useState(0)
    const [isComplete, setIsComplete] = useState(false)
    const [mounted, setMounted] = useState(false)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const isCompleteRef = useRef(false) // ← ADDED

    useEffect(() => {
        setMounted(true)
    }, [])

    // Progress Simulation
    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval)
                    setTimeout(() => {
                        isCompleteRef.current = true // ← ADDED: stops canvas loop
                        setIsComplete(true)
                        onComplete?.()
                    }, 500)
                    return 100
                }
                const increment = Math.random() * 5
                return Math.min(100, prev + increment)
            })
        }, 100)
        return () => clearInterval(interval)
    }, [])


    // Neural Web Animation
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let w: number, h: number, points: any[] = []
        let animationId: number
        let grid: any[][] = []
        let gridW: number, gridH: number
        const cellSize = 150

        const init = () => {
            w = canvas.width = window.innerWidth
            h = canvas.height = window.innerHeight
            points = []
            for(let i=0; i<60; i++) {
                points.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5
                })
            }
            
            gridW = Math.ceil(w / cellSize)
            gridH = Math.ceil(h / cellSize)
            grid = Array.from({ length: gridW * gridH }, () => [])
        }

        const draw = () => {
            if (isCompleteRef.current) return // ← ADDED: kills loop when done

            ctx.clearRect(0,0,w,h)
            ctx.fillStyle = "var(--white-subtle)"
            
            // Optimization: Clear existing arrays instead of re-allocating
            for (let i = 0; i < grid.length; i++) {
                grid[i].length = 0
            }

            points.forEach((p) => {
                p.x += p.vx; p.y += p.vy
                if(p.x < 0 || p.x > w) p.vx *= -1
                if(p.y < 0 || p.y > h) p.vy *= -1
                
                ctx.beginPath()
                ctx.arc(p.x, p.y, 1, 0, Math.PI*2)
                ctx.fill()

                const gx = Math.floor(p.x / cellSize)
                const gy = Math.floor(p.y / cellSize)
                if (gx >= 0 && gx < gridW && gy >= 0 && gy < gridH) {
                    grid[gy * gridW + gx].push(p)
                }
            })

            // 2. Only check neighboring cells
            const distLimitSq = cellSize * cellSize
            points.forEach((p) => {
                const gx = Math.floor(p.x / cellSize)
                const gy = Math.floor(p.y / cellSize)

                for (let ox = -1; ox <= 1; ox++) {
                    for (let oy = -1; oy <= 1; oy++) {
                        const nx = gx + ox
                        const ny = gy + oy
                        if (nx >= 0 && nx < gridW && ny >= 0 && ny < gridH) {
                            const cell = grid[ny * gridW + nx]
                            for (const p2 of cell) {
                                if (p === p2) continue
                                const dx = p.x - p2.x
                                const dy = p.y - p2.y
                                const d2 = dx*dx + dy*dy
                                if (d2 < distLimitSq) {
                                    const dist = Math.sqrt(d2)
                                    ctx.strokeStyle = `rgba(var(--color-white-rgb), ${(1 - dist/cellSize) * 0.15})`
                                    ctx.lineWidth = 0.5
                                    ctx.beginPath()
                                    ctx.moveTo(p.x, p.y)
                                    ctx.lineTo(p2.x, p2.y)
                                    ctx.stroke()
                                }
                            }
                        }
                    }
                }
            })
            animationId = requestAnimationFrame(draw)
        }

        window.addEventListener('resize', init)
        init()
        draw()

        return () => {
            window.removeEventListener('resize', init)
            cancelAnimationFrame(animationId)
        }
    }, [])

    return (
        <div className={`preloader-overlay ${progress === 100 ? 'fading' : ''}`} 
             suppressHydrationWarning
             style={{ 
                 opacity: progress === 100 ? 0 : 1,
                 transform: progress === 100 ? 'scale(1.1)' : 'scale(1)',
                 pointerEvents: progress === 100 ? 'none' : 'all'
             }}>
            {mounted && <canvas ref={canvasRef} className="preloader-canvas" />}
            
            <div className="preloader-content">
                <div className="preloader-meta">Recalibrating Neural Architecture...</div>
                
                <div className="preloader-progress-bar">
                    <div className="preloader-progress-fill" style={{ width: `${progress}%` }} />
                </div>
                
                <div className="preloader-percentage">
                    SYNCING_CORE_NODES_{Math.round(progress)}%
                </div>
            </div>
        </div>
    )
}