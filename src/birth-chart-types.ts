/**
 * Types for professional-grade birth chart computation.
 *
 * Covers 300+ data points across Tier 1 (essential) and Tier 2 (important)
 * features found in professional charting software.
 */

import type { ZodiacSign, HouseSystem, HouseCusps } from './tropical-astrology';

// ── Element / Quality / Polarity ─────────────────────────────

export type WesternElement = 'fire' | 'earth' | 'air' | 'water';
export type WesternQuality = 'cardinal' | 'fixed' | 'mutable';

// ── Extended Dignity ─────────────────────────────────────────

export type ExtendedDignity =
  | 'rulership' | 'exaltation' | 'triplicity' | 'term' | 'face'
  | 'detriment' | 'fall';

export interface ExtendedDignityResult {
  dignities: ExtendedDignity[];
  score: number;   // rulership=+5, exaltation=+4, triplicity=+3, term=+2, face=+1, detriment=-5, fall=-4
}

// ── Extended Aspects ─────────────────────────────────────────

export type ExtendedAspectName =
  | 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile'
  | 'semi-sextile' | 'quincunx' | 'semi-square' | 'sesquiquadrate'
  | 'quintile' | 'biquintile';

// ── Per-body enriched position ───────────────────────────────

export interface BirthChartPosition {
  body: string;
  longitude: number;
  latitude: number;
  distance: number;          // AU (km for Moon)
  ra: number;                // right ascension (degrees)
  declination: number;       // declination (degrees)
  speed: number;             // daily motion in longitude (°/day)
  retrograde: boolean;
  stationary: boolean;       // |speed| < threshold
  sign: ZodiacSign;
  signDegree: number;
  house: number;
  dignity: ExtendedDignityResult;
  dignityScore: number;      // sum of all dignity points
  element: WesternElement;
  quality: WesternQuality;
  polarity: 'positive' | 'negative';
  decan: 1 | 2 | 3;
  // Tier 1
  peregrine: boolean;
  dispositor: string;        // body name of sign ruler
  antiscia: number;          // antiscia longitude
  contraAntiscia: number;
  // Tier 2
  outOfBounds: boolean;      // |dec| > obliquity
  combust: boolean;          // within 8°30' of Sun
  cazimi: boolean;           // within 0°17' of Sun
  underBeams: boolean;       // within 17° of Sun
  oriental: boolean | null;  // rises before Sun (null for luminaries)
  azimuth: number;           // horizontal coordinate
  altitude: number;          // horizontal coordinate
  lunarMansion?: { number: number; name: string }; // for Moon only
  sabianSymbol: string;
}

// ── Enhanced aspect ──────────────────────────────────────────

export interface BirthChartAspect {
  body1: string;
  body2: string;
  type: ExtendedAspectName;
  angle: number;
  orb: number;
  applying: boolean;         // true = applying, false = separating
  major: boolean;            // Ptolemaic vs minor
}

// ── Solar proximity ──────────────────────────────────────────

export interface SolarProximityResult {
  combust: boolean;
  cazimi: boolean;
  underBeams: boolean;
  angularDistance: number;
}

// ── Moon phase ───────────────────────────────────────────────

export interface MoonPhaseResult {
  name: string;
  angle: number;
  illumination: number;
}

// ── Planetary hour ───────────────────────────────────────────

export interface PlanetaryHourResult {
  planet: string;
  hourNumber: number;
  isDayHour: boolean;
}

// ── Mutual reception ─────────────────────────────────────────

export interface MutualReception {
  body1: string;
  body2: string;
  type: string;  // e.g. 'domicile'
}

// ── Firdaria ─────────────────────────────────────────────────

export interface FirdariaResult {
  ruler: string;
  subRuler: string;
  startDate: Date;
  endDate: Date;
}

// ── Profection ───────────────────────────────────────────────

export interface ProfectionResult {
  sign: ZodiacSign;
  lord: string;
  house: number;
}

// ── Prenatal syzygy ──────────────────────────────────────────

export interface PrenatalSyzygyResult {
  type: 'new' | 'full';
  date: Date;
  longitude: number;
}

// ── Distributions ────────────────────────────────────────────

export interface Distributions {
  elements: { fire: number; earth: number; air: number; water: number; dominant: WesternElement };
  qualities: { cardinal: number; fixed: number; mutable: number; dominant: WesternQuality };
  polarities: { positive: number; negative: number };
}

export interface Hemispheres {
  north: number;
  south: number;
  east: number;
  west: number;
}

// ── Research / Statistical Extensions ────────────────────────

/** Per-body extended speed data for cosmobiology research. */
export interface ExtendedSpeed {
  latitudeSpeed: number;    // °/day
  distanceSpeed: number;    // AU/day (or km/day for Moon)
  relativeSpeed: number;    // ratio to average (1.0 = average)
  fast: boolean;            // relativeSpeed > 1.0
}

/** Per-body speculum entry for primary direction research. */
export interface SpeculumEntry {
  ad: number;               // ascensional difference (°)
  oa: number;               // oblique ascension (°)
  od: number;               // oblique descension (°)
  md: number;               // meridian distance (°)
  dsa: number;              // diurnal semi-arc (°)
  nsa: number;              // nocturnal semi-arc (°)
  sa: number;               // active semi-arc (diurnal or nocturnal)
  umd: number;              // upper meridian distance (°)
  hd: number;               // horizon distance (°)
  temporalHour: number;     // proportional hour size (°)
  pole: number;             // Regiomontanus pole (°)
}

/** Per-body research extensions. */
export interface ResearchPosition {
  body: string;
  extendedSpeed: ExtendedSpeed;
  speculum: SpeculumEntry;
  dialPosition90: number;   // longitude % 90
  gauquelinSector: number;  // 1-36
  gauquelinPlusZone: boolean;
  accidentalDignityScore: number;
  // Classical accidental conditions
  hayz: boolean;            // sect + hemisphere + sign gender all match
  halb: boolean;            // sect matches but not full hayz
  besieged: boolean;        // between two malefics with no benefic intervening
  viaCombusta: boolean;     // Moon in Libra 15° – Scorpio 15°
  joyByHouse: boolean;      // planet in its house of joy
}

/** Midpoint between two bodies. */
export interface MidpointEntry {
  body1: string;
  body2: string;
  longitude: number;        // midpoint longitude [0, 360)
  dial90: number;           // longitude % 90
  sign: string;
  signDegree: number;
}

/** Body at another pair's midpoint (within orb). */
export interface MidpointStructure {
  body: string;             // planet at the midpoint
  body1: string;            // first body of the pair
  body2: string;            // second body of the pair
  orb: number;              // how close (°)
}

/** Chart-level research data. */
export interface ResearchData {
  positions: ResearchPosition[];
  midpoints: MidpointEntry[];
  midpointStructures: MidpointStructure[];
  partileAspects: BirthChartAspect[];
  almutenFiguris: string | null;
}

// ── Chart-level data ─────────────────────────────────────────

export interface BirthChartOptions {
  houseSystem?: HouseSystem;
  queryDate?: Date;   // for time-lord calculations (default: birthDate)
  research?: boolean; // enable research/statistical extensions
}

export interface BirthChartData {
  positions: BirthChartPosition[];
  houses: HouseCusps;
  aspects: BirthChartAspect[];
  parallels: BirthChartAspect[];    // declination-based
  angles: {
    asc: number;
    dsc: number;
    mc: number;
    ic: number;
    vertex: number;
    equatorialAscendant: number;
  };
  // Distributions
  distributions: Distributions;
  hemispheres: Hemispheres;
  chartPattern: string;      // Jones classification
  // Sect & classical
  isDayChart: boolean;
  moonPhase: MoonPhaseResult;
  dispositorChain: Record<string, string>;
  finalDispositor: string | null;
  mutualReceptions: MutualReception[];
  // Fixed stars
  fixedStarConjunctions: Array<{ star: string; body: string; orb: number }>;
  // Planetary hours
  planetaryHour: PlanetaryHourResult;
  planetaryDay: string;
  // Tier 2 classical
  voidOfCourseMoon: boolean;
  prenatalSyzygy: PrenatalSyzygyResult;
  profection: ProfectionResult;
  firdaria: FirdariaResult;
  hyleg: string | null;
  alcochoden: string | null;
  lunarMansion: { number: number; name: string };
  // Settings
  settings: { houseSystem: HouseSystem; zodiac: 'tropical' };
  // Research / statistical extensions (present when --research flag is used)
  research?: ResearchData;
}
