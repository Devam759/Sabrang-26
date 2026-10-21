"use client";

import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ContactPatternBackground from "@/components/contact/ContactPatternBackground";
import { ORGANIZING_HEADS, SITE_CONFIG } from "@/lib/constants";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function ContactClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(SITE_CONFIG.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      const revealElements = gsap.utils.toArray<HTMLElement>('.gsap-reveal');

      revealElements.forEach((el) => {
        gsap.fromTo(
          el,
          {
            opacity: 0,
            y: 40,
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
              scrub: 1,
            },
          }
        );
      });

      const headCards = gsap.utils.toArray<HTMLElement>('.gsap-stagger-card');
      if (headCards.length > 0) {
        gsap.fromTo(
          headCards,
          {
            opacity: 0,
            y: 30,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: "power2.out",
            scrollTrigger: {
              trigger: ".gsap-stagger-container",
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      }
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div className="relative min-h-screen py-16 px-4 sm:px-6 md:px-8 pb-24 overflow-x-hidden bg-transparent" ref={containerRef}>
      {/* Geometric Conic Pattern Background */}
      <ContactPatternBackground />

      <div className="relative z-10 max-w-6xl mx-auto space-y-12 md:space-y-16">
        <motion.section 
          className="text-center space-y-4 pt-8 md:pt-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-white tracking-tight uppercase drop-shadow-lg">
            Contact Us
          </h1>
          <p className="text-sm sm:text-base md:text-xl text-white/70 max-w-2xl mx-auto font-medium px-4">
            Have questions or want to collaborate? Connect with the organizing team of {SITE_CONFIG.name}.
          </p>
        </motion.section>

        <section className="space-y-8 md:space-y-12 gsap-stagger-container">
          <div className="text-center space-y-2 gsap-reveal">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
              Organizing Heads
            </h2>
          </div>
          <StaticOrganizingHeads />
        </section>

        {/* Minimalist Inline Email Bar */}
        <section className="gsap-reveal text-center pt-2 pb-6">
          <div className="inline-flex items-center justify-center gap-3 px-5 py-2.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 backdrop-blur-md transition-all duration-300 shadow-lg">
            <span className="text-white/40 text-xs font-mono tracking-widest uppercase hidden sm:inline">EMAIL</span>
            <span className="text-white/20 hidden sm:inline">/</span>
            <a
              href={`mailto:${SITE_CONFIG.email}`}
              className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-white hover:text-indigo-300 transition-colors"
              style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}
            >
              {SITE_CONFIG.email}
            </a>
            <button
              type="button"
              onClick={handleCopyEmail}
              aria-label="Copy email"
              title={copied ? "Copied!" : "Copy email"}
              className="p-1 text-white/50 hover:text-white transition-colors cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center active:scale-90"
            >
              {copied ? (
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        </section>

        {/* Official Registered Entity & Address Details for Compliance & Verification */}
        <section className="gsap-reveal max-w-2xl mx-auto text-center border-t border-white/10 pt-8 pb-4 space-y-4">
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md space-y-3 text-left">
            <h3 className="text-lg font-bold text-white uppercase tracking-wider font-mono text-center sm:text-left">
              Registered University Campus &amp; Helpdesk
            </h3>
            <div className="text-xs sm:text-sm text-white/70 space-y-1.5 font-sans leading-relaxed">
              <p className="font-semibold text-white">{SITE_CONFIG.university.name}</p>
              <p>Sabrang Festival Organizing Committee</p>
              <p>Near Mahindra World City, P.O. Mahapura, Ajmer Road</p>
              <p>Jaipur, Rajasthan - 302026, India</p>
            </div>
            <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row justify-between text-xs font-mono text-white/60 gap-2">
              <span>Support Email: <a href="mailto:sabrang@jklu.edu.in" className="text-purple-300 underline">sabrang@jklu.edu.in</a></span>
              <span>Hours: Mon-Sat, 9:00 AM - 6:00 PM IST</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

const StaticOrganizingHeads = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4 md:px-0">
      {ORGANIZING_HEADS.map((head, index) => (
        <div key={index} className="gsap-stagger-card group bg-neutral-900/50 backdrop-blur-xl border border-white/5 hover:border-indigo-500/30 rounded-3xl overflow-hidden shadow-xl transition-all hover:shadow-indigo-500/10">
          <div className="relative w-full aspect-[4/5] overflow-hidden">
            <Image
              src={head.image || "https://res.cloudinary.com/eftrvjpx/image/upload/f_auto,q_auto/v1787060269/sabrang-2026/gallery/43.webp"}
              alt={head.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/40 to-transparent" />
            <div className="absolute inset-0 p-6 flex flex-col justify-end">
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2 leading-tight">
                {head.name}
              </h3>
              <a
                href={`tel:${head.phone}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-100 rounded-lg text-sm font-medium transition-colors border border-indigo-500/30 w-fit"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1.01 1.01 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>{head.displayPhone}</span>
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

