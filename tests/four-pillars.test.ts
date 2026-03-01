import { describe, it, expect } from 'vitest';
import { computeFourPillars } from '../src/four-pillars';

describe('computeFourPillars', () => {
  it('computes 2024-06-15 12:00 correctly', () => {
    const p = computeFourPillars(new Date(2024, 5, 15, 12, 0));
    expect(p.year.stem).toBe('甲');
    expect(p.year.branch).toBe('辰');
    expect(p.day.stem).toBeDefined();
    expect(p.day.branch).toBeDefined();
    expect(p.hour.branch).toBe('午'); // 12:00 = 午時
  });

  it('computes known date: 2000-01-07 = 甲子日', () => {
    const p = computeFourPillars(new Date(2000, 0, 7, 12, 0));
    expect(p.day.stem).toBe('甲');
    expect(p.day.branch).toBe('子');
  });

  it('day pillar advances by 1 each day', () => {
    const p1 = computeFourPillars(new Date(2000, 0, 7, 12, 0)); // 甲子
    const p2 = computeFourPillars(new Date(2000, 0, 8, 12, 0)); // 乙丑
    expect(p1.day.stem).toBe('甲');
    expect(p1.day.branch).toBe('子');
    expect(p2.day.stem).toBe('乙');
    expect(p2.day.branch).toBe('丑');
  });

  it('month stem follows 甲己之年丙作首 rule', () => {
    const p = computeFourPillars(new Date(2024, 2, 1, 12, 0));
    expect(p.month.stem).toBe('丙');
    expect(p.month.branch).toBe('寅');
  });

  it('year boundary — before 立春', () => {
    const p = computeFourPillars(new Date(2024, 0, 15, 12, 0));
    expect(p.year.stem).toBe('癸');
    expect(p.year.branch).toBe('卯');
  });

  it('year boundary — after 立春', () => {
    const p = computeFourPillars(new Date(2024, 1, 5, 12, 0));
    expect(p.year.stem).toBe('甲');
    expect(p.year.branch).toBe('辰');
  });

  it('handles 子時 at 23:00', () => {
    const p = computeFourPillars(new Date(2024, 5, 15, 23, 30));
    expect(p.hour.branch).toBe('子');
  });

  it('handles 子時 at 00:30', () => {
    const p = computeFourPillars(new Date(2024, 5, 15, 0, 30));
    expect(p.hour.branch).toBe('子');
  });

  it('handles various hour branches', () => {
    expect(computeFourPillars(new Date(2024, 5, 15, 1, 0)).hour.branch).toBe('丑');
    expect(computeFourPillars(new Date(2024, 5, 15, 5, 0)).hour.branch).toBe('卯');
    expect(computeFourPillars(new Date(2024, 5, 15, 17, 0)).hour.branch).toBe('酉');
    expect(computeFourPillars(new Date(2024, 5, 15, 22, 0)).hour.branch).toBe('亥');
  });

  describe('reference dates', () => {
    it('2024-02-10 (甲辰年 丙寅月)', () => {
      const p = computeFourPillars(new Date(2024, 1, 10, 12, 0));
      expect(p.year.stem).toBe('甲');
      expect(p.year.branch).toBe('辰');
      expect(p.month.stem).toBe('丙');
      expect(p.month.branch).toBe('寅');
    });

    it('1984-01-01 — before 立春 so still 癸亥年', () => {
      const p = computeFourPillars(new Date(1984, 0, 1, 12, 0));
      expect(p.year.stem).toBe('癸');
      expect(p.year.branch).toBe('亥');
    });

    it('2000-02-05 — after 立春 so 庚辰年', () => {
      const p = computeFourPillars(new Date(2000, 1, 5, 12, 0));
      expect(p.year.stem).toBe('庚');
      expect(p.year.branch).toBe('辰');
    });
  });
});
