import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, ToneMapping } from '@react-three/postprocessing';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';

import IncomingBeam from './IncomingBeam';
import OpticalPrism from './OpticalPrism';
import SpectralRibbons from './SpectralRibbons';
import SpectralTypography from './SpectralTypography';
import CameraRig from './CameraRig';
import { getQualityTier } from './quality';

export default function PrismScene() {
  const tier = getQualityTier();

  return (
    <Canvas
      gl={{ 
        antialias: tier === 'ULTRA',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2, 
        powerPreference: 'high-performance'
      }}
      dpr={tier === 'MOBILE' ? 1 : [1, 2]}
    >
      <color attach="background" args={['#010101']} />
      <fogExp2 attach="fog" color="#010101" density={0.015} />

      <CameraRig />

      <Suspense fallback={null}>
        {/* Subtle environment map exclusively for the glass to reflect */}
        <Environment preset="city" environmentIntensity={0.2} />
        
        <IncomingBeam />
        <OpticalPrism />
        <SpectralRibbons />
        <SpectralTypography />

        {tier !== 'MOBILE' && (
          <EffectComposer multisampling={tier === 'ULTRA' ? 4 : 0} disableNormalPass>
            <Bloom 
              luminanceThreshold={0.9} 
              luminanceSmoothing={0.1} 
              intensity={0.2} 
              mipmapBlur 
            />
            <ToneMapping mode={THREE.ACESFilmicToneMapping} />
          </EffectComposer>
        )}
      </Suspense>
    </Canvas>
  );
}
