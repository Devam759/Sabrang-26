'use client';

import { Environment, Loader, useGLTF, useTexture } from '@react-three/drei';
import { Canvas, type ThreeEvent, useFrame } from '@react-three/fiber';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DoubleSide,
  Mesh,
  MeshPhysicalMaterial,
  Object3D,
  ShaderMaterial,
  SRGBColorSpace,
  Texture,
  Vector2,
} from 'three';

const IMAGES: Array<{ src: string; title: string }> = [
  { src: '/team-carousel/1.jpg', title: 'Bandjam' },
  { src: '/team-carousel/2.jpg', title: 'Panache' },
  { src: '/team-carousel/3.jpg', title: 'Step Up' },
  { src: '/team-carousel/4.jpg', title: 'Dance Battle' },
  { src: '/team-carousel/5.jpg', title: 'DJ Night' },
  { src: '/team-carousel/6.jpg', title: 'Theatre' },
  { src: '/team-carousel/7.jpg', title: 'E-Sports' },
  { src: '/team-carousel/8.jpg', title: 'Art & Decor' },
  { src: '/team-carousel/9.jpg', title: 'Pro Show' },
  { src: '/team-carousel/10.jpg', title: 'Nukkad' },
  { src: '/team-carousel/11.jpg', title: 'Rampwalk' },
  { src: '/team-carousel/12.jpg', title: 'Afterglow' },
];

const ROWS = 5;
const COLS = 10;

/* ---------------------------------------------------------------- grid plane */

function GridPlane({ targetCenterUv }: { targetCenterUv: React.RefObject<Vector2> }) {
  const meshRef = useRef<Mesh>(null);
  const uniforms = useMemo(
    () => ({
      uGridScale: { value: 28.0 },
      uLineWidth: { value: 0.5 },
      uEdgeWidth: { value: 0.14 },
      uEdgeAmp: { value: 1.35 },
      uCenterRadius: { value: 0.22 },
      uCenterAmp: { value: 0.9 },
      uCenter: { value: new Vector2(0.5, 0.5) },
      uTime: { value: 0.0 },
      uScrollSpeed: { value: 0.01 },
    }),
    [],
  );

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const material = mesh.material as ShaderMaterial;
    material.uniforms.uTime.value = state.clock.getElapsedTime();
    (material.uniforms.uCenter.value as Vector2).lerp(targetCenterUv.current, 0.08);
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -5.2]}>
      <planeGeometry args={[18, 18, 512, 512]} />
      <shaderMaterial
        attach="material"
        args={[
          {
            uniforms,
            vertexShader: /* glsl */ `
              varying vec2 vUv;

              uniform float uEdgeWidth;
              uniform float uEdgeAmp;
              uniform float uCenterRadius;
              uniform float uCenterAmp;
              uniform vec2 uCenter;

              void main() {
                vUv = uv;

                vec3 p = position;

                float dEdge = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
                float edgeMask = 1.0 - smoothstep(0.0, uEdgeWidth, dEdge);

                float dCenter = distance(vUv, uCenter);
                float centerMask = 1.0 - smoothstep(0.0, uCenterRadius, dCenter);

                float zOffset = edgeMask * uEdgeAmp + centerMask * uCenterAmp;
                p.z += zOffset;

                gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
              }
            `,
            fragmentShader: /* glsl */ `
              varying vec2 vUv;

              uniform float uGridScale;
              uniform float uLineWidth;
              uniform float uTime;
              uniform float uScrollSpeed;

              float gridLine(float coord, float width) {
                float fw = fwidth(coord);
                float p = abs(fract(coord - 0.5) - 0.5);
                return 1.0 - smoothstep(width * fw, (width + 1.0) * fw, p);
              }

              void main() {
                vec2 uv = (vUv + vec2(uTime * uScrollSpeed, 0.0)) * uGridScale;
                float gx = gridLine(uv.x, uLineWidth);
                float gy = gridLine(uv.y, uLineWidth);
                float g = max(gx, gy);

                vec3 base = vec3(0.0);
                vec3 line = vec3(0.16, 0.13, 0.22);
                gl_FragColor = vec4(mix(base, line, g), 1.0);
              }
            `,
            side: DoubleSide,
          },
        ]}
      />
    </mesh>
  );
}

/* -------------------------------------------------------------- glass helmet */

function HelmetModel({ tubeAngleRef }: { tubeAngleRef: React.RefObject<number> }) {
  const helmet = useGLTF('/models/helmet.glb');
  const scene = useMemo(() => helmet.scene.clone(true), [helmet.scene]);
  const modelRef = useRef<Object3D>(null);
  const baseRotation = useMemo(() => ({ x: Math.PI / 8, y: Math.PI / 2 }), []);

  const glassMaterial = useMemo(
    () =>
      new MeshPhysicalMaterial({
        transmission: 1,
        thickness: 10,
        roughness: 0,
        metalness: 0.1,
        ior: 1.9,
        dispersion: 1,
        clearcoat: 0.1,
        clearcoatRoughness: 1.1,
        iridescenceThicknessRange: [100, 400],
        transparent: true,
        depthWrite: true,
      }),
    [],
  );

  useEffect(() => {
    scene.traverse((object) => {
      if (object instanceof Mesh) {
        object.scale.set(0.7, 0.7, 0.7);
        object.material = glassMaterial;
      }
    });
    return () => {
      glassMaterial.dispose();
    };
  }, [scene, glassMaterial]);

  useFrame(() => {
    const obj = modelRef.current;
    if (!obj) return;
    obj.rotation.x = baseRotation.x;
    obj.rotation.y = baseRotation.y - tubeAngleRef.current;
  });

  return <primitive ref={modelRef} object={scene} rotation={[baseRotation.x, baseRotation.y, 0]} />;
}

/* ----------------------------------------------------------------- image tube */

function ImageTube({
  scrollTargetRef,
  spinVelocityRef,
  naturalDirRef,
  tubeAngleRef,
  rotationSpeedScaleTargetRef,
  onHoverStart,
  onHoverMove,
  onHoverEnd,
}: {
  scrollTargetRef: React.RefObject<number>;
  spinVelocityRef: React.RefObject<number>;
  naturalDirRef: React.RefObject<number>;
  tubeAngleRef: React.RefObject<number>;
  rotationSpeedScaleTargetRef: React.RefObject<number>;
  onHoverStart: (projectName: string, event: ThreeEvent<PointerEvent>) => void;
  onHoverMove: (event: ThreeEvent<PointerEvent>) => void;
  onHoverEnd: () => void;
}) {
  const groupRef = useRef<Object3D>(null);
  const rowGroupRefs = useRef<Array<Object3D | null>>([]);
  const scrollCurrent = useRef(0);
  const angle = useRef(0);
  const rotationSpeedScale = useRef(1);

  const textures = useTexture(
    IMAGES.map((i) => i.src),
    (loaded) => {
      const list = (Array.isArray(loaded) ? loaded : [loaded]) as Texture[];
      list.forEach((t) => {
        t.colorSpace = SRGBColorSpace;
      });
    },
  ) as Texture[];

  const radius = 4;
  const tileW = 0.95;
  const tileH = 1;
  const ySpacing = 2.7;
  const baseSpeed = 0.25;
  const loopHeight = ROWS * ySpacing;
  const totalRows = ROWS * 3;

  // Rows near the bottom of the tube spin a touch faster, which reads as depth.
  const rowSpeed = useMemo(
    () => Array.from({ length: ROWS }, (_, r) => 0.65 + (ROWS <= 1 ? 0 : r / (ROWS - 1)) * 0.9),
    [],
  );

  const rowPositions = useMemo(
    () =>
      Array.from({ length: totalRows }, (_, rowIndex) => {
        const baseRow = rowIndex % ROWS;
        return {
          rowIndex,
          y: (rowIndex - (totalRows - 1) / 2) * ySpacing,
          baseRow,
          rowOffset: baseRow % 2 === 0 ? 0 : 0.5,
        };
      }),
    [totalRows, ySpacing],
  );

  useFrame((_state, dt) => {
    scrollCurrent.current += (scrollTargetRef.current - scrollCurrent.current) * 0.12;

    // Reposition both current and target together, so the loop never jumps.
    if (scrollCurrent.current > loopHeight / 2) {
      scrollCurrent.current -= loopHeight;
      scrollTargetRef.current -= loopHeight;
    } else if (scrollCurrent.current < -loopHeight / 2) {
      scrollCurrent.current += loopHeight;
      scrollTargetRef.current += loopHeight;
    }

    spinVelocityRef.current *= Math.pow(0.92, dt * 60);
    spinVelocityRef.current = Math.max(-2.0, Math.min(2.0, spinVelocityRef.current));

    rotationSpeedScale.current +=
      (rotationSpeedScaleTargetRef.current - rotationSpeedScale.current) * 0.12;

    // Scaling dt slows the whole system consistently, inertia included.
    const scaledDt = dt * rotationSpeedScale.current;
    angle.current += (naturalDirRef.current * baseSpeed + spinVelocityRef.current) * scaledDt;
    tubeAngleRef.current = angle.current;

    const group = groupRef.current;
    if (!group) return;
    group.position.y = -scrollCurrent.current;

    for (let rowIndex = 0; rowIndex < totalRows; rowIndex++) {
      const rowObj = rowGroupRefs.current[rowIndex];
      if (rowObj) rowObj.rotation.y = angle.current * rowSpeed[rowIndex % ROWS];
    }
  });

  return (
    <group ref={groupRef}>
      {rowPositions.map(({ rowIndex, y, baseRow, rowOffset }) => (
        <group
          key={rowIndex}
          position={[0, y, 0]}
          ref={(obj) => {
            rowGroupRefs.current[rowIndex] = obj;
          }}
        >
          {Array.from({ length: COLS }).map((_, col) => {
            const theta = ((col + rowOffset) / COLS) * Math.PI * 2;
            const texIndex = (baseRow * COLS + col) % IMAGES.length;

            return (
              <mesh
                key={col}
                position={[Math.cos(theta) * radius, 0, Math.sin(theta) * radius]}
                rotation={[0, -(theta + Math.PI / 2), 0]}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  onHoverStart(IMAGES[texIndex].title, e);
                }}
                onPointerMove={(e) => {
                  e.stopPropagation();
                  onHoverMove(e);
                }}
                onPointerOut={(e) => {
                  e.stopPropagation();
                  onHoverEnd();
                }}
              >
                <planeGeometry args={[tileW, tileH]} />
                <meshBasicMaterial map={textures[texIndex]} toneMapped={false} side={DoubleSide} />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
}

/* ----------------------------------------------------------------- the scene */

export default function GalleryClient() {
  const containerRef = useRef<HTMLDivElement>(null);

  const targetCenterUv = useRef(new Vector2(0.5, 0.5));
  const tubeScrollTarget = useRef(0);
  const tubeSpinVelocity = useRef(0);
  const tubeNaturalDir = useRef(1);
  const tubeAngle = useRef(0);
  const rotationSpeedScaleTarget = useRef(1);

  const [hoveredProject, setHoveredProject] = useState<string | null>(null);

  const tooltipElRef = useRef<HTMLDivElement | null>(null);
  const tooltipTarget = useRef({ x: 0, y: 0 });
  const tooltipCurrent = useRef({ x: 0, y: 0 });

  const cursorElRef = useRef<HTMLDivElement | null>(null);
  const cursorTarget = useRef({ x: 0, y: 0 });
  const cursorCurrent = useRef({ x: 0, y: 0 });
  const cursorActive = useRef(false);

  const dragPointerId = useRef<number | null>(null);
  const dragLastY = useRef(0);

  // Tooltip + cursor are animated outside React, so hovering never re-renders.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const tip = tooltipElRef.current;
      if (tip) {
        tooltipCurrent.current.x += (tooltipTarget.current.x - tooltipCurrent.current.x) * 0.18;
        tooltipCurrent.current.y += (tooltipTarget.current.y - tooltipCurrent.current.y) * 0.18;
        tip.style.transform = `translate3d(${(tooltipCurrent.current.x + 12).toFixed(2)}px, ${(
          tooltipCurrent.current.y - 18
        ).toFixed(2)}px, 0)`;
      }

      const dot = cursorElRef.current;
      if (dot) {
        cursorCurrent.current.x += (cursorTarget.current.x - cursorCurrent.current.x) * 0.14;
        cursorCurrent.current.y += (cursorTarget.current.y - cursorCurrent.current.y) * 0.14;
        dot.style.transform = `translate3d(${(cursorCurrent.current.x + 8).toFixed(2)}px, ${(
          cursorCurrent.current.y + 8
        ).toFixed(2)}px, 0) translate(-50%, -50%)`;
        dot.style.opacity = cursorActive.current ? '1' : '0';
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // React's onWheel is passive, so the page would scroll under the tube.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      tubeScrollTarget.current += event.deltaY * 0.002;
      tubeSpinVelocity.current += event.deltaY * 0.004;
      if (event.deltaY !== 0) tubeNaturalDir.current = event.deltaY < 0 ? -1 : 1;
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const setTooltipFromClientPoint = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    tooltipTarget.current = { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  const onImageHoverStart = useCallback(
    (projectName: string, event: ThreeEvent<PointerEvent>) => {
      setHoveredProject(projectName);
      setTooltipFromClientPoint(event.nativeEvent.clientX, event.nativeEvent.clientY);
      tooltipCurrent.current = { ...tooltipTarget.current };
      rotationSpeedScaleTarget.current = 0.35;
    },
    [setTooltipFromClientPoint],
  );

  const onImageHoverMove = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      setTooltipFromClientPoint(event.nativeEvent.clientX, event.nativeEvent.clientY);
    },
    [setTooltipFromClientPoint],
  );

  const onImageHoverEnd = useCallback(() => {
    setHoveredProject(null);
    rotationSpeedScaleTarget.current = 1;
  }, []);

  const onPointerEnter = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    cursorTarget.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    cursorCurrent.current = { ...cursorTarget.current };
    cursorActive.current = true;
  }, []);

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    cursorTarget.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };

    // Touch drag stands in for the wheel, feeding the same motion system.
    if (dragPointerId.current === event.pointerId) {
      const dy = dragLastY.current - event.clientY;
      dragLastY.current = event.clientY;
      tubeScrollTarget.current += dy * 0.01;
      tubeSpinVelocity.current += dy * 0.02;
      if (dy !== 0) tubeNaturalDir.current = dy < 0 ? -1 : 1;
    }

    const nx = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const ny = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));

    const strength = 0.4;
    targetCenterUv.current.set(0.5 + (nx - 0.5) * strength, 0.5 + (1 - ny - 0.5) * strength);
  }, []);

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') return;
    dragPointerId.current = event.pointerId;
    dragLastY.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const endDrag = useCallback(() => {
    dragPointerId.current = null;
  }, []);

  const onPointerLeave = useCallback(() => {
    targetCenterUv.current.set(0.5, 0.5);
    cursorActive.current = false;
    endDrag();
    onImageHoverEnd();
  }, [endDrag, onImageHoverEnd]);

  return (
    // Full-bleed: cancels the layout container's padding and horizontal gutter.
    <div
      ref={containerRef}
      className="relative left-1/2 -my-8 h-[100svh] w-screen -translate-x-1/2 cursor-none touch-none overflow-hidden bg-black"
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
      onPointerDown={onPointerDown}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={onPointerLeave}
    >
      <Canvas
        className="absolute inset-0"
        camera={{ position: [0, 0, 6.5], fov: 50 }}
        onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <Environment preset="studio" blur={10.5} />

          <GridPlane targetCenterUv={targetCenterUv} />

          <ImageTube
            scrollTargetRef={tubeScrollTarget}
            spinVelocityRef={tubeSpinVelocity}
            naturalDirRef={tubeNaturalDir}
            tubeAngleRef={tubeAngle}
            rotationSpeedScaleTargetRef={rotationSpeedScaleTarget}
            onHoverStart={onImageHoverStart}
            onHoverMove={onImageHoverMove}
            onHoverEnd={onImageHoverEnd}
          />

          <HelmetModel tubeAngleRef={tubeAngle} />
        </Suspense>
      </Canvas>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[5] bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_55%,#000_100%)]"
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-8 z-10 text-center">
        <h1 className="text-3xl font-black uppercase tracking-[0.35em] text-white/90 md:text-5xl">
          Gallery
        </h1>
        <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-white/40">
          Scroll or drag to travel the archive
        </p>
      </div>

      {hoveredProject && (
        <div
          ref={tooltipElRef}
          role="status"
          aria-live="polite"
          className="pointer-events-none absolute left-0 top-0 z-20 select-none whitespace-nowrap rounded-lg border border-white/20 bg-black/70 px-2.5 py-2 text-xs leading-none text-white/90"
        >
          {hoveredProject}
        </div>
      )}

      <div
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 z-30 h-[18px] w-[18px] rounded-full bg-white/90 opacity-0 mix-blend-difference transition-opacity duration-150 will-change-transform"
        ref={cursorElRef}
      />

      <Loader />
    </div>
  );
}

useGLTF.preload('/models/helmet.glb');
