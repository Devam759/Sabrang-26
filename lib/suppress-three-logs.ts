// Suppress noisy third-party Three.js console output that has no effect on runtime behavior.
// Loaded once globally via layout.tsx before any Three.js code runs.

import * as THREE from "three";

// ─── Strings to suppress on BOTH server (Node.js terminal) and browser ────────
const SUPPRESSED_STRINGS = [
  "THREE.Clock",
  "Multiple instances of Three.js",
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

// Apply on Node.js (server / terminal) and browser alike
console.warn = filterLog(console.warn);
console.error = filterLog(console.error);

// ─── Browser-only patches ──────────────────────────────────────────────────────
if (typeof window !== "undefined") {
  // Monkey-patch BufferGeometry.computeBoundingSphere to guard against initial empty/NaN attributes
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
}

export {};
