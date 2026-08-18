/**
 * Gallery Highlights — the festival archive.
 *
 * Presentation lives in components/events/. To add or remove a photograph,
 * edit this array only: the 3D composition, focus order, metadata HUD and the
 * static fallback all derive from it.
 *
 * Drop the matching files into public/events_posters/. Any file that is missing
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
  /** Narrative description shown in the bottom-left overlay when focused. */
  description: string;
};

export const galleryItems: GalleryItem[] = [
  {
    id: 1,
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060209/sabrang-2026/events_posters/PANACHE.webp",
    title: "Panache",
    category: "Fashion",
    venue: "Main Stage",
    year: 2025,
    alt: "Models commanding the neon-lit catwalk at Panache, Sabrang's grand runway event.",
    description:
      "Sabrang's grand runway event — haute couture meets the neon-lit catwalk in a spectacle of fashion and creative expression. Prize pool up to ₹40,000.",
  },
  {
    id: 2,
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060194/sabrang-2026/events_posters/BANDJAM.webp",
    title: "Bandjam",
    category: "Live Music",
    venue: "Amphitheatre",
    year: 2025,
    alt: "Drum kit under spotlight at Bandjam, the ultimate battle of bands.",
    description:
      "The ultimate battle of bands — raw musical talent clashes under the spotlight as bands compete for sonic supremacy. Prize pool up to ₹25,000.",
  },
  {
    id: 3,
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060202/sabrang-2026/events_posters/DANCE_BATTLE.webp",
    title: "Sync",
    category: "Group Dance",
    venue: "Main Stage",
    year: 2025,
    alt: "Synchronized dance crews in motion during the Sync group dance showdown.",
    description:
      "The flagship group dance choreography battle — synchronized crews go head-to-head with power-packed choreography, thematic storytelling, and explosive energy. Prize pool up to ₹35,000.",
  },
  {
    id: 4,
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060210/sabrang-2026/events_posters/STEPUP.webp",
    title: "Step-Up",
    category: "Solo Dance",
    venue: "Main Stage",
    year: 2025,
    alt: "A solo dancer striking a pose at Step-Up, the premier solo dance competition.",
    description:
      "The premier solo dance competition — individual performers command the stage with technical mastery, freestyle finesse, and electric personal expression. Prize pool up to ₹17,000.",
  },
  {
    id: 5,
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060205/sabrang-2026/events_posters/echoesofnoor.webp",
    title: "Echoes of Noor",
    category: "Classical",
    venue: "Auditorium",
    year: 2025,
    alt: "A sitar gleaming under warm light at Echoes of Noor, the classical music evening.",
    description:
      "A soulful evening of classical music and traditional performances that illuminate the spirit of Indian artistry. Prize pool up to ₹17,000.",
  },
  {
    id: 6,
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060214/sabrang-2026/events_posters/VERSVAAD.webp",
    title: "Versvaad",
    category: "Literary",
    venue: "Library Court",
    year: 2025,
    alt: "Poets and storytellers take the stage at Versvaad, the spoken word event.",
    description:
      "Where words ignite — a celebration of poetry, shayari and spoken word that resonates long after the last verse.",
  },
  {
    id: 7,
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060193/sabrang-2026/events_posters/art.webp",
    title: "Art Event",
    category: "Fine Arts",
    venue: "Arts Block",
    year: 2025,
    alt: "Creative works on display at the Sabrang art competition.",
    description:
      "Canvas, colour, and creativity collide — artists bring their visions to life in a showcase of raw talent and imagination.",
  },
  {
    id: 8,
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060195/sabrang-2026/events_posters/bgmi.webp",
    title: "BGMI Tournament",
    category: "E-Sports",
    venue: "Tech Hall",
    year: 2025,
    alt: "Gamers competing in the BGMI e-sports tournament.",
    description:
      "Squad up and drop in — the most intense BGMI showdown on campus with glory and prizes on the line.",
  },
  {
    id: 9,
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060196/sabrang-2026/events_posters/clay.webp",
    title: "Clay Modelling",
    category: "Fine Arts",
    venue: "Arts Block",
    year: 2025,
    alt: "Participants sculpting in the Clay Modelling competition.",
    description:
      "Hands meet earth — sculpt, shape and create as raw clay transforms into works of art under the clock.",
  },
  {
    id: 10,
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060197/sabrang-2026/events_posters/convo.webp",
    title: "Convo",
    category: "Speaking",
    venue: "Auditorium",
    year: 2025,
    alt: "Speakers engaging the audience at Convo, the public speaking event.",
    description:
      "The stage is yours — articulate, persuade, and captivate in this battle of wits and eloquence.",
  },
  {
    id: 11,
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060199/sabrang-2026/events_posters/courtroom.webp",
    title: "Courtroom",
    category: "Debate",
    venue: "Moot Court",
    year: 2025,
    alt: "Participants debating at Courtroom, the mock trial event.",
    description:
      "Order in the court — argue your case, cross-examine witnesses, and deliver the verdict in this gripping mock trial.",
  },
  {
    id: 12,
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060203/sabrang-2026/events_posters/deal.webp",
    title: "Deal",
    category: "Business",
    venue: "Seminar Hall",
    year: 2025,
    alt: "Participants negotiating at Deal, the business simulation event.",
    description:
      "Negotiate, strategise, and close the deal — a high-stakes business simulation where every decision counts.",
  },
  {
    id: 13,
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060204/sabrang-2026/events_posters/dumb.webp",
    title: "Dumb Charades",
    category: "Fun",
    venue: "Central Lawn",
    year: 2025,
    alt: "Teams acting and guessing at Dumb Charades.",
    description:
      "No words, all action — act it out, guess fast, and let the laughter take over in this classic crowd favourite.",
  },
  {
    id: 14,
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060206/sabrang-2026/events_posters/focus.webp",
    title: "Focus",
    category: "Photography",
    venue: "Campus",
    year: 2025,
    alt: "A photographer capturing moments at Focus, the photography competition.",
    description:
      "See the world through a different lens — capture fleeting moments and tell stories that a thousand words cannot.",
  },
  {
    id: 15,
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060208/sabrang-2026/events_posters/freefire.webp",
    title: "Free Fire Tournament",
    category: "E-Sports",
    venue: "Tech Hall",
    year: 2025,
    alt: "Gamers battling it out in the Free Fire e-sports tournament.",
    description:
      "Drop, loot, and survive — the ultimate Free Fire showdown where only the last squad standing claims victory.",
  },
  {
    id: 16,
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060212/sabrang-2026/events_posters/valo.webp",
    title: "Valorant Tournament",
    category: "E-Sports",
    venue: "Tech Hall",
    year: 2025,
    alt: "Teams competing in the Valorant e-sports tournament.",
    description:
      "Clutch or kick — tactical precision meets raw aim in the most anticipated Valorant tournament of the fest.",
  },
  {
    id: 17,
    image: "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060215/sabrang-2026/events_posters/wicket.webp",
    title: "Wicket",
    category: "Sports",
    venue: "Sports Ground",
    year: 2025,
    alt: "Cricket action at Wicket, the inter-college cricket tournament.",
    description:
      "Boundaries, wickets, and glory — the cricket pitch comes alive as teams battle for the Sabrang trophy.",
  },
];
