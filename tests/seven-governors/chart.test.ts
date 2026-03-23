import { describe, it, expect, beforeAll } from 'vitest';
import { getSevenGovernorsChart } from '../../src/seven-governors';
import type { SevenGovernorsChart, GovernorOrRemainder } from '../../src/seven-governors';

describe('getSevenGovernorsChart', () => {
  // Test date: 1990-01-15 08:30 local Taipei (00:30 UTC)
  const date = new Date('1990-01-15T00:30:00Z');
  const location = { lat: 25.033, lon: 121.565 };

  let chart: SevenGovernorsChart;

  beforeAll(() => {
    chart = getSevenGovernorsChart(date, location);
  });

  it('returns a chart object', () => {
    expect(chart).toBeTruthy();
    expect(chart.date).toEqual(date);
    expect(chart.location).toEqual(location);
  });

  it('has positions for all 11 bodies', () => {
    const bodies = Object.keys(chart.bodies) as GovernorOrRemainder[];
    expect(bodies).toHaveLength(11);
    expect(bodies).toContain('sun');
    expect(bodies).toContain('moon');
    expect(bodies).toContain('rahu');
    expect(bodies).toContain('purpleQi');
  });

  it('each body has sidereal longitude, mansion, and palace', () => {
    for (const [name, pos] of Object.entries(chart.bodies)) {
      expect(pos.siderealLon, `${name} siderealLon`).toBeGreaterThanOrEqual(0);
      expect(pos.siderealLon, `${name} siderealLon`).toBeLessThan(360);
      expect(pos.mansion, `${name} mansion`).toBeTruthy();
      expect(pos.palace, `${name} palace`).toBeTruthy();
      expect(pos.mansionDegree, `${name} mansionDegree`).toBeGreaterThanOrEqual(0);
      expect(pos.mansionDegree, `${name} mansionDegree`).toBeLessThan(34); // 井 spans 33°
    }
  });

  it('has 12 palaces with roles assigned', () => {
    expect(chart.palaces).toHaveLength(12);
    const roles = chart.palaces.map(p => p.role);
    expect(roles).toContain('命宮');
    expect(roles).toContain('財帛宮');
    expect(new Set(roles).size).toBe(12);
  });

  it('has an ascendant', () => {
    expect(chart.ascendant.mansion).toBeTruthy();
    expect(chart.ascendant.palace).toBeTruthy();
  });

  it('has dignity for each body', () => {
    for (const body of Object.keys(chart.bodies) as GovernorOrRemainder[]) {
      expect(['廟', '旺', '平', '陷']).toContain(chart.dignities[body]);
    }
  });

  it('aspects is an array', () => {
    expect(Array.isArray(chart.aspects)).toBe(true);
  });

  it('starSpirits is an array', () => {
    expect(Array.isArray(chart.starSpirits)).toBe(true);
  });

  it('respects sidereal mode option', () => {
    const chartAyanamsa = getSevenGovernorsChart(date, location, {
      siderealMode: { type: 'ayanamsa', value: 24.0 },
    });
    expect(chartAyanamsa.siderealMode).toEqual({ type: 'ayanamsa', value: 24.0 });
    // Positions should differ from default modern mode
    expect(chartAyanamsa.bodies.sun.siderealLon).not.toBeCloseTo(chart.bodies.sun.siderealLon, 0);
  });

  it('respects ketuMode option', () => {
    const chartDN = getSevenGovernorsChart(date, location, { ketuMode: 'descending-node' });
    expect(chartDN.ketuMode).toBe('descending-node');
  });
});
