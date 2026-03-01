import { describe, it, expect } from 'vitest';
import { HIDDEN_STEMS, getHiddenStems } from '../src/hidden-stems';

describe('HIDDEN_STEMS', () => {
  it('maps all 12 branches', () => {
    expect(Object.keys(HIDDEN_STEMS)).toHaveLength(12);
  });

  it('子 contains only 癸', () => {
    expect(HIDDEN_STEMS['子']).toEqual([{ stem: '癸', proportion: 1 }]);
  });

  it('丑 contains 己癸辛 (main, middle, residual)', () => {
    const hidden = HIDDEN_STEMS['丑'];
    expect(hidden).toHaveLength(3);
    expect(hidden[0].stem).toBe('己');
    expect(hidden[1].stem).toBe('癸');
    expect(hidden[2].stem).toBe('辛');
  });

  it('寅 contains 甲丙戊', () => {
    const hidden = HIDDEN_STEMS['寅'];
    expect(hidden).toHaveLength(3);
    expect(hidden[0].stem).toBe('甲');
    expect(hidden[1].stem).toBe('丙');
    expect(hidden[2].stem).toBe('戊');
  });

  it('卯 contains only 乙', () => {
    expect(HIDDEN_STEMS['卯']).toEqual([{ stem: '乙', proportion: 1 }]);
  });

  it('酉 contains only 辛', () => {
    expect(HIDDEN_STEMS['酉']).toEqual([{ stem: '辛', proportion: 1 }]);
  });
});

describe('getHiddenStems', () => {
  it('returns stems for a branch', () => {
    const stems = getHiddenStems('申');
    expect(stems.map(s => s.stem)).toEqual(['庚', '壬', '戊']);
  });

  it('main stem is always first', () => {
    for (const branch of ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'] as const) {
      const stems = getHiddenStems(branch);
      expect(stems.length).toBeGreaterThanOrEqual(1);
      // First stem is the main (本氣)
      expect(stems[0].proportion).toBeGreaterThanOrEqual(0.5);
    }
  });
});
