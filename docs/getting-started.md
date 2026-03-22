# Getting Started

## Install

::: code-group

```bash [npm]
npm install @4n6h4x0r/stem-branch
```

```bash [pnpm]
pnpm add @4n6h4x0r/stem-branch
```

```bash [yarn]
yarn add @4n6h4x0r/stem-branch
```

```bash [bun]
bun add @4n6h4x0r/stem-branch
```

:::

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

### Luck Periods (大運)

```typescript
import { computeMajorLuck, computeMinorLuck } from '@4n6h4x0r/stem-branch';

// 大運: 10-year periods from month pillar
const luck = computeMajorLuck(new Date(1990, 6, 15), 'male', 8);
// → direction: 'forward', startAge: 8
// → periods: [{pillar: 甲申, startAge: 8}, {pillar: 乙酉, startAge: 18}, ...]

// 小運: year-by-year from hour pillar
const minor = computeMinorLuck({stem: '甲', branch: '子'}, 'forward', 1, 10);
// → [{age: 1, pillar: 乙丑}, {age: 2, pillar: 丙寅}, ...]
```

### Divination Systems (三式)

```typescript
import { computeSixRenForDate, computeQiMenForDate, computeZiWei } from '@4n6h4x0r/stem-branch';

// 大六壬
const sixRen = computeSixRenForDate(new Date(2024, 5, 15, 14));

// 奇門遁甲
const qimen = computeQiMenForDate(new Date(2024, 5, 15));

// 紫微斗數
const chart = computeZiWei({ year: 1990, month: 8, day: 15, hour: 6, gender: 'male' });
```

### Timezone-Aware Solar Time (真太陽時)

```typescript
import { localToUtc, isDst, wallClockToSolarTime } from '@4n6h4x0r/stem-branch';

// Convert 1988-07-15 12:00 Shanghai time (PRC DST active) to UTC
const utc = localToUtc(1988, 7, 15, 12, 0, 'Asia/Shanghai');
// → 1988-07-15T03:00:00Z (UTC+9 during DST)

// Check DST status
isDst(1988, 7, 15, 12, 0, 'Asia/Shanghai'); // → true (PRC DST 1986-1991)

// Full true solar time pipeline for Beijing (116.4°E)
const solar = wallClockToSolarTime(2024, 6, 15, 12, 0, 'Asia/Shanghai', 116.4);
```

## What's Inside

| Module | Description |
|--------|-------------|
| **Astronomy** | VSOP87D solar longitude, IAU2000B nutation, Meeus lunar algorithms, ΔT, eclipses |
| **Stem-Branch** | 60-cycle, five elements, hidden stems, stem/branch relations, ten relations |
| **Four Pillars** | Year/month/day/hour pillars, major & minor luck periods |
| **Almanac** | Day fitness, flying stars, 30 almanac flags, Peng Zu taboos, deity directions |
| **Divination** | 大六壬, 奇門遁甲, 紫微斗數 — all from first principles |
| **Timezone** | 78 IANA timezones, 11,742 historical transitions, true solar time pipeline |
| **Cities** | 143 cities across 11 regions with coordinates for solar time |

## Requirements

- **TypeScript** 5.7+
- **Node.js** 18+ (ESM and CJS both supported)
- Zero production dependencies

## License

[Apache-2.0](https://github.com/h4x0r/stem-branch/blob/main/LICENSE)
