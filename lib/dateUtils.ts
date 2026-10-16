/**
 * Date utilities for Sabrang 2026.
 * All festival dates, analytics, reports, and daily counters are standardized
 * to Indian Standard Time (IST: Asia/Kolkata, UTC+5:30).
 */

/**
 * Returns a Date representing the exact start of today (00:00:00.000 IST).
 * Works reliably across server (UTC / serverless) and browser environments.
 */
export function getStartOfTodayIST(baseDate: Date = new Date()): Date {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.format(baseDate); // "YYYY-MM-DD"
  const [year, month, day] = parts.split('-').map(Number);

  // In IST, midnight is 5 hours and 30 minutes before UTC midnight of the same date
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const utcMidnight = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  return new Date(utcMidnight - IST_OFFSET_MS);
}

/**
 * Returns a Date representing the exact end of today (23:59:59.999 IST).
 */
export function getEndOfTodayIST(baseDate: Date = new Date()): Date {
  const start = getStartOfTodayIST(baseDate);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

/**
 * Returns formatted date string in Indian locale with Asia/Kolkata timezone.
 * E.g. "16 Oct 2026"
 */
export function getFormattedTodayIST(baseDate: Date = new Date()): string {
  return baseDate.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Parses diverse Firestore / JS date representations safely into a native Date.
 */
export function parseDateValue(val: any): Date | null {
  if (!val) return null;
  if (typeof val.toDate === 'function') return val.toDate();
  if (typeof val.toMillis === 'function') return new Date(val.toMillis());
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof val === 'string') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Checks whether a timestamp or date value falls within today in IST.
 */
export function isDateInTodayIST(dateVal: any, baseDate: Date = new Date()): boolean {
  const d = parseDateValue(dateVal);
  if (!d) return false;
  const start = getStartOfTodayIST(baseDate);
  const end = getEndOfTodayIST(baseDate);
  return d >= start && d <= end;
}

export const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Format date and time in IST (e.g. "16 Oct 2026, 01:30 am")
 */
export function formatISTDateTime(
  val: any,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = parseDateValue(val);
  if (!d) return '';
  return d.toLocaleString('en-IN', {
    timeZone: IST_TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  });
}

/**
 * Format date in IST (e.g. "16 Oct 2026")
 */
export function formatISTDate(
  val: any,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = parseDateValue(val);
  if (!d) return '';
  return d.toLocaleDateString('en-IN', {
    timeZone: IST_TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  });
}

/**
 * Format time in IST (e.g. "01:30 am" or "01:30:45 am")
 */
export function formatISTTime(
  val: any,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = parseDateValue(val);
  if (!d) return '';
  return d.toLocaleTimeString('en-IN', {
    timeZone: IST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  });
}

