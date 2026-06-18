/* v8 ignore next */
/**
 * Finite-difference speed computation for celestial bodies.
 */

/**
 * Compute the daily speed (°/day) of a body at a given date using
 * symmetric finite difference.
 *
 * @param date - Reference date
 * @param getPosition - Function returning ecliptic longitude for a date
 * @param dt - Time offset in milliseconds (default: 1 hour = 3600000)
 * @returns Speed in degrees per day
 */
export function computeSpeed(
  date: Date,
  getPosition: (d: Date) => number,
  dt: number = 3600000,
): number {
  const t = date.getTime();
  const before = new Date(t - dt);
  const after = new Date(t + dt);

  let diff = getPosition(after) - getPosition(before);

  // Handle angle wrapping at 0°/360° boundary
  /* v8 ignore next */
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;

  // Convert dt from ms to days (2*dt because symmetric)
  const dtDays = (2 * dt) / 86400000;
  return diff / dtDays;
}
