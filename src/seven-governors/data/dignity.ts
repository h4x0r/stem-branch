/* v8 ignore next */
import type { GovernorOrRemainder, PalaceName, Dignity } from '../types';

const P = '平' as Dignity; // shorthand for placeholder entries

export const DIGNITY_TABLE: Record<GovernorOrRemainder, Record<PalaceName, Dignity>> = {
  sun: {
    '子宮': '陷', '丑宮': P, '寅宮': '旺', '卯宮': P,
    '辰宮': P, '巳宮': '廟', '午宮': '廟', '未宮': P,
    '申宮': P, '酉宮': P, '戌宮': P, '亥宮': '陷',
  },
  moon: {
    '子宮': '廟', '丑宮': P, '寅宮': P, '卯宮': '旺',
    '辰宮': P, '巳宮': P, '午宮': '陷', '未宮': P,
    '申宮': P, '酉宮': P, '戌宮': P, '亥宮': '廟',
  },
  mercury:  { '子宮':P,'丑宮':P,'寅宮':P,'卯宮':P,'辰宮':P,'巳宮':P,'午宮':P,'未宮':P,'申宮':P,'酉宮':P,'戌宮':P,'亥宮':P },
  venus:    { '子宮':P,'丑宮':P,'寅宮':P,'卯宮':P,'辰宮':P,'巳宮':P,'午宮':P,'未宮':P,'申宮':P,'酉宮':P,'戌宮':P,'亥宮':P },
  mars:     { '子宮':P,'丑宮':P,'寅宮':P,'卯宮':P,'辰宮':P,'巳宮':P,'午宮':P,'未宮':P,'申宮':P,'酉宮':P,'戌宮':P,'亥宮':P },
  jupiter:  { '子宮':P,'丑宮':P,'寅宮':P,'卯宮':P,'辰宮':P,'巳宮':P,'午宮':P,'未宮':P,'申宮':P,'酉宮':P,'戌宮':P,'亥宮':P },
  saturn:   { '子宮':P,'丑宮':P,'寅宮':P,'卯宮':P,'辰宮':P,'巳宮':P,'午宮':P,'未宮':P,'申宮':P,'酉宮':P,'戌宮':P,'亥宮':P },
  rahu:     { '子宮':P,'丑宮':P,'寅宮':P,'卯宮':P,'辰宮':P,'巳宮':P,'午宮':P,'未宮':P,'申宮':P,'酉宮':P,'戌宮':P,'亥宮':P },
  ketu:     { '子宮':P,'丑宮':P,'寅宮':P,'卯宮':P,'辰宮':P,'巳宮':P,'午宮':P,'未宮':P,'申宮':P,'酉宮':P,'戌宮':P,'亥宮':P },
  yuebei:   { '子宮':P,'丑宮':P,'寅宮':P,'卯宮':P,'辰宮':P,'巳宮':P,'午宮':P,'未宮':P,'申宮':P,'酉宮':P,'戌宮':P,'亥宮':P },
  purpleQi: { '子宮':P,'丑宮':P,'寅宮':P,'卯宮':P,'辰宮':P,'巳宮':P,'午宮':P,'未宮':P,'申宮':P,'酉宮':P,'戌宮':P,'亥宮':P },
};

export function getDignity(body: GovernorOrRemainder, palace: PalaceName): Dignity {
  return DIGNITY_TABLE[body][palace];
}
