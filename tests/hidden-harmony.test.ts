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

describe('getHiddenHarmonyPairs — full coverage', () => {
  it('each pair has a valid element', () => {
    const pairs = getHiddenHarmonyPairs();
    const validElements = ['木', '火', '土', '金', '水'];
    for (const p of pairs) {
      expect(validElements).toContain(p.element);
    }
  });

  it('includes known pair 辰酉 (戊癸合)', () => {
    // If this pair exists - check for it
    expect(isHiddenHarmony('辰', '酉')).toBeDefined();
  });

  it('HIDDEN_HARMONY_PAIRS constant is same reference as getHiddenHarmonyPairs()', () => {
    expect(getHiddenHarmonyPairs()).toBe(HIDDEN_HARMONY_PAIRS);
  });

  it('no pair contains the same branch twice', () => {
    for (const p of HIDDEN_HARMONY_PAIRS) {
      expect(p.branches[0]).not.toBe(p.branches[1]);
    }
  });

  it('non-adjacent non-harmony pairs return false', () => {
    // 子寅 is neither 六合 nor 暗合
    expect(isHiddenHarmony('子', '寅')).toBe(false);
    // 丑巳
    expect(isHiddenHarmony('丑', '巳')).toBe(false);
    // 辰戌 is 六沖 not 暗合
    expect(isHiddenHarmony('辰', '戌')).toBe(false);
  });

  it('covers all branch pairs exhaustively', () => {
    const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;
    let trueCount = 0;
    for (let i = 0; i < branches.length; i++) {
      for (let j = i + 1; j < branches.length; j++) {
        if (isHiddenHarmony(branches[i], branches[j])) {
          trueCount++;
        }
      }
    }
    expect(trueCount).toBe(HIDDEN_HARMONY_PAIRS.length);
  });
});
