'use client'

import React, { createContext, useContext, useRef } from 'react'

export const ScrollProgressContext = createContext<React.MutableRefObject<number> | null>(null)

export const useScrollProgress = () => {
  const context = useContext(ScrollProgressContext)
  if (!context) {
    throw new Error('useScrollProgress must be used within a ScrollProgressProvider')
  }
  return context
}

export function ScrollProgressProvider({ children }: { children: React.ReactNode }) {
  const progressRef = useRef(0)
  return (
    <ScrollProgressContext.Provider value={progressRef}>
      {children}
    </ScrollProgressContext.Provider>
  )
}
