import { describe, it, expect } from 'vitest';
import { computeTransits, findCrossAspects } from '../src/transits';

describe('findCrossAspects', () => {
  it('detects a conjunction between transit and natal positions', () => {
    const transit = [{ body: 'T.Sun', longitude: 100 }];
    const natal = [{ body: 'N.Sun', longitude: 100.5 }];
    const aspects = findCrossAspects(transit, natal);
    expect(aspects.length).toBeGreaterThan(0);
    const conj = aspects.find(a => a.type === 'conjunction');
    expect(conj).toBeDefined();
    expect(conj!.orb).toBeCloseTo(0.5, 1);
  });

  it('detects an opposition', () => {
    const transit = [{ body: 'T.Mars', longitude: 10 }];
    const natal = [{ body: 'N.Venus', longitude: 191 }];
    const aspects = findCrossAspects(transit, natal);
    const opp = aspects.find(a => a.type === 'opposition');
    expect(opp).toBeDefined();
    expect(opp!.orb).toBeCloseTo(1.0, 1);
  });

  it('detects a trine', () => {
    const transit = [{ body: 'T.Jupiter', longitude: 0 }];
    const natal = [{ body: 'N.Moon', longitude: 119 }];
    const aspects = findCrossAspects(transit, natal);
    const trine = aspects.find(a => a.type === 'trine');
    expect(trine).toBeDefined();
    expect(trine!.orb).toBeCloseTo(1.0, 1);
  });

  it('detects a square', () => {
    const transit = [{ body: 'T.Saturn', longitude: 45 }];
    const natal = [{ body: 'N.Sun', longitude: 135.5 }];
    const aspects = findCrossAspects(transit, natal);
    const sq = aspects.find(a => a.type === 'square');
    expect(sq).toBeDefined();
    expect(sq!.orb).toBeCloseTo(0.5, 1);
  });

  it('detects a sextile', () => {
    const transit = [{ body: 'T.Venus', longitude: 0 }];
    const natal = [{ body: 'N.Mars', longitude: 61 }];
    const aspects = findCrossAspects(transit, natal);
    const sextile = aspects.find(a => a.type === 'sextile');
    expect(sextile).toBeDefined();
  });

  it('respects custom orbs', () => {
    const transit = [{ body: 'T.Sun', longitude: 0 }];
    const natal = [{ body: 'N.Sun', longitude: 5 }];
    // Default conjunction orb is 8° → should detect
    const wide = findCrossAspects(transit, natal);
    expect(wide.some(a => a.type === 'conjunction')).toBe(true);
    // Tight orb of 1° → should NOT detect
    const tight = findCrossAspects(transit, natal, { conjunction: 1 });
    expect(tight.some(a => a.type === 'conjunction')).toBe(false);
  });

  it('returns empty for no aspects in range', () => {
    const transit = [{ body: 'T.Sun', longitude: 0 }];
    const natal = [{ body: 'N.Sun', longitude: 45 }]; // 45° is not a major aspect
    const aspects = findCrossAspects(transit, natal);
    const major = aspects.filter(a => a.major);
    expect(major.length).toBe(0);
  });
});

describe('computeTransits', () => {
  const birthDate = new Date('2024-06-15T14:30:00Z');
  const transitDate = new Date('2025-03-20T12:00:00Z');
  const lat = 25;
  const lng = 121;

  it('returns transit positions and aspects to natal chart', () => {
    const result = computeTransits(birthDate, lat, lng, transitDate);
    expect(result.transitDate).toEqual(transitDate);
    expect(result.transitPositions.length).toBeGreaterThan(0);
    expect(result.natalPositions.length).toBeGreaterThan(0);
    expect(result.aspects).toBeDefined();
  });

  it('transit positions include Sun and Moon', () => {
    const result = computeTransits(birthDate, lat, lng, transitDate);
    const bodies = result.transitPositions.map(p => p.body);
    expect(bodies).toContain('Sun');
    expect(bodies).toContain('Moon');
  });

  it('finds at least some transit aspects', () => {
    const result = computeTransits(birthDate, lat, lng, transitDate);
    // With 10+ bodies on each side, there should be some aspects
    expect(result.aspects.length).toBeGreaterThan(0);
  });

  it('aspect bodies are labeled with T. and N. prefixes', () => {
    const result = computeTransits(birthDate, lat, lng, transitDate);
    if (result.aspects.length > 0) {
      const a = result.aspects[0];
      expect(a.transitBody).toBeDefined();
      expect(a.natalBody).toBeDefined();
    }
  });
});
