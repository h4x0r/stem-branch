/* v8 ignore next */
/**
 * Classical accidental dignity conditions.
 *
 * Hayz, Halb, Besiegement, Via Combusta, and Joy by House.
 */

// ── Sect classification ──────────────────────────────────────

/** Diurnal planets: Sun, Jupiter, Saturn. */
const DIURNAL_PLANETS = new Set(['Sun', 'Jupiter', 'Saturn']);

/** Nocturnal planets: Moon, Venus, Mars. */
const NOCTURNAL_PLANETS = new Set(['Moon', 'Venus', 'Mars']);

/**
 * Mercury's sect depends on whether it is oriental (diurnal) or
 * occidental (nocturnal) to the Sun.
 */
function getPlanetSect(
  body: string,
  oriental: boolean | null,
): 'diurnal' | 'nocturnal' | null {
  if (DIURNAL_PLANETS.has(body)) return 'diurnal';
  if (NOCTURNAL_PLANETS.has(body)) return 'nocturnal';
  if (body === 'Mercury') {
    if (oriental === true) return 'diurnal';
    if (oriental === false) return 'nocturnal';
  }
  return null; // non-traditional bodies
}

// ── Hayz / Halb ──────────────────────────────────────────────

/**
 * Compute Hayz condition — the strongest accidental sect dignity.
 *
 * Hayz requires ALL THREE conditions:
 * 1. Planet's sect matches the chart sect (diurnal planet in day chart, or vice versa)
 * 2. Planet is in the correct hemisphere (diurnal above horizon in day, nocturnal below in night)
 * 3. Planet is in a sign matching its gender (diurnal → positive/masculine sign, nocturnal → negative/feminine)
 */
export function isHayz(
  body: string,
  isDayChart: boolean,
  aboveHorizon: boolean,
  polarity: 'positive' | 'negative',
  oriental: boolean | null,
): boolean {
  const sect = getPlanetSect(body, oriental);
  if (!sect) return false;

  const chartSect = isDayChart ? 'diurnal' : 'nocturnal';
  if (sect !== chartSect) return false;

  // Hemisphere: diurnal planets want to be above horizon in day,
  // nocturnal planets want to be below horizon at night
  const correctHemisphere = isDayChart ? aboveHorizon : !aboveHorizon;
  if (!correctHemisphere) return false;

  // Sign gender: diurnal → positive (fire/air), nocturnal → negative (earth/water)
  const correctGender = sect === 'diurnal' ? polarity === 'positive' : polarity === 'negative';
  return correctGender;
}

/**
 * Compute Halb condition — partial sect dignity.
 *
 * Halb: planet's sect matches the chart sect, but does NOT fulfill
 * all three Hayz conditions (missing hemisphere or sign gender).
 */
export function isHalb(
  body: string,
  isDayChart: boolean,
  aboveHorizon: boolean,
  polarity: 'positive' | 'negative',
  oriental: boolean | null,
): boolean {
  const sect = getPlanetSect(body, oriental);
  if (!sect) return false;

  const chartSect = isDayChart ? 'diurnal' : 'nocturnal';
  if (sect !== chartSect) return false;

  // If it were full Hayz, return false (Halb is the lesser condition)
  if (isHayz(body, isDayChart, aboveHorizon, polarity, oriental)) return false;

  return true; // sect matches, but not full Hayz
}

// ── Besiegement ──────────────────────────────────────────────

const MALEFICS = new Set(['Mars', 'Saturn']);
const BENEFICS = new Set(['Venus', 'Jupiter']);

/**
 * Check if a body is besieged — enclosed between two malefics (Mars and Saturn)
 * by zodiacal longitude, with no benefic (Venus, Jupiter) intervening.
 *
 * @param bodyLongitude - The body's ecliptic longitude
 * @param allPositions - All chart positions (body + longitude)
 */
export function isBesieged(
  body: string,
  bodyLongitude: number,
  allPositions: Array<{ body: string; longitude: number }>,
): boolean {
  // Besiegement only applies to non-malefic bodies
  if (MALEFICS.has(body)) return false;

  const maleficLongs = allPositions
    .filter(p => MALEFICS.has(p.body))
    .map(p => p.longitude);

  if (maleficLongs.length < 2) return false;

  // Find the nearest malefic before and after (by zodiacal order)
  let nearestBefore: number | null = null;
  let nearestBeforeDist = 360;
  let nearestAfter: number | null = null;
  let nearestAfterDist = 360;

  for (const ml of maleficLongs) {
    // Distance going backward (clockwise) from body to malefic
    let distBefore = (bodyLongitude - ml + 360) % 360;
    /* v8 ignore next */
    if (distBefore === 0) distBefore = 360;
    if (distBefore < nearestBeforeDist) {
      nearestBeforeDist = distBefore;
      nearestBefore = ml;
    }

    // Distance going forward (counterclockwise) from body to malefic
    let distAfter = (ml - bodyLongitude + 360) % 360;
    /* v8 ignore next */
    if (distAfter === 0) distAfter = 360;
    if (distAfter < nearestAfterDist) {
      nearestAfterDist = distAfter;
      nearestAfter = ml;
    }
  }

  /* v8 ignore next */
  if (nearestBefore === null || nearestAfter === null) return false;
  /* v8 ignore next */
  if (nearestBefore === nearestAfter) return false; // same malefic on both sides

  // Check no benefic is between the body and either malefic
  const beneficLongs = allPositions
    .filter(p => BENEFICS.has(p.body))
    .map(p => p.longitude);

  for (const bl of beneficLongs) {
    // Check if benefic falls in the arc from nearestBefore → body
    const arcBefore = (bodyLongitude - nearestBefore + 360) % 360;
    const beneficInBefore = ((bl - nearestBefore + 360) % 360) < arcBefore;

    // Check if benefic falls in the arc from body → nearestAfter
    const arcAfter = (nearestAfter - bodyLongitude + 360) % 360;
    const beneficInAfter = ((bl - bodyLongitude + 360) % 360) < arcAfter;

    if (beneficInBefore || beneficInAfter) return false;
  }

  return true;
}

// ── Via Combusta ─────────────────────────────────────────────

/**
 * Check if the Moon is in the Via Combusta (Libra 15° to Scorpio 15°).
 * This is the "fiery way" — traditionally considered debilitating.
 *
 * Longitude range: 195° to 225°.
 */
export function isViaCombusta(body: string, longitude: number): boolean {
  if (body !== 'Moon') return false;
  return longitude >= 195 && longitude < 225;
}

// ── Joy by House ─────────────────────────────────────────────

/**
 * House of Joy assignments (classical tradition).
 */
const HOUSE_OF_JOY: Record<string, number> = {
  Mercury: 1,
  Moon: 3,
  Venus: 5,
  Mars: 6,
  Sun: 9,
  Jupiter: 11,
  Saturn: 12,
};

/**
 * Check if a planet is in its house of joy.
 */
export function isJoyByHouse(body: string, house: number): boolean {
  return HOUSE_OF_JOY[body] === house;
}
