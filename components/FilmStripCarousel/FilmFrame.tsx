import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import {
  coverFitTexture,
  createBackingMaterial,
  createFilmBorderMaterial,
  createFilmPanelMaterial,
} from './FilmMaterial';
import { FRAME_HEIGHT, FRAME_WIDTH } from './constants';
import type { Project } from './types';

// Everything the strip's useFrame loop animates, exposed as one handle so
// no React state is involved per tick.
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

// One frame cell: image panel (custom shader) + film border (bump-mapped
// standard material) + a dark backing 0.03 behind it faking rail thickness
// + a contact shadow that appears when the frame is promoted.
//
// Border and backing materials are built per frame rather than cloned: each
// needs its own onBeforeCompile uniform block to carry this frame's arc
// length. The textures behind them are shared.
export default function FilmFrame({
  project,
  index,
  shared,
  register,
  onFrameClick,
  onHover,
}: FilmFrameProps) {
  const texture = useTexture(project.image);

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

  // assemble the handle once the refs exist
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
