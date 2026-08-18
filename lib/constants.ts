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
    sabrang: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060370/sabrang-2026/sabrang-logo/sabrang-logo.png",
    jkTyre: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060362/sabrang-2026/past-sponsors/JK-Tyre.png",
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
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787084250/sabrang-2026/team/kartik-sharma.jpg",
  },
  {
    name: "Rishika Singh",
    phone: "+917300118679",
    displayPhone: "+91 73001 18679",
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787084258/sabrang-2026/team/rishika-singh.png",
  },
  {
    name: "Gurseerat Kaur",
    phone: "+917678252871",
    displayPhone: "+91 76782 52871",
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787084247/sabrang-2026/team/gurseerat-kaur.jpg",
  },
  {
    name: "Pratigya Bomb",
    phone: "+916264667506",
    displayPhone: "+91 62646 67506",
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
  { src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060362/sabrang-2026/past-sponsors/JK-Tyre.png", alt: "JK Tyre", title: "JK Tyre" },
  { src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060363/sabrang-2026/past-sponsors/McCain.png", alt: "McCain", title: "McCain" },
  { src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060365/sabrang-2026/past-sponsors/Nescafe.png", alt: "Nescafe", title: "Nescafe" },
  {
    src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060367/sabrang-2026/past-sponsors/The-Belgian-Waffle-Co.png",
    alt: "The Belgian Waffle Co.",
    title: "The Belgian Waffle Co.",
  },
  { src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060364/sabrang-2026/past-sponsors/my-fm.png", alt: "MY FM", title: "MY FM" },
  { src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060366/sabrang-2026/past-sponsors/red-bull.png", alt: "Red Bull", title: "Red Bull" },
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
// tail lifetime ≈ segments / 60fps: 12–42 lands the longest tail at ~0.7s.
export const CURSOR_TRAIL_MIN_SEGMENTS = 12;
export const CURSOR_TRAIL_MAX_SEGMENTS = 42;
// Idle delay before the trail starts wandering on its own.
export const CURSOR_TRAIL_IDLE_MS = 1200;

export interface GalleryItem {
  id: number;
  src: string;
  title: string;
}

// 96 official festival photographs in randomized sequence
export const GALLERY_IMAGES: GalleryItem[] = [
  { id: 43, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060269/sabrang-2026/gallery/43.webp", title: "Sabrang Moment" },
  { id: 87, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060341/sabrang-2026/gallery/87.webp", title: "Sabrang Moment" },
  { id: 96, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060353/sabrang-2026/gallery/96.webp", title: "Sabrang Moment" },
  { id: 48, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060275/sabrang-2026/gallery/48.webp", title: "Sabrang Moment" },
  { id: 29, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060248/sabrang-2026/gallery/29.webp", title: "Sabrang Moment" },
  { id: 28, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060247/sabrang-2026/gallery/28.webp", title: "Sabrang Moment" },
  { id: 25, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060243/sabrang-2026/gallery/25.webp", title: "Sabrang Moment" },
  { id: 57, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060290/sabrang-2026/gallery/57.webp", title: "Sabrang Moment" },
  { id: 78, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060325/sabrang-2026/gallery/78.webp", title: "Sabrang Moment" },
  { id: 73, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060319/sabrang-2026/gallery/73.webp", title: "Sabrang Moment" },
  { id: 64, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060303/sabrang-2026/gallery/64.webp", title: "Sabrang Moment" },
  { id: 7, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060312/sabrang-2026/gallery/7.webp", title: "Sabrang Moment" },
  { id: 26, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060244/sabrang-2026/gallery/26.webp", title: "Sabrang Moment" },
  { id: 82, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060334/sabrang-2026/gallery/82.webp", title: "Sabrang Moment" },
  { id: 83, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060335/sabrang-2026/gallery/83.webp", title: "Sabrang Moment" },
  { id: 54, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060285/sabrang-2026/gallery/54.webp", title: "Sabrang Moment" },
  { id: 21, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060237/sabrang-2026/gallery/21.webp", title: "Sabrang Moment" },
  { id: 86, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060340/sabrang-2026/gallery/86.webp", title: "Sabrang Moment" },
  { id: 9, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060345/sabrang-2026/gallery/9.webp", title: "Sabrang Moment" },
  { id: 36, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060258/sabrang-2026/gallery/36.webp", title: "Sabrang Moment" },
  { id: 94, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060351/sabrang-2026/gallery/94.webp", title: "Sabrang Moment" },
  { id: 41, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060267/sabrang-2026/gallery/41.webp", title: "Sabrang Moment" },
  { id: 81, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060333/sabrang-2026/gallery/81.webp", title: "Sabrang Moment" },
  { id: 1, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060216/sabrang-2026/gallery/1.webp", title: "Sabrang Moment" },
  { id: 12, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060220/sabrang-2026/gallery/12.webp", title: "Sabrang Moment" },
  { id: 2, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060233/sabrang-2026/gallery/2.webp", title: "Sabrang Moment" },
  { id: 67, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060307/sabrang-2026/gallery/67.webp", title: "Sabrang Moment" },
  { id: 37, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060260/sabrang-2026/gallery/37.webp", title: "Sabrang Moment" },
  { id: 63, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060301/sabrang-2026/gallery/63.webp", title: "Sabrang Moment" },
  { id: 10, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060217/sabrang-2026/gallery/10.webp", title: "Sabrang Moment" },
  { id: 44, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060271/sabrang-2026/gallery/44.webp", title: "Sabrang Moment" },
  { id: 4, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060264/sabrang-2026/gallery/4.webp", title: "Sabrang Moment" },
  { id: 76, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060323/sabrang-2026/gallery/76.webp", title: "Sabrang Moment" },
  { id: 89, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060343/sabrang-2026/gallery/89.webp", title: "Sabrang Moment" },
  { id: 66, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060306/sabrang-2026/gallery/66.webp", title: "Sabrang Moment" },
  { id: 56, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060288/sabrang-2026/gallery/56.webp", title: "Sabrang Moment" },
  { id: 80, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060331/sabrang-2026/gallery/80.webp", title: "Sabrang Moment" },
  { id: 90, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060346/sabrang-2026/gallery/90.webp", title: "Sabrang Moment" },
  { id: 70, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060315/sabrang-2026/gallery/70.webp", title: "Sabrang Moment" },
  { id: 79, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060327/sabrang-2026/gallery/79.webp", title: "Sabrang Moment" },
  { id: 51, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060280/sabrang-2026/gallery/51.webp", title: "Sabrang Moment" },
  { id: 32, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060253/sabrang-2026/gallery/32.webp", title: "Sabrang Moment" },
  { id: 72, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060318/sabrang-2026/gallery/72.webp", title: "Sabrang Moment" },
  { id: 84, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060336/sabrang-2026/gallery/84.webp", title: "Sabrang Moment" },
  { id: 8, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060328/sabrang-2026/gallery/8.webp", title: "Sabrang Moment" },
  { id: 45, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060272/sabrang-2026/gallery/45.webp", title: "Sabrang Moment" },
  { id: 30, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060250/sabrang-2026/gallery/30.webp", title: "Sabrang Moment" },
  { id: 93, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060349/sabrang-2026/gallery/93.webp", title: "Sabrang Moment" },
  { id: 34, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060256/sabrang-2026/gallery/34.webp", title: "Sabrang Moment" },
  { id: 60, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060295/sabrang-2026/gallery/60.webp", title: "Sabrang Moment" },
  { id: 47, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060274/sabrang-2026/gallery/47.webp", title: "Sabrang Moment" },
  { id: 53, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060283/sabrang-2026/gallery/53.webp", title: "Sabrang Moment" },
  { id: 42, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060268/sabrang-2026/gallery/42.webp", title: "Sabrang Moment" },
  { id: 91, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060347/sabrang-2026/gallery/91.webp", title: "Sabrang Moment" },
  { id: 14, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060223/sabrang-2026/gallery/14.webp", title: "Sabrang Moment" },
  { id: 71, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060317/sabrang-2026/gallery/71.webp", title: "Sabrang Moment" },
  { id: 18, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060230/sabrang-2026/gallery/18.webp", title: "Sabrang Moment" },
  { id: 17, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060229/sabrang-2026/gallery/17.webp", title: "Sabrang Moment" },
  { id: 95, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060352/sabrang-2026/gallery/95.webp", title: "Sabrang Moment" },
  { id: 46, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060273/sabrang-2026/gallery/46.webp", title: "Sabrang Moment" },
  { id: 68, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060309/sabrang-2026/gallery/68.webp", title: "Sabrang Moment" },
  { id: 16, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060227/sabrang-2026/gallery/16.webp", title: "Sabrang Moment" },
  { id: 27, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060246/sabrang-2026/gallery/27.webp", title: "Sabrang Moment" },
  { id: 65, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060305/sabrang-2026/gallery/65.webp", title: "Sabrang Moment" },
  { id: 85, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060338/sabrang-2026/gallery/85.webp", title: "Sabrang Moment" },
  { id: 75, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060321/sabrang-2026/gallery/75.webp", title: "Sabrang Moment" },
  { id: 3, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060249/sabrang-2026/gallery/3.webp", title: "Sabrang Moment" },
  { id: 61, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060297/sabrang-2026/gallery/61.webp", title: "Sabrang Moment" },
  { id: 58, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060291/sabrang-2026/gallery/58.webp", title: "Sabrang Moment" },
  { id: 35, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060257/sabrang-2026/gallery/35.webp", title: "Sabrang Moment" },
  { id: 62, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060300/sabrang-2026/gallery/62.webp", title: "Sabrang Moment" },
  { id: 24, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060242/sabrang-2026/gallery/24.webp", title: "Sabrang Moment" },
  { id: 22, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060239/sabrang-2026/gallery/22.webp", title: "Sabrang Moment" },
  { id: 77, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060324/sabrang-2026/gallery/77.webp", title: "Sabrang Moment" },
  { id: 31, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060252/sabrang-2026/gallery/31.webp", title: "Sabrang Moment" },
  { id: 69, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060310/sabrang-2026/gallery/69.webp", title: "Sabrang Moment" },
  { id: 74, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060320/sabrang-2026/gallery/74.webp", title: "Sabrang Moment" },
  { id: 50, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060279/sabrang-2026/gallery/50.webp", title: "Sabrang Moment" },
  { id: 20, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060236/sabrang-2026/gallery/20.webp", title: "Sabrang Moment" },
  { id: 40, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060266/sabrang-2026/gallery/40.webp", title: "Sabrang Moment" },
  { id: 6, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060294/sabrang-2026/gallery/6.webp", title: "Sabrang Moment" },
  { id: 38, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060261/sabrang-2026/gallery/38.webp", title: "Sabrang Moment" },
  { id: 59, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060292/sabrang-2026/gallery/59.webp", title: "Sabrang Moment" },
  { id: 11, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060219/sabrang-2026/gallery/11.webp", title: "Sabrang Moment" },
  { id: 33, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060255/sabrang-2026/gallery/33.webp", title: "Sabrang Moment" },
  { id: 19, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060231/sabrang-2026/gallery/19.webp", title: "Sabrang Moment" },
  { id: 92, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060348/sabrang-2026/gallery/92.webp", title: "Sabrang Moment" },
  { id: 52, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060282/sabrang-2026/gallery/52.webp", title: "Sabrang Moment" },
  { id: 15, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060225/sabrang-2026/gallery/15.webp", title: "Sabrang Moment" },
  { id: 5, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060278/sabrang-2026/gallery/5.webp", title: "Sabrang Moment" },
  { id: 88, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060342/sabrang-2026/gallery/88.webp", title: "Sabrang Moment" },
  { id: 13, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060222/sabrang-2026/gallery/13.webp", title: "Sabrang Moment" },
  { id: 55, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060287/sabrang-2026/gallery/55.webp", title: "Sabrang Moment" },
  { id: 49, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060277/sabrang-2026/gallery/49.webp", title: "Sabrang Moment" },
  { id: 39, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060262/sabrang-2026/gallery/39.webp", title: "Sabrang Moment" },
  { id: 23, src: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060240/sabrang-2026/gallery/23.webp", title: "Sabrang Moment" },
];
