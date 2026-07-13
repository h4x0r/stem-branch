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
import { solarEclipticState } from '../solar-longitude';
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

/**
 * Apparent geocentric ecliptic longitude of the Moon (degrees, of date) at a
 * Julian Ephemeris Day in TT. The jde-based core of {@link getMoonPosition}'s
 * longitude — used by the true-conjunction new-moon solver.
 */
export function moonApparentLongitude(jdeTT: number): number {
  const T = (jdeTT - 2451545.0) / 36525.0;
  const moon = computeMoonPosition(T);
  const pA = precessionInLongitude(T);
  const dArgs = delaunayArgs(T);
  const dpsi = nutationDpsi(dArgs.l, dArgs.lp, dArgs.F, dArgs.D, dArgs.Om, T);
  const lon = normalizeRadians(moon.longitude + (pA + dpsi) * ARCSEC_TO_RAD);
  return normalizeDegrees(lon * RAD_TO_DEG);
}

/** Astronomical unit in kilometres (IAU 2012 definition). */
const AU_KM = 149597870.7;

/**
 * Moon phase geometry at a Julian Ephemeris Day (TT): elongation, phase angle,
 * and illuminated fraction, from the Moon's and Sun's geocentric positions.
 */
export interface MoonPhase {
  /**
   * Geocentric ecliptic-longitude elongation Moon−Sun, degrees `[0, 360)`:
   * 0 = new, 90 = first quarter, 180 = full, 270 = last quarter.
   */
  elongationDeg: number;
  /** Phase angle i (Sun–Moon–Earth), degrees `[0, 180]`: 0 = full, 180 = new. */
  phaseAngleDeg: number;
  /** Illuminated fraction of the Moon's disc, `0`–`1` (Meeus eq. 48.1). */
  illuminatedFraction: number;
  /** `true` while waxing (new → full), `false` while waning. */
  waxing: boolean;
}

/**
 * Compute the Moon's phase geometry at a Julian Ephemeris Day in TT.
 *
 * Uses the true geocentric elongation ψ (Meeus eq. 48.2,
 * `cos ψ = cos β · cos(λ_moon − λ_sun)`, β = the Moon's ecliptic latitude) and
 * the phase angle from the real Sun and Moon distances (eq. 48.3), so the
 * illuminated fraction is accurate near the quarters where the latitude term
 * matters — not the longitude-only shortcut.
 */
export function moonPhase(jdeTT: number): MoonPhase {
  const T = (jdeTT - 2451545.0) / 36525.0;
  const moon = computeMoonPosition(T);
  const pA = precessionInLongitude(T);
  const dArgs = delaunayArgs(T);
  const dpsi = nutationDpsi(dArgs.l, dArgs.lp, dArgs.F, dArgs.D, dArgs.Om, T);
  const lonRad = normalizeRadians(moon.longitude + (pA + dpsi) * ARCSEC_TO_RAD);
  const latRad = moon.latitude;
  const distanceKm = moon.distance;

  const sun = solarEclipticState(jdeTT);
  const lamS = sun.apparentLongitudeDegrees / RAD_TO_DEG;

  // Meeus 48.2: true geocentric elongation ψ (the Sun's ecliptic latitude ≈ 0).
  const cosPsi = Math.cos(latRad) * Math.cos(lonRad - lamS);
  const psi = Math.acos(Math.min(1, Math.max(-1, cosPsi)));

  // Meeus 48.3: phase angle i from Sun distance R and Moon distance Δ.
  const rKm = sun.radiusAu * AU_KM;
  const i = Math.atan2(rKm * Math.sin(psi), distanceKm - rKm * cosPsi);
  const illuminatedFraction = (1 + Math.cos(i)) / 2;

  const elongationDeg = normalizeDegrees(lonRad * RAD_TO_DEG - sun.apparentLongitudeDegrees);
  return {
    elongationDeg,
    phaseAngleDeg: i * RAD_TO_DEG,
    illuminatedFraction,
    waxing: elongationDeg < 180,
  };
}
