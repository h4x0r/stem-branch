/* v8 ignore next */
/**
 * DE441 even-polynomial corrections per planet.
 *
 * Each correction is: ΔL = c₀ + c₂τ² + c₄τ⁴ + c₆τ⁶ (arcseconds)
 * where τ is Julian millennia from J2000.0.
 *
 * Coefficients are fitted by scripts/fit-de441-planet-corrections.mjs
 * by least-squares against JPL Horizons DE441 reference data.
 *
 * Returns 0 for planets without fitted corrections yet.
 */

import type { Planet } from '../types';

interface CorrectionCoeffs {
  c0: number;
  c2: number;
  c4: number;
  c6: number;
}

// Fitted by scripts/fit-de441-planet-corrections.mjs against JPL Horizons DE441.
// Range: 1700–2300 CE, 60-day step, apparent RA/Dec → ecliptic longitude residual.
// Inner planets: periodic VSOP87D truncation dominates (polynomial captures secular trend).
// Outer planets: larger secular drift, polynomial reduces mean error ~30-40%.
const CORRECTIONS: Partial<Record<Planet, CorrectionCoeffs>> = {
  mercury: { c0: 1.032914, c2: -310.833825, c4: 3971.392489, c6: -25283.573354 },
  venus:   { c0: 3.203028, c2: -303.293119, c4: 3667.723344, c6: -22382.025131 },
  mars:    { c0: 13.321594, c2: -140.615778, c4: 1341.456827, c6: -6086.155884 },
  jupiter: { c0: 18.378314, c2: -60.793482, c4: 1979.551217, c6: -14381.360642 },
  saturn:  { c0: 19.178414, c2: -4.642329, c4: -17.796777, c6: 513.439309 },
  uranus:  { c0: 19.959854, c2: 4.641783, c4: -892.179130, c6: 8522.016636 },
  neptune: { c0: 19.087166, c2: 15.817694, c4: -452.117173, c6: 3441.545710 },
};

/**
 * Get DE441 longitude correction in arcseconds for a planet at tau.
 * Returns 0 if no correction has been fitted for this planet.
 */
export function getDE441Correction(planet: Planet, tau: number): number {
  const c = CORRECTIONS[planet];
  if (!c) return 0;
  const tau2 = tau * tau;
  return c.c0 + c.c2 * tau2 + c.c4 * tau2 * tau2 + c.c6 * tau2 * tau2 * tau2;
}
