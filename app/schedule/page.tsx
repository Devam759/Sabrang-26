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
        {
          time: "9:30 AM",
          timing: "9:30 AM - 11:00 AM",
          event: "Inaugural",
          venue: "Admin",
          category: "Mandatory",
          description:
            "The official opening ceremony of Sabrang, welcoming participants and setting the tone for the festival.",
        },
        {
          time: "11:00 AM",
          timing: "11:00 AM - 5:00 PM",
          event: "E-Sports",
          venue: "IM & IET Rooms",
          category: "Competition",
          description:
            "Competitive gaming sessions held across designated IM & IET rooms.",
        },
        {
          time: "11:30 AM",
          timing: "11:30 AM - 1:00 PM",
          event: "Persona",
          venue: "Main Stage",
          category: "Competition",
          description:
            "A solo ramp walk event where participants showcase their style, confidence, personality, and stage presence.",
        },

        {
          time: "2:00 PM",
          timing: "2:00 PM - 4:00 PM",
          event: "Echoes of Noor",
          venue: "Main Stage",
          category: "Competition",
          description:
            "A cultural performance event celebrating music, expression and creativity through engaging performances.",
        },

        {
          time: "2:00 PM",
          timing: "2:00 PM - 4:00 PM",
          event: "Dumb Show",
          venue: "IET Amphitheater",
          category: "Fun",
          description:
            "A fun acting challenge where teams communicate words, situations or ideas through gestures without speaking.",
        },
        {
          time: "5:00 PM",
          timing: "5:00 PM - 7:00 PM",
          event: "Panache",
          venue: "Main Stage",
          category: "Competition",
          description:
            "A flagship stage event highlighting confidence, style, creativity and captivating performances.",
        },
        {
          time: "7:30 PM",
          timing: "7:30 PM onwards",
          event: "Pro-Nite – DJ Bassworm",
          venue: "Main Stage",
          category: "Pro-Nite",
          description:
            "An evening entertainment segment featuring live music and/or DJ performances to close the day's celebrations.",
        },
      ],
    },
    {
      label: "DAY TWO",
      date: "24 OCT 2026",
      events: [
        {
          time: "11:00 AM",
          timing: "11:00 AM - 1:00 PM",
          event: "Step Up",
          venue: "Main Stage",
          category: "Competition",
          description:
            "A dance-focused event where participants bring energy, choreography and creativity to the stage.",
        },
        {
          time: "11:00 AM",
          timing: "11:00 AM - 2:00 PM",
          event: "Court Room",
          venue: "IM Amphitheater",
          category: "Competition",
          description:
            "A courtroom-style event where participants present arguments, think critically and respond to challenges.",
        },
        {
          time: "11:00 AM",
          timing: "11:00 AM - 5:00 PM",
          event: "E-Sports",
          venue: "IM & IET Rooms",
          category: "Competition",
          description:
            "Competitive gaming sessions held across designated IM & IET rooms.",
        },
        {
          time: "1:00 PM",
          timing: "1:00 PM - 3:00 PM",
          event: "Anime Quiz",
          venue: "IET Class",
          category: "Fun",
          description:
            "A quiz for anime enthusiasts covering characters, stories, worlds and memorable moments from anime.",
        },
        {
          time: "2:00 PM",
          timing: "2:00 PM - 4:00 PM",
          event: "Band Jam",
          venue: "Main Stage",
          category: "Competition",
          description:
            "A live music competition where bands perform together and showcase musical talent and stage chemistry.",
        },
        {
          time: "5:00 PM",
          timing: "5:00 PM - 7:00 PM",
          event: "Sync",
          venue: "Main Stage",
          category: "Competition",
          description:
            "A performance event focused on coordination, rhythm and teamwork, with participants aiming for perfect synchronization.",
        },
        {
          time: "7:30 PM",
          timing: "7:30 PM onwards",
          event: "Pro-Nite — DJ Suit Up",
          venue: "Main Stage",
          category: "Pro-Nite",
          description:
            "An energetic DJ night filled with music, beats, and entertainment.",
        },
      ],
    },
    {
      label: "DAY THREE",
      date: "25 OCT 2026",
      events: [
        {
          time: "10:00 AM",
          timing: "10:00 AM - 3:00 PM",
          event: "Face Off",
          venue: "IET Lobby",
          category: "Competition",
          description:
            "A competitive face-to-face event where participants showcase skill, confidence and quick thinking.",
        },
        {
          time: "11:00 AM",
          timing: "11:00 AM - 1:00 PM",
          event: "Versevaad",
          venue: "Main Stage",
          category: "Competition",
          description:
            "A literary and expressive event that gives participants a platform to present ideas through words and performance.",
        },
        {
          time: "11:00 AM",
          timing: "11:00 AM - 2:00 PM",
          event: "Vaad-Vivaad",
          venue: "IET Amphitheater",
          category: "Competition",
          description:
            "A debate and discussion event where participants present viewpoints, build arguments and respond confidently.",
        },
        {
          time: "11:00 AM",
          timing: "11:00 AM - 5:00 PM",
          event: "E-Sports",
          venue: "IM & IET Rooms",
          category: "Competition",
          description:
            "Competitive gaming sessions held across designated IM & IET rooms.",
        },
        {
          time: "4:00 PM",
          timing: "4:00 PM - 6:30 PM",
          event: "Valedictory",
          venue: "Main Stage",
          category: "Mandatory",
          description:
            "The closing ceremony celebrating the participants, performances and successful completion of Sabrang.",
        },
        {
          time: "7:30 PM",
          timing: "7:30 PM onwards",
          event: "Pro-Nite- VARUN JAIN LIVE",
          venue: "Main Stage",
          category: "Pro-Nite",
          description:
            "An evening entertainment segment featuring music and DJ performances to conclude the festival.",
        },
      ],
    },
  ];

  return (
    <>

      <JsonLd data={scheduleSchema} />
      <JsonLd data={breadcrumbSchema} />
      <FuturisticSchedule schedule={schedule} />
    </>
  );
}
