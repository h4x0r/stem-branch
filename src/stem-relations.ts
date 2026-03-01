import type { Stem, Element } from './types';

/** 天干五合 — The five stem combinations and their transformed elements */
export const STEM_COMBINATIONS: readonly { pair: [Stem, Stem]; element: Element }[] = [
  { pair: ['甲', '己'], element: '土' },
  { pair: ['乙', '庚'], element: '金' },
  { pair: ['丙', '辛'], element: '水' },
  { pair: ['丁', '壬'], element: '木' },
  { pair: ['戊', '癸'], element: '火' },
];

/** 天干相沖 — Stem clashes (same element, opposing polarity, 7 positions apart) */
export const STEM_CLASHES: readonly [Stem, Stem][] = [
  ['甲', '庚'], ['乙', '辛'], ['丙', '壬'], ['丁', '癸'],
];

/** Check if two stems form a 五合 combination */
export function isStemCombination(a: Stem, b: Stem): boolean {
  return STEM_COMBINATIONS.some(({ pair: [x, y] }) => (a === x && b === y) || (a === y && b === x));
}

/** Check if two stems clash (相沖) */
export function isStemClash(a: Stem, b: Stem): boolean {
  return STEM_CLASHES.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
}

/** Get the transformed element of a stem combination, or null if not a combination */
export function getCombinedElement(a: Stem, b: Stem): Element | null {
  const found = STEM_COMBINATIONS.find(({ pair: [x, y] }) => (a === x && b === y) || (a === y && b === x));
  return found?.element ?? null;
}
