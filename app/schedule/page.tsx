import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import FuturisticSchedule, { ScheduleData } from "@/components/schedule/FuturisticSchedule";

export const metadata: Metadata = {
  title: "Event Schedule | Sabrang 2026",
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
    title: "Event Schedule | Sabrang 2026",
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
        { time: "9:30 AM", event: "Inaugural", venue: "Admin", category: "Mandatory", description: "9:30 AM - 11:00 AM" },
        { time: "11:30 AM", event: "Echoes of Noor", venue: "Main Stage", category: "Fun", description: "11:30 AM - 1:30 PM" },
        { time: "2:00 PM", event: "Personna", venue: "Main Stage", category: "Competition", description: "2:00 PM - 4:00 PM" },
        { time: "2:00 PM", event: "Court Room", venue: "IM Amphitheater", category: "Competition", description: "2:00 PM - 4:00 PM" },
        { time: "2:00 PM", event: "Dumb Show", venue: "IET Amphitheater", category: "Fun", description: "2:00 PM - 4:00 PM" },
        { time: "5:00 PM", event: "Panache", venue: "Main Stage", category: "Competition", description: "5:00 PM - 7:00 PM" },
        { time: "TBD", event: "E-Sports", venue: "IM & IET Rooms", category: "Competition", description: "Alternatively" },
      ]
    },
    {
      label: "DAY TWO",
      date: "24 OCT 2026",
      events: [
        { time: "11:00 AM", event: "Step Up", venue: "Main Stage", category: "Competition", description: "11:00 AM - 1:00 PM" },
        { time: "11:30 AM", event: "Anime Quiz", venue: "IET Amphitheater", category: "Competition", description: "11:30 AM - 2:00 PM" },
        { time: "12:00 PM", event: "Rangmanch", venue: "LRC Stairs", category: "Competition", description: "12:00 PM - 2:00 PM" },
        { time: "12:00 PM", event: "BBW", venue: "IM Amphitheater", category: "Fun", description: "12:00 PM - 5:00 PM" },
        { time: "2:00 PM", event: "Band Jam", venue: "Main Stage", category: "Competition", description: "2:00 PM - 4:00 PM" },
        { time: "2:30 PM", event: "Vaadvivad", venue: "IET Amphitheater", category: "Competition", description: "2:30 PM - 5:00 PM" },
        { time: "5:00 PM", event: "Sync", venue: "Main Stage", category: "Competition", description: "5:00 PM - 7:00 PM" },
        { time: "TBD", event: "Clay Modelling", venue: "Not specified", category: "Fun", description: "Timing not specified" },
      ]
    },
    {
      label: "DAY THREE",
      date: "25 OCT 2026",
      events: [
        { time: "11:00 AM", event: "Versevaad", venue: "Main Stage", category: "Competition", description: "11:00 AM - 2:00 PM" },
        { time: "11:00 AM", event: "Face Off", venue: "IET Lobby", category: "Competition", description: "11:00 AM - 4:30 PM" },
      ]
    }
  ];

  return (
    <>

      <JsonLd data={scheduleSchema} />
      <JsonLd data={breadcrumbSchema} />
      <FuturisticSchedule schedule={schedule} />
    </>
  );
}
