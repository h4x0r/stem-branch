# Seven Governors Four Remainders (七政四餘) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the complete 七政四餘 Chinese sidereal astrology system — sidereal positions for 11 bodies, 28-mansion mapping, 12-palace chart with ascendant, star spirits, aspects, and dignity.

**Architecture:** Three-layer stack: (1) sidereal engine converting tropical→sidereal longitude with 3 configurable modes, (2) Four Remainders computation (astronomical for 3, classical formula for 紫氣), (3) chart assembly orchestrating positions→mansions→palaces→interpretive layers. All new code in `src/seven-governors/` directory.

**Tech Stack:** TypeScript, vitest, existing VSOP87D/ELP planetary engine

**Spec:** `docs/superpowers/specs/2026-03-23-seven-governors-four-remainders-design.md`

---

## File Structure

```
src/seven-governors/
  index.ts                  # Public API re-exports
  types.ts                  # All new types for this module
  sidereal.ts               # Tropical → sidereal longitude conversion (3 modes)
  four-remainders.ts        # 羅睺, 計都, 月孛, 紫氣 position computation
  mansion-mapper.ts         # Sidereal longitude → mansion lookup
  palace-mapper.ts          # Sidereal longitude → palace lookup
  ascendant.ts              # 命宮 calculation from birth time/location
  chart.ts                  # Chart assembly orchestration
  data/
    mansion-boundaries.ts   # 28 determinative star sidereal degree boundaries
    palace-boundaries.ts    # 12 palace sidereal degree boundaries
    star-spirits.ts         # 神煞 lookup tables (《果老星宗》)
    dignity.ts              # 廟/旺/平/陷 tables per body per palace
    aspects.ts              # 合/沖/刑/三合 definitions

tests/
  seven-governors/
    sidereal.test.ts
    four-remainders.test.ts
    mansion-mapper.test.ts
    palace-mapper.test.ts
    ascendant.test.ts
    star-spirits.test.ts
    dignity.test.ts
    aspects.test.ts
    chart.test.ts           # Integration / snapshot tests
```

**Existing files to modify:**
- `src/index.ts` — add re-exports for new public API
- `src/types.ts` — no changes (Planet type stays as-is; Sun/Moon use dedicated functions)

---

### Task 1: Types and Module Scaffold

**Files:**
- Create: `src/seven-governors/types.ts`
- Create: `src/seven-governors/index.ts` (empty re-export stub)
- Test: `tests/seven-governors/types.test.ts`

All type definitions from the spec. No runtime logic yet — just types, which downstream tasks import.

- [ ] **Step 1: Create the types file**

```typescript
// src/seven-governors/types.ts

// ── Body identifiers ─────────────────────────────────────────

export type Governor = 'sun' | 'moon' | 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn';
export type Remainder = 'rahu' | 'ketu' | 'yuebei' | 'purpleQi';
export type GovernorOrRemainder = Governor | Remainder;

export const GOVERNORS: readonly Governor[] = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];
export const REMAINDERS: readonly Remainder[] = ['rahu', 'ketu', 'yuebei', 'purpleQi'];
export const ALL_BODIES: readonly GovernorOrRemainder[] = [...GOVERNORS, ...REMAINDERS];

// ── Chinese names ────────────────────────────────────────────

export const BODY_CHINESE: Record<GovernorOrRemainder, string> = {
  sun: '太陽', moon: '太陰',
  mercury: '水星', venus: '金星', mars: '火星', jupiter: '木星', saturn: '土星',
  rahu: '羅睺', ketu: '計都', yuebei: '月孛', purpleQi: '紫氣',
};

// ── Sidereal mode ────────────────────────────────────────────

export type SiderealMode =
  | { type: 'modern' }
  | { type: 'classical'; epoch: 'kaiyuan' | 'chongzhen' | number }
  | { type: 'ayanamsa'; value: number };

export type KetuMode = 'apogee' | 'descending-node';

// ── Mansion and Palace names ─────────────────────────────────

export type MansionName =
  | '角' | '亢' | '氐' | '房' | '心' | '尾' | '箕'
  | '斗' | '牛' | '女' | '虛' | '危' | '室' | '壁'
  | '奎' | '婁' | '胃' | '昴' | '畢' | '觜' | '參'
  | '井' | '鬼' | '柳' | '星' | '張' | '翼' | '軫';

export type PalaceName =
  | '子宮' | '丑宮' | '寅宮' | '卯宮' | '辰宮' | '巳宮'
  | '午宮' | '未宮' | '申宮' | '酉宮' | '戌宮' | '亥宮';

export type PalaceRole =
  | '命宮' | '財帛宮' | '兄弟宮' | '田宅宮' | '男女宮' | '奴僕宮'
  | '妻妾宮' | '疾厄宮' | '遷移宮' | '官祿宮' | '福德宮' | '相貌宮';

export const PALACE_ROLES: readonly PalaceRole[] = [
  '命宮', '兄弟宮', '妻妾宮', '男女宮', '財帛宮', '疾厄宮',
  '遷移宮', '奴僕宮', '官祿宮', '田宅宮', '福德宮', '相貌宮',
];

export type Dignity = '廟' | '旺' | '平' | '陷';
export type AspectType = '合' | '沖' | '刑' | '三合';

// ── Position output ──────────────────────────────────────────

export interface BodyPosition {
  siderealLon: number;
  tropicalLon: number;
  mansion: MansionName;
  mansionDegree: number;
  palace: PalaceName;
}

// ── Chart structures ─────────────────────────────────────────

export interface PalaceInfo {
  name: PalaceName;
  role: PalaceRole;
  mansions: MansionName[];
  occupants: GovernorOrRemainder[];
}

export interface StarSpirit {
  name: string;
  type: 'auspicious' | 'malefic';
  condition: string;
  source: string;
}

export interface Aspect {
  body1: GovernorOrRemainder;
  body2: GovernorOrRemainder;
  type: AspectType;
  name?: string;
}

export interface SevenGovernorsOptions {
  siderealMode?: SiderealMode;
  ketuMode?: KetuMode;
}

export interface SevenGovernorsChart {
  date: Date;
  location: { lat: number; lon: number };
  siderealMode: SiderealMode;
  ketuMode: KetuMode;
  bodies: Record<GovernorOrRemainder, BodyPosition>;
  palaces: PalaceInfo[];
  ascendant: { mansion: MansionName; palace: PalaceName };
  starSpirits: StarSpirit[];
  aspects: Aspect[];
  dignities: Record<GovernorOrRemainder, Dignity>;
}
```

- [ ] **Step 2: Create the index stub**

```typescript
// src/seven-governors/index.ts
export * from './types';
```

- [ ] **Step 3: Write a type-checking test**

```typescript
// tests/seven-governors/types.test.ts
import { describe, it, expect } from 'vitest';
import { GOVERNORS, REMAINDERS, ALL_BODIES, BODY_CHINESE, PALACE_ROLES } from '../../src/seven-governors';

describe('seven-governors types', () => {
  it('has 7 governors', () => {
    expect(GOVERNORS).toHaveLength(7);
  });

  it('has 4 remainders', () => {
    expect(REMAINDERS).toHaveLength(4);
  });

  it('ALL_BODIES has 11 entries', () => {
    expect(ALL_BODIES).toHaveLength(11);
  });

  it('every body has a Chinese name', () => {
    for (const body of ALL_BODIES) {
      expect(BODY_CHINESE[body]).toBeTruthy();
    }
  });

  it('has 12 palace roles', () => {
    expect(PALACE_ROLES).toHaveLength(12);
  });
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/seven-governors/types.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/seven-governors/types.ts src/seven-governors/index.ts tests/seven-governors/types.test.ts
git commit -m "feat(seven-governors): add types and module scaffold"
```

---

### Task 2: Sidereal Engine

**Files:**
- Create: `src/seven-governors/sidereal.ts`
- Modify: `src/seven-governors/index.ts` — add re-export
- Test: `tests/seven-governors/sidereal.test.ts`

Converts tropical ecliptic longitude → sidereal longitude. Three modes: modern (Spica-anchored precession), classical (epoch-fixed), ayanamsa (fixed offset).

**Key dependency:** `precessionInLongitude(T)` from `src/astro.ts` — already exists, returns accumulated precession in arcseconds from J2000.0.

**Modern mode algorithm:**
- Spica's tropical longitude at J2000.0 ≈ 201.2983° (known from Hipparcos)
- Spica's sidereal longitude should be 0° (start of 角宿)
- Ayanamsa at J2000.0 = 201.2983° − 0° = 201.2983° (this is the Spica-定 ayanamsa)
- For any date: ayanamsa(date) = Spica_J2000_tropical + precession(T)/3600 − 0°
- Sidereal longitude = tropical longitude − ayanamsa(date), normalized to [0, 360)

Actually, more precisely: the ayanamsa is the tropical longitude of the sidereal origin. At any date, the sidereal origin (角宿 0°) has a tropical longitude equal to Spica's current tropical position. Spica drifts due to precession — at epoch J2000.0 its tropical longitude is ~201.298°. At another date, precession shifts all star positions, so we need to track Spica's tropical longitude at that date.

Simplified: `siderealLon = tropicalLon - spicaTropicalLon(date)`, where `spicaTropicalLon(date) = SPICA_J2000_LON + precession(T) / 3600`.

Wait — precessionInLongitude already accounts for the shift in the equinox. Spica's ecliptic longitude increases by the precession amount. So:

```
spicaTropicalLon(T) = SPICA_J2000_LON + precession(T) / 3600
ayanamsa(T) = spicaTropicalLon(T)   // since Spica = 0° sidereal
siderealLon = (tropicalLon - ayanamsa(T) + 360) % 360
```

- [ ] **Step 1: Write the failing test**

```typescript
// tests/seven-governors/sidereal.test.ts
import { describe, it, expect } from 'vitest';
import { toSiderealLongitude } from '../../src/seven-governors';

describe('toSiderealLongitude', () => {
  // Spica (α Vir) tropical longitude at J2000.0 ≈ 201.298°
  // In modern mode, Spica should map to sidereal 0° (角宿 start)
  const j2000 = new Date('2000-01-01T12:00:00Z');

  describe('modern mode (default)', () => {
    it('Spica tropical lon → sidereal ~0°', () => {
      // Spica at J2000.0: tropical ≈ 201.298°
      const sid = toSiderealLongitude(201.298, j2000);
      expect(sid).toBeCloseTo(0, 0); // within ~1°
    });

    it('tropical 0° → sidereal value depends on precession', () => {
      const sid = toSiderealLongitude(0, j2000);
      // 0° tropical should be about 360 - 201.298 = 158.7° sidereal
      expect(sid).toBeCloseTo(158.7, 0);
    });

    it('wraps around correctly', () => {
      // A tropical longitude just below Spica should give sidereal ~359°
      const sid = toSiderealLongitude(201.0, j2000);
      expect(sid).toBeGreaterThan(358);
      expect(sid).toBeLessThan(361);
    });

    it('precession shifts sidereal origin over time', () => {
      // 100 years later, precession ≈ 1.397° more
      const y2100 = new Date('2100-01-01T12:00:00Z');
      const sid2000 = toSiderealLongitude(201.298, j2000);
      const sid2100 = toSiderealLongitude(201.298, y2100);
      // Same tropical lon should have a lower sidereal lon 100 years later
      // because the ayanamsa increased by ~1.4°
      expect(sid2100).toBeLessThan(sid2000);
      expect(sid2000 - sid2100).toBeCloseTo(1.397, 0);
    });
  });

  describe('classical mode', () => {
    it('kaiyuan epoch freezes precession at 724 CE', () => {
      // In classical mode, ayanamsa is fixed at the epoch value
      const sid = toSiderealLongitude(201.298, j2000, { type: 'classical', epoch: 'kaiyuan' });
      // Kaiyuan (724 CE) is ~1276 years before J2000
      // Precession is ~50.3"/yr → ~1276 * 50.3 / 3600 ≈ 17.8° less ayanamsa
      // So sidereal lon should be ~17.8° higher than modern mode at J2000
      expect(sid).toBeGreaterThan(15);
      expect(sid).toBeLessThan(20);
    });
  });

  describe('ayanamsa mode', () => {
    it('subtracts fixed offset', () => {
      const sid = toSiderealLongitude(100, j2000, { type: 'ayanamsa', value: 24.0 });
      expect(sid).toBeCloseTo(76.0, 6);
    });

    it('wraps negative values', () => {
      const sid = toSiderealLongitude(10, j2000, { type: 'ayanamsa', value: 24.0 });
      expect(sid).toBeCloseTo(346.0, 6);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/seven-governors/sidereal.test.ts`
Expected: FAIL — `toSiderealLongitude` not found

- [ ] **Step 3: Implement sidereal engine**

```typescript
// src/seven-governors/sidereal.ts
import { dateToJulianCenturies, precessionInLongitude } from '../astro';
import type { SiderealMode } from './types';

/**
 * Spica (α Vir) tropical ecliptic longitude at J2000.0 epoch.
 * Source: Hipparcos catalogue (HIP 65474).
 * This defines sidereal 0° = start of 角宿 (Horn mansion).
 */
const SPICA_J2000_LON = 201.2983;

/**
 * Named classical epochs as Julian years.
 * Used for 'classical' sidereal mode — freezes precession at the epoch.
 */
const CLASSICAL_EPOCHS: Record<string, number> = {
  kaiyuan: 724.0,    // 開元 (Tang dynasty, 724 CE)
  chongzhen: 1628.0, // 崇禎 (late Ming dynasty, 1628 CE)
};

/** Normalize angle to [0, 360) */
function normDeg(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/**
 * Compute the ayanamsa (tropical longitude of sidereal origin) at Julian centuries T.
 * Uses Spica as the anchor: sidereal 0° = Spica's ecliptic longitude.
 */
function modernAyanamsa(T: number): number {
  const precessionDeg = precessionInLongitude(T) / 3600;
  return SPICA_J2000_LON + precessionDeg;
}

/**
 * Compute ayanamsa for a classical epoch (frozen precession).
 */
function classicalAyanamsa(epochYear: number): number {
  // Convert epoch year to Julian centuries from J2000.0
  const T = (epochYear - 2000.0) / 100.0;
  return modernAyanamsa(T);
}

/**
 * Convert tropical ecliptic longitude to sidereal longitude.
 *
 * @param tropicalLon - Tropical ecliptic longitude in degrees [0, 360)
 * @param date - Date for precession computation
 * @param mode - Sidereal reference frame mode (default: modern)
 * @returns Sidereal longitude in degrees [0, 360)
 */
export function toSiderealLongitude(
  tropicalLon: number,
  date: Date,
  mode: SiderealMode = { type: 'modern' },
): number {
  let ayanamsa: number;

  switch (mode.type) {
    case 'modern': {
      const T = dateToJulianCenturies(date);
      ayanamsa = modernAyanamsa(T);
      break;
    }
    case 'classical': {
      const epochYear = typeof mode.epoch === 'number'
        ? mode.epoch
        : CLASSICAL_EPOCHS[mode.epoch];
      ayanamsa = classicalAyanamsa(epochYear);
      break;
    }
    case 'ayanamsa': {
      ayanamsa = mode.value;
      break;
    }
  }

  return normDeg(tropicalLon - ayanamsa);
}
```

- [ ] **Step 4: Update index.ts re-exports**

Add to `src/seven-governors/index.ts`:
```typescript
export { toSiderealLongitude } from './sidereal';
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/seven-governors/sidereal.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 6: Commit**

```bash
git add src/seven-governors/sidereal.ts src/seven-governors/index.ts tests/seven-governors/sidereal.test.ts
git commit -m "feat(seven-governors): sidereal engine with 3 configurable modes"
```

---

### Task 3: Mansion Boundary Data

**Files:**
- Create: `src/seven-governors/data/mansion-boundaries.ts`
- Test: `tests/seven-governors/mansion-mapper.test.ts` (data validation portion)

The 28 lunar mansions have unequal angular widths. Each mansion's start boundary is defined by its determinative star's (距星) sidereal ecliptic longitude. The data table maps each mansion name to its starting sidereal degree.

**Data source:** Cross-reference Pan Nai (潘鼐《中國恆星觀測史》) identifications with Hipparcos J2000.0 ecliptic longitudes. The boundaries are defined in the sidereal frame (Spica = 0°).

**Important:** The mansion boundaries are constant in the sidereal frame (by definition — they're anchored to the stars). The sidereal engine handles the conversion from tropical. So this table is just fixed degree values.

- [ ] **Step 1: Research and create mansion boundary table**

The implementer must source the 28 mansion widths from astronomical literature. Standard references:
- Pan Nai (潘鼐), 《中國恆星觀測史》
- Sun Xiaochun & Kistemaker, *The Chinese Sky During the Han* (Brill, 1997)
- Ho Peng Yoke, *The Astronomical Chapters of the Chin Shu*

Each entry: mansion name, determinative star ID, sidereal ecliptic longitude at J2000.0 (relative to Spica = 0°).

```typescript
// src/seven-governors/data/mansion-boundaries.ts
import type { MansionName } from '../types';

export interface MansionBoundary {
  /** Mansion name (single character) */
  name: MansionName;
  /** Determinative star Western designation */
  star: string;
  /** Hipparcos catalogue number */
  hip: number;
  /** Start of this mansion: sidereal ecliptic longitude (degrees), Spica = 0° */
  startDeg: number;
}

/**
 * 28 lunar mansion sidereal boundaries, ordered by increasing sidereal longitude.
 *
 * Sidereal reference: Spica (α Vir) = 0° = start of 角宿.
 * Boundaries based on determinative star (距星) positions at J2000.0
 * in the Spica-anchored sidereal frame.
 *
 * Sources:
 * - Pan Nai (潘鼐), 《中國恆星觀測史》 (star identifications)
 * - Hipparcos catalogue (J2000.0 ecliptic longitudes)
 * - Sun Xiaochun & Kistemaker, *The Chinese Sky During the Han* (cross-validation)
 */
export const MANSION_BOUNDARIES: readonly MansionBoundary[] = [
  // ── 東方青龍 (Eastern Azure Dragon) ──
  { name: '角', star: 'α Vir',  hip: 65474, startDeg: 0.000 },    // Spica
  { name: '亢', star: 'κ Vir',  hip: 69427, startDeg: 12.00 },
  { name: '氐', star: 'α Lib',  hip: 72622, startDeg: 28.00 },
  { name: '房', star: 'π Sco',  hip: 78265, startDeg: 33.00 },
  { name: '心', star: 'σ Sco',  hip: 78820, startDeg: 38.00 },
  { name: '尾', star: 'μ Sco',  hip: 82514, startDeg: 44.50 },
  { name: '箕', star: 'γ Sgr',  hip: 89642, startDeg: 62.50 },
  // ── 北方玄武 (Northern Black Tortoise) ──
  { name: '斗', star: 'φ Sgr',  hip: 92041, startDeg: 73.50 },
  { name: '牛', star: 'β Cap',  hip: 100345, startDeg: 99.50 },
  { name: '女', star: 'ε Aqr',  hip: 102618, startDeg: 107.00 },
  { name: '虛', star: 'β Aqr',  hip: 106278, startDeg: 119.00 },
  { name: '危', star: 'α Aqr',  hip: 109074, startDeg: 129.00 },
  { name: '室', star: 'α Peg',  hip: 113963, startDeg: 145.50 },
  { name: '壁', star: 'γ Peg',  hip: 677,    startDeg: 161.50 },
  // ── 西方白虎 (Western White Tiger) ──
  { name: '奎', star: 'η And',  hip: 5447,   startDeg: 170.50 },
  { name: '婁', star: 'β Ari',  hip: 9132,   startDeg: 186.50 },
  { name: '胃', star: '35 Ari', hip: 12390,  startDeg: 198.50 },
  { name: '昴', star: '17 Tau', hip: 17499,  startDeg: 210.00 },
  { name: '畢', star: 'ε Tau',  hip: 20889,  startDeg: 221.00 },
  { name: '觜', star: 'λ Ori',  hip: 26207,  startDeg: 237.50 },
  { name: '參', star: 'δ Ori',  hip: 25930,  startDeg: 240.00 },
  // ── 南方朱雀 (Southern Vermillion Bird) ──
  { name: '井', star: 'μ Gem',  hip: 30343,  startDeg: 261.00 },
  { name: '鬼', star: 'θ Cnc',  hip: 41822,  startDeg: 294.00 },
  { name: '柳', star: 'δ Hya',  hip: 42313,  startDeg: 298.00 },
  { name: '星', star: 'α Hya',  hip: 46390,  startDeg: 313.00 },
  { name: '張', star: 'υ¹ Hya', hip: 48356,  startDeg: 320.00 },
  { name: '翼', star: 'α Crt',  hip: 53740,  startDeg: 332.00 },
  { name: '軫', star: 'γ Crv',  hip: 59316,  startDeg: 350.00 },
];
```

**Note to implementer:** The `startDeg` values above are approximate placeholders derived from rough ecliptic coordinate conversion. You MUST verify each value by:
1. Looking up each HIP star's ecliptic longitude in the Hipparcos catalogue
2. Subtracting Spica's ecliptic longitude (201.298° at J2000.0) to get the sidereal value
3. Normalizing to [0, 360)
4. Cross-referencing against published mansion widths from Pan Nai or Sun & Kistemaker

A validation script `scripts/verify-mansion-boundaries.mjs` should be created to automate this check against a star catalogue.

- [ ] **Step 2: Write data validation test**

```typescript
// tests/seven-governors/mansion-mapper.test.ts (first portion — data validation)
import { describe, it, expect } from 'vitest';
import { MANSION_BOUNDARIES } from '../../src/seven-governors/data/mansion-boundaries';

describe('mansion boundary data', () => {
  it('has exactly 28 entries', () => {
    expect(MANSION_BOUNDARIES).toHaveLength(28);
  });

  it('starts with 角 at 0°', () => {
    expect(MANSION_BOUNDARIES[0].name).toBe('角');
    expect(MANSION_BOUNDARIES[0].startDeg).toBe(0);
  });

  it('is sorted by ascending startDeg', () => {
    for (let i = 1; i < MANSION_BOUNDARIES.length; i++) {
      expect(
        MANSION_BOUNDARIES[i].startDeg,
        `${MANSION_BOUNDARIES[i].name} should be after ${MANSION_BOUNDARIES[i - 1].name}`,
      ).toBeGreaterThan(MANSION_BOUNDARIES[i - 1].startDeg);
    }
  });

  it('all boundaries are in [0, 360)', () => {
    for (const m of MANSION_BOUNDARIES) {
      expect(m.startDeg).toBeGreaterThanOrEqual(0);
      expect(m.startDeg).toBeLessThan(360);
    }
  });

  it('has unique mansion names', () => {
    const names = MANSION_BOUNDARIES.map(m => m.name);
    expect(new Set(names).size).toBe(28);
  });

  it('every entry has a Hipparcos ID', () => {
    for (const m of MANSION_BOUNDARIES) {
      expect(m.hip).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 3: Run test**

Run: `npx vitest run tests/seven-governors/mansion-mapper.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 4: Commit**

```bash
git add src/seven-governors/data/mansion-boundaries.ts tests/seven-governors/mansion-mapper.test.ts
git commit -m "feat(seven-governors): 28 mansion sidereal boundary data"
```

---

### Task 4: Mansion Mapper

**Files:**
- Create: `src/seven-governors/mansion-mapper.ts`
- Modify: `src/seven-governors/index.ts` — add re-export
- Test: `tests/seven-governors/mansion-mapper.test.ts` (append mapping tests)

Binary search on sorted boundaries to find which mansion a sidereal longitude falls in.

- [ ] **Step 1: Add mapping tests to existing test file**

Append to `tests/seven-governors/mansion-mapper.test.ts`:

```typescript
import { getMansionForLongitude } from '../../src/seven-governors';

describe('getMansionForLongitude', () => {
  it('0° → 角 (first mansion)', () => {
    const result = getMansionForLongitude(0);
    expect(result.name).toBe('角');
    expect(result.degree).toBeCloseTo(0, 6);
  });

  it('6° → 角 (middle of first mansion)', () => {
    const result = getMansionForLongitude(6);
    expect(result.name).toBe('角');
    expect(result.degree).toBeCloseTo(6, 6);
  });

  it('12° → 亢 (second mansion start)', () => {
    const result = getMansionForLongitude(12);
    expect(result.name).toBe('亢');
    expect(result.degree).toBeCloseTo(0, 6);
  });

  it('359° → 軫 (last mansion, wraps around)', () => {
    const result = getMansionForLongitude(359);
    expect(result.name).toBe('軫');
    expect(result.degree).toBeCloseTo(9, 0); // 359 - 350 = 9°
  });

  it('returns correct degree within mansion', () => {
    // 100° is in 牛 (starts at 99.5°)
    const result = getMansionForLongitude(100);
    expect(result.name).toBe('牛');
    expect(result.degree).toBeCloseTo(0.5, 1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/seven-governors/mansion-mapper.test.ts`
Expected: FAIL — `getMansionForLongitude` not found

- [ ] **Step 3: Implement mansion mapper**

```typescript
// src/seven-governors/mansion-mapper.ts
import type { MansionName } from './types';
import { MANSION_BOUNDARIES } from './data/mansion-boundaries';

export interface MansionResult {
  /** Mansion name */
  name: MansionName;
  /** Degrees into this mansion (0 = mansion start) */
  degree: number;
  /** Index in MANSION_BOUNDARIES array (0-27) */
  index: number;
}

/**
 * Find which of the 28 lunar mansions a sidereal longitude falls in.
 *
 * Uses binary search on the sorted boundary table. Handles wrap-around
 * (longitude > last boundary → falls in the last mansion).
 *
 * @param siderealLon - Sidereal ecliptic longitude in degrees [0, 360)
 * @returns Mansion name and degree within mansion
 */
export function getMansionForLongitude(siderealLon: number): MansionResult {
  // Normalize to [0, 360)
  const lon = ((siderealLon % 360) + 360) % 360;

  // Binary search for the last boundary ≤ lon
  let lo = 0;
  let hi = MANSION_BOUNDARIES.length - 1;

  // If lon < first boundary (shouldn't happen since 角 starts at 0°, but handle wrap)
  if (lon < MANSION_BOUNDARIES[0].startDeg) {
    const last = MANSION_BOUNDARIES.length - 1;
    return {
      name: MANSION_BOUNDARIES[last].name,
      degree: lon + 360 - MANSION_BOUNDARIES[last].startDeg,
      index: last,
    };
  }

  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (MANSION_BOUNDARIES[mid].startDeg <= lon) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }

  return {
    name: MANSION_BOUNDARIES[lo].name,
    degree: lon - MANSION_BOUNDARIES[lo].startDeg,
    index: lo,
  };
}
```

- [ ] **Step 4: Update index.ts**

Add to `src/seven-governors/index.ts`:
```typescript
export { getMansionForLongitude } from './mansion-mapper';
export type { MansionResult } from './mansion-mapper';
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run tests/seven-governors/mansion-mapper.test.ts`
Expected: PASS (11 tests — 6 data + 5 mapping)

- [ ] **Step 6: Commit**

```bash
git add src/seven-governors/mansion-mapper.ts src/seven-governors/index.ts tests/seven-governors/mansion-mapper.test.ts
git commit -m "feat(seven-governors): mansion mapper with binary search lookup"
```

---

### Task 5: Palace Boundary Data and Mapper

**Files:**
- Create: `src/seven-governors/data/palace-boundaries.ts`
- Create: `src/seven-governors/palace-mapper.ts`
- Modify: `src/seven-governors/index.ts`
- Test: `tests/seven-governors/palace-mapper.test.ts`

The 12 palaces divide the sidereal ecliptic into 12 segments of 30° each (equal division, unlike the unequal mansions). Palace assignment is by sidereal degree, not by mansion name.

- [ ] **Step 1: Create palace boundary data**

```typescript
// src/seven-governors/data/palace-boundaries.ts
import type { PalaceName, MansionName } from '../types';

export interface PalaceBoundary {
  name: PalaceName;
  /** Start sidereal longitude (inclusive) */
  startDeg: number;
  /** End sidereal longitude (exclusive) */
  endDeg: number;
  /** Mansions that fall primarily within this palace (for display) */
  mansions: MansionName[];
}

/**
 * 12 palace sidereal degree boundaries.
 *
 * Standard 七政四餘 equal-division: each palace spans 30°.
 * The palaces are named by Earthly Branches, starting from 辰宮 at 0°
 * (角宿/Spica marks the start of 辰宮 in the traditional arrangement).
 *
 * Source: 《果老星宗》 standard palace layout.
 */
export const PALACE_BOUNDARIES: readonly PalaceBoundary[] = [
  { name: '辰宮', startDeg: 0,   endDeg: 30,  mansions: ['角', '亢'] },
  { name: '卯宮', startDeg: 30,  endDeg: 60,  mansions: ['氐', '房', '心'] },
  { name: '寅宮', startDeg: 60,  endDeg: 90,  mansions: ['尾', '箕'] },
  { name: '丑宮', startDeg: 90,  endDeg: 120, mansions: ['斗', '牛'] },
  { name: '子宮', startDeg: 120, endDeg: 150, mansions: ['女', '虛', '危'] },
  { name: '亥宮', startDeg: 150, endDeg: 180, mansions: ['室', '壁'] },
  { name: '戌宮', startDeg: 180, endDeg: 210, mansions: ['奎', '婁', '胃'] },
  { name: '酉宮', startDeg: 210, endDeg: 240, mansions: ['昴', '畢'] },
  { name: '申宮', startDeg: 240, endDeg: 270, mansions: ['觜', '參'] },
  { name: '未宮', startDeg: 270, endDeg: 300, mansions: ['井', '鬼'] },
  { name: '午宮', startDeg: 300, endDeg: 330, mansions: ['柳', '星', '張'] },
  { name: '巳宮', startDeg: 330, endDeg: 360, mansions: ['翼', '軫'] },
];
```

**Note to implementer:** The starting palace (辰宮 at 0°) and the order follow the traditional 七政四餘 convention where 辰 corresponds to the Azure Dragon / 角宿 direction. Verify this against 《果老星宗》 — some traditions start with a different palace at 0°. The mansion-to-palace assignments listed are approximate; since mansion widths are unequal, some mansions span palace boundaries. The degree-based lookup handles this correctly.

- [ ] **Step 2: Create palace mapper**

```typescript
// src/seven-governors/palace-mapper.ts
import type { PalaceName } from './types';
import { PALACE_BOUNDARIES } from './data/palace-boundaries';

export interface PalaceResult {
  name: PalaceName;
  degree: number;  // degrees into this palace
  index: number;   // index in PALACE_BOUNDARIES
}

/**
 * Find which of the 12 palaces a sidereal longitude falls in.
 *
 * Each palace spans exactly 30° of sidereal longitude.
 *
 * @param siderealLon - Sidereal ecliptic longitude in degrees [0, 360)
 */
export function getPalaceForLongitude(siderealLon: number): PalaceResult {
  const lon = ((siderealLon % 360) + 360) % 360;
  const index = Math.floor(lon / 30);
  const palace = PALACE_BOUNDARIES[index];
  return {
    name: palace.name,
    degree: lon - palace.startDeg,
    index,
  };
}
```

- [ ] **Step 3: Write tests**

```typescript
// tests/seven-governors/palace-mapper.test.ts
import { describe, it, expect } from 'vitest';
import { PALACE_BOUNDARIES } from '../../src/seven-governors/data/palace-boundaries';
import { getPalaceForLongitude } from '../../src/seven-governors/palace-mapper';

describe('palace boundary data', () => {
  it('has exactly 12 entries', () => {
    expect(PALACE_BOUNDARIES).toHaveLength(12);
  });

  it('covers full 360° without gaps', () => {
    for (let i = 0; i < PALACE_BOUNDARIES.length; i++) {
      expect(PALACE_BOUNDARIES[i].startDeg).toBe(i * 30);
      expect(PALACE_BOUNDARIES[i].endDeg).toBe((i + 1) * 30);
    }
  });

  it('has unique palace names', () => {
    const names = PALACE_BOUNDARIES.map(p => p.name);
    expect(new Set(names).size).toBe(12);
  });
});

describe('getPalaceForLongitude', () => {
  it('0° → 辰宮 (first palace)', () => {
    expect(getPalaceForLongitude(0).name).toBe('辰宮');
  });

  it('15° → 辰宮, degree 15', () => {
    const r = getPalaceForLongitude(15);
    expect(r.name).toBe('辰宮');
    expect(r.degree).toBeCloseTo(15, 6);
  });

  it('30° → 卯宮', () => {
    expect(getPalaceForLongitude(30).name).toBe('卯宮');
  });

  it('120° → 子宮', () => {
    expect(getPalaceForLongitude(120).name).toBe('子宮');
  });

  it('350° → 巳宮', () => {
    const r = getPalaceForLongitude(350);
    expect(r.name).toBe('巳宮');
    expect(r.degree).toBeCloseTo(20, 6);
  });

  it('handles values near 360°', () => {
    expect(getPalaceForLongitude(359.99).name).toBe('巳宮');
  });
});
```

- [ ] **Step 4: Update index.ts**

Add to `src/seven-governors/index.ts`:
```typescript
export { getPalaceForLongitude } from './palace-mapper';
export type { PalaceResult } from './palace-mapper';
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run tests/seven-governors/palace-mapper.test.ts`
Expected: PASS (9 tests)

- [ ] **Step 6: Commit**

```bash
git add src/seven-governors/data/palace-boundaries.ts src/seven-governors/palace-mapper.ts src/seven-governors/index.ts tests/seven-governors/palace-mapper.test.ts
git commit -m "feat(seven-governors): 12-palace boundary data and mapper"
```

---

### Task 6: Four Remainders — Rahu (羅睺)

**Files:**
- Create: `src/seven-governors/four-remainders.ts`
- Test: `tests/seven-governors/four-remainders.test.ts`

Rahu = Moon's mean ascending node. The formula uses the Delaunay argument Ω which already exists in `astro.ts` as `delaunayArgs(T).Om`.

- [ ] **Step 1: Write failing test**

```typescript
// tests/seven-governors/four-remainders.test.ts
import { describe, it, expect } from 'vitest';
import { getRahuPosition } from '../../src/seven-governors';

describe('getRahuPosition (羅睺 — lunar ascending node)', () => {
  it('returns longitude in [0, 360)', () => {
    const pos = getRahuPosition(new Date('2000-01-01T12:00:00Z'));
    expect(pos.longitude).toBeGreaterThanOrEqual(0);
    expect(pos.longitude).toBeLessThan(360);
  });

  it('latitude is 0 (node is on ecliptic by definition)', () => {
    const pos = getRahuPosition(new Date('2000-01-01T12:00:00Z'));
    expect(pos.latitude).toBe(0);
  });

  it('J2000.0 node longitude ≈ 125°', () => {
    // Meeus: mean longitude of ascending node at J2000.0 = 125.0445°
    const pos = getRahuPosition(new Date('2000-01-01T12:00:00Z'));
    expect(pos.longitude).toBeCloseTo(125.04, 0);
  });

  it('moves retrograde (~19.35° per year)', () => {
    const pos2000 = getRahuPosition(new Date('2000-01-01T12:00:00Z'));
    const pos2001 = getRahuPosition(new Date('2001-01-01T12:00:00Z'));
    // Retrograde: 2001 value should be less (or wrapped)
    let diff = pos2000.longitude - pos2001.longitude;
    if (diff < 0) diff += 360;
    expect(diff).toBeCloseTo(19.35, 0);
  });

  it('completes full cycle in ~18.61 years', () => {
    const pos2000 = getRahuPosition(new Date('2000-01-01T12:00:00Z'));
    // ~18.61 years later = 2018-08-11 approximately
    const pos2018 = getRahuPosition(new Date('2018-08-11T00:00:00Z'));
    // Should be close to same longitude (full cycle)
    let diff = Math.abs(pos2000.longitude - pos2018.longitude);
    if (diff > 180) diff = 360 - diff;
    expect(diff).toBeLessThan(5); // within 5°
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/seven-governors/four-remainders.test.ts`
Expected: FAIL — `getRahuPosition` not found

- [ ] **Step 3: Implement Rahu**

```typescript
// src/seven-governors/four-remainders.ts
import { dateToJulianCenturies } from '../astro';

/** Normalize degrees to [0, 360) */
function normDeg(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/**
 * Mean longitude of the Moon's ascending node (Ω).
 * Source: Meeus, Astronomical Algorithms (2nd ed.), Ch. 22.
 *
 * @param T - Julian centuries from J2000.0 (TT)
 * @returns Mean node longitude in degrees [0, 360)
 */
function meanAscendingNode(T: number): number {
  const T2 = T * T;
  const T3 = T2 * T;
  const T4 = T3 * T;
  // Meeus formula (degrees)
  const Om = 125.0445479
    - 1934.1362891 * T
    + 0.0020754 * T2
    + T3 / 467441.0
    - T4 / 60616000.0;
  return normDeg(Om);
}

/**
 * 羅睺 (Rahu) — Moon's mean ascending node.
 * Moves retrograde with 18.61-year period.
 */
export function getRahuPosition(date: Date): { longitude: number; latitude: number } {
  const T = dateToJulianCenturies(date);
  return {
    longitude: meanAscendingNode(T),
    latitude: 0,
  };
}
```

- [ ] **Step 4: Update index.ts**

Add to `src/seven-governors/index.ts`:
```typescript
export { getRahuPosition } from './four-remainders';
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run tests/seven-governors/four-remainders.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 6: Commit**

```bash
git add src/seven-governors/four-remainders.ts src/seven-governors/index.ts tests/seven-governors/four-remainders.test.ts
git commit -m "feat(seven-governors): Rahu (羅睺) lunar ascending node"
```

---

### Task 7: Four Remainders — Ketu (計都) and Yuebei (月孛)

**Files:**
- Modify: `src/seven-governors/four-remainders.ts`
- Modify: `src/seven-governors/index.ts`
- Test: `tests/seven-governors/four-remainders.test.ts` (append)

Ketu = osculating (true) lunar apogee. Yuebei = mean lunar apogee. Both derived from the mean longitude of perigee (ϖ), with Ketu adding periodic perturbation terms.

- [ ] **Step 1: Append failing tests**

Append to `tests/seven-governors/four-remainders.test.ts`:

```typescript
import { getKetuPosition, getYuebeiPosition } from '../../src/seven-governors';

describe('getKetuPosition (計都 — osculating lunar apogee)', () => {
  it('J2000.0 apogee longitude ≈ 83.35° + 180° = 263.35°', () => {
    // Mean perigee at J2000.0 ≈ 83.35°, apogee = perigee + 180°
    const pos = getKetuPosition(new Date('2000-01-01T12:00:00Z'));
    expect(pos.longitude).toBeCloseTo(263.35, -1); // within ~10° due to perturbations
  });

  it('latitude is 0', () => {
    expect(getKetuPosition(new Date('2000-01-01T12:00:00Z')).latitude).toBe(0);
  });

  it('moves prograde (advancing longitude)', () => {
    const k1 = getKetuPosition(new Date('2000-01-01T12:00:00Z'));
    const k2 = getKetuPosition(new Date('2001-01-01T12:00:00Z'));
    // Mean motion ~40.7°/year prograde
    let diff = k2.longitude - k1.longitude;
    if (diff < 0) diff += 360;
    expect(diff).toBeCloseTo(40.7, -1);
  });

  it('descending-node mode returns Rahu + 180°', () => {
    const date = new Date('2000-01-01T12:00:00Z');
    const ketuDN = getKetuPosition(date, 'descending-node');
    const rahu = getRahuPosition(date);
    let expected = (rahu.longitude + 180) % 360;
    expect(ketuDN.longitude).toBeCloseTo(expected, 6);
  });
});

describe('getYuebeiPosition (月孛 — mean lunar apogee)', () => {
  it('J2000.0 mean apogee ≈ 263.35°', () => {
    const pos = getYuebeiPosition(new Date('2000-01-01T12:00:00Z'));
    expect(pos.longitude).toBeCloseTo(263.35, 0);
  });

  it('differs from Ketu (osculating includes perturbations)', () => {
    const date = new Date('2010-06-15T00:00:00Z');
    const ketu = getKetuPosition(date);
    const yuebei = getYuebeiPosition(date);
    // Should differ due to perturbation terms in Ketu
    const diff = Math.abs(ketu.longitude - yuebei.longitude);
    expect(diff).toBeGreaterThan(0.1); // at least some difference
    expect(diff).toBeLessThan(40); // but not wildly different
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/seven-governors/four-remainders.test.ts`
Expected: FAIL — `getKetuPosition`, `getYuebeiPosition` not found

- [ ] **Step 3: Implement Ketu and Yuebei**

Add to `src/seven-governors/four-remainders.ts`:

```typescript
import type { KetuMode } from './types';

/**
 * Mean longitude of lunar perigee (ϖ).
 * Source: Meeus, Ch. 22, polynomial for the argument of perigee (ω) + node (Ω).
 * Mean perigee longitude = F + Ω where F = mean argument of latitude.
 *
 * Alternative direct formula (Meeus):
 * ϖ = 83.3532465° + 4069.0137287° × T − 0.0103200° × T² − T³/80053 + T⁴/18999000
 */
function meanPerigee(T: number): number {
  const T2 = T * T;
  const T3 = T2 * T;
  const T4 = T3 * T;
  return normDeg(
    83.3532465
    + 4069.0137287 * T
    - 0.0103200 * T2
    - T3 / 80053.0
    + T4 / 18999000.0
  );
}

/**
 * Osculating (true) lunar apogee perturbation correction.
 * Major periodic terms from the Moon's orbital perturbation theory.
 * Source: Meeus Ch. 50 / Jean Meeus, Mathematical Astronomy Morsels.
 */
function apogeeCorrection(T: number): number {
  const T2 = T * T;
  // Delaunay-like arguments (degrees)
  const D = normDeg(297.8501921 + 445267.1114034 * T - 0.0018819 * T2);
  const M = normDeg(357.5291092 + 35999.0502909 * T - 0.0001536 * T2);
  const Mp = normDeg(134.9633964 + 477198.8675055 * T + 0.0087414 * T2);
  const F = normDeg(93.2720950 + 483202.0175233 * T - 0.0036539 * T2);
  const toRad = Math.PI / 180;

  // Principal perturbation terms (degrees)
  let correction = 0;
  correction += 1.4979 * Math.sin(2 * (D - Mp) * toRad);
  correction += 0.1500 * Math.sin(M * toRad);
  correction += 0.1226 * Math.sin(2 * D * toRad);
  correction += 0.1040 * Math.sin(2 * Mp * toRad);
  correction -= 0.0752 * Math.sin(2 * F * toRad);
  return correction;
}

/**
 * 計都 (Ketu) — lunar apogee (osculating, per Niu Weixing 1995).
 * Default mode: osculating apogee = mean perigee + 180° + perturbation correction.
 * Descending-node mode: Rahu + 180° (Indian tradition).
 */
export function getKetuPosition(
  date: Date,
  mode: KetuMode = 'apogee',
): { longitude: number; latitude: number } {
  if (mode === 'descending-node') {
    const rahu = getRahuPosition(date);
    return {
      longitude: normDeg(rahu.longitude + 180),
      latitude: 0,
    };
  }

  const T = dateToJulianCenturies(date);
  const meanApogee = normDeg(meanPerigee(T) + 180);
  const correction = apogeeCorrection(T);

  return {
    longitude: normDeg(meanApogee + correction),
    latitude: 0,
  };
}

/**
 * 月孛 (Yuebei) — mean lunar apogee (Black Moon Lilith).
 * Smooth mean motion without periodic perturbation terms.
 * Distinguished from Ketu: Yuebei = mean, Ketu = osculating (true).
 */
export function getYuebeiPosition(date: Date): { longitude: number; latitude: number } {
  const T = dateToJulianCenturies(date);
  return {
    longitude: normDeg(meanPerigee(T) + 180),
    latitude: 0,
  };
}
```

- [ ] **Step 4: Update index.ts**

Add to `src/seven-governors/index.ts`:
```typescript
export { getKetuPosition, getYuebeiPosition } from './four-remainders';
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run tests/seven-governors/four-remainders.test.ts`
Expected: PASS (all tests including new Ketu/Yuebei tests)

- [ ] **Step 6: Commit**

```bash
git add src/seven-governors/four-remainders.ts src/seven-governors/index.ts tests/seven-governors/four-remainders.test.ts
git commit -m "feat(seven-governors): Ketu (計都) and Yuebei (月孛) lunar apogee"
```

---

### Task 8: Four Remainders — Purple Qi (紫氣)

**Files:**
- Modify: `src/seven-governors/four-remainders.ts`
- Modify: `src/seven-governors/index.ts`
- Test: `tests/seven-governors/four-remainders.test.ts` (append)

Purple Qi has no astronomical counterpart. Uses a classical linear formula from 《果老星宗》/《大統曆》. The implementer must research the exact epoch longitude and period from the source text.

**Research required before coding:**
1. Find the 紫氣 formula in 《大統曆》 or 《果老星宗》
2. Extract: epoch date, epoch longitude (λ₀), and daily motion rate
3. Compute exact period P = 360° / (daily_rate × 365.25)

**Known constraints:**
- Prograde motion (increasing longitude)
- Period ≈ 28 years (~12.857°/year, ~0.03521°/day)
- Linear formula: λ = λ₀ + rate × (JD − JD₀)

- [ ] **Step 1: Write failing test with known constraints**

Append to `tests/seven-governors/four-remainders.test.ts`:

```typescript
import { getPurpleQiPosition } from '../../src/seven-governors';

describe('getPurpleQiPosition (紫氣 — classical formula)', () => {
  it('returns longitude in [0, 360)', () => {
    const pos = getPurpleQiPosition(new Date('2000-01-01T12:00:00Z'));
    expect(pos.longitude).toBeGreaterThanOrEqual(0);
    expect(pos.longitude).toBeLessThan(360);
  });

  it('latitude is 0', () => {
    expect(getPurpleQiPosition(new Date('2000-01-01T12:00:00Z')).latitude).toBe(0);
  });

  it('moves prograde', () => {
    const p1 = getPurpleQiPosition(new Date('2000-01-01T12:00:00Z'));
    const p2 = getPurpleQiPosition(new Date('2001-01-01T12:00:00Z'));
    let diff = p2.longitude - p1.longitude;
    if (diff < 0) diff += 360;
    // ~12.86°/year prograde
    expect(diff).toBeCloseTo(12.86, 0);
  });

  it('completes full cycle in ~28 years', () => {
    const p1 = getPurpleQiPosition(new Date('2000-01-01T12:00:00Z'));
    const p2 = getPurpleQiPosition(new Date('2028-01-01T12:00:00Z'));
    let diff = Math.abs(p1.longitude - p2.longitude);
    if (diff > 180) diff = 360 - diff;
    expect(diff).toBeLessThan(5);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/seven-governors/four-remainders.test.ts`
Expected: FAIL — `getPurpleQiPosition` not found

- [ ] **Step 3: Research and implement Purple Qi**

The implementer must first source the classical coefficients. As a starting reference:

From 《大統曆》(Datong Calendar, Ming dynasty):
- The 紫氣 completes one circuit in approximately 10195.5 days (~27.9 years)
- Daily motion: 360° / 10195.5 ≈ 0.035310°/day

**Placeholder formula (replace with exact sourced values):**

```typescript
/**
 * 紫氣 (Purple Qi) — classical formulaic point.
 * No astronomical counterpart. ~28-year prograde cycle.
 *
 * Source: 《大統曆》 (Datong Calendar, Ming dynasty).
 * Formula: λ = λ₀ + dailyRate × (JD − JD₀)
 *
 * Epoch and rate must be verified against source text.
 * Current values are provisional estimates pending research.
 */

// Provisional: epoch J2000.0, rate calibrated for ~28-year cycle
const PURPLE_QI_EPOCH_JD = 2451545.0; // J2000.0
const PURPLE_QI_EPOCH_LON = 0.0;       // TBD: source from 《果老星宗》
const PURPLE_QI_DAILY_RATE = 360.0 / 10195.5; // ~0.035310°/day

export function getPurpleQiPosition(date: Date): { longitude: number; latitude: number } {
  // Convert Date to JD
  const msPerDay = 86400000;
  const jd = date.getTime() / msPerDay + 2440587.5;
  const days = jd - PURPLE_QI_EPOCH_JD;
  const lon = normDeg(PURPLE_QI_EPOCH_LON + PURPLE_QI_DAILY_RATE * days);
  return { longitude: lon, latitude: 0 };
}
```

**Important:** The `PURPLE_QI_EPOCH_LON` value (0.0) is a placeholder. The implementer must:
1. Find the historical epoch longitude from 《果老星宗》 or 《大統曆》
2. Convert to degrees if given in 度/分/秒 (Chinese angular units: 1度 = 1°)
3. Update the constant and verify against published classical tables
4. Document the source in a code comment

- [ ] **Step 4: Update index.ts**

Add to `src/seven-governors/index.ts`:
```typescript
export { getPurpleQiPosition } from './four-remainders';
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run tests/seven-governors/four-remainders.test.ts`
Expected: PASS (cycle and direction tests pass; exact position TBD after coefficient research)

- [ ] **Step 6: Commit**

```bash
git add src/seven-governors/four-remainders.ts src/seven-governors/index.ts tests/seven-governors/four-remainders.test.ts
git commit -m "feat(seven-governors): Purple Qi (紫氣) classical formula (provisional coefficients)"
```

---

### Task 9: Ascendant Calculation (命宮)

**Files:**
- Create: `src/seven-governors/ascendant.ts`
- Modify: `src/seven-governors/index.ts`
- Test: `tests/seven-governors/ascendant.test.ts`

The ascendant (命宮) determines which palace sits on the eastern horizon at the moment of birth. This requires local sidereal time.

**Algorithm:**
1. Compute Greenwich Mean Sidereal Time (GMST) at birth moment
2. Add geographic longitude to get Local Sidereal Time (LST)
3. The ascending degree is approximately the sidereal longitude at LST + 90° (eastern horizon)
4. Find which palace contains that degree → that palace becomes 命宮
5. The remaining 11 palace roles are assigned in sequence from 命宮

- [ ] **Step 1: Write failing test**

```typescript
// tests/seven-governors/ascendant.test.ts
import { describe, it, expect } from 'vitest';
import { getAscendant } from '../../src/seven-governors';
import type { PalaceName, PalaceRole } from '../../src/seven-governors';

describe('getAscendant (命宮)', () => {
  it('returns a valid palace name', () => {
    // Taipei, 2000-01-01 08:00 local (00:00 UTC)
    const result = getAscendant(
      new Date('2000-01-01T00:00:00Z'),
      { lat: 25.033, lon: 121.565 },
    );
    expect(result.palace).toBeTruthy();
    expect(result.mansion).toBeTruthy();
  });

  it('different birth times give different ascendants', () => {
    const loc = { lat: 25.033, lon: 121.565 }; // Taipei
    const morning = getAscendant(new Date('2000-01-01T00:00:00Z'), loc);
    const evening = getAscendant(new Date('2000-01-01T10:00:00Z'), loc);
    // 10 hours apart should give different ascendants (ecliptic rotates ~150°)
    expect(morning.palace).not.toBe(evening.palace);
  });

  it('different locations at same UTC give different ascendants', () => {
    const date = new Date('2000-01-01T06:00:00Z');
    const taipei = getAscendant(date, { lat: 25.033, lon: 121.565 });
    const london = getAscendant(date, { lat: 51.507, lon: -0.128 });
    // 121° longitude difference → different ascendants
    expect(taipei.palace).not.toBe(london.palace);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/seven-governors/ascendant.test.ts`
Expected: FAIL — `getAscendant` not found

- [ ] **Step 3: Implement ascendant**

```typescript
// src/seven-governors/ascendant.ts
import { dateToJulianCenturies } from '../astro';
import type { MansionName, PalaceName } from './types';
import { getMansionForLongitude } from './mansion-mapper';
import { getPalaceForLongitude } from './palace-mapper';

/**
 * Compute Greenwich Mean Sidereal Time (GMST) in degrees.
 * Source: Meeus, Astronomical Algorithms, Ch. 12.
 *
 * @param date - Date in UTC
 * @returns GMST in degrees [0, 360)
 */
function greenwichMeanSiderealTime(date: Date): number {
  const T = dateToJulianCenturies(date);
  // GMST at 0h UT on the given date, then add elapsed hours
  const jd = T * 36525.0 + 2451545.0;
  const jd0 = Math.floor(jd - 0.5) + 0.5; // JD at 0h UT
  const T0 = (jd0 - 2451545.0) / 36525.0;
  const ut = (jd - jd0) * 24.0; // hours since 0h UT

  // GMST at 0h UT (in seconds of time)
  const gmst0 = 24110.54841
    + 8640184.812866 * T0
    + 0.093104 * T0 * T0
    - 6.2e-6 * T0 * T0 * T0;

  // Convert to degrees and add UT contribution
  // Sidereal day = 1.00273790935 solar days
  const gmstDeg = (gmst0 / 240.0) + (ut * 15.0 * 1.00273790935);
  return ((gmstDeg % 360) + 360) % 360;
}

export interface AscendantResult {
  /** Sidereal longitude of the ascending degree */
  siderealLon: number;
  /** Mansion at the ascendant */
  mansion: MansionName;
  /** Palace at the ascendant (this becomes 命宮) */
  palace: PalaceName;
}

/**
 * Calculate the ascendant (命宮) for a birth moment and location.
 *
 * The ascendant is the sidereal degree rising on the eastern horizon.
 * This is approximately RAMC + 90° converted to ecliptic longitude,
 * simplified for the 30°-per-palace system used in 七政四餘.
 *
 * @param date - Birth date/time (UTC)
 * @param location - Birth location { lat, lon } in degrees
 * @returns Ascendant mansion and palace
 */
export function getAscendant(
  date: Date,
  location: { lat: number; lon: number },
): AscendantResult {
  const gmst = greenwichMeanSiderealTime(date);
  const lst = ((gmst + location.lon) % 360 + 360) % 360;

  // The ascending ecliptic degree (simplified: RAMC + 90° ≈ ascending point)
  // For a more precise calculation, one would solve the horizon equation
  // using the local latitude and obliquity. For the 30°-palace system,
  // the simplified approach is standard practice.
  const ascDeg = (lst + 90) % 360;

  const mansion = getMansionForLongitude(ascDeg);
  const palace = getPalaceForLongitude(ascDeg);

  return {
    siderealLon: ascDeg,
    mansion: mansion.name,
    palace: palace.name,
  };
}
```

- [ ] **Step 4: Update index.ts**

Add to `src/seven-governors/index.ts`:
```typescript
export { getAscendant } from './ascendant';
export type { AscendantResult } from './ascendant';
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run tests/seven-governors/ascendant.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
git add src/seven-governors/ascendant.ts src/seven-governors/index.ts tests/seven-governors/ascendant.test.ts
git commit -m "feat(seven-governors): ascendant (命宮) calculation"
```

---

### Task 10: Dignity Tables

**Files:**
- Create: `src/seven-governors/data/dignity.ts`
- Test: `tests/seven-governors/dignity.test.ts`

Each of the 11 bodies has a dignity state (廟/旺/平/陷) in each palace. This is a lookup table sourced from 《果老星宗》.

- [ ] **Step 1: Create dignity data**

```typescript
// src/seven-governors/data/dignity.ts
import type { GovernorOrRemainder, PalaceName, Dignity } from '../types';

/**
 * Dignity (廟旺平陷) lookup table.
 *
 * Each body's dignity depends on which palace it occupies.
 * Source: 《果老星宗》 (primary), supplemented by 《天步真原》.
 *
 * 廟 (temple) = strongest/most favorable
 * 旺 (prosperous) = strong
 * 平 (neutral) = average
 * 陷 (fallen) = weakest/unfavorable
 */
export const DIGNITY_TABLE: Record<GovernorOrRemainder, Record<PalaceName, Dignity>> = {
  // NOTE TO IMPLEMENTER: The values below are structural placeholders.
  // You must populate each entry from 《果老星宗》.
  // Each body has exactly one dignity state per palace.
  // Research guide: look for 各星廟旺利陷 or 十一曜入宮 sections.

  sun: {
    '子宮': '陷', '丑宮': '平', '寅宮': '旺', '卯宮': '平',
    '辰宮': '平', '巳宮': '廟', '午宮': '廟', '未宮': '平',
    '申宮': '平', '酉宮': '平', '戌宮': '平', '亥宮': '陷',
  },
  moon: {
    '子宮': '廟', '丑宮': '平', '寅宮': '平', '卯宮': '旺',
    '辰宮': '平', '巳宮': '平', '午宮': '陷', '未宮': '平',
    '申宮': '平', '酉宮': '平', '戌宮': '平', '亥宮': '廟',
  },
  // ... remaining 9 bodies follow same pattern
  // PLACEHOLDER — all set to '平' until sourced from 《果老星宗》
  mercury: {
    '子宮': '平', '丑宮': '平', '寅宮': '平', '卯宮': '平',
    '辰宮': '平', '巳宮': '平', '午宮': '平', '未宮': '平',
    '申宮': '平', '酉宮': '平', '戌宮': '平', '亥宮': '平',
  },
  venus: {
    '子宮': '平', '丑宮': '平', '寅宮': '平', '卯宮': '平',
    '辰宮': '平', '巳宮': '平', '午宮': '平', '未宮': '平',
    '申宮': '平', '酉宮': '平', '戌宮': '平', '亥宮': '平',
  },
  mars: {
    '子宮': '平', '丑宮': '平', '寅宮': '平', '卯宮': '平',
    '辰宮': '平', '巳宮': '平', '午宮': '平', '未宮': '平',
    '申宮': '平', '酉宮': '平', '戌宮': '平', '亥宮': '平',
  },
  jupiter: {
    '子宮': '平', '丑宮': '平', '寅宮': '平', '卯宮': '平',
    '辰宮': '平', '巳宮': '平', '午宮': '平', '未宮': '平',
    '申宮': '平', '酉宮': '平', '戌宮': '平', '亥宮': '平',
  },
  saturn: {
    '子宮': '平', '丑宮': '平', '寅宮': '平', '卯宮': '平',
    '辰宮': '平', '巳宮': '平', '午宮': '平', '未宮': '平',
    '申宮': '平', '酉宮': '平', '戌宮': '平', '亥宮': '平',
  },
  rahu: {
    '子宮': '平', '丑宮': '平', '寅宮': '平', '卯宮': '平',
    '辰宮': '平', '巳宮': '平', '午宮': '平', '未宮': '平',
    '申宮': '平', '酉宮': '平', '戌宮': '平', '亥宮': '平',
  },
  ketu: {
    '子宮': '平', '丑宮': '平', '寅宮': '平', '卯宮': '平',
    '辰宮': '平', '巳宮': '平', '午宮': '平', '未宮': '平',
    '申宮': '平', '酉宮': '平', '戌宮': '平', '亥宮': '平',
  },
  yuebei: {
    '子宮': '平', '丑宮': '平', '寅宮': '平', '卯宮': '平',
    '辰宮': '平', '巳宮': '平', '午宮': '平', '未宮': '平',
    '申宮': '平', '酉宮': '平', '戌宮': '平', '亥宮': '平',
  },
  purpleQi: {
    '子宮': '平', '丑宮': '平', '寅宮': '平', '卯宮': '平',
    '辰宮': '平', '巳宮': '平', '午宮': '平', '未宮': '平',
    '申宮': '平', '酉宮': '平', '戌宮': '平', '亥宮': '平',
  },
};

/**
 * Look up the dignity of a body in a palace.
 */
export function getDignity(body: GovernorOrRemainder, palace: PalaceName): Dignity {
  return DIGNITY_TABLE[body][palace];
}
```

- [ ] **Step 2: Write tests**

```typescript
// tests/seven-governors/dignity.test.ts
import { describe, it, expect } from 'vitest';
import { DIGNITY_TABLE, getDignity } from '../../src/seven-governors/data/dignity';
import { ALL_BODIES } from '../../src/seven-governors';

const PALACES = ['子宮','丑宮','寅宮','卯宮','辰宮','巳宮','午宮','未宮','申宮','酉宮','戌宮','亥宮'] as const;
const VALID_DIGNITIES = ['廟', '旺', '平', '陷'];

describe('dignity table', () => {
  it('has entries for all 11 bodies', () => {
    for (const body of ALL_BODIES) {
      expect(DIGNITY_TABLE[body]).toBeTruthy();
    }
  });

  it('each body has all 12 palaces', () => {
    for (const body of ALL_BODIES) {
      for (const palace of PALACES) {
        expect(DIGNITY_TABLE[body][palace]).toBeTruthy();
      }
    }
  });

  it('all values are valid dignity levels', () => {
    for (const body of ALL_BODIES) {
      for (const palace of PALACES) {
        expect(VALID_DIGNITIES).toContain(DIGNITY_TABLE[body][palace]);
      }
    }
  });

  it('getDignity returns correct lookup', () => {
    expect(getDignity('sun', '巳宮')).toBe('廟');
    expect(getDignity('sun', '子宮')).toBe('陷');
  });
});
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run tests/seven-governors/dignity.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/seven-governors/data/dignity.ts tests/seven-governors/dignity.test.ts
git commit -m "feat(seven-governors): dignity (廟旺平陷) lookup table"
```

---

### Task 11: Aspect Computation

**Files:**
- Create: `src/seven-governors/data/aspects.ts`
- Test: `tests/seven-governors/aspects.test.ts`

Aspects are angular relationships between bodies based on their palace positions.

- [ ] **Step 1: Create aspect definitions and computation**

```typescript
// src/seven-governors/data/aspects.ts
import type { GovernorOrRemainder, AspectType, Aspect, PalaceName } from '../types';
import { PALACE_BOUNDARIES } from './palace-boundaries';

/**
 * Aspect definitions for 七政四餘.
 *
 * Aspects are determined by the number of palaces between two bodies:
 * - 合 (conjunction): same palace (0 apart)
 * - 三合 (trine): 4 or 8 palaces apart
 * - 刑 (square): 3 or 9 palaces apart
 * - 沖 (opposition): 6 palaces apart
 *
 * Source: 《果老星宗》
 */
const ASPECT_RULES: { distance: number; type: AspectType }[] = [
  { distance: 0, type: '合' },
  { distance: 3, type: '刑' },
  { distance: 4, type: '三合' },
  { distance: 6, type: '沖' },
  { distance: 8, type: '三合' },
  { distance: 9, type: '刑' },
];

/**
 * Named aspect configurations from 《果老星宗》.
 * Each has specific bodies + geometric requirements.
 */
interface NamedAspect {
  name: string;
  check: (bodyPalaces: Map<GovernorOrRemainder, number>) => boolean;
}

const NAMED_ASPECTS: NamedAspect[] = [
  {
    // 日月夾命: Sun and Moon in palaces adjacent to 命宮
    name: '日月夾命',
    check: (bp) => {
      const sunIdx = bp.get('sun');
      const moonIdx = bp.get('moon');
      // This requires knowing the 命宮 index — passed externally
      // Placeholder: always false; chart.ts will handle named aspects
      return false;
    },
  },
];

/**
 * Compute all aspects between bodies based on their palace indices.
 *
 * @param bodyPalaceIndices - Map of body → palace index (0-11)
 * @returns Array of aspects found
 */
export function computeAspects(
  bodyPalaceIndices: Map<GovernorOrRemainder, number>,
): Aspect[] {
  const aspects: Aspect[] = [];
  const bodies = Array.from(bodyPalaceIndices.entries());

  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const [body1, idx1] = bodies[i];
      const [body2, idx2] = bodies[j];
      const dist = Math.abs(idx1 - idx2);
      const palaceDist = Math.min(dist, 12 - dist);

      for (const rule of ASPECT_RULES) {
        if (palaceDist === rule.distance) {
          aspects.push({ body1, body2, type: rule.type });
        }
      }
    }
  }

  return aspects;
}
```

- [ ] **Step 2: Write tests**

```typescript
// tests/seven-governors/aspects.test.ts
import { describe, it, expect } from 'vitest';
import { computeAspects } from '../../src/seven-governors/data/aspects';
import type { GovernorOrRemainder } from '../../src/seven-governors';

describe('computeAspects', () => {
  it('finds 合 when two bodies share a palace', () => {
    const map = new Map<GovernorOrRemainder, number>([
      ['sun', 3], ['mars', 3],
    ]);
    const aspects = computeAspects(map);
    expect(aspects).toHaveLength(1);
    expect(aspects[0].type).toBe('合');
  });

  it('finds 沖 when bodies are 6 palaces apart', () => {
    const map = new Map<GovernorOrRemainder, number>([
      ['sun', 0], ['moon', 6],
    ]);
    const aspects = computeAspects(map);
    expect(aspects).toHaveLength(1);
    expect(aspects[0].type).toBe('沖');
  });

  it('finds 三合 for 4 palaces apart', () => {
    const map = new Map<GovernorOrRemainder, number>([
      ['jupiter', 0], ['venus', 4],
    ]);
    const aspects = computeAspects(map);
    expect(aspects).toHaveLength(1);
    expect(aspects[0].type).toBe('三合');
  });

  it('finds 刑 for 3 palaces apart', () => {
    const map = new Map<GovernorOrRemainder, number>([
      ['mars', 1], ['saturn', 4],
    ]);
    const aspects = computeAspects(map);
    expect(aspects).toHaveLength(1);
    expect(aspects[0].type).toBe('刑');
  });

  it('handles wrap-around (palaces 0 and 10 are 2 apart → no aspect)', () => {
    const map = new Map<GovernorOrRemainder, number>([
      ['sun', 0], ['moon', 10],
    ]);
    const aspects = computeAspects(map);
    expect(aspects).toHaveLength(0);
  });

  it('finds multiple aspects with multiple bodies', () => {
    const map = new Map<GovernorOrRemainder, number>([
      ['sun', 0], ['moon', 0], ['mars', 6],
    ]);
    const aspects = computeAspects(map);
    // sun-moon: 合, sun-mars: 沖, moon-mars: 沖
    expect(aspects).toHaveLength(3);
  });
});
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run tests/seven-governors/aspects.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 4: Commit**

```bash
git add src/seven-governors/data/aspects.ts tests/seven-governors/aspects.test.ts
git commit -m "feat(seven-governors): aspect computation (合/沖/刑/三合)"
```

---

### Task 12: Star Spirits Data

**Files:**
- Create: `src/seven-governors/data/star-spirits.ts`
- Test: `tests/seven-governors/star-spirits.test.ts`

Star spirits (神煞) are auspicious or malefic influences determined by planetary configurations. This is the largest data-sourcing task — requires extracting rules from 《果老星宗》.

- [ ] **Step 1: Create star spirits data structure with initial entries**

```typescript
// src/seven-governors/data/star-spirits.ts
import type { GovernorOrRemainder, PalaceName, MansionName, StarSpirit } from '../types';

/**
 * Star spirit rule: a condition that activates a 神煞.
 * Conditions can depend on body placement, palace occupancy, or inter-body relationships.
 */
export interface StarSpiritRule {
  spirit: StarSpirit;
  /**
   * Check whether this spirit is active in the given chart context.
   * @param ctx - Chart context with body positions, palace info, ascendant index
   */
  check: (ctx: StarSpiritContext) => boolean;
}

export interface StarSpiritContext {
  bodyPalaces: Map<GovernorOrRemainder, PalaceName>;
  bodyMansions: Map<GovernorOrRemainder, MansionName>;
  bodyPalaceIndices: Map<GovernorOrRemainder, number>;
  ascendantPalaceIndex: number;
}

/**
 * Star spirit rules from 《果老星宗》.
 *
 * NOTE TO IMPLEMENTER: This is a partial initial set. The full table
 * contains 40-80 spirits. Add entries as sourced from the reference text.
 * Each entry must document which section of 《果老星宗》 it comes from.
 *
 * Research guide: look for 神煞 or 星煞 sections in the text.
 */
export const STAR_SPIRIT_RULES: StarSpiritRule[] = [
  // ── Auspicious spirits ─────────────────────────────────────

  {
    spirit: {
      name: '日月夾命',
      type: 'auspicious',
      condition: 'Sun and Moon in palaces adjacent to 命宮',
      source: '果老星宗',
    },
    check: (ctx) => {
      const sunIdx = ctx.bodyPalaceIndices.get('sun');
      const moonIdx = ctx.bodyPalaceIndices.get('moon');
      if (sunIdx === undefined || moonIdx === undefined) return false;
      const asc = ctx.ascendantPalaceIndex;
      const adjLeft = (asc + 11) % 12;
      const adjRight = (asc + 1) % 12;
      return (sunIdx === adjLeft && moonIdx === adjRight)
          || (sunIdx === adjRight && moonIdx === adjLeft);
    },
  },
  {
    spirit: {
      name: '祿存',
      type: 'auspicious',
      condition: 'Jupiter in 命宮',
      source: '果老星宗',
    },
    check: (ctx) => {
      const jupIdx = ctx.bodyPalaceIndices.get('jupiter');
      return jupIdx === ctx.ascendantPalaceIndex;
    },
  },

  // ── Malefic spirits ────────────────────────────────────────

  {
    spirit: {
      name: '火鈴夾命',
      type: 'malefic',
      condition: 'Mars and Ketu in palaces adjacent to 命宮',
      source: '果老星宗',
    },
    check: (ctx) => {
      const marsIdx = ctx.bodyPalaceIndices.get('mars');
      const ketuIdx = ctx.bodyPalaceIndices.get('ketu');
      if (marsIdx === undefined || ketuIdx === undefined) return false;
      const asc = ctx.ascendantPalaceIndex;
      const adjLeft = (asc + 11) % 12;
      const adjRight = (asc + 1) % 12;
      return (marsIdx === adjLeft && ketuIdx === adjRight)
          || (marsIdx === adjRight && ketuIdx === adjLeft);
    },
  },

  // Additional spirits TBD — sourced from 《果老星宗》
];

/**
 * Evaluate all star spirit rules against a chart context.
 * Returns the list of active spirits.
 */
export function evaluateStarSpirits(ctx: StarSpiritContext): StarSpirit[] {
  return STAR_SPIRIT_RULES
    .filter(rule => rule.check(ctx))
    .map(rule => rule.spirit);
}
```

- [ ] **Step 2: Write tests**

```typescript
// tests/seven-governors/star-spirits.test.ts
import { describe, it, expect } from 'vitest';
import {
  STAR_SPIRIT_RULES, evaluateStarSpirits,
  type StarSpiritContext,
} from '../../src/seven-governors/data/star-spirits';
import type { GovernorOrRemainder, PalaceName, MansionName } from '../../src/seven-governors';

function makeCtx(
  bodyPalaceIndices: [GovernorOrRemainder, number][],
  ascendantIdx: number,
): StarSpiritContext {
  const indices = new Map(bodyPalaceIndices);
  const palaceNames: PalaceName[] = [
    '辰宮','卯宮','寅宮','丑宮','子宮','亥宮',
    '戌宮','酉宮','申宮','未宮','午宮','巳宮',
  ];
  const palaces = new Map<GovernorOrRemainder, PalaceName>();
  for (const [body, idx] of bodyPalaceIndices) {
    palaces.set(body, palaceNames[idx]);
  }
  return {
    bodyPalaces: palaces,
    bodyMansions: new Map<GovernorOrRemainder, MansionName>(),
    bodyPalaceIndices: indices,
    ascendantPalaceIndex: ascendantIdx,
  };
}

describe('star spirits', () => {
  it('has at least 3 rules', () => {
    expect(STAR_SPIRIT_RULES.length).toBeGreaterThanOrEqual(3);
  });

  it('every rule has a valid spirit definition', () => {
    for (const rule of STAR_SPIRIT_RULES) {
      expect(rule.spirit.name).toBeTruthy();
      expect(['auspicious', 'malefic']).toContain(rule.spirit.type);
      expect(rule.spirit.source).toBeTruthy();
    }
  });

  it('日月夾命 activates when Sun and Moon flank ascendant', () => {
    const ctx = makeCtx([
      ['sun', 2], ['moon', 4],
    ], 3); // ascendant at index 3, sun at 2, moon at 4
    const spirits = evaluateStarSpirits(ctx);
    const names = spirits.map(s => s.name);
    expect(names).toContain('日月夾命');
  });

  it('日月夾命 does NOT activate when bodies are not adjacent', () => {
    const ctx = makeCtx([
      ['sun', 0], ['moon', 6],
    ], 3);
    const spirits = evaluateStarSpirits(ctx);
    const names = spirits.map(s => s.name);
    expect(names).not.toContain('日月夾命');
  });

  it('祿存 activates when Jupiter is in 命宮', () => {
    const ctx = makeCtx([['jupiter', 5]], 5);
    const spirits = evaluateStarSpirits(ctx);
    expect(spirits.map(s => s.name)).toContain('祿存');
  });
});
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run tests/seven-governors/star-spirits.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/seven-governors/data/star-spirits.ts tests/seven-governors/star-spirits.test.ts
git commit -m "feat(seven-governors): star spirits (神煞) with initial rules from 果老星宗"
```

---

### Task 13: Chart Assembly

**Files:**
- Create: `src/seven-governors/chart.ts`
- Modify: `src/seven-governors/index.ts`
- Test: `tests/seven-governors/chart.test.ts`

The main orchestration function. Computes all 11 body positions, converts to sidereal, maps to mansions and palaces, determines ascendant, assigns palace roles, computes aspects, evaluates star spirits, and looks up dignities.

- [ ] **Step 1: Write integration test**

```typescript
// tests/seven-governors/chart.test.ts
import { describe, it, expect } from 'vitest';
import { getSevenGovernorsChart } from '../../src/seven-governors';
import type { SevenGovernorsChart, GovernorOrRemainder } from '../../src/seven-governors';

describe('getSevenGovernorsChart', () => {
  // Test date: 1990-01-15 08:30 local Taipei (00:30 UTC)
  const date = new Date('1990-01-15T00:30:00Z');
  const location = { lat: 25.033, lon: 121.565 };

  let chart: SevenGovernorsChart;

  it('returns a chart object', () => {
    chart = getSevenGovernorsChart(date, location);
    expect(chart).toBeTruthy();
    expect(chart.date).toEqual(date);
    expect(chart.location).toEqual(location);
  });

  it('has positions for all 11 bodies', () => {
    const bodies = Object.keys(chart.bodies) as GovernorOrRemainder[];
    expect(bodies).toHaveLength(11);
    expect(bodies).toContain('sun');
    expect(bodies).toContain('moon');
    expect(bodies).toContain('rahu');
    expect(bodies).toContain('purpleQi');
  });

  it('each body has sidereal longitude, mansion, and palace', () => {
    for (const [name, pos] of Object.entries(chart.bodies)) {
      expect(pos.siderealLon, `${name} siderealLon`).toBeGreaterThanOrEqual(0);
      expect(pos.siderealLon, `${name} siderealLon`).toBeLessThan(360);
      expect(pos.mansion, `${name} mansion`).toBeTruthy();
      expect(pos.palace, `${name} palace`).toBeTruthy();
      expect(pos.mansionDegree, `${name} mansionDegree`).toBeGreaterThanOrEqual(0);
    }
  });

  it('has 12 palaces with roles assigned', () => {
    expect(chart.palaces).toHaveLength(12);
    const roles = chart.palaces.map(p => p.role);
    expect(roles).toContain('命宮');
    expect(roles).toContain('財帛宮');
    expect(new Set(roles).size).toBe(12); // all unique
  });

  it('has an ascendant', () => {
    expect(chart.ascendant.mansion).toBeTruthy();
    expect(chart.ascendant.palace).toBeTruthy();
  });

  it('has dignity for each body', () => {
    for (const body of Object.keys(chart.bodies) as GovernorOrRemainder[]) {
      expect(['廟', '旺', '平', '陷']).toContain(chart.dignities[body]);
    }
  });

  it('aspects is an array', () => {
    expect(Array.isArray(chart.aspects)).toBe(true);
  });

  it('starSpirits is an array', () => {
    expect(Array.isArray(chart.starSpirits)).toBe(true);
  });

  it('respects sidereal mode option', () => {
    const chartAyanamsa = getSevenGovernorsChart(date, location, {
      siderealMode: { type: 'ayanamsa', value: 24.0 },
    });
    expect(chartAyanamsa.siderealMode).toEqual({ type: 'ayanamsa', value: 24.0 });
    // Positions should differ from default modern mode
    expect(chartAyanamsa.bodies.sun.siderealLon).not.toBeCloseTo(chart.bodies.sun.siderealLon, 0);
  });

  it('respects ketuMode option', () => {
    const chartDN = getSevenGovernorsChart(date, location, { ketuMode: 'descending-node' });
    expect(chartDN.ketuMode).toBe('descending-node');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/seven-governors/chart.test.ts`
Expected: FAIL — `getSevenGovernorsChart` not found

- [ ] **Step 3: Implement chart assembly**

```typescript
// src/seven-governors/chart.ts
import { getSunLongitude } from '../solar-longitude';
import { getMoonPosition } from '../moon/moon';
import { getPlanetPosition } from '../planets/planets';
import type { Planet } from '../types';
import {
  type GovernorOrRemainder, type Governor, type Remainder,
  type SevenGovernorsChart, type SevenGovernorsOptions,
  type BodyPosition, type PalaceInfo, type SiderealMode, type KetuMode,
  type PalaceName, type PalaceRole,
  GOVERNORS, REMAINDERS, ALL_BODIES, PALACE_ROLES,
} from './types';
import { toSiderealLongitude } from './sidereal';
import { getRahuPosition, getKetuPosition, getYuebeiPosition, getPurpleQiPosition } from './four-remainders';
import { getMansionForLongitude } from './mansion-mapper';
import { getPalaceForLongitude } from './palace-mapper';
import { getAscendant } from './ascendant';
import { PALACE_BOUNDARIES } from './data/palace-boundaries';
import { getDignity } from './data/dignity';
import { computeAspects } from './data/aspects';
import { evaluateStarSpirits, type StarSpiritContext } from './data/star-spirits';

/** Map of Planet type values for getPlanetPosition calls */
const PLANET_MAP: Partial<Record<Governor, Planet>> = {
  mercury: 'mercury', venus: 'venus', mars: 'mars',
  jupiter: 'jupiter', saturn: 'saturn',
};

/**
 * Get tropical longitude for a governor body.
 */
function getGovernorTropicalLon(body: Governor, date: Date): number {
  if (body === 'sun') return getSunLongitude(date);
  if (body === 'moon') return getMoonPosition(date).longitude;
  const planet = PLANET_MAP[body];
  if (!planet) throw new Error(`Unknown governor: ${body}`);
  return getPlanetPosition(planet, date).longitude;
}

/**
 * Get tropical longitude for a remainder body.
 */
function getRemainderTropicalLon(
  body: Remainder, date: Date, ketuMode: KetuMode,
): number {
  switch (body) {
    case 'rahu': return getRahuPosition(date).longitude;
    case 'ketu': return getKetuPosition(date, ketuMode).longitude;
    case 'yuebei': return getYuebeiPosition(date).longitude;
    case 'purpleQi': return getPurpleQiPosition(date).longitude;
  }
}

/**
 * Compute a complete 七政四餘 natal chart.
 */
export function getSevenGovernorsChart(
  date: Date,
  location: { lat: number; lon: number },
  options?: SevenGovernorsOptions,
): SevenGovernorsChart {
  const siderealMode: SiderealMode = options?.siderealMode ?? { type: 'modern' };
  const ketuMode: KetuMode = options?.ketuMode ?? 'apogee';

  // Step 1: Compute all body positions
  const bodies = {} as Record<GovernorOrRemainder, BodyPosition>;

  for (const gov of GOVERNORS) {
    const tropLon = getGovernorTropicalLon(gov, date);
    const sidLon = toSiderealLongitude(tropLon, date, siderealMode);
    const mansion = getMansionForLongitude(sidLon);
    const palace = getPalaceForLongitude(sidLon);
    bodies[gov] = {
      siderealLon: sidLon,
      tropicalLon: tropLon,
      mansion: mansion.name,
      mansionDegree: mansion.degree,
      palace: palace.name,
    };
  }

  for (const rem of REMAINDERS) {
    const tropLon = getRemainderTropicalLon(rem, date, ketuMode);
    const sidLon = toSiderealLongitude(tropLon, date, siderealMode);
    const mansion = getMansionForLongitude(sidLon);
    const palace = getPalaceForLongitude(sidLon);
    bodies[rem] = {
      siderealLon: sidLon,
      tropicalLon: tropLon,
      mansion: mansion.name,
      mansionDegree: mansion.degree,
      palace: palace.name,
    };
  }

  // Step 2: Ascendant
  const asc = getAscendant(date, location);
  const ascPalaceIdx = PALACE_BOUNDARIES.findIndex(p => p.name === asc.palace);

  // Step 3: Build palace info with roles
  const palaces: PalaceInfo[] = PALACE_BOUNDARIES.map((pb, i) => {
    // Role is determined by offset from ascendant palace
    const roleIdx = ((i - ascPalaceIdx) % 12 + 12) % 12;
    const occupants = ALL_BODIES.filter(b => bodies[b].palace === pb.name);
    return {
      name: pb.name,
      role: PALACE_ROLES[roleIdx],
      mansions: pb.mansions,
      occupants,
    };
  });

  // Step 4: Aspects
  const bodyPalaceIndices = new Map<GovernorOrRemainder, number>();
  for (const body of ALL_BODIES) {
    const idx = PALACE_BOUNDARIES.findIndex(p => p.name === bodies[body].palace);
    bodyPalaceIndices.set(body, idx);
  }
  const aspects = computeAspects(bodyPalaceIndices);

  // Step 5: Star spirits
  const bodyPalaces = new Map<GovernorOrRemainder, PalaceName>();
  const bodyMansions = new Map<GovernorOrRemainder, typeof bodies[GovernorOrRemainder]['mansion']>();
  for (const body of ALL_BODIES) {
    bodyPalaces.set(body, bodies[body].palace);
    bodyMansions.set(body, bodies[body].mansion);
  }
  const spiritCtx: StarSpiritContext = {
    bodyPalaces,
    bodyMansions,
    bodyPalaceIndices,
    ascendantPalaceIndex: ascPalaceIdx,
  };
  const starSpirits = evaluateStarSpirits(spiritCtx);

  // Step 6: Dignities
  const dignities = {} as Record<GovernorOrRemainder, typeof bodies[GovernorOrRemainder] extends never ? never : string>;
  for (const body of ALL_BODIES) {
    (dignities as any)[body] = getDignity(body, bodies[body].palace);
  }

  return {
    date,
    location,
    siderealMode,
    ketuMode,
    bodies,
    palaces,
    ascendant: { mansion: asc.mansion, palace: asc.palace },
    starSpirits,
    aspects,
    dignities: dignities as any,
  };
}
```

- [ ] **Step 4: Update index.ts with all public exports**

```typescript
// src/seven-governors/index.ts
export * from './types';
export { toSiderealLongitude } from './sidereal';
export {
  getRahuPosition, getKetuPosition,
  getYuebeiPosition, getPurpleQiPosition,
} from './four-remainders';
export { getMansionForLongitude } from './mansion-mapper';
export type { MansionResult } from './mansion-mapper';
export { getPalaceForLongitude } from './palace-mapper';
export type { PalaceResult } from './palace-mapper';
export { getAscendant } from './ascendant';
export type { AscendantResult } from './ascendant';
export { getSevenGovernorsChart } from './chart';
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run tests/seven-governors/chart.test.ts`
Expected: PASS (10 tests)

- [ ] **Step 6: Commit**

```bash
git add src/seven-governors/chart.ts src/seven-governors/index.ts tests/seven-governors/chart.test.ts
git commit -m "feat(seven-governors): chart assembly — full 七政四餘 natal chart"
```

---

### Task 14: Public API Exports and Full Test Suite

**Files:**
- Modify: `src/index.ts` — add seven-governors re-exports
- Test: run full test suite

- [ ] **Step 1: Add exports to main index.ts**

Add to `src/index.ts`:

```typescript
// ── Seven Governors Four Remainders (七政四餘) ──────────────
export {
  getSevenGovernorsChart,
  toSiderealLongitude,
  getRahuPosition, getKetuPosition,
  getYuebeiPosition, getPurpleQiPosition,
  getMansionForLongitude, getPalaceForLongitude,
  getAscendant,
} from './seven-governors';

export type {
  Governor, Remainder, GovernorOrRemainder,
  SiderealMode, KetuMode,
  MansionName, PalaceName, PalaceRole, Dignity, AspectType,
  BodyPosition, PalaceInfo, StarSpirit, Aspect,
  SevenGovernorsOptions, SevenGovernorsChart,
  MansionResult, PalaceResult, AscendantResult,
} from './seven-governors';
```

- [ ] **Step 2: Run full test suite**

Run: `npx vitest run`
Expected: ALL PASS (existing 1455 tests + new seven-governors tests)

- [ ] **Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat(seven-governors): export public API from main index"
```

---

### Task 15: Mansion Boundary Verification Script

**Files:**
- Create: `scripts/verify-mansion-boundaries.mjs`

A script that validates the mansion boundary data against the Hipparcos catalogue, ensuring each determinative star's sidereal ecliptic longitude matches the `startDeg` value in the boundary table.

- [ ] **Step 1: Create verification script**

```javascript
// scripts/verify-mansion-boundaries.mjs
#!/usr/bin/env node
/**
 * Verify mansion boundary data against Hipparcos star positions.
 *
 * For each mansion's determinative star:
 * 1. Look up the J2000.0 ecliptic longitude from Hipparcos
 * 2. Convert to Spica-anchored sidereal longitude
 * 3. Compare against the startDeg value in mansion-boundaries.ts
 *
 * Usage: npm run build && node scripts/verify-mansion-boundaries.mjs
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const sg = await import(join(root, 'dist', 'seven-governors', 'index.js'));
const { MANSION_BOUNDARIES } = await import(
  join(root, 'dist', 'seven-governors', 'data', 'mansion-boundaries.js')
);

// Spica's tropical ecliptic longitude at J2000.0
const SPICA_J2000 = 201.2983;

console.log('Mansion Boundary Verification');
console.log('─'.repeat(60));
console.log('Mansion  Star        HIP      startDeg  Expected  Δ°');
console.log('─'.repeat(60));

// NOTE: The "Expected" values must be sourced from a star catalogue.
// This script structure is provided for the implementer to fill in
// with actual Hipparcos ecliptic longitude data.

for (const m of MANSION_BOUNDARIES) {
  // Placeholder: implementer should look up actual ecliptic longitude
  // from Hipparcos or a computed star catalogue
  console.log(
    `${m.name.padEnd(6)}  ${m.star.padEnd(10)}  ${String(m.hip).padEnd(7)}  ${m.startDeg.toFixed(2).padStart(8)}  ${'TBD'.padStart(8)}  ${'TBD'.padStart(6)}`
  );
}

console.log('\nTo complete: look up each HIP star\'s ecliptic longitude at J2000.0');
console.log('and subtract Spica\'s longitude (201.298°) to get the sidereal value.');
```

- [ ] **Step 2: Commit**

```bash
git add scripts/verify-mansion-boundaries.mjs
git commit -m "feat(seven-governors): mansion boundary verification script"
```

---

## Data Sourcing Checklist

The following data must be sourced from classical texts. Each item blocks full accuracy but not the code structure:

- [ ] **Mansion boundaries** (Task 3): Verify all 28 `startDeg` values against Hipparcos ecliptic longitudes
- [ ] **Palace starting palace** (Task 5): Confirm 辰宮 at 0° against 《果老星宗》
- [ ] **Purple Qi coefficients** (Task 8): Source `PURPLE_QI_EPOCH_LON` and exact period from 《果老星宗》/《大統曆》
- [ ] **Dignity table** (Task 10): Populate all 132 entries from 《果老星宗》 (currently Sun/Moon filled, rest placeholder)
- [ ] **Star spirits** (Task 12): Add remaining ~40-80 rules from 《果老星宗》
- [ ] **Named aspects** (Task 11): Add named configurations from 《果老星宗》
