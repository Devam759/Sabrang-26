// The scene compositor's GLSL and tunables — pure strings and plain objects,
// split from FilmTransition.tsx for the same reason FilmMaterial.ts is split
// from FilmFrame.tsx: a .tsx importing R3F cannot be loaded by
// filmCurve.check.ts, and a shader nothing validates is a shader that ships
// broken (§14 validates this one).
//
// One fragment, two jobs that have to share a pass:
//   mainUv    — barrel lens distortion of everything downstream
//   mainImage — blends the PREVIOUS reel scene (captured to a render target
//               the instant a scene change begins) over the live one, so the
//               old and new states genuinely coexist during a transition
//               instead of one merely fading into the other.
//
// postprocessing's EffectPass owns main(); an effect fragment must define
// only these entry points. mainUv rewrites the UV every later effect in the
// merged pass samples with, which is what makes the distortion apply to the
// whole composited image rather than to one layer.
import {
  LENS_BASE,
  LENS_TRANSITION,
  LENS_VELOCITY,
  TRANSITION_DISPLACE,
  TRANSITION_LAMBDA,
  TRANSITION_SEP,
  TRANSITION_ZOOM,
} from './constants';

// Live-tunable in dev — FilmTransition exposes this object as
// window.__FSC_TUNE, so lens/transition feel can be dialled from the console
// while the reel runs. In production nothing references the window global and
// these are effectively the constants above.
export const COMPOSITOR_TUNE = {
  lensBase: LENS_BASE,
  lensVelocity: LENS_VELOCITY,
  lensTransition: LENS_TRANSITION,
  transitionLambda: TRANSITION_LAMBDA,
};

// Uniform contract, single source of truth: the Effect builds its uniform map
// from these entries, and §14 asserts the GLSL declares exactly this set.
export const compositorUniformDefaults = (): Record<string, number | null> => ({
  uPrevScene: null,
  uTransition: 0,
  uVelocity: 0,
  uLens: 0,
  uAspect: 1,
});

export const compositorFragmentShader = /* glsl */ `
uniform sampler2D uPrevScene;
uniform float uTransition; // 1 at capture, damped toward 0
uniform float uVelocity;   // signed reel velocity, normalised and eased
uniform float uLens;       // total barrel strength this frame
uniform float uAspect;

void mainUv(inout vec2 uv) {
  vec2 c = uv - 0.5;
  vec2 a = vec2(c.x * uAspect, c.y);
  float r2 = dot(a, a);
  // Normalised so the CORNER maps exactly to itself: the interior bulges, the
  // edges never sample outside 0..1, so no clamp streaks at any strength.
  float rMax2 = 0.25 * (uAspect * uAspect + 1.0);
  uv = 0.5 + c * (1.0 + uLens * r2) / (1.0 + uLens * rMax2);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  float t = uTransition;
  if (t < 0.004) { outputColor = inputColor; return; }
  float leave = 1.0 - t;
  vec2 c = uv - 0.5;
  // The departing scene inflates past the lens (divide: it grows, so every
  // sample stays inside the texture) and shears with the reel's direction of
  // travel. At the capture instant (t = 1) it samples exactly where the live
  // scene is, so the handoff is seamless by construction.
  vec2 pUv = 0.5
    + c / (1.0 + ${TRANSITION_ZOOM.toFixed(3)} * leave)
    + vec2(uVelocity * ${TRANSITION_DISPLACE.toFixed(3)} * leave, 0.0);
  float sep = ${TRANSITION_SEP.toFixed(4)} * leave;
  vec3 prev = vec3(
    texture2D(uPrevScene, pUv + vec2(sep, 0.0)).r,
    texture2D(uPrevScene, pUv).g,
    texture2D(uPrevScene, pUv - vec2(sep, 0.0)).b
  );
  // smoothstep in t, written as the polynomial: full prev at capture, eased
  // handoff to the live scene as it departs
  float w = t * t * (3.0 - 2.0 * t);
  outputColor = vec4(mix(inputColor.rgb, prev, w), inputColor.a);
}
`;
