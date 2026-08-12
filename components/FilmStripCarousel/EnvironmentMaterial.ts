// The environment's shader, split out of Environment.tsx for the same reason
// FilmMaterial.ts is split out of FilmFrame.tsx: a .tsx importing R3F cannot be
// loaded by filmCurve.check.ts, and a shader nothing validates is a shader that
// ships broken. Everything here is plain Three + strings.
import * as THREE from 'three';
import {
  ENV_PARALLAX_FAR,
  ENV_PARALLAX_MID,
  ENV_PARALLAX_NEAR,
  GROUP_ROTATION_Z,
} from './constants';

export const envVertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Sabrang's own palette — deep violet base, magenta key, cyan fill, gold
// accent. Deliberately not the reference's steel blue.
export const envFragmentShader = /* glsl */ `
varying vec2 vUv;
uniform float uTime;
uniform vec2  uPointer;   // -1..1, damped cursor
uniform float uVel;       // signed strip velocity, normalised
uniform float uGlow;      // |velocity|, eased — the reel's light bleed
uniform float uExpand;    // 0..1 frame-expansion progress
uniform float uIntro;     // 0..1 entrance
uniform float uAspect;

// Anisotropic soft mass. Separate radii let a light smear horizontally when
// the film is moving fast without smearing vertically.
float mass(vec2 p, vec2 c, vec2 r) {
  vec2 d = (p - c) / r;
  d.x /= uAspect;
  return exp(-dot(d, d) * 1.5);
}

// cheap hash, used only as sub-LSB dither — dark wide gradients band badly
// on 8-bit displays and a static 1/255 jitter is the standard fix
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 p = vUv;

  // ---- Layer 1: base environment -------------------------------------
  // Four stops plus a lateral lift, so it is a lit volume rather than a
  // vertical ramp: brighter low and to the right, where the key sits.
  vec3 c = mix(vec3(0.016, 0.004, 0.043), vec3(0.043, 0.020, 0.125), smoothstep(0.0, 0.42, p.y));
  c = mix(c, vec3(0.106, 0.031, 0.204), smoothstep(0.40, 0.74, p.y));
  c = mix(c, vec3(0.196, 0.055, 0.294), smoothstep(0.72, 1.0, p.y));
  c += vec3(0.045, 0.012, 0.052) * smoothstep(0.25, 1.0, p.x) * smoothstep(0.3, 1.0, p.y);

  // ---- Layer 3: large abstract light masses ---------------------------
  // Each rides its own parallax factor, so they separate in depth as the
  // cursor moves. Slow independent drift keeps the frame from ever being
  // perfectly still.
  vec2 pFar  = p + uPointer * ${ENV_PARALLAX_FAR.toFixed(3)};
  vec2 pMid  = p + uPointer * ${ENV_PARALLAX_MID.toFixed(3)};
  vec2 pNear = p + uPointer * ${ENV_PARALLAX_NEAR.toFixed(3)};

  // magenta key, low and right, behind the strip's rising end
  float key = mass(pMid, vec2(0.76 + 0.012 * sin(uTime * 0.11), 0.24), vec2(0.46, 0.40));
  c += vec3(1.0, 0.165, 0.553) * key * 0.20;

  // cyan fill, opposite corner, further out so it moves less
  float fill = mass(pFar, vec2(0.16, 0.74 + 0.015 * cos(uTime * 0.09)), vec2(0.44, 0.38));
  c += vec3(0.0, 0.898, 1.0) * fill * 0.075;

  // violet mass hugging the top edge — gives the vignette something to bite
  float crown = mass(pFar, vec2(0.5, 1.02), vec2(0.7, 0.30));
  c += vec3(0.616, 0.306, 0.867) * crown * 0.06;

  // ---- Layer 2: atmospheric haze along the film's axis -----------------
  // A band tilted to match the strip's roll, so the film reads as sitting
  // inside a shaft of light rather than in front of one.
  // NB: squared by multiplication, not pow(). pow(x, 2.0) is UNDEFINED for
  // x < 0 in GLSL, and this offset is negative for every pixel above the
  // band — on a driver that returns NaN there the whole backdrop goes black.
  float roll = ${Math.tan(GROUP_ROTATION_Z).toFixed(4)};
  float q = (pNear.y - 0.46 - (pNear.x - 0.5) * roll) / 0.22;
  float band = exp(-q * q);
  c += vec3(0.35, 0.16, 0.46) * band * (0.10 + 0.22 * uGlow);

  // ---- The reel's own light bleed --------------------------------------
  // Sits where the active cell is and smears along the direction of travel,
  // so a fast scroll drags a warm streak across the backdrop.
  float smear = 0.20 + 0.55 * abs(uVel);
  float bleed = mass(pNear, vec2(0.5 - uVel * 0.13, 0.47), vec2(smear, 0.16));
  c += mix(vec3(1.0, 0.55, 0.30), vec3(1.0, 0.784, 0.0), abs(uVel)) * bleed * (0.05 + 0.30 * uGlow);

  // ---- Depth-of-field / expansion response -----------------------------
  // When a frame is being pulled forward the environment drops away: darker,
  // desaturated, so the foreground gains separation instead of the
  // background simply being covered.
  float lum = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(c, vec3(lum), 0.55 * uExpand);
  c *= 1.0 - 0.55 * uExpand;

  // ---- Entrance --------------------------------------------------------
  // Opens from a dark, collapsed interior into the full environment.
  c *= mix(0.12, 1.0, smoothstep(0.0, 0.75, uIntro));

  // sub-LSB dither against banding in the dark half
  c += (hash(gl_FragCoord.xy) - 0.5) * 0.0035;

  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}
`;

// depthTest off + renderOrder -1 on the mesh: this is a backdrop, it draws
// first and never occludes or is occluded by anything.
export function createEnvironmentMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: envVertexShader,
    fragmentShader: envFragmentShader,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2() },
      uVel: { value: 0 },
      uGlow: { value: 0 },
      uExpand: { value: 0 },
      uIntro: { value: 0 },
      uAspect: { value: 1 },
    },
  });
}
