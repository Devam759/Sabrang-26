'use client'

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import { heroConfig, heroDebugEnabled, mountHeroDebugPanel } from './heroConfig'
import { heroInput, heroScrollState, startHeroInput } from './heroScrollState'
import HeroEnvironment from './HeroEnvironment'
import HeroTypography from './HeroTypography'
import HeroPrism from './HeroPrism'
import HeroLights from './HeroLights'
import HeroEffects from './HeroEffects'
import { detectHeroTier, heroQuality, type HeroQuality } from './heroTier'

/* ══════════════════════════════════════════════════════════════════
 * OPTICAL CHROMATIC DISPERSION FLARE (Prism Penetration Blast)
 * ══════════════════════════════════════════════════════════════════ */
const FLARE_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const FLARE_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uProgress;
  #define PI 3.14159265359

  vec3 spectrum(float x) {
    return cos((x - vec3(0.0, 0.5, 1.0)) * vec3(0.6, 1.0, 0.5) * PI);
  }

  void main() {
    // Smooth chromatic flare curve as camera dives through prism (0.45 to 1.00)
    if (uProgress < 0.45 || uProgress >= 1.0) {
      discard;
    }

    float t = (uProgress - 0.45) / 0.55;
    float intensity = sin(t * PI);

    vec2 p = vUv * 2.0 - 1.0;
    float dist = length(p);

    // Chromatic dispersion caustics ring expanding with dive
    float caustics = 1.0 - smoothstep(0.0, 0.8, abs(dist - (0.2 + t * 0.9)));
    vec3 color = spectrum(dist * 2.5 - t * 2.0);

    // Core white light burst
    float burst = 1.0 - smoothstep(0.0, 0.5, dist);
    color += vec3(1.0, 0.98, 0.92) * burst * 1.6;

    gl_FragColor = vec4(color * intensity * 1.3, intensity * (caustics * 0.7 + burst * 0.8));
  }
`

function PrismDiveFlare() {
  const meshRef = useRef<THREE.Mesh>(null)
  const uniforms = useMemo(() => ({
    uProgress: { value: 0 },
  }), [])

  useFrame(() => {
    uniforms.uProgress.value = heroScrollState.progress
  })

  return (
    <mesh ref={meshRef} renderOrder={999}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={FLARE_VERT}
        fragmentShader={FLARE_FRAG}
        uniforms={uniforms}
        transparent
        depthTest={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

function SceneContents({ mobile, q }: { mobile: boolean; q: HeroQuality }) {
  return (
    <>
      <HeroEnvironment mobile={mobile} q={q} />
      <HeroLights />
      <HeroTypography mobile={mobile} q={q} />
      <HeroPrism mobile={mobile} q={q} />
      <PrismDiveFlare />
      <HeroEffects mobile={mobile} q={q} />
    </>
  )
}

/* ══════════════════════════════════════════════════════════════════
 * CAMERA CONTROLLER: Prism Dive Rig
 * ══════════════════════════════════════════════════════════════════ */
function CameraController() {
  const current = useRef(new THREE.Vector3(0, 0, heroConfig.cameraDistance))

  useFrame((state, delta) => {
    const d = Math.min(delta, 0.05)
    const p = THREE.MathUtils.clamp(heroScrollState.progress, 0, 1)
    const cam = state.camera as THREE.PerspectiveCamera

    // Camera surges FORWARD into and THROUGH the 3D Prism (z=0)
    let targetZ = heroConfig.cameraDistance
    if (p <= 0.3) {
      targetZ = heroConfig.cameraDistance - 1.5 * (p / 0.3)
    } else {
      // Dives from 6.5 -> -1.5 directly through the center of the glass prism!
      targetZ = 6.5 - 8.0 * ((p - 0.3) / 0.7)
    }

    // Dynamic FOV hyperspace expansion as we penetrate the glass
    const diveProgress = THREE.MathUtils.clamp((p - 0.5) / 0.45, 0, 1)
    const fovBoost = Math.sin(diveProgress * Math.PI) * 12.0
    const targetFOV = heroConfig.cameraFOV + fovBoost

    if (Math.abs(cam.fov - targetFOV) > 0.1) {
      cam.fov = targetFOV
      cam.updateProjectionMatrix()
    }

    const targetX = heroInput.x * 0.25 * (1 - p * 0.8)
    const targetY = heroInput.y * 0.15 * (1 - p * 0.8)

    current.current.x = THREE.MathUtils.damp(current.current.x, targetX, 4, d)
    current.current.y = THREE.MathUtils.damp(current.current.y, targetY, 4, d)
    current.current.z = THREE.MathUtils.damp(current.current.z, targetZ, 4, d)

    cam.position.copy(current.current)
    cam.lookAt(0, 0, -2)
  })

  return null
}

export default function HeroScene() {
  const [mobile, setMobile] = useState<boolean | null>(null)
  const [q, setQ] = useState<HeroQuality | null>(null)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    setMobile(window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches)
    setQ(heroQuality(detectHeroTier()))
    const stopInput = startHeroInput()
    const stopPanel = heroDebugEnabled() ? mountHeroDebugPanel() : undefined

    // Occlusion culling: pause WebGL render loop when user scrolls past hero track
    let observer: IntersectionObserver | null = null
    const track = document.getElementById('hero-scroll-track')
    if (track && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        ([entry]) => {
          setIsVisible(entry.isIntersecting)
        },
        { rootMargin: '120px 0px' }
      )
      observer.observe(track)
    }

    return () => {
      stopInput()
      stopPanel?.()
      observer?.disconnect()
    }
  }, [])

  if (mobile === null || q === null) return <div className="hero-scene-wrapper fixed inset-0 z-0" />

  return (
    <div
      className="hero-scene-wrapper fixed inset-0 z-0 pointer-events-none transition-opacity duration-300"
      style={{
        touchAction: 'none',
        background: '#000',
        visibility: isVisible ? 'visible' : 'hidden',
        opacity: isVisible ? 1 : 0,
      }}
    >
      <Canvas
        frameloop={isVisible ? 'always' : 'demand'}
        camera={{ position: [0, 0, heroConfig.cameraDistance], fov: heroConfig.cameraFOV, near: 0.1, far: 200 }}
        dpr={1}
        gl={{ antialias: false, alpha: false, stencil: false }}
        style={{ pointerEvents: 'none' }}
        onCreated={({ gl }) => {
          gl.transmissionResolutionScale = q.transmissionScale
        }}
      >
        <CameraController />
        <Suspense fallback={null}>
          <SceneContents mobile={mobile} q={q} />
        </Suspense>
      </Canvas>
    </div>
  )
}
