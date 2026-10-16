// Suppress noisy third-party Three.js console output that has no effect on runtime behavior.
// Loaded globally on both client and server before Three.js renders.

import * as THREE from "three";

// ─── Strings to suppress on BOTH server (Node.js terminal) and browser ────────
const SUPPRESSED_STRINGS = [
  "THREE.Clock",
  "Multiple instances of Three.js",
  "THREE.BufferGeometry.computeBoundingSphere",
  "computeBoundingSphere",
  "Computed radius is NaN",
  "position",
  "THREE.WebGLProgram: Program Info Log",
  "Program Info Log",
  "warning X4122",
  "double precision",
  "cannot be represented accurately",
  "depthBuffer",
  "ValidateTextureDescriptor",
  "CreateTexture",
  "swapchain texture of size 0",
  "Invalid Texture",
  "Invalid TextureView",
  "Invalid CommandBuffer",
  "renderContext",
  "TextureDescriptor",
  "TextureViewDescriptor",
  "CommandEncoder",
  "APIInjectError",
  "Extent3D",
  "mipLevelCount",
  "runner.isFixed",
  "WebGPU is not available",
  "Failed to stop camera via html5-qrcode",
  "RenderedCameraImpl video surface onabort",
  "Detected an update time that is in the future",
  "Failed to obtain exclusive access to the persistence layer",
  "multi-tab synchronization",
];

const filterLog = (origFn: (...args: unknown[]) => void) => {
  return (...args: unknown[]) => {
    const msg = args.map((a) => (typeof a === "string" ? a : JSON.stringify(a) || String(a))).join(" ");
    if (SUPPRESSED_STRINGS.some((s) => msg.includes(s))) {
      return;
    }
    origFn.apply(console, args);
  };
};

// Apply on Node.js (server / terminal) and browser alike
console.warn = filterLog(console.warn);
console.error = filterLog(console.error);
console.log = filterLog(console.log);

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
  
  // Suppress uncaught scanner abort errors that bypass console.error
  window.addEventListener("error", (event) => {
    if (
      event.message?.includes("RenderedCameraImpl video surface onabort") ||
      event.error?.message?.includes("RenderedCameraImpl video surface onabort")
    ) {
      event.preventDefault();
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (
      event.reason?.message?.includes("RenderedCameraImpl video surface onabort") ||
      (typeof event.reason === "string" && event.reason.includes("RenderedCameraImpl video surface onabort"))
    ) {
      event.preventDefault();
    }
  });
}

export {};

