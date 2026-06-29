import { describe, it, expect } from 'vitest';
import { getLunarNewYear, gregorianToLunisolar, getLunarMonthsForYear } from '../src/lunisolar-calendar';

// ═══════════════════════════════════════════════════════════════════════
// Known Lunar New Year dates (Gregorian)
// Source: Hong Kong Observatory / USNO
// ═══════════════════════════════════════════════════════════════════════

const KNOWN_LNY: Record<number, [number, number]> = {
  // [month (1-based), day]
  1990: [1, 27],
  1991: [2, 15],
  1992: [2, 4],
  1993: [1, 23],
  1994: [2, 10],
  1995: [1, 31],
  1996: [2, 19],
  1997: [2, 7],
  1998: [1, 28],
  1999: [2, 16],
  2000: [2, 5],
  2001: [1, 24],
  2002: [2, 12],
  2003: [2, 1],
  2004: [1, 22],
  2005: [2, 9],
  2006: [1, 29],
  2007: [2, 18],
  2008: [2, 7],
  2009: [1, 26],
  2010: [2, 14],
  2011: [2, 3],
  2012: [1, 23],
  2013: [2, 10],
  2014: [1, 31],
  2015: [2, 19],
  2016: [2, 8],
  2017: [1, 28],
  2018: [2, 16],
  2019: [2, 5],
  2020: [1, 25],
  2021: [2, 12],
  2022: [2, 1],
  2023: [1, 22],
  2024: [2, 10],
  2025: [1, 29],
  2026: [2, 17],
  2027: [2, 6],
  2028: [1, 26],
  2029: [2, 13],
  2030: [2, 3],
  2031: [1, 23],
  2032: [2, 11],
  2033: [1, 31],
  2034: [2, 19],
  2035: [2, 8],
  2036: [1, 28],
  2037: [2, 15],
  2038: [2, 4],
  2039: [1, 24],
  2040: [2, 12],
  2041: [2, 1],
  2042: [1, 22],
  2043: [2, 10],
  2044: [1, 30],
  2045: [2, 17],
  2046: [2, 6],
  2047: [1, 26],
  2048: [2, 14],
  2049: [2, 2],
  2050: [1, 23],
};

// ═══════════════════════════════════════════════════════════════════════
// Known 閏月 (intercalary months)
// Source: Chinese calendar tables
// ═══════════════════════════════════════════════════════════════════════

const KNOWN_LEAP_MONTHS: Record<number, number> = {
  // year: leap month number (the month BEFORE which the leap is inserted)
  // e.g. 2023: 2 means 閏二月 (intercalary 2nd month)
  2001: 4,
  2004: 2,
  2006: 7,
  2009: 5,
  2012: 4,
  2014: 9,
  2017: 6,
  2020: 4,
  2023: 2,
  2025: 6,
};

describe('getLunarNewYear', () => {
  it('matches known LNY dates for 1990-2050', { timeout: 120_000 }, () => {
    const errors: string[] = [];
    let matches = 0;

    for (const [yearStr, [month, day]] of Object.entries(KNOWN_LNY)) {
      const year = Number(yearStr);
      const computed = getLunarNewYear(year);
      const expectedDate = new Date(Date.UTC(year, month - 1, day));

      // Compare the Beijing date (UTC+8)
      const computedBeijing = new Date(computed.getTime() + 8 * 3600000);
      const expectedBeijing = new Date(expectedDate.getTime() + 8 * 3600000);

      const cY = computedBeijing.getUTCFullYear();
      const cM = computedBeijing.getUTCMonth() + 1;
      const cD = computedBeijing.getUTCDate();

      if (cY === year && cM === month && cD === day) {
        matches++;
      } else {
        errors.push(
          `${year}: expected ${month}-${day}, got ${cM}-${cD}`,
        );
      }
    }

    console.log(
      `\n  Lunar New Year: ${matches}/${Object.keys(KNOWN_LNY).length} match`,
    );
    if (errors.length > 0) {
      console.log('  Mismatches:');
      errors.forEach(e => console.log(`    ${e}`));
    }

    expect(errors.length).toBe(0);
  });
});

describe('getLunarMonthsForYear — 閏月 detection', () => {
  it(
    'detects known 閏月 for 2001-2025',
    { timeout: 120_000 },
    () => {
      const errors: string[] = [];
      let matches = 0;

      for (const [yearStr, expectedLeapMonth] of Object.entries(KNOWN_LEAP_MONTHS)) {
        const year = Number(yearStr);
        const months = getLunarMonthsForYear(year);
        const leapMonth = months.find(m => m.isLeapMonth);

        if (leapMonth && leapMonth.monthNumber === expectedLeapMonth) {
          matches++;
        } else {
          const got = leapMonth
            ? `閏${leapMonth.monthNumber}月`
            : 'no leap month';
          errors.push(`${year}: expected 閏${expectedLeapMonth}月, got ${got}`);
        }
      }

      console.log(
        `\n  Leap Months: ${matches}/${Object.keys(KNOWN_LEAP_MONTHS).length} match`,
      );
      if (errors.length > 0) {
        console.log('  Mismatches:');
        errors.forEach(e => console.log(`    ${e}`));
      }

      expect(errors.length).toBe(0);
    },
  );
});

describe('gregorianToLunisolar', () => {
  it('2024-02-10 is 正月初一 (Lunar New Year)', { timeout: 30_000 }, () => {
    const result = gregorianToLunisolar(new Date(2024, 1, 10));
    expect(result.month).toBe(1);
    expect(result.day).toBe(1);
    expect(result.isLeapMonth).toBe(false);
  });

  it('2024-02-09 is 十二月三十 (day before LNY)', { timeout: 30_000 }, () => {
    const result = gregorianToLunisolar(new Date(2024, 1, 9));
    expect(result.month).toBe(12);
    expect(result.day).toBeGreaterThanOrEqual(29);
    expect(result.isLeapMonth).toBe(false);
  });

  it('2023-03-22 is in 閏二月 (intercalary 2nd month)', { timeout: 30_000 }, () => {
    const result = gregorianToLunisolar(new Date(2023, 2, 22));
    expect(result.month).toBe(2);
    expect(result.isLeapMonth).toBe(true);
  });

  it('lunar day is between 1 and 30', { timeout: 30_000 }, () => {
    const result = gregorianToLunisolar(new Date(2024, 5, 15));
    expect(result.day).toBeGreaterThanOrEqual(1);
    expect(result.day).toBeLessThanOrEqual(30);
  });
});

describe('getLunarMonthsForYear', () => {
  it('returns 12 or 13 months per year', { timeout: 30_000 }, () => {
    const months = getLunarMonthsForYear(2024);
    expect(months.length).toBeGreaterThanOrEqual(12);
    expect(months.length).toBeLessThanOrEqual(13);
  });

  it('month numbers are 1-12 (with optional leap)', { timeout: 30_000 }, () => {
    const months = getLunarMonthsForYear(2024);
    for (const m of months) {
      expect(m.monthNumber).toBeGreaterThanOrEqual(1);
      expect(m.monthNumber).toBeLessThanOrEqual(12);
    }
  });

  it('each month has 29 or 30 days', { timeout: 30_000 }, () => {
    const months = getLunarMonthsForYear(2024);
    for (const m of months) {
      expect(m.days).toBeGreaterThanOrEqual(29);
      expect(m.days).toBeLessThanOrEqual(30);
    }
  });

  it('non-leap years have exactly 12 months', { timeout: 30_000 }, () => {
    // 2024 has no leap month
    const months = getLunarMonthsForYear(2024);
    expect(months.length).toBe(12);
    expect(months.every(m => !m.isLeapMonth)).toBe(true);
  });

  it('leap years have exactly 13 months', { timeout: 30_000 }, () => {
    // 2023 has 閏二月
    const months = getLunarMonthsForYear(2023);
    expect(months.length).toBe(13);
    expect(months.filter(m => m.isLeapMonth).length).toBe(1);
  });
});
