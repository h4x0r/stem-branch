import { describe, it, expect } from 'vitest';
import { PALACE_BOUNDARIES } from '../../src/seven-governors/data/palace-boundaries';
import { getPalaceForLongitude } from '../../src/seven-governors/palace-mapper';

describe('palace boundary data', () => {
  it('has exactly 12 entries', () => {
    expect(PALACE_BOUNDARIES).toHaveLength(12);
  });

  it('covers full 360° without gaps', () => {
    for (let i = 0; i < PALACE_BOUNDARIES.length; i++) {
      expect(PALACE_BOUNDARIES[i].startDeg).toBe(i * 30);
      expect(PALACE_BOUNDARIES[i].endDeg).toBe((i + 1) * 30);
    }
  });

  it('has unique palace names', () => {
    const names = PALACE_BOUNDARIES.map(p => p.name);
    expect(new Set(names).size).toBe(12);
  });
});

describe('getPalaceForLongitude', () => {
  it('0° → 辰宮', () => {
    expect(getPalaceForLongitude(0).name).toBe('辰宮');
  });

  it('15° → 辰宮, degree 15', () => {
    const r = getPalaceForLongitude(15);
    expect(r.name).toBe('辰宮');
    expect(r.degree).toBeCloseTo(15, 6);
  });

  it('30° → 卯宮', () => {
    expect(getPalaceForLongitude(30).name).toBe('卯宮');
  });

  it('120° → 子宮', () => {
    expect(getPalaceForLongitude(120).name).toBe('子宮');
  });

  it('350° → 巳宮', () => {
    const r = getPalaceForLongitude(350);
    expect(r.name).toBe('巳宮');
    expect(r.degree).toBeCloseTo(20, 6);
  });

  it('handles values near 360°', () => {
    expect(getPalaceForLongitude(359.99).name).toBe('巳宮');
  });
});
