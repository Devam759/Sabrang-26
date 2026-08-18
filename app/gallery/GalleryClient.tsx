"use client";

import { Canvas, type ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ClampToEdgeWrapping,
  DoubleSide,
  LinearFilter,
  Mesh,
  Object3D,
  PlaneGeometry,
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
import CursorGrid from '@/components/ui/CursorGrid';

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

const TILE_W = 0.95;
const TILE_H = 1;
const TILE_GEOMETRY = new PlaneGeometry(TILE_W, TILE_H);

const textureLoader = new TextureLoader();
// Keyed by src and holding the in-flight promise, not the finished texture: the
// tube mounts 150 meshes over 50 distinct images, so caching only on completion
// let every image be requested three times over.
const textureCache = new Map<string, Promise<Texture>>();

// The source webps are ~600KB each and a tile never covers more than ~400px of
// screen. Fetching all 50 at full size is 30MB of stalled requests, which is why
// the tube came up black; Next's built-in optimiser cuts that by ~15x.
// q must be one of next.config's `images.qualities` — anything else is a 400.
const optimized = (src: string, w: number) =>
  `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=75`;

// The lightbox goes full-screen, so it gets a real resolution rather than the
// tube's thumbnail — but still optimised, or clicking a tile would stall on a
// fresh 600KB original that nothing has warmed the cache with.
const LIGHTBOX_IMAGES = GALLERY_IMAGES.map((image) => ({
  ...image,
  src: optimized(image.src, 1920),
}));

function loadTile(src: string): Promise<Texture> {
  const cached = textureCache.get(src);
  if (cached) return cached;

  const pending = new Promise<Texture>((resolve, reject) => {
    textureLoader.load(optimized(src, 640), resolve, undefined, reject);
  }).then((tex) => {
    tex.colorSpace = SRGBColorSpace;
    tex.minFilter = LinearFilter;
    tex.magFilter = LinearFilter;
    tex.generateMipmaps = false;
    tex.anisotropy = 4;
    tex.wrapS = ClampToEdgeWrapping;
    tex.wrapT = ClampToEdgeWrapping;

    // Cover-fit the image into the tile without distorting it.
    const img = tex.image as { width?: number; height?: number } | undefined;
    if (img?.width && img?.height) {
      const imgAspect = img.width / img.height;
      const target = TILE_W / TILE_H;
      if (imgAspect > target) {
        tex.repeat.set(target / imgAspect, 1);
        tex.offset.set((1 - target / imgAspect) / 2, 0);
      } else {
        tex.repeat.set(1, imgAspect / target);
        tex.offset.set(0, (1 - imgAspect / target) / 2);
      }
    }
    tex.needsUpdate = true;
    return tex;
  });

  textureCache.set(src, pending);
  return pending;
}

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
      <planeGeometry args={[45, 45, 96, 96]} />
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
              uniform vec2 uCenter;

              float gridLine(float coord, float width) {
                float f = fract(coord);
                float df = fwidth(coord);
                return 1.0 - smoothstep(0.0, width * df, f) * smoothstep(0.0, width * df, 1.0 - f);
              }

              void main() {
                vec2 uv = vUv * uGridScale;
                uv.y += uTime * uScrollSpeed * uGridScale;

                float fine = max(gridLine(uv.x, uLineWidth), gridLine(uv.y, uLineWidth));
                // Every 5th line is drawn brighter — the flat single-density grid read
                // as noise; a coarse tier gives the eye something to sit on.
                vec2 cuv = uv / 5.0;
                float coarse = max(gridLine(cuv.x, uLineWidth), gridLine(cuv.y, uLineWidth));

                // Fade out well before the plane's border so it never ends on a hard edge.
                float edgeFade = 1.0 - smoothstep(0.18, 0.48, distance(vUv, vec2(0.5)));
                // Light well that trails the pointer, matching the vertex dent.
                float well = exp(-distance(vUv, uCenter) * 5.5);
                float lit = edgeFade * (0.35 + well * 1.1);

                vec3 base = mix(vec3(0.0), vec3(0.045, 0.025, 0.085), well * edgeFade);
                vec3 fineCol = vec3(0.13, 0.11, 0.19);
                vec3 coarseCol = mix(vec3(0.10, 0.30, 0.45), vec3(0.32, 0.15, 0.52), vUv.y);

                vec3 col = base;
                col = mix(col, fineCol, clamp(fine * lit * 0.7, 0.0, 1.0));
                col = mix(col, coarseCol, clamp(coarse * lit, 0.0, 1.0));
                gl_FragColor = vec4(col, 1.0);
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
  theta,
  radius,
  texIndex,
  onHoverStart,
  onHoverEnd,
  onTileClick,
}: {
  src: string;
  theta: number;
  radius: number;
  texIndex: number;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onTileClick: (index: number, e: ThreeEvent<MouseEvent>, mesh: Mesh, tex: Texture | null) => void;
}) {
  const [texture, setTexture] = useState<Texture | null>(null);

  useEffect(() => {
    let isMounted = true;
    loadTile(src)
      .then((tex) => {
        if (isMounted) setTexture(tex);
      })
      .catch(() => {
        // graceful network fallback — the tile keeps its placeholder colour
      });
    return () => {
      isMounted = false;
    };
  }, [src]);

  return (
    <mesh
      geometry={TILE_GEOMETRY}
      position={[Math.cos(theta) * radius, 0, Math.sin(theta) * radius]}
      rotation={[0, Math.PI / 2 - theta, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHoverStart();
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
      {/* The key is load-bearing: a material compiled without a map keeps its
          no-texture shader when one is assigned later, so every late tile came up
          flat. Remounting on arrival gets a material built with the map — and
          sidesteps the reused-instance bug where the dropped `color` prop stuck at
          black and multiplied the textures away. DoubleSide because the far arc of
          the tube is back-facing and culling it leaves half the grid empty. */}
      <meshBasicMaterial
        key={texture ? 'textured' : 'placeholder'}
        map={texture}
        color={texture ? '#ffffff' : '#160e26'}
        toneMapped={false}
        side={DoubleSide}
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
  onHoverEnd,
  onImageSelect,
}: {
  scrollTargetRef: React.RefObject<number>;
  spinVelocityRef: React.RefObject<number>;
  naturalDirRef: React.RefObject<number>;
  tubeAngleRef: React.RefObject<number>;
  rotationSpeedScaleTargetRef: React.RefObject<number>;
  onHoverStart: () => void;
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
        point.set(cx * TILE_W, cy * TILE_H, 0).applyMatrix4(mesh.matrixWorld).project(camera);
        const x = (point.x * 0.5 + 0.5) * size.width;
        const y = (-point.y * 0.5 + 0.5) * size.height;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }

      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    },
    [camera, size.width, size.height],
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
      if (rowObj) {
        rowObj.rotation.y = angle.current * rowSpeed[rowIndex % ROWS];

        // Smoothly scale up the ring in the center of the screen
        const worldY = -scrollCurrent.current + rowPositions[rowIndex].y;
        const distance = Math.abs(worldY);
        const scale = 1.0 + 0.12 * Math.exp(-(distance * distance) / 3.0);
        rowObj.scale.setScalar(scale);
      }
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
                theta={theta}
                radius={radius}
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
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.dispatchEvent(new CustomEvent('sabrang-page-ready'));
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // The layout's footer makes the document ~70px taller than the viewport, and the
  // wheel feeds the tube without preventing the default scroll — so one flick both
  // spun the tube and scrolled the page, which tripped the navbar's hide-on-scroll
  // and took the menu button away. The gallery is a fixed scene; it never scrolls.
  useEffect(() => {
    // MobileGallery is a scrolling grid, so the lock is desktop-only.
    if (isMobile !== false) return;
    const { documentElement, body } = document;
    const previous = [documentElement.style.overflow, body.style.overflow] as const;
    documentElement.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      documentElement.style.overflow = previous[0];
      body.style.overflow = previous[1];
    };
  }, [isMobile]);

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

  const onWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    if (viewerOpenRef.current) return;
    const dy = event.deltaY;
    tubeScrollTarget.current += dy * 0.004;
    tubeSpinVelocity.current += dy * 0.006;
    if (dy !== 0) tubeNaturalDir.current = dy < 0 ? -1 : 1;
  }, []);

  const onImageHoverStart = useCallback(() => {
    rotationSpeedScaleTarget.current = 0.25;
  }, []);

  const onImageHoverEnd = useCallback(() => {
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
    endDrag();
    onImageHoverEnd();
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
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-black">
        <CursorGrid
          cellSize={70}
          color="#a855f7"
          radius={320}
          falloff="smooth"
          holdTime={400}
          fadeDuration={800}
          lineWidth={1.2}
          maxOpacity={0.85}
          fillOpacity={0.05}
          gridOpacity={0}
          cellRadius={8}
          clickPulse={true}
          pulseSpeed={600}
        />
      </div>

      <Canvas
        className="absolute inset-0 z-10"
        camera={{ position: [0, 0, 6.5], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ powerPreference: 'high-performance', antialias: false }}
        onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
      >
        <Suspense fallback={null}>
          <ResponsiveGalleryCamera />
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 8, 5]} intensity={1.5} />
          <directionalLight position={[-5, -5, -5]} intensity={0.5} />
          <hemisphereLight args={['#ffffff', '#000000', 0.4]} />

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
        className="pointer-events-none absolute inset-0 z-[5] bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_58%,#000_100%)]"
      />

      <h1 className="sr-only">Gallery</h1>

      {/* DOM-rendered lightbox */}
      {selected && (
        <GalleryLightbox
          images={LIGHTBOX_IMAGES}
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
