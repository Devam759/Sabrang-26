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
    logo: "/white_jklu_logo.png",
  },
  logos: {
    sabrang: "/sabrang-logo.png",
    jkTyre: "/past-sponsors/JK Tyre.png",
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
  {
    name: "Kartik Sharma",
    phone: "+918769329369",
    displayPhone: "+91 87693 29369",
  },
  {
    name: "Rishika Singh",
    phone: "+917300118679",
    displayPhone: "+91 73001 18679",
  },
  {
    name: "Gurseerat Kaur",
    phone: "+917678252871",
    displayPhone: "+91 76782 52871",
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
    src: "/past-sponsors/Chaap Singh.png",
    alt: "Chaap Singh",
    title: "Chaap Singh",
  },
  {
    src: "/past-sponsors/JK Lakshmi Cement.png",
    alt: "JK Lakshmi Cement",
    title: "JK Lakshmi Cement",
  },
  { src: "/past-sponsors/JK Tyre.png", alt: "JK Tyre", title: "JK Tyre" },
  { src: "/past-sponsors/McCain.png", alt: "McCain", title: "McCain" },
  { src: "/past-sponsors/Nescafe.png", alt: "Nescafe", title: "Nescafe" },
  {
    src: "/past-sponsors/The Belgian Waffle Co.png",
    alt: "The Belgian Waffle Co.",
    title: "The Belgian Waffle Co.",
  },
  { src: "/past-sponsors/my fm.png", alt: "MY FM", title: "MY FM" },
  { src: "/past-sponsors/red bull.png", alt: "Red Bull", title: "Red Bull" },
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

export interface GalleryItem {
  id: number;
  src: string;
  title: string;
}

// 96 official festival photographs in randomized sequence
export const GALLERY_IMAGES: GalleryItem[] = [
  { id: 43, src: "/gallery/43.webp", title: "Sabrang Moment" },
  { id: 87, src: "/gallery/87.webp", title: "Sabrang Moment" },
  { id: 96, src: "/gallery/96.webp", title: "Sabrang Moment" },
  { id: 48, src: "/gallery/48.webp", title: "Sabrang Moment" },
  { id: 29, src: "/gallery/29.webp", title: "Sabrang Moment" },
  { id: 28, src: "/gallery/28.webp", title: "Sabrang Moment" },
  { id: 25, src: "/gallery/25.webp", title: "Sabrang Moment" },
  { id: 57, src: "/gallery/57.webp", title: "Sabrang Moment" },
  { id: 78, src: "/gallery/78.webp", title: "Sabrang Moment" },
  { id: 73, src: "/gallery/73.webp", title: "Sabrang Moment" },
  { id: 64, src: "/gallery/64.webp", title: "Sabrang Moment" },
  { id: 7, src: "/gallery/7.webp", title: "Sabrang Moment" },
  { id: 26, src: "/gallery/26.webp", title: "Sabrang Moment" },
  { id: 82, src: "/gallery/82.webp", title: "Sabrang Moment" },
  { id: 83, src: "/gallery/83.webp", title: "Sabrang Moment" },
  { id: 54, src: "/gallery/54.webp", title: "Sabrang Moment" },
  { id: 21, src: "/gallery/21.webp", title: "Sabrang Moment" },
  { id: 86, src: "/gallery/86.webp", title: "Sabrang Moment" },
  { id: 9, src: "/gallery/9.webp", title: "Sabrang Moment" },
  { id: 36, src: "/gallery/36.webp", title: "Sabrang Moment" },
  { id: 94, src: "/gallery/94.webp", title: "Sabrang Moment" },
  { id: 41, src: "/gallery/41.webp", title: "Sabrang Moment" },
  { id: 81, src: "/gallery/81.webp", title: "Sabrang Moment" },
  { id: 1, src: "/gallery/1.webp", title: "Sabrang Moment" },
  { id: 12, src: "/gallery/12.webp", title: "Sabrang Moment" },
  { id: 2, src: "/gallery/2.webp", title: "Sabrang Moment" },
  { id: 67, src: "/gallery/67.webp", title: "Sabrang Moment" },
  { id: 37, src: "/gallery/37.webp", title: "Sabrang Moment" },
  { id: 63, src: "/gallery/63.webp", title: "Sabrang Moment" },
  { id: 10, src: "/gallery/10.webp", title: "Sabrang Moment" },
  { id: 44, src: "/gallery/44.webp", title: "Sabrang Moment" },
  { id: 4, src: "/gallery/4.webp", title: "Sabrang Moment" },
  { id: 76, src: "/gallery/76.webp", title: "Sabrang Moment" },
  { id: 89, src: "/gallery/89.webp", title: "Sabrang Moment" },
  { id: 66, src: "/gallery/66.webp", title: "Sabrang Moment" },
  { id: 56, src: "/gallery/56.webp", title: "Sabrang Moment" },
  { id: 80, src: "/gallery/80.webp", title: "Sabrang Moment" },
  { id: 90, src: "/gallery/90.webp", title: "Sabrang Moment" },
  { id: 70, src: "/gallery/70.webp", title: "Sabrang Moment" },
  { id: 79, src: "/gallery/79.webp", title: "Sabrang Moment" },
  { id: 51, src: "/gallery/51.webp", title: "Sabrang Moment" },
  { id: 32, src: "/gallery/32.webp", title: "Sabrang Moment" },
  { id: 72, src: "/gallery/72.webp", title: "Sabrang Moment" },
  { id: 84, src: "/gallery/84.webp", title: "Sabrang Moment" },
  { id: 8, src: "/gallery/8.webp", title: "Sabrang Moment" },
  { id: 45, src: "/gallery/45.webp", title: "Sabrang Moment" },
  { id: 30, src: "/gallery/30.webp", title: "Sabrang Moment" },
  { id: 93, src: "/gallery/93.webp", title: "Sabrang Moment" },
  { id: 34, src: "/gallery/34.webp", title: "Sabrang Moment" },
  { id: 60, src: "/gallery/60.webp", title: "Sabrang Moment" },
  { id: 47, src: "/gallery/47.webp", title: "Sabrang Moment" },
  { id: 53, src: "/gallery/53.webp", title: "Sabrang Moment" },
  { id: 42, src: "/gallery/42.webp", title: "Sabrang Moment" },
  { id: 91, src: "/gallery/91.webp", title: "Sabrang Moment" },
  { id: 14, src: "/gallery/14.webp", title: "Sabrang Moment" },
  { id: 71, src: "/gallery/71.webp", title: "Sabrang Moment" },
  { id: 18, src: "/gallery/18.webp", title: "Sabrang Moment" },
  { id: 17, src: "/gallery/17.webp", title: "Sabrang Moment" },
  { id: 95, src: "/gallery/95.webp", title: "Sabrang Moment" },
  { id: 46, src: "/gallery/46.webp", title: "Sabrang Moment" },
  { id: 68, src: "/gallery/68.webp", title: "Sabrang Moment" },
  { id: 16, src: "/gallery/16.webp", title: "Sabrang Moment" },
  { id: 27, src: "/gallery/27.webp", title: "Sabrang Moment" },
  { id: 65, src: "/gallery/65.webp", title: "Sabrang Moment" },
  { id: 85, src: "/gallery/85.webp", title: "Sabrang Moment" },
  { id: 75, src: "/gallery/75.webp", title: "Sabrang Moment" },
  { id: 3, src: "/gallery/3.webp", title: "Sabrang Moment" },
  { id: 61, src: "/gallery/61.webp", title: "Sabrang Moment" },
  { id: 58, src: "/gallery/58.webp", title: "Sabrang Moment" },
  { id: 35, src: "/gallery/35.webp", title: "Sabrang Moment" },
  { id: 62, src: "/gallery/62.webp", title: "Sabrang Moment" },
  { id: 24, src: "/gallery/24.webp", title: "Sabrang Moment" },
  { id: 22, src: "/gallery/22.webp", title: "Sabrang Moment" },
  { id: 77, src: "/gallery/77.webp", title: "Sabrang Moment" },
  { id: 31, src: "/gallery/31.webp", title: "Sabrang Moment" },
  { id: 69, src: "/gallery/69.webp", title: "Sabrang Moment" },
  { id: 74, src: "/gallery/74.webp", title: "Sabrang Moment" },
  { id: 50, src: "/gallery/50.webp", title: "Sabrang Moment" },
  { id: 20, src: "/gallery/20.webp", title: "Sabrang Moment" },
  { id: 40, src: "/gallery/40.webp", title: "Sabrang Moment" },
  { id: 6, src: "/gallery/6.webp", title: "Sabrang Moment" },
  { id: 38, src: "/gallery/38.webp", title: "Sabrang Moment" },
  { id: 59, src: "/gallery/59.webp", title: "Sabrang Moment" },
  { id: 11, src: "/gallery/11.webp", title: "Sabrang Moment" },
  { id: 33, src: "/gallery/33.webp", title: "Sabrang Moment" },
  { id: 19, src: "/gallery/19.webp", title: "Sabrang Moment" },
  { id: 92, src: "/gallery/92.webp", title: "Sabrang Moment" },
  { id: 52, src: "/gallery/52.webp", title: "Sabrang Moment" },
  { id: 15, src: "/gallery/15.webp", title: "Sabrang Moment" },
  { id: 5, src: "/gallery/5.webp", title: "Sabrang Moment" },
  { id: 88, src: "/gallery/88.webp", title: "Sabrang Moment" },
  { id: 13, src: "/gallery/13.webp", title: "Sabrang Moment" },
  { id: 55, src: "/gallery/55.webp", title: "Sabrang Moment" },
  { id: 49, src: "/gallery/49.webp", title: "Sabrang Moment" },
  { id: 39, src: "/gallery/39.webp", title: "Sabrang Moment" },
  { id: 23, src: "/gallery/23.webp", title: "Sabrang Moment" },
];
