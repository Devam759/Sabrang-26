"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Environment } from "@react-three/drei";
import * as THREE from "three";
import { Clock, MapPin, ArrowRight, Menu } from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   TYPES & CONSTANTS
────────────────────────────────────────────────────────────── */

export type ScheduleEvent = {
  time: string;
  event: string;
  venue: string;
  category: "Mandatory" | "Fun" | "Competition" | "Mentoring" | "Session";
  description?: string;
};

export type ScheduleData = {
  date: string;
  label: string;
  events: ScheduleEvent[];
}[];

const CATEGORIES = ["ALL", "MANDATORY", "FUN", "COMPETITION", "MENTORING", "SESSION"];

/* ─────────────────────────────────────────────────────────────
   3D BACKGROUND SYSTEM (Three.js)
────────────────────────────────────────────────────────────── */

function ParticleSystem({ count = 1000 }) {
  const points = useRef<THREE.Points>(null);
  
  // Generate random positions
  const positions = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 30;     // x
      p[i * 3 + 1] = (Math.random() - 0.5) * 30; // y
      p[i * 3 + 2] = (Math.random() - 0.5) * 20; // z
    }
    return p;
  }, [count]);

  useFrame((state, delta) => {
    if (points.current) {
      points.current.rotation.y += delta * 0.05;
      points.current.rotation.x -= delta * 0.02;
    }
  });

  return (
    <Points ref={points} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial transparent color="#ffffff" size={0.03} sizeAttenuation={true} depthWrite={false} opacity={0.3} />
    </Points>
  );
}

function GlassPrism() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2;
      meshRef.current.rotation.x += delta * 0.1;
      // Gentle floating
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.5;
    }
  });

  return (
    <mesh ref={meshRef} position={[8, 4, -10]} scale={1.5}>
      <octahedronGeometry args={[1, 0]} />
      <meshPhysicalMaterial 
        transmission={0.9} 
        opacity={1} 
        metalness={0} 
        roughness={0} 
        ior={1.5} 
        thickness={0.5}
        color="#a855f7"
        emissive="#3b82f6"
        emissiveIntensity={0.2}
      />
    </mesh>
  );
}

function WebGLBackground() {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    // Only render 3D on client to avoid hydration mismatch
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none hidden md:block">
      <Canvas camera={{ position: [0, 0, 15], fov: 45 }} gl={{ antialias: false, alpha: true }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} color="#ffffff" />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#8b5cf6" />
        <ParticleSystem count={800} />
        <GlassPrism />
      </Canvas>
      
      {/* 2D Atmospheric Overlays */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:30px_30px] [mask-image:radial-gradient(ellipse_100%_100%_at_50%_0%,#000_60%,transparent_100%)]" />
      <div className="absolute top-0 right-[10%] w-[1px] h-[80%] bg-gradient-to-b from-transparent via-violet-400 to-transparent opacity-20 blur-[2px] transform rotate-[15deg]" />
      <div className="absolute bottom-[20%] left-[5%] w-[1px] h-[60%] bg-gradient-to-b from-transparent via-blue-400 to-transparent opacity-10 blur-[1px] transform -rotate-[25deg]" />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   3D UI PHYSICS (Framer Motion)
────────────────────────────────────────────────────────────── */

function EventCard3D({ evt, index }: { evt: ScheduleEvent, index: number }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth out the mouse values
  const mouseX = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 20 });

  // Map mouse coordinates to rotation (max 4 degrees)
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [4, -4]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-4, 4]);
  
  // Map mouse coordinates to gradient highlight position
  const glareX = useTransform(mouseX, [-0.5, 0.5], [0, 100]);
  const glareY = useTransform(mouseY, [-0.5, 0.5], [0, 100]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseXPos = e.clientX - rect.left;
    const mouseYPos = e.clientY - rect.top;
    x.set((mouseXPos / width) - 0.5);
    y.set((mouseYPos / height) - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const getCategoryColor = (category: string) => {
    switch (category.toUpperCase()) {
      case "MANDATORY": return "text-rose-400 border-rose-500/30";
      case "FUN": return "text-emerald-400 border-emerald-500/30";
      case "COMPETITION": return "text-fuchsia-400 border-fuchsia-500/30";
      case "MENTORING": return "text-blue-400 border-blue-500/30";
      case "SESSION": return "text-amber-400 border-amber-500/30";
      default: return "text-gray-400 border-gray-500/30";
    }
  };

  return (
    <motion.div
      style={{ perspective: 1000 }}
      className="relative z-20 group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5 }}
    >
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative bg-[#08090d]/80 border border-white/[0.08] rounded-[4px] p-5 backdrop-blur-md cursor-pointer transition-colors duration-500 group-hover:bg-[#0c0d14] group-hover:border-white/[0.15]"
        whileHover={{ translateZ: 12 }}
      >
        {/* Dynamic Glare Effect */}
        <motion.div 
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[4px]"
          style={{
            background: useTransform(
              () => `radial-gradient(circle at ${glareX.get()}% ${glareY.get()}%, rgba(139, 92, 246, 0.15) 0%, transparent 60%)`
            )
          }}
        />

        {/* Diagonal Light Streak (CSS animated on hover) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[4px]">
          <div className="absolute top-0 left-[-100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/[0.05] to-transparent skew-x-[-20deg] group-hover:animate-[streak_1s_ease-in-out_forward]" />
        </div>

        <div className="relative z-10" style={{ transform: "translateZ(10px)" }}>
          <div className="flex justify-between items-start mb-3">
            <span className="text-[11px] font-mono tracking-widest text-white/50">{evt.time}</span>
            <span className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-[2px] border ${getCategoryColor(evt.category)}`}>
              {evt.category}
            </span>
          </div>
          
          <h3 className="text-lg font-bold text-white/90 leading-tight mb-2 group-hover:text-white transition-colors">
            {evt.event}
          </h3>
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-1.5 text-white/40 text-[10px] uppercase tracking-widest font-medium">
              <MapPin size={10} />
              {evt.venue}
            </div>
            <div className="text-[9px] font-bold tracking-widest text-white/0 group-hover:text-white/40 transition-colors flex items-center">
              VIEW <ArrowRight size={10} className="ml-1" />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DayColumn({ 
  day, 
  filteredEvents, 
  isHovered, 
  onHover, 
  onLeave, 
  mouseX, 
  mouseY,
  colIndex
}: { 
  day: ScheduleData[0], 
  filteredEvents: ScheduleEvent[], 
  isHovered: boolean, 
  onHover: () => void, 
  onLeave: () => void,
  mouseX: any,
  mouseY: any,
  colIndex: number
}) {
  
  // Parallax the column based on mouse position
  // The center of screen is 0,0. 
  // colIndex: 0 = left, 1 = center, 2 = right
  const offsetX = (colIndex - 1) * 2; // slight base offset
  
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [1, -1]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-1.5, 1.5]);
  const translateX = useTransform(mouseX, [-0.5, 0.5], [-10 + offsetX, 10 + offsetX]);
  const translateY = useTransform(mouseY, [-0.5, 0.5], [-10, 10]);

  return (
    <motion.div
      style={{ rotateX, rotateY, x: translateX, y: translateY, transformStyle: "preserve-3d" }}
      className={`relative flex flex-col transition-all duration-700 ease-out ${isHovered ? 'z-30 opacity-100' : 'z-10 opacity-80'}`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      animate={{ 
        translateZ: isHovered ? 20 : 0,
        scale: isHovered ? 1.02 : 1
      }}
    >
      {/* Premium Glass Background Slab */}
      <div className="absolute inset-0 bg-[#050508]/40 backdrop-blur-sm border border-white/[0.03] rounded-lg -z-10" />

      {/* Day Header */}
      <div className="px-6 py-6 border-b border-white/[0.05] relative overflow-hidden rounded-t-lg">
        {/* Subtle Extrusion Number */}
        <div className="absolute -right-4 -top-8 text-[120px] font-black text-white/[0.02] select-none pointer-events-none" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
          0{colIndex + 1}
        </div>
        
        <h2 className="text-xl font-bold tracking-[0.2em] text-white mb-1 relative z-10">{day.label}</h2>
        <span className="text-[10px] font-mono tracking-widest text-violet-400 relative z-10">{day.date}</span>
      </div>

      {/* Timeline Container */}
      <div className="flex-1 p-6 relative">
        {filteredEvents.length === 0 ? (
          <div className="text-xs tracking-widest text-white/30 italic text-center py-20">NO EVENTS</div>
        ) : (
          <div className="relative">
            {/* Main Vertical Timeline Line */}
            <div className="absolute left-[11px] top-4 bottom-4 w-[1px] bg-white/[0.1]" />
            
            {/* Animated Traveling Light */}
            <motion.div 
              className="absolute left-[11px] w-[1px] h-32 bg-gradient-to-b from-transparent via-violet-500 to-transparent"
              animate={{ top: ["0%", "100%"], opacity: [0, 1, 0] }}
              transition={{ duration: 4, ease: "linear", repeat: Infinity, delay: colIndex * 1.5 }}
            />

            <div className="flex flex-col gap-6">
              {filteredEvents.map((evt, idx) => (
                <div key={idx} className="relative pl-10 group">
                  {/* Timeline Node */}
                  <div className="absolute left-[8px] top-[24px] w-2 h-2 rounded-full bg-[#050508] border border-white/30 z-10 transition-all duration-300 group-hover:scale-150 group-hover:border-violet-500 group-hover:bg-violet-500/20 shadow-[0_0_0_rgba(139,92,246,0)] group-hover:shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
                  
                  {/* The Card */}
                  <EventCard3D evt={evt} index={idx} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}


/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
────────────────────────────────────────────────────────────── */

export default function FuturisticSchedule({ schedule }: { schedule: ScheduleData }) {
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);
  
  // Parallax Mouse tracking for the entire container
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothMouseX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const x = (e.clientX / window.innerWidth) - 0.5;
    const y = (e.clientY / window.innerHeight) - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  return (
    <div 
      className="relative min-h-screen bg-[#020202] text-white font-sans overflow-hidden selection:bg-violet-500/30"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { mouseX.set(0); mouseY.set(0); }}
    >
      <WebGLBackground />

      {/* ── CUSTOM HEADER ── */}
      <header className="relative z-50 w-full px-6 py-5 flex items-center justify-between border-b border-white/[0.05] bg-[#020202]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[2px] bg-white flex items-center justify-center font-bold tracking-tighter text-sm text-black">
            S26
          </div>
          <span className="text-xs font-bold tracking-[0.2em] text-white/90">SABRANG</span>
        </div>
        <nav className="hidden md:flex items-center gap-10 text-[10px] font-bold tracking-[0.2em] text-white/40">
          <Link href="/" className="hover:text-white transition-colors">HOME</Link>
          <Link href="/themes" className="hover:text-white transition-colors">THEMES</Link>
          <Link href="/prizes" className="hover:text-white transition-colors">PRIZES</Link>
          <Link href="/partners" className="hover:text-white transition-colors">PARTNERS</Link>
          <Link href="/events" className="hover:text-white transition-colors">EVENTS</Link>
          <Link href="/credits" className="hover:text-white transition-colors">TEAM</Link>
        </nav>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline-block text-[9px] font-mono text-white/20 tracking-widest border border-white/5 px-2 py-1">JKLU</span>
          <button className="flex items-center gap-2 text-xs font-bold tracking-widest hover:text-violet-400 transition-colors">
            <Menu size={16} />
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="relative z-10 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-32" style={{ perspective: 2000 }}>
        
        {/* Editorial Title */}
        <div className="text-center mb-16 relative z-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <div className="text-[10px] font-mono tracking-widest text-violet-400 mb-4">SABRANG 26 / EVENT SYSTEM</div>
            <h1 className="text-4xl md:text-6xl lg:text-[80px] font-black tracking-tighter text-white mb-8" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
              SCHEDULE
            </h1>
            <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-[0.15em] transition-all duration-300 border backdrop-blur-md ${
                    activeFilter === cat
                      ? "bg-violet-500/10 text-white border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                      : "bg-[#0a0b10]/50 text-white/40 border-white/5 hover:border-white/20 hover:text-white/80"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* 3-Column Desktop Grid / 1-Column Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 relative z-10" style={{ transformStyle: "preserve-3d" }}>
          {schedule.map((day, idx) => {
            const filteredEvents = day.events.filter(
              (e) => activeFilter === "ALL" || e.category.toUpperCase() === activeFilter
            );

            return (
              <DayColumn
                key={day.label}
                day={day}
                colIndex={idx}
                filteredEvents={filteredEvents}
                isHovered={hoveredCol === idx}
                onHover={() => setHoveredCol(idx)}
                onLeave={() => setHoveredCol(null)}
                mouseX={smoothMouseX}
                mouseY={smoothMouseY}
              />
            );
          })}
        </div>

      </main>

      {/* Decorative Overlays */}
      <div className="fixed bottom-6 left-6 text-[9px] font-mono text-white/20 tracking-widest pointer-events-none z-50">
        26.9124° N / 75.7873° E
      </div>
      <div className="fixed bottom-6 right-6 text-[9px] font-mono text-white/20 tracking-widest pointer-events-none z-50 flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse" />
        SYSTEM ACTIVE
      </div>

      <style>{`
        @keyframes streak {
          0% { left: -100%; opacity: 0; }
          50% { opacity: 1; }
          100% { left: 200%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
