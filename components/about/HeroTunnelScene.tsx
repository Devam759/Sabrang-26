'use client';

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

import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

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

  // Perspective-attenuated point size
  float rawSize = aSize * (400.0 / vCamDist);
  gl_PointSize  = clamp(rawSize, 0.5, 64.0);
  gl_Position   = projectionMatrix * mv;
}
`;

// ─── GLSL: Fragment shader ──────────────────────────────────────────────────
//
//  • Circular soft-disc: discard corners of the gl_PointCoord square,
//    use pow() for a tighter, glowing core.
//  • nearFade: smoothstep to fade out particles that are < 1.5 units away
//    from the camera (prevents jarring pop-through artefacts).
//  • uOpacity: global multiplier driven by scroll phase.
const FRAG = /* glsl */ `
precision mediump float;

varying vec3  vColor;
varying float vCamDist;

uniform float uOpacity;

void main() {
  // Radial distance from point-sprite centre
  vec2  uv = gl_PointCoord - 0.5;
  float d  = length(uv);
  if (d > 0.5) discard;

  // Soft glowing disc: brighter centre, smooth edge
  float a = pow(1.0 - d * 2.0, 1.5);

  // Fade particles that are very close to the camera lens
  float nearFade = smoothstep(0.05, 1.5, vCamDist);

  gl_FragColor = vec4(vColor, a * nearFade * uOpacity);
}
`;

// ─── Colour palette ─────────────────────────────────────────────────────────
// Near-white, cyan, indigo, lavender, warm gold — the same atmospheric hues
// used in the Shopify reference to create depth and temperature contrast.
const PALETTE: [number, number, number][] = [
  [0.96, 0.96, 1.00], // white-blue
  [0.32, 0.80, 1.00], // cyan
  [0.55, 0.42, 1.00], // indigo
  [0.78, 0.68, 1.00], // lavender
  [1.00, 0.82, 0.58], // warm gold
];

// ─── Geometry builder ────────────────────────────────────────────────────────
// Returns flat typed arrays ready for THREE.BufferAttribute.
// Three radial zones create the "tunnel wall + core + outer haze" structure.
function buildTunnel(n: number): {
  pos: Float32Array;
  col: Float32Array;
  sz:  Float32Array;
} {
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const sz  = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    // Distribute along the full tunnel length (Z: −40 … +40)
    const z = (Math.random() - 0.5) * 80;

    let x = 0;
    let y = 0;
    const angle = Math.random() * Math.PI * 2;
    const zone  = Math.random();

    if (zone < 0.75) {
      // ── Main tunnel wall: radius 2.8 – 5.5 (clear hollow center for text)
      const r = 2.8 + Math.random() * 2.7;
      x = Math.cos(angle) * r;
      y = Math.sin(angle) * r;
    } else {
      // ── Outer atmospheric haze: radius 5.8 – 10.0
      const r = 5.8 + Math.random() * 4.2;
      x = Math.cos(angle) * r;
      y = Math.sin(angle) * r;
    }

    pos[i * 3    ] = x;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = z;

    // Per-particle colour: random palette entry × controlled brightness
    const p = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    const b = 0.12 + Math.random() * 0.45;
    col[i * 3    ] = p[0] * b;
    col[i * 3 + 1] = p[1] * b;
    col[i * 3 + 2] = p[2] * b;

    // Per-particle size (smaller to prevent heavy overlapping blobs)
    sz[i] = 0.3 + Math.random() * 1.6;
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
  const groupRef   = useRef<THREE.Group>(null);

  // Dynamic particle count based on device hardware budget
  const count = useMemo(() => {
    if (typeof window === 'undefined') return 5000;
    const isMobile = window.innerWidth < 768;
    const cores = navigator.hardwareConcurrency || 4;
    if (isMobile || cores <= 4) return 3000;
    return 7500; // 7.5k particles is smooth 60fps while saving 25% GPU vertex operations
  }, []);

  // Build geometry + material once
  const { geo, mat } = useMemo(() => {
    const { pos, col, sz } = buildTunnel(count);

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aColor',   new THREE.BufferAttribute(col, 3));
    g.setAttribute('aSize',    new THREE.BufferAttribute(sz,  1));

    const m = new THREE.ShaderMaterial({
      uniforms: { uOpacity: { value: 1.0 } },
      vertexShader:   VERT,
      fragmentShader: FRAG,
      transparent:    true,
      blending:       THREE.AdditiveBlending,
      depthWrite:     false,
    });

    return { geo: g, mat: m };
  }, [count]);

  // Dispose GPU resources when component unmounts
  useEffect(() => () => { geo.dispose(); mat.dispose(); }, [geo, mat]);

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
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <Canvas
        dpr={typeof window !== 'undefined' && window.innerWidth < 768 ? 1 : [1, 1.5]}
        performance={{ min: 0.5 }}
        camera={{ position: [0, 0, 18], fov: 60, near: 0.1, far: 300 }}
        gl={{
          antialias: false,
          alpha: true,
          stencil: false,
          depth: false,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl }) => {
          gl.domElement?.addEventListener('webglcontextlost', (e) =>
            e.preventDefault()
          );
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <TunnelScene scrollProgress={scrollProgress} />
      </Canvas>
    </div>
  );
}
