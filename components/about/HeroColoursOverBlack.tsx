"use client";

/**
 * HeroColoursOverBlack — Volumetric Colorful Liquid Cloud & Smoke Background
 * Supports "blue" (Hero) and "purple" (Pillars of Sabrang) palettes.
 * Optimized for silky-smooth 60+ FPS rendering across all devices.
 */

import React, { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const FRAGMENT_SHADER = /* glsl */ `
precision mediump float;

uniform vec2  uResolution;
uniform float uTime;
uniform vec2  uMouse;
uniform float uScrollProgress;
uniform float uIsPurple;

// Pre-computed rotation matrix constant (no trig math inside loop)
const mat2 ROT = mat2(0.87758256, 0.47942554, -0.47942554, 0.87758256);

// Fast 2D Hash & Noise
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

// 3-octave FBM for blazing fast GPU execution
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  vec2 shift = vec2(100.0);
  for (int i = 0; i < 3; ++i) {
    v += a * noise(p);
    p = ROT * p * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);

  // Interactive mouse fluid offset
  vec2 mouseOffset = (uMouse - 0.5) * 0.25;
  uv += mouseOffset * (1.1 - length(uv));

  // Multi-layered fluid domain warping (fast 3-octave FBM)
  vec2 q = vec2(
    fbm(uv * 1.3 + vec2(0.0, uTime * 0.04)),
    fbm(uv * 1.3 + vec2(5.2, uTime * 0.032))
  );

  vec2 r = vec2(
    fbm(uv * 1.5 + 3.0 * q + vec2(1.7, uTime * 0.05 + 9.2)),
    fbm(uv * 1.5 + 3.0 * q + vec2(8.3, uTime * 0.04 + 2.8))
  );

  float f = fbm(uv * 1.3 + 2.8 * r);

  // ── Blue Palette ──────────────────────────────────────────────────────────
  vec3 cDarkVoid_Blue   = vec3(0.010, 0.040, 0.120); // Deep Navy Void
  vec3 cMid_Blue        = vec3(0.030, 0.120, 0.350); // Midnight Blue
  vec3 cDeep_Blue       = vec3(0.060, 0.320, 0.780); // Deep Sapphire
  vec3 cElectric_Blue   = vec3(0.020, 0.580, 1.000); // Electric Blue Ribbon
  vec3 cEdge_Blue       = vec3(0.000, 0.820, 0.980); // Cyan Edge Highlight
  vec3 cAccent_Blue     = vec3(0.080, 0.025, 0.220); // Subtle Violet Depth

  // ── Purple Palette (Sabrang Signature Royal Purple / Neon Orchid) ─────────
  vec3 cDarkVoid_Purple = vec3(0.060, 0.012, 0.140); // Deep Violet Void
  vec3 cMid_Purple      = vec3(0.240, 0.050, 0.480); // Midnight Violet
  vec3 cDeep_Purple     = vec3(0.620, 0.160, 0.920); // Royal Sabrang Purple (#9d4edd)
  vec3 cElectric_Purple = vec3(0.850, 0.320, 1.000); // Electric Neon Orchid Ribbon
  vec3 cEdge_Purple     = vec3(1.000, 0.280, 0.850); // Vivid Magenta Pink Rim
  vec3 cAccent_Purple   = vec3(0.150, 0.420, 0.950); // Sapphire Depth Accent

  // Interpolate palette based on uIsPurple
  vec3 cBlack        = vec3(0.000, 0.000, 0.000);
  vec3 cDarkNavy     = mix(cDarkVoid_Blue, cDarkVoid_Purple, uIsPurple);
  vec3 cMidnightBlue = mix(cMid_Blue, cMid_Purple, uIsPurple);
  vec3 cDeepSapphire = mix(cDeep_Blue, cDeep_Purple, uIsPurple);
  vec3 cElectricBlue = mix(cElectric_Blue, cElectric_Purple, uIsPurple);
  vec3 cCyanGlow     = mix(cEdge_Blue, cEdge_Purple, uIsPurple);
  vec3 cCosmicViolet = mix(cAccent_Blue, cAccent_Purple, uIsPurple);

  // Rich fluid domain dynamics
  float t1 = clamp(q.x * 1.6 + 0.1, 0.0, 1.0);
  float t2 = clamp(r.x * 1.5 + 0.1, 0.0, 1.0);
  float t3 = clamp(q.y * 1.4, 0.0, 1.0);

  // Blend from deep void into base colors
  vec3 col = mix(cDarkNavy, cMidnightBlue, t1);
  col = mix(col, cCosmicViolet, t3 * 0.35);
  col = mix(col, cDeepSapphire, t2 * 0.95);

  // Sharp electric crest highlights along swirling fluid currents
  float crest = smoothstep(0.38, 0.65, sin(f * 4.2 + uTime * 0.18));
  col = mix(col, cElectricBlue, crest * 0.85);

  // Crisp luminous edge rim
  float rim = smoothstep(0.52, 0.70, sin(f * 6.5 + uTime * 0.24));
  col = mix(col, cCyanGlow, rim * 0.45);

  // Enhanced fluid plume visibility & presence over deep black negative space
  float cloudDensity = smoothstep(0.16, 0.70, f);
  cloudDensity = pow(cloudDensity, 1.2) * 1.4;
  vec3 finalColor = mix(cBlack, col, clamp(cloudDensity, 0.0, 1.0));

  // Balanced center fade for sharp typography readability with visible fluid
  float distFromCenter = length(uv * vec2(0.80, 1.30));
  float centerFade = smoothstep(0.15, 0.85, distFromCenter);
  finalColor *= mix(0.60, 1.0, centerFade);

  // Smooth scroll fade out (only if scroll progress is actively tracked)
  if (uScrollProgress > 0.0) {
    float scrollFade = clamp(1.0 - (uScrollProgress - 0.55) / 0.25, 0.0, 1.0);
    finalColor *= scrollFade;
  }

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

function FluidScreenQuad({
  scrollProgress,
  palette = "blue",
}: {
  scrollProgress?: { current: number };
  palette?: "blue" | "purple";
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();

  const mouse = useRef({ x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 });

  useEffect(() => {
    let ticking = false;
    const handleMouseMove = (e: MouseEvent) => {
      if (!ticking) {
        requestAnimationFrame(() => {
          mouse.current.targetX = e.clientX / window.innerWidth;
          mouse.current.targetY = 1.0 - e.clientY / window.innerHeight;
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(Math.max(size.width, 1), Math.max(size.height, 1)) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uScrollProgress: { value: 0 },
      uIsPurple: { value: palette === "purple" ? 1.0 : 0.0 },
    }),
    [],
  );

  useFrame((state, delta) => {
    if (!matRef.current) return;

    const prog = scrollProgress ? scrollProgress.current : 0;
    if (scrollProgress && prog > 0.95) return;

    if (state.size.width > 0 && state.size.height > 0) {
      matRef.current.uniforms.uResolution.value.set(state.size.width, state.size.height);
    }

    mouse.current.x += (mouse.current.targetX - mouse.current.x) * 0.08;
    mouse.current.y += (mouse.current.targetY - mouse.current.y) * 0.08;

    matRef.current.uniforms.uTime.value += Math.min(delta, 0.033);
    matRef.current.uniforms.uMouse.value.set(mouse.current.x, mouse.current.y);
    matRef.current.uniforms.uScrollProgress.value = prog;
    matRef.current.uniforms.uIsPurple.value = palette === "purple" ? 1.0 : 0.0;
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

export interface HeroColoursOverBlackProps {
  scrollProgress?: { current: number };
  palette?: "blue" | "purple";
}

export default function HeroColoursOverBlack({
  scrollProgress,
  palette = "blue",
}: HeroColoursOverBlackProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        background: "#000000",
      }}
    >
      <Canvas
        dpr={1}
        performance={{ min: 0.8 }}
        camera={{ position: [0, 0, 1] }}
        gl={{
          antialias: false,
          alpha: false,
          stencil: false,
          depth: false,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color("#000000"), 1);
          gl.domElement?.addEventListener("webglcontextlost", (e) =>
            e.preventDefault(),
          );
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <FluidScreenQuad scrollProgress={scrollProgress} palette={palette} />
      </Canvas>
    </div>
  );
}
