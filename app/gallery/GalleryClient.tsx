'use client';

import { Loader, useTexture } from '@react-three/drei';
import { Canvas, type ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DoubleSide,
  Mesh,
  Object3D,
  ShaderMaterial,
  SRGBColorSpace,
  Texture,
  Vector2,
  Vector3,
} from 'three';

import GalleryLightbox, { type OriginRect } from './GalleryLightbox';

const IMAGES: Array<{ src: string; title: string }> = [
  { src: '/team-carousel/Aditya Nayak.png', title: 'Aditya Nayak' },
  { src: '/team-carousel/Ambika Dalmia.png', title: 'Ambika Dalmia' },
  { src: '/team-carousel/Aryan.png', title: 'Aryan' },
  { src: '/team-carousel/Ashlesha Sharma.png', title: 'Ashlesha Sharma' },
  { src: '/team-carousel/Daksh kumar.png', title: 'Daksh Kumar' },
  { src: '/team-carousel/Devansh Srivastava .png', title: 'Devansh Srivastava' },
  { src: '/team-carousel/Manan.png', title: 'Manan' },
  { src: '/team-carousel/Naman Shukla.png', title: 'Naman Shukla' },
  { src: '/team-carousel/Rashi.png', title: 'Rashi' },
  { src: '/team-carousel/Roshan jangir .png', title: 'Roshan Jangir' },
  { src: '/team-carousel/Satvik.png', title: 'Satvik' },
];

const ROWS = 5;
const COLS = 10;

const TILE_CORNERS: ReadonlyArray<readonly [number, number]> = [
  [-0.5, -0.5],
  [0.5, -0.5],
  [0.5, 0.5],
  [-0.5, 0.5],
];

/* ---------------------------------------------------------------- grid plane */

function GridPlane({ targetCenterUv }: { targetCenterUv: React.RefObject<Vector2> }) {
  const meshRef = useRef<Mesh>(null);
  const uniforms = useMemo(
    () => ({
      uGridScale: { value: 50.0 },
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
    <mesh ref={meshRef} position={[0, 0, -6.5]}>
      <planeGeometry args={[45, 45, 512, 512]} />
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
  onImageSelect,
}: {
  scrollTargetRef: React.RefObject<number>;
  spinVelocityRef: React.RefObject<number>;
  naturalDirRef: React.RefObject<number>;
  tubeAngleRef: React.RefObject<number>;
  rotationSpeedScaleTargetRef: React.RefObject<number>;
  onHoverStart: (projectName: string, event: ThreeEvent<PointerEvent>) => void;
  onHoverMove: (event: ThreeEvent<PointerEvent>) => void;
  onHoverEnd: () => void;
  onImageSelect: (selection: {
    index: number;
    aspect: number;
    rect: OriginRect;
    remeasure: () => OriginRect | null;
  }) => void;
}) {
  const groupRef = useRef<Object3D>(null);
  const rowGroupRefs = useRef<Array<Object3D | null>>([]);
  const scrollCurrent = useRef(0);
  const angle = useRef(0);
  const rotationSpeedScale = useRef(1);

  const radius = 4;
  const tileW = 0.95;
  const tileH = 1;

  const textures = useTexture(
    IMAGES.map((i) => i.src),
    (loaded) => {
      const list = (Array.isArray(loaded) ? loaded : [loaded]) as Texture[];
      list.forEach((t) => {
        t.colorSpace = SRGBColorSpace;
        const img = t.image;
        if (img && img.width && img.height) {
          const imageAspect = img.width / img.height;
          const planeAspect = tileW / tileH;
          if (imageAspect > planeAspect) {
            t.repeat.set(planeAspect / imageAspect, 1);
            t.offset.set((1 - (planeAspect / imageAspect)) / 2, 0);
          } else {
            t.repeat.set(1, imageAspect / planeAspect);
            t.offset.set(0, (1 - (imageAspect / planeAspect)) / 2);
          }
        }
      });
    },
  ) as Texture[];

  const { camera, size } = useThree();

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

  // Screen-space box of a tile, so the DOM viewer can expand out of it.
  const measureTile = useCallback(
    (mesh: Mesh): OriginRect => {
      mesh.updateWorldMatrix(true, false);
      const point = new Vector3();
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      for (const [cx, cy] of TILE_CORNERS) {
        point.set(cx * tileW, cy * tileH, 0).applyMatrix4(mesh.matrixWorld).project(camera);
        const x = (point.x * 0.5 + 0.5) * size.width;
        const y = (-point.y * 0.5 + 0.5) * size.height;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }

      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    },
    [camera, size.width, size.height, tileW, tileH],
  );

  const onTileClick = useCallback(
    (texIndex: number, event: ThreeEvent<MouseEvent>) => {
      const mesh = event.object as Mesh;
      const image = textures[texIndex]?.image as { width?: number; height?: number } | undefined;
      const aspect = image?.width && image?.height ? image.width / image.height : 1;
      onImageSelect({
        index: texIndex,
        aspect,
        rect: measureTile(mesh),
        remeasure: () => measureTile(mesh),
      });
    },
    [measureTile, onImageSelect, textures],
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
                onClick={(e) => {
                  e.stopPropagation();
                  onTileClick(texIndex, e);
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

  const [selected, setSelected] = useState<{
    index: number;
    aspect: number;
    rect: OriginRect;
  } | null>(null);
  const viewerOpen = selected !== null;
  const viewerOpenRef = useRef(false);
  const remeasureOriginRef = useRef<(() => OriginRect | null) | null>(null);
  // A touch swipe also fires a three.js click; only a near-stationary tap opens the viewer.
  const pointerMovedRef = useRef(false);

  const tooltipElRef = useRef<HTMLDivElement | null>(null);
  const tooltipTarget = useRef({ x: 0, y: 0 });
  const tooltipCurrent = useRef({ x: 0, y: 0 });

  const cursorElRef = useRef<HTMLDivElement | null>(null);
  const cursorTarget = useRef({ x: 0, y: 0 });
  const cursorCurrent = useRef({ x: 0, y: 0 });
  const cursorActive = useRef(false);

  const dragPointerId = useRef<number | null>(null);
  const dragLastY = useRef(0);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    return () => {
      const styleEl = document.getElementById('gallery-global-cursor-override');
      if (styleEl) styleEl.remove();
    };
  }, []);

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
      if (viewerOpenRef.current) return;
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
      if (event.nativeEvent && !event.nativeEvent.isTrusted) return;
      setHoveredProject(projectName);
      setTooltipFromClientPoint(event.nativeEvent.clientX, event.nativeEvent.clientY);
      tooltipCurrent.current = { ...tooltipTarget.current };
      rotationSpeedScaleTarget.current = 0.35;
    },
    [setTooltipFromClientPoint],
  );

  const onImageHoverMove = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (event.nativeEvent && !event.nativeEvent.isTrusted) return;
      setTooltipFromClientPoint(event.nativeEvent.clientX, event.nativeEvent.clientY);
    },
    [setTooltipFromClientPoint],
  );

  const onImageHoverEnd = useCallback(() => {
    setHoveredProject(null);
    if (!viewerOpenRef.current) rotationSpeedScaleTarget.current = 1;
  }, []);

  const onImageSelect = useCallback(
    (selection: {
      index: number;
      aspect: number;
      rect: OriginRect;
      remeasure: () => OriginRect | null;
    }) => {
      if (viewerOpenRef.current || pointerMovedRef.current) return;

      viewerOpenRef.current = true;
      remeasureOriginRef.current = selection.remeasure;
      // Ease the tube to a halt so the tile stays put behind the viewer.
      rotationSpeedScaleTarget.current = 0;
      tubeSpinVelocity.current = 0;
      cursorActive.current = false;
      setHoveredProject(null);
      setSelected({ index: selection.index, aspect: selection.aspect, rect: selection.rect });
    },
    [],
  );

  const onViewerClose = useCallback(() => {
    viewerOpenRef.current = false;
    remeasureOriginRef.current = null;
    rotationSpeedScaleTarget.current = 1;
    setSelected(null);
  }, []);

  const remeasureOrigin = useCallback(() => remeasureOriginRef.current?.() ?? null, []);

  const onPointerEnter = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.nativeEvent && !event.nativeEvent.isTrusted) return;
    const rect = event.currentTarget.getBoundingClientRect();
    cursorTarget.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    cursorCurrent.current = { ...cursorTarget.current };
    cursorActive.current = true;

    let styleEl = document.getElementById('gallery-global-cursor-override');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'gallery-global-cursor-override';
      document.head.appendChild(styleEl);
    }
    styleEl.innerHTML = '.custom-cursor-circle { opacity: 0 !important; }';
  }, []);

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.nativeEvent && !event.nativeEvent.isTrusted) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    if (viewerOpenRef.current) return;

    if (
      Math.abs(event.clientX - dragStart.current.x) > 10 ||
      Math.abs(event.clientY - dragStart.current.y) > 10
    ) {
      pointerMovedRef.current = true;
    }

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
    pointerMovedRef.current = false;
    dragStart.current = { x: event.clientX, y: event.clientY };
    if (event.pointerType === 'mouse' || viewerOpenRef.current) return;
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

    const styleEl = document.getElementById('gallery-global-cursor-override');
    if (styleEl) {
      styleEl.innerHTML = '';
    }
  }, [endDrag, onImageHoverEnd]);

  return (
    // Full-bleed: cancels the layout container's padding and horizontal gutter.
    <div
      ref={containerRef}
      className={`gallery-container relative left-1/2 h-screen min-h-screen w-screen -translate-x-1/2 touch-none overflow-hidden bg-black ${viewerOpen ? 'cursor-auto' : 'cursor-none'
        }`}
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
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 8, 5]} intensity={1.5} />
          <directionalLight position={[-5, -5, -5]} intensity={0.5} color="#4f46e5" />
          <hemisphereLight args={['#ffffff', '#111827', 0.8]} />

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
            onImageSelect={onImageSelect}
          />
        </Suspense>
      </Canvas>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[5] bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_75%,#000_100%)]"
      />

      <h1 className="sr-only">Gallery</h1>

      {hoveredProject && !viewerOpen && (
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

      {selected && (
        <GalleryLightbox
          images={IMAGES}
          index={selected.index}
          aspect={selected.aspect}
          origin={selected.rect}
          containerRef={containerRef}
          measureOrigin={remeasureOrigin}
          onIndexChange={(next) => setSelected((current) => current && { ...current, index: next })}
          onClose={onViewerClose}
        />
      )}

      <Loader />
    </div>
  );
}
