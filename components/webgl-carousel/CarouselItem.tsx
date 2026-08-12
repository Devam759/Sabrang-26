'use client';

import { useEffect, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import gsap from 'gsap';
import * as THREE from 'three';
import Plane from './Plane';

export interface CarouselItemData {
  image: string;
  name?: string;
  role?: string;
}

interface CarouselItemProps {
  index: number;
  width: number;
  height: number;
  setActivePlane: (index: number | null) => void;
  activePlane: number | null;
  item: CarouselItemData;
}

const CarouselItem = ({
  index,
  width,
  height,
  setActivePlane,
  activePlane,
  item,
}: CarouselItemProps) => {
  const $root = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);
  const [isActive, setIsActive] = useState<boolean | null>(false);
  const [isCloseActive, setCloseActive] = useState(false);
  const { viewport } = useThree();
  const timeoutID = useRef<NodeJS.Timeout | number | null>(null);

  useEffect(() => {
    if (activePlane === index) {
      setIsActive(true);
      setCloseActive(true);
    } else {
      setIsActive(false);
    }
  }, [activePlane, index]);

  useEffect(() => {
    if ($root.current) {
      gsap.killTweensOf($root.current.position);
      gsap.to($root.current.position, {
        z: isActive ? 0 : -0.01,
        duration: 0.2,
        ease: 'power3.out',
        delay: isActive ? 0 : 2,
      });
    }
  }, [isActive]);

  /* Hover scale effect */
  useEffect(() => {
    if ($root.current) {
      const hoverScale = hover && !isActive ? 1.1 : 1;
      gsap.to($root.current.scale, {
        x: hoverScale,
        y: hoverScale,
        duration: 0.5,
        ease: 'power3.out',
      });
    }
  }, [hover, isActive]);

  const handleClose = (e: any) => {
    e.stopPropagation();
    if (!isActive) return;
    setActivePlane(null);
    setHover(false);
    if (timeoutID.current) clearTimeout(timeoutID.current);;
    timeoutID.current = setTimeout(() => {
      setCloseActive(false);
    }, 1500);
  };

  return (
    <group
      ref={$root}
      onClick={() => {
        setActivePlane(index);
      }}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <Plane
        width={width}
        height={height}
        texture={item.image}
        active={isActive}
      />

      <Html
        position={[-width / 2 + 0.05, -height / 2 + 0.05, activePlane !== null ? -0.05 : 0.005]}
        zIndexRange={activePlane !== null ? [-50, -100] : [100, 0]}
        pointerEvents="none"
        style={{
          userSelect: 'none',
          transition: 'all 0.3s ease',
          opacity: hover ? 1 : 0.85,
          transform: 'translate(0, -100%)',
          mixBlendMode: 'difference',
          zIndex: activePlane !== null ? -1 : 10,
        }}
      >
        <div style={{
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
          color: '#ffffff',
          fontSize: '14px',
          fontWeight: '900',
          textTransform: 'uppercase',
          letterSpacing: '0.22em',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          whiteSpace: 'nowrap',
        }}>
          {item.role === 'Organizing Head' ? 'ORGANIZING HEAD' : item.role?.replace(' Core', '').toUpperCase()}
        </div>
      </Html>

      {isCloseActive ? (
        <mesh position={[0, 0, 0.01]} onClick={handleClose}>
          <planeGeometry args={[viewport.width || 1, viewport.height || 1]} />
          <meshBasicMaterial transparent={true} opacity={0} color={'red'} />
        </mesh>
      ) : null}
    </group>
  );
};

export default CarouselItem;
