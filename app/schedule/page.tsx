import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import FuturisticSchedule, { ScheduleData } from "@/components/schedule/FuturisticSchedule";

export const metadata: Metadata = {
  title: "Event Schedule – Sabrang 2026",
  description:
    "Complete 3-day timeline and event schedule for Sabrang 2026 at JK Lakshmipat University. Track workshops, prelims, finals, and pro-shows from October 23 to 25, 2026.",
  keywords: [
    "Sabrang 2026 Schedule",
    "Sabrang Event Timeline",
    "Sabrang Day 1 Schedule",
    "Sabrang Day 2 Schedule",
    "Sabrang Day 3 Schedule",
    "JKLU Fest Dates",
    "Sabrang October 2026 Dates",
  ],
  alternates: { canonical: "https://sabrang.jklu.edu.in/schedule" },
  openGraph: {
    title: "Event Schedule – Sabrang 2026",
    description: "Complete 3-day event timeline for Sabrang 2026 at JKLU (Oct 23-25, 2026).",
    url: "https://sabrang.jklu.edu.in/schedule",
    siteName: "Sabrang 2026 - JKLU",
    type: "website",
  },
};

const scheduleSchema = {
  "@context": "https://schema.org",
  "@type": "Schedule",
  name: "Sabrang 2026 Event Schedule",
  description:
    "Official 3-day event timeline for Sabrang 2026 at JK Lakshmipat University.",
  startDate: "2026-10-23",
  endDate: "2026-10-25",
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://sabrang.jklu.edu.in",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Schedule",
      item: "https://sabrang.jklu.edu.in/schedule",
    },
  ],
};

export default function SchedulePage() {
  const schedule: ScheduleData = [
    {
      label: "DAY ONE",
      date: "23 OCT 2026",
      events: [
        { time: "09:00 AM", event: "Opening Ceremony", venue: "Main Stage", category: "Mandatory", description: "The official opening ceremony of SABRANG 26. Join the lighting of the lamp and the commencement address." },
        { time: "11:00 AM", event: "Technical Hackathon Begins", venue: "Computer Lab", category: "Mandatory", description: "A 48-hour intense coding competition. Build innovative solutions for real-world problems." },
        { time: "02:00 PM", event: "Step Up - Solo Dance", venue: "Auditorium", category: "Fun", description: "Watch participants battle it out on the dance floor in our premier solo dance competition." },
        { time: "04:00 PM", event: "Robotics Competition", venue: "Engineering Block", category: "Competition", description: "Line followers, robo-wars, and autonomous robots navigating complex arenas." },
        { time: "06:00 PM", event: "Panache - Rampwalk (Prelims)", venue: "Main Stage", category: "Competition", description: "The first round of our flagship fashion event. Witness incredible designs and runway presence." },
        { time: "08:00 PM", event: "DJ Night", venue: "OAT", category: "Fun", description: "End day one with high-energy electronic music and a spectacular light show at the Open Air Theatre." },
      ]
    },
    {
      label: "DAY TWO",
      date: "24 OCT 2026",
      events: [
        { time: "10:00 AM", event: "Business Quiz", venue: "Seminar Hall", category: "Competition", description: "Test your knowledge of the corporate world, startups, and global economics." },
        { time: "11:00 AM", event: "Gunj - Vocal Solo", venue: "Seminar Hall", category: "Competition", description: "A showcase of raw vocal talent across various genres of music." },
        { time: "02:00 PM", event: "E-Sports Tournament Begins", venue: "Computer Lab 1", category: "Competition", description: "Intense competitive gaming featuring BGMI, Valorant, and FIFA." },
        { time: "03:00 PM", event: "Debate Competition", venue: "Lecture Hall", category: "Competition", description: "Fierce intellectual battles on pressing contemporary issues." },
        { time: "05:00 PM", event: "Bandjam - Battle of Bands", venue: "OAT", category: "Competition", description: "The ultimate showdown of college bands competing for the title." },
        { time: "07:00 PM", event: "Stand-up Comedy Show", venue: "Main Stage", category: "Fun", description: "A night of laughter featuring a surprise celebrity stand-up comedian." },
      ]
    },
    {
      label: "DAY THREE",
      date: "25 OCT 2026",
      events: [
        { time: "09:00 AM", event: "Art Exhibition", venue: "Gallery", category: "Fun", description: "A curated exhibition of visual arts, photography, and digital installations by students." },
        { time: "10:00 AM", event: "E-Sports Finals", venue: "Computer Lab 1", category: "Competition", description: "The thrilling conclusion to the E-Sports tournament." },
        { time: "12:00 PM", event: "Panache - Rampwalk (Finals)", venue: "Main Stage", category: "Competition", description: "The grand finale of the fashion showcase featuring the best designers and models." },
        { time: "03:00 PM", event: "Prize Distribution", venue: "Main Stage", category: "Mandatory", description: "Celebrating the winners of Sabrang 26 across all technical and cultural events." },
        { time: "05:00 PM", event: "Closing Ceremony", venue: "Main Stage", category: "Mandatory", description: "The official conclusion of the festival." },
        { time: "07:00 PM", event: "Pro-Show Concert", venue: "Main Stage", category: "Fun", description: "The ultimate finale: a live concert by a renowned artist to close Sabrang 26." },
      ]
    }
  ];

  return (
    <>
      <style>{`
        /* Hide the global navbar so our custom futuristic header takes precedence */
        nav.fixed.top-0.left-0.right-0.z-50 {
          display: none !important;
        }
      `}</style>
      <JsonLd data={scheduleSchema} />
      <JsonLd data={breadcrumbSchema} />
      <FuturisticSchedule schedule={schedule} />
    </>
  );
}
