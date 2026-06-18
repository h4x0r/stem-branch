/* v8 ignore next */
/**
 * Chiron geocentric ecliptic position via Keplerian orbital elements
 * and Kepler's equation (Newton-Raphson solver).
 *
 * Orbital elements: JPL Horizons solution #170, epoch 2017-Jun-05 (TDB).
 * Uses time of perihelion passage (TP) for mean anomaly computation.
 * Accuracy: ~1-2° of JPL Horizons geocentric positions.
 */

import { dateToJD_TT, DEG_TO_RAD, RAD_TO_DEG, normalizeDegrees } from '../astro';
import { getSunLongitude } from '../solar-longitude';

// JPL Horizons solution #170, epoch 2017-Jun-05.00 (TDB)
// IAU76/J2000 heliocentric ecliptic osculating elements
const CHIRON = {
  e: 0.3824332665761756,       // eccentricity
  q: 8.427167256222019,        // perihelion distance (AU)
  tp: 2450143.7139770077,      // time of perihelion passage (JD TDB)
  node: 209.2011110969138,     // longitude of ascending node (degrees)
  peri: 339.6507836360996,     // argument of perihelion (degrees)
  i: 6.949594396841555,        // inclination (degrees)
  n: 0.019552734,              // mean daily motion (degrees/day)
  a: 8.427167256222019 / (1 - 0.3824332665761756), // semi-major axis (AU)
};

/**
 * Solve Kepler's equation  E - e*sin(E) = M  via Newton-Raphson iteration.
 * @param M  Mean anomaly in radians
 * @param e  Eccentricity
 * @returns  Eccentric anomaly in radians
 */
function solveKepler(M: number, e: number): number {
  let E = M; // initial guess
  for (let iter = 0; iter < 30; iter++) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-12) break;
  }
  return E;
}

/**
 * Compute geocentric ecliptic position of Chiron for a given date.
 *
 * @param date - The moment to compute the position for
 * @returns Ecliptic longitude (degrees, [0,360)), latitude (degrees), distance (AU)
 */
export function getChironPosition(date: Date): {
  longitude: number;
  latitude: number;
  distance: number;
} {
  // Step 1: Julian date in TT
  const jdTT = dateToJD_TT(date);

  // Step 2: Mean anomaly from time of perihelion passage
  const dt = jdTT - CHIRON.tp;
  const M_deg = normalizeDegrees(CHIRON.n * dt);
  const M = M_deg * DEG_TO_RAD;

  // Step 3: Solve Kepler's equation for eccentric anomaly
  const E = solveKepler(M, CHIRON.e);

  // Step 4: True anomaly
  const sinNu = Math.sqrt(1 - CHIRON.e * CHIRON.e) * Math.sin(E) / (1 - CHIRON.e * Math.cos(E));
  const cosNu = (Math.cos(E) - CHIRON.e) / (1 - CHIRON.e * Math.cos(E));
  const nu = Math.atan2(sinNu, cosNu);

  // Step 5: Heliocentric distance
  const r = CHIRON.a * (1 - CHIRON.e * Math.cos(E));

  // Step 6: Heliocentric ecliptic coordinates
  const omega = CHIRON.peri * DEG_TO_RAD;  // argument of perihelion
  const Omega = CHIRON.node * DEG_TO_RAD;  // longitude of ascending node
  const inc = CHIRON.i * DEG_TO_RAD;       // inclination

  // Argument of latitude (position angle in orbital plane)
  const u = nu + omega;

  // Heliocentric ecliptic rectangular coordinates
  const xh = r * (Math.cos(Omega) * Math.cos(u) - Math.sin(Omega) * Math.sin(u) * Math.cos(inc));
  const yh = r * (Math.sin(Omega) * Math.cos(u) + Math.cos(Omega) * Math.sin(u) * Math.cos(inc));
  const zh = r * Math.sin(u) * Math.sin(inc);

  // Step 7: Heliocentric Earth position (approximation from Sun longitude)
  // Earth is opposite the Sun: heliocentric Earth longitude = sunLon + 180°
  const sunLon = getSunLongitude(date);
  const earthLon = (sunLon + 180) * DEG_TO_RAD;
  const R_sun = 1.0; // Earth-Sun distance approximation (AU)

  // Earth heliocentric rectangular coordinates (ecliptic plane, z ~ 0)
  const xe = R_sun * Math.cos(earthLon);
  const ye = R_sun * Math.sin(earthLon);

  // Step 8: Geocentric rectangular coordinates
  const xg = xh - xe;
  const yg = yh - ye;
  const zg = zh;

  // Convert to ecliptic longitude and latitude
  const rGeo = Math.sqrt(xg * xg + yg * yg + zg * zg);
  const longitude = normalizeDegrees(Math.atan2(yg, xg) * RAD_TO_DEG);
  const latitude = Math.asin(zg / rGeo) * RAD_TO_DEG;

  return { longitude, latitude, distance: rGeo };
}
