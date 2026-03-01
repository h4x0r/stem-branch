import { describe, it, expect } from 'vitest';
import { TWELVE_STAGES, getLifeStage } from '../src/twelve-stages';

describe('TWELVE_STAGES', () => {
  it('has 12 stages', () => {
    expect(TWELVE_STAGES).toHaveLength(12);
  });

  it('starts with 長生', () => {
    expect(TWELVE_STAGES[0]).toBe('長生');
  });

  it('contains all stages in order', () => {
    expect(TWELVE_STAGES).toEqual([
      '長生', '沐浴', '冠帶', '臨官', '帝旺', '衰',
      '病', '死', '墓', '絕', '胎', '養',
    ]);
  });
});

describe('getLifeStage', () => {
  // 甲木 starts 長生 at 亥 (branch index 11)
  it('甲 at 亥 -> 長生', () => {
    expect(getLifeStage('甲', '亥')).toBe('長生');
  });

  it('甲 at 子 -> 沐浴', () => {
    expect(getLifeStage('甲', '子')).toBe('沐浴');
  });

  it('甲 at 丑 -> 冠帶', () => {
    expect(getLifeStage('甲', '丑')).toBe('冠帶');
  });

  it('甲 at 寅 -> 臨官', () => {
    expect(getLifeStage('甲', '寅')).toBe('臨官');
  });

  it('甲 at 卯 -> 帝旺', () => {
    expect(getLifeStage('甲', '卯')).toBe('帝旺');
  });

  it('甲 at 午 -> 死', () => {
    expect(getLifeStage('甲', '午')).toBe('死');
  });

  it('甲 at 未 -> 墓', () => {
    expect(getLifeStage('甲', '未')).toBe('墓');
  });

  // Yin stems go counter-clockwise
  it('乙 at 午 -> 長生', () => {
    expect(getLifeStage('乙', '午')).toBe('長生');
  });

  it('乙 at 巳 -> 沐浴', () => {
    expect(getLifeStage('乙', '巳')).toBe('沐浴');
  });

  // 丙火 starts 長生 at 寅
  it('丙 at 寅 -> 長生', () => {
    expect(getLifeStage('丙', '寅')).toBe('長生');
  });

  // 庚金 starts 長生 at 巳
  it('庚 at 巳 -> 長生', () => {
    expect(getLifeStage('庚', '巳')).toBe('長生');
  });

  // 壬水 starts 長生 at 申
  it('壬 at 申 -> 長生', () => {
    expect(getLifeStage('壬', '申')).toBe('長生');
  });

  // 辛金 (yin) starts 長生 at 子
  it('辛 at 子 -> 長生', () => {
    expect(getLifeStage('辛', '子')).toBe('長生');
  });

  // 癸水 (yin) starts 長生 at 卯
  it('癸 at 卯 -> 長生', () => {
    expect(getLifeStage('癸', '卯')).toBe('長生');
  });
});
