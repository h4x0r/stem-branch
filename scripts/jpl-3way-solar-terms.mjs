#!/usr/bin/env node
/**
 * 3-way solar term comparison: stembranch vs sxwnl vs JPL DE441
 *
 * Compares all 24 solar term crossing moments across 42 years (209–2493 CE)
 * using three independent sources: stembranch, sxwnl, and JPL DE441.
 *
 * Usage: node scripts/jpl-3way-solar-terms.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const sb = await import(join(root, 'dist', 'index.js'));

// ── Constants ─────────────────────────────────────────────────

const MONTHS = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5,
                 Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };

const SOLAR_TERMS = [
  { lon: 285, name: '小寒', sm: 1 },  { lon: 300, name: '大寒', sm: 1 },
  { lon: 315, name: '立春', sm: 1 },  { lon: 330, name: '雨水', sm: 2 },
  { lon: 345, name: '驚蟄', sm: 2 },  { lon:   0, name: '春分', sm: 2 },
  { lon:  15, name: '清明', sm: 3 },  { lon:  30, name: '穀雨', sm: 4 },
  { lon:  45, name: '立夏', sm: 4 },  { lon:  60, name: '小滿', sm: 5 },
  { lon:  75, name: '芒種', sm: 5 },  { lon:  90, name: '夏至', sm: 6 },
  { lon: 105, name: '小暑', sm: 6 },  { lon: 120, name: '大暑', sm: 7 },
  { lon: 135, name: '立秋', sm: 7 },  { lon: 150, name: '處暑', sm: 8 },
  { lon: 165, name: '白露', sm: 8 },  { lon: 180, name: '秋分', sm: 9 },
  { lon: 195, name: '寒露', sm: 9 },  { lon: 210, name: '霜降', sm: 10 },
  { lon: 225, name: '立冬', sm: 10 }, { lon: 240, name: '小雪', sm: 11 },
  { lon: 255, name: '大雪', sm: 11 }, { lon: 270, name: '冬至', sm: 12 },
];

// 12 systematic years (1900–2100) + 30 random years (seed=42, 200–2800 CE)
const SYSTEMATIC = [1900, 1920, 1940, 1960, 1980, 2000, 2020, 2024, 2040, 2060, 2080, 2100];
const RANDOM = [209, 270, 281, 333, 360, 654, 682, 712, 849, 894, 910, 998,
                1365, 1424, 1428, 1501, 1569, 1578, 1740, 1762, 1787, 1824,
                1941, 1985, 2138, 2237, 2377, 2416, 2450, 2493];
const JPL_YEARS = [...new Set([...SYSTEMATIC, ...RANDOM])].sort((a, b) => a - b);

// ── Helpers ───────────────────────────────────────────────────

function parseJplLine(line) {
  const parts = line.trim().split(/\s+/);
  const [y, m, d] = parts[0].split('-');
  const [hh, mm] = parts[1].split(':').map(Number);
  const year = +y, month = MONTHS[m] + 1, day = +d; // month 1-based

  // JPL Horizons uses the Julian calendar before 1582-Oct-15.
  // JavaScript Date.UTC uses the proleptic Gregorian calendar.
  // Convert Julian → Gregorian via JDN roundtrip for pre-reform dates.
  const isJulian = year < 1582 || (year === 1582 && month < 10) ||
                   (year === 1582 && month === 10 && day < 15);
  let date;
  if (isJulian) {
    const jd = sb.julianDayNumber(year, month, day, 'julian');
    const g = sb.jdToCalendarDate(jd, 'gregorian');
    date = new Date(Date.UTC(g.year, g.month - 1, g.day, hh, mm, 0));
  } else {
    date = new Date(Date.UTC(year, month - 1, day, hh, mm, 0));
  }
  return { date, lon: parseFloat(parts[2]) };
}

function loadJplYear(year) {
  // Try hourly first (higher precision), then 3-hour
  for (const suffix of ['hourly', '3h']) {
    const file = join(__dirname, `jpl-eclon-${year}-${suffix}.txt`);
    if (existsSync(file)) {
      const lines = readFileSync(file, 'utf8').trim().split('\n');
      if (lines.length > 10) return lines.map(parseJplLine);
    }
  }
  return null;
}

function findCrossing(data, targetLon) {
  for (let i = 1; i < data.length; i++) {
    let pLon = data[i - 1].lon;
    let cLon = data[i].lon;

    if (targetLon === 0) {
      // 360°→0° wrap
      if (pLon > 350 && cLon < 10) {
        pLon -= 360;
        const frac = (0 - pLon) / (cLon - pLon);
        return new Date(data[i-1].date.getTime() + frac * (data[i].date.getTime() - data[i-1].date.getTime()));
      }
      continue;
    }

    // Normal crossing (handle wrap for longitudes > 270 at year start)
    if (pLon <= targetLon && cLon > targetLon && (cLon - pLon) < 5) {
      const frac = (targetLon - pLon) / (cLon - pLon);
      return new Date(data[i-1].date.getTime() + frac * (data[i].date.getTime() - data[i-1].date.getTime()));
    }
  }
  return null;
}

const pad = (n) => String(n).padStart(2, '0');
const fmtDate = (d) =>
  `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())} ` +
  `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;

// ── Load sxwnl reference data ─────────────────────────────────

const sxwnlAll = JSON.parse(
  readFileSync(join(root, 'tests', 'fixtures', 'sxwnl-solar-terms.json'), 'utf8')
);

// Index sxwnl by year+name for fast lookup
const sxwnlIndex = new Map();
for (const entry of sxwnlAll) {
  sxwnlIndex.set(`${entry.year}:${entry.name}`, new Date(entry.utcTimestamp));
}

// ── Run comparison ────────────────────────────────────────────

console.log('═══════════════════════════════════════════════════════════════════════════');
console.log('  3-WAY SOLAR TERM COMPARISON: stembranch vs sxwnl vs JPL DE441');
console.log(`  ${JPL_YEARS.length} years: ${JPL_YEARS[0]}–${JPL_YEARS[JPL_YEARS.length-1]} CE`);
console.log(`  (12 systematic 1900–2100 + 30 random seed=42 from 200–2800 CE)`);
console.log('═══════════════════════════════════════════════════════════════════════════\n');

const allResults = [];

for (const year of JPL_YEARS) {
  const jplData = loadJplYear(year);
  if (!jplData) {
    console.log(`⚠ No JPL data for ${year}, skipping.\n`);
    continue;
  }

  let yearResults = [];

  for (const term of SOLAR_TERMS) {
    // The 冬至 for a given "year" in sxwnl actually falls in Dec of the previous year
    // or early Jan. Handle this: 小寒-大雪 fall in `year`, 冬至 falls in Dec of `year`
    // But the JPL data file for `year` covers Jan 1 of `year` to Jan 1 of `year+1`

    const jplTT = findCrossing(jplData, term.lon);
    if (!jplTT) continue;

    // Convert JPL TT → UT
    const dtSec = sb.deltaT(jplTT);
    const jplUT = new Date(jplTT.getTime() - dtSec * 1000);

    // Determine which year sxwnl uses for this term
    // sxwnl indexes by the "Chinese year" — 冬至 of year Y is in the Y+1 entry
    // Actually let's just check both year and year-1
    const sxKey1 = `${year}:${term.name}`;
    const sxKey2 = `${year + 1}:${term.name}`;
    const sxKey0 = `${year - 1}:${term.name}`;
    let sxDate = sxwnlIndex.get(sxKey1) || null;

    // For terms that might be indexed under adjacent years, check proximity
    if (!sxDate || Math.abs(sxDate.getTime() - jplUT.getTime()) > 30 * 86400000) {
      const alt = sxwnlIndex.get(sxKey2) || sxwnlIndex.get(sxKey0);
      if (alt && Math.abs(alt.getTime() - jplUT.getTime()) < 30 * 86400000) {
        sxDate = alt;
      } else if (!sxDate || Math.abs(sxDate.getTime() - jplUT.getTime()) > 30 * 86400000) {
        sxDate = null; // No valid sxwnl match
      }
    }

    // stembranch
    let sbDate = null;
    const sbYear = jplUT.getUTCFullYear();
    const sbMonth = jplUT.getUTCMonth() + 1;
    try {
      sbDate = sb.findSolarTermMoment(term.lon, sbYear, Math.max(1, sbMonth - 1));
    } catch (_) {
      try { sbDate = sb.findSolarTermMoment(term.lon, sbYear); } catch (_2) {}
    }

    // Validate stembranch result is close to JPL (within 1 day)
    if (sbDate && Math.abs(sbDate.getTime() - jplUT.getTime()) > 86400000) {
      sbDate = null; // Wrong instance
    }

    const sbDiff = sbDate ? (sbDate.getTime() - jplUT.getTime()) / 1000 : NaN;
    const sxDiff = sxDate ? (sxDate.getTime() - jplUT.getTime()) / 1000 : NaN;

    yearResults.push({ year, name: term.name, lon: term.lon, jplUT, sbDate, sxDate, sbDiff, sxDiff });
    allResults.push({ year, name: term.name, lon: term.lon, jplUT, sbDate, sxDate, sbDiff, sxDiff });
  }

  // Print year summary
  const sbDiffs = yearResults.filter(r => !isNaN(r.sbDiff));
  const sxDiffs = yearResults.filter(r => !isNaN(r.sxDiff));
  const sbMean = sbDiffs.length ? (sbDiffs.reduce((s, r) => s + Math.abs(r.sbDiff), 0) / sbDiffs.length) : NaN;
  const sbMax = sbDiffs.length ? Math.max(...sbDiffs.map(r => Math.abs(r.sbDiff))) : NaN;
  const sxMean = sxDiffs.length ? (sxDiffs.reduce((s, r) => s + Math.abs(r.sxDiff), 0) / sxDiffs.length) : NaN;
  const sxMax = sxDiffs.length ? Math.max(...sxDiffs.map(r => Math.abs(r.sxDiff))) : NaN;

  console.log(`${year}: SB−JPL mean=${sbMean.toFixed(1)}s max=${sbMax.toFixed(1)}s (${sbDiffs.length} terms) | SX−JPL mean=${sxMean.toFixed(1)}s max=${sxMax.toFixed(1)}s (${sxDiffs.length} terms)`);
}

// ── Overall statistics ────────────────────────────────────────

console.log('\n═══════════════════════════════════════════════════════════════════════════');
console.log('  OVERALL STATISTICS');
console.log('═══════════════════════════════════════════════════════════════════════════\n');

const allSB = allResults.filter(r => !isNaN(r.sbDiff)).map(r => Math.abs(r.sbDiff));
const allSX = allResults.filter(r => !isNaN(r.sxDiff)).map(r => Math.abs(r.sxDiff));

const sortedSB = [...allSB].sort((a, b) => a - b);
const sortedSX = [...allSX].sort((a, b) => a - b);

const pct = (arr, p) => {
  const idx = (p / 100) * (arr.length - 1);
  const lo = Math.floor(idx), hi = Math.ceil(idx);
  return lo === hi ? arr[lo] : arr[lo] + (arr[hi] - arr[lo]) * (idx - lo);
};

if (allSB.length) {
  const mean = allSB.reduce((a, b) => a + b, 0) / allSB.length;
  console.log(`stembranch vs JPL DE441 (${allSB.length} terms across ${JPL_YEARS.length} years):`);
  console.log(`  Mean |Δ|:  ${mean.toFixed(2)}s`);
  console.log(`  Max  |Δ|:  ${Math.max(...allSB).toFixed(2)}s`);
  console.log(`  P50:       ${pct(sortedSB, 50).toFixed(2)}s`);
  console.log(`  P95:       ${pct(sortedSB, 95).toFixed(2)}s`);
  console.log(`  P99:       ${pct(sortedSB, 99).toFixed(2)}s`);
  console.log();
}

if (allSX.length) {
  const mean = allSX.reduce((a, b) => a + b, 0) / allSX.length;
  console.log(`sxwnl vs JPL DE441 (${allSX.length} terms across ${JPL_YEARS.length} years):`);
  console.log(`  Mean |Δ|:  ${mean.toFixed(2)}s`);
  console.log(`  Max  |Δ|:  ${Math.max(...allSX).toFixed(2)}s`);
  console.log(`  P50:       ${pct(sortedSX, 50).toFixed(2)}s`);
  console.log(`  P95:       ${pct(sortedSX, 95).toFixed(2)}s`);
  console.log(`  P99:       ${pct(sortedSX, 99).toFixed(2)}s`);
  console.log();
}

// stembranch vs sxwnl (from JPL-matched subset)
const sbSx = allResults.filter(r => !isNaN(r.sbDiff) && !isNaN(r.sxDiff))
  .map(r => Math.abs((r.sbDate.getTime() - r.sxDate.getTime()) / 1000));
if (sbSx.length) {
  const mean = sbSx.reduce((a, b) => a + b, 0) / sbSx.length;
  const sortedSbSx = [...sbSx].sort((a, b) => a - b);
  console.log(`stembranch vs sxwnl (${sbSx.length} terms, JPL-matched subset):`);
  console.log(`  Mean |Δ|:  ${mean.toFixed(2)}s`);
  console.log(`  Max  |Δ|:  ${Math.max(...sbSx).toFixed(2)}s`);
  console.log(`  P50:       ${pct(sortedSbSx, 50).toFixed(2)}s`);
  console.log(`  P95:       ${pct(sortedSbSx, 95).toFixed(2)}s`);
  console.log();
}

// ── Worst 10 (stembranch vs JPL) ──────────────────────────────

const worst10 = allResults.filter(r => !isNaN(r.sbDiff))
  .sort((a, b) => Math.abs(b.sbDiff) - Math.abs(a.sbDiff))
  .slice(0, 10);

console.log('Worst 10 (stembranch vs JPL):');
console.log('┌──────┬────────┬───────────┐');
console.log('│ Year │ Term   │ Δ (sec)   │');
console.log('├──────┼────────┼───────────┤');
for (const r of worst10) {
  console.log(`│ ${r.year} │ ${r.name}   │ ${(r.sbDiff >= 0 ? '+' : '') + r.sbDiff.toFixed(1).padStart(8)} │`);
}
console.log('└──────┴────────┴───────────┘\n');

// ── Per-year table for accuracy.md ────────────────────────────

console.log('Per-year summary (for accuracy.md):');
console.log('| Year | N | SB−JPL mean | SB−JPL max | SX−JPL mean | SX−JPL max |');
console.log('|------|---|-------------|------------|-------------|------------|');
for (const year of JPL_YEARS) {
  const yr = allResults.filter(r => r.year === year);
  const sb = yr.filter(r => !isNaN(r.sbDiff));
  const sx = yr.filter(r => !isNaN(r.sxDiff));
  const sbM = sb.length ? (sb.reduce((s, r) => s + Math.abs(r.sbDiff), 0) / sb.length).toFixed(1) : '—';
  const sbX = sb.length ? Math.max(...sb.map(r => Math.abs(r.sbDiff))).toFixed(1) : '—';
  const sxM = sx.length ? (sx.reduce((s, r) => s + Math.abs(r.sxDiff), 0) / sx.length).toFixed(1) : '—';
  const sxX = sx.length ? Math.max(...sx.map(r => Math.abs(r.sxDiff))).toFixed(1) : '—';
  console.log(`| ${year} | ${sb.length} | ${sbM}s | ${sbX}s | ${sxM}s | ${sxX}s |`);
}
