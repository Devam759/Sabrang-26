"use client";

import { useProgress } from '@react-three/drei';
import { Canvas, type ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ClampToEdgeWrapping,
  DoubleSide,
  LinearFilter,
  Mesh,
  Object3D,
  ShaderMaterial,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Vector2,
  Vector3,
} from 'three';

import GalleryLightbox, { type OriginRect } from './GalleryLightbox';
import MobileGallery from './MobileGallery';
import { GALLERY_IMAGES } from '@/lib/constants';

function CustomGalleryLoader() {
  const { active, progress } = useProgress();
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(16px)', scale: 1.04 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md"
        >
          {/* Ambient luminous glow */}
          <div className="absolute h-80 w-80 rounded-full bg-purple-600/15 blur-[120px] animate-pulse" />
          <div className="absolute h-64 w-64 rounded-full bg-cyan-500/15 blur-[90px]" />

          {/* Cyber HUD loading console */}
          <div className="relative flex flex-col items-center space-y-7">
            <div className="relative flex h-20 w-20 items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-white/10" />
              <div className="absolute inset-0 rounded-full border border-transparent border-t-cyan-400 border-r-purple-500 animate-spin" />
              <span className="font-mono text-xs font-black tracking-wider text-white">
                {Math.round(progress > 0 ? progress : 100)}%
              </span>
            </div>

            <div className="text-center space-y-2.5">
              <p className="text-[11px] font-mono tracking-[0.35em] text-cyan-400/90 uppercase font-semibold">
                LOADING ARCHIVE
              </p>
              <div className="h-[3px] w-52 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 shadow-[0_0_12px_rgba(56,189,248,0.8)]"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ ease: 'easeOut', duration: 0.4 }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const CYLINDER_IMAGES = GALLERY_IMAGES.slice(0, 50);
const IMAGES = CYLINDER_IMAGES;

const ROWS = 5;
const COLS = 10;

const TILE_CORNERS: ReadonlyArray<readonly [number, number]> = [
  [-0.5, -0.5],
  [0.5, -0.5],
  [0.5, 0.5],
  [-0.5, 0.5],
];

const textureCache = new Map<string, Texture>();
const textureLoader = new TextureLoader();

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
      <planeGeometry args={[45, 45, 32, 32]} />
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
                p.z += edgeMask * uEdgeAmp;

                float dCenter = distance(vUv, uCenter);
                float centerMask = 1.0 - smoothstep(0.0, uCenterRadius, dCenter);
                p.z -= centerMask * uCenterAmp;

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
                float f = fract(coord);
                float df = fwidth(coord);
                return 1.0 - smoothstep(0.0, width * df, f) * smoothstep(0.0, width * df, 1.0 - f);
              }

              void main() {
                vec2 uv = vUv * uGridScale;
                uv.y += uTime * uScrollSpeed * uGridScale;

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

/* ----------------------------------------------------------- gallery tile mesh */

function GalleryTileMesh({
  src,
  title,
  theta,
  radius,
  tileW,
  tileH,
  texIndex,
  onHoverStart,
  onHoverEnd,
  onTileClick,
}: {
  src: string;
  title: string;
  theta: number;
  radius: number;
  tileW: number;
  tileH: number;
  texIndex: number;
  onHoverStart: (title: string, e: ThreeEvent<PointerEvent>) => void;
  onHoverEnd: () => void;
  onTileClick: (index: number, e: ThreeEvent<MouseEvent>, mesh: Mesh, tex: Texture | null) => void;
}) {
  const [texture, setTexture] = useState<Texture | null>(() => textureCache.get(src) || null);

  useEffect(() => {
    if (textureCache.has(src)) {
      setTexture(textureCache.get(src)!);
      return;
    }
    let isMounted = true;
    textureLoader.load(
      src,
      (tex) => {
        if (!isMounted) return;
        tex.colorSpace = SRGBColorSpace;
        tex.minFilter = LinearFilter;
        tex.magFilter = LinearFilter;
        tex.generateMipmaps = false;
        tex.anisotropy = 4;
        tex.wrapS = ClampToEdgeWrapping;
        tex.wrapT = ClampToEdgeWrapping;

        const img = tex.image as { width?: number; height?: number } | undefined;
        if (img?.width && img?.height) {
          const imgAspect = img.width / img.height;
          const target = tileW / tileH;
          if (imgAspect > target) {
            tex.repeat.set(target / imgAspect, 1);
            tex.offset.set((1 - target / imgAspect) / 2, 0);
          } else {
            tex.repeat.set(1, imgAspect / target);
            tex.offset.set(0, (1 - imgAspect / target) / 2);
          }
        }
        tex.needsUpdate = true;
        textureCache.set(src, tex);
        setTexture(tex);
      },
      undefined,
      () => {
        // graceful network fallback
      }
    );

    return () => {
      isMounted = false;
    };
  }, [src, tileW, tileH]);

  return (
    <mesh
      position={[Math.cos(theta) * radius, 0, Math.sin(theta) * radius]}
      rotation={[0, Math.PI / 2 - theta, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHoverStart(title, e);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onHoverEnd();
      }}
      onClick={(e) => {
        e.stopPropagation();
        onTileClick(texIndex, e, e.object as Mesh, texture);
      }}
    >
      <planeGeometry args={[tileW, tileH]} />
      {texture ? (
        <meshBasicMaterial map={texture} />
      ) : (
        <meshBasicMaterial color="#160e26" />
      )}
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
  onHoverEnd,
  onImageSelect,
}: {
  scrollTargetRef: React.RefObject<number>;
  spinVelocityRef: React.RefObject<number>;
  naturalDirRef: React.RefObject<number>;
  tubeAngleRef: React.RefObject<number>;
  rotationSpeedScaleTargetRef: React.RefObject<number>;
  onHoverStart: (projectName: string, event: ThreeEvent<PointerEvent>) => void;
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
  const ySpacing = 2.7;
  const baseSpeed = 0.25;
  const loopHeight = ROWS * ySpacing;
  const totalRows = ROWS * 3;

  const { camera, size } = useThree();

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
    (texIndex: number, event: ThreeEvent<MouseEvent>, mesh: Mesh, tex: Texture | null) => {
      const image = tex?.image as { width?: number; height?: number } | undefined;
      const aspect = image?.width && image?.height ? image.width / image.height : 1;
      onImageSelect({
        index: texIndex,
        aspect,
        rect: measureTile(mesh),
        remeasure: () => measureTile(mesh),
      });
    },
    [measureTile, onImageSelect],
  );

  useFrame((_state, dt) => {
    scrollCurrent.current += (scrollTargetRef.current - scrollCurrent.current) * 0.22;

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
    angle.current =
      (angle.current + (naturalDirRef.current * baseSpeed + spinVelocityRef.current) * scaledDt) %
      (Math.PI * 2);
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
              <GalleryTileMesh
                key={col}
                src={IMAGES[texIndex].src}
                title={IMAGES[texIndex].title}
                theta={theta}
                radius={radius}
                tileW={tileW}
                tileH={tileH}
                texIndex={texIndex}
                onHoverStart={onHoverStart}
                onHoverEnd={onHoverEnd}
                onTileClick={onTileClick}
              />
            );
          })}
        </group>
      ))}
    </group>
  );
}

/* --------------------------------------------------------------------- page */

function ResponsiveGalleryCamera() {
  const { camera, size } = useThree();
  useEffect(() => {
    const isSmallMobile = size.width < 480;
    const isMobile = size.width < 768;
    const targetZ = isSmallMobile ? 8.6 : isMobile ? 7.8 : 7.2;
    camera.position.set(0, 0, targetZ);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, size.width]);
  return null;
}

export default function GalleryClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipElRef = useRef<HTMLDivElement>(null);
  const cursorElRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [selected, setSelected] = useState<{
    index: number;
    aspect: number;
    rect: OriginRect;
    remeasure: () => OriginRect | null;
  } | null>(null);

  const tubeScrollTarget = useRef(0);
  const tubeSpinVelocity = useRef(0);
  const tubeNaturalDir = useRef(1);
  const tubeAngle = useRef(0);
  const rotationSpeedScaleTarget = useRef(1);

  const dragPointerId = useRef<number | null>(null);
  const dragLastY = useRef(0);
  const dragStart = useRef({ x: 0, y: 0 });
  const pointerMovedRef = useRef(false);
  const viewerOpenRef = useRef(false);
  viewerOpenRef.current = !!selected;

  const targetCenterUv = useRef(new Vector2(0.5, 0.5));
  const hoveredProjectRef = useRef<string | null>(null);
  const cursorTarget = useRef({ x: 0, y: 0 });
  const cursorCurrent = useRef({ x: 0, y: 0 });
  const cursorActive = useRef(false);

  useEffect(() => {
    let animId: number;
    const updateDOM = () => {
      if (cursorActive.current && cursorElRef.current) {
        cursorCurrent.current.x += (cursorTarget.current.x - cursorCurrent.current.x) * 0.2;
        cursorCurrent.current.y += (cursorTarget.current.y - cursorCurrent.current.y) * 0.2;
        cursorElRef.current.style.transform = `translate3d(${cursorCurrent.current.x}px, ${cursorCurrent.current.y}px, 0)`;
      }

      if (tooltipElRef.current) {
        const text = hoveredProjectRef.current;
        if (text && !viewerOpenRef.current) {
          if (tooltipElRef.current.textContent !== text) {
            tooltipElRef.current.textContent = text;
          }
          tooltipElRef.current.style.opacity = '1';
        } else {
          tooltipElRef.current.style.opacity = '0';
        }
      }

      animId = requestAnimationFrame(updateDOM);
    };
    animId = requestAnimationFrame(updateDOM);
    return () => cancelAnimationFrame(animId);
  }, []);

  const onWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    if (viewerOpenRef.current) return;
    const dy = event.deltaY;
    tubeScrollTarget.current += dy * 0.004;
    tubeSpinVelocity.current += dy * 0.006;
    if (dy !== 0) tubeNaturalDir.current = dy < 0 ? -1 : 1;
  }, []);

  const onImageHoverStart = useCallback((projectName: string, _event: ThreeEvent<PointerEvent>) => {
    hoveredProjectRef.current = projectName;
    rotationSpeedScaleTarget.current = 0.25;
  }, []);

  const onImageHoverEnd = useCallback(() => {
    hoveredProjectRef.current = null;
    rotationSpeedScaleTarget.current = 1;
  }, []);

  const onImageSelect = useCallback(
    (selection: {
      index: number;
      aspect: number;
      rect: OriginRect;
      remeasure: () => OriginRect | null;
    }) => {
      if (pointerMovedRef.current) return;
      setSelected(selection);
      rotationSpeedScaleTarget.current = 0;
      hoveredProjectRef.current = null;
    },
    [],
  );

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
      const dx = dragStart.current.x - event.clientX;
      dragLastY.current = event.clientY;
      tubeScrollTarget.current += dy * 0.0065;
      tubeSpinVelocity.current += dy * 0.01 + (dx > 0 ? 0.006 : -0.006);
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
    if (styleEl) styleEl.remove();
  }, [endDrag, onImageHoverEnd]);

  if (isMobile === true) {
    return <MobileGallery />;
  }

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-screen overflow-hidden bg-black text-white select-none touch-none"
      onWheel={onWheel}
      onPointerMove={onPointerMove}
      onPointerDown={onPointerDown}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={onPointerLeave}
    >
      <Canvas
        className="absolute inset-0"
        camera={{ position: [0, 0, 6.5], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ powerPreference: 'high-performance', antialias: false }}
        onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
      >
        <Suspense fallback={null}>
          <ResponsiveGalleryCamera />
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

      {/* Floating Hover Title HUD (RAF updated) */}
      <div
        ref={tooltipElRef}
        aria-hidden
        className="pointer-events-none fixed top-12 left-1/2 -translate-x-1/2 z-30 font-mono text-xs tracking-[0.3em] uppercase text-cyan-400 bg-black/80 backdrop-blur-md px-6 py-2 border border-cyan-500/30 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.25)] opacity-0 transition-opacity duration-200"
      />

      <CustomGalleryLoader />

      {/* DOM-rendered lightbox */}
      {selected && (
        <GalleryLightbox
          images={GALLERY_IMAGES}
          index={selected.index}
          aspect={selected.aspect}
          origin={selected.rect}
          containerRef={containerRef}
          measureOrigin={selected.remeasure}
          onIndexChange={(nextIndex) => {
            setSelected((prev) => (prev ? { ...prev, index: nextIndex } : null));
          }}
          onClose={() => {
            setSelected(null);
            rotationSpeedScaleTarget.current = 1;
          }}
        />
      )}
    </div>
  );
}
