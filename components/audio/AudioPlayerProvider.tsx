"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const ANTHEM_URL =
  "https://res.cloudinary.com/eftrvjpx/video/upload/q_auto/v1787514086/sabrang-2026/audio/Sabrang_Anthem___ElevenLabs_Music_3.mp4";

interface AudioPlayerContextType {
  isPlaying: boolean;
  isMuted: boolean;
  toggleMusic: () => void;
  playMusic: () => void;
  pauseMusic: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType>({
  isPlaying: false,
  isMuted: false,
  toggleMusic: () => {},
  playMusic: () => {},
  pauseMusic: () => {},
});

export const useAudioPlayer = () => useContext(AudioPlayerContext);

const EXCLUDED_PREFIXES = ["/admin", "/login", "/scanner", "/volunteer", "/warden"];

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Default is ON as requested
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [userDisabled, setUserDisabled] = useState<boolean>(false);
  const isExcludedRoute = EXCLUDED_PREFIXES.some((prefix) => pathname?.startsWith(prefix));

  // Initialize Audio instance once
  useEffect(() => {
    if (typeof window === "undefined") return;

    const audio = new Audio(ANTHEM_URL);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0.05; // soft, non-intrusive ambient background level
    audioRef.current = audio;

    // Try starting playback if on public page
    const tryAutoplay = async () => {
      if (isExcludedRoute || userDisabled) return;
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        // Browser prevented autoplay without gesture - start on very first interaction
        const handleFirstInteraction = async () => {
          if (!userDisabled && !isExcludedRoute && audioRef.current) {
            try {
              await audioRef.current.play();
              setIsPlaying(true);
            } catch {
              // Ignore
            }
          }
          window.removeEventListener("pointerdown", handleFirstInteraction);
          window.removeEventListener("keydown", handleFirstInteraction);
          window.removeEventListener("touchstart", handleFirstInteraction);
        };

        window.addEventListener("pointerdown", handleFirstInteraction, { once: true });
        window.addEventListener("keydown", handleFirstInteraction, { once: true });
        window.addEventListener("touchstart", handleFirstInteraction, { once: true });
      }
    };

    tryAutoplay();

    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle route changes (exclude management pages)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isExcludedRoute) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (!userDisabled) {
        audio.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  }, [pathname, isExcludedRoute, userDisabled]);

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio || isExcludedRoute) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      setUserDisabled(true);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
        setUserDisabled(false);
      }).catch(() => {});
    }
  };

  const playMusic = () => {
    const audio = audioRef.current;
    if (!audio || isExcludedRoute) return;
    audio.play().then(() => {
      setIsPlaying(true);
      setUserDisabled(false);
    }).catch(() => {});
  };

  const pauseMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setIsPlaying(false);
    setUserDisabled(true);
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        isPlaying: isPlaying && !isExcludedRoute,
        isMuted: !isPlaying || isExcludedRoute,
        toggleMusic,
        playMusic,
        pauseMusic,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}
