/**
 * 值神 (Duty Deity) & 黃道黑道 (Auspicious/Inauspicious Day Type)
 *
 * The twelve duty deities correspond 1:1 with the 建除十二神 (day fitness)
 * cycle. Each day's fitness value determines its presiding deity, which
 * in turn determines whether the day is 黃道 (auspicious) or 黑道 (inauspicious).
 *
 * 黃道吉日: 青龍, 明堂, 金匱, 天德, 玉堂, 司命
 * 黑道凶日: 天刑, 朱雀, 白虎, 天牢, 玄武, 勾陳
 *
 * 建→青龍, 除→明堂, 滿→天刑, 平→朱雀, 定→金匱, 執→天德,
 * 破→白虎, 危→玉堂, 成→天牢, 收→玄武, 開→司命, 閉→勾陳
 */

import type { DayFitness } from './day-fitness';
import { getDayFitnessForDate } from './day-fitness';

// ── Types ────────────────────────────────────────────────────

export type DayPath = '黃道' | '黑道';

export interface DutyDeityResult {
  /** The presiding deity name */
  deity: string;
  /** 黃道 (auspicious) or 黑道 (inauspicious) */
  path: DayPath;
}

// ── The twelve duty deities (indexed parallel to fitness cycle) ──

export const DUTY_DEITIES: readonly string[] = [
  '青龍', '明堂', '天刑', '朱雀', '金匱', '天德',
  '白虎', '玉堂', '天牢', '玄武', '司命', '勾陳',
];

/** 黃道 deities — auspicious day officers */
const HUANG_DAO = new Set(['青龍', '明堂', '金匱', '天德', '玉堂', '司命']);

const FITNESS_TO_INDEX: Record<DayFitness, number> = {
  '建': 0, '除': 1, '滿': 2, '平': 3, '定': 4, '執': 5,
  '破': 6, '危': 7, '成': 8, '收': 9, '開': 10, '閉': 11,
};

// ── Public API ───────────────────────────────────────────────

export function getDutyDeity(fitness: DayFitness): DutyDeityResult {
  const deity = DUTY_DEITIES[FITNESS_TO_INDEX[fitness]];
  const path: DayPath = HUANG_DAO.has(deity) ? '黃道' : '黑道';
  return { deity, path };
}

export function getDutyDeityForDate(date: Date): DutyDeityResult {
  const { fitness } = getDayFitnessForDate(date);
  return getDutyDeity(fitness);
}
