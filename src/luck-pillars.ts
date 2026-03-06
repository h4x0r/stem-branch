/**
 * 大運 / 小運 (Major & Minor Luck Periods)
 *
 * 大運: 10-year periods derived from the month pillar, advancing forward
 * or backward through the sexagenary cycle based on gender + year stem polarity.
 * Starting age is computed from birth date to the nearest 節 (month-boundary
 * solar term), divided by 3 (traditional rule: 3 days ≈ 1 year).
 *
 * 小運: Year-by-year pillars from the hour pillar in the same direction,
 * primarily used for years before the first 大運 kicks in.
 */

import type { Stem, Branch, StemBranch } from './types';
import { stemPolarity } from './stems';
import { stemBranchCycleIndex, stemBranchByCycleIndex } from './stem-branch';
import { computeFourPillars } from './four-pillars';
import { getMonthBoundaryTerms } from './solar-terms';

// ── Types ─────────────────────────────────────────────────────

export type LuckDirection = 'forward' | 'backward';

export interface MajorLuckPeriod {
  pillar: { stem: Stem; branch: Branch; stemBranch: StemBranch };
  startAge: number;
  endAge: number;
}

export interface MajorLuckResult {
  direction: LuckDirection;
  startAge: number;
  periods: MajorLuckPeriod[];
}

export interface MinorLuckYear {
  age: number;
  pillar: { stem: Stem; branch: Branch; stemBranch: StemBranch };
}

// ── Direction ─────────────────────────────────────────────────

/**
 * Determine the luck direction from year stem polarity + gender.
 *
 * Yang stem + male OR yin stem + female → forward (順行)
 * Yang stem + female OR yin stem + male → backward (逆行)
 */
export function getLuckDirection(
  yearStem: Stem,
  gender: 'male' | 'female',
): LuckDirection {
  const isYang = stemPolarity(yearStem) === '陽';
  const isMale = gender === 'male';
  return isYang === isMale ? 'forward' : 'backward';
}

// ── Starting age ──────────────────────────────────────────────

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Compute the starting age for the first 大運.
 *
 * Count days from birth to the nearest 節 (month-boundary solar term)
 * in the given direction, then divide by 3 (3 days ≈ 1 year).
 */
function computeStartAge(birthDate: Date, direction: LuckDirection): number {
  const year = birthDate.getUTCFullYear();

  // Gather 節 from surrounding years for edge cases
  const terms = [
    ...getMonthBoundaryTerms(year - 1),
    ...getMonthBoundaryTerms(year),
    ...getMonthBoundaryTerms(year + 1),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const birthMs = birthDate.getTime();

  if (direction === 'forward') {
    const next = terms.find(t => t.date.getTime() > birthMs);
    if (!next) throw new Error('Cannot find next 節');
    const days = Math.round((next.date.getTime() - birthMs) / MS_PER_DAY);
    return Math.max(1, Math.round(days / 3));
  } else {
    const prev = [...terms].reverse().find(t => t.date.getTime() <= birthMs);
    if (!prev) throw new Error('Cannot find previous 節');
    const days = Math.round((birthMs - prev.date.getTime()) / MS_PER_DAY);
    return Math.max(1, Math.round(days / 3));
  }
}

// ── Major Luck ────────────────────────────────────────────────

/**
 * Compute 大運 (major luck periods) from a birth date and gender.
 *
 * @param birthDate - Birth date (UTC)
 * @param gender - 'male' or 'female'
 * @param count - Number of periods to generate (default 8)
 */
export function computeMajorLuck(
  birthDate: Date,
  gender: 'male' | 'female',
  count: number = 8,
): MajorLuckResult {
  const pillars = computeFourPillars(birthDate);
  const direction = getLuckDirection(pillars.year.stem, gender);
  const startAge = computeStartAge(birthDate, direction);

  const monthIdx = stemBranchCycleIndex(pillars.month.stem, pillars.month.branch);
  const step = direction === 'forward' ? 1 : -1;

  const periods: MajorLuckPeriod[] = [];
  for (let i = 0; i < count; i++) {
    const cycleIdx = ((monthIdx + (i + 1) * step) % 60 + 60) % 60;
    const pillar = stemBranchByCycleIndex(cycleIdx);
    periods.push({
      pillar,
      startAge: startAge + i * 10,
      endAge: startAge + i * 10 + 9,
    });
  }

  return { direction, startAge, periods };
}

// ── Minor Luck ────────────────────────────────────────────────

/**
 * Compute 小運 (minor luck) year-by-year pillars.
 *
 * Starting from the hour pillar, advance (or retreat) by one
 * sexagenary position per year of age (虛歲).
 *
 * @param hourPillar - The hour pillar { stem, branch }
 * @param direction - Forward or backward (same rule as 大運)
 * @param fromAge - Start age (虛歲, typically 1)
 * @param toAge - End age (inclusive)
 */
export function computeMinorLuck(
  hourPillar: { stem: Stem; branch: Branch },
  direction: LuckDirection,
  fromAge: number,
  toAge: number,
): MinorLuckYear[] {
  const hourIdx = stemBranchCycleIndex(hourPillar.stem, hourPillar.branch);
  const step = direction === 'forward' ? 1 : -1;

  const result: MinorLuckYear[] = [];
  for (let age = fromAge; age <= toAge; age++) {
    const cycleIdx = ((hourIdx + age * step) % 60 + 60) % 60;
    result.push({
      age,
      pillar: stemBranchByCycleIndex(cycleIdx),
    });
  }
  return result;
}
