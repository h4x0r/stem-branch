/**
 * Export integration tests for ephemeris APIs.
 *
 * Verifies that getMoonPosition, getPlanetPosition, and GeocentricPosition
 * are accessible from the package root (src/index.ts).
 */

import { describe, it, expect } from 'vitest';
import {
  getMoonPosition,
  getPlanetPosition,
} from '../src/index';
import type { GeocentricPosition, Planet } from '../src/index';

describe('Ephemeris API exports', () => {
  const date = new Date('2024-01-01T00:00:00Z');

  it('exports getMoonPosition from package root', () => {
    expect(typeof getMoonPosition).toBe('function');
    const pos: GeocentricPosition = getMoonPosition(date);
    expect(pos.longitude).toBeGreaterThanOrEqual(0);
    expect(pos.longitude).toBeLessThan(360);
    expect(pos.distance).toBeGreaterThan(350000);
  });

  it('exports getPlanetPosition from package root', () => {
    expect(typeof getPlanetPosition).toBe('function');
    const pos: GeocentricPosition = getPlanetPosition('mars', date);
    expect(pos.longitude).toBeGreaterThanOrEqual(0);
    expect(pos.longitude).toBeLessThan(360);
    expect(pos.distance).toBeGreaterThan(0);
  });

  it('Planet type includes all 7 VSOP87 planets', () => {
    const planets: Planet[] = [
      'mercury', 'venus', 'mars', 'jupiter',
      'saturn', 'uranus', 'neptune',
    ];
    for (const p of planets) {
      expect(() => getPlanetPosition(p, date)).not.toThrow();
    }
  });

  it('Pluto throws until TOP2013 is implemented', () => {
    expect(() => getPlanetPosition('pluto', date)).toThrow(/not yet implemented/);
  });
});
