import { describe, it, expect } from 'vitest';
import { EARTH_L, EARTH_B, EARTH_R, evaluateVsopSeries } from '../src/vsop87b-earth';

describe('VSOP87B Earth coefficients', () => {
  it('has 6 series for longitude (L)', () => {
    expect(EARTH_L).toHaveLength(6);
  });
  it('has 6 series for latitude (B)', () => {
    expect(EARTH_B).toHaveLength(6);
  });
  it('has 6 series for radius (R)', () => {
    expect(EARTH_R).toHaveLength(6);
  });
  it('L has 1184 total terms', () => {
    const total = EARTH_L.reduce((sum, s) => sum + s.length, 0);
    expect(total).toBe(1184);
  });
  it('B has 402 total terms', () => {
    const total = EARTH_B.reduce((sum, s) => sum + s.length, 0);
    expect(total).toBe(402);
  });
  it('R has 978 total terms', () => {
    const total = EARTH_R.reduce((sum, s) => sum + s.length, 0);
    expect(total).toBe(978);
  });
  it('each term is [amplitude, phase, frequency]', () => {
    const term = EARTH_L[0][0];
    expect(term).toHaveLength(3);
    expect(typeof term[0]).toBe('number');
    expect(typeof term[1]).toBe('number');
    expect(typeof term[2]).toBe('number');
  });
});

describe('evaluateVsopSeries', () => {
  it('evaluates single-term series correctly', () => {
    // 1.0 * cos(0 + 0*t) = 1.0
    const series: [number, number, number][][] = [[[1.0, 0, 0]]];
    expect(evaluateVsopSeries(series, 0)).toBeCloseTo(1.0, 10);
  });

  it('multiplies higher series by t^n (Horner)', () => {
    // series[0] empty, series[1] = [[2.0, 0, 0]] => 2.0 * t^1
    // At t=3: result = 6.0
    const series: [number, number, number][][] = [[], [[2.0, 0, 0]]];
    expect(evaluateVsopSeries(series, 3.0)).toBeCloseTo(6.0, 10);
  });

  it('combines multiple series with Horner method', () => {
    // s0 = [[1.0, 0, 0]] => 1.0
    // s1 = [[2.0, 0, 0]] => 2.0 * t
    // s2 = [[3.0, 0, 0]] => 3.0 * t^2
    // At t=2: 1.0 + 2.0*2 + 3.0*4 = 1 + 4 + 12 = 17
    const series: [number, number, number][][] = [
      [[1.0, 0, 0]], [[2.0, 0, 0]], [[3.0, 0, 0]]
    ];
    expect(evaluateVsopSeries(series, 2.0)).toBeCloseTo(17.0, 10);
  });

  it('handles cos(phase + freq*t) correctly', () => {
    // 1.0 * cos(PI + 0*t) = -1.0
    const series: [number, number, number][][] = [[[1.0, Math.PI, 0]]];
    expect(evaluateVsopSeries(series, 0)).toBeCloseTo(-1.0, 10);
  });

  it('returns 0 for empty series', () => {
    expect(evaluateVsopSeries([], 1.0)).toBe(0);
  });

  it('handles negative t (dates before J2000.0)', () => {
    // s0 = [[1.0, 0, 0]] => 1.0, s1 = [[2.0, 0, 0]] => 2.0*t
    // At t=-1: 1.0 + 2.0*(-1) = -1.0
    const series: [number, number, number][][] = [[[1.0, 0, 0]], [[2.0, 0, 0]]];
    expect(evaluateVsopSeries(series, -1.0)).toBeCloseTo(-1.0, 10);
  });

  it('cross-validates L at t=0 (J2000.0)', () => {
    // At t=0, each term reduces to A*cos(B). All 623 L0 terms contribute.
    // The dominant constant term [1.75347, 0, 0] gives 1.75347, but the
    // other periodic terms shift the sum. Verified against VSOP87B_Full.ts.
    const L = evaluateVsopSeries(EARTH_L, 0);
    expect(L).toBeCloseTo(1.75192, 4);
  });

  it('cross-validates B at t=0', () => {
    // Heliocentric latitude near zero (Earth orbits in ecliptic plane)
    const B = evaluateVsopSeries(EARTH_B, 0);
    expect(Math.abs(B)).toBeLessThan(0.001);
  });

  it('cross-validates R at t=0', () => {
    // Earth-Sun distance at J2000.0: ~0.9833 AU (near perihelion in January)
    const R = evaluateVsopSeries(EARTH_R, 0);
    expect(R).toBeCloseTo(0.9833, 2);
  });
});
