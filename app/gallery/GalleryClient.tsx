'use client';

import { useState } from 'react';

export default function GalleryClient() {
  const [filter, setFilter] = useState('all');

  const galleryItems = [
    { id: 1, title: 'Bandjam 2025', category: 'music', img: '/team-carousel/1.jpg' },
    { id: 2, title: 'Panache Fashion Night', category: 'fashion', img: '/team-carousel/2.jpg' },
    { id: 3, title: 'Step-Up Dance Battle', category: 'dance', img: '/team-carousel/3.jpg' },
    { id: 4, title: 'Robotics Hackathon', category: 'tech', img: '/team-carousel/4.jpg' },
    { id: 5, title: 'DJ Night Celebration', category: 'music', img: '/team-carousel/5.jpg' },
    { id: 6, title: 'Theatre & Drama Stage', category: 'cultural', img: '/team-carousel/6.jpg' },
    { id: 7, title: 'E-Sports Arena', category: 'tech', img: '/team-carousel/7.jpg' },
    { id: 8, title: 'Art & Decor Installation', category: 'cultural', img: '/team-carousel/8.jpg' },
    { id: 9, title: 'Pro Show Night', category: 'music', img: '/team-carousel/9.jpg' },
  ];

  const filteredItems = filter === 'all' 
    ? galleryItems 
    : galleryItems.filter(item => item.category === filter);

  return (
    <div className="max-w-6xl mx-auto space-y-10 py-6 px-4">
      {/* Header */}
      <section className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight uppercase">
          Festival Gallery
        </h1>
        <p className="text-base md:text-lg text-white/70 max-w-2xl mx-auto">
          Capturing unforgettable moments, explosive performances, and creative energy of Sabrang.
        </p>
      </section>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {['all', 'music', 'dance', 'fashion', 'tech', 'cultural'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-5 py-2 rounded-full text-xs md:text-sm font-semibold uppercase tracking-wider transition-all cursor-pointer ${
              filter === cat
                ? 'bg-white text-black shadow-lg scale-105'
                : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="group relative rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 aspect-[4/3] shadow-xl transition-all duration-300 hover:scale-[1.02]"
          >
            <img
              src={item.img}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
              <span className="text-xs uppercase tracking-widest text-purple-400 font-bold mb-1">
                {item.category}
              </span>
              <h3 className="text-xl font-bold text-white">{item.title}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
