/**
 * 沖煞 (Day Clash & Evil Direction)
 *
 * Derives which animal the day clashes with (六衝) and the
 * associated "sha" (煞) compass direction to avoid.
 */

import type { Branch } from './types';
import { computeFourPillars } from './four-pillars';
import { BRANCHES } from './branches';

// ── Clash mapping (六衝: opposite branch, +6 mod 12) ────────

function getClashBranch(branch: Branch): Branch {
  const idx = BRANCHES.indexOf(branch);
  return BRANCHES[(idx + 6) % 12];
}

// ── Branch → Animal ──────────────────────────────────────────

const BRANCH_ANIMAL: Record<Branch, string> = {
  '子': '鼠', '丑': '牛', '寅': '虎', '卯': '兔',
  '辰': '龍', '巳': '蛇', '午': '馬', '未': '羊',
  '申': '猴', '酉': '雞', '戌': '狗', '亥': '豬',
};

// ── Branch → Direction (煞方) ────────────────────────────────
// The "sha" direction is the direction of the clashing branch.

const BRANCH_DIRECTION: Record<Branch, string> = {
  '子': '北', '丑': '北', '寅': '東', '卯': '東',
  '辰': '東', '巳': '南', '午': '南', '未': '南',
  '申': '西', '酉': '西', '戌': '西', '亥': '北',
};

// ── Public API ───────────────────────────────────────────────

export interface DayClash {
  /** The branch that clashes with the day branch */
  clashBranch: Branch;
  /** The zodiac animal of the clashing branch */
  clashAnimal: string;
  /** The compass direction to avoid (煞方) */
  direction: string;
  /** Traditional display format: 沖X煞X */
  display: string;
}

export function getDayClash(dayBranch: Branch): DayClash {
  const clashBranch = getClashBranch(dayBranch);
  const clashAnimal = BRANCH_ANIMAL[clashBranch];
  const direction = BRANCH_DIRECTION[clashBranch];

  return {
    clashBranch,
    clashAnimal,
    direction,
    display: `沖${clashAnimal}煞${direction}`,
  };
}

export function getDayClashForDate(date: Date): DayClash {
  const pillars = computeFourPillars(date);
  return getDayClash(pillars.day.branch);
}
