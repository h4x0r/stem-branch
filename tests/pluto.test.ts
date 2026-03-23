/**
 * TDD tests for Pluto ephemeris (Meeus Chapter 37).
 *
 * Reference values:
 * - Meeus "Astronomical Algorithms" 2nd ed, Example 37.a
 *   Date: 1992-10-13, heliocentric J2000.0:
 *     λ = 232.74071°, β = 14.58782°, r = 29.711111 AU
 *
 * Valid range: 1885-2099 CE.
 */

import { describe, it, expect } from 'vitest';
import { getPlanetPosition } from '../src/index';

describe('getPlanetPosition (pluto)', () => {
  // ── Return type ───────────────────────────────────────────────
  it('returns a GeocentricPosition object', () => {
    const pos = getPlanetPosition('pluto', new Date('2024-01-01T00:00:00Z'));
    expect(pos).toHaveProperty('longitude');
    expect(pos).toHaveProperty('latitude');
    expect(pos).toHaveProperty('distance');
    expect(pos).toHaveProperty('ra');
    expect(pos).toHaveProperty('dec');
  });

  it('returns longitude in [0, 360) range', () => {
    const pos = getPlanetPosition('pluto', new Date('2024-06-15T00:00:00Z'));
    expect(pos.longitude).toBeGreaterThanOrEqual(0);
    expect(pos.longitude).toBeLessThan(360);
  });

  // ── Meeus Example 37.a (1992-10-13) ────────────────────────────
  // Heliocentric: λ=232.74071°, β=14.58782°, r=29.711111 AU
  // Geocentric coordinates will differ from heliocentric due to
  // Earth's position, but we can validate approximate ranges.
  describe('Meeus Example 37.a (1992-10-13)', () => {
    const date = new Date('1992-10-13T00:00:00Z');

    it('geocentric longitude near expected value', () => {
      const pos = getPlanetPosition('pluto', date);
      // Pluto was near 224° ecliptic longitude (Scorpio/Sagittarius) in Oct 1992
      // Geocentric differs from heliocentric by parallax (~Earth-Sun distance effect)
      expect(pos.longitude).toBeGreaterThan(220);
      expect(pos.longitude).toBeLessThan(240);
    });

    it('geocentric latitude in reasonable range', () => {
      const pos = getPlanetPosition('pluto', date);
      // Pluto's ecliptic latitude was ~14-15° in 1992
      expect(pos.latitude).toBeGreaterThan(10);
      expect(pos.latitude).toBeLessThan(20);
    });

    it('distance in reasonable range (AU)', () => {
      const pos = getPlanetPosition('pluto', date);
      // Geocentric distance: ~28.7-30.7 AU (helio ~29.7, ±1 AU for Earth)
      expect(pos.distance).toBeGreaterThan(28);
      expect(pos.distance).toBeLessThan(32);
    });
  });

  // ── 2024 position ─────────────────────────────────────────────
  describe('2024 position', () => {
    const date = new Date('2024-01-01T00:00:00Z');

    it('Pluto near 299° (late Capricorn/early Aquarius) in 2024', () => {
      const pos = getPlanetPosition('pluto', date);
      // Pluto entered Aquarius (300°) around Jan 2024
      expect(pos.longitude).toBeGreaterThan(295);
      expect(pos.longitude).toBeLessThan(305);
    });
  });

  // ── Temporal consistency ────────────────────────────────────────
  // Pluto moves ~0.01-0.04°/day depending on retrograde phase.
  describe('temporal consistency', () => {
    it('longitude changes slowly over one month', () => {
      const d1 = new Date('2024-03-01T00:00:00Z');
      const d2 = new Date('2024-04-01T00:00:00Z');
      const p1 = getPlanetPosition('pluto', d1);
      const p2 = getPlanetPosition('pluto', d2);

      let dLon = p2.longitude - p1.longitude;
      if (dLon < -180) dLon += 360;
      if (dLon > 180) dLon -= 360;

      // ~0.01°/day × 31 days ≈ 0.3°, but can be negative during retrograde
      expect(Math.abs(dLon)).toBeLessThan(3);
    });
  });
});
