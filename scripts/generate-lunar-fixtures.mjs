#!/usr/bin/env node
/**
 * Generate lunar phase reference data for Moon validation tests.
 *
 * Queries JPL Horizons for Moon and Sun apparent RA/Dec at hourly intervals
 * around each lunation, finds the exact new/full moon moment by minimizing
 * the Sun-Moon elongation (new) or its complement (full).
 *
 * New moon: elongation ≈ 0° (Sun-Moon conjunction in ecliptic longitude)
 * Full moon: elongation ≈ 180° (Sun-Moon opposition)
 *
 * Usage: npm run build && node scripts/generate-lunar-fixtures.mjs
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outPath = join(root, 'tests', 'fixtures', 'jpl-lunar-phases.json');

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

// ── Mean obliquity (IAU 2006) ─────────────────────────────────
function meanObliquity(T) {
  const arcsec = 84381.406 - 46.836769 * T - 0.0001831 * T * T
    + 0.00200340 * T * T * T;
  return arcsec / 3600 * DEG_TO_RAD;
}

// ── Equatorial → ecliptic longitude ───────────────────────────
function raDecToEclipticLon(ra_deg, dec_deg, eps_rad) {
  const a = ra_deg * DEG_TO_RAD;
  const d = dec_deg * DEG_TO_RAD;
  let lon = Math.atan2(
    Math.sin(a) * Math.cos(eps_rad) + Math.tan(d) * Math.sin(eps_rad),
    Math.cos(a),
  );
  return ((lon % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) * RAD_TO_DEG;
}

// ── JPL Horizons API ──────────────────────────────────────────
const JPL_API = 'https://ssd.jpl.nasa.gov/api/horizons.api';

async function queryJPL(bodyId, start, stop, stepHours) {
  const url = `${JPL_API}?format=text`
    + `&COMMAND='${bodyId}'`
    + `&OBJ_DATA='NO'`
    + `&MAKE_EPHEM='YES'`
    + `&EPHEM_TYPE='OBSERVER'`
    + `&CENTER='500@399'`
    + `&START_TIME='${start}'`
    + `&STOP_TIME='${stop}'`
    + `&STEP_SIZE='${stepHours}%20HOURS'`
    + `&QUANTITIES='2'`
    + `&ANG_FORMAT='DEG'`
    + `&APPARENT='AIRLESS'`
    + `&CAL_FORMAT='CAL'`
    + `&TIME_DIGITS='MINUTES'`
    + `&SUPPRESS_RANGE_RATE='YES'`;

  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const text = await resp.text();

  const lines = text.split('\n');
  const soe = lines.findIndex(l => l.trim() === '$$SOE');
  const eoe = lines.findIndex(l => l.trim() === '$$EOE');
  if (soe === -1 || eoe === -1) throw new Error('No $$SOE/$$EOE markers');

  const months = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };

  const data = [];
  for (let i = soe + 1; i < eoe; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(/\s+/).filter(Boolean);
    if (parts.length < 4) continue;

    const [yearStr, monStr, dayStr] = parts[0].split('-');
    const year = parseInt(yearStr);
    const mon = months[monStr];
    if (mon === undefined) continue;
    const day = parseInt(dayStr);
    const [hh, mm] = parts[1].split(':').map(Number);

    const nums = [];
    for (let j = 2; j < parts.length && nums.length < 2; j++) {
      const v = parseFloat(parts[j]);
      if (!isNaN(v) && isFinite(v)) nums.push(v);
    }
    if (nums.length < 2) continue;

    const date = new Date(Date.UTC(year, mon, day, hh, mm));
    data.push({ date, ra: nums[0], dec: nums[1] });
  }
  return data;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Main ──────────────────────────────────────────────────────
async function main() {
  // Query Moon and Sun RA/Dec for 2000-2024 at 1-hour step.
  // This is a LOT of data points, so we'll do it in yearly chunks.
  console.log('Generating lunar phase fixtures (2000-2024)...\n');

  const phases = [];

  // Process in 2-year chunks to keep JPL response sizes manageable
  for (let startYear = 2000; startYear < 2024; startYear += 2) {
    const endYear = Math.min(startYear + 2, 2024);
    const start = `${startYear}-01-01`;
    const stop = `${endYear}-01-01`;

    console.log(`  Querying Moon ${start} to ${stop}...`);
    const moonData = await queryJPL('301', start, stop, 6); // 6-hour step
    await sleep(3000);

    console.log(`  Querying Sun ${start} to ${stop}...`);
    const sunData = await queryJPL('10', start, stop, 6);
    await sleep(3000);

    // Align by timestamp
    const sunMap = new Map();
    for (const s of sunData) sunMap.set(s.date.getTime(), s);

    // Compute elongations
    const elongations = [];
    for (const m of moonData) {
      const s = sunMap.get(m.date.getTime());
      if (!s) continue;

      const JD = 2451545.0 + (m.date.getTime() / 86400000 - 10957.5);
      const T = (JD - 2451545.0) / 36525;
      const eps = meanObliquity(T);

      const moonLon = raDecToEclipticLon(m.ra, m.dec, eps);
      const sunLon = raDecToEclipticLon(s.ra, s.dec, eps);

      let elong = moonLon - sunLon;
      if (elong < 0) elong += 360;
      if (elong >= 360) elong -= 360;

      elongations.push({ date: m.date, elong });
    }

    // Find new moons (elongation crosses 0°) and full moons (crosses 180°)
    for (let i = 1; i < elongations.length; i++) {
      const prev = elongations[i - 1];
      const curr = elongations[i];

      // New moon: elongation crosses 360→0 (wraps around)
      if (prev.elong > 300 && curr.elong < 60) {
        // Interpolate: the crossing is between prev and curr
        const phaseFrac = (360 - prev.elong) / ((360 - prev.elong) + curr.elong);
        const crossTime = prev.date.getTime() + phaseFrac * (curr.date.getTime() - prev.date.getTime());
        phases.push({
          type: 'new',
          dateISO: new Date(crossTime).toISOString(),
          timestamp: Math.round(crossTime),
        });
      }

      // Full moon: elongation crosses 180°
      if (prev.elong < 180 && curr.elong >= 180 && curr.elong < 300) {
        const phaseFrac = (180 - prev.elong) / (curr.elong - prev.elong);
        const crossTime = prev.date.getTime() + phaseFrac * (curr.date.getTime() - prev.date.getTime());
        phases.push({
          type: 'full',
          dateISO: new Date(crossTime).toISOString(),
          timestamp: Math.round(crossTime),
        });
      }
    }
  }

  // Sort by timestamp
  phases.sort((a, b) => a.timestamp - b.timestamp);

  writeFileSync(outPath, JSON.stringify(phases, null, 2));
  console.log(`\nWrote ${phases.length} phases to ${outPath}`);
  console.log(`  New moons: ${phases.filter(p => p.type === 'new').length}`);
  console.log(`  Full moons: ${phases.filter(p => p.type === 'full').length}`);
}

main().catch(console.error);
