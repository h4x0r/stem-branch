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

// ── Four Pillars Computation ────────────────────────────────

/**
 * Compute the Four Pillars (四柱八字) for a given date and time.
 *
 * Year pillar: Changes at 立春 (Start of Spring), not Jan 1.
 * Month pillar: Based on 節 (Jie solar terms) boundaries.
 * Day pillar: Based on 60-cycle counting from reference epoch.
 * Hour pillar: Based on 2-hour 時辰 divisions.
 *
 * Uses exact astronomical solar term boundaries via full VSOP87B computation.
 *
 * @param date - Local date/time to compute pillars for
 * @returns The four pillars (年柱、月柱、日柱、時柱)
 */
export function computeFourPillars(date: Date): FourPillars {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();

  // ── 年柱 (Year Pillar) — year changes at 立春 ──
  const springStart = findSpringStart(year);
  const effectiveYear = date >= springStart ? year : year - 1;

  const yearStemIdx = ((effectiveYear - 4) % 10 + 10) % 10;
  const yearBranchIdx = ((effectiveYear - 4) % 12 + 12) % 12;

  // ── 月柱 (Month Pillar) — based on 節 boundaries ──
  const { monthIndex: solarMonthIdx } = getSolarMonthExact(date);

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
