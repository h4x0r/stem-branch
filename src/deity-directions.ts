/**
 * 神煞方位 (Deity Compass Directions)
 *
 * Daily auspicious directions for the four major deities,
 * derived from the day's Heavenly Stem:
 *   財神 (Wealth God), 喜神 (Joy God),
 *   福神 (Fortune God), 貴神 (Noble God)
 */

import type { Stem } from './types';
import { computeFourPillars } from './four-pillars';

// ── Direction tables (per day stem) ──────────────────────────

const WEALTH_GOD: Record<Stem, string> = {
  '甲': '東北', '乙': '東北', '丙': '西南', '丁': '西南', '戊': '正北',
  '己': '正北', '庚': '正東', '辛': '正東', '壬': '正南', '癸': '正南',
};

// 喜神方位 follows a 5-cycle: 甲己→東北, 乙庚→西北, 丙辛→西南, 丁壬→正南, 戊癸→東南
const JOY_GOD: Record<Stem, string> = {
  '甲': '東北', '己': '東北',
  '乙': '西北', '庚': '西北',
  '丙': '西南', '辛': '西南',
  '丁': '正南', '壬': '正南',
  '戊': '東南', '癸': '東南',
};

// 福神方位
const FORTUNE_GOD: Record<Stem, string> = {
  '甲': '東南', '乙': '東北', '丙': '正東', '丁': '正南', '戊': '正北',
  '己': '正北', '庚': '西南', '辛': '東南', '壬': '西北', '癸': '西南',
};

// 貴神方位 (based on 天乙貴人 primary noble direction)
const NOBLE_GOD: Record<Stem, string> = {
  '甲': '西南', '乙': '正北', '丙': '西北', '丁': '正西', '戊': '東北',
  '己': '東北', '庚': '西南', '辛': '正南', '壬': '正南', '癸': '東南',
};

// ── Public API ───────────────────────────────────────────────

export interface DeityDirections {
  /** 財神方位 (Wealth God direction) */
  wealth: string;
  /** 喜神方位 (Joy God direction) */
  joy: string;
  /** 福神方位 (Fortune God direction) */
  fortune: string;
  /** 貴神方位 (Noble God direction) */
  noble: string;
}

export function getDeityDirections(dayStem: Stem): DeityDirections {
  return {
    wealth: WEALTH_GOD[dayStem],
    joy: JOY_GOD[dayStem],
    fortune: FORTUNE_GOD[dayStem],
    noble: NOBLE_GOD[dayStem],
  };
}

export function getDeityDirectionsForDate(date: Date): DeityDirections {
  const pillars = computeFourPillars(date);
  return getDeityDirections(pillars.day.stem);
}
