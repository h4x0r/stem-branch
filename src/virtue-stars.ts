/**
 * 天德 / 月德 (Heavenly Virtue / Monthly Virtue)
 *
 * Auspicious stars derived from the month's earthly branch.
 * 月德 is the yang stem of the month's three-harmony element.
 * 天德 follows a traditional 12-entry lookup.
 * Both have 合 (combination partner) variants.
 */

import type { Stem, Branch } from './types';

// ── Helpers ─────────────────────────────────────────────────────

const STEMS = '甲乙丙丁戊己庚辛壬癸';

/** 天干五合 (stem combination) partners */
const STEM_COMBO: Record<Stem, Stem> = {
  '甲': '己', '己': '甲',
  '乙': '庚', '庚': '乙',
  '丙': '辛', '辛': '丙',
  '丁': '壬', '壬': '丁',
  '戊': '癸', '癸': '戊',
};

/** 地支六合 (branch harmony) partners */
const BRANCH_COMBO: Record<Branch, Branch> = {
  '子': '丑', '丑': '子',
  '寅': '亥', '亥': '寅',
  '卯': '戌', '戌': '卯',
  '辰': '酉', '酉': '辰',
  '巳': '申', '申': '巳',
  '午': '未', '未': '午',
};

// ── 月德 (Monthly Virtue) ───────────────────────────────────────

/**
 * Month branch → 月德 stem.
 * Derived from the three-harmony group's yang stem:
 * 寅午戌(火) → 丙, 亥卯未(木) → 甲, 申子辰(水) → 壬, 巳酉丑(金) → 庚
 */
const MONTHLY_VIRTUE: Record<Branch, Stem> = {
  '寅': '丙', '午': '丙', '戌': '丙',
  '亥': '甲', '卯': '甲', '未': '甲',
  '申': '壬', '子': '壬', '辰': '壬',
  '巳': '庚', '酉': '庚', '丑': '庚',
};

export function getMonthlyVirtue(monthBranch: Branch): Stem {
  return MONTHLY_VIRTUE[monthBranch];
}

/** 月德合: the 五合 partner of the 月德 stem */
export function getMonthlyVirtueCombo(monthBranch: Branch): Stem {
  return STEM_COMBO[MONTHLY_VIRTUE[monthBranch]];
}

// ── 天德 (Heavenly Virtue) ──────────────────────────────────────

/**
 * Month branch → 天德.
 * Traditional 12-entry lookup; the value can be a stem or a branch.
 */
const HEAVENLY_VIRTUE: Record<Branch, Stem | Branch> = {
  '寅': '丁', '卯': '申', '辰': '壬', '巳': '辛',
  '午': '亥', '未': '甲', '申': '癸', '酉': '寅',
  '戌': '丙', '亥': '乙', '子': '巳', '丑': '庚',
};

export function getHeavenlyVirtue(monthBranch: Branch): Stem | Branch {
  return HEAVENLY_VIRTUE[monthBranch];
}

/** 天德合: stem天德 → 五合 partner, branch天德 → 六合 partner */
export function getHeavenlyVirtueCombo(monthBranch: Branch): Stem | Branch {
  const hv = HEAVENLY_VIRTUE[monthBranch];
  if (STEMS.includes(hv)) {
    return STEM_COMBO[hv as Stem];
  }
  return BRANCH_COMBO[hv as Branch];
}
