export const beamVert = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const beamFrag = `
  uniform float uOpacity;
  uniform float uLength;
  varying vec2 vUv;

  void main() {
    // Soft cylindrical falloff vertically
    float dist = abs(vUv.y - 0.5) * 2.0;
    float intensity = smoothstep(1.0, 0.0, dist);
    
    // Core is brighter, edges are soft
    float core = smoothstep(0.4, 0.0, dist) * 2.0;
    intensity += core;

    // Fade based on uLength (traveling beam)
    // uLength = 0 -> far left. uLength = 1 -> touching prism.
    float head = smoothstep(uLength + 0.1, uLength, vUv.x);
    float tail = smoothstep(uLength - 1.0, uLength - 0.2, vUv.x);
    
    float alpha = intensity * head * tail * uOpacity;
    
    vec3 color = vec3(1.0); // Pure white core
    
    gl_FragColor = vec4(color, alpha);
  }
`;

export const ribbonVert = `
  uniform float uTime;
  uniform float uSpread;
  attribute float ribbonOffset;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    
    vec3 pos = position;
    
    // Slight organic movement
    float wave = sin(pos.x * 2.0 - uTime * 2.0) * 0.05 * vUv.x;
    pos.z += wave * 0.5;

    // Spread out vertically as we move away from the prism
    // At uv.x = 0 (prism face), the offset must be exactly 0 so they all emerge from one point.
    float curve = sin(uv.x * 3.14159) * 0.5;
    pos.y += ribbonOffset * uSpread * uv.x + (curve * ribbonOffset * 0.2 * uSpread);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const ribbonFrag = `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uLength;
  uniform float uSaturation;
  varying vec2 vUv;

  void main() {
    // Vertical soft edge
    float edge = smoothstep(1.0, 0.0, abs(vUv.y - 0.5) * 2.0);
    float core = smoothstep(0.2, 0.0, abs(vUv.y - 0.5) * 2.0) * 1.5;
    
    // Fade out smoothly over distance
    float tailFade = smoothstep(1.0, 0.0, vUv.x);
    
    // Controlled length shrink (0 to 1)
    float lengthFade = smoothstep(uLength, uLength - 0.2, vUv.x);
    
    float alpha = (edge + core) * tailFade * lengthFade * uOpacity;
    
    // Mix from neutral white to spectral color based on saturation
    vec3 finalColor = mix(vec3(1.0), uColor, uSaturation);
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;
