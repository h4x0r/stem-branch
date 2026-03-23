import { describe, it, expect } from 'vitest';
import { getAscendant } from '../../src/seven-governors';

describe('getAscendant (命宮)', () => {
  it('returns a valid palace name', () => {
    const result = getAscendant(
      new Date('2000-01-01T00:00:00Z'),
      { lat: 25.033, lon: 121.565 },
    );
    expect(result.palace).toBeTruthy();
    expect(result.mansion).toBeTruthy();
    expect(result.siderealLon).toBeGreaterThanOrEqual(0);
    expect(result.siderealLon).toBeLessThan(360);
  });

  it('different birth times give different ascendants', () => {
    const loc = { lat: 25.033, lon: 121.565 };
    const morning = getAscendant(new Date('2000-01-01T00:00:00Z'), loc);
    const evening = getAscendant(new Date('2000-01-01T10:00:00Z'), loc);
    expect(morning.palace).not.toBe(evening.palace);
  });

  it('different locations at same UTC give different ascendants', () => {
    const date = new Date('2000-01-01T06:00:00Z');
    const taipei = getAscendant(date, { lat: 25.033, lon: 121.565 });
    const london = getAscendant(date, { lat: 51.507, lon: -0.128 });
    expect(taipei.palace).not.toBe(london.palace);
  });

  it('siderealLon changes ~15° per hour', () => {
    const loc = { lat: 25.033, lon: 121.565 };
    const a1 = getAscendant(new Date('2000-01-01T00:00:00Z'), loc);
    const a2 = getAscendant(new Date('2000-01-01T01:00:00Z'), loc);
    let diff = a2.siderealLon - a1.siderealLon;
    if (diff < 0) diff += 360;
    expect(diff).toBeCloseTo(15, -1); // ~15°/hour
  });
});
