"use client";

import { useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useAspect } from "@react-three/drei";
import * as THREE from "three";
import { useInteraction } from "@/components/InteractionContext";

const videoVertex = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const videoFragment = `
uniform sampler2D tVideo;
uniform float uTintMix;
uniform vec3 uHoverColor;
uniform float uTime;
uniform float uVelocity;
uniform float uGlitchMultiplier;
uniform vec2 uMouse;
uniform vec2 uResolution;
uniform vec2 uVideoResolution;
varying vec2 vUv;

float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main() {
  vec2 uv = vUv;
  
  // Object-fit: cover logic
  float aspectResolution = uResolution.x / max(1.0, uResolution.y);
  float aspectVideo = uVideoResolution.x / max(1.0, uVideoResolution.y);
  
  if (aspectResolution > aspectVideo) {
    uv.y = uv.y * (aspectVideo / aspectResolution) + (1.0 - (aspectVideo / aspectResolution)) / 2.0;
  } else {
    uv.x = uv.x * (aspectResolution / aspectVideo) + (1.0 - (aspectResolution / aspectVideo)) / 2.0;
  }
  
  // Base Nebula slow distortion
  uv.x += sin(uv.y * 10.0 + uTime * 0.5) * 0.002;
  
  // Liquid Ripple Displacement
  vec2 mouseUv = uMouse * 0.5 + 0.5;
  vec2 diff = uv - mouseUv;
  diff.x *= aspectResolution; 
  float dist = length(diff);
  
  if (dist < 0.3) {
    float ripple = sin((dist - uTime * 0.2) * 40.0) * (0.3 - dist) * 0.05;
    uv += diff * ripple;
  }

  // AGGRESSIVE GLITCH (Velocity + Hover Spikes)
  float totalGlitch = max(uVelocity * 0.8, uGlitchMultiplier);
  
  if (totalGlitch > 0.01) {
    float block = floor(uv.y * 15.0);
    float noise = rand(vec2(block, floor(uTime * 24.0)));
    
    if (noise > 0.6) {
      uv.x += (rand(vec2(uTime, block)) - 0.5) * 0.15 * totalGlitch;
    }
  }

  // RGB Split / Chromatic Aberration
  float splitOffset = 0.003 + totalGlitch * 0.035;
  vec4 colorR = texture2D(tVideo, uv + vec2(splitOffset, 0.0));
  vec4 colorG = texture2D(tVideo, uv);
  vec4 colorB = texture2D(tVideo, uv - vec2(splitOffset, 0.0));
  
  vec3 videoColor = vec3(colorR.r, colorG.g, colorB.b);
  
  // Atmospheric Tint & Color Grading
  vec3 mappedColor = videoColor * vec3(0.6, 0.45, 0.85); // Neon Night base tint
  
  // Dynamically map hover states to vibrant festival accents
  vec3 finalColor = mix(mappedColor, mappedColor * uHoverColor * 3.0, uTintMix);
  
  // Brightness Flash during glitch
  finalColor += vec3(totalGlitch * 0.6);
  
  gl_FragColor = vec4(finalColor, 1.0);
}
`;

function VideoBackground() {
  const { hoverState } = useInteraction();
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const textureRef = useRef<THREE.VideoTexture | null>(null);
  const lastScrollY = useRef(0);
  const scrollVelocity = useRef(0);
  const glitchIntensity = useRef(0);
  const lastHoverState = useRef(hoverState);

  const scale = useAspect(1920, 1080, 1);

  const { shaderMat, video, texture } = useMemo(() => {
    let vid: HTMLVideoElement | null = null;
    let tex: THREE.VideoTexture | null = null;

    if (typeof document !== "undefined") {
      vid = document.createElement("video");
      vid.src = "https://res.cloudinary.com/eprhemvt/video/upload/v1787060394/sabrang-2026/videos/background.mp4";
      vid.crossOrigin = "anonymous";
      vid.loop = true;
      vid.muted = true;
      vid.defaultMuted = true;
      vid.autoplay = true;
      vid.playsInline = true;
      vid.preload = "auto";
      vid.setAttribute("muted", "");
      vid.setAttribute("playsinline", "");
      vid.setAttribute("webkit-playsinline", "");
      vid.style.display = "none";
      document.body.appendChild(vid);

      tex = new THREE.VideoTexture(vid);
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.format = THREE.RGBAFormat;
      tex.colorSpace = THREE.SRGBColorSpace;
    }

    const mat = new THREE.ShaderMaterial({
      vertexShader: videoVertex,
      fragmentShader: videoFragment,
      uniforms: {
        tVideo: { value: tex },
        uTime: { value: 0 },
        uTintMix: { value: 0 },
        uVelocity: { value: 0 },
        uGlitchMultiplier: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uHoverColor: { value: new THREE.Color("#ff0a54") },
        uResolution: { value: new THREE.Vector2(1920, 1080) },
        uVideoResolution: { value: new THREE.Vector2(1920, 1080) },
      },
      depthWrite: false,
    });

    return { shaderMat: mat, video: vid, texture: tex };
  }, []);

  useEffect(() => {
    videoRef.current = video;
    textureRef.current = texture;
    materialRef.current = shaderMat;

    if (!video) return;

    const tryPlay = () => {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay policy fallback on user interaction
        });
      }
    };

    video.addEventListener("loadeddata", () => {
      if (textureRef.current) textureRef.current.needsUpdate = true;
      tryPlay();
    });

    tryPlay();

    const onInteraction = () => {
      if (video && video.paused) {
        tryPlay();
      }
    };

    window.addEventListener("click", onInteraction, { passive: true });
    window.addEventListener("touchstart", onInteraction, { passive: true });
    window.addEventListener("scroll", onInteraction, { passive: true });

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      scrollVelocity.current = Math.abs(currentScrollY - lastScrollY.current);
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("click", onInteraction);
      window.removeEventListener("touchstart", onInteraction);
      window.removeEventListener("scroll", onInteraction);
      video.pause();
      if (video.parentNode) video.parentNode.removeChild(video);
      texture?.dispose();
      shaderMat.dispose();
    };
  }, [video, texture, shaderMat]);

  // Trigger glitch spike on hover state change
  useEffect(() => {
    if (hoverState !== lastHoverState.current) {
      if (hoverState !== "idle") {
        glitchIntensity.current = 1.0;
      }
      lastHoverState.current = hoverState;
    }
  }, [hoverState]);

  useFrame((state) => {
    if (!materialRef.current) return;
    const mat = materialRef.current;
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uResolution.value.set(state.size.width, state.size.height);

    if (videoRef.current && videoRef.current.readyState >= 2 && textureRef.current) {
      textureRef.current.needsUpdate = true;
    }

    // Decay velocity
    scrollVelocity.current = THREE.MathUtils.lerp(
      scrollVelocity.current,
      0,
      0.1,
    );
    mat.uniforms.uVelocity.value = THREE.MathUtils.lerp(
      mat.uniforms.uVelocity.value,
      Math.min(scrollVelocity.current * 0.05, 1.0),
      0.1,
    );

    // Decay hover glitch
    glitchIntensity.current = THREE.MathUtils.lerp(
      glitchIntensity.current,
      0,
      0.05,
    );
    mat.uniforms.uGlitchMultiplier.value = glitchIntensity.current;

    // Mouse tracking
    mat.uniforms.uMouse.value.x = THREE.MathUtils.lerp(
      mat.uniforms.uMouse.value.x,
      state.mouse.x,
      0.1,
    );
    mat.uniforms.uMouse.value.y = THREE.MathUtils.lerp(
      mat.uniforms.uMouse.value.y,
      state.mouse.y,
      0.1,
    );

    const isHovered = hoverState !== "idle";
    mat.uniforms.uTintMix.value = THREE.MathUtils.lerp(
      mat.uniforms.uTintMix.value,
      isHovered ? 0.9 : 0.0,
      0.05,
    );

    // Purple (Panache), Magenta (Bandjam), Electric Yellow (Step-Up)
    const targetColor = new THREE.Color(
      hoverState === "primary"
        ? "#9d4edd"
        : hoverState === "secondary"
          ? "#FF00FF"
          : hoverState === "tertiary"
            ? "#FFFF00"
            : "#9d4edd",
    );
    mat.uniforms.uHoverColor.value.lerp(targetColor, 0.1);
  });

  const safeScale: [number, number, number] = useMemo(() => {
    if (Array.isArray(scale) && !isNaN(scale[0]) && !isNaN(scale[1])) {
      return scale as [number, number, number];
    }
    return [1, 1, 1];
  }, [scale]);

  return (
    <mesh position={[0, 0, 0]} scale={safeScale}>
      <planeGeometry args={[1, 1]} />
      <primitive object={shaderMat} attach="material" />
    </mesh>
  );
}

export default function ThreeBackground() {
  return (
    <div className="fixed inset-0 z-0 w-full h-full bg-[#030005] pointer-events-none overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 45 }}
        dpr={[1, 1.25]}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.domElement?.addEventListener("webglcontextlost", (e) =>
            e.preventDefault()
          );
        }}
      >
        <VideoBackground />
      </Canvas>
    </div>
  );
}
