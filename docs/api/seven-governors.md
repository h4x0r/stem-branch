---
title: "Seven Governors (七政四餘) — stem-branch API Reference"
description: "Chinese sidereal astrology API: natal chart assembly, sidereal conversion, Four Remainders (四餘), mansion and palace lookup."
---

# Seven Governors (七政四餘)

Chinese sidereal astrology system placing 11 celestial bodies (7 planets + 4 lunar points) in 28 lunar mansions and 12 palaces. Supports three sidereal conversion modes (modern precession, classical epoch, fixed ayanamsa) and configurable Ketu interpretation (osculating apogee or descending node).

For historical context, the Ketu/Rahu translation problem, the Schall controversy, and scholarly references: [Seven Governors — Computation Methods & History](../seven-governors)

## Source files

| File | Description |
|------|-------------|
| `src/seven-governors/sidereal.ts` | Sidereal conversion engine (three modes) |
| `src/seven-governors/four-remainders.ts` | Rahu, Ketu, Yuebei, Purple Qi computation |
| `src/seven-governors/data/mansion-boundaries.ts` | 28 mansion boundary data from Hipparcos |
| `src/seven-governors/chart.ts` | Chart assembly, aspects, dignities, star spirits |

## Chart Assembly

| Export | Description |
|---|---|
| `getSevenGovernorsChart(date, location, options?)` | Complete 七政四餘 natal chart with all 11 bodies |

## Sidereal Conversion

| Export | Description |
|---|---|
| `toSiderealLongitude(tropicalLon, date, mode?)` | Convert tropical → sidereal longitude (3 modes: modern, classical, ayanamsa) |

The sidereal engine anchors 0° to Spica (α Virginis, J2000.0 tropical longitude 201.2983°). Three modes via `SiderealMode`:

| Mode | Ayanamsa computation | Use case |
|------|---------------------|----------|
| `modern` (default) | `SPICA_J2000 + precession(T)/3600` using IAU precession model | Modern astronomical accuracy |
| `classical` | Fixed ayanamsa from a historical epoch (開元 724 CE or 崇禎 1628 CE) | Reproducing historical charts |
| `ayanamsa` | User-supplied fixed value | Interoperability with other systems |

## Four Remainders (四餘)

| Export | Description |
|---|---|
| `getRahuPosition(date)` | 羅睺: Moon's mean ascending node (~18.6-year retrograde cycle) |
| `getKetuPosition(date, mode?)` | 計都: osculating lunar apogee (default) or descending node |
| `getYuebeiPosition(date)` | 月孛: mean lunar apogee (Black Moon Lilith) |
| `getPurpleQiPosition(date)` | 紫氣: classical ~28-year prograde cycle |

### Ketu mode (`KetuMode`)

The `ketuMode` option controls which astronomical identification is used for 計都:

```typescript
type KetuMode = 'apogee' | 'descending-node';
```

- `'apogee'` (default): Chinese 七政四餘 convention per 《果老星宗》 and Niu Weixing (1994) — 計都 as the osculating lunar apogee with 5-term perturbation correction
- `'descending-node'`: Original Indian Jyotish convention — Ketu as the point diametrically opposite Rahu

See [The Ketu–Rahu Translation Problem](../seven-governors#_5-the-ketu-rahu-translation-problem-計都-羅睺) for the historical analysis behind this option.

## Mansion & Palace Lookup

| Export | Description |
|---|---|
| `getMansionForLongitude(siderealLon)` | Map sidereal longitude to one of 28 lunar mansions |
| `getPalaceForLongitude(siderealLon)` | Map sidereal longitude to one of 12 palaces |
| `getAscendant(date, location)` | Compute ascending degree from birth time and location |

Mansion lookup uses binary search on the sorted boundary array, handling the wrap-around at the 軫/角 boundary (360° → 0°). Palace assignment is `floor(lon / 30)`.

## Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Seven governors positions | Complete | VSOP87D + DE441 correction for Sun; Meeus Ch. 47 for Moon; VSOP87D for planets |
| Four remainders | Complete | Meeus Ch. 22 polynomials + 5-term perturbation |
| Mansion boundaries | Approximate | Hipparcos J2000.0 positions; may differ 1–2° from historical values |
| Palace starting point | Needs verification | 辰宮 at 0° assumed; pending textual confirmation from 《果老星宗》 |
| Purple Qi epoch | Provisional | Epoch longitude set to 0° pending sourcing |
| Dignity table | Partial | Sun/Moon complete; remaining 9 bodies default to 平 |
| Star spirit rules | 3 of ~50–80 | Only 日月夾命, 祿存, 火鈴夾命 implemented |
| Ascendant | Complete | Standard astronomical formula via GMST + obliquity |

## Types

```typescript
type Governor = 'sun' | 'moon' | 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn';
type Remainder = 'rahu' | 'ketu' | 'yuebei' | 'purpleQi';
type GovernorOrRemainder = Governor | Remainder;
type SiderealMode = { type: 'modern' } | { type: 'classical'; epoch: 'kaiyuan' | 'chongzhen' | number } | { type: 'ayanamsa'; value: number };
type KetuMode = 'apogee' | 'descending-node';
type MansionName = '角' | '亢' | ... | '軫';  // 28 lunar mansion names
type PalaceName = '子宮' | '丑宮' | ... | '亥宮';  // 12 palace names
type Dignity = '廟' | '旺' | '平' | '陷';
type AspectType = '合' | '沖' | '刑' | '三合';

interface BodyPosition { siderealLon: number; tropicalLon: number; mansion: MansionName; mansionDegree: number; palace: PalaceName; }
interface PalaceInfo { name: PalaceName; role: PalaceRole; mansions: MansionName[]; occupants: GovernorOrRemainder[]; }
interface SevenGovernorsOptions { siderealMode?: SiderealMode; ketuMode?: KetuMode; }
interface SevenGovernorsChart { date: Date; location: { lat: number; lon: number }; siderealMode: SiderealMode; ketuMode: KetuMode; bodies: Record<GovernorOrRemainder, BodyPosition>; palaces: PalaceInfo[]; ascendant: { mansion: MansionName; palace: PalaceName }; starSpirits: StarSpirit[]; aspects: Aspect[]; dignities: Record<GovernorOrRemainder, Dignity>; }
```
