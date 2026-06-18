import { describe, it, expect } from 'vitest';
import { shortArcMidpoint, computeMidpoints, findMidpointStructures } from '../../src/research/midpoints';

describe('shortArcMidpoint', () => {
  it('simple case: 10° and 30° → 20°', () => {
    expect(shortArcMidpoint(10, 30)).toBeCloseTo(20, 4);
  });

  it('wrapping case: 350° and 10° → 0°', () => {
    expect(shortArcMidpoint(350, 10)).toBeCloseTo(0, 4);
  });

  it('opposite points: 0° and 180° → 90° (or 270°)', () => {
    const mid = shortArcMidpoint(0, 180);
    // Either 90 or 270 is acceptable — both are equidistant
    expect(mid === 90 || mid === 270 || Math.abs(mid - 90) < 0.01 || Math.abs(mid - 270) < 0.01).toBe(true);
  });

  it('same position: 100° and 100° → 100°', () => {
    expect(shortArcMidpoint(100, 100)).toBeCloseTo(100, 4);
  });

  it('wrapping: 5° and 355° → 0°', () => {
    expect(shortArcMidpoint(5, 355)).toBeCloseTo(0, 4);
  });

  it('wrapping: 340° and 40° → 10°', () => {
    expect(shortArcMidpoint(340, 40)).toBeCloseTo(10, 4);
  });
});

describe('computeMidpoints', () => {
  const bodies = [
    { body: 'Sun', longitude: 90 },
    { body: 'Moon', longitude: 180 },
    { body: 'Mars', longitude: 270 },
  ];

  it('returns C(n,2) midpoints', () => {
    const mps = computeMidpoints(bodies);
    expect(mps.length).toBe(3); // C(3,2) = 3
  });

  it('returns sorted by longitude', () => {
    const mps = computeMidpoints(bodies);
    for (let i = 1; i < mps.length; i++) {
      expect(mps[i].longitude).toBeGreaterThanOrEqual(mps[i - 1].longitude);
    }
  });

  it('includes sign and signDegree', () => {
    const mps = computeMidpoints(bodies);
    for (const mp of mps) {
      expect(mp.sign).toBeDefined();
      expect(mp.signDegree).toBeDefined();
      expect(mp.signDegree).toBeGreaterThanOrEqual(0);
      expect(mp.signDegree).toBeLessThan(30);
    }
  });

  it('includes dial90 position', () => {
    const mps = computeMidpoints(bodies);
    for (const mp of mps) {
      expect(mp.dial90).toBeGreaterThanOrEqual(0);
      expect(mp.dial90).toBeLessThan(90);
    }
  });

  it('Sun/Moon midpoint at 135°', () => {
    const mps = computeMidpoints(bodies);
    const sunMoon = mps.find(m => m.body1 === 'Sun' && m.body2 === 'Moon');
    expect(sunMoon).toBeDefined();
    expect(sunMoon!.longitude).toBeCloseTo(135, 4);
  });
});

describe('findMidpointStructures', () => {
  it('detects body at a midpoint within orb', () => {
    // Sun=0°, Moon=180° → midpoint at 90°.  Mars at 91° (orb 1°)
    const bodies = [
      { body: 'Sun', longitude: 0 },
      { body: 'Moon', longitude: 180 },
      { body: 'Mars', longitude: 91 },
    ];
    const mps = computeMidpoints(bodies);
    const structures = findMidpointStructures(bodies, mps, 1.5);

    const found = structures.find(s => s.body === 'Mars' && s.body1 === 'Sun' && s.body2 === 'Moon');
    expect(found).toBeDefined();
    expect(found!.orb).toBeCloseTo(1, 4);
  });

  it('also checks the opposite midpoint (+180°)', () => {
    // Sun=0°, Moon=180° → midpoints at 90° and 270°.  Mars at 269° (1° from 270°)
    const bodies = [
      { body: 'Sun', longitude: 0 },
      { body: 'Moon', longitude: 180 },
      { body: 'Mars', longitude: 269 },
    ];
    const mps = computeMidpoints(bodies);
    const structures = findMidpointStructures(bodies, mps, 1.5);

    const found = structures.find(s => s.body === 'Mars');
    expect(found).toBeDefined();
    expect(found!.orb).toBeCloseTo(1, 4);
  });

  it('excludes bodies that are part of the midpoint pair', () => {
    const bodies = [
      { body: 'Sun', longitude: 0 },
      { body: 'Moon', longitude: 180 },
    ];
    const mps = computeMidpoints(bodies);
    const structures = findMidpointStructures(bodies, mps, 180);
    // Sun and Moon can't be at their own midpoint
    expect(structures).toHaveLength(0);
  });

  it('returns empty when no bodies are at midpoints', () => {
    const bodies = [
      { body: 'Sun', longitude: 0 },
      { body: 'Moon', longitude: 180 },
      { body: 'Mars', longitude: 45 }, // far from 90° midpoint
    ];
    const mps = computeMidpoints(bodies);
    const structures = findMidpointStructures(bodies, mps, 1.5);

    const found = structures.find(s => s.body === 'Mars' && s.body1 === 'Sun' && s.body2 === 'Moon');
    expect(found).toBeUndefined();
  });

  it('sorts by orb ascending', () => {
    const bodies = [
      { body: 'Sun', longitude: 0 },
      { body: 'Moon', longitude: 60 },
      { body: 'Mars', longitude: 29.5 },   // 0.5° from Sun/Moon midpoint at 30°
      { body: 'Venus', longitude: 31.2 },  // 1.2° from Sun/Moon midpoint at 30°
    ];
    const mps = computeMidpoints(bodies);
    const structures = findMidpointStructures(bodies, mps, 1.5);

    if (structures.length >= 2) {
      expect(structures[0].orb).toBeLessThanOrEqual(structures[1].orb);
    }
  });
});
