/**
 * Public API for planetary positions.
 *
 * Computes apparent geocentric ecliptic coordinates for Mercury–Neptune
 * using VSOP87D heliocentric theory + geocentric conversion + IAU2000B
 * nutation + aberration correction + DE441 even-polynomial correction.
 *
 * Pluto uses Meeus Chapter 37 (43 periodic terms, valid 1885-2099).
 */

import { evaluateVsopSeries } from '../vsop87d-earth';
import { EARTH_L, EARTH_B, EARTH_R } from '../vsop87d-earth';
import {
  dateToJulianMillennia, dateToJulianCenturies,
  delaunayArgs, nutationDpsi,
  trueObliquity, eclipticToEquatorial,
  normalizeDegrees, normalizeRadians,
  RAD_TO_DEG, ARCSEC_TO_RAD,
} from '../astro';
import { type HeliocentricPosition, lightTimeCorrected } from './geocentric';
import { getDE441Correction } from './de441-corrections';
import type { Planet, GeocentricPosition } from '../types';

// Import VSOP87D coefficients per planet
import { MERCURY_L, MERCURY_B, MERCURY_R } from './vsop87d-mercury';
import { VENUS_L, VENUS_B, VENUS_R } from './vsop87d-venus';
import { MARS_L, MARS_B, MARS_R } from './vsop87d-mars';
import { JUPITER_L, JUPITER_B, JUPITER_R } from './vsop87d-jupiter';
import { SATURN_L, SATURN_B, SATURN_R } from './vsop87d-saturn';
import { URANUS_L, URANUS_B, URANUS_R } from './vsop87d-uranus';
import { NEPTUNE_L, NEPTUNE_B, NEPTUNE_R } from './vsop87d-neptune';
import { getPlutoHelio } from './pluto';

type VsopCoeffs = readonly (readonly (readonly [number, number, number])[])[];

const PLANET_COEFFS: Record<string, { L: VsopCoeffs; B: VsopCoeffs; R: VsopCoeffs }> = {
  mercury: { L: MERCURY_L, B: MERCURY_B, R: MERCURY_R },
  venus:   { L: VENUS_L,   B: VENUS_B,   R: VENUS_R },
  mars:    { L: MARS_L,    B: MARS_B,    R: MARS_R },
  jupiter: { L: JUPITER_L, B: JUPITER_B, R: JUPITER_R },
  saturn:  { L: SATURN_L,  B: SATURN_B,  R: SATURN_R },
  uranus:  { L: URANUS_L,  B: URANUS_B,  R: URANUS_R },
  neptune: { L: NEPTUNE_L, B: NEPTUNE_B, R: NEPTUNE_R },
};

function getHelioPosition(planet: string, tau: number): HeliocentricPosition {
  const c = PLANET_COEFFS[planet];
  return {
    L: evaluateVsopSeries(c.L, tau),
    B: evaluateVsopSeries(c.B, tau),
    R: evaluateVsopSeries(c.R, tau),
  };
}

function getEarthHelio(tau: number): HeliocentricPosition {
  return {
    L: evaluateVsopSeries(EARTH_L, tau),
    B: evaluateVsopSeries(EARTH_B, tau),
    R: evaluateVsopSeries(EARTH_R, tau),
  };
}

/**
 * Compute the apparent geocentric position of a planet.
 *
 * Pipeline:
 * 1. VSOP87D heliocentric coordinates for planet and Earth
 * 2. Geocentric conversion with light-time correction
 * 3. Aberration correction
 * 4. Nutation in longitude
 * 5. DE441 even-polynomial correction
 * 6. Ecliptic → equatorial for RA/Dec
 */
export function getPlanetPosition(planet: Planet, date: Date): GeocentricPosition {
  const tau = dateToJulianMillennia(date);
  const T = dateToJulianCenturies(date);
  const earth = getEarthHelio(tau);

  // Geocentric with light-time correction
  const geo = lightTimeCorrected(
    planet === 'pluto'
      ? (t) => getPlutoHelio(t)
      : (t) => getHelioPosition(planet, t),
    earth,
    tau,
  );

  // Aberration correction (Ron & Vondrak constant of aberration)
  // For planets, aberration in longitude ≈ -20.4898" / R_earth
  const earthR = earth.R;
  let lon = geo.longitude + (-20.4898 / earthR) * ARCSEC_TO_RAD;

  // Nutation in longitude
  const args = delaunayArgs(T);
  const dpsi = nutationDpsi(args.l, args.lp, args.F, args.D, args.Om, T);
  lon += dpsi * ARCSEC_TO_RAD;

  // DE441 correction (if available for this planet)
  const correction = getDE441Correction(planet, tau);
  lon += correction * ARCSEC_TO_RAD;

  lon = normalizeRadians(lon);
  const lat = geo.latitude;

  // Convert to equatorial
  const eps = trueObliquity(T);
  const [ra, dec] = eclipticToEquatorial(lon, lat, eps);

  return {
    longitude: normalizeDegrees(lon * RAD_TO_DEG),
    latitude: lat * RAD_TO_DEG,
    distance: geo.distance,
    ra: normalizeDegrees(ra * RAD_TO_DEG),
    dec: dec * RAD_TO_DEG,
  };
}
