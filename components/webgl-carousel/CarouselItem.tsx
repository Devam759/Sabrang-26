"use client";

import { useEffect, useRef, useState } from "react";
import { useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import gsap from "gsap";
import * as THREE from "three";
import Plane from "./Plane";

export interface CarouselItemData {
  image: string;
  name?: string;
  role?: string;
  links?: {
    instagram?: string;
    linkedin?: string;
    github?: string;
    email?: string;
    website?: string;
  };
}

interface CarouselItemProps {
  index: number;
  width: number;
  height: number;
  setActivePlane: (index: number | null) => void;
  activePlane: number | null;
  item: CarouselItemData;
  isMobile?: boolean;
  onHoverChange?: (isHovered: boolean) => void;
}

const CarouselItem = ({
  index,
  width,
  height,
  setActivePlane,
  activePlane,
  item,
  isMobile = false,
  onHoverChange,
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
        ease: "power3.out",
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
        ease: "power3.out",
      });
    }
  }, [hover, isActive]);

  const handleClose = (e: any) => {
    e.stopPropagation();
    if (!isActive) return;
    setActivePlane(null);
    setHover(false);
    onHoverChange?.(false);
    if (timeoutID.current) clearTimeout(timeoutID.current);
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
      onPointerEnter={(e) => {
        e.stopPropagation();
        setHover(true);
        onHoverChange?.(true);
      }}
      onPointerLeave={(e) => {
        e.stopPropagation();
        setHover(false);
        onHoverChange?.(false);
      }}
    >
      <Plane
        width={width}
        height={height}
        texture={item.image}
        active={isActive}
      />

      <Html
        position={[
          isMobile
            ? -(Math.min(width || 1, (viewport.width && Number.isFinite(viewport.width)) ? viewport.width : 2) / 2) + 0.08
            : -(width || 0.72) / 2 + 0.05,
          -(height || 1.8) / 2 + 0.05,
          0.02,
        ]}
        pointerEvents="none"
        style={{
          userSelect: "none",
          pointerEvents: "none",
          transition: "opacity 0.3s ease",
          opacity: activePlane !== null ? 0 : hover ? 1 : 0.9,
          transform: "translate(0, -100%)",
          zIndex: 30,
        }}
      >
        <div
          style={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            color: "#ffffff",
            fontSize: isMobile ? "12px" : "14px",
            fontWeight: "900",
            textTransform: "uppercase",
            letterSpacing: isMobile ? "0.16em" : "0.22em",
            fontFamily: "system-ui, -apple-system, sans-serif",
            whiteSpace: "nowrap",
            textShadow:
              "0 2px 8px rgba(0, 0, 0, 0.95), 0 0 4px rgba(0, 0, 0, 0.9)",
          }}
        >
          {item.role === "Organizing Head"
            ? "ORGANIZING HEAD"
            : item.role?.replace(" Core", "").toUpperCase()}
        </div>
      </Html>

      {isCloseActive ? (
        <mesh position={[0, 0, 0.01]} onClick={handleClose}>
          <planeGeometry
            args={[
              viewport.width && Number.isFinite(viewport.width) && viewport.width > 0
                ? viewport.width
                : 10,
              viewport.height && Number.isFinite(viewport.height) && viewport.height > 0
                ? viewport.height
                : 10,
            ]}
          />
          <meshBasicMaterial transparent={true} opacity={0} color={"red"} />
        </mesh>
      ) : null}
    </group>
  );
};

export default CarouselItem;
