export const introState = {
  // Prism
  prismRimIntensity: 0,
  prismInternalGlow: 0,
  prismScale: 1.0, // Used to hide the prism entirely
  
  // Incoming Beam
  beamOpacity: 0,
  beamLength: 0, 
  
  // Outgoing Spectrum
  ribbonOpacities: [0, 0, 0, 0, 0, 0, 0],
  spectrumSpread: 0, 
  spectrumLength: 1, 
  ribbonSaturation: 0, // 0 = white, 1 = spectral colors
  
  // Camera choreography
  cameraOrbitY: Math.PI / 4, // Starts at 45 degree angle (X-axis side)
  cameraDistance: 12,
  cameraY: 0,
  
  // Typography Progression
  lightToTextProgress: 0,
  typographyOpacity: 0,
  typographyDisperseProgress: 0.0, // 0 to 1 for disintegration
  typographyWhiteMerge: 0.0, // 0 to 1 for turning white
  
  // Final CSS Logo
  logoOpacity: 0,
  
  // Master completion flag
  isComplete: false,
};
