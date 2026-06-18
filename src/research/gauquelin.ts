/* v8 ignore next */
/**
 * Gauquelin sector computation.
 *
 * The 36-sector system divides the diurnal circle into sectors based
 * on the body's semi-arcs.  Sector 1 = just past rising, sector 36 =
 * just before rising.  "Plus zones" are sectors 1-3 (just after rise)
 * and 10-12 (just after upper culmination) — the zones where Gauquelin
 * found statistically significant planetary concentrations.
 */

import { normalizeDegrees } from '../astro';

/**
 * Compute the Gauquelin sector (1-36) for a body.
 *
 * @param ra - Right ascension of the body (degrees)
 * @param ramc - Right Ascension of MC (degrees)
 * @param dsa - Diurnal semi-arc of the body (degrees)
 * @param nsa - Nocturnal semi-arc of the body (degrees)
 * @returns Sector number 1-36
 */
export function computeGauquelinSector(
  ra: number,
  ramc: number,
  dsa: number,
  nsa: number,
): number {
  // Hour angle: H = RAMC - RA
  // H = 0 at upper culmination (MC), increases westward
  const H = normalizeDegrees(ramc - ra);

  // Distance from the rising point along the diurnal circle:
  // Rising occurs at H = 360 - DSA (equivalently H = -(DSA) mod 360)
  // We remap so that H_from_rise = 0 at rising and increases through
  // MC, setting, IC, back to rising.
  const risingH = normalizeDegrees(360 - dsa);
  let hFromRise = normalizeDegrees(H - risingH);

  // The four quadrants measured from rising:
  //   Q1 (sectors  1-9):  [0, DSA)       — rising to MC
  //   Q2 (sectors 10-18): [DSA, 2*DSA)   — MC to setting
  //   Q3 (sectors 19-27): [2*DSA, 2*DSA + NSA) — setting to IC
  //   Q4 (sectors 28-36): [2*DSA + NSA, 360)   — IC to rising
  const q1End = dsa;
  const q2End = 2 * dsa;
  const q3End = 2 * dsa + nsa;
  // q4End = 2 * dsa + 2 * nsa = 360

  let sector: number;

  if (hFromRise < q1End) {
    // Q1: rising to MC
    /* v8 ignore next */
    const fraction = dsa > 0 ? hFromRise / dsa : 0;
    sector = Math.floor(fraction * 9) + 1;
  } else if (hFromRise < q2End) {
    // Q2: MC to setting
    /* v8 ignore next */
    const fraction = dsa > 0 ? (hFromRise - q1End) / dsa : 0;
    sector = Math.floor(fraction * 9) + 10;
  } else if (hFromRise < q3End) {
    // Q3: setting to IC
    /* v8 ignore next */
    const fraction = nsa > 0 ? (hFromRise - q2End) / nsa : 0;
    sector = Math.floor(fraction * 9) + 19;
  } else {
    // Q4: IC to rising
    /* v8 ignore next */
    const fraction = nsa > 0 ? (hFromRise - q3End) / nsa : 0;
    sector = Math.floor(fraction * 9) + 28;
  }

  // Clamp to [1, 36]
  /* v8 ignore next */
  if (sector < 1) sector = 1;
  /* v8 ignore next */
  if (sector > 36) sector = 36;

  return sector;
}

/**
 * Check whether a Gauquelin sector falls in a "plus zone".
 *
 * Plus zones: sectors 1-3 (just after rising) and 10-12 (just after
 * upper culmination / MC transit).
 */
export function isGauquelinPlusZone(sector: number): boolean {
  return (sector >= 1 && sector <= 3) || (sector >= 10 && sector <= 12);
}
