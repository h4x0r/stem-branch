import { describe, it, expect, vi } from 'vitest';
import {
  SOLAR_TERM_NAMES, SOLAR_TERM_LONGITUDES, MONTH_BOUNDARY_INDICES,
  findSolarTermMoment, getSolarTermsForYear, findSpringStart,
  getMonthBoundaryTerms, getSolarMonthExact,
} from '../src/solar-terms';

describe('SOLAR_TERM_NAMES', () => {
  it('has 24 terms', () => {
    expect(SOLAR_TERM_NAMES).toHaveLength(24);
  });

  it('starts with 小寒 and ends with 冬至', () => {
    expect(SOLAR_TERM_NAMES[0]).toBe('小寒');
    expect(SOLAR_TERM_NAMES[23]).toBe('冬至');
  });
});

describe('SOLAR_TERM_LONGITUDES', () => {
  it('has 24 longitudes', () => {
    expect(SOLAR_TERM_LONGITUDES).toHaveLength(24);
  });

  it('春分 is at 0°', () => {
    const chunfenIdx = SOLAR_TERM_NAMES.indexOf('春分');
    expect(SOLAR_TERM_LONGITUDES[chunfenIdx]).toBe(0);
  });

  it('夏至 is at 90°', () => {
    const xiazhi = SOLAR_TERM_NAMES.indexOf('夏至');
    expect(SOLAR_TERM_LONGITUDES[xiazhi]).toBe(90);
  });
});

describe('MONTH_BOUNDARY_INDICES', () => {
  it('has 12 節 terms', () => {
    expect(MONTH_BOUNDARY_INDICES).toHaveLength(12);
  });
});

describe('findSolarTermMoment', () => {
  it('finds 春分 2024 (longitude 0°) in March', () => {
    const date = findSolarTermMoment(0, 2024, 3);
    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(2); // March (0-indexed)
    expect(date.getDate()).toBeGreaterThanOrEqual(19);
    expect(date.getDate()).toBeLessThanOrEqual(21);
  });

  it('finds 夏至 2024 (longitude 90°) in June', () => {
    const date = findSolarTermMoment(90, 2024, 5);
    expect(date.getMonth()).toBe(5); // June
    expect(date.getDate()).toBeGreaterThanOrEqual(20);
    expect(date.getDate()).toBeLessThanOrEqual(22);
  });

  it('throws when findSunLongitudeMoment returns null', async () => {
    const solarLon = await import('../src/solar-longitude');
    const spy = vi.spyOn(solarLon, 'findSunLongitudeMoment').mockReturnValue(null);
    try {
      expect(() => findSolarTermMoment(0, 2024, 3)).toThrow('Could not find solar longitude');
    } finally {
      spy.mockRestore();
    }
  });
});

describe('findSpringStart', () => {
  it('returns 立春 around Feb 3-5', () => {
    const springStart2024 = findSpringStart(2024);
    expect(springStart2024.getMonth()).toBe(1); // February
    expect(springStart2024.getDate()).toBeGreaterThanOrEqual(3);
    expect(springStart2024.getDate()).toBeLessThanOrEqual(5);
  });

  it('returns date in February for various years', () => {
    for (const year of [2020, 2021, 2022, 2023, 2025]) {
      const springStart = findSpringStart(year);
      expect(springStart.getMonth()).toBe(1);
    }
  });
});

describe('getSolarTermsForYear', () => {
  it('returns 24 terms for 2024', () => {
    const terms = getSolarTermsForYear(2024);
    expect(terms).toHaveLength(24);
    expect(terms[0].name).toBe('小寒');
    expect(terms[23].name).toBe('冬至');
  });

  it('terms are in chronological order', () => {
    const terms = getSolarTermsForYear(2024);
    for (let i = 1; i < terms.length; i++) {
      expect(terms[i].date.getTime()).toBeGreaterThan(terms[i - 1].date.getTime());
    }
  });
});

describe('getMonthBoundaryTerms', () => {
  it('returns 12 節 terms', () => {
    const jie = getMonthBoundaryTerms(2024);
    expect(jie).toHaveLength(12);
    expect(jie[0].name).toBe('小寒');
    expect(jie[1].name).toBe('立春');
  });
});

describe('getSolarMonthExact', () => {
  it('returns correct month for a mid-year date (after 芒種)', () => {
    // June 15 should be in 午月 (monthIndex 4)
    const result = getSolarMonthExact(new Date(2024, 5, 15));
    expect(result.monthIndex).toBe(4);
    expect(result.effectiveYear).toBe(2024);
  });

  it('returns 子月 for early January (after prev year 大雪, before 小寒)', () => {
    // Jan 3 is after previous year's 大雪 (~Dec 7) but before current year 小寒 (~Jan 6)
    const result = getSolarMonthExact(new Date(2024, 0, 3));
    expect(result.monthIndex).toBe(10); // 子月
    expect(result.effectiveYear).toBe(2023);
  });

  it('returns correct month for various dates across the year', () => {
    // Feb 10 → after 立春 → 寅月 (monthIndex 0)
    expect(getSolarMonthExact(new Date(2024, 1, 10)).monthIndex).toBe(0);

    // March 15 → after 驚蟄 → 卯月 (monthIndex 1)
    expect(getSolarMonthExact(new Date(2024, 2, 15)).monthIndex).toBe(1);

    // Dec 20 → after 大雪 → 子月 (monthIndex 10)
    expect(getSolarMonthExact(new Date(2024, 11, 20)).monthIndex).toBe(10);
  });

  it('handles the effectiveYear branch when monthIndex >= 0', () => {
    // Any date after 立春 should have monthIndex >= 0 and effectiveYear = year
    const result = getSolarMonthExact(new Date(2024, 3, 15)); // April
    expect(result.monthIndex).toBeGreaterThanOrEqual(0);
    expect(result.effectiveYear).toBe(2024);
  });
});
