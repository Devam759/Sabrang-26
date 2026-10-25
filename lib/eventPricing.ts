/**
 * Sabrang 2026 - Official Events Catalog & Authoritative Pricing Matrix
 * Single source of truth for events, team rules, prize pools, and registration pricing.
 */

export interface SabrangEvent {
  id: string;
  title: string;
  subtitle: string;
  category:
  | "Flagship Events - Team"
  | "Flagship Events - Solo / Duo"
  | "Non-Flagship - Esports"
  | "Non-Flagship - Other Events"
  | "Activities - Gifts & Hampers"
  | "General Entry";
  minTeam: number;
  maxTeam: number;
  baseIncludedMembers: number;
  basePrice: number;
  earlyBirdPrice?: number;
  price: number;
  extraMemberFee: number;
  earlyBirdExtraMemberFee?: number;
  isTeam: boolean;
  type: "generic" | "bgmi" | "valorant" | "freefire" | "visitor";
  pricingLabel: string;
  earlyBirdPricingLabel?: string;
  day?: 1 | 2 | 3;
  isRegistrationClosed?: boolean;
  prizes: {
    winnerCash?: number | string;
    runnerUpCash?: number | string;
    totalCash?: number;
    remarks?: string;
  };
}

export const VAAD_VIVAAD_REPRESENTATIVES = [
  "Narendra Modi",
  "Rahul Gandhi",
  "Amit Shah",
  "Rajnath Singh",
  "Nitin Gadkari",
  "Piyush Goyal",
  "Kiren Rijiju",
  "Shashi Tharoor",
  "Asaduddin Owaisi",
  "Mahua Moitra",
  "Supriya Sule",
  "Dimple Yadav",
  "Akhilesh Yadav",
  "Hema Malini",
  "Kangana Ranaut",
  "Manoj Tiwari",
  "Ravi Kishan",
  "Kanhaiya Kumar",
  "Gaurav Gogoi",
  "Derek O’Brien",
  "Abhishek Banerjee",
  "Saugata Roy",
  "Dayanidhi Maran",
  "Kanimozhi Karunanidhi",
  "T. R. Baalu",
  "Chirag Paswan",
  "Anurag Thakur",
  "Tejasvi Surya",
  "Mahua Maji",
  "Arjun Ram Meghwal",
  "Ravish Kumar",
  "Rajdeep Sardesai",
  "Barkha Dutt",
  "Shekhar Gupta",
  "Arnab Goswami",
  "Nidhi Razdan",
  "Sagarika Ghose",
  "Faye D’Souza",
  "Karan Thapar",
  "Anubha Bhonsle",
] as const;

export const FACE_OFF_STYLES = [
  "Rep your Style",
  "Hip Hop",
] as const;

export type FaceOffStyle = (typeof FACE_OFF_STYLES)[number];

const RAW_EVENTS: Omit<SabrangEvent, 'price'>[] = [
  // --- Flagship Events - Team ---
  {
    id: "panache",
    title: "Panache",
    subtitle: "Haute Couture Runway Show",
    category: "Flagship Events - Team",
    minTeam: 6,
    maxTeam: 20,
    baseIncludedMembers: 1,
    basePrice: 399,
    extraMemberFee: 399,
    isTeam: true,
    type: "generic",
    pricingLabel: "₹399 per head",
    prizes: {
      winnerCash: 21000,
      runnerUpCash: 14000,
      totalCash: 35000,
    },
  },
  {
    id: "sync",
    title: "SYNC",
    subtitle: "Group Dance Showdown",
    category: "Flagship Events - Team",
    minTeam: 8,
    maxTeam: 25,
    baseIncludedMembers: 1,
    basePrice: 399,
    extraMemberFee: 399,
    isTeam: true,
    type: "generic",
    pricingLabel: "₹399 per head",
    prizes: {
      winnerCash: 21000,
      runnerUpCash: 14000,
      totalCash: 35000,
    },
  },
  {
    id: "bandjam",
    title: "Band Jam",
    subtitle: "Battle of the Bands",
    category: "Flagship Events - Team",
    minTeam: 4,
    maxTeam: 10,
    baseIncludedMembers: 1,
    basePrice: 399,
    extraMemberFee: 399,
    isTeam: true,
    type: "generic",
    pricingLabel: "₹399 per head",
    prizes: {
      winnerCash: 15000,
      runnerUpCash: 10000,
      totalCash: 25000,
    },
  },

  // --- Flagship Events - Solo / Duo ---
  {
    id: "step_up",
    title: "Step Up",
    subtitle: "Solo Dance Competition",
    category: "Flagship Events - Solo / Duo",
    minTeam: 1,
    maxTeam: 1,
    baseIncludedMembers: 1,
    basePrice: 449,
    extraMemberFee: 0,
    isTeam: false,
    type: "generic",
    pricingLabel: "₹449 per head",
    prizes: {
      winnerCash: 9000,
      runnerUpCash: 6000,
      totalCash: 15000,
    },
  },
  {
    id: "persona",
    title: "Personna",
    subtitle: "Solo/Duo Performance",
    category: "Flagship Events - Solo / Duo",
    minTeam: 1,
    maxTeam: 1,
    baseIncludedMembers: 1,
    basePrice: 449,
    extraMemberFee: 0,
    isTeam: false,
    type: "generic",
    pricingLabel: "₹449 per head",
    prizes: {
      winnerCash: 9000,
      runnerUpCash: 6000,
      totalCash: 15000,
    },
  },
  {
    id: "echoes_of_noor",
    title: "Echoes of Noor",
    subtitle: "Sufi Night & Acoustic Melodies",
    category: "Flagship Events - Solo / Duo",
    minTeam: 1,
    maxTeam: 1,
    baseIncludedMembers: 1,
    basePrice: 449,
    extraMemberFee: 0,
    isTeam: false,
    type: "generic",
    pricingLabel: "₹449 per head",
    prizes: {
      winnerCash: 9000,
      runnerUpCash: 6000,
      totalCash: 15000,
    },
  },
  {
    id: "versevaad",
    title: "Verse Vaad",
    subtitle: "Poetry Slam & Literary Debates",
    category: "Flagship Events - Solo / Duo",
    minTeam: 1,
    maxTeam: 1,
    baseIncludedMembers: 1,
    basePrice: 449,
    extraMemberFee: 0,
    isTeam: false,
    type: "generic",
    pricingLabel: "₹449 per head",
    prizes: {
      winnerCash: 9000,
      runnerUpCash: 6000,
      totalCash: 15000,
    },
  },

  // --- Non-Flagship - Esports ---
  {
    id: "bgmi",
    title: "BGMI",
    subtitle: "Battlegrounds Mobile India Tournament",
    category: "Non-Flagship - Esports",
    minTeam: 4,
    maxTeam: 5,
    baseIncludedMembers: 5,
    basePrice: 0,
    extraMemberFee: 0,
    isTeam: true,
    type: "bgmi",
    pricingLabel: "Free",
    prizes: {
      winnerCash: "As per Krafton",
      runnerUpCash: "As per Krafton",
      totalCash: 20000,
      remarks: "Free Registration",
    },
  },
  {
    id: "freefire",
    title: "Free Fire",
    subtitle: "Free Fire Mobile Esports Tournament",
    category: "Non-Flagship - Esports",
    minTeam: 4,
    maxTeam: 5,
    baseIncludedMembers: 5,
    basePrice: 0,
    extraMemberFee: 0,
    isTeam: true,
    type: "freefire",
    pricingLabel: "Free",
    prizes: {
      winnerCash: 7000,
      runnerUpCash: 5000,
      totalCash: 12000,
      remarks: "Free Registration",
    },
  },
  {
    id: "valorant",
    title: "Valorant",
    subtitle: "5v5 PC Tactical FPS Tournament",
    category: "Non-Flagship - Esports",
    minTeam: 5,
    maxTeam: 5,
    baseIncludedMembers: 5,
    basePrice: 349,
    extraMemberFee: 0,
    isTeam: true,
    type: "valorant",
    pricingLabel: "₹349 per team",
    prizes: {
      winnerCash: 6000,
      runnerUpCash: 4000,
      totalCash: 10000,
      remarks: "Fee is per team",
    },
  },
  {
    id: "real_cricket",
    title: "Real Cricket",
    subtitle: "Mobile Cricket Esports Tournament",
    category: "Non-Flagship - Esports",
    minTeam: 1,
    maxTeam: 1,
    baseIncludedMembers: 1,
    basePrice: 0,
    extraMemberFee: 0,
    isTeam: false,
    type: "generic",
    pricingLabel: "Free",
    prizes: {
      winnerCash: "As per Krafton",
      runnerUpCash: "As per Krafton",
      totalCash: 5000,
      remarks: "Free Registration",
    },
  },

  // --- Non-Flagship - Other Events ---

  {
    id: "faceoff_rep_your_style",
    title: "Faceoff (Rep your Style)",
    subtitle: "Street Dance Face Off - Rep your Style (Solo)",
    category: "Non-Flagship - Other Events",
    minTeam: 1,
    maxTeam: 1,
    baseIncludedMembers: 1,
    basePrice: 299,
    extraMemberFee: 0,
    isTeam: false,
    type: "generic",
    pricingLabel: "₹299 per head",
    prizes: {
      winnerCash: 6000,
      totalCash: 6000,
      remarks: "Rep Your Style Solo Dance Battle (Winner takes all)",
    },
  },
  {
    id: "courtroom",
    title: "Court Room",
    subtitle: "Mock Trial & Legal Battle",
    category: "Non-Flagship - Other Events",
    minTeam: 2,
    maxTeam: 4,
    baseIncludedMembers: 4,
    basePrice: 399,
    extraMemberFee: 0,
    isTeam: true,
    type: "generic",
    pricingLabel: "₹399 per team",
    prizes: {
      winnerCash: 6000,
      runnerUpCash: 4000,
      totalCash: 10000,
      remarks: "Fee is per team",
    },
  },
  {
    id: "bidding",
    title: "Bidding Before Wicket",
    subtitle: "IPL Mock Cricket Auction",
    category: "Non-Flagship - Other Events",
    minTeam: 3,
    maxTeam: 5,
    baseIncludedMembers: 5,
    basePrice: 399,
    extraMemberFee: 0,
    isTeam: true,
    type: "generic",
    pricingLabel: "₹399 per team",
    prizes: {
      winnerCash: 6000,
      runnerUpCash: 4000,
      totalCash: 10000,
      remarks: "Fee is per team",
    },
  },
  {
    id: "dumb_show",
    title: "Dumb Show",
    subtitle: "Mime & Dumb Charades",
    category: "Non-Flagship - Other Events",
    minTeam: 3,
    maxTeam: 3,
    baseIncludedMembers: 1,
    basePrice: 199,
    extraMemberFee: 199,
    isTeam: true,
    type: "generic",
    pricingLabel: "₹199 per head",
    prizes: {
      winnerCash: 4000,
      runnerUpCash: 3000,
      totalCash: 7000,
      remarks: "Fee is per head",
    },
  },
  {
    id: "vaad_vivaad",
    title: "Vaad Vivaad",
    subtitle: "Conventional Debate Competition (Solo)",
    category: "Non-Flagship - Other Events",
    minTeam: 1,
    maxTeam: 1,
    baseIncludedMembers: 1,
    basePrice: 299,
    extraMemberFee: 0,
    isTeam: false,
    type: "generic",
    pricingLabel: "₹299 per head",
    prizes: {
      winnerCash: 3500,
      runnerUpCash: 2500,
      totalCash: 6000,
    },
  },
  {
    id: "anime_quiz",
    title: "Anime Quiz",
    subtitle: "Ultimate Otaku Trivia Challenge",
    category: "Non-Flagship - Other Events",
    minTeam: 2,
    maxTeam: 2,
    baseIncludedMembers: 1,
    basePrice: 149,
    extraMemberFee: 149,
    isTeam: true,
    type: "generic",
    pricingLabel: "₹149 per head",
    prizes: {
      winnerCash: 3000,
      runnerUpCash: 2000,
      totalCash: 5000,
    },
  },



  // --- General Entry ---
  {
    id: "visitor",
    title: "Visitor Pass",
    subtitle: "Festival Entry (Does not include access to Pro-Nite and Concert)",
    category: "General Entry",
    minTeam: 1,
    maxTeam: 1,
    baseIncludedMembers: 1,
    basePrice: 69,
    extraMemberFee: 0,
    isTeam: false,
    type: "visitor",
    pricingLabel: "₹69 per pass",
    prizes: { remarks: "Standard Visitor Pass (Does not include access to Pro-Nite and Concert)" },
  },
  {
    id: "pronite_outsider",
    title: "PRO-NITE & Concert (All 3 Days) - Outsiders",
    subtitle: "Full-day access for all 3 days, including PRO-NITE & Concert",
    category: "General Entry",
    minTeam: 1,
    maxTeam: 1,
    baseIncludedMembers: 1,
    basePrice: 499,
    extraMemberFee: 0,
    isTeam: false,
    type: "generic",
    pricingLabel: "₹499 per pass",
    prizes: { remarks: "Outsider pass (Valid for all 3 days)" },
  },
  {
    id: "pronite_jklu",
    title: "PRO-NITE & Concert (All 3 Days) - JKLU",
    subtitle: "Full-day access for all 3 days, including PRO-NITE & Concert",
    category: "General Entry",
    minTeam: 1,
    maxTeam: 1,
    baseIncludedMembers: 1,
    basePrice: 299,
    extraMemberFee: 0,
    isTeam: false,
    type: "generic",
    pricingLabel: "₹299 per pass",
    prizes: { remarks: "JKLU student pass (Valid for all 3 days)" },
  }
];

export const EVENT_SCHEDULE_DAYS: Record<string, 1 | 2 | 3> = {
  panache: 1,
  persona: 1,
  echoes_of_noor: 1,
  dumb_show: 1,
  bgmi: 1,
  freefire: 3,
  valorant: 1,
  real_cricket: 1,
  sync: 2,
  bandjam: 2,
  step_up: 2,
  courtroom: 2,
  bidding: 2,
  anime_quiz: 2,
  faceoff_rep_your_style: 3,
  versevaad: 3,
  vaad_vivaad: 3,
  visitor: 3,
  pronite_outsider: 3,
  pronite_jklu: 3,
};

export const CLOSED_EVENT_IDS = new Set<string>([
  "panache",
  "persona",
  "echoes_of_noor",
  "dumb_show",
  "bgmi",
  "valorant",
  "sync",
  "bandjam",
  "step_up",
  "courtroom",
  "bidding",
  "anime_quiz",
]);

export function isEventRegistrationClosed(eventId: string): boolean {
  if (!eventId) return false;
  return CLOSED_EVENT_IDS.has(eventId.toLowerCase().trim());
}

export function getEventDay(eventId: string): 1 | 2 | 3 {
  if (!eventId) return 3;
  return EVENT_SCHEDULE_DAYS[eventId.toLowerCase().trim()] || 3;
}

export const OFFICIAL_EVENTS: SabrangEvent[] = RAW_EVENTS.map((e) => ({
  ...e,
  price: e.basePrice,
  day: EVENT_SCHEDULE_DAYS[e.id] || 3,
  isRegistrationClosed: CLOSED_EVENT_IDS.has(e.id),
}));

export const EVENT_BY_ID: Record<string, SabrangEvent> = Object.fromEntries(
  OFFICIAL_EVENTS.map((e) => [e.id, e])
);

export function getEventById(id: string): SabrangEvent | undefined {
  return EVENT_BY_ID[id];
}

export const FESTIVAL_DAYS = [
  { id: "day1", label: "Day 1", date: "Oct 23", ended: true },
  { id: "day2", label: "Day 2", date: "Oct 24", ended: true },
  { id: "day3", label: "Day 3", date: "Oct 25", ended: false },
] as const;

export type FestivalDayId = (typeof FESTIVAL_DAYS)[number]["id"];

export interface VisitorPassConfig {
  count: number;
  days: string[];
}

export function calculateVisitorPassFee(count: number, daysCount: number): number {
  const people = Math.max(1, count || 1);
  const days = Math.max(1, daysCount || 1);
  return people * days * 69;
}

export function calculateVisitorBandFee(daysCount: number, visitorCount: number = 1): number {
  const days = Math.max(1, daysCount || 1);
  const people = Math.max(1, visitorCount || 1);
  return FLAGSHIP_BAND_FEE_PER_PERSON * days * people;
}

/**
 * Calculates the exact price for a given event given the number of team members (leader + extra members)
 * and optional visitorConfig for visitor passes.
 */
export function calculateEventItemPrice(
  event: SabrangEvent,
  totalMembers: number = 1,
  visitorConfig?: VisitorPassConfig,
  isEarlyBird?: boolean
): number {
  if (event.id === "visitor") {
    const count = visitorConfig?.count ?? totalMembers ?? 1;
    const daysCount = visitorConfig?.days?.length ?? 1;
    return calculateVisitorPassFee(count, daysCount);
  }

  if (!event.isTeam) {
    return (isEarlyBird && event.earlyBirdPrice !== undefined) ? event.earlyBirdPrice : event.basePrice;
  }
  // Esports are flat per team
  if (event.type === "bgmi" || event.type === "freefire" || event.type === "valorant") {
    return (isEarlyBird && event.earlyBirdPrice !== undefined) ? event.earlyBirdPrice : event.basePrice;
  }
  // Fixed team (e.g. Dumb Show 3)
  if (event.extraMemberFee === 0) {
    return (isEarlyBird && event.earlyBirdPrice !== undefined) ? event.earlyBirdPrice : event.basePrice;
  }
  // Base covers up to baseIncludedMembers
  const members = Math.max(1, totalMembers);
  const extraCount = Math.max(0, members - event.baseIncludedMembers);
  const base = (isEarlyBird && event.earlyBirdPrice !== undefined) ? event.earlyBirdPrice : event.basePrice;
  const extra = (isEarlyBird && event.earlyBirdExtraMemberFee !== undefined) ? event.earlyBirdExtraMemberFee : event.extraMemberFee;
  return base + extraCount * extra;
}

/**
 * Checks if an event uses a per-head fee collection system.
 * Competitive/showcase events (Flagship, Non-Flagship, Activities) where registration
 * is charged per individual have a per-head fee, while Esports is charged per team flat.
 */
export function isPerHeadFeeEvent(event: SabrangEvent): boolean {
  if (!event) return false;
  // Esports events are flat per team
  if (event.type === "bgmi" || event.type === "freefire" || event.type === "valorant") {
    return false;
  }
  // Visitor pass and general entry passes
  if (event.id === "visitor" || event.category === "General Entry") {
    return false;
  }
  // Check pricing label
  return event.pricingLabel?.toLowerCase().includes("per head") ?? false;
}

/**
 * Gets the standard per-head fee for an event (respects early bird if active).
 */
export function getEventPerHeadFee(event: SabrangEvent, isEarlyBird?: boolean): number {
  if (isEarlyBird && event.earlyBirdPrice !== undefined) {
    return event.earlyBirdPrice;
  }
  return event.basePrice;
}

/**
 * Calculates event item price, optionally capping the per-head fee if the event has a per-head fee collection system.
 */
export function calculateEventItemPriceWithCap(
  event: SabrangEvent,
  totalMembers: number = 1,
  visitorConfig?: VisitorPassConfig,
  isEarlyBird?: boolean,
  perHeadCap?: number
): number {
  if (perHeadCap !== undefined && perHeadCap >= 0 && isPerHeadFeeEvent(event)) {
    const regularPerHead = getEventPerHeadFee(event, isEarlyBird);
    const effectivePerHead = Math.min(regularPerHead, perHeadCap);
    const members = !event.isTeam ? 1 : Math.max(1, totalMembers);
    return members * effectivePerHead;
  }
  return calculateEventItemPrice(event, totalMembers, visitorConfig, isEarlyBird);
}

export const FLAGSHIP_BAND_FEE_PER_PERSON = 7;
export const FLAGSHIP_BANK_FEE_PER_PERSON = FLAGSHIP_BAND_FEE_PER_PERSON;
export const FLAGSHIP_TEAM_BANK_FEE_PER_PERSON = FLAGSHIP_BAND_FEE_PER_PERSON;
export const FLAGSHIP_TEAM_BANK_CHARGE_PER_PERSON = FLAGSHIP_BAND_FEE_PER_PERSON;
export const FLAGSHIP_TEAM_BAND_CHARGE_PER_PERSON = FLAGSHIP_BAND_FEE_PER_PERSON;

/**
 * Checks if Band Fee (₹7/person) applies to an event:
 * Flagship Team, Flagship Solo, and Pro-Nite & Concert passes (Outsiders & JKLU).
 */
export function isBandFeeApplicable(event?: SabrangEvent | null): boolean {
  if (!event) return false;
  return (
    event.category === "Flagship Events - Team" ||
    event.category === "Flagship Events - Solo / Duo" ||
    event.id === "pronite_outsider" ||
    event.id === "pronite_jklu"
  );
}

/**
 * Checks if an event belongs to Flagship category or Pro-Nite passes that require band fee
 */
export function isFlagshipEvent(event?: SabrangEvent | null): boolean {
  return isBandFeeApplicable(event);
}

/**
 * Checks if an event belongs to Flagship Team category (Panache, SYNC, Band Jam)
 */
export function isFlagshipTeamEvent(event?: SabrangEvent | null): boolean {
  if (!event) return false;
  return event.category === "Flagship Events - Team";
}

/**
 * Checks if an event belongs to Flagship Solo category (Step Up, Personna, Echoes of Noor, Verse Vaad)
 */
export function isFlagshipSoloEvent(event?: SabrangEvent | null): boolean {
  if (!event) return false;
  return event.category === "Flagship Events - Solo / Duo";
}

/**
 * Calculates the Band Fee (₹7 per person) for Flagship and Pro-Nite events.
 */
export function calculateFlagshipBandFee(event: SabrangEvent, totalMembers: number = 1): number {
  if (!isBandFeeApplicable(event)) return 0;
  const count = event.isTeam ? Math.max(1, totalMembers) : 1;
  return count * FLAGSHIP_BAND_FEE_PER_PERSON;
}
export const calculateFlagshipBankFee = calculateFlagshipBandFee;
export const calculateFlagshipBankCharge = calculateFlagshipBandFee;
export const calculateFlagshipBandCharge = calculateFlagshipBandFee;

/**
 * Calculates the Band Fee for a single event in the current context.
 * The Band Fee is compulsory and cannot be waived or discounted by promotional coupons.
 */
export function getEventBandFee(
  event: SabrangEvent,
  totalMembers: number = 1,
  visitorConfig?: VisitorPassConfig,
  hasTeamMembersEntered?: boolean
): number {
  if (!event) return 0;
  if (event.id === "visitor") {
    const daysCount = visitorConfig?.days?.length ?? 1;
    const count = visitorConfig?.count ?? totalMembers ?? 1;
    return calculateVisitorBandFee(daysCount, count);
  }
  if (isFlagshipTeamEvent(event)) {
    // Applied when team members are specified (totalMembers > 1 or explicitly provided)
    if (totalMembers > 1 || hasTeamMembersEntered) {
      return calculateFlagshipBandFee(event, totalMembers);
    }
    return 0;
  }
  if (isFlagshipSoloEvent(event) || event.id === "pronite_outsider" || event.id === "pronite_jklu") {
    return calculateFlagshipBandFee(event, 1);
  }
  return 0;
}

/**
 * Calculates the total Band Fee across all selected events.
 * This fee is compulsory and cannot be discounted by any coupon.
 */
export function calculateTotalBandFee(
  selectedEventIds: string[],
  teamMembersMap?: Record<string, any[] | undefined>,
  visitorConfig?: VisitorPassConfig
): number {
  if (!Array.isArray(selectedEventIds) || selectedEventIds.length === 0) {
    return 0;
  }

  let totalBandFee = 0;

  for (const eventId of selectedEventIds) {
    const event = getEventById(eventId);
    if (!event) continue;

    const groupMembers = teamMembersMap?.[event.type];
    const totalMembers = 1 + (Array.isArray(groupMembers) ? groupMembers.length : 0);
    const hasTeamMembersEntered = teamMembersMap !== undefined && groupMembers !== undefined;

    totalBandFee += getEventBandFee(event, totalMembers, visitorConfig, hasTeamMembersEntered);
  }

  return totalBandFee;
}

/**
 * Calculates the total event items base price (strictly excluding compulsory Band Fees).
 */
export function calculateTotalEventBaseFee(
  selectedEventIds: string[],
  teamMembersMap?: Record<string, any[] | undefined>,
  visitorConfig?: VisitorPassConfig,
  isEarlyBird?: boolean
): number {
  if (!Array.isArray(selectedEventIds) || selectedEventIds.length === 0) {
    return 0;
  }

  let total = 0;

  for (const eventId of selectedEventIds) {
    const event = getEventById(eventId);
    if (!event) continue;

    const groupMembers = teamMembersMap?.[event.type];
    const totalMembers = 1 + (Array.isArray(groupMembers) ? groupMembers.length : 0);

    total += calculateEventItemPrice(event, totalMembers, visitorConfig, isEarlyBird);
  }

  return total;
}

/**
 * Calculates the total registration fee across all selected events taking into account
 * team member additions per group, visitor pass configuration, and Band fees.
 */
export function calculateTotalRegistrationFee(
  selectedEventIds: string[],
  teamMembersMap?: Record<string, any[] | undefined>,
  visitorConfig?: VisitorPassConfig,
  isEarlyBird?: boolean
): number {
  return (
    calculateTotalEventBaseFee(selectedEventIds, teamMembersMap, visitorConfig, isEarlyBird) +
    calculateTotalBandFee(selectedEventIds, teamMembersMap, visitorConfig)
  );
}

/**
 * Computes minimum and maximum team requirements for an active group based on selected events.
 */
export function getGroupTeamRequirements(
  group: string,
  selectedEventIds: string[],
  visitorConfig?: VisitorPassConfig
): { min: number; max: number } {
  if (group === "visitor") {
    const count = Math.max(1, visitorConfig?.count || 1);
    return { min: count, max: count };
  }

  const groupEvents = selectedEventIds
    .map(id => getEventById(id))
    .filter((e): e is SabrangEvent => e !== undefined && e.type === group && e.isTeam);

  if (groupEvents.length === 0) {
    return { min: 1, max: 1 };
  }

  // Required min is the highest min of any selected team event in this group
  const min = Math.max(...groupEvents.map(e => e.minTeam));
  // Allowed max is the highest max of any selected team event in this group
  const max = Math.max(...groupEvents.map(e => e.maxTeam));

  return { min, max };
}

