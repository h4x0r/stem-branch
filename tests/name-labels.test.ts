import { describe, it, expect } from 'vitest';
import {
  SOLAR_TERM_NAMES,
  SOLAR_TERM_LONGITUDES,
  solarTermForLongitude,
} from '../src/solar-terms';
import { STEMS } from '../src/stems';
import { BRANCHES } from '../src/branches';

describe('name labels', () => {
  it('solar-term names are index-aligned with longitudes (Traditional Chinese)', () => {
    expect(SOLAR_TERM_NAMES).toHaveLength(24);
    expect(SOLAR_TERM_NAMES.length).toBe(SOLAR_TERM_LONGITUDES.length);
    expect([SOLAR_TERM_NAMES[0], SOLAR_TERM_LONGITUDES[0]]).toEqual(['小寒', 285]);
    expect([SOLAR_TERM_NAMES[2], SOLAR_TERM_LONGITUDES[2]]).toEqual(['立春', 315]);
    expect(SOLAR_TERM_NAMES[7]).toBe('穀雨');
    expect(SOLAR_TERM_NAMES[9]).toBe('小滿');
    expect(SOLAR_TERM_NAMES[23]).toBe('冬至');
  });

  it('solarTermForLongitude looks up the term in effect', () => {
    expect(solarTermForLongitude(315)).toBe('立春');
    expect(solarTermForLongitude(71)).toBe('小滿');
    expect(solarTermForLongitude(0)).toBe('春分');
    expect(solarTermForLongitude(270)).toBe('冬至');
    // Just past 小寒 (285°) stays 小寒 until 大寒 (300°).
    expect(solarTermForLongitude(286)).toBe('小寒');
    // Negative / >360 inputs normalize.
    expect(solarTermForLongitude(-45)).toBe(solarTermForLongitude(315));
  });

  it('stems and branches are Traditional Chinese, correctly ordered', () => {
    expect(STEMS).toHaveLength(10);
    expect(BRANCHES).toHaveLength(12);
    expect([STEMS[0], STEMS[6], STEMS[9]]).toEqual(['甲', '庚', '癸']);
    expect([BRANCHES[0], BRANCHES[4], BRANCHES[11]]).toEqual(['子', '辰', '亥']);
  });
});
