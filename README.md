# stem-branch

The most accurate open-source Chinese calendar engine. Solar terms verified to **1.05 seconds mean** against JPL DE441 across 2,300 years of history. Zero dependencies. TypeScript.

[![npm](https://img.shields.io/npm/v/%404n6h4x0r%2Fstem-branch)](https://www.npmjs.com/package/@4n6h4x0r/stem-branch)
[![license](https://img.shields.io/badge/license-Apache%202.0-blue)](LICENSE)
[![coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue)](https://www.typescriptlang.org/)

## Accuracy

Every result is computed from first principles — full VSOP87D (2,425 terms) with a DE441-fitted correction polynomial, IAU2000B nutation, and Meeus Ch. 49 lunar algorithms — then validated against JPL's numerical ephemeris.

**vs JPL DE441 (primary reference):**

| Test | Range | Result |
|------|-------|--------|
| Solar term timing | 209–2493 CE (1,008 terms) | mean **1.05 s**, max 3.05 s |
| Equation of Time | 2024 (366 days) | max **0.03 s** |
| Planetary longitude | 1900–2100 (808 epochs) | **1–14″** mean |
| Lunar phase timing | 2000–2024 (594 phases) | **3.6″** mean elongation error |

**vs [sxwnl](https://github.com/sxwnl/sxwnl) (寿星万年历, the most widely-cited open-source alternative):**

| Metric | stem-branch | sxwnl |
|--------|-------------|-------|
| Mean solar term error (vs JPL) | **1.05 s** | 2.38 s |
| Max solar term error (vs JPL) | **3.05 s** | 7.18 s |
| Validated range | **209–2493 CE** | 1900–2100 CE |
| Extended computation | **10,392 terms, 0 failures** | — |
| Timeline where equal or better | **98.9%** | 1.1% |

Full methodology with 14 charts, polynomial analysis, and 7,000-year extended range data: **[Accuracy Report](https://h4x0r.github.io/stem-branch/accuracy)**

## Install

```bash
npm install @4n6h4x0r/stem-branch
```

Zero production dependencies. Works in Node.js, browsers, and edge runtimes.

## Quick Examples

### Four Pillars (四柱八字)

```typescript
import { computeFourPillars } from '@4n6h4x0r/stem-branch';

const pillars = computeFourPillars(new Date(2024, 1, 10, 14, 30));
// → year: 甲辰, month: 丙寅, day: 壬午, hour: 丁未
```

### Daily Almanac (日曆總覽)

One call, everything at once — four pillars, lunar date, solar terms, zodiac, day fitness, flying stars, almanac flags, Six Ren chart, eclipses, and element analysis:

```typescript
import { dailyAlmanac } from '@4n6h4x0r/stem-branch';

const a = dailyAlmanac(new Date(2024, 5, 15));
// a.pillars      → year/month/day/hour stem-branch pairs
// a.lunar        → { year: 2024, month: 5, day: 10, isLeapMonth: false }
// a.dayFitness   → { fitness: '成', auspicious: true }
// a.almanacFlags → [{ name: '天乙貴人', english: 'Heavenly Noble', ... }, ...]
// a.sixRen       → { method: '賊剋', lessons: [...], ... }
// a.flyingStars  → { year: {...}, month: {...}, day: {...}, hour: {...} }
```

### Seven Governors (七政四餘)

Chinese sidereal astrology — 11 celestial bodies placed in 28 lunar mansions and 12 palaces:

```typescript
import { getSevenGovernorsChart } from '@4n6h4x0r/stem-branch';

const chart = getSevenGovernorsChart(
  new Date('1990-01-15T00:30:00Z'),
  { lat: 25.033, lon: 121.565 },
);
// chart.bodies.sun     → { siderealLon, mansion, mansionDegree, palace }
// chart.palaces         → 12 palaces with roles relative to ascendant
// chart.aspects         → inter-body aspects (合/沖/刑/三合)
// chart.dignities       → per-body dignity (廟/旺/平/陷)
```

## What's Inside

### Astronomy

| Export | Description |
|--------|-------------|
| `getSolarTermsForYear(year)` | All 24 solar terms with exact UTC times |
| `gregorianToLunar(date)` | Gregorian → lunar date conversion |
| `getEclipsesForYear(year)` | Solar and lunar eclipses (−1999 to 3000 CE) |
| `equationOfTime(date)` | Equation of Time in minutes |
| [+ 14 more →](https://h4x0r.github.io/stem-branch/api/astronomy) | |

### Stem-Branch System (干支)

| Export | Description |
|--------|-------------|
| `STEMS` / `BRANCHES` | 天干地支 arrays |
| `allSixtyStemBranch()` | All 60 valid pairs in cycle order |
| `getElementRelation(from, to)` | Five Elements relationship (生/剋/比和) |
| `getCycleElement(sb)` | 納音 element for a stem-branch pair |
| [+ 12 more →](https://h4x0r.github.io/stem-branch/api/stem-branch) | |

### Four Pillars & Derivations (四柱八字)

| Export | Description |
|--------|-------------|
| `computeFourPillars(date)` | Year, month, day, and hour pillars |
| `computeMajorLuck(date, gender)` | 大運 ten-year luck periods |
| `getAlmanacFlags(date)` | All active 神煞 for a date |
| `getTenRelation(dayStem, other)` | Ten Relations (十神) |
| [+ 45 more →](https://h4x0r.github.io/stem-branch/api/four-pillars) | |

### Almanac Features (曆書)

| Export | Description |
|--------|-------------|
| `getDayFitnessForDate(date)` | 建除十二神 fitness + auspicious flag |
| `getFlyingStars(date)` | 紫白九星 year/month/day/hour stars |
| `getChineseZodiac(date)` | 生肖 with configurable year boundary |
| `getPengZuTabooForDate(date)` | 彭祖百忌 daily taboos |
| [+ 15 more →](https://h4x0r.github.io/stem-branch/api/almanac) | |

### Divination Systems (三式)

| Export | Description |
|--------|-------------|
| `computeSixRenForDate(date)` | 大六壬 full chart |
| `computeQiMenForDate(date)` | 奇門遁甲 full chart |
| `computeZiWei(birthData)` | 紫微斗數 full chart |
| [+ 15 more →](https://h4x0r.github.io/stem-branch/api/divination) | |

### Seven Governors (七政四餘)

| Export | Description |
|--------|-------------|
| `getSevenGovernorsChart(date, location)` | Complete natal chart with all 11 bodies |
| `toSiderealLongitude(lon, date)` | Tropical → sidereal conversion (3 modes) |
| `getRahuPosition(date)` | 羅睺 Moon's ascending node |
| `getMansionForLongitude(lon)` | Map to one of 28 lunar mansions |
| [+ 6 more →](https://h4x0r.github.io/stem-branch/api/seven-governors) | |

### Timezone & Location (時區)

| Export | Description |
|--------|-------------|
| `localToUtc(y, m, d, h, min, tz)` | Wall clock → UTC with historical DST |
| `wallClockToSolarTime(...)` | Full true solar time pipeline |
| `searchCities(query)` | Search 143 cities by name or pinyin |
| [+ 10 more →](https://h4x0r.github.io/stem-branch/api/timezone) | |

## Documentation

- **[Getting Started](https://h4x0r.github.io/stem-branch/getting-started)** — install, examples, and "What's Inside" overview
- **[API Reference](https://h4x0r.github.io/stem-branch/api/astronomy)** — full export tables and TypeScript types
- **[Reference Tables](https://h4x0r.github.io/stem-branch/reference/almanac-flags)** — 神煞, 建除十二神, 天德月德, 神煞方位 lookup tables
- **[Algorithms](https://h4x0r.github.io/stem-branch/algorithms/overview)** — how solar longitude, four pillars, and lunar calendar are computed
- **[Accuracy Report](https://h4x0r.github.io/stem-branch/accuracy)** — full validation against JPL DE441, Swiss Ephemeris, and sxwnl
- **[Seven Governors](https://h4x0r.github.io/stem-branch/seven-governors)** — 七政四餘 computation methods and historical context
- **[Rust binding](rust/README.md)** — native Rust port of the solar ephemeris core, validated against JPL DE441 (max 0.081″)

## License

[Apache-2.0](LICENSE)
