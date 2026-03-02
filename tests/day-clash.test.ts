import { describe, it, expect } from 'vitest';
import { getDayClash, getDayClashForDate } from '../src/day-clash';

describe('getDayClash', () => {
  it('should return clash branch, animal, and direction for 子 day', () => {
    const result = getDayClash('子');
    expect(result.clashBranch).toBe('午');
    expect(result.clashAnimal).toBe('馬');
    expect(result.direction).toBe('南');
  });

  it('should return clash for 午 day', () => {
    const result = getDayClash('午');
    expect(result.clashBranch).toBe('子');
    expect(result.clashAnimal).toBe('鼠');
    expect(result.direction).toBe('北');
  });

  it('should return clash for 卯 day', () => {
    const result = getDayClash('卯');
    expect(result.clashBranch).toBe('酉');
    expect(result.clashAnimal).toBe('雞');
    expect(result.direction).toBe('西');
  });

  it('should format as traditional string', () => {
    const result = getDayClash('子');
    expect(result.display).toBe('沖馬煞南');
  });

  it('should work for all 12 branches', () => {
    const branches = '子丑寅卯辰巳午未申酉戌亥'.split('') as any[];
    const seen = new Set<string>();
    for (const branch of branches) {
      const result = getDayClash(branch);
      expect(result.clashBranch).toBeTruthy();
      expect(result.clashAnimal).toBeTruthy();
      expect(result.direction).toBeTruthy();
      expect(result.display).toContain('沖');
      expect(result.display).toContain('煞');
      seen.add(result.clashBranch);
    }
    expect(seen.size).toBe(12);
  });
});

describe('getDayClashForDate', () => {
  it('should return clash info for a date', () => {
    const result = getDayClashForDate(new Date(Date.UTC(2024, 5, 15, 6)));
    expect(result.clashBranch).toBeTruthy();
    expect(result.display).toContain('沖');
  });
});
