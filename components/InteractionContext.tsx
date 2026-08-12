"use client";

import React, { createContext, useContext, useState } from "react";

type HoverState = "idle" | "primary" | "secondary" | "tertiary";

interface InteractionContextType {
  hoverState: HoverState;
  setHoverState: (state: HoverState) => void;
  // Fallbacks in case any legacy component expects them
  scrollProgress: number;
  scrollVelocity: number;
}

const InteractionContext = createContext<InteractionContextType>({
  hoverState: "idle",
  setHoverState: () => {},
  scrollProgress: 0,
  scrollVelocity: 0,
});

export function InteractionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hoverState, setHoverState] = useState<HoverState>("idle");

  return (
    <InteractionContext.Provider
      value={{
        hoverState,
        setHoverState,
        scrollProgress: 0,
        scrollVelocity: 0,
      }}
    >
      {children}
    </InteractionContext.Provider>
  );
}

export function useInteraction() {
  return useContext(InteractionContext);
}
