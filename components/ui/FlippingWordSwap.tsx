"use client";

// From componentry.dev/docs/components/flipping-word-swap, kept faithful to the
// published source. Two additions, both needed to use it as a navigation item
// rather than a display flourish, both optional so the documented behaviour is
// unchanged when they are omitted:
//   onClick   — the swap is hover/focus driven, so the click is still free
//   ariaLabel — the default label follows the visible word, which would read
//               the hover state ("Enter") to a screen reader instead of the
//               destination. A menu item must announce where it goes.

import { cn } from "@/lib/utils";
import gsap from "gsap";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

const graphemeSegmenter =
  typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;

function segmentCharacters(text: string) {
  if (!graphemeSegmenter) return Array.from(text);
  return Array.from(graphemeSegmenter.segment(text), ({ segment }) => segment);
}

export interface FlippingWordSwapProps {
  /** The word or short phrase shown at rest. */
  word1: string;
  /** The word or short phrase revealed on interaction. */
  word2: string;
  /** Duration of each character flip in milliseconds. */
  duration?: number;
  /** Delay between neighboring character flips in milliseconds. */
  stagger?: number;
  /** Additional classes applied to the interactive container. */
  className?: string;
  /** Additional classes applied only to the revealed word. */
  toClassName?: string;
  /** Inline styles applied to the interactive container. */
  style?: CSSProperties;
  /** Inline styles applied only to the revealed word. */
  toStyle?: CSSProperties;
  /** Fired on activation. The swap itself stays hover/focus driven. */
  onClick?: () => void;
  /** Overrides the announced label, which otherwise follows the visible word. */
  ariaLabel?: string;
  /**
   * Drives the swap from outside instead of from hover/focus. Passing this at
   * all makes the component controlled — the pointer no longer flips it — so
   * the swap can express something the page decides rather than something the
   * cursor does. The carousel uses it to flip the heading from the outgoing
   * menu item to the incoming one.
   */
  swapped?: boolean;
}

export function FlippingWordSwap({
  word1,
  word2,
  duration = 400,
  stagger = 44,
  className,
  toClassName,
  style,
  toStyle,
  onClick,
  ariaLabel,
  swapped,
}: FlippingWordSwapProps) {
  const controlled = swapped !== undefined;
  const containerRef = useRef<HTMLButtonElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const swappedRef = useRef(false);
  const [isSwapped, setIsSwapped] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const resolvedDuration = prefersReducedMotion
      ? 0
      : Math.max(180, duration) / 1000;
    const resolvedStagger = prefersReducedMotion
      ? 0
      : Math.max(0, stagger) / 1000;

    const context = gsap.context(() => {
      const firstWord = gsap.utils.toArray<HTMLElement>(
        '[data-flip-word="first"]',
      );
      const secondWord = gsap.utils.toArray<HTMLElement>(
        '[data-flip-word="second"]',
      );

      gsap.set(firstWord, {
        rotationX: 0,
        opacity: 1,
        transformOrigin: "center top",
      });
      gsap.set(secondWord, {
        rotationX: -82,
        opacity: 0,
        transformOrigin: "center bottom",
      });

      const timeline = gsap.timeline({ paused: true });
      timeline
        .to(firstWord, {
          rotationX: 82,
          opacity: 0,
          duration: resolvedDuration,
          stagger: resolvedStagger,
          ease: "power2.in",
        })
        .to(
          secondWord,
          {
            rotationX: 0,
            opacity: 1,
            duration: resolvedDuration,
            stagger: resolvedStagger,
            ease: "power2.out",
          },
          `<${resolvedDuration * 0.62}`,
        );

      if (swappedRef.current) timeline.progress(1);
      timelineRef.current = timeline;
    }, containerRef);

    return () => {
      timelineRef.current = null;
      context.revert();
    };
  }, [duration, stagger, word1, word2]);

  const updateSwap = useCallback((next: boolean) => {
    swappedRef.current = next;
    setIsSwapped(next);

    if (next) {
      timelineRef.current?.play();
    } else {
      timelineRef.current?.reverse();
    }
  }, []);

  // Controlled mode: the page owns the swap, so mirror it into the timeline.
  useEffect(() => {
    if (controlled) updateSwap(swapped);
  }, [controlled, swapped, updateSwap]);

  const renderCharacters = (text: string, layer: "first" | "second") =>
    segmentCharacters(text).map((character, index) => (
      <span
        key={`${layer}-${index}-${character}`}
        data-flip-word={layer}
        className="inline-block whitespace-pre [backface-visibility:hidden] [will-change:transform,opacity]"
      >
        {character === " " ? " " : character}
      </span>
    ));

  return (
    <button
      ref={containerRef}
      type="button"
      className={cn(
        "relative inline-grid cursor-pointer select-none border-0 bg-transparent p-0 align-baseline font-[inherit] leading-[inherit] tracking-[inherit] text-[inherit]",
        "rounded-[0.08em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/30 focus-visible:ring-offset-2",
        className,
      )}
      aria-label={ariaLabel ?? (isSwapped ? word2 : word1)}
      aria-pressed={ariaLabel ? undefined : isSwapped}
      style={style}
      onClick={onClick}
      onMouseEnter={controlled ? undefined : () => updateSwap(true)}
      onMouseLeave={controlled ? undefined : () => updateSwap(false)}
      onPointerUp={
        controlled
          ? undefined
          : (event) => {
              if (event.pointerType !== "mouse") updateSwap(!swappedRef.current);
            }
      }
      onFocus={
        controlled
          ? undefined
          : (event) => {
              if (event.currentTarget.matches(":focus-visible")) updateSwap(true);
            }
      }
      onBlur={controlled ? undefined : () => updateSwap(false)}
    >
      <span className="col-start-1 row-start-1 inline-grid overflow-hidden [perspective:800px]">
        <span
          className="col-start-1 row-start-1 inline-flex items-baseline justify-center gap-[0.012em] whitespace-pre"
          aria-hidden="true"
        >
          {renderCharacters(word1, "first")}
        </span>
        <span
          className={cn(
            "col-start-1 row-start-1 inline-flex items-baseline justify-center gap-[0.012em] whitespace-pre",
            toClassName,
          )}
          aria-hidden="true"
          style={toStyle}
        >
          {renderCharacters(word2, "second")}
        </span>
      </span>
    </button>
  );
}
