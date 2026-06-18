/* v8 ignore next */
/**
 * Traditional 7-level essential dignity system.
 *
 * Implements the complete classical dignity framework:
 * 1. Domicile (rulership) — from existing DIGNITY_TABLE
 * 2. Exaltation — from existing DIGNITY_TABLE
 * 3. Triplicity — Ptolemaic day/night scheme
 * 4. Term (bounds) — Egyptian terms (Ptolemy's version)
 * 5. Face (decan) — Chaldean order
 * 6. Detriment — opposite of domicile
 * 7. Fall — opposite of exaltation
 *
 * Plus: peregrine detection, mutual reception finder.
 */

import type { ZodiacSign } from './tropical-astrology';
import type { ExtendedDignity, ExtendedDignityResult, MutualReception } from './birth-chart-types';
import { SIGN_RULER, SIGN_ELEMENT } from './sign-metadata';

// ── Zodiac sign list (for indexing) ──────────────────────────

const ZODIAC_SIGNS: readonly ZodiacSign[] = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

function signIndex(sign: ZodiacSign): number {
  return ZODIAC_SIGNS.indexOf(sign);
}

// ── Domicile / Exaltation / Detriment / Fall ─────────────────

/** Bodies that have classical dignities (7 traditional planets). */
const TRADITIONAL_BODIES = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];

interface ClassicalDignityEntry {
  rulership: ZodiacSign[];
  exaltation: ZodiacSign;
  detriment: ZodiacSign[];
  fall: ZodiacSign;
}

const CLASSICAL_DIGNITIES: Record<string, ClassicalDignityEntry> = {
  Sun:     { rulership: ['Leo'],               exaltation: 'Aries',     detriment: ['Aquarius'],           fall: 'Libra' },
  Moon:    { rulership: ['Cancer'],            exaltation: 'Taurus',    detriment: ['Capricorn'],          fall: 'Scorpio' },
  Mercury: { rulership: ['Gemini', 'Virgo'],   exaltation: 'Virgo',     detriment: ['Sagittarius', 'Pisces'], fall: 'Pisces' },
  Venus:   { rulership: ['Taurus', 'Libra'],   exaltation: 'Pisces',    detriment: ['Aries', 'Scorpio'],   fall: 'Virgo' },
  Mars:    { rulership: ['Aries', 'Scorpio'],  exaltation: 'Capricorn', detriment: ['Taurus', 'Libra'],    fall: 'Cancer' },
  Jupiter: { rulership: ['Sagittarius', 'Pisces'], exaltation: 'Cancer', detriment: ['Gemini', 'Virgo'],   fall: 'Capricorn' },
  Saturn:  { rulership: ['Capricorn', 'Aquarius'], exaltation: 'Libra', detriment: ['Cancer', 'Leo'],      fall: 'Aries' },
};

// ── Triplicity Rulers (Ptolemaic) ────────────────────────────

type TriplicityElement = 'fire' | 'earth' | 'air' | 'water';

const TRIPLICITY_RULERS: Record<TriplicityElement, { day: string; night: string }> = {
  fire:  { day: 'Sun',    night: 'Jupiter' },
  earth: { day: 'Venus',  night: 'Moon' },
  air:   { day: 'Saturn', night: 'Mercury' },
  water: { day: 'Mars',   night: 'Mars' },
};

/**
 * Get the triplicity ruler for a sign given sect (day/night).
 */
export function getTriplicityRuler(sign: ZodiacSign, isDayChart: boolean): string {
  const element = SIGN_ELEMENT[sign];
  const rulers = TRIPLICITY_RULERS[element];
  return isDayChart ? rulers.day : rulers.night;
}

// ── Egyptian Terms (Bounds) ──────────────────────────────────

/**
 * Egyptian terms per Ptolemy's table.
 * Each sign has 5 terms: [ruler, endDegree] pairs.
 * A planet rules from the previous term's end (or 0) up to but not including endDegree.
 */
const EGYPTIAN_TERMS: Record<ZodiacSign, Array<[string, number]>> = {
  Aries:       [['Jupiter', 6], ['Venus', 12], ['Mercury', 20], ['Mars', 25], ['Saturn', 30]],
  Taurus:      [['Venus', 8], ['Mercury', 14], ['Jupiter', 22], ['Saturn', 27], ['Mars', 30]],
  Gemini:      [['Mercury', 6], ['Jupiter', 12], ['Venus', 17], ['Mars', 24], ['Saturn', 30]],
  Cancer:      [['Mars', 7], ['Venus', 13], ['Mercury', 19], ['Jupiter', 26], ['Saturn', 30]],
  Leo:         [['Jupiter', 6], ['Venus', 11], ['Saturn', 18], ['Mercury', 24], ['Mars', 30]],
  Virgo:       [['Mercury', 7], ['Venus', 17], ['Jupiter', 21], ['Mars', 28], ['Saturn', 30]],
  Libra:       [['Saturn', 6], ['Mercury', 14], ['Jupiter', 21], ['Venus', 28], ['Mars', 30]],
  Scorpio:     [['Mars', 7], ['Venus', 11], ['Mercury', 19], ['Jupiter', 24], ['Saturn', 30]],
  Sagittarius: [['Jupiter', 12], ['Venus', 17], ['Mercury', 21], ['Saturn', 26], ['Mars', 30]],
  Capricorn:   [['Mercury', 7], ['Jupiter', 14], ['Venus', 22], ['Saturn', 26], ['Mars', 30]],
  Aquarius:    [['Mercury', 7], ['Venus', 13], ['Jupiter', 20], ['Mars', 25], ['Saturn', 30]],
  Pisces:      [['Venus', 12], ['Jupiter', 16], ['Mercury', 19], ['Mars', 28], ['Saturn', 30]],
};

/**
 * Get the term (bounds) ruler for a given sign and degree within that sign.
 */
export function getTermRuler(sign: ZodiacSign, degree: number): string {
  const terms = EGYPTIAN_TERMS[sign];
  for (const [ruler, endDeg] of terms) {
    if (degree < endDeg) return ruler;
  /* v8 ignore start -- defensive: degree always falls within a term */
  }
  return terms[terms.length - 1][0];
}
/* v8 ignore stop */

// ── Chaldean Face (Decan) ────────────────────────────────────

/**
 * Chaldean order of face rulers, cycling through the 36 decans.
 * Starting from Aries 1st face: Mars, Sun, Venus, Mercury, Moon, Saturn, Jupiter
 * then repeats.
 */
const CHALDEAN_ORDER = ['Mars', 'Sun', 'Venus', 'Mercury', 'Moon', 'Saturn', 'Jupiter'];

/**
 * Get the face (decan) ruler for a given sign and degree within that sign.
 * Each face spans 10° (0-10, 10-20, 20-30).
 */
export function getFaceRuler(sign: ZodiacSign, degree: number): string {
  const si = signIndex(sign);
  const faceWithinSign = Math.min(Math.floor(degree / 10), 2); // 0, 1, or 2
  const globalFace = si * 3 + faceWithinSign; // 0-35
  return CHALDEAN_ORDER[globalFace % 7];
}

// ── Extended Dignity ─────────────────────────────────────────

/** Dignity scores per Lilly's system. */
const DIGNITY_SCORES: Record<ExtendedDignity, number> = {
  rulership: 5,
  exaltation: 4,
  triplicity: 3,
  term: 2,
  face: 1,
  detriment: -5,
  fall: -4,
};

/**
 * Get all applicable essential dignities for a body in a sign at a specific degree.
 *
 * Returns both the list of dignities and a cumulative score.
 * Only applies to the 7 traditional planets (Sun through Saturn).
 */
export function getExtendedDignity(
  body: string,
  sign: ZodiacSign,
  degree: number,
  isDayChart: boolean,
): ExtendedDignityResult {
  const entry = CLASSICAL_DIGNITIES[body];
  if (!entry) return { dignities: [], score: 0 };

  const dignities: ExtendedDignity[] = [];

  // 1. Domicile
  if (entry.rulership.includes(sign)) {
    dignities.push('rulership');
  }
  // 2. Exaltation
  if (entry.exaltation === sign) {
    dignities.push('exaltation');
  }
  // 3. Triplicity
  if (getTriplicityRuler(sign, isDayChart) === body) {
    dignities.push('triplicity');
  }
  // 4. Term
  if (getTermRuler(sign, degree) === body) {
    dignities.push('term');
  }
  // 5. Face
  if (getFaceRuler(sign, degree) === body) {
    dignities.push('face');
  }
  // 6. Detriment
  if (entry.detriment.includes(sign)) {
    dignities.push('detriment');
  }
  // 7. Fall
  if (entry.fall === sign) {
    dignities.push('fall');
  }

  const score = dignities.reduce((sum, d) => sum + DIGNITY_SCORES[d], 0);
  return { dignities, score };
}

// ── Peregrine ────────────────────────────────────────────────

/**
 * A planet is peregrine if it has no essential dignity at all in its position.
 * This means no domicile, exaltation, triplicity, term, or face.
 * (Detriment and fall don't count as dignity — they are debilities.)
 */
export function isPeregrine(
  body: string,
  sign: ZodiacSign,
  degree: number,
  isDayChart: boolean,
): boolean {
  const entry = CLASSICAL_DIGNITIES[body];
  if (!entry) return false; // non-traditional bodies aren't evaluated

  if (entry.rulership.includes(sign)) return false;
  if (entry.exaltation === sign) return false;
  if (getTriplicityRuler(sign, isDayChart) === body) return false;
  if (getTermRuler(sign, degree) === body) return false;
  if (getFaceRuler(sign, degree) === body) return false;

  return true;
}

// ── Mutual Reception ─────────────────────────────────────────

/**
 * Build a reverse-lookup of sign → which body rules it.
 * Uses traditional rulers only.
 */
function bodyRulingSign(body: string): ZodiacSign[] {
  const entry = CLASSICAL_DIGNITIES[body];
  return entry ? entry.rulership : [];
}

/**
 * Find mutual receptions by domicile among a set of positions.
 * A mutual reception occurs when body A is in body B's sign AND body B is in body A's sign.
 */
export function findMutualReceptions(
  positions: Array<{ body: string; sign: ZodiacSign }>,
): MutualReception[] {
  const receptions: MutualReception[] = [];

  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const a = positions[i];
      const b = positions[j];

      // Check if A is in B's ruling sign AND B is in A's ruling sign
      const bRules = bodyRulingSign(b.body);
      const aRules = bodyRulingSign(a.body);

      if (bRules.includes(a.sign) && aRules.includes(b.sign)) {
        receptions.push({
          body1: a.body,
          body2: b.body,
          type: 'domicile',
        });
      }
    }
  }

  return receptions;
}
