/* v8 ignore next */
/**
 * Sidereal Astrology (Jyotish / Vedic Astrology)
 *
 * Indian sidereal system: Lahiri ayanamsa (Chitrapaksha), 27 nakshatras,
 * Vimshottari dasha periods, and divisional charts (D-1, D-9, D-10).
 *
 * The Lahiri ayanamsa is distinct from the Chinese sidereal system
 * (七政四餘) in src/seven-governors/sidereal.ts, which uses a Spica-anchored
 * zero-point. The Lahiri system defines Spica (Chitra) at exactly 0° Libra
 * (180° sidereal), per the Indian Astronomical Ephemeris.
 */

import { dateToJulianCenturies, precessionInLongitude, normalizeDegrees } from './astro';
import type { ZodiacSign } from './tropical-astrology';
import { getZodiacSign } from './tropical-astrology';
import { getSunLongitude } from './solar-longitude';
import { getMoonPosition } from './moon/moon';
import { getPlanetPosition } from './planets/planets';
import type { Planet } from './types';

// ── Types ────────────────────────────────────────────────────────────────

export type Nakshatra =
  | 'Ashwini' | 'Bharani' | 'Krittika' | 'Rohini' | 'Mrigashira' | 'Ardra'
  | 'Punarvasu' | 'Pushya' | 'Ashlesha' | 'Magha' | 'Purva Phalguni' | 'Uttara Phalguni'
  | 'Hasta' | 'Chitra' | 'Swati' | 'Vishakha' | 'Anuradha' | 'Jyeshtha'
  | 'Mula' | 'Purva Ashadha' | 'Uttara Ashadha' | 'Shravana' | 'Dhanishtha' | 'Shatabhisha'
  | 'Purva Bhadrapada' | 'Uttara Bhadrapada' | 'Revati';

export type DashaPlanet = 'Ketu' | 'Venus' | 'Sun' | 'Moon' | 'Mars' | 'Rahu' | 'Jupiter' | 'Saturn' | 'Mercury';

export type DivisionalChartType = 'D1' | 'D9' | 'D10';

export interface NakshatraResult {
  nakshatra: Nakshatra;
  pada: 1 | 2 | 3 | 4;
  index: number;          // 0-26
  lordIndex: number;      // 0-8 in the Vimshottari cycle
}

export interface DashaPeriod {
  planet: DashaPlanet;
  years: number;
  startDate: Date;
  endDate: Date;
}

export interface SiderealPosition {
  body: string;
  tropicalLongitude: number;
  siderealLongitude: number;
  sign: ZodiacSign;
  signDegree: number;
  nakshatra: Nakshatra;
  nakshatraPada: 1 | 2 | 3 | 4;
}

export interface DivisionalChartPosition {
  body: string;
  sign: ZodiacSign;
  signDegree: number;
}

export interface DivisionalChart {
  type: DivisionalChartType;
  positions: DivisionalChartPosition[];
}

export interface SiderealChart {
  ayanamsa: number;
  positions: SiderealPosition[];
  dashas: DashaPeriod[];
  divisionalCharts: DivisionalChart[];
}

// ── Constants ────────────────────────────────────────────────────────────

/**
 * Lahiri ayanamsa at J2000.0 (2000-01-01T12:00:00 TT).
 *
 * The Chitrapaksha ayanamsa places Spica (Chitra) at exactly 180° sidereal.
 * At J2000.0, the published value is approximately 23°51'22.28" = 23.8562°.
 */
const LAHIRI_AT_J2000 = 23.8562;

/** The 27 nakshatras in order from 0° sidereal. */
const NAKSHATRAS: readonly Nakshatra[] = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishtha', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

/**
 * Vimshottari dasha lords in cycle order, with their mahadasha durations.
 * The cycle repeats every 3 nakshatras:
 *   Ashwini/Magha/Mula → Ketu
 *   Bharani/Purva Phalguni/Purva Ashadha → Venus
 *   ...etc.
 */
const DASHA_LORDS: readonly { planet: DashaPlanet; years: number }[] = [
  { planet: 'Ketu',    years: 7  },
  { planet: 'Venus',   years: 20 },
  { planet: 'Sun',     years: 6  },
  { planet: 'Moon',    years: 10 },
  { planet: 'Mars',    years: 7  },
  { planet: 'Rahu',    years: 18 },
  { planet: 'Jupiter', years: 16 },
  { planet: 'Saturn',  years: 19 },
  { planet: 'Mercury', years: 17 },
];

/** Width of one nakshatra in degrees: 360 / 27 = 13°20' */
const NAKSHATRA_WIDTH = 360 / 27;

/** Width of one pada in degrees: 360 / 108 = 3°20' */
const PADA_WIDTH = 360 / 108;

/** The 12 zodiac signs in order. */
const ZODIAC_SIGNS: readonly ZodiacSign[] = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

/** Milliseconds per Julian year (365.25 days). */
const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

/** Traditional Jyotish planets (excludes outer planets Uranus/Neptune/Pluto). */
const JYOTISH_PLANETS: Planet[] = ['mercury', 'venus', 'mars', 'jupiter', 'saturn'];

// ── Lahiri Ayanamsa ──────────────────────────────────────────────────────

/**
 * Compute the Lahiri (Chitrapaksha) ayanamsa for a given date.
 *
 * The ayanamsa is the angular difference between the tropical and sidereal
 * zodiacs. It increases over time due to the precession of the equinoxes.
 *
 * Formula: ayanamsa(T) = LAHIRI_AT_J2000 + precession(T) / 3600
 *
 * where precession(T) is the accumulated precession in longitude (arcseconds)
 * from J2000.0 to epoch T, and LAHIRI_AT_J2000 is the published Lahiri value
 * at J2000.0 (23.8562°).
 *
 * @param date - The date to compute the ayanamsa for
 * @returns Lahiri ayanamsa in degrees
 */
export function getLahiriAyanamsa(date: Date): number {
  const T = dateToJulianCenturies(date);
  const precessionDeg = precessionInLongitude(T) / 3600;
  return LAHIRI_AT_J2000 + precessionDeg;
}

// ── Nakshatra ────────────────────────────────────────────────────────────

/**
 * Determine the nakshatra and pada for a given sidereal longitude.
 *
 * The 27 nakshatras divide the ecliptic into equal segments of 13°20'.
 * Each nakshatra has 4 padas (quarters) of 3°20' each.
 *
 * @param siderealLongitude - Sidereal ecliptic longitude in degrees [0, 360)
 * @returns The nakshatra, pada (1-4), index (0-26), and lord index (0-8)
 */
export function getNakshatra(siderealLongitude: number): NakshatraResult {
  const norm = ((siderealLongitude % 360) + 360) % 360;
  // Add tiny epsilon before flooring to handle exact boundary values correctly.
  // E.g. 13+20/60 in IEEE 754 = 13.333333333333332, dividing by NAKSHATRA_WIDTH
  // gives 0.9999999999999998 instead of 1.0. The epsilon snaps these boundary
  // values to the correct (next) nakshatra/pada without affecting non-boundary values.
  const BOUNDARY_EPS = 1e-10;
  const nakshatraIndex = Math.floor(norm / NAKSHATRA_WIDTH + BOUNDARY_EPS);
  // Guard against floating-point edge case where norm = 360
  /* v8 ignore next */
  const idx = nakshatraIndex >= 27 ? 0 : nakshatraIndex;

  const withinNakshatra = norm - idx * NAKSHATRA_WIDTH;
  const padaIndex = Math.floor(withinNakshatra / PADA_WIDTH + BOUNDARY_EPS);
  const pada = (Math.min(padaIndex, 3) + 1) as 1 | 2 | 3 | 4;

  const lordIndex = idx % 9;

  return {
    nakshatra: NAKSHATRAS[idx],
    pada,
    index: idx,
    lordIndex,
  };
}

// ── Vimshottari Dasha ────────────────────────────────────────────────────

/**
 * Compute the nine Vimshottari mahadasha periods from the Moon's sidereal
 * longitude and the birth date.
 *
 * The Vimshottari dasha system is a 120-year cycle where each of 9 planets
 * rules a period of fixed duration. The Moon's nakshatra at birth determines
 * the starting dasha lord. The Moon's position within that nakshatra
 * determines how much of the first dasha has already elapsed.
 *
 * @param moonSiderealLongitude - Moon's sidereal ecliptic longitude in degrees
 * @param birthDate - Date of birth (start of the dasha cycle)
 * @returns Array of 9 DashaPeriod objects covering the full 120-year cycle
 */
export function computeVimshottariDashas(
  moonSiderealLongitude: number,
  birthDate: Date,
): DashaPeriod[] {
  const nak = getNakshatra(moonSiderealLongitude);

  // How far the Moon is through the current nakshatra (0 to 1)
  const norm = ((moonSiderealLongitude % 360) + 360) % 360;
  const withinNakshatra = norm - nak.index * NAKSHATRA_WIDTH;
  const fractionElapsed = withinNakshatra / NAKSHATRA_WIDTH;

  // The remaining fraction of the first mahadasha
  const remainingFraction = 1 - fractionElapsed;

  const startLordIndex = nak.lordIndex;
  const dashas: DashaPeriod[] = [];
  let currentTime = birthDate.getTime();

  for (let i = 0; i < 9; i++) {
    const lordIdx = (startLordIndex + i) % 9;
    const lord = DASHA_LORDS[lordIdx];

    // First period: only the remaining fraction applies
    const years = i === 0 ? lord.years * remainingFraction : lord.years;
    const durationMs = years * MS_PER_YEAR;

    const startDate = new Date(currentTime);
    const endDate = new Date(currentTime + durationMs);

    dashas.push({
      planet: lord.planet,
      years,
      startDate,
      endDate,
    });

    currentTime += durationMs;
  }

  return dashas;
}

// ── Divisional Charts ────────────────────────────────────────────────────

/** Element of a zodiac sign: fire, earth, air, water. */
function signElement(signIndex: number): 'fire' | 'earth' | 'air' | 'water' {
  const elements = ['fire', 'earth', 'air', 'water'] as const;
  return elements[signIndex % 4];
}

/** Whether a sign index (0-11) is odd (1-based: 1, 3, 5, ... = Aries, Gemini, Leo, ...). */
function isOddSign(signIndex: number): boolean {
  return signIndex % 2 === 0; // 0-indexed: Aries=0 is odd (1st sign)
}

/**
 * Compute the Navamsa (D-9) sign for a given sidereal longitude.
 *
 * Each sign is divided into 9 parts of 3°20'. The starting sign of the
 * navamsa depends on the element of the rasi sign:
 * - Fire signs (Aries, Leo, Sagittarius): start from Aries (index 0)
 * - Earth signs (Taurus, Virgo, Capricorn): start from Capricorn (index 9)
 * - Air signs (Gemini, Libra, Aquarius): start from Libra (index 6)
 * - Water signs (Cancer, Scorpio, Pisces): start from Cancer (index 3)
 */
function computeNavamsaSign(siderealLongitude: number): { sign: ZodiacSign; degree: number } {
  const norm = ((siderealLongitude % 360) + 360) % 360;
  const signIndex = Math.floor(norm / 30);
  /* v8 ignore next */
  const idx = signIndex >= 12 ? 0 : signIndex;
  const degreeInSign = norm - idx * 30;

  // Which navamsa within this sign (0-8)
  const navamsaWidth = 30 / 9; // 3°20'
  const navamsaIndex = Math.floor(degreeInSign / navamsaWidth);
  const navIdx = Math.min(navamsaIndex, 8);

  // Starting sign based on element
  const elem = signElement(idx);
  let startSignIndex: number;
  switch (elem) {
    case 'fire':  startSignIndex = 0; break; // Aries
    case 'earth': startSignIndex = 9; break; // Capricorn
    case 'air':   startSignIndex = 6; break; // Libra
    case 'water': startSignIndex = 3; break; // Cancer
  }

  const resultSignIndex = (startSignIndex + navIdx) % 12;
  const degreeInNavamsa = degreeInSign - navIdx * navamsaWidth;

  return {
    sign: ZODIAC_SIGNS[resultSignIndex],
    degree: degreeInNavamsa,
  };
}

/**
 * Compute the Dasamsa (D-10) sign for a given sidereal longitude.
 *
 * Each sign is divided into 10 parts of 3° each.
 * - For odd signs (Aries, Gemini, Leo, ...): count from the same sign
 * - For even signs (Taurus, Cancer, Virgo, ...): count from the 9th sign from it
 */
function computeDasamsaSign(siderealLongitude: number): { sign: ZodiacSign; degree: number } {
  const norm = ((siderealLongitude % 360) + 360) % 360;
  const signIndex = Math.floor(norm / 30);
  /* v8 ignore next */
  const idx = signIndex >= 12 ? 0 : signIndex;
  const degreeInSign = norm - idx * 30;

  // Which dasamsa within this sign (0-9)
  const dasamsaWidth = 3; // 30 / 10 = 3°
  const dasamsaIndex = Math.floor(degreeInSign / dasamsaWidth);
  const dasIdx = Math.min(dasamsaIndex, 9);

  let startSignIndex: number;
  if (isOddSign(idx)) {
    startSignIndex = idx; // count from same sign
  } else {
    startSignIndex = (idx + 8) % 12; // count from 9th sign (0-indexed: +8)
  }

  const resultSignIndex = (startSignIndex + dasIdx) % 12;
  const degreeInDasamsa = degreeInSign - dasIdx * dasamsaWidth;

  return {
    sign: ZODIAC_SIGNS[resultSignIndex],
    degree: degreeInDasamsa,
  };
}

/**
 * Compute a divisional chart (D-1, D-9, or D-10) from sidereal positions.
 *
 * @param positions - Array of sidereal positions from the natal chart
 * @param type - The divisional chart type: 'D1', 'D9', or 'D10'
 * @returns The divisional chart with recalculated sign placements
 */
export function computeDivisionalChart(
  positions: SiderealPosition[],
  type: DivisionalChartType,
): DivisionalChart {
  const divPositions: DivisionalChartPosition[] = positions.map((pos) => {
    let result: { sign: ZodiacSign; degree: number };

    switch (type) {
      case 'D1': {
        // Rasi chart: same as sidereal position
        result = getZodiacSign(pos.siderealLongitude);
        break;
      }
      case 'D9': {
        result = computeNavamsaSign(pos.siderealLongitude);
        break;
      }
      case 'D10': {
        result = computeDasamsaSign(pos.siderealLongitude);
        break;
      }
    }

    return {
      body: pos.body,
      sign: result.sign,
      signDegree: result.degree,
    };
  });

  return {
    type,
    positions: divPositions,
  };
}

// ── Full Sidereal Chart ──────────────────────────────────────────────────

/**
 * Compute a complete sidereal (Jyotish) chart for a given date and location.
 *
 * Pipeline:
 * 1. Compute Lahiri ayanamsa for the date
 * 2. Get tropical positions for Sun, Moon, and the 5 traditional Jyotish planets
 *    (Mercury, Venus, Mars, Jupiter, Saturn)
 * 3. Subtract ayanamsa to obtain sidereal longitudes
 * 4. Determine nakshatra and pada for each body
 * 5. Compute Vimshottari dashas from the Moon's sidereal longitude
 * 6. Compute D-1, D-9, and D-10 divisional charts
 *
 * @param date - The date/time of the chart (UT)
 * @param lat - Geographic latitude in degrees (not used for planetary positions,
 *              reserved for future house calculation)
 * @param lng - Geographic longitude in degrees (not used for planetary positions,
 *              reserved for future house calculation)
 * @returns Complete sidereal chart with positions, dashas, and divisional charts
 */
export function computeSiderealChart(
  date: Date,
  lat: number,
  lng: number,
): SiderealChart {
  const ayanamsa = getLahiriAyanamsa(date);

  // Collect tropical longitudes for all bodies
  const tropicalBodies: { body: string; longitude: number; latitude: number }[] = [];

  // Sun
  const sunLon = getSunLongitude(date);
  tropicalBodies.push({ body: 'Sun', longitude: sunLon, latitude: 0 });

  // Moon
  const moonPos = getMoonPosition(date);
  tropicalBodies.push({ body: 'Moon', longitude: moonPos.longitude, latitude: moonPos.latitude });

  // Traditional Jyotish planets
  for (const planet of JYOTISH_PLANETS) {
    const pos = getPlanetPosition(planet, date);
    const name = planet.charAt(0).toUpperCase() + planet.slice(1);
    tropicalBodies.push({ body: name, longitude: pos.longitude, latitude: pos.latitude });
  }

  // Also include outer planets for completeness (some modern Jyotish practitioners use them)
  const outerPlanets: Planet[] = ['uranus', 'neptune'];
  for (const planet of outerPlanets) {
    const pos = getPlanetPosition(planet, date);
    const name = planet.charAt(0).toUpperCase() + planet.slice(1);
    tropicalBodies.push({ body: name, longitude: pos.longitude, latitude: pos.latitude });
  }

  // Convert to sidereal positions
  const positions: SiderealPosition[] = tropicalBodies.map((tb) => {
    const siderealLon = normalizeDegrees(tb.longitude - ayanamsa);
    const { sign, degree: signDegree } = getZodiacSign(siderealLon);
    const nak = getNakshatra(siderealLon);

    return {
      body: tb.body,
      tropicalLongitude: tb.longitude,
      siderealLongitude: siderealLon,
      sign,
      signDegree,
      nakshatra: nak.nakshatra,
      nakshatraPada: nak.pada,
    };
  });

  // Vimshottari dashas from Moon's sidereal position
  const moonPosition = positions.find((p) => p.body === 'Moon')!;
  const dashas = computeVimshottariDashas(moonPosition.siderealLongitude, date);

  // Divisional charts
  const d1 = computeDivisionalChart(positions, 'D1');
  const d9 = computeDivisionalChart(positions, 'D9');
  const d10 = computeDivisionalChart(positions, 'D10');

  return {
    ayanamsa,
    positions,
    dashas,
    divisionalCharts: [d1, d9, d10],
  };
}
