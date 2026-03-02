// ── Types ──────────────────────────────────────────────────
export type {
  Stem,
  Branch,
  StemBranch,
  Element,
  ElementRelation,
  Strength,
  Pillar,
  FourPillars,
  HiddenStem,
  DayRelation,
  PunishmentType,
  EarthType,
  LifeStage,
  TenRelation,
  SolarTerm,
  ChineseZodiacAnimal,
  YearBoundary,
  ChineseZodiacResult,
  WesternZodiacSign,
  WesternZodiacResult,
  TrueSolarTimeResult,
  Eclipse,
  EclipseKind,
  SolarEclipseType,
  LunarEclipseType,
} from './types';

// ── 天干 (Heavenly Stems) ──────────────────────────────────
export { STEMS, STEM_ELEMENT, stemPolarity, stemByIndex } from './stems';

// ── 地支 (Earthly Branches) ────────────────────────────────
export { BRANCHES, BRANCH_ELEMENT, branchPolarity, branchByIndex, branchFromHour, branchFromMonth } from './branches';

// ── 五行 (Five Elements) ───────────────────────────────────
export { GENERATIVE_CYCLE, CONQUERING_CYCLE, getElementRelation, ELEMENT_ORDER } from './elements';

// ── 干支 (Sexagenary Cycle) ────────────────────────────────
export { makeStemBranch, stemBranchByCycleIndex, stemBranchCycleIndex, parseStemBranch, allSixtyStemBranch } from './stem-branch';

// ── 地支關係 (Branch Relations) ─────────────────────────────
export {
  HARMONY_PAIRS, CLASH_PAIRS,
  THREE_HARMONIES, SEASONAL_UNIONS, HALF_HARMONIES,
  PUNISHMENT_GROUPS, SELF_PUNISHMENT, HARM_PAIRS, DESTRUCTION_PAIRS,
  isHarmony, isClash,
  isThreeHarmony, getThreeHarmonyElement,
  isSeasonalUnion, getSeasonalUnionElement,
  isPunishment, getPunishmentType, isSelfPunishment,
  isHarm, isDestruction,
  getDayRelation,
} from './branch-relations';

// ── 旺相休囚死 (Element Strength) ───────────────────────────
export { STRENGTH, getStrength } from './element-strength';

// ── 地支藏干 (Hidden Stems) ──────────────────────────────────
export { HIDDEN_STEMS, getHiddenStems } from './hidden-stems';

// ── 長生十二神 (Twelve Life Stages) ─────────────────────────
export { TWELVE_STAGES, getLifeStage } from './twelve-stages';

// ── 十神 (Ten Relations) ────────────────────────────────────
export { TEN_RELATION_NAMES, getTenRelation, getTenRelationForBranch } from './ten-relations';

// ── 濕土燥土 (Earth Types) ──────────────────────────────────
export {
  EARTH_BRANCHES, STORAGE_MAP,
  isWetEarth, isDryEarth, getEarthType, getStorageElement,
} from './earth-types';

// ── 暗合 (Hidden Harmony) ───────────────────────────────────
export { HIDDEN_HARMONY_PAIRS, isHiddenHarmony, getHiddenHarmonyPairs } from './hidden-harmony';

// ── 天干關係 (Stem Relations) ────────────────────────────────
export {
  STEM_COMBINATIONS, STEM_CLASHES,
  isStemCombination, isStemClash, getCombinedElement,
} from './stem-relations';

// ── 納音 (Cycle Elements) ───────────────────────────────────
export { CYCLE_ELEMENTS, getCycleElement, getCycleElementName } from './cycle-elements';

// ── 旬空 (Void Branches) ──────────────────────────────────
export { computeVoidBranches } from './void-branches';

// ── ΔT (DeltaT) ─────────────────────────────────────────────
export { deltaT, deltaTForYear } from './delta-t';

// ── 節氣 (Solar Terms) ─────────────────────────────────────
export {
  SOLAR_TERM_NAMES, SOLAR_TERM_LONGITUDES, MONTH_BOUNDARY_INDICES,
  findSolarTermMoment, getSolarTermsForYear, findSpringStart,
  getMonthBoundaryTerms, getSolarMonthExact,
} from './solar-terms';

// ── 四柱 (Four Pillars) ────────────────────────────────────
export { computeFourPillars } from './four-pillars';

// ── 真太陽時 (True Solar Time) ─────────────────────────────
export { equationOfTime, trueSolarTime } from './true-solar-time';

// ── 生肖 (Chinese Zodiac) ──────────────────────────────────
export {
  ZODIAC_ANIMALS, ZODIAC_ENGLISH,
  animalFromBranch, branchFromAnimal,
  getChineseZodiac, getZodiacBySpringStart, getChineseZodiacLunarNewYear,
} from './chinese-zodiac';

// ── 日月食 (Eclipses) ────────────────────────────────────────
export {
  getAllSolarEclipses, getAllLunarEclipses,
  getEclipsesForYear, getEclipsesInRange,
  findNearestEclipse, isEclipseDate,
  ECLIPSE_DATA_RANGE,
} from './eclipses';

// ── 星座 (Western Zodiac) ──────────────────────────────────
export { getWesternZodiac } from './western-zodiac';

// ── 儒略日 (Julian Day Number) ─────────────────────────────
export { julianDayNumber, jdToCalendarDate, julianCalendarToDate } from './julian-day';
export type { CalendarType } from './julian-day';

// ── 朔日 (New Moon) ────────────────────────────────────────
export { newMoonJDE, findNewMoonsInRange } from './new-moon';

// ── 農曆 (Lunar Calendar) ──────────────────────────────────
export { getLunarMonthsForYear, getLunarNewYear, gregorianToLunar } from './lunar-calendar';
export type { LunarMonth, LunarDate } from './lunar-calendar';

// ── 建除十二神 (Twelve Day Fitness) ──────────────────────────
export {
  DAY_FITNESS_CYCLE, DAY_FITNESS_AUSPICIOUS,
  getDayFitness, getDayFitnessForDate,
} from './day-fitness';
export type { DayFitness } from './day-fitness';

// ── 紫白九星 (Purple-White Nine Stars) ───────────────────────
export {
  FLYING_STARS,
  getYearStar, getMonthStar, getDayStar, getHourStar, getFlyingStars,
} from './flying-stars';
export type { FlyingStar, FlyingStarInfo } from './flying-stars';

// ── 神煞 (Almanac Flags) ────────────────────────────────────
export {
  // Day stem derivations
  getHeavenlyNoble, getSupremeNoble, getLiteraryStar,
  getProsperityStar, getRamBlade, getGoldenCarriage,
  // Branch derivations (三合)
  getTravelingHorse, getPeachBlossom, getCanopy,
  getGeneralStar, getRobberyStar, getDeathSpirit,
  // Branch derivations (other)
  getRedPhoenix, getHeavenlyJoy, getLonelyStar, getWidowStar,
  // Day pillar predicates
  isCommandingStar, isTenEvils, isYinYangError,
  // Calendar predicates
  isHeavensPardon, isMonthBreak, isYearBreak,
  // Aggregate
  getAlmanacFlags, getAlmanacFlagsForPillars,
  // Registry
  ALMANAC_FLAG_REGISTRY,
} from './almanac-flags';
export type { AlmanacCategory, AlmanacFlagInfo, AlmanacFlagResult } from './almanac-flags';

// ── 日曆總覽 (Daily Almanac) ────────────────────────────────
export { dailyAlmanac } from './daily-almanac';
export type { DailyAlmanac } from './daily-almanac';

// ── 大六壬 (Grand Six Ren) ──────────────────────────────────
export {
  STEM_LODGING, HEAVENLY_GENERALS,
  getMonthlyGeneral, buildPlates, buildFourLessons,
  computeSixRen, computeSixRenForDate,
} from './six-ren';
export type {
  HeavenlyGeneral, TransmissionMethod,
  SixRenLesson, SixRenChart,
} from './six-ren';
