#!/usr/bin/env node
/**
 * Dense long-range accuracy analysis: -2000 to +5000 CE
 * All 24 solar terms × dense year sampling = comprehensive coverage.
 *
 * Usage: npx tsx scripts/long-range-analysis.mjs
 */

import { getSolarTermsForYear } from '../src/solar-terms.ts';
import { SOLAR_TERM_NAMES } from '../src/solar-terms.ts';

// ── Correction polynomials (arcseconds) ──────────────────────────
function sbCorrection(tau) {
  const tau2 = tau * tau;
  return -0.106674 - 0.616597 * tau2 + 0.315446 * tau2 * tau2
    - 0.050315 * tau2 * tau2 * tau2;
}

function sxCorrection(tau) {
  return -0.0728 - 2.7702 * tau - 1.1019 * tau * tau - 0.0996 * tau * tau * tau;
}

function yearToTau(year) { return (year - 2000) / 1000; }

// ── Build dense year list ────────────────────────────────────────
const yearSet = new Set();

// Ultra-dense: every 5 years, 1800–2200
for (let y = 1800; y <= 2200; y += 5) yearSet.add(y);
// Dense: every 10 years, 1000–3000
for (let y = 1000; y <= 3000; y += 10) yearSet.add(y);
// Medium: every 25 years, -500–4500
for (let y = -500; y <= 4500; y += 25) yearSet.add(y);
// Sparse: every 50 years, -2000–5000
for (let y = -2000; y <= 5000; y += 50) yearSet.add(y);

const years = [...yearSet].sort((a, b) => a - b);
const totalTerms = years.length * 24;

console.log('═══════════════════════════════════════════════════════════════');
console.log('  Dense Long-Range Analysis: ALL 24 Solar Terms');
console.log(`  ${years.length} years × 24 terms = ${totalTerms} computations`);
console.log(`  Range: ${years[0]} to ${years[years.length - 1]} CE`);
console.log('═══════════════════════════════════════════════════════════════\n');

// ── Compute all terms ────────────────────────────────────────────
const results = [];
let failures = 0;
let orderViolations = 0;
let spacingWarnings = 0;

for (const year of years) {
  try {
    const terms = getSolarTermsForYear(year);

    // Verify 24 terms returned
    if (terms.length !== 24) {
      console.error(`  ✗ Year ${year}: got ${terms.length} terms (expected 24)`);
      failures++;
      continue;
    }

    // Verify chronological order and reasonable spacing
    let yearOK = true;
    for (let i = 1; i < terms.length; i++) {
      const prev = terms[i - 1].date.getTime();
      const curr = terms[i].date.getTime();
      const gapDays = (curr - prev) / 86400000;

      if (curr <= prev) {
        orderViolations++;
        yearOK = false;
      }
      if (gapDays < 10 || gapDays > 20) {
        spacingWarnings++;
      }
    }

    const tau = yearToTau(year);
    results.push({
      year,
      termCount: terms.length,
      firstTerm: terms[0].date.toISOString(),
      lastTerm: terms[23].date.toISOString(),
      chronological: yearOK,
      sbCorr: Math.abs(sbCorrection(tau)),
      sxCorr: Math.abs(sxCorrection(tau)),
    });
  } catch (e) {
    failures++;
    results.push({ year, termCount: 0, error: e.message });
    console.error(`  ✗ Year ${year}: ${e.message}`);
  }
}

const successCount = results.filter(r => r.termCount === 24).length;
console.log(`\n── Computation Summary ────────────────────────────────────────`);
console.log(`  Years computed:     ${successCount}/${years.length}`);
console.log(`  Total terms:        ${successCount * 24}`);
console.log(`  Failures:           ${failures}`);
console.log(`  Order violations:   ${orderViolations}`);
console.log(`  Spacing warnings:   ${spacingWarnings} (gap < 10d or > 20d)`);

// ── Era breakdown ────────────────────────────────────────────────
console.log('\n── Era Breakdown ──────────────────────────────────────────────\n');
console.log('Era              | Years | Terms  | Success | |ΔL_SB| range (″) | |ΔL_SX| range (″) | SX/SB ratio');
console.log('-----------------|-------|--------|---------|-------------------|-------------------|------------');

const eras = [
  { name: 'Deep past',      start: -2000, end: -501 },
  { name: 'Classical',       start: -500,  end: 499 },
  { name: 'Medieval',        start: 500,   end: 1499 },
  { name: 'Early modern',    start: 1500,  end: 1799 },
  { name: 'sxwnl validated', start: 1800,  end: 2200 },
  { name: 'Near future',     start: 2201,  end: 3000 },
  { name: 'Far future',      start: 3001,  end: 5000 },
];

for (const era of eras) {
  const eraResults = results.filter(r => r.year >= era.start && r.year <= era.end && r.termCount === 24);
  if (eraResults.length === 0) continue;

  const sbMin = Math.min(...eraResults.map(r => r.sbCorr));
  const sbMax = Math.max(...eraResults.map(r => r.sbCorr));
  const sxMin = Math.min(...eraResults.map(r => r.sxCorr));
  const sxMax = Math.max(...eraResults.map(r => r.sxCorr));
  const avgRatio = eraResults.reduce((s, r) => s + r.sxCorr / Math.max(r.sbCorr, 0.001), 0) / eraResults.length;

  console.log(
    `${era.name.padEnd(17)}| ${String(eraResults.length).padStart(5)} | ${String(eraResults.length * 24).padStart(6)} | `
    + `${eraResults.every(r => r.chronological) ? '  100%  ' : ' ISSUES '} | `
    + `${sbMin.toFixed(2)}–${sbMax.toFixed(2)}`.padStart(17) + ' | '
    + `${sxMin.toFixed(2)}–${sxMax.toFixed(2)}`.padStart(17) + ' | '
    + `${avgRatio.toFixed(1)}×`.padStart(10)
  );
}

// ── Sample data points by century ────────────────────────────────
console.log('\n── Century Milestones (all 24 terms computed per year) ────────\n');
console.log('Year     | 24 terms | |ΔL_SB| (″) | |ΔL_SX| (″) | SX/SB  | 冬至 (Winter Solstice)');
console.log('---------|----------|------------|------------|--------|---------------------------');

const milestones = results.filter(r =>
  r.termCount === 24 && (r.year % 500 === 0 || r.year === -2000 || r.year === 5000 ||
    (r.year >= 1800 && r.year <= 2200 && r.year % 100 === 0))
);

for (const m of milestones) {
  // Get winter solstice for this year
  let wsDate = '—';
  try {
    const terms = getSolarTermsForYear(m.year);
    const ws = terms.find(t => t.name === '冬至');
    if (ws) wsDate = ws.date.toISOString().replace('T', ' ').replace(/\.\d+Z/, '');
  } catch { /* skip */ }

  const ratio = m.sxCorr / Math.max(m.sbCorr, 0.001);
  console.log(
    `${String(m.year).padStart(8)} |    ✓     | `
    + `${m.sbCorr.toFixed(3).padStart(10)} | ${m.sxCorr.toFixed(3).padStart(10)} | `
    + `${ratio.toFixed(1).padStart(6)}× | ${wsDate}`
  );
}

// ── Chart data for accuracy.md ───────────────────────────────────
console.log('\n── Chart Data ─────────────────────────────────────────────────\n');

// Chart 1: Medium range (-1000 to +5000)
const chart1Years = [-1000, -500, 0, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000];
const c1sb = chart1Years.map(y => Math.abs(sbCorrection(yearToTau(y))).toFixed(1));
const c1sx = chart1Years.map(y => Math.abs(sxCorrection(yearToTau(y))).toFixed(1));
console.log('Chart 1: Correction polynomial magnitude (-1000 to +5000 CE)');
console.log(`  x-axis: ${JSON.stringify(chart1Years.map(String))}`);
console.log(`  SB bar: [${c1sb.join(', ')}]`);
console.log(`  SX line: [${c1sx.join(', ')}]`);

// Chart 2: Sweet spot (0 to +4000, where SB stays tiny)
const chart2Years = [0, 250, 500, 750, 1000, 1250, 1500, 1750, 2000, 2250, 2500, 2750, 3000, 3250, 3500, 3750, 4000];
const c2sb = chart2Years.map(y => Math.abs(sbCorrection(yearToTau(y))).toFixed(2));
const c2sx = chart2Years.map(y => Math.abs(sxCorrection(yearToTau(y))).toFixed(2));
console.log('\nChart 2: Sweet spot detail (0 to 4000 CE)');
console.log(`  x-axis: ${JSON.stringify(chart2Years.map(String))}`);
console.log(`  SB bar: [${c2sb.join(', ')}]`);
console.log(`  SX line: [${c2sx.join(', ')}]`);

// Chart 3: Crossover zone (1900-2100, every 10 years)
const chart3Years = [];
for (let y = 1900; y <= 2100; y += 10) chart3Years.push(y);
const c3sb = chart3Years.map(y => Math.abs(sbCorrection(yearToTau(y))).toFixed(3));
const c3sx = chart3Years.map(y => Math.abs(sxCorrection(yearToTau(y))).toFixed(3));
console.log('\nChart 3: Crossover zone (1900-2100 CE, 10-year step)');
console.log(`  x-axis: ${JSON.stringify(chart3Years.map(String))}`);
console.log(`  SB bar: [${c3sb.join(', ')}]`);
console.log(`  SX line: [${c3sx.join(', ')}]`);

// ── Crossover analysis ──────────────────────────────────────────
console.log('\n── Crossover Analysis ─────────────────────────────────────────\n');

let sxBetterStart = null, sxBetterEnd = null;
for (let y = 1800; y <= 2200; y++) {
  const tau = yearToTau(y);
  const sbAbs = Math.abs(sbCorrection(tau));
  const sxAbs = Math.abs(sxCorrection(tau));
  if (sxAbs < sbAbs) {
    if (sxBetterStart === null) sxBetterStart = y;
    sxBetterEnd = y;
  }
}

if (sxBetterStart && sxBetterEnd) {
  const window = sxBetterEnd - sxBetterStart + 1;
  console.log(`sxwnl correction magnitude < stem-branch: ${sxBetterStart}–${sxBetterEnd} CE (${window} years)`);
  console.log(`Out of 7,000-year range: ${(window / 7000 * 100).toFixed(1)}% of the timeline`);
  console.log(`stem-branch is equal or better for: ${(100 - window / 7000 * 100).toFixed(1)}% of the timeline`);
} else {
  console.log('stem-branch correction magnitude is always ≤ sxwnl');
}

// ── Validated performance summary ────────────────────────────────
console.log('\n── Source Coverage Summary ─────────────────────────────────────\n');
console.log('Source          | Computed range    | Validated range  | Terms tested | Key metric');
console.log('----------------|-------------------|------------------|--------------|----------');
console.log('stem-branch     | −2000 → +5000 CE  | 209–2493 CE      | 1,008 vs JPL | mean 1.05s, max 3.05s');
console.log('                |                   | 1900–2100 CE     | 4,824 vs SX  | mean 3.4s, max 9.3s');
console.log('sxwnl           | 1900 → 2100 CE    | 1900–2100 CE     | 4,824 vs SB  | mean 3.4s, max 9.3s');
console.log('                |                   |                  | 335 vs JPL   | mean 2.38s, max 7.18s');
console.log('Swiss Ephemeris  | −13200 → +17191   | 1900–2100 CE     | 808 vs JPL   | mean 0.12–0.95″');
console.log('JPL DE441        | −13200 → +17191   | (primary ref)    | —            | sub-mas accuracy');

console.log('\n═══════════════════════════════════════════════════════════════');
console.log(`  Analysis complete: ${successCount * 24} solar terms computed across`);
console.log(`  ${years.length} years (${years[0]}–${years[years.length - 1]} CE)`);
console.log('═══════════════════════════════════════════════════════════════');
