/* c8 ignore next */
import type { Stem, Branch, FourPillars } from './types';
import { STEMS, stemByIndex } from './stems';
import { BRANCHES, branchByIndex } from './branches';
import { findSpringStart, getSolarMonthExact } from './solar-terms';

// ── Helpers ─────────────────────────────────────────────────

/** UTC days since Unix epoch for a date */
function utcDays(year: number, month: number, day: number): number {
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
}

/**
 * Approximate solar month index (0=寅月 through 11=丑月).
 * Accurate to ±1 day — used as fallback when exact computation is not needed.
 */
function getSolarMonthApprox(m: number, d: number): number {
  const md = m * 100 + d;
  if (md >= 204 && md < 306) return 0;   // 寅月: 立春 ~Feb 4
  if (md >= 306 && md < 405) return 1;   // 卯月: 驚蟄 ~Mar 6
  if (md >= 405 && md < 506) return 2;   // 辰月: 清明 ~Apr 5
  if (md >= 506 && md < 606) return 3;   // 巳月: 立夏 ~May 6
  if (md >= 606 && md < 707) return 4;   // 午月: 芒種 ~Jun 6
  if (md >= 707 && md < 808) return 5;   // 未月: 小暑 ~Jul 7
  if (md >= 808 && md < 908) return 6;   // 申月: 立秋 ~Aug 8
  if (md >= 908 && md < 1008) return 7;  // 酉月: 白露 ~Sep 8
  if (md >= 1008 && md < 1107) return 8; // 戌月: 寒露 ~Oct 8
  if (md >= 1107 && md < 1207) return 9; // 亥月: 立冬 ~Nov 7
  if (md >= 1207) return 10;             // 子月: 大雪 ~Dec 7
  if (md < 106) return 10;              // 子月 continued
  return 11;                             // 丑月: 小寒 ~Jan 6
}

// ── Four Pillars Computation ────────────────────────────────

export interface ComputeOptions {
  /**
   * Use exact astronomical solar term boundaries (via VSOP87B).
   * When false, uses ±1 day approximation (faster, no VSOP evaluation at runtime).
   * Default: true
   */
  exact?: boolean;
}

/**
 * Compute the Four Pillars (四柱八字) for a given date and time.
 *
 * Year pillar: Changes at 立春 (Start of Spring), not Jan 1.
 * Month pillar: Based on 節 (Jie solar terms) boundaries.
 * Day pillar: Based on 60-cycle counting from reference epoch.
 * Hour pillar: Based on 2-hour 時辰 divisions.
 *
 * @param date - Local date/time to compute pillars for
 * @param options - Computation options (exact vs approximate solar terms)
 * @returns The four pillars (年柱、月柱、日柱、時柱)
 */
export function computeFourPillars(date: Date, options: ComputeOptions = {}): FourPillars {
  const { exact = true } = options;

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();

  // ── 年柱 (Year Pillar) — year changes at 立春 ──
  let effectiveYear: number;
  if (exact) {
    const springStart = findSpringStart(year);
    effectiveYear = date >= springStart ? year : year - 1;
  } else {
    const springStartMd = 204; // ~Feb 4
    const dateMd = month * 100 + day;
    effectiveYear = dateMd >= springStartMd ? year : year - 1;
  }

  const yearStemIdx = ((effectiveYear - 4) % 10 + 10) % 10;
  const yearBranchIdx = ((effectiveYear - 4) % 12 + 12) % 12;

  // ── 月柱 (Month Pillar) — based on 節 boundaries ──
  let solarMonthIdx: number;
  if (exact) {
    const result = getSolarMonthExact(date);
    solarMonthIdx = result.monthIndex;
  } else {
    solarMonthIdx = getSolarMonthApprox(month, day);
  }

  const monthBranchIdx = (solarMonthIdx + 2) % 12; // 寅=2, 卯=3, ...
  // 甲己之年丙作首: first month stem = (yearStemIdx % 5) * 2 + 2
  const firstMonthStem = ((yearStemIdx % 5) * 2 + 2) % 10;
  const monthStemIdx = (firstMonthStem + solarMonthIdx) % 10;

  // ── 日柱 (Day Pillar) — 60-cycle from epoch ──
  // Reference: 2000-01-07 = 甲子日 → offset = 17
  const days = utcDays(year, month, day);
  const dayStemBranchIdx = ((days % 60) + 17 + 60) % 60;
  const dayStemIdx = dayStemBranchIdx % 10;
  const dayBranchIdx = dayStemBranchIdx % 12;

  // ── 時柱 (Hour Pillar) ──
  // 子時 = 23:00-00:59 (crosses calendar days)
  let hourBranchIdx: number;
  let effectiveDayStemIdx = dayStemIdx;

  if (hour >= 23) {
    hourBranchIdx = 0; // 早子時 of next day
    effectiveDayStemIdx = (dayStemIdx + 1) % 10;
  } else {
    hourBranchIdx = Math.floor((hour + 1) / 2);
  }

  // 甲己還加甲: first hour stem = (dayStemIdx % 5) * 2
  const firstHourStem = (effectiveDayStemIdx % 5) * 2;
  const hourStemIdx = (firstHourStem + hourBranchIdx) % 10;

  return {
    year: { stem: stemByIndex(yearStemIdx), branch: branchByIndex(yearBranchIdx) },
    month: { stem: stemByIndex(monthStemIdx), branch: branchByIndex(monthBranchIdx) },
    day: { stem: stemByIndex(dayStemIdx), branch: branchByIndex(dayBranchIdx) },
    hour: { stem: stemByIndex(hourStemIdx), branch: branchByIndex(hourBranchIdx) },
  };
}
