"use client";

import React, { useEffect, useRef, useState } from "react";
import Matter from "matter-js";

export default function UnlockExperience({
  onBagIt,
}: {
  onBagIt: () => void;
}) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const ticketsRef = useRef<(HTMLDivElement | null)[]>([]);

  // We use 10 tickets for desktop, 6 for mobile
  const [isMobile, setIsMobile] = useState(false);

  const TICKET_DATA = [
    { variant: "group", angle: 0.1 },
    { variant: "pers", angle: -0.2 },
    { variant: "stud", angle: 0.3 },
    { variant: "group", angle: -0.1 },
    { variant: "pers", angle: 0.05 },
    { variant: "stud", angle: -0.3 },
    { variant: "group", angle: 0.2 },
    { variant: "pers", angle: -0.05 },
    { variant: "stud", angle: 0.15 },
    { variant: "group", angle: -0.25 },
    { variant: "stud", angle: 0.1 },
    { variant: "pers", angle: 0.2 },
    { variant: "group", angle: -0.15 },
    { variant: "stud", angle: 0.05 },
  ] as const;

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);

    const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Composite = Matter.Composite,
      Mouse = Matter.Mouse,
      MouseConstraint = Matter.MouseConstraint;

    const engine = Engine.create();
    
    // Create boundaries
    const ground = Bodies.rectangle(window.innerWidth / 2, window.innerHeight + 50, window.innerWidth * 2, 100, { isStatic: true });
    const leftWall = Bodies.rectangle(-50, window.innerHeight / 2, 100, window.innerHeight * 2, { isStatic: true });
    const rightWall = Bodies.rectangle(window.innerWidth + 50, window.innerHeight / 2, 100, window.innerHeight * 2, { isStatic: true });
    const ceiling = Bodies.rectangle(window.innerWidth / 2, -5000, window.innerWidth * 2, 100, { isStatic: true });
    
    Composite.add(engine.world, [ground, leftWall, rightWall, ceiling]);

    // Create ticket bodies
    // Reduced size and increased count
    const ticketCount = window.innerWidth < 768 ? 9 : 11;
    const ticketWidth = window.innerWidth < 768 ? 150 : 200;
    const ticketHeight = window.innerWidth < 768 ? 75 : 100;

    const ticketBodies = TICKET_DATA.slice(0, ticketCount).map((t, i) => {
      // Start randomly off-screen top
      const x = Math.random() * (window.innerWidth - ticketWidth) + (ticketWidth / 2);
      const y = -200 - (i * 200); // Spawning high up gives images time to load before they enter the screen
      return Bodies.rectangle(x, y, ticketWidth, ticketHeight, { 
        restitution: 0.6, // Bounciness
        frictionAir: 0.02,
        friction: 0.5,
        angle: t.angle
      });
    });

    Composite.add(engine.world, ticketBodies);

    // Add mouse interaction
    if (sceneRef.current) {
      const mouse = Mouse.create(sceneRef.current);
      const mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
          stiffness: 0.2,
          render: { visible: false }
        }
      });
      Composite.add(engine.world, mouseConstraint);
    }

    // Move the ceiling into place after tickets have finished dropping
    // so they don't get stuck on it while spawning, but players can't throw them off-screen later.
    const ceilingTimer = setTimeout(() => {
      Matter.Body.setPosition(ceiling, { x: window.innerWidth / 2, y: -50 });
    }, 6000);

    // Sync DOM elements to Bodies
    const runner = Runner.create();
    Runner.run(runner, engine);

    const updateDOM = () => {
      ticketBodies.forEach((body, i) => {
        const el = ticketsRef.current[i];
        if (el) {
          // Matter.js bodies have position at center
          // We translate the top-left of the div to the body center
          el.style.transform = `translate(${body.position.x - ticketWidth / 2}px, ${body.position.y - ticketHeight / 2}px) rotate(${body.angle}rad)`;
        }
      });
    };

    Matter.Events.on(engine, 'afterUpdate', updateDOM);

    // Run initial update to set positions before they drop
    updateDOM();

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      Matter.Body.setPosition(ground, { x: window.innerWidth / 2, y: window.innerHeight + 50 });
      Matter.Body.setPosition(rightWall, { x: window.innerWidth + 50, y: window.innerHeight / 2 });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(ceilingTimer);
      Matter.Engine.clear(engine);
      Matter.Runner.stop(runner);
    };
  }, []);

  const ticketCount = isMobile ? 9 : 11;

  return (
    <div ref={sceneRef} className="relative min-h-screen bg-[#0a0a0a] text-[#f4efe6] overflow-hidden font-sans selection:bg-[#2d0f4d] selection:text-white flex flex-col items-center justify-center">

      {/* Grid details - Top Right */}
      <div className="absolute top-24 right-6 md:top-28 md:right-10 pointer-events-none text-[#6d28d9] font-mono text-[10px] md:text-xs z-10 hidden md:flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <span>14/11</span>
          <span className="bg-[#2d0f4d] text-white px-1 font-bold">&gt;</span>
        </div>
        <div className="bg-[#2d0f4d] text-white px-1 uppercase font-bold tracking-widest mt-1">
          Sabrang 2026
        </div>
        <div className="tracking-widest">Jaipur, IN</div>
        <div className="mt-4 flex items-center gap-2">
          <span>23/10</span>
        </div>
        <div className="flex gap-1 justify-end items-center mt-1">
          <div className="w-16 h-3 bg-[#2d0f4d] opacity-80" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, #000 2px, #000 4px)' }}></div>
          <div className="bg-[#2d0f4d] px-1 font-bold text-white leading-none py-0.5">RJ</div>
        </div>

        {/* Crosshairs */}
        <div className="absolute -left-32 top-32 w-24 h-24 hidden md:block">
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-[#2d0f4d]/50"></div>
          <div className="absolute top-0 left-1/2 w-[1px] h-full bg-[#2d0f4d]/50"></div>
          <div className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-[#2d0f4d] -translate-x-1/2 -translate-y-1/2"></div>
        </div>
      </div>

      {/* Main Content (Pointer Events None to allow clicking tickets behind text) */}
      <div className="relative z-20 flex flex-col items-center mt-[-10vh] sm:mt-[-5vh]">
        {/* Typography */}
        <div className="relative text-center uppercase tracking-tight leading-[0.85] text-[3rem] sm:text-[4.5rem] md:text-[6rem] lg:text-[8rem] text-white">
          <div
            className="relative z-10 drop-shadow-2xl"
            style={{ fontFamily: "'FlorasDisplay', sans-serif" }}
          >
            UNLOCK
          </div>

          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[45%] z-20 text-[3.75rem] sm:text-[6rem] md:text-[8.5rem] lg:text-[11rem] text-[#5e239d] lowercase tracking-normal"
            style={{
              fontFamily: "'FlorasDisplay', sans-serif",
              textShadow:
                "4px 4px 0px #0a0a0a, -4px -4px 0px #0a0a0a, 4px -4px 0px #0a0a0a, -4px 4px 0px #0a0a0a",
            }}
          >
            the
          </div>

          <div
            className="relative z-10 drop-shadow-2xl"
            style={{ fontFamily: "'FlorasDisplay', sans-serif" }}
          >
            EXPERIENCE
          </div>
        </div>

        {/* Small box */}
        <div className="mt-16 md:mt-24 mb-12 text-rose-300 px-5 py-2 font-black text-xs md:text-sm tracking-[0.2em] uppercase relative z-30 bg-rose-500/20 border border-rose-500/40 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.25)]">
          REGISTRATIONS CLOSED · SABRANG 2026
        </div>

        {/* Ticket Stub Pass Button (Pointer Events Auto to allow clicking) */}
        <button
          onClick={onBagIt}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onBagIt();
          }}
          onTouchStart={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="group pointer-events-auto relative z-40 w-72 sm:w-80 h-20 bg-[#2d0f4d] hover:bg-[#381360] text-white border-2 border-white/80 shadow-[6px_6px_0px_#ffffff] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[4px_4px_0px_#ffffff] transition-all duration-200 cursor-pointer select-none flex items-stretch text-left overflow-visible"
        >
          {/* Authentic Ticket Notches on Perforation Line (at 74%) */}
          <div className="absolute -top-[9px] left-[74%] -translate-x-1/2 w-4 h-4 rounded-full bg-[#0a0a0a] border-b-2 border-white/80 z-20 pointer-events-none" />
          <div className="absolute -bottom-[9px] left-[74%] -translate-x-1/2 w-4 h-4 rounded-full bg-[#0a0a0a] border-t-2 border-white/80 z-20 pointer-events-none" />

          {/* Perforated Tear Line */}
          <div className="absolute top-2 bottom-2 left-[74%] -translate-x-1/2 border-r-2 border-dashed border-white/30 pointer-events-none z-10" />

          {/* Hover Effect: Line scanning from left to right */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
            <div className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_10px_#ffffff,0_0_20px_#ffffff] -left-4 group-hover:left-[105%] transition-[left] duration-500 ease-out" />
          </div>

          {/* Hover Effect: Bottom accent line extending from left to right */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden pointer-events-none z-20">
            <div className="h-full w-full bg-white scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 ease-out shadow-[0_0_6px_#ffffff]" />
          </div>

          {/* Main Pass Area (Left 74%) */}
          <div className="w-[74%] flex flex-col justify-between py-3.5 px-4 pr-3 relative z-10">
            {/* Top metadata */}
            <div className="flex items-center justify-between font-mono text-[9px] tracking-wider text-purple-200/70 font-semibold uppercase leading-none">
              <span>ADM · 01</span>
              <span>2026</span>
            </div>

            {/* Main Label */}
            <div className="flex items-baseline">
              <span
                className="font-black text-lg sm:text-xl tracking-[0.12em] uppercase text-rose-300 group-hover:text-rose-200 transition-colors leading-none whitespace-nowrap"
                style={{ fontFamily: "'FlorasDisplay', sans-serif" }}
              >
                REGISTRATION CLOSED
              </span>
            </div>
          </div>

          {/* Ticket Stub Area (Right 26%) */}
          <div className="w-[26%] flex flex-col items-center justify-between p-3 pl-3 bg-black/20 relative z-10">
            {/* Stamp / Icon */}
            <span className="font-mono text-[8px] font-bold tracking-widest text-purple-200/60 uppercase">
              JKLU
            </span>

            {/* Industrial Barcode */}
            <div
              className="w-10 h-6 opacity-75 group-hover:opacity-100 transition-opacity"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(90deg, #fff, #fff 1.5px, transparent 1.5px, transparent 3px, #fff 3px, #fff 5px, transparent 5px, transparent 6.5px, #fff 6.5px, #fff 7px, transparent 7px, transparent 9px)',
              }}
            />

            {/* Barcode Number */}
            <span className="font-mono text-[7px] tracking-tighter text-white/60">
              #SBRG-26
            </span>
          </div>
        </button>
      </div>

      {/* Scattered Tickets Layer */}
      <div className="absolute top-0 left-0 w-full h-full z-10 overflow-hidden pointer-events-none">
        {TICKET_DATA.slice(0, ticketCount).map((ticket, i) => (
          <div
            key={i}
            ref={(el) => { ticketsRef.current[i] = el; }}
            className="absolute top-0 left-0 origin-center cursor-grab active:cursor-grabbing will-change-transform pointer-events-auto"
          >
            <Ticket variant={ticket.variant as any} isMobile={isMobile} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Ticket({
  isMobile
}: {
  variant: "stud" | "pers" | "group";
  isMobile: boolean;
}) {
  // New dimensions
  const width = isMobile ? "150px" : "200px";
  const height = isMobile ? "75px" : "100px";

  return (
    <div
      className="bg-transparent flex select-none overflow-hidden rounded-xl shadow-[0_15px_30px_rgba(0,0,0,0.6)]"
      style={{
        width,
        height,
      }}
    >
      <div className="relative w-full h-full">
        {/* Scale the image up slightly to push any dark background border out of bounds */}
        <img 
          src="/images/sabrang-ticket.png" 
          alt="Sabrang Ticket" 
          className="absolute max-w-none w-[110%] h-[110%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 object-cover pointer-events-none"
        />
      </div>
    </div>
  );
}
