/**
 * Timezone conversion utilities for wall-clock ↔ UTC ↔ true solar time.
 *
 * Uses an embedded IANA transition table (78 timezones, 11,742 transitions,
 * 1900-2026) as the primary source for deterministic, platform-independent
 * timezone conversion. Falls back to the Intl API for timezones not in the
 * embedded database.
 *
 * Covers: PRC DST 1986-1991, Taiwan DST 1946-1979, Hong Kong summer time
 * 1946-1979, Japan occupation DST 1948-1951, Singapore UTC+7:30→UTC+8
 * transition, and all other historical timezone changes from IANA tzdata.
 *
 * Key references:
 *
 * Primary / authoritative:
 * - IANA Time Zone Database: https://www.iana.org/time-zones
 * - HKO Summer Time: https://www.hko.gov.hk/tc/gts/time/Summertime.htm
 *   (Official Hong Kong Observatory record of all 33 summer time years)
 * - ITU-T SP LT.1-2015: https://www.itu.int/dms_pub/itu-t/opb/sp/T-SP-LT.1-2015-PDF-E.pdf
 *   (ITU standard time zone designations and UTC offsets)
 * - CRS Report R45208: https://www.congress.gov/crs-product/R45208
 *   (US Congressional Research Service: Daylight Saving Time history and policy)
 * - 台灣省政府公報: https://www.th.gov.tw/Epaper_Content/238/6535/
 *   (Official ROC government record: 三更燈火五更雞—臺灣時間的故事)
 *
 * Wikipedia (comprehensive secondary):
 * - DST by country: https://en.wikipedia.org/wiki/Daylight_saving_time_by_country
 * - Hong Kong Time: https://en.wikipedia.org/wiki/Hong_Kong_Time
 * - Singapore Time: https://en.wikipedia.org/wiki/Singapore_Time
 * - Time in China: https://en.wikipedia.org/wiki/Time_in_China
 * - Time in Indonesia: https://en.wikipedia.org/wiki/Time_in_Indonesia
 * - Time in Malaysia: https://en.wikipedia.org/wiki/Time_in_Malaysia
 * - Time in Taiwan: https://en.wikipedia.org/wiki/Time_in_Taiwan
 * - 臺灣日治時期年表: https://zh.wikipedia.org/zh-tw/臺灣日治時期年表
 *
 * Historical / editorial:
 * - WeToastHK DST History: https://www.wetoasthk.com/1010-2/
 *   (Detailed HK historical narrative with legislative context)
 * - BBC中文 時區: https://www.bbc.com/zhongwen/trad/chinese-news-41789080
 *   (Taiwan 2017 timezone petition; historical context of PRC/ROC/Japan TZ politics)
 */

import type { TrueSolarTimeResult } from './types';
import { equationOfTime } from './true-solar-time';
import { getEmbeddedOffset } from './tz-data';

// ── localToUtc ──────────────────────────────────────────────

/**
 * Convert a local wall-clock date/time in a given IANA timezone to UTC.
 *
 * Handles historical DST transitions, half-hour offsets, and all other
 * timezone peculiarities. Uses embedded IANA transition data as primary
 * source, with Intl.DateTimeFormat as fallback for unknown timezones.
 *
 * @param year - Gregorian year
 * @param month - Month 1-12
 * @param day - Day of month 1-31
 * @param hour - Hour 0-23
 * @param minute - Minute 0-59
 * @param timezoneId - IANA timezone identifier (e.g. 'Asia/Shanghai', 'America/New_York')
 * @returns Date object representing the UTC instant
 */
export function localToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timezoneId: string,
): Date {
  // Build an ISO-like string for the target local time
  const pad = (n: number) => String(n).padStart(2, '0');
  const localStr = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00`;

  // Start with a rough estimate: treat the local time as UTC
  let estimate = new Date(localStr + 'Z');

  // Get the UTC offset at our estimate, then adjust
  const offset = getTimezoneOffsetMs(estimate, timezoneId);
  // If local = UTC + offset, then UTC = local - offset
  estimate = new Date(estimate.getTime() - offset);

  // Verify: the offset may differ at the corrected time (DST boundary)
  const offset2 = getTimezoneOffsetMs(estimate, timezoneId);
  if (offset2 !== offset) {
    estimate = new Date(new Date(localStr + 'Z').getTime() - offset2);
  }

  return estimate;
}

// ── getUtcOffset ────────────────────────────────────────────

/**
 * Get the UTC offset in minutes (positive = east of UTC) for a local
 * wall-clock time in a given timezone.
 *
 * Example: Shanghai standard time → +480 (UTC+8 = 8 × 60)
 *          New York EST → -300 (UTC-5 = -5 × 60)
 *          Nepal → +345 (UTC+5:45)
 *
 * @returns Offset in minutes (local - UTC)
 */
export function getUtcOffset(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timezoneId: string,
): number {
  const utc = localToUtc(year, month, day, hour, minute, timezoneId);
  const pad = (n: number) => String(n).padStart(2, '0');
  const localStr = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00`;
  const localAsUtc = new Date(localStr + 'Z');
  return Math.round((localAsUtc.getTime() - utc.getTime()) / 60000);
}

// ── isDst ───────────────────────────────────────────────────

/**
 * Determine whether daylight saving time (summer time) is in effect
 * at a given local wall-clock time in a given timezone.
 *
 * Works by comparing the current UTC offset against the timezone's
 * standard (non-DST) offset in January of the same year. If the
 * current offset is greater, DST is in effect.
 *
 * Handles southern hemisphere correctly (where DST is in Jan).
 */
export function isDst(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timezoneId: string,
): boolean {
  const current = getUtcOffset(year, month, day, hour, minute, timezoneId);

  // Sample offsets in mid-January and mid-July to find standard offset
  // (whichever is smaller is the standard offset, since DST adds time)
  const jan = getUtcOffset(year, 1, 15, 12, 0, timezoneId);
  const jul = getUtcOffset(year, 7, 15, 12, 0, timezoneId);
  const standardOffset = Math.min(jan, jul);

  return current > standardOffset;
}

// ── getStandardMeridian ─────────────────────────────────────

/**
 * Get the standard meridian (in degrees) for a timezone at a given moment.
 *
 * The standard meridian is derived from the UTC offset:
 *   meridian = offset_minutes / 4
 *
 * This is essential for true solar time computation: the longitude
 * correction is (observer_longitude - standard_meridian) × 4 min/°.
 *
 * During DST, the effective standard meridian shifts east (e.g., UTC+8
 * has meridian 120°E, but during DST at UTC+9 the meridian becomes 135°E).
 */
export function getStandardMeridian(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timezoneId: string,
): number {
  const offsetMinutes = getUtcOffset(year, month, day, hour, minute, timezoneId);
  return offsetMinutes / 4;
}

// ── utcToLocal ──────────────────────────────────────────────

/**
 * Convert a UTC Date to local wall-clock components in a given IANA timezone.
 *
 * This is the inverse of `localToUtc`. Uses the embedded IANA transition
 * table as the primary source, falling back to Intl for unknown timezones.
 *
 * @param date - UTC Date object
 * @param timezoneId - IANA timezone identifier
 * @returns Object with { year, month, day, hour, minute, second }
 */
export function utcToLocal(
  date: Date,
  timezoneId: string,
): { year: number; month: number; day: number; hour: number; minute: number; second: number } {
  // Primary: use embedded offset to compute local time via arithmetic
  const utcSeconds = Math.floor(date.getTime() / 1000);
  const embedded = getEmbeddedOffset(utcSeconds, timezoneId);
  if (embedded !== null) {
    const localMs = date.getTime() + embedded.offsetMinutes * 60000;
    const local = new Date(localMs);
    return {
      year: local.getUTCFullYear(),
      month: local.getUTCMonth() + 1,
      day: local.getUTCDate(),
      hour: local.getUTCHours(),
      minute: local.getUTCMinutes(),
      second: local.getUTCSeconds(),
    };
  }

  // Fallback: Intl API for unknown timezones
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezoneId,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => {
    const part = parts.find(p => p.type === type);
    return part ? parseInt(part.value, 10) : 0;
  };

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour') === 24 ? 0 : get('hour'),
    minute: get('minute'),
    second: get('second'),
  };
}

// ── formatUtcOffset ─────────────────────────────────────────

/**
 * Format a UTC offset in minutes as a display string.
 *
 * Examples:
 *   480  → "+08:00"  (UTC+8)
 *  -300  → "-05:00"  (UTC-5)
 *   330  → "+05:30"  (UTC+5:30, India)
 *   345  → "+05:45"  (UTC+5:45, Nepal)
 *     0  → "+00:00"
 *
 * @param offsetMinutes - Offset in minutes (positive = east of UTC)
 * @returns Formatted string like "+HH:MM" or "-HH:MM"
 */
export function formatUtcOffset(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ── timezoneFromLongitude ───────────────────────────────────

/**
 * Derive a rough Etc/GMT timezone from longitude.
 *
 * Used as a fallback when no IANA timezone ID is available.
 * Note: Etc/GMT uses inverted sign convention — Etc/GMT-8 = UTC+8.
 *
 * @param longitude - Degrees east (positive) or west (negative)
 * @returns Etc/GMT timezone string
 */
export function timezoneFromLongitude(longitude: number): string {
  const offsetHours = Math.round(longitude / 15);
  // Etc/GMT sign is inverted: positive offset → negative Etc label
  const etcSign = offsetHours >= 0 ? '-' : '+';
  return `Etc/GMT${etcSign}${Math.abs(offsetHours)}`;
}

// ── wallClockToSolarTime ────────────────────────────────────

/**
 * Convert a local wall-clock time to true solar time.
 *
 * This is the full pipeline for Chinese metaphysics:
 *   wall clock → UTC → solar time (accounting for longitude + equation of time)
 *
 * The standard meridian is derived from the actual UTC offset at the given
 * moment (which handles DST correctly), NOT from a fixed timezone assumption.
 *
 * @param year - Gregorian year
 * @param month - Month 1-12
 * @param day - Day 1-31
 * @param hour - Hour 0-23
 * @param minute - Minute 0-59
 * @param timezoneId - IANA timezone identifier
 * @param longitude - Observer's longitude in degrees east
 * @returns TrueSolarTimeResult with corrected time and breakdown
 */
export function wallClockToSolarTime(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timezoneId: string,
  longitude: number,
): TrueSolarTimeResult {
  // Step 1: Convert wall clock → UTC
  const utcDate = localToUtc(year, month, day, hour, minute, timezoneId);

  // Step 2: Determine the actual UTC offset at this moment
  // This correctly handles DST — e.g., Shanghai DST gives offset +540 (UTC+9)
  const offsetMinutes = getUtcOffset(year, month, day, hour, minute, timezoneId);
  const standardMeridian = offsetMinutes / 4; // 4 minutes per degree

  // Step 3: Reconstruct a "clock time" Date at the UTC offset for EoT computation
  // The trueSolarTime function expects a local Date, so build one from UTC + offset
  const localMs = utcDate.getTime() + offsetMinutes * 60000;
  const clockTime = new Date(localMs);

  // Step 4: Compute equation of time
  const eot = equationOfTime(clockTime);

  // Step 5: Compute longitude correction
  const longitudeCorrection = (longitude - standardMeridian) * 4; // minutes

  // Step 6: Total correction and true solar time
  const totalCorrection = longitudeCorrection + eot;
  const trueSolarTimeMs = clockTime.getTime() + totalCorrection * 60000;

  return {
    trueSolarTime: new Date(trueSolarTimeMs),
    equationOfTime: eot,
    longitudeCorrection,
    totalCorrection,
  };
}

// ── Internal helpers ────────────────────────────────────────

/**
 * Get timezone offset in milliseconds (local - UTC) for a given UTC instant.
 *
 * Uses the embedded IANA transition table as the primary source for all 78
 * timezones in the stembranch city database (1900-2026). Falls back to
 * Intl.DateTimeFormat only for timezones not in the embedded data.
 */
function getTimezoneOffsetMs(date: Date, timezoneId: string): number {
  // Primary: embedded transition table (deterministic, auditable)
  const utcSeconds = Math.floor(date.getTime() / 1000);
  const embedded = getEmbeddedOffset(utcSeconds, timezoneId);
  if (embedded !== null) {
    return embedded.offsetMinutes * 60000;
  }

  // Fallback: Intl API (for timezones not in embedded data)
  return getIntlTimezoneOffsetMs(date, timezoneId);
}

/**
 * Get timezone offset in milliseconds using the Intl.DateTimeFormat API.
 * Used as a fallback for timezones not in the embedded transition table.
 */
function getIntlTimezoneOffsetMs(date: Date, timezoneId: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezoneId,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => {
    const part = parts.find(p => p.type === type);
    return part ? parseInt(part.value, 10) : 0;
  };

  const localDate = new Date(Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour') === 24 ? 0 : get('hour'),
    get('minute'),
    get('second'),
  ));

  return localDate.getTime() - date.getTime();
}
