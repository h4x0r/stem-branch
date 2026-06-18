/**
 * TDD tests for Moon ephemeris (ELP/MPP02).
 *
 * Reference values:
 * - Meeus "Astronomical Algorithms" 2nd ed, Example 47.a (ELP-2000/82 full)
 * - JPL Horizons geocentric ecliptic coordinates (DE441)
 *
 * ELP/MPP02 fitted to DE405 should agree with JPL DE441 to ~0.001°-0.01°
 * for modern dates and ~0.01°-0.1° for historical dates.
 */

import { describe, it, expect } from 'vitest';
import { getMoonPosition } from '../src/moon/moon';
import { computeElpArguments, computeMoonPosition } from '../src/moon/elpmpp02';
import type { GeocentricPosition } from '../src/types';

describe('getMoonPosition', () => {
  // ── Return type ───────────────────────────────────────────────
  it('returns a GeocentricPosition object', () => {
    const pos = getMoonPosition(new Date('2024-01-01T00:00:00Z'));
    expect(pos).toHaveProperty('longitude');
    expect(pos).toHaveProperty('latitude');
    expect(pos).toHaveProperty('distance');
    expect(pos).toHaveProperty('ra');
    expect(pos).toHaveProperty('dec');
    expect(typeof pos.longitude).toBe('number');
    expect(typeof pos.latitude).toBe('number');
    expect(typeof pos.distance).toBe('number');
    expect(typeof pos.ra).toBe('number');
    expect(typeof pos.dec).toBe('number');
  });

  it('returns longitude in [0, 360) range', () => {
    const pos = getMoonPosition(new Date('2024-06-15T12:00:00Z'));
    expect(pos.longitude).toBeGreaterThanOrEqual(0);
    expect(pos.longitude).toBeLessThan(360);
  });

  it('returns latitude in [-90, 90] range', () => {
    const pos = getMoonPosition(new Date('2024-06-15T12:00:00Z'));
    expect(pos.latitude).toBeGreaterThanOrEqual(-7);  // Moon's max latitude ~5.3°
    expect(pos.latitude).toBeLessThanOrEqual(7);
  });

  it('returns distance in reasonable range (km)', () => {
    // Moon distance: perigee ~356,500 km, apogee ~406,700 km
    const pos = getMoonPosition(new Date('2024-06-15T12:00:00Z'));
    expect(pos.distance).toBeGreaterThan(350000);
    expect(pos.distance).toBeLessThan(410000);
  });

  // ── Meeus Example 47.a ────────────────────────────────────────
  // Date: 1992 April 12, 0h TT (JDE 2448724.5)
  // Full ELP-2000/82 values:
  //   λ = 133.162655° (133° 09' 45.6")
  //   β = -3.229126° (-3° 13' 44.9")
  //   Δ = 368409.0 km (π = 0.991990°)
  //
  // ELP/MPP02 should agree to ~0.01° for this modern date.
  describe('Meeus Example 47.a (1992-04-12)', () => {
    // TT ≈ UTC for this approximate comparison
    // ΔT for 1992 ≈ 58.3 seconds
    const date = new Date('1992-04-12T00:00:00Z');

    it('ecliptic longitude within 0.05° of Meeus reference', () => {
      const pos = getMoonPosition(date);
      expect(pos.longitude).toBeCloseTo(133.163, 0);
      expect(Math.abs(pos.longitude - 133.163)).toBeLessThan(0.05);
    });

    it('ecliptic latitude within 0.05° of Meeus reference', () => {
      const pos = getMoonPosition(date);
      expect(Math.abs(pos.latitude - (-3.229))).toBeLessThan(0.05);
    });

    it('distance within 50 km of Meeus reference', () => {
      const pos = getMoonPosition(date);
      expect(Math.abs(pos.distance - 368409)).toBeLessThan(50);
    });
  });

  // ── J2000.0 epoch ─────────────────────────────────────────────
  // 2000-01-01 12:00:00 TT (JDE 2451545.0, T = 0)
  // At T=0, many simplifications apply — good sanity check.
  describe('J2000.0 epoch (2000-01-01 12:00 TT)', () => {
    // ΔT for 2000 ≈ 63.8 seconds
    // UTC ≈ 2000-01-01T11:58:56Z for TT noon
    const date = new Date('2000-01-01T12:00:00Z');

    it('produces finite, reasonable coordinates', () => {
      const pos = getMoonPosition(date);
      expect(Number.isFinite(pos.longitude)).toBe(true);
      expect(Number.isFinite(pos.latitude)).toBe(true);
      expect(Number.isFinite(pos.distance)).toBe(true);
      expect(pos.distance).toBeGreaterThan(350000);
      expect(pos.distance).toBeLessThan(410000);
    });
  });

  // ── Temporal consistency ──────────────────────────────────────
  // Moon moves ~13.2°/day in longitude. Two dates 1 hour apart
  // should differ by ~0.55°.
  describe('temporal consistency', () => {
    it('longitude changes ~0.55° per hour', () => {
      const d1 = new Date('2024-03-01T00:00:00Z');
      const d2 = new Date('2024-03-01T01:00:00Z');
      const p1 = getMoonPosition(d1);
      const p2 = getMoonPosition(d2);

      let dLon = p2.longitude - p1.longitude;
      if (dLon < -180) dLon += 360;
      if (dLon > 180) dLon -= 360;

      // ~0.55°/hour ± 0.1°/hour (varies with lunar anomaly)
      expect(Math.abs(dLon)).toBeGreaterThan(0.3);
      expect(Math.abs(dLon)).toBeLessThan(0.8);
    });
  });
});

describe('computeElpArguments', () => {
  it('returns arguments for J2000.0 (T=0)', () => {
    const args = computeElpArguments(0);
    expect(typeof args.D).toBe('number');
    expect(typeof args.F).toBe('number');
    expect(typeof args.L).toBe('number');
    expect(typeof args.Lp).toBe('number');
  });

  it('returns arguments for a known T value', () => {
    // T = 0.2436 (some time after J2000)
    const args = computeElpArguments(0.2436);
    expect(Number.isFinite(args.D)).toBe(true);
    expect(Number.isFinite(args.F)).toBe(true);
    expect(Number.isFinite(args.L)).toBe(true);
    expect(Number.isFinite(args.Lp)).toBe(true);
  });

  it('returns all planetary mean longitudes as finite numbers', () => {
    const args = computeElpArguments(0.5);
    expect(Number.isFinite(args.W1)).toBe(true);
    expect(Number.isFinite(args.zeta)).toBe(true);
    expect(Number.isFinite(args.Me)).toBe(true);
    expect(Number.isFinite(args.Ve)).toBe(true);
    expect(Number.isFinite(args.EM)).toBe(true);
    expect(Number.isFinite(args.Ma)).toBe(true);
    expect(Number.isFinite(args.Ju)).toBe(true);
    expect(Number.isFinite(args.Sa)).toBe(true);
    expect(Number.isFinite(args.Ur)).toBe(true);
    expect(Number.isFinite(args.Ne)).toBe(true);
  });
});

describe('computeMoonPosition', () => {
  it('returns position for T=0 (J2000.0)', () => {
    const pos = computeMoonPosition(0);
    expect(Number.isFinite(pos.longitude)).toBe(true);
    expect(Number.isFinite(pos.latitude)).toBe(true);
    expect(Number.isFinite(pos.distance)).toBe(true);
    // Distance should be in reasonable range (~356,500 - 406,700 km)
    expect(pos.distance).toBeGreaterThan(350000);
    expect(pos.distance).toBeLessThan(410000);
  });

  it('returns position for negative T (historical date)', () => {
    // T = -0.5 (~1975)
    const pos = computeMoonPosition(-0.5);
    expect(Number.isFinite(pos.longitude)).toBe(true);
    expect(Number.isFinite(pos.latitude)).toBe(true);
    expect(pos.distance).toBeGreaterThan(350000);
    expect(pos.distance).toBeLessThan(410000);
  });

  it('longitude and latitude are in radian range', () => {
    const pos = computeMoonPosition(0.2436);
    // Longitude: any radian value (normalized internally)
    expect(Number.isFinite(pos.longitude)).toBe(true);
    // Latitude: Moon max ~±0.1 rad (~±5.3°)
    expect(Math.abs(pos.latitude)).toBeLessThan(0.15);
  });
});
