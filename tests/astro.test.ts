import { describe, it, expect } from 'vitest';
import {
  dateToJD_TT, dateToJulianMillennia, dateToJulianCenturies,
  nutationDpsi, nutationDeps, delaunayArgs,
  meanObliquity, trueObliquity,
  normalizeDegrees, normalizeRadians,
  eclipticToEquatorial, C_AU_PER_DAY,
  DEG_TO_RAD, RAD_TO_DEG, ARCSEC_TO_RAD,
} from '../src/astro';

describe('time conversions', () => {
  it('dateToJD_TT returns JD in TT for J2000.0 epoch', () => {
    const d = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
    const jd = dateToJD_TT(d);
    expect(jd).toBeCloseTo(2451545.0 + 63.8 / 86400, 4);
  });
  it('dateToJulianMillennia returns 0 near J2000.0', () => {
    const d = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
    const tau = dateToJulianMillennia(d);
    expect(Math.abs(tau)).toBeLessThan(0.001);
  });
  it('dateToJulianCenturies returns ~0.25 for 2025', () => {
    const d = new Date(Date.UTC(2025, 0, 1, 12, 0, 0));
    const T = dateToJulianCenturies(d);
    expect(T).toBeCloseTo(0.25, 1);
  });
});

describe('nutation', () => {
  it('computes Δψ at J2000.0 within expected range', () => {
    const d = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
    const T = dateToJulianCenturies(d);
    const args = delaunayArgs(T);
    const dpsi = nutationDpsi(args.l, args.lp, args.F, args.D, args.Om, T);
    expect(Math.abs(dpsi)).toBeLessThan(20);
    expect(dpsi).toBeCloseTo(-14.0, 0);
  });
  it('computes Δε at J2000.0 within expected range', () => {
    const d = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
    const T = dateToJulianCenturies(d);
    const args = delaunayArgs(T);
    const deps = nutationDeps(args.l, args.lp, args.F, args.D, args.Om, T);
    expect(Math.abs(deps)).toBeLessThan(15);
  });
});

describe('obliquity', () => {
  it('mean obliquity at J2000.0 ≈ 23.4393°', () => {
    const eps0 = meanObliquity(0);
    expect(eps0 * RAD_TO_DEG).toBeCloseTo(23.4393, 3);
  });
  it('true obliquity includes nutation correction', () => {
    const d = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
    const T = dateToJulianCenturies(d);
    const eps0 = meanObliquity(T);
    const eps = trueObliquity(T);
    expect(Math.abs(eps - eps0)).toBeLessThan(0.001);
    expect(eps).not.toBe(eps0);
  });
});

describe('normalization', () => {
  it('normalizeDegrees wraps 361 to 1', () => {
    expect(normalizeDegrees(361)).toBeCloseTo(1, 10);
  });
  it('normalizeDegrees wraps -1 to 359', () => {
    expect(normalizeDegrees(-1)).toBeCloseTo(359, 10);
  });
  it('normalizeRadians wraps 2π+0.1 to 0.1', () => {
    expect(normalizeRadians(2 * Math.PI + 0.1)).toBeCloseTo(0.1, 10);
  });
});

describe('delaunayArgs', () => {
  it('returns five fundamental arguments at T=0', () => {
    const args = delaunayArgs(0);
    expect(typeof args.l).toBe('number');
    expect(typeof args.lp).toBe('number');
    expect(typeof args.F).toBe('number');
    expect(typeof args.D).toBe('number');
    expect(typeof args.Om).toBe('number');
  });
  it('returns consistent values at T=0', () => {
    const args = delaunayArgs(0);
    const args2 = delaunayArgs(0);
    expect(args.l).toBe(args2.l);
    expect(args.lp).toBe(args2.lp);
    expect(args.F).toBe(args2.F);
    expect(args.D).toBe(args2.D);
    expect(args.Om).toBe(args2.Om);
    expect(Number.isFinite(args.l)).toBe(true);
    expect(Number.isFinite(args.lp)).toBe(true);
    expect(Number.isFinite(args.F)).toBe(true);
    expect(Number.isFinite(args.D)).toBe(true);
    expect(Number.isFinite(args.Om)).toBe(true);
    expect(args.l).not.toBe(0);
    expect(args.lp).not.toBe(0);
  });
});

describe('eclipticToEquatorial', () => {
  it('at λ=0, β=0 returns RA=0, Dec=0', () => {
    const [ra, dec] = eclipticToEquatorial(0, 0, 0);
    expect(ra).toBeCloseTo(0, 10);
    expect(dec).toBeCloseTo(0, 10);
  });
  it('at λ=π/2, β=0 with obliquity ≈23.44° is computable', () => {
    const obliquity = 23.4393 * DEG_TO_RAD;
    const [ra, dec] = eclipticToEquatorial(Math.PI / 2, 0, obliquity);
    expect(Number.isFinite(ra)).toBe(true);
    expect(Number.isFinite(dec)).toBe(true);
    expect(ra).toBeGreaterThan(0);
    expect(Math.abs(dec)).toBeLessThan(Math.PI / 2);
  });
  it('returns output types as numbers in valid ranges', () => {
    const eps = meanObliquity(0);
    const [ra, dec] = eclipticToEquatorial(Math.PI / 4, Math.PI / 6, eps);
    expect(typeof ra).toBe('number');
    expect(typeof dec).toBe('number');
    expect(Number.isFinite(ra)).toBe(true);
    expect(Number.isFinite(dec)).toBe(true);
    expect(Math.abs(ra)).toBeLessThanOrEqual(Math.PI);
    expect(Math.abs(dec)).toBeLessThanOrEqual(Math.PI / 2);
  });
});

describe('constants', () => {
  it('C_AU_PER_DAY is approximately 173.14', () => {
    expect(C_AU_PER_DAY).toBeCloseTo(173.14, 1);
  });
});
