import { Coupon, CouponDiscountType } from './types';
import { 
  getEventById, 
  OFFICIAL_EVENTS, 
  isPerHeadFeeEvent, 
  getEventPerHeadFee, 
  calculateEventItemPrice, 
  calculateEventItemPriceWithCap, 
  isFlagshipEvent,
  calculateFlagshipBankFee,
  calculateVisitorBandFee,
  VisitorPassConfig 
} from './eventPricing';

export interface CouponValidationResult {
  valid: boolean;
  error?: string;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  originalPrice: number;
  finalPrice: number;
  discountAmount: number;
  applicableEvents?: string[];
}

export interface CouponCalculationContext {
  selectedEvents?: string[];
  teamMembers?: Record<string, any[] | undefined>;
  visitorConfig?: VisitorPassConfig;
  isEarlyBird?: boolean;
}

/**
 * Normalizes event identifier for flexible matching (case-insensitive, trimmed, ID or title).
 */
export function normalizeEventKey(val?: string): string {
  if (!val) return '';
  return val.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Checks if a coupon is applicable to a specific event.
 * If coupon.applicableEvents is empty, undefined, or contains 'ALL', it applies to all events.
 */
export function isCouponApplicableToEvent(coupon: Partial<Coupon>, eventIdOrTitle?: string): boolean {
  if (!coupon.applicableEvents || coupon.applicableEvents.length === 0) {
    return true; // Applies globally if no specific restrictions configured
  }

  if (coupon.applicableEvents.some(e => e.toUpperCase() === 'ALL' || e.toUpperCase() === '*')) {
    return true;
  }

  if (!eventIdOrTitle) {
    // If an event-restricted coupon is checked without specifying an event
    return false;
  }

  const targetKey = normalizeEventKey(eventIdOrTitle);

  return coupon.applicableEvents.some(evt => {
    const candidateKey = normalizeEventKey(evt);
    return candidateKey === targetKey || targetKey.includes(candidateKey) || candidateKey.includes(targetKey);
  });
}

/**
 * Validates coupon code format:
 * Format: 202Xb... (in lowercase, e.g. 2024btech001, 2025bba042, 2026bdes100)
 * Begins with 202 followed by year digit, 'b', and branch/roll characters.
 */
export function isValidCouponFormat(code: string): boolean {
  if (!code) return false;
  const clean = code.trim().toLowerCase();
  // Validates format: 202[0-9]b... (e.g. 2024btech001, 2025bba010)
  return /^202\d[a-z0-9]+$/.test(clean);
}

/**
 * Calculates the dynamic discount and final price for a coupon.
 * Supports:
 *  1. Percentage discount: Final = Original - (Original * Percentage / 100)
 *  2. Fixed price: Final = Fixed Price (Customer pays exact fixed price)
 *  3. Per head cap: Sets a ceiling/cap on per-head fee for events with a per-head fee system
 */
export function calculateCouponDiscount(
  coupon: Partial<Coupon> | null | undefined,
  originalPrice: number = 500,
  eventIdOrTitle?: string,
  context?: CouponCalculationContext
): CouponValidationResult {
  const safeOriginalPrice = Math.max(0, Number(originalPrice) || 0);

  if (!coupon) {
    return {
      valid: false,
      error: 'Coupon not found.',
      code: '',
      discountType: 'percentage',
      discountValue: 0,
      originalPrice: safeOriginalPrice,
      finalPrice: safeOriginalPrice,
      discountAmount: 0,
    };
  }

  const code = (coupon.code || coupon.id || '').trim().toLowerCase();

  // 1. Check active status
  if (coupon.active === false) {
    return {
      valid: false,
      error: 'Coupon is inactive or has been disabled.',
      code,
      discountType: 'percentage',
      discountValue: 0,
      originalPrice: safeOriginalPrice,
      finalPrice: safeOriginalPrice,
      discountAmount: 0,
    };
  }

  // 2. Check Expiry if set
  if (coupon.expiryDate) {
    const expiryTime = coupon.expiryDate instanceof Date 
      ? coupon.expiryDate.getTime() 
      : (typeof (coupon.expiryDate as any)?.toMillis === 'function' 
          ? (coupon.expiryDate as any).toMillis() 
          : new Date(coupon.expiryDate as any).getTime());

    if (!isNaN(expiryTime) && Date.now() > expiryTime) {
      return {
        valid: false,
        error: 'Coupon has expired.',
        code,
        discountType: 'percentage',
        discountValue: 0,
        originalPrice: safeOriginalPrice,
        finalPrice: safeOriginalPrice,
        discountAmount: 0,
      };
    }
  }

  // 3. Check Usage Limits if set
  if (coupon.maxUses !== undefined && coupon.usedCount !== undefined) {
    if (coupon.usedCount >= coupon.maxUses) {
      return {
        valid: false,
        error: 'Coupon usage limit has been reached.',
        code,
        discountType: 'percentage',
        discountValue: 0,
        originalPrice: safeOriginalPrice,
        finalPrice: safeOriginalPrice,
        discountAmount: 0,
      };
    }
  }

  // 4. Validate Event Applicability
  if (context?.selectedEvents && context.selectedEvents.length > 0) {
    const hasAnyApplicableEvent = context.selectedEvents.some(evtId => {
      const evt = getEventById(evtId);
      return isCouponApplicableToEvent(coupon, evtId) || (evt && isCouponApplicableToEvent(coupon, evt.title));
    });
    if (!hasAnyApplicableEvent) {
      return {
        valid: false,
        error: 'Coupon is not valid for any of the selected events.',
        code,
        discountType: 'percentage',
        discountValue: 0,
        originalPrice: safeOriginalPrice,
        finalPrice: safeOriginalPrice,
        discountAmount: 0,
        applicableEvents: coupon.applicableEvents,
      };
    }
  } else if (eventIdOrTitle && !isCouponApplicableToEvent(coupon, eventIdOrTitle)) {
    return {
      valid: false,
      error: 'Coupon is not valid for this event.',
      code,
      discountType: 'percentage',
      discountValue: 0,
      originalPrice: safeOriginalPrice,
      finalPrice: safeOriginalPrice,
      discountAmount: 0,
      applicableEvents: coupon.applicableEvents,
    };
  }

  // 5. Determine Discount Type and Value (with legacy backward compatibility)
  let discountType: CouponDiscountType = coupon.discountType || (coupon.discountPercentage !== undefined ? 'percentage' : 'fixed');
  let discountValue: number = coupon.discountValue ?? (
    discountType === 'percentage' 
      ? (coupon.discountPercentage ?? 0) 
      : discountType === 'per_head_cap'
      ? (coupon.perHeadCap ?? 0)
      : (coupon.amount ?? safeOriginalPrice)
  );

  let finalPrice = safeOriginalPrice;
  let discountAmount = 0;

  if (discountType === 'percentage') {
    // Percentage mode:
    // Clamp percentage between 0 and 100
    const pct = Math.min(100, Math.max(0, Number(discountValue) || 0));
    discountAmount = Math.round(((safeOriginalPrice * pct) / 100) * 100) / 100;
    finalPrice = Math.max(0, safeOriginalPrice - discountAmount);
  } else if (discountType === 'fixed') {
    // Fixed price mode:
    // Final price IS the configured fixed value (never negative)
    const fixedPrice = Math.max(0, Number(discountValue) || 0);
    finalPrice = fixedPrice;
    discountAmount = Math.max(0, safeOriginalPrice - fixedPrice);
  } else if (discountType === 'per_head_cap') {
    // Per head cap mode:
    // Imposes a ceiling/cap on the per-head fee for events with a per-head fee collection system
    const perHeadCap = Math.max(0, Number(discountValue) || 0);

    if (context?.selectedEvents && context.selectedEvents.length > 0) {
      let totalOriginal = 0;
      let totalCapped = 0;
      let hasPerHeadEvent = false;

      for (const evId of context.selectedEvents) {
        const event = getEventById(evId);
        if (!event) continue;

        const groupMembers = context.teamMembers?.[event.type];
        const totalMembers = !event.isTeam ? 1 : 1 + (Array.isArray(groupMembers) ? groupMembers.length : 0);

        const itemOriginal = calculateEventItemPrice(event, totalMembers, context.visitorConfig, context.isEarlyBird);
        const membersCount = event.isTeam ? totalMembers : 1;
        const isVisitor = event.id === "visitor";
        const visitorDaysCount = context.visitorConfig?.days?.length ?? 1;
        const visitorCount = context.visitorConfig?.count ?? 1;
        const bankFee = (isFlagshipEvent(event) && context.teamMembers !== undefined && (!event.isTeam || totalMembers > 1))
          ? calculateFlagshipBankFee(event, membersCount)
          : isVisitor
          ? calculateVisitorBandFee(visitorDaysCount, visitorCount)
          : 0;

        totalOriginal += (itemOriginal + bankFee);

        const isApplicable = isCouponApplicableToEvent(coupon, event.id) || isCouponApplicableToEvent(coupon, event.title);

        if (isApplicable && isPerHeadFeeEvent(event)) {
          hasPerHeadEvent = true;
          const itemCapped = calculateEventItemPriceWithCap(event, totalMembers, context.visitorConfig, context.isEarlyBird, perHeadCap);
          totalCapped += (itemCapped + bankFee);
        } else {
          totalCapped += (itemOriginal + bankFee);
        }
      }

      if (!hasPerHeadEvent) {
        return {
          valid: false,
          error: 'This coupon is only valid for events with a per-head fee collection system.',
          code,
          discountType,
          discountValue,
          originalPrice: safeOriginalPrice,
          finalPrice: safeOriginalPrice,
          discountAmount: 0,
          applicableEvents: coupon.applicableEvents,
        };
      }

      finalPrice = Math.max(0, totalCapped);
      discountAmount = Math.max(0, (totalOriginal > 0 ? totalOriginal : safeOriginalPrice) - totalCapped);

      if (discountAmount <= 0) {
        return {
          valid: false,
          error: `Per-head fee is already within the ₹${perHeadCap}/head cap.`,
          code,
          discountType,
          discountValue,
          originalPrice: safeOriginalPrice,
          finalPrice: safeOriginalPrice,
          discountAmount: 0,
          applicableEvents: coupon.applicableEvents,
        };
      }
    } else if (eventIdOrTitle) {
      const event = getEventById(eventIdOrTitle) || OFFICIAL_EVENTS.find(e => normalizeEventKey(e.title) === normalizeEventKey(eventIdOrTitle));
      if (event && isPerHeadFeeEvent(event)) {
        const regularPerHead = getEventPerHeadFee(event, context?.isEarlyBird);
        const effectivePerHead = Math.min(regularPerHead, perHeadCap);
        const estimatedMembers = Math.max(1, Math.round(safeOriginalPrice / (regularPerHead || 1)));
        finalPrice = estimatedMembers * effectivePerHead;
        discountAmount = Math.max(0, safeOriginalPrice - finalPrice);

        if (discountAmount <= 0) {
          return {
            valid: false,
            error: `Per-head fee is already within the ₹${perHeadCap}/head cap.`,
            code,
            discountType,
            discountValue,
            originalPrice: safeOriginalPrice,
            finalPrice: safeOriginalPrice,
            discountAmount: 0,
            applicableEvents: coupon.applicableEvents,
          };
        }
      } else {
        return {
          valid: false,
          error: 'This coupon is only valid for events with a per-head fee collection system.',
          code,
          discountType,
          discountValue,
          originalPrice: safeOriginalPrice,
          finalPrice: safeOriginalPrice,
          discountAmount: 0,
          applicableEvents: coupon.applicableEvents,
        };
      }
    } else {
      return {
        valid: false,
        error: 'Please select an event with a per-head fee collection system.',
        code,
        discountType,
        discountValue,
        originalPrice: safeOriginalPrice,
        finalPrice: safeOriginalPrice,
        discountAmount: 0,
        applicableEvents: coupon.applicableEvents,
      };
    }
  }

  // Ensure 2 decimal places precision and non-negative values
  finalPrice = Math.max(0, Math.round(finalPrice * 100) / 100);
  discountAmount = Math.max(0, Math.round(discountAmount * 100) / 100);

  return {
    valid: true,
    code,
    discountType,
    discountValue,
    originalPrice: safeOriginalPrice,
    finalPrice,
    discountAmount,
    applicableEvents: coupon.applicableEvents || ['ALL'],
  };
}
