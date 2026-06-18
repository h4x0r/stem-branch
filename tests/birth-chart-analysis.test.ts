import { describe, it, expect } from 'vitest';
import {
  isDayChart,
  computeDispositorChain,
  findFinalDispositor,
  computeAntiscia,
  computeContraAntiscia,
  computeDistributions,
  computeHemispheres,
  detectChartPattern,
  computeMoonPhase,
  computePlanetaryHour,
  getPlanetaryDay,
  computeSolarProximity,
  isOriental,
  isOutOfBounds,
  isVoidOfCourseMoon,
} from '../src/birth-chart-analysis';
import type { ZodiacSign } from '../src/tropical-astrology';

describe('isDayChart', () => {
  it('returns true for Sun in house 10 (above horizon)', () => {
    expect(isDayChart(10)).toBe(true);
  });
  it('returns false for Sun in house 4 (below horizon)', () => {
    expect(isDayChart(4)).toBe(false);
  });
  it('returns true for Sun in house 7 (on DSC, above horizon)', () => {
    expect(isDayChart(7)).toBe(true);
  });
  it('returns false for Sun in house 6 (below horizon)', () => {
    expect(isDayChart(6)).toBe(false);
  });
  it('returns true for Sun in house 12', () => {
    expect(isDayChart(12)).toBe(true);
  });
});

describe('computeAntiscia', () => {
  it('mirrors Leo 15° (135°) to Taurus 15° (45°)', () => {
    expect(computeAntiscia(135)).toBeCloseTo(45, 10);
  });
  it('mirrors 0° (Aries 0°) to 180° (Libra 0°)', () => {
    expect(computeAntiscia(0)).toBeCloseTo(180, 10);
  });
  it('Cancer axis is a fixed point: 90° → 90°', () => {
    expect(computeAntiscia(90)).toBeCloseTo(90, 10);
  });
  it('Capricorn axis is a fixed point: 270° → 270°', () => {
    // (180 - 270 + 360) % 360 = 270
    expect(computeAntiscia(270)).toBeCloseTo(270, 10);
  });
});

describe('computeContraAntiscia', () => {
  it('mirrors 135° to 225°', () => {
    expect(computeContraAntiscia(135)).toBeCloseTo(225, 10);
  });
  it('Aries axis is a fixed point: 0° → 0°', () => {
    expect(computeContraAntiscia(0)).toBeCloseTo(0, 10);
  });
  it('Libra axis is a fixed point: 180° → 180°', () => {
    expect(computeContraAntiscia(180)).toBeCloseTo(180, 10);
  });
});

describe('computeDistributions', () => {
  it('counts 5 fire positions correctly', () => {
    const positions = Array.from({ length: 5 }, (_, i) => ({
      body: `planet${i}`,
      element: 'fire' as const,
      quality: 'cardinal' as const,
      polarity: 'positive' as const,
    }));
    const dist = computeDistributions(positions);
    expect(dist.elements.fire).toBe(5);
    expect(dist.elements.earth).toBe(0);
    expect(dist.elements.air).toBe(0);
    expect(dist.elements.water).toBe(0);
    expect(dist.elements.dominant).toBe('fire');
  });

  it('computes mixed distributions', () => {
    const positions = [
      { body: 'Sun', element: 'fire' as const, quality: 'fixed' as const, polarity: 'positive' as const },
      { body: 'Moon', element: 'water' as const, quality: 'cardinal' as const, polarity: 'negative' as const },
      { body: 'Mars', element: 'fire' as const, quality: 'cardinal' as const, polarity: 'positive' as const },
      { body: 'Venus', element: 'earth' as const, quality: 'fixed' as const, polarity: 'negative' as const },
    ];
    const dist = computeDistributions(positions);
    expect(dist.elements.fire).toBe(2);
    expect(dist.elements.water).toBe(1);
    expect(dist.elements.earth).toBe(1);
    expect(dist.elements.dominant).toBe('fire');
    expect(dist.qualities.cardinal).toBe(2);
    expect(dist.qualities.fixed).toBe(2);
    expect(dist.polarities.positive).toBe(2);
    expect(dist.polarities.negative).toBe(2);
  });
});

describe('computeMoonPhase', () => {
  it('Sun 0°, Moon 90° → First Quarter, illumination ~0.5', () => {
    const result = computeMoonPhase(0, 90);
    expect(result.name).toBe('First Quarter');
    expect(result.illumination).toBeCloseTo(0.5, 2);
  });

  it('Sun 0°, Moon 180° → Full Moon, illumination ~1.0', () => {
    const result = computeMoonPhase(0, 180);
    expect(result.name).toBe('Full Moon');
    expect(result.illumination).toBeCloseTo(1.0, 2);
  });

  it('Sun 0°, Moon 0° → New Moon, illumination ~0', () => {
    const result = computeMoonPhase(0, 0);
    expect(result.name).toBe('New Moon');
    expect(result.illumination).toBeCloseTo(0, 2);
  });

  it('Sun 0°, Moon 270° → Last Quarter', () => {
    const result = computeMoonPhase(0, 270);
    expect(result.name).toBe('Last Quarter');
    expect(result.illumination).toBeCloseTo(0.5, 2);
  });

  it('returns correct elongation angle', () => {
    const result = computeMoonPhase(30, 120);
    expect(result.angle).toBeCloseTo(90, 10);
  });

  it('Sun 0°, Moon 60° → Crescent (elongation 45-90)', () => {
    const result = computeMoonPhase(0, 60);
    expect(result.name).toBe('Crescent');
    expect(result.angle).toBeCloseTo(60, 10);
  });

  it('Sun 0°, Moon 150° → Gibbous (elongation 135-180)', () => {
    const result = computeMoonPhase(0, 150);
    expect(result.name).toBe('Gibbous');
    expect(result.angle).toBeCloseTo(150, 10);
  });

  it('Sun 0°, Moon 240° → Disseminating (elongation 225-270)', () => {
    const result = computeMoonPhase(0, 240);
    expect(result.name).toBe('Disseminating');
    expect(result.angle).toBeCloseTo(240, 10);
  });

  it('Sun 0°, Moon 290° → Last Quarter (elongation 270-315)', () => {
    const result = computeMoonPhase(0, 290);
    expect(result.name).toBe('Last Quarter');
    expect(result.angle).toBeCloseTo(290, 10);
  });

  it('Sun 0°, Moon 330° → Balsamic (elongation ≥ 315)', () => {
    const result = computeMoonPhase(0, 330);
    expect(result.name).toBe('Balsamic');
    expect(result.angle).toBeCloseTo(330, 10);
  });
});

describe('getPlanetaryDay', () => {
  it('returns Sun for a known Sunday', () => {
    // 2024-01-07 is a Sunday
    const sunday = new Date(Date.UTC(2024, 0, 7, 12, 0, 0));
    expect(getPlanetaryDay(sunday)).toBe('Sun');
  });

  it('returns Moon for Monday', () => {
    const monday = new Date(Date.UTC(2024, 0, 8, 12, 0, 0));
    expect(getPlanetaryDay(monday)).toBe('Moon');
  });

  it('returns Mars for Tuesday', () => {
    const tuesday = new Date(Date.UTC(2024, 0, 9, 12, 0, 0));
    expect(getPlanetaryDay(tuesday)).toBe('Mars');
  });

  it('returns Mercury for Wednesday', () => {
    const wednesday = new Date(Date.UTC(2024, 0, 10, 12, 0, 0));
    expect(getPlanetaryDay(wednesday)).toBe('Mercury');
  });

  it('returns Jupiter for Thursday', () => {
    const thursday = new Date(Date.UTC(2024, 0, 11, 12, 0, 0));
    expect(getPlanetaryDay(thursday)).toBe('Jupiter');
  });

  it('returns Venus for Friday', () => {
    const friday = new Date(Date.UTC(2024, 0, 12, 12, 0, 0));
    expect(getPlanetaryDay(friday)).toBe('Venus');
  });

  it('returns Saturn for Saturday', () => {
    const saturday = new Date(Date.UTC(2024, 0, 13, 12, 0, 0));
    expect(getPlanetaryDay(saturday)).toBe('Saturn');
  });
});

describe('computeSolarProximity', () => {
  it('combust at 5° distance', () => {
    const result = computeSolarProximity(105, 100);
    expect(result.combust).toBe(true);
    expect(result.cazimi).toBe(false);
    expect(result.angularDistance).toBeCloseTo(5, 10);
  });

  it('cazimi at 0.1° distance', () => {
    const result = computeSolarProximity(100.1, 100);
    expect(result.combust).toBe(true);
    expect(result.cazimi).toBe(true);
    expect(result.angularDistance).toBeCloseTo(0.1, 2);
  });

  it('not combust at 20° distance', () => {
    const result = computeSolarProximity(120, 100);
    expect(result.combust).toBe(false);
    expect(result.underBeams).toBe(false);
  });

  it('under beams at 10° distance', () => {
    const result = computeSolarProximity(110, 100);
    expect(result.combust).toBe(false);
    expect(result.underBeams).toBe(true);
    expect(result.angularDistance).toBeCloseTo(10, 10);
  });
});

describe('isOutOfBounds', () => {
  it('returns true when |dec| > obliquity', () => {
    expect(isOutOfBounds(25, 23.44)).toBe(true);
  });
  it('returns false when |dec| < obliquity', () => {
    expect(isOutOfBounds(20, 23.44)).toBe(false);
  });
  it('handles negative declination', () => {
    expect(isOutOfBounds(-25, 23.44)).toBe(true);
  });
  it('returns false at exact obliquity', () => {
    expect(isOutOfBounds(23.44, 23.44)).toBe(false);
  });
});

describe('detectChartPattern', () => {
  it('returns Splay for empty input (L117 guard)', () => {
    expect(detectChartPattern([])).toBe('Splay');
  });

  it('detects Bundle when all within 120°', () => {
    const longitudes = [10, 30, 50, 70, 90, 100, 110, 115, 120, 125];
    expect(detectChartPattern(longitudes)).toBe('Bundle');
  });

  it('detects Bowl when all within 180° but not 120°', () => {
    const longitudes = [0, 20, 40, 60, 80, 100, 120, 140, 160, 170];
    expect(detectChartPattern(longitudes)).toBe('Bowl');
  });

  it('detects Bucket when one handle planet outside the 180° rim', () => {
    // 9 planets clustered in 0°-160° (span=160°, within 180°), plus 1 "handle" at 220°
    // Span of all 10 = 220°. Remove handle → remaining span 160° ≤ 180° → Bucket.
    const longitudes = [0, 10, 30, 50, 70, 90, 110, 140, 160, 220];
    expect(detectChartPattern(longitudes)).toBe('Bucket');
  });

  it('detects Locomotive when span ≤ 240° with maxGap 60-180°', () => {
    // All planets within 240°, one big gap of ~120°
    // Planets from 0° to 230°, gap from 230° to 360° = 130° (between 60° and 180°)
    const longitudes = [0, 30, 50, 80, 110, 140, 160, 190, 210, 230];
    expect(detectChartPattern(longitudes)).toBe('Locomotive');
  });

  it('detects See-Saw when exactly two large gaps ≥ 60°', () => {
    // Two groups with span > 270 (skips Bucket) and maxGap < 180 (skips Bowl).
    // Group 1: 0, 30, 60, 90, 120  Group 2: 185, 215, 245, 275
    // Gaps: 30,30,30,30,65,30,30,30,85 → maxGap=85 → span=275
    // span>270→skip Bucket; maxGap≤180 but span>240→skip Locomotive
    // Large gaps (≥60°): 65, 85 → exactly 2 → See-Saw
    const longitudes = [0, 30, 60, 90, 120, 185, 215, 245, 275];
    expect(detectChartPattern(longitudes)).toBe('See-Saw');
  });

  it('detects Splash when 7+ signs are occupied (L168)', () => {
    // 8 signs occupied with 3 large gaps (≥60°) so See-Saw (exactly 2) doesn't match.
    // Ari(15), Tau(45), Gem(75), Can(105), Vir(165), Lib(195), Sco(225), Cap(285)
    // Gaps: 30,30,30,60,30,30,60,90 → 3 large gaps → not See-Saw
    // Span: 270 > 240 → not Locomotive
    const longitudes = [15, 45, 75, 105, 165, 195, 225, 285];
    const result = detectChartPattern(longitudes);
    expect(result).toBe('Splash');
  });

  it('returns Splay as default for irregular clusters', () => {
    // 5-6 signs occupied, no single clear pattern; span > 270, 3+ large gaps, < 7 signs
    // Planets in only 5 signs, with 3 large gaps
    const longitudes = [10, 15, 70, 75, 150, 155, 240, 245, 330, 335];
    // 5 clusters in 5 sign regions, gaps: 55°, 55°, 75°, 85°, 85°, 35° → 3 large gaps
    // Not See-Saw (more than 2 large gaps), not Splash (only 5 signs occupied per 30° bins)
    // Signs: 0, 2, 5, 8, 11 = 5 signs → < 7 → not Splash
    // Span: 335-10 = 325° → > 270 → not Bucket range
    // maxGap ~35°? Let me recalculate
    // sorted: 10,15,70,75,150,155,240,245,330,335
    // gaps: 5, 55, 5, 75, 5, 85, 5, 85, 5, 35
    // maxGap = 85, span = 360-85 = 275
    // > 270 → Bucket check skipped. maxGap=85, 60≤85≤180, span=275 > 240 → not Locomotive
    // large gaps (≥60): 75, 85, 85 → 3 → not See-Saw
    // signs: 0,2,5,8,11 → 5 → not Splash
    // → Splay
    expect(detectChartPattern(longitudes)).toBe('Splay');
  });
});

describe('computeDispositorChain', () => {
  it('maps each body to the ruler of its sign', () => {
    const positions: Array<{ body: string; sign: ZodiacSign }> = [
      { body: 'Sun', sign: 'Leo' },
      { body: 'Moon', sign: 'Cancer' },
      { body: 'Mars', sign: 'Aries' },
    ];
    const chain = computeDispositorChain(positions);
    expect(chain['Sun']).toBe('Sun');   // Leo ruler = Sun
    expect(chain['Moon']).toBe('Moon'); // Cancer ruler = Moon
    expect(chain['Mars']).toBe('Mars'); // Aries ruler = Mars
  });

  it('handles cross-dispositions', () => {
    const positions: Array<{ body: string; sign: ZodiacSign }> = [
      { body: 'Sun', sign: 'Taurus' },  // ruler = Venus
      { body: 'Venus', sign: 'Leo' },   // ruler = Sun
    ];
    const chain = computeDispositorChain(positions);
    expect(chain['Sun']).toBe('Venus');
    expect(chain['Venus']).toBe('Sun');
  });
});

describe('findFinalDispositor', () => {
  it('finds Sun as final dispositor when Sun is in Leo', () => {
    const chain: Record<string, string> = {
      Sun: 'Sun',    // Sun in Leo, disposes itself
      Moon: 'Sun',   // Moon in Leo
      Mars: 'Sun',   // Mars in Leo
    };
    expect(findFinalDispositor(chain)).toBe('Sun');
  });

  it('returns null when there is a loop with no fixed point', () => {
    const chain: Record<string, string> = {
      Sun: 'Venus',   // Sun in Taurus
      Venus: 'Mars',  // Venus in Aries
      Mars: 'Sun',    // Mars in Leo → but Sun maps to Venus, loop
    };
    expect(findFinalDispositor(chain)).toBeNull();
  });
});

describe('computeHemispheres', () => {
  it('all in houses 1-6 → north=6, south=0', () => {
    const positions = [
      { house: 1 }, { house: 2 }, { house: 3 },
      { house: 4 }, { house: 5 }, { house: 6 },
    ];
    const result = computeHemispheres(positions);
    expect(result.north).toBe(6);
    expect(result.south).toBe(0);
  });

  it('all in houses 7-12 → south=6, north=0', () => {
    const positions = [
      { house: 7 }, { house: 8 }, { house: 9 },
      { house: 10 }, { house: 11 }, { house: 12 },
    ];
    const result = computeHemispheres(positions);
    expect(result.south).toBe(6);
    expect(result.north).toBe(0);
  });

  it('computes east/west correctly', () => {
    // E = houses 10,11,12,1,2,3 ; W = houses 4,5,6,7,8,9
    const positions = [
      { house: 1 }, { house: 2 }, { house: 3 },
      { house: 10 }, { house: 11 }, { house: 12 },
    ];
    const result = computeHemispheres(positions);
    expect(result.east).toBe(6);
    expect(result.west).toBe(0);
  });
});

describe('isOriental', () => {
  it('returns true when planet rises before Sun', () => {
    // Body at 80°, Sun at 100° → body is behind Sun in zodiac → oriental
    const result = isOriental(80, 100);
    expect(result).toBe(true);
  });

  it('returns false when planet sets after Sun', () => {
    // Body at 120°, Sun at 100° → body is ahead of Sun → occidental
    const result = isOriental(120, 100);
    expect(result).toBe(false);
  });

  it('returns null when body is conjunct with Sun (diff === 0)', () => {
    // Same longitude → diff = normalizeDegrees(100 - 100) = 0
    expect(isOriental(100, 100)).toBeNull();
  });

  it('returns null when body is exactly opposite Sun (diff === 180)', () => {
    // Body at 10°, Sun at 190° → diff = normalizeDegrees(190 - 10) = 180
    expect(isOriental(10, 190)).toBeNull();
  });
});

describe('isVoidOfCourseMoon', () => {
  it('returns false when Moon can aspect another planet before sign change', () => {
    // Moon at 10° Aries (10°), speed 12°/day, other planet at 80° (Gemini 20°)
    // Sextile (60°) aspect point: 80 - 60 = 20°, which is ahead of Moon (10°)
    // and before Aries boundary (30°). So Moon applies to sextile before leaving Aries.
    const result = isVoidOfCourseMoon(10, 12, 'Aries', [{ longitude: 80 }], [0, 60, 90, 120, 180]);
    expect(result).toBe(false);
  });

  it('returns true when Moon cannot aspect any planet before sign change', () => {
    // Moon at 28° Aries (28°), speed 12°/day, only planet at 200° (Libra 20°)
    // Moon leaves Aries at 30°, only 2° to go. No Ptolemaic aspect within 2°.
    const result = isVoidOfCourseMoon(28, 12, 'Aries', [{ longitude: 200 }], [0, 60, 90, 120, 180]);
    expect(result).toBe(true);
  });

  it('returns true when Moon speed is zero (stationary)', () => {
    const result = isVoidOfCourseMoon(15, 0, 'Aries', [{ longitude: 80 }], [0, 60, 90, 120, 180]);
    expect(result).toBe(true);
  });

  it('returns true when Moon speed is negative (retrograde)', () => {
    const result = isVoidOfCourseMoon(15, -2, 'Aries', [{ longitude: 80 }], [0, 60, 90, 120, 180]);
    expect(result).toBe(true);
  });
});

describe('computePlanetaryHour', () => {
  it('returns a valid planetary hour result', () => {
    const date = new Date(Date.UTC(2024, 0, 7, 14, 0, 0)); // Sunday afternoon
    const result = computePlanetaryHour(date, 40, -74); // NYC-ish
    expect(result).toHaveProperty('planet');
    expect(result).toHaveProperty('hourNumber');
    expect(result).toHaveProperty('isDayHour');
    expect(typeof result.planet).toBe('string');
    expect(result.hourNumber).toBeGreaterThanOrEqual(1);
    expect(result.hourNumber).toBeLessThanOrEqual(24);
  });

  it('first hour of Sunday is Sun', () => {
    // First planetary hour of the day = day ruler
    // For Sunday, at sunrise, the planetary hour should be Sun
    // Use Sunday March 24, 2024 near equinox at equator, lng=0
    // Sunrise ~6:00 UTC, day hour ~1h each, 6:20 safely in first hour
    const date = new Date(Date.UTC(2024, 2, 24, 6, 20, 0));
    const result = computePlanetaryHour(date, 0, 0);
    expect(result.planet).toBe('Sun');
    expect(result.hourNumber).toBe(1);
    expect(result.isDayHour).toBe(true);
  });
});
