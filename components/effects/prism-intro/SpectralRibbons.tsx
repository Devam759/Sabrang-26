import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ribbonVert, ribbonFrag } from './shaders';
import { introState } from './IntroTimeline';

const SPECTRAL_COLORS = [
  '#7C3AED', // Violet
  '#2563EB', // Blue
  '#06B6D4', // Cyan
  '#22C55E', // Green
  '#FACC15', // Yellow
  '#F97316', // Orange
  '#EF4444', // Red
];

export default function SpectralRibbons() {
  const groupRef = useRef<THREE.Group>(null);
  
  const ribbons = useMemo(() => {
    return SPECTRAL_COLORS.map((hex, index) => {
      const color = new THREE.Color(hex);
      const uniforms = {
        uTime: { value: 0 },
        uSpread: { value: 0 },
        uColor: { value: color },
        uOpacity: { value: 0 },
        uLength: { value: 1 },
        uSaturation: { value: 0 }
      };
      
      // offset ranges from -3 (Violet) to 3 (Red)
      const offset = index - 3; 
      
      return { color, uniforms, offset, index };
    });
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as THREE.ShaderMaterial;
        if (mat.uniforms) {
          mat.uniforms.uTime.value = state.clock.elapsedTime;
          mat.uniforms.uSpread.value = introState.spectrumSpread;
          mat.uniforms.uOpacity.value = introState.ribbonOpacities[i];
          mat.uniforms.uLength.value = introState.spectrumLength;
          mat.uniforms.uSaturation.value = introState.ribbonSaturation;
        }
      });
    }
  });

  return (
    <group ref={groupRef} position={[0.5, 0, 0]}>
      {ribbons.map((ribbon, i) => (
        <mesh key={i} position={[5, 0, 0]} rotation={[0, 0, 0]}>
          <planeGeometry args={[10, 0.08, 32, 1]}>
            <bufferAttribute
              attach="attributes-ribbonOffset"
              count={33 * 2} // (segments + 1) * 2
              array={new Float32Array(33 * 2).fill(ribbon.offset)}
              itemSize={1}
            />
          </planeGeometry>
          <shaderMaterial
            vertexShader={ribbonVert}
            fragmentShader={ribbonFrag}
            uniforms={ribbon.uniforms}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}
