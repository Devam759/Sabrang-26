import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { beamVert, beamFrag } from './shaders';
import { introState } from './IntroTimeline';

export default function IncomingBeam() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  const uniforms = useMemo(() => ({
    uOpacity: { value: 0 },
    uLength: { value: 0 }
  }), []);

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uOpacity.value = introState.beamOpacity;
      materialRef.current.uniforms.uLength.value = introState.beamLength;
    }
  });

  return (
    <mesh position={[-5.5, 0, 0]} rotation={[0, 0, 0]}>
      <planeGeometry args={[10, 0.5]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={beamVert}
        fragmentShader={beamFrag}
        uniforms={uniforms}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
