// The scene-transition rig: owns the previous-scene render target, the
// transition scalar, and the compositor Effect that blends them.
//
// Architecture (spec'd, and the reason this is not an opacity fade):
//
//   film reel scene ──► capture() ──► render target (previous scene texture)
//                                            │
//   live scene ──► EffectComposer ──► FilmCompositorEffect (this pass)
//                                            │
//                          blend + lens distortion + velocity shear
//
// capture() is called from the event handler at the instant a scene change
// begins — the scene graph has not advanced yet, so the target snapshots the
// OUTGOING state. From then on the old and new scenes coexist in the shader,
// the old one departing under `uTransition` while the reel animates the new
// state underneath. Interruptions are free: a fresh capture simply re-snapshots
// whatever is on screen and resets the scalar.
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Effect } from 'postprocessing';
import { damp } from './carouselMath';
import {
  COMPOSITOR_TUNE,
  compositorFragmentShader,
  compositorUniformDefaults,
} from './FilmCompositor';
import { COMPOSITOR_VEL_LAMBDA, MAX_VELOCITY } from './constants';

export interface TransitionHandle {
  capture: () => void;
}

class FilmCompositorEffect extends Effect {
  constructor(prevScene: THREE.Texture) {
    super('FilmCompositor', compositorFragmentShader, {
      uniforms: new Map(
        Object.entries(compositorUniformDefaults()).map(([name, value]) => [
          name,
          new THREE.Uniform<unknown>(name === 'uPrevScene' ? prevScene : value),
        ])
      ),
    });
  }
}

const _db = new THREE.Vector2();

interface FilmTransitionProps {
  sim: { velocity: number };
  handleRef: React.MutableRefObject<TransitionHandle | null>;
  reducedMotion: boolean;
}

export default function FilmTransition({
  sim,
  handleRef,
  reducedMotion,
}: FilmTransitionProps) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  const rig = useMemo(() => {
    // 1x1 black stand-in so uPrevScene is never an unbound sampler — the
    // blend is gated off until the first capture anyway
    const fallback = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
    fallback.needsUpdate = true;
    // HalfFloat to match the composer's working buffers — the capture feeds
    // the same linear-space pass chain the live scene render does
    const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
    return { rt, fallback, effect: new FilmCompositorEffect(fallback) };
  }, []);
  useEffect(
    () => () => {
      rig.rt.dispose();
      rig.effect.dispose();
      rig.fallback.dispose();
    },
    [rig]
  );

  // dev-only tuning surface; tree-shaken to nothing in production builds
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      (window as unknown as Record<string, unknown>).__FSC_TUNE = COMPOSITOR_TUNE;
    }
  }, []);

  const stateRef = useRef({ t: 0, vel: 0 });

  useEffect(() => {
    handleRef.current = {
      capture: () => {
        if (reducedMotion) return; // no cinematic blend to feed
        gl.getDrawingBufferSize(_db);
        if (rig.rt.width !== _db.x || rig.rt.height !== _db.y) {
          rig.rt.setSize(_db.x, _db.y); // lazy resize handles window changes
        }
        const previous = gl.getRenderTarget();
        gl.setRenderTarget(rig.rt);
        // explicit clear: the composer leaves renderer.autoClear off, and a
        // stale depth buffer here would punch holes in the captured strip
        gl.clear();
        gl.render(scene, camera);
        gl.setRenderTarget(previous);
        rig.effect.uniforms.get('uPrevScene')!.value = rig.rt.texture;
        stateRef.current.t = 1;
      },
    };
    return () => {
      handleRef.current = null;
    };
  }, [gl, scene, camera, rig, reducedMotion, handleRef]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const s = stateRef.current;
    s.t = s.t < 0.004 ? 0 : damp(s.t, 0, COMPOSITOR_TUNE.transitionLambda, dt);
    s.vel = damp(
      s.vel,
      THREE.MathUtils.clamp(sim.velocity / MAX_VELOCITY, -1, 1),
      COMPOSITOR_VEL_LAMBDA,
      dt
    );
    const u = rig.effect.uniforms;
    u.get('uTransition')!.value = s.t;
    u.get('uVelocity')!.value = s.vel;
    u.get('uLens')!.value = reducedMotion
      ? 0
      : COMPOSITOR_TUNE.lensBase +
        COMPOSITOR_TUNE.lensVelocity * Math.abs(s.vel) +
        COMPOSITOR_TUNE.lensTransition * s.t;
    u.get('uAspect')!.value = size.width / size.height;
  });

  return <primitive object={rig.effect} />;
}
