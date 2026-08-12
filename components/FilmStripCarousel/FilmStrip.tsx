import { useCallback, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import FilmFrame, { type FrameHandle } from './FilmFrame';
import { damp, sampleFilmCurve, smoothstep, wrapRelative, type CurveSample } from './carouselMath';
import {
  createFilmGeometry,
  createFilmTextures,
  createShadowTexture,
  setFilmCurveS0,
} from './FilmMaterial';
import {
  ACTIVE_SCALE_BOOST,
  DEPTH_ALPHA,
  DEPTH_FADE_RANGE,
  DIM_MAX,
  DISTORT_LAMBDA,
  EXPAND_DISTANCE,
  EXPAND_FILL,
  EXPAND_LAMBDA,
  FILM_HEIGHT,
  FRAME_HEIGHT,
  FRAME_WIDTH,
  GROUP_ROTATION_X,
  GROUP_ROTATION_Z,
  HOVER_PROMOTE,
  INTRO_DISTORT,
  INTRO_LAMBDA,
  INTRO_SPIN,
  INTRO_Z,
  MAX_VELOCITY,
  NEIGHBOUR_DIM,
  PITCH,
  PROMOTE_DAMPING,
  PROMOTE_LIFT,
  PROMOTE_STIFFNESS,
  SAT_MAX,
  SHADOW_MAX_OPACITY,
  STRIP_RECEDE,
  WRAP_FADE_END,
  WRAP_FADE_START,
} from './constants';
import type { Project } from './types';

export interface ExpandState {
  index: number | null; // expansion target; null = collapsing/idle
  last: number; // frame that owns the current expansion progress
  p: number; // damped 0..1 progress
  fired: boolean; // completion callback already fired
}

interface FilmStripProps {
  projects: Project[];
  sim: { position: number; velocity: number };
  step: (dt: number) => void;
  activeRef: React.MutableRefObject<number>;
  // only `tail` now — the expansion reads the live camera's own fov/position
  // rather than the breakpoint's nominal ones
  bp: { tail: number };
  reducedMotion: boolean;
  expandRef: React.MutableRefObject<ExpandState>;
  introRef: React.MutableRefObject<number>;
  onExpandComplete: (index: number) => void;
  onFrameClick: (index: number) => void;
}

// scratch objects — no per-frame allocation
const _sample: CurveSample = { px: 0, py: 0, pz: 0, tx: 0, ty: 0, tz: 0 };
const _T = new THREE.Vector3();
const _U = new THREE.Vector3();
const _N = new THREE.Vector3();
const _UP = new THREE.Vector3(0, 1, 0);
const _basis = new THREE.Matrix4();
const _targetM = new THREE.Matrix4();
const _localM = new THREE.Matrix4();
const _tPos = new THREE.Vector3();
const _tQuat = new THREE.Quaternion();
const _tScale = new THREE.Vector3();
const _pos = new THREE.Vector3();
const _scale = new THREE.Vector3();
const _qId = new THREE.Quaternion();
const _dir = new THREE.Vector3();

export default function FilmStrip({
  projects,
  sim,
  step,
  activeRef,
  bp,
  reducedMotion,
  expandRef,
  introRef,
  onExpandComplete,
  onFrameClick,
}: FilmStripProps) {
  const count = projects.length;
  const stripRef = useRef<THREE.Group>(null);
  const handles = useRef<(FrameHandle | null)[]>([]);
  const hoverRef = useRef<number | null>(null);
  const promote = useRef(new Float32Array(count)).current;
  const promoteVel = useRef(new Float32Array(count)).current;
  const distortRef = useRef(0);

  const { size } = useThree();
  const aspect = size.width / size.height;
  // How far out frames stay rendered, and therefore where they must have
  // faded to zero — capped at half the set so the wrap seam is never seen.
  const fadeSpan = Math.min(count / 2, bp.tail);

  const assets = useMemo(
    () => ({
      filmTex: createFilmTextures(),
      shadowTex: createShadowTexture(),
      shadowGeo: new THREE.PlaneGeometry(1, 1),
      imageGeo: createFilmGeometry(FRAME_WIDTH, FRAME_HEIGHT),
      borderGeo: createFilmGeometry(PITCH, FILM_HEIGHT),
    }),
    []
  );
  useEffect(
    () => () => {
      assets.filmTex.map.dispose();
      assets.filmTex.bump.dispose();
      assets.shadowTex.dispose();
      assets.shadowGeo.dispose();
      assets.imageGeo.dispose();
      assets.borderGeo.dispose();
    },
    [assets]
  );

  const register = useCallback((index: number, handle: FrameHandle | null) => {
    handles.current[index] = handle;
  }, []);
  const onHover = useCallback((index: number | null) => {
    hoverRef.current = index;
  }, []);

  useFrame((state, rawDt) => {
    step(rawDt);
    const dt = Math.min(rawDt, 0.05);
    const pos = sim.position;

    // Entrance: the strip arrives from depth and unwinds. One damped scalar
    // drives Z, the unwind about the vertical axis and the smear, so they can
    // never desync — and because it is a damp, an interaction during the
    // entrance simply blends in rather than fighting a keyframed timeline.
    const intro = (introRef.current = reducedMotion
      ? 1
      : damp(introRef.current, 1, INTRO_LAMBDA, dt));
    const introK = 1 - intro;

    // expansion progress — a damped scalar is inherently interruptible:
    // flipping the target mid-flight reverses from the current value
    const ex = expandRef.current;
    ex.p = damp(ex.p, ex.index !== null ? 1 : 0, EXPAND_LAMBDA, dt);
    if (ex.index === null && ex.p < 0.001) ex.p = 0;
    // fire at 96%: navigation starts while the last few percent of the zoom
    // finishes, so a click answers in ~0.5s instead of ~1s
    if (ex.index !== null && ex.p > 0.96 && !ex.fired) {
      ex.fired = true;
      onExpandComplete(ex.index);
    }
    if (stripRef.current) {
      stripRef.current.position.z = -STRIP_RECEDE * ex.p - INTRO_Z * introK;
      stripRef.current.rotation.y = INTRO_SPIN * introK;
    }

    // velocity uniform: normalised, eased so distortion decays to zero at rest.
    // The entrance feeds the same channel, so the arrival smears exactly the
    // way a hard flick does — one code path, one look.
    const vNorm = THREE.MathUtils.clamp(sim.velocity / MAX_VELOCITY, -1, 1);
    distortRef.current = reducedMotion ? 0 : damp(distortRef.current, vNorm, DISTORT_LAMBDA, dt);
    const distort = distortRef.current + INTRO_DISTORT * introK;

    for (let i = 0; i < count; i++) {
      const h = handles.current[i];
      if (!h) continue;
      const rel = wrapRelative(i - pos, count);
      // arc length of this frame's centre along the film path
      const s = rel * PITCH;
      const wrapAlpha = 1 - smoothstep(WRAP_FADE_START, WRAP_FADE_END, Math.abs(rel) / fadeSpan);
      const isExpanding = i === ex.last && ex.p > 0.0005;
      const visible = wrapAlpha > 0.002 || isExpanding;
      h.group.visible = visible;
      if (!visible) continue;

      // place the frame on the film path, oriented by the local tangent
      sampleFilmCurve(s, _sample);
      h.group.position.set(_sample.px, _sample.py, _sample.pz);
      _T.set(_sample.tx, _sample.ty, _sample.tz);
      _N.crossVectors(_T, _UP).normalize(); // faces the camera at the apex
      _U.crossVectors(_N, _T);
      _basis.makeBasis(_T, _U, _N);
      h.group.quaternion.setFromRotationMatrix(_basis);

      // the vertex shaders re-derive the exact curve from this arc length
      setFilmCurveS0(h.borderMat, s);
      setFilmCurveS0(h.backMat, s);

      // Promotion: driven by CONTINUOUS distance from centre, not by the
      // rounded active index. `i === active` flips the whole target from 0 to
      // 1 in a single tick, which is a step input the spring answers with a
      // visible jolt on every advance. Deriving it from `rel` instead means
      // promotion glides from one cell to the next as the strip moves, and
      // the spring only ever sees a smooth target.
      //
      // Applied to the image panel only (below) — NOT to `content`, which also
      // holds the film border: scaling that lifts one cell's rails out of line
      // with its neighbours' and puts a visible step in the strip.
      const centreness = 1 - smoothstep(0, 1, Math.abs(rel));
      const pTarget = Math.max(centreness, hoverRef.current === i ? HOVER_PROMOTE : 0);
      if (reducedMotion) {
        promote[i] = pTarget;
        promoteVel[i] = 0;
      } else {
        // Semi-implicit Euler. dt is clamped to 0.05 above, so wn*dt stays
        // around 0.65 — well inside this integrator's stability limit of 2.
        const accel =
          (pTarget - promote[i]) * PROMOTE_STIFFNESS - promoteVel[i] * PROMOTE_DAMPING;
        promoteVel[i] += accel * dt;
        promote[i] += promoteVel[i] * dt;
      }
      const pr = promote[i];
      // clamped copy for the channels that must not exceed their range;
      // `pr` itself keeps the overshoot, which is what makes the pop read
      const pr01 = Math.min(1, Math.max(0, pr));
      h.shadowMat.opacity = SHADOW_MAX_OPACITY * pr01 * (1 - ex.p);

      // atmospheric perspective: the tails run away from the camera for good,
      // so haze is driven by how far back the frame actually sits
      const depth = Math.min(1, Math.max(0, -_sample.pz / DEPTH_FADE_RANGE));
      let dim = 1 - DIM_MAX * smoothstep(0, 1, depth);
      let sat = 1 - SAT_MAX * smoothstep(0.1, 1, depth);
      let alpha = wrapAlpha * (1 - DEPTH_ALPHA * depth);
      // promoted frames climb back to full brightness/saturation — and stop
      // there. Never above: see NEIGHBOUR_DIM's note on why brightening the
      // selection floods it rather than lighting it.
      dim = Math.min(1, dim + (1 - dim) * pr01);
      sat = Math.min(1, sat + (1 - sat) * pr01);
      // The separation comes from everything else giving up contrast instead.
      dim *= 1 - NEIGHBOUR_DIM * (1 - pr01);
      if (isExpanding) {
        dim = dim + (1 - dim) * ex.p;
        sat = sat + (1 - sat) * ex.p;
        alpha = Math.max(alpha, ex.p);
      } else if (ex.p > 0) {
        // the rest of the strip dims and recedes while a frame is expanding
        dim *= 1 - 0.45 * ex.p;
        alpha *= 1 - 0.35 * ex.p;
      }

      const u = h.imageMat.uniforms;
      u.uS0.value = s;
      u.uDim.value = dim;
      u.uSat.value = sat;
      u.uAlpha.value = alpha;
      u.uVelocity.value = distort;
      h.borderMat.opacity = alpha;
      h.backMat.opacity = alpha;

      // cinematic expansion: the image panel detaches from its film cell and
      // lerps to a camera-facing fullscreen pose, flattening as it goes. The
      // target is recomputed in parent-local space every tick, so it stays
      // put even while the strip drifts or recedes behind it.
      const mesh = h.imageMesh;
      if (isExpanding) {
        // Target is pinned to the CAMERA, not to a fixed world point: the
        // cinematic rig is dollying and swaying while this runs, and a static
        // target would slide off-centre by exactly the camera's offset.
        const cam = state.camera as THREE.PerspectiveCamera;
        const halfH = Math.tan((cam.fov * Math.PI) / 360) * EXPAND_DISTANCE;
        const sc = Math.min(
          (2 * halfH * EXPAND_FILL) / FRAME_HEIGHT,
          (2 * halfH * aspect * EXPAND_FILL) / FRAME_WIDTH
        );
        cam.getWorldDirection(_dir);
        _targetM.compose(
          _pos.copy(cam.position).addScaledVector(_dir, EXPAND_DISTANCE),
          cam.quaternion,
          _scale.set(sc, sc, sc)
        );
        h.content.updateWorldMatrix(true, false);
        _localM.copy(h.content.matrixWorld).invert().multiply(_targetM);
        _localM.decompose(_tPos, _tQuat, _tScale);
        mesh.position.set(0, 0, -0.008).lerp(_tPos, ex.p);
        mesh.quaternion.copy(_qId).slerp(_tQuat, ex.p);
        mesh.scale.set(1, 1, 1).lerp(_tScale, ex.p);
        mesh.renderOrder = 5;
        u.uFlatten.value = ex.p;
      } else {
        mesh.position.set(0, 0, -0.008 + PROMOTE_LIFT * pr);
        mesh.quaternion.identity();
        mesh.scale.setScalar(1 + ACTIVE_SCALE_BOOST * pr);
        mesh.renderOrder = 0;
        u.uFlatten.value = 0;
      }
    }
  });

  const shared = useMemo(
    () => ({
      imageGeo: assets.imageGeo,
      borderGeo: assets.borderGeo,
      shadowGeo: assets.shadowGeo,
      filmTex: assets.filmTex,
      shadowTex: assets.shadowTex,
    }),
    [assets]
  );

  return (
    // The Z-roll that makes the strip read as thrown film, plus a slight
    // X tilt. Applied to the whole strip so every frame shares the diagonal.
    <group ref={stripRef} rotation={[GROUP_ROTATION_X, 0, GROUP_ROTATION_Z]}>
      {projects.map((p, i) => (
        <FilmFrame
          key={p.id}
          project={p}
          index={i}
          shared={shared}
          register={register}
          onFrameClick={onFrameClick}
          onHover={onHover}
        />
      ))}
    </group>
  );
}
