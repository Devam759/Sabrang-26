"use client";

import { useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import gsap from "gsap";
import * as THREE from "three";

interface PlaneProps {
  texture: string;
  width: number;
  height: number;
  active: boolean | null;
  [key: string]: any;
}

const Plane = ({ texture, width, height, active, ...props }: PlaneProps) => {
  const $mesh = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();
  const tex = useTexture(texture);

  useEffect(() => {
    if ($mesh.current && $mesh.current.material) {
      const mat = $mesh.current.material as THREE.ShaderMaterial;

      const vpW =
        viewport.width && Number.isFinite(viewport.width) && viewport.width > 0
          ? viewport.width
          : 1;
      const vpH =
        viewport.height && Number.isFinite(viewport.height) && viewport.height > 0
          ? viewport.height
          : 1;
      const safeW = width && Number.isFinite(width) && width > 0 ? width : 0.72;
      const safeH = height && Number.isFinite(height) && height > 0 ? height : 1.8;

      mat.uniforms.uZoomScale.value.x = vpW / safeW;
      mat.uniforms.uZoomScale.value.y = vpH / safeH;

      gsap.to(mat.uniforms.uProgress, {
        value: active ? 1 : 0,
        duration: 2.5,
        ease: "power3.out",
      });

      gsap.to(mat.uniforms.uRes.value, {
        x: active ? vpW : safeW,
        y: active ? vpH : safeH,
        duration: 2.5,
        ease: "power3.out",
      });
    }
  }, [viewport, active, width, height]);

  const shaderArgs = useMemo(
    () => ({
      uniforms: {
        uProgress: { value: 0 },
        uZoomScale: { value: new THREE.Vector2(1, 1) },
        uTex: { value: tex },
        uContain: { value: texture.includes("jklu") ? 1.0 : 0.0 },
        uFlipX: { value: texture.toLowerCase().includes("satvik") ? 1.0 : 0.0 },
        uRes: { value: new THREE.Vector2(width, height) },
        uImageRes: {
          value: new THREE.Vector2(
            tex.image ? (tex.image as any).width || 1000 : 1000,
            tex.image ? (tex.image as any).height || 1000 : 1000,
          ),
        },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        uniform float uProgress;
        uniform vec2 uZoomScale;

        void main() {
          vUv = uv;
          vec3 pos = position;
          float angle = uProgress * 3.14159265 / 2.;
          float wave = cos(angle);
          float c = sin(length(uv - .5) * 15. + uProgress * 12.) * .5 + .5;
          pos.x *= mix(1., uZoomScale.x + wave * c, uProgress);
          pos.y *= mix(1., uZoomScale.y + wave * c, uProgress);

          gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uTex;
        uniform vec2 uRes;
        uniform vec2 uZoomScale;
        uniform vec2 uImageRes;
        uniform float uContain;
        uniform float uFlipX;

        vec2 CoverUV(vec2 u, vec2 s, vec2 i) {
          float rs = s.x / s.y;
          float ri = i.x / i.y;
          vec2 st = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x);
          vec2 o = (rs < ri ? vec2((st.x - s.x) / 2.0, 0.0) : vec2(0.0, st.y - s.y)) / st;
          return u * s / st + o;
        }

        vec2 ContainUV(vec2 u, vec2 s, vec2 i) {
          float rs = s.x / s.y;
          float ri = i.x / i.y;
          vec2 st = rs > ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x);
          vec2 o = (rs > ri ? vec2((st.x - s.x) / 2.0, 0.0) : vec2(0.0, st.y - s.y)) / st;
          return u * s / st + o;
        }

        varying vec2 vUv;
        void main() {
          vec2 currentUv = vUv;
          if (uFlipX > 0.5) {
            currentUv.x = 1.0 - currentUv.x;
          }
          vec2 uvCover = CoverUV(currentUv, uRes, uImageRes);
          vec2 uvContain = ContainUV(currentUv, uRes, uImageRes);
          vec2 uv = mix(uvCover, uvContain, uContain);

          vec3 texColor = vec3(0.0);
          if (uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0) {
            texColor = texture2D(uTex, uv).rgb;
          }

          gl_FragColor = vec4( texColor, 1.0 );
        }
      `,
    }),
    [tex, texture, width, height],
  );

  return (
    <mesh ref={$mesh} {...props}>
      <planeGeometry args={[width || 0.72, height || 1.8, 30, 30]} />
      <shaderMaterial args={[shaderArgs]} />
    </mesh>
  );
};

export default Plane;
