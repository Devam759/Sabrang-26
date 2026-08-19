import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { introState } from './IntroTimeline';

export default function CameraRig() {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const rigRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (cameraRef.current) {
      // Orbital calculation
      const angle = introState.cameraOrbitY;
      const dist = introState.cameraDistance;
      
      const x = Math.sin(angle) * dist;
      const z = Math.cos(angle) * dist;
      
      cameraRef.current.position.set(x, introState.cameraY, z);
      cameraRef.current.lookAt(0, 0, 0); // Always stay locked on the prism
    }
  });

  return (
    <group ref={rigRef} position={[0, 0, 0]}>
      <PerspectiveCamera 
        ref={cameraRef}
        makeDefault 
        fov={45} 
      />
    </group>
  );
}
