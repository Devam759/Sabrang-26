'use client'

import React, { useMemo, useRef, useEffect } from 'react'
import { useGLTF, MeshTransmissionMaterial } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './ParticleMaterial'
import { useScrollProgress } from '@/components/context/ScrollProgressContext'
import { PHASES } from '@/config/scrollPhases'

// ─── Hoisted constants — computed once at module load, not every frame
const WHITE_COLOR = new THREE.Color('#ffffff')
const BG_COLOR = new THREE.Color('#050505')

/**
 * Head Component: The hero 3D scene containing the Glass Head and the Neural Particles.
 */

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

// Configuration for the MeshTransmissionMaterial
const GLASS_CONFIG = {
  backside: false,
  backsideThickness: 0.2,
  thickness: 1.0,
  transmission: 1.0,
  ior: 1.2,
  chromaticAberration: 0.05,
  anisotropy: 0.1,
  roughness: 0.1,
  distortion: 0.03,
  distortionScale: 0.1,
  temporalDistortion: 0.0,
  clearcoat: 1.0,
  attenuationDistance: 0.5,
  attenuationColor: '#ffffff',
  color: '#ffffff',
  samples: 1,     // Reduced from 3 — eliminates 2 extra render passes per frame
  resolution: 64, // Reduced from 128 to 64 for aggressive performance optimization
}

function createGlowTexture() {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = 128 
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)')
  grad.addColorStop(0.4, 'rgba(255, 255, 255, 0.5)')
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
  
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 128, 128)
  
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

const PARTICLE_COUNT = 3000

export function Head({ isMobile = false }: { isMobile?: boolean }) {
  const progressRef = useScrollProgress()
  const headGroupRef = useRef<THREE.Group>(null!)
  const dprRef = useRef(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2))
  const { scene } = useGLTF('/models/human-draco.glb', '/draco/')
  const glowTexture = useMemo(() => createGlowTexture(), [])

  // 1. Merge all meshes into a single Geometry for performance
  const { mergedGeometry, center, scaleFactor } = useMemo(() => {
    const geometries: THREE.BufferGeometry[] = []
    
    scene.updateMatrixWorld(true)
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        const cloned = mesh.geometry.clone()
        cloned.applyMatrix4(mesh.matrixWorld)
        geometries.push(cloned)
      }
    })

    const merged = BufferGeometryUtils.mergeGeometries(geometries)
    merged.computeBoundingBox()
    merged.computeBoundingSphere()
    merged.computeVertexNormals()
    
    const box = merged.boundingBox!
    const c = new THREE.Vector3()
    box.getCenter(c)
    
    const size = new THREE.Vector3()
    box.getSize(size)
    const maxDim = Math.max(size.x, size.y, size.z)
    const sf = maxDim > 0 ? 2.5 / maxDim : 1

    return { mergedGeometry: merged, center: c, scaleFactor: sf }
  }, [scene])

  const groupRef = useRef<THREE.Group>(null!)
  const particleMatRef = useRef<any>(null!)
  const lightRef = useRef<THREE.PointLight>(null!)

  const particleGeo = useMemo(() => {
    const startPos = new Float32Array(PARTICLE_COUNT * 3)
    const spreadPos = new Float32Array(PARTICLE_COUNT * 3)
    const endPos = new Float32Array(PARTICLE_COUNT * 3)
    const colors = new Float32Array(PARTICLE_COUNT * 3)
    const randoms = new Float32Array(PARTICLE_COUNT * 3)

    const colorPalette = [
        new THREE.Color('#ffffff'), 
        new THREE.Color('#ffccaa'), 
        new THREE.Color('#ff8866'), 
    ]

    const brainW = 0.03; const brainH = 0.03; const brainD = 0.03
    const brainYOffset = 0.2

    const tempColor = new THREE.Color()

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        const r = Math.cbrt(Math.random())

        const sinPhi = Math.sin(phi)
        const vx = r * sinPhi * Math.cos(theta)
        const vy = r * sinPhi * Math.sin(theta)
        const vz = r * Math.cos(phi)

        randoms[i3] = Math.random(); randoms[i3+1] = Math.random(); randoms[i3+2] = Math.random()

        startPos[i3] = vx * brainW
        startPos[i3+1] = (vy * brainH) + brainYOffset
        startPos[i3+2] = vz * brainD

        const scatterRadius = 0.5
        spreadPos[i3] = vx * scatterRadius
        spreadPos[i3+1] = vy * scatterRadius + (brainYOffset * 0.5)
        spreadPos[i3+2] = vz * scatterRadius

        const coreRadius = 0.0001
        endPos[i3] = vx * coreRadius
        endPos[i3+1] = vy * coreRadius + brainYOffset
        endPos[i3+2] = vz * coreRadius

        const colorIndex = Math.floor(r * (colorPalette.length - 1))
        tempColor.copy(colorPalette[colorIndex]).lerp(colorPalette[colorIndex+1] || colorPalette[colorIndex], r % 1)
        
        colors[i3] = tempColor.r; colors[i3+1] = tempColor.g; colors[i3+2] = tempColor.b
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(startPos.slice(), 3))
    geo.setAttribute('aStartPos', new THREE.BufferAttribute(startPos, 3))
    geo.setAttribute('aSpreadPos', new THREE.BufferAttribute(spreadPos, 3))
    geo.setAttribute('aEndPos', new THREE.BufferAttribute(endPos, 3))
    geo.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    return geo
  }, [])

  useFrame((state) => {
    const p = progressRef.current
    const t = state.clock.elapsedTime

    // Visibility Culling: hide everything and skip logic if far outside active phase
    const isVisible = p < PHASES.HEAD_VISIBLE.end + 0.05
    if (groupRef.current) groupRef.current.visible = isVisible
    if (!isVisible) return

    if (headGroupRef.current) headGroupRef.current.visible = p < PHASES.HEAD_VISIBLE.end

    if (particleMatRef.current) {
      particleMatRef.current.uTime = t
      particleMatRef.current.uScrollProgress = p
      particleMatRef.current.uPixelRatio = dprRef.current
    }

    if (lightRef.current) {
      const lightIntensity = 5 + (p * p) * 100.0
      const fadeOut = 1.0 - THREE.MathUtils.smoothstep(p, PHASES.HEAD_LIGHT_FADE.start, PHASES.HEAD_LIGHT_FADE.end)
      lightRef.current.intensity = lightIntensity * fadeOut
    }
  })

  useEffect(() => {
    return () => {
      mergedGeometry.dispose()
      glowTexture?.dispose()
      particleGeo.dispose()
    }
  }, [mergedGeometry, glowTexture, particleGeo])

  return (
    <group ref={groupRef}>
      <group scale={scaleFactor} position={[-center.x * scaleFactor,
         -center.y * scaleFactor, 
         -center.z * scaleFactor]}>
        
        <group ref={headGroupRef}>
          <mesh 
            geometry={mergedGeometry} 
            renderOrder={2}
            castShadow={false}
            receiveShadow={false}
          >
            {/* Mobile: lightweight MeshStandardMaterial (no extra render passes)
                Desktop: full MeshTransmissionMaterial (multi-pass glass) */}
            {isMobile ? (
              <meshStandardMaterial
                color="#ffffff"
                transparent
                opacity={0.15}
                roughness={0.05}
                metalness={0.1}
                envMapIntensity={0.5}
                side={THREE.FrontSide}
              />
            ) : (
              <MeshTransmissionMaterial 
                {...GLASS_CONFIG}
                background={BG_COLOR}
              />
            )}
          </mesh>
        </group>
        
        {/* <pointLight 
            ref={lightRef}
            position={[center.x, center.y + 0.25, center.z]} 
            color="#ffaa88" 
            intensity={5} 
            distance={4}
            decay={2}
        /> */}

        {particleGeo && (
            <points 
                geometry={particleGeo} 
                position={center} 
                scale={0.95} 
                renderOrder={1} // Particles drawn before Glass
            >
                {/* @ts-ignore */}
                <particleMaterial 
                    ref={particleMatRef}
                    transparent={true}
                    depthWrite={false}
                    depthTest={false}
                    uColor={WHITE_COLOR} 
                    uMap={glowTexture}
                    blending={THREE.AdditiveBlending}
                    uScatterStart={PHASES.PARTICLE_SCATTER.start}
                    uScatterEnd={PHASES.PARTICLE_SCATTER.end}
                    uImplodeStart={PHASES.PARTICLE_IMPLODE.start}
                    uImplodeEnd={PHASES.PARTICLE_IMPLODE.end}
                    uFadeoutAt={PHASES.PARTICLE_FADEOUT.start}
                />
            </points>
        )}
      </group>
    </group>
  )
}

useGLTF.preload('/models/human-draco.glb', '/draco/')
