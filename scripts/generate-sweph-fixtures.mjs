#!/usr/bin/env node
/**
 * Generate Swiss Ephemeris reference data for 4-way planet position validation.
 *
 * Uses the Moshier analytical ephemeris (built into sweph, no external files).
 * Moshier provides ~1" accuracy for planets, based on analytical theories
 * independent of both VSOP87D and JPL DE441.
 *
 * Computes apparent geocentric ecliptic longitude and latitude for all planets
 * at the same sampled epochs as the JPL fixture data.
 *
 * Usage: node scripts/generate-sweph-fixtures.mjs
 * Requires: npm install -D sweph
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const sweph = require('sweph');

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const jplPath = join(root, 'tests', 'fixtures', 'jpl-planet-positions.json');
const outPath = join(root, 'tests', 'fixtures', 'sweph-planet-positions.json');

// Swiss Ephemeris planet IDs
const PLANET_IDS = {
  mercury: 2,
  venus: 3,
  mars: 4,
  jupiter: 5,
  saturn: 6,
  uranus: 7,
  neptune: 8,
  pluto: 9,
};

// Flags: SEFLG_MOSEPH (4) = built-in Moshier ephemeris
// No SEFLG_TRUEPOS or SEFLG_NOABERR → apparent positions (aberration included)
// No SEFLG_NONUT → nutation included
const FLAGS = 4; // SEFLG_MOSEPH

// Read JPL fixtures to get the same epochs
const jplFixtures = JSON.parse(readFileSync(jplPath, 'utf8'));

console.log('Generating Swiss Ephemeris (Moshier) reference data...');
console.log(`  Reading ${jplFixtures.length} epochs from JPL fixtures\n`);

const fixtures = [];
const errors = [];

for (const ref of jplFixtures) {
  const planetId = PLANET_IDS[ref.planet];
  if (planetId === undefined) continue;

  // Convert timestamp to Julian Day (UT)
  const jd = 2451545.0 + (ref.timestamp / 86400000 - 10957.5);

  try {
    const result = sweph.calc_ut(jd, planetId, FLAGS);
    if (result.error && result.error.trim()) {
      errors.push(`${ref.planet} ${ref.dateISO}: ${result.error}`);
      continue;
    }

    fixtures.push({
      planet: ref.planet,
      dateISO: ref.dateISO,
      timestamp: ref.timestamp,
      eclLon: Math.round(result.data[0] * 1e6) / 1e6,
      eclLat: Math.round(result.data[1] * 1e6) / 1e6,
    });
  } catch (e) {
    errors.push(`${ref.planet} ${ref.dateISO}: ${e.message}`);
  }
}

writeFileSync(outPath, JSON.stringify(fixtures, null, 2));
console.log(`Wrote ${fixtures.length} entries to ${outPath}`);

if (errors.length > 0) {
  console.log(`\nErrors (${errors.length}):`);
  errors.forEach(e => console.log(`  ${e}`));
}

// Summary: per-planet counts
const counts = {};
for (const f of fixtures) counts[f.planet] = (counts[f.planet] || 0) + 1;
console.log('\nPer-planet counts:');
for (const [p, n] of Object.entries(counts)) console.log(`  ${p}: ${n}`);

// Quick comparison: stem-branch vs Swiss Ephemeris vs JPL
console.log('\n4-way comparison preview (first 3 epochs per planet):');
console.log('Planet       Date         JPL lon      SwEph lon    Δ(SwE-JPL)"');
console.log('─'.repeat(65));
for (const planet of Object.keys(PLANET_IDS)) {
  const pJpl = jplFixtures.filter(r => r.planet === planet).slice(0, 3);
  const pSwe = fixtures.filter(r => r.planet === planet).slice(0, 3);
  for (let i = 0; i < pJpl.length; i++) {
    const jpl = pJpl[i];
    const swe = pSwe[i];
    if (!swe) continue;
    let diff = swe.eclLon - jpl.eclLon;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    const diffArcsec = (diff * 3600).toFixed(2);
    console.log(`${planet.padEnd(12)} ${jpl.dateISO.slice(0, 10)}   ${jpl.eclLon.toFixed(4).padStart(10)}  ${swe.eclLon.toFixed(4).padStart(10)}   ${diffArcsec.padStart(8)}`);
  }
}
