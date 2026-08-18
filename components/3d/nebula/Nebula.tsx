'use client'

import React, { useMemo, useRef, useEffect, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { GalaxyGeometry, GalaxyShader } from './'
import { useScrollProgress } from '@/components/context/ScrollProgressContext'
import { PHASES } from '@/config/scrollPhases'

// ─── Hoisted constants: computed once at module load, not every render ───
const ORBIT_CONFIG = {
  rotateSpeed: 0.005,
  dampingFactor: 0.05,
  inertiaDecay: 0.95,
  minPhi: 0.3,
  maxPhi: Math.PI - 0.3,
}

const NEBULA_PALETTE = [
  new THREE.Color(1.0, 0.9, 0.8),
  new THREE.Color(1.0, 0.6, 0.8),
  new THREE.Color(0.6, 0.4, 1.0),
  new THREE.Color(0.2, 0.3, 0.8)
]

const NEBULA_CONFIG = {
  spiralCount: 5,
  turnsPerSpiral: 0.8,
  totalStars: 4000,
  pointSize: 2.8,
  blackHoleRadius: 0.25,
  colorMode: 1,
  colorPalette: NEBULA_PALETTE,
  colorIntensity: 1.1,
  appearanceStart: PHASES.NEBULA_APPEAR.start,
  appearanceEnd: PHASES.NEBULA_APPEAR.end,
  vanishStart: PHASES.NEBULA_VANISH.start,
  vanishEnd: PHASES.NEBULA_VANISH.end
}

export const Nebula = () => {
  const { size, gl } = useThree()
  const groupRef = useRef<THREE.Group>(null!)
  const meshRef = useRef<THREE.Points>(null!)
  const progressRef = useScrollProgress()
  const rafPending = useRef(false) // ← ADDED: throttle flag

  // ─── Manual Orbit State (mimics OrbitControls behavior) ───
  const orbitState = useRef({
    theta: -0.2680,
    phi: 0.3762,

    targetTheta: -0.2680,
    targetPhi: 0.3762,

    prevX: 0,
    prevY: 0,

    velocityTheta: 0,
    velocityPhi: 0,
  })

  const geometry = useMemo(() => new GalaxyGeometry(NEBULA_CONFIG.totalStars), [])
  
  const material = useMemo(() => new GalaxyShader({
    ...NEBULA_CONFIG,
    pointSize: 20,
    resolution: new THREE.Vector2(size.width, size.height),
    fadeNear: 0.1,
    fadeFar: 50.0
  }), [])

  // ─── Mouse Event Handlers ───
  const onPointerMove = useCallback((e: PointerEvent) => {
    // ← Throttle first — skip all work during rapid mouse movement
    if (rafPending.current) return
    rafPending.current = true
    requestAnimationFrame(() => { rafPending.current = false })

    const p = progressRef.current
    // Early exit if nebula is not yet visible
    if (p < 0.43) return

    const state = orbitState.current
    
    // Prevent jump on first move or after leaving window
    if (state.prevX === 0 && state.prevY === 0) {
      state.prevX = e.clientX
      state.prevY = e.clientY
      return
    }

    const deltaX = e.clientX - state.prevX
    const deltaY = e.clientY - state.prevY

    const hoverScale = 0.05

    state.targetTheta -= deltaX * ORBIT_CONFIG.rotateSpeed * hoverScale
    state.targetPhi -= deltaY * ORBIT_CONFIG.rotateSpeed * hoverScale

    state.targetPhi = Math.max(ORBIT_CONFIG.minPhi, Math.min(ORBIT_CONFIG.maxPhi, state.targetPhi))

    state.velocityTheta = -deltaX * ORBIT_CONFIG.rotateSpeed * hoverScale
    state.velocityPhi = -deltaY * ORBIT_CONFIG.rotateSpeed * hoverScale

    state.prevX = e.clientX
    state.prevY = e.clientY
  }, [])

  const onPointerLeave = useCallback(() => {
    if (progressRef.current < 0.43) return

    const state = orbitState.current
    state.prevX = 0
    state.prevY = 0
  }, [])

  // ─── Attach listeners to canvas element instead of window ← CHANGED ───
  useEffect(() => {
    const canvas = gl.domElement // ← CHANGED: scoped to canvas, not window

    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerleave', onPointerLeave)

    return () => {
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [onPointerMove, onPointerLeave, gl])

  // ─── Render Loop ───
  useFrame((state) => {
    const p = progressRef.current;
    const os = orbitState.current;
    
    const isVisible = p > 0.43
    if (groupRef.current) groupRef.current.visible = isVisible
    if (!isVisible) return

    if (material.uniforms) {
      material.uniforms.u_time.value = state.clock.getElapsedTime() * 0.05
      
      const appearance = THREE.MathUtils.smoothstep(p, NEBULA_CONFIG.appearanceStart, NEBULA_CONFIG.appearanceEnd)
      const disappearance = 1.0 - THREE.MathUtils.smoothstep(p, NEBULA_CONFIG.vanishStart, NEBULA_CONFIG.vanishEnd)
      const nebulaOpacity = appearance * disappearance
      
      material.uniforms.u_colorIntensity.value = NEBULA_CONFIG.colorIntensity * nebulaOpacity
    }

    os.targetTheta += os.velocityTheta
    os.targetPhi += os.velocityPhi

    os.targetPhi = Math.max(ORBIT_CONFIG.minPhi, Math.min(ORBIT_CONFIG.maxPhi, os.targetPhi))

    os.velocityTheta *= ORBIT_CONFIG.inertiaDecay
    os.velocityPhi *= ORBIT_CONFIG.inertiaDecay

    if (Math.abs(os.velocityTheta) < 0.00001) os.velocityTheta = 0
    if (Math.abs(os.velocityPhi) < 0.00001) os.velocityPhi = 0

    os.theta += (os.targetTheta - os.theta) * ORBIT_CONFIG.dampingFactor
    os.phi += (os.targetPhi - os.phi) * ORBIT_CONFIG.dampingFactor

    if (groupRef.current) {
      groupRef.current.rotation.y = os.theta
      groupRef.current.rotation.x = os.phi - Math.PI / 2
    }

    if (meshRef.current) {
      meshRef.current.rotation.z += 0.0002
    }
  })

  useEffect(() => {
    if (material.uniforms) {
      material.uniforms.u_resolution.value.set(size.width, size.height)
    }
  }, [size])

  return (
    <group ref={groupRef} position={[0, 0, -5]}>
      <points 
        ref={meshRef} 
        geometry={geometry} 
        material={material} 
        scale={[3.5, 3.5, 3.5]} 
      />
    </group>
  )
}
