/**
 * 二十八星宿 (28 Lunar Mansions)
 *
 * The 28 mansions cycle daily, one per day. Each mansion has an
 * associated animal, element, and belongs to one of four directional
 * groups (四象: Azure Dragon, Black Tortoise, White Tiger, Vermillion Bird).
 *
 * The cycle is determined from the Julian Day Number using a known
 * epoch anchor.
 */

import { julianDayNumber } from './julian-day';

/** Seven luminaries (七曜) — the weekday cycle, not Five Elements */
export type Luminary = '日' | '月' | '火' | '水' | '木' | '金' | '土';

// ── Mansion data ─────────────────────────────────────────────

export interface LunarMansion {
  /** Mansion name (single character) */
  name: string;
  /** Associated animal */
  animal: string;
  /** Associated element (七曜) */
  element: Luminary;
  /** Directional group (四象) */
  group: '東方青龍' | '北方玄武' | '西方白虎' | '南方朱雀';
  /** Index in the 28-mansion cycle (0-27) */
  index: number;
}

export const LUNAR_MANSIONS: readonly LunarMansion[] = [
  // ── 東方青龍 (Eastern Azure Dragon) ──
  { name: '角', animal: '蛟', element: '木', group: '東方青龍', index: 0 },
  { name: '亢', animal: '龍', element: '金', group: '東方青龍', index: 1 },
  { name: '氐', animal: '貉', element: '土', group: '東方青龍', index: 2 },
  { name: '房', animal: '兔', element: '火', group: '東方青龍', index: 3 },
  { name: '心', animal: '狐', element: '月', group: '東方青龍', index: 4 },
  { name: '尾', animal: '虎', element: '火', group: '東方青龍', index: 5 },
  { name: '箕', animal: '豹', element: '水', group: '東方青龍', index: 6 },
  // ── 北方玄武 (Northern Black Tortoise) ──
  { name: '斗', animal: '獬', element: '木', group: '北方玄武', index: 7 },
  { name: '牛', animal: '牛', element: '金', group: '北方玄武', index: 8 },
  { name: '女', animal: '蝠', element: '土', group: '北方玄武', index: 9 },
  { name: '虛', animal: '鼠', element: '火', group: '北方玄武', index: 10 },
  { name: '危', animal: '燕', element: '月', group: '北方玄武', index: 11 },
  { name: '室', animal: '豬', element: '火', group: '北方玄武', index: 12 },
  { name: '壁', animal: '貐', element: '水', group: '北方玄武', index: 13 },
  // ── 西方白虎 (Western White Tiger) ──
  { name: '奎', animal: '狼', element: '木', group: '西方白虎', index: 14 },
  { name: '婁', animal: '狗', element: '金', group: '西方白虎', index: 15 },
  { name: '胃', animal: '雉', element: '土', group: '西方白虎', index: 16 },
  { name: '昴', animal: '雞', element: '火', group: '西方白虎', index: 17 },
  { name: '畢', animal: '烏', element: '月', group: '西方白虎', index: 18 },
  { name: '觜', animal: '猴', element: '火', group: '西方白虎', index: 19 },
  { name: '參', animal: '猿', element: '水', group: '西方白虎', index: 20 },
  // ── 南方朱雀 (Southern Vermillion Bird) ──
  { name: '井', animal: '犴', element: '木', group: '南方朱雀', index: 21 },
  { name: '鬼', animal: '羊', element: '金', group: '南方朱雀', index: 22 },
  { name: '柳', animal: '獐', element: '土', group: '南方朱雀', index: 23 },
  { name: '星', animal: '馬', element: '火', group: '南方朱雀', index: 24 },
  { name: '張', animal: '鹿', element: '月', group: '南方朱雀', index: 25 },
  { name: '翼', animal: '蛇', element: '火', group: '南方朱雀', index: 26 },
  { name: '軫', animal: '蚓', element: '水', group: '南方朱雀', index: 27 },
] as const;

// ── Epoch anchor ─────────────────────────────────────────────
// JD 2444239 = 1980-01-06, which is 虛 (index 10)
const EPOCH_JD = 2444239;
const EPOCH_INDEX = 10;

// ── Public API ───────────────────────────────────────────────

export function getLunarMansion(jd: number): LunarMansion {
  const idx = ((Math.floor(jd) - EPOCH_JD + EPOCH_INDEX) % 28 + 28) % 28;
  return LUNAR_MANSIONS[idx];
}

export function getLunarMansionForDate(date: Date): LunarMansion {
  const jd = julianDayNumber(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
  );
  return getLunarMansion(jd);
}
