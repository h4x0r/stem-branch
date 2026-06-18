import { describe, it, expect } from 'vitest';
import {
  NINE_STARS, EIGHT_DOORS, EIGHT_DEITIES,
  SAN_QI_LIU_YI,
  getEscapeMode, getJuShu,
  buildEarthPlate, buildHeavenPlate,
  computeQiMen, computeQiMenForDate,
} from '../src/mystery-gates';
import type { QiMenChart } from '../src/mystery-gates';

// ── Constants ─────────────────────────────────────────────────

describe('constants', () => {
  it('should have 9 stars', () => {
    expect(NINE_STARS).toHaveLength(9);
    expect(NINE_STARS[0]).toBe('天蓬');
    expect(NINE_STARS[8]).toBe('天英');
  });

  it('should have 8 doors', () => {
    expect(EIGHT_DOORS).toHaveLength(8);
    expect(EIGHT_DOORS[0]).toBe('休');
    expect(EIGHT_DOORS[7]).toBe('開');
  });

  it('should have 8 deities', () => {
    expect(EIGHT_DEITIES).toHaveLength(8);
    expect(EIGHT_DEITIES[0]).toBe('值符');
  });

  it('should have 9 elements in 三奇六儀', () => {
    expect(SAN_QI_LIU_YI).toHaveLength(9);
    // Order: 戊己庚辛壬癸丁丙乙 (六儀 first, then 三奇 reversed)
    expect(SAN_QI_LIU_YI[0]).toBe('戊');
    expect(SAN_QI_LIU_YI[6]).toBe('丁');
    expect(SAN_QI_LIU_YI[7]).toBe('丙');
    expect(SAN_QI_LIU_YI[8]).toBe('乙');
  });
});

// ── Escape mode ───────────────────────────────────────────────

describe('getEscapeMode', () => {
  it('should return 陽遁 for dates after winter solstice', () => {
    // 2024-01-15 is after winter solstice 2023 and before summer solstice 2024
    expect(getEscapeMode(new Date(Date.UTC(2024, 0, 15, 6)))).toBe('陽遁');
  });

  it('should return 陰遁 for dates after summer solstice', () => {
    // 2024-07-15 is after summer solstice 2024
    expect(getEscapeMode(new Date(Date.UTC(2024, 6, 15, 6)))).toBe('陰遁');
  });
});

// ── 局數 (Pattern Number) ────────────────────────────────────

describe('getJuShu', () => {
  it('should return a number 1-9', () => {
    const result = getJuShu(new Date(Date.UTC(2024, 5, 15, 6)));
    expect(result).toBeGreaterThanOrEqual(1);
    expect(result).toBeLessThanOrEqual(9);
  });
});

// ── Earth plate ───────────────────────────────────────────────

describe('buildEarthPlate', () => {
  it('should place 9 elements across 9 palaces for 陽遁 局1', () => {
    const plate = buildEarthPlate(1, '陽遁');
    // 陽遁局1: 戊 starts at palace 1 (坎), then follows Lo Shu order
    expect(plate[1]).toBe('戊'); // 坎宮
    expect(plate[8]).toBe('己'); // 艮宮 (next in Lo Shu: 1→8)
    expect(plate[3]).toBe('庚'); // 震宮 (1→8→3)
  });

  it('should place elements correctly for 陰遁 局9', () => {
    const plate = buildEarthPlate(9, '陰遁');
    // 陰遁局9: 戊 starts at palace 9 (離), then REVERSE Lo Shu order
    expect(plate[9]).toBe('戊');
  });
});

// ── Heaven plate ──────────────────────────────────────────────

describe('buildHeavenPlate', () => {
  it('should rotate earth plate based on hour', () => {
    const earthPlate = buildEarthPlate(1, '陽遁');
    const heavenPlate = buildHeavenPlate(earthPlate, '子', 1, '陽遁');
    // Heaven plate should have same 9 elements in different positions
    const earthVals = Object.values(earthPlate).sort();
    const heavenVals = Object.values(heavenPlate).sort();
    expect(heavenVals).toEqual(earthVals);
  });
});

// ── Full chart ────────────────────────────────────────────────

describe('computeQiMenForDate', () => {
  it('should return a complete chart', () => {
    const chart = computeQiMenForDate(new Date(Date.UTC(2024, 5, 15, 6)));
    expect(chart).toBeDefined();
    expect(chart.escapeMode).toMatch(/^[陽陰]遁$/);
    expect(chart.juShu).toBeGreaterThanOrEqual(1);
    expect(chart.juShu).toBeLessThanOrEqual(9);
  });

  it('should have earth and heaven plates with 9 palaces each', () => {
    const chart = computeQiMenForDate(new Date(Date.UTC(2024, 5, 15, 6)));
    // Palaces 1-9 (palace 5 is center)
    for (let i = 1; i <= 9; i++) {
      expect(chart.earthPlate[i]).toBeTruthy();
      expect(chart.heavenPlate[i]).toBeTruthy();
    }
  });

  it('should distribute stars across palaces', () => {
    const chart = computeQiMenForDate(new Date(Date.UTC(2024, 5, 15, 6)));
    const starValues = Object.values(chart.stars);
    expect(starValues.length).toBeGreaterThanOrEqual(8); // 8 movable + center
    for (const star of starValues) {
      expect(NINE_STARS).toContain(star);
    }
  });

  it('should distribute doors across palaces', () => {
    const chart = computeQiMenForDate(new Date(Date.UTC(2024, 5, 15, 6)));
    const doorValues = Object.values(chart.doors);
    expect(doorValues.length).toBeGreaterThanOrEqual(8);
    for (const door of doorValues) {
      expect(EIGHT_DOORS).toContain(door);
    }
  });

  it('should distribute deities across palaces', () => {
    const chart = computeQiMenForDate(new Date(Date.UTC(2024, 5, 15, 6)));
    const deityValues = Object.values(chart.deities);
    expect(deityValues.length).toBeGreaterThanOrEqual(8);
    for (const deity of deityValues) {
      expect(EIGHT_DEITIES).toContain(deity);
    }
  });

  it('should identify 值符 and 值使', () => {
    const chart = computeQiMenForDate(new Date(Date.UTC(2024, 5, 15, 6)));
    expect(chart.zhiFu.star).toBeTruthy();
    expect(chart.zhiFu.palace).toBeGreaterThanOrEqual(1);
    expect(chart.zhiFu.palace).toBeLessThanOrEqual(9);
    expect(chart.zhiShi.door).toBeTruthy();
    expect(chart.zhiShi.palace).toBeGreaterThanOrEqual(1);
    expect(chart.zhiShi.palace).toBeLessThanOrEqual(9);
  });

  it('should produce different charts for different hours', () => {
    const a = computeQiMenForDate(new Date(Date.UTC(2024, 5, 15, 1))); // 寅 hour CST
    const b = computeQiMenForDate(new Date(Date.UTC(2024, 5, 15, 6))); // 午 hour CST
    // Different hours should give different heaven plates
    expect(JSON.stringify(a.heavenPlate)).not.toBe(JSON.stringify(b.heavenPlate));
  });
});

describe('getJuShu — 中氣 boundary', () => {
  it('returns a valid 局數 for a date on 春分 (中氣)', () => {
    // 春分 2024 ≈ March 20. A date shortly after is still in YANG_TERM_NAMES.
    const result = getJuShu(new Date(Date.UTC(2024, 2, 22, 6)));
    expect(result).toBeGreaterThanOrEqual(1);
    expect(result).toBeLessThanOrEqual(9);
  });

  it('returns a valid 局數 for a date between 春分 and 清明', () => {
    // ~March 25 is after 春分 (~Mar 20) and before 清明 (~Apr 4)
    const result = getJuShu(new Date(Date.UTC(2024, 2, 25, 10)));
    expect(result).toBeGreaterThanOrEqual(1);
    expect(result).toBeLessThanOrEqual(9);
  });

  it('returns a valid 局數 for a date on 秋分 (陰遁 中氣)', () => {
    // 秋分 2024 ≈ Sep 22
    const result = getJuShu(new Date(Date.UTC(2024, 8, 23, 6)));
    expect(result).toBeGreaterThanOrEqual(1);
    expect(result).toBeLessThanOrEqual(9);
  });
});

describe('computeQiMenForDate — 陰遁 (yin escape)', () => {
  it('should produce a chart with 陰遁 escape mode for a date after summer solstice', () => {
    // 2024-09-15 is well after summer solstice (~Jun 21) and before winter solstice (~Dec 21)
    const chart = computeQiMenForDate(new Date('2024-09-15T10:00:00+08:00'));
    expect(chart.escapeMode).toBe('陰遁');
    expect(chart.juShu).toBeGreaterThanOrEqual(1);
    expect(chart.juShu).toBeLessThanOrEqual(9);
    // Verify plates, stars, doors, and deities are populated
    for (let i = 1; i <= 9; i++) {
      expect(chart.earthPlate[i]).toBeTruthy();
      expect(chart.heavenPlate[i]).toBeTruthy();
    }
    const starValues = Object.values(chart.stars);
    expect(starValues.length).toBeGreaterThanOrEqual(8);
    const doorValues = Object.values(chart.doors);
    expect(doorValues.length).toBeGreaterThanOrEqual(8);
    const deityValues = Object.values(chart.deities);
    expect(deityValues.length).toBeGreaterThanOrEqual(8);
    // 陰遁 uses different deity set (勾陳/朱雀 instead of 白虎/玄武)
    const allDeities = deityValues.join(',');
    // It should have 值符 (always present)
    expect(allDeities).toContain('值符');
  });
});

describe('computeQiMen — palace 5 guards', () => {
  it('should handle juShu === 5 (center palace borrows to 2)', () => {
    // juShu 5 exercises the "=== 5 ? 2 : x" guards on lines 318, 386, 394
    const earthPlate = buildEarthPlate(5, '陽遁');
    expect(earthPlate[5]).toBeTruthy();

    const chart = computeQiMen('甲', '子', 5, '陽遁');
    expect(chart.juShu).toBe(5);
    expect(chart.zhiFu.star).toBeTruthy();
    expect(chart.zhiShi.door).toBeTruthy();
  });

  it('should handle juShu === 5 with 陰遁', () => {
    const chart = computeQiMen('甲', '子', 5, '陰遁');
    expect(chart.escapeMode).toBe('陰遁');
    expect(chart.juShu).toBe(5);
    expect(chart.zhiFu.star).toBeTruthy();
    expect(chart.zhiShi.door).toBeTruthy();
  });

  it('should handle hourBranch 辰 (targetPalace === 5) with 陽遁', () => {
    // 辰 maps to palace 5 in BRANCH_TO_PALACE, exercising targetPalace === 5 ? 2 : targetPalace
    const earthPlate = buildEarthPlate(1, '陽遁');
    const heavenPlate = buildHeavenPlate(earthPlate, '辰', 1, '陽遁');
    const earthVals = Object.values(earthPlate).sort();
    const heavenVals = Object.values(heavenPlate).sort();
    expect(heavenVals).toEqual(earthVals);
  });

  it('should handle hourBranch 戌 (targetPalace === 5) with 陰遁', () => {
    // 戌 also maps to palace 5
    const earthPlate = buildEarthPlate(3, '陰遁');
    const heavenPlate = buildHeavenPlate(earthPlate, '戌', 3, '陰遁');
    const earthVals = Object.values(earthPlate).sort();
    const heavenVals = Object.values(heavenPlate).sort();
    expect(heavenVals).toEqual(earthVals);
  });

  it('should handle combined juShu === 5 AND targetPalace === 5', () => {
    // Both guards triggered simultaneously
    const chart = computeQiMen('甲', '辰', 5, '陽遁');
    expect(chart.juShu).toBe(5);
    expect(chart.zhiFu.star).toBeTruthy();

    const chart2 = computeQiMen('甲', '戌', 5, '陰遁');
    expect(chart2.escapeMode).toBe('陰遁');
    expect(chart2.zhiFu.star).toBeTruthy();
  });
});

describe('getEscapeMode — winter branch', () => {
  it('returns 陽遁 for dates in January (after winter solstice)', () => {
    // January 15 is after winter solstice (~Dec 21) → 陽遁
    const mode = getEscapeMode(new Date('2024-01-15T10:00:00Z'));
    expect(mode).toBe('陽遁');
  });

  it('returns 陰遁 for dates in October (before winter solstice, after summer)', () => {
    const mode = getEscapeMode(new Date('2024-10-15T10:00:00Z'));
    expect(mode).toBe('陰遁');
  });

  it('returns 陽遁 for dates after winter solstice in December', () => {
    const mode = getEscapeMode(new Date('2024-12-25T10:00:00Z'));
    expect(mode).toBe('陽遁');
  });
});
