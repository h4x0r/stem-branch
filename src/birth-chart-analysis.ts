/* v8 ignore next */
/**
 * Birth chart analysis utilities.
 *
 * Provides dispositor chains, antiscia, distributions, hemispheres,
 * chart pattern detection, moon phase, planetary hours, solar proximity,
 * orientality, out-of-bounds, and void-of-course Moon checks.
 */

import { SIGN_RULER } from './sign-metadata';
import type { ZodiacSign } from './tropical-astrology';
import type {
  WesternElement,
  WesternQuality,
  Distributions,
  Hemispheres,
  MoonPhaseResult,
  PlanetaryHourResult,
  SolarProximityResult,
} from './birth-chart-types';
import { normalizeDegrees, DEG_TO_RAD } from './astro';

// ── Chaldean order (planetary hours cycle) ───────────────────

const CHALDEAN_ORDER = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'];

// Day ruler: Sunday=Sun(index 3), Monday=Moon(6), Tuesday=Mars(2), etc.
const DAY_RULERS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

// ── Day chart ────────────────────────────────────────────────

export function isDayChart(sunHouse: number): boolean {
  return sunHouse >= 7 && sunHouse <= 12;
}

// ── Dispositor chain ─────────────────────────────────────────

export function computeDispositorChain(
  positions: Array<{ body: string; sign: ZodiacSign }>,
): Record<string, string> {
  const chain: Record<string, string> = {};
  for (const { body, sign } of positions) {
    chain[body] = SIGN_RULER[sign];
  }
  return chain;
}

export function findFinalDispositor(chain: Record<string, string>): string | null {
  // A final dispositor disposes itself (rules its own sign)
  for (const [body, ruler] of Object.entries(chain)) {
    if (body === ruler) return body;
  }
  return null;
}

// ── Antiscia / Contra-antiscia ───────────────────────────────

export function computeAntiscia(longitude: number): number {
  return normalizeDegrees(180 - longitude);
}

export function computeContraAntiscia(longitude: number): number {
  return normalizeDegrees(360 - longitude);
}

// ── Distributions ────────────────────────────────────────────

export function computeDistributions(
  positions: Array<{
    body: string;
    element: WesternElement;
    quality: WesternQuality;
    polarity: 'positive' | 'negative';
  }>,
): Distributions {
  const elements = { fire: 0, earth: 0, air: 0, water: 0 };
  const qualities = { cardinal: 0, fixed: 0, mutable: 0 };
  const polarities = { positive: 0, negative: 0 };

  for (const { element, quality, polarity } of positions) {
    elements[element]++;
    qualities[quality]++;
    polarities[polarity]++;
  }

  const dominantElement = (Object.entries(elements) as [WesternElement, number][])
    .sort((a, b) => b[1] - a[1])[0][0];
  const dominantQuality = (Object.entries(qualities) as [WesternQuality, number][])
    .sort((a, b) => b[1] - a[1])[0][0];

  return {
    elements: { ...elements, dominant: dominantElement },
    qualities: { ...qualities, dominant: dominantQuality },
    polarities,
  };
}

// ── Hemispheres ──────────────────────────────────────────────

export function computeHemispheres(positions: Array<{ house: number }>): Hemispheres {
  let north = 0, south = 0, east = 0, west = 0;
  const eastHouses = new Set([10, 11, 12, 1, 2, 3]);

  for (const { house } of positions) {
    if (house >= 1 && house <= 6) north++;
    else south++;
    if (eastHouses.has(house)) east++;
    else west++;
  }

  return { north, south, east, west };
}

// ── Chart pattern detection (Jones classification) ───────────

export function detectChartPattern(longitudes: number[]): string {
  if (longitudes.length === 0) return 'Splay';

  const sorted = longitudes.map(l => normalizeDegrees(l)).sort((a, b) => a - b);
  const n = sorted.length;

  // Compute gaps between consecutive planets (circular)
  const gaps: number[] = [];
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    const gap = normalizeDegrees(sorted[next] - sorted[i]);
    gaps.push(gap);
  }

  const maxGap = Math.max(...gaps);
  const span = 360 - maxGap; // occupied arc

  // Count occupied signs
  const signs = new Set(sorted.map(l => Math.floor(l / 30)));

  // Bundle: all within 120°
  if (span <= 120) return 'Bundle';

  // Bowl: all within 180°
  if (span <= 180) return 'Bowl';

  // Bucket: span > 180° but removing 1 planet makes the rest fit in 180°
  if (span > 180 && span <= 270) {
    for (let i = 0; i < n; i++) {
      const remaining = sorted.filter((_, j) => j !== i);
      const rGaps: number[] = [];
      for (let j = 0; j < remaining.length; j++) {
        const next = (j + 1) % remaining.length;
        rGaps.push(normalizeDegrees(remaining[next] - remaining[j]));
      }
      const rMaxGap = Math.max(...rGaps);
      const rSpan = 360 - rMaxGap;
      if (rSpan <= 180) return 'Bucket';
    }
  }

  // Locomotive: all within 240° (gap > 60° but < 180°)
  if (maxGap >= 60 && maxGap <= 180 && span <= 240) {
    return 'Locomotive';
  }

  // See-Saw: two groups separated by empty areas
  // Count gaps > 60°; if exactly 2, it's a See-Saw
  const largeGaps = gaps.filter(g => g >= 60);
  if (largeGaps.length === 2) return 'See-Saw';

  // Splash: bodies across 7+ signs
  if (signs.size >= 7) return 'Splash';

  // Default: Splay (irregular clusters)
  return 'Splay';
}

// ── Moon phase ───────────────────────────────────────────────

export function computeMoonPhase(sunLon: number, moonLon: number): MoonPhaseResult {
  const elongation = normalizeDegrees(moonLon - sunLon);
  const elongRad = elongation * DEG_TO_RAD;
  const illumination = (1 - Math.cos(elongRad)) / 2;

  let name: string;
  if (elongation < 45) name = 'New Moon';
  else if (elongation < 90) name = 'Crescent';
  else if (elongation < 135) name = 'First Quarter';
  else if (elongation < 180) name = 'Gibbous';
  else if (elongation < 225) name = 'Full Moon';
  else if (elongation < 270) name = 'Disseminating';
  else if (elongation < 315) name = 'Last Quarter';
  else name = 'Balsamic';

  return { name, angle: elongation, illumination };
}

// ── Planetary hour ───────────────────────────────────────────

export function computePlanetaryHour(date: Date, lat: number, lng: number): PlanetaryHourResult {
  // Approximate sunrise/sunset using simplified solar calculation
  const dayOfYear = getDayOfYear(date);
  const declination = 23.44 * Math.sin(((dayOfYear - 81) * 360 / 365) * DEG_TO_RAD);

  const latRad = lat * DEG_TO_RAD;
  const decRad = declination * DEG_TO_RAD;

  // Hour angle at sunrise/sunset
  let cosHA = -Math.tan(latRad) * Math.tan(decRad);
  cosHA = Math.max(-1, Math.min(1, cosHA)); // clamp for polar regions
  const haRad = Math.acos(cosHA);
  const haDeg = haRad / DEG_TO_RAD;

  // Sunrise and sunset in hours (UTC)
  const solarNoon = 12 - lng / 15; // approximate solar noon in UTC hours
  const sunriseH = solarNoon - haDeg / 15;
  const sunsetH = solarNoon + haDeg / 15;

  const dayLength = sunsetH - sunriseH; // hours of daylight
  const nightLength = 24 - dayLength;

  // Current time in fractional hours (UTC)
  const currentH = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;

  // Determine if day or night and which planetary hour
  let hourNumber: number;
  let isDayHour: boolean;

  if (currentH >= sunriseH && currentH < sunsetH) {
    // Daytime
    isDayHour = true;
    const dayHourLength = dayLength / 12;
    hourNumber = Math.floor((currentH - sunriseH) / dayHourLength) + 1;
    hourNumber = Math.min(hourNumber, 12);
  } else {
    // Nighttime
    isDayHour = false;
    let nightElapsed: number;
    if (currentH >= sunsetH) {
      nightElapsed = currentH - sunsetH;
    /* v8 ignore next 3 */
    } else {
      nightElapsed = (24 - sunsetH) + currentH;
    }
    const nightHourLength = nightLength / 12;
    hourNumber = Math.floor(nightElapsed / nightHourLength) + 13;
    hourNumber = Math.min(hourNumber, 24);
  }

  // Planetary hour ruler: start from day ruler, cycle through Chaldean order
  const dayRuler = getPlanetaryDay(date);
  const startIdx = CHALDEAN_ORDER.indexOf(dayRuler);
  const planet = CHALDEAN_ORDER[(startIdx + (hourNumber - 1)) % 7];

  return { planet, hourNumber, isDayHour };
}

export function getPlanetaryDay(date: Date): string {
  const day = date.getUTCDay(); // 0=Sunday
  return DAY_RULERS[day];
}

// ── Solar proximity ──────────────────────────────────────────

export function computeSolarProximity(bodyLon: number, sunLon: number): SolarProximityResult {
  const diff = normalizeDegrees(bodyLon - sunLon);
  const angularDistance = Math.min(diff, 360 - diff);
  const cazimi = angularDistance < 0.2833; // 17 arcminutes
  const combust = angularDistance < 8.5;
  const underBeams = !combust && angularDistance < 17;

  return { combust, cazimi, underBeams, angularDistance };
}

// ── Orientality ──────────────────────────────────────────────

export function isOriental(bodyLon: number, sunLon: number): boolean | null {
  const diff = normalizeDegrees(sunLon - bodyLon);
  // If the Sun is 0-180° ahead of the body (going forward in zodiac),
  // the body rises before the Sun → oriental
  if (diff === 0 || diff === 180) return null; // conjunct or opposite
  return diff > 0 && diff < 180;
}

// ── Out of bounds ────────────────────────────────────────────

export function isOutOfBounds(declination: number, obliquity: number): boolean {
  return Math.abs(declination) > obliquity;
}

// ── Void of course Moon ──────────────────────────────────────

export function isVoidOfCourseMoon(
  moonLon: number,
  moonSpeed: number,
  moonSign: ZodiacSign,
  otherPositions: Array<{ longitude: number }>,
  aspectAngles: number[],
): boolean {
  if (moonSpeed <= 0) return true; // retrograde Moon is unusual but treat as VoC

  // Find the sign boundary the Moon is approaching
  const signIndex = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
  ].indexOf(moonSign);
  const signEnd = (signIndex + 1) * 30; // next sign boundary

  // Check if Moon forms any applying aspect before leaving the sign
  for (const { longitude: otherLon } of otherPositions) {
    for (const angle of aspectAngles) {
      // Two possible aspect points
      const aspectPoint1 = normalizeDegrees(otherLon - angle);
      const aspectPoint2 = normalizeDegrees(otherLon + angle);

      for (const aspectPoint of [aspectPoint1, aspectPoint2]) {
        // Is this aspect point ahead of the Moon and before the sign boundary?
        if (isAspectApplying(moonLon, aspectPoint, signEnd)) {
          return false;
        }
      }
    }
  }

  return true;
}

function isAspectApplying(moonLon: number, aspectPoint: number, signEnd: number): boolean {
  // The aspect point must be between current Moon position and sign boundary
  // All in the forward direction of zodiac
  const moonToAspect = normalizeDegrees(aspectPoint - moonLon);
  const moonToEnd = normalizeDegrees(signEnd - moonLon);

  // Aspect must be ahead of Moon (applying) and before sign change
  return moonToAspect > 0 && moonToAspect <= moonToEnd;
}

// ── Helpers ──────────────────────────────────────────────────

function getDayOfYear(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  const diff = date.getTime() - start;
  return Math.floor(diff / 86400000) + 1;
}
