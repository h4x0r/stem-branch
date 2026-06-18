/* v8 ignore next */
import { dateToJulianCenturies, greenwichMeanSiderealTime, meanObliquity } from '../astro';
import type { MansionName, PalaceName } from './types';
import { getMansionForLongitude } from './mansion-mapper';
import { getPalaceForLongitude } from './palace-mapper';

export interface AscendantResult {
  siderealLon: number;
  mansion: MansionName;
  palace: PalaceName;
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

  const eps = meanObliquity(T); // already in radians
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
