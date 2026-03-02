import { describe, it, expect } from 'vitest';
import { getFetalDeity, getFetalDeityForDate } from '../src/fetal-deity';

describe('getFetalDeity', () => {
  it('should return position for 甲子 day (cycle index 0)', () => {
    expect(getFetalDeity('甲', '子')).toBe('占門碓外東南');
  });

  it('should return position for 乙丑 day (cycle index 1)', () => {
    expect(getFetalDeity('乙', '丑')).toBe('碓磨廁外東南');
  });

  it('should return position for 甲戌 day (cycle index 10)', () => {
    expect(getFetalDeity('甲', '戌')).toBe('占門爐外西南');
  });

  it('should cover all 60 cycle positions', () => {
    // Spot check a few more known values
    expect(getFetalDeity('丙', '寅')).toBe('廚灶碓外正南');
    expect(getFetalDeity('壬', '申')).toBe('倉庫爐外正北');
  });

  it('should return non-empty string for valid pairs', () => {
    const stems = '甲乙丙丁戊己庚辛壬癸'.split('');
    const branches = '子丑寅卯辰巳午未申酉戌亥'.split('');
    // Only valid sexagenary pairs (same parity)
    for (let i = 0; i < 60; i++) {
      const s = stems[i % 10] as any;
      const b = branches[i % 12] as any;
      const result = getFetalDeity(s, b);
      expect(result).toBeTruthy();
    }
  });
});

describe('getFetalDeityForDate', () => {
  it('should return a position for a given date', () => {
    const result = getFetalDeityForDate(new Date(Date.UTC(2024, 5, 15, 6)));
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(2);
  });
});
