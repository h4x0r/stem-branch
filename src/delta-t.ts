/**
 * DeltaT (ΔT) — difference between Terrestrial Time (TT) and Universal Time (UT).
 *
 *   TT = UT + ΔT
 *
 * Polynomial expressions from Espenak & Meeus (2006) for years before 2005,
 * as published at https://eclipse.gsfc.nasa.gov/SEcat5/deltatpoly.html
 *
 * For 2005–2015: EclipseWise (Espenak 2014) linear polynomial.
 * For 2016–2050: Piecewise cubic table from sxwnl (許劍偉), fitted to
 *   USNO observed data (2016–2024) and Skyfield DE440s predictions (2028–2050).
 *   Source: https://github.com/sxwnl/sxwnl/blob/master/src/eph0.js
 * For >2050: Parabolic extrapolation with jsd=31 (Swiss Ephemeris tidal
 *   acceleration), blended with the table endpoint over 100 years.
 */

// ── sxwnl cubic DeltaT table (2016–2050) ──────────────────────────────
// Piecewise cubic segments fitted to USNO observations + Skyfield DE440s.
// Format: [startYear, a0, a1, a2, a3]
// Polynomial: ΔT = a0 + a1*t + a2*t² + a3*t³
// where t = (y - startYear) / (nextYear - startYear) * 10
// prettier-ignore
const SXWNL_DT: readonly (readonly [number, number, number, number, number])[] = [
  [2016, 68.1024,  0.5456, -0.0542, -0.001172],
  [2020, 69.3612,  0.0422, -0.0502,  0.006216],
  [2024, 69.1752, -0.0335, -0.0048,  0.000811],
  [2028, 69.0206, -0.0275,  0.0055, -0.000014],
  [2032, 68.9981,  0.0163,  0.0054,  0.000006],
  [2036, 69.1498,  0.0599,  0.0053,  0.000026],
  [2040, 69.4751,  0.1035,  0.0051,  0.000046],
  [2044, 69.9737,  0.1469,  0.0050,  0.000066],
  [2048, 70.6451,  0.1903,  0.0049,  0.000085],
];

/** End-of-table year and ΔT value (sentinel) */
const SXWNL_TABLE_END = 2050;
const SXWNL_TABLE_END_DT = 71.0457;

/** Long-term parabolic extrapolation: ΔT = -20 + jsd * ((y - 1820)/100)² */
function dtParabolic(y: number, jsd: number): number {
  const dy = (y - 1820) / 100;
  return -20 + jsd * dy * dy;
}

/** Evaluate sxwnl's cubic table for 2016 <= y < 2050 */
function sxwnlCubicDeltaT(y: number): number {
  // Find the segment containing year y
  let seg = SXWNL_DT.length - 1;
  for (let i = 0; i < SXWNL_DT.length - 1; i++) {
    if (y < SXWNL_DT[i + 1][0]) { seg = i; break; }
  }
  const [y0, a0, a1, a2, a3] = SXWNL_DT[seg];
  const nextY = seg < SXWNL_DT.length - 1 ? SXWNL_DT[seg + 1][0] : SXWNL_TABLE_END;
  const t = (y - y0) / (nextY - y0) * 10;
  return a0 + a1 * t + a2 * t * t + a3 * t * t * t;
}

/**
 * Parabolic extrapolation for y >= 2050, blended over 100 years.
 * Uses jsd=31 (Swiss Ephemeris tidal acceleration value).
 */
function sxwnlExtrapolation(y: number): number {
  const jsd = 31;
  if (y > SXWNL_TABLE_END + 100) return dtParabolic(y, jsd);
  const v = dtParabolic(y, jsd);
  const dv = dtParabolic(SXWNL_TABLE_END, jsd) - SXWNL_TABLE_END_DT;
  return v - dv * (SXWNL_TABLE_END + 100 - y) / 100;
}

/**
 * Compute ΔT in seconds for a given Date.
 *
 * The input Date is interpreted as UT. The returned value is the number
 * of seconds to add to UT to obtain TT:  TT = UT + ΔT
 */
export function deltaT(date: Date): number {
  // Decimal year: y = year + (month - 0.5) / 12
  const y = date.getUTCFullYear() + (date.getUTCMonth() + 0.5) / 12;
  return deltaTForYear(y);
}

/**
 * Compute ΔT in seconds for a decimal year.
 *
 * Piecewise polynomial expressions from Espenak & Meeus (2006) for y < 2005,
 * EclipseWise (Espenak 2014) for 2005–2015, and sxwnl DE440s-fitted cubic
 * table for 2016+ with parabolic extrapolation beyond 2050.
 */
export function deltaTForYear(y: number): number {
  if (y < -500) {
    const u = (y - 1820) / 100;
    return -20 + 32 * u * u;
  }

  if (y < 500) {
    const u = y / 100;
    return 10583.6
      - 1014.41 * u
      + 33.78311 * u * u
      - 5.952053 * u * u * u
      - 0.1798452 * Math.pow(u, 4)
      + 0.022174192 * Math.pow(u, 5)
      + 0.0090316521 * Math.pow(u, 6);
  }

  if (y < 1600) {
    const u = (y - 1000) / 100;
    return 1574.2
      - 556.01 * u
      + 71.23472 * u * u
      + 0.319781 * u * u * u
      - 0.8503463 * Math.pow(u, 4)
      - 0.005050998 * Math.pow(u, 5)
      + 0.0083572073 * Math.pow(u, 6);
  }

  if (y < 1700) {
    const t = y - 1600;
    return 120
      - 0.9808 * t
      - 0.01532 * t * t
      + t * t * t / 7129;
  }

  if (y < 1800) {
    const t = y - 1700;
    return 8.83
      + 0.1603 * t
      - 0.0059285 * t * t
      + 0.00013336 * t * t * t
      - Math.pow(t, 4) / 1174000;
  }

  if (y < 1860) {
    const t = y - 1800;
    return 13.72
      - 0.332447 * t
      + 0.0068612 * t * t
      + 0.0041116 * t * t * t
      - 0.00037436 * Math.pow(t, 4)
      + 0.0000121272 * Math.pow(t, 5)
      - 0.0000001699 * Math.pow(t, 6)
      + 0.000000000875 * Math.pow(t, 7);
  }

  if (y < 1900) {
    const t = y - 1860;
    return 7.62
      + 0.5737 * t
      - 0.251754 * t * t
      + 0.01680668 * t * t * t
      - 0.0004473624 * Math.pow(t, 4)
      + Math.pow(t, 5) / 233174;
  }

  if (y < 1920) {
    const t = y - 1900;
    return -2.79
      + 1.494119 * t
      - 0.0598939 * t * t
      + 0.0061966 * t * t * t
      - 0.000197 * Math.pow(t, 4);
  }

  if (y < 1941) {
    const t = y - 1920;
    return 21.20
      + 0.84493 * t
      - 0.076100 * t * t
      + 0.0020936 * t * t * t;
  }

  if (y < 1961) {
    const t = y - 1950;
    return 29.07
      + 0.407 * t
      - t * t / 233
      + t * t * t / 2547;
  }

  if (y < 1986) {
    const t = y - 1975;
    return 45.45
      + 1.067 * t
      - t * t / 260
      - t * t * t / 718;
  }

  if (y < 2005) {
    const t = y - 2000;
    return 63.86
      + 0.3345 * t
      - 0.060374 * t * t
      + 0.0017275 * t * t * t
      + 0.000651814 * Math.pow(t, 4)
      + 0.00002373599 * Math.pow(t, 5);
  }

  // EclipseWise (Espenak 2014) linear for 2005–2015
  if (y < 2016) {
    const t = y - 2005;
    return 64.69 + 0.2930 * t;
  }

  // sxwnl cubic table (2016–2050): DE440s-fitted segments
  // Source: https://github.com/sxwnl/sxwnl (eph0.js, commit 67581321)
  // Each row: [startYear, a0, a1, a2, a3] — cubic in normalized t
  // t = (y - startYear) / intervalWidth * 10
  // ΔT = a0 + a1*t + a2*t² + a3*t³
  if (y < SXWNL_TABLE_END) {
    return sxwnlCubicDeltaT(y);
  }

  // Beyond table: parabolic extrapolation with 100-year blend
  // jsd=31 (Swiss Ephemeris tidal acceleration value)
  return sxwnlExtrapolation(y);
}
