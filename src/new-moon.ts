/* v8 ignore next */
/**
 * New Moon computation using Meeus, "Astronomical Algorithms", 2nd ed., Chapter 49.
 *
 * Computes the Julian Ephemeris Day (JDE, in Terrestrial Time) of new moons.
 * Accuracy: ~1 minute over the range -2000 to +4000.
 *
 * The lunation number k:
 *   k = 0  → 2000 January 6 new moon
 *   k = 1  → next new moon (~Feb 5, 2000)
 *   k = -1 → previous new moon (~Dec 7, 1999)
 */

import { solarEclipticState } from './solar-longitude';
import { moonApparentLongitude } from './moon/moon';

const DEG = Math.PI / 180;

/**
 * Meeus Ch.49 estimate of the new-moon JDE (TT) — accurate to ~1 minute. Used as
 * the starting point for the exact conjunction refinement in `newMoonJDE`.
 *
 * @param k - Integer lunation number (0 = 2000 Jan 6 new moon)
 */
function meeusNewMoonJDE(k: number): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const T4 = T3 * T;

  // Mean JDE of the phase
  let JDE =
    2451550.09766 +
    29.530588861 * k +
    0.00015437 * T2 -
    0.00000015 * T3 +
    0.00000000073 * T4;

  // Eccentricity correction factor
  const E = 1 - 0.002516 * T - 0.0000074 * T2;
  const E2 = E * E;

  // Sun's mean anomaly (degrees)
  const M =
    (2.5534 + 29.1053567 * k - 0.0000014 * T2 - 0.00000011 * T3) * DEG;

  // Moon's mean anomaly (degrees)
  const Mprime =
    (201.5643 +
      385.81693528 * k +
      0.0107582 * T2 +
      0.00001238 * T3 -
      0.000000058 * T4) *
    DEG;

  // Moon's argument of latitude
  const F =
    (160.7108 +
      390.67050284 * k -
      0.0016118 * T2 -
      0.00000227 * T3 +
      0.000000011 * T4) *
    DEG;

  // Longitude of ascending node
  const Omega =
    (124.7746 - 1.56375588 * k + 0.002068 * T2 + 0.00000215 * T3) * DEG;

  // Correction for new moon (Table 49.a)
  const correction =
    -0.4072 * Math.sin(Mprime) +
    0.17241 * E * Math.sin(M) +
    0.01608 * Math.sin(2 * Mprime) +
    0.01039 * Math.sin(2 * F) +
    0.00739 * E * Math.sin(Mprime - M) +
    -0.00514 * E * Math.sin(Mprime + M) +
    0.00208 * E2 * Math.sin(2 * M) +
    -0.00111 * Math.sin(Mprime - 2 * F) +
    -0.00057 * Math.sin(Mprime + 2 * F) +
    0.00056 * E * Math.sin(2 * Mprime + M) +
    -0.00042 * Math.sin(3 * Mprime) +
    0.00042 * E * Math.sin(M + 2 * F) +
    0.00038 * E * Math.sin(M - 2 * F) +
    -0.00024 * E * Math.sin(2 * Mprime - M) +
    -0.00017 * Math.sin(Omega) +
    -0.00007 * Math.sin(Mprime + 2 * M) +
    0.00004 * Math.sin(2 * Mprime - 2 * F) +
    0.00004 * Math.sin(3 * M) +
    0.00003 * Math.sin(Mprime + M - 2 * F) +
    0.00003 * Math.sin(2 * Mprime + 2 * F) +
    -0.00003 * Math.sin(Mprime + M + 2 * F) +
    0.00003 * Math.sin(Mprime - M + 2 * F) +
    -0.00002 * Math.sin(Mprime - M - 2 * F) +
    -0.00002 * Math.sin(3 * Mprime + M) +
    0.00002 * Math.sin(4 * Mprime);

  JDE += correction;

  // Additional corrections (Table 49.c — planetary arguments)
  const A1 = (299.77 + 132.8475848 * k - 0.009173 * T2) * DEG;
  const A2 = (251.88 + 92.5186844 * k) * DEG;
  const A3 = (251.83 + 360.30367988 * k) * DEG;
  const A4 = (349.42 + 450.37629756 * k) * DEG;
  const A5 = (84.66 + 966.97899884 * k) * DEG;
  const A6 = (141.74 + 1367.7288924 * k) * DEG;
  const A7 = (207.14 + 35.7255876 * k) * DEG;
  const A8 = (154.84 + 966.89791524 * k) * DEG;
  const A9 = (34.52 + 27.5546248 * k) * DEG;
  const A10 = (207.19 + 1.2282596 * k) * DEG;
  const A11 = (291.34 + 0.8070004 * k) * DEG;
  const A12 = (161.72 + 280.8282784 * k) * DEG;
  const A13 = (239.56 + 3.8721732 * k) * DEG;
  const A14 = (331.55 + 32.02416024 * k) * DEG;

  JDE +=
    0.000325 * Math.sin(A1) +
    0.000165 * Math.sin(A2) +
    0.000164 * Math.sin(A3) +
    0.000126 * Math.sin(A4) +
    0.00011 * Math.sin(A5) +
    0.000062 * Math.sin(A6) +
    0.00006 * Math.sin(A7) +
    0.000056 * Math.sin(A8) +
    0.000047 * Math.sin(A9) +
    0.000042 * Math.sin(A10) +
    0.00004 * Math.sin(A11) +
    0.000037 * Math.sin(A12) +
    0.000035 * Math.sin(A13) +
    0.000023 * Math.sin(A14);

  return JDE;
}

/** Moon−Sun apparent ecliptic longitude difference (deg), wrapped to (−180, 180]. */
function sunMoonElongation(jde: number): number {
  const sun = solarEclipticState(jde).apparentLongitudeDegrees;
  const moon = moonApparentLongitude(jde);
  let d = (moon - sun) % 360;
  if (d > 180) d -= 360;
  else if (d < -180) d += 360;
  return d;
}

/**
 * JDE (TT) of the true new moon (定朔) for lunation k: the Meeus Ch.49 estimate
 * refined to the exact Sun–Moon apparent-longitude conjunction using the
 * ELP/MPP02 Moon and VSOP87D + DE441 Sun. Sub-arcsecond (Meeus alone is ~1 min).
 *
 * @param k - Integer lunation number (0 = 2000 Jan 6 new moon)
 * @returns JDE of the true new moon
 */
export function newMoonJDE(k: number): number {
  // Elongation rises at the synodic rate ≈ 12.1907°/day; Newton from the Meeus
  // estimate converges in a couple of steps.
  let jde = meeusNewMoonJDE(k);
  for (let i = 0; i < 6; i++) {
    const e = sunMoonElongation(jde);
    jde -= e / 12.190749;
    if (Math.abs(e) < 1e-9) break;
  }
  return jde;
}

/**
 * Find all new moon JDEs in a Julian Day range.
 *
 * @param startJD - Start of range (JD)
 * @param endJD - End of range (JD)
 * @returns Array of new moon JDEs, sorted chronologically
 */
export function findNewMoonsInRange(startJD: number, endJD: number): number[] {
  // Convert JD range to approximate k range
  // JD 2451550.1 ≈ 2000 Jan 6 (k=0)
  const kStart = Math.floor((startJD - 2451550.1) / 29.530588861) - 1;
  const kEnd = Math.ceil((endJD - 2451550.1) / 29.530588861) + 1;

  const results: number[] = [];
  for (let k = kStart; k <= kEnd; k++) {
    const jde = newMoonJDE(k);
    if (jde >= startJD && jde <= endJD) {
      results.push(jde);
    }
  }

  return results;
}
