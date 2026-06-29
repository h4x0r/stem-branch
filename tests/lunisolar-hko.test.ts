/**
 * Authoritative real-world validation against the Hong Kong Observatory
 * Gregorian–Lunar Calendar conversion tables (HKO government open data). HKO is
 * the tier-1 arbiter a computed library (cnlunar / sxwnl) cannot be — it is the
 * published official calendar. Covers ΔT-known years including the tight 2018
 * (2.05 min) boundary and leap months 2020 (閏4) and 2023 (閏2). Fixture +
 * provenance: scripts/gen-hko-fixture.mjs, tests/fixtures/README.md.
 *
 * Far-future near-midnight boundaries (2057, 2097) are excluded — see
 * docs/validation.md "ΔT limit": there the date is ΔT-extrapolation-bound, not
 * ephemeris-bound, and our calendar can differ from HKO by a day.
 */
import { describe, it, expect } from 'vitest';
import { gregorianToLunisolar } from '../src/lunisolar-calendar';
import fixtures from './fixtures/hko-lunisolar.json';

type Entry = { g: [number, number, number]; l: [number, number]; leap: boolean };

describe('Cross-validation: lunisolar calendar (農曆) vs Hong Kong Observatory', () => {
  it(`matches HKO month/day/leap for all ${(fixtures as Entry[]).length} dates`, () => {
    const mismatches: string[] = [];
    for (const { g, l, leap } of fixtures as Entry[]) {
      const [y, m, d] = g;
      const r = gregorianToLunisolar(new Date(y, m - 1, d));
      if (r.month !== l[0] || r.day !== l[1] || r.isLeapMonth !== leap) {
        mismatches.push(
          `${y}-${m}-${d}: ours M${r.month}${r.isLeapMonth ? 'L' : ''}D${r.day} ` +
            `vs HKO M${l[0]}${leap ? 'L' : ''}D${l[1]}`,
        );
      }
    }
    expect(mismatches.slice(0, 20)).toEqual([]);
    expect(mismatches.length).toBe(0);
  }, { timeout: 300_000 });
});
