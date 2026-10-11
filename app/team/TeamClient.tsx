"use client";

import { useEffect } from "react";
import WebGLCarousel from "@/components/webgl-carousel/WebGLCarousel";
import { TEAM_MEMBERS, TEAM_IMAGES } from "@/lib/constants";

export default function TeamClient() {
  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.classList.remove("team-scrolled");

    let initialTouchY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      initialTouchY = e.touches[0]?.clientY || 0;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const currentTouchY = e.touches[0]?.clientY || 0;
      const diffY = Math.abs(currentTouchY - initialTouchY);
      if (diffY > 10) {
        document.body.classList.add("team-scrolled");
      }
    };

    const handleWheel = () => {
      document.body.classList.add("team-scrolled");
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("wheel", handleWheel, { passive: true });

    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.classList.remove("team-scrolled");
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);

  function getMemberImage(name: string): string {
    return (
      TEAM_IMAGES[name] ||
      "/sabrang-logo/jklu_logo.png"
    );
  }

  const carouselMembers = TEAM_MEMBERS.map((member) => ({
    image: getMemberImage(member.name),
    name: member.name,
    role: member.role,
    links: member.links,
  }));

  return (
    <div className="fixed inset-0 z-10 w-screen h-screen overflow-hidden bg-black flex items-center justify-center p-0 m-0">
      {/* Full Viewport WebGL 3D Refraction Carousel */}
      <div className="absolute inset-0 z-10 w-screen h-screen px-0 m-0">
        <WebGLCarousel
          items={carouselMembers}
          className="w-full h-full rounded-none"
        />
      </div>
    </div>
  );
}
