import { describe, it, expect } from 'vitest';
import { HIDDEN_HARMONY_PAIRS, isHiddenHarmony, getHiddenHarmonyPairs } from '../src/hidden-harmony';

describe('HIDDEN_HARMONY_PAIRS', () => {
  it('丑寅暗合 (己甲合)', () => {
    expect(isHiddenHarmony('丑', '寅')).toBe(true);
  });

  it('卯申暗合 (乙庚合)', () => {
    expect(isHiddenHarmony('卯', '申')).toBe(true);
  });

  it('午亥暗合 (丁壬合)', () => {
    expect(isHiddenHarmony('午', '亥')).toBe(true);
  });

  it('bidirectional', () => {
    expect(isHiddenHarmony('寅', '丑')).toBe(true);
    expect(isHiddenHarmony('申', '卯')).toBe(true);
  });

  it('non-hidden-harmony pair', () => {
    expect(isHiddenHarmony('子', '午')).toBe(false);
  });

  it('already-六合 pairs should not be hidden harmony', () => {
    // 子丑 is already 六合, not 暗合
    expect(isHiddenHarmony('子', '丑')).toBe(false);
  });
});

describe('getHiddenHarmonyPairs', () => {
  it('returns all computed pairs', () => {
    const pairs = getHiddenHarmonyPairs();
    expect(pairs.length).toBeGreaterThanOrEqual(3);
    // Each pair should have two branches and a combined element
    for (const p of pairs) {
      expect(p.branches).toHaveLength(2);
      expect(p.element).toBeDefined();
    }
  });
});
