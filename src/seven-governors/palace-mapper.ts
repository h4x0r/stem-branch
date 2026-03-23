import type { PalaceName } from './types';
import { PALACE_BOUNDARIES } from './data/palace-boundaries';

export interface PalaceResult {
  name: PalaceName;
  degree: number;
  index: number;
}

export function getPalaceForLongitude(siderealLon: number): PalaceResult {
  const lon = ((siderealLon % 360) + 360) % 360;
  const index = Math.min(Math.floor(lon / 30), 11);
  const palace = PALACE_BOUNDARIES[index];
  return {
    name: palace.name,
    degree: lon - palace.startDeg,
    index,
  };
}
