import { describe, it, expect } from 'vitest';
import { renderResearch } from '../../src/cli/render-research';
import type { ResearchData } from '../../src/birth-chart-types';

/** Minimal valid research data for rendering tests. */
function makeResearchData(): ResearchData {
  return {
    positions: [
      {
        body: 'Sun',
        extendedSpeed: { latitudeSpeed: 0, distanceSpeed: 0, relativeSpeed: 1.01, fast: true },
        speculum: { ad: 15, oa: 75, od: 105, md: 45, dsa: 105, nsa: 75, sa: 105, umd: 315, hd: 60, temporalHour: 17.5, pole: 12 },
        dialPosition90: 45,
        gauquelinSector: 2,
        gauquelinPlusZone: true,
        accidentalDignityScore: 11,
        hayz: true,
        halb: false,
        besieged: false,
        viaCombusta: false,
        joyByHouse: true,
      },
      {
        body: 'Moon',
        extendedSpeed: { latitudeSpeed: 2.5, distanceSpeed: -30, relativeSpeed: 0.95, fast: false },
        speculum: { ad: 10, oa: 80, od: 100, md: 60, dsa: 100, nsa: 80, sa: 80, umd: 300, hd: 20, temporalHour: 13.3, pole: 8 },
        dialPosition90: 22.5,
        gauquelinSector: 15,
        gauquelinPlusZone: false,
        accidentalDignityScore: -3,
        hayz: false,
        halb: false,
        besieged: false,
        viaCombusta: false,
        joyByHouse: false,
      },
    ],
    midpoints: [
      {
        body1: 'Sun', body2: 'Moon',
        longitude: 135, dial90: 45,
        sign: 'Leo', signDegree: 15,
      },
    ],
    midpointStructures: [
      { body: 'Mars', body1: 'Sun', body2: 'Moon', orb: 0.5 },
    ],
    partileAspects: [
      {
        body1: 'Sun', body2: 'Moon', type: 'trine',
        angle: 120, orb: 0.3, applying: true, major: true,
      },
    ],
    almutenFiguris: 'Jupiter',
  };
}

describe('renderResearch', () => {
  const data = makeResearchData();
  const lines = renderResearch(data);
  const text = lines.join('\n');

  it('returns an array of strings', () => {
    expect(Array.isArray(lines)).toBe(true);
    expect(lines.length).toBeGreaterThan(0);
  });

  it('includes section 10: Extended Speed Data', () => {
    expect(text).toContain('Extended Speed Data');
    expect(text).toContain('Lat Spd');
    expect(text).toContain('Rel Spd');
    expect(text).toContain('Fast');
    expect(text).toContain('Slow');
  });

  it('includes section 11: Speculum Table', () => {
    expect(text).toContain('Speculum Table');
    expect(text).toContain('AD');
    expect(text).toContain('DSA');
    expect(text).toContain('Pole');
  });

  it('includes section 12: 90-Degree Dial', () => {
    expect(text).toContain('90-Degree Dial');
    expect(text).toContain('Dial 90');
  });

  it('includes section 13: Midpoints', () => {
    expect(text).toContain('Midpoints');
    expect(text).toContain('Sun');
    expect(text).toContain('Moon');
  });

  it('includes midpoint structures when present', () => {
    expect(text).toContain('Midpoint Structures');
    expect(text).toContain('Mars');
    expect(text).toContain('Sun/Moon');
  });

  it('includes section 14: Gauquelin Sectors', () => {
    expect(text).toContain('Gauquelin Sectors');
    expect(text).toContain('Plus Zone');
    expect(text).toContain('Yes'); // Sun in plus zone
  });

  it('includes section 15: Partile Aspects', () => {
    expect(text).toContain('Partile Aspects');
    expect(text).toContain('trine');
  });

  it('includes section 16: Accidental Dignity & Almuten', () => {
    expect(text).toContain('Accidental Dignity Scores');
    expect(text).toContain('+11');
    expect(text).toContain('-3');
    expect(text).toContain('Almuten Figuris: Jupiter');
  });

  it('omits partile aspects section when empty', () => {
    const noPartile: ResearchData = { ...data, partileAspects: [] };
    const noPartileText = renderResearch(noPartile).join('\n');
    expect(noPartileText).not.toContain('Partile Aspects');
  });

  it('omits midpoint structures section when empty', () => {
    const noStructures: ResearchData = { ...data, midpointStructures: [] };
    const noStructuresText = renderResearch(noStructures).join('\n');
    expect(noStructuresText).not.toContain('Midpoint Structures');
  });

  it('omits Almuten Figuris line when null', () => {
    const noAlmuten: ResearchData = { ...data, almutenFiguris: null };
    const noAlmutenText = renderResearch(noAlmuten).join('\n');
    expect(noAlmutenText).not.toContain('Almuten Figuris');
  });

  it('includes section 17: Classical Conditions for bodies with active conditions', () => {
    expect(text).toContain('Classical Conditions');
    expect(text).toContain('Hayz');
    expect(text).toContain('Halb');
    expect(text).toContain('Besieged');
    expect(text).toContain('Via Combusta');
    expect(text).toContain('Joy');
    // Sun has hayz=true and joyByHouse=true → should appear
    expect(text).toMatch(/Sun\s+Yes\s+.*Yes/);
  });

  it('omits classical conditions section when no body has active conditions', () => {
    const noConditions: ResearchData = {
      ...data,
      positions: data.positions.map(p => ({
        ...p,
        hayz: false, halb: false, besieged: false, viaCombusta: false, joyByHouse: false,
      })),
    };
    const noConditionsText = renderResearch(noConditions).join('\n');
    expect(noConditionsText).not.toContain('Classical Conditions');
  });
});
