"use client";

import { useEffect } from "react";
import WebGLCarousel from "@/components/webgl-carousel/WebGLCarousel";

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

  const teamImages = [
    "/team-carousel/Aditya Nayak.png",
    "/team-carousel/Ambika Dalmia.png",
    "/team-carousel/Aryan.png",
    "/team-carousel/Ashlesha Sharma.png",
    "/team-carousel/Daksh kumar.png",
    "/team-carousel/Devansh Srivastava.png",
    "/team-carousel/Manan.png",
    "/team-carousel/Naman Shukla.png",
    "/team-carousel/Rashi.png",
    "/team-carousel/Roshan jangir.png",
    "/team-carousel/Satvik.png",
  ];

  const rawMembers = [
    // University Leadership & Mentors
    { name: "Anushka Pathak", role: "Faculty Coordinator" },
    { name: "Richa Sharma", role: "Faculty Coordinator" },
    { name: "Vice Chancellor", role: "Vice Chancellor" },

    // Organizing Heads
    { name: "Kartik Sharma", role: "Organizing Head" },
    { name: "Gurseerat Kaur", role: "Organizing Head" },
    { 
      name: "Pratigya Bomb", 
      role: "Organizing Head",
      links: {
        email: "mailto:pratigyabomb@jklu.edu.in",
        linkedin: "https://www.linkedin.com/in/pratigya-bomb-295857349?utm_source=share_via&utm_content=profile&utm_medium=member_ios"
      }
    },
    { name: "Rishika Singh", role: "Organizing Head" },

    // Tech & Support
    { 
      name: "Devam Gupta", 
      role: "Tech & Support Core",
      links: {
        email: "mailto:devamgupta@jklu.edu.in",
        instagram: "https://www.instagram.com/who.is.devam/?hl=en",
        linkedin: "https://www.linkedin.com/in/devam-gupta/",
        github: "https://github.com/Devam759"
      }
    },

    // Core Members
    { name: "Tanik Gupta", role: "Discipline Core" },
    { 
      name: "Saumya Puri", 
      role: "Discipline Core",
      links: {
        email: "mailto:saumyapuri14@gmail.com",
        linkedin: "http://www.linkedin.com/in/saumyapuri14"
      }
    },
    { name: "Aayush", role: "Design Core" },
    { 
      name: "Abhirama Shreyas", 
      role: "Decor Core",
      links: {
        email: "mailto:abhiramakarthikeyasreyastuttagunta@jklu.edu.in",
        instagram: "https://www.instagram.com/abhiram__sreyas?igsh=MWl5M2Rtdm1nM2xneg%3D%3D&utm_source=qr",
        linkedin: "https://www.linkedin.com/in/abhiram-sreyas-a1747238a?utm_source=share_via&utm_content=profile&utm_medium=member_ios"
      }
    },
    { name: "Mahi Tripathi", role: "Decor Core" },
    { name: "Vaibhav Sharma", role: "Media & Report Core" },
    { name: "Kartik Singh", role: "Photography Core" },
    { name: "Roshan Jangir", role: "Photography Core" },
    { name: "Aadhya Mittal", role: "Events Core" },
    { 
      name: "Devansh Srivastava", 
      role: "Events Core",
      links: {
        email: "mailto:devansh@jklu.edu.in",
        linkedin: "https://www.linkedin.com/in/devansh-srivastava-vk18"
      }
    },
    { name: "Jheel Jain", role: "Events Core" },
    { 
      name: "Satvik Agrawal", 
      role: "Internal Arrangements Core",
      links: {
        email: "mailto:satvikagrawal@jklu.edu.in",
        instagram: "https://www.instagram.com/satvik__oo7_/",
        linkedin: "https://www.linkedin.com/in/satvik-agrawal1104/",
        github: "https://github.com/Satvik1131"
      }
    },
    { name: "Asmit Sharma", role: "Internal Arrangements Core" },
    { 
      name: "Kunal Kasliwal", 
      role: "Transport Core",
      links: {
        email: "mailto:kunalkasliwal@jklu.edu.in",
        instagram: "https://www.instagram.com/kunalkasliwal14",
        linkedin: "https://www.linkedin.com/in/kunalkasliwal?utm_source=share_via&utm_content=profile&utm_medium=member_android"
      }
    },
    { 
      name: "Manan Lala", 
      role: "Transport Core",
      links: {
        email: "mailto:mananlala@jklu.edu.in",
        linkedin: "http://www.linkedin.com/in/manan-lala-a3a094320"
      }
    },
    { 
      name: "Aditya Nayak", 
      role: "Social Media Core",
      links: {
        instagram: "https://www.instagram.com/_nayak_1913?igsh=MXBpNHNyNmcyY3lkMw==",
        linkedin: "http://www.linkedin.com/in/adityanayak13",
        github: "https://github.com/AdityaNayak13",
        email: "mailto:adityanayak@jklu.edu.in",
        website: "https://drive.google.com/open?id=1RZ6JawWfvzH8xE54bdaoxrXURElSRibc"
      }
    },
    { 
      name: "Aryan Gupta", 
      role: "Social Media Core",
      links: {
        email: "mailto:aryangupta2024@jklu.edu.in",
        instagram: "https://www.instagram.com/itz_aryan_30",
        linkedin: "https://www.linkedin.com/in/aryan-gupta-30dec2006"
      }
    },
    { 
      name: "Ashlesha Sharma", 
      role: "Prize & Certificates Core",
      links: {
        email: "mailto:ashleshasharma@jklu.edu.in",
        linkedin: "https://www.linkedin.com/in/ashlesha-sharma?utm_source=share_via&utm_content=profile&utm_medium=member_android"
      }
    },
    { 
      name: "Ambika Dalmia", 
      role: "Hospitality Core",
      links: {
        email: "mailto:ambikadalmia@jklu.edu.in",
        linkedin: "https://www.linkedin.com/in/ambika-dalmia-310762247?utm_source=share_via&utm_content=profile&utm_medium=member_ios"
      }
    },
    { 
      name: "Khushi Soni", 
      role: "Hospitality Core",
      links: {
        email: "mailto:khushisoni@jklu.edu.in",
        linkedin: "https://www.linkedin.com/in/khushi-soni--ks0906"
      }
    },
    { 
      name: "Naman Shukla", 
      role: "Stage & Venue Core",
      links: {
        email: "mailto:namanshukla@jklu.edu.in",
        instagram: "https://www.instagram.com/heyyynaman?igsh=MWJtOTdoeW5kM3J4eg%3D%3D&utm_source=qr",
        linkedin: "https://www.linkedin.com/in/naman-shukla-87ba40325?utm_source=share_via&utm_content=profile&utm_medium=member_ios"
      }
    },
    { 
      name: "Diksha Shekhawat", 
      role: "Stage & Venue Core",
      links: {
        email: "mailto:dikshashekhawat@jklu.edu.in",
        linkedin: "https://www.linkedin.com/in/diksha-shekhawat-082643322/"
      }
    },
    { name: "Jayash Gahlot", role: "Registrations Core" },
    { 
      name: "Ankit Joshi", 
      role: "Registrations Core",
      links: {
        email: "mailto:ankitjoshi@jklu.edu.in",
        instagram: "https://www.instagram.com/pandat.02/",
        github: "https://github.com/ankit1439"
      }
    },
    { name: "Gaurang Tak", role: "Sponsorship & Promotions Core" },
    { 
      name: "Daksh Kumar", 
      role: "Anchoring Core",
      links: {
        email: "mailto:dakshkumar@jklu.edu.in",
        instagram: "https://www.instagram.com/dakshkkumar",
        linkedin: "https://www.linkedin.com/in/dakshkkumar",
        github: "https://github.com/dakshkkumar"
      }
    },
    { name: "Laksh Sharma", role: "Anchoring Core" },
  ];

  function getMemberImage(name: string): string {
    const normalized = name.toLowerCase().trim();
    if (normalized.includes("aditya nayak")) return "/team-images/aditya-nayak.webp";
    if (normalized.includes("ambika dalmia")) return "/team-images/ambika-dalmia.webp";
    if (normalized.includes("aryan") || normalized.includes("aryan gupta")) return "/team-images/aryan.webp";
    if (normalized.includes("ashlesha sharma")) return "/team-images/ashlesha-sharma.webp";
    if (normalized.includes("daksh kumar")) return "/team-images/daksh-kumar.webp";
    if (normalized.includes("devam")) return "/team-images/devam.webp";
    if (normalized.includes("devansh")) return "/team-images/devansh.webp";
    if (normalized.includes("diksha")) return "/team-images/diksha.webp";
    if (normalized.includes("gurseerat")) return "/team-images/gurseerat-oh.webp";
    if (normalized.includes("kartik") && normalized.includes("singh")) return "/team-images/kartik-chaudhary.webp";
    if (normalized.includes("khushi")) return "/team-images/khushii.webp";
    if (normalized.includes("kunal")) return "/team-images/kunal.webp";
    if (normalized.includes("manan")) return "/team-images/manan.webp";
    if (normalized.includes("naman shukla")) return "/team-images/naman-shukla.webp";
    if (normalized.includes("rishika")) return "/team-images/rishika-oh.webp";
    if (normalized.includes("roshan")) return "/team-images/roshan-jangir.webp";
    if (normalized.includes("satvik")) return "/team-images/satvik.webp";
    if (normalized.includes("saumya")) return "/team-images/saumya.webp";
    if (normalized.includes("abhiram")) return "/team-images/abhiram.webp";
    if (normalized.includes("ankit")) return "/team-images/ankit.webp";
    if (normalized.includes("asmit")) return "/team-images/asmit.webp";
    if (normalized.includes("laksh")) return "/team-images/laksh.webp";

    // Fallback to JKLU logo for those we don't have photos for
    return "/sabrang-logo/white_jklu_logo.png";
  }

  const carouselMembers = rawMembers.map((member) => ({
    image: getMemberImage(member.name),
    name: member.name,
    role: member.role,
    links: (member as any).links,
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
