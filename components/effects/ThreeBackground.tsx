'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

function Particles({ count = 100 }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100;
      const factor = 20 + Math.random() * 100;
      const speed = 0.01 + Math.random() / 200;
      const xFactor = -50 + Math.random() * 100;
      const yFactor = -50 + Math.random() * 100;
      const zFactor = -50 + Math.random() * 100;
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
    }
    return temp;
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    const { mouse } = state;
    particles.forEach((particle, i) => {
      let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
      t = particle.t += speed / 2;
      const a = Math.cos(t) + Math.sin(t * 1) / 10;
      const b = Math.sin(t) + Math.cos(t * 2) / 10;
      const s = Math.cos(t);
      
      const mX = mouse.x * 2;
      const mY = mouse.y * 2;

      dummy.position.set(
        mX + xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10,
        mY + yFactor + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10,
        zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10
      );
      dummy.scale.set(s, s, s);
      dummy.rotation.set(s * 5, s * 5, s * 5);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current!.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <dodecahedronGeometry args={[0.2, 0]} />
      <meshStandardMaterial roughness={0} metalness={0.5} color="#6366f1" />
    </instancedMesh>
  );
}

function AnimatedShapes() {
  return (
    <>
      <Float speed={2} rotationIntensity={1} floatIntensity={2}>
        <Sphere args={[1, 64, 64]} position={[-4, 2, -5]}>
          <MeshDistortMaterial
            color="#818cf8"
            speed={3}
            distort={0.4}
            radius={1}
          />
        </Sphere>
      </Float>
      
      <Float speed={3} rotationIntensity={2} floatIntensity={1}>
        <Sphere args={[0.8, 64, 64]} position={[5, -2, -8]}>
          <MeshDistortMaterial
            color="#c084fc"
            speed={5}
            distort={0.6}
            radius={1}
          />
        </Sphere>
      </Float>

      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={3}>
        <Sphere args={[1.2, 64, 64]} position={[0, -4, -10]}>
          <MeshDistortMaterial
            color="#fb7185"
            speed={2}
            distort={0.3}
            radius={1}
          />
        </Sphere>
      </Float>
    </>
  );
}

export default function ThreeBackground() {
  return (
    <div className="absolute inset-0 -z-10 bg-slate-50 overflow-hidden">
      <Canvas camera={{ position: [0, 0, 15], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} color="#6366f1" intensity={0.5} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <Particles count={150} />
        <AnimatedShapes />
      </Canvas>
      <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px]"></div>
    </div>
  );
}
