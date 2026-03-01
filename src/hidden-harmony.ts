import type { Branch, Element } from './types';
import { BRANCHES } from './branches';
import { HIDDEN_STEMS } from './hidden-stems';
import { isStemCombination, getCombinedElement } from './stem-relations';
import { isHarmony } from './branch-relations';

export interface HiddenHarmonyPair {
  branches: [Branch, Branch];
  element: Element;
}

/**
 * Compute all 暗合 pairs by checking if main hidden stems (本氣)
 * of two branches form a 天干五合 combination.
 * Excludes pairs that are already 六合.
 */
function computeHiddenHarmonyPairs(): HiddenHarmonyPair[] {
  const pairs: HiddenHarmonyPair[] = [];
  for (let i = 0; i < BRANCHES.length; i++) {
    for (let j = i + 1; j < BRANCHES.length; j++) {
      const a = BRANCHES[i];
      const b = BRANCHES[j];
      // Skip pairs that are already 六合
      if (isHarmony(a, b)) continue;
      const mainA = HIDDEN_STEMS[a][0].stem;
      const mainB = HIDDEN_STEMS[b][0].stem;
      if (isStemCombination(mainA, mainB)) {
        const element = getCombinedElement(mainA, mainB)!;
        pairs.push({ branches: [a, b], element });
      }
    }
  }
  return pairs;
}

/** Pre-computed 暗合 pairs */
export const HIDDEN_HARMONY_PAIRS: readonly HiddenHarmonyPair[] = computeHiddenHarmonyPairs();

/** Check if two branches have 暗合 */
export function isHiddenHarmony(a: Branch, b: Branch): boolean {
  return HIDDEN_HARMONY_PAIRS.some(
    ({ branches: [x, y] }) => (a === x && b === y) || (a === y && b === x),
  );
}

/** Get all hidden harmony pairs */
export function getHiddenHarmonyPairs(): readonly HiddenHarmonyPair[] {
  return HIDDEN_HARMONY_PAIRS;
}
