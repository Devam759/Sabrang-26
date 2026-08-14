"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import ContactForm from "@/components/forms/ContactForm";
import CursorGrid from "@/components/ui/CursorGrid";
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
      {/* Dynamic CursorGrid Interactive Background */}
      <div className="fixed inset-0 z-0 opacity-70 pointer-events-none overflow-hidden">
        <CursorGrid
          cellSize={70}
          color="#D946EF"
          radius={160}
          falloff="smooth"
          holdTime={400}
          fadeDuration={800}
          lineWidth={1.2}
          maxOpacity={0.85}
          fillOpacity={0.05}
          gridOpacity={0.08}
          cellRadius={8}
          clickPulse={true}
          pulseSpeed={600}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-12 md:space-y-16">
        {/* Hero Header (Framer Motion for smooth initial load) */}
        <motion.section 
          className="text-center space-y-4 pt-4 md:pt-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight uppercase">
            Contact Us
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-white/70 max-w-2xl mx-auto px-4">
            Have questions or want to collaborate? Connect with the organizing
            team of {SITE_CONFIG.name}.
          </p>
        </motion.section>

        {/* Organizing Heads Grid (GSAP Scrub) */}
        <section className="space-y-6 md:space-y-8 gsap-stagger-container">
          <div className="text-center space-y-2 gsap-reveal">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight uppercase">
              Organizing Heads
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {ORGANIZING_HEADS.map((head, idx) => (
              <div
                key={idx}
                className="bg-neutral-900/80 backdrop-blur-md border border-white/10 hover:border-white/30 rounded-2xl p-5 md:p-6 flex flex-col justify-between space-y-5 md:space-y-6 transition-all duration-300 hover:scale-[1.02] shadow-xl group gsap-stagger-card"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                    <svg
                      className="w-5 h-5 md:w-6 md:h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-white tracking-tight">
                      {head.name}
                    </h3>
                    <span className="text-[10px] md:text-xs font-semibold text-purple-400 uppercase tracking-wider">
                      {head.role || "Organizing Head"}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10">
                  <a
                    href={`tel:${head.phone}`}
                    className="flex items-center gap-2.5 text-xs md:text-sm font-semibold text-white/90 hover:text-indigo-400 transition-colors min-h-[44px]"
                  >
                    <svg
                      className="w-4 h-4 text-indigo-400 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1.01 1.01 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <span>{head.displayPhone}</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Email Callout Section (GSAP Scrub) */}
        <section className="bg-gradient-to-r from-neutral-900/90 via-neutral-900/90 to-neutral-800/90 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8 md:p-12 text-center space-y-4 shadow-2xl gsap-reveal mx-2 sm:mx-0">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto">
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
          <div className="bg-neutral-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-5 md:p-8 space-y-6 shadow-xl gsap-reveal mx-2 sm:mx-0">
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase">
              Send Us A Message
            </h2>
            <ContactForm />
          </div>

          {/* Venue & Location Details */}
          <div className="bg-neutral-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-5 md:p-8 space-y-6 shadow-xl gsap-reveal mx-2 sm:mx-0">
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase">
              Festival Venue
            </h2>

            <div className="space-y-4 text-white/80 text-xs sm:text-sm md:text-base leading-relaxed">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0 mt-0.5">
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
                  <h3 className="font-bold text-white text-sm md:text-base">
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
                className="inline-flex items-center gap-2 px-4 py-2.5 md:px-6 md:py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-[10px] md:text-xs uppercase tracking-wider transition-all border border-white/10"
              >
                <span>View On Google Maps</span>
                <svg
                  className="w-3 h-3 md:w-4 md:h-4 text-purple-400"
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

