/* v8 ignore next */
/**
 * Julian Day Number computation for both Julian and Gregorian calendars.
 *
 * Algorithm from Meeus, "Astronomical Algorithms", 2nd edition, Chapter 7.
 * The Julian calendar was used before 1582-10-15; the Gregorian calendar after.
 *
 * The Julian Day Number is a continuous count of days since the beginning
 * of the Julian Period on January 1, 4713 BC (Julian), noon UT.
 */

export type CalendarType = 'julian' | 'gregorian' | 'auto';

/** Gregorian calendar reform date: October 15, 1582 */
const GREGORIAN_CUTOVER_JD = 2299161; // JD of 1582-10-15 noon

/**
 * Compute Julian Day Number for a calendar date.
 *
 * @param year  - Astronomical year (1 BC = 0, 2 BC = -1, etc.)
 * @param month - Month (1-12)
 * @param day   - Day (can include fractional part for time)
 * @param calendar - 'julian', 'gregorian', or 'auto' (default).
 *   'auto' uses Julian for dates before 1582-10-15, Gregorian otherwise.
 * @returns Julian Day Number
 */
export function julianDayNumber(
  year: number,
  month: number,
  day: number,
  calendar: CalendarType = 'auto',
): number {
  let Y = year;
  let M = month;
  if (M <= 2) {
    Y--;
    M += 12;
  }

  let B: number;
  if (calendar === 'julian') {
    B = 0;
  } else if (calendar === 'gregorian') {
    const A = Math.floor(Y / 100);
    B = 2 - A + Math.floor(A / 4);
  } else {
    // auto: use Gregorian for dates on or after 1582-10-15
    const isGregorian =
      year > 1582 ||
      (year === 1582 && month > 10) ||
      (year === 1582 && month === 10 && day >= 15);
    if (isGregorian) {
      const A = Math.floor(Y / 100);
      B = 2 - A + Math.floor(A / 4);
    } else {
      B = 0;
    }
  }

  return (
    Math.floor(365.25 * (Y + 4716)) +
    Math.floor(30.6001 * (M + 1)) +
    day +
    B -
    1524.5
  );
}

/**
 * Convert a Julian Day Number back to a calendar date.
 *
 * @param jd - Julian Day Number
 * @param calendar - 'julian', 'gregorian', or 'auto' (default).
 *   'auto' uses Gregorian for JD >= 2299161 (1582-10-15), Julian before.
 * @returns { year, month, day } with fractional day
 */
export function jdToCalendarDate(
  jd: number,
  calendar: CalendarType = 'auto',
): { year: number; month: number; day: number } {
  const Z = Math.floor(jd + 0.5);
  const F = jd + 0.5 - Z;

  let A: number;
  const useGregorian =
    calendar === 'gregorian' ||
    (calendar === 'auto' && Z >= GREGORIAN_CUTOVER_JD);

  if (useGregorian) {
    const alpha = Math.floor((Z - 1867216.25) / 36524.25);
    A = Z + 1 + alpha - Math.floor(alpha / 4);
  } else {
    A = Z;
  }

  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);

  const day = B - D - Math.floor(30.6001 * E) + F;
  const month = E < 14 ? E - 1 : E - 13;
  const year = month > 2 ? C - 4716 : C - 4715;

  return { year, month, day };
}

/**
 * Convert a Julian calendar date to a JavaScript Date (Gregorian).
 *
 * This is useful for computing Four Pillars for historical dates
 * where the Julian calendar was in use (before 1582-10-15).
 *
 * @param year  - Julian calendar year (astronomical: 1 BC = 0)
 * @param month - Month (1-12)
 * @param day   - Day (1-31)
 * @returns JavaScript Date representing the same instant in Gregorian time
 */
export function julianCalendarToDate(
  year: number,
  month: number,
  day: number,
): Date {
  // Compute JD for the Julian calendar date
  const jd = julianDayNumber(year, month, day, 'julian');
  // Convert JD to Unix timestamp (JD 2440587.5 = 1970-01-01T00:00:00Z)
  const ms = (jd - 2440587.5) * 86400000;
  const date = new Date(ms);
  // Fix year for dates before 100 CE (JS Date maps 0-99 to 1900-1999)
  if (year >= 0 && year < 100) {
    date.setUTCFullYear(year);
  }
  return date;
}
