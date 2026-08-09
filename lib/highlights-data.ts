/**
 * Gallery Highlights — the festival archive.
 *
 * Presentation lives in components/highlights/. To add or remove a photograph,
 * edit this array only: the 3D composition, focus order, metadata HUD and the
 * static fallback all derive from it. Portrait and landscape images are both
 * supported — each plane is sized from its texture's real aspect ratio, so
 * nothing is cropped or stretched.
 *
 * Drop the matching files into public/gallery/. Any file that is missing
 * renders as a neutral archive placeholder instead of breaking the scene.
 */

export type GalleryItem = {
  id: number;
  /** Path under /public. Portrait or landscape, either is fine. */
  image: string;
  title: string;
  category: string;
  venue: string;
  year: number;
  /** Meaningful alt text — used by the static fallback and the screen-reader list. */
  alt: string;
};

export const galleryItems: GalleryItem[] = [
  {
    id: 1,
    image: '/gallery/panache-runway.jpg',
    title: 'Panache',
    category: 'Fashion',
    venue: 'Main Stage',
    year: 2025,
    alt: 'A model mid-stride on the Panache runway under white spotlights.',
  },
  {
    id: 2,
    image: '/gallery/bandjam-finale.jpg',
    title: 'Bandjam Finale',
    category: 'Live Music',
    venue: 'Amphitheatre',
    year: 2025,
    alt: 'A guitarist leaning into the crowd during the Bandjam finale.',
  },
  {
    id: 3,
    image: '/gallery/step-up-crew.jpg',
    title: 'Step Up',
    category: 'Dance',
    venue: 'Main Stage',
    year: 2025,
    alt: 'A dance crew frozen mid-formation in a wash of coloured light.',
  },
  {
    id: 4,
    image: '/gallery/cultural-night.jpg',
    title: 'Cultural Night',
    category: 'Performance',
    venue: 'Central Lawn',
    year: 2025,
    alt: 'Folk performers in traditional dress circling a lit stage after dark.',
  },
  {
    id: 5,
    image: '/gallery/dj-night-crowd.jpg',
    title: 'DJ Night',
    category: 'Concert',
    venue: 'Main Ground',
    year: 2025,
    alt: 'Thousands of raised hands silhouetted against stage lasers at DJ Night.',
  },
  {
    id: 6,
    image: '/gallery/opening-ceremony.jpg',
    title: 'Opening Ceremony',
    category: 'Ceremony',
    venue: 'Central Lawn',
    year: 2025,
    alt: 'Confetti falling over the crowd at the Sabrang opening ceremony.',
  },
  {
    id: 7,
    image: '/gallery/street-play.jpg',
    title: 'Nukkad Natak',
    category: 'Theatre',
    venue: 'Campus Square',
    year: 2025,
    alt: 'Street-play performers mid-shout in a ring of seated students.',
  },
  {
    id: 8,
    image: '/gallery/battle-of-bands.jpg',
    title: 'Battle of Bands',
    category: 'Live Music',
    venue: 'Amphitheatre',
    year: 2025,
    alt: 'A drummer lit from behind in haze during Battle of Bands.',
  },
  {
    id: 9,
    image: '/gallery/art-installation.jpg',
    title: 'Canvas Walk',
    category: 'Fine Arts',
    venue: 'Arts Block',
    year: 2025,
    alt: 'Students painting a long collaborative mural along the arts block wall.',
  },
  {
    id: 10,
    image: '/gallery/esports-arena.jpg',
    title: 'E-Sports Arena',
    category: 'E-Sports',
    venue: 'Tech Hall',
    year: 2025,
    alt: 'Players hunched over keyboards under monitor glow in the e-sports arena.',
  },
  {
    id: 11,
    image: '/gallery/classical-recital.jpg',
    title: 'Raag',
    category: 'Classical',
    venue: 'Auditorium',
    year: 2025,
    alt: 'A classical vocalist seated with a tanpura in a single warm spotlight.',
  },
  {
    id: 12,
    image: '/gallery/food-festival.jpg',
    title: 'Food Street',
    category: 'Festival',
    venue: 'Campus Square',
    year: 2025,
    alt: 'Steam rising from food stalls strung with lights after sunset.',
  },
  {
    id: 13,
    image: '/gallery/celebrity-set.jpg',
    title: 'Headline Set',
    category: 'Concert',
    venue: 'Main Ground',
    year: 2025,
    alt: 'The headline artist on a wide stage with the crowd stretching into darkness.',
  },
  {
    id: 14,
    image: '/gallery/poetry-slam.jpg',
    title: 'Open Mic',
    category: 'Literary',
    venue: 'Library Court',
    year: 2025,
    alt: 'A poet at a standing mic, audience close and quiet around them.',
  },
  {
    id: 15,
    image: '/gallery/prize-ceremony.jpg',
    title: 'Prize Night',
    category: 'Ceremony',
    venue: 'Auditorium',
    year: 2025,
    alt: 'Winners lifting a trophy together on stage at the closing prize ceremony.',
  },
  {
    id: 16,
    image: '/gallery/closing-fireworks.jpg',
    title: 'Closing Night',
    category: 'Finale',
    venue: 'Main Ground',
    year: 2025,
    alt: 'Fireworks over the main ground as the festival closes.',
  },
];
