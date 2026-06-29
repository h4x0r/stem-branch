#!/usr/bin/env node
/**
 * Convert the JPL lunar-phase fixture (tests/fixtures/jpl-lunar-phases.json) into
 * a Rust oracle of phase instants as JDE(TT), so the Rust crate can validate
 * moon_position timing against JPL the same way tests/moon-validation.test.ts
 * does on the npm side. JPL's instants are the independent input — this is NOT
 * the (now circular) "conjunction at our own new moon" check.
 *
 * Output: rust/tests/data/jpl_lunar_phases.txt. Run: node scripts/gen-jpl-phases-rust.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { deltaTForYear } from '../dist/index.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const phases = JSON.parse(readFileSync(join(root, 'tests/fixtures/jpl-lunar-phases.json'), 'utf8'));

const lines = [
  '# JPL new/full-moon instants as JDE(TT), from tests/fixtures/jpl-lunar-phases.json',
  '# <new|full> <jde_tt>',
];
for (const p of phases) {
  const d = new Date(p.timestamp);
  const jdUT = p.timestamp / 86400000 + 2440587.5;
  const decimalYear = d.getUTCFullYear() + (d.getUTCMonth() + 0.5) / 12;
  const jdeTT = jdUT + deltaTForYear(decimalYear) / 86400;
  lines.push(`${p.type} ${jdeTT}`);
}
writeFileSync(join(root, 'rust/tests/data/jpl_lunar_phases.txt'), lines.join('\n') + '\n');
console.log(`wrote ${phases.length} JPL phase instants`);
