import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * ParticleMaterial: A custom ShaderMaterial for the neural particles.
 * 
 * Phase boundaries are passed as uniforms from Head.tsx (sourced from scrollPhases.ts).
 * No hardcoded scroll thresholds in this file.
 */
const ParticleMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color('#ffffff'),
    uScrollProgress: 0,
    uPixelRatio: 1,
    uMap: null,
    // Phase boundary uniforms (from scrollPhases.ts via Head.tsx)
    uScatterStart: 0.10,
    uScatterEnd: 0.15,
    uImplodeStart: 0.16,
    uImplodeEnd: 0.20,
    uFadeoutAt: 0.17,
  },
  /* glsl vertex shader */ `
    uniform float uTime;
    uniform float uScrollProgress;
    uniform float uPixelRatio;

    // Phase boundary uniforms
    uniform float uScatterStart;
    uniform float uScatterEnd;
    uniform float uImplodeStart;
    uniform float uImplodeEnd;
    uniform float uFadeoutAt;

    attribute vec3 aRandom;
    attribute vec3 aStartPos;
    attribute vec3 aSpreadPos;
    attribute vec3 aEndPos;
    attribute vec3 color;

    varying float vAlpha;
    varying vec3 vColor;
    varying float vP2;

    void main() {
      // --- PHASE 1: SCATTER (Explosion) ---
      float p1 = clamp((uScrollProgress - uScatterStart) / (uScatterEnd - uScatterStart), 0.0, 1.0);

      // --- PHASE 2: SINGULARITY (Implosion) ---
      float p2 = clamp((uScrollProgress - uImplodeStart) / (uImplodeEnd - uImplodeStart), 0.0, 1.0);
      vP2 = p2;

      float smoothP1 = smoothstep(0.0, 1.0, p1);
      
      vec3 pos;
      if (uScrollProgress < uImplodeStart) {
        pos = mix(aStartPos, aSpreadPos, smoothP1);
      } else {
        pos = mix(aSpreadPos, aEndPos, p2);
      }

      // --- NEURAL JITTER ---
      float jitterFreq = 4.0; 
      float jitterAmp = 0.02 * (1.0 - uScrollProgress); 

      vec3 jitterDir = vec3(
          sin(uTime * jitterFreq + aRandom.x * 10.0),
          cos(uTime * jitterFreq + aRandom.y * 10.0),
          sin(uTime * jitterFreq + aRandom.z * 10.0)
      );
      pos += normalize(jitterDir) * jitterAmp; 

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      // --- PARTICLE SIZING ---
      float randomSize = 1.0 + aRandom.x * 2.0; 
      float sizeFactor = mix(8.0, 0.2, p2) * randomSize; 
      
      gl_PointSize = sizeFactor * uPixelRatio;
      gl_PointSize *= (1.0 / -mvPosition.z);

      // --- TWINKLE & FADE ---
      float baseAlpha = 0.8 + 0.2 * sin(uTime * 3.0 + aRandom.y * 10.0);
      float fadeOut = 1.0 - step(uFadeoutAt, uScrollProgress);
      
      vAlpha = baseAlpha * fadeOut;
      vColor = color;
    }
  `,
  /* glsl fragment shader */ `
    uniform vec3 uColor;
    uniform sampler2D uMap;
    varying float vAlpha;
    varying vec3 vColor;
    varying float vP2;

    void main() {
      // --- ROUNDNESS FIX ---
      vec2 uv = gl_PointCoord - vec2(0.5); 
      float dist = length(uv);             
      
      if (dist > 0.5) discard; 

      // --- SOFT FALLOFF ---
      float strength = 1.0 - smoothstep(0.0, 0.5, dist);
      
      vec4 texColor = texture2D(uMap, gl_PointCoord);
      
      // --- DYNAMIC BRIGHTNESS ---
      float brightnessBoost = 4.0 + (vP2 * 6.0);

      vec3 finalColor = vColor * brightnessBoost * strength; 

      gl_FragColor = vec4(finalColor, strength * texColor.a * vAlpha);
    }
  `
)

extend({ ParticleMaterial })

export { ParticleMaterial }