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

/** Mean obliquity of the ecliptic (Meeus Ch. 22), degrees. */
function meanObliquity(T: number): number {
  return 23.4392911 - 0.0130042 * T - 1.64e-7 * T * T + 5.04e-7 * T * T * T;
}

function degToRad(d: number): number { return d * Math.PI / 180; }
function radToDeg(r: number): number { return r * 180 / Math.PI; }
function normDeg(d: number): number { return ((d % 360) + 360) % 360; }

export function getAscendant(
  date: Date,
  location: { lat: number; lon: number },
): AscendantResult {
  const T = dateToJulianCenturies(date);
  const gmst = greenwichMeanSiderealTime(date);
  const lst = normDeg(gmst + location.lon);

  const eps = degToRad(meanObliquity(T));
  const lat = degToRad(location.lat);
  const lstRad = degToRad(lst);

  // Standard ascending degree formula (Meeus / standard astro)
  // ASC = atan2(-cos(LST), sin(LST)*cos(ε) + tan(φ)*sin(ε))
  const ascRad = Math.atan2(
    -Math.cos(lstRad),
    Math.sin(lstRad) * Math.cos(eps) + Math.tan(lat) * Math.sin(eps),
  );
  const ascDeg = normDeg(radToDeg(ascRad));

  const mansion = getMansionForLongitude(ascDeg);
  const palace = getPalaceForLongitude(ascDeg);
  return {
    siderealLon: ascDeg,
    mansion: mansion.name,
    palace: palace.name,
  };
}
