/**
 * Apparent geocentric ecliptic longitude of the Sun, computed from VSOP87D
 * Earth heliocentric coordinates with aberration and nutation corrections.
 *
 * VSOP87D provides coordinates in the ecliptic of date (precession built in),
 * eliminating the need for an external precession formula and avoiding the
 * frame-mismatch issue that occurs with VSOP87B + separate precession.
 *
 * Includes sxwnl's DE405 correction polynomial to compensate for VSOP87
 * truncation errors, achieving sub-second solar term precision.
 */

import { EARTH_L, EARTH_R, evaluateVsopSeries } from './vsop87d-earth';
import {
  DEG_TO_RAD, RAD_TO_DEG, ARCSEC_TO_RAD,
  dateToJulianMillennia, dateToJulianCenturies,
  delaunayArgs, nutationDpsi, nutationDeps,
  meanObliquity,
  normalizeDegrees, normalizeRadians,
} from './astro';

/**
 * Compute apparent geocentric ecliptic longitude of the Sun in degrees [0, 360).
 *
 * VSOP87D gives heliocentric coordinates referred to the ecliptic of date
 * (precession is built into the coefficients). We apply:
 * 1. Evaluate VSOP87D heliocentric longitude L and radius R
 * 2. Apply sxwnl's DE405 correction (compensates for VSOP87 truncation)
 * 3. Convert to geocentric: lon = L + PI
 * 4. Apply nutation in longitude (IAU2000B, 77 lunisolar terms)
 * 5. Apply aberration correction
 * 6. Normalize to [0, 360)
 *
 * No external precession or FK5 correction needed with VSOP87D.
 *
 * @param date - The moment to compute longitude for
 * @returns Solar longitude in degrees [0, 360)
 */
export function getSunLongitude(date: Date): number {
  const tau = dateToJulianMillennia(date);
  const T = dateToJulianCenturies(date);

  // Heliocentric longitude and radius from VSOP87D (radians / AU)
  let L = evaluateVsopSeries(EARTH_L, tau);
  const R = evaluateVsopSeries(EARTH_R, tau);

  // DE441-fitted even-polynomial correction for VSOP87D longitude.
  // Least-squares fit to 1,008 solar-term crossings against JPL DE441
  // over 42 years (209–2493 CE, systematic + random sampling, seed=42).
  // Even-only terms (τ², τ⁴, τ⁶) ensure symmetric accuracy for past/future.
  // Residuals: mean 1.27s, max 3.76s across 209–2493 CE (vs 26.4s / 61.7s prior).
  // Units: arcseconds → radians (divided by 206264.806)
  const tau2 = tau * tau;
  L += (-0.106674 - 0.616597 * tau2 + 0.315446 * tau2 * tau2
    - 0.050315 * tau2 * tau2 * tau2) / 206264.806;

  // Convert heliocentric to geocentric: add 180 degrees (PI radians)
  let lon = L + Math.PI;

  // Nutation in longitude (IAU2000B, 77 lunisolar terms)
  const args = delaunayArgs(T);
  const dpsi = nutationDpsi(args.l, args.lp, args.F, args.D, args.Om, T);
  lon += dpsi * ARCSEC_TO_RAD;

  // Aberration correction (Ron & Vondrak, ~20.4898" constant of aberration)
  lon += (-20.4898 / R) * ARCSEC_TO_RAD;

  // Normalize to [0, 2*PI) then convert to degrees
  lon = normalizeRadians(lon);
  return lon * RAD_TO_DEG;
}

/**
 * Determine if the sun's longitude crossed the target value between two longitudes,
 * accounting for the 360->0 degree wrap.
 */
function crossesTarget(lon1: number, lon2: number, target: number): boolean {
  // Normalize all values
  lon1 = normalizeDegrees(lon1);
  lon2 = normalizeDegrees(lon2);
  target = normalizeDegrees(target);

  // Compute forward angular distance from lon1 to lon2
  const forward = normalizeDegrees(lon2 - lon1);

  // If the sun moved backwards (more than 180 degrees forward = actually backward),
  // something is wrong; skip this bracket
  if (forward > 180) return false;

  // Compute forward angular distance from lon1 to target
  const toTarget = normalizeDegrees(target - lon1);

  // Target is crossed if it lies within the forward arc from lon1 to lon2
  return toTarget <= forward;
}

/**
 * Find the exact moment when the Sun's apparent longitude reaches a target value.
 *
 * Uses a coarse daily scan followed by binary search to ~1 second precision.
 *
 * @param targetLongitude - Target solar ecliptic longitude in degrees [0, 360)
 * @param startDate - Start of the search window
 * @param searchDays - Number of days to search from startDate
 * @returns The Date when the Sun reaches the target longitude, or null if not found
 */
export function findSunLongitudeMoment(
  targetLongitude: number,
  startDate: Date,
  searchDays: number,
): Date | null {
  const target = normalizeDegrees(targetLongitude);
  const startMs = startDate.getTime();
  const dayMs = 86400000;

  // Coarse scan: step 1 day at a time, find the bracket where longitude crosses target
  let prevLon = getSunLongitude(startDate);
  let bracketStartMs: number | null = null;
  let bracketEndMs: number | null = null;

  for (let d = 1; d <= searchDays; d++) {
    const currentMs = startMs + d * dayMs;
    const currentLon = getSunLongitude(new Date(currentMs));

    if (crossesTarget(prevLon, currentLon, target)) {
      bracketStartMs = startMs + (d - 1) * dayMs;
      bracketEndMs = currentMs;
      break;
    }

    prevLon = currentLon;
  }

  if (bracketStartMs === null || bracketEndMs === null) return null;

  // Binary search within the bracket to ~1 second precision (1000ms)
  let lo = bracketStartMs;
  let hi = bracketEndMs;

  while (hi - lo > 1000) {
    const mid = lo + Math.floor((hi - lo) / 2);
    const midLon = getSunLongitude(new Date(mid));

    if (crossesTarget(getSunLongitude(new Date(lo)), midLon, target)) {
      hi = mid;
    } else {
      lo = mid;
    }
  }

  // Return the midpoint of the final bracket
  return new Date(lo + Math.floor((hi - lo) / 2));
}

// ── Equation of Time (VSOP87D-based, Meeus Ch. 28) ──────────────────────

/**
 * Compute the Equation of Time using full VSOP87D planetary theory.
 *
 * Formula (Meeus, Astronomical Algorithms, Ch. 28):
 *   EoT = L₀ - 0.0057183° - α
 *
 * Where:
 *   L₀ = Sun's geometric mean longitude (polynomial in T)
 *   α  = Sun's apparent right ascension (from apparent ecliptic longitude
 *         via VSOP87D + IAU2000B nutation + DE405 correction + aberration)
 *   0.0057183° = aberration constant, compensating for aberration already
 *                included in the apparent α
 *
 * Sign convention: positive = sundial ahead of clock
 *   (apparent solar time > mean solar time)
 *   February: ~+14 min, November: ~-16 min
 *
 * Accuracy: sub-second (limited by VSOP87D truncation, ~0.5" in longitude).
 * This replaces the Spencer 1971 Fourier approximation (~30s accuracy).
 *
 * @param date - The moment to compute EoT for (UT)
 * @returns EoT in minutes
 */
export function equationOfTimeVSOP(date: Date): number {
  const T = dateToJulianCenturies(date);
  const T2 = T * T;

  // 1. Sun's apparent ecliptic longitude (degrees) — full VSOP87D pipeline
  const lambdaDeg = getSunLongitude(date);
  const lambda = lambdaDeg * DEG_TO_RAD;

  // 2. Mean obliquity of the ecliptic (Laskar 1986)
  const eps0 = meanObliquity(T);

  // 3. Nutation in obliquity (IAU2000B, 77 terms)
  const args = delaunayArgs(T);
  const depsAs = nutationDeps(args.l, args.lp, args.F, args.D, args.Om, T);
  const eps = eps0 + depsAs * ARCSEC_TO_RAD;

  // 4. Apparent right ascension from ecliptic longitude and true obliquity
  const alpha = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda));
  const alphaDeg = normalizeDegrees(alpha * RAD_TO_DEG);

  // 5. Sun's geometric mean longitude (Meeus, degrees)
  const L0 = normalizeDegrees(280.46646 + 36000.76983 * T + 0.0003032 * T2);

  // 6. EoT = L₀ - 0.0057183° - α (Meeus Ch. 28)
  //    Meeus convention: positive = mean sun ahead of apparent sun.
  //    Our convention: positive = sundial ahead of clock (apparent > mean).
  //    So we negate: EoT = -(L₀ - 0.0057183° - α) = α - L₀ + 0.0057183°
  let E = alphaDeg - L0 + 0.0057183;

  // Normalize to [-180, 180]
  E = ((E + 180) % 360 + 360) % 360 - 180;

  // Convert degrees to minutes of time: 1° = 4 minutes
  return E * 4;
}
