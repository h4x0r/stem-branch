/**
 * 建除十二神 (Twelve Day Fitness Cycle)
 *
 * The 12-day fitness cycle used in Chinese almanacs (通書/黃曆).
 * The day whose branch matches the month branch is 建日.
 * Fitness values cycle forward from there: 建除滿平定執破危成收開閉.
 *
 * Month determination uses solar month boundaries (節氣),
 * the same as the month pillar in 四柱.
 */

import type { Branch } from './types';
import { BRANCHES } from './branches';
import { computeFourPillars } from './four-pillars';

// ── Types ────────────────────────────────────────────────────

export type DayFitness =
  | '建' | '除' | '滿' | '平' | '定' | '執'
  | '破' | '危' | '成' | '收' | '開' | '閉';

// ── Constants ────────────────────────────────────────────────

/** The twelve fitness values in cycle order */
export const DAY_FITNESS_CYCLE: readonly DayFitness[] = [
  '建', '除', '滿', '平', '定', '執',
  '破', '危', '成', '收', '開', '閉',
];

/**
 * Auspicious/inauspicious classification.
 * - 吉 (auspicious): 建, 除, 滿, 定, 成, 開
 * - 凶 (inauspicious): 平, 執, 破, 危, 收, 閉
 */
export const DAY_FITNESS_AUSPICIOUS: Record<DayFitness, boolean> = {
  '建': true,  // 建 — establishing
  '除': true,  // 除 — removing
  '滿': true,  // 滿 — fullness
  '平': false, // 平 — leveling
  '定': true,  // 定 — settling
  '執': false, // 執 — grasping
  '破': false, // 破 — breaking
  '危': false, // 危 — danger
  '成': true,  // 成 — completion
  '收': false, // 收 — collecting
  '開': true,  // 開 — opening
  '閉': false, // 閉 — closing
};

// ── Functions ────────────────────────────────────────────────

/**
 * Get the 建除 fitness for a given day branch and month branch.
 *
 * The day whose branch matches the month branch is 建日.
 * Subsequent branches cycle through the 12 fitness values.
 *
 * @param dayBranch - The day's earthly branch
 * @param monthBranch - The month's earthly branch (from solar month)
 */
export function getDayFitness(dayBranch: Branch, monthBranch: Branch): DayFitness {
  const dayIdx = BRANCHES.indexOf(dayBranch);
  const monthIdx = BRANCHES.indexOf(monthBranch);
  const offset = ((dayIdx - monthIdx) % 12 + 12) % 12;
  return DAY_FITNESS_CYCLE[offset];
}

/**
 * Get the 建除 fitness for a specific date.
 *
 * Uses the astronomical solar month boundary (same as month pillar)
 * to determine the month branch, and the day pillar for the day branch.
 *
 * @param date - The date to compute for
 * @returns Fitness value and auspicious flag
 */
export function getDayFitnessForDate(date: Date): { fitness: DayFitness; auspicious: boolean } {
  const pillars = computeFourPillars(date);
  const dayBranch = pillars.day.branch;
  const monthBranch = pillars.month.branch;
  const fitness = getDayFitness(dayBranch, monthBranch);
  return { fitness, auspicious: DAY_FITNESS_AUSPICIOUS[fitness] };
}
