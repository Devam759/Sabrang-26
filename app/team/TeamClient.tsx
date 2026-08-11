'use client';

import { useEffect } from 'react';
import WebGLCarousel from '@/components/webgl-carousel/WebGLCarousel';

export default function TeamClient() {
  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, []);

  const names = [
    'Dr. Rajesh Sharma', 'Prof. Anita Verma', 'Amit Kumar', 'Priya Singh',
    'Rahul Verma', 'Sneha Kapur', 'Karan Johar', 'Ishaan Khattar',
    'Neha Gupta', 'Ananya Patel', 'Vikram Rao', 'Meera Joshi',
    'Rohan Mehta', 'Sanya Malhotra', 'Aditya Roy', 'Riya Sen',
    'Devansh Saxena', 'Kavya Nair', 'Arjun Kapoor', 'Tanvi Shah',
    'Yash Vardhan', 'Pooja Hegde', 'Varun Dhawan', 'Shraddha Das',
    'Siddharth Malhotra', 'Jahnvi Kapoor', 'Kartik Aaryan', 'Kiara Advani',
    'Ayushmann Khurrana', 'Kriti Sanon', 'Vicky Kaushal', 'Sara Ali Khan',
    'Ranbir Kapoor'
  ];

  const roles = [
    'Festival Director', 'Event Coordinator', 'General Secretary', 'Joint Secretary',
    'Treasurer', 'Event Head', 'Technical Lead', 'Web Developer',
    'App Developer', 'Design Head', 'Content Lead', 'Social Media Manager',
    'Logistics Lead', 'Public Relations', 'Sponsorship Head', 'Stage Manager',
    'Security In-Charge', 'Creative Director', 'Operations Lead', 'Marketing Head',
    'Hospitality Head', 'Decor Lead', 'Finance Officer', 'Media Coordinator',
    'Tech Support', 'VIP Guest Management', 'Sound & Lights Lead', 'Volunteer Coordinator',
    'Photography Head', 'Video Production Lead', 'Sponsorship Manager', 'Registration Lead',
    'Core Advisory'
  ];

  const carouselMembers = Array.from({ length: 33 }, (_, i) => ({
    image: (i % 2 === 0) ? '/team-carousel/image copy.png' : '/team-carousel/image copy 2.png',
    name: names[i % names.length],
    role: roles[i % roles.length],
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
