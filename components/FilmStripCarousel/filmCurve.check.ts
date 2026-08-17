/**
 * Self-check for the film path and the shader patch points.
 * Run: node components/FilmStripCarousel/filmCurve.check.ts
 *
 * Covers the two things that fail silently at runtime:
 *   1. the curve invariants that keep frame seams closed, and
 *   2. the assumption that Three's stock vertex shaders still contain the
 *      chunks applyFilmCurve() string-replaces (a Three upgrade can break this
 *      with no type error and no build error — only a blank canvas).
 */
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';

// The app is built by a bundler, so its imports are extensionless. Node's ESM
// resolver is not, hence this hook — and hence the dynamic imports below, which
// must run after it is registered.
registerHooks({
  resolve(spec, ctx, next) {
    if (spec.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(spec) && ctx.parentURL) {
      const base = new URL(spec, ctx.parentURL).href;
      for (const ext of ['.ts', '.tsx', '.js']) {
        if (existsSync(fileURLToPath(base + ext))) return next(base + ext, ctx);
      }
    }
    return next(spec, ctx);
  },
  // The bundler turns a .png import into { src: '/_next/...' }. Node cannot,
  // so stub it with the file URL as `src` — §12 recognises the marker and
  // checks the file itself instead of looking in public/.
  load(url, ctx, next) {
    if (url.endsWith('.png')) {
      return {
        format: 'module',
        shortCircuit: true,
        source: `export default { src: ${JSON.stringify(url)} };`,
      };
    }
    return next(url, ctx);
  },
});

const { sampleFilmCurve } = await import('./carouselMath.ts');
const {
  ACTIVE_SCALE_BOOST,
  BAND_HEIGHT,
  BREAKPOINTS,
  CAM_DRIFT,
  CAM_EXPAND_PUSH,
  CAM_POINTER_X,
  CAM_POINTER_Y,
  CAM_ROLL,
  CAM_VELOCITY_LAG,
  CURVE_THETA_MAX,
  DEPTH_FADE_RANGE,
  ENV_OVERSCAN,
  ENV_PLANE_Z,
  EXPAND_DISTANCE,
  EXPAND_FILL,
  FILM_HEIGHT,
  FRAME_HEIGHT,
  FRAME_WIDTH,
  GATE_CLEARANCE,
  HOLE_SIZE_RATIO,
  HOLES_PER_FRAME,
  PITCH,
  PROMOTE_DAMPING,
  PROMOTE_STIFFNESS,
  RADIUS,
} = await import('./constants.ts');
type CurveSample = import('./carouselMath.ts').CurveSample;

const buf = (): CurveSample => ({ px: 0, py: 0, pz: 0, tx: 0, ty: 0, tz: 0 });
const at = (s: number) => sampleFilmCurve(s, buf());
const dist = (a: CurveSample, b: CurveSample) =>
  Math.hypot(a.px - b.px, a.py - b.py, a.pz - b.pz);

// --- 1. near-unit speed ---------------------------------------------------
// Seams are exact by construction (pure function of s), but speed deviation
// stretches frame CONTENT along steep wave sections. The S-curve's A/L ≈ 0.21
// costs ~2.1% at the inflection; past ~3% the stretch starts to be visible on
// the hero frame, so that is the budget.
{
  const h = 1e-4;
  let worst = 0;
  for (let s = -20; s <= 20; s += 0.05) {
    const speed = dist(at(s - h), at(s + h)) / (2 * h);
    worst = Math.max(worst, Math.abs(speed - 1));
  }
  assert.ok(worst < 0.03, `path speed deviates ${(worst * 100).toFixed(2)}% from unit`);
}

// --- 2. seams close -------------------------------------------------------
// Frame i's trailing edge and frame i+1's leading edge are the same arc
// length, so they must be the same point in space at any curvature.
{
  for (let i = -6; i < 6; i++) {
    const trailing = at(i * PITCH + PITCH / 2);
    const leading = at((i + 1) * PITCH - PITCH / 2);
    assert.ok(dist(trailing, leading) < 1e-12, `seam gap at frame ${i}`);
  }
}

// --- 3. C1 across the arc -> straight-line handoff ------------------------
// A tangent kink here would show as a visible crease in the film.
{
  const sc = CURVE_THETA_MAX * RADIUS;
  const before = at(sc - 1e-5);
  const after = at(sc + 1e-5);
  const kink = Math.hypot(
    before.tx - after.tx,
    before.ty - after.ty,
    before.tz - after.tz
  );
  assert.ok(kink < 1e-4, `tangent kink of ${kink} at the arc handoff`);
}

// --- 4. the tail recedes and never curls back -----------------------------
// This is the whole point of the shape: past the handoff the film must run
// away from the camera forever instead of closing into a cylinder.
{
  const tailEnd = BREAKPOINTS.desktop.tail * PITCH;
  let prev = at(CURVE_THETA_MAX * RADIUS);
  for (let s = CURVE_THETA_MAX * RADIUS + 0.5; s <= tailEnd; s += 0.5) {
    const p = at(s);
    assert.ok(p.pz < prev.pz, `tail stopped receding at s=${s}`);
    assert.ok(p.px > prev.px, `tail curled back inward at s=${s}`);
    prev = p;
  }
  // must be fully hazed out by the last rendered frame, or the tail ends in
  // mid-air instead of sinking into the background
  assert.ok(
    prev.pz < -DEPTH_FADE_RANGE,
    `tail only reaches z=${prev.pz.toFixed(1)}, short of the ${-DEPTH_FADE_RANGE} fade range`
  );
}

// --- 5. shader patch points still exist -----------------------------------
{
  const standard = THREE.ShaderLib.standard.vertexShader;
  const basic = THREE.ShaderLib.basic.vertexShader;

  for (const [name, src] of [['standard', standard], ['basic', basic]] as const) {
    assert.ok(src.includes('#include <common>'), `${name}: missing <common>`);
    assert.ok(src.includes('#include <begin_vertex>'), `${name}: missing <begin_vertex>`);
  }
  assert.ok(
    standard.includes('#include <beginnormal_vertex>'),
    'standard: missing <beginnormal_vertex>'
  );

  // basic only emits beginnormal_vertex inside a conditional block, which is
  // why createBackingMaterial passes lit=false. If this ever stops being true
  // the flag can be simplified.
  const i = basic.indexOf('#include <beginnormal_vertex>');
  if (i !== -1) {
    assert.ok(
      basic.slice(Math.max(0, i - 300), i).includes('#if'),
      'basic: beginnormal_vertex is no longer conditionally compiled'
    );
  }
}

// --- 6. the patched GLSL is well formed -----------------------------------
// Nothing else in the pipeline typechecks a shader: a bad patch compiles,
// builds and ships, then fails at runtime as a blank canvas.
{
  const { patchFilmVertexShader } = await import('./FilmMaterial.ts');
  const cases = [
    ['standard/lit', THREE.ShaderLib.standard.vertexShader, true],
    ['basic/unlit', THREE.ShaderLib.basic.vertexShader, false],
  ] as const;

  for (const [name, src, lit] of cases) {
    const out = patchFilmVertexShader(src, lit);
    const count = (re: RegExp) => (out.match(re) ?? []).length;

    // every variable the downstream stock chunks consume must exist exactly once
    assert.equal(count(/\bvec3 transformed\b/g), 1, `${name}: transformed not declared once`);
    assert.ok(!out.includes('#include <begin_vertex>'), `${name}: begin_vertex not replaced`);

    if (lit) {
      assert.equal(count(/\bvec3 objectNormal\b/g), 1, `${name}: objectNormal not declared once`);
      assert.ok(
        !out.includes('#include <beginnormal_vertex>'),
        `${name}: beginnormal_vertex not replaced`
      );
    } else {
      // unlit must NOT declare objectNormal — the stock chunk still owns it
      // inside its conditional block, and a second declaration would clash
      assert.equal(count(/\bvec3 objectNormal\b/g), 0, `${name}: unexpected objectNormal`);
    }

    // helpers defined, at file scope, before main()
    for (const fn of ['filmPosition', 'filmNormal', 'filmBasis']) {
      const def = out.indexOf(`vec3 ${fn}(`) >= 0 ? out.indexOf(`vec3 ${fn}(`) : out.indexOf(`void ${fn}(`);
      assert.ok(def >= 0, `${name}: ${fn} not defined`);
      assert.ok(def < out.indexOf('void main('), `${name}: ${fn} defined after main()`);
    }
    assert.ok(out.includes('uniform float uS0;'), `${name}: uS0 not declared`);

    const braces = count(/\{/g) - count(/\}/g);
    assert.equal(braces, 0, `${name}: unbalanced braces (${braces})`);
    const parens = count(/\(/g) - count(/\)/g);
    assert.equal(parens, 0, `${name}: unbalanced parens (${parens})`);
  }

  // Encodes WHY createBackingMaterial passes lit=false: patching basic with
  // lit=true puts the objectNormal declaration inside a conditional block that
  // is compiled out in the common case. Nothing above would catch that, since
  // the declaration does textually exist.
  const wrong = patchFilmVertexShader(THREE.ShaderLib.basic.vertexShader, true);
  const oi = wrong.indexOf('vec3 objectNormal');
  if (oi !== -1) {
    const before = wrong.slice(0, oi);
    assert.ok(
      before.lastIndexOf('#if') > before.lastIndexOf('#endif'),
      'basic: lit=true no longer lands inside a dead #if — the lit flag may be removable'
    );
  }
}

// --- 7. the cinematic rig cannot expose the backdrop's edge ---------------
// Environment sizes its plane from the breakpoint's NOMINAL camera pose, but
// the rig then sways, dollies, yaws and rolls away from that pose. If the
// overscan is ever smaller than the worst-case excursion, the corner of a
// 22-unit-deep plane slides into shot as a hard diagonal against the void.
// Nothing at runtime would flag that; it just looks broken.
{
  // worst case: pointer pinned to a corner, velocity saturated, drift at peak,
  // and mid-expansion (which dollies the camera toward the backdrop)
  const swayX = CAM_POINTER_X + CAM_VELOCITY_LAG * 0.1 + CAM_DRIFT;
  const swayY = CAM_POINTER_Y + CAM_DRIFT * 0.7;

  for (const [name, bp] of Object.entries(BREAKPOINTS)) {
    // plane half-extents, as Environment computes them
    const halfH =
      Math.tan((bp.fov * Math.PI) / 360) * (bp.cameraZ - ENV_PLANE_Z) * ENV_OVERSCAN;

    // 0.42 is a phone held upright, which is the binding case: half-width is
    // half-height x aspect, so a narrow viewport shrinks the absolute x margin
    // the overscan buys while the sway and roll terms stay the same size.
    for (const aspect of [0.42, 0.5, 1, 16 / 9, 21 / 9]) {
      const halfW = halfH * aspect;

      for (const push of [0, CAM_EXPAND_PUSH]) {
        const camZ = bp.cameraZ - push;
        const dist = camZ - ENV_PLANE_Z;
        // Half-extent of the view frustum where it meets the backdrop plane.
        // The roll is a rotation about the view axis, so it swings the corner
        // out to the full diagonal — that is the term most likely to be
        // forgotten, and the reason this is checked rather than eyeballed.
        const fh = Math.tan((bp.fov * Math.PI) / 360) * dist;
        const fw = fh * aspect;
        const diag = Math.hypot(fw, fh);
        const rw = Math.abs(fw * Math.cos(CAM_ROLL)) + Math.abs(fh * Math.sin(CAM_ROLL));
        const rh = Math.abs(fw * Math.sin(CAM_ROLL)) + Math.abs(fh * Math.cos(CAM_ROLL));
        assert.ok(diag >= rw - 1e-9, 'roll expansion sanity');

        // Where the view axis pierces the backdrop. lookAt aims at 0.35x the
        // camera's own offset, so the ray converges toward centre and then
        // crosses it — at this depth |1 - 0.65*dist/camZ| is well above 1, so
        // the axis lands on the OPPOSITE side of centre from the camera.
        const axis = Math.abs(1 - (0.65 * dist) / camZ);
        const reachX = swayX * axis + rw;
        const reachY = swayY * axis + rh;

        assert.ok(
          reachX <= halfW,
          `${name} @${aspect.toFixed(2)} push=${push}: view reaches x=${reachX.toFixed(2)} past backdrop half-width ${halfW.toFixed(2)} — raise ENV_OVERSCAN`
        );
        assert.ok(
          reachY <= halfH,
          `${name} @${aspect.toFixed(2)} push=${push}: view reaches y=${reachY.toFixed(2)} past backdrop half-height ${halfH.toFixed(2)} — raise ENV_OVERSCAN`
        );
      }
    }
  }
}

// --- 8. an expanding frame stays centred while the camera moves -----------
// FilmStrip pins the expansion target to the live camera rather than to a
// fixed world point, precisely so the rig can dolly and sway during the
// expansion. Pinning it to the old fixed point would still LOOK right at rest
// and drift off-centre only once the camera moved, which is exactly the kind
// of bug that survives manual testing.
{
  const bp = BREAKPOINTS.desktop;
  const aspect = 16 / 9;
  const cam = new THREE.PerspectiveCamera(bp.fov, aspect, 0.1, 100);

  // a selection of poses the rig can actually produce
  const poses = [
    [0, 0, bp.cameraZ, 0],
    [0.62, 0.28, bp.cameraZ - CAM_EXPAND_PUSH, CAM_ROLL],
    [-0.62, -0.28, bp.cameraZ - CAM_EXPAND_PUSH * 0.5, -CAM_ROLL],
  ] as const;

  for (const [x, y, z, roll] of poses) {
    cam.position.set(x, y, z);
    cam.lookAt(x * 0.35, y * 0.35, 0);
    cam.rotateZ(roll);
    cam.updateMatrixWorld(true);

    // exactly what FilmStrip computes at ex.p === 1
    const halfH = Math.tan((cam.fov * Math.PI) / 360) * EXPAND_DISTANCE;
    const sc = Math.min(
      (2 * halfH * EXPAND_FILL) / FRAME_HEIGHT,
      (2 * halfH * aspect * EXPAND_FILL) / FRAME_WIDTH
    );
    const dir = cam.getWorldDirection(new THREE.Vector3());
    const target = new THREE.Object3D();
    target.position.copy(cam.position).addScaledVector(dir, EXPAND_DISTANCE);
    target.quaternion.copy(cam.quaternion);
    target.scale.setScalar(sc);
    target.updateMatrixWorld(true);

    const ndc = (u: number, v: number) =>
      new THREE.Vector3((u * FRAME_WIDTH) / 2, (v * FRAME_HEIGHT) / 2, 0)
        .applyMatrix4(target.matrixWorld)
        .project(cam);

    const centre = ndc(0, 0);
    assert.ok(
      Math.hypot(centre.x, centre.y) < 1e-6,
      `expanded frame off-centre at pose ${[x, y, z]}: ndc ${centre.x.toFixed(4)},${centre.y.toFixed(4)}`
    );

    // and it fills exactly EXPAND_FILL of the shorter axis
    const corners = [ndc(-1, -1), ndc(1, -1), ndc(-1, 1), ndc(1, 1)];
    const maxAbs = Math.max(...corners.flatMap((c) => [Math.abs(c.x), Math.abs(c.y)]));
    assert.ok(
      Math.abs(maxAbs - EXPAND_FILL) < 1e-4,
      `expanded frame fills ${maxAbs.toFixed(4)} of the viewport, expected ${EXPAND_FILL}`
    );
  }
}

// --- 9. the environment shader is well formed and fully wired -------------
// Same rationale as §6. The extra risk here is uniform drift: Environment's
// frame loop writes uniforms by name, and a name that exists on the JS side
// but not in the GLSL (or vice versa) throws nothing, logs nothing, and just
// silently stops animating that layer.
{
  const { createEnvironmentMaterial, envFragmentShader, envVertexShader } =
    await import('./EnvironmentMaterial.ts');

  // Assertions below are about the CODE, so comments have to go first —
  // otherwise prose describing a trap reads as the trap itself.
  const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

  for (const [name, raw] of [
    ['env/vertex', envVertexShader],
    ['env/fragment', envFragmentShader],
  ] as const) {
    const src = strip(raw);
    const count = (re: RegExp) => (src.match(re) ?? []).length;
    assert.equal(count(/\{/g) - count(/\}/g), 0, `${name}: unbalanced braces`);
    assert.equal(count(/\(/g) - count(/\)/g), 0, `${name}: unbalanced parens`);
    assert.ok(src.includes('void main('), `${name}: no main()`);
    // an unresolved template hole renders as "undefined" or "NaN" in the GLSL,
    // which compiles as an undeclared identifier and kills the whole program
    assert.ok(!/\bundefined\b|\bNaN\b/.test(src), `${name}: unresolved interpolation`);

    // pow(x, y) is undefined for x < 0 in GLSL and returns NaN on some
    // drivers — silently, and only on those drivers. Every exponent this
    // shader needs is a small integer, so squaring by multiplication is both
    // safe and faster; banning pow outright is the cheap way to keep it that
    // way. Lift this if a genuinely fractional exponent is ever needed, and
    // guard the base with abs()/max() at that point.
    assert.ok(!/\bpow\s*\(/.test(src), `${name}: pow() — square by multiplication instead`);
  }

  const mat = createEnvironmentMaterial();
  const declared = new Set(
    [...envFragmentShader.matchAll(/^\s*uniform\s+\w+\s+(\w+)\s*;/gm)].map((m) => m[1])
  );
  const provided = new Set(Object.keys(mat.uniforms));

  for (const u of declared) {
    assert.ok(provided.has(u), `env: GLSL declares ${u} but the material never supplies it`);
  }
  for (const u of provided) {
    assert.ok(declared.has(u), `env: material supplies ${u} but the GLSL never declares it`);
  }

  // every uniform Environment.tsx writes each frame must be one of them
  const source = await readFile(
    fileURLToPath(new URL('./Environment.tsx', import.meta.url)),
    'utf8'
  );
  for (const m of source.matchAll(/\bu\.(u[A-Z]\w*)\b/g)) {
    assert.ok(
      provided.has(m[1]),
      `Environment.tsx writes uniform ${m[1]}, which the material does not define`
    );
  }
  mat.dispose();
}

// --- 10. a promoted cell stays inside its gate ----------------------------
// The image panel is scaled up when its cell is selected, but it lives inside
// the film's window: too much and the photo spills over the black separator
// into the neighbouring cell horizontally, or climbs over the sprocket holes
// vertically and hides them. Both look like a rendering fault rather than a
// design choice, and neither shows up until something is actually selected.
//
// The spring makes this sharper than it looks: promotion OVERSHOOTS past 1,
// so the peak scale is larger than ACTIVE_SCALE_BOOST alone suggests, and the
// overshoot changes whenever the spring is retuned.
{
  // standard second-order step response: zeta = c / 2*sqrt(k*m), m = 1
  const zeta = PROMOTE_DAMPING / (2 * Math.sqrt(PROMOTE_STIFFNESS));
  assert.ok(zeta > 0 && zeta < 1, `promotion spring is not underdamped (zeta=${zeta.toFixed(3)})`);
  const overshoot = Math.exp((-Math.PI * zeta) / Math.sqrt(1 - zeta * zeta));
  const peak = 1 + overshoot;
  // a spring that rings this hard would read as wobble, not as a pop
  assert.ok(overshoot < 0.25, `promotion overshoots ${(overshoot * 100).toFixed(1)}% — too springy`);

  const scale = 1 + ACTIVE_SCALE_BOOST * peak;

  // horizontal: half the panel must clear half the cell pitch
  const panelHalfW = (FRAME_WIDTH / 2) * scale;
  const gateHalfW = (PITCH / 2) * GATE_CLEARANCE;
  assert.ok(
    panelHalfW <= gateHalfW,
    `promoted panel spills into the next cell: half-width ${panelHalfW.toFixed(4)} > ${gateHalfW.toFixed(4)} (peak scale ${scale.toFixed(4)}) — lower ACTIVE_SCALE_BOOST`
  );

  // vertical: half the panel must stay clear of the nearest sprocket hole
  const holeSize = (PITCH / HOLES_PER_FRAME) * HOLE_SIZE_RATIO;
  const holeInnerEdge = FILM_HEIGHT / 2 - BAND_HEIGHT / 2 - holeSize / 2;
  const panelHalfH = (FRAME_HEIGHT / 2) * scale;
  assert.ok(
    panelHalfH <= holeInnerEdge * GATE_CLEARANCE,
    `promoted panel covers the sprocket holes: half-height ${panelHalfH.toFixed(4)} > ${holeInnerEdge.toFixed(4)}`
  );

  // and the perforations must stay inside their own band
  assert.ok(
    holeSize < BAND_HEIGHT,
    `sprocket holes (${holeSize.toFixed(3)}) do not fit the band (${BAND_HEIGHT}) — lower HOLE_SIZE_RATIO or raise BAND_HEIGHT`
  );
  // holes wider than their gaps stop reading as discrete perforations
  assert.ok(
    HOLE_SIZE_RATIO > 0.35 && HOLE_SIZE_RATIO < 0.8,
    `HOLE_SIZE_RATIO ${HOLE_SIZE_RATIO} leaves holes and gaps too uneven to read as film`
  );
}

// --- 11. the panel sheen cannot flood the photograph ----------------------
// The image panel is FLAT. Over one cell the surface normal barely changes, so
// the Blinn term in panelFragment is not a highlight that moves across the
// emulsion — it is very nearly a constant added to every texel. The selected
// cell faces the camera almost head-on, which is exactly where that constant
// peaks.
//
// This shipped once: driving the coefficient up to make the selection "pop"
// added ~0.45 uniformly and crushed the photo into the top of the range as
// flat grey. It looked like a lighting choice, not a bug, so nothing caught
// it. This asserts the budget instead.
// The budget version of this check is gone: the sheen is removed outright, so
// what has to hold now is that nothing puts a flood back. Both failure shapes
// are asserted — a specular term returning, and brightness being coupled to
// selection (which is what turned a constant offset into a per-cell blowout).
{
  const { createFilmPanelMaterial } = await import('./FilmMaterial.ts');
  const panel = createFilmPanelMaterial(new THREE.Texture());
  const frag = panel.fragmentShader;

  assert.ok(
    !/uLightDir|\bspec\b|pow\(max\(dot\(n/.test(frag),
    'a specular term is back in the panel shader — on a flat panel that is a white veil over the selected cell, not a highlight'
  );
  assert.ok(
    !('uPromote' in panel.uniforms) && !/uPromote/.test(frag),
    'panel brightness is coupled to promotion again — brighten nothing, dim the neighbours instead'
  );

  // The panel must only ever scale the photograph down. Any bare `+ vec3(` on
  // the colour accumulator is light being added on top of the emulsion.
  const adds = frag.match(/c\s*\+=\s*vec3\([^)]*\)\s*\*\s*[^;]*;/g) ?? [];
  for (const add of adds) {
    assert.ok(
      /lip/.test(add),
      `panel shader adds light to every texel: ${add.trim()} — only the gate lip may add, and only at the frame edge`
    );
  }
  panel.dispose();
}

// --- 12. every menu item points somewhere real ----------------------------
// The strip is the site's navigation, so each cell is a promise that a page
// exists at that href and an image exists at that path. Both break silently:
// a renamed route leaves a cell that routes to a 404, and a moved image leaves
// useTexture suspended so the cell never appears at all. Neither fails the
// build, and neither is visible until someone clicks the item.
{
  const { NAV_PROJECTS } = await import('./projects.ts');
  const root = fileURLToPath(new URL('../../', import.meta.url));

  // routes = every app/**/page.tsx, as a URL path
  const routes = new Set<string>();
  const walk = async (dir: string, prefix: string) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        // (groups) do not appear in the URL; @slots and _private are not routes
        const seg = entry.name;
        if (seg.startsWith('_') || seg.startsWith('@')) continue;
        const next = seg.startsWith('(') && seg.endsWith(')') ? prefix : `${prefix}/${seg}`;
        await walk(join(dir, seg), next);
      } else if (entry.name === 'page.tsx' || entry.name === 'page.ts') {
        routes.add(prefix === '' ? '/' : prefix);
      }
    }
  };
  await walk(join(root, 'app'), '');

  assert.ok(NAV_PROJECTS.length > 0, 'the menu is empty');

  const ids = new Set<string>();
  for (const p of NAV_PROJECTS) {
    assert.ok(!ids.has(p.id), `duplicate project id "${p.id}"`);
    ids.add(p.id);

    assert.ok(
      routes.has(p.href),
      `menu item "${p.title}" points at ${p.href}, which has no page. Routes: ${[...routes].sort().join(', ')}`
    );

    // statically-imported covers carry the load hook's file:// marker;
    // string paths must resolve inside public/
    assert.ok(
      p.image.startsWith('file://')
        ? existsSync(fileURLToPath(p.image))
        : existsSync(join(root, 'public', decodeURIComponent(p.image))),
      `menu item "${p.title}" uses ${p.image}, which does not exist — the cell will never load`
    );

    assert.ok(p.title.trim().length > 0, `menu item ${p.id} has no title`);
    assert.ok(p.category.trim().length > 0, `menu item ${p.id} has no category`);
  }

  // Not every route belongs in the menu (admin, dashboard, auth-gated), but a
  // public one going missing from it is worth knowing about.
  const linked = new Set(NAV_PROJECTS.map((p) => p.href));
  const exempt = /^\/(admin|dashboard|credits|menu)(\/|$)/;
  const unlinked = [...routes].filter((r) => !linked.has(r) && !exempt.test(r));
  assert.deepEqual(
    unlinked,
    [],
    `these pages exist but are not reachable from the menu: ${unlinked.join(', ')}`
  );
}

// --- 13. the wrapper must not capture the pointer on pointerdown -----------
// R3F binds its listeners to the div it renders INSIDE .fsc-canvas. A
// setPointerCapture on the wrapper retargets every later pointer event to the
// wrapper itself, which takes that div out of the event path — the scene then
// never receives pointerup, and no frame click can fire. Nothing catches this:
// it typechecks, it builds, the strip still drags and still renders, and only
// clicking a frame is dead. Capture belongs in onPointerMove, once the press
// has become a drag.
{
  const src = await readFile(
    fileURLToPath(new URL('./useFilmCarousel.ts', import.meta.url)),
    'utf8'
  );
  const body = (name: string) => {
    const start = src.indexOf(`const ${name} = useCallback(`);
    assert.ok(start !== -1, `${name} not found — this check needs updating`);
    return src.slice(start, src.indexOf('\n  );', start));
  };

  assert.ok(
    !body('onPointerDown').includes('setPointerCapture'),
    'onPointerDown captures the pointer: this steals pointerup from R3F and kills every frame click'
  );
  assert.ok(
    body('onPointerMove').includes('setPointerCapture'),
    'nothing captures the pointer once a drag starts — a drag leaving the element will stick'
  );

  // A drag belongs to one pointer. Without the id check, ANY pointermove
  // reaching the element steers the strip and can reach the capture call — a
  // second finger hijacks the first one's drag, and a synthetic PointerEvent
  // (pointerId 0, no live pointer) makes setPointerCapture throw NotFoundError
  // and takes the menu down. That last one shipped once; it read as a random
  // NotFoundError nowhere near its cause.
  assert.ok(
    body('onPointerDown').includes('sim.pointerId = e.pointerId'),
    'onPointerDown no longer records the drag pointer id — onPointerMove cannot tell whose move it is'
  );
  for (const name of ['onPointerMove', 'endDrag']) {
    assert.match(
      body(name),
      /e\.pointerId !== sim\.pointerId/,
      `${name} acts on pointer events from any pointer, including synthetic ones (pointerId 0) — setPointerCapture will throw NotFoundError`
    );
  }
}

// --- 14. the scene compositor is well formed and fully wired ---------------
// Same rationale as §9: the compositor's uniforms are written by name from
// FilmTransition.tsx's frame loop, and a name mismatch throws nothing — the
// lens just silently stops reacting. The extra hazards here are postprocessing
// conventions: an effect fragment must define mainUv/mainImage and must NOT
// define main() (EffectPass owns it — a second main kills the whole merged
// pass), and the barrel term must be normalised so corners never sample
// outside the buffer (that one ships as clamp streaks at the screen edge).
{
  const { COMPOSITOR_TUNE, compositorFragmentShader, compositorUniformDefaults } =
    await import('./FilmCompositor.ts');
  const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  const src = strip(compositorFragmentShader);
  const count = (re: RegExp) => (src.match(re) ?? []).length;

  assert.equal(count(/\{/g) - count(/\}/g), 0, 'compositor: unbalanced braces');
  assert.equal(count(/\(/g) - count(/\)/g), 0, 'compositor: unbalanced parens');
  assert.ok(src.includes('void mainUv('), 'compositor: no mainUv entry point');
  assert.ok(src.includes('void mainImage('), 'compositor: no mainImage entry point');
  assert.ok(!/void\s+main\s*\(/.test(src), 'compositor: defines main() — EffectPass owns it');
  assert.ok(!/\bundefined\b|\bNaN\b/.test(src), 'compositor: unresolved interpolation');
  assert.ok(!/\bpow\s*\(/.test(src), 'compositor: pow() — square by multiplication instead');
  assert.ok(src.includes('rMax2'), 'compositor: barrel term lost its corner normalisation');

  // uniform parity: GLSL declarations <-> the defaults the Effect is built from
  const declared = new Set(
    [...compositorFragmentShader.matchAll(/^\s*uniform\s+\w+\s+(\w+)\s*;/gm)].map((m) => m[1])
  );
  const provided = new Set(Object.keys(compositorUniformDefaults()));
  for (const u of declared) {
    assert.ok(provided.has(u), `compositor: GLSL declares ${u} but the defaults never supply it`);
  }
  for (const u of provided) {
    assert.ok(declared.has(u), `compositor: defaults supply ${u} but the GLSL never declares it`);
  }

  // every uniform FilmTransition.tsx writes must exist
  const source = await readFile(
    fileURLToPath(new URL('./FilmTransition.tsx', import.meta.url)),
    'utf8'
  );
  for (const m of source.matchAll(/uniforms\.get\('(\w+)'\)/g)) {
    assert.ok(
      provided.has(m[1]),
      `FilmTransition.tsx writes uniform ${m[1]}, which the compositor does not define`
    );
  }

  // the dev tune surface must stay numeric — a string from the console would
  // propagate into uniforms as NaN
  for (const [k, v] of Object.entries(COMPOSITOR_TUNE)) {
    assert.ok(Number.isFinite(v), `COMPOSITOR_TUNE.${k} is not a finite number`);
  }
}

console.log(
  'film curve + shader patch points + camera rig + environment + gate + no panel flood + menu + pointer capture + compositor OK'
);
