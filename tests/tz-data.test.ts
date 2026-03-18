import { describe, it, expect } from 'vitest';
import { getEmbeddedOffset, TZ_TRANSITIONS, TZ_INITIAL_OFFSETS } from '../src/tz-data';
import { localToUtc, getUtcOffset } from '../src/timezone';

// ═══════════════════════════════════════════════════════════════
//  Data integrity
// ═══════════════════════════════════════════════════════════════

describe('TZ_TRANSITIONS data integrity', () => {
  it('covers all timezones from city database', () => {
    // Should have entries for the key timezones
    const required = [
      'Asia/Shanghai', 'Asia/Taipei', 'Asia/Hong_Kong', 'Asia/Tokyo',
      'Asia/Singapore', 'Asia/Kolkata', 'America/New_York', 'Europe/London',
      'Australia/Sydney', 'Pacific/Auckland',
    ];
    for (const tz of required) {
      expect(TZ_TRANSITIONS[tz], `missing ${tz}`).toBeDefined();
    }
  });

  it('each timezone has triples (length divisible by 3)', () => {
    for (const [tz, data] of Object.entries(TZ_TRANSITIONS)) {
      expect(data.length % 3, `${tz} has ${data.length} entries (not divisible by 3)`).toBe(0);
    }
  });

  it('transitions are sorted by UTC seconds ascending', () => {
    for (const [tz, data] of Object.entries(TZ_TRANSITIONS)) {
      for (let i = 3; i < data.length; i += 3) {
        expect(data[i] >= data[i - 3], `${tz} not sorted at index ${i}`).toBe(true);
      }
    }
  });

  it('offsets are within valid range (±840 minutes = ±14 hours)', () => {
    for (const [tz, data] of Object.entries(TZ_TRANSITIONS)) {
      for (let i = 1; i < data.length; i += 3) {
        expect(Math.abs(data[i]) <= 840, `${tz} offset ${data[i]} out of range at index ${i}`).toBe(true);
      }
    }
  });

  it('isDst values are 0 or 1', () => {
    for (const [tz, data] of Object.entries(TZ_TRANSITIONS)) {
      for (let i = 2; i < data.length; i += 3) {
        expect(data[i] === 0 || data[i] === 1, `${tz} isDst ${data[i]} at index ${i}`).toBe(true);
      }
    }
  });

  it('has initial offsets for all timezones', () => {
    for (const tz of Object.keys(TZ_TRANSITIONS)) {
      expect(TZ_INITIAL_OFFSETS[tz], `missing initial offset for ${tz}`).toBeDefined();
    }
  });
});

// ═══════════════════════════════════════════════════════════════
//  getEmbeddedOffset – basic lookup
// ═══════════════════════════════════════════════════════════════

describe('getEmbeddedOffset', () => {
  it('returns null for unknown timezone', () => {
    expect(getEmbeddedOffset(0, 'Fake/Timezone')).toBeNull();
  });

  it('Shanghai 2024 standard time → UTC+8 (480 min)', () => {
    const utc = Date.UTC(2024, 6, 15, 4, 0) / 1000; // 2024-07-15T04:00Z = noon Beijing
    const result = getEmbeddedOffset(utc, 'Asia/Shanghai');
    expect(result).not.toBeNull();
    expect(result!.offsetMinutes).toBe(480);
    expect(result!.isDst).toBe(false);
  });

  it('Shanghai 1988 DST → UTC+9 (540 min)', () => {
    const utc = Date.UTC(1988, 6, 15, 3, 0) / 1000; // 1988-07-15T03:00Z = noon CDT
    const result = getEmbeddedOffset(utc, 'Asia/Shanghai');
    expect(result).not.toBeNull();
    expect(result!.offsetMinutes).toBe(540);
    expect(result!.isDst).toBe(true);
  });

  it('Shanghai 1985 summer → no DST, UTC+8', () => {
    const utc = Date.UTC(1985, 6, 15, 4, 0) / 1000;
    const result = getEmbeddedOffset(utc, 'Asia/Shanghai');
    expect(result).not.toBeNull();
    expect(result!.offsetMinutes).toBe(480);
    expect(result!.isDst).toBe(false);
  });

  it('New York EST → UTC-5 (-300 min)', () => {
    const utc = Date.UTC(2024, 0, 15, 17, 0) / 1000;
    const result = getEmbeddedOffset(utc, 'America/New_York');
    expect(result).not.toBeNull();
    expect(result!.offsetMinutes).toBe(-300);
    expect(result!.isDst).toBe(false);
  });

  it('New York EDT → UTC-4 (-240 min)', () => {
    const utc = Date.UTC(2024, 6, 15, 16, 0) / 1000;
    const result = getEmbeddedOffset(utc, 'America/New_York');
    expect(result).not.toBeNull();
    expect(result!.offsetMinutes).toBe(-240);
    expect(result!.isDst).toBe(true);
  });

  it('India → UTC+5:30 (330 min), no DST', () => {
    const utc = Date.UTC(2024, 6, 15, 6, 30) / 1000;
    const result = getEmbeddedOffset(utc, 'Asia/Kolkata');
    expect(result).not.toBeNull();
    expect(result!.offsetMinutes).toBe(330);
    expect(result!.isDst).toBe(false);
  });

  it('Nepal → UTC+5:45 (345 min)', () => {
    const utc = Date.UTC(2024, 6, 15, 6, 15) / 1000;
    const result = getEmbeddedOffset(utc, 'Asia/Kathmandu');
    expect(result).not.toBeNull();
    expect(result!.offsetMinutes).toBe(345);
  });

  it('Singapore 1970 → UTC+7:30 (450 min)', () => {
    const utc = Date.UTC(1970, 5, 15, 4, 30) / 1000;
    const result = getEmbeddedOffset(utc, 'Asia/Singapore');
    expect(result).not.toBeNull();
    expect(result!.offsetMinutes).toBe(450);
  });

  it('Singapore 2024 → UTC+8 (480 min)', () => {
    const utc = Date.UTC(2024, 6, 15, 4, 0) / 1000;
    const result = getEmbeddedOffset(utc, 'Asia/Singapore');
    expect(result).not.toBeNull();
    expect(result!.offsetMinutes).toBe(480);
  });

  it('Hong Kong 1965 summer → UTC+9 (540 min, DST)', () => {
    const utc = Date.UTC(1965, 7, 1, 3, 0) / 1000; // Aug 1 noon HKT
    const result = getEmbeddedOffset(utc, 'Asia/Hong_Kong');
    expect(result).not.toBeNull();
    expect(result!.offsetMinutes).toBe(540);
    expect(result!.isDst).toBe(true);
  });

  it('Hong Kong 1980 summer → no DST, UTC+8', () => {
    const utc = Date.UTC(1980, 7, 1, 4, 0) / 1000;
    const result = getEmbeddedOffset(utc, 'Asia/Hong_Kong');
    expect(result).not.toBeNull();
    expect(result!.offsetMinutes).toBe(480);
    expect(result!.isDst).toBe(false);
  });

  it('Taiwan 1974 summer → UTC+9 (DST)', () => {
    const utc = Date.UTC(1974, 7, 1, 3, 0) / 1000;
    const result = getEmbeddedOffset(utc, 'Asia/Taipei');
    expect(result).not.toBeNull();
    expect(result!.offsetMinutes).toBe(540);
    expect(result!.isDst).toBe(true);
  });

  it('Taiwan 1980 summer → no DST, UTC+8', () => {
    const utc = Date.UTC(1980, 7, 1, 4, 0) / 1000;
    const result = getEmbeddedOffset(utc, 'Asia/Taipei');
    expect(result).not.toBeNull();
    expect(result!.offsetMinutes).toBe(480);
    expect(result!.isDst).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
//  Cross-validation: embedded data vs Intl (system runtime)
// ═══════════════════════════════════════════════════════════════

describe('Cross-validation: embedded vs Intl', () => {
  // Sample dates across different eras
  const testDates: [number, number, number, number, number][] = [
    [1920, 6, 15, 12, 0],
    [1945, 8, 15, 12, 0],
    [1950, 7, 15, 12, 0],
    [1965, 7, 15, 12, 0],
    [1970, 6, 15, 12, 0],
    [1974, 7, 15, 12, 0],
    [1980, 1, 15, 12, 0],
    [1986, 7, 15, 12, 0],
    [1988, 7, 15, 12, 0],
    [1992, 7, 15, 12, 0],
    [2000, 6, 15, 12, 0],
    [2010, 1, 15, 12, 0],
    [2020, 7, 15, 12, 0],
    [2024, 1, 15, 12, 0],
    [2024, 7, 15, 12, 0],
  ];

  const keyTimezones = [
    'Asia/Shanghai', 'Asia/Taipei', 'Asia/Hong_Kong', 'Asia/Tokyo',
    'Asia/Singapore', 'Asia/Seoul', 'Asia/Kolkata', 'Asia/Kathmandu',
    'America/New_York', 'America/Los_Angeles', 'America/Chicago',
    'Europe/London', 'Europe/Berlin', 'Europe/Paris',
    'Australia/Sydney', 'Pacific/Auckland',
  ];

  for (const tz of keyTimezones) {
    it(`${tz} matches Intl across ${testDates.length} test dates`, () => {
      for (const [y, m, d, h, min] of testDates) {
        const intlOffset = getUtcOffset(y, m, d, h, min, tz);
        const utc = localToUtc(y, m, d, h, min, tz);
        const utcSec = Math.floor(utc.getTime() / 1000);
        const embedded = getEmbeddedOffset(utcSec, tz);

        expect(
          embedded,
          `${tz} ${y}-${m}-${d} ${h}:${min}: embedded returned null`,
        ).not.toBeNull();
        expect(
          embedded!.offsetMinutes,
          `${tz} ${y}-${m}-${d} ${h}:${min}: embedded=${embedded!.offsetMinutes} intl=${intlOffset}`,
        ).toBe(intlOffset);
      }
    });
  }
});

// ═══════════════════════════════════════════════════════════════
//  PRC DST exact boundaries (embedded data)
// ═══════════════════════════════════════════════════════════════

describe('PRC DST boundaries (embedded)', () => {
  const transitions: [number, number, number, number, number][] = [
    [1986, 5, 4, 9, 14],
    [1987, 4, 12, 9, 13],
    [1988, 4, 17, 9, 11],
    [1989, 4, 16, 9, 17],
    [1990, 4, 15, 9, 16],
    [1991, 4, 14, 9, 15],
  ];

  for (const [year, sm, sd, em, ed] of transitions) {
    it(`${year}: before DST (${sm}/${sd - 1}) → 480, during → 540, after (${em}/${ed + 1}) → 480`, () => {
      // Day before DST start at noon local = 04:00 UTC
      const beforeUtc = Math.floor(Date.UTC(year, sm - 1, sd - 1, 4, 0) / 1000);
      const before = getEmbeddedOffset(beforeUtc, 'Asia/Shanghai');
      expect(before!.offsetMinutes).toBe(480);
      expect(before!.isDst).toBe(false);

      // Mid-summer at noon local = 03:00 UTC (during DST, UTC+9)
      const duringUtc = Math.floor(Date.UTC(year, 6, 15, 3, 0) / 1000);
      const during = getEmbeddedOffset(duringUtc, 'Asia/Shanghai');
      expect(during!.offsetMinutes).toBe(540);
      expect(during!.isDst).toBe(true);

      // Day after DST end at noon local = 04:00 UTC
      const afterUtc = Math.floor(Date.UTC(year, em - 1, ed + 1, 4, 0) / 1000);
      const after = getEmbeddedOffset(afterUtc, 'Asia/Shanghai');
      expect(after!.offsetMinutes).toBe(480);
      expect(after!.isDst).toBe(false);
    });
  }
});
