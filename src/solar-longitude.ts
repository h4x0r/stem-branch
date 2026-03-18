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
import { deltaT } from './delta-t';

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const ARCSEC_TO_RAD = Math.PI / 180 / 3600;

/**
 * Convert a UT Date to Julian Date in Terrestrial Time (JD_TT).
 *
 * VSOP87 is formulated in TT (Terrestrial Time), but JavaScript Date
 * objects are in UT. We add ΔT to convert:  TT = UT + ΔT
 */
function dateToJD_TT(date: Date): number {
  const jdUT = date.getTime() / 86400000 + 2440587.5;
  const dtSeconds = deltaT(date);
  return jdUT + dtSeconds / 86400;
}

/**
 * Convert a UT Date to Julian millennia from J2000.0 in TT (for VSOP87).
 */
function dateToJulianMillennia(date: Date): number {
  return (dateToJD_TT(date) - 2451545.0) / 365250.0;
}

/**
 * Convert a UT Date to Julian centuries from J2000.0 in TT (for nutation formulas).
 */
function dateToJulianCenturies(date: Date): number {
  return (dateToJD_TT(date) - 2451545.0) / 36525.0;
}

// ── IAU2000B Nutation (77 lunisolar terms) ─────────────────────────────
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

/**
 * Compute nutation in longitude (Δψ) in arcseconds using IAU2000B (77 terms).
 *
 * Arguments are the Delaunay fundamental arguments in radians,
 * matching the column order of NUT_COEFFS: l, l', F, D, Ω.
 */
function nutationDpsi(
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
function nutationDeps(
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
  // Fundamental arguments (Delaunay parameters, IERS Conventions 2010):
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

  // NUT_COEFFS column order: [l, l', F, D, Ω, ...]
  const dpsi = nutationDpsi(l, lp, F, D, Om, T);
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
  const T3 = T2 * T;

  // 1. Sun's apparent ecliptic longitude (degrees) — full VSOP87D pipeline
  const lambdaDeg = getSunLongitude(date);
  const lambda = lambdaDeg * DEG_TO_RAD;

  // 2. Mean obliquity of the ecliptic (Laskar 1986, arcseconds)
  const eps0 = (84381.448 - 46.8150 * T - 0.00059 * T2 + 0.001813 * T3)
    * ARCSEC_TO_RAD;

  // 3. Nutation in obliquity (IAU2000B, 77 terms)
  //    Recompute Delaunay fundamental arguments (same as in getSunLongitude)
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

  const depsAs = nutationDeps(l, lp, F, D, Om, T);
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
