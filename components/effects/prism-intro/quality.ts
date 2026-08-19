export type QualityTier = 'ULTRA' | 'HIGH' | 'MOBILE';

export function getQualityTier(): QualityTier {
  if (typeof window === 'undefined') return 'HIGH';
  const isMobile = window.innerWidth <= 768;
  if (isMobile) return 'MOBILE';
  
  // Basic heuristic for GPU/CPU power
  const cores = navigator.hardwareConcurrency || 4;
  return cores >= 8 ? 'ULTRA' : 'HIGH';
}

export const getTransmissionSettings = (tier: QualityTier) => {
  switch (tier) {
    case 'ULTRA': 
      return { resolution: 256, samples: 4, thickness: 2.5, chromaticAberration: 0.08 };
    case 'HIGH': 
      return { resolution: 128, samples: 3, thickness: 2.0, chromaticAberration: 0.06 };
    case 'MOBILE': 
      return { resolution: 64, samples: 2, thickness: 1.5, chromaticAberration: 0.04 };
  }
}

export const getParticleSettings = (tier: QualityTier) => {
  switch (tier) {
    case 'ULTRA': return { count: 8000, size: 2.0 };
    case 'HIGH': return { count: 4000, size: 2.5 };
    case 'MOBILE': return { count: 1500, size: 3.5 };
  }
}
