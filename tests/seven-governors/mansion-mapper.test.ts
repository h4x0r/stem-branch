import { describe, it, expect } from 'vitest';
import { MANSION_BOUNDARIES } from '../../src/seven-governors/data/mansion-boundaries';
import { getMansionForLongitude } from '../../src/seven-governors';

describe('mansion boundary data', () => {
  it('has exactly 28 entries', () => {
    expect(MANSION_BOUNDARIES).toHaveLength(28);
  });

  it('starts with 角 at 0°', () => {
    expect(MANSION_BOUNDARIES[0].name).toBe('角');
    expect(MANSION_BOUNDARIES[0].startDeg).toBe(0);
  });

  it('is sorted by ascending startDeg', () => {
    for (let i = 1; i < MANSION_BOUNDARIES.length; i++) {
      expect(
        MANSION_BOUNDARIES[i].startDeg,
        `${MANSION_BOUNDARIES[i].name} should be after ${MANSION_BOUNDARIES[i - 1].name}`,
      ).toBeGreaterThan(MANSION_BOUNDARIES[i - 1].startDeg);
    }
  });

  it('all boundaries are in [0, 360)', () => {
    for (const m of MANSION_BOUNDARIES) {
      expect(m.startDeg).toBeGreaterThanOrEqual(0);
      expect(m.startDeg).toBeLessThan(360);
    }
  });

  it('has unique mansion names', () => {
    const names = MANSION_BOUNDARIES.map(m => m.name);
    expect(new Set(names).size).toBe(28);
  });

  it('every entry has a Hipparcos ID', () => {
    for (const m of MANSION_BOUNDARIES) {
      expect(m.hip).toBeGreaterThan(0);
    }
  });
});

describe('getMansionForLongitude', () => {
  it('0° → 角', () => {
    const result = getMansionForLongitude(0);
    expect(result.name).toBe('角');
    expect(result.degree).toBeCloseTo(0, 6);
  });

  it('6° → 角 (middle)', () => {
    const result = getMansionForLongitude(6);
    expect(result.name).toBe('角');
    expect(result.degree).toBeCloseTo(6, 6);
  });

  it('12° → 亢', () => {
    const result = getMansionForLongitude(12);
    expect(result.name).toBe('亢');
    expect(result.degree).toBeCloseTo(0, 6);
  });

  it('359° → 軫', () => {
    const result = getMansionForLongitude(359);
    expect(result.name).toBe('軫');
    expect(result.degree).toBeCloseTo(9, 0);
  });

  it('100° → 牛 (starts at 99.5°)', () => {
    const result = getMansionForLongitude(100);
    expect(result.name).toBe('牛');
    expect(result.degree).toBeCloseTo(0.5, 1);
  });

  it('-5° normalizes to 355°', () => {
    const neg = getMansionForLongitude(-5);
    const pos = getMansionForLongitude(355);
    expect(neg.name).toBe(pos.name);
    expect(neg.degree).toBeCloseTo(pos.degree, 6);
    expect(neg.index).toBe(pos.index);
  });

  it('-180° normalizes to 180°', () => {
    const neg = getMansionForLongitude(-180);
    const pos = getMansionForLongitude(180);
    expect(neg.name).toBe(pos.name);
    expect(neg.degree).toBeCloseTo(pos.degree, 6);
    expect(neg.index).toBe(pos.index);
  });

  it('361° normalizes to 1°', () => {
    const over = getMansionForLongitude(361);
    const norm = getMansionForLongitude(1);
    expect(over.name).toBe(norm.name);
    expect(over.degree).toBeCloseTo(norm.degree, 6);
    expect(over.index).toBe(norm.index);
  });
});
