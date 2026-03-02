/**
 * 胎神 (Fetal Deity Position)
 *
 * The daily position of the Fetal Deity (胎神), which governs
 * the wellbeing of pregnant women and unborn children. The position
 * cycles through 60 locations matching the sexagenary cycle.
 *
 * Source: 《協紀辨方書》
 */

import type { Stem, Branch } from './types';
import { stemBranchCycleIndex } from './stem-branch';
import { computeFourPillars } from './four-pillars';

// ── 60-entry lookup (indexed by sexagenary cycle position) ───

const FETAL_DEITY: readonly string[] = [
  /* 00 甲子 */ '占門碓外東南',
  /* 01 乙丑 */ '碓磨廁外東南',
  /* 02 丙寅 */ '廚灶碓外正南',
  /* 03 丁卯 */ '倉庫門外正南',
  /* 04 戊辰 */ '房床棲外正南',
  /* 05 己巳 */ '占門床外正南',
  /* 06 庚午 */ '占碓磨外正南',
  /* 07 辛未 */ '廚灶廁外西南',
  /* 08 壬申 */ '倉庫爐外正北',
  /* 09 癸酉 */ '房床門外正北',
  /* 10 甲戌 */ '占門爐外西南',
  /* 11 乙亥 */ '碓磨棲外西南',
  /* 12 丙子 */ '廚灶碓外正西',
  /* 13 丁丑 */ '倉庫門外正西',
  /* 14 戊寅 */ '房床爐外正北',
  /* 15 己卯 */ '占門床外正北',
  /* 16 庚辰 */ '碓磨棲外正北',
  /* 17 辛巳 */ '廚灶廁外西北',
  /* 18 壬午 */ '倉庫碓外西北',
  /* 19 癸未 */ '房床廁外西北',
  /* 20 甲申 */ '占門碓外東北',
  /* 21 乙酉 */ '碓磨門外東北',
  /* 22 丙戌 */ '廚灶爐外東北',
  /* 23 丁亥 */ '倉庫棲外東北',
  /* 24 戊子 */ '房床碓外正東',
  /* 25 己丑 */ '占門廁外正東',
  /* 26 庚寅 */ '碓磨爐外正東',
  /* 27 辛卯 */ '廚灶床外東南',
  /* 28 壬辰 */ '倉庫棲外東南',
  /* 29 癸巳 */ '占房床房內東',
  /* 30 甲午 */ '占門碓外東南',
  /* 31 乙未 */ '碓磨廁外東南',
  /* 32 丙申 */ '廚灶碓外正南',
  /* 33 丁酉 */ '倉庫門外正南',
  /* 34 戊戌 */ '房床棲外正南',
  /* 35 己亥 */ '占門床外正南',
  /* 36 庚子 */ '占碓磨外正南',
  /* 37 辛丑 */ '廚灶廁外西南',
  /* 38 壬寅 */ '倉庫爐外正北',
  /* 39 癸卯 */ '房床門外正北',
  /* 40 甲辰 */ '占門爐外西南',
  /* 41 乙巳 */ '碓磨棲外西南',
  /* 42 丙午 */ '廚灶碓外正西',
  /* 43 丁未 */ '倉庫門外正西',
  /* 44 戊申 */ '房床爐外正北',
  /* 45 己酉 */ '占門床外正北',
  /* 46 庚戌 */ '碓磨棲外正北',
  /* 47 辛亥 */ '廚灶廁外西北',
  /* 48 壬子 */ '倉庫碓外西北',
  /* 49 癸丑 */ '房床廁外西北',
  /* 50 甲寅 */ '占門碓外東北',
  /* 51 乙卯 */ '碓磨門外東北',
  /* 52 丙辰 */ '廚灶爐外東北',
  /* 53 丁巳 */ '倉庫棲外東北',
  /* 54 戊午 */ '房床碓外正東',
  /* 55 己未 */ '占門廁外正東',
  /* 56 庚申 */ '碓磨爐外正東',
  /* 57 辛酉 */ '廚灶床外東南',
  /* 58 壬戌 */ '倉庫棲外東南',
  /* 59 癸亥 */ '占房床房內東',
];

// ── Public API ───────────────────────────────────────────────

export function getFetalDeity(stem: Stem, branch: Branch): string {
  const idx = stemBranchCycleIndex(stem, branch);
  if (idx < 0) return '';
  return FETAL_DEITY[idx];
}

export function getFetalDeityForDate(date: Date): string {
  const pillars = computeFourPillars(date);
  return getFetalDeity(pillars.day.stem, pillars.day.branch);
}
