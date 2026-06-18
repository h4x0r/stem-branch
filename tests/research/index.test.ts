import { describe, it, expect } from 'vitest';
import { computeBirthChart } from '../../src/birth-chart';

describe('computeResearch (via computeBirthChart)', () => {
  // Taipei, 2024-06-15 14:30 UTC
  const date = new Date('2024-06-15T14:30:00Z');
  const lat = 25.03;
  const lng = 121.56;

  it('returns no research data when research option is not set', () => {
    const chart = computeBirthChart(date, lat, lng);
    expect(chart.research).toBeUndefined();
  });

  it('returns research data when research option is true', () => {
    const chart = computeBirthChart(date, lat, lng, { research: true });
    expect(chart.research).toBeDefined();
  });

  it('research.positions matches chart.positions length', () => {
    const chart = computeBirthChart(date, lat, lng, { research: true });
    expect(chart.research!.positions.length).toBe(chart.positions.length);
  });

  it('each research position has all required fields', () => {
    const chart = computeBirthChart(date, lat, lng, { research: true });
    for (const rp of chart.research!.positions) {
      expect(rp.body).toBeTruthy();
      // Extended speed
      expect(rp.extendedSpeed).toBeDefined();
      expect(typeof rp.extendedSpeed.latitudeSpeed).toBe('number');
      expect(typeof rp.extendedSpeed.distanceSpeed).toBe('number');
      expect(typeof rp.extendedSpeed.relativeSpeed).toBe('number');
      expect(typeof rp.extendedSpeed.fast).toBe('boolean');
      // Speculum
      expect(rp.speculum).toBeDefined();
      expect(typeof rp.speculum.ad).toBe('number');
      expect(typeof rp.speculum.dsa).toBe('number');
      expect(typeof rp.speculum.nsa).toBe('number');
      expect(rp.speculum.dsa + rp.speculum.nsa).toBeCloseTo(180, 4);
      // Dial
      expect(rp.dialPosition90).toBeGreaterThanOrEqual(0);
      expect(rp.dialPosition90).toBeLessThan(90);
      // Gauquelin
      expect(rp.gauquelinSector).toBeGreaterThanOrEqual(1);
      expect(rp.gauquelinSector).toBeLessThanOrEqual(36);
      expect(typeof rp.gauquelinPlusZone).toBe('boolean');
      // Accidental dignity
      expect(typeof rp.accidentalDignityScore).toBe('number');
    }
  });

  it('produces midpoints (N bodies → C(N,2) pairs)', () => {
    const chart = computeBirthChart(date, lat, lng, { research: true });
    const n = chart.positions.length;
    const expectedPairs = (n * (n - 1)) / 2;
    expect(chart.research!.midpoints.length).toBe(expectedPairs);
  });

  it('midpoints are sorted by longitude', () => {
    const chart = computeBirthChart(date, lat, lng, { research: true });
    const mps = chart.research!.midpoints;
    for (let i = 1; i < mps.length; i++) {
      expect(mps[i].longitude).toBeGreaterThanOrEqual(mps[i - 1].longitude);
    }
  });

  it('partile aspects are a subset of all aspects with orb < 1°', () => {
    const chart = computeBirthChart(date, lat, lng, { research: true });
    for (const pa of chart.research!.partileAspects) {
      expect(pa.orb).toBeLessThan(1.0);
    }
    // All partile aspects should exist in the full aspects array
    for (const pa of chart.research!.partileAspects) {
      const found = chart.aspects.find(
        a => a.body1 === pa.body1 && a.body2 === pa.body2 && a.type === pa.type,
      );
      expect(found).toBeDefined();
    }
  });

  it('almuten figuris is a traditional planet or null', () => {
    const chart = computeBirthChart(date, lat, lng, { research: true });
    const valid = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', null];
    expect(valid).toContain(chart.research!.almutenFiguris);
  });
});
