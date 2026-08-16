"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture, useAspect } from "@react-three/drei";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import * as THREE from "three/webgpu";
import {
  abs,
  blendScreen,
  oneMinus,
  smoothstep,
  sub,
  texture,
  uniform,
  uv,
  vec3,
} from "three/tsl";

const WIDTH = 1600;
const HEIGHT = 900;

const Scene = () => {
  // Load textures using Suspense
  const [rawMap, depthMap, edgeMap] = useTexture([
    "/contact-raw.png",
    "/contact-depth.png",
    "/contact-edge.png"
  ], (textures) => {
    if (Array.isArray(textures)) {
      textures[0].colorSpace = THREE.SRGBColorSpace;
      textures[1].colorSpace = THREE.NoColorSpace;
      textures[2].colorSpace = THREE.NoColorSpace;

      textures.forEach((tex) => {
        tex.generateMipmaps = false;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.needsUpdate = true;
      });
    }
  });

  const { material, uniforms } = useMemo(() => {
    const uPointer = uniform(new THREE.Vector2(0, 0));
    const uProgress = uniform(0);

    const strength = 0.02; // Subtle displacement

    const tDepthMap = texture(depthMap);
    const tEdgeMap = texture(edgeMap);

    // Some MiDaS depth maps are inverted. Using 1 - depth can feel more natural (parallaxing background vs foreground)
    // You can remove oneMinus if foreground needs to move more than background.
    const depth = tDepthMap.r; 

    // Displace UVs
    const displacedUV = uv().add(depth.mul(uPointer).mul(strength));
    
    // Sample original image with displaced UVs
    const imageTexture = texture(rawMap, displacedUV);

    // Animated scanning band
    const flow = sub(1, smoothstep(0, 0.005, abs(depth.sub(uProgress))));

    // Edge highlighting combined with flow mask
    // We multiply by a cinematic color tint: vec3(10, 0.4, 10) (Neon pink/purple)
    const mask = oneMinus(tEdgeMap.r).mul(flow).mul(vec3(10.0, 0.4, 10.0));

    // Screen blend highlight with original image
    const final = blendScreen(imageTexture.rgb, mask);

    // Create the Node Material for WebGPU
    const nodeMaterial = new THREE.MeshBasicNodeMaterial({
      colorNode: final,
      transparent: true,
    });

    return {
      material: nodeMaterial,
      uniforms: {
        uPointer,
        uProgress,
      },
    };
  }, [rawMap, depthMap, edgeMap]);

  useGSAP(() => {
    gsap.to(uniforms.uProgress, {
      value: 1,
      repeat: -1,
      duration: 3,
      ease: "power1.out",
    });
  }, [uniforms]);

  // Handle pointer tracking
  const targetPointer = useRef(new THREE.Vector2(0, 0));
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      targetPointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      targetPointer.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame(() => {
    // Smoothly lerp pointer for the shader uniform
    // Note: Node uniforms don't have .lerp natively like Vector2, so we lerp the inner value
    uniforms.uPointer.value.lerp(targetPointer.current, 0.05);
  });

  const [w, h] = useAspect(WIDTH, HEIGHT);

  return (
    <mesh scale={[w, h, 1]} material={material}>
      <planeGeometry />
    </mesh>
  );
};

export default function ContactBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none bg-black">
      {/* R3F v9 supports passing THREE.WebGPURenderer directly to gl prop */}
      <Canvas 
        gl={(props: any) => {
          const canvas = props.canvas || props;
          const renderer = new THREE.WebGPURenderer({ canvas, antialias: true, alpha: false } as any);
          
          // Prevent R3F from crashing by calling methods before init() finishes
          const originalRender = renderer.render.bind(renderer);
          let isInitialized = false;
          
          renderer.render = (scene, camera) => {
            if (isInitialized) originalRender(scene, camera);
          };

          // R3F's useTexture explicitly calls initTexture for preloading. We must safely intercept it.
          if (typeof renderer.initTexture === 'function') {
            const originalInitTexture = renderer.initTexture.bind(renderer);
            renderer.initTexture = (texture) => {
              if (isInitialized) originalInitTexture(texture);
            };
          }

          renderer.init().then(() => {
            isInitialized = true;
          }).catch(console.error);
          
          return renderer as any;
        }}
        camera={{ position: [0, 0, 5], fov: 75 }} 
        className="w-full h-full"
      >
        <React.Suspense fallback={null}>
          <Scene />
        </React.Suspense>
      </Canvas>
      {/* Subtle dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/20 mix-blend-multiply pointer-events-none" />
    </div>
  );
}
