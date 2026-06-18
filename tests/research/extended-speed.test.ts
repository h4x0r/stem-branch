import { describe, it, expect } from 'vitest';
import {
  computeLinearSpeed, computeExtendedSpeed, AVERAGE_SPEEDS,
} from '../../src/research/extended-speed';
import { getMoonPosition } from '../../src/moon/moon';
import { getPlanetPosition } from '../../src/planets/planets';

describe('computeLinearSpeed', () => {
  it('computes a non-zero Moon distance speed', () => {
    const date = new Date('2024-06-15T12:00:00Z');
    const speed = computeLinearSpeed(date, d => getMoonPosition(d).distance);
    // Moon distance changes on order of ±10–50 km/day
    expect(speed).not.toBe(0);
  });

  it('computes Jupiter distance speed on order of ~0.001 AU/day', () => {
    const date = new Date('2024-06-15T12:00:00Z');
    const speed = computeLinearSpeed(date, d => getPlanetPosition('jupiter', d).distance);
    expect(Math.abs(speed)).toBeLessThan(0.01);
    expect(Math.abs(speed)).toBeGreaterThan(0);
  });

  it('does not apply angle wrapping (raw difference)', () => {
    // Values crossing 360 boundary should NOT wrap — this is a linear quantity
    const mockFn = (d: Date): number => {
      const ref = new Date('2024-01-01T12:00:00Z').getTime();
      return d.getTime() < ref ? 359 : 1;
    };
    const date = new Date('2024-01-01T12:00:00Z');
    const speed = computeLinearSpeed(date, mockFn);
    // Raw diff = 1 - 359 = -358 → large negative, NOT wrapped
    expect(speed).toBeLessThan(-100);
  });
});

describe('computeExtendedSpeed', () => {
  it('classifies Sun as fast when speed > average', () => {
    const result = computeExtendedSpeed('Sun', 1.02, 0, 0);
    expect(result.relativeSpeed).toBeGreaterThan(1.0);
    expect(result.fast).toBe(true);
  });

  it('classifies Sun as slow when speed < average', () => {
    const result = computeExtendedSpeed('Sun', 0.95, 0, 0);
    expect(result.relativeSpeed).toBeLessThan(1.0);
    expect(result.fast).toBe(false);
  });

  it('uses absolute speed for relative ratio (retrograde still measured)', () => {
    const result = computeExtendedSpeed('Mars', -0.3, 0, 0);
    // |−0.3| / 0.524 ≈ 0.573
    expect(result.relativeSpeed).toBeCloseTo(0.3 / 0.524, 2);
    expect(result.fast).toBe(false);
  });

  it('returns 0 relative speed for bodies not in AVERAGE_SPEEDS', () => {
    const result = computeExtendedSpeed('Part of Fortune', 0, 0, 0);
    expect(result.relativeSpeed).toBe(0);
    expect(result.fast).toBe(false);
  });

  it('stores latitude and distance speeds', () => {
    const result = computeExtendedSpeed('Moon', 13.5, 2.1, -15.3);
    expect(result.latitudeSpeed).toBe(2.1);
    expect(result.distanceSpeed).toBe(-15.3);
  });
});

describe('AVERAGE_SPEEDS', () => {
  it('has entries for all 10 classical + modern bodies', () => {
    const expected = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
    for (const body of expected) {
      expect(AVERAGE_SPEEDS[body]).toBeGreaterThan(0);
    }
  });

  it('speeds decrease from Moon → Pluto (outer is slower)', () => {
    expect(AVERAGE_SPEEDS.Moon).toBeGreaterThan(AVERAGE_SPEEDS.Sun);
    expect(AVERAGE_SPEEDS.Sun).toBeGreaterThan(AVERAGE_SPEEDS.Jupiter);
    expect(AVERAGE_SPEEDS.Jupiter).toBeGreaterThan(AVERAGE_SPEEDS.Pluto);
  });
});
