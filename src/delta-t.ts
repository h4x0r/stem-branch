/**
 * DeltaT (ΔT) — difference between Terrestrial Time (TT) and Universal Time (UT).
 *
 *   TT = UT + ΔT
 *
 * Polynomial expressions from Espenak & Meeus (2006) for years before 2005,
 * as published at https://eclipse.gsfc.nasa.gov/SEcat5/deltatpoly.html
 *
 * For 2005 onwards, uses updated polynomials from EclipseWise (Espenak)
 * that account for the slower-than-predicted ΔT growth after 2005.
 * https://eclipsewise.com/help/deltatpoly2014.html
 */

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
 * and EclipseWise updated polynomials (Espenak 2014) for y >= 2005.
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

  // EclipseWise updated polynomials (Espenak 2014) for 2005 onwards.
  // These replace the Espenak & Meeus 2006 expressions which overestimated
  // ΔT growth after 2005.

  if (y < 2015) {
    const t = y - 2005;
    return 64.69 + 0.2930 * t;
  }

  if (y < 3000) {
    const t = y - 2015;
    return 67.62 + 0.3645 * t + 0.0039755 * t * t;
  }

  // After 3000: long-term parabolic extrapolation
  const u = (y - 1820) / 100;
  return -20 + 32 * u * u;
}
