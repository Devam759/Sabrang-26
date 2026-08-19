"use client";
import React, { useEffect, useState } from 'react';
import gsap from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';
import PrismScene from './PrismScene';
import SabrangTitle from './SabrangTitle';
import { introState } from './IntroTimeline';

export default function PrismIntro() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    // Reset state to cinematic orbit defaults
    introState.prismRimIntensity = 0;
    introState.prismInternalGlow = 0;
    introState.prismScale = 1.0;
    introState.beamOpacity = 0;
    introState.beamLength = 0;
    introState.ribbonOpacities = [0, 0, 0, 0, 0, 0, 0];
    introState.spectrumSpread = 0;
    introState.spectrumLength = 1;
    introState.ribbonSaturation = 1.0; // Start fully colorful
    
    introState.cameraOrbitY = -Math.PI / 3; // -60 deg X-axis side angle (Left side)
    introState.cameraY = 0;
    
    introState.lightToTextProgress = 0;
    introState.typographyWaveProgress = -1.0;
    introState.lightToTextProgress = 0;
    introState.typographyOpacity = 0;
    introState.typographyDisperseProgress = 0;
    introState.typographyWhiteMerge = 0;
    introState.logoOpacity = 0;
    introState.isComplete = false;
    
    const tl = gsap.timeline({
      delay: 0.5, // Allow R3F to compile shaders and render the first frame without lagging the animation
      onComplete: () => {
        introState.isComplete = true;
        setTimeout(() => {
          setIsVisible(false);
          document.body.style.overflow = '';
        }, 1500);
      }
    });

    // Globally slow down the entire animation to make it more cinematic and majestic
    tl.timeScale(0.65);

    // 0.0 - 0.8s: Pure Black (Pause)
    
    // 0.8 - 1.5s: Prism Reveal
    tl.addLabel("prismReveal", 0.8);
    tl.to(introState, { prismRimIntensity: 1.0, duration: 0.7, ease: "power2.inOut" }, "prismReveal");

    // 1.5 - 2.2s: White Beam Arrival
    tl.addLabel("beamArrival", 1.5);
    tl.to(introState, { beamOpacity: 1.0, duration: 0.3, ease: "power1.inOut" }, "beamArrival");
    tl.to(introState, { beamLength: 1.0, duration: 0.7, ease: "power2.out" }, "beamArrival");

    // 2.2 - 3.2s: Beam Enters Prism (Hold at initial angle)
    tl.addLabel("beamImpact", 2.2);
    tl.to(introState, { prismInternalGlow: 1.0, duration: 1.0, ease: "sine.inOut" }, "beamImpact");

    // 3.2 - 5.0s: Camera Orbits Right + 7 Colorful Beams emerge
    tl.addLabel("cameraOrbit", 3.2);
    // Camera swings around to front view [0,0,10]
    // Changed ease to sine.inOut for a much smoother, fluid cinematic pan
    tl.to(introState, { cameraOrbitY: Math.PI / 2, duration: 1.8, ease: "sine.inOut" }, "cameraOrbit");
    
    // As camera moves, 7 beams emerge fully colorful
    tl.to(introState.ribbonOpacities, { 
      '0': 1, '1': 1, '2': 1, '3': 1, '4': 1, '5': 1, '6': 1,
      duration: 0.6, ease: "power2.inOut" 
    }, "cameraOrbit+=0.2");
    tl.to(introState, { spectrumSpread: 0.4, duration: 1.4, ease: "power2.out" }, "cameraOrbit+=0.2");

    // 5.0 - 6.5s: 7 Beams morph into SABRANG 26 (Multicolor)
    tl.addLabel("lightToText", 5.0);
    tl.to(introState, { spectrumLength: 0.0, duration: 0.6, ease: "power2.in" }, "lightToText");
    tl.to(introState, { typographyOpacity: 1.0, duration: 0.1 }, "lightToText");
    tl.to(introState, { lightToTextProgress: 1.0, duration: 1.5, ease: "power3.inOut" }, "lightToText");
    // Completely hide the incoming beam and prism to guarantee the center is totally clean
    tl.to(introState, { beamOpacity: 0.0, prismRimIntensity: 0.0, prismInternalGlow: 0.0, prismScale: 0.0, duration: 1.0, ease: "power2.inOut" }, "lightToText");

    // 6.5 - 7.5s: Hold Multicolor Sabrang '26 clearly
    tl.addLabel("multicolorHold", 6.5);

    // 7.5 - 9.5s: Particle Disintegration (Outward) & White Merge
    tl.addLabel("disintegrate", 7.5);
    // Smoothly dissolve out into a luminous cloud
    tl.to(introState, { typographyDisperseProgress: 1.0, duration: 2.0, ease: "sine.inOut" }, "disintegrate");
    // Transition to pure white while drifting
    tl.to(introState, { typographyWhiteMerge: 1.0, duration: 1.5, ease: "power2.inOut" }, "disintegrate+=0.5");

    // 9.5 - 11.0s: Particle Convergence (Inward / Reverse)
    tl.addLabel("converge", 9.5);
    // Reverse the dispersion back to 0 exactly, pulling particles into the solid white silhouette
    tl.to(introState, { typographyDisperseProgress: 0.0, duration: 1.5, ease: "power3.inOut" }, "converge");

    // 11.0 - 12.0s: Solidification & Handoff
    tl.addLabel("solidify", 11.0);
    // CSS Logo perfectly fades in underneath the identical WebGL silhouette
    tl.to(introState, { logoOpacity: 1.0, duration: 0.8, ease: "power2.inOut" }, "solidify");
    // WebGL particles gracefully fade out
    tl.to(introState, { typographyOpacity: 0.0, duration: 1.0, ease: "power2.inOut" }, "solidify+=0.2");

    // 12.0 - 13.0s: Final Hero Hold
    tl.addLabel("heroHold", 12.0);

    tl.addLabel("complete", 13.0);

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          key="prism-intro"
          className="fixed inset-0 z-[100] bg-[#010101]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        >
          <PrismScene />
          <SabrangTitle />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
