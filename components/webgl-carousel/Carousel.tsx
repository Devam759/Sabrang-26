'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import * as THREE from 'three';
import PostProcessing from './PostProcessing';
import CarouselItem, { CarouselItemData } from './CarouselItem';
import { lerp, getPiramidalIndex, usePrevious } from './utils';

/* Plane Settings */
const planeSettings = {
  width: 0.72,
  height: 1.9,
  gap: 0.08,
};

const heightVariantsDesktop = [1.8, 2.0, 1.75, 1.95, 1.85, 2.05, 1.78, 1.9, 1.82, 1.98];
const widthVariantsMobile = [1.8, 2.0, 1.75, 1.95, 1.85, 2.05, 1.78, 1.9, 1.82, 1.98];

/* GSAP Defaults */
gsap.defaults({
  duration: 2.5,
  ease: 'power3.out',
});

interface CarouselProps {
  items: CarouselItemData[];
  onActiveItemChange?: (item: CarouselItemData | null) => void;
}

export default function Carousel({ items, onActiveItemChange }: CarouselProps) {
  const [$root, setRoot] = useState<THREE.Group | null>(null);
  const $post = useRef<any>(null);

  const [activePlane, setActivePlane] = useState<number | null>(null);
  const prevActivePlane = usePrevious(activePlane);
  const { viewport } = useThree();

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (onActiveItemChange) {
      onActiveItemChange(activePlane !== null ? items[activePlane] || null : null);
    }
  }, [activePlane, items, onActiveItemChange]);

  /* Vars */
  const progress = useRef(50);
  const startPos = useRef(0);
  const isDown = useRef(false);
  const speedWheel = 0.008;
  const speedDrag = -0.035;
  const oldProgress = useRef(50);
  const speed = useRef(0);

  const $items = useMemo(() => {
    if ($root) return $root.children;
    return [];
  }, [$root]);

  /* Display Items (Responsive: Horizontal on Desktop, Vertical on Mobile) */
  const displayItems = (item: THREE.Object3D, index: number, progressVal: number) => {
    const cardWidth = isMobile ? widthVariantsMobile[index % widthVariantsMobile.length] : planeSettings.width;
    const cardHeight = isMobile ? 0.85 : heightVariantsDesktop[index % heightVariantsDesktop.length];

    if (activePlane === index) {
      gsap.to(item.position, {
        x: 0,
        y: 0,
        duration: 0.6,
        ease: 'power3.out',
      });
      return;
    }

    if (isMobile) {
      // Mobile: Vertical flow (top to bottom) with horizontal cards
      const itemSpacing = cardHeight + planeSettings.gap;
      const totalHeight = $items.length * itemSpacing;
      const halfTotalY = totalHeight / 2;

      let rawY = -index * itemSpacing + (progressVal / 100) * totalHeight;
      let y = (((rawY + halfTotalY) % totalHeight) + totalHeight) % totalHeight - halfTotalY;

      gsap.to(item.position, {
        x: 0,
        y,
        duration: 0.1,
        ease: 'power2.out',
      });
    } else {
      // Desktop: Horizontal flow (left to right) with vertical cards
      const itemSpacing = cardWidth + planeSettings.gap;
      const totalWidth = $items.length * itemSpacing;
      const halfTotalX = totalWidth / 2;

      let rawX = index * itemSpacing - (progressVal / 100) * totalWidth;
      let x = (((rawX + halfTotalX) % totalWidth) + totalWidth) % totalWidth - halfTotalX;

      const y = 1.0 - cardHeight / 2;

      gsap.to(item.position, {
        x,
        y,
        duration: 0.1,
        ease: 'power2.out',
      });
    }
  };

  /* RAF with Seamless Infinite Scroll */
  useFrame(() => {
    $items.forEach((item, index) => displayItems(item, index, oldProgress.current));
    speed.current = lerp(
      speed.current,
      Math.abs(oldProgress.current - progress.current),
      0.1
    );

    oldProgress.current = lerp(oldProgress.current, progress.current, 0.1);

    if ($post.current) {
      $post.current.thickness = speed.current;
    }
  });

  /* Handle Wheel - Localized strictly to Carousel component */
  const handleWheel = (e: any) => {
    if (activePlane !== null) return;
    const delta = isMobile
      ? (Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX)
      : (Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX);
    progress.current = progress.current + delta * speedWheel;
  };

  /* Handle Down */
  const handleDown = (e: any) => {
    if (activePlane !== null) return;
    isDown.current = true;
    const clientX = e.clientX ?? e.nativeEvent?.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
    const clientY = e.clientY ?? e.nativeEvent?.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0;
    startPos.current = isMobile ? clientY : clientX;
  };

  /* Handle Up */
  const handleUp = () => {
    isDown.current = false;
  };

  /* Handle Move */
  const handleMove = (e: any) => {
    if (activePlane !== null || !isDown.current) return;
    const clientX = e.clientX ?? e.nativeEvent?.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
    const clientY = e.clientY ?? e.nativeEvent?.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0;
    const currentPos = isMobile ? clientY : clientX;
    const delta = currentPos - startPos.current;
    if (delta !== 0) {
      progress.current = progress.current + (isMobile ? -delta : delta) * speedDrag;
      startPos.current = currentPos;
    }
  };

  /* Global window pointer release listener so fast drags never stick */
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      isDown.current = false;
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('mouseup', handleGlobalPointerUp);
    window.addEventListener('touchend', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('mouseup', handleGlobalPointerUp);
      window.removeEventListener('touchend', handleGlobalPointerUp);
    };
  }, []);

  /* Click sync */
  useEffect(() => {
    if (!$items || $items.length === 0) return;
    if (activePlane !== null && (prevActivePlane === null || prevActivePlane === undefined)) {
      progress.current = (activePlane / ($items.length - 1)) * 100;
    }
  }, [activePlane, $items, prevActivePlane]);

  /* Render Plane Events */
  const renderPlaneEvents = () => {
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
        <planeGeometry args={[viewport.width, viewport.height]} />
        <meshBasicMaterial transparent={true} opacity={0} />
      </mesh>
    );
  };

  /* Render Slider */
  const renderSlider = () => {
    return (
      <group ref={(node) => setRoot(node)}>
        {items.map((item, i) => {
          const cardWidth = isMobile ? widthVariantsMobile[i % widthVariantsMobile.length] : planeSettings.width;
          const cardHeight = isMobile ? 0.85 : heightVariantsDesktop[i % heightVariantsDesktop.length];
          return (
            <CarouselItem
              width={cardWidth}
              height={cardHeight}
              setActivePlane={setActivePlane}
              activePlane={activePlane}
              key={item.image + i}
              item={item}
              index={i}
            />
          );
        })}
      </group>
    );
  };

  return (
    <group>
      {renderPlaneEvents()}
      {renderSlider()}
      <PostProcessing ref={$post} />
    </group>
  );
}
