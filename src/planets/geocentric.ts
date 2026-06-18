/* v8 ignore next */
/**
 * Heliocentric to geocentric coordinate conversion with light-time correction.
 *
 * Transforms VSOP87D heliocentric spherical coordinates to geometric
 * geocentric ecliptic coordinates. Light-time correction iteratively
 * recomputes the planet position at (t - τ_light).
 */

import { C_AU_PER_DAY } from '../astro';

export interface HeliocentricPosition {
  L: number;  // heliocentric longitude (radians)
  B: number;  // heliocentric latitude (radians)
  R: number;  // distance from Sun (AU)
}

export interface GeocentricEcliptic {
  longitude: number;  // geocentric ecliptic longitude (radians)
  latitude: number;   // geocentric ecliptic latitude (radians)
  distance: number;   // geocentric distance (AU)
}

/**
 * Convert heliocentric spherical to rectangular coordinates.
 */
function sphericalToRectangular(pos: HeliocentricPosition): [number, number, number] {
  const cosB = Math.cos(pos.B);
  return [
    pos.R * cosB * Math.cos(pos.L),
    pos.R * cosB * Math.sin(pos.L),
    pos.R * Math.sin(pos.B),
  ];
}

/**
 * Convert heliocentric positions of planet and Earth to geocentric ecliptic.
 * Planet and Earth both in heliocentric ecliptic of date (VSOP87D).
 */
export function helioToGeo(
  planet: HeliocentricPosition,
  earth: HeliocentricPosition,
): GeocentricEcliptic {
  const [Xp, Yp, Zp] = sphericalToRectangular(planet);
  const [Xe, Ye, Ze] = sphericalToRectangular(earth);

  const dX = Xp - Xe;
  const dY = Yp - Ye;
  const dZ = Zp - Ze;

  const distance = Math.sqrt(dX * dX + dY * dY + dZ * dZ);
  const longitude = Math.atan2(dY, dX);
  const latitude = Math.atan2(dZ, Math.sqrt(dX * dX + dY * dY));

  return {
    longitude: ((longitude % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI),
    latitude,
    distance,
  };
}

/**
 * Geocentric position with light-time correction.
 *
 * Iteratively adjusts the planet position to account for the finite speed
 * of light. Typically converges in 2-3 iterations.
 *
 * @param getPlanetHelio - Function that returns heliocentric position at tau
 * @param earth - Earth's heliocentric position at observation time
 * @param tau - Julian millennia (observation time)
 * @param maxIter - Maximum iterations (default 3)
 */
export function lightTimeCorrected(
  getPlanetHelio: (tau: number) => HeliocentricPosition,
  earth: HeliocentricPosition,
  tau: number,
  maxIter = 3,
): GeocentricEcliptic {
  // Initial geometric position (no light-time)
  let geo = helioToGeo(getPlanetHelio(tau), earth);
  let lightDays = geo.distance / C_AU_PER_DAY;

  for (let i = 0; i < maxIter; i++) {
    // Recompute planet position at earlier time
    const tauCorrected = tau - lightDays / 365250; // convert days to millennia
    const planetRetarded = getPlanetHelio(tauCorrected);
    geo = helioToGeo(planetRetarded, earth);

    const newLightDays = geo.distance / C_AU_PER_DAY;
    if (Math.abs(newLightDays - lightDays) < 1e-10) break; // converged
    lightDays = newLightDays;
  }

  return geo;
}
