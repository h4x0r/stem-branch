import { describe, it, expect } from 'vitest';
import { getTenRelation, getTenRelationForBranch, TEN_RELATION_NAMES } from '../src/ten-relations';

describe('TEN_RELATION_NAMES', () => {
  it('has 10 relations', () => {
    expect(TEN_RELATION_NAMES).toHaveLength(10);
  });
});

describe('getTenRelation', () => {
  // Day stem 甲(木陽)
  it('甲 vs 甲 -> 比肩 (same element, same polarity)', () => {
    expect(getTenRelation('甲', '甲')).toBe('比肩');
  });

  it('甲 vs 乙 -> 劫財 (same element, diff polarity)', () => {
    expect(getTenRelation('甲', '乙')).toBe('劫財');
  });

  it('甲 vs 丙 -> 食神 (I generate, same polarity)', () => {
    expect(getTenRelation('甲', '丙')).toBe('食神');
  });

  it('甲 vs 丁 -> 傷官 (I generate, diff polarity)', () => {
    expect(getTenRelation('甲', '丁')).toBe('傷官');
  });

  it('甲 vs 戊 -> 偏財 (I conquer, same polarity)', () => {
    expect(getTenRelation('甲', '戊')).toBe('偏財');
  });

  it('甲 vs 己 -> 正財 (I conquer, diff polarity)', () => {
    expect(getTenRelation('甲', '己')).toBe('正財');
  });

  it('甲 vs 庚 -> 七殺 (conquers me, same polarity)', () => {
    expect(getTenRelation('甲', '庚')).toBe('七殺');
  });

  it('甲 vs 辛 -> 正官 (conquers me, diff polarity)', () => {
    expect(getTenRelation('甲', '辛')).toBe('正官');
  });

  it('甲 vs 壬 -> 偏印 (generates me, same polarity)', () => {
    expect(getTenRelation('甲', '壬')).toBe('偏印');
  });

  it('甲 vs 癸 -> 正印 (generates me, diff polarity)', () => {
    expect(getTenRelation('甲', '癸')).toBe('正印');
  });

  // Additional: verify from 丁(火陰) perspective
  it('丁 vs 甲 -> 正印 (木生火, diff polarity)', () => {
    expect(getTenRelation('丁', '甲')).toBe('正印');
  });

  it('丁 vs 庚 -> 正財 (火剋金, diff polarity)', () => {
    expect(getTenRelation('丁', '庚')).toBe('正財');
  });

  it('丁 vs 壬 -> 正官 (水剋火, diff polarity)', () => {
    expect(getTenRelation('丁', '壬')).toBe('正官');
  });
});

describe('getTenRelationForBranch', () => {
  it('甲 day stem + 子 branch -> 正印 (子 main stem = 癸水, 水生木, diff polarity)', () => {
    expect(getTenRelationForBranch('甲', '子')).toBe('正印');
  });

  it('甲 day stem + 午 branch -> 傷官 (午 main stem = 丁火, 木生火, diff polarity)', () => {
    expect(getTenRelationForBranch('甲', '午')).toBe('傷官');
  });
});
