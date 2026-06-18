/* v8 ignore next */
/**
 * Render a comprehensive Birth Chart data dump.
 *
 * Nine sections mapping to chart construction:
 *   1. Chart Angles (ASC, DSC, MC, IC, Vertex, Eq. ASC)
 *   2. House Cusps (all 12)
 *   3. Planet Positions (enriched with speed, dignity, etc.)
 *   4. Aspects (with applying/separating)
 *   5. Chart Analysis (sect, distributions, pattern, moon phase)
 *   6. Dignities & Dispositors
 *   7. Classical Techniques (antiscia, fixed stars, VOC)
 *   8. Time Lords (firdaria, profections)
 *   9. Planetary Hours
 */
import type { BirthChartData } from '../birth-chart-types';
import { getZodiacSign } from '../tropical-astrology';
import { renderTitle, padRight } from './render-grid';
import { renderResearch } from './render-research';

function fmtLong(deg: number): string {
  return deg.toFixed(2) + '°';
}

function signDeg(longitude: number): { sign: string; degree: string } {
  const { sign, degree } = getZodiacSign(longitude);
  return { sign, degree: degree.toFixed(2) + '°' };
}

function fmtSpeed(speed: number, retrograde: boolean): string {
  const r = retrograde ? ' R' : '';
  return speed.toFixed(3) + '°/d' + r;
}

export function renderBirthChart(chart: BirthChartData): string[] {
  const output: string[] = [renderTitle('Western Natal Chart')];

  // ── Section 1: Chart Angles ──────────────────────────────────
  output.push('');
  output.push(
    `  ${padRight('Angle', 12)} ${padRight('Longitude', 12)} ${padRight('Sign', 14)} ${padRight('Degree', 10)}`,
  );
  output.push(`  ${'─'.repeat(50)}`);

  const angleEntries: [string, number][] = [
    ['ASC', chart.angles.asc],
    ['DSC', chart.angles.dsc],
    ['MC', chart.angles.mc],
    ['IC', chart.angles.ic],
    ['Vertex', chart.angles.vertex],
    ['Eq. ASC', chart.angles.equatorialAscendant],
  ];
  for (const [label, lon] of angleEntries) {
    const sd = signDeg(lon);
    output.push(
      `  ${padRight(label, 12)} ${padRight(fmtLong(lon), 12)} ${padRight(sd.sign, 14)} ${padRight(sd.degree, 10)}`,
    );
  }

  // ── Section 2: House Cusps ───────────────────────────────────
  output.push('');
  output.push('  House Cusps');
  output.push(`  House System: ${chart.houses.system}`);
  output.push(
    `  ${padRight('House', 8)} ${padRight('Longitude', 12)} ${padRight('Sign', 14)} ${padRight('Degree', 10)}`,
  );
  output.push(`  ${'─'.repeat(46)}`);

  for (let i = 0; i < chart.houses.cusps.length; i++) {
    const cusp = chart.houses.cusps[i];
    const sd = signDeg(cusp);
    const houseNum = String(i + 1);
    const label = i === 0 ? `${houseNum} (ASC)` : i === 9 ? `${houseNum} (MC)` : houseNum;
    output.push(
      `  ${padRight(label, 8)} ${padRight(fmtLong(cusp), 12)} ${padRight(sd.sign, 14)} ${padRight(sd.degree, 10)}`,
    );
  }

  // ── Section 3: Planet Positions ──────────────────────────────
  output.push('');
  output.push(
    `  ${padRight('Body', 16)} ${padRight('Long.', 10)} ${padRight('Sign', 12)} ${padRight('Deg.', 8)} ${padRight('H', 3)} ${padRight('Speed', 12)} ${padRight('Dignity', 10)}`,
  );
  output.push(`  ${'─'.repeat(73)}`);

  for (const pos of chart.positions) {
    const dignityStr = pos.dignity.dignities.length > 0
      ? pos.dignity.dignities.join(',')
      : pos.peregrine ? 'peregrine' : '';
    output.push(
      `  ${padRight(pos.body, 16)} ${padRight(fmtLong(pos.longitude), 10)} ${padRight(pos.sign, 12)} ${padRight(pos.signDegree.toFixed(2) + '°', 8)} ${padRight(String(pos.house), 3)} ${padRight(fmtSpeed(pos.speed, pos.retrograde), 12)} ${padRight(dignityStr, 10)}`,
    );
  }

  // ── Section 4: Aspects ───────────────────────────────────────
  if (chart.aspects.length > 0) {
    output.push('');
    output.push(
      `  ${padRight('Body 1', 10)} ${padRight('Aspect', 16)} ${padRight('Body 2', 10)} ${padRight('Angle', 10)} ${padRight('Orb', 8)} ${padRight('App/Sep', 8)}`,
    );
    output.push(`  ${'─'.repeat(64)}`);

    for (const a of chart.aspects) {
      const appSep = a.applying ? 'App' : 'Sep';
      const majorMark = a.major ? '' : ' (m)';
      output.push(
        `  ${padRight(a.body1, 10)} ${padRight(a.type + majorMark, 16)} ${padRight(a.body2, 10)} ${padRight(a.angle.toFixed(1) + '°', 10)} ${padRight(a.orb.toFixed(1) + '°', 8)} ${padRight(appSep, 8)}`,
      );
    }
  }

  // ── Section 5: Chart Analysis ────────────────────────────────
  output.push('');
  output.push('  Chart Analysis');
  output.push(`  ${'─'.repeat(46)}`);
  output.push(`  Sect:           ${chart.isDayChart ? 'Day Chart' : 'Night Chart'}`);
  output.push(`  Chart Pattern:  ${chart.chartPattern}`);
  output.push(`  Moon Phase:     ${chart.moonPhase.name} (${chart.moonPhase.angle.toFixed(1)}°, ${(chart.moonPhase.illumination * 100).toFixed(0)}% lit)`);
  output.push(`  VOC Moon:       ${chart.voidOfCourseMoon ? 'Yes' : 'No'}`);
  output.push(`  Lunar Mansion:  ${chart.lunarMansion.number}. ${chart.lunarMansion.name}`);
  output.push('');
  output.push(`  Elements:   Fire ${chart.distributions.elements.fire}  Earth ${chart.distributions.elements.earth}  Air ${chart.distributions.elements.air}  Water ${chart.distributions.elements.water}  (dominant: ${chart.distributions.elements.dominant})`);
  output.push(`  Qualities:  Cardinal ${chart.distributions.qualities.cardinal}  Fixed ${chart.distributions.qualities.fixed}  Mutable ${chart.distributions.qualities.mutable}  (dominant: ${chart.distributions.qualities.dominant})`);
  output.push(`  Polarity:   Positive ${chart.distributions.polarities.positive}  Negative ${chart.distributions.polarities.negative}`);
  output.push(`  Hemispheres: N ${chart.hemispheres.north}  S ${chart.hemispheres.south}  E ${chart.hemispheres.east}  W ${chart.hemispheres.west}`);

  // ── Section 6: Dignities & Dispositors ───────────────────────
  output.push('');
  output.push('  Dispositor Chain');
  output.push(`  ${'─'.repeat(46)}`);
  for (const [body, ruler] of Object.entries(chart.dispositorChain)) {
    output.push(`  ${padRight(body, 16)} -> ${ruler}`);
  }
  if (chart.finalDispositor) {
    output.push(`  Final Dispositor: ${chart.finalDispositor}`);
  }

  if (chart.mutualReceptions.length > 0) {
    output.push('');
    output.push('  Mutual Receptions');
    for (const mr of chart.mutualReceptions) {
      output.push(`  ${mr.body1} <-> ${mr.body2} (${mr.type})`);
    }
  }

  // ── Section 7: Classical Techniques ──────────────────────────
  if (chart.fixedStarConjunctions.length > 0) {
    output.push('');
    output.push('  Fixed Star Conjunctions');
    output.push(`  ${'─'.repeat(46)}`);
    for (const fs of chart.fixedStarConjunctions) {
      output.push(`  ${padRight(fs.body, 16)} conj ${padRight(fs.star, 16)} (orb ${fs.orb.toFixed(2)}°)`);
    }
  }

  // ── Section 8: Time Lords ────────────────────────────────────
  output.push('');
  output.push('  Time Lords');
  output.push(`  ${'─'.repeat(46)}`);
  output.push(`  Firdaria:     ${chart.firdaria.ruler} / ${chart.firdaria.subRuler}`);
  output.push(`  Profection:   House ${chart.profection.house}, ${chart.profection.sign} (lord: ${chart.profection.lord})`);
  output.push(`  Prenatal Syz: ${chart.prenatalSyzygy.type === 'new' ? 'New Moon' : 'Full Moon'} at ${fmtLong(chart.prenatalSyzygy.longitude)}`);
  if (chart.hyleg) {
    output.push(`  Hyleg:        ${chart.hyleg}`);
  }
  if (chart.alcochoden) {
    output.push(`  Alcochoden:   ${chart.alcochoden}`);
  }

  // ── Section 9: Planetary Hours ───────────────────────────────
  output.push('');
  output.push('  Planetary Hours');
  output.push(`  ${'─'.repeat(46)}`);
  output.push(`  Day:    ${chart.planetaryDay}`);
  output.push(`  Hour:   ${chart.planetaryHour.planet} (hour ${chart.planetaryHour.hourNumber}, ${chart.planetaryHour.isDayHour ? 'day' : 'night'})`);

  // ── Sections 10-16: Research Extensions (when present) ─────
  if (chart.research) {
    output.push(...renderResearch(chart.research));
  }

  return output;
}
