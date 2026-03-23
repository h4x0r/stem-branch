import { getSunLongitude } from '../solar-longitude';
import { getMoonPosition } from '../moon/moon';
import { getPlanetPosition } from '../planets/planets';
import type { Planet } from '../types';
import {
  type GovernorOrRemainder, type Governor, type Remainder,
  type SevenGovernorsChart, type SevenGovernorsOptions,
  type BodyPosition, type PalaceInfo, type SiderealMode, type KetuMode,
  type PalaceName, type PalaceRole, type MansionName, type Dignity,
  GOVERNORS, REMAINDERS, ALL_BODIES, PALACE_ROLES,
} from './types';
import { toSiderealLongitude } from './sidereal';
import { getRahuPosition, getKetuPosition, getYuebeiPosition, getPurpleQiPosition } from './four-remainders';
import { getMansionForLongitude } from './mansion-mapper';
import { getPalaceForLongitude } from './palace-mapper';
import { getAscendant } from './ascendant';
import { PALACE_BOUNDARIES } from './data/palace-boundaries';
import { getDignity } from './data/dignity';
import { computeAspects } from './data/aspects';
import { evaluateStarSpirits, type StarSpiritContext } from './data/star-spirits';

/** Map of Planet type values for getPlanetPosition calls */
const PLANET_MAP: Partial<Record<Governor, Planet>> = {
  mercury: 'mercury', venus: 'venus', mars: 'mars',
  jupiter: 'jupiter', saturn: 'saturn',
};

/**
 * Get tropical longitude for a governor body.
 */
function getGovernorTropicalLon(body: Governor, date: Date): number {
  if (body === 'sun') return getSunLongitude(date);
  if (body === 'moon') return getMoonPosition(date).longitude;
  const planet = PLANET_MAP[body];
  if (!planet) throw new Error(`Unknown governor: ${body}`);
  return getPlanetPosition(planet, date).longitude;
}

/**
 * Get tropical longitude for a remainder body.
 */
function getRemainderTropicalLon(
  body: Remainder, date: Date, ketuMode: KetuMode,
): number {
  switch (body) {
    case 'rahu': return getRahuPosition(date).longitude;
    case 'ketu': return getKetuPosition(date, ketuMode).longitude;
    case 'yuebei': return getYuebeiPosition(date).longitude;
    case 'purpleQi': return getPurpleQiPosition(date).longitude;
  }
}

/**
 * Compute a complete 七政四餘 natal chart.
 *
 * Orchestrates all component layers:
 * 1. Computes tropical positions for all 11 bodies (7 governors + 4 remainders)
 * 2. Converts to sidereal coordinates using the specified mode
 * 3. Maps each body to its lunar mansion and palace
 * 4. Determines the ascendant from date and location
 * 5. Assigns palace roles relative to the ascendant
 * 6. Computes inter-body aspects
 * 7. Evaluates star spirit patterns
 * 8. Looks up dignity for each body
 */
export function getSevenGovernorsChart(
  date: Date,
  location: { lat: number; lon: number },
  options?: SevenGovernorsOptions,
): SevenGovernorsChart {
  const siderealMode: SiderealMode = options?.siderealMode ?? { type: 'modern' };
  const ketuMode: KetuMode = options?.ketuMode ?? 'apogee';

  // Step 1: Compute all body positions
  const bodies = {} as Record<GovernorOrRemainder, BodyPosition>;

  for (const gov of GOVERNORS) {
    const tropLon = getGovernorTropicalLon(gov, date);
    const sidLon = toSiderealLongitude(tropLon, date, siderealMode);
    const mansion = getMansionForLongitude(sidLon);
    const palace = getPalaceForLongitude(sidLon);
    bodies[gov] = {
      siderealLon: sidLon,
      tropicalLon: tropLon,
      mansion: mansion.name,
      mansionDegree: mansion.degree,
      palace: palace.name,
    };
  }

  for (const rem of REMAINDERS) {
    const tropLon = getRemainderTropicalLon(rem, date, ketuMode);
    const sidLon = toSiderealLongitude(tropLon, date, siderealMode);
    const mansion = getMansionForLongitude(sidLon);
    const palace = getPalaceForLongitude(sidLon);
    bodies[rem] = {
      siderealLon: sidLon,
      tropicalLon: tropLon,
      mansion: mansion.name,
      mansionDegree: mansion.degree,
      palace: palace.name,
    };
  }

  // Step 2: Ascendant
  const asc = getAscendant(date, location);
  const ascPalaceIdx = PALACE_BOUNDARIES.findIndex(p => p.name === asc.palace);
  if (ascPalaceIdx === -1) {
    throw new Error(`Ascendant palace not found in PALACE_BOUNDARIES: ${asc.palace}`);
  }

  // Step 3: Build palace info with roles
  const palaces: PalaceInfo[] = PALACE_BOUNDARIES.map((pb, i) => {
    // Role is determined by offset from ascendant palace
    const roleIdx = ((i - ascPalaceIdx) % 12 + 12) % 12;
    const occupants = (ALL_BODIES as readonly GovernorOrRemainder[]).filter(
      b => bodies[b].palace === pb.name,
    );
    return {
      name: pb.name,
      role: PALACE_ROLES[roleIdx],
      mansions: pb.mansions,
      occupants: [...occupants],
    };
  });

  // Step 4: Aspects
  const bodyPalaceIndices = new Map<GovernorOrRemainder, number>();
  for (const body of ALL_BODIES) {
    const idx = PALACE_BOUNDARIES.findIndex(p => p.name === bodies[body].palace);
    if (idx === -1) {
      throw new Error(`Palace not found in PALACE_BOUNDARIES for body ${body}: ${bodies[body].palace}`);
    }
    bodyPalaceIndices.set(body, idx);
  }
  const aspects = computeAspects(bodyPalaceIndices);

  // Step 5: Star spirits
  const bodyPalaces = new Map<GovernorOrRemainder, PalaceName>();
  const bodyMansions = new Map<GovernorOrRemainder, MansionName>();
  for (const body of ALL_BODIES) {
    bodyPalaces.set(body, bodies[body].palace);
    bodyMansions.set(body, bodies[body].mansion);
  }
  const spiritCtx: StarSpiritContext = {
    bodyPalaces,
    bodyMansions,
    bodyPalaceIndices,
    ascendantPalaceIndex: ascPalaceIdx,
  };
  const starSpirits = evaluateStarSpirits(spiritCtx);

  // Step 6: Dignities
  const dignities = {} as Record<GovernorOrRemainder, Dignity>;
  for (const body of ALL_BODIES) {
    dignities[body] = getDignity(body, bodies[body].palace);
  }

  return {
    date,
    location,
    siderealMode,
    ketuMode,
    bodies,
    palaces,
    ascendant: { mansion: asc.mansion, palace: asc.palace },
    starSpirits,
    aspects,
    dignities,
  };
}
