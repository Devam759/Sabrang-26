export const SITE_CONFIG = {
  name: 'Sabrang 2026',
  year: '2026',
  tagline: 'Annual Cultural Festival of JK Lakshmipat University',
  domain: 'https://sabrang.jklu.edu.in',
  email: 'SABRANG@JKLU.EDU.IN',
  university: {
    name: 'JK Lakshmipat University',
    shortName: 'JKLU',
    url: 'https://jklu.edu.in',
    logo: '/white_jklu_logo.png',
  },
  logos: {
    sabrang: '/sabrang logo.png',
    jkTyre: '/past sponsors/JK Tyre.png',
  },
  loaderDurationMs: 6000,
} as const;

export interface OrganizingHead {
  name: string;
  phone: string;
  displayPhone: string;
  role?: string;
}

export const ORGANIZING_HEADS: OrganizingHead[] = [
  { name: 'Kartik Sharma', phone: '+918769329369', displayPhone: '+91 87693 29369' },
  { name: 'Rishika Singh', phone: '+917300118679', displayPhone: '+91 73001 18679' },
  { name: 'Gurseerat Kaur', phone: '+917678252871', displayPhone: '+91 76782 52871' },
  { name: 'Pratigya Bomb', phone: '+916264667506', displayPhone: '+91 62646 67506' },
];

export interface NavLink {
  href: string;
  label: string;
}

export const NAV_LINKS: NavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/team', label: 'Team' },
  { href: '/sponsors', label: 'Sponsors' },
  { href: '/events', label: 'Events' },
  { href: '/schedule', label: 'Schedule' },
  { href: '/register', label: 'Registration' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact Us' },
  { href: '/credits', label: 'Tech Team Credits' },
];

export interface SponsorItem {
  src: string;
  alt: string;
  title: string;
}

export const PAST_SPONSORS: SponsorItem[] = [
  { src: '/past sponsors/Chaap Singh.png', alt: 'Chaap Singh', title: 'Chaap Singh' },
  { src: '/past sponsors/JK Lakshmi Cement.png', alt: 'JK Lakshmi Cement', title: 'JK Lakshmi Cement' },
  { src: '/past sponsors/JK Tyre.png', alt: 'JK Tyre', title: 'JK Tyre' },
  { src: '/past sponsors/McCain.png', alt: 'McCain', title: 'McCain' },
  { src: '/past sponsors/Nescafe.png', alt: 'Nescafe', title: 'Nescafe' },
  { src: '/past sponsors/The Belgian Waffle Co.png', alt: 'The Belgian Waffle Co.', title: 'The Belgian Waffle Co.' },
  { src: '/past sponsors/my fm.png', alt: 'MY FM', title: 'MY FM' },
  { src: '/past sponsors/red bull.png', alt: 'Red Bull', title: 'Red Bull' },
];

export const CURSOR_TRAIL_COLORS = [
  '#f967fb',
  '#7C3AED',
  '#53bc28',
  '#fe8a2e',
  '#6958d5',
  '#ff008a',
  '#60aed5',
  '#83f36e',
] as const;
