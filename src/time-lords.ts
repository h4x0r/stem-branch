/* v8 ignore next */
/**
 * Time-lord techniques: Firdaria, Profections, Prenatal Syzygy, Hyleg, Alcochoden.
 */

import type { FirdariaResult, ProfectionResult, PrenatalSyzygyResult } from './birth-chart-types';
import type { ZodiacSign } from './tropical-astrology';
import { getZodiacSign } from './tropical-astrology';
import { SIGN_RULER } from './sign-metadata';
import { newMoonJDE } from './new-moon';
import { normalizeDegrees } from './astro';
import { getSunLongitude } from './solar-longitude';
import { getExtendedDignity } from './dignity-tables';

// ── Firdaria ─────────────────────────────────────────────────

interface FirdariaPeriod {
  ruler: string;
  years: number;
}

const CHALDEAN_ORDER = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'];

const DAY_FIRDARIA: FirdariaPeriod[] = [
  { ruler: 'Sun', years: 10 },
  { ruler: 'Moon', years: 9 },
  { ruler: 'NNode', years: 3 },
  { ruler: 'Jupiter', years: 12 },
  { ruler: 'Mercury', years: 13 },
  { ruler: 'Saturn', years: 11 },
  { ruler: 'SNode', years: 2 },
  { ruler: 'Venus', years: 8 },
  { ruler: 'Mars', years: 7 },
];

const NIGHT_FIRDARIA: FirdariaPeriod[] = [
  { ruler: 'Moon', years: 9 },
  { ruler: 'Sun', years: 10 },
  { ruler: 'SNode', years: 2 },
  { ruler: 'Jupiter', years: 12 },
  { ruler: 'Mercury', years: 13 },
  { ruler: 'Saturn', years: 11 },
  { ruler: 'NNode', years: 3 },
  { ruler: 'Venus', years: 8 },
  { ruler: 'Mars', years: 7 },
];

function findSubRuler(mainRuler: string, fractionInPeriod: number): string {
  // Sub-periods cycle through Chaldean order starting from the main ruler.
  // Nodes are not in Chaldean order; for nodes, start from the first planet in Chaldean order.
  let startIdx = CHALDEAN_ORDER.indexOf(mainRuler);
  /* v8 ignore next */
  if (startIdx === -1) startIdx = 0; // Nodes default to Saturn (index 0)

  const subIndex = Math.floor(fractionInPeriod * 7);
  const clampedIndex = Math.min(subIndex, 6);
  return CHALDEAN_ORDER[(startIdx + clampedIndex) % 7];
}

export function computeFirdaria(
  birthDate: Date,
  isDayChart: boolean,
  queryDate: Date,
): FirdariaResult {
  const msPerYear = 365.25 * 24 * 60 * 60 * 1000;
  const totalElapsed = (queryDate.getTime() - birthDate.getTime()) / msPerYear;
  let elapsed = totalElapsed % 75;
  /* v8 ignore next */
  if (elapsed < 0) elapsed += 75;

  const sequence = isDayChart ? DAY_FIRDARIA : NIGHT_FIRDARIA;
  let accumulated = 0;

  for (const period of sequence) {
    if (elapsed < accumulated + period.years) {
      const yearsIntoPeriod = elapsed - accumulated;
      const fractionInPeriod = yearsIntoPeriod / period.years;
      const subRuler = findSubRuler(period.ruler, fractionInPeriod);

      const startDate = new Date(birthDate.getTime() + accumulated * msPerYear);
      const endDate = new Date(birthDate.getTime() + (accumulated + period.years) * msPerYear);

      return { ruler: period.ruler, subRuler, startDate, endDate };
    }
    accumulated += period.years;
  /* v8 ignore start — unreachable: elapsed is mod-75 so the loop always matches */
  }

  const last = sequence[sequence.length - 1];
  return {
    ruler: last.ruler,
    subRuler: findSubRuler(last.ruler, 0),
    startDate: new Date(birthDate.getTime() + (75 - last.years) * msPerYear),
    endDate: new Date(birthDate.getTime() + 75 * msPerYear),
  };
}
/* v8 ignore stop */

// ── Profections ──────────────────────────────────────────────

export function computeProfection(
  birthDate: Date,
  queryDate: Date,
  natalAsc: number,
): ProfectionResult {
  const msPerYear = 365.25 * 24 * 60 * 60 * 1000;
  const age = Math.floor((queryDate.getTime() - birthDate.getTime()) / msPerYear);

  const house = (age % 12) + 1;
  const profectedLon = normalizeDegrees(natalAsc + age * 30);
  const { sign } = getZodiacSign(profectedLon);
  const lord = SIGN_RULER[sign];

  return { sign, lord, house };
}

// ── Prenatal Syzygy ──────────────────────────────────────────

function jdeToDate(jde: number): Date {
  return new Date((jde - 2440587.5) * 86400000);
}

export function findPrenatalSyzygy(birthDate: Date): PrenatalSyzygyResult {
  const jdBirth = birthDate.getTime() / 86400000 + 2440587.5;

  // Approximate lunation number
  let k = Math.floor((jdBirth - 2451550.1) / 29.530588861);

  // Find the last new moon before birth
  let nmJDE = newMoonJDE(k);
  if (nmJDE >= jdBirth) {
    k--;
    nmJDE = newMoonJDE(k);
  }

  // Check if a full moon (k + 0.5) falls between the new moon and birth
  const fmJDE = newMoonJDE(k + 0.5);

  if (fmJDE > nmJDE && fmJDE < jdBirth) {
    // Full moon is the prenatal syzygy
    const date = jdeToDate(fmJDE);
    const longitude = getSunLongitude(date);
    return { type: 'full', date, longitude };
  }

  // New moon is the prenatal syzygy
  const date = jdeToDate(nmJDE);
  const longitude = getSunLongitude(date);
  return { type: 'new', date, longitude };
}

// ── Hyleg ────────────────────────────────────────────────────

const HYLEGICAL_PLACES = [1, 7, 9, 10, 11];

export function findHyleg(
  positions: Array<{ body: string; house: number }>,
  isDayChart: boolean,
): string | null {
  const preferenceOrder = isDayChart
    ? ['Sun', 'Moon', 'ASC']
    : ['Moon', 'Sun', 'ASC'];

  for (const body of preferenceOrder) {
    const pos = positions.find((p) => p.body === body);
    if (pos && HYLEGICAL_PLACES.includes(pos.house)) {
      return body;
    }
  }

  return null;
}

// ── Alcochoden ───────────────────────────────────────────────

const TRADITIONAL_PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];

export function findAlcochoden(
  hylegSign: ZodiacSign,
  hylegDegree: number,
  isDayChart: boolean,
): string | null {
  let bestBody: string | null = null;
  let bestScore = 0;

  for (const body of TRADITIONAL_PLANETS) {
    const result = getExtendedDignity(body, hylegSign, hylegDegree, isDayChart);
    if (result.score > bestScore) {
      bestScore = result.score;
      bestBody = body;
    }
  }

  return bestBody;
}
