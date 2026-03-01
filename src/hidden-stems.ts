import type { Branch, HiddenStem } from './types';

export type { HiddenStem } from './types';

/** 地支藏干 — Hidden stems within each earthly branch */
export const HIDDEN_STEMS: Record<Branch, readonly HiddenStem[]> = {
  '子': [{ stem: '癸', proportion: 1 }],
  '丑': [{ stem: '己', proportion: 0.6 }, { stem: '癸', proportion: 0.2 }, { stem: '辛', proportion: 0.2 }],
  '寅': [{ stem: '甲', proportion: 0.6 }, { stem: '丙', proportion: 0.2 }, { stem: '戊', proportion: 0.2 }],
  '卯': [{ stem: '乙', proportion: 1 }],
  '辰': [{ stem: '戊', proportion: 0.6 }, { stem: '乙', proportion: 0.2 }, { stem: '癸', proportion: 0.2 }],
  '巳': [{ stem: '丙', proportion: 0.6 }, { stem: '庚', proportion: 0.2 }, { stem: '戊', proportion: 0.2 }],
  '午': [{ stem: '丁', proportion: 0.7 }, { stem: '己', proportion: 0.3 }],
  '未': [{ stem: '己', proportion: 0.6 }, { stem: '丁', proportion: 0.2 }, { stem: '乙', proportion: 0.2 }],
  '申': [{ stem: '庚', proportion: 0.6 }, { stem: '壬', proportion: 0.2 }, { stem: '戊', proportion: 0.2 }],
  '酉': [{ stem: '辛', proportion: 1 }],
  '戌': [{ stem: '戊', proportion: 0.6 }, { stem: '辛', proportion: 0.2 }, { stem: '丁', proportion: 0.2 }],
  '亥': [{ stem: '壬', proportion: 0.7 }, { stem: '甲', proportion: 0.3 }],
};

/** Get hidden stems for a branch (main stem first) */
export function getHiddenStems(branch: Branch): readonly HiddenStem[] {
  return HIDDEN_STEMS[branch];
}
