/**
 * Validation of `moonPhase` illumination geometry (tier-1), mirroring the Rust
 * port's `tests/moon_phase.rs`. Two independent oracles:
 *  1. Meeus, Astronomical Algorithms 2e, Example 48.a — 1992 Apr 12.0 TD gives
 *     phase angle i = 69.0756° and illuminated fraction k = 0.6786.
 *  2. JPL new/full-moon instants (tests/fixtures/jpl-lunar-phases.json): the
 *     illuminated fraction must be ~0 at new and ~1 at full. JPL supplies the
 *     instants, so this is not circular.
 */

import { describe, it, expect } from 'vitest';
import { moonPhase } from '../src/index';
import { dateToJulianCenturies } from '../src/astro';
import lunarPhaseFixtures from './fixtures/jpl-lunar-phases.json';

interface LunarPhaseRef {
  type: 'new' | 'full';
  dateISO: string;
  timestamp: number;
}

/** Convert a UT timestamp (ms) to a Julian Ephemeris Day in TT. */
function jdeOf(ts: number): number {
  return dateToJulianCenturies(new Date(ts)) * 36525.0 + 2451545.0;
}

describe('moonPhase illumination geometry', () => {
  it('matches Meeus Example 48.a (1992 Apr 12.0 TD)', () => {
    const p = moonPhase(2448724.5);
    // ELP/MPP02 + VSOP87D vs Meeus truncated theory: agree well within tolerance.
    expect(Math.abs(p.illuminatedFraction - 0.6786)).toBeLessThan(0.005);
    expect(Math.abs(p.phaseAngleDeg - 69.0756)).toBeLessThan(0.3);
    expect(p.elongationDeg).toBeGreaterThanOrEqual(0);
    expect(p.elongationDeg).toBeLessThan(360);
  });

  it('illuminated fraction is ~0 at new and ~1 at full (JPL instants)', () => {
    const refs = lunarPhaseFixtures as LunarPhaseRef[];
    let nNew = 0;
    let nFull = 0;
    for (const r of refs) {
      const k = moonPhase(jdeOf(r.timestamp)).illuminatedFraction;
      if (r.type === 'new') {
        expect(k, `new moon ${r.dateISO}`).toBeLessThan(0.01);
        nNew += 1;
      } else {
        expect(k, `full moon ${r.dateISO}`).toBeGreaterThan(0.99);
        nFull += 1;
      }
    }
    expect(nNew).toBeGreaterThan(40);
    expect(nFull).toBeGreaterThan(40);
  });

  it('waxing is true 3 days after new and false 3 days after full', () => {
    const refs = lunarPhaseFixtures as LunarPhaseRef[];
    for (const r of refs) {
      const p = moonPhase(jdeOf(r.timestamp) + 3.0);
      if (r.type === 'new') {
        expect(p.waxing, `waxing 3d after new ${r.dateISO}`).toBe(true);
      } else {
        expect(p.waxing, `waning 3d after full ${r.dateISO}`).toBe(false);
      }
    }
  });
});
