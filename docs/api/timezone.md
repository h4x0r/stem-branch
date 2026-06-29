---
title: "Timezone & Location (時區) — stem-branch API Reference"
description: "Historically-accurate timezone conversion with 78 IANA zones, 11,742 transitions, true solar time pipeline, and 143-city database."
---

# Timezone & Location (時區)

Historically-accurate timezone conversion using an embedded IANA transition table (78 timezones, 11,742 transitions, 1900-2026) for deterministic, platform-independent results. Handles PRC DST 1986-1991, Taiwan DST 1946-1979, Hong Kong summer time 1946-1979, Singapore UTC+7:30→UTC+8, and all other historical timezone changes. Falls back to `Intl.DateTimeFormat` only for timezones not in the embedded database.

Full technical references, source analysis, and known discrepancies: [docs/technical-notes.md](../technical-notes.md#timezone--dst)

### Timezone Conversion

| Export | Description |
|---|---|
| `localToUtc(year, month, day, hour, minute, timezoneId)` | Convert local wall-clock time to UTC Date |
| `utcToLocal(date, timezoneId)` | Convert UTC Date to local `{ year, month, day, hour, minute, second }` |
| `getUtcOffset(year, month, day, hour, minute, timezoneId)` | UTC offset in minutes (positive = east) at a local moment |
| `isDst(year, month, day, hour, minute, timezoneId)` | Whether DST/summer time is in effect |
| `getStandardMeridian(year, month, day, hour, minute, timezoneId)` | Standard meridian in degrees from UTC offset |
| `formatUtcOffset(offsetMinutes)` | Format offset as `"+08:00"`, `"-05:00"`, `"+05:45"` |
| `timezoneFromLongitude(longitude)` | Derive `Etc/GMT±N` timezone from longitude (fallback) |
| `wallClockToSolarTime(year, month, day, hour, minute, timezoneId, longitude)` | Full pipeline: wall clock → UTC → true solar time |

```typescript
import { localToUtc, getUtcOffset, isDst, wallClockToSolarTime } from '@4n6h4x0r/stem-branch';

// Convert 1988-07-15 12:00 Shanghai time (PRC DST active) to UTC
const utc = localToUtc(1988, 7, 15, 12, 0, 'Asia/Shanghai');
// → 1988-07-15T03:00:00Z (UTC+9 during DST)

// Check DST status
isDst(1988, 7, 15, 12, 0, 'Asia/Shanghai'); // → true (PRC DST 1986-1991)
isDst(1992, 7, 15, 12, 0, 'Asia/Shanghai'); // → false (DST abolished)

// Full true solar time pipeline for Beijing (116.4°E)
const solar = wallClockToSolarTime(2024, 6, 15, 12, 0, 'Asia/Shanghai', 116.4);
// → { trueSolarTime: Date, longitudeCorrection: -14.4, equationOfTime: ~0, ... }
```

### City Database (城市)

143 cities across 11 regions with IANA timezone IDs and coordinates for true solar time computation.

| Export | Description |
|---|---|
| `CITIES` | Full city array: `{ name, nameEn, timezoneId, longitude, latitude, region }` |
| `CITY_REGIONS` | Region metadata: `{ key, label, labelEn }` |
| `searchCities(query)` | Search by Chinese name, English name, or pinyin |
| `getCitiesByRegion(regionKey)` | Filter cities by region |
| `findNearestCity(longitude, latitude)` | Find closest city by coordinates |

Regions: China (44), Taiwan (8), Hong Kong (2), Southeast Asia (20), East Asia (12), South Asia (10), Middle East (11), Europe (24), Americas (20), Oceania (7), Africa (5).

### Daily Almanac (日曆總覽)

| Export | Description |
|---|---|
| `dailyAlmanac(date)` | Complete almanac: pillars, lunisolar date, solar terms, zodiac, day fitness, flying stars, almanac flags, Six Ren, eclipses, element analysis |
