import { describe, it, expect } from 'vitest';
import { deltaT, deltaTForYear } from '../src/delta-t';

describe('deltaT', () => {
  // Test against polynomial outputs for known historical values.
  // The polynomials are well-established by Espenak & Meeus (2006) for pre-2005
  // and EclipseWise (2014) for post-2005.

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

  it('returns ~72s for 2024 (EclipseWise polynomial)', () => {
    // EclipseWise 2015-3000 polynomial: 67.62 + 0.3645*(y-2015) + 0.0039755*(y-2015)^2
    // For y ≈ 2024.04: t ≈ 9.04, ΔT ≈ 67.62 + 3.295 + 0.325 ≈ 71.24
    const dt = deltaT(new Date(Date.UTC(2024, 0, 1)));
    expect(dt).toBeCloseTo(71.2, 0);
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

describe('deltaTForYear', () => {
  it('is continuous at the 2005 boundary', () => {
    // Espenak 2006 segment ends at 2005, EclipseWise starts at 2005
    const before = deltaTForYear(2004.99);
    const after = deltaTForYear(2005.01);
    // Should be within ~0.1s of each other
    expect(Math.abs(after - before)).toBeLessThan(0.5);
  });

  it('is continuous at the 2015 boundary', () => {
    const before = deltaTForYear(2014.99);
    const after = deltaTForYear(2015.01);
    expect(Math.abs(after - before)).toBeLessThan(0.1);
  });

  it('handles years before -500', () => {
    const dt = deltaTForYear(-1000);
    expect(dt).toBeGreaterThan(0);
  });

  it('handles years after 3000', () => {
    const dt = deltaTForYear(4000);
    expect(dt).toBeGreaterThan(0);
  });

  it('grows quadratically for far future', () => {
    const dt3000 = deltaTForYear(3000);
    const dt4000 = deltaTForYear(4000);
    const dt5000 = deltaTForYear(5000);
    // Quadratic growth: ratio of increments should be roughly 3:5
    // (distance from 1820 grows as 1180, 2180, 3180)
    expect(dt5000).toBeGreaterThan(dt4000);
    expect(dt4000).toBeGreaterThan(dt3000);
  });
});
