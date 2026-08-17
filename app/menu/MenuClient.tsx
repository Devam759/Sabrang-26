"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { NAV_PROJECTS } from "@/components/FilmStripCarousel/projects";
import type { Project } from "@/components/FilmStripCarousel/types";

// Same lazy boundary Navbar uses — keeps three.js out of the /menu entry bundle.
const FilmStripCarousel = dynamic(
  () => import("@/components/FilmStripCarousel/FilmStripCarousel"),
  { ssr: false }
);

export default function MenuClient() {
  const router = useRouter();
  const [navLoading, setNavLoading] = useState(false);

  const handleProjectSelect = (project: Project) => {
    setNavLoading(true);
    router.push(project.href);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <FilmStripCarousel
        projects={NAV_PROJECTS}
        loading={navLoading}
        onProjectSelect={handleProjectSelect}
      />
    </div>
  );
}
