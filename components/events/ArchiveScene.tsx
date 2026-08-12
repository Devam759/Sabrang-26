"use client";

/**
 * The WebGL half of Gallery Highlights.
 *
 * Adapted from the `ImageSphere` + snap-to-nearest logic in matdn/helmet's
 * CodropScene. What was kept: the Fibonacci-sphere tile layout, the inertial
 * drag/damping model, and the cost-minimising snap that rotates the closest
 * tile to face the camera — that snap is what makes a photograph feel
 * *discovered* rather than advanced to.
 *
 * What was changed for this festival archive:
 *  - the wheel steps one photograph at a time and the existing snap eases the
 *    rotation, so the archive never rotates by a raw scroll delta
 *  - each photograph appears exactly once, at its true aspect ratio
 *  - the tile facing the camera scales up and brightens; everything else
 *    recedes, giving one dominant image at a time
 *  - the helmet model, studio HDR environment and grid-plane shader are gone;
 *    the photographs are the only subject
 */

import {
  Canvas,
  useFrame,
  useThree,
  type ThreeEvent,
} from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { GalleryItem } from "@/lib/highlights-data";

const TWO_PI = Math.PI * 2;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

const SHELL_RADIUS = 4.1;

/**
 * Sized against the camera, not by eye: the focused tile sits at the front of
 * the shell (2.5 units out), where the frustum is 2.23 units tall. At
 * TILE_HEIGHT * FOCUS_SCALE ≈ 1.05 it fills a little under half the viewport —
 * dominant, but with the rest of the archive still legible around it.
 */
const TILE_HEIGHT = 0.62;
const FOCUS_SCALE = 1.7;
/** A phone is width-constrained, so it needs its own ratio. */
const FOCUS_SCALE_NARROW = 2.2;
const FOCUS_OPACITY = 1;
const RESTING_OPACITY = 0.58;

const MAX_PITCH = 0.72;
const DAMPING = 0.9;
const DRAG_TO_ANGLE = 0.0032;

type TilePlacement = {
  /** Unit direction from the centre of the sphere. */
  dir: THREE.Vector3;
  position: THREE.Vector3;
  itemIndex: number;
};

/** Deterministic 0..1 hash — keeps depth jitter stable across renders. */
function hash01(i: number) {
  const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
}

function wrapPi(a: number) {
  let v = (a + Math.PI) % TWO_PI;
  if (v < 0) v += TWO_PI;
  return v - Math.PI;
}

/**
 * A neutral stand-in for a photograph that has not been added to /public yet,
 * so a missing file degrades to an archive slug rather than a broken scene.
 */
function createPlaceholderTexture(item: GalleryItem, index: number) {
  // Sized for the focused tile at full scale on a retina screen; anything
  // smaller reads as a blurred upscale the moment a photograph takes focus.
  const w = 768;
  const h = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    ctx.fillStyle = "#1b1f2e";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(129, 140, 248, 0.55)";
    ctx.lineWidth = 6;
    ctx.strokeRect(24, 24, w - 48, h - 48);

    ctx.fillStyle = "rgba(226, 232, 240, 0.92)";
    ctx.font = "700 192px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(index + 1).padStart(2, "0"), w / 2, h / 2);

    ctx.fillStyle = "rgba(148, 163, 184, 0.8)";
    ctx.font = "600 48px system-ui, sans-serif";
    ctx.fillText(item.category.toUpperCase(), w / 2, h / 2 + 120);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function useArchiveTextures(items: GalleryItem[]) {
  const [textures, setTextures] = useState<THREE.Texture[] | null>(null);

  useEffect(() => {
    let live = true;
    let owned: THREE.Texture[] = [];
    const loader = new THREE.TextureLoader();

    Promise.all(
      items.map(
        (item, index) =>
          new Promise<THREE.Texture>((resolve) => {
            loader.load(
              item.image,
              (texture) => {
                texture.colorSpace = THREE.SRGBColorSpace;
                texture.minFilter = THREE.LinearMipmapLinearFilter;
                texture.anisotropy = 4;
                resolve(texture);
              },
              undefined,
              () => resolve(createPlaceholderTexture(item, index)),
            );
          }),
      ),
    ).then((loaded) => {
      owned = loaded;
      if (!live) {
        loaded.forEach((texture) => texture.dispose());
        return;
      }
      setTextures(loaded);
    });

    return () => {
      live = false;
      owned.forEach((texture) => texture.dispose());
    };
  }, [items]);

  return textures;
}

type ArchiveSphereProps = {
  items: GalleryItem[];
  textures: THREE.Texture[];
  yawOffsetRef: React.RefObject<number>;
  pitchRef: React.RefObject<number>;
  spinYawRef: React.RefObject<number>;
  spinPitchRef: React.RefObject<number>;
  isDraggingRef: React.RefObject<boolean>;
  snapActiveRef: React.RefObject<boolean>;
  snapYawRef: React.RefObject<number>;
  snapPitchRef: React.RefObject<number>;
  registerPlacements: (placements: TilePlacement[]) => void;
  onFocusChange: (itemIndex: number) => void;
  onTilePointerDown: (itemIndex: number) => void;
};

function ArchiveSphere({
  items,
  textures,
  yawOffsetRef,
  pitchRef,
  spinYawRef,
  spinPitchRef,
  isDraggingRef,
  snapActiveRef,
  snapYawRef,
  snapPitchRef,
  registerPlacements,
  onFocusChange,
  onTilePointerDown,
}: ArchiveSphereProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRefs = useRef<Array<THREE.Mesh | null>>([]);
  const focusedRef = useRef(-1);

  /** One geometry for every tile; per-tile size comes from mesh.scale. */
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const materials = useMemo(
    () =>
      textures.map(
        (map) =>
          new THREE.MeshBasicMaterial({
            map,
            toneMapped: false,
            transparent: true,
            opacity: RESTING_OPACITY,
            // Front face only: a photograph seen from behind would render
            // mirrored, and culling the far hemisphere is cheaper too.
            side: THREE.FrontSide,
          }),
      ),
    [textures],
  );

  useEffect(
    () => () => {
      materials.forEach((material) => material.dispose());
    },
    [materials],
  );

  /** Natural width per tile, from the real texture aspect. */
  const tileSizes = useMemo(
    () =>
      textures.map((texture) => {
        const image = texture.image as
          { width?: number; height?: number } | undefined;
        const aspect =
          image?.width && image?.height ? image.width / image.height : 0.75;
        const clamped = Math.min(2.1, Math.max(0.55, aspect));
        return { width: TILE_HEIGHT * clamped, height: TILE_HEIGHT };
      }),
    [textures],
  );

  const placements = useMemo(() => {
    const count = items.length;

    // Fibonacci shell, then assigned middle-out: the first photograph takes the
    // most equatorial position and later ones fan above and below it. Combined
    // with the base rotation below, the archive opens on photograph 01 dead
    // centre instead of on whichever tile happened to land facing the camera.
    // The shell can only be as tall as the snap can tilt. Tiles used to reach
    // |y| = 0.82, which needs a pitch of 0.96 — past MAX_PITCH, so the last
    // photographs could never come to centre: they parked near the top or
    // bottom edge, half off-screen, while the caption said they had focus.
    const maxY = Math.sin(MAX_PITCH) * 0.95;

    const slots = Array.from({ length: count }, (_, i) => {
      const t = count <= 1 ? 0.5 : i / (count - 1);
      const y = (1 - t * 2) * maxY;
      return {
        y,
        ring: Math.sqrt(Math.max(0, 1 - y * y)),
        theta: GOLDEN_ANGLE * i,
      };
    });

    const order = slots
      .map((_, i) => i)
      .sort((a, b) => Math.abs(slots[a].y) - Math.abs(slots[b].y));

    const baseTheta = slots[order[0]].theta - Math.PI / 2;

    return order.map((slotIndex, itemIndex) => {
      const slot = slots[slotIndex];
      const theta = slot.theta - baseTheta;

      const dir = new THREE.Vector3(
        Math.cos(theta) * slot.ring,
        slot.y,
        Math.sin(theta) * slot.ring,
      ).normalize();

      // One true radius for every tile. Depth used to be jittered per tile,
      // which let whichever tile happened to draw a near radius sit 3 units
      // from a camera 6.6 out — it took focus at three times the size of every
      // other photograph, skewed by perspective. Uniform radius means the
      // subject is the same size wherever it comes from.
      return {
        dir,
        position: dir.clone().multiplyScalar(SHELL_RADIUS),
        itemIndex,
      };
    });
  }, [items.length]);

  useEffect(() => {
    registerPlacements(placements);
  }, [placements, registerPlacements]);

  /**
   * A small fixed tilt per photograph. Without it the tiles read as sprites;
   * with it they read as prints pinned at slightly careless angles.
   */
  const tilts = useMemo(
    () =>
      placements.map((_, i) =>
        new THREE.Quaternion().setFromEuler(
          new THREE.Euler(
            (hash01(i + 11) - 0.5) * 0.12,
            (hash01(i + 29) - 0.5) * 0.16,
            (hash01(i + 47) - 0.5) * 0.09,
          ),
        ),
      ),
    [placements],
  );

  // Scratch objects — reused every frame so the render loop allocates nothing.
  const scratch = useMemo(
    () => ({
      euler: new THREE.Euler(),
      quaternion: new THREE.Quaternion(),
      inverse: new THREE.Quaternion(),
      vector: new THREE.Vector3(),
    }),
    [],
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const decay = Math.pow(DAMPING, dt * 60);
    const focusScale =
      state.size.width < 768 ? FOCUS_SCALE_NARROW : FOCUS_SCALE;

    spinYawRef.current *= decay;
    spinPitchRef.current *= decay;

    yawOffsetRef.current += spinYawRef.current * dt;
    pitchRef.current += spinPitchRef.current * dt;
    pitchRef.current = Math.min(
      MAX_PITCH,
      Math.max(-MAX_PITCH, pitchRef.current),
    );

    if (snapActiveRef.current && !isDraggingRef.current) {
      const alpha = 1 - Math.pow(0.9, dt * 60);
      const targetOffset = snapYawRef.current;

      yawOffsetRef.current +=
        wrapPi(targetOffset - yawOffsetRef.current) * alpha;
      pitchRef.current += (snapPitchRef.current - pitchRef.current) * alpha;

      spinYawRef.current *= 0.86;
      spinPitchRef.current *= 0.86;

      const yawErr = Math.abs(wrapPi(targetOffset - yawOffsetRef.current));
      if (
        yawErr < 0.003 &&
        Math.abs(snapPitchRef.current - pitchRef.current) < 0.003
      ) {
        yawOffsetRef.current += wrapPi(targetOffset - yawOffsetRef.current);
        pitchRef.current = snapPitchRef.current;
        spinYawRef.current = 0;
        spinPitchRef.current = 0;
        snapActiveRef.current = false;
      }
    }

    const yaw = yawOffsetRef.current;
    const pitch = pitchRef.current;

    const group = groupRef.current;
    if (group) {
      group.rotation.set(pitch, yaw, 0);
    }

    // Whichever tile now points most directly at the camera becomes the subject.
    scratch.quaternion.setFromEuler(scratch.euler.set(pitch, yaw, 0));

    let bestIndex = 0;
    let bestAlignment = -Infinity;

    for (let i = 0; i < placements.length; i++) {
      const alignment = scratch.vector
        .copy(placements[i].dir)
        .applyQuaternion(scratch.quaternion).z;

      if (alignment > bestAlignment) {
        bestAlignment = alignment;
        bestIndex = i;
      }
    }

    // While a snap is easing, the caption would otherwise tick through every
    // tile that crosses the centre on the way. The destination is already
    // known by whoever asked for the snap, so stay quiet until it lands.
    if (bestIndex !== focusedRef.current && !snapActiveRef.current) {
      focusedRef.current = bestIndex;
      onFocusChange(placements[bestIndex].itemIndex);
    }

    const lerp = 1 - Math.pow(0.88, dt * 60);

    // Undo the group's rotation on each tile so every photograph keeps its face
    // to the viewer while the space itself turns. The per-tile tilt survives.
    scratch.inverse.copy(scratch.quaternion).invert();

    for (let i = 0; i < placements.length; i++) {
      const mesh = meshRefs.current[i];
      if (!mesh) continue;

      mesh.quaternion.copy(scratch.inverse).multiply(tilts[i]);

      const size = tileSizes[placements[i].itemIndex];
      const focused = i === bestIndex;
      const targetScale = focused ? focusScale : 1;

      const currentScale = mesh.scale.y / size.height;
      const nextScale = currentScale + (targetScale - currentScale) * lerp;

      mesh.scale.set(size.width * nextScale, size.height * nextScale, 1);

      const material = mesh.material as THREE.MeshBasicMaterial;
      const targetOpacity = focused ? FOCUS_OPACITY : RESTING_OPACITY;
      material.opacity += (targetOpacity - material.opacity) * lerp;
    }
  });

  return (
    <group ref={groupRef}>
      {placements.map(({ position, itemIndex }, index) => {
        const size = tileSizes[itemIndex];

        return (
          <mesh
            key={`tile-${itemIndex}`}
            ref={(mesh) => {
              meshRefs.current[index] = mesh;
            }}
            position={position}
            geometry={geometry}
            material={materials[itemIndex]}
            scale={[size.width, size.height, 1]}
            onPointerDown={(event: ThreeEvent<PointerEvent>) => {
              event.stopPropagation();
              onTilePointerDown(index);
            }}
          />
        );
      })}
    </group>
  );
}

type CameraRigProps = {
  pointerRef: React.RefObject<{ x: number; y: number }>;
};

/**
 * The camera holds a fixed distance. An earlier version dollied in and back out
 * across the section, which read as the gallery zooming itself in and out while
 * you were only trying to scroll through it — scroll now turns the archive and
 * does nothing else. The pointer still adds a shallow atmospheric drift.
 */
function CameraRig({ pointerRef }: CameraRigProps) {
  const { camera, size } = useThree();
  const placedRef = useRef(false);

  useFrame((_state, delta) => {
    const narrow = size.width < 768;
    const targetZ = narrow ? 8 : 6.6;

    const parallax = narrow ? 0.18 : 0.55;
    const targetX = pointerRef.current.x * parallax;
    const targetY = pointerRef.current.y * parallax * 0.6;

    // The first frame lands on the mark rather than easing onto it — otherwise
    // the archive opens on a zoom the visitor did not ask for.
    const lerp = placedRef.current
      ? 1 - Math.pow(0.92, Math.min(delta, 1 / 30) * 60)
      : 1;
    placedRef.current = true;

    camera.position.x += (targetX - camera.position.x) * lerp;
    camera.position.y += (targetY - camera.position.y) * lerp;
    camera.position.z += (targetZ - camera.position.z) * lerp;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

type ArchiveSceneProps = {
  items: GalleryItem[];
  /** Pauses the render loop entirely when the section is off-screen. */
  active: boolean;
  onFocusChange: (itemIndex: number) => void;
  onReady: () => void;
  focusRequestRef: React.RefObject<((itemIndex: number) => void) | null>;
  /** Fires when a tile is tapped (not dragged), with the item index. */
  onTileTap?: (itemIndex: number) => void;
};

export default function ArchiveScene({
  items,
  active,
  onFocusChange,
  onReady,
  focusRequestRef,
  onTileTap,
}: ArchiveSceneProps) {
  const textures = useArchiveTextures(items);

  const yawOffsetRef = useRef(0);
  const pitchRef = useRef(0);
  const spinYawRef = useRef(0);
  const spinPitchRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0 });

  const isDraggingRef = useRef(false);
  const dragPointerIdRef = useRef<number | null>(null);
  const dragLastRef = useRef({ x: 0, y: 0, t: 0 });
  const dragMovedRef = useRef(0);

  const snapActiveRef = useRef(false);
  const snapYawRef = useRef(0);
  const snapPitchRef = useRef(0);

  const placementsRef = useRef<TilePlacement[]>([]);

  const registerPlacements = useCallback((placements: TilePlacement[]) => {
    placementsRef.current = placements;
  }, []);

  /** Rotation that brings a given direction to face the camera. */
  const anglesFor = useCallback((dir: THREE.Vector3) => {
    const horizontal = Math.hypot(dir.x, dir.z);
    return {
      yaw: Math.atan2(-dir.x, dir.z),
      pitch: Math.max(
        -MAX_PITCH,
        Math.min(MAX_PITCH, Math.atan2(dir.y, horizontal)),
      ),
    };
  }, []);

  /**
   * Settle onto the nearest photograph. Ported from the helmet repo's
   * cost-minimising snap — the small extra weight on pitch keeps the sphere
   * from tumbling vertically to reach a marginally closer tile.
   */
  const snapToNearest = useCallback(() => {
    const placements = placementsRef.current;
    if (!placements.length) return;

    const currentYaw = yawOffsetRef.current;
    const currentPitch = pitchRef.current;

    let bestCost = Infinity;
    let bestYaw = currentYaw;
    let bestPitch = currentPitch;

    for (const placement of placements) {
      const { yaw, pitch } = anglesFor(placement.dir);
      const dYaw = wrapPi(yaw - currentYaw);
      const dPitch = pitch - currentPitch;
      const cost = dYaw * dYaw + dPitch * dPitch * 1.4;

      if (cost < bestCost) {
        bestCost = cost;
        bestYaw = currentYaw + dYaw;
        bestPitch = pitch;
      }
    }

    snapYawRef.current = bestYaw;
    snapPitchRef.current = bestPitch;
    snapActiveRef.current = true;
  }, [anglesFor]);

  /** Bring one specific photograph forward — used by keyboard navigation. */
  const focusItem = useCallback(
    (itemIndex: number) => {
      const placement = placementsRef.current.find(
        (p) => p.itemIndex === itemIndex,
      );
      if (!placement) return;

      const currentYaw = yawOffsetRef.current;
      const { yaw, pitch } = anglesFor(placement.dir);

      snapYawRef.current = currentYaw + wrapPi(yaw - currentYaw);
      snapPitchRef.current = pitch;
      snapActiveRef.current = true;
      spinYawRef.current = 0;
      spinPitchRef.current = 0;
    },
    [anglesFor],
  );

  useEffect(() => {
    focusRequestRef.current = focusItem;
    return () => {
      focusRequestRef.current = null;
    };
  }, [focusItem, focusRequestRef]);

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      pointerRef.current = {
        x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
        y: -(((event.clientY - rect.top) / rect.height) * 2 - 1),
      };

      if (
        !isDraggingRef.current ||
        dragPointerIdRef.current !== event.pointerId
      )
        return;

      const dx = event.clientX - dragLastRef.current.x;
      const dy = event.clientY - dragLastRef.current.y;
      const dtMs = event.timeStamp - dragLastRef.current.t;

      dragLastRef.current = {
        x: event.clientX,
        y: event.clientY,
        t: event.timeStamp,
      };
      dragMovedRef.current += Math.abs(dx) + Math.abs(dy);

      const deltaYaw = dx * DRAG_TO_ANGLE;
      const deltaPitch = -dy * DRAG_TO_ANGLE * 0.6;

      yawOffsetRef.current += deltaYaw;
      pitchRef.current = Math.min(
        MAX_PITCH,
        Math.max(-MAX_PITCH, pitchRef.current + deltaPitch),
      );

      if (dtMs > 0) {
        const dt = dtMs / 1000;
        spinYawRef.current = Math.max(-3.2, Math.min(3.2, deltaYaw / dt));
        spinPitchRef.current = Math.max(-3.2, Math.min(3.2, deltaPitch / dt));
      }
    },
    [],
  );

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      snapActiveRef.current = false;
      isDraggingRef.current = true;
      dragPointerIdRef.current = event.pointerId;
      dragLastRef.current = {
        x: event.clientX,
        y: event.clientY,
        t: event.timeStamp,
      };
      dragMovedRef.current = 0;

      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is best-effort; drag still works without it.
      }
    },
    [],
  );

  const endDrag = useCallback(
    (event?: React.PointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;

      const pointerId = dragPointerIdRef.current;
      dragPointerIdRef.current = null;

      if (event && pointerId != null) {
        try {
          event.currentTarget.releasePointerCapture(pointerId);
        } catch {
          // Already released.
        }
      }

      snapToNearest();
    },
    [snapToNearest],
  );

  const onPointerLeave = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      pointerRef.current = { x: 0, y: 0 };
      endDrag(event);
    },
    [endDrag],
  );

  /** A tap on a photograph (as opposed to a drag) brings it forward. */
  const onTilePointerDown = useCallback(
    (placementIndex: number) => {
      const placement = placementsRef.current[placementIndex];
      if (!placement) return;

      window.setTimeout(() => {
        if (dragMovedRef.current < 6) {
          focusItem(placement.itemIndex);
          onTileTap?.(placement.itemIndex);
        }
      }, 0);
    },
    [focusItem, onTileTap],
  );

  useEffect(() => {
    if (textures) onReady();
  }, [textures, onReady]);

  return (
    <div
      className="absolute inset-0 select-none touch-none"
      onPointerMove={onPointerMove}
      onPointerDown={onPointerDown}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={onPointerLeave}
    >
      <Canvas
        frameloop={active ? "always" : "never"}
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 11], fov: 48 }}
      >
        <CameraRig pointerRef={pointerRef} />

        {textures && (
          <ArchiveSphere
            items={items}
            textures={textures}
            yawOffsetRef={yawOffsetRef}
            pitchRef={pitchRef}
            spinYawRef={spinYawRef}
            spinPitchRef={spinPitchRef}
            isDraggingRef={isDraggingRef}
            snapActiveRef={snapActiveRef}
            snapYawRef={snapYawRef}
            snapPitchRef={snapPitchRef}
            registerPlacements={registerPlacements}
            onFocusChange={onFocusChange}
            onTilePointerDown={onTilePointerDown}
          />
        )}
      </Canvas>
    </div>
  );
}
