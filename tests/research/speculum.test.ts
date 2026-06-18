import { describe, it, expect } from 'vitest';
import { computeSpeculumEntry } from '../../src/research/speculum';

describe('computeSpeculumEntry', () => {
  // Use a body at RA=90°, Dec=20°, observer lat=40°N, RAMC=0° (MC at 0° RA)
  const entry = computeSpeculumEntry(90, 20, 40, 0, true);

  it('computes ascensional difference (AD)', () => {
    // AD = asin(tan(20°) * tan(40°)) ≈ asin(0.3640 * 0.8391) ≈ asin(0.3054) ≈ 17.78°
    expect(entry.ad).toBeCloseTo(17.78, 0);
  });

  it('computes oblique ascension (OA = RA - AD)', () => {
    expect(entry.oa).toBeCloseTo(90 - entry.ad, 4);
  });

  it('computes oblique descension (OD = RA + AD)', () => {
    expect(entry.od).toBeCloseTo(90 + entry.ad, 4);
  });

  it('computes diurnal semi-arc (DSA = 90 + AD)', () => {
    expect(entry.dsa).toBeCloseTo(90 + entry.ad, 4);
  });

  it('computes nocturnal semi-arc (NSA = 90 - AD)', () => {
    expect(entry.nsa).toBeCloseTo(90 - entry.ad, 4);
  });

  it('DSA + NSA = 180°', () => {
    expect(entry.dsa + entry.nsa).toBeCloseTo(180, 4);
  });

  it('uses DSA as active semi-arc when above horizon', () => {
    expect(entry.sa).toBeCloseTo(entry.dsa, 4);
  });

  it('uses NSA as active semi-arc when below horizon', () => {
    const below = computeSpeculumEntry(90, 20, 40, 0, false);
    expect(below.sa).toBeCloseTo(below.nsa, 4);
  });

  it('computes meridian distance as |RA - RAMC| in [0,180]', () => {
    // |90 - 0| = 90
    expect(entry.md).toBeCloseTo(90, 4);
  });

  it('normalizes MD > 180 correctly', () => {
    // RA=10°, RAMC=200° → |10-200| = 190 → 360-190 = 170
    const e = computeSpeculumEntry(10, 20, 40, 200, true);
    expect(e.md).toBeCloseTo(170, 0);
  });

  it('computes horizon distance (HD = SA - MD)', () => {
    expect(entry.hd).toBeCloseTo(entry.sa - entry.md, 4);
  });

  it('computes temporal hour (SA / 6)', () => {
    expect(entry.temporalHour).toBeCloseTo(entry.sa / 6, 4);
  });

  it('computes UMD in [0, 360)', () => {
    expect(entry.umd).toBeGreaterThanOrEqual(0);
    expect(entry.umd).toBeLessThan(360);
  });

  it('computes a non-zero pole for non-zero MD and lat', () => {
    expect(entry.pole).not.toBe(0);
  });

  it('returns zero AD at equator (lat=0)', () => {
    const equator = computeSpeculumEntry(90, 20, 0, 0, true);
    expect(equator.ad).toBeCloseTo(0, 4);
    expect(equator.dsa).toBeCloseTo(90, 4);
    expect(equator.nsa).toBeCloseTo(90, 4);
  });

  it('returns zero AD for zero declination', () => {
    const zeroDec = computeSpeculumEntry(90, 0, 40, 0, true);
    expect(zeroDec.ad).toBeCloseTo(0, 4);
  });

  it('handles body on the MC (RA = RAMC)', () => {
    const onMC = computeSpeculumEntry(45, 10, 40, 45, true);
    expect(onMC.md).toBeCloseTo(0, 4);
    expect(onMC.hd).toBeCloseTo(onMC.sa, 4);
  });
});

describe('computeSpeculumEntry — extreme latitude', () => {
  it('handles near-polar latitude (89.9°)', () => {
    // At extreme latitudes, semi-arc approaches 0 or 180
    const entry = computeSpeculumEntry(90, 20, 89.9, 0, true);
    expect(typeof entry.hd).toBe('number');
    expect(typeof entry.pole).toBe('number');
    // Should not produce NaN or Infinity
    expect(Number.isFinite(entry.hd)).toBe(true);
    expect(Number.isFinite(entry.pole)).toBe(true);
  });

  it('handles near-polar latitude with body below horizon', () => {
    const entry = computeSpeculumEntry(90, 20, 89.9, 0, false);
    expect(Number.isFinite(entry.hd)).toBe(true);
    expect(Number.isFinite(entry.pole)).toBe(true);
  });

  it('returns pole = 0 when semi-arc is 0 (circumpolar case)', () => {
    // At lat=89.9, dec=20: tan(20)*tan(89.9) >> 1, clamped → AD=90
    // NSA = 90 - 90 = 0 → sa = 0 when below horizon → pole guard fires
    const entry = computeSpeculumEntry(90, 20, 89.9, 0, false);
    expect(entry.nsa).toBeCloseTo(0, 0);
    expect(entry.sa).toBeCloseTo(0, 0);
    expect(entry.pole).toBe(0);
  });

  it('returns pole = 0 for high declination producing zero DSA', () => {
    // At lat=89.9, dec=-20: tan(-20)*tan(89.9) << -1, clamped → AD=-90
    // DSA = 90 + (-90) = 0 → sa = 0 when above horizon → pole guard fires
    const entry = computeSpeculumEntry(90, -20, 89.9, 0, true);
    expect(entry.dsa).toBeCloseTo(0, 0);
    expect(entry.sa).toBeCloseTo(0, 0);
    expect(entry.pole).toBe(0);
  });
});
