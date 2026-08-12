'use client';

import { useEffect } from 'react';
import WebGLCarousel from '@/components/webgl-carousel/WebGLCarousel';

export default function TeamClient() {
  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.classList.remove('team-scrolled');

    let initialTouchY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      initialTouchY = e.touches[0]?.clientY || 0;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const currentTouchY = e.touches[0]?.clientY || 0;
      const diffY = Math.abs(currentTouchY - initialTouchY);
      if (diffY > 10) {
        document.body.classList.add('team-scrolled');
      }
    };

    const handleWheel = () => {
      document.body.classList.add('team-scrolled');
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('wheel', handleWheel, { passive: true });

    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.classList.remove('team-scrolled');
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const teamImages = [
    '/team-carousel/Aditya Nayak.png',
    '/team-carousel/Ambika Dalmia.png',
    '/team-carousel/Aryan.png',
    '/team-carousel/Ashlesha Sharma.png',
    '/team-carousel/Daksh kumar.png',
    '/team-carousel/Devansh Srivastava .png',
    '/team-carousel/Manan.png',
    '/team-carousel/Naman Shukla.png',
    '/team-carousel/Rashi.png',
    '/team-carousel/Roshan jangir .png',
    '/team-carousel/Satvik.png'
  ];

  const rawMembers = [
    // Organizing Heads
    { name: 'Kartik Sharma', role: 'Organizing Head' },
    { name: 'Rishika Singh', role: 'Organizing Head' },
    { name: 'Gurseerat Kaur', role: 'Organizing Head' },
    { name: 'Pratigya Bomb', role: 'Organizing Head' },

    // Core Members
    { name: 'Tanik Gupta', role: 'Discipline Core' },
    { name: 'Saumya Puri', role: 'Discipline Core' },
    { name: 'Aayush', role: 'Design Core' },
    { name: 'Abhirama Shreyas', role: 'Decor Core' },
    { name: 'Mahi Tripathi', role: 'Decor Core' },
    { name: 'Vaibhav Sharma', role: 'Media & Report Core' },
    { name: 'Kartik Singh', role: 'Photography Core' },
    { name: 'Roshan Jangir', role: 'Photography Core' },
    { name: 'Aadhya Mittal', role: 'Events Core' },
    { name: 'Devansh Srivastava', role: 'Events Core' },
    { name: 'Jheel Jain', role: 'Events Core' },
    { name: 'Devam Gupta', role: 'Tech & Support Core' },
    { name: 'Satvik Agrawal', role: 'Internal Arrangements Core' },
    { name: 'Asmit Sharma', role: 'Internal Arrangements Core' },
    { name: 'Kunal Kasliwal', role: 'Transport Core' },
    { name: 'Manan Lala', role: 'Transport Core' },
    { name: 'Aditya Nayak', role: 'Social Media Core' },
    { name: 'Aryan Gupta', role: 'Social Media Core' },
    { name: 'Ashlesha Sharma', role: 'Prize & Certificates Core' },
    { name: 'Ambika Dalmia', role: 'Hospitality Core' },
    { name: 'Khushi Soni', role: 'Hospitality Core' },
    { name: 'Naman Shukla', role: 'Stage & Venue Core' },
    { name: 'Diksha Shekhawat', role: 'Stage & Venue Core' },
    { name: 'Jayash Gahlot', role: 'Registrations Core' },
    { name: 'Ankit Joshi', role: 'Registrations Core' },
    { name: 'Gaurang Tak', role: 'Sponsorship & Promotions Core' },
    { name: 'Daksh Kumar', role: 'Anchoring Core' },
    { name: 'Laksh Sharma', role: 'Anchoring Core' }
  ];

  function getMemberImage(name: string): string {
    const normalized = name.toLowerCase().trim();
    if (normalized.includes('aditya nayak')) return '/team-carousel/Aditya Nayak.png';
    if (normalized.includes('ambika dalmia')) return '/team-carousel/Ambika Dalmia.png';
    if (normalized.includes('aryan gupta') || normalized === 'aryan') return '/team-carousel/Aryan.png';
    if (normalized.includes('ashlesha sharma')) return '/team-carousel/Ashlesha Sharma.png';
    if (normalized.includes('daksh kumar')) return '/team-carousel/Daksh kumar.png';
    if (normalized.includes('devansh srivastava')) return '/team-carousel/Devansh Srivastava .png';
    if (normalized.includes('manan lala') || normalized === 'manan') return '/team-carousel/Manan.png';
    if (normalized.includes('naman shukla')) return '/team-carousel/Naman Shukla.png';
    if (normalized.includes('rashi')) return '/team-carousel/Rashi.png';
    if (normalized.includes('roshan jangir')) return '/team-carousel/Roshan jangir .png';
    if (normalized.includes('satvik agrawal') || normalized === 'satvik') return '/team-carousel/Satvik.png';

    // Fallback to JKLU logo for those we don't have photos for
    return '/white_jklu_logo.png';
  }

  const carouselMembers = rawMembers.map((member) => ({
    image: getMemberImage(member.name),
    name: member.name,
    role: member.role
  }));

  return (
    <div className="fixed inset-0 z-10 w-screen h-screen overflow-hidden bg-black flex items-center justify-center p-0 m-0">
      {/* Full Viewport WebGL 3D Refraction Carousel */}
      <div className="absolute inset-0 z-10 w-screen h-screen px-0 m-0">
        <WebGLCarousel items={carouselMembers} className="w-full h-full rounded-none" />
      </div>
    </div>
  );
}
