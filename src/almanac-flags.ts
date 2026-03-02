/**
 * 神煞 (Almanac Flags)
 *
 * Symbolic markers from Chinese almanacs (通書/黃曆) and 命理學.
 * Each flag is derived from pillar components (stems, branches)
 * using traditional lookup rules.
 *
 * Individual derivation functions are pure: stem/branch → branch(es).
 * The aggregate getAlmanacFlags() computes all active flags for a date.
 */

import type { Stem, Branch, FourPillars } from './types';
import { STEMS } from './stems';
import { BRANCHES } from './branches';
import { isClash } from './branch-relations';
import { computeFourPillars } from './four-pillars';
import { getSolarMonthExact } from './solar-terms';

// ── Types ────────────────────────────────────────────────────

export type AlmanacCategory =
  | 'noble' | 'academic' | 'romance' | 'travel'
  | 'wealth' | 'protection' | 'inauspicious';

export interface AlmanacFlagInfo {
  name: string;
  english: string;
  auspicious: boolean;
  category: AlmanacCategory;
}

export interface AlmanacFlagResult extends AlmanacFlagInfo {
  /** Which pillar position(s) triggered this flag */
  positions: ('year' | 'month' | 'day' | 'hour')[];
}

// ── Helpers ──────────────────────────────────────────────────

const branchIdx = (b: Branch): number => BRANCHES.indexOf(b);

/** Map a branch to its 三合 group index (0=火寅午戌, 1=金巳酉丑, 2=水申子辰, 3=木亥卯未) */
function threeHarmonyGroup(b: Branch): number {
  const groups: Branch[][] = [
    ['寅', '午', '戌'], // fire
    ['巳', '酉', '丑'], // metal
    ['申', '子', '辰'], // water
    ['亥', '卯', '未'], // wood
  ];
  for (let i = 0; i < groups.length; i++) {
    if (groups[i].includes(b)) return i;
  }
  /* c8 ignore next */
  return 0;
}

/** 三合 group targets indexed by [group][position] */
const HARMONY_TARGETS: Record<string, Branch[]> = {
  // [travelHorse, peachBlossom, canopy, general, robbery, deathSpirit]
  // fire:  寅午戌 → 申, 卯, 戌, 午, 亥, 巳
  '0': ['申', '卯', '戌', '午', '亥', '巳'],
  // metal: 巳酉丑 → 亥, 午, 丑, 酉, 寅, 申
  '1': ['亥', '午', '丑', '酉', '寅', '申'],
  // water: 申子辰 → 寅, 酉, 辰, 子, 巳, 亥
  '2': ['寅', '酉', '辰', '子', '巳', '亥'],
  // wood:  亥卯未 → 巳, 子, 未, 卯, 申, 寅
  '3': ['巳', '子', '未', '卯', '申', '寅'],
};

function harmonyTarget(b: Branch, position: number): Branch {
  return HARMONY_TARGETS[threeHarmonyGroup(b)][position] as Branch;
}

/** Season from solar month index (0=spring, 1=summer, 2=autumn, 3=winter) */
function seasonFromMonth(monthIndex: number): number {
  return Math.floor(monthIndex / 3);
}

// ═══════════════════════════════════════════════════════════════
//  Day Stem Derivations
// ═══════════════════════════════════════════════════════════════

const HEAVENLY_NOBLE: Record<Stem, [Branch, Branch]> = {
  '甲': ['丑', '未'], '戊': ['丑', '未'], '庚': ['丑', '未'],
  '乙': ['子', '申'], '己': ['子', '申'],
  '丙': ['亥', '酉'], '丁': ['亥', '酉'],
  '壬': ['巳', '卯'], '癸': ['巳', '卯'],
  '辛': ['午', '寅'],
};

export function getHeavenlyNoble(stem: Stem): [Branch, Branch] {
  return HEAVENLY_NOBLE[stem];
}

const SUPREME_NOBLE: Record<Stem, Branch[]> = {
  '甲': ['子', '午'], '乙': ['子', '午'],
  '丙': ['卯', '酉'], '丁': ['卯', '酉'],
  '戊': ['辰', '戌', '丑', '未'], '己': ['辰', '戌', '丑', '未'],
  '庚': ['寅', '亥'], '辛': ['寅', '亥'],
  '壬': ['巳', '申'], '癸': ['巳', '申'],
};

export function getSupremeNoble(stem: Stem): Branch[] {
  return SUPREME_NOBLE[stem];
}

const LITERARY_STAR: Record<Stem, Branch> = {
  '甲': '巳', '乙': '午', '丙': '申', '丁': '酉', '戊': '申',
  '己': '酉', '庚': '亥', '辛': '子', '壬': '寅', '癸': '卯',
};

export function getLiteraryStar(stem: Stem): Branch {
  return LITERARY_STAR[stem];
}

const PROSPERITY_STAR: Record<Stem, Branch> = {
  '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午', '戊': '巳',
  '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子',
};

export function getProsperityStar(stem: Stem): Branch {
  return PROSPERITY_STAR[stem];
}

/** 羊刃: 陽干 = 祿+1, 陰干 = 祿-1 */
export function getRamBlade(stem: Stem): Branch {
  const lu = branchIdx(PROSPERITY_STAR[stem]);
  const isYang = STEMS.indexOf(stem) % 2 === 0;
  return BRANCHES[((lu + (isYang ? 1 : -1)) % 12 + 12) % 12];
}

/** 金輿: 祿+2 */
export function getGoldenCarriage(stem: Stem): Branch {
  const lu = branchIdx(PROSPERITY_STAR[stem]);
  return BRANCHES[(lu + 2) % 12];
}

// ═══════════════════════════════════════════════════════════════
//  Branch Derivations — 三合 based
// ═══════════════════════════════════════════════════════════════

/** 驛馬 — 三合局沖 (position 0) */
export function getTravelingHorse(branch: Branch): Branch {
  return harmonyTarget(branch, 0);
}

/** 桃花/咸池 — 三合局沐浴 (position 1) */
export function getPeachBlossom(branch: Branch): Branch {
  return harmonyTarget(branch, 1);
}

/** 華蓋 — 三合局墓 (position 2) */
export function getCanopy(branch: Branch): Branch {
  return harmonyTarget(branch, 2);
}

/** 將星 — 三合局帝旺 (position 3) */
export function getGeneralStar(branch: Branch): Branch {
  return harmonyTarget(branch, 3);
}

/** 劫煞 — 三合局絕 (position 4) */
export function getRobberyStar(branch: Branch): Branch {
  return harmonyTarget(branch, 4);
}

/** 亡神 (position 5) */
export function getDeathSpirit(branch: Branch): Branch {
  return harmonyTarget(branch, 5);
}

// ═══════════════════════════════════════════════════════════════
//  Branch Derivations — Other
// ═══════════════════════════════════════════════════════════════

/** 紅鸞 — (3 - yearBranchIndex + 12) % 12 */
export function getRedPhoenix(yearBranch: Branch): Branch {
  return BRANCHES[(3 - branchIdx(yearBranch) + 12) % 12];
}

/** 天喜 — 紅鸞 + 6 (opposite position) */
export function getHeavenlyJoy(yearBranch: Branch): Branch {
  const phoenix = branchIdx(getRedPhoenix(yearBranch));
  return BRANCHES[(phoenix + 6) % 12];
}

/** Seasonal triad group: 寅卯辰=0, 巳午未=1, 申酉戌=2, 亥子丑=3 */
function seasonalGroup(b: Branch): number {
  return Math.floor(((branchIdx(b) - 2 + 12) % 12) / 3);
}

/** 孤辰 — based on seasonal group of year branch */
const LONELY_MAP: Branch[] = ['巳', '申', '亥', '寅']; // spring→巳, summer→申, autumn→亥, winter→寅
export function getLonelyStar(branch: Branch): Branch {
  return LONELY_MAP[seasonalGroup(branch)];
}

/** 寡宿 — based on seasonal group of year branch */
const WIDOW_MAP: Branch[] = ['丑', '辰', '未', '戌']; // spring→丑, summer→辰, autumn→未, winter→戌
export function getWidowStar(branch: Branch): Branch {
  return WIDOW_MAP[seasonalGroup(branch)];
}

// ═══════════════════════════════════════════════════════════════
//  Day Pillar Predicates
// ═══════════════════════════════════════════════════════════════

const COMMANDING_SET = new Set(['壬辰', '庚戌', '庚辰', '戊戌']);

export function isCommandingStar(stem: Stem, branch: Branch): boolean {
  return COMMANDING_SET.has(`${stem}${branch}`);
}

const TEN_EVILS_SET = new Set([
  '甲辰', '乙巳', '壬申', '丙申', '丁亥',
  '庚辰', '戊戌', '癸亥', '辛巳', '己丑',
]);

export function isTenEvils(stem: Stem, branch: Branch): boolean {
  return TEN_EVILS_SET.has(`${stem}${branch}`);
}

const YIN_YANG_ERROR_SET = new Set([
  '丙子', '丙午', '丁丑', '丁未', '戊寅', '戊申',
  '辛卯', '辛酉', '壬辰', '壬戌', '癸巳', '癸亥',
]);

export function isYinYangError(stem: Stem, branch: Branch): boolean {
  return YIN_YANG_ERROR_SET.has(`${stem}${branch}`);
}

// ═══════════════════════════════════════════════════════════════
//  Calendar Predicates
// ═══════════════════════════════════════════════════════════════

const HEAVENS_PARDON: [Stem, Branch][] = [
  ['戊', '寅'], // spring (0)
  ['甲', '午'], // summer (1)
  ['戊', '申'], // autumn (2)
  ['甲', '子'], // winter (3)
];

export function isHeavensPardon(stem: Stem, branch: Branch, season: number): boolean {
  const [s, b] = HEAVENS_PARDON[season];
  return stem === s && branch === b;
}

export function isMonthBreak(dayBranch: Branch, monthBranch: Branch): boolean {
  return isClash(dayBranch, monthBranch);
}

export function isYearBreak(dayBranch: Branch, yearBranch: Branch): boolean {
  return isClash(dayBranch, yearBranch);
}

// ═══════════════════════════════════════════════════════════════
//  Registry — all known flags with metadata
// ═══════════════════════════════════════════════════════════════

interface FlagRule extends AlmanacFlagInfo {
  check: (p: FourPillars, season: number) => ('year' | 'month' | 'day' | 'hour')[];
}

/** Check if any pillar branch matches a target set derived from day stem */
function stemToBranchCheck(
  pillars: FourPillars,
  targets: Branch[],
): ('year' | 'month' | 'day' | 'hour')[] {
  const positions: ('year' | 'month' | 'day' | 'hour')[] = [];
  const keys = ['year', 'month', 'day', 'hour'] as const;
  for (const k of keys) {
    if (targets.includes(pillars[k].branch)) positions.push(k);
  }
  return positions;
}

/** Check if any pillar branch matches a target derived from year branch */
function yearBranchCheck(
  pillars: FourPillars,
  target: Branch,
): ('year' | 'month' | 'day' | 'hour')[] {
  const positions: ('year' | 'month' | 'day' | 'hour')[] = [];
  const keys = ['year', 'month', 'day', 'hour'] as const;
  for (const k of keys) {
    if (pillars[k].branch === target) positions.push(k);
  }
  return positions;
}

export const ALMANAC_FLAG_REGISTRY: readonly FlagRule[] = [
  // ── Day Stem Noble Stars ──
  {
    name: '天乙貴人', english: 'Heavenly Noble', auspicious: true, category: 'noble',
    check: (p) => stemToBranchCheck(p, [...getHeavenlyNoble(p.day.stem)]),
  },
  {
    name: '太極貴人', english: 'Supreme Noble', auspicious: true, category: 'noble',
    check: (p) => stemToBranchCheck(p, getSupremeNoble(p.day.stem)),
  },
  {
    name: '文昌貴人', english: 'Literary Star', auspicious: true, category: 'academic',
    check: (p) => stemToBranchCheck(p, [getLiteraryStar(p.day.stem)]),
  },
  {
    name: '祿神', english: 'Prosperity Star', auspicious: true, category: 'wealth',
    check: (p) => stemToBranchCheck(p, [getProsperityStar(p.day.stem)]),
  },
  {
    name: '羊刃', english: 'Ram Blade', auspicious: false, category: 'inauspicious',
    check: (p) => stemToBranchCheck(p, [getRamBlade(p.day.stem)]),
  },
  {
    name: '金輿', english: 'Golden Carriage', auspicious: true, category: 'wealth',
    check: (p) => stemToBranchCheck(p, [getGoldenCarriage(p.day.stem)]),
  },

  // ── 三合 Branch Stars (from year branch) ──
  {
    name: '驛馬', english: 'Traveling Horse', auspicious: true, category: 'travel',
    check: (p) => yearBranchCheck(p, getTravelingHorse(p.year.branch)),
  },
  {
    name: '桃花', english: 'Peach Blossom', auspicious: true, category: 'romance',
    check: (p) => yearBranchCheck(p, getPeachBlossom(p.year.branch)),
  },
  {
    name: '華蓋', english: 'Canopy', auspicious: true, category: 'academic',
    check: (p) => yearBranchCheck(p, getCanopy(p.year.branch)),
  },
  {
    name: '將星', english: 'General Star', auspicious: true, category: 'noble',
    check: (p) => yearBranchCheck(p, getGeneralStar(p.year.branch)),
  },
  {
    name: '劫煞', english: 'Robbery Star', auspicious: false, category: 'inauspicious',
    check: (p) => yearBranchCheck(p, getRobberyStar(p.year.branch)),
  },
  {
    name: '亡神', english: 'Death Spirit', auspicious: false, category: 'inauspicious',
    check: (p) => yearBranchCheck(p, getDeathSpirit(p.year.branch)),
  },

  // ── Year Branch Stars ──
  {
    name: '紅鸞', english: 'Red Phoenix', auspicious: true, category: 'romance',
    check: (p) => yearBranchCheck(p, getRedPhoenix(p.year.branch)),
  },
  {
    name: '天喜', english: 'Heavenly Joy', auspicious: true, category: 'romance',
    check: (p) => yearBranchCheck(p, getHeavenlyJoy(p.year.branch)),
  },
  {
    name: '孤辰', english: 'Lonely Star', auspicious: false, category: 'inauspicious',
    check: (p) => yearBranchCheck(p, getLonelyStar(p.year.branch)),
  },
  {
    name: '寡宿', english: 'Widow Star', auspicious: false, category: 'inauspicious',
    check: (p) => yearBranchCheck(p, getWidowStar(p.year.branch)),
  },

  // ── Day Pillar Flags ──
  {
    name: '魁罡', english: 'Commanding Star', auspicious: true, category: 'noble',
    check: (p) => isCommandingStar(p.day.stem, p.day.branch) ? ['day'] : [],
  },
  {
    name: '十惡大敗', english: 'Ten Evils', auspicious: false, category: 'inauspicious',
    check: (p) => isTenEvils(p.day.stem, p.day.branch) ? ['day'] : [],
  },
  {
    name: '陰差陽錯', english: 'Yin-Yang Error', auspicious: false, category: 'inauspicious',
    check: (p) => isYinYangError(p.day.stem, p.day.branch) ? ['day'] : [],
  },

  // ── Calendar Flags ──
  {
    name: '月破', english: 'Month Break', auspicious: false, category: 'inauspicious',
    check: (p) => isMonthBreak(p.day.branch, p.month.branch) ? ['day'] : [],
  },
  {
    name: '歲破', english: 'Year Break', auspicious: false, category: 'inauspicious',
    check: (p) => isYearBreak(p.day.branch, p.year.branch) ? ['day'] : [],
  },
  {
    name: '天赦日', english: "Heaven's Pardon", auspicious: true, category: 'protection',
    check: (p, season) => isHeavensPardon(p.day.stem, p.day.branch, season) ? ['day'] : [],
  },
];

// ═══════════════════════════════════════════════════════════════
//  Aggregate
// ═══════════════════════════════════════════════════════════════

/**
 * Compute all active almanac flags for a given date.
 *
 * Derives the four pillars and season, then checks every flag
 * in the registry against the chart.
 */
export function getAlmanacFlags(date: Date): AlmanacFlagResult[] {
  const pillars = computeFourPillars(date);
  const { monthIndex } = getSolarMonthExact(date);
  const season = seasonFromMonth(monthIndex);

  const results: AlmanacFlagResult[] = [];
  for (const rule of ALMANAC_FLAG_REGISTRY) {
    const positions = rule.check(pillars, season);
    if (positions.length > 0) {
      results.push({
        name: rule.name,
        english: rule.english,
        auspicious: rule.auspicious,
        category: rule.category,
        positions,
      });
    }
  }
  return results;
}

/**
 * Compute all active almanac flags for given four pillars.
 *
 * Use this when you already have the pillars computed.
 * Season must be provided (0=spring, 1=summer, 2=autumn, 3=winter).
 */
export function getAlmanacFlagsForPillars(
  pillars: FourPillars,
  season: number,
): AlmanacFlagResult[] {
  const results: AlmanacFlagResult[] = [];
  for (const rule of ALMANAC_FLAG_REGISTRY) {
    const positions = rule.check(pillars, season);
    if (positions.length > 0) {
      results.push({
        name: rule.name,
        english: rule.english,
        auspicious: rule.auspicious,
        category: rule.category,
        positions,
      });
    }
  }
  return results;
}
