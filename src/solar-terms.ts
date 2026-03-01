/* c8 ignore next 2 */
import { SearchSunLongitude, MakeTime, type AstroTime } from 'astronomy-engine';
import type { SolarTerm } from './types';

/**
 * The 24 Solar Terms (二十四節氣) with their solar ecliptic longitudes.
 * 節 (Jie) terms mark the start of each month; 氣 (Qi) terms are mid-month.
 * Index 0 = 小寒 (Minor Cold, ~Jan 6) at longitude 285°.
 */
export const SOLAR_TERM_NAMES: readonly string[] = [
  '小寒', '大寒', '立春', '雨水', '驚蟄', '春分',
  '清明', '穀雨', '立夏', '小滿', '芒種', '夏至',
  '小暑', '大暑', '立秋', '處暑', '白露', '秋分',
  '寒露', '霜降', '立冬', '小雪', '大雪', '冬至',
];

/** Solar longitude for each term (index 0 = 小寒 at 285°) */
export const SOLAR_TERM_LONGITUDES: readonly number[] = [
  285, 300, 315, 330, 345, 0,
  15, 30, 45, 60, 75, 90,
  105, 120, 135, 150, 165, 180,
  195, 210, 225, 240, 255, 270,
];

/**
 * 節 (Jie) term indices — the 12 terms that mark month boundaries.
 * These are the odd-indexed terms in the traditional numbering:
 * 小寒(0), 立春(2), 驚蟄(4), 清明(6), 立夏(8), 芒種(10),
 * 小暑(12), 立秋(14), 白露(16), 寒露(18), 立冬(20), 大雪(22)
 */
export const JIE_INDICES = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22] as const;

function astroTimeToDate(at: AstroTime): Date {
  return at.date;
}

/**
 * Compute the exact moment of a solar term using astronomical calculation.
 * Uses astronomy-engine's SearchSunLongitude for sub-minute accuracy.
 *
 * @param targetLongitude - Solar ecliptic longitude in degrees (0-360)
 * @param year - Gregorian year
 * @param startMonth - Month to start searching from (1-12)
 * @returns The exact Date of the solar term
 */
export function findSolarTermMoment(targetLongitude: number, year: number, startMonth: number = 1): Date {
  const startDate = MakeTime(new Date(year, startMonth - 1, 1));
  const result = SearchSunLongitude(targetLongitude, startDate, 120);
  if (!result) {
    throw new Error(`Could not find solar longitude ${targetLongitude}° in year ${year}`);
  }
  return astroTimeToDate(result);
}

/**
 * Compute all 24 solar terms for a given year.
 * Returns exact moments (UTC) for each term.
 */
export function getSolarTermsForYear(year: number): SolarTerm[] {
  const terms: SolarTerm[] = [];

  for (let i = 0; i < 24; i++) {
    const longitude = SOLAR_TERM_LONGITUDES[i];
    const name = SOLAR_TERM_NAMES[i];
    // 小寒/大寒 occur in January of the given year
    // 立春 onward occurs Feb-Dec
    const startMonth = i < 2 ? 1 : Math.floor(i / 2) + 1;
    const date = findSolarTermMoment(longitude, year, startMonth);
    terms.push({ name, longitude, date });
  }

  return terms;
}

/**
 * Find the exact moment of 立春 (Start of Spring) for a given year.
 * This is the year boundary in the 立春派 (Lichun school) system.
 * Solar longitude = 315°.
 */
export function findLichun(year: number): Date {
  return findSolarTermMoment(315, year, 1);
}

/**
 * Get the 12 節 (Jie) terms for a year — these define month boundaries.
 * Returns them in chronological order: 小寒, 立春, 驚蟄, ..., 大雪
 */
export function getJieTermsForYear(year: number): SolarTerm[] {
  const all = getSolarTermsForYear(year);
  return JIE_INDICES.map(i => all[i]);
}

/**
 * Determine which solar month a given date falls in,
 * using exact astronomical 節 boundaries.
 *
 * @returns Solar month index 0-11 (0=寅月, 11=丑月) and the year it belongs to
 */
export function getSolarMonthExact(date: Date): { monthIndex: number; effectiveYear: number } {
  const year = date.getFullYear();

  // Get 節 terms for current and previous year (needed for 小寒/丑月 boundary)
  const jieTerms = getJieTermsForYear(year);
  const prevJieTerms = getJieTermsForYear(year - 1);

  // Check each 節 boundary from latest to earliest
  // j=0 is 小寒 (丑月), j=1 is 立春 (寅月), ..., j=11 is 大雪 (子月)
  // Mapping: solarMonthIdx = (j - 1 + 12) % 12
  for (let j = 11; j >= 0; j--) {
    if (date >= jieTerms[j].date) {
      const monthIndex = (j - 1 + 12) % 12;
      // 小寒 (j=0) is still in the previous GanZhi year (before 立春)
      const effectiveYear = j >= 1 ? year : year - 1;
      return { monthIndex, effectiveYear };
    }
  }

  // Before 小寒 of current year — in 子月 from previous year's 大雪
  if (date >= prevJieTerms[11].date) {
    return { monthIndex: 10, effectiveYear: year - 1 };
  /* c8 ignore next 5 */
  }

  // Fallback: 丑月(11) of previous year (unreachable in practice)
  return { monthIndex: 11, effectiveYear: year - 1 };
}
