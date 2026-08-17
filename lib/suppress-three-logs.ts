// Suppress noisy third-party Three.js console output that has no effect on runtime behavior.
// Loaded once globally via layout.tsx before any Three.js code runs.

import * as THREE from "three";

if (typeof window !== "undefined") {
  // 1. Monkey-patch BufferGeometry.computeBoundingSphere to guard against initial empty/NaN attributes
  try {
    const origComputeBoundingSphere = THREE.BufferGeometry.prototype.computeBoundingSphere;
    THREE.BufferGeometry.prototype.computeBoundingSphere = function () {
      const position = this.attributes?.position;
      if (!position || !position.array || position.count === 0) {
        this.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 0);
        return;
      }
      try {
        origComputeBoundingSphere.call(this);
        if (!this.boundingSphere || isNaN(this.boundingSphere.radius)) {
          this.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 0);
        }
      } catch {
        this.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 0);
      }
    };
  } catch {
    // Ignore in non-browser environments
  }

  // 2. Global console filter for third-party Three.js libraries
  const SUPPRESSED_STRINGS = [
    "Multiple instances of Three.js",
    "THREE.Clock",
    "THREE.BufferGeometry.computeBoundingSphere",
    "computeBoundingSphere",
    "Computed radius is NaN",
    "position attribute is likely to have NaN",
    "position attribute is likely to have NaN values",
  ];

  const filterLog = (origFn: (...args: unknown[]) => void) => {
    return (...args: unknown[]) => {
      const msg = args.map((a) => (typeof a === "string" ? a : String(a))).join(" ");
      if (SUPPRESSED_STRINGS.some((s) => msg.includes(s))) {
        return;
      }
      origFn.apply(console, args);
    };
  };

  console.warn = filterLog(console.warn);
  console.error = filterLog(console.error);
}

export {};
