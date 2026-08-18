import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * DnaModelMaterial: Shader for the GLTF-based DNA particle effect.
 * 
 * Phase boundaries are passed as uniforms from Dna.tsx (sourced from scrollPhases.ts).
 * No hardcoded scroll thresholds in this file.
 */
const DnaModelMaterial = shaderMaterial(
  {
    time: 0,
    uScrollProgress: 0,
    uWarmColor1: new THREE.Color('#ffffff'),
    uWarmColor2: new THREE.Color('#ffccaa'),
    uWarmColor3: new THREE.Color('#ff8866'),
    uColor1: new THREE.Color('#ffffff'),
    uColor2: new THREE.Color('#ffccaa'),
    uColor3: new THREE.Color('#ff8866'),
    uPixelRatio: 3.0,
    // Phase boundary uniforms (from scrollPhases.ts via Dna.tsx)
    uDnaScatterStart: 0.16,
    uDnaScatterEnd: 0.17,
    uDnaMorphStart: 0.25,
    uDnaMorphEnd: 0.30,
    uDnaFadeinAt: 0.17,
    uDnaFadeoutStart: 0.25,
    uDnaFadeoutEnd: 0.50,
  },
  /* glsl vertex shader */
  `
    uniform float time;
    uniform float uScrollProgress;
    uniform float uPixelRatio;

    // Phase boundary uniforms
    uniform float uDnaScatterStart;
    uniform float uDnaScatterEnd;
    uniform float uDnaMorphStart;
    uniform float uDnaMorphEnd;

    attribute float randoms;
    attribute vec3 aRandomVec;
    attribute float colorRandoms;

    varying vec2 vUv;
    varying vec3 vPosition;
    varying float vColorRandom;
    varying float vMorphProgress;

    void main() {
      vUv = uv;
      vColorRandom = colorRandoms;

      // 1. Singularity Point -> Scatter Sphere
      float scatterP = smoothstep(uDnaScatterStart, uDnaScatterEnd, uScrollProgress);
      
      // 2. Scatter Sphere -> DNA Helix
      float dnaP = smoothstep(uDnaMorphStart, uDnaMorphEnd, uScrollProgress);
      
      vMorphProgress = dnaP;

      // Local Singularity Center (Matches Head's brainYOffset)
      vec3 singularityCenter = vec3(0.0, 3.0, 0.0);
      
      float scatterRadius = 0.05;
      vec3 scatterPos = singularityCenter + aRandomVec * scatterRadius;

      vec3 pos;
      if (uScrollProgress < uDnaMorphStart) {
        pos = mix(singularityCenter, scatterPos, scatterP);
      } else {
        pos = mix(scatterPos, position, dnaP);
      }

      vPosition = pos;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

      float singularitySize = 20.0;
      float scatterSize = 20.0;
      float dnaSize = 20.0 * randoms + 3.0; 
      
      float finalSize;
      if (uScrollProgress < uDnaMorphStart) {
        finalSize = mix(singularitySize, scatterSize, scatterP);
      } else {
        finalSize = mix(scatterSize, dnaSize, dnaP);
      }
      
      gl_PointSize = finalSize * uPixelRatio * (1.0 / -mvPosition.z);

      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  /* glsl fragment shader */
  `
    uniform float time;
    uniform float uScrollProgress;
    uniform vec3 uWarmColor1;
    uniform vec3 uWarmColor2;
    uniform vec3 uWarmColor3;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;

    // Phase boundary uniforms
    uniform float uDnaScatterStart;
    uniform float uDnaScatterEnd;
    uniform float uDnaMorphStart;
    uniform float uDnaMorphEnd;
    uniform float uDnaFadeinAt;
    uniform float uDnaFadeoutStart;
    uniform float uDnaFadeoutEnd;

    varying vec2 vUv;
    varying vec3 vPosition;
    varying float vColorRandom;
    varying float vMorphProgress;

    void main() {
      float alpha = 1.0 - smoothstep(-0.2, 0.5, length(gl_PointCoord - vec2(0.5)));

      vec3 warmColor = uWarmColor1;
      if (vColorRandom > 0.33 && vColorRandom < 0.66) {
        warmColor = uWarmColor2;
      }
      if (vColorRandom > 0.66) {
        warmColor = uWarmColor3;
      }

      vec3 coolColor = uColor1;
      if (vColorRandom > 0.33 && vColorRandom < 0.66) {
        coolColor = uColor2;
      }
      if (vColorRandom > 0.66) {
        coolColor = uColor3;
      }

      vec3 finalColor = mix(warmColor, coolColor, vMorphProgress);

      // Brightness logic
      float scatterP = smoothstep(uDnaScatterEnd, uDnaMorphStart, uScrollProgress);
      float dnaP = smoothstep(uDnaMorphStart, uDnaMorphEnd, uScrollProgress);
      
      float brightness;
      if (uScrollProgress < uDnaMorphStart) {
        brightness = mix(2.5, 1.5, scatterP);
      } else {
        brightness = mix(1.5, 0.4, dnaP);
      }
      finalColor *= brightness;

      float gradient = smoothstep(0.1, 0.9, vUv.y);
      gradient = mix(1.0, gradient, vMorphProgress);

      // Visibility
      float fadeIn = step(uDnaFadeinAt, uScrollProgress);
      float fadeOut = 1.0 - smoothstep(uDnaFadeoutStart, uDnaFadeoutEnd, uScrollProgress);
      float scrollAlpha = fadeIn * fadeOut;

      gl_FragColor = vec4(finalColor, alpha * gradient * scrollAlpha);
    }
  `
)

extend({ DnaModelMaterial })

export { DnaModelMaterial }
