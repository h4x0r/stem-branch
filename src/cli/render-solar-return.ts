/* v8 ignore next */
/**
 * Render a Solar Return chart summary.
 */
import type { SolarReturnResult } from '../solar-return';
import { padRight, renderTitle } from './render-grid';

function formatLongitude(lon: number): string {
  const signs = [
    'Ari', 'Tau', 'Gem', 'Can', 'Leo', 'Vir',
    'Lib', 'Sco', 'Sag', 'Cap', 'Aqu', 'Pis',
  ];
  const signIdx = Math.floor(lon / 30) % 12;
  const deg = lon % 30;
  return `${deg.toFixed(2)}° ${signs[signIdx]}`;
}

export function renderSolarReturn(sr: SolarReturnResult): string[] {
  const output: string[] = [];
  const { chart, returnDate, natalSunLongitude, year } = sr;

  output.push(renderTitle(`Solar Return ${year}`));
  output.push(`  Return Date:  ${returnDate.toISOString()}`);
  output.push(`  Natal Sun:    ${formatLongitude(natalSunLongitude)} (${natalSunLongitude.toFixed(4)}°)`);
  output.push('');

  // ── Angles ──────────────────────────────────────────────────
  output.push('  Angles');
  output.push(`  ${'─'.repeat(36)}`);
  output.push(`  ASC   ${formatLongitude(chart.angles.asc)}`);
  output.push(`  MC    ${formatLongitude(chart.angles.mc)}`);
  output.push(`  DSC   ${formatLongitude(chart.angles.dsc)}`);
  output.push(`  IC    ${formatLongitude(chart.angles.ic)}`);
  output.push('');

  // ── Planetary Positions ─────────────────────────────────────
  output.push('  Positions');
  output.push(
    `  ${padRight('Body', 16)} ${padRight('Longitude', 16)} ${padRight('Sign', 6)} ${padRight('House', 6)} ${padRight('Retro', 6)}`,
  );
  output.push(`  ${'─'.repeat(52)}`);

  for (const p of chart.positions) {
    output.push(
      `  ${padRight(p.body, 16)} ${padRight(formatLongitude(p.longitude), 16)} ${padRight(p.sign, 6)} ${padRight(String(p.house), 6)} ${padRight(p.retrograde ? 'R' : '', 6)}`,
    );
  }

  // ── House Cusps ─────────────────────────────────────────────
  output.push('');
  output.push('  House Cusps');
  output.push(`  ${'─'.repeat(30)}`);
  for (let i = 0; i < chart.houses.cusps.length; i++) {
    output.push(`  ${padRight(`H${i + 1}`, 6)} ${formatLongitude(chart.houses.cusps[i])}`);
  }

  return output;
}
