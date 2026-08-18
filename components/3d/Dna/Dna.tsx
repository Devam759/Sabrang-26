'use client'

import React, { useEffect, useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './DnaModelMaterial'
import { useScrollProgress } from '@/components/context/ScrollProgressContext'
import { PHASES, phaseProgress } from '@/config/scrollPhases'

// ─── Optimization: module-level constants — allocated ONCE, not on every render
const WARM_COLOR_1 = new THREE.Color('#ffffff')
const WARM_COLOR_2 = new THREE.Color('#ffccaa')
const WARM_COLOR_3 = new THREE.Color('#ff8866')
const COOL_COLOR_1 = new THREE.Color('#ffffff')
const COOL_COLOR_2 = new THREE.Color('#ffccaa')
const COOL_COLOR_3 = new THREE.Color('#ff8866')

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export function Dna() {
  const progressRef = useScrollProgress()
  const groupRef = useRef<THREE.Group>(null!)
  const dnaRef = useRef<THREE.Points>(null!)
  const materialRef = useRef<any>(null!)
  // ─── Optimization: devicePixelRatio cached once
  const dprRef = useRef(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2))

  const { scene: gltfScene } = useGLTF('/models/dna-draco.glb', '/draco/')

  // Extract + prepare geometry
  const geometry = useMemo(() => {
    let geo: THREE.BufferGeometry | null = null

    gltfScene.traverse((child) => {
      if (!geo && (child as THREE.Mesh).isMesh) {
        geo = (child as THREE.Mesh).geometry.clone()
      }
    })

    if (!geo) return null

    ;(geo as THREE.BufferGeometry).center()

    const posCount = (geo as THREE.BufferGeometry).attributes.position.count
    const randoms = new Float32Array(posCount)
    const colorRandoms = new Float32Array(posCount)
    const randomVecs = new Float32Array(posCount * 3)

    for (let i = 0; i < posCount; i++) {
      randoms[i] = Math.random()
      colorRandoms[i] = Math.random()

      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      randomVecs[i * 3] = Math.sin(phi) * Math.cos(theta)
      randomVecs[i * 3 + 1] = Math.sin(phi) * Math.sin(theta)
      randomVecs[i * 3 + 2] = Math.cos(phi)
    }

    ;(geo as THREE.BufferGeometry).setAttribute('randoms', new THREE.BufferAttribute(randoms, 1))
    ;(geo as THREE.BufferGeometry).setAttribute('colorRandoms', new THREE.BufferAttribute(colorRandoms, 1))
    ;(geo as THREE.BufferGeometry).setAttribute('aRandomVec', new THREE.BufferAttribute(randomVecs, 3))

    return geo as THREE.BufferGeometry
  }, [gltfScene])

  useEffect(() => {
    return () => {
      if (geometry) {
        geometry.dispose()
      }
    }
  }, [geometry])

  // Render loop
  useFrame((state) => {
    const t = state.clock.elapsedTime
    const p = progressRef.current

    // Visibility Culling: hide everything and skip logic if far outside active phase
    // DNA is active from around 0.15 (fade in) to 0.50 (fade out)
    const isVisible = p > 0.10 && p < 0.55
    if (groupRef.current) groupRef.current.visible = isVisible
    if (!isVisible) return

    if (materialRef.current) {
      materialRef.current.time = t
      materialRef.current.uScrollProgress = p
      materialRef.current.uPixelRatio = dprRef.current
    }

    if (dnaRef.current) {
      const dnaMorphP = phaseProgress(p, PHASES.DNA_ROTATION)
      dnaRef.current.rotation.y = t * 0.25 * dnaMorphP
    }
  })

  if (!geometry) return null

  return (
    <group ref={groupRef}>
      <points
        ref={dnaRef}
        geometry={geometry}
        position={[0, 0.1, 0]}
        scale={0.18}
      >
        {/* @ts-ignore */}
        <dnaModelMaterial
          ref={materialRef}
          transparent={true}
          depthWrite={false}
          depthTest={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          uWarmColor1={WARM_COLOR_1}
          uWarmColor2={WARM_COLOR_2}
          uWarmColor3={WARM_COLOR_3}
          uColor1={COOL_COLOR_1}
          uColor2={COOL_COLOR_2}
          uColor3={COOL_COLOR_3}
          uDnaScatterStart={PHASES.DNA_SCATTER.start}
          uDnaScatterEnd={PHASES.DNA_SCATTER.end}
          uDnaMorphStart={PHASES.DNA_MORPH.start}
          uDnaMorphEnd={PHASES.DNA_MORPH.end}
          uDnaFadeinAt={PHASES.DNA_FADEIN.start}
          uDnaFadeoutStart={PHASES.DNA_FADEOUT.start}
          uDnaFadeoutEnd={PHASES.DNA_FADEOUT.end}
        />
      </points>
    </group>
  )
}

