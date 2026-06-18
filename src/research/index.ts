/* v8 ignore next */
/**
 * Research / statistical extensions orchestrator.
 *
 * Assembles all research data from the individual computation modules.
 * Called conditionally from computeBirthChart when options.research is true.
 */

import type {
  BirthChartPosition, BirthChartAspect,
  ResearchData, ResearchPosition,
  PrenatalSyzygyResult,
} from '../birth-chart-types';
import { getMoonPosition } from '../moon/moon';
import { getPlanetPosition } from '../planets/planets';
import { getChironPosition } from '../planets/chiron';
import { getRahuPosition, getYuebeiPosition } from '../seven-governors/four-remainders';
import { computeSpeed } from '../speed';
import { computeLinearSpeed, computeExtendedSpeed } from './extended-speed';
import { computeSpeculumEntry } from './speculum';
import { toDial90 } from './ninety-degree-dial';
import { computeMidpoints, findMidpointStructures } from './midpoints';
import { computeGauquelinSector, isGauquelinPlusZone } from './gauquelin';
import { computeAccidentalDignity, computeAlmutenFiguris } from './accidental-dignity';
import { isHayz, isHalb, isBesieged, isViaCombusta, isJoyByHouse } from './classical-conditions';

import type { Planet } from '../types';

const PLANETS: Planet[] = [
  'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
];

/** Input data passed from computeBirthChart internals. */
export interface ResearchInput {
  date: Date;
  lat: number;
  positions: BirthChartPosition[];
  aspects: BirthChartAspect[];
  rawData: Record<string, { ra: number; dec: number; distance: number }>;
  speeds: Record<string, number>;
  lstDeg: number;         // = RAMC
  obliquityDeg: number;
  isDayChart: boolean;
  prenatalSyzygy: PrenatalSyzygyResult;
  angles: { asc: number; mc: number };
}

/**
 * Compute all research extensions for a birth chart.
 */
export function computeResearch(input: ResearchInput): ResearchData {
  const {
    date, lat, positions, aspects,
    rawData, speeds, lstDeg,
    isDayChart, prenatalSyzygy, angles,
  } = input;

  // ── Per-body research positions ────────────────────────────

  const researchPositions: ResearchPosition[] = [];

  for (const pos of positions) {
    // Extended speeds: latitude and distance
    const latSpeed = computeLatitudeSpeed(pos.body, date);
    const distSpeed = computeDistanceSpeed(pos.body, date);
    const extendedSpeed = computeExtendedSpeed(
      pos.body,
      /* v8 ignore next */
      speeds[pos.body] ?? 0,
      latSpeed,
      distSpeed,
    );

    // Speculum
    const raw = rawData[pos.body];
    const aboveHorizon = pos.altitude > 0;
    /* v8 ignore next 3 */
    const speculum = raw
      ? computeSpeculumEntry(raw.ra, raw.dec, lat, lstDeg, aboveHorizon)
      : computeSpeculumEntry(0, 0, lat, lstDeg, false);

    // Gauquelin sector (uses speculum semi-arcs)
    /* v8 ignore next 3 */
    const gauquelinSector = raw
      ? computeGauquelinSector(raw.ra, lstDeg, speculum.dsa, speculum.nsa)
      : 1;

    // Accidental dignity
    const accidentalDignityScore = computeAccidentalDignity(pos, extendedSpeed.relativeSpeed);

    // Classical conditions
    const hayz = isHayz(pos.body, isDayChart, aboveHorizon, pos.polarity, pos.oriental);
    const halb = isHalb(pos.body, isDayChart, aboveHorizon, pos.polarity, pos.oriental);
    const bodyLonsForBesiegement = positions.map(p => ({ body: p.body, longitude: p.longitude }));
    const besieged = isBesieged(pos.body, pos.longitude, bodyLonsForBesiegement);
    const viaCombusta = isViaCombusta(pos.body, pos.longitude);
    const joyByHouse = isJoyByHouse(pos.body, pos.house);

    researchPositions.push({
      body: pos.body,
      extendedSpeed,
      speculum,
      dialPosition90: toDial90(pos.longitude),
      gauquelinSector,
      gauquelinPlusZone: isGauquelinPlusZone(gauquelinSector),
      accidentalDignityScore,
      hayz,
      halb,
      besieged,
      viaCombusta,
      joyByHouse,
    });
  }

  // ── Midpoints ──────────────────────────────────────────────

  const bodyLons = positions.map(p => ({ body: p.body, longitude: p.longitude }));
  const midpoints = computeMidpoints(bodyLons);
  const midpointStructures = findMidpointStructures(bodyLons, midpoints);

  // ── Partile aspects (orb < 1°) ─────────────────────────────

  const partileAspects = aspects.filter(a => a.orb < 1.0);

  // ── Almuten Figuris ────────────────────────────────────────

  /* v8 ignore next 2 */
  const sunLon = positions.find(p => p.body === 'Sun')?.longitude ?? 0;
  const moonLon = positions.find(p => p.body === 'Moon')?.longitude ?? 0;
  const hylegicalDegrees = [
    angles.asc,
    angles.mc,
    sunLon,
    moonLon,
    prenatalSyzygy.longitude,
  ];
  const almutenFiguris = computeAlmutenFiguris(hylegicalDegrees, isDayChart);

  return {
    positions: researchPositions,
    midpoints,
    midpointStructures,
    partileAspects,
    almutenFiguris,
  };
}

// ── Internal helpers for latitude / distance speed ───────────

function computeLatitudeSpeed(body: string, date: Date): number {
  switch (body) {
    case 'Sun':
      return 0; // Sun's ecliptic latitude is ~0 by definition
    case 'Moon':
      return computeSpeed(date, d => getMoonPosition(d).latitude);
    case 'North Node':
      return computeLinearSpeed(date, d => getRahuPosition(d).latitude);
    case 'South Node':
      return computeLinearSpeed(date, d => -getRahuPosition(d).latitude);
    case 'Chiron':
      return computeLinearSpeed(date, d => getChironPosition(d).latitude);
    case 'Lilith':
      return computeLinearSpeed(date, d => getYuebeiPosition(d).latitude);
    case 'Part of Fortune':
    case 'Vertex':
      return 0; // computed points
    default: {
      const planet = body.toLowerCase() as Planet;
      if (PLANETS.includes(planet)) {
        return computeSpeed(date, d => getPlanetPosition(planet, d).latitude);
      /* v8 ignore start */
      }
      return 0;
    }
    /* v8 ignore stop */
  }
}

function computeDistanceSpeed(body: string, date: Date): number {
  switch (body) {
    case 'Sun':
      return 0; // Sun–Earth distance variation is negligible for this purpose
    case 'Moon':
      return computeLinearSpeed(date, d => getMoonPosition(d).distance);
    case 'North Node':
    case 'South Node':
    case 'Lilith':
    case 'Part of Fortune':
    case 'Vertex':
      return 0; // virtual points have no meaningful distance
    case 'Chiron':
      return computeLinearSpeed(date, d => getChironPosition(d).distance);
    default: {
      const planet = body.toLowerCase() as Planet;
      if (PLANETS.includes(planet)) {
        return computeLinearSpeed(date, d => getPlanetPosition(planet, d).distance);
      /* v8 ignore start */
      }
      return 0;
    }
    /* v8 ignore stop */
  }
}
