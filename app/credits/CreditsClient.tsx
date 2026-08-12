"use client";

export default function CreditsClient() {
  const devTeam = [
    {
      name: "Devam Gupta",
      role: "Lead Web Architect & Fullstack Developer",
      avatar: "/team-carousel/Devansh Srivastava.png",
      tag: "Core Lead",
    },
    {
      name: "Technical Advisory",
      role: "UI/UX & WebGL Shader Design",
      avatar: "/team-carousel/Aditya Nayak.png",
      tag: "Design",
    },
    {
      name: "Frontend Team",
      role: "React, Next.js & Animation Engineering",
      avatar: "/team-carousel/Ambika Dalmia.png",
      tag: "Engineering",
    },
    {
      name: "Backend & Cloud",
      role: "Firebase Infrastructure & Auth Services",
      avatar: "/team-carousel/Aryan.png",
      tag: "Infrastructure",
    },
    {
      name: "QA & Testing",
      role: "Quality Assurance & Automated Testing",
      avatar: "/team-carousel/Ashlesha Sharma.png",
      tag: "Quality",
    },
    {
      name: "DevOps & SecOps",
      role: "CI/CD Pipelines & Platform Security",
      avatar: "/team-carousel/Daksh kumar.png",
      tag: "Operations",
    },
    {
      name: "Content & Strategy",
      role: "Digital Strategy & Content Management",
      avatar: "/team-carousel/Manan.png",
      tag: "Strategy",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12 py-10 px-4">
      {/* Hero */}
      <section className="text-center space-y-4">
        <span className="text-xs font-mono uppercase tracking-widest text-purple-400 font-bold">
          Sabrang 2026 Digital Platform
        </span>
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight uppercase">
          Tech Team Credits
        </h1>
        <p className="text-base md:text-lg text-white/70 max-w-2xl mx-auto">
          Crafted with passion, precision, and modern web architecture by the
          Sabrang Technical Team.
        </p>
      </section>

      {/* Tech Team Grid */}
      <div className="flex flex-col items-center w-full gap-8">
        {/* Lead Member */}
        {devTeam.length > 0 && (
          <div className="group w-full max-w-2xl rounded-3xl bg-neutral-900 border border-white/10 p-8 flex flex-col sm:flex-row items-center gap-6 shadow-xl hover:border-purple-500/40 transition-all duration-300 hover:scale-[1.02] text-center sm:text-left">
            <img
              src={devTeam[0].avatar}
              alt={devTeam[0].name}
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover border border-white/15 shrink-0"
            />
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-wider text-purple-400 font-bold px-3 py-1 rounded-full bg-purple-950/60 border border-purple-800/40 inline-block">
                {devTeam[0].tag}
              </span>
              <h3 className="text-3xl font-bold text-white">
                {devTeam[0].name}
              </h3>
              <p className="text-sm text-white/60 font-medium">
                {devTeam[0].role}
              </p>
            </div>
          </div>
        )}

        {/* Other Members */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {devTeam.slice(1).map((member, idx) => (
            <div
              key={idx}
              className="group rounded-3xl bg-neutral-900 border border-white/10 p-6 flex items-center gap-5 shadow-xl hover:border-purple-500/40 transition-all duration-300 hover:scale-[1.02]"
            >
              <img
                src={member.avatar}
                alt={member.name}
                className="w-16 h-16 rounded-2xl object-cover border border-white/15 shrink-0"
              />
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-purple-400 font-bold px-2 py-0.5 rounded-full bg-purple-950/60 border border-purple-800/40 inline-block">
                  {member.tag}
                </span>
                <h3 className="text-xl font-bold text-white">{member.name}</h3>
                <p className="text-xs text-white/60 font-medium">
                  {member.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Built With Tech Stack */}
      <div className="rounded-3xl bg-neutral-950 border border-white/10 p-8 text-center space-y-6">
        <h3 className="text-sm uppercase tracking-widest text-white/50 font-bold">
          Built With Next-Gen Web Technologies
        </h3>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {[
            "Next.js 16",
            "React 19",
            "Three.js / WebGL",
            "Tailwind CSS",
            "GSAP Shaders",
            "Firebase Platform",
          ].map((tech, i) => (
            <span
              key={i}
              className="px-4 py-2 rounded-full bg-white/[0.04] border border-white/10 text-xs font-semibold text-white/80"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
