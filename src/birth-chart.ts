/* v8 ignore next */
/**
 * Master birth chart computation — enriches the tropical chart with
 * 300+ professional-grade data points.
 *
 * Orchestrates: speed, dignity, antiscia, solar proximity, horizontal
 * coordinates, distributions, patterns, time-lords, fixed stars, etc.
 */

import {
  computeTropicalChart, getZodiacSign,
  findAspects, findParallelAspects,
  computeAscendant,
} from './tropical-astrology';
import type { ZodiacSign } from './tropical-astrology';
import type {
  BirthChartData, BirthChartPosition, BirthChartAspect,
  BirthChartOptions, ExtendedAspectName,
} from './birth-chart-types';
import { SIGN_ELEMENT, SIGN_QUALITY, SIGN_POLARITY, SIGN_RULER } from './sign-metadata';
import { getExtendedDignity, isPeregrine, findMutualReceptions } from './dignity-tables';
import { computeSpeed } from './speed';
import {
  computeAntiscia, computeContraAntiscia,
  isDayChart,
  computeDispositorChain, findFinalDispositor,
  computeDistributions, computeHemispheres,
  detectChartPattern, computeMoonPhase,
  computePlanetaryHour, getPlanetaryDay,
  computeSolarProximity, isOriental, isOutOfBounds,
  isVoidOfCourseMoon,
} from './birth-chart-analysis';
import { findFixedStarConjunctions } from './data/fixed-stars';
import { getSabianSymbol } from './data/sabian-symbols';
import { getWesternLunarMansion } from './western-lunar-mansions';
import {
  computeFirdaria, computeProfection, findPrenatalSyzygy,
  findHyleg, findAlcochoden,
} from './time-lords';
import { getSunLongitude } from './solar-longitude';
import { getMoonPosition } from './moon/moon';
import { getPlanetPosition } from './planets/planets';
import { getChironPosition } from './planets/chiron';
// See tropical-astrology.ts for cross-tradition rationale on these aliases
import { getRahuPosition as getNorthNodePosition, getYuebeiPosition as getLilithPosition } from './seven-governors/four-remainders';
import {
  dateToJulianCenturies, trueObliquity,
  eclipticToEquatorial, equatorialToHorizontal,
  greenwichMeanSiderealTime, normalizeDegrees, DEG_TO_RAD,
} from './astro';
import type { Planet } from './types';
import { computeResearch } from './research/index';

const PLANETS: Planet[] = [
  'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
];

const STATIONARY_THRESHOLD = 0.05; // °/day — below this a planet is considered stationary

const PTOLEMAIC_ANGLES = [0, 60, 90, 120, 180];

// Bodies where solar proximity (combust/cazimi/under beams) doesn't apply
const SOLAR_PROX_EXEMPT = new Set([
  'Sun', 'Moon', 'Part of Fortune', 'Vertex', 'North Node', 'South Node',
]);

// Bodies where orientality doesn't apply
const ORIENTAL_EXEMPT = new Set(['Sun', 'Moon']);

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function computeBirthChart(
  date: Date,
  lat: number,
  lng: number,
  options?: BirthChartOptions,
): BirthChartData {
  const houseSystem = options?.houseSystem ?? 'placidus';
  const queryDate = options?.queryDate ?? date;

  // ── 1. Base tropical chart ─────────────────────────────────
  const base = computeTropicalChart(date, lat, lng, { houseSystem });

  // ── 2. Astronomical constants ──────────────────────────────
  const T = dateToJulianCenturies(date);
  const epsRad = trueObliquity(T);
  const gmst = greenwichMeanSiderealTime(date);
  const lstDeg = normalizeDegrees(gmst + lng);
  const obliquityDeg = epsRad / DEG_TO_RAD;

  // ── 3. Raw RA / Dec / distance for each body ──────────────
  const rawData: Record<string, { ra: number; dec: number; distance: number }> = {};

  // Sun: ecliptic lat ≈ 0
  const sunLon = base.positions.find(p => p.body === 'Sun')!.longitude;
  {
    const [ra, dec] = eclipticToEquatorial(sunLon, 0, epsRad);
    rawData['Sun'] = { ra: normalizeDegrees(ra), dec, distance: 1.0 };
  }

  // Moon: full GeocentricPosition available
  {
    const geo = getMoonPosition(date);
    rawData['Moon'] = { ra: normalizeDegrees(geo.ra), dec: geo.dec, distance: geo.distance };
  }

  // Planets Mercury–Pluto: full GeocentricPosition
  for (const planet of PLANETS) {
    const geo = getPlanetPosition(planet, date);
    rawData[capitalize(planet)] = { ra: normalizeDegrees(geo.ra), dec: geo.dec, distance: geo.distance };
  }

  // Virtual / computed points: derive RA/Dec from ecliptic
  for (const name of ['North Node', 'South Node', 'Chiron', 'Lilith', 'Part of Fortune', 'Vertex']) {
    const pos = base.positions.find(p => p.body === name);
    if (pos) {
      const [ra, dec] = eclipticToEquatorial(pos.longitude, pos.latitude, epsRad);
      rawData[name] = { ra: normalizeDegrees(ra), dec, distance: 0 };
    }
  }

  // ── 4. Speed for each body ─────────────────────────────────
  const speeds: Record<string, number> = {};

  speeds['Sun'] = computeSpeed(date, d => getSunLongitude(d));
  speeds['Moon'] = computeSpeed(date, d => getMoonPosition(d).longitude);

  for (const planet of PLANETS) {
    speeds[capitalize(planet)] = computeSpeed(date, d => getPlanetPosition(planet, d).longitude);
  }

  speeds['North Node'] = computeSpeed(date, d => getNorthNodePosition(d).longitude);
  speeds['South Node'] = -speeds['North Node'];
  speeds['Chiron'] = computeSpeed(date, d => getChironPosition(d).longitude);
  speeds['Lilith'] = computeSpeed(date, d => getLilithPosition(d).longitude);
  speeds['Part of Fortune'] = 0;
  speeds['Vertex'] = 0;

  // ── 5. Day / night chart ───────────────────────────────────
  const sunHouse = base.positions.find(p => p.body === 'Sun')!.house;
  const dayChart = isDayChart(sunHouse);

  // ── 6. Enrich each position ────────────────────────────────
  const positions: BirthChartPosition[] = base.positions.map(p => {
    /* v8 ignore next */
    const speed = speeds[p.body] ?? 0;
    /* v8 ignore next */
    const raw = rawData[p.body] ?? { ra: 0, dec: 0, distance: 0 };
    const { azimuth, altitude } = equatorialToHorizontal(raw.ra, raw.dec, lstDeg, lat);
    const dignity = getExtendedDignity(p.body, p.sign, p.signDegree, dayChart);
    const solarProx = computeSolarProximity(p.longitude, sunLon);
    const decan = (Math.floor(p.signDegree / 10) + 1) as 1 | 2 | 3;

    const enriched: BirthChartPosition = {
      body: p.body,
      longitude: p.longitude,
      latitude: p.latitude,
      distance: raw.distance,
      ra: raw.ra,
      declination: raw.dec,
      speed,
      retrograde: speed < 0,
      stationary: Math.abs(speed) < STATIONARY_THRESHOLD,
      sign: p.sign,
      signDegree: p.signDegree,
      house: p.house,
      dignity,
      dignityScore: dignity.score,
      element: SIGN_ELEMENT[p.sign],
      quality: SIGN_QUALITY[p.sign],
      polarity: SIGN_POLARITY[p.sign],
      decan,
      peregrine: isPeregrine(p.body, p.sign, p.signDegree, dayChart),
      dispositor: SIGN_RULER[p.sign],
      antiscia: computeAntiscia(p.longitude),
      contraAntiscia: computeContraAntiscia(p.longitude),
      outOfBounds: isOutOfBounds(raw.dec, obliquityDeg),
      combust: SOLAR_PROX_EXEMPT.has(p.body) ? false : solarProx.combust,
      cazimi: SOLAR_PROX_EXEMPT.has(p.body) ? false : solarProx.cazimi,
      underBeams: SOLAR_PROX_EXEMPT.has(p.body) ? false : solarProx.underBeams,
      oriental: ORIENTAL_EXEMPT.has(p.body) ? null : isOriental(p.longitude, sunLon),
      azimuth,
      altitude,
      sabianSymbol: getSabianSymbol(p.longitude),
    };

    if (p.body === 'Moon') {
      enriched.lunarMansion = getWesternLunarMansion(p.longitude);
    }

    return enriched;
  });

  // ── 7. Extended aspects (with applying / separating) ───────
  const aspects: BirthChartAspect[] = findAspects(base.positions, undefined, speeds).map(a => ({
    body1: a.body1,
    body2: a.body2,
    type: a.type as ExtendedAspectName,
    angle: a.angle,
    orb: a.orb,
    applying: a.applying,
    major: a.major,
  }));

  // ── 8. Parallel / contra-parallel aspects ──────────────────
  const parallels: BirthChartAspect[] = findParallelAspects(
    positions.map(p => ({ body: p.body, declination: p.declination })),
  ).map(a => ({
    body1: a.body1,
    body2: a.body2,
    type: a.type as ExtendedAspectName,
    angle: 0,          // declination aspects don't have a zodiacal angle
    orb: a.orb,
    applying: false,   // declination aspects lack speed-based applying/separating
    major: true,       // parallels are traditionally considered major
  }));

  // ── 9. Angles ──────────────────────────────────────────────
  const vertexLon = base.positions.find(p => p.body === 'Vertex')!.longitude;
  const lstRad = lstDeg * DEG_TO_RAD;
  const eqAsc = computeAscendant(lstRad, epsRad, 0); // lat = 0° → equatorial ASC

  const angles = {
    asc: base.houses.ascendant,
    dsc: normalizeDegrees(base.houses.ascendant + 180),
    mc: base.houses.midheaven,
    ic: normalizeDegrees(base.houses.midheaven + 180),
    vertex: vertexLon,
    equatorialAscendant: eqAsc,
  };

  // ── 10. Distributions ──────────────────────────────────────
  const distributions = computeDistributions(
    positions.map(p => ({
      body: p.body,
      element: p.element,
      quality: p.quality,
      polarity: p.polarity,
    })),
  );

  // ── 11. Hemispheres ────────────────────────────────────────
  const hemispheres = computeHemispheres(
    positions.map(p => ({ house: p.house })),
  );

  // ── 12. Chart pattern ──────────────────────────────────────
  const chartPattern = detectChartPattern(
    positions.map(p => p.longitude),
  );

  // ── 13. Moon phase ─────────────────────────────────────────
  const moonLon = positions.find(p => p.body === 'Moon')!.longitude;
  const moonPhase = computeMoonPhase(sunLon, moonLon);

  // ── 14. Dispositor chain ───────────────────────────────────
  const dispositorChain = computeDispositorChain(
    positions.map(p => ({ body: p.body, sign: p.sign })),
  );
  const finalDispositor = findFinalDispositor(dispositorChain);

  // ── 15. Mutual receptions ──────────────────────────────────
  const mutualReceptions = findMutualReceptions(
    positions.map(p => ({ body: p.body, sign: p.sign })),
  );

  // ── 16. Fixed star conjunctions ────────────────────────────
  const fixedStarConjunctions: Array<{ star: string; body: string; orb: number }> = [];
  for (const p of positions) {
    fixedStarConjunctions.push(...findFixedStarConjunctions(p.longitude, p.body, T));
  }

  // ── 17. Planetary hour / day ───────────────────────────────
  const planetaryHour = computePlanetaryHour(date, lat, lng);
  const planetaryDay = getPlanetaryDay(date);

  // ── 18. Void-of-course Moon ────────────────────────────────
  const moonPos = positions.find(p => p.body === 'Moon')!;
  const voidOfCourseMoon = isVoidOfCourseMoon(
    moonPos.longitude,
    moonPos.speed,
    moonPos.sign,
    positions.filter(p => p.body !== 'Moon').map(p => ({ longitude: p.longitude })),
    PTOLEMAIC_ANGLES,
  );

  // ── 19. Prenatal syzygy ────────────────────────────────────
  const prenatalSyzygy = findPrenatalSyzygy(date);

  // ── 20. Profection ─────────────────────────────────────────
  const profection = computeProfection(date, queryDate, base.houses.ascendant);

  // ── 21. Firdaria ───────────────────────────────────────────
  const firdaria = computeFirdaria(date, dayChart, queryDate);

  // ── 22. Hyleg / Alcochoden ─────────────────────────────────
  const hyleg = findHyleg(
    positions.map(p => ({ body: p.body, house: p.house })),
    dayChart,
  );
  let alcochoden: string | null = null;
  if (hyleg) {
    const hylegPos = positions.find(p => p.body === hyleg);
    if (hylegPos) {
      alcochoden = findAlcochoden(hylegPos.sign, hylegPos.signDegree, dayChart);
    }
  }

  // ── 23. Lunar mansion (chart-level, based on Moon) ─────────
  const lunarMansion = getWesternLunarMansion(moonPos.longitude);

  // ── 24. Research extensions (optional) ──────────────────────
  const research = options?.research
    ? computeResearch({
        date, lat, positions, aspects, rawData, speeds,
        lstDeg, obliquityDeg, isDayChart: dayChart,
        prenatalSyzygy, angles,
      })
    : undefined;

  // ── Assemble ───────────────────────────────────────────────
  return {
    positions,
    houses: base.houses,
    aspects,
    parallels,
    angles,
    distributions,
    hemispheres,
    chartPattern,
    isDayChart: dayChart,
    moonPhase,
    dispositorChain,
    finalDispositor,
    mutualReceptions,
    fixedStarConjunctions,
    planetaryHour,
    planetaryDay,
    voidOfCourseMoon,
    prenatalSyzygy,
    profection,
    firdaria,
    hyleg,
    alcochoden,
    lunarMansion,
    settings: {
      houseSystem,
      zodiac: 'tropical',
    },
    research,
  };
}
