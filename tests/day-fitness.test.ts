import { describe, it, expect } from 'vitest';
import { getDayFitness, getDayFitnessForDate, DAY_FITNESS_CYCLE } from '../src/day-fitness';

describe('DAY_FITNESS_CYCLE', () => {
  it('has exactly 12 values', () => {
    expect(DAY_FITNESS_CYCLE).toHaveLength(12);
  });

  it('starts with 建 and ends with 閉', () => {
    expect(DAY_FITNESS_CYCLE[0]).toBe('建');
    expect(DAY_FITNESS_CYCLE[11]).toBe('閉');
  });
});

describe('getDayFitness', () => {
  it('day branch matching month branch is 建', () => {
    // In 寅月, 寅日 = 建
    expect(getDayFitness('寅', '寅')).toBe('建');
    // In 卯月, 卯日 = 建
    expect(getDayFitness('卯', '卯')).toBe('建');
    // In 子月, 子日 = 建
    expect(getDayFitness('子', '子')).toBe('建');
  });

  it('cycles forward from 建', () => {
    // In 寅月: 卯日=除, 辰日=滿, 巳日=平, ...
    expect(getDayFitness('卯', '寅')).toBe('除');
    expect(getDayFitness('辰', '寅')).toBe('滿');
    expect(getDayFitness('巳', '寅')).toBe('平');
    expect(getDayFitness('午', '寅')).toBe('定');
    expect(getDayFitness('未', '寅')).toBe('執');
    expect(getDayFitness('申', '寅')).toBe('破');
    expect(getDayFitness('酉', '寅')).toBe('危');
    expect(getDayFitness('戌', '寅')).toBe('成');
    expect(getDayFitness('亥', '寅')).toBe('收');
    expect(getDayFitness('子', '寅')).toBe('開');
    expect(getDayFitness('丑', '寅')).toBe('閉');
  });

  it('works for other months', () => {
    // In 酉月: 酉日=建, 戌日=除, 亥日=滿
    expect(getDayFitness('酉', '酉')).toBe('建');
    expect(getDayFitness('戌', '酉')).toBe('除');
    expect(getDayFitness('亥', '酉')).toBe('滿');
    // In 酉月: 申日=閉 (one before 建)
    expect(getDayFitness('申', '酉')).toBe('閉');
  });
});

describe('getDayFitnessForDate', () => {
  it('returns fitness and auspicious flag for a date', { timeout: 30_000 }, () => {
    const result = getDayFitnessForDate(new Date(2024, 1, 10));
    expect(result.fitness).toBeDefined();
    expect(typeof result.auspicious).toBe('boolean');
    expect(DAY_FITNESS_CYCLE).toContain(result.fitness);
  });

  it('returns different fitness for consecutive days', { timeout: 30_000 }, () => {
    const day1 = getDayFitnessForDate(new Date(2024, 5, 15));
    const day2 = getDayFitnessForDate(new Date(2024, 5, 16));
    expect(day1.fitness).not.toBe(day2.fitness);
  });

  it('all 12 values appear in a 12-day span within one solar month', { timeout: 30_000 }, () => {
    // Use June 10-21 2024 (safely within 午月, 芒種 is ~June 5)
    const values = new Set<string>();
    for (let d = 10; d <= 21; d++) {
      const result = getDayFitnessForDate(new Date(2024, 5, d));
      values.add(result.fitness);
    }
    expect(values.size).toBe(12);
  });
});
