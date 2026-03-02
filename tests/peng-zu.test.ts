import { describe, it, expect } from 'vitest';
import { getPengZuTaboo, getPengZuTabooForDate } from '../src/peng-zu';

describe('getPengZuTaboo', () => {
  it('should return stem and branch taboos for a stem-branch pair', () => {
    const result = getPengZuTaboo('甲', '子');
    expect(result.stem).toBe('甲不開倉財物耗散');
    expect(result.branch).toBe('子不問卜自惹禍殃');
  });

  it('should return correct taboo for 乙丑', () => {
    const result = getPengZuTaboo('乙', '丑');
    expect(result.stem).toBe('乙不栽植千株不長');
    expect(result.branch).toBe('丑不冠帶主不還鄉');
  });

  it('should return correct taboo for 壬午', () => {
    const result = getPengZuTaboo('壬', '午');
    expect(result.stem).toBe('壬不汲水更難提防');
    expect(result.branch).toBe('午不苫蓋屋主更張');
  });

  it('should cover all 10 stems', () => {
    const stems = '甲乙丙丁戊己庚辛壬癸'.split('') as any[];
    for (const stem of stems) {
      const result = getPengZuTaboo(stem, '子');
      expect(result.stem).toBeTruthy();
      expect(result.stem).toContain(stem);
    }
  });

  it('should cover all 12 branches', () => {
    const branches = '子丑寅卯辰巳午未申酉戌亥'.split('') as any[];
    for (const branch of branches) {
      const result = getPengZuTaboo('甲', branch);
      expect(result.branch).toBeTruthy();
      expect(result.branch).toContain(branch);
    }
  });
});

describe('getPengZuTabooForDate', () => {
  it('should return taboos for a date', () => {
    const result = getPengZuTabooForDate(new Date(Date.UTC(2024, 5, 15, 6)));
    expect(result.stem).toBeTruthy();
    expect(result.branch).toBeTruthy();
  });
});
