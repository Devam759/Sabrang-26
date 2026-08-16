import type { Project } from './types';
import { useTexture } from '@react-three/drei';
// Covers live next to the component. They are pre-cropped to the film gate's
// exact aspect (FRAME_WIDTH / FRAME_HEIGHT), so coverFitTexture is a no-op on
// them — what you see in the file is what lands in the frame.
import homeCover from './cover-images/home.png';
import aboutCover from './cover-images/about.png';
import galleryCover from './cover-images/gallery.png';
import sponsorsCover from './cover-images/sponsors.png';
import teamCover from './cover-images/team.png';


// The site's nav links expressed as film-strip projects.
export const NAV_PROJECTS: Project[] = [
  { id: 'home', title: 'Home', category: 'Festival Hub', description: 'The Sabrang 2026 landing experience.', image: homeCover.src, href: '/' },
  { id: 'about', title: 'About', category: 'Our Story', description: 'What Sabrang is and why it exists.', image: aboutCover.src, href: '/about' },
  { id: 'events', title: 'Events', category: 'Compete', description: 'Every competition and showcase.', image: '/menu-scroll-covers/dance-battle.png', href: '/events' },
  { id: 'gallery', title: 'Gallery', category: 'Memories', description: 'Highlights from past editions.', image: galleryCover.src, href: '/gallery' },
  { id: 'schedule', title: 'Schedule', category: 'Timeline', description: 'When everything happens.', image: '/menu-scroll-covers/panache-runway.png', href: '/schedule' },
  { id: 'register', title: 'Registration', category: 'Join Us', description: 'Sign up to participate.', image: '/menu-scroll-covers/step-up.jpg', href: '/register' },
  { id: 'sponsors', title: 'Sponsors', category: 'Partners', description: 'The brands powering Sabrang.', image: sponsorsCover.src, href: '/sponsors' },
  { id: 'team', title: 'Our Team', category: 'The Crew', description: 'The people behind the festival.', image: teamCover.src, href: '/team' },

  { id: 'contact', title: 'Contact Us', category: 'Say Hello', description: 'Reach the organising team.', image: '/menu-scroll-covers/sabrang-live.png', href: '/contact' },
  { id: 'faq', title: 'FAQ', category: 'Answers', description: 'Everything commonly asked.', image: '/menu-scroll-covers/versevaad.jpg', href: '/faq' },
];

// Preload all reel textures into GPU cache ahead of time
if (typeof window !== 'undefined') {
  NAV_PROJECTS.forEach((p) => {
    if (p.image) {
      try {
        useTexture.preload(p.image);
      } catch {}
    }
  });
}
