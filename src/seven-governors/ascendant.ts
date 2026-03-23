import { dateToJulianCenturies } from '../astro';
import type { MansionName, PalaceName } from './types';
import { getMansionForLongitude } from './mansion-mapper';
import { getPalaceForLongitude } from './palace-mapper';

function greenwichMeanSiderealTime(date: Date): number {
  const T = dateToJulianCenturies(date);
  const jd = T * 36525.0 + 2451545.0;
  const jd0 = Math.floor(jd - 0.5) + 0.5;
  const T0 = (jd0 - 2451545.0) / 36525.0;
  const ut = (jd - jd0) * 24.0;
  const gmst0 = 24110.54841
    + 8640184.812866 * T0
    + 0.093104 * T0 * T0
    - 6.2e-6 * T0 * T0 * T0;
  const gmstDeg = (gmst0 / 240.0) + (ut * 15.0 * 1.00273790935);
  return ((gmstDeg % 360) + 360) % 360;
}

export interface AscendantResult {
  siderealLon: number;
  mansion: MansionName;
  palace: PalaceName;
}

export function getAscendant(
  date: Date,
  location: { lat: number; lon: number },
): AscendantResult {
  const gmst = greenwichMeanSiderealTime(date);
  const lst = ((gmst + location.lon) % 360 + 360) % 360;
  const ascDeg = (lst + 90) % 360;
  const mansion = getMansionForLongitude(ascDeg);
  const palace = getPalaceForLongitude(ascDeg);
  return {
    siderealLon: ascDeg,
    mansion: mansion.name,
    palace: palace.name,
  };
}
