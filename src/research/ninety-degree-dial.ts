/* v8 ignore next */
/**
 * 90-degree dial position for cosmobiology (Ebertin school).
 *
 * Projects any ecliptic longitude onto a 90° dial by taking mod 90.
 * Used in midpoint analysis and symmetrical astrology.
 */

import { normalizeDegrees } from '../astro';

/**
 * Convert an ecliptic longitude to its 90-degree dial position.
 *
 * @param longitude - Ecliptic longitude in degrees [0, 360)
 * @returns Dial position in degrees [0, 90)
 */
export function toDial90(longitude: number): number {
  return normalizeDegrees(longitude) % 90;
}
