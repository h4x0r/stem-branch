# stembranch

Astronomical Chinese calendar and 四柱八字 computation for TypeScript. Solar terms, lunar calendar, stem-branch cycles, and divination metadata — all from first principles.

[![npm](https://img.shields.io/npm/v/stembranch)](https://www.npmjs.com/package/stembranch)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue)](https://www.typescriptlang.org/)

```typescript
import { computeFourPillars } from 'stembranch';

const pillars = computeFourPillars(new Date(2024, 1, 10, 14, 30));
// → { year: {stem: '甲', branch: '辰'},
//     month: {stem: '丙', branch: '寅'},
//     day:   {stem: '壬', branch: '午'},
//     hour:  {stem: '丁', branch: '未'} }
```

## Install

```bash
npm install stembranch
```

Zero production dependencies. Self-contained VSOP87D (2,425 terms) and Meeus Ch. 49 new moon algorithms with sub-second solar term precision and full lunar calendar computation.

## Quickstart

### Four Pillars (四柱八字)

```typescript
import { computeFourPillars } from 'stembranch';

const pillars = computeFourPillars(new Date(2024, 1, 10, 14, 30));
```

### Solar Terms (節氣)

```typescript
import { getSolarTermsForYear, findSpringStart } from 'stembranch';

const terms = getSolarTermsForYear(2024);
// → 24 SolarTerm objects with exact UTC moments

const springStart = findSpringStart(2024);
// → 2024-02-04T00:27:... UTC (立春, solar longitude 315°)
```

### Lunar Calendar (農曆)

```typescript
import { getLunarNewYear, gregorianToLunar, getLunarMonthsForYear } from 'stembranch';

// Compute Lunar New Year from first principles (no lookup table)
const lny = getLunarNewYear(2024);
// → 2024-02-10 (Beijing midnight, expressed as UTC)

// Convert a Gregorian date to a lunar date
const lunar = gregorianToLunar(new Date(2024, 1, 10));
// → { year: 2024, month: 1, day: 1, isLeapMonth: false }

// Get all lunar months for a year (12 or 13 months)
const months = getLunarMonthsForYear(2023);
// → 13 months (contains 閏二月)
```

### Chinese Zodiac (生肖)

```typescript
import { getChineseZodiac } from 'stembranch';

// 立春派 (default): year changes at 立春, used in 四柱八字
const a = getChineseZodiac(new Date(2024, 1, 10));
// → { animal: '龍', branch: '辰', yearBoundary: 'spring-start', effectiveYear: 2024 }

// 初一派: year changes at Lunar New Year, used in popular culture
const b = getChineseZodiac(new Date(2024, 1, 10), 'lunar-new-year');
```

### Ten Relations (十神)

```typescript
import { getTenRelation, getTenRelationForBranch } from 'stembranch';

getTenRelation('甲', '庚');      // → '七殺'
getTenRelationForBranch('甲', '子'); // → '正印'
```

### Almanac Flags (神煞)

```typescript
import { getAlmanacFlags, getHeavenlyNoble, getTravelingHorse } from 'stembranch';

// All active flags for a date
const flags = getAlmanacFlags(new Date(2024, 5, 15));
// → [{ name: '天乙貴人', english: 'Heavenly Noble', auspicious: true, ... }, ...]

// Individual derivations
getHeavenlyNoble('甲');    // → ['丑', '未']
getTravelingHorse('寅');   // → '申'
```

### Six Ren Divination (大六壬)

```typescript
import { computeSixRenForDate } from 'stembranch';

const chart = computeSixRenForDate(new Date(2024, 5, 15, 14));
// → { plates, lessons, transmissions, method: '賊剋', generals, ... }
```

### Daily Almanac (日曆總覽)

One call, everything at once — four pillars, lunar date, solar terms, zodiac, day fitness, flying stars, almanac flags, Six Ren chart, eclipses, and element analysis:

```typescript
import { dailyAlmanac } from 'stembranch';

const almanac = dailyAlmanac(new Date(2024, 5, 15, 14, 30));
// almanac.pillars     → { year: {stem:'甲', branch:'辰'}, month: ..., day: ..., hour: ... }
// almanac.lunar       → { year: 2024, month: 5, day: 10, isLeapMonth: false }
// almanac.dayFitness  → { fitness: '成', auspicious: true }
// almanac.flyingStars → { year: {...}, month: {...}, day: {...}, hour: {...} }
// almanac.almanacFlags → [{ name: '天乙貴人', english: 'Heavenly Noble', ... }, ...]
// almanac.sixRen      → { method: '賊剋', lessons: [...], transmissions: {...}, ... }
// almanac.dayElement   → '水'
// almanac.dayStrength  → '死'
```

## Design Decisions

### Year boundary: 立春 (Start of Spring), not January 1

The 干支 year starts at 立春, the moment the sun reaches ecliptic longitude 315°. This falls around February 3-5 each year. A person born on January 20, 2024 belongs to the 癸卯 year (2023's stem-branch), not 甲辰 (2024's).

The library computes the exact 立春 moment using full VSOP87D planetary theory (2,425 terms) with DE405 correction and sxwnl-derived DeltaT.

### 子時 (Midnight Hour) crosses calendar days

子時 runs from 23:00 to 00:59, crossing the calendar midnight boundary. At 23:00+, the hour branch is 子 and the hour stem uses the *next* day's stem for the 甲己還加甲 rule. The day pillar itself does not advance until 00:00.

### 小寒 (Minor Cold) starts 丑月

The 12 month boundaries are defined by 節 (Jie) solar terms. 小寒 (~January 6) starts 丑月, and 立春 (~February 4) starts 寅月. Dates between 小寒 and 立春 belong to 丑月 of the *previous* stem-branch year.

## Accuracy

### Cross-validation against 寿星万年历 (sxwnl)

Validated against [sxwnl](https://github.com/sxwnl/sxwnl), the gold standard Chinese calendar library by 許劍偉:

| Test | Samples | Range | Result |
|---|---|---|---|
| Day Pillar (日柱) | 5,683 dates | 1583-2500 | **100%** match |
| Year Pillar (年柱) | 2,412 dates | 1900-2100 | **100%** match |
| Month Pillar (月柱) | 2,412 dates | 1900-2100 | **100%** match |
| Solar Terms (節氣) | 4,824 terms | 1900-2100 | avg **0.6s** deviation |
| Lunar New Year (農曆) | 61 dates | 1990-2050 | **100%** match |
| Intercalary Months (閏月) | 10 years | 2001-2025 | **100%** match |

Lunar calendar validated against Hong Kong Observatory / USNO data, including correct handling of the 二〇三三年問題 (2033 problem).

Solar term timing detail:

| Percentile | Deviation |
|---|---|
| P50 | 0.5 seconds |
| P95 | 1.4 seconds |
| P99 | 2.0 seconds |
| Max | 3.1 seconds |
| Within 1 min | 100% |

Full analysis with statistical charts: [docs/accuracy.md](docs/accuracy.md)

### Data sources

| Component | Source | Method |
|---|---|---|
| Solar longitude | VSOP87D | Full 2,425-term planetary theory + DE405 correction |
| New moon | Meeus Ch. 49 | 25 periodic + 14 planetary correction terms |
| Lunar calendar | Computed | 冬至-anchor algorithm with zhongqi month numbering |
| Julian Day | Meeus Ch. 7 | Julian/Gregorian calendar conversion |
| DeltaT (ΔT) | Espenak & Meeus + sxwnl | Polynomial (pre-2016), sxwnl cubic table (2016-2050), parabolic extrapolation (2050+) |
| Nutation | IAU2000B | 77-term lunisolar nutation series |
| Equation of Time | Spencer 1971 Fourier | Accurate to ~30 seconds |
| Eclipse dates | NASA Five Millennium Canon | 23,962 eclipses (-1999 to 3000 CE) |
| Day pillar | Arithmetic | Epoch: 2000-01-07 = 甲子日 |
| Stem/branch cycles | Lookup tables | Standard 10-stem, 12-branch sequences |

## API Reference

### Daily Almanac (日曆總覽)

| Export | Description |
|---|---|
| `dailyAlmanac(date)` | Complete almanac: pillars, lunar date, solar terms, zodiac, day fitness, flying stars, almanac flags, Six Ren, eclipses, element analysis |

### Four Pillars (四柱)

| Export | Description |
|---|---|
| `computeFourPillars(date)` | Compute year, month, day, and hour pillars |

### Solar Terms (節氣)

| Export | Description |
|---|---|
| `SOLAR_TERM_NAMES` | 24 term names (小寒 through 冬至) |
| `SOLAR_TERM_LONGITUDES` | Ecliptic longitudes (285° through 270°) |
| `findSolarTermMoment(longitude, year, startMonth?)` | Exact UTC moment for a solar longitude |
| `getSolarTermsForYear(year)` | All 24 terms with exact dates |
| `findSpringStart(year)` | Exact moment of 立春 |
| `getSolarMonthExact(date)` | Which solar month a date falls in |

### Lunar Calendar (農曆)

| Export | Description |
|---|---|
| `getLunarMonthsForYear(lunarYear)` | All lunar months for a year (12 or 13) |
| `getLunarNewYear(gregorianYear)` | Lunar New Year date (正月初一) |
| `gregorianToLunar(date)` | Convert Gregorian date to lunar date |

### Chinese Zodiac (生肖)

| Export | Description |
|---|---|
| `ZODIAC_ANIMALS` | `['鼠','牛','虎','兔','龍','蛇','馬','羊','猴','雞','狗','豬']` |
| `ZODIAC_ENGLISH` | `Record<ChineseZodiacAnimal, string>` (鼠→Rat, etc.) |
| `getChineseZodiac(date, boundary?)` | Zodiac with configurable year boundary (立春 or 初一) |

### True Solar Time (真太陽時)

| Export | Description |
|---|---|
| `equationOfTime(date)` | EoT in minutes (Spencer 1971) |
| `trueSolarTime(clockTime, longitude, standardMeridian?)` | Corrected solar time with breakdown |

### Western Zodiac (星座)

| Export | Description |
|---|---|
| `getWesternZodiac(date)` | Sign, symbol, Chinese name, Western element |

### Stems and Branches (干支)

| Export | Description |
|---|---|
| `STEMS` | `['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']` |
| `BRANCHES` | `['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']` |
| `STEM_ELEMENT` | `Record<Stem, Element>` (甲乙=木, 丙丁=火, ...) |
| `BRANCH_ELEMENT` | `Record<Branch, Element>` |
| `stemByIndex(n)` | Get stem by index (mod 10) |
| `branchByIndex(n)` | Get branch by index (mod 12) |
| `stemPolarity(stem)` | `'陽'` or `'陰'` |
| `branchPolarity(branch)` | `'陽'` or `'陰'` |

### Sexagenary Cycle (六十甲子)

| Export | Description |
|---|---|
| `makeStemBranch(stem, branch)` | Build a `StemBranch` string |
| `stemBranchByCycleIndex(n)` | Get pair at position n in the 60-cycle |
| `stemBranchCycleIndex(stem, branch)` | Reverse lookup (returns -1 for invalid parity) |
| `parseStemBranch(str)` | Parse two-character string into stem + branch |
| `allSixtyStemBranch()` | All 60 valid pairs in cycle order |

### Five Elements (五行)

| Export | Description |
|---|---|
| `GENERATIVE_CYCLE` | 金→水→木→火→土→金 |
| `CONQUERING_CYCLE` | 金→木→土→水→火→金 |
| `ELEMENT_ORDER` | `['金','木','水','火','土']` |
| `getElementRelation(from, to)` | Returns `'生'`, `'剋'`, `'被生'`, `'被剋'`, or `'比和'` |

### Hidden Stems (地支藏干)

| Export | Description |
|---|---|
| `HIDDEN_STEMS` | `Record<Branch, HiddenStem[]>` — main, middle, residual stems |
| `getHiddenStems(branch)` | Hidden stems for a branch (main stem first) |

### Stem Relations (天干五合/相衝)

| Export | Description |
|---|---|
| `STEM_COMBINATIONS` | Five stem combinations with transformed elements |
| `STEM_CLASHES` | Four stem clash pairs |
| `isStemCombination(a, b)` | Check if two stems form a 五合 |
| `isStemClash(a, b)` | Check if two stems clash |
| `getCombinedElement(a, b)` | Transformed element of a combination, or null |

### Branch Relations (地支六合/六衝/三合/刑/害/破)

| Export | Description |
|---|---|
| `HARMONY_PAIRS` | 六合: 子丑, 寅亥, 卯戌, 辰酉, 巳申, 午未 |
| `CLASH_PAIRS` | 六衝: 子午, 丑未, 寅申, 卯酉, 辰戌, 巳亥 |
| `THREE_HARMONIES` | 三合: 申子辰水, 寅午戌火, 巳酉丑金, 亥卯未木 |
| `SEASONAL_UNIONS` | 三會: 寅卯辰木, 巳午未火, 申酉戌金, 亥子丑水 |
| `HALF_HARMONIES` | 半合: pairs from three-harmony groups |
| `PUNISHMENT_GROUPS` | 刑: 寅巳申無恩, 丑戌未恃勢, 子卯無禮 |
| `SELF_PUNISHMENT` | 自刑: 辰午酉亥 |
| `HARM_PAIRS` | 六害: 子未, 丑午, 寅巳, 卯辰, 申亥, 酉戌 |
| `DESTRUCTION_PAIRS` | 六破: 子酉, 丑辰, 寅亥, 卯午, 巳申, 未戌 |
| `isThreeHarmony(a, b, c)` | Check three-harmony group |
| `isPunishment(a, b)` | Check punishment relationship |
| `isSelfPunishment(branch)` | Check self-punishment |
| `isHarm(a, b)` | Check harm pair |
| `isDestruction(a, b)` | Check destruction pair |

### Hidden Harmony (暗合)

| Export | Description |
|---|---|
| `HIDDEN_HARMONY_PAIRS` | Pre-computed pairs where main hidden stems form 五合 |
| `isHiddenHarmony(a, b)` | Check if two branches have 暗合 |

### Earth Types (濕土/燥土)

| Export | Description |
|---|---|
| `EARTH_BRANCHES` | `['辰','丑','戌','未']` |
| `isWetEarth(branch)` | 辰丑 are wet earth |
| `isDryEarth(branch)` | 戌未 are dry earth |
| `getStorageElement(branch)` | 庫/墓: 辰→水, 戌→火, 丑→金, 未→木 |

### Ten Relations (十神)

| Export | Description |
|---|---|
| `TEN_RELATION_NAMES` | All 10 relation names |
| `getTenRelation(dayStem, otherStem)` | Derive the ten-relation |
| `getTenRelationForBranch(dayStem, branch)` | Ten-relation using main hidden stem |

### Twelve Life Stages (長生十二神)

| Export | Description |
|---|---|
| `TWELVE_STAGES` | `['長生','沐浴','冠帶','臨官','帝旺','衰','病','死','墓','絕','胎','養']` |
| `getLifeStage(stem, branch)` | Life stage of a stem at a branch |

### Element Strength (旺相休囚死)

| Export | Description |
|---|---|
| `STRENGTH` | `Record<Strength, string>` mapping to moon phase emojis |
| `getStrength(element, monthBranch)` | Seasonal strength: 旺, 相, 休, 囚, or 死 |

### Cycle Elements (納音)

| Export | Description |
|---|---|
| `CYCLE_ELEMENTS` | Full 60-pair lookup table with element and poetic name |
| `getCycleElement(sb)` | 納音 element for a stem-branch pair |
| `getCycleElementName(sb)` | 納音 poetic name (e.g. 海中金, 爐中火) |

### Void Branches (旬空)

| Export | Description |
|---|---|
| `computeVoidBranches(dayStem, dayBranch)` | Two void branches for the current decade |

### Day Fitness (建除十二神)

| Export | Description |
|---|---|
| `DAY_FITNESS_CYCLE` | `['建','除','滿','平','定','執','破','危','成','收','開','閉']` |
| `DAY_FITNESS_AUSPICIOUS` | Auspicious/inauspicious classification per fitness value |
| `getDayFitness(dayBranch, monthBranch)` | Fitness value from day and month branches |
| `getDayFitnessForDate(date)` | Fitness and auspicious flag for a date |

### Flying Stars (紫白九星)

| Export | Description |
|---|---|
| `FLYING_STARS` | Nine stars: 一白 through 九紫 with element and color |
| `getYearStar(date)` | Year star (changes at 立春) |
| `getMonthStar(date)` | Month star (from year star group + solar month) |
| `getDayStar(date)` | Day star (continuous 9-day cycle) |
| `getHourStar(date)` | Hour star (from day star group + hour branch) |
| `getFlyingStars(date)` | All four stars (year, month, day, hour) |

### Almanac Flags (神煞)

| Export | Description |
|---|---|
| `ALMANAC_FLAG_REGISTRY` | Full registry of all recognized flags with metadata |
| `getAlmanacFlags(date)` | All active flags for a date |
| `getAlmanacFlagsForPillars(pillars)` | All active flags from pre-computed pillars |
| `getHeavenlyNoble(stem)` | 天乙貴人: two noble branches per day stem |
| `getSupremeNoble(stem)` | 太極貴人: supreme noble branches per stem |
| `getLiteraryStar(stem)` | 文昌貴人: literary star branch per stem |
| `getProsperityStar(stem)` | 祿神: prosperity branch per stem |
| `getRamBlade(stem)` | 羊刃: ram blade branch per stem |
| `getGoldenCarriage(stem)` | 金輿: golden carriage branch per stem |
| `getTravelingHorse(branch)` | 驛馬: traveling horse from 三合 group |
| `getPeachBlossom(branch)` | 桃花: peach blossom from 三合 group |
| `getCanopy(branch)` | 華蓋: canopy from 三合 group |
| `getGeneralStar(branch)` | 將星: general star from 三合 group |
| `getRobberyStar(branch)` | 劫煞: robbery star from 三合 group |
| `getDeathSpirit(branch)` | 亡神: death spirit from 三合 group |
| `getRedPhoenix(branch)` | 紅鸞: red phoenix (year branch) |
| `getHeavenlyJoy(branch)` | 天喜: heavenly joy (紅鸞 + 6) |
| `getLonelyStar(branch)` | 孤辰: lonely star |
| `getWidowStar(branch)` | 寡宿: widow star |
| `isCommandingStar(stem, branch)` | 魁罡: check commanding star day pillar |
| `isTenEvils(stem, branch)` | 十惡大敗: check ten evils day pillar |
| `isYinYangError(stem, branch)` | 陰差陽錯: check yin-yang error day pillar |
| `isHeavensPardon(stem, branch, season)` | 天赦日: check heaven's pardon |
| `isMonthBreak(dayBranch, monthBranch)` | 月破: day branch clashes month branch |
| `isYearBreak(dayBranch, yearBranch)` | 歲破: day branch clashes year branch |

### Six Ren Divination (大六壬)

| Export | Description |
|---|---|
| `STEM_LODGING` | 日干寄宮: stem lodging branches (same as 祿) |
| `HEAVENLY_GENERALS` | 十二天將 in traditional order |
| `getMonthlyGeneral(date)` | 月將: shifts at each 中氣 boundary |
| `buildPlates(monthlyGeneral, hourBranch)` | Build 天地盤 (heaven/earth plate rotation) |
| `buildFourLessons(dayStem, dayBranch, plates)` | Derive 四課 (four lessons) |
| `computeSixRen(dayStem, dayBranch, hourBranch, monthlyGeneral)` | Full chart from the four parameters |
| `computeSixRenForDate(date, hour?)` | Full chart for a date (auto-derives all inputs) |

### Eclipses (日月食)

| Export | Description |
|---|---|
| `getAllSolarEclipses()` | All solar eclipses (-1999 to 3000 CE), sorted by date |
| `getAllLunarEclipses()` | All lunar eclipses (-1999 to 3000 CE), sorted by date |
| `getEclipsesForYear(year)` | All eclipses for a given year |
| `getEclipsesInRange(start, end, kind?)` | Eclipses in a date range, optionally filtered |
| `findNearestEclipse(date, kind?)` | Nearest eclipse to a given date |
| `isEclipseDate(date)` | Check if a UTC date has an eclipse |
| `ECLIPSE_DATA_RANGE` | `{ min: -1999, max: 3000 }` |

### New Moon (朔日)

| Export | Description |
|---|---|
| `newMoonJDE(k)` | JDE of new moon for lunation number k (Meeus Ch. 49) |
| `findNewMoonsInRange(startJD, endJD)` | All new moon JDEs in a Julian Day range |

### Julian Day Number (儒略日)

| Export | Description |
|---|---|
| `julianDayNumber(year, month, day, calendar?)` | JD for a calendar date (Julian, Gregorian, or auto) |
| `jdToCalendarDate(jd, calendar?)` | Convert JD back to calendar date |
| `julianCalendarToDate(year, month, day)` | Convert a Julian calendar date to a JS Date |

### DeltaT (ΔT)

| Export | Description |
|---|---|
| `deltaT(date)` | ΔT in seconds for a Date (TT = UT + ΔT) |
| `deltaTForYear(y)` | ΔT in seconds for a decimal year |

### Types

```typescript
type Stem = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸';
type Branch = '子' | '丑' | '寅' | '卯' | '辰' | '巳' | '午' | '未' | '申' | '酉' | '戌' | '亥';
type StemBranch = `${Stem}${Branch}`;
type Element = '金' | '木' | '水' | '火' | '土';
type ElementRelation = '生' | '剋' | '被生' | '被剋' | '比和';
type Strength = '旺' | '相' | '休' | '囚' | '死';
type DayRelation = '生' | '剋' | '合' | '衝' | '比和';
type PunishmentType = '無恩' | '恃勢' | '無禮';
type EarthType = '濕' | '燥';
type TenRelation = '比肩' | '劫財' | '食神' | '傷官' | '偏財' | '正財' | '七殺' | '正官' | '偏印' | '正印';
type LifeStage = '長生' | '沐浴' | '冠帶' | '臨官' | '帝旺' | '衰' | '病' | '死' | '墓' | '絕' | '胎' | '養';
type DayFitness = '建' | '除' | '滿' | '平' | '定' | '執' | '破' | '危' | '成' | '收' | '開' | '閉';
type FlyingStar = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type AlmanacCategory = 'noble' | 'academic' | 'romance' | 'travel' | 'wealth' | 'protection' | 'inauspicious';
type TransmissionMethod = '賊剋' | '比用' | '涉害' | '遙剋' | '昴星' | '別責' | '八專' | '返吟' | '伏吟';
type HeavenlyGeneral = '貴人' | '螣蛇' | '朱雀' | '六合' | '勾陳' | '青龍' | '天空' | '白虎' | '太常' | '玄武' | '太陰' | '天后';

interface HiddenStem { stem: Stem; proportion: number; }
interface Pillar { stem: Stem; branch: Branch; }
interface FourPillars { year: Pillar; month: Pillar; day: Pillar; hour: Pillar; }
interface SolarTerm { name: string; longitude: number; date: Date; }
interface FlyingStarInfo { number: FlyingStar; name: string; element: Element; color: string; }
interface AlmanacFlagInfo { name: string; english: string; auspicious: boolean; category: AlmanacCategory; }
interface AlmanacFlagResult extends AlmanacFlagInfo { positions: ('year' | 'month' | 'day' | 'hour')[]; }
interface SixRenLesson { upper: Branch; lower: Branch; }
interface SixRenChart { dayStem: Stem; dayBranch: Branch; hourBranch: Branch; monthlyGeneral: Branch; plates: Record<Branch, Branch>; lessons: SixRenLesson[]; transmissions: { initial: Branch; middle: Branch; final: Branch }; method: TransmissionMethod; generals: Record<Branch, HeavenlyGeneral>; }

type EclipseKind = 'solar' | 'lunar';
type SolarEclipseType = 'T' | 'A' | 'P' | 'H';
type LunarEclipseType = 'T' | 'P' | 'N';
interface Eclipse { date: Date; kind: EclipseKind; type: SolarEclipseType | LunarEclipseType; magnitude: number; }

type CalendarType = 'julian' | 'gregorian' | 'auto';
interface LunarMonth { monthNumber: number; isLeapMonth: boolean; startDate: Date; days: number; }
interface LunarDate { year: number; month: number; day: number; isLeapMonth: boolean; }
interface DailyAlmanac { date: Date; julianDay: number; lunar: LunarDate; pillars: FourPillars; solarTerm: { current: { name: string; date: Date } | null; next: { name: string; date: Date } }; chineseZodiac: ChineseZodiacResult; westernZodiac: WesternZodiacResult; dayFitness: { fitness: DayFitness; auspicious: boolean }; flyingStars: { year: FlyingStarInfo; month: FlyingStarInfo; day: FlyingStarInfo; hour: FlyingStarInfo }; almanacFlags: AlmanacFlagResult[]; sixRen: SixRenChart; nearestEclipse: Eclipse; isEclipseDay: boolean; dayElement: Element; dayStrength: Strength; }
```

## Used By

- [iching4d](https://iching4d.vercel.app) — interactive I Ching explorer with 3D hexagram visualization

## License

MIT
