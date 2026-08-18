'use client'

import React, { useEffect, useRef } from 'react'
import './AmbientAurora.css'

export default function AmbientAurora() {
    const nodeMainRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        let rafId: number
        const handleMouseMove = (e: MouseEvent) => {
            if (!nodeMainRef.current) return
            
            cancelAnimationFrame(rafId)
            rafId = requestAnimationFrame(() => {
                const x = (e.clientX / window.innerWidth) - 0.5
                const y = (e.clientY / window.innerHeight) - 0.5
                if (nodeMainRef.current) {
                    nodeMainRef.current.style.transform = `translate(${x * 50}px, ${y * 50}px)`
                }
            })
        }

        window.addEventListener('mousemove', handleMouseMove, { passive: true })
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            cancelAnimationFrame(rafId)
        }
    }, [])

    return (
        <div className="aurora-canvas">
            {/* These nodes are specifically placed to "peek" from the sides */}
            <div ref={nodeMainRef} className="light-node node-right"></div>
            <div className="light-node node-bottom-left"></div>
            <div className="light-node node-top-left"></div>
        </div>
    )
}
