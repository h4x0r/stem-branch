import { describe, it, expect } from 'vitest';
import {
  getLuckDirection, computeMajorLuck, computeMinorLuck,
} from '../src/luck-pillars';
import { stemBranchCycleIndex } from '../src/stem-branch';
import { computeFourPillars } from '../src/four-pillars';
import type { Stem, Branch } from '../src/types';

// ── Direction ──────────────────────────────────────────────────

describe('getLuckDirection', () => {
  it('yang stem + male → forward (順行)', () => {
    expect(getLuckDirection('甲', 'male')).toBe('forward');
    expect(getLuckDirection('丙', 'male')).toBe('forward');
    expect(getLuckDirection('戊', 'male')).toBe('forward');
    expect(getLuckDirection('庚', 'male')).toBe('forward');
    expect(getLuckDirection('壬', 'male')).toBe('forward');
  });

  it('yang stem + female → backward (逆行)', () => {
    expect(getLuckDirection('甲', 'female')).toBe('backward');
    expect(getLuckDirection('丙', 'female')).toBe('backward');
    expect(getLuckDirection('庚', 'female')).toBe('backward');
  });

  it('yin stem + male → backward (逆行)', () => {
    expect(getLuckDirection('乙', 'male')).toBe('backward');
    expect(getLuckDirection('丁', 'male')).toBe('backward');
    expect(getLuckDirection('己', 'male')).toBe('backward');
    expect(getLuckDirection('辛', 'male')).toBe('backward');
    expect(getLuckDirection('癸', 'male')).toBe('backward');
  });

  it('yin stem + female → forward (順行)', () => {
    expect(getLuckDirection('乙', 'female')).toBe('forward');
    expect(getLuckDirection('丁', 'female')).toBe('forward');
    expect(getLuckDirection('辛', 'female')).toBe('forward');
  });
});

// ── Major Luck ────────────────────────────────────────────────

describe('computeMajorLuck', () => {
  it('should return the requested number of periods', () => {
    const result = computeMajorLuck(new Date(Date.UTC(1990, 6, 15)), 'male', 8);
    expect(result.periods).toHaveLength(8);
  });

  it('should default to 8 periods', () => {
    const result = computeMajorLuck(new Date(Date.UTC(1990, 6, 15)), 'male');
    expect(result.periods).toHaveLength(8);
  });

  it('should have forward direction for 庚(yang) + male', () => {
    // 1990 → year stem 庚 (yang metal)
    const result = computeMajorLuck(new Date(Date.UTC(1990, 6, 15)), 'male');
    expect(result.direction).toBe('forward');
  });

  it('should have backward direction for 庚(yang) + female', () => {
    const result = computeMajorLuck(new Date(Date.UTC(1990, 6, 15)), 'female');
    expect(result.direction).toBe('backward');
  });

  it('forward: pillars should be consecutive in the sexagenary cycle', () => {
    const result = computeMajorLuck(new Date(Date.UTC(1990, 6, 15)), 'male', 6);
    const indices = result.periods.map(p =>
      stemBranchCycleIndex(p.pillar.stem, p.pillar.branch),
    );
    for (let i = 1; i < indices.length; i++) {
      expect((indices[i] - indices[i - 1] + 60) % 60).toBe(1);
    }
  });

  it('backward: pillars should be reverse-consecutive in the sexagenary cycle', () => {
    const result = computeMajorLuck(new Date(Date.UTC(1990, 6, 15)), 'female', 6);
    const indices = result.periods.map(p =>
      stemBranchCycleIndex(p.pillar.stem, p.pillar.branch),
    );
    for (let i = 1; i < indices.length; i++) {
      expect((indices[i - 1] - indices[i] + 60) % 60).toBe(1);
    }
  });

  it('each period should span 10 years', () => {
    const result = computeMajorLuck(new Date(Date.UTC(1990, 6, 15)), 'male');
    for (const period of result.periods) {
      expect(period.endAge - period.startAge).toBe(9);
    }
  });

  it('periods should have increasing start ages', () => {
    const result = computeMajorLuck(new Date(Date.UTC(1990, 6, 15)), 'male');
    for (let i = 1; i < result.periods.length; i++) {
      expect(result.periods[i].startAge).toBe(result.periods[i - 1].startAge + 10);
    }
  });

  it('start age should be reasonable (1-10)', () => {
    const result = computeMajorLuck(new Date(Date.UTC(1990, 6, 15)), 'male');
    expect(result.startAge).toBeGreaterThanOrEqual(1);
    expect(result.startAge).toBeLessThanOrEqual(10);
  });

  it('first period pillar should be one step from month pillar', () => {
    const date = new Date(Date.UTC(1990, 6, 15));
    const pillars = computeFourPillars(date);
    const result = computeMajorLuck(date, 'male');
    const monthIdx = stemBranchCycleIndex(pillars.month.stem, pillars.month.branch);
    const firstIdx = stemBranchCycleIndex(
      result.periods[0].pillar.stem, result.periods[0].pillar.branch,
    );
    // Forward → first = month + 1
    expect((firstIdx - monthIdx + 60) % 60).toBe(1);
  });

  it('backward: first period pillar should be one step back from month pillar', () => {
    const date = new Date(Date.UTC(1990, 6, 15));
    const pillars = computeFourPillars(date);
    const result = computeMajorLuck(date, 'female');
    const monthIdx = stemBranchCycleIndex(pillars.month.stem, pillars.month.branch);
    const firstIdx = stemBranchCycleIndex(
      result.periods[0].pillar.stem, result.periods[0].pillar.branch,
    );
    // Backward → first = month - 1
    expect((monthIdx - firstIdx + 60) % 60).toBe(1);
  });

  it('should produce different results for different genders', () => {
    const date = new Date(Date.UTC(1990, 6, 15));
    const male = computeMajorLuck(date, 'male');
    const female = computeMajorLuck(date, 'female');
    expect(male.direction).not.toBe(female.direction);
    expect(male.periods[0].pillar.stemBranch).not.toBe(female.periods[0].pillar.stemBranch);
  });
});

// ── Minor Luck ────────────────────────────────────────────────

describe('computeMinorLuck', () => {
  it('should return one entry per year in the range', () => {
    const result = computeMinorLuck(
      { stem: '甲' as Stem, branch: '子' as Branch }, 'forward', 1, 10,
    );
    expect(result).toHaveLength(10);
  });

  it('should have consecutive ages', () => {
    const result = computeMinorLuck(
      { stem: '甲' as Stem, branch: '子' as Branch }, 'forward', 1, 5,
    );
    expect(result.map(r => r.age)).toEqual([1, 2, 3, 4, 5]);
  });

  it('forward from 甲子: age 1=乙丑, age 2=丙寅, age 3=丁卯', () => {
    const result = computeMinorLuck(
      { stem: '甲' as Stem, branch: '子' as Branch }, 'forward', 1, 3,
    );
    expect(result[0].pillar.stemBranch).toBe('乙丑');
    expect(result[1].pillar.stemBranch).toBe('丙寅');
    expect(result[2].pillar.stemBranch).toBe('丁卯');
  });

  it('backward from 甲子: age 1=癸亥, age 2=壬戌, age 3=辛酉', () => {
    const result = computeMinorLuck(
      { stem: '甲' as Stem, branch: '子' as Branch }, 'backward', 1, 3,
    );
    expect(result[0].pillar.stemBranch).toBe('癸亥');
    expect(result[1].pillar.stemBranch).toBe('壬戌');
    expect(result[2].pillar.stemBranch).toBe('辛酉');
  });

  it('should wrap correctly around the 60-cycle boundary', () => {
    // 乙丑 = cycle index 1, backward age 2 = cycle 59 (癸亥)
    const result = computeMinorLuck(
      { stem: '乙' as Stem, branch: '丑' as Branch }, 'backward', 1, 2,
    );
    expect(result[0].pillar.stemBranch).toBe('甲子');
    expect(result[1].pillar.stemBranch).toBe('癸亥');
  });
});
