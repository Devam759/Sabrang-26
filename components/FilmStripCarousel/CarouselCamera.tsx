import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { PerspectiveCamera } from 'three';
import { damp } from './carouselMath';
import {
  CAM_DRIFT,
  CAM_EXPAND_PUSH,
  CAM_LAMBDA,
  CAM_POINTER_X,
  CAM_POINTER_Y,
  CAM_ROLL,
  CAM_VELOCITY_LAG,
  MAX_VELOCITY,
} from './constants';

interface CarouselCameraProps {
  z: number;
  fov: number;
  sim: { position: number; velocity: number };
  expandRef: React.MutableRefObject<{ p: number }>;
  reducedMotion: boolean;
}

/**
 * Responsive camera controller — updates in place on breakpoint change, never
 * remounts the canvas — plus the cinematic rig on top.
 *
 * The rig is an operator, not an effect: it sways with the cursor, trails a
 * fast scroll (so the strip momentarily leads the frame the way a real pan
 * lags its subject), dollies in while a frame expands, and breathes when
 * nothing is happening. Every channel is exponentially damped, so no input
 * can produce a step in camera motion.
 *
 * Amplitudes are deliberately at the edge of perceptible. Anything larger and
 * the strip reads as swimming inside the viewport rather than the viewport
 * reading as a window onto the strip.
 */
export default function CarouselCamera({
  z,
  fov,
  sim,
  expandRef,
  reducedMotion,
}: CarouselCameraProps) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const vel = useRef(0);
  const roll = useRef(0);
  const look = useRef(new THREE.Vector3());

  useEffect(() => {
    camera.position.set(0, 0, z);
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }, [camera, z, fov]);

  useFrame((state, rawDt) => {
    if (reducedMotion) return;
    const dt = Math.min(rawDt, 0.05);
    const t = state.clock.elapsedTime;
    const p = expandRef.current.p;

    vel.current = damp(
      vel.current,
      THREE.MathUtils.clamp(sim.velocity / MAX_VELOCITY, -1, 1),
      CAM_LAMBDA,
      dt
    );

    // Pointer sway falls off as a frame expands — during the push-in the
    // camera commits to the frame instead of continuing to wander.
    const settle = 1 - p;
    const px = state.pointer.x;
    const py = state.pointer.y;
    const tx =
      (px * CAM_POINTER_X - vel.current * CAM_VELOCITY_LAG * 0.1) * settle +
      Math.sin(t * 0.13) * CAM_DRIFT;
    const ty = py * CAM_POINTER_Y * settle + Math.cos(t * 0.17) * CAM_DRIFT * 0.7;
    const tz = z - CAM_EXPAND_PUSH * p;

    camera.position.x = damp(camera.position.x, tx, CAM_LAMBDA, dt);
    camera.position.y = damp(camera.position.y, ty, CAM_LAMBDA, dt);
    camera.position.z = damp(camera.position.z, tz, CAM_LAMBDA, dt);

    // Aim slightly back toward centre so the sway becomes a small yaw rather
    // than a pure truck — that yaw is what makes the strip's depth readable.
    look.current.set(
      camera.position.x * 0.35,
      camera.position.y * 0.35,
      0
    );
    camera.lookAt(look.current);
    // Roll after lookAt (which overwrites the quaternion), in camera-local
    // space, so a fast scroll banks the frame very slightly into the turn.
    roll.current = damp(
      roll.current,
      -(px * 0.4 + vel.current * 0.6) * CAM_ROLL * settle,
      CAM_LAMBDA,
      dt
    );
    camera.rotateZ(roll.current);
  });

  return null;
}
