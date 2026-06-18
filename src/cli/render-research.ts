/* v8 ignore next */
/**
 * Render research / statistical extension sections (10–17).
 *
 *  10. Extended Speed Data
 *  11. Speculum Table
 *  12. 90-Degree Dial
 *  13. Midpoints & Structures
 *  14. Gauquelin Sectors
 *  15. Partile Aspects
 *  16. Accidental Dignity & Almuten Figuris
 *  17. Classical Conditions
 */

import type { ResearchData } from '../birth-chart-types';
import { padRight } from './render-grid';

export function renderResearch(research: ResearchData): string[] {
  const output: string[] = [];

  // ── Section 10: Extended Speed Data ────────────────────────
  output.push('');
  output.push('  Extended Speed Data');
  output.push(
    `  ${padRight('Body', 16)} ${padRight('Lat Spd', 10)} ${padRight('Dist Spd', 10)} ${padRight('Rel Spd', 10)} ${padRight('Fast/Slow', 10)}`,
  );
  output.push(`  ${'─'.repeat(58)}`);

  for (const p of research.positions) {
    const es = p.extendedSpeed;
    output.push(
      `  ${padRight(p.body, 16)} ${padRight(es.latitudeSpeed.toFixed(4) + '°/d', 10)} ${padRight(es.distanceSpeed.toFixed(6), 10)} ${padRight(es.relativeSpeed.toFixed(3), 10)} ${padRight(es.fast ? 'Fast' : 'Slow', 10)}`,
    );
  }

  // ── Section 11: Speculum Table ─────────────────────────────
  output.push('');
  output.push('  Speculum Table');
  output.push(
    `  ${padRight('Body', 14)} ${padRight('AD', 8)} ${padRight('OA', 8)} ${padRight('OD', 8)} ${padRight('MD', 8)} ${padRight('DSA', 8)} ${padRight('NSA', 8)} ${padRight('SA', 8)} ${padRight('HD', 8)} ${padRight('Pole', 8)}`,
  );
  output.push(`  ${'─'.repeat(90)}`);

  for (const p of research.positions) {
    const s = p.speculum;
    output.push(
      `  ${padRight(p.body, 14)} ${padRight(s.ad.toFixed(1), 8)} ${padRight(s.oa.toFixed(1), 8)} ${padRight(s.od.toFixed(1), 8)} ${padRight(s.md.toFixed(1), 8)} ${padRight(s.dsa.toFixed(1), 8)} ${padRight(s.nsa.toFixed(1), 8)} ${padRight(s.sa.toFixed(1), 8)} ${padRight(s.hd.toFixed(1), 8)} ${padRight(s.pole.toFixed(1), 8)}`,
    );
  }

  // ── Section 12: 90-Degree Dial ─────────────────────────────
  output.push('');
  output.push('  90-Degree Dial');
  output.push(
    `  ${padRight('Body', 16)} ${padRight('Dial 90°', 10)}`,
  );
  output.push(`  ${'─'.repeat(28)}`);

  for (const p of research.positions) {
    output.push(
      `  ${padRight(p.body, 16)} ${padRight(p.dialPosition90.toFixed(2) + '°', 10)}`,
    );
  }

  // ── Section 13: Midpoints & Structures ─────────────────────
  output.push('');
  output.push(`  Midpoints (${research.midpoints.length} pairs)`);
  output.push(
    `  ${padRight('Body 1', 10)} ${padRight('Body 2', 10)} ${padRight('Long.', 10)} ${padRight('Sign', 12)} ${padRight('Deg.', 8)} ${padRight('Dial 90°', 10)}`,
  );
  output.push(`  ${'─'.repeat(62)}`);

  for (const mp of research.midpoints) {
    output.push(
      `  ${padRight(mp.body1, 10)} ${padRight(mp.body2, 10)} ${padRight(mp.longitude.toFixed(2) + '°', 10)} ${padRight(mp.sign, 12)} ${padRight(mp.signDegree.toFixed(2) + '°', 8)} ${padRight(mp.dial90.toFixed(2) + '°', 10)}`,
    );
  }

  if (research.midpointStructures.length > 0) {
    output.push('');
    output.push('  Midpoint Structures');
    output.push(
      `  ${padRight('Body', 14)} ${padRight('at midpoint of', 16)} ${padRight('Orb', 8)}`,
    );
    output.push(`  ${'─'.repeat(40)}`);

    for (const ms of research.midpointStructures) {
      output.push(
        `  ${padRight(ms.body, 14)} ${padRight(ms.body1 + '/' + ms.body2, 16)} ${padRight(ms.orb.toFixed(2) + '°', 8)}`,
      );
    }
  }

  // ── Section 14: Gauquelin Sectors ──────────────────────────
  output.push('');
  output.push('  Gauquelin Sectors');
  output.push(
    `  ${padRight('Body', 16)} ${padRight('Sector', 8)} ${padRight('Plus Zone', 10)}`,
  );
  output.push(`  ${'─'.repeat(36)}`);

  for (const p of research.positions) {
    output.push(
      `  ${padRight(p.body, 16)} ${padRight(String(p.gauquelinSector), 8)} ${padRight(p.gauquelinPlusZone ? 'Yes' : '', 10)}`,
    );
  }

  // ── Section 15: Partile Aspects ────────────────────────────
  if (research.partileAspects.length > 0) {
    output.push('');
    output.push('  Partile Aspects (orb < 1°)');
    output.push(
      `  ${padRight('Body 1', 10)} ${padRight('Aspect', 16)} ${padRight('Body 2', 10)} ${padRight('Orb', 8)}`,
    );
    output.push(`  ${'─'.repeat(46)}`);

    for (const a of research.partileAspects) {
      output.push(
        `  ${padRight(a.body1, 10)} ${padRight(a.type, 16)} ${padRight(a.body2, 10)} ${padRight(a.orb.toFixed(3) + '°', 8)}`,
      );
    }
  }

  // ── Section 16: Accidental Dignity & Almuten Figuris ───────
  output.push('');
  output.push('  Accidental Dignity Scores');
  output.push(
    `  ${padRight('Body', 16)} ${padRight('Score', 8)}`,
  );
  output.push(`  ${'─'.repeat(26)}`);

  for (const p of research.positions) {
    const sign = p.accidentalDignityScore >= 0 ? '+' : '';
    output.push(
      `  ${padRight(p.body, 16)} ${padRight(sign + String(p.accidentalDignityScore), 8)}`,
    );
  }

  if (research.almutenFiguris) {
    output.push(`  Almuten Figuris: ${research.almutenFiguris}`);
  }

  // ── Section 17: Classical Conditions ─────────────────────────
  const classicalBodies = research.positions.filter(
    p => p.hayz || p.halb || p.besieged || p.viaCombusta || p.joyByHouse,
  );

  if (classicalBodies.length > 0) {
    output.push('');
    output.push('  Classical Conditions');
    output.push(
      `  ${padRight('Body', 16)} ${padRight('Hayz', 6)} ${padRight('Halb', 6)} ${padRight('Besieged', 10)} ${padRight('Via Combusta', 13)} ${padRight('Joy', 5)}`,
    );
    output.push(`  ${'─'.repeat(58)}`);

    for (const p of classicalBodies) {
      output.push(
        /* v8 ignore next */
        `  ${padRight(p.body, 16)} ${padRight(p.hayz ? 'Yes' : '', 6)} ${padRight(p.halb ? 'Yes' : '', 6)} ${padRight(p.besieged ? 'Yes' : '', 10)} ${padRight(p.viaCombusta ? 'Yes' : '', 13)} ${padRight(p.joyByHouse ? 'Yes' : '', 5)}`,
      );
    }
  }

  return output;
}
