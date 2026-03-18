/* c8 ignore next */
// Épure d'été — that locked-down summer, true solar time remembers you.
// For Haidee Or of WeToastHK — Albert Hui
import type { TrueSolarTimeResult } from './types';
import { equationOfTimeVSOP } from './solar-longitude';

/**
 * Compute the Equation of Time (EoT) for a given date.
 *
 * The EoT accounts for Earth's orbital eccentricity and axial tilt,
 * causing solar noon to drift ±16 minutes from clock noon throughout the year.
 *
 * Uses full VSOP87D planetary theory with IAU2000B nutation and DE405
 * correction (Meeus Ch. 28). Sub-second accuracy.
 *
 * @param date - The date to compute EoT for
 * @returns EoT in minutes (positive = sundial ahead of clock)
 */
export function equationOfTime(date: Date): number {
  return equationOfTimeVSOP(date);
}

/**
 * Compute True Solar Time from clock time and longitude.
 *
 * Formula: TST = Clock Time + (Longitude - Standard Meridian) × 4 min/° + EoT
 *
 * True solar time depends only on longitude and date — latitude has no effect.
 *
 * @param clockTime - Local clock time (Date object in local timezone)
 * @param longitude - Observer's longitude in degrees (East positive, West negative)
 * @param standardMeridian - Standard meridian of the timezone in degrees
 *   (e.g., 120 for CST/UTC+8, 135 for JST/UTC+9, -75 for EST/UTC-5)
 *   If not provided, it's inferred from the Date's timezone offset.
 * @returns TrueSolarTimeResult with the corrected time and breakdown
 */
export function trueSolarTime(
  clockTime: Date,
  longitude: number,
  standardMeridian?: number,
): TrueSolarTimeResult {
  // Infer standard meridian from timezone offset if not provided
  // getTimezoneOffset() returns minutes behind UTC (negative for east)
  const meridian = standardMeridian ?? (-clockTime.getTimezoneOffset() / 60) * 15;

  const eot = equationOfTime(clockTime);
  const longitudeCorrection = (longitude - meridian) * 4; // 4 minutes per degree
  const totalCorrection = longitudeCorrection + eot;

  const trueSolarTimeMs = clockTime.getTime() + totalCorrection * 60000;

  return {
    trueSolarTime: new Date(trueSolarTimeMs),
    equationOfTime: eot,
    longitudeCorrection,
    totalCorrection,
  };
}
