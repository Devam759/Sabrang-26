"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useFrame, useThree, extend } from "@react-three/fiber";
import gsap from "gsap";
import * as THREE from "three";
import PostProcessing from "./PostProcessing";
import CarouselItem, { CarouselItemData } from "./CarouselItem";
import { lerp, getPiramidalIndex, usePrevious } from "./utils";
import { useTexture, shaderMaterial } from "@react-three/drei";

/* Plane Settings */
const planeSettings = {
  width: 0.72,
  height: 1.9,
  gap: 0.08,
};

const heightVariantsDesktop = [
  1.8, 2.0, 1.75, 1.95, 1.85, 2.05, 1.78, 1.9, 1.82, 1.98,
];
const widthVariantsMobile = [
  1.8, 2.0, 1.75, 1.95, 1.85, 2.05, 1.78, 1.9, 1.82, 1.98,
];

/* GSAP Defaults */
gsap.defaults({
  duration: 2.5,
  ease: "power3.out",
});

interface CarouselProps {
  items: CarouselItemData[];
  onActiveItemChange?: (item: CarouselItemData | null) => void;
}

const MinimalBackgroundMaterial = shaderMaterial(
  {
    uTime: 0,
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform float uTime;
    varying vec2 vUv;
    void main() {
      vec2 uv = vUv;
      vec3 color1 = vec3(0.04, 0.02, 0.08); // Deep dark violet
      vec3 color2 = vec3(0.01, 0.01, 0.02); // Dark rich black-grey
      vec3 color3 = vec3(0.05, 0.03, 0.09);  // Subtle violet glow
      
      float mixVal = sin(uv.x * 1.5 + uTime * 0.15) * 0.5 + 0.5;
      mixVal += cos(uv.y * 1.5 - uTime * 0.2) * 0.5 + 0.5;
      mixVal /= 2.0;
      
      vec3 finalColor = mix(color2, mix(color1, color3, uv.y), mixVal);
      
      // Subtle noise to prevent banding
      float noise = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
      finalColor += (noise - 0.5) * 0.012;
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
);

extend({ MinimalBackgroundMaterial });

function Background() {
  const { viewport } = useThree();
  const materialRef = useRef<any>(null);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.getElapsedTime();
    }
  });

  const width =
    viewport.width && Number.isFinite(viewport.width) && viewport.width > 0
      ? viewport.width
      : 10;
  const height =
    viewport.height && Number.isFinite(viewport.height) && viewport.height > 0
      ? viewport.height
      : 10;

  return (
    <mesh position={[0, 0, -3]} scale={[width * 2.5, height * 2.5, 1]}>
      <planeGeometry />
      {/* @ts-ignore */}
      <minimalBackgroundMaterial ref={materialRef} depthWrite={false} />
    </mesh>
  );
}

export default function Carousel({ items, onActiveItemChange }: CarouselProps) {
  const [$root, setRoot] = useState<THREE.Group | null>(null);
  const $post = useRef<any>(null);

  const [activePlane, setActivePlane] = useState<number | null>(null);
  const prevActivePlane = usePrevious(activePlane);
  const { viewport, gl } = useThree();

  const [isMobile, setIsMobile] = useState(false);
  const isCardHovered = useRef(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (onActiveItemChange) {
      onActiveItemChange(
        activePlane !== null ? items[activePlane] || null : null,
      );
    }
  }, [activePlane, items, onActiveItemChange]);

  /* Vars */
  const progress = useRef(4.6875);
  const startPos = useRef(0);
  const isDown = useRef(false);
  const speedWheel = 0.008;
  const speedDrag = -0.035;
  const autoPlaySpeed = 0.018; // Calmer, slower steady automatic drift velocity
  const oldProgress = useRef(4.6875);
  const speed = useRef(0);

  const $items = useMemo(() => {
    if ($root) return $root.children;
    return [];
  }, [$root]);

  /* Display Items (Responsive: Horizontal on Desktop, Vertical on Mobile) */
  const displayItems = (
    item: THREE.Object3D,
    index: number,
    progressVal: number,
  ) => {
    const itemCount = items.length;
    if (itemCount === 0) return;

    const cardWidth = isMobile
      ? widthVariantsMobile[index % widthVariantsMobile.length]
      : planeSettings.width;
    const cardHeight = isMobile
      ? 0.85
      : heightVariantsDesktop[index % heightVariantsDesktop.length];

    if (activePlane === index) {
      const curX = Number.isFinite(item.position.x) ? item.position.x : 0;
      const curY = Number.isFinite(item.position.y) ? item.position.y : 0;
      item.position.x = THREE.MathUtils.lerp(curX, 0, 0.15);
      item.position.y = THREE.MathUtils.lerp(curY, 0, 0.15);
      return;
    }

    if (isMobile) {
      // Mobile: Vertical flow (top to bottom) with horizontal cards
      const itemSpacing = cardHeight + planeSettings.gap;
      const totalHeight = itemCount * itemSpacing;
      if (totalHeight <= 0 || !Number.isFinite(totalHeight)) return;
      const halfTotalY = totalHeight / 2;

      const safeProgress = Number.isFinite(progressVal) ? progressVal : 0;
      let rawY = -index * itemSpacing + (safeProgress / 100) * totalHeight;
      let y =
        ((((rawY + halfTotalY) % totalHeight) + totalHeight) % totalHeight) -
        halfTotalY;

      item.position.x = 0;
      item.position.y = Number.isFinite(y) ? y : 0;
    } else {
      // Desktop: Horizontal flow (left to right) with vertical cards
      const itemSpacing = cardWidth + planeSettings.gap;
      const totalWidth = itemCount * itemSpacing;
      if (totalWidth <= 0 || !Number.isFinite(totalWidth)) return;
      const halfTotalX = totalWidth / 2;

      const safeProgress = Number.isFinite(progressVal) ? progressVal : 0;
      let rawX = index * itemSpacing - (safeProgress / 100) * totalWidth;
      let x =
        ((((rawX + halfTotalX) % totalWidth) + totalWidth) % totalWidth) -
        halfTotalX;

      const y = 0.75 - cardHeight / 2;

      item.position.x = Number.isFinite(x) ? x : 0;
      item.position.y = Number.isFinite(y) ? y : 0;
    }
  };

  /* RAF with Seamless Infinite Auto-Scroll */
  useFrame((_, delta) => {
    // Automatically advance slider ONLY when no card is opened, no card is hovered, and not dragging
    if (activePlane === null && !isCardHovered.current && !isDown.current) {
      const dt = Math.min(delta, 0.033);
      progress.current += autoPlaySpeed * (dt * 60);
    }

    $items.forEach((item, index) =>
      displayItems(item, index, oldProgress.current),
    );
    const diff = Math.abs(oldProgress.current - progress.current);
    speed.current = lerp(
      Number.isFinite(speed.current) ? speed.current : 0,
      Number.isFinite(diff) ? diff : 0,
      0.1,
    );

    oldProgress.current = lerp(
      Number.isFinite(oldProgress.current) ? oldProgress.current : 0,
      Number.isFinite(progress.current) ? progress.current : 0,
      0.1,
    );

    if ($post.current) {
      $post.current.thickness = Math.min(0.25, Number.isFinite(speed.current) ? speed.current : 0);
    }
  });

  /* Handle Wheel - Localized strictly to Carousel component */
  const handleWheel = (e: any) => {
    if (activePlane !== null) return;
    const delta = isMobile
      ? Math.abs(e.deltaY) > Math.abs(e.deltaX)
        ? e.deltaY
        : e.deltaX
      : Math.abs(e.deltaY) > Math.abs(e.deltaX)
        ? e.deltaY
        : e.deltaX;
    progress.current = progress.current + delta * speedWheel;
  };

  /* Handle Down */
  const handleDown = (e: any) => {
    if (activePlane !== null) return;
    isDown.current = true;
    const clientX =
      e.clientX ??
      e.nativeEvent?.clientX ??
      (e.touches && e.touches[0]?.clientX) ??
      0;
    const clientY =
      e.clientY ??
      e.nativeEvent?.clientY ??
      (e.touches && e.touches[0]?.clientY) ??
      0;
    startPos.current = isMobile ? clientY : clientX;
  };

  /* Handle Up */
  const handleUp = () => {
    isDown.current = false;
  };

  /* Handle Move */
  const handleMove = (e: any) => {
    if (activePlane !== null || !isDown.current) return;
    const clientX =
      e.clientX ??
      e.nativeEvent?.clientX ??
      (e.touches && e.touches[0]?.clientX) ??
      0;
    const clientY =
      e.clientY ??
      e.nativeEvent?.clientY ??
      (e.touches && e.touches[0]?.clientY) ??
      0;
    const currentPos = isMobile ? clientY : clientX;
    const delta = currentPos - startPos.current;
    if (delta !== 0) {
      progress.current = progress.current + delta * speedDrag;
      startPos.current = currentPos;
    }
  };

  /* Global window pointer release listener so fast drags never stick */
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      isDown.current = false;
    };
    window.addEventListener("pointerup", handleGlobalPointerUp);
    window.addEventListener("mouseup", handleGlobalPointerUp);
    window.addEventListener("touchend", handleGlobalPointerUp);
    return () => {
      window.removeEventListener("pointerup", handleGlobalPointerUp);
      window.removeEventListener("mouseup", handleGlobalPointerUp);
      window.removeEventListener("touchend", handleGlobalPointerUp);
    };
  }, []);

  /* Click sync */
  useEffect(() => {
    if (items.length <= 1) return;
    if (
      activePlane !== null &&
      (prevActivePlane === null || prevActivePlane === undefined)
    ) {
      progress.current = (activePlane / (items.length - 1)) * 100;
    }
  }, [activePlane, items.length, prevActivePlane]);

  /* Render Plane Events */
  const renderPlaneEvents = () => {
    const vpW = viewport.width && Number.isFinite(viewport.width) && viewport.width > 0 ? viewport.width : 10;
    const vpH = viewport.height && Number.isFinite(viewport.height) && viewport.height > 0 ? viewport.height : 10;
    return (
      <mesh
        position={[0, 0, -0.01]}
        onWheel={handleWheel}
        onPointerDown={handleDown}
        onPointerUp={handleUp}
        onPointerMove={handleMove}
        onPointerLeave={handleUp}
        onPointerCancel={handleUp}
      >
        <planeGeometry args={[vpW, vpH]} />
        <meshBasicMaterial transparent={true} opacity={0} />
      </mesh>
    );
  };

  /* Render Slider */
  const renderSlider = () => {
    return (
      <group ref={(node) => setRoot(node)}>
        {items.map((item, i) => {
          const cardWidth = isMobile
            ? widthVariantsMobile[i % widthVariantsMobile.length]
            : planeSettings.width;
          const cardHeight = isMobile
            ? 0.85
            : heightVariantsDesktop[i % heightVariantsDesktop.length];
          return (
            <CarouselItem
              width={cardWidth}
              height={cardHeight}
              setActivePlane={setActivePlane}
              activePlane={activePlane}
              key={item.image + i}
              item={item}
              index={i}
              isMobile={isMobile}
              onHoverChange={(hovered) => {
                isCardHovered.current = hovered;
              }}
            />
          );
        })}
      </group>
    );
  };

  return (
    <group>
      <Background />
      {renderPlaneEvents()}
      {renderSlider()}
      <PostProcessing ref={$post} />
    </group>
  );
}
