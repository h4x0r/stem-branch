import { describe, it, expect } from 'vitest';
import { computeAccidentalDignity, computeAlmutenFiguris } from '../../src/research/accidental-dignity';
import type { BirthChartPosition } from '../../src/birth-chart-types';

/** Helper to create a minimal BirthChartPosition with overrides. */
function makePos(overrides: Partial<BirthChartPosition> = {}): BirthChartPosition {
  return {
    body: 'Mars',
    longitude: 0, latitude: 0, distance: 1, ra: 0, declination: 0,
    speed: 0.5, retrograde: false, stationary: false,
    sign: 'Aries', signDegree: 15, house: 1,
    dignity: { dignities: [], score: 0 }, dignityScore: 0,
    element: 'fire', quality: 'cardinal', polarity: 'positive',
    decan: 2, peregrine: true, dispositor: 'Mars',
    antiscia: 180, contraAntiscia: 0,
    outOfBounds: false, combust: false, cazimi: false, underBeams: false,
    oriental: null, azimuth: 0, altitude: 10,
    sabianSymbol: '',
    ...overrides,
  };
}

describe('computeAccidentalDignity', () => {
  it('angular house + direct + fast → positive score', () => {
    const pos = makePos({ house: 1, retrograde: false, stationary: false });
    const score = computeAccidentalDignity(pos, 1.5); // fast
    // Angular +5, Direct +4, Fast +2 = +11
    expect(score).toBe(11);
  });

  it('cadent house + retrograde + slow → very negative', () => {
    const pos = makePos({ house: 3, retrograde: true, stationary: false });
    const score = computeAccidentalDignity(pos, 0.5); // slow
    // Cadent -5, Retrograde -5, Slow -2 = -12
    expect(score).toBe(-12);
  });

  it('succedent house gives +3', () => {
    const pos = makePos({ house: 5, retrograde: false, stationary: false });
    const score = computeAccidentalDignity(pos, 1.0); // exactly average
    // Succedent +3, Direct +4, Slow -2 (relativeSpeed is 1.0 which is NOT > 1.0)
    expect(score).toBe(5);
  });

  it('stationary gives -2 (not direct +4 or retrograde -5)', () => {
    const pos = makePos({ house: 1, retrograde: false, stationary: true });
    const score = computeAccidentalDignity(pos, 1.5);
    // Angular +5, Stationary -2, Fast +2 = +5
    expect(score).toBe(5);
  });

  it('cazimi gives +5', () => {
    const pos = makePos({ house: 1, cazimi: true, combust: false, underBeams: false });
    const score = computeAccidentalDignity(pos, 1.5);
    // Angular +5, Direct +4, Fast +2, Cazimi +5 = +16
    expect(score).toBe(16);
  });

  it('combust gives -5', () => {
    const pos = makePos({ house: 1, combust: true, cazimi: false, underBeams: false });
    const score = computeAccidentalDignity(pos, 1.5);
    // Angular +5, Direct +4, Fast +2, Combust -5 = +6
    expect(score).toBe(6);
  });

  it('under beams gives -4', () => {
    const pos = makePos({ house: 1, underBeams: true, combust: false, cazimi: false });
    const score = computeAccidentalDignity(pos, 1.5);
    // Angular +5, Direct +4, Fast +2, Under beams -4 = +7
    expect(score).toBe(7);
  });

  it('oriental superior planet (Mars) gets +2', () => {
    const pos = makePos({ body: 'Mars', oriental: true, house: 1 });
    const score = computeAccidentalDignity(pos, 1.5);
    // Angular +5, Direct +4, Fast +2, Oriental +2 = +13
    expect(score).toBe(13);
  });

  it('occidental inferior planet (Venus) gets +2', () => {
    const pos = makePos({ body: 'Venus', oriental: false, house: 1 });
    const score = computeAccidentalDignity(pos, 1.5);
    // Angular +5, Direct +4, Fast +2, Occidental +2 = +13
    expect(score).toBe(13);
  });

  it('oriental inferior planet (Venus) gets no bonus', () => {
    const pos = makePos({ body: 'Venus', oriental: true, house: 1 });
    const score = computeAccidentalDignity(pos, 1.5);
    // Angular +5, Direct +4, Fast +2 = +11
    expect(score).toBe(11);
  });

  it('null oriental (luminaries) gets no bonus', () => {
    const pos = makePos({ body: 'Sun', oriental: null, house: 1 });
    const score = computeAccidentalDignity(pos, 1.5);
    // Angular +5, Direct +4, Fast +2 = +11
    expect(score).toBe(11);
  });
});

describe('computeAlmutenFiguris', () => {
  it('returns a planet name for typical chart degrees', () => {
    // ASC=10° Aries, MC=10° Capricorn, Sun=15° Leo, Moon=20° Taurus, PS=5° Aries
    const degrees = [10, 280, 135, 50, 5];
    const result = computeAlmutenFiguris(degrees, true);
    expect(result).toBeTruthy();
    expect(['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']).toContain(result);
  });

  it('returns null when no planet has any dignity at any degree', () => {
    // This is effectively impossible with real zodiac degrees, but test the edge case
    // by checking the function handles it gracefully
    const result = computeAlmutenFiguris([], true);
    expect(result).toBeNull();
  });

  it('may differ between day and night charts', () => {
    // Triplicity rulers differ by sect, so the almuten may change
    const degrees = [15, 105, 200, 290, 350]; // various degrees
    const dayResult = computeAlmutenFiguris(degrees, true);
    const nightResult = computeAlmutenFiguris(degrees, false);
    // They might or might not differ — just verify both return valid results
    expect(dayResult).toBeTruthy();
    expect(nightResult).toBeTruthy();
  });
});
