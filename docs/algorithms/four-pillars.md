# Four Pillars (四柱八字)

The Four Pillars encode a moment in time as four stem-branch pairs — one each for year, month, day, and hour. They form the foundation of 命理學 (Chinese fate analysis).

## The Sexagenary Cycle (六十甲子)

10 Heavenly Stems (天干) cycle with 12 Earthly Branches (地支), producing 60 unique combinations:

**Stems:** 甲 乙 丙 丁 戊 己 庚 辛 壬 癸

**Branches:** 子 丑 寅 卯 辰 巳 午 未 申 酉 戌 亥

The cycle starts at 甲子 and repeats every 60 units (LCM of 10 and 12).

## Year Pillar (年柱)

The year pillar changes at **立春** (Start of Spring, solar longitude 315°), not January 1st. stembranch computes the exact 立春 moment using VSOP87D to determine which sexagenary year a given date falls in.

**Formula:** `(year - 4) mod 60` gives the index into the 60-year cycle, with adjustment at the 立春 boundary.

## Month Pillar (月柱)

The month changes at each **節** (major solar term) — the odd-numbered solar terms that mark the start of each solar month:

| Solar Month | 節 (Start) | Branch |
|------------|-----------|--------|
| 1 | 立春 (315°) | 寅 |
| 2 | 驚蟄 (345°) | 卯 |
| 3 | 清明 (15°) | 辰 |
| 4 | 立夏 (45°) | 巳 |
| 5 | 芒種 (75°) | 午 |
| 6 | 小暑 (105°) | 未 |
| 7 | 立秋 (135°) | 申 |
| 8 | 白露 (165°) | 酉 |
| 9 | 寒露 (195°) | 戌 |
| 10 | 立冬 (225°) | 亥 |
| 11 | 大雪 (255°) | 子 |
| 12 | 小寒 (285°) | 丑 |

The month **stem** is determined by the year stem using the 五虎遁 (Five Tigers) rule:

| Year Stem | Month 1 (寅) Stem |
|-----------|------------------|
| 甲, 己 | 丙 |
| 乙, 庚 | 戊 |
| 丙, 辛 | 庚 |
| 丁, 壬 | 壬 |
| 戊, 癸 | 甲 |

## Day Pillar (日柱)

The day pillar is purely arithmetic — independent of astronomy. It cycles through the 60 sexagenary pairs with a fixed epoch:

```
dayIndex = (JDN + 49) mod 60
```

where JDN is the Julian Day Number at midnight UT. The day boundary is midnight (00:00 local time), consistent with modern Chinese calendar practice.

## Hour Pillar (時柱)

Each day is divided into 12 two-hour periods (時辰):

| Branch | Hours | Name |
|--------|-------|------|
| 子 | 23:00–01:00 | Early Rat |
| 丑 | 01:00–03:00 | |
| 寅 | 03:00–05:00 | |
| ... | ... | |
| 亥 | 21:00–23:00 | |

The hour **stem** is determined by the day stem using the 五鼠遁 (Five Rats) rule, analogous to the Five Tigers rule for months.

**True solar time:** stembranch optionally computes hour pillars using true solar time (via the Equation of Time from VSOP87D), which can shift the hour boundary by up to ±16 minutes.

## API

```typescript
import { computeFourPillars } from 'stembranch';

const pillars = computeFourPillars(new Date(2024, 1, 10, 14, 30));
// → {
//     year:  { stem: '甲', branch: '辰' },
//     month: { stem: '丙', branch: '寅' },
//     day:   { stem: '壬', branch: '午' },
//     hour:  { stem: '丁', branch: '未' }
//   }
```
