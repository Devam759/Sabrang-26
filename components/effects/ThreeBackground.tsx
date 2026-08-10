'use client';

/**
 * ThreeBackground — Interactive Hero Background for Sabrang Landing Page
 *
 * Features a dynamic magnetic particle field behind "SABRANG 2025" that reacts,
 * repels, scales, and ripples interactively whenever the user moves their cursor!
 */

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

// ─── CURSOR-INTERACTIVE MAGNETIC PARTICLE FIELD ───────────────────────────────
function InteractiveParticles({ count = 280 }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Generate initial 3D positions & velocities for particles behind title
  const particles = useMemo(() => {
    const temp = [];
    const colorChoices = ['#38bdf8', '#6366f1', '#a855f7', '#ec4899', '#818cf8'];

    for (let i = 0; i < count; i++) {
      // Spread across hero backdrop width/height
      const ox = (Math.random() - 0.5) * 32;
      const oy = (Math.random() - 0.5) * 20;
      const oz = (Math.random() - 0.5) * 12 - 2;

      // Current positions (start at origin positions)
      const cx = ox;
      const cy = oy;
      const cz = oz;

      // Floating phase frequency & amplitude
      const speed = 0.4 + Math.random() * 0.8;
      const phase = Math.random() * Math.PI * 2;
      const baseScale = 0.18 + Math.random() * 0.22;
      const color = colorChoices[i % colorChoices.length];

      temp.push({ ox, oy, oz, cx, cy, cz, speed, phase, baseScale, color });
    }
    return temp;
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Convert normalized mouse coords (-1 to 1) into 3D world space units
    const { mouse } = state;
    const targetMouseX = mouse.x * 14;
    const targetMouseY = mouse.y * 8;

    // Subtle group parallax tilt following cursor
    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, mouse.x * 0.12, 0.05);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -mouse.y * 0.12, 0.05);
    }

    const time = state.clock.getElapsedTime();

    particles.forEach((p, i) => {
      // 1. Organic baseline floating motion
      const floatX = Math.sin(time * p.speed + p.phase) * 0.35;
      const floatY = Math.cos(time * p.speed * 0.8 + p.phase) * 0.35;

      const homeX = p.ox + floatX;
      const homeY = p.oy + floatY;
      const homeZ = p.oz;

      // 2. Calculate 2D distance to mouse pointer in world space
      const dx = homeX - targetMouseX;
      const dy = homeY - targetMouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Repulsion radius = 6.5 units
      const maxDist = 6.5;
      let pushX = 0;
      let pushY = 0;
      let pushZ = 0;
      let activeScale = p.baseScale;

      if (dist < maxDist) {
        // Stronger force near cursor center
        const force = (1 - dist / maxDist) ** 1.8;
        const angle = Math.atan2(dy, dx);

        pushX = Math.cos(angle) * force * 4.2;
        pushY = Math.sin(angle) * force * 4.2;
        pushZ = force * 3.5; // push forward toward camera

        // Scale up particles near cursor for glowing constellation effect
        activeScale = p.baseScale * (1 + force * 1.8);
      }

      // Smoothly interpolate current particle position to target position
      p.cx = THREE.MathUtils.lerp(p.cx, homeX + pushX, 0.1);
      p.cy = THREE.MathUtils.lerp(p.cy, homeY + pushY, 0.1);
      p.cz = THREE.MathUtils.lerp(p.cz, homeZ + pushZ, 0.1);

      // Update dummy transform matrix
      dummy.position.set(p.cx, p.cy, p.cz);
      dummy.scale.setScalar(activeScale);
      dummy.rotation.set(time * 0.5 + i, time * 0.3 + i, 0);
      dummy.updateMatrix();

      meshRef.current?.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          color="#6366f1"
          emissive="#38bdf8"
          emissiveIntensity={0.6}
          roughness={0.1}
          metalness={0.8}
        />
      </instancedMesh>
    </group>
  );
}

// ─── BACKGROUND AMBIENT DISTORTED SPHERES ─────────────────────────────────────
function AnimatedShapes() {
  return (
    <>
      <Float speed={2} rotationIntensity={1} floatIntensity={2}>
        <Sphere args={[1.2, 64, 64]} position={[-6, 3, -6]}>
          <MeshDistortMaterial
            color="#818cf8"
            speed={3}
            distort={0.4}
            radius={1}
            transparent
            opacity={0.7}
          />
        </Sphere>
      </Float>

      <Float speed={3} rotationIntensity={2} floatIntensity={1}>
        <Sphere args={[0.9, 64, 64]} position={[7, -3, -7]}>
          <MeshDistortMaterial
            color="#c084fc"
            speed={5}
            distort={0.5}
            radius={1}
            transparent
            opacity={0.7}
          />
        </Sphere>
      </Float>

      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={3}>
        <Sphere args={[1.4, 64, 64]} position={[0, -5, -9]}>
          <MeshDistortMaterial
            color="#fb7185"
            speed={2}
            distort={0.3}
            radius={1}
            transparent
            opacity={0.6}
          />
        </Sphere>
      </Float>
    </>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ThreeBackground() {
  return (
    <div className="absolute inset-0 -z-10 bg-slate-950 overflow-hidden">
      <Canvas camera={{ position: [0, 0, 15], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1.2} />
        <pointLight position={[-10, -10, -10]} color="#38bdf8" intensity={0.8} />
        <Stars radius={100} depth={50} count={3500} factor={4} saturation={0} fade speed={1.2} />
        
        {/* Interactive Magnetic Particle Cloud */}
        <InteractiveParticles count={280} />

        <AnimatedShapes />
      </Canvas>
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[1px] pointer-events-none"></div>
    </div>
  );
}
