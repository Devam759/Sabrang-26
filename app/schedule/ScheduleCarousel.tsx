"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
<<<<<<< HEAD
import Image from "next/image";
=======
>>>>>>> 968839f771d847688d4fe2b18f6c13b8f23dcca6
import "./ScheduleCarousel.css";

type ScheduleEvent = {
  time: string;
  event: string;
  venue: string;
  type: string;
  image?: string;
};

interface ScheduleCarouselProps {
  events: ScheduleEvent[];
}

const CARD_GAP = 1.15; // how many card-widths apart each card is

export default function ScheduleCarousel({ events }: ScheduleCarouselProps) {
  // We only use state for activeIndex to drive the controls (timeline/counter)
  // The actual scroll positioning is driven entirely via refs to bypass React render cycle
  const [activeIndex, setActiveIndex] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const progressRef = useRef(0);
  const cardWRef = useRef(380);
  
  const total = events.length;

  /* ── Responsive Card Width ──────────────────────────────────── */
  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth;
      if (vw < 768) {
        cardWRef.current = vw * 0.84;
      } else {
        cardWRef.current = Math.max(390, Math.min(vw * 0.38, 500));
      }
      
      // Force a scroll update to apply new widths immediately
      if (containerRef.current) {
        window.dispatchEvent(new Event('scroll'));
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  /* ── Ultra-Smooth DOM Animation Loop ───────────────────────── */
  const updateCardsDOM = useCallback((progress: number) => {
    const cardW = cardWRef.current;
    
    let newActiveIndex = Math.max(0, Math.min(total - 1, Math.round(progress)));

    cardsRef.current.forEach((card, i) => {
      if (!card) return;
      
      const rel = i - progress;
      const abs = Math.abs(rel);
      // Compute physics for dramatic 3D depth
      const isCenter = abs < 0.05;
      // Active card scales up to 1.05, inactive cards scale down dramatically to 0.8, 0.6, etc.
      const computedScale = Math.max(0.7, 1.05 - abs * 0.25);
      const opacity = Math.max(0, 1 - abs * 0.5);
      const imageBlur = isCenter ? 0 : Math.min(2, abs * 1.5); // subtle image blur only
      const zIndex = total + 2 - Math.round(abs * 2);
      const xPx = rel * cardW * CARD_GAP;
      
      // Apply directly to DOM to bypass React render overhead
      card.style.width = `${cardW}px`;
      card.style.transform = `translate(calc(-50% + ${xPx}px), -50%) scale(${computedScale})`;
      card.style.opacity = opacity.toString();
      card.style.zIndex = zIndex.toString();
      card.style.filter = 'none'; // Force clear any lingering blur from previous hot-reloads
      
      const innerCard = card.firstElementChild;
      if (innerCard) {
        if (newActiveIndex === i) {
          innerCard.classList.add('carousel-card--active');
        } else {
          innerCard.classList.remove('carousel-card--active');
        }
        
        // Apply targeted blur to the media element, keeping text crisp
        const media = innerCard.querySelector('.event-card-media') as HTMLElement;
        if (media) {
          media.style.filter = imageBlur > 0 ? `blur(${imageBlur}px)` : 'none';
        }
      }
    });
    
    setActiveIndex((prev) => (prev !== newActiveIndex ? newActiveIndex : prev));
  }, [total]);

  /* ── Scroll Tracking ────────────────────────────────────────── */
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const containerTop = rect.top;
      const containerHeight = rect.height;
      
      const scrollableDistance = containerHeight - window.innerHeight;
      let rawProgress = -containerTop / scrollableDistance;
      rawProgress = Math.max(0, Math.min(1, rawProgress));
      
      const p = rawProgress * (total - 1);
      progressRef.current = p;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateCardsDOM(progressRef.current);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    setTimeout(handleScroll, 50);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [total, updateCardsDOM]);

  // Reset scroll when day changes
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const absoluteTop = window.scrollY + rect.top;
      if (window.scrollY > absoluteTop) {
        window.scrollTo({ top: absoluteTop, behavior: "smooth" });
      }
    }
  }, [events]);

  /* ── Custom Cinematic Scroll for Buttons ────────────────────── */
  const scrollToEvent = (index: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scrollableDistance = rect.height - window.innerHeight;
    const targetPercentage = total > 1 ? index / (total - 1) : 0;
    
    const startY = window.scrollY;
    const targetY = startY + rect.top + (scrollableDistance * targetPercentage);
    const distance = targetY - startY;
    
    const duration = 800;
    let startTime: number | null = null;
    
    const easeInOutCubic = (t: number) => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };
    
    const animation = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      
      const easeProgress = easeInOutCubic(progress);
      window.scrollTo(0, startY + distance * easeProgress);
      
      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    };
    
    requestAnimationFrame(animation);
  };

  if (events.length === 0) {
    return (
      <div className="sc-empty">
        <p className="sc-empty-label">No Events Scheduled</p>
        <p className="sc-empty-sub">The schedule for this day will be announced soon.</p>
      </div>
    );
  }

  const scrollHeight = `${100 + (total - 1) * 60}vh`;

  return (
    <div 
      ref={containerRef} 
      className="schedule-carousel-scroll-container" 
      style={{ height: scrollHeight }}
    >
      <div className="schedule-carousel-sticky">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none transition-all duration-1000 animate-pulse" />
        
        <div className="schedule-carousel-viewport" role="region" aria-label="Event Schedule Carousel">
          <div className="schedule-carousel-track">
            {events.map((evt, i) => {
              return (
                <div
                  key={i}
                  ref={(el) => { cardsRef.current[i] = el; }}
                  className="schedule-card-wrapper"
                  onClick={() => scrollToEvent(i)}
                  style={{ opacity: 0 }} 
                >
                  <div className="carousel-card">
                    {/* VISUAL ZONE */}
                    <div className="event-card-media">
                      {evt.image ? (
                        <>
<<<<<<< HEAD
                          <Image
                            src={evt.image}
                            alt={evt.event}
                            fill
                            sizes="(max-width: 768px) 90vw, 40vw"
=======
                          <img 
                            src={evt.image} 
                            alt={evt.event}
>>>>>>> 968839f771d847688d4fe2b18f6c13b8f23dcca6
                          />
                          <div className="media-overlay" />
                        </>
                      ) : (
                        <div className="event-fallback">
                          <div className="fallback-grid" />
                          <span className="fallback-number">{String(i + 1).padStart(2, "0")}</span>
                          <span className="fallback-type">{evt.type}</span>
                        </div>
                      )}
                      
                      {evt.type.toUpperCase() === "FLAGSHIP" && (
                        <span className="event-badge">★ FLAGSHIP</span>
                      )}
                    </div>

                    {/* INFORMATION ZONE */}
                    <div className="event-card-content">
                      <div className="event-topline">
                        <span className="event-time">{evt.time}</span>
                        <span className="event-number">{String(i + 1).padStart(2, "0")}</span>
                      </div>

                      <span className="event-type">{evt.type}</span>

                      <h3 className="event-title">{evt.event}</h3>

                      <div className="event-divider" />

                      <div className="event-venue">
                        <span>VENUE</span>
                        <strong>{evt.venue}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="sc-bottom-area">
          <div className="sc-timeline" aria-hidden="true">
            <div className="sc-timeline-line" />
            <div className="sc-timeline-dots">
              {events.map((_, i) => (
                <button
                  key={i}
                  className={`sc-timeline-dot${activeIndex === i ? " sc-timeline-dot--active" : ""}`}
                  onClick={() => scrollToEvent(i)}
                  aria-label={`Go to event ${i + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="sc-controls">
            <button
              className="sc-nav-btn"
              disabled={activeIndex === 0}
              onClick={() => scrollToEvent(activeIndex - 1)}
              aria-label="Previous event"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>

            <div className="sc-counter">
              <span className="sc-counter-current">{String(activeIndex + 1).padStart(2, "0")}</span>
              <span>/</span>
              <span>{String(total).padStart(2, "0")}</span>
            </div>

            <button
              className="sc-nav-btn"
              disabled={activeIndex === total - 1}
              onClick={() => scrollToEvent(activeIndex + 1)}
              aria-label="Next event"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
