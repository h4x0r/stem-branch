/**
 * 祿神 (Salary Star / 日祿)
 *
 * Each heavenly stem has a "salary" branch -- the branch where the stem
 * reaches its 臨官 (official/prosperous) stage in the twelve life stages.
 * When this branch appears in the chart, it indicates prosperity.
 */

import type { Stem, Branch } from './types';

/** Stem → 祿 branch (臨官 position) */
export const SALARY_STAR: Record<Stem, Branch> = {
  '甲': '寅', '乙': '卯',
  '丙': '巳', '丁': '午',
  '戊': '巳', '己': '午',
  '庚': '申', '辛': '酉',
  '壬': '亥', '癸': '子',
};

/** Get the 祿神 branch for a given heavenly stem */
export function getSalaryStar(stem: Stem): Branch {
  return SALARY_STAR[stem];
}
