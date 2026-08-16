// Suppress noisy third-party Three.js console output that has no effect on runtime behavior.
// Loaded once globally via layout.tsx before any Three.js code runs.

if (typeof window !== "undefined") {
  const SUPPRESSED_WARNS = [
    "Multiple instances of Three.js",
    "THREE.Clock",
    "THREE.BufferGeometry.computeBoundingSphere",
  ];

  const SUPPRESSED_ERRORS = [
    "THREE.BufferGeometry.computeBoundingSphere",
  ];

  const origWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      SUPPRESSED_WARNS.some((s) => (args[0] as string).includes(s))
    ) {
      return;
    }
    origWarn.apply(console, args);
  };

  const origErr = console.error;
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      SUPPRESSED_ERRORS.some((s) => (args[0] as string).includes(s))
    ) {
      return;
    }
    origErr.apply(console, args);
  };
}

export {};
