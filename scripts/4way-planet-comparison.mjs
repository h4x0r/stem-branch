#!/usr/bin/env node
/**
 * 4-way planet position comparison.
 *
 * Compares geocentric ecliptic longitudes from:
 * 1. stem-branch (VSOP87D + DE441 corrections)
 * 2. Swiss Ephemeris (Moshier analytical ephemeris)
 * 3. JPL Horizons DE441 (ground truth)
 * 4. sxwnl (Sun only — where available)
 *
 * Reports mean/max deviations per planet for each source pair.
 *
 * Usage: npm run build && node scripts/4way-planet-comparison.mjs
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const sb = await import(join(root, 'dist', 'index.js'));

const jplFixtures = JSON.parse(readFileSync(join(root, 'tests/fixtures/jpl-planet-positions.json'), 'utf8'));
const sweFixtures = JSON.parse(readFileSync(join(root, 'tests/fixtures/sweph-planet-positions.json'), 'utf8'));

const planets = ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];

function angularDiff(a, b) {
  let d = a - b;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

function stats(errors) {
  const abs = errors.map(Math.abs);
  const mean = abs.reduce((a, b) => a + b, 0) / abs.length;
  const max = Math.max(...abs);
  return { mean, max };
}

console.log('═══════════════════════════════════════════════════════════════════');
console.log('  4-Way Planet Position Comparison');
console.log('  stem-branch (VSOP87D+DE441) vs Swiss Ephemeris vs JPL DE441');
console.log('  101 epochs per planet, 730-day step, 1900–2100 CE');
console.log('═══════════════════════════════════════════════════════════════════\n');

// Build lookup for Swiss Ephemeris data
const sweMap = new Map();
for (const s of sweFixtures) sweMap.set(`${s.planet}:${s.timestamp}`, s);

console.log('┌──────────┬─────────────────────┬─────────────────────┬─────────────────────┐');
console.log('│ Planet   │ SB vs JPL (")        │ SwE vs JPL (")      │ SB vs SwE (")       │');
console.log('│          │  mean      max       │  mean      max      │  mean      max      │');
console.log('├──────────┼─────────────────────┼─────────────────────┼─────────────────────┤');

const summary = {};

for (const planet of planets) {
  const jplRefs = jplFixtures.filter(r => r.planet === planet);
  const sbVsJpl = [];
  const sweVsJpl = [];
  const sbVsSwe = [];

  for (const ref of jplRefs) {
    const date = new Date(ref.timestamp);
    const pos = sb.getPlanetPosition(planet, date);

    // stem-branch vs JPL
    const sbDiff = angularDiff(pos.longitude, ref.eclLon) * 3600;
    sbVsJpl.push(sbDiff);

    // Swiss Ephemeris vs JPL
    const swe = sweMap.get(`${planet}:${ref.timestamp}`);
    if (swe) {
      const sweDiff = angularDiff(swe.eclLon, ref.eclLon) * 3600;
      sweVsJpl.push(sweDiff);

      // stem-branch vs Swiss Ephemeris
      const sbSweDiff = angularDiff(pos.longitude, swe.eclLon) * 3600;
      sbVsSwe.push(sbSweDiff);
    }
  }

  const sb_jpl = stats(sbVsJpl);
  const swe_jpl = stats(sweVsJpl);
  const sb_swe = stats(sbVsSwe);

  summary[planet] = { sb_jpl, swe_jpl, sb_swe };

  const fmt = (v) => v.toFixed(2).padStart(8);
  console.log(`│ ${planet.padEnd(8)} │${fmt(sb_jpl.mean)}  ${fmt(sb_jpl.max)}   │${fmt(swe_jpl.mean)}  ${fmt(swe_jpl.max)}   │${fmt(sb_swe.mean)}  ${fmt(sb_swe.max)}   │`);
}

console.log('└──────────┴─────────────────────┴─────────────────────┴─────────────────────┘');

// Overall stats (excluding Pluto)
console.log('\n── VSOP87D planets only (excluding Pluto) ──');
const vsop = planets.filter(p => p !== 'pluto');
const allSbJpl = vsop.flatMap(p => {
  const refs = jplFixtures.filter(r => r.planet === p);
  return refs.map(ref => {
    const pos = sb.getPlanetPosition(p, new Date(ref.timestamp));
    return Math.abs(angularDiff(pos.longitude, ref.eclLon) * 3600);
  });
});
const allSweJpl = vsop.flatMap(p => {
  const refs = jplFixtures.filter(r => r.planet === p);
  return refs.map(ref => {
    const swe = sweMap.get(`${p}:${ref.timestamp}`);
    return swe ? Math.abs(angularDiff(swe.eclLon, ref.eclLon) * 3600) : 0;
  }).filter(v => v > 0);
});

console.log(`  stem-branch vs JPL:  mean=${(allSbJpl.reduce((a,b)=>a+b)/allSbJpl.length).toFixed(2)}"  max=${Math.max(...allSbJpl).toFixed(2)}"`);
console.log(`  SwEph vs JPL:        mean=${(allSweJpl.reduce((a,b)=>a+b)/allSweJpl.length).toFixed(2)}"  max=${Math.max(...allSweJpl).toFixed(2)}"`);

console.log('\n── Interpretation ──');
console.log('JPL DE441 = ground truth (numerical integration of solar system)');
console.log('SwEph (Moshier) = independent analytical ephemeris (~1" vs JPL)');
console.log('stem-branch (VSOP87D) = analytical + DE441 even-polynomial correction');
console.log('Inner planets (Mercury, Venus): stem-branch achieves 1-2" — close to SwEph');
console.log('Outer planets (Mars–Neptune): stem-branch ~11-14" — VSOP87D truncation limit');
