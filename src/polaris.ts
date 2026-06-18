/* v8 ignore next */
/**
 * 紫微斗數 (Zi Wei Dou Shu / Purple Star Astrology)
 *
 * Computes a 12-palace star chart from birth date, hour, and gender.
 * Places 14 major stars (主星) and computes 四化 (four transformations).
 *
 * Palace layout uses 12 earthly branches (子 through 亥) as fixed positions.
 * The 命宮 (fate palace) is determined by birth month and hour.
 * The 紫微 star position is determined by birth day and 五行局.
 */

import type { Stem, Branch } from './types';
import { STEMS } from './stems';
import { BRANCHES } from './branches';
import { getCycleElement } from './cycle-elements';
import { stemBranchByCycleIndex } from './stem-branch';

// ── Constants ────────────────────────────────────────────────

/** 14 major stars in standard order */
export const MAJOR_STARS: readonly string[] = [
  '紫微', '天機', '太陽', '武曲', '天同', '廉貞', '天府',
  '太陰', '貪狼', '巨門', '天相', '天梁', '七殺', '破軍',
];

/** 12 palace names in standard order (starting from 命宮) */
export const PALACE_NAMES: readonly string[] = [
  '命宮', '兄弟宮', '夫妻宮', '子女宮', '財帛宮', '疾厄宮',
  '遷移宮', '交友宮', '事業宮', '田宅宮', '福德宮', '父母宮',
];

// ── Types ────────────────────────────────────────────────────

export interface ZiWeiPalace {
  /** Palace name (命宮, 兄弟宮, etc.) */
  name: string;
  /** Earthly branch of this palace position */
  branch: Branch;
  /** Heavenly stem of this palace */
  stem: Stem;
  /** Major stars in this palace */
  majorStars: string[];
}

export interface ZiWeiBirthData {
  year: number;    // Gregorian year
  month: number;   // Lunar month (1-12)
  day: number;     // Lunar day (1-30)
  hour: number;    // Hour branch index (0=子, 1=丑, ..., 11=亥)
  gender: 'male' | 'female';
}

export interface SiHua {
  lu: string;   // 化祿
  quan: string; // 化權
  ke: string;   // 化科
  ji: string;   // 化忌
}

export interface ZiWeiChart {
  /** The 12 palaces with stars placed */
  palaces: ZiWeiPalace[];
  /** 五行局 number (2=水, 3=木, 4=金, 5=土, 6=火) */
  elementPattern: number;
  /** 四化 (four transformations) */
  siHua: SiHua;
  /** Birth data used */
  birthData: ZiWeiBirthData;
  /** Fate palace branch index */
  fatePalaceIndex: number;
  /** Body palace branch index */
  bodyPalaceIndex: number;
  /** 流太歲: branch index of birth year — represents the subject */
  taiSuiIndex: number;
}

// ── Element pattern names ────────────────────────────────────

const ELEMENT_PATTERN_NAMES: Record<number, string> = {
  2: '水二局', 3: '木三局', 4: '金四局', 5: '土五局', 6: '火六局',
};

// ── 命宮 (Fate Palace) ──────────────────────────────────────

/**
 * Compute the fate palace branch index.
 * Formula: start at 寅(2) for month 1, count forward by month,
 * then count backward by hour.
 */
export function getFatepalace(lunarMonth: number, hourIndex: number): number {
  // Month 1 starts at 寅(2), month 2 at 卯(3), etc.
  // Then subtract hour index
  return ((2 + lunarMonth - 1) - hourIndex + 12) % 12;
}

/**
 * Compute the body palace branch index.
 * Formula: start at 寅(2) for month 1, count forward by month,
 * then count FORWARD by hour.
 */
function getBodyPalace(lunarMonth: number, hourIndex: number): number {
  return ((2 + lunarMonth - 1) + hourIndex) % 12;
}

// ── Palace stems ─────────────────────────────────────────────

/**
 * Determine the heavenly stem of each palace based on the year stem.
 * Uses the 五虎遁月 (Five Tiger Escape) rule to assign stems to branches.
 */
function getPalaceStems(yearStem: Stem): Stem[] {
  // 五虎遁: 甲己→丙寅, 乙庚→戊寅, 丙辛→庚寅, 丁壬→壬寅, 戊癸→甲寅
  const startStemIdx: Record<string, number> = {
    '甲': 2, '己': 2, // 丙
    '乙': 4, '庚': 4, // 戊
    '丙': 6, '辛': 6, // 庚
    '丁': 8, '壬': 8, // 壬
    '戊': 0, '癸': 0, // 甲
  };

  const start = startStemIdx[yearStem];
  const stems: Stem[] = [];
  for (let i = 0; i < 12; i++) {
    // Branch index: 寅(2), 卯(3), ..., 丑(1) → cycle through all 12 branches
    // Stem for branch i: start from 寅(branch 2) with the start stem
    const branchOffset = (i - 2 + 12) % 12;
    stems[i] = STEMS[(start + branchOffset) % 10];
  }
  return stems;
}

// ── 五行局 (Element Pattern) ─────────────────────────────────

/**
 * Determine the 五行局 from the fate palace's stem-branch 納音.
 */
export function getElementPattern(fatePalaceIndex: number, yearStem: Stem): number {
  const palaceStems = getPalaceStems(yearStem);
  const stem = palaceStems[fatePalaceIndex];
  const branch = BRANCHES[fatePalaceIndex];

  // Get 納音 element for this stem-branch pair
  const naYinElement = getCycleElement(`${stem}${branch}` as any);

  // Map 納音 element to 局數
  const elementToJu: Record<string, number> = {
    '水': 2, '木': 3, '金': 4, '土': 5, '火': 6,
  };
  /* v8 ignore next */
  return elementToJu[naYinElement] || 2;
}

// ── 紫微 star position ───────────────────────────────────────

/**
 * Compute 紫微 star's palace index from birth day and 五行局.
 *
 * The algorithm divides the birth day by the 局數, rounding up,
 * then maps to a palace position.
 */
export function getZiWeiPosition(birthDay: number, elementPattern: number): number {
  // Standard algorithm: count from 寅(2), advance by quotient steps
  // based on day / elementPattern, with specific rules for remainders.

  const ju = elementPattern;
  let position: number;

  // 紫微 positioning: divide day by 局數
  // If evenly divisible: position = quotient
  // If remainder: position = quotient + 1, adjusted by remainder parity
  const quotient = Math.ceil(birthDay / ju);

  // The 紫微 position counting:
  // Start from 寅(index 2), count forward quotient steps for odd quotients,
  // or use the specific lookup-based positioning.
  // Simplified standard method:
  let day = birthDay;
  let palace = 2; // Start at 寅

  // Count through: for each step of 局數, advance one palace
  // Handle remainder by direction (odd remainder = forward, even = backward)
  const steps = Math.floor((day - 1) / ju);
  const remainder = ((day - 1) % ju) + 1;

  palace = (2 + steps) % 12;

  // Adjust for remainder: each remaining day alternates forward/backward
  if (remainder > 1) {
    // For 局數 steps after initial placement
    for (let r = 2; r <= remainder; r++) {
      if (r % 2 === 0) {
        palace = (palace + 12 - 1) % 12; // backward
      } else {
        palace = (palace + 1) % 12;      // forward
      }
    }
  }

  return palace;
}

// ── 紫微系 star placement ────────────────────────────────────

/**
 * Place the 紫微系 6 stars (紫微, 天機, 太陽, 武曲, 天同, 廉貞).
 * From 紫微's position, the other stars follow fixed offsets (counter-clockwise).
 */
function placeZiWeiGroup(ziWeiIdx: number): Record<string, number> {
  // Offsets from 紫微 (counter-clockwise = subtract from index)
  return {
    '紫微': ziWeiIdx,
    '天機': (ziWeiIdx - 1 + 12) % 12,
    '太陽': (ziWeiIdx - 3 + 12) % 12, // skip one
    '武曲': (ziWeiIdx - 4 + 12) % 12,
    '天同': (ziWeiIdx - 5 + 12) % 12,
    '廉貞': (ziWeiIdx - 8 + 12) % 12, // skip two
  };
}

/**
 * Place the 天府系 8 stars (天府, 太陰, 貪狼, 巨門, 天相, 天梁, 七殺, 破軍).
 * 天府's position is derived from 紫微: they mirror across 寅-申 axis.
 */
function placeTianFuGroup(ziWeiIdx: number): Record<string, number> {
  // 天府 mirrors 紫微 across the 寅(2)-申(8) axis
  const tianFuIdx = (4 - ziWeiIdx + 12) % 12; // Mirror formula

  // Offsets from 天府 (clockwise = add to index)
  return {
    '天府': tianFuIdx,
    '太陰': (tianFuIdx + 1) % 12,
    '貪狼': (tianFuIdx + 2) % 12,
    '巨門': (tianFuIdx + 3) % 12,
    '天相': (tianFuIdx + 4) % 12,
    '天梁': (tianFuIdx + 5) % 12,
    '七殺': (tianFuIdx + 6) % 12,
    '破軍': (tianFuIdx + 10) % 12,
  };
}

// ── 四化 (Four Transformations) ──────────────────────────────

/**
 * 四化 by year stem. Each stem transforms four specific stars.
 * [化祿, 化權, 化科, 化忌]
 */
const SI_HUA_TABLE: Record<Stem, readonly [string, string, string, string]> = {
  '甲': ['廉貞', '破軍', '武曲', '太陽'],
  '乙': ['天機', '天梁', '紫微', '太陰'],
  '丙': ['天同', '天機', '文昌', '廉貞'],
  '丁': ['太陰', '天同', '天機', '巨門'],
  '戊': ['貪狼', '太陰', '右弼', '天機'],
  '己': ['武曲', '貪狼', '天梁', '文曲'],
  '庚': ['太陽', '武曲', '太陰', '天同'],
  '辛': ['巨門', '太陽', '文曲', '文昌'],
  '壬': ['天梁', '紫微', '左輔', '武曲'],
  '癸': ['破軍', '巨門', '太陰', '貪狼'],
};

function computeSiHua(yearStem: Stem): SiHua {
  const [lu, quan, ke, ji] = SI_HUA_TABLE[yearStem];
  return { lu, quan, ke, ji };
}

// ── Main computation ─────────────────────────────────────────

export function computeZiWei(birth: ZiWeiBirthData): ZiWeiChart {
  const yearStemIdx = (birth.year - 4) % 10;
  /* v8 ignore next */
  const yearStem = STEMS[yearStemIdx >= 0 ? yearStemIdx : yearStemIdx + 10];

  const fatePalaceIndex = getFatepalace(birth.month, birth.hour);
  const bodyPalaceIndex = getBodyPalace(birth.month, birth.hour);
  const taiSuiIndex = ((birth.year - 4) % 12 + 12) % 12;
  const elementPattern = getElementPattern(fatePalaceIndex, yearStem);

  const ziWeiIdx = getZiWeiPosition(birth.day, elementPattern);

  // Place all 14 major stars
  const ziWeiGroup = placeZiWeiGroup(ziWeiIdx);
  const tianFuGroup = placeTianFuGroup(ziWeiIdx);
  const allStarPlacements = { ...ziWeiGroup, ...tianFuGroup };

  // Build palaces
  const palaceStems = getPalaceStems(yearStem);
  const palaces: ZiWeiPalace[] = [];

  for (let i = 0; i < 12; i++) {
    // Palace name: 命宮 starts at fatePalaceIndex, then counter-clockwise
    const nameIdx = (i - fatePalaceIndex + 12) % 12;
    const name = PALACE_NAMES[nameIdx];

    const majorStars: string[] = [];
    for (const [star, palaceIdx] of Object.entries(allStarPlacements)) {
      if (palaceIdx === i) {
        majorStars.push(star);
      }
    }

    palaces.push({
      name,
      branch: BRANCHES[i],
      stem: palaceStems[i],
      majorStars,
    });
  }

  const siHua = computeSiHua(yearStem);

  return {
    palaces,
    elementPattern,
    siHua,
    birthData: birth,
    fatePalaceIndex,
    bodyPalaceIndex,
    taiSuiIndex,
  };
}
