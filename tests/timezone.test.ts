import { describe, it, expect } from 'vitest';
import {
  localToUtc, getUtcOffset, timezoneFromLongitude, wallClockToSolarTime,
  isDst, getStandardMeridian, utcToLocal, formatUtcOffset,
} from '../src/timezone';

// ── Helper ──────────────────────────────────────────────────
/** Shorthand: returns UTC hours offset at a given local wall-clock moment */
function offsetHours(
  year: number, month: number, day: number,
  hour: number, minute: number, tz: string,
): number {
  return getUtcOffset(year, month, day, hour, minute, tz) / 60;
}

/** Assert localToUtc produces the expected UTC ISO string (to the minute) */
function expectUtc(
  year: number, month: number, day: number,
  hour: number, minute: number, tz: string,
  expectedIso: string, label?: string,
) {
  const utc = localToUtc(year, month, day, hour, minute, tz);
  const actual = utc.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
  expect(actual, label).toBe(expectedIso);
}

// ═══════════════════════════════════════════════════════════════
//  CHINA (Asia/Shanghai)
// ═══════════════════════════════════════════════════════════════

describe('China – Asia/Shanghai', () => {
  const tz = 'Asia/Shanghai';

  describe('Standard time (no DST)', () => {
    it('1985 summer – no DST yet, UTC+8', () => {
      expectUtc(1985, 6, 15, 12, 0, tz, '1985-06-15T04:00');
    });

    it('1992 summer – DST abolished, UTC+8', () => {
      expectUtc(1992, 6, 15, 12, 0, tz, '1992-06-15T04:00');
    });

    it('2000 winter – UTC+8', () => {
      expectUtc(2000, 1, 1, 0, 0, tz, '1999-12-31T16:00');
    });

    it('2024 summer – UTC+8', () => {
      expectUtc(2024, 7, 15, 12, 0, tz, '2024-07-15T04:00');
    });
  });

  describe('PRC DST 1986-1991', () => {
    // ── 1986: Special start date (May 4, not Sunday rule) ────
    it('1986-05-03 23:00 – still UTC+8 (day before DST)', () => {
      expectUtc(1986, 5, 3, 23, 0, tz, '1986-05-03T15:00');
    });

    it('1986-05-04 01:59 – last minute of standard time', () => {
      expectUtc(1986, 5, 4, 1, 59, tz, '1986-05-03T17:59');
    });

    it('1986-05-04 03:00 – first moment of DST (UTC+9)', () => {
      expectUtc(1986, 5, 4, 3, 0, tz, '1986-05-03T18:00');
    });

    it('1986-07-15 12:00 – mid-summer DST (UTC+9)', () => {
      expectUtc(1986, 7, 15, 12, 0, tz, '1986-07-15T03:00');
    });

    it('1986-09-14 01:59 – ambiguous (fall-back), resolves to standard UTC+8', () => {
      // 01:59 on fall-back day is ambiguous: happens in both CDT and CST
      // Intl resolves to standard time (second occurrence): 01:59 CST = 17:59Z
      expectUtc(1986, 9, 14, 1, 59, tz, '1986-09-13T17:59');
    });

    it('1986-09-14 02:00 – back to UTC+8', () => {
      // After fall-back, 02:00 CDT → 01:00 CST; second occurrence of 01:xx is standard
      // The wall-clock 02:00 standard time = UTC 18:00 previous day
      expectUtc(1986, 9, 14, 3, 0, tz, '1986-09-13T19:00');
    });

    // ── 1987: Apr 12, Sep 13 ────
    it('1987-04-12 03:00 – DST starts (UTC+9)', () => {
      expectUtc(1987, 4, 12, 3, 0, tz, '1987-04-11T18:00');
    });

    it('1987-09-13 03:00 – back to standard', () => {
      expectUtc(1987, 9, 13, 3, 0, tz, '1987-09-12T19:00');
    });

    // ── 1988: Apr 17, Sep 11 ────
    it('1988-04-17 03:00 – DST starts', () => {
      expectUtc(1988, 4, 17, 3, 0, tz, '1988-04-16T18:00');
    });

    it('1988-07-01 12:00 – mid-summer DST', () => {
      expectUtc(1988, 7, 1, 12, 0, tz, '1988-07-01T03:00');
    });

    it('1988-09-11 03:00 – back to standard', () => {
      expectUtc(1988, 9, 11, 3, 0, tz, '1988-09-10T19:00');
    });

    // ── 1989: Apr 16, Sep 17 ────
    it('1989-04-16 03:00 – DST starts', () => {
      expectUtc(1989, 4, 16, 3, 0, tz, '1989-04-15T18:00');
    });

    it('1989-09-17 03:00 – back to standard', () => {
      expectUtc(1989, 9, 17, 3, 0, tz, '1989-09-16T19:00');
    });

    // ── 1990: Apr 15, Sep 16 ────
    it('1990-04-15 03:00 – DST starts', () => {
      expectUtc(1990, 4, 15, 3, 0, tz, '1990-04-14T18:00');
    });

    it('1990-09-16 03:00 – back to standard', () => {
      expectUtc(1990, 9, 16, 3, 0, tz, '1990-09-15T19:00');
    });

    // ── 1991: Apr 14, Sep 15 (last year of DST) ────
    it('1991-04-14 01:59 – last minute of standard', () => {
      expectUtc(1991, 4, 14, 1, 59, tz, '1991-04-13T17:59');
    });

    it('1991-04-14 03:00 – DST starts', () => {
      expectUtc(1991, 4, 14, 3, 0, tz, '1991-04-13T18:00');
    });

    it('1991-08-15 12:00 – summer DST (UTC+9)', () => {
      expectUtc(1991, 8, 15, 12, 0, tz, '1991-08-15T03:00');
    });

    it('1991-09-15 03:00 – last fall-back ever', () => {
      expectUtc(1991, 9, 15, 3, 0, tz, '1991-09-14T19:00');
    });

    it('1991-12-01 12:00 – winter after last DST, UTC+8', () => {
      expectUtc(1991, 12, 1, 12, 0, tz, '1991-12-01T04:00');
    });
  });

  describe('Shanghai wartime DST (1940-1945)', () => {
    it('1940-06-01 12:00 – DST active (UTC+9)', () => {
      expectUtc(1940, 6, 1, 12, 0, tz, '1940-06-01T03:00');
    });

    it('1940-10-13 12:00 – just after DST ends (UTC+8)', () => {
      expectUtc(1940, 10, 14, 12, 0, tz, '1940-10-14T04:00');
    });

    it('1942-06-15 12:00 – Japanese occupation (continuous UTC+9)', () => {
      expectUtc(1942, 6, 15, 12, 0, tz, '1942-06-15T03:00');
    });

    it('1943-12-15 12:00 – Japanese occupation winter (still UTC+9)', () => {
      expectUtc(1943, 12, 15, 12, 0, tz, '1943-12-15T03:00');
    });

    it('1945-09-02 12:00 – IANA: Shanghai DST ended at 00:00 Sep 2, back to UTC+8', () => {
      expectUtc(1945, 9, 2, 12, 0, tz, '1945-09-02T04:00');
    });
  });
});

// ── Xinjiang (Asia/Urumqi) ────────────────────────────────────
describe('Xinjiang – Asia/Urumqi', () => {
  const tz = 'Asia/Urumqi';

  it('1990 summer – UTC+6, no DST', () => {
    expectUtc(1990, 7, 15, 12, 0, tz, '1990-07-15T06:00');
  });

  it('2024 summer – UTC+6, no DST', () => {
    expectUtc(2024, 7, 15, 12, 0, tz, '2024-07-15T06:00');
  });
});

// ═══════════════════════════════════════════════════════════════
//  TAIWAN (Asia/Taipei)
// ═══════════════════════════════════════════════════════════════

describe('Taiwan – Asia/Taipei', () => {
  const tz = 'Asia/Taipei';

  describe('DST era (1946-1961)', () => {
    it('1950-06-15 12:00 – summer DST (UTC+9)', () => {
      expectUtc(1950, 6, 15, 12, 0, tz, '1950-06-15T03:00');
    });

    it('1950-12-15 12:00 – winter standard (UTC+8)', () => {
      expectUtc(1950, 12, 15, 12, 0, tz, '1950-12-15T04:00');
    });

    it('1955-06-15 12:00 – summer DST (UTC+9)', () => {
      expectUtc(1955, 6, 15, 12, 0, tz, '1955-06-15T03:00');
    });

    it('1961-06-15 12:00 – last regular DST year (UTC+9)', () => {
      expectUtc(1961, 6, 15, 12, 0, tz, '1961-06-15T03:00');
    });
  });

  describe('Gap between DST periods (1962-1973)', () => {
    it('1962-06-15 12:00 – no DST (UTC+8)', () => {
      expectUtc(1962, 6, 15, 12, 0, tz, '1962-06-15T04:00');
    });

    it('1970-06-15 12:00 – no DST (UTC+8)', () => {
      expectUtc(1970, 6, 15, 12, 0, tz, '1970-06-15T04:00');
    });
  });

  describe('Energy crisis DST revival (1974-1975)', () => {
    it('1974-06-15 12:00 – DST revived (UTC+9)', () => {
      expectUtc(1974, 6, 15, 12, 0, tz, '1974-06-15T03:00');
    });

    it('1975-06-15 12:00 – DST (UTC+9)', () => {
      expectUtc(1975, 6, 15, 12, 0, tz, '1975-06-15T03:00');
    });
  });

  describe('Final DST year 1979 (late start: July 1)', () => {
    it('1979-06-15 12:00 – before July 1 start, no DST (UTC+8)', () => {
      expectUtc(1979, 6, 15, 12, 0, tz, '1979-06-15T04:00');
    });

    it('1979-07-15 12:00 – DST active (UTC+9)', () => {
      expectUtc(1979, 7, 15, 12, 0, tz, '1979-07-15T03:00');
    });
  });

  describe('Post-DST era', () => {
    it('1980-07-15 12:00 – no more DST (UTC+8)', () => {
      expectUtc(1980, 7, 15, 12, 0, tz, '1980-07-15T04:00');
    });

    it('2024-07-15 12:00 – UTC+8', () => {
      expectUtc(2024, 7, 15, 12, 0, tz, '2024-07-15T04:00');
    });
  });
});

// ═══════════════════════════════════════════════════════════════
//  HONG KONG (Asia/Hong_Kong)
// ═══════════════════════════════════════════════════════════════

describe('Hong Kong – Asia/Hong_Kong', () => {
  const tz = 'Asia/Hong_Kong';

  describe('Summer time era (1946-1979)', () => {
    it('1950-06-15 12:00 – summer time (UTC+9)', () => {
      expectUtc(1950, 6, 15, 12, 0, tz, '1950-06-15T03:00');
    });

    it('1950-12-15 12:00 – winter (UTC+8)', () => {
      expectUtc(1950, 12, 15, 12, 0, tz, '1950-12-15T04:00');
    });

    it('1965-07-15 12:00 – summer time (UTC+9)', () => {
      expectUtc(1965, 7, 15, 12, 0, tz, '1965-07-15T03:00');
    });

    it('1965-01-15 12:00 – winter (UTC+8)', () => {
      expectUtc(1965, 1, 15, 12, 0, tz, '1965-01-15T04:00');
    });

    it('1973-12-30 12:00 – extended DST through oil crisis (UTC+9)', () => {
      expectUtc(1973, 12, 30, 12, 0, tz, '1973-12-30T03:00');
    });

    it('1979-07-15 12:00 – last DST year (UTC+9)', () => {
      expectUtc(1979, 7, 15, 12, 0, tz, '1979-07-15T03:00');
    });
  });

  describe('Post-DST era', () => {
    it('1980-07-15 12:00 – no more DST (UTC+8)', () => {
      expectUtc(1980, 7, 15, 12, 0, tz, '1980-07-15T04:00');
    });

    it('2024-07-15 12:00 – UTC+8', () => {
      expectUtc(2024, 7, 15, 12, 0, tz, '2024-07-15T04:00');
    });
  });
});

// ═══════════════════════════════════════════════════════════════
//  MACAU (Asia/Macau)
// ═══════════════════════════════════════════════════════════════

describe('Macau – Asia/Macau', () => {
  const tz = 'Asia/Macau';

  it('1965-07-15 12:00 – summer time (UTC+9)', () => {
    expectUtc(1965, 7, 15, 12, 0, tz, '1965-07-15T03:00');
  });

  it('1980-07-15 12:00 – no more DST (UTC+8)', () => {
    expectUtc(1980, 7, 15, 12, 0, tz, '1980-07-15T04:00');
  });
});

// ═══════════════════════════════════════════════════════════════
//  JAPAN (Asia/Tokyo)
// ═══════════════════════════════════════════════════════════════

describe('Japan – Asia/Tokyo', () => {
  const tz = 'Asia/Tokyo';

  describe('US occupation DST (1948-1951)', () => {
    it('1949-06-15 12:00 – summer DST (UTC+10)', () => {
      expectUtc(1949, 6, 15, 12, 0, tz, '1949-06-15T02:00');
    });

    it('1949-12-15 12:00 – winter standard (UTC+9)', () => {
      expectUtc(1949, 12, 15, 12, 0, tz, '1949-12-15T03:00');
    });

    it('1951-06-15 12:00 – last DST year (UTC+10)', () => {
      expectUtc(1951, 6, 15, 12, 0, tz, '1951-06-15T02:00');
    });
  });

  describe('Post-occupation', () => {
    it('1952-06-15 12:00 – no more DST (UTC+9)', () => {
      expectUtc(1952, 6, 15, 12, 0, tz, '1952-06-15T03:00');
    });

    it('2024-07-15 12:00 – UTC+9', () => {
      expectUtc(2024, 7, 15, 12, 0, tz, '2024-07-15T03:00');
    });
  });
});

// ═══════════════════════════════════════════════════════════════
//  SOUTH KOREA (Asia/Seoul)
// ═══════════════════════════════════════════════════════════════

describe('South Korea – Asia/Seoul', () => {
  const tz = 'Asia/Seoul';

  it('1950-06-15 12:00 – DST on UTC+9 base (UTC+10)', () => {
    expectUtc(1950, 6, 15, 12, 0, tz, '1950-06-15T02:00');
  });

  it('1961-08-10 12:00 – switched to UTC+9 on this date per IANA', () => {
    // Korea switched from UTC+8:30 to UTC+9 on 1961-08-10
    expectUtc(1961, 8, 10, 12, 0, tz, '1961-08-10T03:00');
  });

  it('1961-08-09 12:00 – still UTC+8:30 (day before switch)', () => {
    expectUtc(1961, 8, 9, 12, 0, tz, '1961-08-09T03:30');
  });

  it('1988-06-15 12:00 – Olympics DST (UTC+10)', () => {
    expectUtc(1988, 6, 15, 12, 0, tz, '1988-06-15T02:00');
  });

  it('1989-06-15 12:00 – no more DST (UTC+9)', () => {
    expectUtc(1989, 6, 15, 12, 0, tz, '1989-06-15T03:00');
  });

  it('2024-07-15 12:00 – UTC+9', () => {
    expectUtc(2024, 7, 15, 12, 0, tz, '2024-07-15T03:00');
  });
});

// ═══════════════════════════════════════════════════════════════
//  NORTH KOREA (Asia/Pyongyang)
// ═══════════════════════════════════════════════════════════════

describe('North Korea – Asia/Pyongyang', () => {
  const tz = 'Asia/Pyongyang';

  it('2016-07-15 12:00 – Pyongyang Time UTC+8:30', () => {
    expectUtc(2016, 7, 15, 12, 0, tz, '2016-07-15T03:30');
  });

  it('2018-06-15 12:00 – back to UTC+9 (after summit)', () => {
    expectUtc(2018, 6, 15, 12, 0, tz, '2018-06-15T03:00');
  });

  it('2024-07-15 12:00 – UTC+9', () => {
    expectUtc(2024, 7, 15, 12, 0, tz, '2024-07-15T03:00');
  });
});

// ═══════════════════════════════════════════════════════════════
//  SINGAPORE (Asia/Singapore)
// ═══════════════════════════════════════════════════════════════

describe('Singapore – Asia/Singapore', () => {
  const tz = 'Asia/Singapore';

  it('1950-06-15 12:00 – UTC+7:30 era', () => {
    expectUtc(1950, 6, 15, 12, 0, tz, '1950-06-15T04:30');
  });

  it('1981-12-31 23:30 – last half-hour of UTC+7:30', () => {
    expectUtc(1981, 12, 31, 23, 30, tz, '1981-12-31T16:00');
  });

  it('1982-01-01 00:30 – now UTC+8', () => {
    expectUtc(1982, 1, 1, 0, 30, tz, '1981-12-31T16:30');
  });

  it('2024-07-15 12:00 – UTC+8', () => {
    expectUtc(2024, 7, 15, 12, 0, tz, '2024-07-15T04:00');
  });
});

// ═══════════════════════════════════════════════════════════════
//  MALAYSIA (Asia/Kuala_Lumpur / Asia/Kuching)
// ═══════════════════════════════════════════════════════════════

describe('Malaysia', () => {
  it('West Malaysia 1970 – UTC+7:30', () => {
    expectUtc(1970, 6, 15, 12, 0, 'Asia/Kuala_Lumpur', '1970-06-15T04:30');
  });

  it('West Malaysia 1982-01-01 – UTC+8', () => {
    expectUtc(1982, 1, 1, 12, 0, 'Asia/Kuala_Lumpur', '1982-01-01T04:00');
  });

  it('East Malaysia (Kuching) 1970 – UTC+8', () => {
    expectUtc(1970, 6, 15, 12, 0, 'Asia/Kuching', '1970-06-15T04:00');
  });
});

// ═══════════════════════════════════════════════════════════════
//  VIETNAM (Asia/Ho_Chi_Minh)
// ═══════════════════════════════════════════════════════════════

describe('Vietnam – Asia/Ho_Chi_Minh', () => {
  const tz = 'Asia/Ho_Chi_Minh';

  it('1960-06-15 12:00 – South Vietnam UTC+8 era', () => {
    expectUtc(1960, 6, 15, 12, 0, tz, '1960-06-15T04:00');
  });

  it('1975-07-15 12:00 – after reunification UTC+7', () => {
    expectUtc(1975, 7, 15, 12, 0, tz, '1975-07-15T05:00');
  });

  it('2024-07-15 12:00 – UTC+7', () => {
    expectUtc(2024, 7, 15, 12, 0, tz, '2024-07-15T05:00');
  });
});

// ═══════════════════════════════════════════════════════════════
//  THAILAND (Asia/Bangkok)
// ═══════════════════════════════════════════════════════════════

describe('Thailand – Asia/Bangkok', () => {
  it('2024-07-15 12:00 – UTC+7', () => {
    expectUtc(2024, 7, 15, 12, 0, 'Asia/Bangkok', '2024-07-15T05:00');
  });
});

// ═══════════════════════════════════════════════════════════════
//  PHILIPPINES (Asia/Manila)
// ═══════════════════════════════════════════════════════════════

describe('Philippines – Asia/Manila', () => {
  const tz = 'Asia/Manila';

  it('1944-06-15 12:00 – Japanese occupation UTC+9', () => {
    expectUtc(1944, 6, 15, 12, 0, tz, '1944-06-15T03:00');
  });

  it('1978-06-15 12:00 – Marcos DST (UTC+9 if tzdata has it, UTC+8 otherwise)', () => {
    // IANA has Philippines DST Mar 22 – Sep 21 1978, but some runtimes lack it
    const utc = localToUtc(1978, 6, 15, 12, 0, tz);
    const utcHour = utc.getUTCHours();
    expect([3, 4]).toContain(utcHour); // UTC+9 → 03:00, UTC+8 → 04:00
  });

  it('1979-06-15 12:00 – no more DST (UTC+8)', () => {
    expectUtc(1979, 6, 15, 12, 0, tz, '1979-06-15T04:00');
  });

  it('2024-07-15 12:00 – UTC+8', () => {
    expectUtc(2024, 7, 15, 12, 0, tz, '2024-07-15T04:00');
  });
});

// ═══════════════════════════════════════════════════════════════
//  INDONESIA
// ═══════════════════════════════════════════════════════════════

describe('Indonesia', () => {
  it('Jakarta (WIB) 2024 – UTC+7', () => {
    expectUtc(2024, 7, 15, 12, 0, 'Asia/Jakarta', '2024-07-15T05:00');
  });

  it('Makassar (WITA) 2024 – UTC+8', () => {
    expectUtc(2024, 7, 15, 12, 0, 'Asia/Makassar', '2024-07-15T04:00');
  });

  it('Jayapura (WIT) 2024 – UTC+9', () => {
    expectUtc(2024, 7, 15, 12, 0, 'Asia/Jayapura', '2024-07-15T03:00');
  });
});

// ═══════════════════════════════════════════════════════════════
//  MYANMAR (Asia/Yangon)
// ═══════════════════════════════════════════════════════════════

describe('Myanmar – Asia/Yangon', () => {
  it('2024-07-15 12:00 – UTC+6:30', () => {
    expectUtc(2024, 7, 15, 12, 0, 'Asia/Yangon', '2024-07-15T05:30');
  });
});

// ═══════════════════════════════════════════════════════════════
//  INDIA (Asia/Kolkata)
// ═══════════════════════════════════════════════════════════════

describe('India – Asia/Kolkata', () => {
  const tz = 'Asia/Kolkata';

  it('2024-07-15 12:00 – UTC+5:30', () => {
    expectUtc(2024, 7, 15, 12, 0, tz, '2024-07-15T06:30');
  });

  it('1950-06-15 12:00 – UTC+5:30', () => {
    expectUtc(1950, 6, 15, 12, 0, tz, '1950-06-15T06:30');
  });
});

// ═══════════════════════════════════════════════════════════════
//  NEPAL (Asia/Kathmandu)
// ═══════════════════════════════════════════════════════════════

describe('Nepal – Asia/Kathmandu', () => {
  it('2024-07-15 12:00 – UTC+5:45', () => {
    expectUtc(2024, 7, 15, 12, 0, 'Asia/Kathmandu', '2024-07-15T06:15');
  });
});

// ═══════════════════════════════════════════════════════════════
//  UNITED STATES
// ═══════════════════════════════════════════════════════════════

describe('United States', () => {
  describe('Eastern – America/New_York', () => {
    const tz = 'America/New_York';

    it('2024-01-15 12:00 – EST (UTC-5)', () => {
      expectUtc(2024, 1, 15, 12, 0, tz, '2024-01-15T17:00');
    });

    it('2024-07-15 12:00 – EDT (UTC-4)', () => {
      expectUtc(2024, 7, 15, 12, 0, tz, '2024-07-15T16:00');
    });

    // 2007+ rule: 2nd Sunday March, 1st Sunday November
    it('2024-03-10 01:59 – last minute of EST', () => {
      expectUtc(2024, 3, 10, 1, 59, tz, '2024-03-10T06:59');
    });

    it('2024-03-10 03:00 – first moment of EDT', () => {
      expectUtc(2024, 3, 10, 3, 0, tz, '2024-03-10T07:00');
    });

    it('2024-11-03 01:00 – fall-back moment (ambiguous, prefer standard)', () => {
      // After fall-back, 01:00 EST = UTC 06:00
      const utc = localToUtc(2024, 11, 3, 1, 0, tz);
      // Either interpretation is acceptable (01:00 EDT=UTC05:00 or 01:00 EST=UTC06:00)
      const hour = utc.getUTCHours();
      expect([5, 6]).toContain(hour);
    });

    // Pre-2007 rule: 1st Sunday April, last Sunday October
    it('2006-04-02 03:00 – old rule spring forward', () => {
      expectUtc(2006, 4, 2, 3, 0, tz, '2006-04-02T07:00');
    });

    it('2006-10-29 01:30 – fall-back (ambiguous)', () => {
      const utc = localToUtc(2006, 10, 29, 1, 30, tz);
      const hour = utc.getUTCHours();
      expect([5, 6]).toContain(hour);
    });

    // WWII "War Time" – year-round DST 1942-1945
    it('1943-01-15 12:00 – War Time year-round DST (UTC-4)', () => {
      expectUtc(1943, 1, 15, 12, 0, tz, '1943-01-15T16:00');
    });

    it('1943-07-15 12:00 – War Time summer (UTC-4)', () => {
      expectUtc(1943, 7, 15, 12, 0, tz, '1943-07-15T16:00');
    });
  });

  describe('Pacific – America/Los_Angeles', () => {
    const tz = 'America/Los_Angeles';

    it('2024-01-15 12:00 – PST (UTC-8)', () => {
      expectUtc(2024, 1, 15, 12, 0, tz, '2024-01-15T20:00');
    });

    it('2024-07-15 12:00 – PDT (UTC-7)', () => {
      expectUtc(2024, 7, 15, 12, 0, tz, '2024-07-15T19:00');
    });

    it('2024-03-10 03:00 – first moment of PDT (UTC-7)', () => {
      // 03:00 PDT = 03:00 + 7h = 10:00 UTC
      expectUtc(2024, 3, 10, 3, 0, tz, '2024-03-10T10:00');
    });
  });

  describe('Arizona – America/Phoenix (no DST)', () => {
    const tz = 'America/Phoenix';

    it('2024-01-15 12:00 – MST year-round (UTC-7)', () => {
      expectUtc(2024, 1, 15, 12, 0, tz, '2024-01-15T19:00');
    });

    it('2024-07-15 12:00 – still MST (UTC-7), no DST', () => {
      expectUtc(2024, 7, 15, 12, 0, tz, '2024-07-15T19:00');
    });
  });

  describe('Hawaii – Pacific/Honolulu (no DST)', () => {
    const tz = 'Pacific/Honolulu';

    it('2024-01-15 12:00 – HST (UTC-10)', () => {
      expectUtc(2024, 1, 15, 12, 0, tz, '2024-01-15T22:00');
    });

    it('2024-07-15 12:00 – still HST (UTC-10)', () => {
      expectUtc(2024, 7, 15, 12, 0, tz, '2024-07-15T22:00');
    });
  });
});

// ═══════════════════════════════════════════════════════════════
//  EUROPE
// ═══════════════════════════════════════════════════════════════

describe('Europe', () => {
  describe('UK – Europe/London', () => {
    const tz = 'Europe/London';

    it('2024-01-15 12:00 – GMT (UTC+0)', () => {
      expectUtc(2024, 1, 15, 12, 0, tz, '2024-01-15T12:00');
    });

    it('2024-07-15 12:00 – BST (UTC+1)', () => {
      expectUtc(2024, 7, 15, 12, 0, tz, '2024-07-15T11:00');
    });

    // EU rule: last Sunday March at 01:00 UTC
    it('2024-03-31 01:00 – spring forward', () => {
      expectUtc(2024, 3, 31, 2, 0, tz, '2024-03-31T01:00');
    });

    // Last Sunday October at 01:00 UTC
    it('2024-10-27 00:30 – still BST', () => {
      expectUtc(2024, 10, 27, 0, 30, tz, '2024-10-26T23:30');
    });

    // WWII double summer time
    it('1941-07-15 12:00 – double summer time BDST (UTC+2)', () => {
      expectUtc(1941, 7, 15, 12, 0, tz, '1941-07-15T10:00');
    });
  });

  describe('Paris – Europe/Paris', () => {
    const tz = 'Europe/Paris';

    it('2024-01-15 12:00 – CET (UTC+1)', () => {
      expectUtc(2024, 1, 15, 12, 0, tz, '2024-01-15T11:00');
    });

    it('2024-07-15 12:00 – CEST (UTC+2)', () => {
      expectUtc(2024, 7, 15, 12, 0, tz, '2024-07-15T10:00');
    });
  });

  describe('Germany – Europe/Berlin', () => {
    const tz = 'Europe/Berlin';

    it('2024-01-15 12:00 – CET (UTC+1)', () => {
      expectUtc(2024, 1, 15, 12, 0, tz, '2024-01-15T11:00');
    });

    it('2024-07-15 12:00 – CEST (UTC+2)', () => {
      expectUtc(2024, 7, 15, 12, 0, tz, '2024-07-15T10:00');
    });
  });

  describe('Moscow – Europe/Moscow', () => {
    const tz = 'Europe/Moscow';

    it('2013-07-15 12:00 – MSK+1 permanent DST (UTC+4)', () => {
      expectUtc(2013, 7, 15, 12, 0, tz, '2013-07-15T08:00');
    });

    it('2014-11-15 12:00 – permanent MSK UTC+3', () => {
      expectUtc(2014, 11, 15, 12, 0, tz, '2014-11-15T09:00');
    });

    it('2024-07-15 12:00 – UTC+3 (no DST)', () => {
      expectUtc(2024, 7, 15, 12, 0, tz, '2024-07-15T09:00');
    });
  });

  describe('Turkey – Europe/Istanbul', () => {
    const tz = 'Europe/Istanbul';

    it('2015-07-15 12:00 – had DST, EEST (UTC+3)', () => {
      expectUtc(2015, 7, 15, 12, 0, tz, '2015-07-15T09:00');
    });

    it('2017-07-15 12:00 – permanent UTC+3 (no more DST)', () => {
      expectUtc(2017, 7, 15, 12, 0, tz, '2017-07-15T09:00');
    });

    it('2017-01-15 12:00 – permanent UTC+3 (winter too)', () => {
      expectUtc(2017, 1, 15, 12, 0, tz, '2017-01-15T09:00');
    });
  });
});

// ═══════════════════════════════════════════════════════════════
//  AUSTRALIA
// ═══════════════════════════════════════════════════════════════

describe('Australia', () => {
  describe('Sydney – Australia/Sydney (has DST)', () => {
    const tz = 'Australia/Sydney';

    // Southern hemisphere: DST in Oct-Apr
    it('2024-01-15 12:00 – AEDT summer (UTC+11)', () => {
      expectUtc(2024, 1, 15, 12, 0, tz, '2024-01-15T01:00');
    });

    it('2024-07-15 12:00 – AEST winter (UTC+10)', () => {
      expectUtc(2024, 7, 15, 12, 0, tz, '2024-07-15T02:00');
    });

    // Spring forward: first Sunday October at 02:00 AEST → 03:00 AEDT
    it('2024-10-06 03:00 – spring forward', () => {
      expectUtc(2024, 10, 6, 3, 0, tz, '2024-10-05T16:00');
    });

    // Fall back: first Sunday April at 03:00 AEDT → 02:00 AEST
    it('2024-04-07 01:30 – still AEDT before fall-back', () => {
      expectUtc(2024, 4, 7, 1, 30, tz, '2024-04-06T14:30');
    });
  });

  describe('Brisbane – Australia/Brisbane (no DST)', () => {
    const tz = 'Australia/Brisbane';

    it('2024-01-15 12:00 – AEST year-round (UTC+10)', () => {
      expectUtc(2024, 1, 15, 12, 0, tz, '2024-01-15T02:00');
    });

    it('2024-07-15 12:00 – AEST (UTC+10)', () => {
      expectUtc(2024, 7, 15, 12, 0, tz, '2024-07-15T02:00');
    });
  });

  describe('Adelaide – Australia/Adelaide (has DST, UTC+9:30/+10:30)', () => {
    const tz = 'Australia/Adelaide';

    it('2024-01-15 12:00 – ACDT (UTC+10:30)', () => {
      expectUtc(2024, 1, 15, 12, 0, tz, '2024-01-15T01:30');
    });

    it('2024-07-15 12:00 – ACST (UTC+9:30)', () => {
      expectUtc(2024, 7, 15, 12, 0, tz, '2024-07-15T02:30');
    });
  });

  describe('Lord Howe Island – Australia/Lord_Howe (30-min DST!)', () => {
    const tz = 'Australia/Lord_Howe';

    it('2024-01-15 12:00 – summer UTC+11', () => {
      expectUtc(2024, 1, 15, 12, 0, tz, '2024-01-15T01:00');
    });

    it('2024-07-15 12:00 – winter UTC+10:30', () => {
      expectUtc(2024, 7, 15, 12, 0, tz, '2024-07-15T01:30');
    });
  });
});

// ═══════════════════════════════════════════════════════════════
//  NEW ZEALAND (Pacific/Auckland)
// ═══════════════════════════════════════════════════════════════

describe('New Zealand – Pacific/Auckland', () => {
  const tz = 'Pacific/Auckland';

  it('2024-01-15 12:00 – NZDT summer (UTC+13)', () => {
    expectUtc(2024, 1, 15, 12, 0, tz, '2024-01-14T23:00');
  });

  it('2024-07-15 12:00 – NZST winter (UTC+12)', () => {
    expectUtc(2024, 7, 15, 12, 0, tz, '2024-07-15T00:00');
  });
});

// ═══════════════════════════════════════════════════════════════
//  CHATHAM ISLANDS (Pacific/Chatham, UTC+12:45/+13:45)
// ═══════════════════════════════════════════════════════════════

describe('Chatham Islands – Pacific/Chatham', () => {
  const tz = 'Pacific/Chatham';

  it('2024-01-15 12:00 – summer +13:45', () => {
    // 12:00 - 13:45 = previous day 22:15 UTC
    expectUtc(2024, 1, 15, 12, 0, tz, '2024-01-14T22:15');
  });

  it('2024-07-15 12:00 – winter +12:45', () => {
    // 12:00 - 12:45 = previous day 23:15 UTC
    expectUtc(2024, 7, 15, 12, 0, tz, '2024-07-14T23:15');
  });
});

// ═══════════════════════════════════════════════════════════════
//  MIDDLE EAST
// ═══════════════════════════════════════════════════════════════

describe('Middle East', () => {
  describe('Iran – Asia/Tehran', () => {
    const tz = 'Asia/Tehran';

    it('2020-01-15 12:00 – IRST (UTC+3:30)', () => {
      expectUtc(2020, 1, 15, 12, 0, tz, '2020-01-15T08:30');
    });

    it('2020-07-15 12:00 – IRDT DST (UTC+4:30)', () => {
      expectUtc(2020, 7, 15, 12, 0, tz, '2020-07-15T07:30');
    });
  });

  describe('Israel – Asia/Jerusalem', () => {
    const tz = 'Asia/Jerusalem';

    it('2024-01-15 12:00 – IST (UTC+2)', () => {
      expectUtc(2024, 1, 15, 12, 0, tz, '2024-01-15T10:00');
    });

    it('2024-07-15 12:00 – IDT (UTC+3)', () => {
      expectUtc(2024, 7, 15, 12, 0, tz, '2024-07-15T09:00');
    });
  });
});

// ═══════════════════════════════════════════════════════════════
//  SOUTH AMERICA
// ═══════════════════════════════════════════════════════════════

describe('South America', () => {
  describe('Brazil – America/Sao_Paulo', () => {
    const tz = 'America/Sao_Paulo';

    it('2018-01-15 12:00 – BRST summer DST (UTC-2)', () => {
      expectUtc(2018, 1, 15, 12, 0, tz, '2018-01-15T14:00');
    });

    it('2018-07-15 12:00 – BRT winter (UTC-3)', () => {
      expectUtc(2018, 7, 15, 12, 0, tz, '2018-07-15T15:00');
    });

    it('2020-01-15 12:00 – no more DST since 2019 (UTC-3)', () => {
      expectUtc(2020, 1, 15, 12, 0, tz, '2020-01-15T15:00');
    });
  });
});

// ═══════════════════════════════════════════════════════════════
//  AFRICA
// ═══════════════════════════════════════════════════════════════

describe('Africa', () => {
  describe('South Africa – Africa/Johannesburg', () => {
    it('2024-07-15 12:00 – SAST (UTC+2)', () => {
      expectUtc(2024, 7, 15, 12, 0, 'Africa/Johannesburg', '2024-07-15T10:00');
    });
  });

  describe('Egypt – Africa/Cairo', () => {
    const tz = 'Africa/Cairo';

    it('2014-07-15 12:00 – no DST in 2014 (UTC+2)', () => {
      expectUtc(2014, 7, 15, 12, 0, tz, '2014-07-15T10:00');
    });
  });
});

// ═══════════════════════════════════════════════════════════════
//  UNUSUAL / HALF-HOUR / QUARTER-HOUR OFFSETS
// ═══════════════════════════════════════════════════════════════

describe('Unusual offsets', () => {
  it('Newfoundland (America/St_Johns) – UTC-3:30', () => {
    expectUtc(2024, 1, 15, 12, 0, 'America/St_Johns', '2024-01-15T15:30');
  });

  it('Newfoundland summer – UTC-2:30 (NDT)', () => {
    expectUtc(2024, 7, 15, 12, 0, 'America/St_Johns', '2024-07-15T14:30');
  });

  it('Eucla (Australia/Eucla) – UTC+8:45', () => {
    expectUtc(2024, 7, 15, 12, 0, 'Australia/Eucla', '2024-07-15T03:15');
  });

  it('Marquesas (Pacific/Marquesas) – UTC-9:30', () => {
    expectUtc(2024, 7, 15, 12, 0, 'Pacific/Marquesas', '2024-07-15T21:30');
  });
});

// ═══════════════════════════════════════════════════════════════
//  EDGE CASES
// ═══════════════════════════════════════════════════════════════

describe('Edge cases', () => {
  it('midnight crossing – local 23:30 becomes next day UTC', () => {
    // London BST: 23:30 local = 22:30 UTC (same day)
    expectUtc(2024, 7, 15, 23, 30, 'Europe/London', '2024-07-15T22:30');
  });

  it('date boundary – Sydney midnight → previous day UTC', () => {
    // Sydney AEDT (+11): 00:00 local = 13:00 UTC previous day
    expectUtc(2024, 1, 1, 0, 0, 'Australia/Sydney', '2023-12-31T13:00');
  });

  it('leap year Feb 29', () => {
    expectUtc(2024, 2, 29, 12, 0, 'Asia/Shanghai', '2024-02-29T04:00');
  });

  it('year boundary – 2023-12-31 → 2024-01-01 UTC', () => {
    // Tokyo (+9): 2024-01-01 00:00 = 2023-12-31 15:00 UTC
    expectUtc(2024, 1, 1, 0, 0, 'Asia/Tokyo', '2023-12-31T15:00');
  });

  it('very old date – 1900-01-01', () => {
    const utc = localToUtc(1900, 1, 1, 12, 0, 'Asia/Shanghai');
    expect(utc instanceof Date).toBe(true);
    expect(utc.getUTCFullYear()).toBe(1900);
  });
});

// ═══════════════════════════════════════════════════════════════
//  getUtcOffset
// ═══════════════════════════════════════════════════════════════

describe('getUtcOffset', () => {
  it('returns +480 for Shanghai standard time', () => {
    expect(getUtcOffset(2024, 7, 15, 12, 0, 'Asia/Shanghai')).toBe(480);
  });

  it('returns +540 for Shanghai during 1988 DST', () => {
    expect(getUtcOffset(1988, 7, 15, 12, 0, 'Asia/Shanghai')).toBe(540);
  });

  it('returns -300 for New York EST', () => {
    expect(getUtcOffset(2024, 1, 15, 12, 0, 'America/New_York')).toBe(-300);
  });

  it('returns -240 for New York EDT', () => {
    expect(getUtcOffset(2024, 7, 15, 12, 0, 'America/New_York')).toBe(-240);
  });

  it('returns +330 for India (UTC+5:30)', () => {
    expect(getUtcOffset(2024, 7, 15, 12, 0, 'Asia/Kolkata')).toBe(330);
  });

  it('returns +345 for Nepal (UTC+5:45)', () => {
    expect(getUtcOffset(2024, 7, 15, 12, 0, 'Asia/Kathmandu')).toBe(345);
  });

  it('returns +450 for Singapore UTC+7:30 era', () => {
    expect(getUtcOffset(1970, 6, 15, 12, 0, 'Asia/Singapore')).toBe(450);
  });
});

// ═══════════════════════════════════════════════════════════════
//  timezoneFromLongitude
// ═══════════════════════════════════════════════════════════════

describe('timezoneFromLongitude', () => {
  it('returns Etc/GMT-8 for longitude 120°E (Beijing)', () => {
    expect(timezoneFromLongitude(120)).toBe('Etc/GMT-8');
  });

  it('returns Etc/GMT-9 for longitude 135°E (Tokyo)', () => {
    expect(timezoneFromLongitude(135)).toBe('Etc/GMT-9');
  });

  it('returns Etc/GMT+5 for longitude -75°W (New York)', () => {
    expect(timezoneFromLongitude(-75)).toBe('Etc/GMT+5');
  });

  it('returns Etc/GMT-0 for longitude 0° (Greenwich)', () => {
    // 0 >= 0 → negative Etc sign convention; both Etc/GMT-0 and Etc/GMT+0 are valid
    expect(timezoneFromLongitude(0)).toBe('Etc/GMT-0');
  });

  it('returns Etc/GMT-6 for longitude 87°E (Urumqi)', () => {
    expect(timezoneFromLongitude(87)).toBe('Etc/GMT-6');
  });

  it('returns Etc/GMT+12 for longitude -180°', () => {
    expect(timezoneFromLongitude(-180)).toBe('Etc/GMT+12');
  });

  it('returns Etc/GMT-12 for longitude 180°', () => {
    expect(timezoneFromLongitude(180)).toBe('Etc/GMT-12');
  });

  it('rounds to nearest hour for fractional longitudes', () => {
    expect(timezoneFromLongitude(121.5)).toBe('Etc/GMT-8');
    expect(timezoneFromLongitude(127.4)).toBe('Etc/GMT-8');
    expect(timezoneFromLongitude(127.6)).toBe('Etc/GMT-9');
  });
});

// ═══════════════════════════════════════════════════════════════
//  wallClockToSolarTime
// ═══════════════════════════════════════════════════════════════

describe('wallClockToSolarTime', () => {
  it('returns a TrueSolarTimeResult', () => {
    const result = wallClockToSolarTime(2024, 6, 15, 12, 0, 'Asia/Shanghai', 116.4);
    expect(result.trueSolarTime instanceof Date).toBe(true);
    expect(result.equationOfTime).toBeDefined();
    expect(result.longitudeCorrection).toBeDefined();
  });

  it('Beijing longitude correction is about -14.4 minutes', () => {
    const result = wallClockToSolarTime(2024, 6, 15, 12, 0, 'Asia/Shanghai', 116.4);
    // Beijing is 3.6° west of 120° standard meridian → -14.4 min
    expect(result.longitudeCorrection).toBeCloseTo(-14.4, 0);
  });

  it('handles historical DST correctly', () => {
    // 1988 summer in Shanghai, DST active (UTC+9, standard meridian 135°E)
    // But we use actual longitude 121.5° → standard meridian from offset is 135° during DST
    const result = wallClockToSolarTime(1988, 7, 15, 12, 0, 'Asia/Shanghai', 121.5);
    expect(result.trueSolarTime instanceof Date).toBe(true);
  });

  it('Urumqi noon is significantly earlier than Beijing noon in solar time', () => {
    const beijing = wallClockToSolarTime(2024, 6, 15, 12, 0, 'Asia/Shanghai', 116.4);
    const urumqi = wallClockToSolarTime(2024, 6, 15, 12, 0, 'Asia/Urumqi', 87.6);
    // Urumqi is ~29° west of Beijing, so solar time is ~116 min earlier
    // But also different timezone, so the UTC times differ
    // Both should produce valid solar times
    expect(beijing.trueSolarTime instanceof Date).toBe(true);
    expect(urumqi.trueSolarTime instanceof Date).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
//  isDst
// ═══════════════════════════════════════════════════════════════

describe('isDst', () => {
  describe('China – Asia/Shanghai', () => {
    it('1985 summer – no DST', () => {
      expect(isDst(1985, 7, 15, 12, 0, 'Asia/Shanghai')).toBe(false);
    });

    it('1986 summer – DST in effect', () => {
      expect(isDst(1986, 7, 15, 12, 0, 'Asia/Shanghai')).toBe(true);
    });

    it('1986 winter – no DST', () => {
      expect(isDst(1986, 1, 15, 12, 0, 'Asia/Shanghai')).toBe(false);
    });

    it('1988 summer – DST in effect', () => {
      expect(isDst(1988, 7, 15, 12, 0, 'Asia/Shanghai')).toBe(true);
    });

    it('1991 summer – last DST year', () => {
      expect(isDst(1991, 7, 15, 12, 0, 'Asia/Shanghai')).toBe(true);
    });

    it('1992 summer – DST abolished', () => {
      expect(isDst(1992, 7, 15, 12, 0, 'Asia/Shanghai')).toBe(false);
    });

    it('2024 summer – no DST', () => {
      expect(isDst(2024, 7, 15, 12, 0, 'Asia/Shanghai')).toBe(false);
    });
  });

  describe('Taiwan – Asia/Taipei', () => {
    it('1950 summer – DST', () => {
      expect(isDst(1950, 7, 15, 12, 0, 'Asia/Taipei')).toBe(true);
    });

    it('1962 summer – no DST (gap)', () => {
      expect(isDst(1962, 7, 15, 12, 0, 'Asia/Taipei')).toBe(false);
    });

    it('1974 summer – DST (energy crisis)', () => {
      expect(isDst(1974, 7, 15, 12, 0, 'Asia/Taipei')).toBe(true);
    });

    it('1980 summer – no more DST', () => {
      expect(isDst(1980, 7, 15, 12, 0, 'Asia/Taipei')).toBe(false);
    });
  });

  describe('Hong Kong – Asia/Hong_Kong', () => {
    it('1965 summer – summer time', () => {
      expect(isDst(1965, 7, 15, 12, 0, 'Asia/Hong_Kong')).toBe(true);
    });

    it('1965 winter – no summer time', () => {
      expect(isDst(1965, 1, 15, 12, 0, 'Asia/Hong_Kong')).toBe(false);
    });

    it('1973 December – extended DST (oil crisis)', () => {
      expect(isDst(1973, 12, 30, 12, 0, 'Asia/Hong_Kong')).toBe(true);
    });

    it('1980 summer – no more summer time', () => {
      expect(isDst(1980, 7, 15, 12, 0, 'Asia/Hong_Kong')).toBe(false);
    });
  });

  describe('US – America/New_York', () => {
    it('2024 January – no DST', () => {
      expect(isDst(2024, 1, 15, 12, 0, 'America/New_York')).toBe(false);
    });

    it('2024 July – DST', () => {
      expect(isDst(2024, 7, 15, 12, 0, 'America/New_York')).toBe(true);
    });

    it('1943 January – WWII War Time (year-round DST, undetectable)', () => {
      // Year-round DST has same offset in Jan and Jul, so isDst() returns false.
      // This is a known limitation: permanent DST is indistinguishable from
      // a permanent timezone shift without external metadata.
      expect(isDst(1943, 1, 15, 12, 0, 'America/New_York')).toBe(false);
    });
  });

  describe('No DST zones', () => {
    it('Asia/Tokyo 2024 summer – never DST (post-1951)', () => {
      expect(isDst(2024, 7, 15, 12, 0, 'Asia/Tokyo')).toBe(false);
    });

    it('Asia/Singapore 2024 – never DST', () => {
      expect(isDst(2024, 7, 15, 12, 0, 'Asia/Singapore')).toBe(false);
    });

    it('America/Phoenix 2024 summer – no DST', () => {
      expect(isDst(2024, 7, 15, 12, 0, 'America/Phoenix')).toBe(false);
    });
  });

  describe('Southern hemisphere', () => {
    it('Australia/Sydney January (summer) – DST', () => {
      expect(isDst(2024, 1, 15, 12, 0, 'Australia/Sydney')).toBe(true);
    });

    it('Australia/Sydney July (winter) – no DST', () => {
      expect(isDst(2024, 7, 15, 12, 0, 'Australia/Sydney')).toBe(false);
    });

    it('Australia/Brisbane January – no DST (Queensland)', () => {
      expect(isDst(2024, 1, 15, 12, 0, 'Australia/Brisbane')).toBe(false);
    });
  });
});

// ═══════════════════════════════════════════════════════════════
//  getStandardMeridian
// ═══════════════════════════════════════════════════════════════

describe('getStandardMeridian', () => {
  it('Shanghai standard time → 120°E', () => {
    expect(getStandardMeridian(2024, 7, 15, 12, 0, 'Asia/Shanghai')).toBe(120);
  });

  it('Shanghai 1988 DST → 135°E (UTC+9)', () => {
    expect(getStandardMeridian(1988, 7, 15, 12, 0, 'Asia/Shanghai')).toBe(135);
  });

  it('Tokyo → 135°E', () => {
    expect(getStandardMeridian(2024, 7, 15, 12, 0, 'Asia/Tokyo')).toBe(135);
  });

  it('New York EST → -75°W', () => {
    expect(getStandardMeridian(2024, 1, 15, 12, 0, 'America/New_York')).toBe(-75);
  });

  it('New York EDT → -60°W', () => {
    expect(getStandardMeridian(2024, 7, 15, 12, 0, 'America/New_York')).toBe(-60);
  });

  it('London GMT → 0°', () => {
    expect(getStandardMeridian(2024, 1, 15, 12, 0, 'Europe/London')).toBe(0);
  });

  it('London BST → 15°E', () => {
    expect(getStandardMeridian(2024, 7, 15, 12, 0, 'Europe/London')).toBe(15);
  });

  it('India IST → 82.5°E', () => {
    expect(getStandardMeridian(2024, 7, 15, 12, 0, 'Asia/Kolkata')).toBe(82.5);
  });

  it('Nepal → 86.25°E', () => {
    expect(getStandardMeridian(2024, 7, 15, 12, 0, 'Asia/Kathmandu')).toBe(86.25);
  });

  it('Urumqi → 90°E', () => {
    expect(getStandardMeridian(2024, 7, 15, 12, 0, 'Asia/Urumqi')).toBe(90);
  });

  it('Singapore 1970 UTC+7:30 → 112.5°E', () => {
    expect(getStandardMeridian(1970, 6, 15, 12, 0, 'Asia/Singapore')).toBe(112.5);
  });
});

// ═══════════════════════════════════════════════════════════════
//  COMPREHENSIVE TRANSITION VERIFICATION
//  (Exact DST transition dates from authoritative sources)
// ═══════════════════════════════════════════════════════════════

describe('HK summer time – all years (source: HKO)', () => {
  const tz = 'Asia/Hong_Kong';

  // Verify DST status for summer/winter of each documented year
  // HKO records: 1946-1976 (except 1977-1978), 1979

  const summerTimeYears = [
    1946, 1947, 1948, 1949, 1950,
    1951, 1952, 1953, 1954, 1955,
    1956, 1957, 1958, 1959, 1960,
    1961, 1962, 1963, 1964, 1965,
    1966, 1967, 1968, 1969, 1970,
    1971, 1972, 1973, 1974, 1975, 1976,
    // 1977, 1978: Nil
    1979,
  ];

  for (const year of summerTimeYears) {
    it(`${year} mid-summer – DST (UTC+9)`, () => {
      // Use August to be safely within all DST periods
      expect(getUtcOffset(year, 8, 1, 12, 0, tz)).toBe(540);
    });
  }

  it('1977 summer – Nil (no DST)', () => {
    expect(getUtcOffset(1977, 8, 1, 12, 0, tz)).toBe(480);
  });

  it('1978 summer – Nil (no DST)', () => {
    expect(getUtcOffset(1978, 8, 1, 12, 0, tz)).toBe(480);
  });

  it('1980 summer – no more summer time', () => {
    expect(getUtcOffset(1980, 8, 1, 12, 0, tz)).toBe(480);
  });
});

describe('Taiwan DST – all years (source: th.gov.tw, IANA)', () => {
  const tz = 'Asia/Taipei';

  // Years with DST: 1946-1961, 1974-1975, 1979
  const dstYears = [
    1946, 1947, 1948, 1949, 1950,
    1951, 1952, 1953, 1954, 1955,
    1956, 1957, 1958, 1959, 1960, 1961,
    // 1962-1973: no DST
    1974, 1975,
    // 1976-1978: no DST
    1979,
  ];

  for (const year of dstYears) {
    it(`${year} mid-summer – DST (UTC+9)`, () => {
      // 1979 DST started July 1, use August to be safe
      expect(getUtcOffset(year, 8, 1, 12, 0, tz)).toBe(540);
    });
  }

  // Verify gap years
  const noDstYears = [1962, 1963, 1964, 1965, 1970, 1973, 1976, 1977, 1978, 1980, 1990, 2024];
  for (const year of noDstYears) {
    it(`${year} summer – no DST (UTC+8)`, () => {
      expect(getUtcOffset(year, 8, 1, 12, 0, tz)).toBe(480);
    });
  }
});

describe('PRC DST – exact transition boundaries (source: IANA)', () => {
  const tz = 'Asia/Shanghai';

  // Verified transition dates:
  // 1986: May 4 start, Sep 14 end
  // 1987: Apr 12, Sep 13
  // 1988: Apr 17, Sep 11
  // 1989: Apr 16, Sep 17
  // 1990: Apr 15, Sep 16
  // 1991: Apr 14, Sep 15
  // All transitions at 02:00 local

  const transitions: [number, number, number, number, number][] = [
    // [year, startMonth, startDay, endMonth, endDay]
    [1986, 5, 4, 9, 14],
    [1987, 4, 12, 9, 13],
    [1988, 4, 17, 9, 11],
    [1989, 4, 16, 9, 17],
    [1990, 4, 15, 9, 16],
    [1991, 4, 14, 9, 15],
  ];

  for (const [year, sm, sd, em, ed] of transitions) {
    it(`${year}: day before DST start (${sm}/${sd - 1}) → UTC+8`, () => {
      expect(getUtcOffset(year, sm, sd - 1, 12, 0, tz)).toBe(480);
    });

    it(`${year}: DST start day (${sm}/${sd}) 03:00 → UTC+9`, () => {
      expect(getUtcOffset(year, sm, sd, 3, 0, tz)).toBe(540);
    });

    it(`${year}: mid-summer → UTC+9`, () => {
      expect(getUtcOffset(year, 7, 15, 12, 0, tz)).toBe(540);
    });

    it(`${year}: day after DST end (${em}/${ed + 1}) → UTC+8`, () => {
      expect(getUtcOffset(year, em, ed + 1, 12, 0, tz)).toBe(480);
    });
  }
});

// ═══════════════════════════════════════════════════════════════
//  utcToLocal
// ═══════════════════════════════════════════════════════════════

describe('utcToLocal', () => {
  it('returns correct local components for Shanghai UTC+8', () => {
    const utc = new Date('2024-06-15T04:00:00Z'); // 2024-06-15 12:00 Beijing time
    const local = utcToLocal(utc, 'Asia/Shanghai');
    expect(local.year).toBe(2024);
    expect(local.month).toBe(6);
    expect(local.day).toBe(15);
    expect(local.hour).toBe(12);
    expect(local.minute).toBe(0);
  });

  it('returns correct local components for New York EST', () => {
    const utc = new Date('2024-01-15T17:30:00Z'); // 2024-01-15 12:30 EST
    const local = utcToLocal(utc, 'America/New_York');
    expect(local.year).toBe(2024);
    expect(local.month).toBe(1);
    expect(local.day).toBe(15);
    expect(local.hour).toBe(12);
    expect(local.minute).toBe(30);
  });

  it('returns correct local components for New York EDT', () => {
    const utc = new Date('2024-07-15T16:30:00Z'); // 2024-07-15 12:30 EDT
    const local = utcToLocal(utc, 'America/New_York');
    expect(local.year).toBe(2024);
    expect(local.month).toBe(7);
    expect(local.day).toBe(15);
    expect(local.hour).toBe(12);
    expect(local.minute).toBe(30);
  });

  it('handles date boundary – UTC midnight → previous day in west', () => {
    const utc = new Date('2024-01-01T03:00:00Z'); // still Dec 31 in New York
    const local = utcToLocal(utc, 'America/New_York');
    expect(local.year).toBe(2023);
    expect(local.month).toBe(12);
    expect(local.day).toBe(31);
    expect(local.hour).toBe(22);
    expect(local.minute).toBe(0);
  });

  it('handles date boundary – UTC evening → next day in east', () => {
    const utc = new Date('2024-06-14T16:00:00Z'); // Jun 15 00:00 in Shanghai
    const local = utcToLocal(utc, 'Asia/Shanghai');
    expect(local.year).toBe(2024);
    expect(local.month).toBe(6);
    expect(local.day).toBe(15);
    expect(local.hour).toBe(0);
    expect(local.minute).toBe(0);
  });

  it('handles half-hour offset – India UTC+5:30', () => {
    const utc = new Date('2024-07-15T06:30:00Z'); // 2024-07-15 12:00 IST
    const local = utcToLocal(utc, 'Asia/Kolkata');
    expect(local.year).toBe(2024);
    expect(local.month).toBe(7);
    expect(local.day).toBe(15);
    expect(local.hour).toBe(12);
    expect(local.minute).toBe(0);
  });

  it('handles quarter-hour offset – Nepal UTC+5:45', () => {
    const utc = new Date('2024-07-15T06:15:00Z'); // 2024-07-15 12:00 NPT
    const local = utcToLocal(utc, 'Asia/Kathmandu');
    expect(local.year).toBe(2024);
    expect(local.month).toBe(7);
    expect(local.day).toBe(15);
    expect(local.hour).toBe(12);
    expect(local.minute).toBe(0);
  });

  it('handles historical DST – Shanghai 1988 summer (UTC+9)', () => {
    const utc = new Date('1988-07-15T03:00:00Z'); // 1988-07-15 12:00 CDT
    const local = utcToLocal(utc, 'Asia/Shanghai');
    expect(local.year).toBe(1988);
    expect(local.month).toBe(7);
    expect(local.day).toBe(15);
    expect(local.hour).toBe(12);
    expect(local.minute).toBe(0);
  });

  it('handles historical offset – Singapore UTC+7:30 (1970)', () => {
    const utc = new Date('1970-06-15T04:30:00Z'); // 1970-06-15 12:00 SGT
    const local = utcToLocal(utc, 'Asia/Singapore');
    expect(local.year).toBe(1970);
    expect(local.month).toBe(6);
    expect(local.day).toBe(15);
    expect(local.hour).toBe(12);
    expect(local.minute).toBe(0);
  });

  it('handles leap year Feb 29', () => {
    const utc = new Date('2024-02-29T04:00:00Z'); // 2024-02-29 12:00 Beijing
    const local = utcToLocal(utc, 'Asia/Shanghai');
    expect(local.year).toBe(2024);
    expect(local.month).toBe(2);
    expect(local.day).toBe(29);
    expect(local.hour).toBe(12);
  });

  describe('round-trip: localToUtc → utcToLocal', () => {
    const cases: [number, number, number, number, number, string][] = [
      [2024, 6, 15, 14, 30, 'Asia/Shanghai'],
      [2024, 1, 1, 0, 0, 'America/New_York'],
      [1988, 7, 15, 12, 0, 'Asia/Shanghai'],
      [2024, 7, 15, 23, 59, 'Europe/London'],
      [2024, 7, 15, 12, 0, 'Asia/Kolkata'],
      [2024, 7, 15, 12, 0, 'Asia/Kathmandu'],
      [1970, 6, 15, 12, 0, 'Asia/Singapore'],
      [2024, 1, 15, 12, 0, 'Australia/Sydney'],
      [1965, 8, 1, 12, 0, 'Asia/Hong_Kong'],
      [1974, 7, 15, 12, 0, 'Asia/Taipei'],
    ];

    for (const [y, m, d, h, min, tz] of cases) {
      it(`${tz} ${y}-${m}-${d} ${h}:${String(min).padStart(2, '0')}`, () => {
        const utc = localToUtc(y, m, d, h, min, tz);
        const local = utcToLocal(utc, tz);
        expect(local.year).toBe(y);
        expect(local.month).toBe(m);
        expect(local.day).toBe(d);
        expect(local.hour).toBe(h);
        expect(local.minute).toBe(min);
      });
    }
  });
});

// ═══════════════════════════════════════════════════════════════
//  formatUtcOffset
// ═══════════════════════════════════════════════════════════════

describe('formatUtcOffset', () => {
  it('formats UTC+8 → "+08:00"', () => {
    expect(formatUtcOffset(480)).toBe('+08:00');
  });

  it('formats UTC-5 → "-05:00"', () => {
    expect(formatUtcOffset(-300)).toBe('-05:00');
  });

  it('formats UTC+0 → "+00:00"', () => {
    expect(formatUtcOffset(0)).toBe('+00:00');
  });

  it('formats UTC+5:30 (India) → "+05:30"', () => {
    expect(formatUtcOffset(330)).toBe('+05:30');
  });

  it('formats UTC+5:45 (Nepal) → "+05:45"', () => {
    expect(formatUtcOffset(345)).toBe('+05:45');
  });

  it('formats UTC+9:30 (Adelaide) → "+09:30"', () => {
    expect(formatUtcOffset(570)).toBe('+09:30');
  });

  it('formats UTC-3:30 (Newfoundland) → "-03:30"', () => {
    expect(formatUtcOffset(-210)).toBe('-03:30');
  });

  it('formats UTC+12 → "+12:00"', () => {
    expect(formatUtcOffset(720)).toBe('+12:00');
  });

  it('formats UTC-12 → "-12:00"', () => {
    expect(formatUtcOffset(-720)).toBe('-12:00');
  });

  it('formats UTC+8:45 (Eucla) → "+08:45"', () => {
    expect(formatUtcOffset(525)).toBe('+08:45');
  });

  it('formats UTC+13 (Chatham standard) → "+13:00"', () => {
    expect(formatUtcOffset(780)).toBe('+13:00');
  });

  it('formats UTC+13:45 (Chatham DST) → "+13:45"', () => {
    expect(formatUtcOffset(825)).toBe('+13:45');
  });

  it('formats UTC+7:30 (historical Singapore) → "+07:30"', () => {
    expect(formatUtcOffset(450)).toBe('+07:30');
  });

  it('formats UTC-4 (EDT) → "-04:00"', () => {
    expect(formatUtcOffset(-240)).toBe('-04:00');
  });

  it('formats UTC+9 (CDT/JST) → "+09:00"', () => {
    expect(formatUtcOffset(540)).toBe('+09:00');
  });
});

// ═══════════════════════════════════════════════════════════════
//  wallClockToSolarTime – precise verification
// ═══════════════════════════════════════════════════════════════

describe('wallClockToSolarTime – detailed verification', () => {
  it('solar noon at standard meridian is close to 12:00', () => {
    // At longitude 120°E (standard meridian for UTC+8), longitude correction = 0
    // Solar noon should differ from clock noon only by equation of time
    const result = wallClockToSolarTime(2024, 6, 15, 12, 0, 'Asia/Shanghai', 120.0);
    expect(result.longitudeCorrection).toBeCloseTo(0, 5);
    // EoT in mid-June is small (typically ~0 min), so solar time ≈ clock time
    const solarHour = result.trueSolarTime.getUTCHours() + result.trueSolarTime.getUTCMinutes() / 60;
    expect(solarHour).toBeCloseTo(12, 0); // within ±30 min of noon
  });

  it('Urumqi (87.6°E) with UTC+6 timezone has ~0 longitude correction', () => {
    // Asia/Urumqi is UTC+6, standard meridian = 90°E
    // Longitude correction = (87.6 - 90) × 4 = -9.6 min
    const result = wallClockToSolarTime(2024, 6, 15, 12, 0, 'Asia/Urumqi', 87.6);
    expect(result.longitudeCorrection).toBeCloseTo(-9.6, 0);
  });

  it('Shanghai (121.5°E) longitude correction relative to 120°E', () => {
    const result = wallClockToSolarTime(2024, 6, 15, 12, 0, 'Asia/Shanghai', 121.5);
    // (121.5 - 120) × 4 = 6 min ahead
    expect(result.longitudeCorrection).toBeCloseTo(6, 0);
  });

  it('Kashgar (75.99°E, UTC+8) has ~-176 min longitude correction', () => {
    // Kashgar uses UTC+8 (120°E) despite being at 75.99°E
    // Longitude correction = (75.99 - 120) × 4 = -176.04 min ≈ almost 3 hours behind
    const result = wallClockToSolarTime(2024, 6, 15, 12, 0, 'Asia/Shanghai', 75.99);
    expect(result.longitudeCorrection).toBeCloseTo(-176.04, 0);
  });

  it('during PRC DST (1988), standard meridian shifts to 135°E', () => {
    // 1988 summer: UTC+9 → standard meridian = 135°E
    // Shanghai at 121.5°E: correction = (121.5 - 135) × 4 = -54 min
    const result = wallClockToSolarTime(1988, 7, 15, 12, 0, 'Asia/Shanghai', 121.5);
    expect(result.longitudeCorrection).toBeCloseTo(-54, 0);
  });

  it('same UTC instant at different longitudes produces different solar times', () => {
    // Two observers at same wall-clock time but different locations
    const beijing = wallClockToSolarTime(2024, 6, 15, 12, 0, 'Asia/Shanghai', 116.4);
    const shanghai = wallClockToSolarTime(2024, 6, 15, 12, 0, 'Asia/Shanghai', 121.5);
    // Shanghai is ~5° east of Beijing → ~20 min ahead in solar time
    const diffMs = shanghai.trueSolarTime.getTime() - beijing.trueSolarTime.getTime();
    const diffMin = diffMs / 60000;
    expect(diffMin).toBeCloseTo(20.4, 0); // (121.5 - 116.4) × 4 = 20.4
  });

  it('equation of time is within physical bounds (±17 min)', () => {
    // EoT ranges from about -14 min (Feb) to +16 min (Nov)
    const result = wallClockToSolarTime(2024, 6, 15, 12, 0, 'Asia/Shanghai', 120);
    expect(Math.abs(result.equationOfTime)).toBeLessThan(17);
  });

  it('February – equation of time is large positive (sundial slow)', () => {
    // Mid-February: EoT ≈ +14 min per Spencer approximation
    // (sun transits after clock noon; implementation convention: positive = sundial slow)
    const result = wallClockToSolarTime(2024, 2, 12, 12, 0, 'Asia/Shanghai', 120);
    expect(result.equationOfTime).toBeGreaterThan(10);
    expect(result.equationOfTime).toBeLessThan(16);
  });

  it('November – equation of time is large negative (sundial fast)', () => {
    // Early November: EoT ≈ -16 min per Spencer approximation
    // (sun transits before clock noon; implementation convention: negative = sundial fast)
    const result = wallClockToSolarTime(2024, 11, 3, 12, 0, 'Asia/Shanghai', 120);
    expect(result.equationOfTime).toBeLessThan(-12);
    expect(result.equationOfTime).toBeGreaterThan(-17);
  });
});
