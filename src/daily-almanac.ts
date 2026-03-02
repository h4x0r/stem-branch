/**
 * 日曆總覽 (Daily Almanac)
 *
 * Single-call entry point that composes every major module into
 * one structured result for a given date. Showcases: four pillars,
 * solar terms, lunar calendar, zodiac, day fitness, flying stars,
 * almanac flags, Six Ren divination, eclipses, and element analysis.
 */

import type {
  FourPillars, Element, Strength, SolarTerm,
  ChineseZodiacResult, WesternZodiacResult,
  Eclipse,
} from './types';
import type { LunarDate } from './lunar-calendar';
import type { DayFitness } from './day-fitness';
import type { FlyingStarInfo } from './flying-stars';
import type { AlmanacFlagResult } from './almanac-flags';
import type { SixRenChart } from './six-ren';

import { julianDayNumber } from './julian-day';
import { gregorianToLunar } from './lunar-calendar';
import { computeFourPillars } from './four-pillars';
import { getSolarTermsForYear } from './solar-terms';
import { getChineseZodiac } from './chinese-zodiac';
import { getWesternZodiac } from './western-zodiac';
import { getDayFitnessForDate } from './day-fitness';
import { getFlyingStars, FLYING_STARS } from './flying-stars';
import { getAlmanacFlags } from './almanac-flags';
import { computeSixRenForDate } from './six-ren';
import { findNearestEclipse, isEclipseDate } from './eclipses';
import { STEM_ELEMENT } from './stems';
import { getStrength } from './element-strength';

// ── Public type ──────────────────────────────────────────────

export interface DailyAlmanac {
  /** Input date */
  date: Date;
  /** Julian Day Number */
  julianDay: number;

  /** Lunar (農曆) date */
  lunar: LunarDate;

  /** Four Pillars (四柱八字) */
  pillars: FourPillars;

  /** Surrounding solar terms (節氣) */
  solarTerm: {
    current: { name: string; date: Date } | null;
    next: { name: string; date: Date };
  };

  /** Chinese zodiac (生肖) — 立春 boundary */
  chineseZodiac: ChineseZodiacResult;
  /** Western zodiac (星座) */
  westernZodiac: WesternZodiacResult;

  /** Day fitness (建除十二神) */
  dayFitness: { fitness: DayFitness; auspicious: boolean };

  /** Flying stars (紫白九星) — year, month, day, hour */
  flyingStars: {
    year: FlyingStarInfo;
    month: FlyingStarInfo;
    day: FlyingStarInfo;
    hour: FlyingStarInfo;
  };

  /** Active almanac flags (神煞) */
  almanacFlags: AlmanacFlagResult[];

  /** Six Ren divination chart (大六壬) */
  sixRen: SixRenChart;

  /** Nearest eclipse to this date */
  nearestEclipse: Eclipse;
  /** Whether this exact date has an eclipse */
  isEclipseDay: boolean;

  /** Day stem's element (日干五行) */
  dayElement: Element;
  /** Day element's seasonal strength (旺相休囚死) */
  dayStrength: Strength;
}

// ── Solar term helpers ───────────────────────────────────────

function findSurroundingTerms(
  date: Date,
): { current: { name: string; date: Date } | null; next: { name: string; date: Date } } {
  const year = date.getUTCFullYear();
  const ts = date.getTime();

  // Gather terms from surrounding years to handle boundaries
  const terms: SolarTerm[] = [
    ...getSolarTermsForYear(year - 1),
    ...getSolarTermsForYear(year),
    ...getSolarTermsForYear(year + 1),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  let current: { name: string; date: Date } | null = null;
  let next: { name: string; date: Date } = { name: terms[0].name, date: terms[0].date };

  for (let i = 0; i < terms.length; i++) {
    if (terms[i].date.getTime() <= ts) {
      current = { name: terms[i].name, date: terms[i].date };
    } else {
      next = { name: terms[i].name, date: terms[i].date };
      break;
    }
  }

  return { current, next };
}

// ── Main function ────────────────────────────────────────────

export function dailyAlmanac(date: Date): DailyAlmanac {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();

  const julianDay = julianDayNumber(y, m, d);
  const lunar = gregorianToLunar(date);
  const pillars = computeFourPillars(date);
  const solarTerm = findSurroundingTerms(date);
  const chineseZodiac = getChineseZodiac(date);
  const westernZodiac = getWesternZodiac(date);
  const dayFitness = getDayFitnessForDate(date);
  const rawStars = getFlyingStars(date);
  const starInfo = (n: number) => FLYING_STARS[n - 1];
  const flyingStars = {
    year: starInfo(rawStars.year),
    month: starInfo(rawStars.month),
    day: starInfo(rawStars.day),
    hour: starInfo(rawStars.hour),
  };
  const almanacFlags = getAlmanacFlags(date);
  const sixRen = computeSixRenForDate(date);
  const nearestEclipse = findNearestEclipse(date)!;
  const eclipseDay = isEclipseDate(date);

  const dayElement = STEM_ELEMENT[pillars.day.stem];
  const dayStrength = getStrength(dayElement, pillars.month.branch).label;

  return {
    date,
    julianDay,
    lunar,
    pillars,
    solarTerm,
    chineseZodiac,
    westernZodiac,
    dayFitness,
    flyingStars,
    almanacFlags,
    sixRen,
    nearestEclipse,
    isEclipseDay: eclipseDay !== null,
    dayElement,
    dayStrength,
  };
}
