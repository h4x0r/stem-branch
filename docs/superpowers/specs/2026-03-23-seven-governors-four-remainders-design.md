# Seven Governors Four Remainders (七政四餘) Design Spec

**Date**: 2026-03-23
**Status**: Draft
**Phase**: 2 of 7 (per planetary-ephemeris-astrology-cli-design.md)

---

## Overview

Implement the 七政四餘 Chinese sidereal astrology system. Takes a birth date and location, computes geocentric sidereal positions for 11 celestial bodies (7 governors + 4 remainders), maps them into 28 lunar mansions and 12 palaces, and produces a complete natal chart with star spirits, aspects, and dignity tables.

**Depends on**: Phase 1 (planetary ephemeris) — `getPlanetPosition()`, `getMoonPosition()`, `getSunLongitude()`, existing `LUNAR_MANSIONS` data.

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Sidereal frame | Modern 距星 positions (default), with classical epoch and fixed ayanamsa as configurable alternatives | Modern is what computational 七政四餘 software uses; options cover all practitioner preferences |
| Four Remainders | Astronomical computation for 羅睺, 計都, 月孛; classical formula for 紫氣 | Maximizes accuracy for bodies with known astronomical identity |
| Scope | Full reading: positions + chart + star spirits + aspects + dignity | User requested complete (C) scope |
| Reference texts | 《果老星宗》 primary, documented supplements from 《天步真原》, 《星學大成》 | Standard canonical reference for 七政四餘 |
| 紫氣 investigation | Extract classical formula, compute exact period, test astronomical candidates | Research goal alongside implementation |
| Ketu (計都) identity | Follow Niu Weixing 1995: lunar apogee, not descending node | Best-supported scholarly identification |
| Daily mansion cycle | Preserved as-is in `lunar-mansions.ts` | The existing daily cycle (one mansion per day by JD) is a separate system from sidereal positional mansions; both coexist |

---

## Architecture

### Module Structure

All new code lives under `src/seven-governors/`:

```
src/seven-governors/
  index.ts                  # Public API re-exports
  sidereal.ts               # Tropical → sidereal longitude conversion
  four-remainders.ts        # 羅睺, 計都, 月孛, 紫氣 position computation
  chart.ts                  # Chart assembly: positions → mansions → palaces → reading
  data/
    mansion-boundaries.ts   # 28 sidereal mansion boundaries (距星 catalogue)
    palace-mapping.ts       # 28 mansions → 12 palaces mapping + palace role definitions
    star-spirits.ts         # 神煞 lookup tables (《果老星宗》 primary)
    dignity.ts              # 廟/旺/陷 planetary dignity tables
    aspects.ts              # 合/沖/刑 relationship definitions + orbs
```

### Layer 1: Sidereal Engine (`sidereal.ts`)

Converts tropical ecliptic longitude to sidereal longitude using one of three configurable modes.

**Inputs**: tropical longitude (degrees), date, sidereal mode config
**Output**: sidereal longitude (degrees)

**Modes**:

1. **`modern`** (default) — Compute current positions of the 28 determinative stars (距星) using proper motion + precession. The sidereal reference point is defined by 角宿距星 (Spica, α Virginis). Sidereal longitude = tropical longitude − precession offset, where the offset is calibrated so that Spica's sidereal longitude = 0° (the start of 角宿, the first mansion).

2. **`classical`** — Use a fixed star catalogue from a historical epoch. Supported epochs: `'kaiyuan'` (開元, 724 CE), `'chongzhen'` (崇禎, 1628 CE), or an arbitrary Julian year. Mansion boundaries are frozen at the epoch's precession state.

3. **`ayanamsa`** — Subtract a fixed angular offset (in degrees) from tropical longitude. Simple Lahiri-style computation. User provides the offset value.

**Key dependency**: A precession model. IAU 2006 precession (Capitaine et al.) is standard and covers the needed date range. We need `precession(jde)` returning the accumulated precession in longitude from J2000.0.

### Layer 2: Four Remainders (`four-remainders.ts`)

Four independent functions, each returning `{ longitude: number; latitude: number }` (sidereal degrees).

**羅睺 (Rahu) — Lunar ascending node**
- Compute the mean longitude of the Moon's ascending node from lunar theory
- Our `getMoonPosition()` uses ELP/MPP02 which includes the node longitude in its parameters
- Extract Ω (mean longitude of ascending node) from the lunar argument series
- The ascending node moves retrograde with an 18.61-year period
- Formula: Ω = 125.0445479° − 1934.1362891° × T + ... (Meeus Ch. 22 or ELP terms)
- Latitude is always 0° (the node is by definition on the ecliptic)

**計都 (Ketu) — Lunar apogee (per Niu Weixing 1995)**
- Compute the mean longitude of the Moon's apogee (apsidal line)
- The lunar perigee/apogee line advances prograde with an 8.85-year period
- Formula: ϖ = 83.3532465° + 4069.0137287° × T + ... (Meeus Ch. 22)
- ϖ is the mean longitude of perigee (closest approach). The apogee (farthest point) is at ϖ + 180°.
- **Ketu longitude = (ϖ + 180°) mod 360°** — this is the lunar apogee per Niu Weixing's identification
- In `'descending-node'` mode (Indian tradition): Ketu = (Rahu + 180°) mod 360°
- Latitude: 0°

**月孛 (Yuebei) — Mean lunar apogee / Black Moon Lilith**
- 月孛 corresponds to the *mean* lunar apogee (equivalent to Black Moon Lilith in Western astrology)
- Distinguished from 計都 by: **月孛 = mean apogee** (smoothly varying), **計都 = osculating (true) apogee** (includes perturbation oscillations)
- Mean apogee formula: same ϖ polynomial as above (truncated to low-order terms, no periodic corrections)
- Osculating apogee (計都): ϖ + periodic correction terms from lunar perturbation theory
- This mean vs. osculating distinction gives the two bodies different longitudes (typically ~10-30° apart)
- **Resolution**: Implement both interpretations via `ketuMode` option: `'apogee'` (default, Niu — osculating apogee) or `'descending-node'` (Indian tradition — Rahu + 180°)

**紫氣 (Purple Qi) — Classical formula**
- No astronomical basis confirmed
- Extract the formula from 《果老星宗》 / 《大統曆》
- Classical computation: linear motion with epoch position, completing one prograde circuit in ~28 years
- Typical formula shape: λ = λ₀ + (360° / P) × T, where P ≈ 28 years and λ₀ is an epoch longitude
- Exact coefficients TBD from source text research
- **Research goal**: After implementing the classical formula, compute the exact period and test against: Saturn's period (29.46 yr), Jupiter-Saturn intercalary remainder, Metonic cycle accumulation

### Layer 3: Chart Assembly (`chart.ts`)

The main orchestration layer. Takes date + location → complete `SevenGovernorsChart`.

**Step 1: Compute all body positions**
- Sun: use `getSunLongitude(jde)` (existing, returns ecliptic longitude)
- Moon: use `getMoonPosition(date)` (existing, returns longitude/latitude)
- Mercury–Saturn: use `getPlanetPosition(planet, date)` (existing)
- Note: the existing `Planet` type does not include `'sun'`. Sun and Moon use dedicated functions, not `getPlanetPosition()`.
- Call `getRahuPosition()`, `getKetuPosition()`, `getYuebeiPosition()`, `getPurpleQiPosition()`
- Convert all tropical longitudes to sidereal via the sidereal engine

**Step 2: Map to mansions**
- For each body's sidereal longitude, determine which of the 28 mansions it falls in
- Uses the sidereal mansion boundary table from `data/mansion-boundaries.ts`
- Record: mansion name, degrees into mansion (mansion degree)

**Step 3: Map to palaces**
- The 12 palaces (十二宮) are defined by **sidereal degree boundaries**, not by mansion names alone
- Palace assignment is determined by the body's sidereal longitude falling within a palace's degree range
- The `data/palace-mapping.ts` file defines 12 entries, each with:
  - `startDeg`: sidereal longitude where this palace begins (degrees)
  - `endDeg`: sidereal longitude where this palace ends (degrees)
  - `name`: PalaceName (子宮 through 亥宮)
  - `mansions`: which mansions fall primarily within this palace (for reference/display only)
- Exact degree boundaries sourced from 《果老星宗》
- Approximate mansion-to-palace correspondence (for reference, not used for assignment):
  - 子宮: 女、虛、危 | 丑宮: 斗、牛 | 寅宮: 尾、箕
  - 卯宮: 氐、房、心 | 辰宮: 角、亢 | 巳宮: 翼、軫
  - 午宮: 柳、星、張 | 未宮: 井、鬼 | 申宮: 觜、參
  - 酉宮: 畢 | 戌宮: 昴 | 亥宮: 室、壁、奎
- Some mansions span palace boundaries — the degree-based assignment resolves this unambiguously

**Step 4: Determine ascendant (命宮)**
- The ascendant palace depends on birth hour (時辰) and the Sun's mansion position
- Algorithm: find which palace the eastern horizon mansion occupies at the birth time
- Requires local sidereal time computation from birth location + time
- The 12 palace roles (命宮, 財帛宮, 兄弟宮, 田宅宮, 男女宮, 奴僕宮, 妻妾宮, 疾厄宮, 遷移宮, 官祿宮, 福德宮, 相貌宮) are assigned in order starting from the ascendant palace

**Step 5: Star spirits (神煞)**
- Lookup table keyed by: body, mansion, palace, and/or inter-body relationships
- Categories from 《果老星宗》: auspicious spirits (吉神), malefic spirits (凶煞)
- Each spirit has: name, condition (when it activates), effect description
- Source: 《果老星宗》 primary, documented supplements

**Step 6: Aspects (格局)**
- Compute angular relationships between bodies:
  - 合 (conjunction): bodies in same palace or adjacent palaces
  - 沖 (opposition): bodies in palaces 6 apart
  - 刑 (square-like): bodies in palaces 3 or 9 apart
  - 三合 (trine): bodies in palaces 4 or 8 apart
- Specific named configurations from 《果老星宗》 (e.g., 日月夾命)

**Step 7: Dignity (廟旺陷)**
- Each of the 11 bodies has dignity states depending on which mansion/palace it occupies:
  - 廟 (temple): strongest, most favorable
  - 旺 (prosperous): strong
  - 平 (neutral): average
  - 陷 (fallen): weakest, unfavorable
- Lookup table from 《果老星宗》

---

## Public API

```typescript
// ── Types ────────────────────────────────────────────────────

type Governor = 'sun' | 'moon' | 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn';
type Remainder = 'rahu' | 'ketu' | 'yuebei' | 'purpleQi';
type GovernorOrRemainder = Governor | Remainder;

type SiderealMode =
  | { type: 'modern' }
  | { type: 'classical'; epoch: 'kaiyuan' | 'chongzhen' | number }
  | { type: 'ayanamsa'; value: number };

type KetuMode = 'apogee' | 'descending-node';

type MansionName = '角' | '亢' | '氐' | '房' | '心' | '尾' | '箕'
  | '斗' | '牛' | '女' | '虛' | '危' | '室' | '壁'
  | '奎' | '婁' | '胃' | '昴' | '畢' | '觜' | '參'
  | '井' | '鬼' | '柳' | '星' | '張' | '翼' | '軫';

type PalaceName = '子宮' | '丑宮' | '寅宮' | '卯宮' | '辰宮' | '巳宮'
  | '午宮' | '未宮' | '申宮' | '酉宮' | '戌宮' | '亥宮';

type PalaceRole = '命宮' | '財帛宮' | '兄弟宮' | '田宅宮' | '男女宮' | '奴僕宮'
  | '妻妾宮' | '疾厄宮' | '遷移宮' | '官祿宮' | '福德宮' | '相貌宮';

type Dignity = '廟' | '旺' | '平' | '陷';

type AspectType = '合' | '沖' | '刑' | '三合';

interface SevenGovernorsOptions {
  siderealMode?: SiderealMode;  // default: { type: 'modern' }
  ketuMode?: KetuMode;          // default: 'apogee'
}

// ── Body Position ────────────────────────────────────────────

interface BodyPosition {
  siderealLon: number;        // sidereal ecliptic longitude (degrees)
  tropicalLon: number;        // original tropical longitude (degrees)
  mansion: MansionName;       // which of the 28 mansions
  mansionDegree: number;      // degrees into the mansion (0 = mansion start)
  palace: PalaceName;         // which of the 12 palaces
}

// ── Chart ────────────────────────────────────────────────────

interface PalaceInfo {
  name: PalaceName;           // e.g. '子宮'
  role: PalaceRole;           // e.g. '命宮' (assigned from ascendant)
  mansions: MansionName[];    // which mansions this palace contains
  occupants: GovernorOrRemainder[];  // bodies in this palace
}

interface StarSpirit {
  name: string;               // e.g. '天德'
  type: 'auspicious' | 'malefic';
  condition: string;          // human-readable activation condition
  source: string;             // '果老星宗' | '天步真原' | etc.
}

interface Aspect {
  body1: GovernorOrRemainder;
  body2: GovernorOrRemainder;
  type: AspectType;
  name?: string;              // named configuration, e.g. '日月夾命'
}

interface SevenGovernorsChart {
  date: Date;
  location: { lat: number; lon: number };
  siderealMode: SiderealMode;
  ketuMode: KetuMode;

  bodies: Record<GovernorOrRemainder, BodyPosition>;
  palaces: PalaceInfo[];
  ascendant: {
    mansion: MansionName;
    palace: PalaceName;
  };

  starSpirits: StarSpirit[];
  aspects: Aspect[];
  dignities: Record<GovernorOrRemainder, Dignity>;
}

// ── Functions ────────────────────────────────────────────────

/** Main entry point: compute a complete 七政四餘 natal chart */
function getSevenGovernorsChart(
  date: Date,
  location: { lat: number; lon: number },
  options?: SevenGovernorsOptions,
): SevenGovernorsChart;

/** Convert tropical longitude to sidereal */
function toSiderealLongitude(
  tropicalLon: number,
  date: Date,
  mode?: SiderealMode,
): number;

/** Individual Four Remainder positions (sidereal longitude) */
function getRahuPosition(date: Date): { longitude: number; latitude: number };
function getKetuPosition(date: Date, mode?: KetuMode): { longitude: number; latitude: number };
function getYuebeiPosition(date: Date): { longitude: number; latitude: number };
function getPurpleQiPosition(date: Date): { longitude: number; latitude: number };
```

---

## Data Requirements

### Determinative Star Catalogue (`mansion-boundaries.ts`)

A table of 28 entries, one per mansion:

```typescript
interface MansionBoundary {
  name: MansionName;
  determinativeStar: string;       // e.g. 'α Vir' (Spica)
  hipparcos: number;               // HIP catalogue number
  j2000RaH: number;                // RA hours at J2000.0
  j2000RaM: number;                // RA minutes
  j2000DecDeg: number;             // Dec degrees at J2000.0
  j2000EclLon: number;             // Ecliptic longitude at J2000.0 (degrees)
  properMotionRa: number;          // mas/yr
  properMotionDec: number;         // mas/yr
  widthDeg: number;                // angular width of this mansion (degrees)
}
```

Source: cross-reference historical Chinese star identifications (Pan Nai 潘鼐 《中國恆星觀測史》) with Hipparcos catalogue data.

### Star Spirits Table (`star-spirits.ts`)

Structured lookup from 《果老星宗》. Estimated 40-80 named spirits with activation conditions.

### Dignity Table (`dignity.ts`)

11 bodies × 12 palaces = 132 entries, each mapping to one of 廟/旺/平/陷.

### Aspect Definitions (`aspects.ts`)

Named configurations with their geometric conditions and interpretive meaning.

---

## Relationship to Existing Code

| Existing module | How Phase 2 uses it |
|-----------------|---------------------|
| `getPlanetPosition(planet, date)` | Tropical positions for all 7 governors |
| `getMoonPosition(date)` | Moon's tropical longitude + internal parameters for node/apogee |
| `getSunLongitude(jde)` | Sun's longitude for ascendant calculation |
| `LUNAR_MANSIONS[]` | **Not directly used** — the existing array is the daily cycle (JD-based), not sidereal positional boundaries. Both systems coexist. |
| `julianDayNumber()`, `deltaT()` | Time conversions |
| `types.ts` Branch type | Palace names use Earthly Branches |

**New exports added to `src/index.ts`**:
- `getSevenGovernorsChart`
- `toSiderealLongitude`
- `getRahuPosition`, `getKetuPosition`, `getYuebeiPosition`, `getPurpleQiPosition`
- All new types

---

## Testing Strategy

### Unit Tests

1. **Sidereal conversion**: Verify that Spica (α Vir) maps to 角宿 0° in modern mode. Test all three modes produce plausible results.

2. **Four Remainders**:
   - 羅睺: Compare against JPL lunar node data (we can query JPL Horizons for the Moon's node longitude at known dates)
   - 計都/月孛: Compare against JPL lunar apogee data or Swiss Ephemeris lunar apogee
   - 紫氣: Verify against classical table values from 《果老星宗》; verify period matches documented ~28 years

3. **Mansion mapping**: Known sidereal longitude → expected mansion. Test boundary cases (longitude at exact mansion boundary).

4. **Palace mapping**: Known mansion → expected palace. Test the full 28→12 mapping.

5. **Ascendant**: Known birth date/time/location → expected 命宮. Use published chart examples from 七政四餘 reference books.

6. **Star spirits**: Lookup correctness against source text entries.

7. **Aspects**: Known body positions → expected aspect list.

8. **Dignity**: Known body-in-palace → expected dignity level.

### Integration / Snapshot Tests

- Complete chart generation for 3-5 known birth charts from published 七政四餘 references
- Compare palace placements, ascendant, and key interpretive elements
- Snapshot the full `SevenGovernorsChart` output for regression testing

### Validation

- Cross-reference sidereal positions against MOIRA software (果老星宗七政四余排盘软件) output for the same birth data, if available

---

## Research: 紫氣 Astronomical Basis

Alongside implementation, investigate the classical formula:

1. Extract λ₀ (epoch longitude) and P (period) from 《果老星宗》 / 《大統曆》
2. Compute exact period P to 6+ significant figures
3. Test candidates:
   - Saturn orbital period: 29.4571 years
   - Jupiter-Saturn synodic half-cycle: 9.93 years (not close)
   - Metonic remainder accumulation: 19-year cycle beats
   - Lunisolar intercalary cycle: 7 leap months per 19 years → remainders over ~28 years
4. If a match is found within 0.1%, document the connection and optionally offer an `astronomical` computation mode for 紫氣
5. Document findings in `docs/research/` regardless of outcome

---

## Out of Scope

- CLI rendering (Phase 7)
- Color / ASCII chart display (Phase 7)
- Tropical Western astrology (Phase 3)
- Sidereal/Jyotish astrology (Phase 4)
- Transits, progressions, or time-lord techniques
- Horary 七政四餘 (only natal charts in this phase)
