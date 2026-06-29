/* v8 ignore next */
/**
 * Chinese Lunisolar Calendar (農曆) computation.
 *
 * Computes lunar months, intercalary months (閏月), and Lunar New Year dates
 * from first principles using astronomical new moon computation (Meeus Ch. 49)
 * and VSOP87D solar term computation.
 *
 * Rules (per 《清代日躔新法》 and modern practice):
 * 1. Each month starts at the new moon (朔), determined in Beijing time (UTC+8)
 * 2. The month containing 冬至 (Winter Solstice) is always month 11
 * 3. Between consecutive month-11s, months are numbered sequentially (12, 1, 2, ..., 10)
 * 4. If 13 months fall between consecutive month-11s, the first month without a
 *    中氣 (zhongqi) is an intercalary month (閏月), numbered after the previous regular month
 * 5. Lunar New Year (正月初一) is the first day of month 1
 *
 * This 冬至-anchor algorithm correctly handles the 二〇三三年問題 (2033 problem)
 * where 小雪 and 冬至 share the same lunar month.
 */

import { newMoonJDE, findNewMoonsInRange } from './new-moon';
import { findSolarTermMoment, SOLAR_TERM_LONGITUDES } from './solar-terms';
import { deltaTForYear } from './delta-t';

// ── Types ────────────────────────────────────────────────────

export interface LunarMonth {
  /** Month number (1-12) */
  monthNumber: number;
  /** True if this is an intercalary month (閏月) */
  isLeapMonth: boolean;
  /** Start date (new moon, Beijing midnight as UTC) */
  startDate: Date;
  /** Number of days in this month (29 or 30) */
  days: number;
}

export interface LunisolarDate {
  /** Lunar year */
  year: number;
  /** Lunar month (1-12) */
  month: number;
  /** Day of the month (1-29 or 1-30) */
  day: number;
  /** True if this date is in an intercalary month */
  isLeapMonth: boolean;
}

// ── Constants ────────────────────────────────────────────────

/** Beijing time offset from UTC in milliseconds */
const BEIJING_OFFSET_MS = 8 * 3600000;

/**
 * 中氣 (Zhongqi) indices in SOLAR_TERM_NAMES/LONGITUDES (0-based).
 * Odd-indexed terms: 大寒(1), 雨水(3), 春分(5), ... 冬至(23)
 */
const ZHONGQI_INDICES: readonly number[] = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23];

/**
 * Map from zhongqi index → month number.
 * The month containing a given zhongqi gets that month number.
 */
const ZHONGQI_TO_MONTH: Record<number, number> = {
  23: 11, // 冬至
  1: 12,  // 大寒
  3: 1,   // 雨水
  5: 2,   // 春分
  7: 3,   // 穀雨
  9: 4,   // 小滿
  11: 5,  // 夏至
  13: 6,  // 大暑
  15: 7,  // 處暑
  17: 8,  // 秋分
  19: 9,  // 霜降
  21: 10, // 小雪
};

// ── Cache ────────────────────────────────────────────────────

const monthsCache = new Map<number, LunarMonth[]>();
const lnyCache = new Map<number, Date>();

// ── Helpers ──────────────────────────────────────────────────

/** Convert JDE (Terrestrial Time) to a Date in UTC */
function jdeToUTCDate(jde: number): Date {
  const year = 2000 + (jde - 2451545) / 365.25;
  const dt = deltaTForYear(year);
  const jdUT = jde - dt / 86400;
  return new Date((jdUT - 2440587.5) * 86400000);
}

/** Get the Beijing calendar date for a UTC Date */
function beijingDate(utcDate: Date): { year: number; month: number; day: number } {
  const beijing = new Date(utcDate.getTime() + BEIJING_OFFSET_MS);
  return {
    year: beijing.getUTCFullYear(),
    month: beijing.getUTCMonth() + 1,
    day: beijing.getUTCDate(),
  };
}

/** Convert a Beijing date to a comparable integer YYYYMMDD */
function bjToNum(bj: { year: number; month: number; day: number }): number {
  return bj.year * 10000 + bj.month * 100 + bj.day;
}

/** Get Beijing midnight (as UTC Date) for a new moon date */
function beijingMidnight(utcDate: Date): Date {
  const bj = beijingDate(utcDate);
  return new Date(Date.UTC(bj.year, bj.month - 1, bj.day) - BEIJING_OFFSET_MS);
}

/** Days between two Beijing dates */
function daysBetween(a: Date, b: Date): number {
  const aBj = beijingDate(a);
  const bBj = beijingDate(b);
  const aMs = Date.UTC(aBj.year, aBj.month - 1, aBj.day);
  const bMs = Date.UTC(bBj.year, bBj.month - 1, bBj.day);
  return Math.round((bMs - aMs) / 86400000);
}

/**
 * Check if a zhongqi falls within a lunar month (Beijing date comparison).
 */
function zhongqiFallsInMonth(
  zhongqiDate: Date,
  monthStartUTC: Date,
  nextMonthStartUTC: Date,
): boolean {
  const zqN = bjToNum(beijingDate(zhongqiDate));
  const msN = bjToNum(beijingDate(monthStartUTC));
  const nmN = bjToNum(beijingDate(nextMonthStartUTC));
  return zqN >= msN && zqN < nmN;
}

/**
 * Get new moon UTC dates in a year range.
 */
function getNewMoonDates(startYear: number, endYear: number): Date[] {
  const startJD = Date.UTC(startYear, 0, 1) / 86400000 + 2440587.5 - 30;
  const endJD = Date.UTC(endYear + 1, 1, 28) / 86400000 + 2440587.5 + 30;
  return findNewMoonsInRange(startJD, endJD).map(jde => jdeToUTCDate(jde));
}

/**
 * Get zhongqi moments for a year range.
 * Returns { index, date } sorted chronologically.
 */
function getZhongqiMoments(startYear: number, endYear: number): { index: number; date: Date }[] {
  const moments: { index: number; date: Date }[] = [];

  for (let y = startYear; y <= endYear; y++) {
    for (const idx of ZHONGQI_INDICES) {
      const longitude = SOLAR_TERM_LONGITUDES[idx];
      const startMonth = idx < 2 ? 1 : Math.floor(idx / 2) + 1;
      try {
        const date = findSolarTermMoment(longitude, y, startMonth);
        moments.push({ index: idx, date });
      /* v8 ignore next 3 */
      } catch {
        // Skip failures (shouldn't happen for reasonable years)
      }
    }
  }

  moments.sort((a, b) => a.date.getTime() - b.date.getTime());
  return moments;
}

// ── Core computation ─────────────────────────────────────────

interface NumberedMonth {
  monthNumber: number;
  isLeapMonth: boolean;
  startDate: Date;
  nextDate: Date;
  days: number;
}

/**
 * Build a numbered month sequence using the 冬至-anchor algorithm.
 *
 * 1. Build month spans from consecutive new moons, collecting zhongqi for each.
 * 2. Find 冬至 (Winter Solstice, index 23) anchors → always month 11.
 * 3. Between consecutive month-11s, number months sequentially: 12, 1, 2, ..., 10.
 * 4. If there are 12 intermediate months (instead of 11), the first month
 *    without a zhongqi is the leap month (閏月).
 *
 * This handles the 二〇三三年問題 where two zhongqi share one month.
 */
function buildMonthSequence(
  newMoons: Date[],
  zhongqi: { index: number; date: Date }[],
): NumberedMonth[] {
  // Step 1: Build month spans and collect zhongqi for each
  interface MonthSpan {
    start: Date;
    end: Date;
    days: number;
    hasZhongqi: boolean;
    hasDongzhi: boolean;
  }

  const spans: MonthSpan[] = [];
  for (let i = 0; i < newMoons.length - 1; i++) {
    const start = newMoons[i];
    const end = newMoons[i + 1];
    const days = daysBetween(start, end);

    let hasZq = false;
    let hasDz = false;
    for (const z of zhongqi) {
      /* v8 ignore next */
      if (!ZHONGQI_INDICES.includes(z.index)) continue;
      if (zhongqiFallsInMonth(z.date, start, end)) {
        hasZq = true;
        if (z.index === 23) hasDz = true;
      }
    }

    spans.push({ start, end, days, hasZhongqi: hasZq, hasDongzhi: hasDz });
  }

  // Step 2: Find 冬至 anchor indices (month 11)
  const dongzhiIndices: number[] = [];
  for (let i = 0; i < spans.length; i++) {
    if (spans[i].hasDongzhi) dongzhiIndices.push(i);
  }

  // Step 3: Number months between consecutive 冬至 anchors
  const assignments = new Map<number, { monthNumber: number; isLeapMonth: boolean }>();

  for (let d = 0; d < dongzhiIndices.length; d++) {
    const m11Idx = dongzhiIndices[d];
    assignments.set(m11Idx, { monthNumber: 11, isLeapMonth: false });

    if (d + 1 >= dongzhiIndices.length) continue;

    const nextM11Idx = dongzhiIndices[d + 1];
    assignments.set(nextM11Idx, { monthNumber: 11, isLeapMonth: false });

    const intermediateCount = nextM11Idx - m11Idx - 1;
    const needsLeap = intermediateCount > 11;

    // Sequential month numbers between two month-11s
    const SEQ = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    let seqIdx = 0;
    let leapInserted = false;

    for (let i = m11Idx + 1; i < nextM11Idx; i++) {
      if (needsLeap && !leapInserted && !spans[i].hasZhongqi) {
        // First month without zhongqi in a leap year → leap month
        const leapNum = seqIdx === 0 ? 11 : SEQ[seqIdx - 1];
        assignments.set(i, { monthNumber: leapNum, isLeapMonth: true });
        leapInserted = true;
      } else {
        if (seqIdx < SEQ.length) {
          assignments.set(i, { monthNumber: SEQ[seqIdx], isLeapMonth: false });
        }
        seqIdx++;
      }
    }
  }

  // Build result from assigned spans
  const result: NumberedMonth[] = [];
  for (let i = 0; i < spans.length; i++) {
    const a = assignments.get(i);
    if (a) {
      result.push({
        monthNumber: a.monthNumber,
        isLeapMonth: a.isLeapMonth,
        startDate: spans[i].start,
        nextDate: spans[i].end,
        days: spans[i].days,
      });
    }
  }

  return result;
}

/**
 * Compute lunar months for a Chinese lunar year.
 *
 * Returns 12 months (non-leap year) or 13 months (leap year),
 * numbered 1-12 with one possible intercalary month.
 *
 * @param lunarYear - The Gregorian year in which the Lunar New Year falls
 */
export function getLunarMonthsForYear(lunarYear: number): LunarMonth[] {
  const cached = monthsCache.get(lunarYear);
  if (cached) return cached;

  // Compute over a wide range to capture the full lunar year
  const newMoons = getNewMoonDates(lunarYear - 1, lunarYear + 1);
  const zhongqi = getZhongqiMoments(lunarYear - 1, lunarYear + 1);
  const sequence = buildMonthSequence(newMoons, zhongqi);

  // Find month 1 for this year: the first non-leap month 1
  // whose Beijing start date is in the target Gregorian year
  let month1Idx = -1;
  for (let i = 0; i < sequence.length; i++) {
    if (sequence[i].monthNumber === 1 && !sequence[i].isLeapMonth) {
      const bj = beijingDate(sequence[i].startDate);
      if (bj.year === lunarYear) {
        month1Idx = i;
        break;
      }
    }
  }

  /* v8 ignore next 3 */
  if (month1Idx < 0) {
    throw new Error(`Cannot find month 1 for lunar year ${lunarYear}`);
  }

  // Collect months from month 1 until the next month 1 (non-leap)
  const result: LunarMonth[] = [];
  for (let i = month1Idx; i < sequence.length; i++) {
    const m = sequence[i];

    // Stop at the next month 1 (non-leap) — that's the start of the next year
    if (i > month1Idx && m.monthNumber === 1 && !m.isLeapMonth) break;

    result.push({
      monthNumber: m.monthNumber,
      isLeapMonth: m.isLeapMonth,
      startDate: beijingMidnight(m.startDate),
      days: m.days,
    });
  }

  monthsCache.set(lunarYear, result);
  if (monthsCache.size > 20) {
    const firstKey = monthsCache.keys().next().value;
    if (firstKey !== undefined) monthsCache.delete(firstKey);
  }

  return result;
}

/**
 * Get the Lunar New Year date (正月初一) for a given Gregorian year.
 *
 * @param gregorianYear - Gregorian year
 * @returns UTC Date of the Lunar New Year (midnight Beijing time expressed as UTC)
 */
export function getLunarNewYear(gregorianYear: number): Date {
  const cached = lnyCache.get(gregorianYear);
  if (cached) return cached;

  const months = getLunarMonthsForYear(gregorianYear);
  const month1 = months.find(m => m.monthNumber === 1 && !m.isLeapMonth);

  /* v8 ignore next 3 */
  if (!month1) {
    throw new Error(`Cannot find month 1 for lunar year ${gregorianYear}`);
  }

  lnyCache.set(gregorianYear, month1.startDate);
  if (lnyCache.size > 20) {
    const firstKey = lnyCache.keys().next().value;
    if (firstKey !== undefined) lnyCache.delete(firstKey);
  }

  return month1.startDate;
}

/**
 * Convert a Gregorian date to a Chinese lunisolar date.
 *
 * @param date - Gregorian date (local time interpreted as Beijing date)
 * @returns Lunisolar date with year, month, day, and leap month flag
 */
export function gregorianToLunisolar(date: Date): LunisolarDate {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const targetMs = Date.UTC(year, month - 1, day);

  // Try the current Gregorian year, then adjacent years
  for (const lunarYear of [year, year - 1, year + 1]) {
    let months: LunarMonth[];
    try {
      months = getLunarMonthsForYear(lunarYear);
    /* v8 ignore next 3 -- defensive: only fails for years outside astronomical computation range */
    } catch {
      continue;
    }

    for (let i = months.length - 1; i >= 0; i--) {
      const m = months[i];
      const startBj = beijingDate(m.startDate);
      const startMs = Date.UTC(startBj.year, startBj.month - 1, startBj.day);

      if (targetMs >= startMs) {
        const lunarDay = Math.floor((targetMs - startMs) / 86400000) + 1;
        if (lunarDay >= 1 && lunarDay <= m.days) {
          return {
            year: lunarYear,
            month: m.monthNumber,
            day: lunarDay,
            isLeapMonth: m.isLeapMonth,
          };
        }
      }
    }
  /* v8 ignore start -- defensive: unreachable for valid Gregorian dates in supported range */
  }

  throw new Error(`Cannot convert ${year}-${month}-${day} to lunisolar date`);
}
/* v8 ignore stop */
