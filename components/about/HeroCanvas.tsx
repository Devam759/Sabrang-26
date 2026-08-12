"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// ------------------------------------------------------------------
// Atmospheric point cloud — 800 particles, slow drift, depth scatter
// ------------------------------------------------------------------
function AtmosphereCloud({
  mouse,
}: {
  mouse: React.RefObject<{ x: number; y: number }>;
}) {
  const count = 800;
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Spread deeper in Z — creates layered fog feel
      pos[i * 3 + 0] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 22;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40;

      // Slight color variation — near-white to pale indigo
      const tone = 0.55 + Math.random() * 0.45;
      col[i * 3 + 0] = tone * 0.85; // R
      col[i * 3 + 1] = tone * 0.88; // G
      col[i * 3 + 2] = tone * 1.0; // B — slight blue bias
    }

    return [pos, col];
  }, [count]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    // Slow, hypnotic rotation
    pointsRef.current.rotation.y += delta * 0.018;
    pointsRef.current.rotation.x += delta * 0.007;

    // Mouse-driven parallax shift on the cloud
    pointsRef.current.rotation.x = THREE.MathUtils.lerp(
      pointsRef.current.rotation.x,
      -mouse.current.y * 0.15,
      0.03,
    );
    pointsRef.current.rotation.y = THREE.MathUtils.lerp(
      pointsRef.current.rotation.y,
      mouse.current.x * 0.15,
      0.03,
    );
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.055}
        vertexColors
        transparent
        opacity={0.45}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// ------------------------------------------------------------------
// Foreground dust layer — larger, closer, more visible
// ------------------------------------------------------------------
function ForegroundDust() {
  const count = 200;
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 18;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8 + 2; // closer to camera
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.z =
      Math.sin(state.clock.elapsedTime * 0.05) * 0.02;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#c4b5fd"
        transparent
        opacity={0.25}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// ------------------------------------------------------------------
// Camera rig — subtle mouse-driven look-at shift
// ------------------------------------------------------------------
function CameraRig({
  mouse,
  scrollProgress,
}: {
  mouse: React.RefObject<{ x: number; y: number }>;
  scrollProgress: React.RefObject<number>;
}) {
  const { camera } = useThree();

  useFrame((state, delta) => {
    // Base Z position shifts back slightly as scroll progresses (depth parallax)
    const targetZ = 7 - scrollProgress.current * 2.5;
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.025);

    // Mouse X/Y shift — subtle offset
    const targetX = mouse.current.x * 0.8;
    const targetY = mouse.current.y * 0.5;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.025);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.025);

    camera.lookAt(0, 0, 0);
  });

  return null;
}

// ------------------------------------------------------------------
// Main exported canvas
// ------------------------------------------------------------------
export default function HeroCanvas({
  scrollProgress,
}: {
  scrollProgress?: React.RefObject<number>;
}) {
  const mouse = useRef({ x: 0, y: 0 });
  const internalProgress = useRef(0);
  const activeProgress = scrollProgress ?? internalProgress;

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
  };

  return (
    <div
      onPointerMove={handlePointerMove}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: "none" }}
    >
      <Canvas
        dpr={[1, 1.5]}
        performance={{ min: 0.5 }}
        camera={{ position: [0, 0, 7], fov: 52 }}
        gl={(canvasTarget: any) =>
          new THREE.WebGLRenderer({
            canvas: (canvasTarget.canvas || canvasTarget) as HTMLCanvasElement,
            antialias: false, // off for perf
            alpha: true,
            powerPreference: "high-performance",
          })
        }
        onCreated={({ gl }) => {
          if (gl.domElement?.addEventListener) {
            gl.domElement.addEventListener("webglcontextlost", (e) => {
              e.preventDefault();
            });
          }
        }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[0, 0, 5]} intensity={0.6} color="#c7d2fe" />

        <CameraRig mouse={mouse} scrollProgress={activeProgress} />
        <AtmosphereCloud mouse={mouse} />
        <ForegroundDust />
      </Canvas>
    </div>
  );
}
