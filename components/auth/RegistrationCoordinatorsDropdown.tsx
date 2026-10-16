"use client";

import React, { useState, useMemo } from "react";
import { ChevronDown, Phone, Search, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { galleryItems } from "@/lib/highlights-data";

export default function RegistrationCoordinatorsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  const copyPhone = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(phone);
      setCopiedPhone(phone);
      setTimeout(() => setCopiedPhone(null), 2000);
    }
  };

  const filteredEvents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return galleryItems.filter((item) => {
      if (!item.coordinators || item.coordinators.length === 0) return false;
      if (!q) return true;
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchCategory = item.category.toLowerCase().includes(q);
      const matchCoord = item.coordinators.some(
        (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
      );
      return matchTitle || matchCategory || matchCoord;
    });
  }, [searchQuery]);

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 transition-all duration-300 backdrop-blur-xl ${
        isOpen
          ? "bg-[#0b0b0e]/95 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.1)]"
          : "bg-[#0c0c0e]/90 border border-white/10 hover:border-white/20 shadow-2xl"
      }`}
    >
      {/* Dropdown Menu Button Header */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between text-left group cursor-pointer"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-300 shrink-0 ${
              isOpen
                ? "bg-cyan-400/20 border-cyan-400/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)] scale-105"
                : "bg-cyan-400/10 border-cyan-400/25 text-cyan-400 group-hover:scale-105 group-hover:border-cyan-400/40 group-hover:bg-cyan-400/15"
            }`}
          >
            <Phone className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-black text-white uppercase tracking-wider font-[family-name:var(--font-space-grotesk)] group-hover:text-cyan-300 transition-colors">
              Event Coordinators
            </span>
            <p className="text-[11px] text-white/50 font-sans mt-0.5">
              Contact details for rules & event queries
            </p>
          </div>
        </div>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all duration-300 shrink-0 ${
            isOpen
              ? "bg-cyan-400/15 border-cyan-400/30 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
              : "bg-white/[0.04] border-white/10 text-white/50 group-hover:text-cyan-300 group-hover:border-cyan-400/30 group-hover:bg-cyan-400/10"
          }`}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      {/* Animated Dropdown Menu Body */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="coordinators-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <motion.div
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="mt-4 pt-4 border-t border-white/10 space-y-3"
            >
              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search event or coordinator..."
                  className="w-full bg-white/[0.04] border border-white/10 focus:border-cyan-400/50 focus:bg-white/[0.06] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-white/30 outline-none transition-all focus:ring-1 focus:ring-cyan-400/20"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs cursor-pointer p-0.5"
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Coordinators List */}
              <div className="max-h-[380px] overflow-y-auto space-y-2.5 pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/25">
                {filteredEvents.length === 0 ? (
                  <div className="text-white/40 text-xs italic py-8 text-center bg-white/[0.02] rounded-xl border border-white/5">
                    No coordinators found matching &ldquo;{searchQuery}&rdquo;
                  </div>
                ) : (
                  filteredEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-3.5 rounded-xl bg-white/[0.025] hover:bg-white/[0.04] border border-white/5 hover:border-cyan-400/20 transition-all duration-200"
                    >
                      {/* Event Title & Category */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className="font-bold text-xs text-white uppercase tracking-wider font-[family-name:var(--font-space-grotesk)]">
                          {event.title}
                        </span>
                        <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-white/60 border border-white/10 shrink-0 font-medium">
                          {event.category.split(" - ")[0]}
                        </span>
                      </div>

                      {/* Coordinators */}
                      <div className="space-y-1.5">
                        {event.coordinators?.map((coord, idx) => {
                          const isPlaceholder =
                            !coord.phone ||
                            /[a-zA-Z]/.test(coord.phone) ||
                            coord.phone.toLowerCase().includes("tba") ||
                            coord.phone.toLowerCase().includes("announced");

                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs bg-black/40 hover:bg-black/60 px-3 py-2 rounded-lg border border-white/5 transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-slate-200 font-medium truncate text-xs">
                                  {coord.name}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0 ml-2">
                                {isPlaceholder ? (
                                  <span className="text-white/35 text-[10px] italic">
                                    {coord.phone || "TBA"}
                                  </span>
                                ) : (
                                  <>
                                    <a
                                      href={`tel:${coord.phone}`}
                                      className="px-2.5 py-1 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/25 hover:border-cyan-400/40 text-cyan-300 font-mono text-[11px] font-semibold flex items-center gap-1.5 transition-all hover:scale-[1.02]"
                                      title={`Call ${coord.name}`}
                                    >
                                      <Phone className="w-3 h-3 shrink-0" />
                                      <span>{coord.phone}</span>
                                    </a>

                                    <button
                                      type="button"
                                      onClick={(e) => copyPhone(coord.phone, e)}
                                      className="p-1.5 hover:bg-white/10 rounded-md text-white/50 hover:text-white transition-colors cursor-pointer"
                                      title="Copy phone number"
                                    >
                                      {copiedPhone === coord.phone ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
