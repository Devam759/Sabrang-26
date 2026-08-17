"use client";

import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import ContactForm from "@/components/forms/ContactForm";
import ContactBackground from "./ContactBackground";
import { ORGANIZING_HEADS, SITE_CONFIG } from "@/lib/constants";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function ContactClient() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Select all sections that we want to reveal on scroll
    const revealElements = gsap.utils.toArray<HTMLElement>('.gsap-reveal');

    revealElements.forEach((el) => {
      gsap.fromTo(
        el,
        {
          opacity: 0,
          y: 40, // reduced translation for mobile
          scale: 0.98,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top 95%",
            end: "top 70%",
            scrub: 1, // 1 second smooth scrubbing effect
          },
        }
      );
    });

    // For staggered elements like the organizing heads
    const headCards = gsap.utils.toArray<HTMLElement>('.gsap-stagger-card');
    if (headCards.length > 0) {
      gsap.fromTo(
        headCards,
        {
          opacity: 0,
          y: 30, // reduced translation for mobile
        },
        {
          opacity: 1,
          y: 0,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".gsap-stagger-container",
            start: "top 90%",
            end: "top 60%",
            scrub: 1,
          },
        }
      );
    }
  }, { scope: containerRef });

  return (
    <div className="relative min-h-screen py-16 px-4 sm:px-6 md:px-8 pb-24 overflow-x-hidden" ref={containerRef}>
      {/* WebGL Contact Background */}
      <ContactBackground />

      {/* Temporarily hidden so the user can see only the background effect */}
      <div className="relative z-10 max-w-6xl mx-auto space-y-12 md:space-y-16">
        {/* Hero Header (Framer Motion for smooth initial load) */}
        <motion.section 
          className="text-center space-y-4 pt-4 md:pt-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-white to-cyan-500 drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]">
            Contact Us
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-cyan-100 max-w-2xl mx-auto px-4 font-medium uppercase tracking-widest">
            Have questions or want to collaborate? Connect with the organizing
            team of {SITE_CONFIG.name}.
          </p>
        </motion.section>

        {/* Organizing Heads Grid (GSAP Scrub) */}
        <section className="space-y-6 md:space-y-8 gsap-stagger-container">
          <div className="text-center space-y-2 gsap-reveal">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight uppercase italic drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
              Organizing Heads
            </h2>
          </div>

          <OrganizingHeadsGallery />
        </section>

        {/* Email Callout Section (GSAP Scrub) */}
        <section className="bg-black/60 backdrop-blur-md border border-white/10 border-l-4 border-l-cyan-500 p-6 sm:p-8 md:p-12 text-center space-y-4 shadow-[0_0_30px_rgba(0,255,255,0.15)] gsap-reveal mx-2 sm:mx-0">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto">
            <svg
              className="w-6 h-6 md:w-7 md:h-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-lg md:text-2xl font-black text-white uppercase tracking-tight">
            Drop Us An Email At
          </h2>
          <div className="break-words">
            <a
              href={`mailto:${SITE_CONFIG.email}`}
              className="text-xl sm:text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 hover:opacity-90 transition-opacity tracking-tight"
            >
              {SITE_CONFIG.email}
            </a>
          </div>
        </section>

        {/* Form & Venue Section (GSAP Scrub) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-start">
          {/* Send Us A Message Form */}
          <div className="bg-black/60 backdrop-blur-md border border-white/10 border-r-2 border-r-pink-500 p-5 md:p-8 space-y-6 shadow-[0_0_30px_rgba(236,72,153,0.15)] gsap-reveal mx-2 sm:mx-0">
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase italic">
              Send Us A Message
            </h2>
            <ContactForm />
          </div>

          {/* Venue & Location Details */}
          <div className="bg-black/60 backdrop-blur-md border border-white/10 border-l-2 border-l-cyan-500 p-5 md:p-8 space-y-6 shadow-[0_0_30px_rgba(0,255,255,0.15)] gsap-reveal mx-2 sm:mx-0">
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase italic">
              Festival Venue
            </h2>

            <div className="space-y-4 text-white/80 text-xs sm:text-sm md:text-base leading-relaxed font-medium">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0 mt-0.5">
                  <svg
                    className="w-4 h-4 md:w-5 md:h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm md:text-base uppercase tracking-wider">
                    {SITE_CONFIG.university.name}
                  </h3>
                  <p className="text-white/60">Mahapura, Ajmer Road</p>
                  <p className="text-white/60">Jaipur, Rajasthan 302026</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <a
                href="https://maps.google.com/?q=JK+Lakshmipat+University+Jaipur"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 md:px-6 md:py-3 bg-cyan-500/10 hover:bg-cyan-500/30 text-white font-bold text-[10px] md:text-xs uppercase tracking-widest transition-all border border-cyan-500/30 hover:border-cyan-400"
              >
                <span>View On Google Maps</span>
                <svg
                  className="w-3 h-3 md:w-4 md:h-4 text-cyan-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const OrganizingHeadsGallery = () => {
  const [activeCard, setActiveCard] = useState<number | null>(0);
  const backgrounds = [
    "/gallery/43.webp",
    "/gallery/87.webp",
    "/gallery/96.webp",
    "/gallery/48.webp"
  ];

  return (
    <div className="flex w-full h-[300px] md:h-[400px] items-stretch justify-start lg:justify-center gap-2 md:gap-4 gsap-reveal overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-hide">
      {ORGANIZING_HEADS.map((head, index) => (
        <motion.div
          key={index}
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className={`relative cursor-pointer overflow-hidden rounded-2xl bg-black/60 border border-cyan-500/30 shrink-0 ${
            activeCard === index ? "w-[300px] md:w-[400px]" : "w-[3.5rem]"
          }`}
          onClick={() => setActiveCard(index)}
          onHoverStart={() => setActiveCard(index)}
        >
          <img
            src={backgrounds[index]}
            className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-luminosity hover:opacity-80 transition-opacity"
            alt={head.name}
          />
          <AnimatePresence>
            {activeCard === index && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none"
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {activeCard !== index && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none"
              >
                <p className="whitespace-nowrap -rotate-90 text-xs font-mono font-bold text-cyan-400/50 uppercase tracking-widest">
                  {head.name}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {activeCard === index && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.2 }}
                className="absolute inset-0 flex flex-col justify-end p-4 md:p-6"
              >
                <div className="flex flex-col gap-2 relative z-10">
                  <h3 className="text-xl md:text-3xl font-black text-white tracking-tighter uppercase italic drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]">
                    {head.name}
                  </h3>
                  <p className="text-pink-400 font-mono text-[10px] md:text-xs uppercase tracking-widest">
                    {head.role || "Organizing Head"}
                  </p>
                  <a
                    href={`tel:${head.phone}`}
                    className="mt-2 inline-flex w-fit items-center gap-2 px-3 py-2 bg-cyan-500/10 hover:bg-cyan-500/30 text-white font-bold text-[10px] uppercase tracking-widest transition-all border border-cyan-500/30 hover:border-cyan-400 rounded-lg backdrop-blur-md"
                  >
                    <svg className="w-3 h-3 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1.01 1.01 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{head.displayPhone}</span>
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
};

