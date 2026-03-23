#!/usr/bin/env node
/**
 * Generate JPL Horizons reference data for planet position validation.
 *
 * Queries JPL Horizons DE441 for apparent RA & Dec of each planet at
 * sampled epochs, converts to ecliptic longitude via mean obliquity,
 * and saves as a JSON fixture for use in validation tests.
 *
 * Coordinate conversion: Using mean obliquity for equatorial → ecliptic
 * conversion introduces < 1" error for planets near the ecliptic plane
 * (error ∝ tan(β) × Δε). This is negligible compared to VSOP87D errors.
 *
 * Usage: npm run build && node scripts/generate-planet-fixtures.mjs
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outPath = join(root, 'tests', 'fixtures', 'jpl-planet-positions.json');

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

const PLANETS = ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
const JPL_IDS = {
  mercury: '199', venus: '299', mars: '499', jupiter: '599',
  saturn: '699', uranus: '799', neptune: '899', pluto: '999',
};

// JPL Horizons validity ranges for DE441 (discovered during fitting)
const RANGES = {
  mercury: ['1900-01-01', '2100-12-31'],
  venus:   ['1900-01-01', '2100-12-31'],
  mars:    ['1900-01-01', '2100-12-31'],
  jupiter: ['1900-01-01', '2100-12-31'],
  saturn:  ['1900-01-01', '2100-12-31'],
  uranus:  ['1900-01-01', '2100-12-31'],
  neptune: ['1900-01-01', '2100-12-31'],
  pluto:   ['1900-01-01', '2099-12-31'],
};

// ── Mean obliquity (IAU 2006), in radians ──────────────────────
function meanObliquity(T) {
  const arcsec = 84381.406 - 46.836769 * T - 0.0001831 * T * T
    + 0.00200340 * T * T * T;
  return arcsec / 3600 * DEG_TO_RAD;
}

// ── Equatorial (RA, Dec) → ecliptic longitude ─────────────────
function raDecToEclipticLon(ra_deg, dec_deg, eps_rad) {
  const a = ra_deg * DEG_TO_RAD;
  const d = dec_deg * DEG_TO_RAD;
  let lon = Math.atan2(
    Math.sin(a) * Math.cos(eps_rad) + Math.tan(d) * Math.sin(eps_rad),
    Math.cos(a),
  );
  return ((lon % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) * RAD_TO_DEG;
}

// ── Equatorial (RA, Dec) → ecliptic latitude ──────────────────
function raDecToEclipticLat(ra_deg, dec_deg, eps_rad) {
  const a = ra_deg * DEG_TO_RAD;
  const d = dec_deg * DEG_TO_RAD;
  const sinBeta = Math.sin(d) * Math.cos(eps_rad)
    - Math.cos(d) * Math.sin(eps_rad) * Math.sin(a);
  return Math.asin(sinBeta) * RAD_TO_DEG;
}

// ── JPL Horizons API ───────────────────────────────────────────
const JPL_API = 'https://ssd.jpl.nasa.gov/api/horizons.api';

async function queryJPL(planetId, start, stop, stepDays) {
  const url = `${JPL_API}?format=text`
    + `&COMMAND='${planetId}'`
    + `&OBJ_DATA='NO'`
    + `&MAKE_EPHEM='YES'`
    + `&EPHEM_TYPE='OBSERVER'`
    + `&CENTER='500@399'`
    + `&START_TIME='${start}'`
    + `&STOP_TIME='${stop}'`
    + `&STEP_SIZE='${stepDays}%20DAYS'`
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
  if (soe === -1 || eoe === -1) {
    console.error('Response (first 50 lines):');
    lines.slice(0, 50).forEach(l => console.error('  ', l));
    throw new Error('No $$SOE/$$EOE markers in JPL response');
  }

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

    // Collect numeric values after date/time (skip flags like '*', 'm', 'C')
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

// ── Utilities ──────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Main ───────────────────────────────────────────────────────
async function main() {
  console.log('Generating JPL planet position fixtures...');
  console.log('Range: 1900-2100, step: 730 days (~2 years)\n');

  const fixtures = [];

  for (const planet of PLANETS) {
    const [start, stop] = RANGES[planet];
    console.log(`  ${planet} (${JPL_IDS[planet]}): ${start} to ${stop}...`);

    let jplData;
    try {
      jplData = await queryJPL(JPL_IDS[planet], start, stop, 730);
      console.log(`    ${jplData.length} epochs from JPL`);
    } catch (e) {
      console.error(`    FAILED: ${e.message}`);
      continue;
    }

    for (const { date, ra, dec } of jplData) {
      const JD = 2451545.0 + (date.getTime() / 86400000 - 10957.5);
      const T = (JD - 2451545.0) / 36525;
      const eps = meanObliquity(T);

      const eclLon = raDecToEclipticLon(ra, dec, eps);
      const eclLat = raDecToEclipticLat(ra, dec, eps);

      fixtures.push({
        planet,
        dateISO: date.toISOString(),
        timestamp: date.getTime(),
        eclLon: Math.round(eclLon * 1e6) / 1e6,
        eclLat: Math.round(eclLat * 1e6) / 1e6,
      });
    }

    // Rate limit
    await sleep(3000);
  }

  writeFileSync(outPath, JSON.stringify(fixtures, null, 2));
  console.log(`\nWrote ${fixtures.length} entries to ${outPath}`);

  // Summary
  const counts = {};
  for (const f of fixtures) counts[f.planet] = (counts[f.planet] || 0) + 1;
  console.log('\nPer-planet counts:');
  for (const [p, n] of Object.entries(counts)) console.log(`  ${p}: ${n}`);
}

main().catch(console.error);
