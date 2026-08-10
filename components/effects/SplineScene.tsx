'use client';

import Dynamic from 'next/dynamic';
import { useEffect } from 'react';

const Spline = Dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-transparent">
      <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
    </div>
  ),
});

interface SplineSceneProps {
  scene?: string;
  className?: string;
}

export default function SplineScene({
  scene = '/scene.splinecode',
  className = 'w-full h-full',
}: SplineSceneProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const muteAllMedia = () => {
      document.querySelectorAll('audio, video').forEach((el) => {
        (el as HTMLMediaElement).muted = true;
        (el as HTMLMediaElement).volume = 0;
      });
    };

    muteAllMedia();
    const interval = setInterval(muteAllMedia, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLoad = (splineApp: any) => {
    try {
      if (splineApp) {
        if (typeof splineApp.setAudioVolume === 'function') splineApp.setAudioVolume(0);
        if (typeof splineApp.setVolume === 'function') splineApp.setVolume(0);
        if (typeof splineApp.setMuted === 'function') splineApp.setMuted(true);
        if (splineApp.audio) splineApp.audio.muted = true;
      }
    } catch (e) {
      // Ignore audio mute errors
    }
  };

  return (
    <div className={`relative pointer-events-none w-full h-full ${className}`}>
      <Spline
        scene={scene}
        onLoad={handleLoad}
        className="w-full h-full pointer-events-none"
      />
    </div>
  );
}
