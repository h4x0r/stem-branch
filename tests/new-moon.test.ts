import { describe, it, expect } from 'vitest';
import { newMoonJDE, findNewMoonsInRange } from '../src/new-moon';
import { deltaTForYear } from '../src/delta-t';

/**
 * Reference new moon dates (UTC) from USNO/timeanddate.com.
 * Format: [year, month, day, hour, minute]
 */
const NEW_MOONS_2024: [number, number, number, number, number][] = [
  [2024, 1, 11, 11, 57],
  [2024, 2, 9, 22, 59],
  [2024, 3, 10, 9, 0],
  [2024, 4, 8, 18, 21],
  [2024, 5, 8, 3, 22],
  [2024, 6, 6, 12, 38],
  [2024, 7, 5, 22, 57],
  [2024, 8, 4, 11, 13],
  [2024, 9, 3, 1, 56],
  [2024, 10, 2, 18, 49],
  [2024, 11, 1, 12, 47],
  [2024, 12, 1, 6, 22],
  [2024, 12, 30, 22, 27],
];

const NEW_MOONS_2000: [number, number, number, number, number][] = [
  [2000, 1, 6, 18, 14],
  [2000, 2, 5, 13, 3],
  [2000, 3, 6, 5, 17],
  [2000, 4, 4, 18, 12],
  [2000, 5, 4, 4, 12],
  [2000, 6, 2, 12, 14],
  [2000, 7, 1, 19, 20],
  [2000, 7, 31, 2, 25],
  [2000, 8, 29, 10, 19],
  [2000, 9, 27, 19, 53],
  [2000, 10, 27, 7, 58],
  [2000, 11, 25, 23, 11],
  [2000, 12, 25, 17, 22],
];

function jdeToUTCDate(jde: number, year: number): Date {
  const dt = deltaTForYear(year);
  const jdUT = jde - dt / 86400;
  return new Date((jdUT - 2440587.5) * 86400000);
}

function refToDate(ref: [number, number, number, number, number]): Date {
  return new Date(Date.UTC(ref[0], ref[1] - 1, ref[2], ref[3], ref[4]));
}

describe('newMoonJDE', () => {
  it('k=0 gives new moon near 2000 Jan 6', () => {
    const jde = newMoonJDE(0);
    const date = jdeToUTCDate(jde, 2000);
    const ref = refToDate(NEW_MOONS_2000[0]);
    const diffMinutes = Math.abs(date.getTime() - ref.getTime()) / 60000;
    expect(diffMinutes).toBeLessThan(2); // within 2 minutes
  });

  it('k=1 gives new moon near 2000 Feb 5', () => {
    const jde = newMoonJDE(1);
    const date = jdeToUTCDate(jde, 2000);
    const ref = refToDate(NEW_MOONS_2000[1]);
    const diffMinutes = Math.abs(date.getTime() - ref.getTime()) / 60000;
    expect(diffMinutes).toBeLessThan(2);
  });

  it('negative k gives earlier new moons', () => {
    const jde0 = newMoonJDE(0);
    const jdeMinus1 = newMoonJDE(-1);
    expect(jde0 - jdeMinus1).toBeCloseTo(29.53, 0); // ~1 synodic month
  });
});

describe('newMoonJDE — 2024 validation', () => {
  // k for Jan 2024 ≈ (2024.04 - 2000) * 12.3685 ≈ 297
  const kBase = Math.round((2024.04 - 2000) * 12.3685);

  it('all 13 new moons in 2024 match USNO within 2 minutes', () => {
    for (let i = 0; i < NEW_MOONS_2024.length; i++) {
      const k = kBase + i;
      const jde = newMoonJDE(k);
      const computed = jdeToUTCDate(jde, 2024);
      const ref = refToDate(NEW_MOONS_2024[i]);
      const diffMinutes = Math.abs(computed.getTime() - ref.getTime()) / 60000;
      expect(diffMinutes).toBeLessThan(2);
    }
  });
});

describe('newMoonJDE — 2000 validation', () => {
  it('all 13 new moons in 2000 match USNO within 2 minutes', () => {
    for (let i = 0; i < NEW_MOONS_2000.length; i++) {
      const jde = newMoonJDE(i);
      const computed = jdeToUTCDate(jde, 2000);
      const ref = refToDate(NEW_MOONS_2000[i]);
      const diffMinutes = Math.abs(computed.getTime() - ref.getTime()) / 60000;
      expect(diffMinutes).toBeLessThan(2);
    }
  });
});

describe('findNewMoonsInRange', () => {
  it('finds ~13 new moons in 2024', () => {
    const start = Date.UTC(2024, 0, 1) / 86400000 + 2440587.5;
    const end = Date.UTC(2024, 11, 31) / 86400000 + 2440587.5;
    const moons = findNewMoonsInRange(start, end);
    expect(moons.length).toBeGreaterThanOrEqual(12);
    expect(moons.length).toBeLessThanOrEqual(14);
  });

  it('returns sorted JDE values', () => {
    const start = Date.UTC(2020, 0, 1) / 86400000 + 2440587.5;
    const end = Date.UTC(2020, 11, 31) / 86400000 + 2440587.5;
    const moons = findNewMoonsInRange(start, end);
    for (let i = 1; i < moons.length; i++) {
      expect(moons[i]).toBeGreaterThan(moons[i - 1]);
    }
  });

  it('consecutive new moons are ~29.53 days apart', () => {
    const start = Date.UTC(2024, 0, 1) / 86400000 + 2440587.5;
    const end = Date.UTC(2024, 11, 31) / 86400000 + 2440587.5;
    const moons = findNewMoonsInRange(start, end);
    for (let i = 1; i < moons.length; i++) {
      const gap = moons[i] - moons[i - 1];
      expect(gap).toBeGreaterThan(29.2);
      expect(gap).toBeLessThan(29.9);
    }
  });
});

import { fullMoonJDE } from '../src/new-moon';
describe('fullMoonJDE', () => {
  it('matches the 2024-01-25 17:54 UTC full moon (almanac, tier-1)', () => {
    // Lunation 297: new moon 2024-01-11, full moon 2024-01-25 17:54 UTC.
    const jde = fullMoonJDE(297);
    const date = new Date((jde - 2440587.5) * 86400000);
    const expected = Date.parse('2024-01-25T17:54:00Z');
    expect(Math.abs(date.getTime() - expected) / 60000).toBeLessThan(5); // within 5 min
  });
});
