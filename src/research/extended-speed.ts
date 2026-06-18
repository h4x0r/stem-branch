/* v8 ignore next */
/**
 * Extended speed data for research / cosmobiology analysis.
 *
 * Computes speed in latitude, speed in distance, relative speed,
 * and fast/slow classification for each body.
 */

import type { ExtendedSpeed } from '../birth-chart-types';

/**
 * Average daily speeds in longitude (°/day) for classical + modern bodies.
 * Used to compute relative speed ratios.
 */
export const AVERAGE_SPEEDS: Record<string, number> = {
  Sun: 0.986,
  Moon: 13.176,
  Mercury: 1.383,
  Venus: 1.200,
  Mars: 0.524,
  Jupiter: 0.083,
  Saturn: 0.034,
  Uranus: 0.012,
  Neptune: 0.006,
  Pluto: 0.004,
};

/**
 * Compute the daily speed of a linear (non-angular) quantity using
 * symmetric finite difference.  Unlike computeSpeed(), this does NOT
 * apply angle wrapping — suitable for distance, latitude, etc.
 *
 * @param date - Reference date
 * @param getValue - Function returning a scalar value for a date
 * @param dt - Time offset in milliseconds (default: 1 hour)
 * @returns Rate of change per day
 */
export function computeLinearSpeed(
  date: Date,
  getValue: (d: Date) => number,
  dt: number = 3600000,
): number {
  const t = date.getTime();
  const before = new Date(t - dt);
  const after = new Date(t + dt);
  const diff = getValue(after) - getValue(before);
  const dtDays = (2 * dt) / 86400000;
  return diff / dtDays;
}

/**
 * Compute extended speed data for a single body.
 *
 * @param body - Body name
 * @param longitudeSpeed - Already-computed speed in longitude (°/day)
 * @param latitudeSpeed - Speed in latitude (°/day)
 * @param distanceSpeed - Speed in distance (AU/day or km/day for Moon)
 * @returns Extended speed record
 */
export function computeExtendedSpeed(
  body: string,
  longitudeSpeed: number,
  latitudeSpeed: number,
  distanceSpeed: number,
): ExtendedSpeed {
  const avg = AVERAGE_SPEEDS[body];
  const relativeSpeed = avg ? Math.abs(longitudeSpeed) / avg : 0;

  return {
    latitudeSpeed,
    distanceSpeed,
    relativeSpeed,
    fast: relativeSpeed > 1.0,
  };
}
