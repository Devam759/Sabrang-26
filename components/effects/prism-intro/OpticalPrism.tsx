import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { introState } from './IntroTimeline';
import { getQualityTier, getTransmissionSettings } from './quality';

export default function OpticalPrism() {
  const meshRef = useRef<THREE.Mesh>(null);
  const rimLightRef = useRef<THREE.SpotLight>(null);
  
  const tier = getQualityTier();
  const settings = getTransmissionSettings(tier);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(introState.prismScale);
      const material = meshRef.current.material as any;
      if (material) {
        material.emissiveIntensity = introState.prismInternalGlow * 0.15;
      }
    }
    
    if (rimLightRef.current) {
      rimLightRef.current.intensity = introState.prismRimIntensity * 3.0;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Subtle rim light coming from top-back-left to define silhouette before beam arrives */}
      <spotLight 
        ref={rimLightRef} 
        position={[-3, 5, -5]} 
        color="#ffffff" 
        distance={15} 
        angle={0.5} 
        penumbra={1} 
        decay={2} 
        intensity={0}
      />
      
      <mesh 
        ref={meshRef}
        // Rotate X by 90deg to point triangle at the camera
        // The triangle points UP, flat base on the bottom
        rotation={[Math.PI / 2, 0, 0]} 
      >
        <cylinderGeometry args={[1.2, 1.2, 1.0, 3]} />
        <MeshTransmissionMaterial
          buffer={undefined}
          transmission={1.0} // Fully transmissive glass
          thickness={1.5}    // Thicker glass for more dramatic refraction
          roughness={0.0}    // Perfectly polished
          ior={1.5}          // True glass Index of Refraction
          chromaticAberration={0.06} // Higher chromatic splitting on edges
          anisotropy={0.3}
          distortion={0.1}
          distortionScale={0.2}
          temporalDistortion={0.0}
          resolution={settings.resolution}
          samples={settings.samples}
          color="#ffffff" // Clear glass, doesn't tint the transmission
          attenuationColor="#ffffff"
          attenuationDistance={2.0}
          emissive="#ffffff"
          emissiveIntensity={0}
          clearcoat={1.0}
          clearcoatRoughness={0.0}
        />
      </mesh>
    </group>
  );
}
