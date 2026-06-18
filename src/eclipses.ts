/* v8 ignore next */
import type { Eclipse, EclipseKind, SolarEclipseType, LunarEclipseType } from './types';
import {
  SOLAR_PACKED, SOLAR_MAGNITUDES,
  LUNAR_PACKED, LUNAR_MAGNITUDES,
  ECLIPSE_DATA_RANGE,
} from './eclipse-data';

const ENTRY_LEN = 10; // SYYYYMMDDX per eclipse (S = +/- sign)

/** Decode a packed eclipse string into Eclipse objects (lazy, cached) */
function decodePacked(
  packed: string,
  magnitudes: Uint16Array,
  kind: EclipseKind,
): Eclipse[] {
  const count = packed.length / ENTRY_LEN;
  const result: Eclipse[] = new Array(count);
  for (let i = 0; i < count; i++) {
    const offset = i * ENTRY_LEN;
    const sign = packed[offset] === '-' ? -1 : 1;
    const year = sign * parseInt(packed.slice(offset + 1, offset + 5), 10);
    const month = parseInt(packed.slice(offset + 5, offset + 7), 10);
    const day = parseInt(packed.slice(offset + 7, offset + 9), 10);
    const type = packed[offset + 9] as SolarEclipseType | LunarEclipseType;
    const magnitude = magnitudes[i] / 10000;
    // Use setUTCFullYear to avoid JS Date's 0-99 → 1900-1999 mapping
    const date = new Date(Date.UTC(year, month - 1, day));
    date.setUTCFullYear(year);
    result[i] = { date, kind, type, magnitude };
  }
  return result;
}

let _solarCache: Eclipse[] | null = null;
let _lunarCache: Eclipse[] | null = null;

function getSolarEclipses(): Eclipse[] {
  if (!_solarCache) _solarCache = decodePacked(SOLAR_PACKED, SOLAR_MAGNITUDES, 'solar');
  return _solarCache;
}

function getLunarEclipses(): Eclipse[] {
  if (!_lunarCache) _lunarCache = decodePacked(LUNAR_PACKED, LUNAR_MAGNITUDES, 'lunar');
  return _lunarCache;
}

/**
 * All solar eclipses in the dataset, sorted by date.
 * Lazily decoded from packed data on first access.
 */
export function getAllSolarEclipses(): readonly Eclipse[] {
  return getSolarEclipses();
}

/**
 * All lunar eclipses in the dataset, sorted by date.
 * Lazily decoded from packed data on first access.
 */
export function getAllLunarEclipses(): readonly Eclipse[] {
  return getLunarEclipses();
}

/** Binary search for the insertion point of a UTC timestamp in a sorted Eclipse array */
function bisect(eclipses: Eclipse[], ts: number): number {
  let lo = 0, hi = eclipses.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (eclipses[mid].date.getTime() < ts) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/**
 * Get all eclipses (solar + lunar) for a given year, sorted by date.
 * Returns empty array for years outside the dataset range (-1999 to 3000).
 */
export function getEclipsesForYear(year: number): Eclipse[] {
  if (year < ECLIPSE_DATA_RANGE.min || year > ECLIPSE_DATA_RANGE.max) return [];

  const startTs = Date.UTC(year, 0, 1);
  const endTs = Date.UTC(year + 1, 0, 1);

  const solar = getSolarEclipses();
  const lunar = getLunarEclipses();

  const solarStart = bisect(solar, startTs);
  const solarEnd = bisect(solar, endTs);
  const lunarStart = bisect(lunar, startTs);
  const lunarEnd = bisect(lunar, endTs);

  const result = [
    ...solar.slice(solarStart, solarEnd),
    ...lunar.slice(lunarStart, lunarEnd),
  ];

  result.sort((a, b) => a.date.getTime() - b.date.getTime());
  return result;
}

/**
 * Get eclipses within a date range, optionally filtered by kind.
 * Returns eclipses sorted by date.
 */
export function getEclipsesInRange(
  start: Date,
  end: Date,
  kind?: EclipseKind,
): Eclipse[] {
  const startTs = start.getTime();
  const endTs = end.getTime();

  const result: Eclipse[] = [];

  if (kind !== 'lunar') {
    const solar = getSolarEclipses();
    const lo = bisect(solar, startTs);
    const hi = bisect(solar, endTs);
    for (let i = lo; i < hi; i++) result.push(solar[i]);
  }

  if (kind !== 'solar') {
    const lunar = getLunarEclipses();
    const lo = bisect(lunar, startTs);
    const hi = bisect(lunar, endTs);
    for (let i = lo; i < hi; i++) result.push(lunar[i]);
  }

  if (!kind) result.sort((a, b) => a.date.getTime() - b.date.getTime());
  return result;
}

/**
 * Find the nearest eclipse to a given date, optionally filtered by kind.
 * Returns undefined if the date is far outside the dataset range.
 */
export function findNearestEclipse(
  date: Date,
  kind?: EclipseKind,
): Eclipse | undefined {
  const ts = date.getTime();
  let best: Eclipse | undefined;
  let bestDist = Infinity;

  function check(eclipses: Eclipse[]) {
    const idx = bisect(eclipses, ts);
    for (const i of [idx - 1, idx]) {
      if (i >= 0 && i < eclipses.length) {
        const dist = Math.abs(eclipses[i].date.getTime() - ts);
        if (dist < bestDist) {
          bestDist = dist;
          best = eclipses[i];
        }
      }
    }
  }

  if (kind !== 'lunar') check(getSolarEclipses());
  if (kind !== 'solar') check(getLunarEclipses());

  // Return undefined if nearest is more than 1 year away (likely outside dataset)
  /* v8 ignore next */
  if (bestDist > 365.25 * 24 * 3600 * 1000) return undefined;
  return best;
}

/**
 * Check if a given UTC date has an eclipse.
 * Matches on calendar date (year/month/day), ignoring time.
 * Returns the first matching eclipse, or null.
 */
export function isEclipseDate(date: Date): Eclipse | null {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();

  function search(eclipses: Eclipse[]): Eclipse | null {
    const ts = Date.UTC(y, m, d);
    const idx = bisect(eclipses, ts);
    // Check entries around the insertion point
    for (let i = Math.max(0, idx - 1); i <= Math.min(eclipses.length - 1, idx + 1); i++) {
      const e = eclipses[i];
      if (
        e.date.getUTCFullYear() === y &&
        e.date.getUTCMonth() === m &&
        e.date.getUTCDate() === d
      ) {
        return e;
      }
    }
    return null;
  }

  return search(getSolarEclipses()) ?? search(getLunarEclipses());
}

/** Dataset range */
export { ECLIPSE_DATA_RANGE } from './eclipse-data';
