/* v8 ignore next */
/**
 * Solar Return chart computation.
 *
 * A solar return occurs when the transiting Sun returns to its exact
 * natal longitude. The chart cast for that moment at the native's
 * location (or relocated location) is used in predictive astrology.
 */

import { getSunLongitude, findSunLongitudeMoment } from './solar-longitude';
import { computeBirthChart } from './birth-chart';
import type { BirthChartData } from './birth-chart-types';

export interface SolarReturnResult {
  /** The natal Sun longitude used for targeting. */
  natalSunLongitude: number;
  /** The exact date/time of the solar return. */
  returnDate: Date;
  /** The year requested. */
  year: number;
  /** The full birth chart computed at the return moment. */
  chart: BirthChartData;
}

/**
 * Compute a solar return chart.
 *
 * @param birthDate - The native's birth date (UTC)
 * @param lat - Latitude for the return chart
 * @param lng - Longitude for the return chart
 * @param year - The calendar year for which to compute the return
 */
export function computeSolarReturn(
  birthDate: Date,
  lat: number,
  lng: number,
  year: number,
): SolarReturnResult {
  const natalSunLon = getSunLongitude(birthDate);

  // Search starting from the beginning of the target year,
  // looking across the full year to find when the Sun returns
  const searchStart = new Date(Date.UTC(year, 0, 1));
  const returnDate = findSunLongitudeMoment(natalSunLon, searchStart, 366);

  if (!returnDate) {
    throw new Error(`Could not find solar return for year ${year}`);
  }

  const chart = computeBirthChart(returnDate, lat, lng);

  return {
    natalSunLongitude: natalSunLon,
    returnDate,
    year,
    chart,
  };
}
