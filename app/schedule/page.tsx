import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import ScheduleClient from "./ScheduleClient";

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
  const schedule = {
    "Day 1 - October 23, 2026": [
      {
        time: "9:00 AM",
        event: "Opening Ceremony",
        venue: "Main Stage",
        type: "Ceremony",
        image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060206/sabrang-2026/events_posters/focus.webp",
      },
      {
        time: "11:00 AM",
        event: "Technical Hackathon Begins",
        venue: "Computer Lab",
        type: "Technical",
        image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060196/sabrang-2026/events_posters/clay.webp",
      },
      {
        time: "2:00 PM",
        event: "Step Up - Solo Dance",
        venue: "Auditorium",
        type: "Cultural",
        image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060210/sabrang-2026/events_posters/STEPUP.webp",
      },
      {
        time: "4:00 PM",
        event: "Robotics Competition",
        venue: "Engineering Block",
        type: "Technical",
        image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060197/sabrang-2026/events_posters/convo.webp",
      },
      {
        time: "6:00 PM",
        event: "Panache - Rampwalk (Prelims)",
        venue: "Main Stage",
        type: "Flagship",
        image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060209/sabrang-2026/events_posters/PANACHE.webp",
      },
      {
        time: "8:00 PM",
        event: "DJ Night",
        venue: "OAT",
        type: "Entertainment",
        image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060202/sabrang-2026/events_posters/DANCE_BATTLE.webp",
      },
    ],
    "Day 2 - October 24, 2026": [
      {
        time: "10:00 AM",
        event: "Business Quiz",
        venue: "Seminar Hall",
        type: "Management",
        image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060203/sabrang-2026/events_posters/deal.webp",
      },
      {
        time: "11:00 AM",
        event: "Gunj - Vocal Solo",
        venue: "Seminar Hall",
        type: "Cultural",
        image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060214/sabrang-2026/events_posters/VERSVAAD.webp",
      },
      {
        time: "2:00 PM",
        event: "E-Sports Tournament Begins",
        venue: "Computer Lab 1",
        type: "E-Sports",
        image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060195/sabrang-2026/events_posters/bgmi.webp",
      },
      {
        time: "3:00 PM",
        event: "Debate Competition",
        venue: "Lecture Hall",
        type: "Literary",
        image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060199/sabrang-2026/events_posters/courtroom.webp",
      },
      {
        time: "5:00 PM",
        event: "Bandjam - Battle of Bands",
        venue: "OAT",
        type: "Flagship",
        image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060194/sabrang-2026/events_posters/BANDJAM.webp",
      },
      {
        time: "7:00 PM",
        event: "Stand-up Comedy Show",
        venue: "Main Stage",
        type: "Entertainment",
        image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060204/sabrang-2026/events_posters/dumb.webp",
      },
    ],
    "Day 3 - October 25, 2026": [
      {
        time: "9:00 AM",
        event: "Art Exhibition",
        venue: "Gallery",
        type: "Cultural",
        image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060193/sabrang-2026/events_posters/art.webp",
      },
      {
        time: "10:00 AM",
        event: "E-Sports Finals",
        venue: "Computer Lab 1",
        type: "E-Sports",
        image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060212/sabrang-2026/events_posters/valo.webp",
      },
      {
        time: "12:00 PM",
        event: "Panache - Rampwalk (Finals)",
        venue: "Main Stage",
        type: "Flagship",
        image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060209/sabrang-2026/events_posters/PANACHE.webp",
      },
      {
        time: "3:00 PM",
        event: "Prize Distribution",
        venue: "Main Stage",
        type: "Ceremony",
        image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060215/sabrang-2026/events_posters/wicket.webp",
      },
      {
        time: "5:00 PM",
        event: "Closing Ceremony",
        venue: "Main Stage",
        type: "Ceremony",
        image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060205/sabrang-2026/events_posters/echoesofnoor.webp",
      },
      {
        time: "7:00 PM",
        event: "Pro-Show Concert",
        venue: "Main Stage",
        type: "Entertainment",
        image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060208/sabrang-2026/events_posters/freefire.webp",
      },
    ],
  };

  return (
    <>
      <JsonLd data={scheduleSchema} />
      <JsonLd data={breadcrumbSchema} />
      <main className="schedule-section-bg min-h-screen pt-24 md:pt-32 pb-24 md:pb-32 overflow-x-clip">
        {/* Hero */}
        <section className="text-center px-4 mb-16 md:mb-24">
          <h1 className="text-[clamp(48px,8vw,110px)] font-black tracking-[-0.04em] uppercase leading-none mb-4 text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-purple-500 drop-shadow-[0_0_30px_rgba(168,85,247,0.3)]">
            Schedule
          </h1>
          <p className="text-sm md:text-lg text-white/60 font-bold tracking-[0.2em] uppercase">
            Three days. One unforgettable experience.
          </p>
        </section>

        {/* Schedule Tabs */}
        <ScheduleClient schedule={schedule} />

        {/* Note */}
        <section className="max-w-3xl mx-auto mt-24 px-4">
          <div className="border-t border-white/10 pt-8">
            <h3 className="text-xs tracking-[0.2em] font-bold text-white/40 uppercase mb-8">
              Important Notes
            </h3>
            <div className="space-y-6 text-sm md:text-base text-white/70">
              <div className="flex items-start gap-4">
                <span className="font-mono text-white/30 text-xs mt-1">01</span>
                <p>Schedule may be subject to minor adjustments. Please check for updates regularly.</p>
              </div>
              <div className="w-full h-px bg-white/5" />
              <div className="flex items-start gap-4">
                <span className="font-mono text-white/30 text-xs mt-1">02</span>
                <p>Participants must report 30 minutes before their event slot.</p>
              </div>
              <div className="w-full h-px bg-white/5" />
              <div className="flex items-start gap-4">
                <span className="font-mono text-white/30 text-xs mt-1">03</span>
                <p>Venue notifications will be communicated via official announcements.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
