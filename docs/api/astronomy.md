---
title: "Astronomy — stem-branch API Reference"
description: "Astronomical foundations: solar terms, lunisolar calendar, eclipses, Julian Day, ΔT computation. Full VSOP87D with DE441 correction."
---

# Astronomy

Astronomical computation layer underpinning the entire library. Provides sub-second precision solar term moments via VSOP87D with DE441 polynomial correction, lunisolar calendar generation from Meeus Ch. 49 new moon series, and a 5,000-year eclipse catalogue. All functions accept and return standard JS `Date` objects in UTC.

### DeltaT (ΔT)

| Export | Description |
|---|---|
| `deltaT(date)` | ΔT in seconds for a Date (TT = UT + ΔT) |
| `deltaTForYear(y)` | ΔT in seconds for a decimal year |

### Julian Day Number (儒略日)

| Export | Description |
|---|---|
| `julianDayNumber(year, month, day, calendar?)` | JD for a calendar date (Julian, Gregorian, or auto) |
| `jdToCalendarDate(jd, calendar?)` | Convert JD back to calendar date |
| `julianCalendarToDate(year, month, day)` | Convert a Julian calendar date to a JS Date |

### Solar Terms (節氣)

| Export | Description |
|---|---|
| `SOLAR_TERM_NAMES` | 24 term names (小寒 through 冬至) |
| `SOLAR_TERM_LONGITUDES` | Ecliptic longitudes (285° through 270°) |
| `findSolarTermMoment(longitude, year, startMonth?)` | Exact UTC moment for a solar longitude |
| `getSolarTermsForYear(year)` | All 24 terms with exact dates |
| `findSpringStart(year)` | Exact moment of 立春 |
| `getSolarMonthExact(date)` | Which solar month a date falls in |

### New Moon (朔日)

| Export | Description |
|---|---|
| `newMoonJDE(k)` | JDE of new moon for lunation number k (Meeus Ch. 49) |
| `findNewMoonsInRange(startJD, endJD)` | All new moon JDEs in a Julian Day range |

### Lunisolar Calendar (農曆)

| Export | Description |
|---|---|
| `getLunarMonthsForYear(lunarYear)` | All lunar months for a year (12 or 13) |
| `getLunarNewYear(gregorianYear)` | Lunar New Year date (正月初一) |
| `gregorianToLunar(date)` | Convert Gregorian date to lunar date |

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

## Types

```typescript
interface SolarTerm { name: string; longitude: number; date: Date; }
interface LunarMonth { monthNumber: number; isLeapMonth: boolean; startDate: Date; days: number; }
interface LunarDate { year: number; month: number; day: number; isLeapMonth: boolean; }

type EclipseKind = 'solar' | 'lunar';
type SolarEclipseType = 'T' | 'A' | 'P' | 'H';
type LunarEclipseType = 'T' | 'P' | 'N';
interface Eclipse { date: Date; kind: EclipseKind; type: SolarEclipseType | LunarEclipseType; magnitude: number; }
```
