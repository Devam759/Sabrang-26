'use client';

/**
 * HeroColoursOverBlack — Volumetric Colorful Liquid Cloud & Smoke Background
 *
 * Art Direction:
 *   - Swirling, volumetric Sabrang liquid cloud & smoke streams bleeding through deep black.
 *   - Synchronized with Sabrang Home Palette:
 *       • #9d4edd (Sabrang Signature Purple)
 *       • #1f003f (Deep Violet)
 *       • #00ffff (Panache Cyan)
 *       • #ff00ff (Bandjam Magenta)
 *       • #ffff00 (Step-Up Yellow)
 *       • #ff0a54 (Glitch Hot Pink)
 *       • #2563eb (Sapphire Blue)
 *   - Pure pitch black negative space framing white SABRANG typography.
 *   - High performance 1-quad WebGL renderer with fluid mouse interaction.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const FRAGMENT_SHADER = /* glsl */ `
precision highp float;

uniform vec2  uResolution;
uniform float uTime;
uniform vec2  uMouse;
uniform float uScrollProgress;

// Fast 2D Noise & Domain Warped FBM
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  vec2 shift = vec2(100.0);
  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
  for (int i = 0; i < 5; ++i) {
    v += a * noise(p);
    p = rot * p * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);

  // Interactive mouse fluid offset
  vec2 mouseOffset = (uMouse - 0.5) * 0.28;
  uv += mouseOffset * (1.2 - length(uv));

  // Multi-layered fluid domain warping (creates swirling colorful smoke & cloud volumes)
  vec2 q = vec2(0.0);
  q.x = fbm(uv * 1.3 + vec2(0.0, uTime * 0.04));
  q.y = fbm(uv * 1.3 + vec2(5.2, uTime * 0.032));

  vec2 r = vec2(0.0);
  r.x = fbm(uv * 1.6 + 3.2 * q + vec2(1.7, uTime * 0.05 + 9.2));
  r.y = fbm(uv * 1.6 + 3.2 * q + vec2(8.3, uTime * 0.04 + 2.8));

  float f = fbm(uv * 1.4 + 3.0 * r);

  // ── Home Page Synced Sabrang Palette ──────────────────────────────────────
  vec3 cSabrangPurple = vec3(0.616, 0.306, 0.867); // #9d4edd (Signature Purple)
  vec3 cDeepViolet    = vec3(0.122, 0.000, 0.247); // #1f003f (Deep Cosmic Dark)
  vec3 cCyan          = vec3(0.000, 1.000, 1.000); // #00ffff (Panache Cyan)
  vec3 cMagenta       = vec3(1.000, 0.000, 1.000); // #ff00ff (Bandjam Magenta)
  vec3 cYellow        = vec3(1.000, 1.000, 0.000); // #ffff00 (Step-Up Yellow)
  vec3 cHotPink       = vec3(1.000, 0.039, 0.329); // #ff0a54 (Glitch Hot Pink)
  vec3 cSapphire      = vec3(0.145, 0.388, 0.922); // #2563eb (Sapphire Blue)

  // Rich multi-color blending across cloud swirls matching Home Page identity
  float t1 = clamp(q.x * 1.5, 0.0, 1.0);
  float t2 = clamp(r.x * 1.4, 0.0, 1.0);
  float t3 = clamp(q.y * 1.3, 0.0, 1.0);
  float t4 = clamp(r.y * 1.2, 0.0, 1.0);

  vec3 col = mix(cDeepViolet, cSabrangPurple, t1);
  col = mix(col, cCyan, t2);
  col = mix(col, cMagenta, t3);
  col = mix(col, cHotPink, t4);
  col = mix(col, cSapphire, sin(f * 3.14 + uTime * 0.15) * 0.5 + 0.5);

  // Electric yellow highlights along turbulent cloud edges
  float yellowAccent = smoothstep(0.44, 0.58, sin(f * 5.2 + uTime * 0.22));
  col = mix(col, cYellow, yellowAccent * 0.35);

  // Volumetric cloud density & softness
  float cloudVolume = pow(f, 1.35) * 2.0;
  vec3 finalColor = col * cloudVolume;

  // Asymmetric Editorial Framing:
  // Controlled dark space behind central SABRANG text
  float distFromCenter = length(uv * vec2(0.82, 1.38));
  float centerCleanMask = smoothstep(0.28, 0.95, distFromCenter);

  // Frame the text while letting surrounding colorful clouds swell around it
  finalColor *= mix(0.10, 1.0, centerCleanMask);

  // Smooth scroll fade out
  float scrollFade = clamp(1.0 - (uScrollProgress - 0.55) / 0.25, 0.0, 1.0);
  finalColor *= scrollFade;

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

const VERTEX_SHADER = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

function FluidScreenQuad({ scrollProgress }: { scrollProgress: { current: number } }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef  = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();

  const mouse = useRef({ x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.targetX = e.clientX / window.innerWidth;
      mouse.current.targetY = 1.0 - (e.clientY / window.innerHeight);
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime:           { value: 0 },
      uResolution:     { value: new THREE.Vector2(size.width, size.height) },
      uMouse:          { value: new THREE.Vector2(0.5, 0.5) },
      uScrollProgress: { value: 0 },
    }),
    [size.width, size.height]
  );

  useEffect(() => {
    if (matRef.current) {
      matRef.current.uniforms.uResolution.value.set(size.width, size.height);
    }
  }, [size.width, size.height]);

  useFrame((_, delta) => {
    if (!matRef.current) return;

    mouse.current.x += (mouse.current.targetX - mouse.current.x) * 0.05;
    mouse.current.y += (mouse.current.targetY - mouse.current.y) * 0.05;

    matRef.current.uniforms.uTime.value += delta;
    matRef.current.uniforms.uMouse.value.set(mouse.current.x, mouse.current.y);
    matRef.current.uniforms.uScrollProgress.value = scrollProgress.current;
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

export default function HeroColoursOverBlack({
  scrollProgress,
}: {
  scrollProgress: { current: number };
}) {
  return (
    <div
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: '#000000' }}
    >
      <Canvas
        dpr={typeof window !== 'undefined' && window.innerWidth < 768 ? [1, 1] : [1, 1.5]}
        performance={{ min: 0.8 }}
        camera={{ position: [0, 0, 1] }}
        gl={{
          antialias: false,
          alpha: false,
          stencil: false,
          depth: false,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color('#000000'), 1);
          gl.domElement?.addEventListener('webglcontextlost', (e) => e.preventDefault());
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <FluidScreenQuad scrollProgress={scrollProgress} />
      </Canvas>
    </div>
  );
}
