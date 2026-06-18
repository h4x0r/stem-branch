import { describe, it, expect } from 'vitest';
import {
  computeFirdaria,
  computeProfection,
  findPrenatalSyzygy,
  findHyleg,
  findAlcochoden,
} from '../src/time-lords';

describe('computeFirdaria', () => {
  const birth = new Date('2000-01-01T00:00:00Z');

  it('day chart: ruler is Sun during first 10 years', () => {
    const query = new Date('2005-06-15T00:00:00Z');
    const result = computeFirdaria(birth, true, query);
    expect(result.ruler).toBe('Sun');
  });

  it('day chart: ruler is Moon during years 10-19', () => {
    const query = new Date('2012-06-15T00:00:00Z');
    const result = computeFirdaria(birth, true, query);
    expect(result.ruler).toBe('Moon');
  });

  it('night chart: ruler is Moon during first 9 years', () => {
    const query = new Date('2005-06-15T00:00:00Z');
    const result = computeFirdaria(birth, false, query);
    expect(result.ruler).toBe('Moon');
  });

  it('returns valid startDate < endDate with queryDate between them', () => {
    const query = new Date('2005-06-15T00:00:00Z');
    const result = computeFirdaria(birth, true, query);
    expect(result.startDate.getTime()).toBeLessThan(result.endDate.getTime());
    expect(query.getTime()).toBeGreaterThanOrEqual(result.startDate.getTime());
    expect(query.getTime()).toBeLessThan(result.endDate.getTime());
  });
});

describe('computeProfection', () => {
  it('age 0: house = 1, sign = natal ASC sign', () => {
    const birth = new Date('2000-01-01T00:00:00Z');
    const query = new Date('2000-06-15T00:00:00Z'); // still age 0
    const result = computeProfection(birth, query, 0); // 0 degrees = Aries
    expect(result.house).toBe(1);
    expect(result.sign).toBe('Aries');
  });

  it('age 12: full cycle back to house 1', () => {
    const birth = new Date('2000-01-01T00:00:00Z');
    const query = new Date('2012-06-15T00:00:00Z'); // age 12
    const result = computeProfection(birth, query, 0);
    expect(result.house).toBe(1);
  });

  it('age 30: house = (30 % 12) + 1 = 7', () => {
    const birth = new Date('2000-01-01T00:00:00Z');
    const query = new Date('2030-06-15T00:00:00Z'); // age 30
    const result = computeProfection(birth, query, 0);
    expect(result.house).toBe(7);
  });

  it('age 3 from 0 degrees Aries ASC: Cancer, lord = Moon', () => {
    const birth = new Date('2000-01-01T00:00:00Z');
    const query = new Date('2003-06-15T00:00:00Z'); // age 3
    const result = computeProfection(birth, query, 0); // 0 = Aries
    expect(result.sign).toBe('Cancer');
    expect(result.lord).toBe('Moon');
  });
});

describe('findPrenatalSyzygy', () => {
  it('returns type "new" for a date shortly after a known new moon', () => {
    // 2000 Jan 6 is the k=0 new moon reference epoch
    // Use a date a few days after
    const birth = new Date('2000-01-10T00:00:00Z');
    const result = findPrenatalSyzygy(birth);
    expect(result.type).toBe('new');
  });

  it('returns a date before birthDate', () => {
    const birth = new Date('2000-03-15T00:00:00Z');
    const result = findPrenatalSyzygy(birth);
    expect(result.date.getTime()).toBeLessThan(birth.getTime());
  });
});

describe('findHyleg', () => {
  it('Sun in house 10 (day chart) returns Sun', () => {
    const positions = [
      { body: 'Sun', house: 10 },
      { body: 'Moon', house: 3 },
    ];
    expect(findHyleg(positions, true)).toBe('Sun');
  });

  it('Sun in house 3, Moon in house 1 (day chart) returns Moon', () => {
    const positions = [
      { body: 'Sun', house: 3 },
      { body: 'Moon', house: 1 },
    ];
    expect(findHyleg(positions, true)).toBe('Moon');
  });

  it('no bodies in hylegical places returns null', () => {
    const positions = [
      { body: 'Sun', house: 6 },
      { body: 'Moon', house: 8 },
    ];
    expect(findHyleg(positions, true)).toBeNull();
  });
});

describe('findAlcochoden', () => {
  it('Sun degree in Leo returns Sun with high dignity score', () => {
    // Sun rules Leo, so Sun at 15 Leo should have high dignity
    const result = findAlcochoden('Leo', 15, true);
    expect(result).toBe('Sun');
  });
});

describe('computeFirdaria — night chart', () => {
  it('uses NIGHT_FIRDARIA sequence for night births', () => {
    const birth = new Date('1990-01-15T23:00:00Z'); // night time
    const query = new Date('1990-02-15T00:00:00Z');
    const result = computeFirdaria(birth, false, query); // isDayChart = false
    // Night sequence starts with Moon
    expect(result.ruler).toBe('Moon');
  });
});

describe('findPrenatalSyzygy — close to new moon', () => {
  it('handles birth shortly after a new moon', () => {
    // New moon on 2024-01-11T11:57Z — birth a few hours later
    const birth = new Date('2024-01-11T15:00:00Z');
    const result = findPrenatalSyzygy(birth);
    expect(result.type).toBe('new');
    expect(result.date.getTime()).toBeLessThan(birth.getTime());
  });

  it('handles birth shortly before next new moon (full moon is prenatal syzygy)', () => {
    // Full moon on 2024-01-25T17:54Z, next new moon ~Feb 9
    const birth = new Date('2024-02-08T00:00:00Z');
    const result = findPrenatalSyzygy(birth);
    expect(result.type).toBe('full');
    expect(result.date.getTime()).toBeLessThan(birth.getTime());
  });

  it('handles k overshoot: birth just before a new moon triggers k-- adjustment', () => {
    // New moon on 2024-02-09T22:59Z — birth 1 hour before it
    // Initial k estimate may land on or past the new moon, requiring k--
    const birth = new Date('2024-02-09T22:00:00Z');
    const result = findPrenatalSyzygy(birth);
    expect(result.date.getTime()).toBeLessThan(birth.getTime());
    // The prenatal syzygy should be the full moon before this (~Jan 25)
    expect(result.type).toBe('full');
  });

  it('handles k overshoot: birth moments after midnight following a new moon', () => {
    // New moon on 2024-04-08T18:21Z — birth just minutes after
    // The truncation in k = Math.floor(...) might overshoot for edge-case dates
    const birth = new Date('2024-04-08T18:30:00Z');
    const result = findPrenatalSyzygy(birth);
    expect(result.date.getTime()).toBeLessThan(birth.getTime());
  });
});
