import { describe, it, expect } from 'vitest';
import {
  HARMONY_PAIRS, CLASH_PAIRS, isHarmony, isClash, getDayRelation,
  THREE_HARMONIES, SEASONAL_UNIONS, HALF_HARMONIES,
  PUNISHMENT_GROUPS, SELF_PUNISHMENT, HARM_PAIRS, DESTRUCTION_PAIRS,
  isThreeHarmony, getThreeHarmonyElement,
  isSeasonalUnion, getSeasonalUnionElement,
  isPunishment, getPunishmentType, isSelfPunishment,
  isHarm, isDestruction,
} from '../src/branch-relations';

describe('HARMONY_PAIRS', () => {
  it('has 6 harmony pairs', () => {
    expect(HARMONY_PAIRS).toHaveLength(6);
  });
});

describe('CLASH_PAIRS', () => {
  it('has 6 clash pairs', () => {
    expect(CLASH_PAIRS).toHaveLength(6);
  });
});

describe('isHarmony', () => {
  it('detects harmony pairs', () => {
    expect(isHarmony('子', '丑')).toBe(true);
    expect(isHarmony('寅', '亥')).toBe(true);
    expect(isHarmony('午', '未')).toBe(true);
  });

  it('is bidirectional', () => {
    expect(isHarmony('丑', '子')).toBe(true);
    expect(isHarmony('亥', '寅')).toBe(true);
  });

  it('rejects non-harmony pairs', () => {
    expect(isHarmony('子', '午')).toBe(false);
    expect(isHarmony('子', '子')).toBe(false);
  });
});

describe('isClash', () => {
  it('detects clash pairs', () => {
    expect(isClash('子', '午')).toBe(true);
    expect(isClash('寅', '申')).toBe(true);
    expect(isClash('巳', '亥')).toBe(true);
  });

  it('is bidirectional', () => {
    expect(isClash('午', '子')).toBe(true);
  });

  it('rejects non-clash pairs', () => {
    expect(isClash('子', '丑')).toBe(false);
  });
});

describe('getDayRelation', () => {
  it('returns 合 for harmony pairs (highest priority)', () => {
    expect(getDayRelation('子', '丑')).toBe('合');
  });

  it('returns 沖 for clash pairs', () => {
    expect(getDayRelation('子', '午')).toBe('沖');
  });

  it('returns 生 for generative relationship', () => {
    // 子=水 → 寅=木 : 水生木 → 生
    expect(getDayRelation('子', '寅')).toBe('生');
  });

  it('returns 剋 for conquering relationship', () => {
    // 子=水 → 巳=火 : 水剋火 → 剋
    expect(getDayRelation('子', '巳')).toBe('剋');
  });

  it('returns 比和 for same-element pairs', () => {
    // 子=水 → 亥=水, but 子亥 is NOT a 六合 or 六沖 pair → 比和
    expect(getDayRelation('子', '亥')).toBe('比和');
  });
});

describe('THREE_HARMONIES (三合)', () => {
  it('has 4 groups', () => {
    expect(THREE_HARMONIES).toHaveLength(4);
  });

  it('申子辰合水', () => {
    expect(isThreeHarmony('申', '子', '辰')).toBe(true);
    expect(getThreeHarmonyElement('申', '子', '辰')).toBe('水');
  });

  it('寅午戌合火', () => {
    expect(isThreeHarmony('寅', '午', '戌')).toBe(true);
    expect(getThreeHarmonyElement('寅', '午', '戌')).toBe('火');
  });

  it('巳酉丑合金', () => {
    expect(isThreeHarmony('巳', '酉', '丑')).toBe(true);
    expect(getThreeHarmonyElement('巳', '酉', '丑')).toBe('金');
  });

  it('亥卯未合木', () => {
    expect(isThreeHarmony('亥', '卯', '未')).toBe(true);
    expect(getThreeHarmonyElement('亥', '卯', '未')).toBe('木');
  });

  it('order-independent', () => {
    expect(isThreeHarmony('辰', '申', '子')).toBe(true);
    expect(isThreeHarmony('子', '辰', '申')).toBe(true);
  });

  it('rejects non-three-harmony groups', () => {
    expect(isThreeHarmony('子', '丑', '寅')).toBe(false);
    expect(getThreeHarmonyElement('子', '丑', '寅')).toBeNull();
  });
});

describe('HALF_HARMONIES (半合)', () => {
  it('has pairs from three-harmony groups', () => {
    expect(HALF_HARMONIES.length).toBeGreaterThanOrEqual(8);
  });

  it('子辰 is a half-harmony (from 申子辰)', () => {
    const found = HALF_HARMONIES.some(({ pair: [a, b] }) =>
      (a === '子' && b === '辰') || (a === '辰' && b === '子')
    );
    expect(found).toBe(true);
  });
});

describe('SEASONAL_UNIONS (三會)', () => {
  it('has 4 groups', () => {
    expect(SEASONAL_UNIONS).toHaveLength(4);
  });

  it('寅卯辰會木', () => {
    expect(isSeasonalUnion('寅', '卯', '辰')).toBe(true);
    expect(getSeasonalUnionElement('寅', '卯', '辰')).toBe('木');
  });

  it('巳午未會火', () => {
    expect(isSeasonalUnion('巳', '午', '未')).toBe(true);
    expect(getSeasonalUnionElement('巳', '午', '未')).toBe('火');
  });

  it('申酉戌會金', () => {
    expect(isSeasonalUnion('申', '酉', '戌')).toBe(true);
    expect(getSeasonalUnionElement('申', '酉', '戌')).toBe('金');
  });

  it('亥子丑會水', () => {
    expect(isSeasonalUnion('亥', '子', '丑')).toBe(true);
    expect(getSeasonalUnionElement('亥', '子', '丑')).toBe('水');
  });

  it('order-independent', () => {
    expect(isSeasonalUnion('辰', '寅', '卯')).toBe(true);
  });

  it('rejects non-seasonal-union', () => {
    expect(isSeasonalUnion('子', '丑', '寅')).toBe(false);
    expect(getSeasonalUnionElement('子', '丑', '寅')).toBeNull();
  });
});

describe('PUNISHMENT_GROUPS (刑)', () => {
  it('has 3 punishment groups', () => {
    expect(PUNISHMENT_GROUPS).toHaveLength(3);
  });

  it('寅巳申 — 無恩之刑', () => {
    expect(isPunishment('寅', '巳')).toBe(true);
    expect(getPunishmentType('寅', '巳')).toBe('無恩');
  });

  it('丑戌未 — 恃勢之刑', () => {
    expect(isPunishment('丑', '戌')).toBe(true);
    expect(getPunishmentType('丑', '戌')).toBe('恃勢');
  });

  it('子卯 — 無禮之刑', () => {
    expect(isPunishment('子', '卯')).toBe(true);
    expect(getPunishmentType('子', '卯')).toBe('無禮');
  });

  it('bidirectional', () => {
    expect(isPunishment('巳', '寅')).toBe(true);
    expect(isPunishment('卯', '子')).toBe(true);
  });

  it('rejects non-punishment', () => {
    expect(isPunishment('子', '丑')).toBe(false);
    expect(getPunishmentType('子', '丑')).toBeNull();
  });
});

describe('SELF_PUNISHMENT (自刑)', () => {
  it('辰午酉亥 self-punish', () => {
    expect(isSelfPunishment('辰')).toBe(true);
    expect(isSelfPunishment('午')).toBe(true);
    expect(isSelfPunishment('酉')).toBe(true);
    expect(isSelfPunishment('亥')).toBe(true);
  });

  it('others do not self-punish', () => {
    expect(isSelfPunishment('子')).toBe(false);
    expect(isSelfPunishment('寅')).toBe(false);
  });
});

describe('HARM_PAIRS (害)', () => {
  it('has 6 harm pairs', () => {
    expect(HARM_PAIRS).toHaveLength(6);
  });

  it('子未相害', () => {
    expect(isHarm('子', '未')).toBe(true);
    expect(isHarm('未', '子')).toBe(true);
  });

  it('rejects non-harm', () => {
    expect(isHarm('子', '丑')).toBe(false);
  });
});

describe('DESTRUCTION_PAIRS (破)', () => {
  it('has 6 destruction pairs', () => {
    expect(DESTRUCTION_PAIRS).toHaveLength(6);
  });

  it('子酉相破', () => {
    expect(isDestruction('子', '酉')).toBe(true);
    expect(isDestruction('酉', '子')).toBe(true);
  });

  it('rejects non-destruction', () => {
    expect(isDestruction('子', '丑')).toBe(false);
  });
});
