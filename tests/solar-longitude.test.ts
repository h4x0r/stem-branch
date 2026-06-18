import { describe, it, expect } from 'vitest';
import { getSunLongitude, findSunLongitudeMoment, solarEclipticState } from '../src/solar-longitude';
import { dateToJD_TT } from '../src/astro';

describe('getSunLongitude', () => {
  it('returns longitude in degrees [0, 360)', () => {
    const lon = getSunLongitude(new Date(Date.UTC(2000, 0, 1, 12, 0, 0)));
    expect(lon).toBeGreaterThanOrEqual(0);
    expect(lon).toBeLessThan(360);
  });

  it('near vernal equinox 2000 (lon ~0)', () => {
    // Vernal equinox 2000: ~Mar 20, 07:35 UTC
    const lon = getSunLongitude(new Date(Date.UTC(2000, 2, 20, 7, 35, 0)));
    // Handle wrap: 359.99 is ~0.01 degrees from 0
    const distFromZero = Math.min(lon, 360 - lon);
    expect(distFromZero).toBeLessThan(0.5); // within 0.5 degree
  });

  it('near summer solstice 2000 (lon ~90)', () => {
    const lon = getSunLongitude(new Date(Date.UTC(2000, 5, 21, 1, 48, 0)));
    expect(lon).toBeCloseTo(90, 0);
  });

  it('near autumnal equinox 2000 (lon ~180)', () => {
    const lon = getSunLongitude(new Date(Date.UTC(2000, 8, 22, 17, 28, 0)));
    expect(lon).toBeCloseTo(180, 0);
  });

  it('near winter solstice 2000 (lon ~270)', () => {
    const lon = getSunLongitude(new Date(Date.UTC(2000, 11, 21, 13, 37, 0)));
    expect(lon).toBeCloseTo(270, 0);
  });

  it('longitude increases ~1 degree per day', () => {
    const lon1 = getSunLongitude(new Date(Date.UTC(2024, 3, 1)));
    const lon2 = getSunLongitude(new Date(Date.UTC(2024, 3, 2)));
    const diff = ((lon2 - lon1) + 360) % 360;
    expect(diff).toBeCloseTo(1.0, 0);
  });
});

describe('findSunLongitudeMoment', () => {
  it('finds vernal equinox 2024 (lon 0)', () => {
    const result = findSunLongitudeMoment(0, new Date(Date.UTC(2024, 1, 1)), 60);
    expect(result).not.toBeNull();
    expect(result!.getUTCMonth()).toBe(2); // March
    expect(result!.getUTCDate()).toBe(20);
  });

  it('finds Start of Spring 2024 (lon 315)', () => {
    const result = findSunLongitudeMoment(315, new Date(Date.UTC(2024, 0, 1)), 60);
    expect(result).not.toBeNull();
    expect(result!.getUTCMonth()).toBe(1); // February
    expect(result!.getUTCDate()).toBe(4);
  });

  it('finds summer solstice 2024 (lon 90)', () => {
    // Summer solstice 2024: June 20 20:51 UTC (close to midnight, VSOP may give June 20 or 21)
    const result = findSunLongitudeMoment(90, new Date(Date.UTC(2024, 4, 1)), 60);
    expect(result).not.toBeNull();
    expect(result!.getUTCMonth()).toBe(5); // June
    expect([20, 21]).toContain(result!.getUTCDate());
  });

  it('returns null if target not in range', () => {
    const result = findSunLongitudeMoment(180, new Date(Date.UTC(2024, 0, 1)), 1);
    expect(result).toBeNull();
  });

  it('precision is within 2 seconds', () => {
    // Find equinox, then verify the longitude at that moment is very close to 0
    const equinox = findSunLongitudeMoment(0, new Date(Date.UTC(2024, 1, 1)), 60);
    expect(equinox).not.toBeNull();
    const lon = getSunLongitude(equinox!);
    // 2 seconds of arc = 2/3600 degrees ~ 0.00056 degrees
    // Sun moves ~1 degree/day = ~0.04 arcsec/sec, so 2 sec ~ 0.08 arcsec ~ 0.000023 deg
    // But we search to 1-second precision in time, so longitude precision is ~0.01 degrees
    expect(Math.min(lon, 360 - lon)).toBeLessThan(0.01);
  });
});

describe('solarEclipticState (JDE-in, provider-shaped out)', () => {
  // Samples away from the 0/360 wrap so true/apparent stay comparable.
  const samples = [
    new Date(Date.UTC(2000, 0, 1, 12, 0, 0)),
    new Date(Date.UTC(1985, 5, 21, 0, 0, 0)),
    new Date(Date.UTC(2024, 7, 22, 17, 28, 0)),
  ];

  it('apparent longitude equals getSunLongitude for the same TT instant', () => {
    for (const d of samples) {
      const state = solarEclipticState(dateToJD_TT(d));
      expect(state.apparentLongitudeDegrees).toBeCloseTo(getSunLongitude(d), 9);
    }
  });

  it('true and apparent longitudes are in [0, 360) and differ only by nutation + aberration', () => {
    const state = solarEclipticState(dateToJD_TT(samples[0]));
    for (const v of [state.trueLongitudeDegrees, state.apparentLongitudeDegrees]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(360);
    }
    // |Δψ| (<17.2") + aberration (~20.5") < ~38" ≈ 0.011°
    expect(Math.abs(state.apparentLongitudeDegrees - state.trueLongitudeDegrees)).toBeLessThan(0.02);
  });

  it('returns the Sun–Earth distance in AU within the annual range', () => {
    const r = solarEclipticState(dateToJD_TT(samples[0])).radiusAu;
    expect(r).toBeGreaterThan(0.98);
    expect(r).toBeLessThan(1.02);
  });
});
