export const SITE_CONFIG = {
  name: "Sabrang 2026",
  year: "2026",
  tagline: "Annual Cultural Festival of JK Lakshmipat University",
  domain: "https://sabrang.jklu.edu.in",
  email: "SABRANG@JKLU.EDU.IN",
  university: {
    name: "JK Lakshmipat University",
    shortName: "JKLU",
    url: "https://jklu.edu.in",
    logo: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060374/sabrang-2026/sabrang-logo/white_jklu_logo.png",
  },
  logos: {
    sabrang:
      "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1788091530/sabrang-2026/sabrang-logo/sabrang-logo.png",
    jkTyre:
      "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060362/sabrang-2026/past-sponsors/JK-Tyre.png",
  },
  loaderDurationMs: 6000,
} as const;

export interface OrganizingHead {
  name: string;
  phone: string;
  displayPhone: string;
  role?: string;
  image?: string;
}

export const ORGANIZING_HEADS: OrganizingHead[] = [
  {
    name: "Kartik Sharma",
    phone: "+918769329369",
    displayPhone: "+91 87693 29369",
    image:
      "https://res.cloudinary.com/eprhemvt/image/upload/v1787651025/66917207478_1.png",
  },
  {
    name: "Rishika Singh",
    phone: "+917300118679",
    displayPhone: "+91 73001 18679",
    image:
      "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787334662/sabrang-2026/team/rishika-singh.jpg",
  },
  {
    name: "Pratigya Bomb",
    phone: "+916264667506",
    displayPhone: "+91 62646 67506",
    image:
      "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787122733/sabrang-2026/team/pratigya-bomb.png",
  },
  {
    name: "Gurseerat Kaur",
    phone: "+917678252871",
    displayPhone: "+91 76782 52871",
    image:
      "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787122736/sabrang-2026/team/gurseerat-kaur.png",
  },
];

export interface NavLink {
  href: string;
  label: string;
}

export const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/gallery", label: "Gallery" },
  { href: "/team", label: "Team" },
  { href: "/sponsors", label: "Sponsors" },
  { href: "/events", label: "Events" },
  { href: "/schedule", label: "Schedule" },
  { href: "/register", label: "Registration" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact Us" },
  { href: "/credits", label: "Tech Team Credits" },
];

export interface SponsorItem {
  src: string;
  alt: string;
  title: string;
}

export const PAST_SPONSORS: SponsorItem[] = [
  {
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060361/sabrang-2026/past-sponsors/Chaap-Singh.png",
    alt: "Chaap Singh",
    title: "Chaap Singh",
  },
  {
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060362/sabrang-2026/past-sponsors/JK-Lakshmi-Cement.png",
    alt: "JK Lakshmi Cement",
    title: "JK Lakshmi Cement",
  },
  {
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060362/sabrang-2026/past-sponsors/JK-Tyre.png",
    alt: "JK Tyre",
    title: "JK Tyre",
  },
  {
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060363/sabrang-2026/past-sponsors/McCain.png",
    alt: "McCain",
    title: "McCain",
  },
  {
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060365/sabrang-2026/past-sponsors/Nescafe.png",
    alt: "Nescafe",
    title: "Nescafe",
  },
  {
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060367/sabrang-2026/past-sponsors/The-Belgian-Waffle-Co.png",
    alt: "The Belgian Waffle Co.",
    title: "The Belgian Waffle Co.",
  },
  {
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060364/sabrang-2026/past-sponsors/my-fm.png",
    alt: "MY FM",
    title: "MY FM",
  },
  {
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060366/sabrang-2026/past-sponsors/red-bull.png",
    alt: "Red Bull",
    title: "Red Bull",
  },
];

export const CURSOR_TRAIL_COLORS = [
  "#f967fb",
  "#7C3AED",
  "#53bc28",
  "#fe8a2e",
  "#6958d5",
  "#ff008a",
  "#60aed5",
  "#83f36e",
] as const;

// Single source of truth for the cursor trail's timing, shared by every surface
// that renders it. A tube is a chain of points lerping toward the one ahead, so
// tail lifetime ≈ segments / 60fps: 12–45 lands the longest tail at ~0.75s.
export const CURSOR_TRAIL_MIN_SEGMENTS = 12;
export const CURSOR_TRAIL_MAX_SEGMENTS = 45;
// Idle delay before the trail starts wandering on its own.
export const CURSOR_TRAIL_IDLE_MS = 1200;

export interface GalleryItem {
  id: number;
  src: string;
  title: string;
}

// 96 official festival photographs in randomized sequence
export const GALLERY_IMAGES: GalleryItem[] = [
  {
    id: 43,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060269/sabrang-2026/gallery/43.webp",
    title: "Sabrang Moment",
  },
  {
    id: 87,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060341/sabrang-2026/gallery/87.webp",
    title: "Sabrang Moment",
  },
  {
    id: 96,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060353/sabrang-2026/gallery/96.webp",
    title: "Sabrang Moment",
  },
  {
    id: 48,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060275/sabrang-2026/gallery/48.webp",
    title: "Sabrang Moment",
  },
  {
    id: 29,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060248/sabrang-2026/gallery/29.webp",
    title: "Sabrang Moment",
  },
  {
    id: 28,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060247/sabrang-2026/gallery/28.webp",
    title: "Sabrang Moment",
  },
  {
    id: 25,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060243/sabrang-2026/gallery/25.webp",
    title: "Sabrang Moment",
  },
  {
    id: 57,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060290/sabrang-2026/gallery/57.webp",
    title: "Sabrang Moment",
  },
  {
    id: 78,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060325/sabrang-2026/gallery/78.webp",
    title: "Sabrang Moment",
  },
  {
    id: 73,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060319/sabrang-2026/gallery/73.webp",
    title: "Sabrang Moment",
  },
  {
    id: 64,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060303/sabrang-2026/gallery/64.webp",
    title: "Sabrang Moment",
  },
  {
    id: 7,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060312/sabrang-2026/gallery/7.webp",
    title: "Sabrang Moment",
  },
  {
    id: 26,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060244/sabrang-2026/gallery/26.webp",
    title: "Sabrang Moment",
  },
  {
    id: 82,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060334/sabrang-2026/gallery/82.webp",
    title: "Sabrang Moment",
  },
  {
    id: 83,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060335/sabrang-2026/gallery/83.webp",
    title: "Sabrang Moment",
  },
  {
    id: 54,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060285/sabrang-2026/gallery/54.webp",
    title: "Sabrang Moment",
  },
  {
    id: 21,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060237/sabrang-2026/gallery/21.webp",
    title: "Sabrang Moment",
  },
  {
    id: 86,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060340/sabrang-2026/gallery/86.webp",
    title: "Sabrang Moment",
  },
  {
    id: 9,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060345/sabrang-2026/gallery/9.webp",
    title: "Sabrang Moment",
  },
  {
    id: 36,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060258/sabrang-2026/gallery/36.webp",
    title: "Sabrang Moment",
  },
  {
    id: 94,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060351/sabrang-2026/gallery/94.webp",
    title: "Sabrang Moment",
  },
  {
    id: 41,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060267/sabrang-2026/gallery/41.webp",
    title: "Sabrang Moment",
  },
  {
    id: 81,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060333/sabrang-2026/gallery/81.webp",
    title: "Sabrang Moment",
  },
  {
    id: 1,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060216/sabrang-2026/gallery/1.webp",
    title: "Sabrang Moment",
  },
  {
    id: 12,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060220/sabrang-2026/gallery/12.webp",
    title: "Sabrang Moment",
  },
  {
    id: 2,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060233/sabrang-2026/gallery/2.webp",
    title: "Sabrang Moment",
  },
  {
    id: 67,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060307/sabrang-2026/gallery/67.webp",
    title: "Sabrang Moment",
  },
  {
    id: 37,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060260/sabrang-2026/gallery/37.webp",
    title: "Sabrang Moment",
  },
  {
    id: 63,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060301/sabrang-2026/gallery/63.webp",
    title: "Sabrang Moment",
  },
  {
    id: 10,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060217/sabrang-2026/gallery/10.webp",
    title: "Sabrang Moment",
  },
  {
    id: 44,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060271/sabrang-2026/gallery/44.webp",
    title: "Sabrang Moment",
  },
  {
    id: 4,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060264/sabrang-2026/gallery/4.webp",
    title: "Sabrang Moment",
  },
  {
    id: 76,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060323/sabrang-2026/gallery/76.webp",
    title: "Sabrang Moment",
  },
  {
    id: 89,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060343/sabrang-2026/gallery/89.webp",
    title: "Sabrang Moment",
  },
  {
    id: 66,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060306/sabrang-2026/gallery/66.webp",
    title: "Sabrang Moment",
  },
  {
    id: 56,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060288/sabrang-2026/gallery/56.webp",
    title: "Sabrang Moment",
  },
  {
    id: 80,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060331/sabrang-2026/gallery/80.webp",
    title: "Sabrang Moment",
  },
  {
    id: 90,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060346/sabrang-2026/gallery/90.webp",
    title: "Sabrang Moment",
  },
  {
    id: 70,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060315/sabrang-2026/gallery/70.webp",
    title: "Sabrang Moment",
  },
  {
    id: 79,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060327/sabrang-2026/gallery/79.webp",
    title: "Sabrang Moment",
  },
  {
    id: 51,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060280/sabrang-2026/gallery/51.webp",
    title: "Sabrang Moment",
  },
  {
    id: 32,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060253/sabrang-2026/gallery/32.webp",
    title: "Sabrang Moment",
  },
  {
    id: 72,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060318/sabrang-2026/gallery/72.webp",
    title: "Sabrang Moment",
  },
  {
    id: 84,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060336/sabrang-2026/gallery/84.webp",
    title: "Sabrang Moment",
  },
  {
    id: 8,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060328/sabrang-2026/gallery/8.webp",
    title: "Sabrang Moment",
  },
  {
    id: 45,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060272/sabrang-2026/gallery/45.webp",
    title: "Sabrang Moment",
  },
  {
    id: 30,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060250/sabrang-2026/gallery/30.webp",
    title: "Sabrang Moment",
  },
  {
    id: 93,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060349/sabrang-2026/gallery/93.webp",
    title: "Sabrang Moment",
  },
  {
    id: 34,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060256/sabrang-2026/gallery/34.webp",
    title: "Sabrang Moment",
  },
  {
    id: 60,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060295/sabrang-2026/gallery/60.webp",
    title: "Sabrang Moment",
  },
  {
    id: 47,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060274/sabrang-2026/gallery/47.webp",
    title: "Sabrang Moment",
  },
  {
    id: 53,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060283/sabrang-2026/gallery/53.webp",
    title: "Sabrang Moment",
  },
  {
    id: 42,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060268/sabrang-2026/gallery/42.webp",
    title: "Sabrang Moment",
  },
  {
    id: 91,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060347/sabrang-2026/gallery/91.webp",
    title: "Sabrang Moment",
  },
  {
    id: 14,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060223/sabrang-2026/gallery/14.webp",
    title: "Sabrang Moment",
  },
  {
    id: 71,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060317/sabrang-2026/gallery/71.webp",
    title: "Sabrang Moment",
  },
  {
    id: 18,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060230/sabrang-2026/gallery/18.webp",
    title: "Sabrang Moment",
  },
  {
    id: 17,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060229/sabrang-2026/gallery/17.webp",
    title: "Sabrang Moment",
  },
  {
    id: 95,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060352/sabrang-2026/gallery/95.webp",
    title: "Sabrang Moment",
  },
  {
    id: 46,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060273/sabrang-2026/gallery/46.webp",
    title: "Sabrang Moment",
  },
  {
    id: 68,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060309/sabrang-2026/gallery/68.webp",
    title: "Sabrang Moment",
  },
  {
    id: 16,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060227/sabrang-2026/gallery/16.webp",
    title: "Sabrang Moment",
  },
  {
    id: 27,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060246/sabrang-2026/gallery/27.webp",
    title: "Sabrang Moment",
  },
  {
    id: 65,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060305/sabrang-2026/gallery/65.webp",
    title: "Sabrang Moment",
  },
  {
    id: 85,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060338/sabrang-2026/gallery/85.webp",
    title: "Sabrang Moment",
  },
  {
    id: 75,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060321/sabrang-2026/gallery/75.webp",
    title: "Sabrang Moment",
  },
  {
    id: 3,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060249/sabrang-2026/gallery/3.webp",
    title: "Sabrang Moment",
  },
  {
    id: 61,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060297/sabrang-2026/gallery/61.webp",
    title: "Sabrang Moment",
  },
  {
    id: 58,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060291/sabrang-2026/gallery/58.webp",
    title: "Sabrang Moment",
  },
  {
    id: 35,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060257/sabrang-2026/gallery/35.webp",
    title: "Sabrang Moment",
  },
  {
    id: 62,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060300/sabrang-2026/gallery/62.webp",
    title: "Sabrang Moment",
  },
  {
    id: 24,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060242/sabrang-2026/gallery/24.webp",
    title: "Sabrang Moment",
  },
  {
    id: 22,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060239/sabrang-2026/gallery/22.webp",
    title: "Sabrang Moment",
  },
  {
    id: 77,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060324/sabrang-2026/gallery/77.webp",
    title: "Sabrang Moment",
  },
  {
    id: 31,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060252/sabrang-2026/gallery/31.webp",
    title: "Sabrang Moment",
  },
  {
    id: 69,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060310/sabrang-2026/gallery/69.webp",
    title: "Sabrang Moment",
  },
  {
    id: 74,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060320/sabrang-2026/gallery/74.webp",
    title: "Sabrang Moment",
  },
  {
    id: 50,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060279/sabrang-2026/gallery/50.webp",
    title: "Sabrang Moment",
  },
  {
    id: 20,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060236/sabrang-2026/gallery/20.webp",
    title: "Sabrang Moment",
  },
  {
    id: 40,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060266/sabrang-2026/gallery/40.webp",
    title: "Sabrang Moment",
  },
  {
    id: 6,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060294/sabrang-2026/gallery/6.webp",
    title: "Sabrang Moment",
  },
  {
    id: 38,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060261/sabrang-2026/gallery/38.webp",
    title: "Sabrang Moment",
  },
  {
    id: 59,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060292/sabrang-2026/gallery/59.webp",
    title: "Sabrang Moment",
  },
  {
    id: 11,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060219/sabrang-2026/gallery/11.webp",
    title: "Sabrang Moment",
  },
  {
    id: 33,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060255/sabrang-2026/gallery/33.webp",
    title: "Sabrang Moment",
  },
  {
    id: 19,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060231/sabrang-2026/gallery/19.webp",
    title: "Sabrang Moment",
  },
  {
    id: 92,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060348/sabrang-2026/gallery/92.webp",
    title: "Sabrang Moment",
  },
  {
    id: 52,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060282/sabrang-2026/gallery/52.webp",
    title: "Sabrang Moment",
  },
  {
    id: 15,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060225/sabrang-2026/gallery/15.webp",
    title: "Sabrang Moment",
  },
  {
    id: 5,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060278/sabrang-2026/gallery/5.webp",
    title: "Sabrang Moment",
  },
  {
    id: 88,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060342/sabrang-2026/gallery/88.webp",
    title: "Sabrang Moment",
  },
  {
    id: 13,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060222/sabrang-2026/gallery/13.webp",
    title: "Sabrang Moment",
  },
  {
    id: 55,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060287/sabrang-2026/gallery/55.webp",
    title: "Sabrang Moment",
  },
  {
    id: 49,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060277/sabrang-2026/gallery/49.webp",
    title: "Sabrang Moment",
  },
  {
    id: 39,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060262/sabrang-2026/gallery/39.webp",
    title: "Sabrang Moment",
  },
  {
    id: 23,
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060240/sabrang-2026/gallery/23.webp",
    title: "Sabrang Moment",
  },
];

export interface TeamMemberLinks {
  email?: string;
  linkedin?: string;
  instagram?: string;
  github?: string;
}

export interface TeamMember {
  name: string;
  role: string;
  links?: TeamMemberLinks;
  image?: string;
}

export const TEAM_IMAGES: Record<string, string> = {
  "Abhirama Shreyas":
    "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787084232/sabrang-2026/team/abhirama-shreyas.png",
  "Aditya Nayak":
    "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787084234/sabrang-2026/team/aditya-nayak.png",
  "Ambika Dalmia":
    "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787084235/sabrang-2026/team/ambika-dalmia.png",
  "Ankit Joshi":
    "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787084236/sabrang-2026/team/ankit-joshi.png",
  "Anushka Pathak":
    "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787122734/sabrang-2026/team/anushka-pathak.png",
  "Aryan Gupta":
    "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787084238/sabrang-2026/team/aryan-gupta.png",
  "Ashlesha Sharma":
    "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787084239/sabrang-2026/team/ashlesha-sharma.png",
  "Ashmit Sharma":
    "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787084240/sabrang-2026/team/ashmit-sharma.png",
  "Daksh Kumar":
    "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787084243/sabrang-2026/team/daksh-kumar.png",
  "Devam Gupta":
    "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787165018/sabrang-2026/team/devam-gupta.png",
  "Devansh Srivastava":
    "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787084245/sabrang-2026/team/devansh-srivastava.png",
  "Diksha Shekhawat":
    "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787084246/sabrang-2026/team/diksha-shekhawat.png",
  "Gurseerat Kaur":
    "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787122736/sabrang-2026/team/gurseerat-kaur.png",
  "Kartik Singh":
    "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787331503/sabrang-2026/team/kartik-singh.png",
  "Kartik Sharma":
    "https://res.cloudinary.com/eprhemvt/image/upload/v1787651025/66917207478_1.png",
  "Khushi Soni":
    "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787084251/sabrang-2026/team/khushi-soni.png",
  "Kunal Kasliwal":
    "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787591802/sabrang-2026/team/hqqsacmq9lwi2mnn8ftt.png",
  "Laksh Sharma":
    "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787331504/sabrang-2026/team/laksh-sharma.jpg",
  "Manan Lala":
    "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787084254/sabrang-2026/team/manan-lala.png",
  "Naman Shukla":
    "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787084255/sabrang-2026/team/naman-shukla.png",
  "Pratigya Bomb":
    "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787122733/sabrang-2026/team/pratigya-bomb.png",
  "Rattan Gangadhar":
    "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787164767/sabrang-2026/team/rattan-gangadhar.png",
  "Richa Sharma":
    "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787122739/sabrang-2026/team/richa-sharma.png",
  "Rishika Singh":
    "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787334662/sabrang-2026/team/rishika-singh.jpg",
  "Roshan Jangir":
    "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787084259/sabrang-2026/team/roshan-jangir.png",
  "Satvik Agrawal":
    "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787331506/sabrang-2026/team/satvik-agrawal.png",
  "Saumya Puri":
    "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787084262/sabrang-2026/team/saumya-puri.png",
  "Vice Chancellor":
    "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787122741/sabrang-2026/team/vice-chancellor.png",
  "Vaibhav Topiwala":
    "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787591803/sabrang-2026/team/yrwtczfpxs5mcvblbsqo.png",
};

export const TEAM_MEMBERS: TeamMember[] = [
  { name: "Vaibhav Topiwala", role: "Student Affairs" },
  { name: "Anushka Pathak", role: "Student Affairs" },
  { name: "Richa Sharma", role: "Student Affairs" },
  { name: "Rattan Gangadhar", role: "Student Affairs" },
  { name: "Vice Chancellor", role: "Vice Chancellor" },
  {
    name: "Kartik Sharma",
    role: "Organizing Head",
    links: {
      email: "mailto:kartiksharma2024@jklu.edu.in",
      instagram: "https://www.instagram.com/idk_idc.06",
      linkedin: "https://www.linkedin.com/in/kartik-sharma-ks12",
      github: "https://github.com/KK-code001",
    },
  },
  { name: "Rishika Singh", role: "Organizing Head" },
  {
    name: "Pratigya Bomb",
    role: "Organizing Head",
    links: {
      email: "mailto:pratigyabomb@jklu.edu.in",
      linkedin:
        "https://www.linkedin.com/in/pratigya-bomb-295857349?utm_source=share_via&utm_content=profile&utm_medium=member_ios",
    },
  },
  { name: "Gurseerat Kaur", role: "Organizing Head" },
  {
    name: "Devam Gupta",
    role: "Tech & Support Core",
    links: {
      email: "mailto:devamgupta@jklu.edu.in",
      instagram: "https://www.instagram.com/who.is.devam/?hl=en",
      linkedin: "https://www.linkedin.com/in/devam-gupta/",
      github: "https://github.com/Devam759",
    },
  },
  {
    name: "Satvik Agrawal",
    role: "Internal Arrangements Core",
    links: {
      email: "mailto:satvikagrawal@jklu.edu.in",
      instagram: "https://www.instagram.com/satvik__oo7_/",
      linkedin: "https://www.linkedin.com/in/satvik-agrawal1104/",
      github: "https://github.com/Satvik1131",
    },
  },
  { name: "Mohit Khurana", role: "Internal Arrangements Core" },
  { name: "Tanik Gupta", role: "Discipline Core" },
  {
    name: "Saumya Puri",
    role: "Discipline Core",
    links: {
      email: "mailto:saumyapuri14@gmail.com",
      linkedin: "https://www.linkedin.com/in/saumyapuri14",
    },
  },
  {
    name: "Naman Shukla",
    role: "Stage & Venue Core",
    links: {
      email: "mailto:namanshukla@jklu.edu.in",
      instagram:
        "https://www.instagram.com/heyyynaman?igsh=MWJtOTdoeW5kM3J4eg%3D%3D&utm_source=qr",
      linkedin:
        "https://www.linkedin.com/in/naman-shukla-87ba40325?utm_source=share_via&utm_content=profile&utm_medium=member_ios",
    },
  },
  {
    name: "Diksha Shekhawat",
    role: "Stage & Venue Core",
    links: {
      email: "mailto:dikshashekhawat@jklu.edu.in",
      linkedin: "https://www.linkedin.com/in/diksha-shekhawat-082643322/",
    },
  },
  {
    name: "Devansh Srivastava",
    role: "Events Core",
    links: {
      email: "mailto:devansh@jklu.edu.in",
      linkedin: "https://www.linkedin.com/in/devansh-srivastava-vk18",
    },
  },
  { name: "Jheel Jain", role: "Events Core" },
  { name: "Adhya Mittal", role: "Events Core" },
  {
    name: "Daksh Kumar",
    role: "Anchoring Core",
    links: {
      email: "mailto:dakshkumar@jklu.edu.in",
      instagram: "https://www.instagram.com/dakshkkumar",
      linkedin: "https://www.linkedin.com/in/dakshkkumar",
      github: "https://github.com/dakshkkumar",
    },
  },
  {
    name: "Laksh Sharma",
    role: "Anchoring Core",
    links: {
      email: "mailto:lakshsharma@jklu.edu.in",
      instagram:
        "https://www.instagram.com/lksh.jpeg?igsh=MXB3MXh6MWg1bHB0aw==",
      linkedin:
        "https://www.linkedin.com/in/laksh-sharma25?utm_source=share_via&utm_content=profile&utm_medium=member_android",
    },
  },
  {
    name: "Ambika Dalmia",
    role: "Hospitality Core",
    links: {
      email: "mailto:ambikadalmia@jklu.edu.in",
      linkedin:
        "https://www.linkedin.com/in/ambika-dalmia-310762247?utm_source=share_via&utm_content=profile&utm_medium=member_ios",
    },
  },
  {
    name: "Khushi Soni",
    role: "Hospitality Core",
    links: {
      email: "mailto:khushisoni@jklu.edu.in",
      linkedin: "https://www.linkedin.com/in/khushi-soni--ks0906",
    },
  },
  { name: "Abhirama Sreyas", role: "DECOR Core" },
  { name: "Mahi Tripathi", role: "DECOR Core" },
  {
    name: "Kunal Kasliwal",
    role: "Transport Core",
    links: {
      email: "mailto:kunalkasliwal@jklu.edu.in",
      instagram: "https://www.instagram.com/kunalkasliwal14",
      linkedin:
        "https://www.linkedin.com/in/kunalkasliwal?utm_source=share_via&utm_content=profile&utm_medium=member_android",
    },
  },
  {
    name: "Manan Lala",
    role: "Transport Core",
    links: {
      email: "mailto:mananlala@jklu.edu.in",
      instagram: "https://www.instagram.com/mananlala16?igsh=azZ3aGlvcnc0aGlh",
      linkedin:
        "https://www.linkedin.com/in/manan-lala-a3a094320?utm_source=share_via&utm_content=profile&utm_medium=member_android",
    },
  },
  {
    name: "Ashlesha Sharma",
    role: "Prize and Certificate Core",
    links: {
      email: "mailto:ashleshasharma@jklu.edu.in",
      linkedin:
        "https://www.linkedin.com/in/ashlesha-sharma?utm_source=share_via&utm_content=profile&utm_medium=member_android",
    },
  },
  {
    name: "Kartik Singh",
    role: "Photography Core",
    links: {
      email: "mailto:kartiksingh@jklu.edu.in",
      instagram:
        "https://www.instagram.com/kray.tive?igsh=MWU4cHcxcnlsdnBmYw%3D%3D&utm_source=qr",
      linkedin:
        "https://www.linkedin.com/in/k4rtiksingh?utm_source=share_via&utm_content=profile&utm_medium=member_ios",
    },
  },
  {
    name: "Roshan Jangir",
    role: "Photography Core",
    links: {
      email: "mailto:roshanjangir@jklu.edu.in",
      linkedin:
        "https://www.linkedin.com/in/roshan-jangir-a614a430a?utm_source=share_via&utm_content=profile&utm_medium=member_android",
    },
  },
  {
    name: "Aditya Nayak",
    role: "Social Media Core",
    links: {
      email: "mailto:adityanayak@jklu.edu.in",
      instagram: "https://www.instagram.com/_nayak_1913/",
      linkedin: "https://www.linkedin.com/in/adityanayak13",
      github: "https://github.com/AdityaNayak13",
    },
  },
  {
    name: "Aryan Gupta",
    role: "Social Media Core",
    links: {
      email: "mailto:aryangupta2024@jklu.edu.in",
      instagram: "https://www.instagram.com/itz_aryan_30",
      linkedin: "https://www.linkedin.com/in/aryan-gupta-30dec2006",
    },
  },
  { name: "Vaibhav Sharma", role: "Media & Reports Core" },
  { name: "Jayash Gahlot", role: "Registrations Core" },
  {
    name: "Ankit Joshi",
    role: "Registrations Core",
    links: {
      email: "mailto:ankitjoshi@jklu.edu.in",
      instagram: "https://www.instagram.com/pandat.02/",
      github: "https://github.com/ankit1439",
    },
  },
  { name: "Deepanshu Singh Shekhawat", role: "Sponsorship & Promotions Core" },
  { name: "Ayush Gaur", role: "Design Core" },
];

export interface DevTeamMember {
  name: string;
  avatar: string;
  linkedin: string;
  github: string;
  email: string;
  instagram: string;
}

export const DEV_TEAM: DevTeamMember[] = [
  {
    name: "Devam Gupta",
    avatar:
      "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060383/sabrang-2026/tech-team-credit/Devam-gupta.png",
    linkedin: "https://www.linkedin.com/in/devam-gupta/",
    github: "https://github.com/Devam759",
    email: "devamgupta@jklu.edu.in",
    instagram: "https://www.instagram.com/who.is.devam/",
  },
  {
    name: "Aditya Singh Nayal",
    avatar:
      "https://res.cloudinary.com/eprhemvt/image/upload/v1787494619/Aditya.jpg.jpg",
    linkedin: "https://www.linkedin.com/in/aditya-singh-nayal-5678b3378",
    github: "https://github.com/Aston-09",
    email: "adityasinghnayal@jklu.edu.in",
    instagram: "https://www.instagram.com/aston_axn",
  },
  {
    name: "Kartik Saini",
    avatar:
      "https://res.cloudinary.com/eprhemvt/image/upload/v1787409090/Kartik-Saini.png",
    linkedin: "https://linkedin.com/in/kartik-14saini",
    github: "https://github.com/PrimeKartik",
    email: "kartiksaini@jklu.edu.in",
    instagram: "https://www.instagram.com/kartik_14saini?igsh=dTV2MTc5M2p1bnZq",
  },
  {
    name: "Pratham Lalwani",
    avatar:
      "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060387/sabrang-2026/tech-team-credit/Pratham.png",
    linkedin: "https://www.linkedin.com/in/pratham2k07",
    github: "https://github.com/Pratham2k07",
    email: "prathamlalwani@jklu.edu.in",
    instagram: "https://www.instagram.com/pratham_lalwani05",
  },
  {
    name: "Lakshya Gupta",
    avatar:
      "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060385/sabrang-2026/tech-team-credit/Lakshya.png",
    linkedin: "https://www.linkedin.com/in/lakshya-gupta-b87616370/",
    github: "https://github.com/Metamorpho-1",
    email: "lakshyagupta@jklu.edu.in",
    instagram: "",
  },
  {
    name: "Saurav Tank",
    avatar:
      "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787593525/sabrang-2026/tech-team-credit/g79no6lridril8s3ao6x.jpg",
    linkedin: "https://www.linkedin.com/in/saurav-tank/",
    github: "https://github.com/sauravtank1507",
    email: "sauravtank@jklu.edu.in",
    instagram: "",
  },
  {
    name: "Arihant Jain",
    avatar:
      "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060382/sabrang-2026/tech-team-credit/Arihant-Jain.png",
    linkedin: "https://www.linkedin.com/in/arihant-jain-0a2503383",
    github: "https://github.com/arrieejain3149",
    email: "arihantjain2025@jklu.edu.in",
    instagram: "https://www.instagram.com/arriee.jain/",
  },
  {
    name: "Shubh Dixit",
    avatar:
      "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060392/sabrang-2026/tech-team-credit/Shubh-dixt.png",
    linkedin: "https://www.linkedin.com/in/shubhdixit0912",
    github: "https://github.com/Shubhdix9",
    email: "Shubhdixit@jklu.edu.in",
    instagram: "https://www.instagram.com/shubh_dixit__",
  },
];

export interface FAQItem {
  question: string;
  answer: string;
}

export const FAQS: FAQItem[] = [
  {
    question: "What is Sabrang?",
    answer:
      "Sabrang is the annual cultural festival of JK Lakshmipat University, Jaipur. It features exciting events including dance battles, fashion runways, music band jams, literary slams, e-sports, and celebrity pro-shows over three days.",
  },
  {
    question: "When and where is Sabrang 2026?",
    answer:
      "Sabrang 2026 will be held at JK Lakshmipat University, Mahapura, Ajmer Road, Jaipur, Rajasthan 302026.",
  },
  {
    question: "Who can participate?",
    answer:
      "All college students from recognized universities across India can participate in Sabrang. Some events may have specific eligibility criteria, so please check individual event details.",
  },
  {
    question: "How do I register for events?",
    answer:
      "Create an account on our website, browse the events page, and click \"Register Now\" for any event you're interested in. You'll receive a unique QR code for entry.",
  },
  {
    question: "Is there an entry fee?",
    answer:
      "Entry to the festival is free for JKLU students. External participants may need to pay a nominal registration fee for certain events. Check individual event pages for details.",
  },
  {
    question: "What is the total prize pool?",
    answer:
      "The total prize pool exceeds ₹2.5 Lakhs, distributed across all cultural and flagship events.",
  },
  {
    question: "Can I participate in multiple events?",
    answer:
      "Yes! You can register for as many events as you want, provided there are no scheduling conflicts.",
  },
  {
    question: "Will there be accommodation available?",
    answer:
      "Yes, limited accommodation is available on campus on a first-come, first-served basis. Please contact us in advance to arrange accommodation.",
  },
  {
    question: "Is food available on campus?",
    answer:
      "Absolutely! We'll have a food festival with multiple vendors offering a variety of cuisines. Food courts will be operational throughout the festival.",
  },
  {
    question: "How do I get my QR code?",
    answer:
      "After successful registration for any event, your unique QR code will be available in your dashboard. You can also find the QR string below the code for manual entry.",
  },
  {
    question: "Can I get a refund if I cancel my registration?",
    answer:
      "Refund policies vary by event. Please check the specific event's terms and conditions or contact our support team.",
  },
  {
    question: "Is there parking available?",
    answer:
      "Yes, parking is available on campus for both two-wheelers and four-wheelers. Follow the signage on the day of the event.",
  },
  {
    question: "Are outside food/drinks allowed?",
    answer:
      "Outside food and drinks are not permitted inside the venue. However, we have plenty of food options available at affordable prices.",
  },
  {
    question: "How can I contact the organizing team?",
    answer:
      "You can reach out to the organizing team through our contact page or email us at sabrang@jklu.edu.in.",
  },
  {
    question: "Can I sponsor Sabrang?",
    answer:
      "Yes! We offer various sponsorship packages. Contact our sponsorship team or reach out via our contact page for more details.",
  },
  {
    question: "Will there be live streaming of events?",
    answer:
      "Select events will be live-streamed on our social media channels. Follow us on Instagram and YouTube for updates.",
  },
  {
    question: "What should I bring to the festival?",
    answer:
      "Bring your college ID, registration QR code, comfortable clothes, and lots of energy! Some events may require specific equipment - check event rules.",
  },
];
