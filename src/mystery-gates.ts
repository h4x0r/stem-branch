/**
 * 奇門遁甲 (Qi Men Dun Jia)
 *
 * Nine-palace divination system using heaven/earth plates, nine stars,
 * eight doors, and eight deities arranged on a 3x3 Lo Shu grid.
 *
 * Palace numbering follows the Lo Shu magic square:
 *   4(巽) | 9(離) | 2(坤)
 *   3(震) | 5(中) | 7(兌)
 *   8(艮) | 1(坎) | 6(乾)
 */

import type { Stem, Branch } from './types';
import { STEMS } from './stems';
import { BRANCHES, branchFromHour } from './branches';
import { computeFourPillars } from './four-pillars';
import { getSolarTermsForYear, SOLAR_TERM_NAMES } from './solar-terms';

// ── Constants ────────────────────────────────────────────────

/** 九星 in palace order (1→9): 天蓬(1坎) through 天英(9離) */
export const NINE_STARS: readonly string[] = [
  '天蓬', '天芮', '天衝', '天輔', '天禽', '天心', '天柱', '天任', '天英',
];

/** Base star positions: star index → home palace */
const STAR_HOME: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/** 八門 in palace order (1→9, skip 5): 休(1) 生(8) 傷(3) 杜(4) — 景(9) 死(2) 驚(7) 開(6) */
export const EIGHT_DOORS: readonly string[] = [
  '休', '生', '傷', '杜', '景', '死', '驚', '開',
];

/** Base door positions: door index → home palace */
const DOOR_HOME: readonly number[] = [1, 8, 3, 4, 9, 2, 7, 6];

/** 八神 */
export const EIGHT_DEITIES: readonly string[] = [
  '值符', '螣蛇', '太陰', '六合', '白虎', '玄武', '九地', '九天',
];
/** 陰遁 deities (swap 白虎↔勾陳, 玄武↔朱雀) */
const EIGHT_DEITIES_YIN: readonly string[] = [
  '值符', '螣蛇', '太陰', '六合', '勾陳', '朱雀', '九地', '九天',
];

/** 三奇六儀: 六儀(戊己庚辛壬癸) then 三奇(丁丙乙) */
export const SAN_QI_LIU_YI: readonly Stem[] = [
  '戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙',
];

/** Lo Shu forward order (陽遁): 1→8→3→4→9→2→7→6 (skip 5) */
const LO_SHU_FORWARD: readonly number[] = [1, 8, 3, 4, 9, 2, 7, 6];

/** Lo Shu reverse order (陰遁): 9→2→7→6→1→8→3→4 (skip 5) */
const LO_SHU_REVERSE: readonly number[] = [9, 2, 7, 6, 1, 8, 3, 4];

// ── Types ────────────────────────────────────────────────────

export type EscapeMode = '陽遁' | '陰遁';

export type Palace = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface QiMenChart {
  /** 陽遁 or 陰遁 */
  escapeMode: EscapeMode;
  /** Pattern number (1-9) */
  juShu: number;
  /** Earth plate: palace → stem */
  earthPlate: Record<number, Stem>;
  /** Heaven plate: palace → stem */
  heavenPlate: Record<number, Stem>;
  /** Stars: palace → star name */
  stars: Record<number, string>;
  /** Doors: palace → door name */
  doors: Record<number, string>;
  /** Deities: palace → deity name */
  deities: Record<number, string>;
  /** 值符 (duty star) */
  zhiFu: { star: string; palace: number };
  /** 值使 (duty door) */
  zhiShi: { door: string; palace: number };
  /** Hour branch used */
  hourBranch: Branch;
  /** Day stem */
  dayStem: Stem;
}

// ── Solar term helpers ───────────────────────────────────────

/** Index of winter solstice (冬至) and summer solstice (夏至) in SOLAR_TERM_NAMES */
const WINTER_SOLSTICE_IDX = SOLAR_TERM_NAMES.indexOf('冬至');
const SUMMER_SOLSTICE_IDX = SOLAR_TERM_NAMES.indexOf('夏至');

/**
 * 陽遁/陰遁: Yang escape from winter solstice to summer solstice,
 * Yin escape from summer solstice to winter solstice.
 */
export function getEscapeMode(date: Date): EscapeMode {
  const year = date.getUTCFullYear();
  const ts = date.getTime();

  const terms = getSolarTermsForYear(year);
  const winterSolstice = terms[WINTER_SOLSTICE_IDX];
  const summerSolstice = terms[SUMMER_SOLSTICE_IDX];

  // If before summer solstice, check against previous year's winter solstice
  if (ts < summerSolstice.date.getTime()) {
    // Between (prev) winter solstice and summer solstice → 陽遁
    return '陽遁';
  }
  // Between summer solstice and (this year's) winter solstice → 陰遁
  if (ts < winterSolstice.date.getTime()) {
    return '陰遁';
  }
  // After winter solstice → 陽遁 (next cycle)
  return '陽遁';
}

// ── 局數 (Pattern Number) ────────────────────────────────────

/**
 * 陽遁局數 by solar term pair (節氣) and 元 (upper/middle/lower).
 * Key: solar term index → [上元, 中元, 下元]
 */
const YANG_JU: Record<number, readonly [number, number, number]> = {
  0:  [2, 1, 3], // 冬至: 上1 中7 下4 -- wait, let me use standard mapping
};

// Standard 局數 mapping: solar term → [upper, middle, lower] yuan
// 陽遁 (winter solstice → summer solstice)
const YANG_JU_TABLE: readonly (readonly [number, number, number])[] = [
  /* 冬至 */ [1, 7, 4],
  /* 小寒 */ [2, 8, 5],
  /* 大寒 */ [3, 9, 6],
  /* 立春 */ [8, 5, 2],
  /* 雨水 */ [9, 6, 3],
  /* 驚蟄 */ [1, 7, 4],
  /* 春分 */ [3, 9, 6],
  /* 清明 */ [4, 1, 7],
  /* 穀雨 */ [5, 2, 8],
  /* 立夏 */ [4, 1, 7],
  /* 小滿 */ [5, 2, 8],
  /* 芒種 */ [6, 3, 9],
];

// 陰遁 (summer solstice → winter solstice)
const YIN_JU_TABLE: readonly (readonly [number, number, number])[] = [
  /* 夏至 */ [9, 3, 6],
  /* 小暑 */ [8, 2, 5],
  /* 大暑 */ [7, 1, 4],
  /* 立秋 */ [2, 5, 8],
  /* 處暑 */ [1, 4, 7],
  /* 白露 */ [9, 3, 6],
  /* 秋分 */ [7, 1, 4],
  /* 寒露 */ [6, 9, 3],
  /* 霜降 */ [5, 8, 2],
  /* 立冬 */ [6, 9, 3],
  /* 小雪 */ [5, 8, 2],
  /* 大雪 */ [4, 7, 1],
];

// Solar terms grouped for 陽遁 (from 冬至 index to 芒種)
const YANG_TERM_NAMES = [
  '冬至', '小寒', '大寒', '立春', '雨水', '驚蟄',
  '春分', '清明', '穀雨', '立夏', '小滿', '芒種',
];

const YIN_TERM_NAMES = [
  '夏至', '小暑', '大暑', '立秋', '處暑', '白露',
  '秋分', '寒露', '霜降', '立冬', '小雪', '大雪',
];

/**
 * Determine which 元 (upper=0, middle=1, lower=2) the date falls in.
 * Each solar term period (≈15 days) is divided into three 5-day 元.
 */
function getYuan(date: Date, termDate: Date): number {
  const daysDiff = Math.floor((date.getTime() - termDate.getTime()) / 86400000);
  if (daysDiff < 5) return 0;
  if (daysDiff < 10) return 1;
  return 2;
}

/**
 * Find the current solar term and compute 局數.
 */
export function getJuShu(date: Date): number {
  const year = date.getUTCFullYear();
  const ts = date.getTime();

  // Gather terms from adjacent years for boundary handling
  const allTerms = [
    ...getSolarTermsForYear(year - 1),
    ...getSolarTermsForYear(year),
    ...getSolarTermsForYear(year + 1),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  // Find the most recent solar term before this date
  let currentTerm = allTerms[0];
  for (const term of allTerms) {
    if (term.date.getTime() <= ts) {
      currentTerm = term;
    } else {
      break;
    }
  }

  const escapeMode = getEscapeMode(date);
  const termNames = escapeMode === '陽遁' ? YANG_TERM_NAMES : YIN_TERM_NAMES;
  const juTable = escapeMode === '陽遁' ? YANG_JU_TABLE : YIN_JU_TABLE;

  let termIdx = termNames.indexOf(currentTerm.name);
  if (termIdx < 0) {
    // Current term is a 中氣 (even-numbered term), use the preceding 節 term
    // Find the previous term that IS in our list
    for (let i = allTerms.indexOf(currentTerm) - 1; i >= 0; i--) {
      termIdx = termNames.indexOf(allTerms[i].name);
      if (termIdx >= 0) {
        currentTerm = allTerms[i];
        break;
      }
    }
    if (termIdx < 0) termIdx = 0;
  }

  const yuan = getYuan(date, currentTerm.date);
  return juTable[termIdx][yuan];
}

// ── Plate construction ───────────────────────────────────────

function loShuSequence(startPalace: number, mode: EscapeMode): number[] {
  const order = mode === '陽遁' ? LO_SHU_FORWARD : LO_SHU_REVERSE;
  const startIdx = order.indexOf(startPalace);
  const result: number[] = [];
  for (let i = 0; i < 8; i++) {
    result.push(order[(startIdx + i) % 8]);
  }
  return result;
}

/**
 * Build the earth plate (地盤): place 三奇六儀 starting from the 局數 palace.
 */
export function buildEarthPlate(
  juShu: number,
  mode: EscapeMode,
): Record<number, Stem> {
  const plate: Record<number, Stem> = {};
  const sequence = loShuSequence(juShu, mode);

  // Place 戊 at juShu palace, then follow Lo Shu order
  for (let i = 0; i < 8; i++) {
    plate[sequence[i]] = SAN_QI_LIU_YI[i];
  }
  // Palace 5 (center): 天禽 borrows; place the 9th element
  plate[5] = SAN_QI_LIU_YI[8];

  // Actually, all 9 elements go to 9 palaces. 戊 starts at juShu,
  // fills 8 outer palaces, and palace 5 gets whatever is left.
  // But 三奇六儀 has exactly 9 elements for 9 palaces.
  // Let me fix: place all 9 sequentially through Lo Shu + center.

  // Correct approach: 戊 at juShu, then follow Lo Shu for remaining 8.
  // The 9th element (乙) wraps around, and palace 5 gets the element
  // that would land there in the sequence.
  const fullSeq = loShuSequence(juShu, mode);
  // Insert palace 5 at the appropriate position in the sequence
  // In standard Qi Men, palace 5's earth stem is determined by its
  // position in the counting sequence. The count goes through all 9 palaces.
  const plate2: Record<number, Stem> = {};
  const fullOrder = [...fullSeq.slice(0, 4), 5, ...fullSeq.slice(4)];
  for (let i = 0; i < 9; i++) {
    plate2[fullOrder[i]] = SAN_QI_LIU_YI[i];
  }

  return plate2;
}

/**
 * Build the heaven plate (天盤): rotate based on where the 值符 star moves.
 */
export function buildHeavenPlate(
  earthPlate: Record<number, Stem>,
  hourBranch: Branch,
  juShu: number,
  mode: EscapeMode,
): Record<number, Stem> {
  // 值符 is the star at the palace where 甲 (encoded as 戊) resides on earth plate.
  // The hour branch determines where 值符 moves to on the heaven plate.
  // The heaven plate is the earth plate rotated so that the 甲戊 element
  // follows the hour's palace.

  const hourIdx = BRANCHES.indexOf(hourBranch);
  // Hour palace mapping: 子→1, 丑→8, 寅→3, 卯→4, 辰→5(→2), 巳→9, etc.
  // Using Lo Shu mapping from branch
  const BRANCH_TO_PALACE: Record<string, number> = {
    '子': 1, '丑': 8, '寅': 3, '卯': 4, '辰': 5,  '巳': 9,
    '午': 9, '未': 2, '申': 7, '酉': 6, '戌': 5, '亥': 1,
  };

  // Find where 戊 is on earth plate (that's the 值符's home)
  let zhiFuHome = juShu;
  // Find where 值符 needs to go (hour stem's palace on earth plate)
  // Simplified: the hour branch maps to a palace, and we rotate the
  // earth plate so 戊's position moves to that palace.

  const targetPalace = BRANCH_TO_PALACE[hourBranch] || 1;

  // Build heaven plate by rotating
  const heavenPlate: Record<number, Stem> = {};
  const order = mode === '陽遁' ? LO_SHU_FORWARD : LO_SHU_REVERSE;
  const fullOrder = [...order.slice(0, 4), 5, ...order.slice(4)];

  // Find offset: how many steps from zhiFuHome to targetPalace in Lo Shu order
  const homeIdx = fullOrder.indexOf(zhiFuHome === 5 ? 2 : zhiFuHome); // palace 5 borrows to 2
  const targetIdx = fullOrder.indexOf(targetPalace === 5 ? 2 : targetPalace);
  const offset = (targetIdx - homeIdx + 9) % 9;

  for (let i = 0; i < 9; i++) {
    const earthPalace = fullOrder[i];
    const heavenPalace = fullOrder[(i + offset) % 9];
    heavenPlate[heavenPalace] = earthPlate[earthPalace];
  }

  return heavenPlate;
}

// ── Star/Door/Deity distribution ─────────────────────────────

function distributeOnGrid(
  items: readonly string[],
  homePositions: readonly number[],
  offset: number,
  mode: EscapeMode,
): Record<number, string> {
  const result: Record<number, string> = {};
  const order = mode === '陽遁' ? LO_SHU_FORWARD : LO_SHU_REVERSE;

  for (let i = 0; i < items.length; i++) {
    const home = homePositions[i];
    if (home === 5) {
      // Palace 5 (天禽/center) borrows to palace 2
      result[2] = result[2] || items[i];
      continue;
    }
    const homeIdx = order.indexOf(home);
    const newIdx = (homeIdx + offset) % 8;
    result[order[newIdx]] = items[i];
  }
  // Ensure palace 5 has something (天禽 or the borrowing element)
  if (!result[5]) {
    result[5] = items[4]; // 天禽
  }

  return result;
}

// ── Main computation ─────────────────────────────────────────

export function computeQiMen(
  dayStem: Stem,
  hourBranch: Branch,
  juShu: number,
  escapeMode: EscapeMode,
): QiMenChart {
  const earthPlate = buildEarthPlate(juShu, escapeMode);
  const heavenPlate = buildHeavenPlate(earthPlate, hourBranch, juShu, escapeMode);

  // 值符: the star whose home palace contains 甲(戊) on earth plate
  const zhiFuStarIdx = juShu - 1; // Star index = palace - 1 (stars are homed at their palace)
  const zhiFuStar = NINE_STARS[zhiFuStarIdx];

  // Find where 值符 star moves to (same rotation as heaven plate)
  const order = escapeMode === '陽遁' ? LO_SHU_FORWARD : LO_SHU_REVERSE;
  const fullOrder = [...order.slice(0, 4), 5, ...order.slice(4)];

  // Compute rotation offset (same as heaven plate)
  const BRANCH_TO_PALACE: Record<string, number> = {
    '子': 1, '丑': 8, '寅': 3, '卯': 4, '辰': 5, '巳': 9,
    '午': 9, '未': 2, '申': 7, '酉': 6, '戌': 5, '亥': 1,
  };
  const targetPalace = BRANCH_TO_PALACE[hourBranch] || 1;
  const homeIdx = fullOrder.indexOf(juShu === 5 ? 2 : juShu);
  const targetIdx = fullOrder.indexOf(targetPalace === 5 ? 2 : targetPalace);
  const offset = (targetIdx - homeIdx + 9) % 9;

  // Distribute stars
  const stars = distributeOnGrid(NINE_STARS, STAR_HOME, offset, escapeMode);

  // 值使: the door whose home palace = 值符's home palace
  const zhiShiDoorIdx = DOOR_HOME.indexOf(juShu === 5 ? 2 : juShu);
  const zhiShiDoor = zhiShiDoorIdx >= 0 ? EIGHT_DOORS[zhiShiDoorIdx] : EIGHT_DOORS[0];

  // Distribute doors
  const doors = distributeOnGrid(EIGHT_DOORS, DOOR_HOME, offset, escapeMode);

  // Distribute deities — 值符 deity goes to same palace as 值符 star
  const deityList = escapeMode === '陽遁' ? EIGHT_DEITIES : EIGHT_DEITIES_YIN;
  const deities: Record<number, string> = {};
  // 值符 deity at the 值符 star's new palace
  const zhiFuNewPalace = targetPalace === 5 ? 2 : targetPalace;

  // Place deities starting from 值符's palace, following Lo Shu order
  const zhiFuOrderIdx = order.indexOf(zhiFuNewPalace);
  for (let i = 0; i < 8; i++) {
    const palace = order[(zhiFuOrderIdx + i) % 8];
    deities[palace] = deityList[i];
  }
  if (!deities[5]) deities[5] = deityList[0]; // Center borrows

  // Find 值符 and 值使 final palaces
  let zhiFuPalace = zhiFuNewPalace;
  let zhiShiPalace = 1;
  for (const [p, d] of Object.entries(doors)) {
    if (d === zhiShiDoor) {
      zhiShiPalace = Number(p);
      break;
    }
  }

  return {
    escapeMode,
    juShu,
    earthPlate,
    heavenPlate,
    stars,
    doors,
    deities,
    zhiFu: { star: zhiFuStar, palace: zhiFuPalace },
    zhiShi: { door: zhiShiDoor, palace: zhiShiPalace },
    hourBranch,
    dayStem,
  };
}

export function computeQiMenForDate(date: Date): QiMenChart {
  const pillars = computeFourPillars(date);
  const escapeMode = getEscapeMode(date);
  const juShu = getJuShu(date);
  return computeQiMen(
    pillars.day.stem,
    pillars.hour.branch,
    juShu,
    escapeMode,
  );
}
