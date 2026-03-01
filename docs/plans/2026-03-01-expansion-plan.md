# stembranch v0.2.0 Expansion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace astronomy-engine with full VSOP87B, add 8 new relation modules, remove approximate mode, purge pinyin from iching4d.

**Architecture:** Self-contained VSOP87B evaluator (2,564 terms) replaces astronomy-engine. New modules follow existing patterns: constants + pure functions + types. iching4d bridge aliases replaced with direct imports.

**Tech Stack:** TypeScript 5.7+, Vitest 3.0, tsup (ESM+CJS)

---

## Phase 1: VSOP87B Precision Upgrade (Tasks 1-4)

Replace astronomy-engine with self-contained full-precision solar longitude computation.

### Task 1: Extract VSOP87B Earth coefficient data

**Files:**
- Create: `src/vsop87b-earth.ts`
- Test: `tests/vsop87b-earth.test.ts`

**Context:** The full VSOP87B Earth data is in `/tmp/vsop87-multilang/Languages/Typescript/VSOP87B_Full.ts` (public domain, Greg Miller 2023). It has 3 coordinates (B, L, R), each with 6 polynomial series, each series containing `[amplitude, phase, frequency]` triplets. Total: 2,564 terms. We only need L (longitude, 1,184 terms) and R (radius, 978 terms) for solar position. B (latitude) is negligible for ecliptic longitude but include it for completeness (402 terms).

**Step 1: Write the failing test**

```typescript
// tests/vsop87b-earth.test.ts
import { describe, it, expect } from 'vitest';
import { EARTH_L, EARTH_B, EARTH_R, evaluateVsopSeries } from '../src/vsop87b-earth';

describe('VSOP87B Earth coefficients', () => {
  it('has 6 series for longitude (L)', () => {
    expect(EARTH_L).toHaveLength(6);
  });

  it('has 6 series for latitude (B)', () => {
    expect(EARTH_B).toHaveLength(6);
  });

  it('has 6 series for radius (R)', () => {
    expect(EARTH_R).toHaveLength(6);
  });

  it('L0 has 624 terms', () => {
    expect(EARTH_L[0]).toHaveLength(624);
  });

  it('each term is [amplitude, phase, frequency]', () => {
    const term = EARTH_L[0][0];
    expect(term).toHaveLength(3);
    expect(typeof term[0]).toBe('number');
    expect(typeof term[1]).toBe('number');
    expect(typeof term[2]).toBe('number');
  });
});

describe('evaluateVsopSeries', () => {
  it('evaluates a simple single-term series', () => {
    // Single term: 1.0 * cos(0 + 0 * t) = 1.0
    const series: [number, number, number][][] = [[[1.0, 0, 0]]];
    expect(evaluateVsopSeries(series, 0)).toBeCloseTo(1.0, 10);
  });

  it('multiplies higher series by t^n', () => {
    // series[1] = [[1.0, 0, 0]] -> 1.0 * t^1 at t=2 -> 2.0
    const series: [number, number, number][][] = [[], [[1.0, 0, 0]]];
    expect(evaluateVsopSeries(series, 2.0)).toBeCloseTo(2.0, 10);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/4n6h4x0r/src/stembranch && npx vitest run tests/vsop87b-earth.test.ts`
Expected: FAIL (module not found)

**Step 3: Write the data extraction script**

Create a Node script to parse VSOP87B_Full.ts and output coefficient arrays as JSON, then convert to TypeScript:

```bash
# Extract Earth data from VSOP87B_Full.ts into our format
node -e "
const fs = require('fs');
const src = fs.readFileSync('/tmp/vsop87-multilang/Languages/Typescript/VSOP87B_Full.ts', 'utf8');

function extractCoeffs(src, coord) {
  const methodRe = new RegExp('private static earth_' + coord + '\\\\(t: number\\\\): number \\\\{([\\\\s\\\\S]*?)\\n    \\\\}');
  const body = src.match(methodRe)[1];
  const series = [];
  for (let n = 0; n <= 5; n++) {
    const terms = [];
    const termRe = /([\\d.e+-]+)\\*Math\\.cos\\(\\s*([\\d.e+-]+)\\s*\\+\\s*([\\d.e+-]+)\\s*\\*\\s*t\\)/g;
    const seriesRe = new RegExp('let earth_' + coord + '_' + n + '[\\\\s\\\\S]*?(?=let earth_' + coord + '_' + (n+1) + '|return )');
    const seriesBody = body.match(seriesRe);
    if (!seriesBody) { series.push([]); continue; }
    let m;
    while ((m = termRe.exec(seriesBody[0])) !== null) {
      terms.push([parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])]);
    }
    series.push(terms);
  }
  return series;
}

const data = {
  L: extractCoeffs(src, 'l'),
  B: extractCoeffs(src, 'b'),
  R: extractCoeffs(src, 'r'),
};
console.log('L terms:', data.L.map(s => s.length));
console.log('B terms:', data.B.map(s => s.length));
console.log('R terms:', data.R.map(s => s.length));
fs.writeFileSync('/tmp/vsop87b-earth.json', JSON.stringify(data));
"
```

Then generate `src/vsop87b-earth.ts` from the JSON. The file structure:

```typescript
// src/vsop87b-earth.ts
// VSOP87B Earth coefficients (Bretagnon & Francou 1988)
// Full precision: 2,564 terms. Public domain data from gmiller123456/vsop87-multilang.
// Each term: [amplitude, phase, frequency] where value = A * cos(B + C * t)
// t = Julian centuries from J2000.0 (TDB)

/** Heliocentric ecliptic longitude series (1,184 terms across 6 series) */
export const EARTH_L: readonly (readonly [number, number, number])[][] = [
  // L0: 624 terms
  [ [1.75347045673, 0, 0], [0.03341656453, 4.66925680415, 6283.0758499914], ... ],
  // L1-L5...
];

/** Heliocentric ecliptic latitude series (402 terms) */
export const EARTH_B: readonly (readonly [number, number, number])[][] = [ ... ];

/** Heliocentric radius vector series (978 terms) */
export const EARTH_R: readonly (readonly [number, number, number])[][] = [ ... ];

/**
 * Evaluate a VSOP87 series: sum over n of (sum_i A_i * cos(B_i + C_i * t)) * t^n
 */
export function evaluateVsopSeries(
  series: readonly (readonly [number, number, number])[][],
  t: number,
): number {
  let result = 0;
  for (let n = series.length - 1; n >= 0; n--) {
    let sum = 0;
    for (const [A, B, C] of series[n]) {
      sum += A * Math.cos(B + C * t);
    }
    result = result * t + sum; // Horner's method
  }
  return result;
}
```

**Step 4: Run tests to verify they pass**

Run: `cd /Users/4n6h4x0r/src/stembranch && npx vitest run tests/vsop87b-earth.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/vsop87b-earth.ts tests/vsop87b-earth.test.ts
git commit -m "feat: add full VSOP87B Earth coefficients (2,564 terms)"
```

---

### Task 2: Solar longitude computation

**Files:**
- Create: `src/solar-longitude.ts`
- Test: `tests/solar-longitude.test.ts`

**Context:** This replaces astronomy-engine's `SearchSunLongitude`. We need: (1) VSOP87B heliocentric ecliptic longitude, (2) convert to geocentric, (3) apply aberration (~20.5"), (4) apply nutation, (5) iterative solver (binary search) to find when sun crosses a target longitude.

**Step 1: Write the failing test**

```typescript
// tests/solar-longitude.test.ts
import { describe, it, expect } from 'vitest';
import { getSunLongitude, findSunLongitudeMoment } from '../src/solar-longitude';

describe('getSunLongitude', () => {
  it('returns longitude in degrees [0, 360)', () => {
    // J2000.0 epoch: 2000-01-01T12:00:00 TDB
    const lon = getSunLongitude(new Date(Date.UTC(2000, 0, 1, 12, 0, 0)));
    expect(lon).toBeGreaterThanOrEqual(0);
    expect(lon).toBeLessThan(360);
  });

  it('matches known value for 2000-03-20 (vernal equinox)', () => {
    // Vernal equinox 2000: ~Mar 20, 07:35 UTC
    // Sun longitude should be ~0 degrees
    const lon = getSunLongitude(new Date(Date.UTC(2000, 2, 20, 7, 35, 0)));
    expect(lon).toBeCloseTo(0, 0); // within 1 degree
  });

  it('matches known value for 2000-06-21 (summer solstice)', () => {
    // Summer solstice 2000: ~Jun 21, 01:48 UTC
    const lon = getSunLongitude(new Date(Date.UTC(2000, 5, 21, 1, 48, 0)));
    expect(lon).toBeCloseTo(90, 0);
  });
});

describe('findSunLongitudeMoment', () => {
  it('finds vernal equinox 2024 (longitude 0)', () => {
    const result = findSunLongitudeMoment(0, new Date(Date.UTC(2024, 1, 1)), 60);
    // Vernal equinox 2024: Mar 20, 03:06 UTC
    expect(result).not.toBeNull();
    expect(result!.getUTCMonth()).toBe(2); // March
    expect(result!.getUTCDate()).toBe(20);
  });

  it('finds Start of Spring 2024 (longitude 315)', () => {
    const result = findSunLongitudeMoment(315, new Date(Date.UTC(2024, 0, 1)), 60);
    // 立春 2024: Feb 4, 16:27 UTC
    expect(result).not.toBeNull();
    expect(result!.getUTCMonth()).toBe(1); // February
    expect(result!.getUTCDate()).toBe(4);
  });

  it('returns null if target not found in range', () => {
    // Search only 1 day - won't cross 180 degrees
    const result = findSunLongitudeMoment(180, new Date(Date.UTC(2024, 0, 1)), 1);
    expect(result).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/4n6h4x0r/src/stembranch && npx vitest run tests/solar-longitude.test.ts`
Expected: FAIL

**Step 3: Write the implementation**

```typescript
// src/solar-longitude.ts
import { EARTH_L, EARTH_B, EARTH_R, evaluateVsopSeries } from './vsop87b-earth';

const DEG = 180 / Math.PI;
const RAD = Math.PI / 180;
const ARCSEC_TO_RAD = RAD / 3600;

// Julian date of J2000.0 epoch
const J2000 = 2451545.0;

/** Convert a JS Date to Julian centuries from J2000.0 (TDB approximation) */
function dateToJulianCenturies(date: Date): number {
  const jd = date.getTime() / 86400000 + 2440587.5;
  return (jd - J2000) / 36525;
}

/** Convert a Julian centuries value back to a JS Date */
function julianCenturiesToDate(t: number): Date {
  const jd = t * 36525 + J2000;
  return new Date((jd - 2440587.5) * 86400000);
}

/**
 * Compute apparent geocentric ecliptic longitude of the Sun.
 * Steps: VSOP87B heliocentric -> geocentric -> aberration -> nutation
 */
export function getSunLongitude(date: Date): number {
  const t = dateToJulianCenturies(date);

  // Heliocentric ecliptic longitude (radians)
  const L = evaluateVsopSeries(EARTH_L, t);
  // Heliocentric ecliptic latitude (radians)
  // const B = evaluateVsopSeries(EARTH_B, t);

  // Convert to geocentric: add pi radians (180 degrees)
  let lon = L + Math.PI;

  // Normalize to [0, 2*PI)
  lon = lon % (2 * Math.PI);
  if (lon < 0) lon += 2 * Math.PI;

  // Aberration correction (~20.5 arcseconds)
  const R = evaluateVsopSeries(EARTH_R, t);
  const aberration = -20.4898 / R * ARCSEC_TO_RAD;
  lon += aberration;

  // Nutation in longitude (simplified IAU 2000B dominant terms)
  const omega = (125.04452 - 1934.136261 * t) * RAD;
  const Lsun = (280.4664567 + 360007.6982779 * t) * RAD;
  const Lmoon = (218.3165 + 481267.8813 * t) * RAD;
  const dpsi = (-17.20 * Math.sin(omega) - 1.32 * Math.sin(2 * Lsun)
                - 0.23 * Math.sin(2 * Lmoon) + 0.21 * Math.sin(2 * omega)) * ARCSEC_TO_RAD;
  lon += dpsi;

  // Convert to degrees and normalize
  let deg = lon * DEG;
  deg = ((deg % 360) + 360) % 360;
  return deg;
}

/**
 * Find the moment when the Sun's apparent longitude crosses a target value.
 * Binary search with ~1 second precision.
 *
 * @param targetLongitude - Target longitude in degrees (0-360)
 * @param startDate - Start of search window
 * @param searchDays - Number of days to search forward
 * @returns Date of crossing, or null if not found
 */
export function findSunLongitudeMoment(
  targetLongitude: number,
  startDate: Date,
  searchDays: number,
): Date | null {
  const step = 1; // days
  const startMs = startDate.getTime();
  const endMs = startMs + searchDays * 86400000;

  // Coarse scan: find the day where longitude crosses target
  let prevLon = getSunLongitude(new Date(startMs));
  let bracketStart = -1;
  let bracketEnd = -1;

  for (let ms = startMs + step * 86400000; ms <= endMs; ms += step * 86400000) {
    const lon = getSunLongitude(new Date(ms));

    // Check if target was crossed (handling 360->0 wrap)
    if (crossesTarget(prevLon, lon, targetLongitude)) {
      bracketStart = ms - step * 86400000;
      bracketEnd = ms;
      break;
    }
    prevLon = lon;
  }

  if (bracketStart < 0) return null;

  // Binary search to ~1 second precision
  let lo = bracketStart;
  let hi = bracketEnd;
  while (hi - lo > 1000) { // 1 second
    const mid = Math.floor((lo + hi) / 2);
    const lon = getSunLongitude(new Date(mid));
    if (crossesTarget(getSunLongitude(new Date(lo)), lon, targetLongitude)) {
      hi = mid;
    } else {
      lo = mid;
    }
  }

  return new Date(Math.floor((lo + hi) / 2));
}

/** Check if target longitude falls between two consecutive readings */
function crossesTarget(lon1: number, lon2: number, target: number): boolean {
  // Handle the 360->0 wrap-around
  if (Math.abs(lon2 - lon1) > 180) {
    // Wrap case: e.g., lon1=359, lon2=1
    if (target > 180) {
      return lon1 <= target || lon2 >= target - 360;
    } else {
      return lon1 >= 360 - (360 - target) || lon2 <= target;
    }
  }
  // Normal case: monotonically increasing
  if (lon1 <= lon2) {
    return lon1 <= target && target <= lon2;
  }
  return false;
}
```

**Step 4: Run tests**

Run: `cd /Users/4n6h4x0r/src/stembranch && npx vitest run tests/solar-longitude.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/solar-longitude.ts tests/solar-longitude.test.ts
git commit -m "feat: self-contained solar longitude with full VSOP87B precision"
```

---

### Task 3: Replace astronomy-engine in solar-terms.ts

**Files:**
- Modify: `src/solar-terms.ts`
- Modify: `tests/solar-terms.test.ts` (remove astronomy-engine mocks if any)
- Modify: `package.json` (remove astronomy-engine dependency)

**Context:** Replace `import { SearchSunLongitude, MakeTime } from 'astronomy-engine'` with `import { findSunLongitudeMoment } from './solar-longitude'`. The `findSolarTermMoment` function currently calls `SearchSunLongitude(longitude, startDate, 120)` -- replace with `findSunLongitudeMoment(longitude, startDate, 120)`.

**Step 1: Modify solar-terms.ts**

Replace lines 1-2:
```typescript
// OLD:
import { SearchSunLongitude, MakeTime, type AstroTime } from 'astronomy-engine';

// NEW:
import { findSunLongitudeMoment } from './solar-longitude';
```

Remove `astroTimeToDate` helper (lines 33-35).

Replace `findSolarTermMoment` body:
```typescript
export function findSolarTermMoment(targetLongitude: number, year: number, startMonth: number = 1): Date {
  const startDate = new Date(year, startMonth - 1, 1);
  const result = findSunLongitudeMoment(targetLongitude, startDate, 120);
  if (!result) {
    throw new Error(`Could not find solar longitude ${targetLongitude}° in year ${year}`);
  }
  return result;
}
```

**Step 2: Remove astronomy-engine from package.json**

```bash
cd /Users/4n6h4x0r/src/stembranch && npm uninstall astronomy-engine
```

**Step 3: Run ALL existing tests**

Run: `cd /Users/4n6h4x0r/src/stembranch && npx vitest run`
Expected: ALL PASS (161+ tests). The cross-validation tests are critical here -- they verify solar term boundaries against sxwnl.

**Step 4: Verify cross-validation precision improved**

Run: `cd /Users/4n6h4x0r/src/stembranch && npx vitest run tests/cross-validation.test.ts`
Expected: Solar term deviation should decrease from avg 12.6s to under 5s.

**Step 5: Commit**

```bash
git add src/solar-terms.ts package.json package-lock.json
git commit -m "feat: replace astronomy-engine with full VSOP87B (zero dependencies)"
```

---

### Task 4: Remove approximate mode

**Files:**
- Modify: `src/four-pillars.ts` (remove `getSolarMonthApprox`, remove `ComputeOptions.exact`, simplify)
- Modify: `tests/four-pillars.test.ts` (remove approximate mode tests)
- Modify: `src/index.ts` (remove `ComputeOptions` export if it becomes empty)

**Step 1: Simplify four-pillars.ts**

Delete `getSolarMonthApprox` function (lines 18-33).

Remove `ComputeOptions` interface (or remove the `exact` field). If no fields remain, delete the interface entirely.

Simplify `computeFourPillars` signature:
```typescript
// OLD:
export function computeFourPillars(date: Date, options: ComputeOptions = {}): FourPillars {
  const { exact = true } = options;

// NEW:
export function computeFourPillars(date: Date): FourPillars {
```

Remove all `if (exact) { ... } else { ... }` branches -- keep only the exact paths.

**Step 2: Update tests**

Remove any test cases that test approximate mode (`{ exact: false }`).

**Step 3: Run tests**

Run: `cd /Users/4n6h4x0r/src/stembranch && npx vitest run`
Expected: ALL PASS

**Step 4: Update index.ts**

Remove `ComputeOptions` type export if the interface was deleted.

**Step 5: Commit**

```bash
git add src/four-pillars.ts tests/four-pillars.test.ts src/index.ts
git commit -m "feat!: remove approximate mode, always use exact VSOP87B"
```

---

## Phase 2: New Relation Modules (Tasks 5-12)

Each module follows the same pattern: types in types.ts, constants + functions in module, test file with comprehensive coverage.

### Task 5: Hidden stems (地支藏干)

**Files:**
- Create: `src/hidden-stems.ts`
- Test: `tests/hidden-stems.test.ts`
- Modify: `src/types.ts` (add HiddenStem interface)
- Modify: `src/index.ts` (add exports)

**Step 1: Write the failing test**

```typescript
// tests/hidden-stems.test.ts
import { describe, it, expect } from 'vitest';
import { HIDDEN_STEMS, getHiddenStems } from '../src/hidden-stems';

describe('HIDDEN_STEMS', () => {
  it('maps all 12 branches', () => {
    expect(Object.keys(HIDDEN_STEMS)).toHaveLength(12);
  });

  it('子 contains only 癸', () => {
    expect(HIDDEN_STEMS['子']).toEqual([{ stem: '癸', proportion: 1 }]);
  });

  it('丑 contains 己癸辛 (main, middle, residual)', () => {
    const hidden = HIDDEN_STEMS['丑'];
    expect(hidden).toHaveLength(3);
    expect(hidden[0].stem).toBe('己');
    expect(hidden[1].stem).toBe('癸');
    expect(hidden[2].stem).toBe('辛');
  });

  it('寅 contains 甲丙戊', () => {
    const hidden = HIDDEN_STEMS['寅'];
    expect(hidden).toHaveLength(3);
    expect(hidden[0].stem).toBe('甲');
    expect(hidden[1].stem).toBe('丙');
    expect(hidden[2].stem).toBe('戊');
  });

  it('卯 contains only 乙', () => {
    expect(HIDDEN_STEMS['卯']).toEqual([{ stem: '乙', proportion: 1 }]);
  });

  it('酉 contains only 辛', () => {
    expect(HIDDEN_STEMS['酉']).toEqual([{ stem: '辛', proportion: 1 }]);
  });
});

describe('getHiddenStems', () => {
  it('returns stems for a branch', () => {
    const stems = getHiddenStems('申');
    expect(stems.map(s => s.stem)).toEqual(['庚', '壬', '戊']);
  });

  it('main stem is always first', () => {
    for (const branch of ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'] as const) {
      const stems = getHiddenStems(branch);
      expect(stems.length).toBeGreaterThanOrEqual(1);
      // First stem is the main (本氣)
      expect(stems[0].proportion).toBeGreaterThanOrEqual(0.5);
    }
  });
});
```

**Step 2: Run to verify failure**

Run: `cd /Users/4n6h4x0r/src/stembranch && npx vitest run tests/hidden-stems.test.ts`

**Step 3: Implement**

```typescript
// src/hidden-stems.ts
import type { Branch, Stem } from './types';

export interface HiddenStem {
  stem: Stem;
  proportion: number; // 0-1 (本氣 >= 0.5)
}

/** 地支藏干 — Hidden stems within each earthly branch */
export const HIDDEN_STEMS: Record<Branch, readonly HiddenStem[]> = {
  '子': [{ stem: '癸', proportion: 1 }],
  '丑': [{ stem: '己', proportion: 0.6 }, { stem: '癸', proportion: 0.2 }, { stem: '辛', proportion: 0.2 }],
  '寅': [{ stem: '甲', proportion: 0.6 }, { stem: '丙', proportion: 0.2 }, { stem: '戊', proportion: 0.2 }],
  '卯': [{ stem: '乙', proportion: 1 }],
  '辰': [{ stem: '戊', proportion: 0.6 }, { stem: '乙', proportion: 0.2 }, { stem: '癸', proportion: 0.2 }],
  '巳': [{ stem: '丙', proportion: 0.6 }, { stem: '庚', proportion: 0.2 }, { stem: '戊', proportion: 0.2 }],
  '午': [{ stem: '丁', proportion: 0.7 }, { stem: '己', proportion: 0.3 }],
  '未': [{ stem: '己', proportion: 0.6 }, { stem: '丁', proportion: 0.2 }, { stem: '乙', proportion: 0.2 }],
  '申': [{ stem: '庚', proportion: 0.6 }, { stem: '壬', proportion: 0.2 }, { stem: '戊', proportion: 0.2 }],
  '酉': [{ stem: '辛', proportion: 1 }],
  '戌': [{ stem: '戊', proportion: 0.6 }, { stem: '辛', proportion: 0.2 }, { stem: '丁', proportion: 0.2 }],
  '亥': [{ stem: '壬', proportion: 0.7 }, { stem: '甲', proportion: 0.3 }],
};

/** Get hidden stems for a branch (main stem first) */
export function getHiddenStems(branch: Branch): readonly HiddenStem[] {
  return HIDDEN_STEMS[branch];
}
```

Add `HiddenStem` interface to `src/types.ts` and exports to `src/index.ts`.

**Step 4: Run tests**

Run: `cd /Users/4n6h4x0r/src/stembranch && npx vitest run tests/hidden-stems.test.ts`

**Step 5: Commit**

```bash
git add src/hidden-stems.ts tests/hidden-stems.test.ts src/types.ts src/index.ts
git commit -m "feat: add hidden stems (地支藏干)"
```

---

### Task 6: Stem relations (天干五合 + 天干相沖)

**Files:**
- Create: `src/stem-relations.ts`
- Test: `tests/stem-relations.test.ts`
- Modify: `src/index.ts`

**Step 1: Write the failing test**

```typescript
// tests/stem-relations.test.ts
import { describe, it, expect } from 'vitest';
import {
  STEM_COMBINATIONS, STEM_CLASHES,
  isStemCombination, isStemClash, getCombinedElement,
} from '../src/stem-relations';

describe('STEM_COMBINATIONS (天干五合)', () => {
  it('has 5 combination pairs', () => {
    expect(STEM_COMBINATIONS).toHaveLength(5);
  });

  it('甲己合化土', () => {
    expect(isStemCombination('甲', '己')).toBe(true);
    expect(isStemCombination('己', '甲')).toBe(true);
    expect(getCombinedElement('甲', '己')).toBe('土');
  });

  it('乙庚合化金', () => {
    expect(isStemCombination('乙', '庚')).toBe(true);
    expect(getCombinedElement('乙', '庚')).toBe('金');
  });

  it('non-combination returns false', () => {
    expect(isStemCombination('甲', '乙')).toBe(false);
    expect(getCombinedElement('甲', '乙')).toBeNull();
  });
});

describe('STEM_CLASHES (天干相沖)', () => {
  it('has 4 clash pairs', () => {
    expect(STEM_CLASHES).toHaveLength(4);
  });

  it('甲庚相沖', () => {
    expect(isStemClash('甲', '庚')).toBe(true);
    expect(isStemClash('庚', '甲')).toBe(true);
  });

  it('non-clash returns false', () => {
    expect(isStemClash('甲', '乙')).toBe(false);
  });
});
```

**Step 2-5: Implement, test, commit**

```typescript
// src/stem-relations.ts
import type { Stem, Element } from './types';

export const STEM_COMBINATIONS: readonly { pair: [Stem, Stem]; element: Element }[] = [
  { pair: ['甲', '己'], element: '土' },
  { pair: ['乙', '庚'], element: '金' },
  { pair: ['丙', '辛'], element: '水' },
  { pair: ['丁', '壬'], element: '木' },
  { pair: ['戊', '癸'], element: '火' },
];

export const STEM_CLASHES: readonly [Stem, Stem][] = [
  ['甲', '庚'], ['乙', '辛'], ['丙', '壬'], ['丁', '癸'],
];

export function isStemCombination(a: Stem, b: Stem): boolean {
  return STEM_COMBINATIONS.some(({ pair: [x, y] }) => (a === x && b === y) || (a === y && b === x));
}

export function isStemClash(a: Stem, b: Stem): boolean {
  return STEM_CLASHES.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
}

export function getCombinedElement(a: Stem, b: Stem): Element | null {
  const found = STEM_COMBINATIONS.find(({ pair: [x, y] }) => (a === x && b === y) || (a === y && b === x));
  return found?.element ?? null;
}
```

Commit: `feat: add stem combinations and clashes (天干五合/相沖)`

---

### Task 7: Expand branch relations (三合, 三會, 刑, 害, 破)

**Files:**
- Modify: `src/branch-relations.ts` (add new constants + functions)
- Modify: `tests/branch-relations.test.ts` (add new test cases)
- Modify: `src/types.ts` (add PunishmentType)
- Modify: `src/index.ts` (add exports)

**Step 1: Write failing tests for all new relations**

Test cases for:
- `THREE_HARMONIES`: 4 groups of 3 branches + resulting element
- `SEASONAL_UNIONS`: 4 groups of 3 branches + resulting element
- `HALF_HARMONIES`: pairs from three-harmony groups
- `PUNISHMENT_GROUPS`: 3 punishment patterns with type
- `SELF_PUNISHMENT`: 4 branches
- `HARM_PAIRS`: 6 pairs
- `DESTRUCTION_PAIRS`: 6 pairs
- Query functions: `isThreeHarmony()`, `getThreeHarmonyElement()`, `isSeasonalUnion()`, `getSeasonalUnionElement()`, `isPunishment()`, `getPunishmentType()`, `isSelfPunishment()`, `isHarm()`, `isDestruction()`

**Step 2-5: Implement all, test, commit**

Key data:
```typescript
export const THREE_HARMONIES: readonly { branches: [Branch, Branch, Branch]; element: Element }[] = [
  { branches: ['申', '子', '辰'], element: '水' },
  { branches: ['寅', '午', '戌'], element: '火' },
  { branches: ['巳', '酉', '丑'], element: '金' },
  { branches: ['亥', '卯', '未'], element: '木' },
];

export const SEASONAL_UNIONS: readonly { branches: [Branch, Branch, Branch]; element: Element }[] = [
  { branches: ['寅', '卯', '辰'], element: '木' },
  { branches: ['巳', '午', '未'], element: '火' },
  { branches: ['申', '酉', '戌'], element: '金' },
  { branches: ['亥', '子', '丑'], element: '水' },
];

export const PUNISHMENT_GROUPS: readonly { branches: Branch[]; type: PunishmentType }[] = [
  { branches: ['寅', '巳', '申'], type: '無恩' },
  { branches: ['丑', '戌', '未'], type: '恃勢' },
  { branches: ['子', '卯'], type: '無禮' },
];

export const SELF_PUNISHMENT: readonly Branch[] = ['辰', '午', '酉', '亥'];

export const HARM_PAIRS: readonly [Branch, Branch][] = [
  ['子', '未'], ['丑', '午'], ['寅', '巳'], ['卯', '辰'], ['申', '亥'], ['酉', '戌'],
];

export const DESTRUCTION_PAIRS: readonly [Branch, Branch][] = [
  ['子', '酉'], ['丑', '辰'], ['寅', '亥'], ['卯', '午'], ['巳', '申'], ['未', '戌'],
];
```

Commit: `feat: add three harmonies, seasonal unions, punishment, harm, destruction`

---

### Task 8: Hidden harmony (暗合)

**Files:**
- Create: `src/hidden-harmony.ts`
- Test: `tests/hidden-harmony.test.ts`
- Modify: `src/index.ts`

**Context:** Two branches have 暗合 when their hidden stems form a 天干五合 pair. Derived from hidden-stems.ts + stem-relations.ts.

**Step 1: Write failing test**

```typescript
describe('HIDDEN_HARMONY_PAIRS', () => {
  it('丑寅暗合 (己甲合)', () => {
    expect(isHiddenHarmony('丑', '寅')).toBe(true);
  });
  it('卯申暗合 (乙庚合)', () => {
    expect(isHiddenHarmony('卯', '申')).toBe(true);
  });
  it('午亥暗合 (丁壬合)', () => {
    expect(isHiddenHarmony('午', '亥')).toBe(true);
  });
  it('non-hidden-harmony pair', () => {
    expect(isHiddenHarmony('子', '午')).toBe(false);
  });
});
```

**Step 2-5: Implement, test, commit**

Commit: `feat: add hidden harmony (暗合)`

---

### Task 9: Earth types and storage (濕土/燥土, 庫/墓)

**Files:**
- Create: `src/earth-types.ts`
- Test: `tests/earth-types.test.ts`
- Modify: `src/types.ts` (add EarthType)
- Modify: `src/index.ts`

**Step 1: Write failing test**

```typescript
describe('earth types', () => {
  it('辰丑 are wet earth', () => {
    expect(isWetEarth('辰')).toBe(true);
    expect(isWetEarth('丑')).toBe(true);
    expect(isDryEarth('辰')).toBe(false);
  });
  it('戌未 are dry earth', () => {
    expect(isDryEarth('戌')).toBe(true);
    expect(isDryEarth('未')).toBe(true);
  });
  it('non-earth branches return false', () => {
    expect(isWetEarth('子')).toBe(false);
    expect(isDryEarth('午')).toBe(false);
  });
});

describe('element storage', () => {
  it('辰 stores 水', () => {
    expect(getStorageElement('辰')).toBe('水');
  });
  it('戌 stores 火', () => {
    expect(getStorageElement('戌')).toBe('火');
  });
  it('丑 stores 金', () => {
    expect(getStorageElement('丑')).toBe('金');
  });
  it('未 stores 木', () => {
    expect(getStorageElement('未')).toBe('木');
  });
  it('non-storage branch returns null', () => {
    expect(getStorageElement('子')).toBeNull();
  });
});
```

**Step 2-5: Implement, test, commit**

Commit: `feat: add earth types and element storage (濕土/燥土, 庫/墓)`

---

### Task 10: Ten relations (十神)

**Files:**
- Create: `src/ten-relations.ts`
- Test: `tests/ten-relations.test.ts`
- Modify: `src/types.ts` (add TenRelations type)
- Modify: `src/index.ts`

**Step 1: Write failing test**

```typescript
describe('getTenRelation', () => {
  // Day stem 甲(木陽)
  it('甲 vs 甲 -> 比肩 (same element, same polarity)', () => {
    expect(getTenRelation('甲', '甲')).toBe('比肩');
  });
  it('甲 vs 乙 -> 劫財 (same element, diff polarity)', () => {
    expect(getTenRelation('甲', '乙')).toBe('劫財');
  });
  it('甲 vs 丙 -> 食神 (I generate, same polarity)', () => {
    expect(getTenRelation('甲', '丙')).toBe('食神');
  });
  it('甲 vs 丁 -> 傷官 (I generate, diff polarity)', () => {
    expect(getTenRelation('甲', '丁')).toBe('傷官');
  });
  it('甲 vs 戊 -> 偏財 (I conquer, same polarity)', () => {
    expect(getTenRelation('甲', '戊')).toBe('偏財');
  });
  it('甲 vs 己 -> 正財 (I conquer, diff polarity)', () => {
    expect(getTenRelation('甲', '己')).toBe('正財');
  });
  it('甲 vs 庚 -> 七殺 (conquers me, same polarity)', () => {
    expect(getTenRelation('甲', '庚')).toBe('七殺');
  });
  it('甲 vs 辛 -> 正官 (conquers me, diff polarity)', () => {
    expect(getTenRelation('甲', '辛')).toBe('正官');
  });
  it('甲 vs 壬 -> 偏印 (generates me, same polarity)', () => {
    expect(getTenRelation('甲', '壬')).toBe('偏印');
  });
  it('甲 vs 癸 -> 正印 (generates me, diff polarity)', () => {
    expect(getTenRelation('甲', '癸')).toBe('正印');
  });
});

describe('getTenRelationForBranch', () => {
  it('甲 day stem + 子 branch -> 偏印 (子 main stem = 癸水, generates 甲木)', () => {
    expect(getTenRelationForBranch('甲', '子')).toBe('正印');
  });
});
```

**Step 2-5: Implement, test, commit**

The implementation uses `STEM_ELEMENT` and `stemPolarity` from existing modules plus `getElementRelation` to derive the ten-relation classification.

Commit: `feat: add ten relations (十神)`

---

### Task 11: Twelve life stages (長生十二神)

**Files:**
- Create: `src/twelve-stages.ts`
- Test: `tests/twelve-stages.test.ts`
- Modify: `src/types.ts` (add LifeStage type)
- Modify: `src/index.ts`

**Step 1: Write failing test**

```typescript
describe('getLifeStage', () => {
  // 甲木 starts 長生 at 亥
  it('甲 at 亥 -> 長生', () => {
    expect(getLifeStage('甲', '亥')).toBe('長生');
  });
  it('甲 at 子 -> 沐浴', () => {
    expect(getLifeStage('甲', '子')).toBe('沐浴');
  });
  it('甲 at 午 -> 死', () => {
    expect(getLifeStage('甲', '午')).toBe('死');
  });
  it('甲 at 未 -> 墓', () => {
    expect(getLifeStage('甲', '未')).toBe('墓');
  });

  // Yin stems go counter-clockwise
  it('乙 at 午 -> 長生', () => {
    expect(getLifeStage('乙', '午')).toBe('長生');
  });
});

describe('TWELVE_STAGES', () => {
  it('has 12 stages', () => {
    expect(TWELVE_STAGES).toHaveLength(12);
  });
  it('starts with 長生', () => {
    expect(TWELVE_STAGES[0]).toBe('長生');
  });
});
```

**Step 2-5: Implement, test, commit**

Key data: Yang stem starting branches and clockwise progression, yin stem starting branches and counter-clockwise progression.

```typescript
const YANG_START: Record<string, number> = { '甲': 11, '丙': 2, '戊': 2, '庚': 5, '壬': 8 }; // branch indices
const YIN_START: Record<string, number> = { '乙': 6, '丁': 9, '己': 9, '辛': 0, '癸': 3 };
```

Commit: `feat: add twelve life stages (長生十二神)`

---

### Task 12: Cycle elements (納音)

**Files:**
- Create: `src/cycle-elements.ts`
- Test: `tests/cycle-elements.test.ts`
- Modify: `src/types.ts` (add CycleElement type alias if needed)
- Modify: `src/index.ts`

**Step 1: Write failing test**

```typescript
describe('getCycleElement', () => {
  it('甲子 -> 金 (海中金)', () => {
    expect(getCycleElement('甲子')).toBe('金');
    expect(getCycleElementName('甲子')).toBe('海中金');
  });
  it('乙丑 -> 金 (海中金, same pair)', () => {
    expect(getCycleElement('乙丑')).toBe('金');
  });
  it('丙寅 -> 火 (爐中火)', () => {
    expect(getCycleElement('丙寅')).toBe('火');
    expect(getCycleElementName('丙寅')).toBe('爐中火');
  });
  it('癸亥 -> 水 (大海水)', () => {
    expect(getCycleElement('癸亥')).toBe('水');
    expect(getCycleElementName('癸亥')).toBe('大海水');
  });
});

describe('CYCLE_ELEMENTS', () => {
  it('covers all 60 stem-branch pairs', () => {
    expect(Object.keys(CYCLE_ELEMENTS)).toHaveLength(60);
  });
  it('each pair has element and name', () => {
    for (const entry of Object.values(CYCLE_ELEMENTS)) {
      expect(['金','木','水','火','土']).toContain(entry.element);
      expect(typeof entry.name).toBe('string');
      expect(entry.name.length).toBeGreaterThan(0);
    }
  });
});
```

**Step 2-5: Implement with full 60-pair lookup table, test, commit**

The table is the traditional 納音 mapping (30 element names, each covering 2 consecutive stem-branch pairs):

```
甲子乙丑 海中金    丙寅丁卯 爐中火    戊辰己巳 大林木
庚午辛未 路旁土    壬申癸酉 劍鋒金    甲戌乙亥 山頭火
丙子丁丑 澗下水    戊寅己卯 城頭土    庚辰辛巳 白蠟金
壬午癸未 楊柳木    甲申乙酉 泉中水    丙戌丁亥 屋上土
戊子己丑 霹靂火    庚寅辛卯 松柏木    壬辰癸巳 長流水
甲午乙未 砂石金    丙申丁酉 山下火    戊戌己亥 平地木
庚子辛丑 壁上土    壬寅癸卯 金箔金    甲辰乙巳 佛燈火
丙午丁未 天河水    戊申己酉 大驛土    庚戌辛亥 釵釧金
壬子癸丑 桑柘木    甲寅乙卯 大溪水    丙辰丁巳 砂中土
戊午己未 天上火    庚申辛酉 石榴木    壬戌癸亥 大海水
```

Commit: `feat: add cycle elements (納音)`

---

## Phase 3: iching4d Pinyin Purge (Tasks 13-15)

### Task 13: Rename types and bridge files

**Files:**
- Modify: `src/lib/types.ts` (rename type aliases)
- Modify: `src/lib/data/five-elements.ts` -> rename to `src/lib/data/elements.ts`
- Modify: `src/lib/data/dizhi-relations.ts` -> rename to `src/lib/data/branch-relations.ts`
- Modify: `src/lib/data/four-pillars.ts` (update imports)

**Step 1: Update src/lib/types.ts**

Replace bridge aliases with direct imports:
```typescript
// OLD:
import type { Stem as _Stem, Branch as _Branch, ... } from 'stembranch';
export type TianGan = _Stem;
export type DiZhi = _Branch;

// NEW:
export type { Stem, Branch, StemBranch, Element, ElementRelation, Strength, Pillar, FourPillars, DayRelation } from 'stembranch';
```

Rename iching4d-specific types:
```typescript
// OLD:
export type LiuQin = '父' | '兄' | '官' | '財' | '子';
export type GuaXing = '純' | '遊魂' | '歸魂' | '六沖' | '六合';

// NEW:
export type SixRelation = '父' | '兄' | '官' | '財' | '子';
export type HexagramNature = '純' | '遊魂' | '歸魂' | '六沖' | '六合';
```

**Step 2: Rename bridge files**

```bash
cd /Users/4n6h4x0r/src/iching4d
git mv src/lib/data/five-elements.ts src/lib/data/elements.ts
git mv src/lib/data/dizhi-relations.ts src/lib/data/branch-relations.ts
```

**Step 3: Update elements.ts (was five-elements.ts)**

Remove bridge aliases, import directly:
```typescript
// OLD:
export { GENERATIVE_CYCLE as SHENG_CYCLE, ... } from 'stembranch';
export const WUXING_COLORS: Record<WuXing, ...> = { ... };

// NEW:
export { GENERATIVE_CYCLE, CONQUERING_CYCLE, getElementRelation, STEM_ELEMENT, STEMS, BRANCH_ELEMENT, BRANCHES, getStrength, STRENGTH, computeVoidBranches } from 'stembranch';
export const ELEMENT_COLORS: Record<Element, ...> = { ... };
export const ELEMENT_HEX_COLORS: Record<Element, ...> = { ... };
```

**Step 4: Run TypeScript compiler to find all broken references**

```bash
cd /Users/4n6h4x0r/src/iching4d && npx tsc --noEmit 2>&1 | head -100
```

Fix each error. This will cascade through all files that import the renamed types.

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor: rename type files and remove bridge aliases"
```

---

### Task 14: Rename all pinyin identifiers across components

**Files:**
- Every `.tsx` and `.ts` file that references old pinyin names

**Step 1: Global find-and-replace**

Use these exact replacements in order (longer names first to avoid partial matches):

```
WuXingRelationship -> ElementRelation
WUXING_HEX_COLORS -> ELEMENT_HEX_COLORS
WUXING_COLORS -> ELEMENT_COLORS
LIUCHONG_PAIRS -> CLASH_PAIRS
LIUHE_PAIRS -> HARMONY_PAIRS
QiStrength -> Strength
computeXunKong -> computeVoidBranches
getQiStrength -> getStrength
getRelationship -> getElementRelation
TIANGAN_ELEMENT -> STEM_ELEMENT
TIANGAN_ORDER -> STEMS
DIZHI_ELEMENT -> BRANCH_ELEMENT
DIZHI_ORDER -> BRANCHES
isLiuChong -> isClash
isLiuHe -> isHarmony
SHENG_CYCLE -> GENERATIVE_CYCLE
KE_CYCLE -> CONQUERING_CYCLE
QI_MOON -> STRENGTH
XunKong -> VoidBranches
TianGan -> Stem
DiZhi -> Branch
GanZhi -> StemBranch
WuXing -> Element
LiuQin -> SixRelation
GuaXing -> HexagramNature
TIANGAN -> STEMS
DIZHI -> BRANCHES
```

**Step 2: Fix imports in every file**

Update import paths:
```typescript
// OLD:
import { ... } from '../data/five-elements';
import { ... } from '../data/dizhi-relations';

// NEW:
import { ... } from '../data/elements';
import { ... } from '../data/branch-relations';
```

**Step 3: Run TypeScript compiler**

```bash
cd /Users/4n6h4x0r/src/iching4d && npx tsc --noEmit
```
Expected: 0 errors

**Step 4: Run all tests**

```bash
cd /Users/4n6h4x0r/src/iching4d && npx vitest run
```
Expected: ALL PASS (389 tests)

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor: purge all pinyin identifiers, adopt stembranch English convention"
```

---

### Task 15: Rename test files and update test imports

**Files:**
- Rename: `src/__tests__/lib/dizhi-relations.test.ts` -> `src/__tests__/lib/branch-relations.test.ts`
- Rename: `src/__tests__/lib/five-elements.test.ts` -> `src/__tests__/lib/elements.test.ts`
- Update all test files that import old names

**Step 1: Rename test files**

```bash
cd /Users/4n6h4x0r/src/iching4d
git mv src/__tests__/lib/dizhi-relations.test.ts src/__tests__/lib/branch-relations.test.ts
git mv src/__tests__/lib/five-elements.test.ts src/__tests__/lib/elements.test.ts
```

**Step 2: Update imports and identifiers in all test files**

Apply same find-and-replace as Task 14 to all `*.test.ts` and `*.test.tsx` files.

**Step 3: Run all tests**

```bash
cd /Users/4n6h4x0r/src/iching4d && npx vitest run
```
Expected: ALL PASS

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor: rename test files to match English convention"
```

---

## Phase 4: Update iching4d stembranch dependency (Task 16)

### Task 16: Update iching4d to use new stembranch exports

**Files:**
- Modify: `package.json` (update stembranch dependency reference)
- Modify: `src/lib/data/four-pillars.ts` (remove `{ exact: false }` override)

**Step 1: Update four-pillars.ts bridge**

```typescript
// OLD:
export function computeFourPillars(date: Date, options?: ComputeOptions): FourPillars {
  return _computeFourPillars(date, { exact: false, ...options });
}

// NEW:
export { computeFourPillars } from 'stembranch';
```

**Step 2: Update stembranch dependency**

```bash
cd /Users/4n6h4x0r/src/iching4d && npm update stembranch
```

**Step 3: Add new stembranch exports to iching4d re-exports if needed**

If iching4d needs any of the new modules (hidden stems, ten relations, etc.), add re-exports.

**Step 4: Run all tests**

```bash
cd /Users/4n6h4x0r/src/iching4d && npx vitest run
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: update stembranch dependency, remove approximate mode override"
```

---

## Phase 5: Documentation and Release (Task 17)

### Task 17: Update README and tag release

**Files:**
- Modify: `README.md` (update API reference with new modules)
- Modify: `package.json` (bump version to 0.2.0)

**Step 1: Update README**

- Add new modules to API reference section
- Update "Zero dependencies" claim (now true)
- Update precision claims (now 0.1 arcsecond)
- Add CHANGELOG section or separate CHANGELOG.md
- Remove any references to approximate mode

**Step 2: Bump version**

```bash
cd /Users/4n6h4x0r/src/stembranch
npm version minor --no-git-tag-version
```

**Step 3: Run full test suite one final time**

```bash
npx vitest run --coverage
```
Expected: ALL PASS, 100% coverage

**Step 4: Commit and tag**

```bash
git add -A
git commit -m "chore: release v0.2.0"
git tag v0.2.0
git push && git push --tags
```
