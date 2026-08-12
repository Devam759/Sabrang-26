import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Event Schedule – Sabrang 2026",
  description:
    "Complete 3-day timeline and event schedule for Sabrang 2026 at JK Lakshmipat University. Track workshops, prelims, finals, and pro-shows.",
  keywords: [
    "Sabrang 2026 Schedule",
    "Sabrang Event Timeline",
    "Sabrang Day 1 Schedule",
    "Sabrang Day 2 Schedule",
    "Sabrang Day 3 Schedule",
    "JKLU Fest Dates",
  ],
  alternates: { canonical: "https://sabrang.jklu.edu.in/schedule" },
  openGraph: {
    title: "Event Schedule – Sabrang 2026",
    description: "Complete 3-day event timeline for Sabrang 2026 at JKLU.",
    url: "https://sabrang.jklu.edu.in/schedule",
  },
};

const scheduleSchema = {
  "@context": "https://schema.org",
  "@type": "Schedule",
  name: "Sabrang 2026 Event Schedule",
  description:
    "Official 3-day event timeline for Sabrang 2026 at JK Lakshmipat University.",
  startDate: "2026-11-06",
  endDate: "2026-11-08",
};

export default function SchedulePage() {
  const schedule = {
    "Day 1 - November 6, 2026": [
      {
        time: "9:00 AM",
        event: "Opening Ceremony",
        venue: "Main Stage",
        type: "Ceremony",
      },
      {
        time: "11:00 AM",
        event: "Technical Hackathon Begins",
        venue: "Computer Lab",
        type: "Technical",
      },
      {
        time: "2:00 PM",
        event: "Step Up - Solo Dance",
        venue: "Auditorium",
        type: "Cultural",
      },
      {
        time: "4:00 PM",
        event: "Robotics Competition",
        venue: "Engineering Block",
        type: "Technical",
      },
      {
        time: "6:00 PM",
        event: "Panache - Rampwalk (Prelims)",
        venue: "Main Stage",
        type: "Flagship",
      },
      {
        time: "8:00 PM",
        event: "DJ Night",
        venue: "OAT",
        type: "Entertainment",
      },
    ],
    "Day 2 - November 7, 2026": [
      {
        time: "10:00 AM",
        event: "Business Quiz",
        venue: "Seminar Hall",
        type: "Management",
      },
      {
        time: "11:00 AM",
        event: "Gunj - Vocal Solo",
        venue: "Seminar Hall",
        type: "Cultural",
      },
      {
        time: "2:00 PM",
        event: "E-Sports Tournament Begins",
        venue: "Computer Lab 1",
        type: "E-Sports",
      },
      {
        time: "3:00 PM",
        event: "Debate Competition",
        venue: "Lecture Hall",
        type: "Literary",
      },
      {
        time: "5:00 PM",
        event: "Bandjam - Battle of Bands",
        venue: "OAT",
        type: "Flagship",
      },
      {
        time: "7:00 PM",
        event: "Stand-up Comedy Show",
        venue: "Main Stage",
        type: "Entertainment",
      },
    ],
    "Day 3 - November 8, 2026": [
      {
        time: "9:00 AM",
        event: "Art Exhibition",
        venue: "Gallery",
        type: "Cultural",
      },
      {
        time: "10:00 AM",
        event: "E-Sports Finals",
        venue: "Computer Lab 1",
        type: "E-Sports",
      },
      {
        time: "12:00 PM",
        event: "Panache - Rampwalk (Finals)",
        venue: "Main Stage",
        type: "Flagship",
      },
      {
        time: "3:00 PM",
        event: "Prize Distribution",
        venue: "Main Stage",
        type: "Ceremony",
      },
      {
        time: "5:00 PM",
        event: "Closing Ceremony",
        venue: "Main Stage",
        type: "Ceremony",
      },
      {
        time: "7:00 PM",
        event: "Pro-Show Concert",
        venue: "Main Stage",
        type: "Entertainment",
      },
    ],
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      Flagship: "bg-purple-900/60 text-purple-300 border border-purple-500/30",
      Cultural: "bg-blue-900/60 text-blue-300 border border-blue-500/30",
      Technical:
        "bg-emerald-900/60 text-emerald-300 border border-emerald-500/30",
      "E-Sports": "bg-rose-900/60 text-rose-300 border border-rose-500/30",
      Management: "bg-amber-900/60 text-amber-300 border border-amber-500/30",
      Literary: "bg-indigo-900/60 text-indigo-300 border border-indigo-500/30",
      Ceremony: "bg-slate-800/80 text-slate-300 border border-slate-600/30",
      Entertainment: "bg-pink-900/60 text-pink-300 border border-pink-500/30",
    };
    return colors[type] || "bg-gray-800 text-gray-300";
  };

  return (
    <>
      <JsonLd data={scheduleSchema} />
      <div className="max-w-6xl mx-auto space-y-12 py-10 px-4">
        {/* Hero */}
        <section className="text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight uppercase">
            Event Schedule
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-3xl mx-auto">
            Three days of non-stop innovation, culture, and high-energy
            pro-shows.
          </p>
          <div className="inline-flex items-center gap-2 bg-purple-950/60 border border-purple-500/30 text-purple-300 px-6 py-3 rounded-full font-bold">
            <span>📅</span>
            <span>November 6-8, 2026</span>
          </div>
        </section>

        {/* Schedule */}
        {Object.entries(schedule).map(([day, events]) => (
          <section key={day} className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight border-l-4 border-purple-500 pl-4">
              {day}
            </h2>
            <div className="bg-neutral-900/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
              <div className="divide-y divide-white/10">
                {events.map((item, index) => (
                  <div
                    key={index}
                    className="p-6 hover:bg-white/5 transition-colors grid grid-cols-1 md:grid-cols-4 gap-4 items-center"
                  >
                    <div className="font-bold text-white text-lg">
                      {item.time}
                    </div>
                    <div className="md:col-span-2">
                      <div className="font-bold text-white text-lg">
                        {item.event}
                      </div>
                      <div className="text-sm text-white/60 flex items-center gap-1 mt-1">
                        <span>📍</span>
                        <span>{item.venue}</span>
                      </div>
                    </div>
                    <div className="text-left md:text-right">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getTypeColor(item.type)}`}
                      >
                        {item.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}

        {/* Note */}
        <section className="bg-purple-950/40 border border-purple-500/30 p-6 rounded-3xl">
          <div className="flex items-start gap-4">
            <div className="text-2xl">⚠️</div>
            <div>
              <h3 className="font-bold text-white mb-2">Important Notes</h3>
              <ul className="text-sm text-white/70 space-y-1 list-disc list-inside">
                <li>
                  Schedule is subject to minor adjustments. Please check for
                  updates regularly.
                </li>
                <li>
                  Participants must report 30 minutes before their event slot.
                </li>
                <li>
                  Venue notifications will be communicated via official
                  announcements.
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
