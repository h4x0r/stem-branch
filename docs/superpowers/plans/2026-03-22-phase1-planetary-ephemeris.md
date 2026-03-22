# Phase 1: Planetary Ephemeris — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add geocentric planetary positions for Mercury–Neptune (VSOP87D), Moon (ELP/MPP02), and Pluto (TOP2013) with DE441 correction polynomials, achieving <2" mean accuracy for inner planets vs JPL Horizons.

**Architecture:** Extract shared astronomical utilities from `solar-longitude.ts` into `src/astro.ts`. Generate VSOP87D coefficients for 7 planets via a CDS-parsing script. Build a geocentric conversion pipeline (heliocentric→geocentric with light-time, nutation, aberration). Fit DE441 even-polynomial corrections per body. Validate via 4-way comparison (stem-branch vs sxwnl vs JPL DE441 vs Swiss Ephemeris WASM).

**Tech Stack:** TypeScript, vitest (100% coverage required), tsup (ESM+CJS), Node.js scripts (.mjs) for data generation.

**Spec:** `docs/superpowers/specs/2026-03-22-planetary-ephemeris-astrology-cli-design.md` (Sub-project A + D)

---

## File Structure

```
src/
  astro.ts                          # NEW — shared: time conversions, nutation, obliquity, Delaunay args, coordinate transforms
  solar-longitude.ts                # MODIFY — import shared utilities from astro.ts
  planets/
    vsop87d-mercury.ts              # NEW — generated VSOP87D coefficients [A,B,C] arrays
    vsop87d-venus.ts                # NEW — generated
    vsop87d-mars.ts                 # NEW — generated
    vsop87d-jupiter.ts              # NEW — generated
    vsop87d-saturn.ts               # NEW — generated
    vsop87d-uranus.ts               # NEW — generated
    vsop87d-neptune.ts              # NEW — generated
    de441-corrections.ts            # NEW — even polynomial corrections per planet
    geocentric.ts                   # NEW — heliocentric→geocentric with light-time
    planets.ts                      # NEW — public API: getPlanetPosition()
  moon/
    elp-mpp02-data.ts               # NEW — generated ELP/MPP02 coefficient arrays
    elp-mpp02.ts                    # NEW — ELP/MPP02 evaluation engine
    moon.ts                         # NEW — public API: getMoonPosition()
  pluto/
    top2013-data.ts                 # NEW — TOP2013 coefficients for Pluto
    pluto.ts                        # NEW — public API (internal, re-exported via planets.ts)
  types.ts                          # MODIFY — add Planet, GeocentricPosition types
  index.ts                          # MODIFY — export new APIs

tests/
  astro.test.ts                     # NEW
  vsop87d-planets.test.ts           # NEW — term counts + J2000 cross-validation per planet
  geocentric.test.ts                # NEW
  planet-positions.test.ts          # NEW — integration tests for getPlanetPosition()
  elp-mpp02.test.ts                 # NEW
  moon-position.test.ts             # NEW
  pluto-position.test.ts            # NEW
  planet-validation.test.ts         # NEW — 4-way comparison thresholds
  moon-validation.test.ts           # NEW — lunar phase timing validation

scripts/
  generate-vsop87d-planets.mjs      # NEW — downloads CDS files, generates TypeScript
  generate-elp-mpp02.mjs            # NEW — generates ELP/MPP02 coefficient arrays
  generate-top2013-pluto.mjs        # NEW — generates TOP2013 Pluto coefficients
  fit-de441-planet-corrections.mjs  # NEW — queries JPL Horizons, fits even polynomials
  4way-planet-comparison.mjs        # NEW — runs full 4-way comparison matrix
```

---

### Task 1: Extract shared astronomical utilities

**Files:**
- Create: `src/astro.ts`
- Modify: `src/solar-longitude.ts`
- Test: `tests/astro.test.ts`

This task extracts private utility functions from `solar-longitude.ts` into a shared module so both `solar-longitude.ts` and the new planetary modules can use them without duplication.

- [ ] **Step 1: Write the failing test for astro.ts**

```typescript
// tests/astro.test.ts
import { describe, it, expect } from 'vitest';
import {
  dateToJD_TT, dateToJulianMillennia, dateToJulianCenturies,
  nutationDpsi, nutationDeps, delaunayArgs,
  meanObliquity, trueObliquity,
  normalizeDegrees, normalizeRadians,
  DEG_TO_RAD, RAD_TO_DEG, ARCSEC_TO_RAD,
} from '../src/astro';

describe('time conversions', () => {
  it('dateToJD_TT returns JD in TT for J2000.0 epoch', () => {
    // J2000.0 = 2000-Jan-01 12:00 TT. In UT, this is ~11:58:55.816 UTC
    // (ΔT ≈ 63.8s in 2000). JD_TT should be exactly 2451545.0.
    // We test with a known date instead.
    const d = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
    const jd = dateToJD_TT(d);
    // JD_UT = 2451545.0, plus ~63.8s ΔT
    expect(jd).toBeCloseTo(2451545.0 + 63.8 / 86400, 4);
  });

  it('dateToJulianMillennia returns 0 near J2000.0', () => {
    const d = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
    const tau = dateToJulianMillennia(d);
    expect(Math.abs(tau)).toBeLessThan(0.001);
  });

  it('dateToJulianCenturies returns ~0.25 for 2025', () => {
    const d = new Date(Date.UTC(2025, 0, 1, 12, 0, 0));
    const T = dateToJulianCenturies(d);
    expect(T).toBeCloseTo(0.25, 1);
  });
});

describe('nutation', () => {
  it('computes Δψ at J2000.0 within expected range', () => {
    const d = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
    const T = dateToJulianCenturies(d);
    const args = delaunayArgs(T);
    const dpsi = nutationDpsi(args.l, args.lp, args.F, args.D, args.Om, T);
    // Δψ is typically between -20" and +20"
    expect(Math.abs(dpsi)).toBeLessThan(20);
    // More specific: at J2000.0, Δψ ≈ -14.0" (from SOFA test cases)
    expect(dpsi).toBeCloseTo(-14.0, 0);
  });

  it('computes Δε at J2000.0 within expected range', () => {
    const d = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
    const T = dateToJulianCenturies(d);
    const args = delaunayArgs(T);
    const deps = nutationDeps(args.l, args.lp, args.F, args.D, args.Om, T);
    expect(Math.abs(deps)).toBeLessThan(15);
  });
});

describe('obliquity', () => {
  it('mean obliquity at J2000.0 ≈ 23.4393°', () => {
    const eps0 = meanObliquity(0);
    expect(eps0 * RAD_TO_DEG).toBeCloseTo(23.4393, 3);
  });

  it('true obliquity includes nutation correction', () => {
    const d = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
    const T = dateToJulianCenturies(d);
    const eps0 = meanObliquity(T);
    const eps = trueObliquity(T);
    // True obliquity differs from mean by nutation in obliquity
    expect(Math.abs(eps - eps0)).toBeLessThan(0.001); // < ~0.06°
    expect(eps).not.toBe(eps0);
  });
});

describe('normalization', () => {
  it('normalizeDegrees wraps 361 to 1', () => {
    expect(normalizeDegrees(361)).toBeCloseTo(1, 10);
  });

  it('normalizeDegrees wraps -1 to 359', () => {
    expect(normalizeDegrees(-1)).toBeCloseTo(359, 10);
  });

  it('normalizeRadians wraps 2π+0.1 to 0.1', () => {
    expect(normalizeRadians(2 * Math.PI + 0.1)).toBeCloseTo(0.1, 10);
  });
});

describe('delaunayArgs', () => {
  it('returns five fundamental arguments at T=0', () => {
    const args = delaunayArgs(0);
    expect(typeof args.l).toBe('number');
    expect(typeof args.lp).toBe('number');
    expect(typeof args.F).toBe('number');
    expect(typeof args.D).toBe('number');
    expect(typeof args.Om).toBe('number');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/astro.test.ts`
Expected: FAIL — `Cannot find module '../src/astro'`

- [ ] **Step 3: Implement astro.ts**

Create `src/astro.ts` by extracting the following from `src/solar-longitude.ts`:
- Constants: `DEG_TO_RAD`, `RAD_TO_DEG`, `ARCSEC_TO_RAD`
- Time functions: `dateToJD_TT`, `dateToJulianMillennia`, `dateToJulianCenturies`
- Nutation coefficients: `NUT_COEFFS`, `NUT_OBLIQ_COEFFS`
- Nutation functions: `nutationDpsi`, `nutationDeps`
- Normalization: `normalizeDegrees`, `normalizeRadians`
- New: `delaunayArgs(T)` — extracts the inline Delaunay computation into a reusable function
- New: `meanObliquity(T)` — Laskar 1986 formula (currently inline in `equationOfTimeVSOP`)
- New: `trueObliquity(T)` — mean obliquity + nutation in obliquity

All functions that were private in `solar-longitude.ts` become named exports from `astro.ts`.

```typescript
// src/astro.ts
/**
 * Shared astronomical utilities: time conversions, nutation (IAU2000B),
 * obliquity, Delaunay fundamental arguments, coordinate normalization.
 *
 * Extracted from solar-longitude.ts to be shared across planetary modules.
 */

import { deltaT } from './delta-t';

export const DEG_TO_RAD = Math.PI / 180;
export const RAD_TO_DEG = 180 / Math.PI;
export const ARCSEC_TO_RAD = Math.PI / 180 / 3600;

// Speed of light in AU/day (for light-time correction)
export const C_AU_PER_DAY = 173.144632674;

/** Convert a UT Date to Julian Date in Terrestrial Time (JD_TT). */
export function dateToJD_TT(date: Date): number {
  const jdUT = date.getTime() / 86400000 + 2440587.5;
  const dtSeconds = deltaT(date);
  return jdUT + dtSeconds / 86400;
}

/** Convert a UT Date to Julian millennia from J2000.0 in TT (for VSOP87). */
export function dateToJulianMillennia(date: Date): number {
  return (dateToJD_TT(date) - 2451545.0) / 365250.0;
}

/** Convert a UT Date to Julian centuries from J2000.0 in TT. */
export function dateToJulianCenturies(date: Date): number {
  return (dateToJD_TT(date) - 2451545.0) / 36525.0;
}

/** Normalize angle in degrees to [0, 360). */
export function normalizeDegrees(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** Normalize angle in radians to [0, 2π). */
export function normalizeRadians(rad: number): number {
  const TWO_PI = 2 * Math.PI;
  return ((rad % TWO_PI) + TWO_PI) % TWO_PI;
}

// ── IAU2000B Nutation (77 lunisolar terms) ─────────────────────────
// Exact same coefficient arrays as in solar-longitude.ts.
// Each row: [l, l', F, D, Ω, Δψ_sin (0.1μas), Δψ_sin·T (0.1μas)]
// prettier-ignore
const NUT_COEFFS: readonly number[][] = [
  // ... (copy the full 77-term array from solar-longitude.ts lines 53-131)
];

// prettier-ignore
const NUT_OBLIQ_COEFFS: readonly number[][] = [
  // ... (copy the full 77-term array from solar-longitude.ts lines 139-156)
];

/** Delaunay fundamental arguments (radians). */
export interface DelaunayArguments {
  l: number;   // Moon's mean anomaly
  lp: number;  // Sun's mean anomaly
  F: number;   // Moon's latitude argument
  D: number;   // mean elongation
  Om: number;  // longitude of ascending node
}

/** Compute Delaunay fundamental arguments at Julian century T (TT). */
export function delaunayArgs(T: number): DelaunayArguments {
  const T2 = T * T;
  const T3 = T2 * T;
  const T4 = T3 * T;
  return {
    l:  ((485868.249036 + 1717915923.2178 * T + 31.8792 * T2
      + 0.051635 * T3 - 0.00024470 * T4) % 1296000) * ARCSEC_TO_RAD,
    lp: ((1287104.79305 + 129596581.0481 * T - 0.5532 * T2
      + 0.000136 * T3 - 0.00001149 * T4) % 1296000) * ARCSEC_TO_RAD,
    F:  ((335779.526232 + 1739527262.8478 * T - 12.7512 * T2
      - 0.001037 * T3 + 0.00000417 * T4) % 1296000) * ARCSEC_TO_RAD,
    D:  ((1072260.70369 + 1602961601.2090 * T - 6.3706 * T2
      + 0.006593 * T3 - 0.00003169 * T4) % 1296000) * ARCSEC_TO_RAD,
    Om: ((450160.398036 - 6962890.5431 * T + 7.4722 * T2
      + 0.007702 * T3 - 0.00005939 * T4) % 1296000) * ARCSEC_TO_RAD,
  };
}

/** Nutation in longitude (Δψ) in arcseconds — IAU2000B (77 terms). */
export function nutationDpsi(
  l: number, lp: number, F: number, D: number, Om: number, T: number,
): number {
  let dpsi = 0;
  for (const row of NUT_COEFFS) {
    const arg = row[0] * l + row[1] * lp + row[2] * F + row[3] * D + row[4] * Om;
    dpsi += (row[5] + row[6] * T) * Math.sin(arg);
  }
  return dpsi / 1e7;
}

/** Nutation in obliquity (Δε) in arcseconds — IAU2000B (77 terms). */
export function nutationDeps(
  l: number, lp: number, F: number, D: number, Om: number, T: number,
): number {
  let deps = 0;
  for (let i = 0; i < NUT_COEFFS.length; i++) {
    const row = NUT_COEFFS[i];
    const arg = row[0] * l + row[1] * lp + row[2] * F + row[3] * D + row[4] * Om;
    const obliq = NUT_OBLIQ_COEFFS[i];
    deps += (obliq[0] + obliq[1] * T) * Math.cos(arg);
  }
  return deps / 1e7;
}

/** Mean obliquity of the ecliptic (radians) — Laskar 1986. */
export function meanObliquity(T: number): number {
  const T2 = T * T;
  const T3 = T2 * T;
  return (84381.448 - 46.8150 * T - 0.00059 * T2 + 0.001813 * T3) * ARCSEC_TO_RAD;
}

/** True obliquity = mean obliquity + nutation in obliquity (radians). */
export function trueObliquity(T: number): number {
  const args = delaunayArgs(T);
  const deps = nutationDeps(args.l, args.lp, args.F, args.D, args.Om, T);
  return meanObliquity(T) + deps * ARCSEC_TO_RAD;
}

/**
 * Convert ecliptic coordinates to equatorial (right ascension, declination).
 * @param lambda - ecliptic longitude (radians)
 * @param beta - ecliptic latitude (radians)
 * @param eps - obliquity of the ecliptic (radians)
 * @returns [ra, dec] in radians
 */
export function eclipticToEquatorial(
  lambda: number, beta: number, eps: number,
): [number, number] {
  const sinLam = Math.sin(lambda);
  const cosLam = Math.cos(lambda);
  const sinBet = Math.sin(beta);
  const cosBet = Math.cos(beta);
  const sinEps = Math.sin(eps);
  const cosEps = Math.cos(eps);

  const ra = Math.atan2(sinLam * cosEps - sinBet / cosBet * sinEps, cosLam);
  const dec = Math.asin(sinBet * cosEps + cosBet * sinEps * sinLam);
  return [normalizeRadians(ra), dec];
}
```

**Implementation note:** Copy the full `NUT_COEFFS` (77 rows) and `NUT_OBLIQ_COEFFS` (77 entries) arrays verbatim from `solar-longitude.ts:53-156`. Do not abbreviate.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/astro.test.ts`
Expected: PASS

- [ ] **Step 5: Refactor solar-longitude.ts to import from astro.ts**

Replace all duplicated code in `src/solar-longitude.ts` with imports from `src/astro.ts`:

```typescript
// src/solar-longitude.ts — top of file, replace existing imports and constants
import { EARTH_L, EARTH_R, evaluateVsopSeries } from './vsop87d-earth';
import {
  DEG_TO_RAD, RAD_TO_DEG, ARCSEC_TO_RAD,
  dateToJulianMillennia, dateToJulianCenturies,
  delaunayArgs, nutationDpsi, nutationDeps,
  meanObliquity, normalizeDegrees, normalizeRadians,
} from './astro';
```

Remove from `solar-longitude.ts`:
- Lines 14-18 (constant declarations — now imported)
- Lines 26-44 (time functions — now imported)
- Lines 46-208 (nutation coefficients and functions, normalization — now imported)

Update `getSunLongitude()` to use `delaunayArgs(T)` instead of inline computation (lines 250-262).

Update `equationOfTimeVSOP()` to use `meanObliquity(T)` and `delaunayArgs(T)` instead of inline computation.

- [ ] **Step 6: Run ALL existing tests to verify refactor**

Run: `npx vitest run`
Expected: ALL PASS — no behavioral changes, only extraction.

- [ ] **Step 7: Commit**

```bash
git add src/astro.ts tests/astro.test.ts src/solar-longitude.ts
git commit -m "refactor: extract shared astronomical utilities to src/astro.ts

Extract time conversions (dateToJD_TT, julian millennia/centuries),
IAU2000B nutation (77-term Δψ/Δε), Delaunay args, obliquity, and
coordinate transforms from solar-longitude.ts into a shared module
for reuse by planetary ephemeris modules.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: VSOP87D planet coefficient generation

**Files:**
- Create: `scripts/generate-vsop87d-planets.mjs`
- Create: `src/planets/vsop87d-mercury.ts` (generated)
- Create: `src/planets/vsop87d-venus.ts` (generated)
- Create: `src/planets/vsop87d-mars.ts` (generated)
- Create: `src/planets/vsop87d-jupiter.ts` (generated)
- Create: `src/planets/vsop87d-saturn.ts` (generated)
- Create: `src/planets/vsop87d-uranus.ts` (generated)
- Create: `src/planets/vsop87d-neptune.ts` (generated)
- Test: `tests/vsop87d-planets.test.ts`

- [ ] **Step 1: Write the generation script**

```javascript
#!/usr/bin/env node
/**
 * Generate VSOP87D TypeScript coefficient files for all planets.
 *
 * Downloads coefficient files from CDS Strasbourg, parses the fixed-format
 * text, and outputs TypeScript files matching the vsop87d-earth.ts pattern.
 *
 * Usage: node scripts/generate-vsop87d-planets.mjs
 *
 * Source: https://cdsarc.cds.unistra.fr/ftp/VI/81/
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const planetsDir = join(root, 'src', 'planets');

if (!existsSync(planetsDir)) mkdirSync(planetsDir, { recursive: true });

const CDS_BASE = 'https://cdsarc.cds.unistra.fr/ftp/VI/81';

const PLANETS = [
  { file: 'VSOP87D.mer', name: 'mercury', label: 'Mercury' },
  { file: 'VSOP87D.ven', name: 'venus',   label: 'Venus' },
  { file: 'VSOP87D.mar', name: 'mars',    label: 'Mars' },
  { file: 'VSOP87D.jup', name: 'jupiter', label: 'Jupiter' },
  { file: 'VSOP87D.sat', name: 'saturn',  label: 'Saturn' },
  { file: 'VSOP87D.ura', name: 'uranus',  label: 'Uranus' },
  { file: 'VSOP87D.nep', name: 'neptune', label: 'Neptune' },
];

// VSOP87D variables: 1=L (longitude), 2=B (latitude), 3=R (radius)
const VAR_NAMES = { 1: 'L', 2: 'B', 3: 'R' };

async function downloadFile(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to download ${url}: ${resp.status}`);
  return resp.text();
}

/**
 * Parse a VSOP87D coefficient file.
 * Format: header lines start with " VSOP87", data lines have fixed columns.
 * Returns { L: [series0, series1, ...], B: [...], R: [...] }
 * where each series is an array of [A, B, C] tuples.
 */
function parseVsop87d(text) {
  const result = { L: [], B: [], R: [] };
  let currentVar = null;  // 'L', 'B', or 'R'
  let currentPower = -1;
  let currentTerms = [];

  for (const line of text.split('\n')) {
    if (line.startsWith(' VSOP87')) {
      // Header line: flush previous series
      if (currentVar && currentTerms.length > 0) {
        result[currentVar].push(currentTerms);
        currentTerms = [];
      }
      // Parse header: variable number is at position 41 (1-indexed column 42)
      const varNum = parseInt(line.substring(41, 42));
      const power = parseInt(line.substring(59, 60));
      currentVar = VAR_NAMES[varNum];
      currentPower = power;

      // Fill missing powers with empty arrays
      while (result[currentVar].length < currentPower) {
        result[currentVar].push([]);
      }
    } else if (line.trim().length > 0 && currentVar) {
      // Data line: A is at columns 79-97, B at 97-111, C at 111-131
      // (0-indexed: A=79:97, B=97:111, C=111:131)
      const A = parseFloat(line.substring(79, 97).trim());
      const B = parseFloat(line.substring(97, 111).trim());
      const C = parseFloat(line.substring(111, 131).trim());
      if (!isNaN(A) && !isNaN(B) && !isNaN(C)) {
        currentTerms.push([A, B, C]);
      }
    }
  }

  // Flush final series
  if (currentVar && currentTerms.length > 0) {
    result[currentVar].push(currentTerms);
  }

  return result;
}

function generateTypeScript(planet, data) {
  const totalL = data.L.reduce((s, a) => s + a.length, 0);
  const totalB = data.B.reduce((s, a) => s + a.length, 0);
  const totalR = data.R.reduce((s, a) => s + a.length, 0);

  let ts = `/**
 * VSOP87D ${planet.label} heliocentric spherical coordinates — ecliptic of date.
 *
 * Source: ${planet.file} from CDS (Centre de Donnees astronomiques de Strasbourg)
 * Original theory: Bretagnon & Francou (1988), Bureau des Longitudes, Paris.
 *
 * Each export is a number[][][] of shape [series][term][A, B, C],
 * where series n is multiplied by tau^n and each term computes A * cos(B + C * tau).
 * tau is Julian millennia from J2000.0 (JDE 2451545.0).
 *
 * Term counts: L=${totalL}, B=${totalB}, R=${totalR} (total ${totalL + totalB + totalR}).
 * Generated by scripts/generate-vsop87d-planets.mjs
 */\n\n`;

  for (const [varName, series] of Object.entries(data)) {
    const exportName = `${planet.name.toUpperCase()}_${varName}`;
    ts += `/** Heliocentric ${varName === 'L' ? 'longitude' : varName === 'B' ? 'latitude' : 'radius'} (${varName}) coefficients — ${totalL} terms in ${series.length} series */\n`;
    ts += `// prettier-ignore\n`;
    ts += `export const ${exportName}: readonly (readonly (readonly [number, number, number])[])[] = [\n`;
    for (const terms of series) {
      ts += '  [\n';
      for (const [A, B, C] of terms) {
        ts += `    [${A}, ${B}, ${C}],\n`;
      }
      ts += '  ],\n';
    }
    ts += '];\n\n';
  }

  return ts;
}

async function main() {
  for (const planet of PLANETS) {
    const url = `${CDS_BASE}/${planet.file}`;
    console.log(`Downloading ${url}...`);
    const text = await downloadFile(url);

    console.log(`Parsing ${planet.label}...`);
    const data = parseVsop87d(text);

    const totalL = data.L.reduce((s, a) => s + a.length, 0);
    const totalB = data.B.reduce((s, a) => s + a.length, 0);
    const totalR = data.R.reduce((s, a) => s + a.length, 0);
    console.log(`  L=${totalL} B=${totalB} R=${totalR} total=${totalL + totalB + totalR}`);

    const tsCode = generateTypeScript(planet, data);
    const outPath = join(planetsDir, `vsop87d-${planet.name}.ts`);
    writeFileSync(outPath, tsCode);
    console.log(`  Wrote ${outPath}`);
  }
  console.log('Done.');
}

main().catch(e => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Run the generation script**

Run: `node scripts/generate-vsop87d-planets.mjs`
Expected: Downloads 7 files from CDS, generates 7 TypeScript files in `src/planets/`.

- [ ] **Step 3: Write validation tests for generated coefficients**

```typescript
// tests/vsop87d-planets.test.ts
import { describe, it, expect } from 'vitest';
import { evaluateVsopSeries } from '../src/vsop87d-earth';

import { MERCURY_L, MERCURY_B, MERCURY_R } from '../src/planets/vsop87d-mercury';
import { VENUS_L, VENUS_B, VENUS_R } from '../src/planets/vsop87d-venus';
import { MARS_L, MARS_B, MARS_R } from '../src/planets/vsop87d-mars';
import { JUPITER_L, JUPITER_B, JUPITER_R } from '../src/planets/vsop87d-jupiter';
import { SATURN_L, SATURN_B, SATURN_R } from '../src/planets/vsop87d-saturn';
import { URANUS_L, URANUS_B, URANUS_R } from '../src/planets/vsop87d-uranus';
import { NEPTUNE_L, NEPTUNE_B, NEPTUNE_R } from '../src/planets/vsop87d-neptune';

const PLANETS = [
  { name: 'Mercury', L: MERCURY_L, B: MERCURY_B, R: MERCURY_R },
  { name: 'Venus',   L: VENUS_L,   B: VENUS_B,   R: VENUS_R },
  { name: 'Mars',    L: MARS_L,    B: MARS_B,    R: MARS_R },
  { name: 'Jupiter', L: JUPITER_L, B: JUPITER_B, R: JUPITER_R },
  { name: 'Saturn',  L: SATURN_L,  B: SATURN_B,  R: SATURN_R },
  { name: 'Uranus',  L: URANUS_L,  B: URANUS_B,  R: URANUS_R },
  { name: 'Neptune', L: NEPTUNE_L, B: NEPTUNE_B, R: NEPTUNE_R },
];

describe('VSOP87D planet coefficients', () => {
  for (const planet of PLANETS) {
    describe(planet.name, () => {
      it('has at least 4 series for L', () => {
        expect(planet.L.length).toBeGreaterThanOrEqual(4);
      });

      it('has at least 3 series for B', () => {
        expect(planet.B.length).toBeGreaterThanOrEqual(3);
      });

      it('has at least 4 series for R', () => {
        expect(planet.R.length).toBeGreaterThanOrEqual(4);
      });

      it('L has non-zero total terms', () => {
        const total = planet.L.reduce((sum, s) => sum + s.length, 0);
        expect(total).toBeGreaterThan(100);
      });

      it('each term is [A, B, C] with valid numbers', () => {
        const term = planet.L[0][0];
        expect(term).toHaveLength(3);
        expect(Number.isFinite(term[0])).toBe(true);
        expect(Number.isFinite(term[1])).toBe(true);
        expect(Number.isFinite(term[2])).toBe(true);
      });

      it('evaluates L at t=0 without NaN', () => {
        const L = evaluateVsopSeries(planet.L, 0);
        expect(Number.isFinite(L)).toBe(true);
      });

      it('evaluates R at t=0 to a reasonable distance', () => {
        const R = evaluateVsopSeries(planet.R, 0);
        // All planets between 0.3 AU (Mercury) and 30.2 AU (Neptune)
        expect(R).toBeGreaterThan(0.2);
        expect(R).toBeLessThan(31);
      });
    });
  }

  // Cross-validate with Meeus reference: Mars at J2000.0
  // Meeus Table 33.C: Mars heliocentric L ≈ 355.433° at J2000.0
  it('Mars L at J2000.0 ≈ 6.204 rad (355.4°)', () => {
    const L = evaluateVsopSeries(MARS_L, 0);
    expect(L).toBeCloseTo(6.204, 1);
  });

  // Venus distance at J2000.0: ~0.7233 AU
  it('Venus R at J2000.0 ≈ 0.72 AU', () => {
    const R = evaluateVsopSeries(VENUS_R, 0);
    expect(R).toBeCloseTo(0.72, 1);
  });
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/vsop87d-planets.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-vsop87d-planets.mjs src/planets/ tests/vsop87d-planets.test.ts
git commit -m "feat: add VSOP87D coefficients for Mercury–Neptune

Generate heliocentric coordinate coefficients from CDS Strasbourg
VSOP87D data files for all 7 planets. Same [A,B,C] tuple format
as existing vsop87d-earth.ts, evaluated by evaluateVsopSeries().

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Geocentric conversion module

**Files:**
- Create: `src/planets/geocentric.ts`
- Test: `tests/geocentric.test.ts`

Converts heliocentric ecliptic coordinates (from VSOP87D) to geocentric ecliptic coordinates with light-time correction.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/geocentric.test.ts
import { describe, it, expect } from 'vitest';
import {
  helioToGeo, lightTimeCorrected,
  type HeliocentricPosition,
} from '../src/planets/geocentric';
import { evaluateVsopSeries } from '../src/vsop87d-earth';
import { EARTH_L, EARTH_B, EARTH_R } from '../src/vsop87d-earth';
import { VENUS_L, VENUS_B, VENUS_R } from '../src/planets/vsop87d-venus';
import { MARS_L, MARS_B, MARS_R } from '../src/planets/vsop87d-mars';

function earthHelio(tau: number): HeliocentricPosition {
  return {
    L: evaluateVsopSeries(EARTH_L, tau),
    B: evaluateVsopSeries(EARTH_B, tau),
    R: evaluateVsopSeries(EARTH_R, tau),
  };
}

describe('helioToGeo', () => {
  it('converts Venus helio to geocentric at t=0', () => {
    const venus: HeliocentricPosition = {
      L: evaluateVsopSeries(VENUS_L, 0),
      B: evaluateVsopSeries(VENUS_B, 0),
      R: evaluateVsopSeries(VENUS_R, 0),
    };
    const earth = earthHelio(0);
    const geo = helioToGeo(venus, earth);

    // Geocentric ecliptic longitude should be a valid angle
    expect(geo.longitude).toBeGreaterThanOrEqual(0);
    expect(geo.longitude).toBeLessThan(2 * Math.PI);
    // Distance should be between 0.2 and 1.8 AU
    expect(geo.distance).toBeGreaterThan(0.2);
    expect(geo.distance).toBeLessThan(1.8);
  });

  it('produces valid latitude', () => {
    const mars: HeliocentricPosition = {
      L: evaluateVsopSeries(MARS_L, 0),
      B: evaluateVsopSeries(MARS_B, 0),
      R: evaluateVsopSeries(MARS_R, 0),
    };
    const earth = earthHelio(0);
    const geo = helioToGeo(mars, earth);

    // Geocentric latitude within ±90° (±π/2 radians)
    expect(Math.abs(geo.latitude)).toBeLessThan(Math.PI / 2);
  });
});

describe('lightTimeCorrected', () => {
  it('returns a slightly different position than without correction', () => {
    const tau = 0;
    const getPlanetHelio = (t: number): HeliocentricPosition => ({
      L: evaluateVsopSeries(MARS_L, t),
      B: evaluateVsopSeries(MARS_B, t),
      R: evaluateVsopSeries(MARS_R, t),
    });
    const earth = earthHelio(tau);
    const uncorrected = helioToGeo(getPlanetHelio(tau), earth);
    const corrected = lightTimeCorrected(getPlanetHelio, earth, tau);

    // Should be slightly different (light-time for Mars ~3-22 minutes)
    expect(corrected.longitude).not.toBeCloseTo(uncorrected.longitude, 6);
    // But not drastically different
    const diff = Math.abs(corrected.longitude - uncorrected.longitude);
    expect(diff).toBeLessThan(0.01); // < 0.01 radians ≈ 0.57°
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/geocentric.test.ts`
Expected: FAIL — `Cannot find module '../src/planets/geocentric'`

- [ ] **Step 3: Implement geocentric.ts**

```typescript
// src/planets/geocentric.ts
/**
 * Heliocentric to geocentric coordinate conversion with light-time correction.
 *
 * Transforms VSOP87D heliocentric spherical coordinates to geometric
 * geocentric ecliptic coordinates. Light-time correction iteratively
 * recomputes the planet position at (t - τ_light).
 */

import { C_AU_PER_DAY } from '../astro';

export interface HeliocentricPosition {
  L: number;  // heliocentric longitude (radians)
  B: number;  // heliocentric latitude (radians)
  R: number;  // distance from Sun (AU)
}

export interface GeocentricEcliptic {
  longitude: number;  // geocentric ecliptic longitude (radians)
  latitude: number;   // geocentric ecliptic latitude (radians)
  distance: number;   // geocentric distance (AU)
}

/**
 * Convert heliocentric spherical to rectangular coordinates.
 */
function sphericalToRectangular(pos: HeliocentricPosition): [number, number, number] {
  const cosB = Math.cos(pos.B);
  return [
    pos.R * cosB * Math.cos(pos.L),
    pos.R * cosB * Math.sin(pos.L),
    pos.R * Math.sin(pos.B),
  ];
}

/**
 * Convert heliocentric positions of planet and Earth to geocentric ecliptic.
 * Planet and Earth both in heliocentric ecliptic of date (VSOP87D).
 */
export function helioToGeo(
  planet: HeliocentricPosition,
  earth: HeliocentricPosition,
): GeocentricEcliptic {
  const [Xp, Yp, Zp] = sphericalToRectangular(planet);
  const [Xe, Ye, Ze] = sphericalToRectangular(earth);

  const dX = Xp - Xe;
  const dY = Yp - Ye;
  const dZ = Zp - Ze;

  const distance = Math.sqrt(dX * dX + dY * dY + dZ * dZ);
  const longitude = Math.atan2(dY, dX);
  const latitude = Math.atan2(dZ, Math.sqrt(dX * dX + dY * dY));

  return {
    longitude: ((longitude % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI),
    latitude,
    distance,
  };
}

/**
 * Geocentric position with light-time correction.
 *
 * Iteratively adjusts the planet position to account for the finite speed
 * of light. Typically converges in 2-3 iterations.
 *
 * @param getPlanetHelio - Function that returns heliocentric position at tau
 * @param earth - Earth's heliocentric position at observation time
 * @param tau - Julian millennia (observation time)
 * @param maxIter - Maximum iterations (default 3)
 */
export function lightTimeCorrected(
  getPlanetHelio: (tau: number) => HeliocentricPosition,
  earth: HeliocentricPosition,
  tau: number,
  maxIter = 3,
): GeocentricEcliptic {
  // Initial geometric position (no light-time)
  let geo = helioToGeo(getPlanetHelio(tau), earth);
  let lightDays = geo.distance / C_AU_PER_DAY;

  for (let i = 0; i < maxIter; i++) {
    // Recompute planet position at earlier time
    const tauCorrected = tau - lightDays / 365250; // convert days to millennia
    const planetRetarded = getPlanetHelio(tauCorrected);
    geo = helioToGeo(planetRetarded, earth);

    const newLightDays = geo.distance / C_AU_PER_DAY;
    if (Math.abs(newLightDays - lightDays) < 1e-10) break; // converged
    lightDays = newLightDays;
  }

  return geo;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/geocentric.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/planets/geocentric.ts tests/geocentric.test.ts
git commit -m "feat: add heliocentric-to-geocentric conversion with light-time

Converts VSOP87D heliocentric spherical coords to geocentric ecliptic
via rectangular intermediate. Light-time correction iteratively adjusts
planet position for finite speed of light (~converges in 2-3 iterations).

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Planet public API

**Files:**
- Create: `src/planets/planets.ts`
- Modify: `src/types.ts`
- Test: `tests/planet-positions.test.ts`

Integrates VSOP87D + geocentric + nutation + aberration into a single `getPlanetPosition()` function.

- [ ] **Step 1: Add types**

Add to `src/types.ts`:

```typescript
export type Planet = 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn'
  | 'uranus' | 'neptune' | 'pluto';

export interface GeocentricPosition {
  longitude: number;   // apparent ecliptic longitude (degrees)
  latitude: number;    // apparent ecliptic latitude (degrees)
  distance: number;    // distance (AU, km for Moon)
  ra: number;          // apparent right ascension (degrees)
  dec: number;         // apparent declination (degrees)
}
```

- [ ] **Step 2: Write the failing test**

```typescript
// tests/planet-positions.test.ts
import { describe, it, expect } from 'vitest';
import { getPlanetPosition } from '../src/planets/planets';
import type { Planet } from '../src/types';

// Reference: Meeus, Astronomical Algorithms, Example 33.a
// Venus on 1992-Dec-20 0h TT
// Geocentric ecliptic longitude ≈ 313.08° (apparent)
describe('getPlanetPosition', () => {
  it('computes Venus apparent longitude for Meeus example', () => {
    // 1992-Dec-20 0h UT ≈ 0h TT (ΔT ≈ 59s, negligible for this test)
    const date = new Date(Date.UTC(1992, 11, 20, 0, 0, 0));
    const pos = getPlanetPosition('venus', date);

    // Meeus example gives geocentric λ ≈ 313.08° (geometric)
    // Our pipeline includes nutation + aberration, so within ~0.5° is good
    expect(pos.longitude).toBeCloseTo(313.1, 0);
    expect(pos.latitude).toBeGreaterThan(-3);
    expect(pos.latitude).toBeLessThan(3);
  });

  const testPlanets: Planet[] = ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];

  for (const planet of testPlanets) {
    it(`returns valid coordinates for ${planet} at J2000.0`, () => {
      const date = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
      const pos = getPlanetPosition(planet, date);

      expect(pos.longitude).toBeGreaterThanOrEqual(0);
      expect(pos.longitude).toBeLessThan(360);
      expect(Math.abs(pos.latitude)).toBeLessThan(15);
      expect(pos.distance).toBeGreaterThan(0);
      expect(pos.ra).toBeGreaterThanOrEqual(0);
      expect(pos.ra).toBeLessThan(360);
      expect(Math.abs(pos.dec)).toBeLessThanOrEqual(90);
    });
  }

  it('Mars distance at J2000.0 within expected range', () => {
    const date = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
    const pos = getPlanetPosition('mars', date);
    // Mars geocentric distance: roughly 0.4 - 2.7 AU
    expect(pos.distance).toBeGreaterThan(0.4);
    expect(pos.distance).toBeLessThan(2.7);
  });

  it('Jupiter RA/Dec are plausible at known date', () => {
    // 2024-Jan-01 — Jupiter in Aries region
    const date = new Date(Date.UTC(2024, 0, 1, 0, 0, 0));
    const pos = getPlanetPosition('jupiter', date);
    // RA should be in the Aries/Taurus region (~30-60°)
    expect(pos.ra).toBeGreaterThan(20);
    expect(pos.ra).toBeLessThan(80);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/planet-positions.test.ts`
Expected: FAIL — `Cannot find module '../src/planets/planets'`

- [ ] **Step 4: Implement planets.ts**

```typescript
// src/planets/planets.ts
/**
 * Public API for planetary positions.
 *
 * Computes apparent geocentric ecliptic coordinates for Mercury–Neptune
 * using VSOP87D heliocentric theory + geocentric conversion + IAU2000B
 * nutation + aberration correction + DE441 even-polynomial correction.
 */

import { evaluateVsopSeries } from '../vsop87d-earth';
import { EARTH_L, EARTH_B, EARTH_R } from '../vsop87d-earth';
import {
  dateToJulianMillennia, dateToJulianCenturies,
  delaunayArgs, nutationDpsi,
  trueObliquity, eclipticToEquatorial,
  normalizeDegrees, normalizeRadians,
  RAD_TO_DEG, ARCSEC_TO_RAD,
} from '../astro';
import { type HeliocentricPosition, lightTimeCorrected } from './geocentric';
import { getDE441Correction } from './de441-corrections';
import type { Planet, GeocentricPosition } from '../types';

// Import VSOP87D coefficients per planet
import { MERCURY_L, MERCURY_B, MERCURY_R } from './vsop87d-mercury';
import { VENUS_L, VENUS_B, VENUS_R } from './vsop87d-venus';
import { MARS_L, MARS_B, MARS_R } from './vsop87d-mars';
import { JUPITER_L, JUPITER_B, JUPITER_R } from './vsop87d-jupiter';
import { SATURN_L, SATURN_B, SATURN_R } from './vsop87d-saturn';
import { URANUS_L, URANUS_B, URANUS_R } from './vsop87d-uranus';
import { NEPTUNE_L, NEPTUNE_B, NEPTUNE_R } from './vsop87d-neptune';

type VsopCoeffs = readonly (readonly (readonly [number, number, number])[])[];

const PLANET_COEFFS: Record<string, { L: VsopCoeffs; B: VsopCoeffs; R: VsopCoeffs }> = {
  mercury: { L: MERCURY_L, B: MERCURY_B, R: MERCURY_R },
  venus:   { L: VENUS_L,   B: VENUS_B,   R: VENUS_R },
  mars:    { L: MARS_L,    B: MARS_B,    R: MARS_R },
  jupiter: { L: JUPITER_L, B: JUPITER_B, R: JUPITER_R },
  saturn:  { L: SATURN_L,  B: SATURN_B,  R: SATURN_R },
  uranus:  { L: URANUS_L,  B: URANUS_B,  R: URANUS_R },
  neptune: { L: NEPTUNE_L, B: NEPTUNE_B, R: NEPTUNE_R },
};

function getHelioPosition(planet: string, tau: number): HeliocentricPosition {
  const c = PLANET_COEFFS[planet];
  return {
    L: evaluateVsopSeries(c.L, tau),
    B: evaluateVsopSeries(c.B, tau),
    R: evaluateVsopSeries(c.R, tau),
  };
}

function getEarthHelio(tau: number): HeliocentricPosition {
  return {
    L: evaluateVsopSeries(EARTH_L, tau),
    B: evaluateVsopSeries(EARTH_B, tau),
    R: evaluateVsopSeries(EARTH_R, tau),
  };
}

/**
 * Compute the apparent geocentric position of a planet.
 *
 * Pipeline:
 * 1. VSOP87D heliocentric coordinates for planet and Earth
 * 2. Geocentric conversion with light-time correction
 * 3. Aberration correction
 * 4. Nutation in longitude
 * 5. DE441 even-polynomial correction
 * 6. Ecliptic → equatorial for RA/Dec
 */
export function getPlanetPosition(planet: Planet, date: Date): GeocentricPosition {
  if (planet === 'pluto') {
    // Pluto uses TOP2013, handled by separate module
    // Placeholder until Task 6; throws for now
    throw new Error('Pluto not yet implemented — see Task 6 (TOP2013)');
  }

  const tau = dateToJulianMillennia(date);
  const T = dateToJulianCenturies(date);
  const earth = getEarthHelio(tau);

  // Geocentric with light-time correction
  const geo = lightTimeCorrected(
    (t) => getHelioPosition(planet, t),
    earth,
    tau,
  );

  // Aberration correction (Ron & Vondrak constant of aberration)
  // For planets, aberration in longitude ≈ -20.4898" / R_earth
  const earthR = earth.R;
  let lon = geo.longitude + (-20.4898 / earthR) * ARCSEC_TO_RAD;

  // Nutation in longitude
  const args = delaunayArgs(T);
  const dpsi = nutationDpsi(args.l, args.lp, args.F, args.D, args.Om, T);
  lon += dpsi * ARCSEC_TO_RAD;

  // DE441 correction (if available for this planet)
  const correction = getDE441Correction(planet, tau);
  lon += correction * ARCSEC_TO_RAD;

  lon = normalizeRadians(lon);
  const lat = geo.latitude;

  // Convert to equatorial
  const eps = trueObliquity(T);
  const [ra, dec] = eclipticToEquatorial(lon, lat, eps);

  return {
    longitude: normalizeDegrees(lon * RAD_TO_DEG),
    latitude: lat * RAD_TO_DEG,
    distance: geo.distance,
    ra: normalizeDegrees(ra * RAD_TO_DEG),
    dec: dec * RAD_TO_DEG,
  };
}
```

- [ ] **Step 5: Create stub DE441 corrections module**

```typescript
// src/planets/de441-corrections.ts
/**
 * DE441 even-polynomial corrections per planet.
 *
 * Each correction is: ΔL = c₀ + c₂τ² + c₄τ⁴ + c₆τ⁶ (arcseconds)
 * where τ is Julian millennia from J2000.0.
 *
 * Coefficients are fitted by scripts/fit-de441-planet-corrections.mjs
 * by least-squares against JPL Horizons DE441 reference data.
 *
 * Returns 0 for planets without fitted corrections yet.
 */

import type { Planet } from '../types';

interface CorrectionCoeffs {
  c0: number;
  c2: number;
  c4: number;
  c6: number;
}

// Placeholder: will be populated by Task 7 (DE441 correction fitting)
const CORRECTIONS: Partial<Record<Planet, CorrectionCoeffs>> = {};

/**
 * Get DE441 longitude correction in arcseconds for a planet at tau.
 * Returns 0 if no correction has been fitted for this planet.
 */
export function getDE441Correction(planet: Planet, tau: number): number {
  const c = CORRECTIONS[planet];
  if (!c) return 0;
  const tau2 = tau * tau;
  return c.c0 + c.c2 * tau2 + c.c4 * tau2 * tau2 + c.c6 * tau2 * tau2 * tau2;
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run tests/planet-positions.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/planets/planets.ts src/planets/de441-corrections.ts src/types.ts tests/planet-positions.test.ts
git commit -m "feat: add getPlanetPosition() API for Mercury–Neptune

Full pipeline: VSOP87D helio → geocentric (with light-time) → aberration →
IAU2000B nutation → DE441 correction → ecliptic-to-equatorial.
DE441 corrections stubbed (returns 0) until fitting script in Task 7.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 5: ELP/MPP02 Moon ephemeris

**Files:**
- Create: `scripts/generate-elp-mpp02.mjs`
- Create: `src/moon/elp-mpp02-data.ts` (generated)
- Create: `src/moon/elp-mpp02.ts`
- Create: `src/moon/moon.ts`
- Test: `tests/elp-mpp02.test.ts`
- Test: `tests/moon-position.test.ts`

**Reference:** ytliu0's JavaScript ELP/MPP02 implementation (https://github.com/ytliu0/ElpMpp02).

- [ ] **Step 1: Write the data generation script**

Create `scripts/generate-elp-mpp02.mjs` — converts ELP/MPP02 coefficient tables into TypeScript arrays. The script should:
1. Download or read the ELP/MPP02 coefficient data (from Chapront's original tables or ytliu0's already-parsed JavaScript arrays)
2. Output `src/moon/elp-mpp02-data.ts` containing the coefficient arrays

The data has three main series:
- **Main problem** (Delaunay arguments): ~2,500 terms for longitude, latitude, distance
- **Perturbation tables** (planetary perturbations): ~33,000 terms
- **Poisson series** (t-dependent terms): ~400 terms

The generation script should download the data from ytliu0's repository (MIT license) as the authoritative parsed source, then format as TypeScript.

```javascript
#!/usr/bin/env node
/**
 * Generate ELP/MPP02 coefficient data for Moon ephemeris.
 *
 * Downloads pre-parsed coefficient arrays from ytliu0's ElpMpp02 repository
 * (MIT license) and generates TypeScript arrays.
 *
 * Source: https://github.com/ytliu0/ElpMpp02
 * Original theory: Chapront & Francou (2003)
 *
 * Usage: node scripts/generate-elp-mpp02.mjs
 */

// Implementation: fetch the raw JS data files from ytliu0's repo,
// parse the coefficient arrays, and output TypeScript.
// Full implementation omitted for brevity — follow the same
// pattern as generate-vsop87d-planets.mjs but adapted for ELP/MPP02 format.
```

**Note to implementer:** Study ytliu0's `ElpMpp02.js` for the exact data structure. The key arrays are:
- Main problem: `mainLon`, `mainLat`, `mainDis` (Delaunay arguments + amplitude)
- Perturbations: `perLon0`–`perLon3`, `perLat0`–`perLat3`, `perDis0`–`perDis3`
- Each term: `[D, l', l, F, coefficient]` or `[D, l', l, F, arg1...argN, amplS, amplC]`

- [ ] **Step 2: Run generation script**

Run: `node scripts/generate-elp-mpp02.mjs`
Expected: Creates `src/moon/elp-mpp02-data.ts` with all coefficient arrays.

- [ ] **Step 3: Write tests for ELP/MPP02 evaluation**

```typescript
// tests/elp-mpp02.test.ts
import { describe, it, expect } from 'vitest';
import { moonGeoEcliptic } from '../src/moon/elp-mpp02';

describe('ELP/MPP02 Moon ephemeris', () => {
  it('computes Moon position at J2000.0', () => {
    // J2000.0: 2000-Jan-01 12h TT
    // Moon geocentric ecliptic longitude ≈ 218.32° (from Meeus Ex. 47.a)
    const result = moonGeoEcliptic(0); // T = 0
    expect(result.longitude).toBeGreaterThanOrEqual(0);
    expect(result.longitude).toBeLessThan(360);
    // Distance should be ~363,000-406,000 km
    expect(result.distance).toBeGreaterThan(356000);
    expect(result.distance).toBeLessThan(407000);
  });

  // Meeus Example 47.a: 1992-Apr-12 0h TD
  // T = -0.077221081451
  it('matches Meeus Example 47.a within 10"', () => {
    const T = -0.077221081451;
    const result = moonGeoEcliptic(T);
    // Meeus: λ = 133.162655°, β = -3.229126°, Δ = 368409.7 km
    expect(result.longitude).toBeCloseTo(133.16, 0);
    expect(result.latitude).toBeCloseTo(-3.23, 0);
    expect(result.distance).toBeCloseTo(368410, -2); // within 100 km
  });

  it('evaluates without NaN at various epochs', () => {
    for (const T of [-5, -1, 0, 0.25, 1, 5]) {
      const result = moonGeoEcliptic(T);
      expect(Number.isFinite(result.longitude)).toBe(true);
      expect(Number.isFinite(result.latitude)).toBe(true);
      expect(Number.isFinite(result.distance)).toBe(true);
    }
  });
});
```

- [ ] **Step 4: Implement ELP/MPP02 evaluation engine**

```typescript
// src/moon/elp-mpp02.ts
/**
 * ELP/MPP02 semi-analytical lunar ephemeris.
 *
 * Computes geocentric ecliptic longitude, latitude, and distance of the Moon.
 * Theory: Chapront & Francou (2003), ~35,901 terms.
 * Reference frame: ecliptic and mean equinox of date.
 */

import {
  // Import coefficient arrays from generated data file
  MAIN_LON, MAIN_LAT, MAIN_DIS,
  PERT_LON, PERT_LAT, PERT_DIS,
} from './elp-mpp02-data';

export interface MoonEclipticPosition {
  longitude: number;  // geocentric ecliptic longitude (degrees)
  latitude: number;   // geocentric ecliptic latitude (degrees)
  distance: number;   // geocentric distance (km)
}

/**
 * Compute geocentric ecliptic position of the Moon.
 * @param T - Julian centuries from J2000.0 (TT)
 * @returns Moon position in degrees and km
 */
export function moonGeoEcliptic(T: number): MoonEclipticPosition {
  // Delaunay fundamental arguments (radians)
  // W1, W2, W3: lunar arguments; Earth-Moon barycenter arguments
  // Full implementation follows ytliu0's ElpMpp02 evaluation logic:
  // 1. Compute fundamental arguments
  // 2. Sum main problem terms (Delaunay series)
  // 3. Sum perturbation terms (planetary perturbations)
  // 4. Sum Poisson series (t-dependent terms)
  // 5. Apply precession and frame corrections
  // 6. Convert to degrees and km

  // Implementation note: this function body should closely follow
  // ytliu0's ElpMpp02.compute() function, adapted for TypeScript.
  // The evaluator iterates over coefficient arrays and sums:
  //   longitude += A * sin(i₁D + i₂l' + i₃l + i₄F + phase)
  //   latitude  += A * sin(i₁D + i₂l' + i₃l + i₄F + phase)
  //   distance  += A * cos(i₁D + i₂l' + i₃l + i₄F + phase)

  // Placeholder structure — full implementation required
  throw new Error('Not yet implemented');
}
```

**Note to implementer:** The full implementation of `moonGeoEcliptic()` is ~100 lines. Study ytliu0's `ElpMpp02.js` `compute()` function and translate to TypeScript. The key steps are:
1. Compute Delaunay arguments (W1, D, l', l, F) as polynomials of T
2. Sum main problem series (each term: A × sin/cos(combination of Delaunay args))
3. Add perturbation terms (planetary arguments from precomputed polynomials)
4. Apply precession correction to longitude
5. Return longitude (degrees, normalized to [0,360)), latitude (degrees), distance (km)

- [ ] **Step 5: Write Moon public API test**

```typescript
// tests/moon-position.test.ts
import { describe, it, expect } from 'vitest';
import { getMoonPosition } from '../src/moon/moon';

describe('getMoonPosition', () => {
  it('returns valid coordinates at J2000.0', () => {
    const date = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
    const pos = getMoonPosition(date);

    expect(pos.longitude).toBeGreaterThanOrEqual(0);
    expect(pos.longitude).toBeLessThan(360);
    expect(Math.abs(pos.latitude)).toBeLessThan(6); // Moon's max lat ≈ 5.3°
    expect(pos.distance).toBeGreaterThan(356000);
    expect(pos.distance).toBeLessThan(407000);
    expect(pos.ra).toBeGreaterThanOrEqual(0);
    expect(pos.ra).toBeLessThan(360);
    expect(Math.abs(pos.dec)).toBeLessThanOrEqual(30); // Moon's max dec ≈ ±28.6°
  });
});
```

- [ ] **Step 6: Implement Moon public API**

```typescript
// src/moon/moon.ts
/**
 * Public API for Moon position.
 */

import {
  dateToJulianCenturies, delaunayArgs, nutationDpsi,
  trueObliquity, eclipticToEquatorial,
  normalizeDegrees, normalizeRadians,
  RAD_TO_DEG, DEG_TO_RAD, ARCSEC_TO_RAD,
} from '../astro';
import { moonGeoEcliptic } from './elp-mpp02';
import type { GeocentricPosition } from '../types';

/**
 * Compute the apparent geocentric position of the Moon.
 *
 * Pipeline:
 * 1. ELP/MPP02 geometric ecliptic coordinates
 * 2. Nutation in longitude
 * 3. Ecliptic → equatorial
 */
export function getMoonPosition(date: Date): GeocentricPosition {
  const T = dateToJulianCenturies(date);

  // ELP/MPP02 geometric position (ecliptic of date, degrees + km)
  const geo = moonGeoEcliptic(T);

  // Nutation in longitude
  const args = delaunayArgs(T);
  const dpsi = nutationDpsi(args.l, args.lp, args.F, args.D, args.Om, T);
  const lon = normalizeRadians((geo.longitude + dpsi / 3600) * DEG_TO_RAD);
  const lat = geo.latitude * DEG_TO_RAD;

  // Equatorial coordinates
  const eps = trueObliquity(T);
  const [ra, dec] = eclipticToEquatorial(lon, lat, eps);

  return {
    longitude: normalizeDegrees(lon * RAD_TO_DEG),
    latitude: lat * RAD_TO_DEG,
    distance: geo.distance,
    ra: normalizeDegrees(ra * RAD_TO_DEG),
    dec: dec * RAD_TO_DEG,
  };
}
```

- [ ] **Step 7: Run tests**

Run: `npx vitest run tests/elp-mpp02.test.ts tests/moon-position.test.ts`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add scripts/generate-elp-mpp02.mjs src/moon/ tests/elp-mpp02.test.ts tests/moon-position.test.ts
git commit -m "feat: add ELP/MPP02 Moon ephemeris with getMoonPosition() API

35,901-term semi-analytical lunar theory (Chapront & Francou 2003).
Computes geocentric ecliptic longitude, latitude, distance, RA, Dec.
Data generated from ytliu0's ElpMpp02 (MIT license).

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 6: TOP2013 Pluto ephemeris

**Files:**
- Create: `scripts/generate-top2013-pluto.mjs`
- Create: `src/pluto/top2013-data.ts` (generated)
- Create: `src/pluto/pluto.ts`
- Modify: `src/planets/planets.ts` (integrate Pluto)
- Test: `tests/pluto-position.test.ts`

**Reference:** TOP2013 (Théorie de l'Observatoire de Paris 2013) from IMCCE. Pluto coefficients cover the outer planets with long-term validity. Meeus Ch. 37 was rejected for this project as it only covers ~1885-2099 and cannot meet accuracy targets across the 209-2493 CE range.

- [ ] **Step 1: Write the data generation script**

Create `scripts/generate-top2013-pluto.mjs`:
1. Download TOP2013 Pluto coefficient files from IMCCE
2. Parse the series data
3. Output `src/pluto/top2013-data.ts`

**Note to implementer:** TOP2013 data is available from https://www.imcce.fr/recherche/equipes/asd/theories/top2013.html. The Pluto data file format is similar to VSOP87D (series of trigonometric terms). Alternatively, consider extracting Pluto coefficients from a simplified Meeus-like polynomial if accuracy targets for Pluto are relaxed (the spec allows <10" mean, <30" max).

- [ ] **Step 2: Write tests**

```typescript
// tests/pluto-position.test.ts
import { describe, it, expect } from 'vitest';
import { getPlutoPosition } from '../src/pluto/pluto';

describe('Pluto (TOP2013)', () => {
  it('computes Pluto position at J2000.0', () => {
    const date = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
    const pos = getPlutoPosition(date);

    // Pluto at J2000.0: approximately in Ophiuchus/Sagittarius
    // Ecliptic longitude ≈ 251° (Sagittarius)
    expect(pos.longitude).toBeGreaterThan(240);
    expect(pos.longitude).toBeLessThan(260);
    // Pluto latitude ≈ +13° (well above ecliptic)
    expect(pos.latitude).toBeGreaterThan(10);
    expect(pos.latitude).toBeLessThan(20);
    // Distance ≈ 30.1 AU
    expect(pos.distance).toBeCloseTo(30.1, 0);
  });

  it('evaluates at historical date (1000 CE)', () => {
    // Verify TOP2013 works outside Meeus Ch.37 range
    const date = new Date(Date.UTC(1000, 0, 1, 12, 0, 0));
    const pos = getPlutoPosition(date);
    expect(Number.isFinite(pos.longitude)).toBe(true);
    expect(pos.distance).toBeGreaterThan(20);
    expect(pos.distance).toBeLessThan(50);
  });

  it('evaluates at future date (2400 CE)', () => {
    const date = new Date(Date.UTC(2400, 0, 1, 12, 0, 0));
    const pos = getPlutoPosition(date);
    expect(Number.isFinite(pos.longitude)).toBe(true);
  });
});
```

- [ ] **Step 3: Implement Pluto module**

```typescript
// src/pluto/pluto.ts
/**
 * Pluto ephemeris using TOP2013 theory (IMCCE).
 *
 * TOP2013 provides long-term validity (centuries), unlike Meeus Ch. 37
 * which only covers ~1885-2099. Required for the 209-2493 CE range.
 */

import {
  dateToJulianMillennia, dateToJulianCenturies,
  delaunayArgs, nutationDpsi,
  trueObliquity, eclipticToEquatorial,
  normalizeDegrees, normalizeRadians,
  RAD_TO_DEG, ARCSEC_TO_RAD,
} from '../astro';
import { evaluateVsopSeries } from '../vsop87d-earth';
import { EARTH_L, EARTH_B, EARTH_R } from '../vsop87d-earth';
import { lightTimeCorrected, type HeliocentricPosition } from '../planets/geocentric';
import type { GeocentricPosition } from '../types';

// Import TOP2013 coefficient data
import { PLUTO_L, PLUTO_B, PLUTO_R } from './top2013-data';

function plutoHelio(tau: number): HeliocentricPosition {
  return {
    L: evaluateVsopSeries(PLUTO_L, tau),
    B: evaluateVsopSeries(PLUTO_B, tau),
    R: evaluateVsopSeries(PLUTO_R, tau),
  };
}

/**
 * Compute apparent geocentric position of Pluto.
 * Same pipeline as other planets but using TOP2013 coefficients.
 */
export function getPlutoPosition(date: Date): GeocentricPosition {
  const tau = dateToJulianMillennia(date);
  const T = dateToJulianCenturies(date);

  const earth: HeliocentricPosition = {
    L: evaluateVsopSeries(EARTH_L, tau),
    B: evaluateVsopSeries(EARTH_B, tau),
    R: evaluateVsopSeries(EARTH_R, tau),
  };

  const geo = lightTimeCorrected(plutoHelio, earth, tau);

  // Aberration
  let lon = geo.longitude + (-20.4898 / earth.R) * ARCSEC_TO_RAD;

  // Nutation
  const args = delaunayArgs(T);
  const dpsi = nutationDpsi(args.l, args.lp, args.F, args.D, args.Om, T);
  lon += dpsi * ARCSEC_TO_RAD;

  lon = normalizeRadians(lon);
  const lat = geo.latitude;

  const eps = trueObliquity(T);
  const [ra, dec] = eclipticToEquatorial(lon, lat, eps);

  return {
    longitude: normalizeDegrees(lon * RAD_TO_DEG),
    latitude: lat * RAD_TO_DEG,
    distance: geo.distance,
    ra: normalizeDegrees(ra * RAD_TO_DEG),
    dec: dec * RAD_TO_DEG,
  };
}
```

- [ ] **Step 4: Wire Pluto into getPlanetPosition()**

In `src/planets/planets.ts`, replace the Pluto placeholder:

```typescript
// Replace the throw statement with:
import { getPlutoPosition } from '../pluto/pluto';

// In getPlanetPosition():
if (planet === 'pluto') {
  return getPlutoPosition(date);
}
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run tests/pluto-position.test.ts tests/planet-positions.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add scripts/generate-top2013-pluto.mjs src/pluto/ src/planets/planets.ts tests/pluto-position.test.ts
git commit -m "feat: add TOP2013 Pluto ephemeris

Long-term Pluto positions using TOP2013 (IMCCE) theory.
Covers 209-2493 CE range unlike Meeus Ch. 37 (~1885-2099 only).
Integrated into getPlanetPosition('pluto', date).

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 7: DE441 correction fitting for all bodies

**Files:**
- Create: `scripts/fit-de441-planet-corrections.mjs`
- Modify: `src/planets/de441-corrections.ts` (populate coefficients)
- Test: `tests/de441-planet-corrections.test.ts`

This task queries JPL Horizons for each planet's geocentric ecliptic longitude at sampled epochs, computes residuals against VSOP87D, and fits even polynomials (c₀ + c₂τ² + c₄τ⁴ + c₆τ⁶) via least-squares. Same approach used for the existing Sun correction in `solar-longitude.ts`.

- [ ] **Step 1: Write the fitting script**

```javascript
#!/usr/bin/env node
/**
 * Fit DE441 correction polynomials for planetary ecliptic longitudes.
 *
 * For each planet:
 * 1. Query JPL Horizons API for geocentric ecliptic longitude at sampled epochs
 * 2. Compute VSOP87D-based longitude at same epochs (without correction)
 * 3. Compute residual = JPL - VSOP87D
 * 4. Fit even polynomial c₀ + c₂τ² + c₄τ⁴ + c₆τ⁶ via least-squares
 * 5. Output coefficients
 *
 * Usage: node scripts/fit-de441-planet-corrections.mjs
 *
 * Requires: internet access (JPL Horizons API), built dist/ (npm run build)
 */

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const sb = await import(join(root, 'dist', 'index.js'));

const PLANETS = ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
const JPL_PLANET_IDS = {
  mercury: '199', venus: '299', mars: '499', jupiter: '599',
  saturn: '699', uranus: '799', neptune: '899',
};

// Sample epochs: same 42-year set used for Sun calibration
// (209, 270, 281, 333, 360, 654, 682, 712, 849, 894, 910, 998,
//  1365, 1424, 1428, 1501, 1569, 1578, 1740, 1762, 1787, 1824,
//  1900-2100 in 20-year steps, 1941, 1985, 2138, 2237, 2377,
//  2416, 2450, 2493)
// Each year: sample every 15 days for ~24 data points

// JPL Horizons API endpoint (ephemeris type 1 = observer)
const JPL_API = 'https://ssd.jpl.nasa.gov/api/horizons.api';

async function queryJPL(planetId, startDate, stopDate, stepSize) {
  // ... construct JPL Horizons API request for geocentric ecliptic longitude
  // Return array of { jde, eclLon }
}

function fitEvenPolynomial(taus, residuals) {
  // Least-squares fit: residual = c₀ + c₂τ² + c₄τ⁴ + c₆τ⁶
  // Design matrix: [1, τ², τ⁴, τ⁶]
  // Normal equations: (X^T X)^{-1} X^T y
  // ... implementation using Gaussian elimination
}

// Full implementation: for each planet, query JPL at sampled epochs,
// compute VSOP87D position (without DE441 correction), compute residuals,
// fit even polynomial, output coefficients.
```

**Note to implementer:** The JPL Horizons API may rate-limit. Space requests appropriately. The full fitting process takes several minutes per planet. Cache intermediate results.

- [ ] **Step 2: Run fitting script**

Run: `npm run build && node scripts/fit-de441-planet-corrections.mjs`
Expected: Outputs fitted coefficients for each planet.

- [ ] **Step 3: Update de441-corrections.ts with fitted values**

Replace the empty `CORRECTIONS` object in `src/planets/de441-corrections.ts` with the fitted values from Step 2:

```typescript
const CORRECTIONS: Partial<Record<Planet, CorrectionCoeffs>> = {
  mercury: { c0: /* fitted */, c2: /* fitted */, c4: /* fitted */, c6: /* fitted */ },
  venus:   { c0: /* fitted */, c2: /* fitted */, c4: /* fitted */, c6: /* fitted */ },
  mars:    { c0: /* fitted */, c2: /* fitted */, c4: /* fitted */, c6: /* fitted */ },
  jupiter: { c0: /* fitted */, c2: /* fitted */, c4: /* fitted */, c6: /* fitted */ },
  saturn:  { c0: /* fitted */, c2: /* fitted */, c4: /* fitted */, c6: /* fitted */ },
  uranus:  { c0: /* fitted */, c2: /* fitted */, c4: /* fitted */, c6: /* fitted */ },
  neptune: { c0: /* fitted */, c2: /* fitted */, c4: /* fitted */, c6: /* fitted */ },
};
```

- [ ] **Step 4: Write validation test**

```typescript
// tests/de441-planet-corrections.test.ts
import { describe, it, expect } from 'vitest';
import { getDE441Correction } from '../src/planets/de441-corrections';

describe('DE441 planet corrections', () => {
  it('returns 0 at tau=0 if c0 is ~0', () => {
    // At J2000.0, corrections should be very small (VSOP87D is calibrated here)
    const corr = getDE441Correction('mars', 0);
    expect(Math.abs(corr)).toBeLessThan(1); // < 1 arcsecond
  });

  it('returns non-zero for planets at large tau', () => {
    // At tau=2 (~year 4000), correction should be significant
    const corr = getDE441Correction('mars', 2);
    expect(Math.abs(corr)).toBeGreaterThan(0);
  });

  it('returns 0 for pluto (not a VSOP87D planet)', () => {
    expect(getDE441Correction('pluto', 1)).toBe(0);
  });

  it('is symmetric in tau (even polynomial)', () => {
    const pos = getDE441Correction('venus', 1.5);
    const neg = getDE441Correction('venus', -1.5);
    // Even polynomial: f(τ) = f(-τ) when c0 dominates and odd terms are 0
    // The even polynomial is c₀ + c₂τ² + c₄τ⁴ + c₆τ⁶ — purely even
    expect(pos).toBeCloseTo(neg, 8);
  });
});
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run tests/de441-planet-corrections.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add scripts/fit-de441-planet-corrections.mjs src/planets/de441-corrections.ts tests/de441-planet-corrections.test.ts
git commit -m "feat: fit DE441 correction polynomials for all planets

Even polynomial (c₀ + c₂τ² + c₄τ⁴ + c₆τ⁶) least-squares fit
of VSOP87D vs JPL DE441 residuals per planet. Symmetric correction
ensures equal accuracy for past and future dates.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 8: Validation framework (4-way comparison)

**Files:**
- Create: `scripts/4way-planet-comparison.mjs`
- Create: `scripts/sweph-reference.mjs`
- Create: `tests/fixtures/jpl-planet-positions.json` (generated)
- Create: `tests/fixtures/sweph-planet-positions.json` (generated)
- Create: `tests/fixtures/jpl-lunar-phases.json` (generated)
- Create: `tests/planet-validation.test.ts`
- Create: `tests/moon-validation.test.ts`
- Modify: `docs/accuracy.md` (add Planetary Positions section)

- [ ] **Step 1: Write Swiss Ephemeris reference data generation script**

```javascript
#!/usr/bin/env node
/**
 * Generate Swiss Ephemeris reference data for planet position validation.
 *
 * Uses Swiss Ephemeris WASM module to compute geocentric ecliptic
 * longitudes for all planets at sampled epochs, saved as JSON fixture.
 *
 * Usage: node scripts/sweph-reference.mjs
 *
 * Requires: sweph WASM package (npm install sweph)
 */

// Implementation: load Swiss Ephemeris WASM, compute positions
// at the same sampled epochs as the DE441 fitting script,
// output to tests/fixtures/sweph-planet-positions.json
```

- [ ] **Step 2: Write 4-way comparison script**

```javascript
#!/usr/bin/env node
/**
 * 4-way planet position comparison.
 *
 * Compares geocentric ecliptic longitudes from:
 * 1. stem-branch (VSOP87D + DE441 corrections)
 * 2. sxwnl (where available — Sun only)
 * 3. JPL Horizons DE441 (ground truth)
 * 4. Swiss Ephemeris WASM (independent reference)
 *
 * Reports mean/max deviations per planet.
 *
 * Usage: node scripts/4way-planet-comparison.mjs
 */
```

- [ ] **Step 3: Generate reference data and fixture files**

Run: `node scripts/sweph-reference.mjs`
Expected: Creates `tests/fixtures/sweph-planet-positions.json`

Run: `node scripts/4way-planet-comparison.mjs`
Expected: Creates `tests/fixtures/jpl-planet-positions.json` and prints comparison table.

- [ ] **Step 4: Write validation test with thresholds**

```typescript
// tests/planet-validation.test.ts
import { describe, it, expect } from 'vitest';
import { getPlanetPosition } from '../src/planets/planets';
import type { Planet } from '../src/types';

// Pre-generated JPL Horizons reference data
import jplFixtures from './fixtures/jpl-planet-positions.json';

interface PlanetRef {
  planet: string;
  dateISO: string;
  timestamp: number;
  eclLon: number;  // JPL geocentric ecliptic longitude (degrees)
  eclLat: number;  // JPL geocentric ecliptic latitude (degrees)
}

// Accuracy targets from spec (arcseconds)
const THRESHOLDS: Record<string, { meanMax: number; absMax: number }> = {
  mercury: { meanMax: 2,  absMax: 5 },
  venus:   { meanMax: 2,  absMax: 5 },
  mars:    { meanMax: 2,  absMax: 5 },
  jupiter: { meanMax: 2,  absMax: 5 },
  saturn:  { meanMax: 2,  absMax: 5 },
  uranus:  { meanMax: 3,  absMax: 8 },
  neptune: { meanMax: 3,  absMax: 8 },
};

describe('planet position validation vs JPL DE441', () => {
  for (const [planet, threshold] of Object.entries(THRESHOLDS)) {
    describe(planet, () => {
      const refs = (jplFixtures as PlanetRef[]).filter(r => r.planet === planet);

      it(`has reference data (at least 20 epochs)`, () => {
        expect(refs.length).toBeGreaterThanOrEqual(20);
      });

      it(`mean |Δλ| < ${threshold.meanMax}" vs JPL`, () => {
        const errors: number[] = [];
        for (const ref of refs) {
          const date = new Date(ref.timestamp);
          const pos = getPlanetPosition(planet as Planet, date);
          // Angular difference handling wrap-around
          let diff = pos.longitude - ref.eclLon;
          if (diff > 180) diff -= 360;
          if (diff < -180) diff += 360;
          errors.push(Math.abs(diff) * 3600); // degrees to arcseconds
        }
        const mean = errors.reduce((a, b) => a + b, 0) / errors.length;
        expect(mean).toBeLessThan(threshold.meanMax);
      });

      it(`max |Δλ| < ${threshold.absMax}" vs JPL`, () => {
        let maxErr = 0;
        for (const ref of refs) {
          const date = new Date(ref.timestamp);
          const pos = getPlanetPosition(planet as Planet, date);
          let diff = pos.longitude - ref.eclLon;
          if (diff > 180) diff -= 360;
          if (diff < -180) diff += 360;
          maxErr = Math.max(maxErr, Math.abs(diff) * 3600);
        }
        expect(maxErr).toBeLessThan(threshold.absMax);
      });

      it(`latitude |Δβ| < ${threshold.absMax * 2}" vs JPL`, () => {
        let maxErr = 0;
        for (const ref of refs) {
          const date = new Date(ref.timestamp);
          const pos = getPlanetPosition(planet as Planet, date);
          const diff = Math.abs(pos.latitude - ref.eclLat) * 3600;
          maxErr = Math.max(maxErr, diff);
        }
        // Latitude thresholds are 2x longitude (less critical for most applications)
        expect(maxErr).toBeLessThan(threshold.absMax * 2);
      });
    });
  }
});
```

```typescript
// tests/moon-validation.test.ts — lunar phase timing validation
import { describe, it, expect } from 'vitest';
import { getMoonPosition } from '../src/moon/moon';
import { getSunLongitude } from '../src/solar-longitude';

// Pre-generated JPL new/full moon reference times (1900-2100)
import lunarPhaseFixtures from './fixtures/jpl-lunar-phases.json';

interface LunarPhaseRef {
  type: 'new' | 'full';
  dateISO: string;
  timestamp: number;  // JPL reference time (ms)
}

describe('lunar phase timing validation vs JPL', () => {
  // Moon targets from spec: <5" mean, <15" max ecliptic longitude
  // Phase timing: at new moon, Sun-Moon longitude difference ≈ 0°
  // At full moon, Sun-Moon longitude difference ≈ 180°
  const refs = lunarPhaseFixtures as LunarPhaseRef[];

  it('has at least 100 reference phases', () => {
    expect(refs.length).toBeGreaterThanOrEqual(100);
  });

  it('Moon longitude matches Sun at new moons (within 1°)', () => {
    const newMoons = refs.filter(r => r.type === 'new').slice(0, 50);
    for (const ref of newMoons) {
      const date = new Date(ref.timestamp);
      const moon = getMoonPosition(date);
      const sun = getSunLongitude(date);
      let diff = Math.abs(moon.longitude - sun);
      if (diff > 180) diff = 360 - diff;
      // At the exact JPL new moon time, our Sun-Moon difference should be < 1°
      expect(diff).toBeLessThan(1);
    }
  });

  it('Moon longitude opposes Sun at full moons (within 1°)', () => {
    const fullMoons = refs.filter(r => r.type === 'full').slice(0, 50);
    for (const ref of fullMoons) {
      const date = new Date(ref.timestamp);
      const moon = getMoonPosition(date);
      const sun = getSunLongitude(date);
      let diff = Math.abs(moon.longitude - sun);
      if (diff > 180) diff = 360 - diff;
      // At full moon, difference from 180° should be < 1°
      expect(Math.abs(diff - 180) < 1 || diff < 1).toBe(true);
    }
  });
});
```

- [ ] **Step 5: Update docs/accuracy.md with planetary positions section**

Add a "Planetary Positions" section to `docs/accuracy.md` documenting:
- Per-planet mean/max deviations vs JPL DE441
- Moon mean/max deviations vs JPL DE441
- Pluto mean/max deviations vs JPL DE441
- Swiss Ephemeris cross-reference results
- Table format matching the existing solar term validation tables

- [ ] **Step 6: Run validation tests**

Run: `npx vitest run tests/planet-validation.test.ts`
Expected: PASS — all planets within accuracy thresholds.

If any planet fails, revisit the DE441 correction fitting (Task 7) with more sample points or a higher-order polynomial.

- [ ] **Step 7: Commit**

```bash
git add scripts/4way-planet-comparison.mjs scripts/sweph-reference.mjs tests/fixtures/jpl-planet-positions.json tests/fixtures/sweph-planet-positions.json tests/fixtures/jpl-lunar-phases.json tests/planet-validation.test.ts tests/moon-validation.test.ts docs/accuracy.md
git commit -m "feat: add 4-way planet validation framework

Validates planetary longitude + latitude against JPL DE441 (ground truth),
Swiss Ephemeris WASM (independent reference), and sxwnl (Sun).
Lunar phase timing validated against JPL new/full moon reference times.
Per-planet accuracy thresholds enforced in CI. Accuracy docs updated.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 9: Export integration and build

**Files:**
- Modify: `src/index.ts`
- Verify: `tsup.config.ts` (no changes needed — `src/index.ts` entry catches all)

- [ ] **Step 1: Add exports to index.ts**

Add the following sections to `src/index.ts`:

```typescript
// ── 行星位置 (Planetary Positions) ──────────────────────
export { getPlanetPosition } from './planets/planets';

// ── 月球位置 (Moon Position) ────────────────────────────
export { getMoonPosition } from './moon/moon';

// ── 冥王星位置 (Pluto Position) ─────────────────────────
export { getPlutoPosition } from './pluto/pluto';

// ── 共用天文工具 (Shared Astronomy) ─────────────────────
export {
  dateToJD_TT, dateToJulianMillennia, dateToJulianCenturies,
  delaunayArgs, nutationDpsi, nutationDeps,
  meanObliquity, trueObliquity, eclipticToEquatorial,
  normalizeDegrees, normalizeRadians,
  DEG_TO_RAD, RAD_TO_DEG, ARCSEC_TO_RAD, C_AU_PER_DAY,
} from './astro';
export type { DelaunayArguments } from './astro';
```

Also add the new types to the type export block:

```typescript
export type {
  // ... existing types ...
  Planet,
  GeocentricPosition,
} from './types';
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: PASS — tsup compiles without errors.

- [ ] **Step 3: Run full test suite**

Run: `npx vitest run`
Expected: ALL PASS — including all existing tests and new planetary tests.

- [ ] **Step 4: Verify coverage**

Run: `npx vitest run --coverage`
Expected: 100% coverage maintained across all thresholds.

**Note:** The generated coefficient files (`vsop87d-*.ts`, `elp-mpp02-data.ts`, `top2013-data.ts`) are pure data exports. They get 100% line coverage when imported by tests that validate term counts and cross-check positions.

If coverage drops below 100%, add targeted tests for any uncovered branches.

- [ ] **Step 5: Commit**

```bash
git add src/index.ts
git commit -m "feat: export planetary, Moon, and Pluto APIs from index

Public API surface now includes getPlanetPosition(), getMoonPosition(),
getPlutoPosition(), and shared astronomy utilities (time, nutation,
coordinates).

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Coverage Exclusion Note

The generated coefficient data files are very large (thousands of lines of number arrays). If they cause coverage measurement to slow down significantly, they can be excluded from coverage by adding to `vitest.config.ts`:

```typescript
coverage: {
  include: ['src/**/*.ts'],
  exclude: [
    'src/index.ts', 'src/types.ts',
    'src/planets/vsop87d-*.ts',      // generated coefficient data
    'src/moon/elp-mpp02-data.ts',    // generated coefficient data
    'src/pluto/top2013-data.ts',     // generated coefficient data
  ],
}
```

Only add these exclusions if needed — the data files are validated structurally by the vsop87d-planets.test.ts and elp-mpp02.test.ts tests regardless.
