# Lunar Calendar (農曆)

stembranch computes the Chinese lunar calendar from first principles using astronomical new moon calculations and solar term interpolation.

## How It Works

The Chinese lunar calendar is a lunisolar calendar:
- **Months** start at each new moon (朔日)
- **Year boundaries** are aligned with the solar cycle via intercalary (leap) months
- **Month numbering** is determined by which major solar term (中氣) falls within each lunar month

### Step 1: New Moon Calculation

New moon moments are computed using Meeus Ch. 49 (Jean Meeus, *Astronomical Algorithms*):

1. Estimate the lunation number k from the target date
2. Compute the approximate new moon JDE using a polynomial in k
3. Apply 14 planetary correction terms and 25 additional periodic terms
4. Convert from TT to UT via ΔT

### Step 2: Solar Term Mapping

The 12 中氣 (major solar terms at 30° intervals) determine month numbers:

| 中氣 | Longitude | Month Number |
|------|-----------|-------------|
| 雨水 | 330° | 1 (正月) |
| 春分 | 0° | 2 |
| 穀雨 | 30° | 3 |
| 小滿 | 60° | 4 |
| 夏至 | 90° | 5 |
| 大暑 | 120° | 6 |
| 處暑 | 150° | 7 |
| 秋分 | 180° | 8 |
| 霜降 | 210° | 9 |
| 小雪 | 240° | 10 |
| 冬至 | 270° | 11 |
| 大寒 | 300° | 12 |

A lunar month is assigned the number of the 中氣 that falls within it.

### Step 3: Intercalary Month Detection

When a lunar month contains no 中氣, it becomes an intercalary (leap) month (閏月). It takes the number of the preceding month with a 閏 prefix.

This is the **No-Zhongqi Rule** (無中氣置閏法), the standard rule used since the Qing dynasty Shíxiàn calendar (時憲曆, 1645).

### The 2033 Problem

In some years, multiple lunar months lack a 中氣, creating ambiguity about which month is intercalary. The most notable case is 2033, where the standard algorithm would place the leap month incorrectly without the **Winter Solstice Rule** (冬至必在十一月): the month containing 冬至 must be month 11.

stembranch handles this correctly — validated against Hong Kong Observatory data.

## API

```typescript
import { gregorianToLunar, lunarToGregorian } from 'stembranch';

// Gregorian → Lunar
gregorianToLunar(new Date(2024, 1, 10));
// → { year: 2024, month: 1, day: 1, isLeapMonth: false }

// Lunar → Gregorian
lunarToGregorian(2024, 1, 1, false);
// → Date (2024-02-10)
```
