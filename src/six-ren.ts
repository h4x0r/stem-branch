/* v8 ignore next */
/**
 * 大六壬 (Grand Six Ren)
 *
 * Classical Chinese divination using 天地盤 (heaven/earth plates),
 * 四課 (four lessons), 三傳 (three transmissions), and
 * 十二天將 (twelve heavenly generals).
 *
 * The system derives from the day's stem-branch, the current hour branch,
 * and the 月將 (monthly general), which shifts at each 中氣 boundary.
 */

import type { Stem, Branch, Element } from './types';
import { STEMS } from './stems';
import { BRANCHES, BRANCH_ELEMENT, branchByIndex, branchFromHour } from './branches';
import { STEM_ELEMENT, stemPolarity } from './stems';
import { branchPolarity } from './branches';
import { CONQUERING_CYCLE } from './elements';
import { getSolarTermsForYear, SOLAR_TERM_NAMES } from './solar-terms';
import { computeFourPillars } from './four-pillars';

// ── Types ────────────────────────────────────────────────────

export type HeavenlyGeneral =
  | '貴人' | '螣蛇' | '朱雀' | '六合' | '勾陳' | '青龍'
  | '天空' | '白虎' | '太常' | '玄武' | '太陰' | '天后';

export type TransmissionMethod =
  | '賊剋' | '比用' | '涉害' | '遙剋' | '昴星'
  | '別責' | '八專' | '返吟' | '伏吟';

export interface SixRenLesson {
  upper: Branch; // 天盤 branch (上神)
  lower: Branch; // 地盤 branch or stem lodging (下)
}

export interface SixRenChart {
  dayStem: Stem;
  dayBranch: Branch;
  hourBranch: Branch;
  monthlyGeneral: Branch;

  plates: Record<Branch, Branch>;  // 地盤 branch → 天盤 branch

  lessons: [SixRenLesson, SixRenLesson, SixRenLesson, SixRenLesson];

  transmissions: { initial: Branch; middle: Branch; final: Branch };
  method: TransmissionMethod;

  generals: Record<Branch, HeavenlyGeneral>;
}

// ── Constants ────────────────────────────────────────────────

/** 日干寄宮 — same as 祿 (prosperity star) mapping */
export const STEM_LODGING: Record<Stem, Branch> = {
  '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午', '戊': '巳',
  '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子',
};

/** 十二天將 in traditional order */
export const HEAVENLY_GENERALS: readonly HeavenlyGeneral[] = [
  '貴人', '螣蛇', '朱雀', '六合', '勾陳', '青龍',
  '天空', '白虎', '太常', '玄武', '太陰', '天后',
];

/**
 * 天乙貴人 positions: [daytime, nighttime] per day stem.
 * Used for placing 貴人 on the plate.
 */
const NOBLE_POSITIONS: Record<Stem, [Branch, Branch]> = {
  '甲': ['丑', '未'], '戊': ['丑', '未'], '庚': ['丑', '未'],
  '乙': ['子', '申'], '己': ['子', '申'],
  '丙': ['亥', '酉'], '丁': ['亥', '酉'],
  '壬': ['巳', '卯'], '癸': ['巳', '卯'],
  '辛': ['午', '寅'],
};

// ── Helpers ──────────────────────────────────────────────────

function branchIdx(b: Branch): number {
  return BRANCHES.indexOf(b);
}

function elemOf(b: Branch): Element {
  return BRANCH_ELEMENT[b];
}

/** Check if element A 剋 (conquers) element B */
function conquers(a: Element, b: Element): boolean {
  return CONQUERING_CYCLE[a] === b;
}

/** Determine if the hour branch indicates daytime */
function isDaytime(hourBranch: Branch): boolean {
  const idx = branchIdx(hourBranch);
  // 卯(3)–申(8) = daytime
  return idx >= 3 && idx <= 8;
}

// ── buildPlates ──────────────────────────────────────────────

/**
 * Build 天地盤 (heaven/earth plates).
 *
 * The 地盤 is fixed (子丑寅...亥). The 天盤 rotates so that
 * the monthly general aligns over the current hour branch.
 *
 * @param monthlyGeneral - 月將 branch
 * @param hourBranch - current hour branch (時辰)
 * @returns Mapping from each 地盤 branch to its 天盤 branch
 */
export function buildPlates(monthlyGeneral: Branch, hourBranch: Branch): Record<Branch, Branch> {
  const offset = ((branchIdx(monthlyGeneral) - branchIdx(hourBranch)) % 12 + 12) % 12;
  const plates = {} as Record<Branch, Branch>;
  for (const b of BRANCHES) {
    plates[b] = branchByIndex(branchIdx(b) + offset);
  }
  return plates;
}

// ── buildFourLessons ─────────────────────────────────────────

/**
 * Derive 四課 (four lessons) from the day stem-branch and plates.
 *
 * Standard method:
 * - L1: 天盤[寄宮] / 寄宮    (干上 / 干)
 * - L2: 天盤[L1.upper] / L1.upper  (干上之上 / 干上)
 * - L3: 天盤[日支] / 日支    (支上 / 支)
 * - L4: 天盤[L3.upper] / L3.upper  (支上之上 / 支上)
 */
export function buildFourLessons(
  dayStem: Stem,
  dayBranch: Branch,
  plates: Record<Branch, Branch>,
): [SixRenLesson, SixRenLesson, SixRenLesson, SixRenLesson] {
  const lodging = STEM_LODGING[dayStem];

  const l1Upper = plates[lodging];
  const l2Upper = plates[l1Upper];
  const l3Upper = plates[dayBranch];
  const l4Upper = plates[l3Upper];

  return [
    { upper: l1Upper, lower: lodging },
    { upper: l2Upper, lower: l1Upper },
    { upper: l3Upper, lower: dayBranch },
    { upper: l4Upper, lower: l3Upper },
  ];
}

// ── Three Transmissions derivation ───────────────────────────

interface KeResult {
  lessonIndex: number;
  upper: Branch;
  lower: Branch;
  type: '上剋下' | '下賊上';
}

/**
 * Find all 剋 relationships in the four lessons.
 * 上剋下: upper element conquers lower element
 * 下賊上: lower element conquers upper element
 */
function findAllConquests(lessons: SixRenLesson[]): KeResult[] {
  const results: KeResult[] = [];
  for (let i = 0; i < lessons.length; i++) {
    const { upper, lower } = lessons[i];
    const upperEl = elemOf(upper);
    const lowerEl = elemOf(lower);

    if (conquers(upperEl, lowerEl)) {
      results.push({ lessonIndex: i, upper, lower, type: '上剋下' });
    } else if (conquers(lowerEl, upperEl)) {
      results.push({ lessonIndex: i, upper, lower, type: '下賊上' });
    }
  }
  return results;
}

/**
 * 比用: among multiple 賊剋 candidates, prefer the one whose
 * upper branch has the same yin/yang polarity as the day stem.
 */
function matchByPolarity(candidates: KeResult[], dayStem: Stem): KeResult[] {
  const stemPol = stemPolarity(dayStem);
  const matched = candidates.filter(c => branchPolarity(c.upper) === stemPol);
  return matched.length > 0 ? matched : candidates;
}

/**
 * 涉害: among still-tied candidates, count 剋 depth from each
 * candidate's upper branch to the day stem's lodging branch,
 * stepping through the plates. The candidate with the most 剋
 * encounters along the path wins.
 */
function measureHarmDepth(
  candidates: KeResult[],
  dayStem: Stem,
  plates: Record<Branch, Branch>,
): KeResult {
  const lodging = STEM_LODGING[dayStem];
  const lodgingIdx = branchIdx(lodging);

  let best = candidates[0];
  let bestDepth = -1;

  for (const c of candidates) {
    let depth = 0;
    const startIdx = branchIdx(c.upper);

    // Walk from candidate's upper branch toward lodging on the 地盤
    // counting how many positions have a 剋 relationship with their 天盤 branch
    let steps = ((lodgingIdx - startIdx) % 12 + 12) % 12;
    if (steps === 0) steps = 12; // full cycle if same position

    for (let s = 0; s < steps; s++) {
      const earthBranch = branchByIndex(startIdx + s);
      const heavenBranch = plates[earthBranch];
      const earthEl = elemOf(earthBranch);
      const heavenEl = elemOf(heavenBranch);
      if (conquers(heavenEl, earthEl) || conquers(earthEl, heavenEl)) {
        depth++;
      }
    }

    if (depth > bestDepth) {
      bestDepth = depth;
      best = c;
    }
  }

  return best;
}

/**
 * Derive 三傳 (three transmissions) from the four lessons.
 *
 * Priority cascade:
 * 1. 賊剋 — single 下賊上 or 上剋下
 * 2. 比用 — yin/yang match with day stem breaks tie
 * 3. 涉害 — depth-of-harm calculation
 * 4-9. 遙剋, 昴星, 別責, 八專, 返吟, 伏吟 (special cases)
 */
function deriveTransmissions(
  lessons: [SixRenLesson, SixRenLesson, SixRenLesson, SixRenLesson],
  dayStem: Stem,
  plates: Record<Branch, Branch>,
): { transmissions: { initial: Branch; middle: Branch; final: Branch }; method: TransmissionMethod } {
  const offset = ((branchIdx(plates['子']) - branchIdx('子' as Branch)) % 12 + 12) % 12;

  // ── Special structural cases ───────────────────────────────

  // 伏吟: offset = 0 (天盤 = 地盤)
  if (offset === 0) {
    return handleStillPlates(lessons, dayStem, plates);
  }

  // 返吟: offset = 6 (every branch maps to its 六衝)
  if (offset === 6) {
    return handleClashPlates(lessons, dayStem, plates);
  }

  // ── Normal derivation ──────────────────────────────────────

  const allKe = findAllConquests(lessons);

  // Separate by type, 下賊上 has priority
  const lowerConquers = allKe.filter(k => k.type === '下賊上');
  const upperConquers = allKe.filter(k => k.type === '上剋下');

  const candidates = lowerConquers.length > 0 ? lowerConquers : upperConquers;

  if (candidates.length === 1) {
    // 賊剋法: single match
    const initial = candidates[0].upper;
    return { transmissions: chain(initial, plates), method: '賊剋' };
  }

  if (candidates.length > 1) {
    // Try 比用
    const biResult = matchByPolarity(candidates, dayStem);
    if (biResult.length === 1) {
      return { transmissions: chain(biResult[0].upper, plates), method: '比用' };
    }

    // 涉害
    const sheResult = measureHarmDepth(biResult, dayStem, plates);
    return { transmissions: chain(sheResult.upper, plates), method: '涉害' };
  }

  // No 剋 at all — try 遙剋, 昴星, 別責, 八專
  return handleNoConquest(lessons, dayStem, plates);
}

/**
 * Build the three-step transmission chain from an initial branch.
 * 中傳 = plates[初傳], 末傳 = plates[中傳]
 */
function chain(
  initial: Branch,
  plates: Record<Branch, Branch>,
): { initial: Branch; middle: Branch; final: Branch } {
  const middle = plates[initial];
  const final_ = plates[middle];
  return { initial, middle, final: final_ };
}

// ── Special case handlers ────────────────────────────────────

/**
 * 伏吟: 天盤 = 地盤 (offset 0).
 * Every lesson's upper = lower. Normal 剋 detection may find nothing.
 *
 * Rule: if 日干 element conquers 日干寄宮 element,
 * 初傳 = 六衝 of 日干寄宮. Otherwise 初傳 = 六衝 of 日支.
 * Special chain: 中傳 = 六衝 of 初傳, 末傳 = initial from 中傳.
 */
function handleStillPlates(
  lessons: [SixRenLesson, SixRenLesson, SixRenLesson, SixRenLesson],
  dayStem: Stem,
  plates: Record<Branch, Branch>,
): { transmissions: { initial: Branch; middle: Branch; final: Branch }; method: TransmissionMethod } {
  // First try normal 剋 derivation (can exist even in 伏吟 if elements differ)
  // Note: In practice, offset=0 means plates[x]=x for all x, so every lesson
  // has upper===lower (same element). findAllConquests always returns [] here.
  const allKe = findAllConquests(lessons);
  /* v8 ignore next 16 -- unreachable: 伏吟 upper===lower means no 剋 possible */
  if (allKe.length > 0) {
    const lowerConquers = allKe.filter(k => k.type === '下賊上');
    const upperConquers = allKe.filter(k => k.type === '上剋下');
    const candidates = lowerConquers.length > 0 ? lowerConquers : upperConquers;
    if (candidates.length === 1) {
      const initial = candidates[0].upper;
      return { transmissions: stillPlatesChain(initial), method: '伏吟' };
    }
    if (candidates.length > 1) {
      const biResult = matchByPolarity(candidates, dayStem);
      const winner = biResult.length === 1
        ? biResult[0]
        : measureHarmDepth(biResult, dayStem, plates);
      return { transmissions: stillPlatesChain(winner.upper), method: '伏吟' };
    }
  }

  // No 剋: use 衝-based fallback
  const lodging = STEM_LODGING[dayStem];
  const stemEl = STEM_ELEMENT[dayStem];
  const lodgingEl = elemOf(lodging);
  // Note: stemEl never conquers lodgingEl because the lodging branch's element
  // is always the same as (or generated by) the stem's element, never conquered by it.
  /* v8 ignore next 3 */
  const initial = conquers(stemEl, lodgingEl)
    ? clashOf(lodging)
    : clashOf(lessons[2].lower); // 日支
  return { transmissions: stillPlatesChain(initial), method: '伏吟' };
}

/** 伏吟 chain: uses 六衝 instead of plates for 中傳 */
function stillPlatesChain(initial: Branch): { initial: Branch; middle: Branch; final: Branch } {
  const middle = clashOf(initial);
  const final_ = clashOf(middle); // = initial
  return { initial, middle, final: final_ };
}

/**
 * 返吟: offset 6 (every branch maps to its 六衝).
 * Try normal 剋 derivation first. If no 剋, use 驛馬 of 日支.
 */
function handleClashPlates(
  lessons: [SixRenLesson, SixRenLesson, SixRenLesson, SixRenLesson],
  dayStem: Stem,
  plates: Record<Branch, Branch>,
): { transmissions: { initial: Branch; middle: Branch; final: Branch }; method: TransmissionMethod } {
  const allKe = findAllConquests(lessons);
  if (allKe.length > 0) {
    const lowerConquers = allKe.filter(k => k.type === '下賊上');
    const upperConquers = allKe.filter(k => k.type === '上剋下');
    /* v8 ignore next 4 */
    const candidates = lowerConquers.length > 0 ? lowerConquers : upperConquers;
    if (candidates.length === 1) {
      return { transmissions: chain(candidates[0].upper, plates), method: '返吟' };
    }
    if (candidates.length > 1) {
      const biResult = matchByPolarity(candidates, dayStem);
      const winner = biResult.length === 1
        ? biResult[0]
        : measureHarmDepth(biResult, dayStem, plates);
      return { transmissions: chain(winner.upper, plates), method: '返吟' };
    }
  /* v8 ignore start -- unreachable: clash plates always produce at least one 剋 */
  }

  const dayBranch = lessons[2].lower;
  const horse = travelingHorse(dayBranch);
  return { transmissions: chain(horse, plates), method: '返吟' };
}
/* v8 ignore stop */

/**
 * Handle cases with no 剋 in the four lessons.
 * 遙剋 → 昴星 → 別責 → 八專
 */
function handleNoConquest(
  lessons: [SixRenLesson, SixRenLesson, SixRenLesson, SixRenLesson],
  dayStem: Stem,
  plates: Record<Branch, Branch>,
): { transmissions: { initial: Branch; middle: Branch; final: Branch }; method: TransmissionMethod } {
  // ── 遙剋: check if any upper's element 剋 the day stem's element
  // or the day stem's element 剋 any upper's element
  const stemEl = STEM_ELEMENT[dayStem];
  const uppers = lessons.map(l => l.upper);

  // Check for 遙剋: upper branch element 剋 day stem's element,
  // or day stem's element 剋 upper branch's element
  const keOnStem = uppers.filter(u => conquers(elemOf(u), stemEl));
  const stemKeOn = uppers.filter(u => conquers(stemEl, elemOf(u)));

  if (keOnStem.length > 0) {
    // 下賊上 type: upper 剋 day stem
    const initial = keOnStem.length === 1
      ? keOnStem[0]
      : selectByPolarity(keOnStem, dayStem);
    return { transmissions: chain(initial, plates), method: '遙剋' };
  }

  if (stemKeOn.length > 0) {
    // 上剋下 type: day stem 剋 upper
    const initial = stemKeOn.length === 1
      ? stemKeOn[0]
      : selectByPolarity(stemKeOn, dayStem);
    return { transmissions: chain(initial, plates), method: '遙剋' };
  }

  // ── 八專: all four lessons are identical
  // Note: unreachable — for offset != 0 or 6, L1.lower (lodging) never equals
  // L2.lower (plates[lodging]), so all-same is impossible.
  const allSame = lessons.every(
    l => l.upper === lessons[0].upper && l.lower === lessons[0].lower,
  );
  /* v8 ignore next 5 */
  if (allSame) {
    // Use the upper of L1, chain forward twice
    const initial = lessons[0].upper;
    return { transmissions: chain(initial, plates), method: '八專' };
  }

  // ── 昴星 / 別責: fallback — use L1's upper
  const initial = lessons[0].upper;
  return { transmissions: chain(initial, plates), method: '別責' };
}

/** Select branch with matching yin/yang polarity to day stem */
function selectByPolarity(branches: Branch[], dayStem: Stem): Branch {
  const pol = stemPolarity(dayStem);
  const matched = branches.filter(b => branchPolarity(b) === pol);
  /* v8 ignore next */
  return matched.length > 0 ? matched[0] : branches[0];
}

/** Get the 六衝 (clash) of a branch: the branch 6 positions away */
function clashOf(b: Branch): Branch {
  return branchByIndex(branchIdx(b) + 6);
}

/**
 * 驛馬 (traveling horse): derived from 三合 group.
 * 寅午戌→申, 申子辰→寅, 巳酉丑→亥, 亥卯未→巳
 *
 * Note: only called from handleClashPlates no-conquest fallback, which is
 * unreachable (see comment there).
 */
/* v8 ignore next 9 */
function travelingHorse(b: Branch): Branch {
  const group = branchIdx(b) % 4;
  // Group 0 (子辰申): horse = 寅
  // Group 1 (丑巳酉): horse = 亥
  // Group 2 (寅午戌): horse = 申
  // Group 3 (卯未亥): horse = 巳
  const horses: Branch[] = ['寅', '亥', '申', '巳'];
  return horses[group];
}

// ── Generals placement ───────────────────────────────────────

/**
 * Place 十二天將 (twelve heavenly generals) around the 12 branches.
 *
 * 1. 貴人 sits at its designated branch (based on day stem + day/night)
 * 2. Direction depends on 貴人's position:
 *    - 巳午未申酉戌 (indices 5-10): 順行 (ascending, +1)
 *    - 亥子丑寅卯辰 (indices 11,0-4): 逆行 (descending, -1)
 */
function placeGenerals(dayStem: Stem, hourBranch: Branch): Record<Branch, HeavenlyGeneral> {
  const [dayPos, nightPos] = NOBLE_POSITIONS[dayStem];
  const nobleBranch = isDaytime(hourBranch) ? dayPos : nightPos;
  const nobleIdx = branchIdx(nobleBranch);

  // Direction: ascending (順行) if in southern half, descending (逆行) if northern
  const ascending = nobleIdx >= 5 && nobleIdx <= 10;
  const step = ascending ? 1 : -1;

  const generals = {} as Record<Branch, HeavenlyGeneral>;
  for (let i = 0; i < 12; i++) {
    const branch = branchByIndex(nobleIdx + i * step);
    generals[branch] = HEAVENLY_GENERALS[i];
  }
  return generals;
}

// ── Monthly General ──────────────────────────────────────────

/**
 * Determine the 月將 (monthly general) for a given date.
 *
 * The monthly general shifts at each 中氣 (zhongqi) boundary:
 * 大寒→子, 雨水→亥, 春分→戌, 穀雨→酉, 小滿→申, 夏至→未,
 * 大暑→午, 處暑→巳, 秋分→辰, 霜降→卯, 小雪→寅, 冬至→丑
 *
 * The zhongqi terms are at odd indices in SOLAR_TERM_NAMES:
 * 大寒(1), 雨水(3), 春分(5), ..., 冬至(23)
 */
export function getMonthlyGeneral(date: Date): Branch {
  const year = date.getFullYear();

  // Get all solar terms for current and previous year
  const terms = getSolarTermsForYear(year);
  const prevTerms = getSolarTermsForYear(year - 1);

  // Zhongqi indices: 1,3,5,7,9,11,13,15,17,19,21,23
  // Check from latest zhongqi backwards in current year
  for (let i = 11; i >= 0; i--) {
    const solarIdx = i * 2 + 1; // map sequential j to solar term index
    if (date >= terms[solarIdx].date) {
      return branchByIndex((12 - i) % 12);
    }
  }

  // Before 大寒 of current year — check previous year's 冬至 (index 23)
  if (date >= prevTerms[23].date) {
    return branchByIndex((12 - 11) % 12); // 冬至 → j=11 → 丑
  /* v8 ignore start -- unreachable: prevTerms[23] always matches for well-formed dates */
  }

  if (date >= prevTerms[21].date) {
    return branchByIndex((12 - 10) % 12); // 小雪 → j=10 → 寅
  }

  return '丑';
}
/* v8 ignore stop */

// ── Main computation ─────────────────────────────────────────

/**
 * Compute a full 六壬 chart from the four input parameters.
 *
 * @param dayStem - Day's heavenly stem
 * @param dayBranch - Day's earthly branch
 * @param hourBranch - Current hour's earthly branch
 * @param monthlyGeneral - 月將 branch
 */
export function computeSixRen(
  dayStem: Stem,
  dayBranch: Branch,
  hourBranch: Branch,
  monthlyGeneral: Branch,
): SixRenChart {
  const plates = buildPlates(monthlyGeneral, hourBranch);
  const lessons = buildFourLessons(dayStem, dayBranch, plates);
  const { transmissions, method } = deriveTransmissions(lessons, dayStem, plates);
  const generals = placeGenerals(dayStem, hourBranch);

  return {
    dayStem,
    dayBranch,
    hourBranch,
    monthlyGeneral,
    plates,
    lessons,
    transmissions,
    method,
    generals,
  };
}

/**
 * Compute a 六壬 chart for a specific date and hour.
 *
 * @param date - The date to compute for
 * @param hour - Hour of day (0-23). Defaults to date.getHours()
 */
export function computeSixRenForDate(date: Date, hour?: number): SixRenChart {
  const h = hour ?? date.getHours();
  const pillars = computeFourPillars(date);
  const hourBranch = branchFromHour(h);
  const monthlyGeneral = getMonthlyGeneral(date);

  return computeSixRen(
    pillars.day.stem,
    pillars.day.branch,
    hourBranch,
    monthlyGeneral,
  );
}
