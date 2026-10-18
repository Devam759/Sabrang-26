import { getEventById } from './eventPricing';

/**
 * Clean string for PDF/UI display
 */
export function cleanDisplayString(str: any, fallback = 'N/A'): string {
  if (str === null || str === undefined) return fallback;
  const s = String(str).trim();
  if (!s || s.toUpperCase() === 'N/A' || s.toUpperCase() === 'UNDEFINED' || s.toUpperCase() === 'NULL') {
    return fallback;
  }
  return s;
}

/**
 * Standardizes mobile numbers to always format as +91 1234567890.
 */
export function formatDisplayPhone(phone: any): string {
  if (!phone) return 'N/A';
  const str = String(phone).trim();
  const digits = str.replace(/\D/g, '');
  if (digits.length >= 10) {
    return `+91 ${digits.slice(-10)}`;
  }
  return str || 'N/A';
}

/**
 * Safely extracts and formats the final payment amount after coupon discount.
 * Never defaults to a hardcoded amount like 2500. Handles 0 (e.g. 100% discount / free pass) correctly.
 */
export function getDisplayPaymentAmount(reg: any): string {
  if (!reg) return '₹ 0';

  const raw = reg.paymentAmount !== undefined && reg.paymentAmount !== null && reg.paymentAmount !== ''
    ? reg.paymentAmount
    : (reg.receivedAmount !== undefined && reg.receivedAmount !== null && reg.receivedAmount !== ''
        ? reg.receivedAmount
        : (reg.amount !== undefined && reg.amount !== null && reg.amount !== ''
            ? reg.amount
            : (reg.finalPrice !== undefined && reg.finalPrice !== null && reg.finalPrice !== ''
                ? reg.finalPrice
                : (reg.price !== undefined && reg.price !== null && reg.price !== '' ? reg.price : 0))));

  const num = Number(raw);
  if (isNaN(num)) {
    return `₹ ${raw}`;
  }
  return `₹ ${num.toLocaleString('en-IN')}`;
}

/**
 * Extract clean team name from registration data.
 * Checks all possible properties where team name may be stored dynamically.
 */
export function extractRegistrationTeamName(data: any): string {
  if (!data) return '';

  const candidates = [
    data.teamName,
    data.generic_teamName,
    data.bgmi_teamName,
    data.valorant_teamName,
    data.freefire_teamName,
    data.team_name,
    data.teamTitle,
    data.groupName,
    typeof data.team === 'string' ? data.team : (data.team?.name || data.team?.teamName),
  ];

  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) {
      const trimmed = c.trim();
      const upper = trimmed.toUpperCase();
      if (upper !== 'N/A' && upper !== 'NONE' && upper !== 'NULL' && upper !== 'UNDEFINED') {
        return trimmed;
      }
    }
  }

  return '';
}

/**
 * Calculates the number of OTHER members besides the primary participant / team leader.
 * Examples:
 * - Team has 2 total members -> 1
 * - Team has 3 total members -> 2
 * - Team has 4 total members -> 3
 * - Team has 6 total members -> 5
 */
export function extractOtherTeammatesCount(data: any): number | null {
  if (!data) return null;

  // 1. Direct explicit teammate count fields
  if (typeof data.noOfTeammates === 'number' && !isNaN(data.noOfTeammates)) {
    return Math.max(0, data.noOfTeammates);
  }
  if (typeof data.noOfTeammates === 'string' && data.noOfTeammates.trim() && !isNaN(Number(data.noOfTeammates))) {
    return Math.max(0, Number(data.noOfTeammates));
  }
  if (typeof data.teammatesCount === 'number' && !isNaN(data.teammatesCount)) {
    return Math.max(0, data.teammatesCount);
  }
  if (typeof data.otherMembersCount === 'number' && !isNaN(data.otherMembersCount)) {
    return Math.max(0, data.otherMembersCount);
  }

  // 2. Total members count fields (total members - 1)
  if (typeof data.totalMembers === 'number' && !isNaN(data.totalMembers) && data.totalMembers > 0) {
    return Math.max(0, data.totalMembers - 1);
  }
  if (typeof data.teamSize === 'number' && !isNaN(data.teamSize) && data.teamSize > 0) {
    return Math.max(0, data.teamSize - 1);
  }

  // 3. teamMembers field
  // In Sabrang 2026 CheckoutForm, `teamMembers` is an object where keys are groups ('generic', 'bgmi', 'valorant', 'freefire')
  // and the array contains ONLY the other teammates (excluding the primary leader).
  if (data.teamMembers) {
    if (typeof data.teamMembers === 'object' && !Array.isArray(data.teamMembers)) {
      let count = 0;
      let foundArray = false;
      for (const key of Object.keys(data.teamMembers)) {
        const val = data.teamMembers[key];
        if (Array.isArray(val)) {
          foundArray = true;
          count += val.length;
        }
      }
      if (foundArray) return count;
    } else if (Array.isArray(data.teamMembers)) {
      const items = data.teamMembers;
      const hasExplicitLeader = items.some((m: any) => m && (m.isLeader === true || m.role === 'leader' || m.isPrimary === true));
      if (hasExplicitLeader) {
        return items.filter((m: any) => m && !m.isLeader && m.role !== 'leader' && !m.isPrimary).length;
      }
      return items.length;
    }
  }

  // 4. members array
  if (Array.isArray(data.members)) {
    const hasExplicitLeader = data.members.some((m: any) => m && (m.isLeader === true || m.role === 'leader' || m.isPrimary === true));
    if (hasExplicitLeader) {
      return data.members.filter((m: any) => m && !m.isLeader && m.role !== 'leader' && !m.isPrimary).length;
    }
    return Math.max(0, data.members.length - 1);
  }

  return null;
}

/**
 * Determine if a registration is a TEAM event or a SOLO event.
 */
export function isTeamEventRegistration(data: any): boolean {
  if (!data) return false;

  // Direct boolean/string flags
  if (data.isTeam === true || data.eventType === 'Team' || data.eventType === 'team' || data.type === 'team') {
    return true;
  }
  if (data.eventType === 'Solo' || data.eventType === 'solo' || data.type === 'solo') {
    return false;
  }

  // Check event IDs against official catalog
  const eventCandidates: any[] = [];
  if (Array.isArray(data.selectedEvents)) {
    eventCandidates.push(...data.selectedEvents);
  } else if (typeof data.selectedEvents === 'string' && data.selectedEvents.trim()) {
    eventCandidates.push(data.selectedEvents.trim());
  }

  if (Array.isArray(data.events)) {
    eventCandidates.push(...data.events);
  }

  if (data.eventId) eventCandidates.push(data.eventId);
  if (data.event) eventCandidates.push(data.event);

  for (const item of eventCandidates) {
    if (!item) continue;
    const id = typeof item === 'string' ? item : (item.id || item.eventId);
    if (typeof id === 'string') {
      const ev = getEventById(id);
      if (ev && ev.isTeam) return true;
    }
  }

  // If a valid team name is present
  const teamName = extractRegistrationTeamName(data);
  if (teamName) {
    return true;
  }

  // If teammates count is greater than 0
  const teammates = extractOtherTeammatesCount(data);
  if (typeof teammates === 'number' && teammates > 0) {
    return true;
  }

  return false;
}

export interface ExtractedRegistrationInfo {
  isTeam: boolean;
  eventType: 'Team' | 'Solo';
  name: string;
  rollNumber: string;
  email: string;
  phone: string;
  college: string;
  address: string;
  teamName: string;
  noOfTeammates: string;
}

/**
 * Extract unified registration display info adhering strictly to Sabrang 2026 specs:
 * 1. PARTICIPANT INFORMATION:
 *    - SOLO: participant's own details
 *    - TEAM: primary participant / team leader's details
 *    - NO "LEADER" or "TEAM LEADER" words in labels
 * 2. TEAM NAME:
 *    - SOLO: "N/A"
 *    - TEAM: [Actual Team Name] (dynamic)
 * 3. NO. OF TEAMMATES:
 *    - SOLO: "N/A" (never 0)
 *    - TEAM: [Actual Number] (other members count)
 * 4. EVENT TYPE:
 *    - "Solo" or "Team"
 */
export function extractRegistrationInfo(data: any, idFallback?: string): ExtractedRegistrationInfo {
  const isTeam = isTeamEventRegistration(data);
  const eventType: 'Team' | 'Solo' = isTeam ? 'Team' : 'Solo';

  // Primary participant / leader object (if explicitly saved), otherwise root fields
  const leaderObj = (typeof data?.teamLeader === 'object' && data.teamLeader) ||
                    (typeof data?.leader === 'object' && data.leader) ||
                    (typeof data?.primaryParticipant === 'object' && data.primaryParticipant) ||
                    null;

  const rawName = leaderObj?.name || leaderObj?.fullName || data?.name || data?.fullName || '';
  const name = cleanDisplayString(rawName, 'N/A');

  const rawRoll = leaderObj?.rollNumber || leaderObj?.registrationNumber || data?.rollNumber || data?.registrationNumber || idFallback || '';
  const rollNumber = cleanDisplayString(rawRoll, idFallback || 'N/A');

  const rawEmail = leaderObj?.email || data?.email || '';
  const email = cleanDisplayString(rawEmail, 'N/A');

  const rawPhone = leaderObj?.phone || leaderObj?.mobile || leaderObj?.mobileNumber || data?.phone || data?.mobile || data?.mobileNumber || '';
  const phone = formatDisplayPhone(rawPhone);

  const rawInstitution = leaderObj?.institutionName || leaderObj?.college || leaderObj?.institution ||
                         data?.institutionName || data?.college || data?.collegeName || data?.institution || data?.university || '';
  const college = normalizeInstitute(rawInstitution) || cleanDisplayString(rawInstitution, 'N/A');

  const rawAddress = leaderObj?.address || data?.address || '';
  const address = cleanDisplayString(rawAddress, 'N/A');

  let teamName = 'N/A';
  let noOfTeammates = 'N/A';

  if (isTeam) {
    const extractedName = extractRegistrationTeamName(data);
    teamName = extractedName || 'N/A';

    const count = extractOtherTeammatesCount(data);
    noOfTeammates = (count !== null && count >= 0) ? String(count) : 'N/A';
  } else {
    teamName = 'N/A';
    noOfTeammates = 'N/A'; // Never show 0 for solo!
  }

  return {
    isTeam,
    eventType,
    name,
    rollNumber,
    email,
    phone,
    college,
    address,
    teamName,
    noOfTeammates,
  };
}

/**
 * Safely extracts raw institute/college string from any registration document structure.
 */
export function getRegistrationInstituteRaw(reg: any): string {
  if (!reg || typeof reg !== 'object') return '';
  const direct =
    reg.institutionName ||
    reg.college ||
    reg.collegeName ||
    reg.institution ||
    reg.university;
  if (direct && typeof direct === 'string' && direct.trim()) {
    return direct.trim();
  }

  // Check leader / teamLeader
  const leader = reg.leader || reg.teamLeader || reg.primaryParticipant;
  if (leader && typeof leader === 'object') {
    const leaderInst = leader.institutionName || leader.college || leader.collegeName || leader.institution || leader.university;
    if (leaderInst && typeof leaderInst === 'string' && leaderInst.trim()) {
      return leaderInst.trim();
    }
  }

  // Check participants array
  if (Array.isArray(reg.participants) && reg.participants.length > 0) {
    for (const p of reg.participants) {
      const pInst = p?.institutionName || p?.college || p?.institution;
      if (pInst && typeof pInst === 'string' && pInst.trim()) {
        return pInst.trim();
      }
    }
  }

  // Check teamMembers record
  if (reg.teamMembers && typeof reg.teamMembers === 'object') {
    for (const group of Object.keys(reg.teamMembers)) {
      const list = Array.isArray(reg.teamMembers[group]) ? reg.teamMembers[group] : [];
      for (const m of list) {
        if (m?.institutionName && typeof m.institutionName === 'string' && m.institutionName.trim()) {
          return m.institutionName.trim();
        }
      }
    }
  }

  return '';
}

/**
 * Normalizes institution / college names to eliminate duplicate entries of the same university.
 * Resolves typos, varying case, abbreviations (e.g. JKLU, Jk lakshmipat university -> JK Lakshmipat University (JKLU)),
 * punctuation, and city suffixes.
 */
export function normalizeInstitute(raw: string | null | undefined): string {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed || trimmed.toUpperCase() === 'N/A' || trimmed === '-') return '';

  const lower = trimmed.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const compact = lower.replace(/\s+/g, '');

  // 1. JKLU variations (handles all 30+ variants, typos, faculties)
  if (
    compact.includes('jklu') ||
    compact.includes('lakshmipat') ||
    compact.includes('laxmipat') ||
    compact.includes('lakshmipath') ||
    compact.includes('laxmipath') ||
    compact.includes('lakshimpat') ||
    compact.includes('laxkshmipat') ||
    compact.includes('lakmipat') ||
    compact.includes('lakshamipat') ||
    compact.includes('laxmipati') ||
    compact.includes('lakshmipati') ||
    lower === 'im' ||
    lower.includes('institute of management') ||
    lower.includes('institute of engineering')
  ) {
    return 'JK Lakshmipat University';
  }

  // 2. Known external universities & colleges
  if (compact.includes('poornima')) return 'Poornima University';
  if (compact.includes('xavier')) return "St. Xavier's College";
  if (compact.includes('nift')) return 'NIFT Delhi';
  if (compact.includes('commercecollege') || lower === 'ru' || compact.includes('rajasthanuniversity')) {
    return 'University of Rajasthan (RU)';
  }
  if (compact.includes('sangeetsanstha')) return 'Rajasthan Sangeet Sansthaan';
  if (compact.includes('dav')) return 'DAV Centenary Public School';
  if (compact.includes('ryan')) return 'Ryan International School';
  if (compact.includes('coimbatoremarine')) return 'Coimbatore Marine College';
  if (compact.includes('manipal')) return 'Manipal University Jaipur (MUJ)';
  if (compact.includes('amity')) return 'Amity University';
  if (compact.includes('bits') || compact.includes('pilani')) return 'BITS Pilani';
  if (compact.includes('skit')) return 'SKIT Jaipur';
  if (compact.includes('jecrc')) return 'JECRC University';
  if (compact.includes('subodh')) return 'SS Subodh College';
  if (compact.includes('kanoria')) return 'Kanoria PG Mahila Mahavidyalaya';
  if (compact.includes('maharani')) return 'University Maharani College';
  if (compact.includes('maharaja')) return 'University Maharaja College';

  // 3. Dynamic cleanup for any other incoming institution:
  // Remove redundant trailing city names (e.g. ", Jaipur" or " Jaipur")
  const cleaned = trimmed
    .replace(/[,\s]+jaipur\b/gi, '')
    .replace(/[,\s]+rajasthan\b/gi, '')
    .replace(/[()]/g, '')
    .trim();

  // Title-case capitalization while preserving short acronyms
  return cleaned
    .split(/\s+/)
    .map((w) => {
      if (w.length <= 4 && w === w.toUpperCase()) return w;
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(' ');
}

