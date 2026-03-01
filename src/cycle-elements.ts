import type { Element, StemBranch } from './types';

export interface CycleElementEntry {
  element: Element;
  name: string;
}

/**
 * 納音 (Cycle Elements) — The 60 sexagenary cycle pairs
 * mapped to their Five-Element sound (納音五行) and poetic name.
 * Each consecutive pair of stem-branches shares the same 納音.
 */
export const CYCLE_ELEMENTS: Record<StemBranch, CycleElementEntry> = {
  '甲子': { element: '金', name: '海中金' },
  '乙丑': { element: '金', name: '海中金' },
  '丙寅': { element: '火', name: '爐中火' },
  '丁卯': { element: '火', name: '爐中火' },
  '戊辰': { element: '木', name: '大林木' },
  '己巳': { element: '木', name: '大林木' },
  '庚午': { element: '土', name: '路旁土' },
  '辛未': { element: '土', name: '路旁土' },
  '壬申': { element: '金', name: '劍鋒金' },
  '癸酉': { element: '金', name: '劍鋒金' },
  '甲戌': { element: '火', name: '山頭火' },
  '乙亥': { element: '火', name: '山頭火' },
  '丙子': { element: '水', name: '澗下水' },
  '丁丑': { element: '水', name: '澗下水' },
  '戊寅': { element: '土', name: '城頭土' },
  '己卯': { element: '土', name: '城頭土' },
  '庚辰': { element: '金', name: '白蠟金' },
  '辛巳': { element: '金', name: '白蠟金' },
  '壬午': { element: '木', name: '楊柳木' },
  '癸未': { element: '木', name: '楊柳木' },
  '甲申': { element: '水', name: '泉中水' },
  '乙酉': { element: '水', name: '泉中水' },
  '丙戌': { element: '土', name: '屋上土' },
  '丁亥': { element: '土', name: '屋上土' },
  '戊子': { element: '火', name: '霹靂火' },
  '己丑': { element: '火', name: '霹靂火' },
  '庚寅': { element: '木', name: '松柏木' },
  '辛卯': { element: '木', name: '松柏木' },
  '壬辰': { element: '水', name: '長流水' },
  '癸巳': { element: '水', name: '長流水' },
  '甲午': { element: '金', name: '沙中金' },
  '乙未': { element: '金', name: '沙中金' },
  '丙申': { element: '火', name: '山下火' },
  '丁酉': { element: '火', name: '山下火' },
  '戊戌': { element: '木', name: '平地木' },
  '己亥': { element: '木', name: '平地木' },
  '庚子': { element: '土', name: '壁上土' },
  '辛丑': { element: '土', name: '壁上土' },
  '壬寅': { element: '金', name: '金箔金' },
  '癸卯': { element: '金', name: '金箔金' },
  '甲辰': { element: '火', name: '覆燈火' },
  '乙巳': { element: '火', name: '覆燈火' },
  '丙午': { element: '水', name: '天河水' },
  '丁未': { element: '水', name: '天河水' },
  '戊申': { element: '土', name: '大驛土' },
  '己酉': { element: '土', name: '大驛土' },
  '庚戌': { element: '金', name: '釵釧金' },
  '辛亥': { element: '金', name: '釵釧金' },
  '壬子': { element: '木', name: '桑柘木' },
  '癸丑': { element: '木', name: '桑柘木' },
  '甲寅': { element: '水', name: '大溪水' },
  '乙卯': { element: '水', name: '大溪水' },
  '丙辰': { element: '土', name: '沙中土' },
  '丁巳': { element: '土', name: '沙中土' },
  '戊午': { element: '火', name: '天上火' },
  '己未': { element: '火', name: '天上火' },
  '庚申': { element: '木', name: '石榴木' },
  '辛酉': { element: '木', name: '石榴木' },
  '壬戌': { element: '水', name: '大海水' },
  '癸亥': { element: '水', name: '大海水' },
};

/** Get the 納音 element for a stem-branch pair */
export function getCycleElement(sb: StemBranch): Element {
  return CYCLE_ELEMENTS[sb].element;
}

/** Get the 納音 poetic name for a stem-branch pair */
export function getCycleElementName(sb: StemBranch): string {
  return CYCLE_ELEMENTS[sb].name;
}
