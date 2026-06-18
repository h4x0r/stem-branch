/* v8 ignore next */
/**
 * Accidental dignity scoring and Almuten Figuris computation.
 *
 * Accidental dignity measures a planet's strength by circumstance
 * (house placement, speed, solar proximity, etc.) as opposed to
 * essential dignity which measures strength by zodiacal position.
 */

import type { BirthChartPosition } from '../birth-chart-types';
import { getExtendedDignity } from '../dignity-tables';
import { getZodiacSign } from '../tropical-astrology';

/** The 7 traditional planets evaluated for Almuten Figuris. */
const TRADITIONAL_PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];

/** Superior planets benefit from being oriental (rising before the Sun). */
const SUPERIOR_PLANETS = new Set(['Mars', 'Jupiter', 'Saturn']);

/** Inferior planets benefit from being occidental (setting after the Sun). */
const INFERIOR_PLANETS = new Set(['Mercury', 'Venus']);

const ANGULAR_HOUSES = new Set([1, 4, 7, 10]);
const SUCCEDENT_HOUSES = new Set([2, 5, 8, 11]);
// Cadent houses: 3, 6, 9, 12

/**
 * Compute the accidental dignity score for a body.
 *
 * @param pos - Enriched birth chart position
 * @param relativeSpeed - Relative speed ratio (> 1 = fast, < 1 = slow)
 * @returns Numerical score (positive = strong, negative = weak)
 */
export function computeAccidentalDignity(
  pos: BirthChartPosition,
  relativeSpeed: number,
): number {
  let score = 0;

  // House placement
  if (ANGULAR_HOUSES.has(pos.house)) score += 5;
  else if (SUCCEDENT_HOUSES.has(pos.house)) score += 3;
  else score -= 5; // cadent

  // Motion
  if (pos.stationary) {
    score -= 2;
  } else if (pos.retrograde) {
    score -= 5;
  } else {
    score += 4; // direct
  }

  // Speed
  if (relativeSpeed > 1.0) score += 2;
  else if (relativeSpeed > 0) score -= 2; // slow (but not zero for points without speed)

  // Solar proximity (mutually exclusive: cazimi > combust > under beams)
  if (pos.cazimi) score += 5;
  else if (pos.combust) score -= 5;
  else if (pos.underBeams) score -= 4;

  // Oriental / Occidental advantage
  if (SUPERIOR_PLANETS.has(pos.body) && pos.oriental === true) score += 2;
  if (INFERIOR_PLANETS.has(pos.body) && pos.oriental === false) score += 2;

  return score;
}

/**
 * Compute the Almuten Figuris — the planet with the highest sum of
 * essential dignity scores across the 5 hylegical places.
 *
 * The 5 hylegical places: ASC degree, MC degree, Sun degree, Moon degree,
 * and prenatal syzygy degree.
 *
 * @param hylegicalDegrees - Array of 5 ecliptic longitudes
 * @param isDayChart - Whether the chart is a day chart
 * @returns Body name of the Almuten Figuris, or null if no planet has dignity
 */
export function computeAlmutenFiguris(
  hylegicalDegrees: number[],
  isDayChart: boolean,
): string | null {
  const scores: Record<string, number> = {};

  for (const planet of TRADITIONAL_PLANETS) {
    scores[planet] = 0;
  }

  for (const longitude of hylegicalDegrees) {
    const { sign, degree } = getZodiacSign(longitude);

    for (const planet of TRADITIONAL_PLANETS) {
      const dignity = getExtendedDignity(planet, sign, degree, isDayChart);
      // Only count positive dignities (rulership, exaltation, triplicity, term, face)
      const positiveScore = dignity.dignities
        .filter(d => d !== 'detriment' && d !== 'fall')
        .reduce((sum, d) => {
          const pts: Record<string, number> = {
            rulership: 5, exaltation: 4, triplicity: 3, term: 2, face: 1,
          };
          /* v8 ignore next */
          return sum + (pts[d] ?? 0);
        }, 0);
      scores[planet] += positiveScore;
    }
  }

  // Find the planet with the highest total
  let best: string | null = null;
  let bestScore = 0;

  for (const planet of TRADITIONAL_PLANETS) {
    if (scores[planet] > bestScore) {
      bestScore = scores[planet];
      best = planet;
    }
  }

  return best;
}
