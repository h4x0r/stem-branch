import { describe, it, expect } from 'vitest';
import { deltaT, deltaTForYear } from '../src/delta-t';

describe('deltaT', () => {
  // Test against polynomial outputs for known historical values.
  // The polynomials are well-established by Espenak & Meeus (2006) for pre-2005
  // and EclipseWise (2014) for 2005-2015.

  it('returns ~-2.7s for 1900', () => {
    const dt = deltaT(new Date(Date.UTC(1900, 0, 1)));
    expect(dt).toBeCloseTo(-2.7, 0);
  });

  it('returns ~29s for 1950', () => {
    const dt = deltaT(new Date(Date.UTC(1950, 0, 1)));
    expect(dt).toBeCloseTo(29.1, 0);
  });

  it('returns ~40s for 1970', () => {
    const dt = deltaT(new Date(Date.UTC(1970, 0, 1)));
    expect(dt).toBeCloseTo(40.2, 0);
  });

  it('returns ~57s for 1990', () => {
    const dt = deltaT(new Date(Date.UTC(1990, 0, 1)));
    expect(dt).toBeCloseTo(56.9, 0);
  });

  it('returns ~64s for 2000', () => {
    const dt = deltaT(new Date(Date.UTC(2000, 0, 1)));
    expect(dt).toBeCloseTo(63.8, 0);
  });

  it('returns ~69s for 2024 (sxwnl table)', () => {
    // sxwnl table: 2024 segment starts at 69.1752
    // At 2024.04 (Jan): t = (0.04/4)*10 = 0.1
    // ΔT ≈ 69.1752 - 0.0335*0.1 - 0.0048*0.01 + 0.000811*0.001 ≈ 69.17
    const dt = deltaT(new Date(Date.UTC(2024, 0, 1)));
    expect(dt).toBeCloseTo(69.2, 0);
  });

  it('returns positive value for modern dates', () => {
    expect(deltaT(new Date(Date.UTC(2000, 0, 1)))).toBeGreaterThan(0);
    expect(deltaT(new Date(Date.UTC(2024, 0, 1)))).toBeGreaterThan(0);
  });

  it('returns a number for historical dates', () => {
    expect(typeof deltaT(new Date(Date.UTC(1800, 0, 1)))).toBe('number');
    expect(typeof deltaT(new Date(Date.UTC(1500, 0, 1)))).toBe('number');
  });

  it('returns a number for far-future dates', () => {
    expect(typeof deltaT(new Date(Date.UTC(2500, 0, 1)))).toBe('number');
    expect(typeof deltaT(new Date(Date.UTC(5000, 0, 1)))).toBe('number');
  });
});

describe('deltaTForYear — sxwnl table validation', () => {
  // Verify sxwnl cubic table knot values match USNO observed data
  it('matches USNO observed ΔT at 2016.0', () => {
    expect(deltaTForYear(2016)).toBeCloseTo(68.10, 1);
  });

  it('matches USNO observed ΔT at 2020.0', () => {
    expect(deltaTForYear(2020)).toBeCloseTo(69.36, 1);
  });

  it('matches USNO observed ΔT at 2024.0', () => {
    expect(deltaTForYear(2024)).toBeCloseTo(69.18, 1);
  });

  it('returns reasonable ΔT at table endpoint 2050', () => {
    // sxwnl sentinel: 71.0457
    expect(deltaTForYear(2050)).toBeCloseTo(71.0, 0);
  });
});

describe('deltaTForYear — continuity', () => {
  it('is continuous at the 2005 boundary', () => {
    const before = deltaTForYear(2004.99);
    const after = deltaTForYear(2005.01);
    expect(Math.abs(after - before)).toBeLessThan(0.5);
  });

  it('is continuous at the 2016 boundary (Espenak → sxwnl)', () => {
    const before = deltaTForYear(2015.99);
    const after = deltaTForYear(2016.01);
    // Espenak at 2016: 64.69 + 0.2930*11 ≈ 67.91
    // sxwnl at 2016: 68.10
    // ~0.2s discontinuity (acceptable)
    expect(Math.abs(after - before)).toBeLessThan(0.5);
  });

  it('is within 3s at the 2050 boundary (table → extrapolation)', () => {
    // sxwnl's table segments are independently fitted — small jumps at boundaries
    // are expected (the a0 values are USNO observations, not polynomial endpoints)
    const before = deltaTForYear(2049.99);
    const after = deltaTForYear(2050.01);
    expect(Math.abs(after - before)).toBeLessThan(3);
  });

  it('segment boundaries have bounded jumps', () => {
    // sxwnl's cubic segments are independently fitted without C0 constraints.
    // Jumps at boundaries are expected but bounded (< 3s).
    for (const year of [2020, 2024, 2028, 2032, 2036, 2040, 2044, 2048]) {
      const before = deltaTForYear(year - 0.001);
      const after = deltaTForYear(year + 0.001);
      expect(Math.abs(after - before)).toBeLessThan(3);
    }
  });
});

describe('deltaTForYear — extrapolation', () => {
  it('handles years before -500', () => {
    const dt = deltaTForYear(-1000);
    expect(dt).toBeGreaterThan(0);
  });

  it('handles years after 2150 (pure parabolic)', () => {
    const dt = deltaTForYear(4000);
    expect(dt).toBeGreaterThan(0);
  });

  it('grows for far future (parabolic with jsd=31)', () => {
    const dt2100 = deltaTForYear(2100);
    const dt2200 = deltaTForYear(2200);
    const dt3000 = deltaTForYear(3000);
    expect(dt2200).toBeGreaterThan(dt2100);
    expect(dt3000).toBeGreaterThan(dt2200);
  });

  it('returns ~187s for 2100 (matching sxwnl extrapolation)', () => {
    // sxwnl: -20 + 31 * ((2100-1820)/100)^2 = 223.04
    // blend: 223.04 - (143.99 - 71.05) * (150-100)/100 = 223.04 - 36.47 = 186.6
    const dt = deltaTForYear(2100);
    expect(dt).toBeCloseTo(186.6, 0);
  });
});
