/**
 * Apparent geocentric ecliptic longitude of the Sun, computed from VSOP87B
 * Earth heliocentric coordinates with aberration and nutation corrections.
 *
 * Replaces astronomy-engine's SearchSunLongitude with a self-contained
 * implementation that depends only on our VSOP87B coefficient data.
 */

import { EARTH_L, EARTH_R, evaluateVsopSeries } from './vsop87b-earth';

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const ARCSEC_TO_RAD = Math.PI / 180 / 3600;

/**
 * Convert a Date to Julian Date (JD).
 */
function dateToJD(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

/**
 * Convert a Date to Julian millennia from J2000.0 (for VSOP87B).
 */
function dateToJulianMillennia(date: Date): number {
  return (dateToJD(date) - 2451545.0) / 365250.0;
}

/**
 * Convert a Date to Julian centuries from J2000.0 (for nutation formulas).
 */
function dateToJulianCenturies(date: Date): number {
  return (dateToJD(date) - 2451545.0) / 36525.0;
}

/**
 * Normalize an angle in degrees to [0, 360).
 */
function normalizeDegrees(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/**
 * Normalize an angle in radians to [0, 2*PI).
 */
function normalizeRadians(rad: number): number {
  const TWO_PI = 2 * Math.PI;
  return ((rad % TWO_PI) + TWO_PI) % TWO_PI;
}

/**
 * Compute apparent geocentric ecliptic longitude of the Sun in degrees [0, 360).
 *
 * VSOP87B gives heliocentric coordinates referred to the ecliptic of J2000.0.
 * To obtain the apparent longitude referred to the ecliptic of date, we apply:
 * 1. Evaluate VSOP87B heliocentric longitude L and radius R
 * 2. Convert to geocentric: lon = L + PI
 * 3. Apply FK5 correction (~-0.09" offset)
 * 4. Precess from J2000 ecliptic to ecliptic of date
 * 5. Apply nutation in longitude (IAU 1980 simplified)
 * 6. Apply aberration correction
 * 7. Normalize to [0, 360)
 *
 * @param date - The moment to compute longitude for
 * @returns Solar longitude in degrees [0, 360)
 */
export function getSunLongitude(date: Date): number {
  const tau = dateToJulianMillennia(date);
  const T = dateToJulianCenturies(date);

  // Heliocentric longitude and radius from VSOP87B (radians / AU)
  const L = evaluateVsopSeries(EARTH_L, tau);
  const R = evaluateVsopSeries(EARTH_R, tau);

  // Convert heliocentric to geocentric: add 180 degrees (PI radians)
  let lon = L + Math.PI;

  // FK5 correction (Meeus, p. 166): small frame rotation ~-0.09033"
  lon += (-0.09033) * ARCSEC_TO_RAD;

  // Precession: convert from J2000 ecliptic to ecliptic of date
  // General precession in longitude (Lieske 1979, Meeus eq. 21.3):
  //   pA = (5029.0966 + 2.22226*T - 0.000042*T²) * T  arcseconds
  const pA = (5029.0966 + 2.22226 * T - 0.000042 * T * T) * T;
  lon += pA * ARCSEC_TO_RAD;

  // Nutation in longitude (simplified dominant terms, IAU 1980 truncated)
  const omega = (125.04452 - 1934.136261 * T) * DEG_TO_RAD;
  const Lsun = (280.4664567 + 36000.76983 * T) * DEG_TO_RAD;
  const Lmoon = (218.3165 + 481267.8813 * T) * DEG_TO_RAD;
  const dpsi = (
    -17.20 * Math.sin(omega)
    - 1.32 * Math.sin(2 * Lsun)
    - 0.23 * Math.sin(2 * Lmoon)
    + 0.21 * Math.sin(2 * omega)
  ) * ARCSEC_TO_RAD;

  lon += dpsi;

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
