/* v8 ignore next */
/**
 * Transit overlay computation.
 *
 * Computes current planetary positions and finds aspects between
 * transiting bodies and natal chart positions.
 */

import { computeBirthChart } from './birth-chart';
import type { BirthChartPosition } from './birth-chart-types';

// ── Aspect definitions ──────────────────────────────────────

const ASPECT_ANGLES: Record<string, number> = {
  conjunction: 0,
  sextile: 60,
  square: 90,
  trine: 120,
  opposition: 180,
};

const MAJOR_ASPECTS = new Set(['conjunction', 'opposition', 'trine', 'square', 'sextile']);

const DEFAULT_ORBS: Record<string, number> = {
  conjunction: 8,
  opposition: 8,
  trine: 8,
  square: 7,
  sextile: 6,
};

// ── Cross-chart aspects ─────────────────────────────────────

export interface CrossAspect {
  transitBody: string;
  natalBody: string;
  type: string;
  angle: number;
  orb: number;
  major: boolean;
}

/**
 * Find aspects between two sets of positions (transit vs natal).
 *
 * @param transitPositions - Array of { body, longitude } for transiting planets
 * @param natalPositions - Array of { body, longitude } for natal planets
 * @param orbs - Optional custom orbs per aspect type
 */
export function findCrossAspects(
  transitPositions: Array<{ body: string; longitude: number }>,
  natalPositions: Array<{ body: string; longitude: number }>,
  orbs?: Partial<Record<string, number>>,
): CrossAspect[] {
  const effectiveOrbs = { ...DEFAULT_ORBS, ...orbs };
  const aspects: CrossAspect[] = [];

  for (const tp of transitPositions) {
    for (const np of natalPositions) {
      const diff = Math.abs(tp.longitude - np.longitude);
      const separation = diff > 180 ? 360 - diff : diff;

      for (const [name, targetAngle] of Object.entries(ASPECT_ANGLES)) {
        const orb = Math.abs(separation - targetAngle);
        /* v8 ignore next */
        if (orb <= (effectiveOrbs[name] ?? 0)) {
          aspects.push({
            transitBody: tp.body,
            natalBody: np.body,
            type: name,
            angle: targetAngle,
            orb,
            major: MAJOR_ASPECTS.has(name),
          });
        }
      }
    }
  }

  // Sort by orb (tightest first)
  aspects.sort((a, b) => a.orb - b.orb);

  return aspects;
}

// ── Full transit computation ────────────────────────────────

export interface TransitResult {
  transitDate: Date;
  transitPositions: BirthChartPosition[];
  natalPositions: BirthChartPosition[];
  aspects: CrossAspect[];
}

/**
 * Compute transits: planetary positions at transitDate aspecting
 * the natal chart cast for birthDate at the given location.
 */
export function computeTransits(
  birthDate: Date,
  lat: number,
  lng: number,
  transitDate: Date,
): TransitResult {
  const natalChart = computeBirthChart(birthDate, lat, lng);
  const transitChart = computeBirthChart(transitDate, lat, lng);

  const natalPositions = natalChart.positions;
  const transitPositions = transitChart.positions;

  const aspects = findCrossAspects(
    transitPositions.map(p => ({ body: p.body, longitude: p.longitude })),
    natalPositions.map(p => ({ body: p.body, longitude: p.longitude })),
  );

  return {
    transitDate,
    transitPositions,
    natalPositions,
    aspects,
  };
}
