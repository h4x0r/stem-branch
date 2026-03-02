import { describe, it, expect } from 'vitest';
import { getDeityDirections, getDeityDirectionsForDate } from '../src/deity-directions';

describe('getDeityDirections', () => {
  it('should return four deity directions for 甲 day', () => {
    const result = getDeityDirections('甲');
    expect(result.wealth).toBe('東北');     // 財神
    expect(result.joy).toBe('東北');        // 喜神
    expect(result.fortune).toBe('東南');    // 福神
    expect(result.noble).toBeTruthy();      // 貴神
  });

  it('should return directions for 丙 day', () => {
    const result = getDeityDirections('丙');
    expect(result.wealth).toBe('西南');
    expect(result.joy).toBe('西南');
    expect(result.fortune).toBe('正東');
  });

  it('should cover all 10 stems', () => {
    const stems = '甲乙丙丁戊己庚辛壬癸'.split('') as any[];
    for (const stem of stems) {
      const result = getDeityDirections(stem);
      expect(result.wealth).toBeTruthy();
      expect(result.joy).toBeTruthy();
      expect(result.fortune).toBeTruthy();
      expect(result.noble).toBeTruthy();
    }
  });

  it('should only produce valid compass directions', () => {
    const valid = ['正東', '正西', '正南', '正北', '東北', '東南', '西北', '西南'];
    const stems = '甲乙丙丁戊己庚辛壬癸'.split('') as any[];
    for (const stem of stems) {
      const result = getDeityDirections(stem);
      expect(valid).toContain(result.wealth);
      expect(valid).toContain(result.joy);
      expect(valid).toContain(result.fortune);
      expect(valid).toContain(result.noble);
    }
  });
});

describe('getDeityDirectionsForDate', () => {
  it('should return directions for a date', () => {
    const result = getDeityDirectionsForDate(new Date(Date.UTC(2024, 5, 15, 6)));
    expect(result.wealth).toBeTruthy();
    expect(result.joy).toBeTruthy();
  });
});
