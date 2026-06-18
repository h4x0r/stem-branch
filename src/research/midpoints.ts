/* v8 ignore next */
/**
 * Midpoint computation for cosmobiology / Ebertin analysis.
 *
 * Computes all pairwise midpoints and finds midpoint structures
 * (a body occupying another pair's midpoint within orb).
 */

import type { MidpointEntry, MidpointStructure } from '../birth-chart-types';
import { normalizeDegrees } from '../astro';
import { getZodiacSign } from '../tropical-astrology';
import { toDial90 } from './ninety-degree-dial';

/** Default orb for midpoint structures (°). */
const DEFAULT_MIDPOINT_ORB = 1.5;

/**
 * Compute the shorter-arc midpoint of two ecliptic longitudes.
 *
 * @returns Midpoint longitude in [0, 360)
 */
export function shortArcMidpoint(lon1: number, lon2: number): number {
  const a = normalizeDegrees(lon1);
  const b = normalizeDegrees(lon2);

  let diff = b - a;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;

  return normalizeDegrees(a + diff / 2);
}

/**
 * Compute all pairwise midpoints for an array of body positions.
 *
 * @param bodies - Array of { body, longitude }
 * @returns Array of midpoint entries, sorted by longitude
 */
export function computeMidpoints(
  bodies: Array<{ body: string; longitude: number }>,
): MidpointEntry[] {
  const midpoints: MidpointEntry[] = [];

  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const lon = shortArcMidpoint(bodies[i].longitude, bodies[j].longitude);
      const { sign, degree } = getZodiacSign(lon);

      midpoints.push({
        body1: bodies[i].body,
        body2: bodies[j].body,
        longitude: lon,
        dial90: toDial90(lon),
        sign,
        signDegree: degree,
      });
    }
  }

  midpoints.sort((a, b) => a.longitude - b.longitude);
  return midpoints;
}

/**
 * Find midpoint structures — bodies that sit at another pair's midpoint.
 *
 * A midpoint structure exists when a body's longitude (mod 360) is within
 * the specified orb of any midpoint longitude.
 *
 * @param bodies - Array of { body, longitude }
 * @param midpoints - Pre-computed midpoint entries
 * @param orb - Maximum orb in degrees (default: 1.5°)
 * @returns Array of midpoint structures
 */
export function findMidpointStructures(
  bodies: Array<{ body: string; longitude: number }>,
  midpoints: MidpointEntry[],
  orb: number = DEFAULT_MIDPOINT_ORB,
): MidpointStructure[] {
  const structures: MidpointStructure[] = [];

  for (const mp of midpoints) {
    for (const body of bodies) {
      // Skip if the body is one of the midpoint pair
      if (body.body === mp.body1 || body.body === mp.body2) continue;

      let diff = Math.abs(normalizeDegrees(body.longitude) - mp.longitude);
      if (diff > 180) diff = 360 - diff;

      // Check both the direct midpoint and the opposite point (+180°)
      let diff180 = Math.abs(normalizeDegrees(body.longitude) - normalizeDegrees(mp.longitude + 180));
      if (diff180 > 180) diff180 = 360 - diff180;

      const minDiff = Math.min(diff, diff180);

      if (minDiff <= orb) {
        structures.push({
          body: body.body,
          body1: mp.body1,
          body2: mp.body2,
          orb: minDiff,
        });
      }
    }
  }

  structures.sort((a, b) => a.orb - b.orb);
  return structures;
}
