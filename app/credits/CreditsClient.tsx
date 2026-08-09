'use client';

export default function CreditsClient() {
  const devTeam = [
    { name: 'Devam Sharma', role: 'Lead Web Architect & Fullstack Developer', avatar: '/team-carousel/1.jpg', tag: 'Core Lead' },
    { name: 'Technical Advisory', role: 'UI/UX & WebGL Shader Design', avatar: '/team-carousel/2.jpg', tag: 'Design' },
    { name: 'Frontend Team', role: 'React, Next.js & Animation Engineering', avatar: '/team-carousel/3.jpg', tag: 'Engineering' },
    { name: 'Backend & Cloud', role: 'Firebase Infrastructure & Auth Services', avatar: '/team-carousel/4.jpg', tag: 'Infrastructure' },
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
          Crafted with passion, precision, and modern web architecture by the Sabrang Technical Team.
        </p>
      </section>

      {/* Tech Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {devTeam.map((member, idx) => (
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
              <p className="text-xs text-white/60 font-medium">{member.role}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Built With Tech Stack */}
      <div className="rounded-3xl bg-neutral-950 border border-white/10 p-8 text-center space-y-6">
        <h3 className="text-sm uppercase tracking-widest text-white/50 font-bold">
          Built With Next-Gen Web Technologies
        </h3>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {['Next.js 16', 'React 19', 'Three.js / WebGL', 'Tailwind CSS', 'GSAP Shaders', 'Firebase Platform'].map((tech, i) => (
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
