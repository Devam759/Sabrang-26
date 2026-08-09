'use client';

export default function SponsorsClient() {
  const sponsors = [
    { name: 'Tech Title Sponsor', tier: 'Title Partner', logo: '⚡', color: 'from-amber-500 to-yellow-600' },
    { name: 'Powered By Partner', tier: 'Powered By', logo: '🚀', color: 'from-blue-500 to-indigo-600' },
    { name: 'Media Partner', tier: 'Media & PR', logo: '📻', color: 'from-purple-500 to-pink-600' },
    { name: 'Gaming Partner', tier: 'E-Sports', logo: '🎮', color: 'from-green-500 to-emerald-600' },
    { name: 'Beverage Partner', tier: 'Hospitality', logo: '🥤', color: 'from-red-500 to-rose-600' },
    { name: 'Fashion Partner', tier: 'Panache', logo: '✨', color: 'from-fuchsia-500 to-purple-600' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-8 px-4">
      {/* Header */}
      <section className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight uppercase">
          Our Sponsors & Partners
        </h1>
        <p className="text-base md:text-lg text-white/70 max-w-2xl mx-auto">
          We extend our sincere gratitude to the visionary brands power-fueling Sabrang 2026.
        </p>
      </section>

      {/* Sponsors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sponsors.map((sponsor, idx) => (
          <div
            key={idx}
            className="group relative rounded-2xl bg-neutral-900 border border-white/10 p-8 flex flex-col items-center text-center space-y-4 hover:border-white/30 transition-all duration-300 hover:scale-[1.02]"
          >
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${sponsor.color} flex items-center justify-center text-4xl shadow-lg group-hover:scale-110 transition-transform`}>
              {sponsor.logo}
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest text-purple-400 font-bold">
                {sponsor.tier}
              </span>
              <h3 className="text-xl font-bold text-white mt-1">{sponsor.name}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Why Sponsor Us Callout */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-800 rounded-3xl p-8 md:p-12 border border-white/10 text-center space-y-6">
        <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">
          Partner With Sabrang 2026
        </h2>
        <p className="text-white/70 max-w-2xl mx-auto text-sm md:text-base">
          Connect your brand with 10,000+ enthusiastic college students, tech innovators, and artists across India.
        </p>
        <a
          href="/contact"
          className="inline-block px-8 py-3.5 rounded-full bg-white text-black font-bold text-sm uppercase tracking-wider hover:bg-neutral-200 transition-all shadow-xl"
        >
          Become a Sponsor
        </a>
      </div>
    </div>
  );
}
