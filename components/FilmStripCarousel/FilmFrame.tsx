import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import {
  coverFitTexture,
  createBackingMaterial,
  createFilmBorderMaterial,
  createFilmPanelMaterial,
} from './FilmMaterial';
import { FRAME_HEIGHT, FRAME_WIDTH } from './constants';
import type { Project } from './types';

export interface FrameHandle {
  group: THREE.Group;
  content: THREE.Group;
  imageMesh: THREE.Mesh;
  imageMat: THREE.ShaderMaterial;
  borderMat: THREE.MeshStandardMaterial;
  backMat: THREE.MeshBasicMaterial;
  shadowMat: THREE.MeshBasicMaterial;
}

export interface FrameShared {
  imageGeo: THREE.PlaneGeometry;
  borderGeo: THREE.PlaneGeometry;
  shadowGeo: THREE.PlaneGeometry;
  filmTex: { map: THREE.CanvasTexture; bump: THREE.CanvasTexture };
  shadowTex: THREE.CanvasTexture;
}

interface FilmFrameProps {
  project: Project;
  index: number;
  shared: FrameShared;
  register: (index: number, handle: FrameHandle | null) => void;
  onFrameClick: (index: number) => void;
  onHover: (index: number | null) => void;
}

// Global texture cache & non-blocking loader to eliminate Suspense delays completely
const textureCache = new Map<string, THREE.Texture>();
let sharedLoader: THREE.TextureLoader | null = null;
let defaultPlaceholder: THREE.Texture | null = null;

function getSharedLoader(): THREE.TextureLoader {
  if (!sharedLoader) sharedLoader = new THREE.TextureLoader();
  return sharedLoader;
}

function getPlaceholderTexture(): THREE.Texture {
  if (!defaultPlaceholder && typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 4;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#14101e';
      ctx.fillRect(0, 0, 4, 4);
    }
    defaultPlaceholder = new THREE.CanvasTexture(canvas);
    defaultPlaceholder.colorSpace = THREE.SRGBColorSpace;
  }
  return defaultPlaceholder || new THREE.Texture();
}

export default function FilmFrame({
  project,
  index,
  shared,
  register,
  onFrameClick,
  onHover,
}: FilmFrameProps) {
  const [texture, setTexture] = useState<THREE.Texture>(() => {
    return textureCache.get(project.image) || getPlaceholderTexture();
  });

  useEffect(() => {
    if (textureCache.has(project.image)) {
      setTexture(textureCache.get(project.image)!);
      return;
    }

    let active = true;
    const loader = getSharedLoader();
    loader.load(
      project.image,
      (loaded) => {
        loaded.colorSpace = THREE.SRGBColorSpace;
        textureCache.set(project.image, loaded);
        if (active) {
          setTexture(loaded);
        }
      },
      undefined,
      () => {
        // Fallback placeholder on network error
      }
    );

    return () => {
      active = false;
    };
  }, [project.image]);

  const mats = useMemo(() => {
    coverFitTexture(texture);
    const imageMat = createFilmPanelMaterial(texture);
    (imageMat.uniforms.uRepeat.value as THREE.Vector2).copy(texture.repeat);
    (imageMat.uniforms.uOffset.value as THREE.Vector2).copy(texture.offset);
    return {
      imageMat,
      borderMat: createFilmBorderMaterial(shared.filmTex),
      backMat: createBackingMaterial(shared.filmTex.map),
      shadowMat: new THREE.MeshBasicMaterial({
        map: shared.shadowTex,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    };
  }, [texture, shared]);

  useEffect(
    () => () => {
      mats.imageMat.dispose();
      mats.borderMat.dispose();
      mats.backMat.dispose();
      mats.shadowMat.dispose();
    },
    [mats]
  );

  const refs = useMemo<Partial<FrameHandle>>(() => ({}), []);
  const tryRegister = () => {
    if (refs.group && refs.content && refs.imageMesh) {
      register(index, { ...mats, ...refs } as FrameHandle);
    }
  };
  useEffect(() => () => register(index, null), [index, register]);

  return (
    <group
      ref={(el) => {
        refs.group = el ?? undefined;
        tryRegister();
      }}
      onClick={(e) => {
        e.stopPropagation();
        onFrameClick(index);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(index);
      }}
      onPointerOut={() => onHover(null)}
    >
      <group
        ref={(el) => {
          refs.content = el ?? undefined;
          tryRegister();
        }}
      >
        <mesh
          geometry={shared.shadowGeo}
          material={mats.shadowMat}
          position={[0, -0.55, -0.14]}
          scale={[FRAME_WIDTH * 1.6, FRAME_HEIGHT * 1.15, 1]}
        />
        <mesh geometry={shared.borderGeo} material={mats.backMat} position={[0, 0, -0.03]} />
        <mesh geometry={shared.borderGeo} material={mats.borderMat} />
        <mesh
          ref={(el) => {
            refs.imageMesh = el ?? undefined;
            tryRegister();
          }}
          geometry={shared.imageGeo}
          material={mats.imageMat}
          position={[0, 0, -0.008]}
        />
      </group>
    </group>
  );
}
