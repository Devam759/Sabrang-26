"use client";

import React, { useEffect, useRef } from "react";
import SimplexNoise from "simplex-noise";

// Helper functions for the particle animation
const TAU = Math.PI * 2;
const cos = Math.cos;
const sin = Math.sin;
const rand = (max: number) => Math.random() * max;
const randRange = (range: number) => Math.random() * range - range / 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function fadeInOut(life: number, ttl: number) {
  const half = ttl / 2;
  return 1 - Math.abs(life - half) / half;
}

export default function FaqParticleBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Configuration constants
    const particleCount = 700;
    const particlePropCount = 9;
    const particlePropsLength = particleCount * particlePropCount;
    const rangeY = 100;
    const baseTTL = 50;
    const rangeTTL = 150;
    const baseSpeed = 0.1;
    const rangeSpeed = 2;
    const baseRadius = 1;
    const rangeRadius = 4;
    const baseHue = 220;
    const rangeHue = 100;
    const noiseSteps = 8;
    const xOff = 0.00125;
    const yOff = 0.00125;
    const zOff = 0.0005;
    const backgroundColor = 'hsla(260,40%,5%,1)';

    let animationFrameId: number;
    let canvasA = document.createElement('canvas');
    let canvasB = document.createElement('canvas');
    canvasB.style.position = 'fixed'; // From user snippet
    canvasB.style.top = '0';
    canvasB.style.left = '0';
    canvasB.style.width = '100%';
    canvasB.style.height = '100%';
    canvasB.style.zIndex = '0';
    
    const container = containerRef.current;
    container.appendChild(canvasB);
    
    let ctxA = canvasA.getContext('2d')!;
    let ctxB = canvasB.getContext('2d')!;
    let center: [number, number] = [0, 0];
    let tick = 0;
    let simplex = new SimplexNoise();
    let particleProps = new Float32Array(particlePropsLength);

    function initParticle(i: number) {
      let x, y, vx, vy, life, ttl, speed, radius, hue;

      x = rand(canvasA.width);
      y = center[1] + randRange(rangeY);
      vx = 0;
      vy = 0;
      life = 0;
      ttl = baseTTL + rand(rangeTTL);
      speed = baseSpeed + rand(rangeSpeed);
      radius = baseRadius + rand(rangeRadius);
      hue = baseHue + rand(rangeHue);

      particleProps.set([x, y, vx, vy, life, ttl, speed, radius, hue], i);
    }

    function initParticles() {
      tick = 0;
      simplex = new SimplexNoise();
      particleProps = new Float32Array(particlePropsLength);
      for (let i = 0; i < particlePropsLength; i += particlePropCount) {
        initParticle(i);
      }
    }

    function checkBounds(x: number, y: number) {
      return (
        x > canvasA.width ||
        x < 0 ||
        y > canvasA.height ||
        y < 0
      );
    }

    function drawParticle(x: number, y: number, x2: number, y2: number, life: number, ttl: number, radius: number, hue: number) {
      ctxA.save();
      ctxA.lineCap = 'round';
      ctxA.lineWidth = radius;
      ctxA.strokeStyle = `hsla(${hue},100%,60%,${fadeInOut(life, ttl)})`;
      ctxA.beginPath();
      ctxA.moveTo(x, y);
      ctxA.lineTo(x2, y2);
      ctxA.stroke();
      ctxA.closePath();
      ctxA.restore();
    }

    function updateParticle(i: number) {
      let i2 = 1 + i, i3 = 2 + i, i4 = 3 + i, i5 = 4 + i, i6 = 5 + i, i7 = 6 + i, i8 = 7 + i, i9 = 8 + i;
      let n, x, y, vx, vy, life, ttl, speed, x2, y2, radius, hue;

      x = particleProps[i];
      y = particleProps[i2];
      n = simplex.noise3D(x * xOff, y * yOff, tick * zOff) * noiseSteps * TAU;
      vx = lerp(particleProps[i3], cos(n), 0.5);
      vy = lerp(particleProps[i4], sin(n), 0.5);
      life = particleProps[i5];
      ttl = particleProps[i6];
      speed = particleProps[i7];
      x2 = x + vx * speed;
      y2 = y + vy * speed;
      radius = particleProps[i8];
      hue = particleProps[i9];

      drawParticle(x, y, x2, y2, life, ttl, radius, hue);

      life++;

      particleProps[i] = x2;
      particleProps[i2] = y2;
      particleProps[i3] = vx;
      particleProps[i4] = vy;
      particleProps[i5] = life;

      if (checkBounds(x, y) || life > ttl) {
        initParticle(i);
      }
    }

    function drawParticles() {
      for (let i = 0; i < particlePropsLength; i += particlePropCount) {
        updateParticle(i);
      }
    }

    function renderGlow() {
      ctxB.save();
      ctxB.filter = 'blur(8px) brightness(200%)';
      ctxB.globalCompositeOperation = 'lighter';
      ctxB.drawImage(canvasA, 0, 0);
      ctxB.restore();

      ctxB.save();
      ctxB.filter = 'blur(4px) brightness(200%)';
      ctxB.globalCompositeOperation = 'lighter';
      ctxB.drawImage(canvasA, 0, 0);
      ctxB.restore();
    }

    function renderToScreen() {
      ctxB.save();
      ctxB.globalCompositeOperation = 'lighter';
      ctxB.drawImage(canvasA, 0, 0);
      ctxB.restore();
    }

    function resize() {
      const { innerWidth, innerHeight } = window;
      
      canvasA.width = innerWidth;
      canvasA.height = innerHeight;
      ctxA.drawImage(canvasB, 0, 0);

      canvasB.width = innerWidth;
      canvasB.height = innerHeight;
      ctxB.drawImage(canvasA, 0, 0);

      center[0] = 0.5 * canvasA.width;
      center[1] = 0.5 * canvasA.height;
    }

    function draw() {
      tick++;

      ctxA.clearRect(0, 0, canvasA.width, canvasA.height);

      ctxB.fillStyle = backgroundColor;
      ctxB.fillRect(0, 0, canvasA.width, canvasA.height);

      drawParticles();
      renderGlow();
      renderToScreen();

      animationFrameId = window.requestAnimationFrame(draw);
    }

    resize();
    initParticles();
    draw();

    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      window.cancelAnimationFrame(animationFrameId);
      if (container.contains(canvasB)) {
        container.removeChild(canvasB);
      }
    };
  }, []);

  return <div ref={containerRef} className="fixed inset-0 pointer-events-none z-0" />;
}
