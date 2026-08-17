// Shared geometry + film materials.
//
// The film path is evaluated PER VERTEX in the vertex shader (see
// sampleFilmCurve for the CPU mirror and the shape rationale). Geometry is
// therefore flat — a plain PlaneGeometry — and every vertex is displaced onto
// the true curve. Because the curve is a pure function of arc length, frame i's
// right edge and frame i+1's left edge evaluate the same `s` and land on the
// exact same point: seams are exact even where curvature changes, which a
// pre-bent fixed-radius geometry could not do once the path stopped being a
// circle.
import * as THREE from 'three';
import {
  FRAME_WIDTH,
  FRAME_HEIGHT,
  FILM_HEIGHT,
  BAND_HEIGHT,
  PITCH,
  HOLES_PER_FRAME,
  HOLE_SIZE_RATIO,
  HOLE_CORNER_RATIO,
  DISTORT_STRETCH,
  DISTORT_SKEW,
  RADIUS,
  CURVE_THETA_MAX,
  WAVE_AMPLITUDE,
  WAVE_LENGTH,
} from './constants';

// Enough X segments that the displaced plane resolves the curvature smoothly.
export const CURVE_SEGMENTS = 48;

export function createFilmGeometry(width: number, height: number): THREE.PlaneGeometry {
  return new THREE.PlaneGeometry(width, height, CURVE_SEGMENTS, 1);
}

// --- shared GLSL ---------------------------------------------------------
// filmVertex() takes a position in the frame's own flat local space and
// returns it displaced onto the curve, still expressed in that frame's local
// space — so the CPU-side group transform (placed at the curve point, oriented
// by the tangent) stays correct and raycasting keeps working.
const CURVE_GLSL = /* glsl */ `
uniform float uS0;
const float CV_R    = ${RADIUS.toFixed(4)};
const float CV_TMAX = ${CURVE_THETA_MAX.toFixed(4)};
const float CV_WAMP = ${WAVE_AMPLITUDE.toFixed(4)};
const float CV_WLEN = ${WAVE_LENGTH.toFixed(4)};

void filmBasis(float s, out vec3 p, out vec3 T, out vec3 U, out vec3 N) {
  // clamp() is the arc -> straight-line handoff, branchless
  float ang  = clamp(s / CV_R, -CV_TMAX, CV_TMAX);
  float run  = s - ang * CV_R;
  vec2  tc   = vec2(cos(ang), -sin(ang));
  vec2  xz   = vec2(CV_R * sin(ang), CV_R * cos(ang) - CV_R) + run * tc;
  p = vec3(xz.x, CV_WAMP * sin(s / CV_WLEN), xz.y);
  T = normalize(vec3(tc.x, (CV_WAMP / CV_WLEN) * cos(s / CV_WLEN), tc.y));
  N = normalize(cross(T, vec3(0.0, 1.0, 0.0)));
  U = cross(N, T);
}

// orthonormal basis inverse == transpose, so three dots
vec3 filmToLocal(vec3 v, vec3 T, vec3 U, vec3 N) {
  return vec3(dot(v, T), dot(v, U), dot(v, N));
}

// Split into position and normal rather than one out-param call, because the
// two stock chunks they patch into (begin_vertex / beginnormal_vertex) are not
// always both present — MeshBasicMaterial only emits beginnormal_vertex inside
// an "#if defined(USE_ENVMAP) || defined(USE_SKINNING)" block.
vec3 filmPosition(float localX, float localY) {
  vec3 p0, T0, U0, N0;
  filmBasis(uS0, p0, T0, U0, N0);
  vec3 p, T, U, N;
  filmBasis(uS0 + localX, p, T, U, N);
  return filmToLocal(p + U * localY - p0, T0, U0, N0);
}

vec3 filmNormal(float localX) {
  vec3 p0, T0, U0, N0;
  filmBasis(uS0, p0, T0, U0, N0);
  vec3 p, T, U, N;
  filmBasis(uS0 + localX, p, T, U, N);
  return filmToLocal(N, T0, U0, N0);
}
`;

// Patch a stock Three material (border / backing) to ride the curve. The
// material keeps its normal lighting pipeline — only the vertex position and,
// for lit materials, the object normal are replaced.
//
// `lit` must be false for materials whose beginnormal_vertex chunk is
// conditionally compiled (MeshBasicMaterial); patching it there would put the
// code inside a dead #if.
// Pure string transform, exported so filmCurve.check.ts can validate the
// GLSL it produces — nothing else in the pipeline typechecks a shader.
export function patchFilmVertexShader(source: string, lit: boolean): string {
  let vs = source
    .replace('#include <common>', `#include <common>\n${CURVE_GLSL}`)
    .replace(
      '#include <begin_vertex>',
      'vec3 transformed = filmPosition(position.x, position.y);'
    );
  if (lit) {
    vs = vs.replace(
      '#include <beginnormal_vertex>',
      'vec3 objectNormal = filmNormal(position.x);'
    );
  }
  return vs;
}

function applyFilmCurve(material: THREE.Material, lit: boolean): void {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uS0 = { value: 0 };
    shader.vertexShader = patchFilmVertexShader(shader.vertexShader, lit);
    material.userData.shader = shader;
  };
}

// Per-tick arc-length write. No-op until the program has compiled.
export function setFilmCurveS0(material: THREE.Material, s0: number): void {
  const shader = material.userData.shader as { uniforms: Record<string, { value: number }> } | undefined;
  if (shader) shader.uniforms.uS0.value = s0;
}

interface HoleRect {
  x: number;
  y: number;
  s: number;
  r: number;
}

function holeRects(W: number, H: number): HoleRect[] {
  const holePitch = W / HOLES_PER_FRAME;
  const s = holePitch * HOLE_SIZE_RATIO;
  const r = s * HOLE_CORNER_RATIO;
  const bandH = (BAND_HEIGHT / FILM_HEIGHT) * H;
  const rects: HoleRect[] = [];
  for (const yc of [bandH / 2, H - bandH / 2]) {
    for (let i = 0; i < HOLES_PER_FRAME; i++) {
      rects.push({ x: (i + 0.5) * holePitch, y: yc, s, r });
    }
  }
  return rects;
}

// Colour map: opaque film, transparent image window + holes, with a baked
// bevel — light stroke on the lower-inner edge of each hole, dark on the
// upper edge, and rail edge lines — so edges read chamfered even before
// the bump map contributes.
export function createFilmTextures(): {
  map: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
} {
  const W = 1024;
  const H = Math.round((W * FILM_HEIGHT) / PITCH);
  const holes = holeRects(W, H);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0c0c0e';
  ctx.fillRect(0, 0, W, H);

  // faint vertical sheen across the rail so it is not a flat fill
  const sheen = ctx.createLinearGradient(0, 0, 0, H);
  sheen.addColorStop(0, 'rgba(255,255,255,0.06)');
  sheen.addColorStop(0.12, 'rgba(255,255,255,0)');
  sheen.addColorStop(0.88, 'rgba(0,0,0,0)');
  sheen.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, W, H);

  // rail edge lines: lit top edge, shadowed bottom edge
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  ctx.fillRect(0, 0, W, 3);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, H - 3, W, 3);

  // Wear: a few hairline scratches down the length plus scattered dust.
  // Kept below ~5% contrast — the read should be "premium film stock", and
  // anything visible enough to notice individually reads as damage instead.
  // Deterministic so the strip is identical on every reload.
  let seed = 0x5abfa17;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 7; i++) {
    const x = rand() * W;
    ctx.fillStyle = `rgba(255,255,255,${0.012 + rand() * 0.022})`;
    ctx.fillRect(x, 0, rand() < 0.5 ? 1 : 2, H);
  }
  for (let i = 0; i < 90; i++) {
    const s = 0.6 + rand() * 1.7;
    ctx.fillStyle = `rgba(${rand() < 0.7 ? '255,255,255' : '0,0,0'},${0.03 + rand() * 0.05})`;
    ctx.fillRect(rand() * W, rand() * H, s, s);
  }

  // image window
  const winW = (FRAME_WIDTH / PITCH) * W;
  const winH = (FRAME_HEIGHT / FILM_HEIGHT) * H;
  const winX = (W - winW) / 2;
  const winY = (H - winH) / 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 4;
  ctx.strokeRect(winX - 2, winY - 2, winW + 4, winH + 4);
  ctx.clearRect(winX, winY, winW, winH);

  // Hole bevels: dark upper lip, lit lower lip (key light sits high).
  // The lit lip carries most of the perforation's read — the holes themselves
  // are cut through to the environment behind, so against a dark backdrop it
  // is this rim, not the hole, that tells the eye a hole is there. It is
  // therefore drawn well above "subtle".
  for (const h of holes) {
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.beginPath();
    ctx.roundRect(h.x - h.s / 2 - 2, h.y - h.s / 2 - 2, h.s + 4, h.s + 4, h.r);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255,252,245,0.42)';
    ctx.beginPath();
    ctx.roundRect(h.x - h.s / 2 + 1.5, h.y - h.s / 2 + 1.5, h.s - 3, h.s - 3, h.r);
    ctx.stroke();
  }

  // cut the holes
  ctx.globalCompositeOperation = 'destination-out';
  for (const h of holes) {
    ctx.beginPath();
    ctx.roundRect(h.x - h.s / 2, h.y - h.s / 2, h.s, h.s, h.r);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;

  // Bump map: blurred hole/window mask. The blur radius is the bevel width;
  // MeshStandardMaterial turns the gradient into real light response.
  const bc = document.createElement('canvas');
  bc.width = W;
  bc.height = H;
  const bctx = bc.getContext('2d')!;
  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, W, H);
  bctx.filter = 'blur(5px)';
  bctx.fillStyle = '#000000';
  for (const h of holes) {
    bctx.beginPath();
    bctx.roundRect(h.x - h.s / 2, h.y - h.s / 2, h.s, h.s, h.r);
    bctx.fill();
  }
  bctx.fillRect(winX, winY, winW, winH);
  const bump = new THREE.CanvasTexture(bc);

  return { map, bump };
}

// Built fresh per frame (not cloned) so each owns its own onBeforeCompile
// uniforms block for uS0 and its own opacity. Maps stay shared.
export function createFilmBorderMaterial(textures: {
  map: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
}): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({
    map: textures.map,
    bumpMap: textures.bump,
    bumpScale: 0.6,
    transparent: true,
    // low threshold: still cuts the holes (alpha 0) but lets the per-frame
    // opacity fade smoothly instead of popping out at alphaTest
    alphaTest: 0.05,
    roughness: 0.55,
    metalness: 0.25,
  });
  applyFilmCurve(mat, true);
  return mat;
}

// Dark copy rendered 0.03 behind the border: at oblique angles the doubled
// hole edges read as physical strip thickness.
export function createBackingMaterial(map: THREE.CanvasTexture): THREE.MeshBasicMaterial {
  const mat = new THREE.MeshBasicMaterial({
    map,
    color: 0x131316,
    transparent: true,
    alphaTest: 0.05,
  });
  applyFilmCurve(mat, false);
  return mat;
}

// Soft radial blob for the contact shadow under a promoted frame.
export function createShadowTexture(): THREE.CanvasTexture {
  const S = 256;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(0,0,0,0.85)');
  g.addColorStop(0.55, 'rgba(0,0,0,0.35)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  return new THREE.CanvasTexture(canvas);
}

const panelVertex = /* glsl */ `
${CURVE_GLSL}
uniform float uVelocity;  // scroll velocity / MAX_VELOCITY, smoothed
uniform float uFlatten;   // 0 = on the film path, 1 = flat fullscreen
varying vec2 vUv;
varying vec3 vNormal;
void main() {
  vUv = uv;
  // velocity distortion is applied in arc-length space, so the frame
  // stretches ALONG the film rather than across the screen
  float k = 1.0 - uFlatten;
  float localX = position.x * (1.0 + abs(uVelocity) * ${DISTORT_STRETCH.toFixed(3)} * k)
               + uVelocity * ${DISTORT_SKEW.toFixed(3)} * position.y * k;
  vec3 pos = mix(filmPosition(localX, position.y), vec3(localX, position.y, 0.0), uFlatten);
  vNormal = normalize(normalMatrix * mix(filmNormal(localX), vec3(0.0, 0.0, 1.0), uFlatten));
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const panelFragment = /* glsl */ `
uniform sampler2D uMap;
uniform vec2 uRepeat;
uniform vec2 uOffset;
uniform float uDim;
uniform float uSat;
uniform float uAlpha;
varying vec2 vUv;
void main() {
  vec4 tex = texture2D(uMap, vUv * uRepeat + uOffset);
  float g = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
  vec3 c = mix(vec3(g), tex.rgb, uSat);

  // Gate: the emulsion is recessed inside the film's black window, so it
  // loses light toward the border and catches a bright lip where the two
  // meet. Without this the image reads as a photo pasted on the strip
  // rather than as something the strip is made of.
  // Distances converted to height-units so the band is even on both axes.
  vec2 d2 = min(vUv, 1.0 - vUv) * vec2(${(FRAME_WIDTH / FRAME_HEIGHT).toFixed(4)}, 1.0);
  float edge = min(d2.x, d2.y);
  float gate = smoothstep(0.0, 0.045, edge);
  float lip  = smoothstep(0.006, 0.016, edge) * (1.0 - smoothstep(0.016, 0.040, edge));
  c *= mix(0.42, 1.0, gate);
  c += vec3(0.58, 0.55, 0.50) * lip * 0.10;

  // Emulsion grain, locked to the frame rather than to the screen — it rides
  // the image the way real grain does, so it survives the strip moving.
  float gr = fract(sin(dot(vUv * vec2(720.0, 400.0), vec2(12.9898, 78.233))) * 43758.5453);
  c *= 1.0 + (gr - 0.5) * 0.035;

  // No specular term. There was a Blinn sheen here, but the panel is FLAT: over
  // one cell dot(n, h) barely changes, so it was never a highlight that moved —
  // it was a constant ~0.13 of white added to every texel, peaking on the cell
  // facing the camera. That is a white veil over whichever frame is selected,
  // which is the opposite of the intent. The strip's depth now comes from the
  // gate, the grain and the neighbour dimming alone.
  c = c * uDim;
  gl_FragColor = vec4(c, uAlpha);
  #include <colorspace_fragment>
}
`;

export function createFilmPanelMaterial(texture: THREE.Texture): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: panelVertex,
    fragmentShader: panelFragment,
    uniforms: {
      uMap: { value: texture },
      uRepeat: { value: texture.repeat.clone() },
      uOffset: { value: texture.offset.clone() },
      uS0: { value: 0 },
      uVelocity: { value: 0 },
      uFlatten: { value: 0 },
      uDim: { value: 1 },
      uSat: { value: 1 },
      uAlpha: { value: 1 },
    },
    transparent: true,
  });
}

const reactiveBorderVertex = /* glsl */ `
${CURVE_GLSL}
uniform float uFlatten;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 pos = mix(filmPosition(position.x, position.y), vec3(position.x, position.y, 0.0), uFlatten);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const reactiveBorderFragment = /* glsl */ `
uniform float uHover;
uniform float uAlpha;
varying vec2 vUv;
void main() {
  if (uHover < 0.002) discard;
  // Convert UVs to uniform physical dimension
  vec2 d = min(vUv, 1.0 - vUv);
  float edgeX = d.x * ${(FRAME_WIDTH).toFixed(4)};
  float edgeY = d.y * ${(FRAME_HEIGHT).toFixed(4)};
  float dist = min(edgeX, edgeY);

  // Sharp, crisp 2px card frame border stroke
  float stroke = (1.0 - smoothstep(0.018, 0.026, dist)) * smoothstep(0.000, 0.004, dist);
  // Refined edge highlight
  float rim = (1.0 - smoothstep(0.0, 0.045, dist)) * 0.30;

  float alpha = (stroke * 1.9 + rim) * uHover * uAlpha;
  if (alpha < 0.004) discard;

  // Clean luminous card frame border
  vec3 borderColor = mix(vec3(1.0, 1.0, 1.0), vec3(1.0, 0.88, 0.52), 0.25);
  gl_FragColor = vec4(borderColor, alpha);
}
`;

export function createReactiveBorderMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: reactiveBorderVertex,
    fragmentShader: reactiveBorderFragment,
    uniforms: {
      uS0: { value: 0 },
      uFlatten: { value: 0 },
      uHover: { value: 0 },
      uAlpha: { value: 1 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

// Cover-fit a texture into the 4:3 image window — no letterbox, no stretch.
export function coverFitTexture(tex: THREE.Texture): void {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 8;
  const img = tex.image as { width: number; height: number } | undefined;
  if (!img?.width || !img?.height) return;
  const aspect = img.width / img.height;
  const target = FRAME_WIDTH / FRAME_HEIGHT;
  if (aspect > target) {
    tex.repeat.set(target / aspect, 1);
    tex.offset.set((1 - target / aspect) / 2, 0);
  } else {
    tex.repeat.set(1, aspect / target);
    tex.offset.set(0, (1 - aspect / target) / 2);
  }
  tex.needsUpdate = true;
}
