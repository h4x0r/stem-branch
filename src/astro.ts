/**
 * Shared astronomical utilities for solar, lunar, and planetary ephemeris.
 *
 * Extracted from solar-longitude.ts so that both the Sun longitude pipeline
 * and upcoming planetary modules can reuse the same time-scale conversions,
 * nutation model, obliquity, and coordinate transforms without duplication.
 */

import { deltaT } from './delta-t';

// ── Constants ────────────────────────────────────────────────────────────

export const DEG_TO_RAD = Math.PI / 180;
export const RAD_TO_DEG = 180 / Math.PI;
export const ARCSEC_TO_RAD = Math.PI / 180 / 3600;

/** Speed of light in AU per day (IAU 2012 nominal). */
export const C_AU_PER_DAY = 173.144632674;

// ── Time-scale conversions ───────────────────────────────────────────────

/**
 * Convert a UT Date to Julian Date in Terrestrial Time (JD_TT).
 *
 * VSOP87 is formulated in TT (Terrestrial Time), but JavaScript Date
 * objects are in UT. We add ΔT to convert:  TT = UT + ΔT
 */
export function dateToJD_TT(date: Date): number {
  const jdUT = date.getTime() / 86400000 + 2440587.5;
  const dtSeconds = deltaT(date);
  return jdUT + dtSeconds / 86400;
}

/**
 * Convert a UT Date to Julian millennia from J2000.0 in TT (for VSOP87).
 */
export function dateToJulianMillennia(date: Date): number {
  return (dateToJD_TT(date) - 2451545.0) / 365250.0;
}

/**
 * Convert a UT Date to Julian centuries from J2000.0 in TT (for nutation formulas).
 */
export function dateToJulianCenturies(date: Date): number {
  return (dateToJD_TT(date) - 2451545.0) / 36525.0;
}

// ── Delaunay fundamental arguments ───────────────────────────────────────

/** Five Delaunay fundamental arguments (all in radians). */
export interface DelaunayArguments {
  /** Moon's mean anomaly */
  l: number;
  /** Sun's mean anomaly */
  lp: number;
  /** Moon's latitude argument */
  F: number;
  /** Mean elongation of Moon from Sun */
  D: number;
  /** Longitude of Moon's ascending node */
  Om: number;
}

/**
 * Compute the five Delaunay fundamental arguments at Julian century T (TT).
 *
 * Source: IERS Conventions (2010), Table 5.2a.
 */
export function delaunayArgs(T: number): DelaunayArguments {
  const T2 = T * T;
  const T3 = T2 * T;
  const T4 = T3 * T;
  const l  = ((485868.249036 + 1717915923.2178 * T + 31.8792 * T2
    + 0.051635 * T3 - 0.00024470 * T4) % 1296000) * ARCSEC_TO_RAD;
  const lp = ((1287104.79305 + 129596581.0481 * T - 0.5532 * T2
    + 0.000136 * T3 - 0.00001149 * T4) % 1296000) * ARCSEC_TO_RAD;
  const F  = ((335779.526232 + 1739527262.8478 * T - 12.7512 * T2
    - 0.001037 * T3 + 0.00000417 * T4) % 1296000) * ARCSEC_TO_RAD;
  const D  = ((1072260.70369 + 1602961601.2090 * T - 6.3706 * T2
    + 0.006593 * T3 - 0.00003169 * T4) % 1296000) * ARCSEC_TO_RAD;
  const Om = ((450160.398036 - 6962890.5431 * T + 7.4722 * T2
    + 0.007702 * T3 - 0.00005939 * T4) % 1296000) * ARCSEC_TO_RAD;
  return { l, lp, F, D, Om };
}

// ── IAU2000B Nutation (77 lunisolar terms) ───────────────────────────────
// Source: IERS Conventions (2010), SOFA iauNut00b
// Each row: [l, l', F, D, Ω, Δψ_sin (0.1μas), Δψ_sin·T (0.1μas)]
// l=Moon's mean anomaly, l'=Sun's mean anomaly, F=Moon's latitude arg,
// D=mean elongation, Ω=longitude of ascending node
// We only store the longitude nutation coefficients (Δψ), not obliquity (Δε).
// prettier-ignore
const NUT_COEFFS: readonly number[][] = [
  [ 0, 0, 0, 0, 1,-172064161,-174666],
  [ 0, 0, 2,-2, 2, -13170906,  -1675],
  [ 0, 0, 2, 0, 2,  -2276413,   -234],
  [ 0, 0, 0, 0, 2,   2074554,    207],
  [ 0, 1, 0, 0, 0,   1475877,  -3633],
  [ 0, 1, 2,-2, 2,   -516821,   1226],
  [ 1, 0, 0, 0, 0,    711159,     73],
  [ 0, 0, 2, 0, 1,   -387298,   -367],
  [ 1, 0, 2, 0, 2,   -301461,    -36],
  [ 0,-1, 2,-2, 2,    215829,   -494],
  [ 0, 0, 2,-2, 1,    128227,    137],
  [-1, 0, 2, 0, 2,    123457,     11],
  [-1, 0, 0, 2, 0,    156994,     10],
  [ 1, 0, 0, 0, 1,     63110,     63],
  [-1, 0, 0, 0, 1,    -57976,    -63],
  [-1, 0, 2, 2, 2,    -59641,    -11],
  [ 1, 0, 2, 0, 1,    -51613,    -42],
  [-2, 0, 2, 0, 1,     45893,     50],
  [ 0, 0, 0, 2, 0,     63384,     11],
  [ 0, 0, 2, 2, 2,    -38571,     -1],
  [ 0,-2, 2,-2, 2,     32481,      0],
  [-2, 0, 0, 2, 0,    -47722,      0],
  [ 2, 0, 2, 0, 2,    -31046,     -1],
  [ 1, 0, 2,-2, 2,     28593,      0],
  [-1, 0, 2, 0, 1,     20441,     21],
  [ 2, 0, 0, 0, 0,     29243,      0],
  [ 0, 0, 2, 0, 0,     25887,      0],
  [ 0, 1, 0, 0, 1,    -14053,    -25],
  [-1, 0, 0, 2, 1,     15164,     10],
  [ 0, 2, 2,-2, 2,    -15794,     72],
  [ 0, 0,-2, 2, 0,     21783,      0],
  [ 1, 0, 0,-2, 1,    -12873,    -10],
  [ 0,-1, 0, 0, 1,    -12654,     11],
  [-1, 0, 2, 2, 1,    -10204,      0],
  [ 0, 2, 0, 0, 0,     16707,    -85],
  [ 1, 0, 2, 2, 2,     -7691,      0],
  [-2, 0, 2, 0, 0,    -11024,      0],
  [ 0, 1, 2, 0, 2,      7566,    -21],
  [ 0, 0, 2, 2, 1,     -6637,    -11],
  [ 0,-1, 2, 0, 2,     -7141,     21],
  [ 0, 0, 0, 2, 1,     -6302,    -11],
  [ 1, 0, 2,-2, 1,      5800,     10],
  [ 2, 0, 2,-2, 2,      6443,      0],
  [-2, 0, 0, 2, 1,     -5774,    -11],
  [ 2, 0, 2, 0, 1,     -5350,      0],
  [ 0,-1, 2,-2, 1,     -4752,    -11],
  [ 0, 0, 0,-2, 1,     -4940,    -11],
  [-1,-1, 0, 2, 0,      7350,      0],
  [ 2, 0, 0,-2, 1,      4065,      0],
  [ 1, 0, 0, 2, 0,      6579,      0],
  [ 0, 1, 2,-2, 1,      3579,      0],
  [ 1,-1, 0, 0, 0,      4725,      0],
  [-2, 0, 2, 0, 2,     -3075,      0],
  [ 3, 0, 2, 0, 2,     -2904,      0],
  [ 0,-1, 0, 2, 0,      4348,      0],
  [ 1,-1, 2, 0, 2,     -2878,      0],
  [ 0, 0, 0, 1, 0,     -4230,      0],
  [-1,-1, 2, 2, 2,     -2819,      0],
  [-1, 0, 2, 0, 0,     -4056,      0],
  [ 0,-1, 2, 2, 2,     -2647,      0],
  [-2, 0, 0, 0, 1,     -2294,      0],
  [ 1, 1, 2, 0, 2,      2481,      0],
  [ 2, 0, 0, 0, 1,      2179,      0],
  [-1, 1, 0, 1, 0,      3276,      0],
  [ 1, 1, 0, 0, 0,     -3389,      0],
  [ 1, 0, 2, 0, 0,      3339,      0],
  [-1, 0, 2,-2, 1,     -1987,      0],
  [ 1, 0, 0, 0, 2,     -1981,      0],
  [-1, 0, 0, 1, 0,      4026,      0],
  [ 0, 0, 2, 1, 2,      1660,      0],
  [-1, 0, 2, 4, 2,     -1521,      0],
  [-1, 1, 0, 1, 1,      1314,      0],
  [ 0,-2, 2,-2, 1,     -1283,      0],
  [ 1, 0, 2, 2, 1,     -1331,      0],
  [-2, 0, 2, 2, 2,      1383,      0],
  [-1, 0, 0, 0, 2,      1405,      0],
  [ 1, 1, 2,-2, 2,      1290,      0],
];

// IAU2000B nutation in obliquity (Δε) coefficients.
// Same 77 terms, same argument order as NUT_COEFFS.
// Each row: [Δε_cos (0.1μas), Δε_cos·T (0.1μas)]
// Formula: Δε = Σ (ec + ect·T) × cos(arg)
// Source: ERFA nut00b.c (liberfa/erfa), columns ec and ect
// prettier-ignore
const NUT_OBLIQ_COEFFS: readonly number[][] = [
  [92052331,9086],[5730336,-3015],[978459,-485],[-897492,470],[73871,-184],
  [224386,-677],[-6750,0],[200728,18],[129025,-63],[-95929,299],
  [-68982,-9],[-53311,32],[-1235,0],[-33228,0],[31429,0],
  [25543,-11],[26366,0],[-24236,-10],[-1220,0],[16452,-11],
  [-13870,0],[477,0],[13238,-11],[-12338,10],[-10758,0],
  [-609,0],[-550,0],[8551,-2],[-8001,0],[6850,-42],
  [-167,0],[6953,0],[6415,0],[5222,0],[168,-1],
  [3268,0],[104,0],[-3250,0],[3353,0],[3070,0],
  [3272,0],[-3045,0],[-2768,0],[3041,0],[2695,0],
  [2719,0],[2720,0],[-51,0],[-2206,0],[-199,0],
  [-1900,0],[-41,0],[1313,0],[1233,0],[-81,0],
  [1232,0],[-20,0],[1207,0],[40,0],[1129,0],
  [1266,0],[-1062,0],[-1129,0],[-9,0],[35,0],
  [-107,0],[1073,0],[854,0],[-553,0],[-710,0],
  [647,0],[-700,0],[672,0],[663,0],[-594,0],
  [-610,0],[-556,0],
];

// ── Nutation functions ───────────────────────────────────────────────────

/**
 * Compute nutation in longitude (Δψ) in arcseconds using IAU2000B (77 terms).
 *
 * Arguments are the Delaunay fundamental arguments in radians,
 * matching the column order of NUT_COEFFS: l, l', F, D, Ω.
 */
export function nutationDpsi(
  l: number, lp: number, F: number, D: number, Om: number, T: number,
): number {
  let dpsi = 0;
  for (const row of NUT_COEFFS) {
    const arg = row[0] * l + row[1] * lp + row[2] * F + row[3] * D + row[4] * Om;
    dpsi += (row[5] + row[6] * T) * Math.sin(arg);
  }
  // Convert from 0.1 microarcseconds to arcseconds: ÷ 10,000,000
  return dpsi / 1e7;
}

/**
 * Compute nutation in obliquity (Δε) in arcseconds using IAU2000B (77 terms).
 *
 * Uses the same Delaunay fundamental arguments as nutationDpsi,
 * with cosine coefficients from NUT_OBLIQ_COEFFS.
 */
export function nutationDeps(
  l: number, lp: number, F: number, D: number, Om: number, T: number,
): number {
  let deps = 0;
  for (let i = 0; i < NUT_COEFFS.length; i++) {
    const row = NUT_COEFFS[i];
    const arg = row[0] * l + row[1] * lp + row[2] * F + row[3] * D + row[4] * Om;
    const obliq = NUT_OBLIQ_COEFFS[i];
    deps += (obliq[0] + obliq[1] * T) * Math.cos(arg);
  }
  return deps / 1e7;
}

// ── Obliquity ────────────────────────────────────────────────────────────

/**
 * Mean obliquity of the ecliptic (Laskar 1986) in radians.
 *
 * @param T - Julian centuries from J2000.0 (TT)
 */
export function meanObliquity(T: number): number {
  const T2 = T * T;
  const T3 = T2 * T;
  return (84381.448 - 46.8150 * T - 0.00059 * T2 + 0.001813 * T3)
    * ARCSEC_TO_RAD;
}

/**
 * True obliquity of the ecliptic (mean + nutation in obliquity) in radians.
 *
 * @param T - Julian centuries from J2000.0 (TT)
 */
export function trueObliquity(T: number): number {
  const eps0 = meanObliquity(T);
  const args = delaunayArgs(T);
  const depsAs = nutationDeps(args.l, args.lp, args.F, args.D, args.Om, T);
  return eps0 + depsAs * ARCSEC_TO_RAD;
}

// ── Normalization ────────────────────────────────────────────────────────

/**
 * Normalize an angle in degrees to [0, 360).
 */
export function normalizeDegrees(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/**
 * Normalize an angle in radians to [0, 2*PI).
 */
export function normalizeRadians(rad: number): number {
  const TWO_PI = 2 * Math.PI;
  return ((rad % TWO_PI) + TWO_PI) % TWO_PI;
}

// ── Coordinate transforms ────────────────────────────────────────────────

/**
 * Convert ecliptic coordinates to equatorial coordinates.
 *
 * @param lambda - Ecliptic longitude in radians
 * @param beta - Ecliptic latitude in radians
 * @param eps - Obliquity of the ecliptic in radians
 * @returns [ra, dec] — right ascension and declination in radians
 */
export function eclipticToEquatorial(
  lambda: number, beta: number, eps: number,
): [number, number] {
  const sinLam = Math.sin(lambda);
  const cosLam = Math.cos(lambda);
  const sinBeta = Math.sin(beta);
  const cosBeta = Math.cos(beta);
  const sinEps = Math.sin(eps);
  const cosEps = Math.cos(eps);

  const ra = Math.atan2(
    sinLam * cosEps - sinBeta / cosBeta * sinEps,
    cosLam,
  );
  const dec = Math.asin(
    sinBeta * cosEps + cosBeta * sinEps * sinLam,
  );
  return [ra, dec];
}
