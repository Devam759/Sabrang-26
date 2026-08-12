'use client';

import { useRef, useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useAspect } from '@react-three/drei';
import * as THREE from 'three';
import { useInteraction } from '@/components/InteractionContext';

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
  float aspectResolution = uResolution.x / uResolution.y;
  float aspectVideo = uVideoResolution.x / uVideoResolution.y;
  
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
  float totalGlitch = max(uVelocity, uGlitchMultiplier);
  if (totalGlitch > 0.05) {
    float glitchOffset = rand(vec2(floor(uv.y * 15.0), uTime)) * totalGlitch * 0.5;
    if (rand(vec2(uTime, uv.y)) > 0.6) { // higher probability of glitch when triggered
      uv.x += glitchOffset;
      uv.y += glitchOffset * 0.1;
    }
  }
  
  // Chromatic Aberration
  float caSpread = totalGlitch * 0.05;
  float r = texture2D(tVideo, vec2(uv.x + caSpread, uv.y)).r;
  float g = texture2D(tVideo, uv).g;
  float b = texture2D(tVideo, vec2(uv.x - caSpread, uv.y)).b;
  
  vec3 texColor = vec3(r, g, b);
  vec3 mappedColor = texColor;
  
  // Aggressive Color Mix
  vec3 finalColor = mix(mappedColor, mappedColor * uHoverColor * 3.0, uTintMix);
  
  // Brightness Flash during glitch
  finalColor += vec3(totalGlitch * 0.6);
  
  gl_FragColor = vec4(finalColor, 1.0);
}
`;

function VideoBackground() {
  const { hoverState } = useInteraction();
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const lastScrollY = useRef(0);
  const scrollVelocity = useRef(0);
  const glitchIntensity = useRef(0);
  const lastHoverState = useRef(hoverState);
  
  const scale = useAspect(1920, 1080, 1);
  
  useEffect(() => {
    const video = document.createElement('video');
    video.src = '/background.mp4';
    video.crossOrigin = 'Anonymous';
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.style.display = 'none';
    document.body.appendChild(video);
    
    video.play().then(() => {
      const texture = new THREE.VideoTexture(video);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.format = THREE.RGBAFormat;
      if (materialRef.current) materialRef.current.uniforms.tVideo.value = texture;
    }).catch(e => console.warn(e));

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      scrollVelocity.current = Math.abs(currentScrollY - lastScrollY.current);
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      video.pause();
      if (video.parentNode) video.parentNode.removeChild(video);
    };
  }, []);

  const shaderMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: videoVertex,
    fragmentShader: videoFragment,
    uniforms: {
      tVideo: { value: null },
      uTime: { value: 0 },
      uTintMix: { value: 0 },
      uVelocity: { value: 0 },
      uGlitchMultiplier: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uHoverColor: { value: new THREE.Color('#ff0a54') },
      uResolution: { value: new THREE.Vector2(1920, 1080) }, // fallback
      uVideoResolution: { value: new THREE.Vector2(1920, 1080) },
    },
    depthWrite: false,
  }), []);

  useEffect(() => {
    materialRef.current = shaderMat;
    return () => shaderMat.dispose();
  }, [shaderMat]);

  // Trigger glitch spike on hover state change
  useEffect(() => {
    if (hoverState !== lastHoverState.current) {
      if (hoverState !== 'idle') {
        glitchIntensity.current = 1.0; // Huge glitch spike
      }
      lastHoverState.current = hoverState;
    }
  }, [hoverState]);

  useFrame((state) => {
    if (!materialRef.current) return;
    const mat = materialRef.current;
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    
    mat.uniforms.uResolution.value.set(state.size.width, state.size.height);
    
    // Decay velocity
    scrollVelocity.current = THREE.MathUtils.lerp(scrollVelocity.current, 0, 0.1);
    mat.uniforms.uVelocity.value = THREE.MathUtils.lerp(mat.uniforms.uVelocity.value, Math.min(scrollVelocity.current * 0.05, 1.0), 0.1);

    // Decay hover glitch
    glitchIntensity.current = THREE.MathUtils.lerp(glitchIntensity.current, 0, 0.05);
    mat.uniforms.uGlitchMultiplier.value = glitchIntensity.current;

    // Mouse tracking
    mat.uniforms.uMouse.value.x = THREE.MathUtils.lerp(mat.uniforms.uMouse.value.x, state.mouse.x, 0.1);
    mat.uniforms.uMouse.value.y = THREE.MathUtils.lerp(mat.uniforms.uMouse.value.y, state.mouse.y, 0.1);

    const isHovered = hoverState !== 'idle';
    mat.uniforms.uTintMix.value = THREE.MathUtils.lerp(mat.uniforms.uTintMix.value, isHovered ? 0.9 : 0.0, 0.05);

    // Purple (Panache), Magenta (Bandjam), Electric Yellow (Step-Up)
    const targetColor = new THREE.Color(
      hoverState === 'primary' ? '#9d4edd' : 
      hoverState === 'secondary' ? '#FF00FF' : 
      hoverState === 'tertiary' ? '#FFFF00' : '#9d4edd'
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
      <Canvas camera={{ position: [0, 0, 10], fov: 45 }} gl={{ antialias: false, powerPreference: 'high-performance' }}>
        <VideoBackground />
      </Canvas>
    </div>
  );
}
