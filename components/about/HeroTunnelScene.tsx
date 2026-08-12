"use client";

/**
 * HeroTunnelScene — Three.js particle tunnel
 *
 * Renders a cylindrical particle field the camera flies through on scroll.
 *
 * Architecture:
 *  – 10 000 points (4 000 on mobile) distributed across three zones:
 *      • Tunnel walls  (radius 2–5)  — dense, forms the "corridor"
 *      • Interior core (radius 0–1.6) — sparse, fills the centre
 *      • Outer haze    (radius 5.5–10) — soft atmospheric fog
 *  – Custom ShaderMaterial with:
 *      • Additive blending  → glowing, volumetric look
 *      • Soft disc fragment → smooth circular point sprites
 *      • Near-fade         → particles don't pop when the camera passes them
 *      • uOpacity uniform  → driven by scroll progress for phase-out
 *  – Slow axial rotation of the tunnel group (spin around Z / depth axis)
 *  – Camera Z directly tracks scrollProgress (0 → 1 maps Z: 18 → −8)
 *  – No React state updates inside the loop — all driven by refs + useFrame
 *
 * scrollProgress prop: { current: number }  — mutable ref updated by GSAP
 */

import React, { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// ─── GLSL: Vertex shader ────────────────────────────────────────────────────
//
// Key decisions:
//  • aSize / aColor are per-vertex attributes (not uniforms) so every
//    particle can have a unique visual weight and hue with zero overhead.
//  • Point size is attenuated by perspective: larger when close, smaller far.
//    Clamped 0.5–64 to respect WebGL implementation limits.
//  • vCamDist passes the eye-space depth to the fragment for near-fade.
const VERT = /* glsl */ `
attribute float aSize;
attribute vec3  aColor;

varying vec3  vColor;
varying float vCamDist;

void main() {
  vColor = aColor;

  // Eye-space position
  vec4 mv      = modelViewMatrix * vec4(position, 1.0);
  vCamDist     = -mv.z;                         // positive when in front of camera

  // Perspective-attenuated point size — larger glowing Sabrang particles
  float rawSize = aSize * (260.0 / vCamDist);
  gl_PointSize  = clamp(rawSize, 2.5, 18.0);
  gl_Position   = projectionMatrix * mv;
}
`;

// ─── GLSL: Fragment shader ──────────────────────────────────────────────────
const FRAG = /* glsl */ `
precision mediump float;

varying vec3  vColor;
varying float vCamDist;

uniform float uOpacity;

void main() {
  vec2  uv = gl_PointCoord - 0.5;
  float d  = length(uv);
  if (d > 0.5) discard;

  // Rich glowing point: bright vibrant center with smooth edge
  float a = pow(clamp(1.0 - d * 2.0, 0.0, 1.0), 2.2);

  // Near-camera fade
  float nearFade = smoothstep(1.5, 4.0, vCamDist);

  gl_FragColor = vec4(vColor, a * nearFade * uOpacity);
}
`;

// ─── Sabrang Festive Spectrum Palette ─────────────────────────────────────────
// Multi-colour vibrant festive palette reflecting Sabrang ("All Shades of Creativity"):
// Electric Cyan, Hot Magenta/Pink, Deep Violet/Purple, Sunburst Yellow/Gold,
// Emerald Lime Green, Sunset Orange-Coral, Electric Sapphire Blue, Starlight White.
const SABRANG_PALETTE: [number, number, number][] = [
  [0.0, 0.9, 1.0], // Neon Electric Cyan
  [1.0, 0.15, 0.6], // Hot Magenta / Sabrang Pink
  [0.68, 0.22, 1.0], // Vivid Violet / Purple
  [1.0, 0.82, 0.05], // Sunburst Yellow / Amber Gold
  [0.1, 0.92, 0.45], // Emerald Lime Green
  [1.0, 0.36, 0.1], // Sunset Orange-Coral
  [0.2, 0.55, 1.0], // Electric Sapphire Blue
  [1.0, 0.95, 0.85], // Warm Diamond Starlight
  [0.92, 0.95, 1.0], // Cold Diamond Starlight
];

// ─── Geometry builder ────────────────────────────────────────────────────────
function buildTunnel(n: number): {
  pos: Float32Array;
  col: Float32Array;
  sz: Float32Array;
} {
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const sz = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    const z = (Math.random() - 0.5) * 90;

    let x = 0;
    let y = 0;
    const angle = Math.random() * Math.PI * 2;
    const zone = Math.random();

    if (zone < 0.82) {
      // Dense inner tunnel wall (radius 2.0 - 5.8)
      const r = 2.0 + Math.random() * 3.8;
      x = Math.cos(angle) * r;
      y = Math.sin(angle) * r;
    } else {
      // Outer starfield haze (radius 6.0 - 11.0)
      const r = 6.0 + Math.random() * 5.0;
      x = Math.cos(angle) * r;
      y = Math.sin(angle) * r;
    }

    pos[i * 3] = x;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = z;

    // Per-particle colour: vibrant Sabrang multi-colour spectrum
    const p =
      SABRANG_PALETTE[Math.floor(Math.random() * SABRANG_PALETTE.length)];
    const b = 0.6 + Math.random() * 0.4; // High vibrant brightness
    col[i * 3] = p[0] * b;
    col[i * 3 + 1] = p[1] * b;
    col[i * 3 + 2] = p[2] * b;

    sz[i] = 0.7 + Math.random() * 2.0;
  }

  return { pos, col, sz };
}

// ─── Inner R3F scene ─────────────────────────────────────────────────────────
function TunnelScene({
  scrollProgress,
}: {
  scrollProgress: { current: number };
}) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  // Halved particle budget for cleaner, distinct glowing dots (9,000 desktop / 4,000 mobile)
  const count = useMemo(() => {
    if (typeof window === "undefined") return 5000;
    const isMobile = window.innerWidth < 768;
    const cores = navigator.hardwareConcurrency || 4;
    if (isMobile || cores <= 4) return 4000;
    return 9000;
  }, []);

  // Build geometry + material once
  const { geo, mat } = useMemo(() => {
    const { pos, col, sz } = buildTunnel(count);

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(sz, 1));
    g.computeBoundingSphere();

    const m = new THREE.ShaderMaterial({
      uniforms: { uOpacity: { value: 1.0 } },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    return { geo: g, mat: m };
  }, [count]);

  // Dispose GPU resources when component unmounts
  useEffect(
    () => () => {
      geo.dispose();
      mat.dispose();
    },
    [geo, mat],
  );

  // Per-frame: update camera + tunnel rotation + particle opacity
  useFrame((_, delta) => {
    const p = scrollProgress.current; // 0 → 1

    // Particle opacity: full until 58% scroll, then fades to 0 by 82%
    const opacity = THREE.MathUtils.clamp(1 - (p - 0.58) / 0.24, 0, 1);
    mat.uniforms.uOpacity.value = opacity;

    // GPU Optimization: Hide mesh and skip rotation when particle opacity reaches 0
    if (groupRef.current) {
      const isVisible = opacity > 0.001;
      groupRef.current.visible = isVisible;
      if (!isVisible) return; // Skip GPU draw call completely when scrolled past hero

      groupRef.current.rotation.z += delta * (0.022 + p * 0.02);
    }

    // Camera flies through the tunnel along Z
    const cam = camera as THREE.PerspectiveCamera;
    cam.position.z = THREE.MathUtils.lerp(18, -8, p);
  });

  return (
    <group ref={groupRef}>
      <points geometry={geo} material={mat} />
    </group>
  );
}

// ─── Exported canvas wrapper ─────────────────────────────────────────────────
export default function HeroTunnelScene({
  scrollProgress,
}: {
  scrollProgress: { current: number };
}) {
  return (
    <div
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      <Canvas
        dpr={
          typeof window !== "undefined" && window.innerWidth < 768
            ? [1, 1.5]
            : [1, 2]
        }
        performance={{ min: 0.5 }}
        camera={{ position: [0, 0, 18], fov: 60, near: 0.1, far: 300 }}
        gl={{
          antialias: false,
          alpha: true,
          stencil: false,
          depth: false,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.domElement?.addEventListener("webglcontextlost", (e) =>
            e.preventDefault(),
          );
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <TunnelScene scrollProgress={scrollProgress} />
      </Canvas>
    </div>
  );
}
