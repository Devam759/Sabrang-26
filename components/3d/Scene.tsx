'use client'

import React, { Suspense, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const Head = React.lazy(() => import('./Head/Head').then(module => ({ default: module.Head })))
const Dna = React.lazy(() => import('./Dna/Dna').then(module => ({ default: module.Dna })))
import { Nebula } from './nebula/Nebula'

import {
  ScrollProgressProvider,
  useScrollProgress
} from '@/components/context/ScrollProgressContext'

import { PHASES, phaseProgress } from '@/config/scrollPhases'


gsap.registerPlugin(ScrollTrigger)



/* ----------------- CAMERA CONTROLLER ----------------- */

// Hoisted constants to avoid per-frame allocations
const HEAD_LOOK_AT = new THREE.Vector3(-0.09, 0.8, 0)
const DNA_LOOK_AT = new THREE.Vector3(0, 0, 0)
const ORBIT_RADIUS = Math.sqrt(4 * 4 + (-4) * (-4)) // ~5.65
const START_ANGLE = Math.atan2(-4, 4) // -PI/4
const END_ORBIT_ANGLE = 0 // Ending point of orbit (straight ahead)

const START_Y = 0.3
const ZOOM_END_Y = 0.8
const ZOOM_END_Z = 0.8
const ZOOM_END_X = -0.5

const DEFAULT_X = 0
const DEFAULT_Y = 0
const DEFAULT_Z = 5

// Reusable scratch vector for calculations
const _tempVector = new THREE.Vector3()

function CameraController() {
  const progressRef = useScrollProgress()

  useFrame(({ camera }) => {
    const p = progressRef.current

    // Phase 4: fully release camera
    if (p > PHASES.HEAD_CAMERA_RETURN.end) return

    /* ---- State variables for current position ---- */
    let currentX, currentY, currentZ

    if (p <= PHASES.HEAD_CAMERA_ORBIT.end) {
      /* ---- Phase 1: Circular Orbit ---- */
      const orbitP = phaseProgress(p, PHASES.HEAD_CAMERA_ORBIT)
      const angle = THREE.MathUtils.lerp(START_ANGLE, END_ORBIT_ANGLE, orbitP)
      
      currentX = Math.sin(angle) * ORBIT_RADIUS
      currentY = START_Y
      currentZ = Math.cos(angle) * ORBIT_RADIUS

    } else if (p <= PHASES.HEAD_CAMERA_ZOOM.end) {
      /* ---- Phase 2: Z-Axis Closing ---- */
      const zoomP = phaseProgress(p, PHASES.HEAD_CAMERA_ZOOM)
      
      // Starting from orbit end position
      const orbitEndX = Math.sin(END_ORBIT_ANGLE) * ORBIT_RADIUS
      const orbitEndZ = Math.cos(END_ORBIT_ANGLE) * ORBIT_RADIUS
      
      currentX = THREE.MathUtils.lerp(orbitEndX, ZOOM_END_X, zoomP)
      currentY = THREE.MathUtils.lerp(START_Y, ZOOM_END_Y, zoomP)
      currentZ = THREE.MathUtils.lerp(orbitEndZ, ZOOM_END_Z, zoomP)

    } else {
      /* ---- Phase 3: Return to Default ---- */
      const returnP = phaseProgress(p, PHASES.HEAD_CAMERA_RETURN)
      
      currentX = THREE.MathUtils.lerp(ZOOM_END_X, DEFAULT_X, returnP)
      currentY = THREE.MathUtils.lerp(ZOOM_END_Y, DEFAULT_Y, returnP)
      currentZ = THREE.MathUtils.lerp(ZOOM_END_Z, DEFAULT_Z, returnP)
      
      // Reuse _tempVector instead of .clone().lerp()
      _tempVector.copy(HEAD_LOOK_AT).lerp(DNA_LOOK_AT, returnP)
      camera.lookAt(_tempVector)
      
      camera.position.set(currentX, currentY, currentZ)
      return
    }

    camera.position.set(currentX, currentY, currentZ)
    camera.lookAt(HEAD_LOOK_AT)
  })

  return null
}




/* ----------------- SCENE ----------------- */

// Detect mobile at component level to allow resize updates

function SceneContent() {

  const progressRef = useScrollProgress()

  const [mounted, setMounted] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)



  useEffect(() => {

    setMounted(true)
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)

  }, [])



  useEffect(() => {

    if (!mounted) return


    const ctx = gsap.context(() => {

      ScrollTrigger.create({

        trigger: '#scroll-trigger',

        start: 'top top',

        end: 'bottom bottom',

        scrub: 2.5,

        onUpdate: self => {

          progressRef.current =
            self.progress

        }

      })

    })


    return () => ctx.revert()

  }, [mounted])



  if (!mounted) return null



  return (

    <Canvas

      camera={{

        position: [-3, 0.5, 3.32],

        fov: 25,

        near: 0.1,

        far: 1000

      }}


      onCreated={({ camera }) =>
        camera.lookAt(0, 1, 0)
      }


      gl={{

        antialias: false,

        toneMapping:
          THREE.ACESFilmicToneMapping,

        powerPreference:
          'high-performance',

        alpha: true

      }}


      dpr={isMobile ? [1, 1] : [1, 1.5]}
      style={{ background: 'transparent' }}
    >





      <CameraController />


      <ambientLight intensity={0.4} />


      <directionalLight
        position={[3, 5, 4]}
        intensity={1.5}
      />


      <pointLight
        position={[-3, 2, 4]}
        intensity={1}
        color="#aa77ee"
      />


      <pointLight
        position={[0, 0, -4]}
        intensity={0.8}
        color="#cc99ff"
      />



      <Suspense fallback={null}>
        <Head isMobile={isMobile} />
        <Dna />
        <Nebula />
        {!isMobile && (
          <Environment
            preset="city"
            background={false}
          />
        )}
      </Suspense>

      {/* Bloom disabled on mobile — saves a full-screen shader pass */}
      {!isMobile && (
        <EffectComposer multisampling={0}>
          <Bloom
            luminanceThreshold={0.9}
            luminanceSmoothing={0.2}
            intensity={0.15}
            mipmapBlur
            resolutionX={256}
            resolutionY={256}
          />
        </EffectComposer>
      )}




    </Canvas>

  )

}




/* ----------------- EXPORT ----------------- */

export default function Scene() {

  return (

    <ScrollProgressProvider>

      <SceneContent />

    </ScrollProgressProvider>

  )

}
