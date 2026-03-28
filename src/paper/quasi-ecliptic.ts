/**
 * Quasi-ecliptic (似黃道) coordinate system — first rigorous mathematical definition.
 *
 * The 似黃道恆星製 used in Ming-dynasty 《果老星宗》 projects equal 30° right-ascension
 * divisions onto the ecliptic plane. Because of the obliquity of the ecliptic (ε ≈ 23.5°),
 * the resulting ecliptic divisions are unequal: wider near the equinoxes, narrower near
 * the solstices. This creates a coordinate system that is "similar to the ecliptic"
 * (似黃道) but not identical.
 *
 * Key formula: For a point on the ecliptic (β = 0):
 *   tan(α) = cos(ε) · tan(λ)
 * Inverse:
 *   λ = atan2(sin(α), cos(α) · cos(ε))
 */

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/**
 * Convert a right ascension to its corresponding ecliptic longitude
 * on the ecliptic plane (β = 0).
 *
 * @param raDeg - Right ascension in degrees [0, 360)
 * @param obliquityRad - Obliquity of the ecliptic in radians
 * @returns Ecliptic longitude in degrees [0, 360)
 */
export function raToEclipticOnEcliptic(raDeg: number, obliquityRad: number): number {
  const alpha = raDeg * DEG_TO_RAD;
  const cosEps = Math.cos(obliquityRad);
  const lambda = Math.atan2(Math.sin(alpha), Math.cos(alpha) * cosEps);
  return ((lambda * RAD_TO_DEG) + 360) % 360;
}

/**
 * Compute the 12 quasi-ecliptic house boundaries.
 *
 * Projects equal 30° RA boundaries (0°, 30°, 60°, ..., 330°) onto the ecliptic.
 * The result is 12 ecliptic longitudes that define unequal house divisions.
 *
 * @param obliquityRad - Obliquity of the ecliptic in radians
 * @returns Array of 12 ecliptic longitudes in degrees, sorted ascending
 */
export function quasiEclipticBoundaries(obliquityRad: number): number[] {
  const boundaries: number[] = [];
  for (let i = 0; i < 12; i++) {
    boundaries.push(raToEclipticOnEcliptic(i * 30, obliquityRad));
  }
  return boundaries;
}

/**
 * Compute the angular width of each quasi-ecliptic house.
 *
 * @param obliquityRad - Obliquity of the ecliptic in radians
 * @returns Array of 12 widths in degrees (sum = 360°)
 */
export function quasiEclipticWidths(obliquityRad: number): number[] {
  const b = quasiEclipticBoundaries(obliquityRad);
  const widths: number[] = [];
  for (let i = 0; i < 12; i++) {
    const next = i < 11 ? b[i + 1] : 360 + b[0];
    widths.push(next - b[i]);
  }
  return widths;
}

/**
 * Determine which quasi-ecliptic house (1–12) a body falls in.
 *
 * @param eclipticLonDeg - Body's ecliptic longitude in degrees
 * @param boundaries - The 12 house boundaries from quasiEclipticBoundaries()
 * @returns House number 1–12
 */
export function quasiEclipticHouse(eclipticLonDeg: number, boundaries: number[]): number {
  const lon = ((eclipticLonDeg % 360) + 360) % 360;
  for (let i = 11; i >= 0; i--) {
    if (lon >= boundaries[i]) return i + 1;
  }
  return 12;
}
