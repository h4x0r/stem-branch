/* v8 ignore next */
/**
 * Tropical (Western) astrology module.
 *
 * Provides zodiac sign determination, house cusp calculation (Placidus, Koch,
 * Equal, Whole-sign), aspect detection, classical dignity lookup, and full
 * tropical chart computation.
 *
 * All longitudes are tropical ecliptic degrees [0, 360).
 */

import {
  DEG_TO_RAD, RAD_TO_DEG,
  dateToJulianCenturies,
  trueObliquity,
  greenwichMeanSiderealTime,
  normalizeDegrees,
} from './astro';
import { getSunLongitude } from './solar-longitude';
import { getMoonPosition } from './moon/moon';
import { getPlanetPosition } from './planets/planets';
import { getChironPosition } from './planets/chiron';
import { getRahuPosition, getYuebeiPosition } from './seven-governors/four-remainders';
import type { Planet, GeocentricPosition } from './types';

// ── Cross-tradition function aliases ─────────────────────────────────────
//
// The Seven Governors (七政四餘) module computes lunar node and apogee
// positions using Meeus-based formulas. We reuse these for Western
// astrology because the underlying astronomy is identical:
//
//   Chinese Rahu (羅睺)  = Moon's mean ascending node  = Western "North Node"
//   Chinese Yuebei (月孛) = Moon's mean apogee          = Western "Mean Lilith" (Black Moon)
//
// Note: Chinese Ketu (計都) is NOT the descending node in the Chinese
// tradition — it shifted identity to the osculating lunar apogee (per
// Niu Weixing's research). We do NOT use getKetuPosition() here.
// The South Node is simply North Node + 180°.

/** Mean ascending lunar node (= Western "North Node"). */
const getNorthNodePosition = getRahuPosition;

/** Mean lunar apogee (= Western "Mean Lilith" / Black Moon Lilith). */
const getLilithPosition = getYuebeiPosition;

// ── Types ────────────────────────────────────────────────────────────────

export type ZodiacSign =
  | 'Aries' | 'Taurus' | 'Gemini' | 'Cancer' | 'Leo' | 'Virgo'
  | 'Libra' | 'Scorpio' | 'Sagittarius' | 'Capricorn' | 'Aquarius' | 'Pisces';

export type HouseSystem = 'placidus' | 'koch' | 'equal' | 'whole-sign'
  | 'regiomontanus' | 'campanus' | 'porphyry' | 'alcabitius' | 'morinus' | 'topocentric';
export type AspectName =
  | 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile'
  | 'semi-sextile' | 'quincunx' | 'semi-square' | 'sesquiquadrate'
  | 'quintile' | 'biquintile';
export type Dignity = 'rulership' | 'exaltation' | 'detriment' | 'fall';

export interface TropicalPosition {
  body: string;
  longitude: number;
  latitude: number;
  sign: ZodiacSign;
  signDegree: number;
  house: number; // 1-12
  dignity: Dignity | null;
}

export interface TropicalAspect {
  body1: string;
  body2: string;
  type: AspectName;
  angle: number;
  orb: number;
  applying: boolean;
  major: boolean;
}

export interface HouseCusps {
  system: HouseSystem;
  cusps: number[]; // 12 cusp longitudes
  ascendant: number;
  midheaven: number;
}

export interface TropicalChart {
  positions: TropicalPosition[];
  houses: HouseCusps;
  aspects: TropicalAspect[];
}

export interface ChartOptions {
  houseSystem?: HouseSystem;
  orbs?: Partial<Record<AspectName, number>>;
}

// ── Constants ────────────────────────────────────────────────────────────

const ZODIAC_SIGNS: readonly ZodiacSign[] = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

const ASPECT_ANGLES: Record<AspectName, number> = {
  conjunction: 0,
  sextile: 60,
  square: 90,
  trine: 120,
  opposition: 180,
  'semi-sextile': 30,
  quincunx: 150,
  'semi-square': 45,
  sesquiquadrate: 135,
  quintile: 72,
  biquintile: 144,
};

const MAJOR_ASPECTS: ReadonlySet<AspectName> = new Set([
  'conjunction', 'opposition', 'trine', 'square', 'sextile',
]);

const DEFAULT_ORBS: Record<AspectName, number> = {
  conjunction: 8,
  opposition: 8,
  trine: 8,
  square: 7,
  sextile: 6,
  'semi-sextile': 2,
  quincunx: 2,
  'semi-square': 2,
  sesquiquadrate: 2,
  quintile: 2,
  biquintile: 2,
};

const PLANETS: Planet[] = [
  'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
];

// ── Zodiac sign ──────────────────────────────────────────────────────────

/**
 * Determine the zodiac sign and degree within that sign for a given
 * ecliptic longitude.
 *
 * @param longitude - Tropical ecliptic longitude in degrees
 * @returns The zodiac sign and degree within the sign [0, 30)
 */
export function getZodiacSign(longitude: number): { sign: ZodiacSign; degree: number } {
  const norm = normalizeDegrees(longitude);
  const signIndex = Math.floor(norm / 30);
  // Guard against floating-point edge case where norm = 360
  /* v8 ignore next */
  const idx = signIndex >= 12 ? 0 : signIndex;
  return {
    sign: ZODIAC_SIGNS[idx],
    degree: norm - idx * 30,
  };
}

// ── House computation ────────────────────────────────────────────────────

/**
 * Compute the Ascendant (ASC) ecliptic longitude.
 *
 * Formula from Meeus, Astronomical Algorithms, Ch. 13:
 *   ASC = atan2(-cos(RAMC), sin(RAMC)*cos(eps) + tan(lat)*sin(eps))
 *
 * where RAMC = local sidereal time in radians.
 *
 * @param lstRad - Local sidereal time in radians
 * @param epsRad - Obliquity of the ecliptic in radians
 * @param latRad - Geographic latitude in radians
 * @returns Ascendant longitude in degrees [0, 360)
 */
export function computeAscendant(lstRad: number, epsRad: number, latRad: number): number {
  const sinLST = Math.sin(lstRad);
  const cosLST = Math.cos(lstRad);
  const sinEps = Math.sin(epsRad);
  const cosEps = Math.cos(epsRad);
  const tanLat = Math.tan(latRad);

  // The formula tan(ASC) = -cos(θ) / (sin(ε)tan(φ) + cos(ε)sin(θ))
  // has two solutions 180° apart: the rising point (ASC) and setting point (DSC).
  // atan2(-cos(θ), D) consistently returns the DSC; negating both arguments
  // selects the ASC (eastern horizon / rising point).
  const D = sinLST * cosEps + tanLat * sinEps;
  const ascRad = Math.atan2(cosLST, -D);
  return normalizeDegrees(ascRad * RAD_TO_DEG);
}

/**
 * Compute the Midheaven (MC) ecliptic longitude.
 *
 * MC = atan(tan(RAMC) / cos(eps)), adjusted to correct quadrant.
 *
 * @param lstRad - Local sidereal time in radians (= RAMC in radians)
 * @param epsRad - Obliquity of the ecliptic in radians
 * @returns MC longitude in degrees [0, 360)
 */
export function computeMidheaven(lstRad: number, epsRad: number): number {
  const cosEps = Math.cos(epsRad);
  const mcRad = Math.atan2(Math.sin(lstRad), Math.cos(lstRad) * cosEps);
  return normalizeDegrees(mcRad * RAD_TO_DEG);
}

/**
 * Compute the ecliptic longitude of an intermediate Placidus cusp.
 *
 * Uses the Placidus semi-arc trisection method with iterative convergence.
 * For a given fraction f of the semi-arc between the meridian and horizon,
 * we solve for the ecliptic degree where the hour angle matches.
 *
 * The Placidus formula:
 *   MC_offset = RAMC + f * semi_arc
 *   longitude = atan2(sin(H), cos(H) * cos(eps)) where H is the offset
 *   Then iteratively correct using the declination of the resulting point.
 *
 * @param ramcDeg - RAMC (Right Ascension of MC) in degrees
 * @param epsRad - Obliquity in radians
 * @param latRad - Geographic latitude in radians
 * @param fraction - Fraction of semi-arc (1/3, 2/3 for cusps 11/12 or 2/3)
 * @param isNocturnal - If true, compute nocturnal cusps (below horizon)
 * @returns Ecliptic longitude in degrees [0, 360)
 */
function placidusCusp(
  ramcDeg: number,
  epsRad: number,
  latRad: number,
  fraction: number,
  isNocturnal: boolean,
): number {
  const sinEps = Math.sin(epsRad);
  const cosEps = Math.cos(epsRad);
  const tanLat = Math.tan(latRad);

  // Start with an initial estimate: interpolation between MC and ASC longitudes
  // We use RAMC-based approach for the house angle
  const ramcRad = ramcDeg * DEG_TO_RAD;

  // For diurnal cusps (11, 12): H = RAMC + fraction * DSA
  // For nocturnal cusps (2, 3): H = RAMC + DSA + fraction * NSA
  // Use ~90° as initial DSA estimate for mid-latitudes
  let H: number;
  if (isNocturnal) {
    H = ramcDeg + 90 + fraction * 90;
  } else {
    H = ramcDeg + fraction * 90;
  }

  // Iterate to converge on the correct cusp
  for (let iter = 0; iter < 20; iter++) {
    const hRad = normalizeDegrees(H) * DEG_TO_RAD;

    // Compute ecliptic longitude from house angle
    const lonRad = Math.atan2(Math.sin(hRad), Math.cos(hRad) * cosEps);
    const lonDeg = normalizeDegrees(lonRad * RAD_TO_DEG);

    // Compute declination of this ecliptic point (beta = 0 on ecliptic)
    const dec = Math.asin(sinEps * Math.sin(lonRad));

    // Compute the semi-arc for this declination
    // SA = acos(-tan(lat) * tan(dec))
    const x = -tanLat * Math.tan(dec);
    let semiArc: number;
    /* v8 ignore next 2 */
    if (x < -1) {
      semiArc = 180; // circumpolar - never sets
    /* v8 ignore next 2 */
    } else if (x > 1) {
      semiArc = 0; // never rises
    } else {
      semiArc = Math.acos(x) * RAD_TO_DEG;
    }

    // Desired house angle based on the semi-arc of this point
    // Diurnal cusps: offset = fraction * DSA (between MC and ASC)
    // Nocturnal cusps: offset = DSA + fraction * NSA (between ASC and IC)
    let Hnew: number;
    if (isNocturnal) {
      Hnew = ramcDeg + semiArc + fraction * (180 - semiArc);
    } else {
      Hnew = ramcDeg + fraction * semiArc;
    }

    // Check convergence
    const diff = Math.abs(normalizeDegrees(Hnew - H));
    H = Hnew;
    if (diff < 0.001 || diff > 359.999) break;
  }

  // Convert final H to ecliptic longitude
  const hRad = normalizeDegrees(H) * DEG_TO_RAD;
  const lonRad = Math.atan2(Math.sin(hRad), Math.cos(hRad) * cosEps);
  return normalizeDegrees(lonRad * RAD_TO_DEG);
}

/**
 * Compute Koch house cusps.
 *
 * Koch (Birthplace/GOH) system: compute the Ascendant at modified sidereal
 * times, offset by fractions of the MC degree's diurnal semi-arc.
 *
 * Standard formulas (matching Swiss Ephemeris):
 *   Cusp 11 = ASC at (RAMC - 2/3 * DSA_MC)
 *   Cusp 12 = ASC at (RAMC - 1/3 * DSA_MC)
 *   Cusp 2  = ASC at (RAMC + 1/3 * DSA_MC)
 *   Cusp 3  = ASC at (RAMC + 2/3 * DSA_MC)
 *
 * @param ramcDeg - RAMC in degrees
 * @param ascDeg - Ascendant in degrees
 * @param mcDeg - MC in degrees
 * @param epsRad - Obliquity in radians
 * @param latRad - Geographic latitude in radians
 * @returns Array of 12 cusp longitudes
 */
function computeKochCusps(
  ramcDeg: number,
  ascDeg: number,
  mcDeg: number,
  epsRad: number,
  latRad: number,
): number[] {
  const sinEps = Math.sin(epsRad);
  const tanLat = Math.tan(latRad);

  // Declination of the MC
  const mcRad = mcDeg * DEG_TO_RAD;
  const decMC = Math.asin(sinEps * Math.sin(mcRad));

  // Diurnal semi-arc of the MC degree
  const x = -tanLat * Math.tan(decMC);
  let semiArcMC: number;
  /* v8 ignore next 2 */
  if (x < -1) {
    semiArcMC = 180;
  /* v8 ignore next 2 */
  } else if (x > 1) {
    semiArcMC = 0;
  } else {
    semiArcMC = Math.acos(x) * RAD_TO_DEG;
  }

  const cusps: number[] = new Array(12);

  cusps[9] = mcDeg;    // Cusp 10 = MC
  cusps[0] = ascDeg;   // Cusp 1 = ASC

  // Compute Ascendant at modified sidereal times
  cusps[10] = computeAscendant(
    (ramcDeg - (2 / 3) * semiArcMC) * DEG_TO_RAD, epsRad, latRad,
  );
  cusps[11] = computeAscendant(
    (ramcDeg - (1 / 3) * semiArcMC) * DEG_TO_RAD, epsRad, latRad,
  );
  cusps[1] = computeAscendant(
    (ramcDeg + (1 / 3) * semiArcMC) * DEG_TO_RAD, epsRad, latRad,
  );
  cusps[2] = computeAscendant(
    (ramcDeg + (2 / 3) * semiArcMC) * DEG_TO_RAD, epsRad, latRad,
  );

  // Opposite cusps: 4-9
  cusps[3] = normalizeDegrees(cusps[9] + 180);   // 4 opposite 10
  cusps[4] = normalizeDegrees(cusps[10] + 180);  // 5 opposite 11
  cusps[5] = normalizeDegrees(cusps[11] + 180);  // 6 opposite 12
  cusps[6] = normalizeDegrees(cusps[0] + 180);   // 7 opposite 1
  cusps[7] = normalizeDegrees(cusps[1] + 180);   // 8 opposite 2
  cusps[8] = normalizeDegrees(cusps[2] + 180);   // 9 opposite 3

  return cusps;
}

/** Compute the shortest forward angular distance from a to b. */
function forwardArc(from: number, to: number): number {
  return ((to - from) % 360 + 360) % 360;
}

/**
 * Compute house cusps for a given date, location, and house system.
 *
 * @param date - JavaScript Date (UT)
 * @param lat - Geographic latitude in degrees (positive north)
 * @param lng - Geographic longitude in degrees (positive east)
 * @param system - House system to use
 * @returns House cusps, ASC, and MC
 */
export function computeHouses(
  date: Date,
  lat: number,
  lng: number,
  system: HouseSystem,
): HouseCusps {
  const T = dateToJulianCenturies(date);
  const epsRad = trueObliquity(T);

  // GMST in degrees, then LST = GMST + longitude
  const gmst = greenwichMeanSiderealTime(date);
  const lst = normalizeDegrees(gmst + lng);
  const lstRad = lst * DEG_TO_RAD;
  const latRad = lat * DEG_TO_RAD;

  // Compute ASC and MC (common to all systems)
  const ascendant = computeAscendant(lstRad, epsRad, latRad);
  const midheaven = computeMidheaven(lstRad, epsRad);

  let cusps: number[];

  switch (system) {
    case 'equal': {
      cusps = Array.from({ length: 12 }, (_, i) =>
        normalizeDegrees(ascendant + i * 30),
      );
      break;
    }

    case 'whole-sign': {
      const signStart = Math.floor(ascendant / 30) * 30;
      cusps = Array.from({ length: 12 }, (_, i) =>
        normalizeDegrees(signStart + i * 30),
      );
      break;
    }

    case 'placidus': {
      cusps = new Array(12);
      cusps[0] = ascendant;                            // Cusp 1 = ASC
      cusps[9] = midheaven;                            // Cusp 10 = MC
      cusps[6] = normalizeDegrees(ascendant + 180);    // Cusp 7 = DSC
      cusps[3] = normalizeDegrees(midheaven + 180);    // Cusp 4 = IC

      const ramcDeg = lst; // RAMC = LST

      // Diurnal cusps: 11 (1/3), 12 (2/3)
      cusps[10] = placidusCusp(ramcDeg, epsRad, latRad, 1 / 3, false);
      cusps[11] = placidusCusp(ramcDeg, epsRad, latRad, 2 / 3, false);

      // Nocturnal cusps: 2 (1/3), 3 (2/3)
      cusps[1] = placidusCusp(ramcDeg, epsRad, latRad, 1 / 3, true);
      cusps[2] = placidusCusp(ramcDeg, epsRad, latRad, 2 / 3, true);

      // Opposite cusps: 4-9
      cusps[4] = normalizeDegrees(cusps[10] + 180);   // 5 opposite 11
      cusps[5] = normalizeDegrees(cusps[11] + 180);   // 6 opposite 12
      cusps[7] = normalizeDegrees(cusps[1] + 180);    // 8 opposite 2
      cusps[8] = normalizeDegrees(cusps[2] + 180);    // 9 opposite 3
      break;
    }

    case 'koch': {
      cusps = computeKochCusps(lst, ascendant, midheaven, epsRad, latRad);
      break;
    }

    case 'porphyry': {
      cusps = new Array(12);
      cusps[0] = ascendant;                            // 1 = ASC
      cusps[9] = midheaven;                            // 10 = MC
      cusps[6] = normalizeDegrees(ascendant + 180);    // 7 = DSC
      cusps[3] = normalizeDegrees(midheaven + 180);    // 4 = IC

      // Q1: MC -> ASC (cusps 11, 12)
      const q1 = forwardArc(midheaven, ascendant);
      cusps[10] = normalizeDegrees(midheaven + q1 / 3);
      cusps[11] = normalizeDegrees(midheaven + 2 * q1 / 3);

      // Q2: ASC -> IC (cusps 2, 3)
      const ic = cusps[3];
      const q2 = forwardArc(ascendant, ic);
      cusps[1] = normalizeDegrees(ascendant + q2 / 3);
      cusps[2] = normalizeDegrees(ascendant + 2 * q2 / 3);

      // Opposite cusps
      cusps[4] = normalizeDegrees(cusps[10] + 180);
      cusps[5] = normalizeDegrees(cusps[11] + 180);
      cusps[7] = normalizeDegrees(cusps[1] + 180);
      cusps[8] = normalizeDegrees(cusps[2] + 180);
      break;
    }

    case 'regiomontanus': {
      cusps = new Array(12);
      cusps[0] = ascendant;
      cusps[9] = midheaven;
      const ramcDegR = lst;
      const sinEpsR = Math.sin(epsRad);
      const cosEpsR = Math.cos(epsRad);
      const tanLatR = Math.tan(latRad);

      for (const [idx, houseOffset] of [[10, 30], [11, 60], [1, 120], [2, 150]] as const) {
        const H = normalizeDegrees(ramcDegR + houseOffset) * DEG_TO_RAD;
        const ramcRad = ramcDegR * DEG_TO_RAD;
        const decH = Math.atan(tanLatR * Math.sin(H - ramcRad));
        const lonRad = Math.atan2(
          Math.sin(H),
          cosEpsR * Math.cos(H) + sinEpsR * Math.tan(decH),
        );
        cusps[idx] = normalizeDegrees(lonRad * RAD_TO_DEG);
      }

      cusps[3] = normalizeDegrees(cusps[9] + 180);
      cusps[4] = normalizeDegrees(cusps[10] + 180);
      cusps[5] = normalizeDegrees(cusps[11] + 180);
      cusps[6] = normalizeDegrees(cusps[0] + 180);
      cusps[7] = normalizeDegrees(cusps[1] + 180);
      cusps[8] = normalizeDegrees(cusps[2] + 180);
      break;
    }

    case 'campanus': {
      cusps = new Array(12);
      cusps[0] = ascendant;
      cusps[9] = midheaven;
      const ramcDegC = lst;
      const sinEpsC = Math.sin(epsRad);
      const cosEpsC = Math.cos(epsRad);
      const cosLatC = Math.cos(latRad);
      const sinLatC = Math.sin(latRad);

      for (const [idx, pvAngleDeg] of [[10, 30], [11, 60], [1, 120], [2, 150]] as const) {
        const pvRad = pvAngleDeg * DEG_TO_RAD;
        // RA of cusp on equator from prime vertical projection
        const raOffset = Math.atan2(
          Math.sin(pvRad),
          cosLatC * Math.cos(pvRad) + sinLatC * Math.sin(pvRad) * 0,
          // Campanus: H = atan(sin(PV) / cos(PV) * cos(lat))
        );
        const hRad = Math.atan2(Math.sin(pvRad), Math.cos(pvRad) * cosLatC);
        const raH = (ramcDegC * DEG_TO_RAD) + hRad;
        // Declination of the house pole in Campanus
        const decC = Math.asin(sinLatC * Math.sin(pvRad));
        // Project to ecliptic
        const lonRad = Math.atan2(
          Math.sin(raH),
          cosEpsC * Math.cos(raH) + sinEpsC * Math.tan(decC),
        );
        cusps[idx] = normalizeDegrees(lonRad * RAD_TO_DEG);
      }

      cusps[3] = normalizeDegrees(cusps[9] + 180);
      cusps[4] = normalizeDegrees(cusps[10] + 180);
      cusps[5] = normalizeDegrees(cusps[11] + 180);
      cusps[6] = normalizeDegrees(cusps[0] + 180);
      cusps[7] = normalizeDegrees(cusps[1] + 180);
      cusps[8] = normalizeDegrees(cusps[2] + 180);
      break;
    }

    case 'alcabitius': {
      cusps = new Array(12);
      cusps[0] = ascendant;
      cusps[9] = midheaven;

      // Compute the semi-arc of the ASC degree
      const sinEpsA = Math.sin(epsRad);
      const tanLatA = Math.tan(latRad);
      const ascRad = ascendant * DEG_TO_RAD;
      const decAsc = Math.asin(sinEpsA * Math.sin(ascRad));
      const xA = -tanLatA * Math.tan(decAsc);
      let dsaAsc: number; // diurnal semi-arc of ASC
      /* v8 ignore next 2 */
      if (xA < -1) {
        dsaAsc = 180;
      /* v8 ignore next 2 */
      } else if (xA > 1) {
        dsaAsc = 0;
      } else {
        dsaAsc = Math.acos(xA) * RAD_TO_DEG;
      }

      // Trisect the diurnal semi-arc
      cusps[10] = computeAscendant(
        (lst - (2 / 3) * dsaAsc) * DEG_TO_RAD, epsRad, latRad,
      );
      cusps[11] = computeAscendant(
        (lst - (1 / 3) * dsaAsc) * DEG_TO_RAD, epsRad, latRad,
      );
      cusps[1] = computeAscendant(
        (lst + (1 / 3) * dsaAsc) * DEG_TO_RAD, epsRad, latRad,
      );
      cusps[2] = computeAscendant(
        (lst + (2 / 3) * dsaAsc) * DEG_TO_RAD, epsRad, latRad,
      );

      cusps[3] = normalizeDegrees(cusps[9] + 180);
      cusps[4] = normalizeDegrees(cusps[10] + 180);
      cusps[5] = normalizeDegrees(cusps[11] + 180);
      cusps[6] = normalizeDegrees(cusps[0] + 180);
      cusps[7] = normalizeDegrees(cusps[1] + 180);
      cusps[8] = normalizeDegrees(cusps[2] + 180);
      break;
    }

    case 'morinus': {
      cusps = new Array(12);
      const cosEpsM = Math.cos(epsRad);
      for (let i = 0; i < 12; i++) {
        const angle = normalizeDegrees(lst + (i + 1) * 30);
        const angleRad = angle * DEG_TO_RAD;
        const lon = Math.atan2(Math.sin(angleRad), Math.cos(angleRad) * cosEpsM);
        cusps[i] = normalizeDegrees(lon * RAD_TO_DEG);
      }
      break;
    }

    case 'topocentric': {
      // Polich-Page topocentric: uses tan(lat)/3 interpolation
      // Closely approximates Placidus for most latitudes
      cusps = new Array(12);
      cusps[0] = ascendant;
      cusps[9] = midheaven;

      const ramcDegT = lst;
      const sinEpsT = Math.sin(epsRad);
      const cosEpsT = Math.cos(epsRad);
      const tanLatT = Math.tan(latRad);
      const tanLatThird = tanLatT / 3;

      // Cusp 11: use tan(lat)/3
      const h11 = normalizeDegrees(ramcDegT + 30) * DEG_TO_RAD;
      const dec11 = Math.atan(tanLatThird * Math.sin(h11 - ramcDegT * DEG_TO_RAD));
      cusps[10] = normalizeDegrees(
        Math.atan2(Math.sin(h11), cosEpsT * Math.cos(h11) + sinEpsT * Math.tan(dec11)) * RAD_TO_DEG,
      );

      // Cusp 12: use 2*tan(lat)/3
      const tanLat2Third = 2 * tanLatThird;
      const h12 = normalizeDegrees(ramcDegT + 60) * DEG_TO_RAD;
      const dec12 = Math.atan(tanLat2Third * Math.sin(h12 - ramcDegT * DEG_TO_RAD));
      cusps[11] = normalizeDegrees(
        Math.atan2(Math.sin(h12), cosEpsT * Math.cos(h12) + sinEpsT * Math.tan(dec12)) * RAD_TO_DEG,
      );

      // Cusp 2: use 2*tan(lat)/3
      const h2 = normalizeDegrees(ramcDegT + 120) * DEG_TO_RAD;
      const dec2 = Math.atan(tanLat2Third * Math.sin(h2 - ramcDegT * DEG_TO_RAD));
      cusps[1] = normalizeDegrees(
        Math.atan2(Math.sin(h2), cosEpsT * Math.cos(h2) + sinEpsT * Math.tan(dec2)) * RAD_TO_DEG,
      );

      // Cusp 3: use tan(lat)/3
      const h3 = normalizeDegrees(ramcDegT + 150) * DEG_TO_RAD;
      const dec3 = Math.atan(tanLatThird * Math.sin(h3 - ramcDegT * DEG_TO_RAD));
      cusps[2] = normalizeDegrees(
        Math.atan2(Math.sin(h3), cosEpsT * Math.cos(h3) + sinEpsT * Math.tan(dec3)) * RAD_TO_DEG,
      );

      cusps[3] = normalizeDegrees(cusps[9] + 180);
      cusps[4] = normalizeDegrees(cusps[10] + 180);
      cusps[5] = normalizeDegrees(cusps[11] + 180);
      cusps[6] = normalizeDegrees(cusps[0] + 180);
      cusps[7] = normalizeDegrees(cusps[1] + 180);
      cusps[8] = normalizeDegrees(cusps[2] + 180);
      break;
    }

    /* v8 ignore next 2 */
    default:
      throw new Error(`Unknown house system: ${system as string}`);
  }

  return {
    system,
    cusps,
    ascendant,
    midheaven,
  };
}

// ── Aspects ──────────────────────────────────────────────────────────────

/**
 * Find all aspects between a set of tropical positions.
 *
 * @param positions - Array of tropical positions to check
 * @param orbs - Optional custom orbs for each aspect type
 * @param speeds - Optional daily speeds (°/day) by body name, for applying/separating detection
 * @returns Array of detected aspects
 */
export function findAspects(
  positions: TropicalPosition[],
  orbs?: Partial<Record<AspectName, number>>,
  speeds?: Record<string, number>,
): TropicalAspect[] {
  const effectiveOrbs = { ...DEFAULT_ORBS, ...orbs };
  const aspects: TropicalAspect[] = [];

  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const p1 = positions[i];
      const p2 = positions[j];

      // Angular separation (shortest arc)
      const diff = Math.abs(p1.longitude - p2.longitude);
      const separation = diff > 180 ? 360 - diff : diff;

      // Check each aspect type
      for (const [name, targetAngle] of Object.entries(ASPECT_ANGLES) as [AspectName, number][]) {
        const orb = Math.abs(separation - targetAngle);
        if (orb <= effectiveOrbs[name]) {
          /* v8 ignore next 2 */
          const applying = speeds
            ? isAspectApplying(p1.longitude, p2.longitude, speeds[p1.body] ?? 0, speeds[p2.body] ?? 0, targetAngle)
            : true; // default to applying when speeds unknown

          aspects.push({
            body1: p1.body,
            body2: p2.body,
            type: name,
            angle: targetAngle,
            orb,
            applying,
            major: MAJOR_ASPECTS.has(name),
          });
        }
      }
    }
  }

  return aspects;
}

/**
 * Determine if an aspect is applying (bodies moving toward exact aspect)
 * or separating (bodies moving apart).
 */
function isAspectApplying(
  lon1: number, lon2: number,
  speed1: number, speed2: number,
  targetAngle: number,
): boolean {
  // Current angular separation
  let diff = lon2 - lon1;
  if (diff < -180) diff += 360;
  if (diff > 180) diff -= 360;

  const currentSep = Math.abs(diff);
  const currentOrb = Math.abs(currentSep - targetAngle);

  // Project separation a small time step ahead
  const dt = 1; // 1 day
  let futDiff = (lon2 + speed2 * dt) - (lon1 + speed1 * dt);
  if (futDiff < -180) futDiff += 360;
  if (futDiff > 180) futDiff -= 360;

  const futureSep = Math.abs(futDiff);
  const futureOrb = Math.abs(futureSep - targetAngle);

  // Applying if the orb is decreasing
  return futureOrb < currentOrb;
}

/**
 * Find parallel and contra-parallel aspects based on declination.
 *
 * - Parallel: two bodies at similar declination (same hemisphere)
 * - Contra-parallel: two bodies at equal but opposite declination
 *
 * @param positions - Bodies with declination values
 * @param orb - Maximum orb in degrees (default: 1°)
 */
export function findParallelAspects(
  positions: Array<{ body: string; declination: number }>,
  orb: number = 1,
): Array<{ body1: string; body2: string; type: 'parallel' | 'contra-parallel'; orb: number }> {
  const results: Array<{ body1: string; body2: string; type: 'parallel' | 'contra-parallel'; orb: number }> = [];

  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const a = positions[i];
      const b = positions[j];

      // Parallel: |dec1 - dec2| < orb
      const parOrb = Math.abs(a.declination - b.declination);
      if (parOrb <= orb) {
        results.push({ body1: a.body, body2: b.body, type: 'parallel', orb: parOrb });
      }

      // Contra-parallel: |dec1 + dec2| < orb (one north, one south)
      const cpOrb = Math.abs(a.declination + b.declination);
      if (cpOrb <= orb) {
        results.push({ body1: a.body, body2: b.body, type: 'contra-parallel', orb: cpOrb });
      }
    }
  }

  return results;
}

// ── Dignities ────────────────────────────────────────────────────────────

/**
 * Classical dignity table.
 *
 * Each entry maps a celestial body to its dignities. Signs can be a single
 * sign or an array for dual rulership/detriment.
 */
interface DignityEntry {
  rulership: ZodiacSign | ZodiacSign[];
  exaltation: ZodiacSign;
  detriment: ZodiacSign | ZodiacSign[];
  fall: ZodiacSign;
}

const DIGNITY_TABLE: Record<string, DignityEntry> = {
  Sun: {
    rulership: 'Leo',
    exaltation: 'Aries',
    detriment: 'Aquarius',
    fall: 'Libra',
  },
  Moon: {
    rulership: 'Cancer',
    exaltation: 'Taurus',
    detriment: 'Capricorn',
    fall: 'Scorpio',
  },
  Mercury: {
    rulership: ['Gemini', 'Virgo'],
    exaltation: 'Virgo',
    detriment: ['Sagittarius', 'Pisces'],
    fall: 'Pisces',
  },
  Venus: {
    rulership: ['Taurus', 'Libra'],
    exaltation: 'Pisces',
    detriment: ['Aries', 'Scorpio'],
    fall: 'Virgo',
  },
  Mars: {
    rulership: ['Aries', 'Scorpio'],
    exaltation: 'Capricorn',
    detriment: ['Taurus', 'Libra'],
    fall: 'Cancer',
  },
  Jupiter: {
    rulership: ['Sagittarius', 'Pisces'],
    exaltation: 'Cancer',
    detriment: ['Gemini', 'Virgo'],
    fall: 'Capricorn',
  },
  Saturn: {
    rulership: ['Capricorn', 'Aquarius'],
    exaltation: 'Libra',
    detriment: ['Cancer', 'Leo'],
    fall: 'Aries',
  },
};

/**
 * Check if a sign matches a dignity entry (single sign or array).
 */
function matchesSign(entry: ZodiacSign | ZodiacSign[], sign: ZodiacSign): boolean {
  return Array.isArray(entry) ? entry.includes(sign) : entry === sign;
}

/**
 * Get the classical dignity of a celestial body in a given zodiac sign.
 *
 * Returns the strongest applicable dignity in order:
 * rulership > exaltation > detriment > fall.
 *
 * @param body - Name of the celestial body (e.g. 'Sun', 'Moon', 'Mercury')
 * @param sign - The zodiac sign the body occupies
 * @returns The dignity, or null if no special dignity applies
 */
export function getDignity(body: string, sign: ZodiacSign): Dignity | null {
  const entry = DIGNITY_TABLE[body];
  if (!entry) return null;

  // Check in order of strength: rulership > exaltation > detriment > fall
  if (matchesSign(entry.rulership, sign)) return 'rulership';
  if (entry.exaltation === sign) return 'exaltation';
  if (matchesSign(entry.detriment, sign)) return 'detriment';
  if (entry.fall === sign) return 'fall';

  return null;
}

// ── House placement ──────────────────────────────────────────────────────

/**
 * Determine which house (1-12) a given ecliptic longitude falls in.
 *
 * A body is in house N if its longitude is between cusp N and cusp N+1
 * (going forward in the zodiac, accounting for wrap-around).
 *
 * @param longitude - Ecliptic longitude in degrees
 * @param cusps - Array of 12 house cusp longitudes
 * @returns House number (1-12)
 */
function getHouseNumber(longitude: number, cusps: number[]): number {
  const lon = normalizeDegrees(longitude);

  for (let i = 0; i < 12; i++) {
    const cuspStart = cusps[i];
    const cuspEnd = cusps[(i + 1) % 12];

    // Handle wrap-around
    if (cuspStart <= cuspEnd) {
      // No wrap: body is in this house if cuspStart <= lon < cuspEnd
      if (lon >= cuspStart && lon < cuspEnd) {
        return i + 1;
      }
    } else {
      // Wrap-around: body is in this house if lon >= cuspStart OR lon < cuspEnd
      if (lon >= cuspStart || lon < cuspEnd) {
        return i + 1;
      }
    }
  /* v8 ignore start -- defensive: valid cusps always match */
  }

  return 1;
}
/* v8 ignore stop */

// ── Body name helpers ────────────────────────────────────────────────────

/**
 * Capitalize the first letter of a planet name for display.
 */
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Full chart computation ───────────────────────────────────────────────

/**
 * Compute a full tropical astrology chart for a given moment and location.
 *
 * Includes positions for the Sun, Moon, and all eight planets (Mercury through
 * Pluto), house cusps, and inter-body aspects.
 *
 * @param date - JavaScript Date (UT)
 * @param lat - Geographic latitude in degrees (positive north)
 * @param lng - Geographic longitude in degrees (positive east)
 * @param options - Optional: house system and custom orbs
 * @returns Complete tropical chart
 */
export function computeTropicalChart(
  date: Date,
  lat: number,
  lng: number,
  options?: ChartOptions,
): TropicalChart {
  const houseSystem = options?.houseSystem ?? 'placidus';
  const customOrbs = options?.orbs;

  // 1. Compute houses
  const houses = computeHouses(date, lat, lng, houseSystem);

  // 2. Get positions for all bodies
  const positions: TropicalPosition[] = [];

  // Sun
  const sunLon = getSunLongitude(date);
  const sunSign = getZodiacSign(sunLon);
  positions.push({
    body: 'Sun',
    longitude: sunLon,
    latitude: 0, // Sun's ecliptic latitude is effectively 0
    sign: sunSign.sign,
    signDegree: sunSign.degree,
    house: getHouseNumber(sunLon, houses.cusps),
    dignity: getDignity('Sun', sunSign.sign),
  });

  // Moon
  const moonPos = getMoonPosition(date);
  const moonSign = getZodiacSign(moonPos.longitude);
  positions.push({
    body: 'Moon',
    longitude: moonPos.longitude,
    latitude: moonPos.latitude,
    sign: moonSign.sign,
    signDegree: moonSign.degree,
    house: getHouseNumber(moonPos.longitude, houses.cusps),
    dignity: getDignity('Moon', moonSign.sign),
  });

  // Planets Mercury-Pluto
  for (const planet of PLANETS) {
    const pos: GeocentricPosition = getPlanetPosition(planet, date);
    const sign = getZodiacSign(pos.longitude);
    const displayName = capitalize(planet);
    positions.push({
      body: displayName,
      longitude: pos.longitude,
      latitude: pos.latitude,
      sign: sign.sign,
      signDegree: sign.degree,
      house: getHouseNumber(pos.longitude, houses.cusps),
      dignity: getDignity(displayName, sign.sign),
    });
  }

  // North Node (Mean) — see alias comment above for cross-tradition rationale
  const nnPos = getNorthNodePosition(date);
  const nnSign = getZodiacSign(nnPos.longitude);
  positions.push({
    body: 'North Node',
    longitude: nnPos.longitude,
    latitude: nnPos.latitude,
    sign: nnSign.sign,
    signDegree: nnSign.degree,
    house: getHouseNumber(nnPos.longitude, houses.cusps),
    dignity: null,
  });

  // South Node (opposite North Node)
  const snLon = normalizeDegrees(nnPos.longitude + 180);
  const snSign = getZodiacSign(snLon);
  positions.push({
    body: 'South Node',
    longitude: snLon,
    latitude: 0,
    sign: snSign.sign,
    signDegree: snSign.degree,
    house: getHouseNumber(snLon, houses.cusps),
    dignity: null,
  });

  // Chiron
  const chironPos = getChironPosition(date);
  const chironSign = getZodiacSign(chironPos.longitude);
  positions.push({
    body: 'Chiron',
    longitude: chironPos.longitude,
    latitude: chironPos.latitude,
    sign: chironSign.sign,
    signDegree: chironSign.degree,
    house: getHouseNumber(chironPos.longitude, houses.cusps),
    dignity: null,
  });

  // Lilith (Mean Black Moon) — see alias comment above for cross-tradition rationale
  const lilithPos = getLilithPosition(date);
  const lilithSign = getZodiacSign(lilithPos.longitude);
  positions.push({
    body: 'Lilith',
    longitude: lilithPos.longitude,
    latitude: lilithPos.latitude,
    sign: lilithSign.sign,
    signDegree: lilithSign.degree,
    house: getHouseNumber(lilithPos.longitude, houses.cusps),
    dignity: null,
  });

  // Part of Fortune: ASC + Moon - Sun (day) or ASC + Sun - Moon (night)
  // Use Sun's house to determine sect: houses 7-12 = day chart
  const sunHouse = getHouseNumber(sunLon, houses.cusps);
  const isDayChart = sunHouse >= 7 && sunHouse <= 12;
  const pofLon = isDayChart
    ? normalizeDegrees(houses.ascendant + moonPos.longitude - sunLon)
    : normalizeDegrees(houses.ascendant + sunLon - moonPos.longitude);
  const pofSign = getZodiacSign(pofLon);
  positions.push({
    body: 'Part of Fortune',
    longitude: pofLon,
    latitude: 0,
    sign: pofSign.sign,
    signDegree: pofSign.degree,
    house: getHouseNumber(pofLon, houses.cusps),
    dignity: null,
  });

  // Vertex: ASC computed for co-latitude (90° - lat)
  const T = dateToJulianCenturies(date);
  const epsRad = trueObliquity(T);
  const gmst = greenwichMeanSiderealTime(date);
  const lstDeg = normalizeDegrees(gmst + lng);
  const lstRad = lstDeg * DEG_TO_RAD;
  const coLatRad = (90 - lat) * DEG_TO_RAD;
  // The Vertex is the DSC of the co-latitude system
  const antiVertexLon = computeAscendant(lstRad, epsRad, coLatRad);
  const vertexLon = normalizeDegrees(antiVertexLon + 180);
  const vertexSign = getZodiacSign(vertexLon);
  positions.push({
    body: 'Vertex',
    longitude: vertexLon,
    latitude: 0,
    sign: vertexSign.sign,
    signDegree: vertexSign.degree,
    house: getHouseNumber(vertexLon, houses.cusps),
    dignity: null,
  });

  // 3. Find aspects
  const aspects = findAspects(positions, customOrbs);

  return {
    positions,
    houses,
    aspects,
  };
}
