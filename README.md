# stembranch

Astronomical Chinese calendar computation for TypeScript.

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

Zero production dependencies. Uses a self-contained VSOP87B implementation (2,564 terms) for sub-minute solar term precision.

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
// → 2024-02-04T00:27:... UTC (立春, solar longitude 315 degrees)
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

## Design Decisions

This library makes explicit choices where Chinese calendar traditions diverge. Each decision is documented here so you know what your app computes and why.

### Year boundary: 立春 (Start of Spring), not January 1

The 干支 (stem-branch) year starts at 立春, the moment the sun reaches ecliptic longitude 315 degrees. This falls around February 3-5 each year. A person born on January 20, 2024 belongs to the 癸卯 year (2023's stem-branch), not 甲辰 (2024's).

The library computes the exact 立春 moment using VSOP87 planetary theory (via `astronomy-engine`). The approximate mode uses February 4 as a fixed boundary, accurate to +/-1 day.

### 生肖 (zodiac animal) follows the year branch

The zodiac animal maps directly from the year pillar's earthly branch. 子=鼠, 丑=牛, 寅=虎, and so on. The year boundary determines when the animal changes. The library supports both conventions:

| Convention | Boundary | Use case | Function |
|---|---|---|---|
| 立春派 | Start of Spring (~Feb 4) | 四柱八字, divination | `getChineseZodiac(date)` |
| 初一派 | Lunar New Year (varies) | Popular culture, horoscopes | `getChineseZodiac(date, 'lunar-new-year')` |

### 真太陽時 (True Solar Time)

True solar time corrects clock time for two effects: the observer's longitude offset from the standard meridian, and the Equation of Time (Earth's orbital eccentricity and axial tilt). The formula:

```
TST = Clock Time + (Longitude - Standard Meridian) * 4 min/deg + EoT
```

Two properties of this calculation:

1. **Latitude has no effect.** True solar time depends on longitude and date. Two observers at the same longitude see the same solar time regardless of latitude.
2. **Sign convention: positive = sundial ahead of clock.** The Equation of Time uses the "apparent minus mean" convention (Spencer 1971, negated). When EoT is positive, the sundial reads ahead of the clock.

```typescript
import { trueSolarTime } from 'stembranch';

// Beijing: longitude 116.4E, standard meridian 120E (UTC+8)
const result = trueSolarTime(new Date(2024, 6, 15, 12, 0), 116.4);
// result.trueSolarTime  → corrected Date
// result.totalCorrection → minutes of adjustment
```

The standard meridian is inferred from the Date's timezone offset if not provided. Pass it explicitly when computing for a location in a different timezone than your machine.

### Exact vs. approximate modes

`computeFourPillars` accepts an `exact` option (default: `true`).

| | Exact mode | Approximate mode |
|---|---|---|
| Year pillar | Astronomy-engine 立春 | Fixed Feb 4 boundary |
| Month pillar | Astronomy-engine 節 terms | Hardcoded date ranges |
| Day pillar | Arithmetic (both modes identical) | Arithmetic |
| Hour pillar | 2-hour divisions (both modes identical) | 2-hour divisions |

Use exact mode for birth chart calculations. Use approximate mode for batch processing or UI where +/-1 day tolerance is acceptable.

### 子時 (Midnight Hour) crosses calendar days

子時 runs from 23:00 to 00:59, crossing the calendar midnight boundary. The library handles this: at 23:00+, the hour branch is 子 and the hour stem uses the *next* day's stem for the 甲己還加甲 rule. The day pillar itself does not advance until 00:00.

### 小寒 (Minor Cold) starts 丑月

The 12 month boundaries are defined by 節 (Jie) solar terms. 小寒 (~January 6) starts 丑月, and 立春 (~February 4) starts 寅月. Dates between 小寒 and 立春 belong to 丑月 of the *previous* stem-branch year.

## Accuracy

### Cross-validation against 寿星万年历 (sxwnl)

The library is validated against [sxwnl](https://github.com/sxwnl/sxwnl), the gold standard Chinese calendar library by 許劍偉. Results:

| Test | Samples | Range | Result |
|---|---|---|---|
| Day Pillar (日柱) | 5,683 dates | 1583-2500 | **100%** match |
| Year Pillar (年柱) | 2,412 dates | 1900-2100 | **100%** match |
| Month Pillar (月柱) | 2,412 dates | 1900-2100 | **100%** match |
| Solar Terms (節氣) | 4,824 terms | 1900-2100 | avg **12.6s** deviation |

Solar term timing detail:

| Percentile | Deviation |
|---|---|
| P50 | 10.4 seconds |
| P95 | 31.8 seconds |
| P99 | 43.7 seconds |
| Max | 1.04 minutes |
| Within 1 min | 99.9% |
| Within 5 min | 100% |

### Data sources

| Component | Source | Method |
|---|---|---|
| Solar longitude | [astronomy-engine](https://github.com/cosinekitty/astronomy) | Truncated VSOP87 planetary theory |
| Day pillar | Arithmetic | Epoch: 2000-01-07 = 甲子日 |
| Stem/branch cycles | Lookup tables | Standard 10-stem, 12-branch sequences |
| Lunar New Year dates | Hardcoded table | 58 dates (1990-2050) |
| Equation of Time | Spencer 1971 Fourier | Accurate to ~30 seconds |

The solar term deviation from sxwnl comes from truncation: `astronomy-engine` uses a subset of VSOP87's 2,425 terms. The full series achieves 0.1 arcsecond precision; the truncated version achieves ~1 arcminute. For calendar purposes (determining which day a solar term falls on), this is sufficient.

## API Reference

### Stems and Branches

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
| `branchFromHour(hour)` | Hour (0-23) to branch |
| `branchFromMonth(monthIdx)` | Solar month index to branch |

### Stem-Branch Pairs (60-cycle)

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

### Branch Relations (六合/六沖)

| Export | Description |
|---|---|
| `HARMONY_PAIRS` | Six harmony pairs (六合): 子丑, 寅亥, 卯戌, 辰酉, 巳申, 午未 |
| `CLASH_PAIRS` | Six clash pairs (六沖): 子午, 丑未, 寅申, 卯酉, 辰戌, 巳亥 |
| `isHarmony(a, b)` | Check if two branches form a harmony pair |
| `isClash(a, b)` | Check if two branches form a clash pair |
| `getDayRelation(dayBranch, lineBranch)` | Priority: harmony > clash > element relation |

### Element Strength (旺相休囚死)

| Export | Description |
|---|---|
| `STRENGTH` | `Record<Strength, string>` mapping to moon phase emojis |
| `getStrength(element, monthBranch)` | Seasonal strength: 旺, 相, 休, 囚, or 死 |

### Void Branches (旬空)

| Export | Description |
|---|---|
| `computeVoidBranches(dayStem, dayBranch)` | Two void branches for the current decade |

### Solar Terms (節氣)

| Export | Description |
|---|---|
| `SOLAR_TERM_NAMES` | 24 term names (小寒 through 冬至) |
| `SOLAR_TERM_LONGITUDES` | Ecliptic longitudes (285 through 270 degrees) |
| `MONTH_BOUNDARY_INDICES` | Indices of the 12 節 terms that define month boundaries |
| `findSolarTermMoment(longitude, year, startMonth?)` | Exact UTC moment for a solar longitude |
| `getSolarTermsForYear(year)` | All 24 terms with exact dates |
| `findSpringStart(year)` | Exact moment of 立春 (longitude 315 degrees) |
| `getMonthBoundaryTerms(year)` | The 12 節 terms that define month boundaries |
| `getSolarMonthExact(date)` | Which solar month a date falls in |

### Four Pillars (四柱)

| Export | Description |
|---|---|
| `computeFourPillars(date, options?)` | Compute year, month, day, and hour pillars |

Options: `{ exact?: boolean }` (default `true`)

### True Solar Time (真太陽時)

| Export | Description |
|---|---|
| `equationOfTime(date)` | EoT in minutes (Spencer 1971) |
| `trueSolarTime(clockTime, longitude, standardMeridian?)` | Corrected solar time with breakdown |

### Chinese Zodiac (生肖)

| Export | Description |
|---|---|
| `ZODIAC_ANIMALS` | `['鼠','牛','虎','兔','龍','蛇','馬','羊','猴','雞','狗','豬']` |
| `ZODIAC_ENGLISH` | `Record<ChineseZodiacAnimal, string>` (鼠→Rat, etc.) |
| `animalFromBranch(branch)` | Branch to zodiac animal |
| `branchFromAnimal(animal)` | Zodiac animal to branch |
| `getChineseZodiac(date, boundary?)` | Zodiac with configurable year boundary |
| `getZodiacBySpringStart(date)` | Zodiac using 立春 boundary |
| `getChineseZodiacLunarNewYear(date)` | Zodiac using Lunar New Year boundary |

### Western Zodiac (星座)

| Export | Description |
|---|---|
| `getWesternZodiac(date)` | Sign, symbol, Chinese name, Western element |

### Types

```typescript
type Stem = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸';
type Branch = '子' | '丑' | '寅' | '卯' | '辰' | '巳' | '午' | '未' | '申' | '酉' | '戌' | '亥';
type StemBranch = `${Stem}${Branch}`;
type Element = '金' | '木' | '水' | '火' | '土';
type ElementRelation = '生' | '剋' | '被生' | '被剋' | '比和';
type Strength = '旺' | '相' | '休' | '囚' | '死';
type DayRelation = '生' | '剋' | '合' | '沖' | '比和';
type YearBoundary = 'spring-start' | 'lunar-new-year';

interface Pillar { stem: Stem; branch: Branch; }
interface FourPillars { year: Pillar; month: Pillar; day: Pillar; hour: Pillar; }
interface SolarTerm { name: string; longitude: number; date: Date; }
```

## Limitations

- **No lunar calendar.** The library computes solar terms and stem-branch cycles. It does not compute lunar months, new moons, or 閏月 (intercalary months). The Lunar New Year zodiac function uses a hardcoded lookup table (1990-2050) with a February 1 fallback outside that range.
- **No DeltaT handling.** The library does not account for the difference between Terrestrial Time and Universal Time. This matters for historical dates (pre-1900) where DeltaT exceeds 10 seconds.
- **Proleptic Gregorian calendar.** JavaScript's `Date` uses the proleptic Gregorian calendar for all dates. The library does not handle the Julian/Gregorian transition (October 15, 1582). Day pillar computations before 1582 will differ from sxwnl, which uses the Julian calendar for those dates.
- **Approximate Western zodiac boundaries.** Sign boundaries use fixed dates (+/-1 day). For dates near a boundary, compute the exact solar longitude instead.

## License

MIT
