/* v8 ignore next */
import { dateToJulianCenturies, precessionInLongitude } from '../astro';
import type { SiderealMode } from './types';

const SPICA_J2000_LON = 201.2983;

const CLASSICAL_EPOCHS: Record<string, number> = {
  kaiyuan: 724.0,
  chongzhen: 1628.0,
};

function normDeg(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function modernAyanamsa(T: number): number {
  const precessionDeg = precessionInLongitude(T) / 3600;
  return SPICA_J2000_LON + precessionDeg;
}

function classicalAyanamsa(epochYear: number): number {
  const T = (epochYear - 2000.0) / 100.0;
  return modernAyanamsa(T);
}

export function toSiderealLongitude(
  tropicalLon: number,
  date: Date,
  mode: SiderealMode = { type: 'modern' },
): number {
  let ayanamsa: number;
  switch (mode.type) {
    case 'modern': {
      const T = dateToJulianCenturies(date);
      ayanamsa = modernAyanamsa(T);
      break;
    }
    case 'classical': {
      /* v8 ignore next 3 */
      const epochYear = typeof mode.epoch === 'number'
        ? mode.epoch
        : CLASSICAL_EPOCHS[mode.epoch];
      ayanamsa = classicalAyanamsa(epochYear);
      break;
    }
    case 'ayanamsa': {
      ayanamsa = mode.value;
      break;
    }
  }
  return normDeg(tropicalLon - ayanamsa);
}
