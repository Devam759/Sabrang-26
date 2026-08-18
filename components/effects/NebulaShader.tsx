"use client";

import React, { useEffect, useRef } from "react";

/**
 * NebulaShader – a fullscreen WebGL procedural background.
 * Renders a dynamic nebula in the Sabrang violet/magenta palette.
 * Mouse-reactive for parallax. Auto-stops when scrolled past the hero.
 */
export default function NebulaShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return;

    // Sync canvas size
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    function syncSize() {
      width = window.innerWidth;
      height = window.innerHeight;
      if (canvas!.width !== width || canvas!.height !== height) {
        canvas!.width = width;
        canvas!.height = height;
      }
    }
    window.addEventListener('resize', syncSize);
    syncSize();

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

    const fs = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
varying vec2 v_texCoord;

void main() {
    vec2 uv = v_texCoord;
    vec2 mouse = u_mouse / u_resolution;

    // Dynamic nebula distortion
    float noise = 0.0;
    vec2 p = uv * 3.0;
    for(float i = 1.0; i < 5.0; i++) {
        p.x += 0.3 / i * sin(i * p.y + u_time * 0.4 + mouse.x * 0.5);
        p.y += 0.3 / i * cos(i * p.x + u_time * 0.4 + mouse.y * 0.5);
        noise += abs(p.x + p.y) * 0.1;
    }

    // Sabrang palette
    vec3 deepViolet  = vec3(0.22, 0.0, 0.42);   // #380068
    vec3 magenta     = vec3(0.72, 0.23, 0.80);   // #B83BCB
    vec3 pink        = vec3(0.95, 0.18, 0.57);   // #F12F91
    vec3 midnight    = vec3(0.03, 0.027, 0.05);  // #08070D

    vec3 col = mix(midnight, deepViolet, noise * 0.6);
    col = mix(col, magenta, pow(noise, 2.5) * 0.25);

    // Subtle stars
    float stars = pow(fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453), 22.0) * 0.4;
    col += stars * pink;

    // Vignette
    float vig = 1.0 - length((uv - 0.5) * 1.6);
    col *= smoothstep(0.0, 0.7, vig);

    gl_FragColor = vec4(col, 1.0);
}`;

    function createShader(type: number, src: string) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      return s;
    }

    const prog = gl.createProgram()!;
    gl.attachShader(prog, createShader(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, createShader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );
    const pos = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uRes = gl.getUniformLocation(prog, "u_resolution");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");

    let mouse = { x: canvas.width / 2, y: canvas.height / 2 };
    const onMove = (e: MouseEvent) => {
      const rect = canvas!.getBoundingClientRect();
      if (rect.width && rect.height) {
        mouse.x = ((e.clientX - rect.left) / rect.width) * canvas!.width;
        mouse.y =
          (1.0 - (e.clientY - rect.top) / rect.height) * canvas!.height;
      }
    };
    window.addEventListener("mousemove", onMove);

    let running = true;
    const checkScroll = () => {
      // Stop rendering when scrolled past 2.5 viewports
      const shouldRun = window.scrollY < window.innerHeight * 2.5;
      running = shouldRun;
    };
    window.addEventListener("scroll", checkScroll, { passive: true });

    function render(t: number) {
      if (running) {
        syncSize();
        gl!.viewport(0, 0, canvas!.width, canvas!.height);
        if (uTime) gl!.uniform1f(uTime, t * 0.001);
        if (uRes) gl!.uniform2f(uRes, canvas!.width, canvas!.height);
        if (uMouse) gl!.uniform2f(uMouse, mouse.x, mouse.y);
        gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      }
      rafRef.current = requestAnimationFrame(render);
    }
    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", syncSize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-20 pointer-events-none opacity-50"
      aria-hidden="true"
    />
  );
}
