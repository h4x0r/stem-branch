/* v8 ignore next */
/**
 * 紫白九星 (Purple-White Nine Stars)
 *
 * Flying star system based on the Lo Shu magic square.
 * Computes the ruling star (1–9) for year, month, day, and hour.
 *
 * Based on 三元九運 (180-year grand cycle):
 * - 上元 (1864–1923): Year star starts at 一白, descends
 * - 中元 (1924–1983): Year star starts at 四綠, descends
 * - 下元 (1984–2043): Year star starts at 七赤, descends
 */

import type { Element } from './types';
import { findSpringStart, getSolarMonthExact } from './solar-terms';

// ── Types ────────────────────────────────────────────────────

export type FlyingStar = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface FlyingStarInfo {
  number: FlyingStar;
  name: string;
  element: Element;
  color: string;
}

// ── Constants ────────────────────────────────────────────────

/** The nine stars in Lo Shu order (一白 through 九紫) */
export const FLYING_STARS: readonly FlyingStarInfo[] = [
  { number: 1, name: '一白', element: '水', color: '白' },
  { number: 2, name: '二黑', element: '土', color: '黑' },
  { number: 3, name: '三碧', element: '木', color: '碧' },
  { number: 4, name: '四綠', element: '木', color: '綠' },
  { number: 5, name: '五黃', element: '土', color: '黃' },
  { number: 6, name: '六白', element: '金', color: '白' },
  { number: 7, name: '七赤', element: '金', color: '赤' },
  { number: 8, name: '八白', element: '土', color: '白' },
  { number: 9, name: '九紫', element: '火', color: '紫' },
];

/** Starting 寅月 star by year-star group (yearStar % 3) */
const MONTH_START: Record<number, number> = {
  1: 8, // year stars 1/4/7 → 寅月 = 八白
  2: 5, // year stars 2/5/8 → 寅月 = 五黃
  0: 2, // year stars 3/6/9 → 寅月 = 二黑
};

// ── Helpers ──────────────────────────────────────────────────

/** Map 0 → 9, leave 1–8 unchanged */
function wrap9(n: number): FlyingStar {
  return (n === 0 ? 9 : n) as FlyingStar;
}

// ── Year Star ────────────────────────────────────────────────

/**
 * Get the 紫白 year star for a given date.
 *
 * Year changes at 立春, not Jan 1.
 * Stars descend: 1864 = 一白(1), 1865 = 九紫(9), 1866 = 八白(8), …
 */
export function getYearStar(date: Date): FlyingStar {
  const year = date.getFullYear();
  const springStart = findSpringStart(year);
  const effectiveYear = date >= springStart ? year : year - 1;

  const offset = ((effectiveYear - 1864) % 9 + 9) % 9; // 0–8
  return wrap9((10 - offset) % 9);
}

// ── Month Star ───────────────────────────────────────────────

/**
 * Get the 紫白 month star for a given date.
 *
 * Depends on year star group and solar month (節 boundaries):
 * - Group 1/4/7: 寅月 = 八白(8), descending
 * - Group 2/5/8: 寅月 = 五黃(5), descending
 * - Group 3/6/9: 寅月 = 二黑(2), descending
 */
export function getMonthStar(date: Date): FlyingStar {
  const yearStar = getYearStar(date);
  const startStar = MONTH_START[yearStar % 3];
  const { monthIndex } = getSolarMonthExact(date); // 0 = 寅月
  return wrap9(((startStar - monthIndex) % 9 + 9) % 9);
}

// ── Day Star ─────────────────────────────────────────────────

/**
 * Get the 紫白 day star for a given date.
 *
 * Continuous ascending 9-day cycle anchored to 2000-01-07
 * (甲子日 after 冬至 1999 = 上元 甲子 = 一白).
 *
 * The 180-day subcycle is naturally encoded:
 * - 上元 甲子 = 一白(1), 中元 甲子 = 七赤(7), 下元 甲子 = 四綠(4)
 */
export function getDayStar(date: Date): FlyingStar {
  const ms = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.floor(ms / 86400000);
  // Offset +8 so that 2000-01-07 (day 10963) maps to star 1
  const raw = ((days + 8) % 9 + 9) % 9;
  return (raw + 1) as FlyingStar;
}

// ── Hour Star ────────────────────────────────────────────────

/**
 * Get the 紫白 hour star for a given date/time.
 *
 * Depends on day star group:
 * - Day stars 1/4/7: 子時 = 一白(1), ascending
 * - Day stars 2/5/8: 子時 = 四綠(4), ascending
 * - Day stars 3/6/9: 子時 = 七赤(7), ascending
 */
export function getHourStar(date: Date): FlyingStar {
  const hour = date.getHours();

  // 早子時 (23:00–23:59) belongs to the next calendar day
  let dayStar: FlyingStar;
  if (hour >= 23) {
    const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    dayStar = getDayStar(next);
  } else {
    dayStar = getDayStar(date);
  }

  const group = dayStar % 3;
  const ziStar = group === 1 ? 1 : group === 2 ? 4 : 7;

  const hourBranchIdx = hour >= 23 ? 0 : Math.floor((hour + 1) / 2);
  const raw = ((ziStar - 1 + hourBranchIdx) % 9 + 9) % 9;
  return (raw + 1) as FlyingStar;
}

// ── Aggregate ────────────────────────────────────────────────

/**
 * Get all four 紫白 stars (year, month, day, hour) for a date/time.
 */
export function getFlyingStars(date: Date): {
  year: FlyingStar;
  month: FlyingStar;
  day: FlyingStar;
  hour: FlyingStar;
} {
  return {
    year: getYearStar(date),
    month: getMonthStar(date),
    day: getDayStar(date),
    hour: getHourStar(date),
  };
}
