import type { Stem, Branch, TenRelation } from './types';
import { STEM_ELEMENT, stemPolarity } from './stems';
import { getElementRelation } from './elements';
import { HIDDEN_STEMS } from './hidden-stems';

/**
 * 十神 (Ten Relations / Ten Gods)
 *
 * Determined by comparing the day stem to another stem:
 * 1. Find the five-element relationship (比和/生/剋/被生/被剋)
 * 2. Check if same or different polarity (陰陽)
 *
 * | Relationship  | Same polarity | Different polarity |
 * |---------------|---------------|--------------------|
 * | 比和 (same)   | 比肩          | 劫財               |
 * | 生 (I produce)| 食神          | 傷官               |
 * | 剋 (I conquer)| 偏財          | 正財               |
 * | 被剋 (conquers me) | 七殺     | 正官               |
 * | 被生 (produces me) | 偏印     | 正印               |
 */

/** All ten relation names in order */
export const TEN_RELATION_NAMES: readonly TenRelation[] = [
  '比肩', '劫財', '食神', '傷官', '偏財',
  '正財', '七殺', '正官', '偏印', '正印',
];

/** Get the ten-relation between a day stem and another stem */
export function getTenRelation(dayStem: Stem, otherStem: Stem): TenRelation {
  const dayEl = STEM_ELEMENT[dayStem];
  const otherEl = STEM_ELEMENT[otherStem];
  const rel = getElementRelation(dayEl, otherEl);
  const samePolarity = stemPolarity(dayStem) === stemPolarity(otherStem);

  switch (rel) {
    case '比和': return samePolarity ? '比肩' : '劫財';
    case '生':   return samePolarity ? '食神' : '傷官';
    case '剋':   return samePolarity ? '偏財' : '正財';
    case '被剋': return samePolarity ? '七殺' : '正官';
    case '被生': return samePolarity ? '偏印' : '正印';
  }
}

/** Get the ten-relation for a branch using its main hidden stem (本氣) */
export function getTenRelationForBranch(dayStem: Stem, branch: Branch): TenRelation {
  const mainStem = HIDDEN_STEMS[branch][0].stem;
  return getTenRelation(dayStem, mainStem);
}
