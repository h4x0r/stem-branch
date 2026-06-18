import { describe, it, expect } from 'vitest';
import { renderBirthChart } from '../../src/cli/render-birth-chart';
import { computeBirthChart } from '../../src/birth-chart';
import type { BirthChartData, BirthChartPosition, BirthChartAspect } from '../../src/birth-chart-types';

/** Minimal enriched position for testing the renderer. */
function makePos(overrides: Partial<BirthChartPosition> & { body: string }): BirthChartPosition {
  return {
    longitude: 0, latitude: 0, distance: 1, ra: 0, declination: 0,
    speed: 1, retrograde: false, stationary: false,
    sign: 'Aries', signDegree: 0, house: 1,
    dignity: { dignities: [], score: 0 }, dignityScore: 0,
    element: 'fire', quality: 'cardinal', polarity: 'positive',
    decan: 1, peregrine: true, dispositor: 'Mars',
    antiscia: 180, contraAntiscia: 0,
    outOfBounds: false, combust: false, cazimi: false, underBeams: false,
    oriental: null, azimuth: 0, altitude: 0, sabianSymbol: 'A test symbol',
    ...overrides,
  };
}

/** Minimal chart fixture for testing the renderer. */
function makeChart(overrides: Partial<BirthChartData> = {}): BirthChartData {
  return {
    houses: {
      system: 'placidus',
      cusps: [
        245.32, 278.10, 310.50, 342.80, 15.20, 47.60,
        65.32, 98.10, 130.50, 162.45, 195.20, 227.60,
      ],
      ascendant: 245.32,
      midheaven: 162.45,
    },
    positions: [
      makePos({ body: 'Sun', longitude: 315.42, latitude: 0.00, sign: 'Aquarius', signDegree: 15.42, house: 3, speed: 1.01 }),
      makePos({ body: 'Moon', longitude: 128.77, latitude: 3.21, sign: 'Leo', signDegree: 8.77, house: 9, speed: 13.2 }),
      makePos({
        body: 'Mercury', longitude: 301.15, latitude: -1.05, sign: 'Aquarius', signDegree: 1.15, house: 3, speed: 1.5,
        dignity: { dignities: ['detriment'], score: -5 }, dignityScore: -5, peregrine: false,
      }),
    ],
    aspects: [
      { body1: 'Sun', body2: 'Mercury', type: 'conjunction', angle: 14.3, orb: 5.7, applying: true, major: true },
      { body1: 'Moon', body2: 'Sun', type: 'opposition', angle: 173.4, orb: 6.6, applying: false, major: true },
    ],
    parallels: [],
    angles: {
      asc: 245.32, dsc: 65.32, mc: 162.45, ic: 342.45,
      vertex: 100, equatorialAscendant: 250,
    },
    distributions: {
      elements: { fire: 1, earth: 0, air: 2, water: 0, dominant: 'air' },
      qualities: { cardinal: 0, fixed: 3, mutable: 0, dominant: 'fixed' },
      polarities: { positive: 3, negative: 0 },
    },
    hemispheres: { north: 0, south: 3, east: 1, west: 2 },
    chartPattern: 'Splay',
    isDayChart: false,
    moonPhase: { name: 'Full Moon', angle: 186.65, illumination: 0.99 },
    dispositorChain: { Sun: 'Saturn', Moon: 'Sun', Mercury: 'Saturn' },
    finalDispositor: null,
    mutualReceptions: [],
    fixedStarConjunctions: [{ star: 'Regulus', body: 'Moon', orb: 0.5 }],
    planetaryHour: { planet: 'Saturn', hourNumber: 3, isDayHour: false },
    planetaryDay: 'Saturn',
    voidOfCourseMoon: false,
    prenatalSyzygy: { type: 'full', date: new Date('2024-01-01'), longitude: 100 },
    profection: { sign: 'Aries', lord: 'Mars', house: 1 },
    firdaria: { ruler: 'Moon', subRuler: 'Venus', startDate: new Date('2020-01-01'), endDate: new Date('2029-01-01') },
    hyleg: 'Moon',
    alcochoden: 'Sun',
    lunarMansion: { number: 10, name: 'Al Jabhah' },
    settings: { houseSystem: 'placidus', zodiac: 'tropical' },
    ...overrides,
  };
}

describe('renderBirthChart', () => {
  it('renders the Western Natal Chart title', () => {
    const lines = renderBirthChart(makeChart());
    const joined = lines.join('\n');
    expect(joined).toContain('Western Natal Chart');
  });

  it('renders all six chart angles: ASC, DSC, MC, IC, Vertex, Eq. ASC', () => {
    const lines = renderBirthChart(makeChart());
    const joined = lines.join('\n');
    expect(joined).toContain('ASC');
    expect(joined).toContain('DSC');
    expect(joined).toContain('MC');
    expect(joined).toContain('IC');
    expect(joined).toContain('Vertex');
    expect(joined).toContain('Eq. ASC');
  });

  it('derives DSC = (ASC + 180) % 360', () => {
    const chart = makeChart();
    const lines = renderBirthChart(chart);
    const dsc = (chart.angles.asc + 180) % 360; // 65.32
    const joined = lines.join('\n');
    expect(joined).toContain(dsc.toFixed(2) + '°');
  });

  it('derives IC = (MC + 180) % 360', () => {
    const chart = makeChart();
    const lines = renderBirthChart(chart);
    const ic = (chart.angles.mc + 180) % 360; // 342.45
    const joined = lines.join('\n');
    expect(joined).toContain(ic.toFixed(2) + '°');
  });

  it('renders House System label', () => {
    const lines = renderBirthChart(makeChart());
    const joined = lines.join('\n');
    expect(joined).toContain('House System: placidus');
  });

  it('renders all 12 house cusps', () => {
    const chart = makeChart();
    const lines = renderBirthChart(chart);
    const joined = lines.join('\n');
    for (const cusp of chart.houses.cusps) {
      expect(joined).toContain(cusp.toFixed(2) + '°');
    }
  });

  it('labels house 1 as (ASC) and house 10 as (MC)', () => {
    const lines = renderBirthChart(makeChart());
    const joined = lines.join('\n');
    expect(joined).toContain('1 (ASC)');
    expect(joined).toContain('10 (MC)');
  });

  it('renders planet positions with longitude', () => {
    const lines = renderBirthChart(makeChart());
    const joined = lines.join('\n');
    expect(joined).toContain('Sun');
    expect(joined).toContain('315.42°');
    expect(joined).toContain('Moon');
    expect(joined).toContain('128.77°');
  });

  it('renders dignity when present', () => {
    const lines = renderBirthChart(makeChart());
    const joined = lines.join('\n');
    expect(joined).toContain('detriment');
  });

  it('renders peregrine when no dignity', () => {
    const lines = renderBirthChart(makeChart());
    const joined = lines.join('\n');
    expect(joined).toContain('peregrine');
  });

  it('renders aspects with angle, orb, and applying/separating', () => {
    const lines = renderBirthChart(makeChart());
    const joined = lines.join('\n');
    expect(joined).toContain('conjunction');
    expect(joined).toContain('14.3°');
    expect(joined).toContain('5.7°');
    expect(joined).toContain('opposition');
    expect(joined).toContain('App');
    expect(joined).toContain('Sep');
  });

  it('omits aspects section when there are none', () => {
    const chart = makeChart({ aspects: [] });
    const lines = renderBirthChart(chart);
    const joined = lines.join('\n');
    // Should not contain the "Aspect" header row
    expect(joined).not.toContain('App/Sep');
    expect(joined).not.toContain('conjunction');
  });

  it('renders chart analysis section', () => {
    const lines = renderBirthChart(makeChart());
    const joined = lines.join('\n');
    expect(joined).toContain('Night Chart');
    expect(joined).toContain('Splay');
    expect(joined).toContain('Full Moon');
    expect(joined).toContain('VOC Moon');
    expect(joined).toContain('dominant: air');
  });

  it('renders dispositor chain', () => {
    const lines = renderBirthChart(makeChart());
    const joined = lines.join('\n');
    expect(joined).toContain('Dispositor Chain');
    expect(joined).toContain('Sun');
    expect(joined).toContain('Saturn');
  });

  it('renders fixed star conjunctions', () => {
    const lines = renderBirthChart(makeChart());
    const joined = lines.join('\n');
    expect(joined).toContain('Regulus');
    expect(joined).toContain('Moon');
  });

  it('renders time lords section', () => {
    const lines = renderBirthChart(makeChart());
    const joined = lines.join('\n');
    expect(joined).toContain('Time Lords');
    expect(joined).toContain('Firdaria');
    expect(joined).toContain('Moon / Venus');
    expect(joined).toContain('Profection');
    expect(joined).toContain('House 1');
  });

  it('renders planetary hours section', () => {
    const lines = renderBirthChart(makeChart());
    const joined = lines.join('\n');
    expect(joined).toContain('Planetary Hours');
    expect(joined).toContain('Saturn');
  });

  it('derives correct sign from longitude (Sagittarius for ~245°)', () => {
    const lines = renderBirthChart(makeChart());
    const joined = lines.join('\n');
    // ASC at 245.32° → Sagittarius (240-270)
    expect(joined).toContain('Sagittarius');
  });
});

describe('renderBirthChart — void of course moon', () => {
  it('renders "Yes" when voidOfCourseMoon is true', () => {
    const chart = makeChart({ voidOfCourseMoon: true });
    const text = renderBirthChart(chart).join('\n');
    expect(text).toContain('VOC Moon');
    expect(text).toContain('Yes');
  });

  it('renders "No" when voidOfCourseMoon is false', () => {
    const chart = makeChart({ voidOfCourseMoon: false });
    const text = renderBirthChart(chart).join('\n');
    expect(text).toContain('VOC Moon');
    expect(text).toContain('No');
  });
});

describe('renderBirthChart — mutual receptions', () => {
  it('renders mutual receptions when present', () => {
    const chartWithMR = makeChart({
      mutualReceptions: [{ body1: 'Sun', body2: 'Moon', type: 'domicile' }],
    });
    const text = renderBirthChart(chartWithMR).join('\n');
    expect(text).toContain('Mutual Receptions');
    expect(text).toContain('Sun');
    expect(text).toContain('Moon');
    expect(text).toContain('domicile');
  });
});

describe('renderBirthChart — research extension', () => {
  it('renders research data when present', () => {
    const chart = computeBirthChart(new Date('2024-06-15T14:30:00Z'), 25.03, 121.56, { research: true });
    const text = renderBirthChart(chart).join('\n');
    // Research sections include Extended Speed Data
    expect(text).toContain('Extended Speed Data');
  });
});
