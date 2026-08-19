import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import helvetiker_bold from '../../../public/fonts/helvetiker_bold.typeface.json';
import { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { introState } from './IntroTimeline';

const SPECTRAL_COLORS = [
  0x8A2BE2, // Violet
  0x0000FF, // Blue
  0x00FFFF, // Cyan
  0x00FF00, // Green
  0xFFFF00, // Yellow
  0xFF7F00, // Orange
  0xFF0000, // Red
];

export default function SpectralTypography() {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const font = useMemo(() => new Font(helvetiker_bold), []);

  const { positions, startPositions, colors, randoms } = useMemo(() => {
    // Generate base text geometry
    const geometry = new TextGeometry("SABRANG   26", {
      font,
      size: 0.7,
      depth: 0.05,
      curveSegments: 8,
      bevelEnabled: true,  
      bevelThickness: 0.02,
      bevelSize: 0.01,
      bevelSegments: 2
    });
    
    geometry.computeBoundingBox();
    const centerOffset = -0.5 * (geometry.boundingBox!.max.x - geometry.boundingBox!.min.x);
    geometry.translate(centerOffset, -0.35, 0); // Center vertically as well
    geometry.computeBoundingBox(); // Recompute after translate
    const minX = geometry.boundingBox!.min.x;
    const maxX = geometry.boundingBox!.max.x;

    // Create a temporary mesh and use MeshSurfaceSampler for uniform particle distribution
    const tempMesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
    const sampler = new MeshSurfaceSampler(tempMesh).build();

    // Explicitly define a massive, uniform particle count
    // Optimized to 12000 to prevent synchronous JS blocking while maintaining ultra-dense clarity
    const vertexCount = 12000;
    
    const positions = new Float32Array(vertexCount * 3);
    const startPositions = new Float32Array(vertexCount * 3);
    const colors = new Float32Array(vertexCount * 3);
    const randoms = new Float32Array(vertexCount * 3);

    const tempColor = new THREE.Color();
    const samplePosition = new THREE.Vector3();

    for (let i = 0; i < vertexCount; i++) {
      sampler.sample(samplePosition);
      const x = samplePosition.x;
      const y = samplePosition.y;
      const z = samplePosition.z;

      // Target position rotated 90 degrees around Y axis
      // Push +4.0 on X axis so it is physically in front of the origin
      positions[i * 3] = z + 4.0;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = -x;

      // Assign to one of the 7 spectral ribbons based on translated X coordinate
      const normalizedX = (x - minX) / (maxX - minX);
      let colorIndex = Math.floor(normalizedX * 7);
      if (colorIndex > 6) colorIndex = 6;
      if (colorIndex < 0) colorIndex = 0;

      tempColor.set(SPECTRAL_COLORS[colorIndex]);
      colors[i * 3] = tempColor.r;
      colors[i * 3 + 1] = tempColor.g;
      colors[i * 3 + 2] = tempColor.b;

      // Starting position on the corresponding ribbon
      const ribbonOffset = colorIndex - 3;
      const startX = 5 + Math.random() * 10; // 5 to 15
      const startY = ribbonOffset * 0.4 * 1.0 * startX; 
      const startZ = (Math.random() - 0.5) * 0.5;

      startPositions[i * 3] = startX;
      startPositions[i * 3 + 1] = startY;
      startPositions[i * 3 + 2] = startZ;
      
      // Random direction for dispersion (concentrated)
      // We keep magnitude relatively small so it remains a cloud around the silhouette
      randoms[i * 3] = (Math.random() - 0.5) * 4.0;
      randoms[i * 3 + 1] = (Math.random() - 0.5) * 4.0 + 1.0; // slight upward drift bias
      randoms[i * 3 + 2] = (Math.random() - 0.5) * 4.0;
    }

    return { positions, startPositions, colors, randoms };
  }, [font]);

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uProgress.value = introState.lightToTextProgress;
      materialRef.current.uniforms.uOpacity.value = introState.typographyOpacity;
      materialRef.current.uniforms.uDisperse.value = introState.typographyDisperseProgress;
      materialRef.current.uniforms.uWhiteMerge.value = introState.typographyWhiteMerge;
    }
  });

  const vertexShader = `
    uniform float uProgress;
    uniform float uDisperse;
    attribute vec3 startPosition;
    attribute vec3 color;
    attribute vec3 aRandom;
    varying vec3 vColor;
    
    // Perlin noise function for organic dispersion movement
    // A simplified pseudo-random function
    float rand(vec2 co){
        return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
    }
    
    void main() {
      vColor = color;
      
      // Interpolate from Ribbons to Typography
      vec3 current = mix(startPosition, position, uProgress);
      
      // Add arc during initial travel
      float arc = sin(uProgress * 3.14159) * 2.0;
      current.y += arc * (sin(startPosition.x) * 0.5);
      
      // Disintegration Phase
      if (uDisperse > 0.0) {
        // Expand outward organically
        // Smoothstep makes it feel more like a physical energy release
        float easeDisperse = smoothstep(0.0, 1.0, uDisperse);
        current += aRandom * easeDisperse;
      }
      
      vec4 mvPosition = modelViewMatrix * vec4(current, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Size depends on depth, but we also slightly shrink them as they disperse to feel like fading energy
      gl_PointSize = (12.0 / -mvPosition.z) * (1.0 - (uDisperse * 0.5));
    }
  `;

  const fragmentShader = `
    uniform float uOpacity;
    uniform float uWhiteMerge;
    varying vec3 vColor;
    
    void main() {
      // Soft circular point
      float dist = length(gl_PointCoord - vec2(0.5));
      if (dist > 0.5) discard;
      
      // Sharper point edge for better text clarity
      float alpha = smoothstep(0.5, 0.2, dist) * uOpacity;
      
      // Multiply base color by 2.0 to make it hyper-vibrant and luminous
      vec3 vibrantColor = vColor * 2.5;
      
      // Transition color to pure luminous white
      vec3 finalColor = mix(vibrantColor, vec3(2.0), uWhiteMerge);
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `;

  return (
    <points ref={pointsRef} position={[0, 0, 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-startPosition" count={startPositions.length / 3} array={startPositions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-aRandom" count={randoms.length / 3} array={randoms} itemSize={3} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uProgress: { value: 0 },
          uOpacity: { value: 0 },
          uDisperse: { value: 0 },
          uWhiteMerge: { value: 0 }
        }}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
