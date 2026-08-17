"use client";

import React from "react";
import ContactForm from "@/components/forms/ContactForm";
import CursorGrid from "@/components/ui/CursorGrid";
import { ORGANIZING_HEADS, SITE_CONFIG } from "@/lib/constants";

export default function ContactClient() {
  return (
    <div className="relative min-h-screen py-8 px-4">
      {/* Dynamic CursorGrid Interactive Background - Full Screen Stretch */}
      <div className="fixed inset-0 z-0 opacity-70 pointer-events-none w-screen h-screen overflow-hidden">
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

      <div className="relative z-10 max-w-6xl mx-auto space-y-16">
        {/* Hero Header */}
        <section className="text-center space-y-3 pt-2">
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase">
            Contact Us
          </h1>
          <p className="text-sm md:text-base text-white/70 max-w-2xl mx-auto">
            Have questions or want to collaborate? Connect with the organizing
            team of {SITE_CONFIG.name}.
          </p>
        </section>

        {/* Organizing Heads Grid */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl md:text-3xl font-black text-white tracking-tight uppercase">
              Organizing Heads
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ORGANIZING_HEADS.map((head, idx) => (
              <div
                key={idx}
                className="bg-neutral-900/80 backdrop-blur-md border border-white/10 hover:border-white/30 rounded-xl p-4 flex flex-col justify-between space-y-4 transition-all duration-300 hover:scale-[1.02] shadow-xl group"
              >
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                    <svg
                      className="w-6 h-6"
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
                    <h3 className="text-lg font-bold text-white tracking-tight">
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
                    className="flex items-center gap-2 text-xs font-semibold text-white/90 hover:text-indigo-400 transition-colors min-h-[40px]"
                  >
                    <svg
                      className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0"
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

        {/* Email Callout Section */}
        <section className="bg-gradient-to-r from-neutral-900/90 via-neutral-900/90 to-neutral-800/90 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8 text-center space-y-3 shadow-2xl">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto">
            <svg
              className="w-5 h-5"
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
          <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-tight">
            Drop Us An Email At
          </h2>
          <div>
            <a
              href={`mailto:${SITE_CONFIG.email}`}
              className="text-xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 hover:opacity-90 transition-opacity tracking-tight"
            >
              {SITE_CONFIG.email}
            </a>
          </div>
        </section>

        {/* Form & Venue Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Send Us A Message Form */}
          <div className="bg-neutral-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-5 md:p-6 space-y-4 shadow-xl">
            <h2 className="text-xl font-black text-white tracking-tight uppercase">
              Send Us A Message
            </h2>
            <ContactForm />
          </div>

          {/* Venue & Location Details */}
          <div className="bg-neutral-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-5 md:p-6 space-y-4 shadow-xl">
            <h2 className="text-xl font-black text-white tracking-tight uppercase">
              Festival Venue
            </h2>

            <div className="space-y-3 text-white/80 text-xs md:text-sm leading-relaxed">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0 mt-0.5">
                  <svg
                    className="w-4 h-4"
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
                  <h3 className="font-bold text-white text-sm">
                    {SITE_CONFIG.university.name}
                  </h3>
                  <p className="text-white/60">Mahapura, Ajmer Road</p>
                  <p className="text-white/60">Jaipur, Rajasthan 302026</p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10">
              <a
                href="https://maps.google.com/?q=JK+Lakshmipat+University+Jaipur"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-[10px] uppercase tracking-wider transition-all border border-white/10"
              >
                <span>View On Google Maps</span>
                <svg
                  className="w-4 h-4 text-purple-400"
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
