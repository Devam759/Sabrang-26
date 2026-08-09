'use client';

import { forwardRef } from 'react';
import { useThree } from '@react-three/fiber';
import { MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';

const PostProcessing = forwardRef<any, { thickness?: number }>(
  (props, ref) => {
    const { viewport } = useThree();

    return (
      <mesh position={[0, 0, 1]}>
        <planeGeometry args={[viewport.width * 2, viewport.height * 2]} />
        <MeshTransmissionMaterial
          ref={ref}
          transmission={0.7}
          roughness={0}
          thickness={props.thickness || 0}
          chromaticAberration={0.06}
          anisotropy={0}
          ior={0.9}
        />
      </mesh>
    );
  }
);

PostProcessing.displayName = 'PostProcessing';

export default PostProcessing;
