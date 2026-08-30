'use client'

import React, { useMemo, useRef, useState } from 'react'
import { Text, RenderTexture, OrthographicCamera } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { heroConfig } from '@/components/3d/hero/heroConfig'
import { heroInput, heroScrollState } from '@/components/3d/hero/heroScrollState'
import type { HeroQuality } from '@/components/3d/hero/heroTier'

const FONT = '/fonts/FlorasDisplay.ttf'

/* ==================================================================
 * VOLUMETRIC LIGHT / SHADOW PASS  (port of the VFX-JS `h1` shader)
 *
 * A quad sitting just behind the letters. `src` is the same word
 * rendered white-on-black into an off-screen target, so the march
 * from each pixel toward the cursor accumulates letter coverage —
 * that accumulation is the shadow, and the spectrum of it is the
 * rainbow bleed around the glyph edges.
 * ================================================================== */

const FX_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FX_FRAG = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  uniform sampler2D src;
  uniform vec2 uMouse;      // cursor in this quad's 0..1 space
  uniform float uAspect;
  uniform float uIntensity;
  uniform float uBlur;      // mip bias for the occlusion read

  #define PI 3.141593
  #define SAMPLES 32.

  vec4 readTex(vec2 uv) {
    if (uv.x < 0. || uv.x > 1. || uv.y < 0. || uv.y > 1.) { return vec4(0); }
    return texture2D(src, uv);
  }

  // Blurred read of the same mask. The original jittered each march step to
  // hide the low sample count, which is exactly the grain we do not want —
  // sampling a mip level instead makes the occlusion field smooth, so a plain
  // uniform march resolves it cleanly with no noise at all.
  float readSoft(vec2 uv) {
    if (uv.x < 0. || uv.x > 1. || uv.y < 0. || uv.y > 1.) { return 0.; }
    return texture2D(src, uv, uBlur).r;
  }
  vec3 spectrum(float x) {
    return cos((x - vec3(0, .5, 1)) * vec3(.6, 1., .5) * PI);
  }

  void main() {
    vec2 uv = vUv;
    if (readTex(uv).r > 0.5) { discard; }

    vec2 p = uv * 2. - 1.;
    p.x *= uAspect;

    vec2 mp = uMouse * 2. - 1.;
    mp.x *= uAspect;

    vec2 rp = p;
    vec2 d = (mp - p) / SAMPLES;
    float acc = 0.;

    for (float i = 0.; i < SAMPLES; i++) {
      rp += d;
      vec2 uv2 = rp;
      uv2.x /= uAspect;
      uv2 = uv2 * 0.5 + 0.5;
      acc += readSoft(uv2) / SAMPLES;
    }

    // Light. Same falloff shape as the original, damped — it sat on a plain
    // page, here it is additive over a lit chamber that must stay readable.
    float lm = length(p - mp);
    vec4 c = vec4(smoothstep(0., 1., pow(.1 / lm, .2))) * 0.42;

    c -= acc;                                              // shadow
    c += vec4(spectrum(cos(acc * 3.5)), 1) * acc * 2.5;    // rainbow

    // The quad is finite; fade its border so it has no visible edge.
    vec2 e = smoothstep(vec2(0.0), vec2(0.02), uv) * smoothstep(vec2(1.0), vec2(0.98), uv);

    // Written straight into the linear HDR buffer, so undo the sRGB the
    // original shader assumed it was writing to.
    vec3 col = pow(max(c.rgb, 0.0), vec3(2.2));
    gl_FragColor = vec4(col * uIntensity * e.x * e.y, 1.0);
  }
`

export default function HeroTypography({ mobile = false, q }: { mobile?: boolean; q: HeroQuality }) {
  const { size } = useThree()
  const [maskFrames, setMaskFrames] = useState(Infinity)
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)
  const groupRef = useRef<THREE.Group>(null)
  const innerRef = useRef<THREE.Group>(null)
  const fxRef = useRef<THREE.Mesh>(null)

  // Inter Black is wider than the previous face, so the ratio is retuned to keep
  // SABRANG spanning roughly the same share of the viewport as before.
  const vFov = (heroConfig.cameraFOV * Math.PI) / 180
  const baseHeight = 2 * Math.tan(vFov / 2) * heroConfig.cameraDistance
  const baseWidth = baseHeight * (size.width / size.height)

  const fontSize = Math.min(baseWidth * (mobile ? 0.16 : 0.12), 8.5)
  const M = 4 // Multiplier to expand the bleed area
  const fxW = fontSize * 7.2 * M
  const fxH = fontSize * 3.6 * M

  const fxUniforms = useMemo(
    () => ({
      src: { value: null as THREE.Texture | null },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uAspect: { value: 7.2 / 3.6 },
      uBlur: { value: 2.6 },
      uIntensity: { value: 0 }
    }),
    []
  )

  const pick = useRef({
    raycaster: new THREE.Raycaster(),
    plane: new THREE.Plane(),
    ndc: new THREE.Vector2(),
    hit: new THREE.Vector3(),
    normal: new THREE.Vector3(),
    origin: new THREE.Vector3()
  })

  useFrame((state, delta) => {
    if (!innerRef.current || !groupRef.current || !materialRef.current) return

    const rawProgress = heroScrollState.progress
    // Normalize progress so the typography animation completes by 30% of scroll
    const p = THREE.MathUtils.clamp(rawProgress, 0, 0.3) / 0.3

    // PHASE 3 & 4: Map scroll progress to targets
    let targetZ = -2
    let targetScale = 1
    let targetOpacity = 1

    if (p <= 0.88) {
      targetZ = THREE.MathUtils.mapLinear(p, 0, 0.88, -2, -21)
      targetScale = THREE.MathUtils.mapLinear(p, 0, 0.88, 1, 0.7)
    } else {
      targetZ = -21
      targetScale = 0.7
    }

    if (p < 0.25) {
      targetOpacity = THREE.MathUtils.mapLinear(p, 0, 0.25, 1, 0.85)
    } else if (p < 0.50) {
      targetOpacity = THREE.MathUtils.mapLinear(p, 0.25, 0.50, 0.85, 0.50)
    } else if (p < 0.70) {
      targetOpacity = THREE.MathUtils.mapLinear(p, 0.50, 0.70, 0.50, 0.22)
    } else if (p <= 0.88) {
      targetOpacity = THREE.MathUtils.mapLinear(p, 0.70, 0.88, 0.22, 0)
    } else {
      targetOpacity = 0
    }

    // Damped interpolation for physical feel
    groupRef.current.position.z = THREE.MathUtils.damp(groupRef.current.position.z, targetZ, 4, delta)
    innerRef.current.scale.setScalar(THREE.MathUtils.damp(innerRef.current.scale.x, targetScale, 4, delta))
    materialRef.current.opacity = THREE.MathUtils.damp(materialRef.current.opacity, targetOpacity, 6, delta)

    // Very subtle idle float. Lives on the shared group so the glow quad tracks
    // the letters exactly — otherwise the shadows drift off the glyphs.
    innerRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1

    const fx = fxRef.current
    if (!fx) return

    fx.scale.set(fxW, fxH, 1)

    // R3F copies the `uniforms` prop onto the material, so the live uniforms
    // are the material's own — writing to the memoised object does nothing.
    const u = (fx.material as THREE.ShaderMaterial).uniforms

    // Cursor -> quad UV. Ray/plane rather than a flat NDC map, because the
    // camera itself drifts with the pointer and the quad recedes on scroll.
    const { raycaster, plane, ndc, hit, normal, origin } = pick.current
    raycaster.setFromCamera(ndc.set(heroInput.x, heroInput.y), state.camera)
    fx.getWorldPosition(origin)
    plane.setFromNormalAndCoplanarPoint(normal.set(0, 0, 1), origin)
    if (raycaster.ray.intersectPlane(plane, hit)) {
      fx.worldToLocal(hit)
      const m = u.uMouse.value as THREE.Vector2
      m.x = THREE.MathUtils.damp(m.x, hit.x + 0.5, 12, delta)
      m.y = THREE.MathUtils.damp(m.y, hit.y + 0.5, 12, delta)
    }

    u.uIntensity.value = heroConfig.textGlow * materialRef.current.opacity
    u.uBlur.value = heroConfig.textBlur
  })

  return (
    <group ref={groupRef} position={[0, 0, -2]}>
      <group ref={innerRef}>
        {/* ponytail: hover-only effect, so it is skipped on coarse pointers -- and
            its 32-tap march per pixel is dropped entirely on the low tier. */}
        {!mobile && q.textGlow && (
          <mesh ref={fxRef} renderOrder={9}>
            <planeGeometry args={[1, 1]} />
            <shaderMaterial
              vertexShader={FX_VERT}
              fragmentShader={FX_FRAG}
              uniforms={fxUniforms}
              transparent
              depthTest={false}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            >
              <RenderTexture attach="uniforms-src-value" width={2048} height={1024} samples={0} generateMipmaps
                frames={maskFrames} minFilter={THREE.LinearMipmapLinearFilter}>
                <color attach="background" args={['#000000']} />
                {/* Unit framing, not fxW/fxH: identical image, never invalidated by a resize. */}
                <OrthographicCamera
                  makeDefault
                  left={-3.6 * M}
                  right={3.6 * M}
                  top={1.8 * M}
                  bottom={-1.8 * M}
                  near={0.1}
                  far={10}
                  position={[0, 0, 5]}
                />
                <Text
                  font={FONT}
                  fontSize={1}
                  letterSpacing={0.1}
                  anchorX="center"
                  anchorY="middle"
                  onSync={() => setMaskFrames(3)}
                >
                  {"SABRANG'26"}
                  <meshBasicMaterial color="#ffffff" toneMapped={false} />
                </Text>
              </RenderTexture>
            </shaderMaterial>
          </mesh>
        )}

        <Text
          renderOrder={10}
          font={FONT}
          fontSize={fontSize}
          letterSpacing={0.1}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {"SABRANG'26"}
          <meshBasicMaterial
            ref={materialRef}
            color="#ffffff"
            transparent={true}
            opacity={1}
            depthTest={false}
            depthWrite={false}
            toneMapped={false}
          />
        </Text>
      </group>
    </group>
  )
}
