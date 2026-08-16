// Every tunable in one place. World units unless noted.
export const FRAME_WIDTH = 3.0; // image area
export const FRAME_HEIGHT = 1.68; // ~16:9 — the reference window is wider than 4:3
export const BAND_HEIGHT = 0.46; // each sprocket band (~17.7% of film height)
export const FILM_HEIGHT = FRAME_HEIGHT + 2 * BAND_HEIGHT; // 3.05
export const SEPARATOR_WIDTH = 0.11; // vertical black gap between frames
export const PITCH = FRAME_WIDTH + SEPARATOR_WIDTH; // 3.17
// Radius of the arc through the hero region. Tight enough that the strip
// folds away hard at ±2 frames — the reference's ~4.5 visible frames.
export const RADIUS = 7.2;
// MUST derive: arc length per frame has to equal the frame pitch exactly,
// otherwise gaps/overlaps appear at the seams.
export const FRAME_ANGLE = PITCH / RADIUS;

// --- Film path shape (see sampleFilmCurve) -------------------------------
// Heading at which the arc stops turning and hands off to a straight run.
// This is the constant that stops the strip being a circular loop: past this
// angle the film stops curling back and instead recedes forever, forming the
// background tails. Raise it for more curl, lower it for a flatter run-off.
//   1.20 rad ≈ 69°  →  arc covers ±1.97 frames, tails foreshorten to ~36%,
//   so background frames still show readable content instead of edge-on
//   slivers. Past ~1.55 (89°) the tails start curling back inward and the
//   cylinder look returns.
export const CURVE_THETA_MAX = 0.98;
// The wave. Amplitude in world units, wavelength in world units of film.
// Tuned to the reference silhouette: one full S across the visible span
// (spatial period 2π·L ≈ 22 world units — valley left of centre, crest right),
// with the hero frame sitting on the inflection at a ~12° slope, which is the
// steep mid-crossing the reference has. A/L ≈ 0.21 costs ~2% arc-length
// stretch on the steep sections (bounded in filmCurve.check.ts §1); seams stay
// exact regardless because the curve is a pure function of s.
export const WAVE_AMPLITUDE = 0.72;
export const WAVE_LENGTH = 3.5;
// The Z-roll: right end rides high, left end low. Flip sign if mirrored.
// Smaller than it was — the wave now supplies most of the diagonal drama.
export const GROUP_ROTATION_Z = 0.02;
export const GROUP_ROTATION_X = -0.03;
// Perforation rhythm. 20 holes per cell rendered small and dense, which reads
// as texture rather than as sprockets once the strip is more than a couple of
// cells from the camera. Real 35mm is chunky: fewer, larger holes with gaps of
// roughly the same width. HOLE_SIZE_RATIO is hole width as a fraction of the
// hole pitch — at 0.62 the holes are slightly wider than the gaps between them.
export const HOLES_PER_FRAME = 13;
export const HOLE_SIZE_RATIO = 0.62;
export const HOLE_CORNER_RATIO = 0.18; // corner radius as a fraction of size

// There is deliberately no panel sheen constant here any more. A Blinn term on
// a FLAT panel is a constant added to every texel, not a moving highlight, so
// it read as a white veil over whichever cell faced the camera — the selected
// one. filmCurve.check.ts asserts the panel shader stays free of it.
//
// Key light direction for the scene's directional light.
export const PANEL_LIGHT_DIR: readonly [number, number, number] = [0.6, 1.4, 6];

// Framing is set by the reference: centre frame ≈ 32% of viewport width,
// ~4.5 frames visible. At cameraZ 7.5 / fov 42 the visible width at the strip
// apex is ~10.2 world units, so FRAME_WIDTH 3.0 lands at ~29%; the promotion
// below carries it the rest of the way. Pulling the camera closer or
// narrowing the FOV is what made this read oversized — change both together.
// `tail` = how many frames each side stay rendered. This is no longer a
// hero-region cull — it is how much receding film forms the background, so it
// wants to be generous. Frames fade to zero by the tail limit, which is also
// what hides the wrap when the set is longer than the tail.
// cameraZ pulled back ~20% from the original framing: the strip reads as an
// object inside the viewport rather than filling it.
export const BREAKPOINTS = {
  desktop: { cameraZ: 8.2, fov: 34, tail: 9, sensitivity: 1.95 },
  tablet: { cameraZ: 11, fov: 37, tail: 7, sensitivity: 2.15 },
  mobile: { cameraZ: 8.6, fov: 45, tail: 5, sensitivity: 2.29 },
} as const;
export type BreakpointName = keyof typeof BREAKPOINTS;

// Physics (units are carousel frames; per-frame at 60fps, frame-rate
// normalised in the integrator)
export const MOMENTUM_DECAY = 0.955;
export const SNAP_STIFFNESS = 0.08;
export const SNAP_DAMPING = 0.75;
export const FLICK_VELOCITY = 0.005; // units/frame above which release keeps momentum for seamless gliding
export const MOMENTUM_HANDOFF = 0.015; // below this, momentum hands off to the snap spring
export const MAX_VELOCITY = 0.45; // cap for smooth high-speed glide
<<<<<<< HEAD
// Wheel input is normalised into whole notches by lib/wheelStepper, which the
// events archive shares; a notch is then aimed at a landing frame by glideBy,
// so the reel still travels on momentum. Its tunables live with that module.
=======
export const WHEEL_SENSITIVITY = 0.00055; // wheel px → velocity injection
>>>>>>> 968839f771d847688d4fe2b18f6c13b8f23dcca6

// --- Active/hover frame promotion ----------------------------------------
// The selected cell reads as forward through DEPTH AND LIGHT, not scale.
// That is not a style preference, it is a hard geometric bound: the image
// panel lives inside the film's gate, and growing it in plane runs it into
// the neighbouring cell at just 1.037x (3.0 wide panel, 3.11 pitch). Scale
// can therefore never be the thing that makes the selection pop — it is worth
// at most 3.6%, and past that the photo spills over the black separator.
// filmCurve.check.ts asserts the bound, including the spring's overshoot.
//
// So the pop is built from: a real Z lift off the film plane (unbounded, and
// it brings genuine parallax), a brightness lift past the film's own level, a
// contact shadow that grounds it, and everything else losing contrast.
// The selected cell is NEVER brightened past its natural exposure. Contrast
// comes entirely from the other cells giving some up. This is not a stylistic
// preference either: the panel is flat and faces the camera head-on, so any
// additive light lands on every texel equally — it floods the photo instead of
// modelling it, and the image washes out to flat grey. You cannot blow out
// what you never brighten.
export const ACTIVE_SCALE_BOOST = 0.024; // ~1.026x at peak — under the 1.037 gate bound
export const PROMOTE_LIFT = 0.13; // lift off the film plane, world units
export const NEIGHBOUR_DIM = 0.42; // contrast the unselected cells give up
export const HOVER_PROMOTE = 0.55; // hovered non-active frames get 55% promotion
export const SHADOW_MAX_OPACITY = 0.55; // contact shadow under a promoted frame
// Promotion runs on a spring rather than an exponential damp, because "pop"
// is overshoot and an exponential approach cannot overshoot by construction.
// zeta ~= 0.61 -> ~8% overshoot, settled in ~0.5s.
export const PROMOTE_STIFFNESS = 170;
export const PROMOTE_DAMPING = 16;
// Hard bound: the image panel sits inside the film's gate, so at peak
// overshoot it must still clear the black separator horizontally and the
// sprocket holes vertically. Asserted in filmCurve.check.ts.
export const GATE_CLEARANCE = 0.995; // fraction of the gate the panel may use

// Velocity-based shader distortion (uVelocity is velocity / MAX_VELOCITY)
export const DISTORT_STRETCH = 0.04; // max horizontal stretch at peak velocity
export const DISTORT_SKEW = 0.06; // max shear (fraction of frame width)
export const DISTORT_LAMBDA = 7; // how fast the uniform eases to rest

// Atmospheric perspective. The tails recede for good, so dim/desaturate are
// driven by how far back the frame sits (world units of -Z) rather than by
// angle — distant film sinks into the background gradient like haze.
// Calibrated against the frame depths the current curve actually produces:
// ±2 sits at z≈-2.5 (still bright), ±3 at -5, ±5 at -10. The range has to be
// near that last figure or the tips stay lit and read as bright edge-on
// slivers instead of sinking into the gradient.
export const DEPTH_FADE_RANGE = 11; // -Z at which dim/desat reach maximum
export const DIM_MAX = 0.72; // brightness loss at full depth
export const SAT_MAX = 0.8; // saturation loss at full depth
export const DEPTH_ALPHA = 0.55; // alpha lost at full depth (never fully gone)
// Wrap fade, as a fraction of n/2. Frames must reach alpha 0 before they
// teleport across the wrap seam, or the jump is visible now that the tails
// are no longer culled.
export const WRAP_FADE_START = 0.78;
export const WRAP_FADE_END = 0.96;

// Cinematic expansion
export const EXPAND_DISTANCE = 2.2; // world units in front of the camera
export const EXPAND_FILL = 0.94; // fraction of the viewport the frame fills
export const EXPAND_LAMBDA = 6.5; // exp-damp rate: ~0.5s out, fully interruptible — this is a menu, not a film
export const STRIP_RECEDE = 1.3; // how far the rest of the strip drops back on Z

// --- Entrance ------------------------------------------------------------
// The strip arrives from depth and unwinds rather than fading in. `intro`
// damps 0→1; at lambda 4.5 it covers ~80% in the first 350ms and is visually
// settled by ~0.9s — front-loaded, and quick enough that the menu never feels
// like it is still arriving when the user wants to click.
export const INTRO_LAMBDA = 4.5;
export const INTRO_Z = 22; // how far back the strip starts, world units
export const INTRO_SPIN = 2.3; // radians of unwind about the vertical axis
export const INTRO_DISTORT = 1.5; // extra velocity-distortion during entrance

// --- Cinematic camera ----------------------------------------------------
// Deliberately tiny. The camera must read as "breathing with the object",
// never as an effect of its own — past ~0.5 world units of sway the strip
// starts to swim inside the frame.
export const CAM_POINTER_X = 0.42; // world units of sway at the screen edge
export const CAM_POINTER_Y = 0.24;
export const CAM_VELOCITY_LAG = 1.5; // camera trails a fast scroll
export const CAM_ROLL = 0.022; // radians of roll from pointer + velocity
export const CAM_DRIFT = 0.055; // idle breathing amplitude
export const CAM_EXPAND_PUSH = 0.55; // dolly-in while a frame expands
export const CAM_LAMBDA = 2.6; // damp rate — slow enough to feel like mass

// --- Scene compositor (lens distortion + previous-scene transitions) ------
// The compositor sits at the head of the post chain. Lens strength is the sum
// of three channels, each with its own driver, so the glass reads as reacting
// to the reel rather than as a permanent warp.
export const LENS_BASE = 0.05; // ever-present barrel — the "glass" in front of the scene
export const LENS_VELOCITY = 0.06; // extra at full reel speed
export const LENS_TRANSITION = 0.1; // extra at a scene-change peak
// Scene changes capture the outgoing frame into a render target and blend it
// over the incoming state while it departs (zooms past the lens, shears with
// travel). Lambda 3.2 ≈ visually settled in ~1s — the "major cinematic
// transition" register, while the expansion itself stays at ~0.5s.
export const TRANSITION_LAMBDA = 3.2;
export const TRANSITION_ZOOM = 0.14; // how far the departing scene inflates
export const TRANSITION_DISPLACE = 0.12; // directional shear from reel velocity
export const TRANSITION_SEP = 0.0045; // chromatic separation of the departing scene
// A one-frame advance already animates continuously; the texture blend is for
// discrete jumps where the reel state teleports several frames at once.
export const TRANSITION_JUMP_MIN = 2;
export const COMPOSITOR_VEL_LAMBDA = 4; // easing on the compositor's velocity copy

// --- Environment ---------------------------------------------------------
// Parallax factors per background layer (the reel itself is 1.0).
export const ENV_PARALLAX_FAR = 0.1;
export const ENV_PARALLAX_MID = 0.2;
export const ENV_PARALLAX_NEAR = 0.35;
export const ENV_PLANE_Z = -22; // backdrop depth; strip tails reach ~-14
export const ENV_GLOW_LAMBDA = 3.5; // how fast the reel's light bleed follows it
// Backdrop oversize. Must exceed the camera rig's worst-case excursion or an
// edge of the plane comes into shot — asserted in filmCurve.check.ts.
// Sized by the narrow-portrait case: the plane's half-width is half-height x
// aspect, so a phone held upright gets the least absolute margin out of the
// same multiplier while the sway and roll terms are unchanged. Costs nothing —
// the extra area is off-frustum and clipped before rasterisation.
export const ENV_OVERSCAN = 1.4;
