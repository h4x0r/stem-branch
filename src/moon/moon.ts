/* v8 ignore next */
/**
 * Public API for Moon position.
 *
 * Computes apparent geocentric ecliptic coordinates using ELP/MPP02 theory
 * + IAU2000B nutation correction.
 */

import { computeMoonPosition } from './elpmpp02';
import {
  dateToJulianCenturies,
  delaunayArgs, nutationDpsi,
  trueObliquity, eclipticToEquatorial,
  precessionInLongitude,
  normalizeDegrees, normalizeRadians,
  RAD_TO_DEG, ARCSEC_TO_RAD,
} from '../astro';
import type { GeocentricPosition } from '../types';

/**
 * Compute the apparent geocentric position of the Moon.
 *
 * Pipeline:
 * 1. ELP/MPP02 geometric ecliptic coordinates (J2000.0)
 * 2. Nutation in longitude
 * 3. Ecliptic → equatorial for RA/Dec
 *
 * @param date - JavaScript Date (UT)
 * @returns Apparent geocentric position (longitude/latitude in degrees, distance in km)
 */
export function getMoonPosition(date: Date): GeocentricPosition {
  const T = dateToJulianCenturies(date);

  // ELP/MPP02 geometric position (J2000.0 mean ecliptic)
  const moon = computeMoonPosition(T);

  // Precess J2000.0 → mean ecliptic of date, then add nutation
  const pA = precessionInLongitude(T);  // arcseconds
  const dArgs = delaunayArgs(T);
  const dpsi = nutationDpsi(dArgs.l, dArgs.lp, dArgs.F, dArgs.D, dArgs.Om, T);
  let lon = moon.longitude + (pA + dpsi) * ARCSEC_TO_RAD;
  lon = normalizeRadians(lon);

  const lat = moon.latitude;

  // Convert to equatorial
  const eps = trueObliquity(T);
  const [ra, dec] = eclipticToEquatorial(lon, lat, eps);

  return {
    longitude: normalizeDegrees(lon * RAD_TO_DEG),
    latitude: lat * RAD_TO_DEG,
    distance: moon.distance,
    ra: normalizeDegrees(ra * RAD_TO_DEG),
    dec: dec * RAD_TO_DEG,
  };
}
