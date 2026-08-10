'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ----------------------------------------------------
// High-Performance GPU Particle Field (0 CPU Uploads)
// ----------------------------------------------------
function ParticleRain({ mouse }: { mouse: React.RefObject<{ x: number; y: number }> }) {
  const count = 500;
  const pointsRef = useRef<THREE.Points>(null);

  const [positions] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return [pos];
  }, [count]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y += delta * 0.08;
    pointsRef.current.rotation.x = THREE.MathUtils.lerp(pointsRef.current.rotation.x, -mouse.current.y * 0.2, 0.05);
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#c7d2fe"
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

// ----------------------------------------------------
// Main Ultra-Lightweight 3D Canvas Container
// ----------------------------------------------------
export default function ShopifyStyle3DCanvas() {
  const mouse = useRef({ x: 0, y: 0 });

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    mouse.current.x = (clientX / innerWidth) * 2 - 1;
    mouse.current.y = -(clientY / innerHeight) * 2 + 1;
  };

  return (
    <div
      onPointerMove={handlePointerMove}
      className="absolute inset-0 w-full h-full pointer-events-auto"
    >
      <Canvas
        dpr={[1, 1.5]}
        performance={{ min: 0.5 }}
        camera={{ position: [0, 0, 7], fov: 48 }}
        gl={(canvasTarget: any) =>
          new THREE.WebGLRenderer({
            canvas: (canvasTarget.canvas || canvasTarget) as HTMLCanvasElement,
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
          })
        }
        onCreated={({ gl }) => {
          if (gl.domElement && typeof gl.domElement.addEventListener === 'function') {
            gl.domElement.addEventListener('webglcontextlost', (e) => {
              e.preventDefault();
            });
          }
        }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={1.5} color="#c7d2fe" />

        <ParticleRain mouse={mouse} />
      </Canvas>
    </div>
  );
}
