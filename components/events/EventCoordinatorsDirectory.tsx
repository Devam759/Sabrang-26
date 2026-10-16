"use client";

import React, { useMemo, useState } from "react";
import { Phone, Search, Users, Copy, Check, Sparkles } from "lucide-react";
import { ALL_COORDINATOR_DIRECTORY, CoordinatorDirectoryEntry } from "@/lib/highlights-data";

export default function EventCoordinatorsDirectory({
  isModal = false,
  onClose,
}: {
  isModal?: boolean;
  onClose?: () => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  const categories = useMemo(() => {
    return [
      "All",
      "Flagship Events",
      "Non-Flagship Events",
      "Esports",
      "Activities",
      "Registration Core",
    ];
  }, []);

  const filteredCoordinators = useMemo(() => {
    return ALL_COORDINATOR_DIRECTORY.filter((item) => {
      const matchesCat =
        selectedCategory === "All" || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.eventName.toLowerCase().includes(q) ||
        item.phone.includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const copyToClipboard = (phone: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(phone);
      setCopiedPhone(phone);
      setTimeout(() => setCopiedPhone(null), 2000);
    }
  };

  const content = (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-4 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-950/40 text-purple-300 border border-purple-500/30 mb-2">
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span>Official Committee Contacts</span>
          </div>
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-white font-[family-name:var(--font-space-grotesk)] text-neon-rgb"
          >
            Event Coordinators
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Have questions regarding rules, team limits, or reporting timings? Connect directly with the respective event heads.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by event or coordinator..."
            className="w-full bg-white/[0.04] border border-white/15 focus:border-purple-400 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 outline-none transition-all focus:ring-1 focus:ring-purple-400/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
        {categories.map((cat) => {
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all whitespace-nowrap cursor-pointer ${
                active
                  ? "bg-[#8ea5fe] text-zinc-950 shadow-[0_0_16px_rgba(142,165,254,0.35)] scale-105"
                  : "bg-white/[0.04] text-slate-300 hover:text-white border border-white/10 hover:border-white/20"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Coordinators Grid */}
      {filteredCoordinators.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl bg-white/[0.02] border border-white/10">
          <p className="text-slate-400 text-sm">No event coordinators found matching &ldquo;{searchQuery}&rdquo;</p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("All");
            }}
            className="mt-3 text-xs text-purple-400 hover:underline font-bold"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredCoordinators.map((entry, idx) => {
            const isCopied = copiedPhone === entry.phone;
            const isPlaceholder =
              !entry.phone ||
              /[a-zA-Z]/.test(entry.phone) ||
              entry.phone.toLowerCase().includes("tba");

            return (
              <div
                key={`${entry.eventName}-${entry.name}-${idx}`}
                className="group relative p-4 rounded-xl bg-[#0c0d15] border border-white/10 hover:border-purple-500/40 hover:bg-[#10121d] transition-all duration-200 shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-purple-950/50 text-purple-300 border border-purple-500/30">
                      {entry.category}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-400 opacity-60" />
                      Sabrang &apos;26
                    </span>
                  </div>

                  <h3 className="text-base font-black text-white group-hover:text-purple-200 transition-colors uppercase tracking-tight">
                    {entry.eventName}
                  </h3>
                  <p className="text-xs font-semibold text-slate-300 mt-0.5">
                    {entry.name}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  {isPlaceholder ? (
                    <div className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-white/[0.02] border border-dashed border-purple-400/30 text-slate-400 text-xs">
                      <span className="text-[10px] font-medium text-slate-400">Space reserved</span>
                      <span className="font-mono text-[10px] font-bold text-purple-300/80 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-500/20">
                        {entry.phone || "To be updated"}
                      </span>
                    </div>
                  ) : (
                    <>
                      <a
                        href={`tel:${entry.phone}`}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-purple-950/40 border border-white/10 hover:border-purple-500/40 text-purple-200 text-xs font-mono font-bold tracking-wide transition-all group/btn"
                        title={`Call ${entry.name}`}
                      >
                        <Phone className="w-3.5 h-3.5 text-purple-400 group-hover/btn:scale-110 transition-transform" />
                        <span>{entry.phone}</span>
                      </a>

                      <button
                        onClick={() => copyToClipboard(entry.phone)}
                        className="p-1.5 rounded-lg border border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-all text-xs cursor-pointer"
                        title="Copy phone number"
                      >
                        {isCopied ? (
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
      )}
    </div>
  );

  if (isModal) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/90 backdrop-blur-md overflow-y-auto"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Event Coordinators Directory"
      >
        <div
          className="relative my-auto w-full max-w-5xl max-h-[90vh] overflow-y-auto p-5 sm:p-7 md:p-8 bg-[#0a0b12] border border-white/10 rounded-2xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {onClose && (
            <button
              onClick={onClose}
              type="button"
              className="absolute top-4 right-4 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/70 backdrop-blur-md text-white/80 hover:text-white hover:border-white/40 active:scale-90 transition-all shadow-lg cursor-pointer"
              aria-label="Close coordinators directory"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
          {content}
        </div>
      </div>
    );
  }

  return <section className="w-full py-12 px-4 sm:px-6">{content}</section>;
}
