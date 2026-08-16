// The world the strip lives in — one backdrop plane, four depth layers.
//
// Why a single shader rather than stacked meshes: every layer here is a soft
// light mass with no silhouette, so parallaxing them is just an offset applied
// to a sample coordinate. Real geometry per layer would cost four draw calls
// and a depth sort to render the same pixels. The layers are still genuinely
// independent — each has its own parallax factor — they just share a program.
//
// The reel writes into this: `uGlow` and `uVel` come from the carousel
// simulation, so the light behind the film brightens and smears when the film
// moves. That coupling is the difference between "3D object on a gradient" and
// "object inside an environment".
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { damp } from './carouselMath';
import { createEnvironmentMaterial } from './EnvironmentMaterial';
import { ENV_GLOW_LAMBDA, ENV_OVERSCAN, ENV_PLANE_Z, MAX_VELOCITY } from './constants';

interface EnvironmentProps {
  sim: { position: number; velocity: number };
  expandRef: React.MutableRefObject<{ p: number }>;
  introRef: React.MutableRefObject<number>;
  cameraZ: number; // nominal, not live — see the scale memo
  fov: number;
}

export default function Environment({
  sim,
  expandRef,
  introRef,
  cameraZ,
  fov,
}: EnvironmentProps) {
  const { size } = useThree();

  const material = useMemo(() => createEnvironmentMaterial(), []);

  useEffect(() => () => material.dispose(), [material]);

  // Sized to the frustum at the backdrop depth, oversized by ENV_OVERSCAN so
  // the camera's sway, roll and yaw can never pull an edge into shot.
  //
  // Deliberately derived from the breakpoint's NOMINAL camera pose, not the
  // live one: this only recomputes on resize, and the live camera is almost
  // certainly mid-sway at that moment, which would make the backdrop resize by
  // a hair every time the window changes. filmCurve.check.ts asserts the
  // overscan actually covers the rig's worst-case excursion.
  const scale = useMemo(() => {
    const w = size.width || 1;
    const h = size.height || 1;
    const aspect = h > 0 ? w / h : 1;
    const heightCalc = 2 * Math.tan((fov * Math.PI) / 360) * (cameraZ - ENV_PLANE_Z) * ENV_OVERSCAN;
    const validH = isFinite(heightCalc) && heightCalc > 0 ? heightCalc : 10;
    return [validH * aspect, validH, 1] as [number, number, number];
  }, [cameraZ, fov, size]);

  const smooth = useRef({ vel: 0, glow: 0, px: 0, py: 0 });

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const s = smooth.current;
    const u = material.uniforms;

    const vNorm = THREE.MathUtils.clamp(sim.velocity / MAX_VELOCITY, -1, 1);
    s.vel = damp(s.vel, vNorm, ENV_GLOW_LAMBDA, dt);
    s.glow = damp(s.glow, Math.abs(vNorm), ENV_GLOW_LAMBDA, dt);
    s.px = damp(s.px, state.pointer.x || 0, 1.8, dt);
    s.py = damp(s.py, state.pointer.y || 0, 1.8, dt);

    u.uTime.value = state.clock.elapsedTime;
    (u.uPointer.value as THREE.Vector2).set(-s.px, s.py);
    u.uVel.value = s.vel;
    u.uGlow.value = s.glow;
    u.uExpand.value = expandRef.current.p || 0;
    u.uIntro.value = introRef.current || 0;
    const aspect = size.height > 0 ? size.width / size.height : 1;
    u.uAspect.value = isFinite(aspect) && aspect > 0 ? aspect : 1;
  });

  return (
    <mesh
      material={material}
      position={[0, 0, ENV_PLANE_Z]}
      scale={scale}
      renderOrder={-1}
      frustumCulled={false}
    >
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}
