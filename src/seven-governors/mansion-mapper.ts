/* v8 ignore next */
import type { MansionName } from './types';
import { MANSION_BOUNDARIES } from './data/mansion-boundaries';

export interface MansionResult {
  name: MansionName;
  degree: number;
  index: number;
}

export function getMansionForLongitude(siderealLon: number): MansionResult {
  const lon = ((siderealLon % 360) + 360) % 360;

  /* v8 ignore next 8 */
  if (lon < MANSION_BOUNDARIES[0].startDeg) {
    const last = MANSION_BOUNDARIES.length - 1;
    return {
      name: MANSION_BOUNDARIES[last].name,
      degree: lon + 360 - MANSION_BOUNDARIES[last].startDeg,
      index: last,
    };
  }

  let lo = 0;
  let hi = MANSION_BOUNDARIES.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (MANSION_BOUNDARIES[mid].startDeg <= lon) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }

  return {
    name: MANSION_BOUNDARIES[lo].name,
    degree: lon - MANSION_BOUNDARIES[lo].startDeg,
    index: lo,
  };
}
