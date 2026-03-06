import { describe, it, expect } from 'vitest';
import { SALARY_STAR, getSalaryStar } from '../src/salary-star';
import type { Stem, Branch } from '../src/types';

describe('SALARY_STAR', () => {
  it('should map all 10 stems', () => {
    expect(Object.keys(SALARY_STAR)).toHaveLength(10);
  });
});

describe('getSalaryStar', () => {
  const cases: [Stem, Branch][] = [
    ['甲', '寅'], ['乙', '卯'], ['丙', '巳'], ['丁', '午'], ['戊', '巳'],
    ['己', '午'], ['庚', '申'], ['辛', '酉'], ['壬', '亥'], ['癸', '子'],
  ];

  it.each(cases)('%s → %s (臨官 position)', (stem, expected) => {
    expect(getSalaryStar(stem)).toBe(expected);
  });
});
