/* c8 ignore next */
import type { Branch, ChineseZodiacAnimal, ChineseZodiacResult, YearBoundary } from './types';
import { BRANCHES } from './branches';
import { findSpringStart } from './solar-terms';
import { getLunarNewYear } from './lunisolar-calendar';

/** 生肖 (Chinese Zodiac Animals) mapped to 地支 in order */
export const ZODIAC_ANIMALS: readonly ChineseZodiacAnimal[] = [
  '鼠', '牛', '虎', '兔', '龍', '蛇',
  '馬', '羊', '猴', '雞', '狗', '豬',
];

/** English names for the 12 animals */
export const ZODIAC_ENGLISH: Record<ChineseZodiacAnimal, string> = {
  '鼠': 'Rat', '牛': 'Ox', '虎': 'Tiger', '兔': 'Rabbit',
  '龍': 'Dragon', '蛇': 'Snake', '馬': 'Horse', '羊': 'Goat',
  '猴': 'Monkey', '雞': 'Rooster', '狗': 'Dog', '豬': 'Pig',
};

/** Get the zodiac animal for a given branch */
export function animalFromBranch(branch: Branch): ChineseZodiacAnimal {
  return ZODIAC_ANIMALS[BRANCHES.indexOf(branch)];
}

/** Get the branch for a given zodiac animal */
export function branchFromAnimal(animal: ChineseZodiacAnimal): Branch {
  return BRANCHES[ZODIAC_ANIMALS.indexOf(animal)];
}

/**
 * 立春派 (Spring Start School): Year changes at 立春 (Start of Spring, solar longitude 315°).
 * Used in traditional 四柱八字 (Four Pillars of Destiny) and most 術數 systems.
 *
 * @param date - Date to determine zodiac for
 * @returns Chinese zodiac result with the effective year boundary
 */
export function getZodiacBySpringStart(date: Date): ChineseZodiacResult {
  const year = date.getFullYear();
  const springStart = findSpringStart(year);
  const effectiveYear = date >= springStart ? year : year - 1;
  const branchIndex = ((effectiveYear - 4) % 12 + 12) % 12;
  const branch = BRANCHES[branchIndex];
  const animal = ZODIAC_ANIMALS[branchIndex];

  return { animal, branch, yearBoundary: 'spring-start', effectiveYear };
}

/**
 * 初一派 (Lunar New Year School): Year changes at 農曆正月初一 (1st day of 1st lunar month).
 * Used in popular culture and everyday reference.
 *
 * Computes LNY from first principles using astronomical new moon and solar term
 * algorithms — no hardcoded lookup table.
 *
 * @param date - Date to determine zodiac for
 * @returns Chinese zodiac result with the effective year boundary
 */
export function getChineseZodiacLunarNewYear(date: Date): ChineseZodiacResult {
  const year = date.getFullYear();
  const lnyUTC = getLunarNewYear(year);
  // getLunarNewYear returns Beijing midnight as UTC — extract the Beijing calendar date
  const bjDate = new Date(lnyUTC.getTime() + 8 * 3600000);
  const lnyDate = new Date(year, bjDate.getUTCMonth(), bjDate.getUTCDate());
  const effectiveYear = date >= lnyDate ? year : year - 1;
  const branchIndex = ((effectiveYear - 4) % 12 + 12) % 12;
  const branch = BRANCHES[branchIndex];
  const animal = ZODIAC_ANIMALS[branchIndex];

  return { animal, branch, yearBoundary: 'lunar-new-year', effectiveYear };
}

/**
 * Get Chinese zodiac using the specified school.
 *
 * @param date - Date to determine zodiac for
 * @param boundary - Which year boundary convention to use:
 *   - 'spring-start' (default): 立春派 — year starts at 立春 (astronomy-based, exact)
 *   - 'lunar-new-year': 初一派 — year starts at lunar new year (approximation)
 */
export function getChineseZodiac(
  date: Date,
  boundary: YearBoundary = 'spring-start',
): ChineseZodiacResult {
  return boundary === 'spring-start'
    ? getZodiacBySpringStart(date)
    : getChineseZodiacLunarNewYear(date);
}

