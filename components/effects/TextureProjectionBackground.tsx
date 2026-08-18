"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from 'three';
import WebGLApp from "./TextureProjection/lib/WebGLApp";
import assets from "./TextureProjection/lib/AssetManager";
import { addLights } from "./TextureProjection/scene/lights";
import { Slides } from "./TextureProjection/scene/Slides";
import { SlideNoise } from "./TextureProjection/scene/SlideNoise";

const IMAGES = [
  "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060182/sabrang-2026/about/fest-crowd-lights.jpg",
  "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060179/sabrang-2026/about/dance-battle.png",
  "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060183/sabrang-2026/about/panache-runway.png",
  "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060184/sabrang-2026/about/sabrang-live.png",
  "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060181/sabrang-2026/about/echos-of-noor.png"
];

export default function TextureProjectionBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const webglRef = useRef<any>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Grab canvas
    const canvas = canvasRef.current;

    // Setup WebGLRenderer via WebGLApp
    const webgl = new (WebGLApp as any)({
      canvas,
      background: '#090B12', // Sabrang Ink
      backgroundAlpha: 0, // Let the Next.js background show through
      maxPixelRatio: 1.5, // Better quality for the photo grid
    });
    webglRef.current = webgl;

    // Preload first texture
    const firstImage = assets.queue({
      url: IMAGES[0],
      type: "texture",
    });

    // Queue other images
    IMAGES.slice(1).forEach((img) => assets.queue({ url: img, type: "texture" }));

    // Load queued assets
    assets.load({ renderer: webgl.renderer }).then(() => {
      // Show canvas
      canvas.style.opacity = '1';

      // Move camera behind
      webgl.camera.position.set(0, 0, 5);
      webgl.camera.updateMatrixWorld();
      webgl.camera.updateProjectionMatrix();

      // No scene lights needed — core tiles use unlit MeshBasicMaterial
      // which displays the photograph texture at full brightness.

      // Init Slides
      webgl.scene.slides = new Slides(webgl, {
        firstImage,
        otherImages: IMAGES.slice(1),
        Slide: SlideNoise,
      });
      webgl.scene.add(webgl.scene.slides);

      // Mouse Parallax Logic
      let targetCameraX = 0;
      let targetCameraY = 0;
      let currentCameraX = 0;
      let currentCameraY = 0;

      const handlePointerMove = (e: PointerEvent) => {
        // Normalize coordinates to -1 to 1
        const nx = (e.clientX / window.innerWidth) * 2 - 1;
        const ny = -(e.clientY / window.innerHeight) * 2 + 1;
        targetCameraX = nx * 0.15; // Reduced from 0.5 for subtle cinematic drift
        targetCameraY = ny * 0.15;
      };

      window.addEventListener('pointermove', handlePointerMove);

      // Inject camera parallax update into WebGLApp loop
      webgl.onUpdate((dt: number) => {
        currentCameraX += (targetCameraX - currentCameraX) * 0.05;
        currentCameraY += (targetCameraY - currentCameraY) * 0.05;
        
        webgl.camera.position.x = currentCameraX;
        webgl.camera.position.y = currentCameraY;
        
        // Slight yaw/pitch rotation for 3D feel
        webgl.camera.rotation.y = -currentCameraX * 0.1;
        webgl.camera.rotation.x = currentCameraY * 0.1;
      });

      // Start loop conditionally based on scroll
      const checkVisibility = () => {
        if (window.scrollY > window.innerHeight * 2.5) {
          if (webgl.isRunning) webgl.stop();
        } else {
          if (!webgl.isRunning) webgl.start();
        }
      };
      
      window.addEventListener('scroll', checkVisibility, { passive: true });
      webgl.start();
      
      webgl._scrollCleanup = () => window.removeEventListener('scroll', checkVisibility);
      webgl._pointerCleanup = () => window.removeEventListener('pointermove', handlePointerMove);
    });

    return () => {
      if (webglRef.current && webglRef.current._scrollCleanup) {
        webglRef.current._scrollCleanup();
      }
      if (webglRef.current && webglRef.current._pointerCleanup) {
        webglRef.current._pointerCleanup();
      }
      webgl.stop();
      if (webgl.scene) {
        webgl.scene.traverse((child: any) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((m: any) => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      }
      webgl.renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-10 pointer-events-none transition-opacity duration-1000"
      style={{ opacity: 0 }}
    />
  );
}
