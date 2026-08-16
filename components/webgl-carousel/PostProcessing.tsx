"use client";

import { forwardRef } from "react";
import { useThree } from "@react-three/fiber";
import { MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";

const PostProcessing = forwardRef<any, { thickness?: number }>((props, ref) => {
  const { viewport, size } = useThree();

  if (!size?.width || !size?.height || size.width <= 0 || size.height <= 0) {
    return null;
  }

  const vpW =
    viewport.width && Number.isFinite(viewport.width) && viewport.width > 0
      ? viewport.width
      : 10;
  const vpH =
    viewport.height && Number.isFinite(viewport.height) && viewport.height > 0
      ? viewport.height
      : 10;

  const safeThickness = Number.isFinite(props.thickness) ? Math.max(0, props.thickness || 0) : 0;

  return (
    <mesh position={[0, 0, 1]}>
      <planeGeometry args={[vpW * 2, vpH * 2]} />
      <MeshTransmissionMaterial
        ref={ref}
        transmission={0.7}
        roughness={0}
        thickness={safeThickness}
        chromaticAberration={0.06}
        anisotropy={0}
        ior={0.9}
        resolution={
          typeof window !== "undefined" && window.innerWidth > 0
            ? Math.min(window.innerWidth, 1024)
            : 512
        }
      />
    </mesh>
  );
});

PostProcessing.displayName = "PostProcessing";

export default PostProcessing;
