import type { Stem, Branch, LifeStage } from './types';
import { BRANCHES } from './branches';
import { stemPolarity } from './stems';

/** 長生十二神 — The twelve life stages in order */
export const TWELVE_STAGES: readonly LifeStage[] = [
  '長生', '沐浴', '冠帶', '臨官', '帝旺', '衰',
  '病', '死', '墓', '絕', '胎', '養',
];

/**
 * Starting branch index for 長生 for each yang stem.
 * 甲→亥(11), 丙→寅(2), 戊→寅(2), 庚→巳(5), 壬→申(8)
 */
const YANG_START: Record<string, number> = {
  '甲': 11, '丙': 2, '戊': 2, '庚': 5, '壬': 8,
};

/**
 * Starting branch index for 長生 for each yin stem.
 * 乙→午(6), 丁→酉(9), 己→酉(9), 辛→子(0), 癸→卯(3)
 */
const YIN_START: Record<string, number> = {
  '乙': 6, '丁': 9, '己': 9, '辛': 0, '癸': 3,
};

/**
 * Get the life stage (長生十二神) of a stem at a given branch.
 *
 * Yang stems progress clockwise (ascending branch index).
 * Yin stems progress counter-clockwise (descending branch index).
 */
export function getLifeStage(stem: Stem, branch: Branch): LifeStage {
  const branchIdx = BRANCHES.indexOf(branch);
  const isYang = stemPolarity(stem) === '陽';
  const startIdx = isYang ? YANG_START[stem] : YIN_START[stem];

  let offset: number;
  if (isYang) {
    offset = ((branchIdx - startIdx) % 12 + 12) % 12;
  } else {
    offset = ((startIdx - branchIdx) % 12 + 12) % 12;
  }

  return TWELVE_STAGES[offset];
}
