/* v8 ignore next */
/**
 * Render Tropical Astrology chart: positions, houses, and aspects.
 */
import type { TropicalChart } from '../tropical-astrology';
import { getZodiacSign } from '../tropical-astrology';
import { renderTable, renderTitle, padRight } from './render-grid';

export function renderTropical(chart: TropicalChart): string[] {
  const output: string[] = [
    renderTitle('Tropical Astrology'),
  ];

  // House system + ASC/MC summary
  output.push(...renderTable([
    ['House System', chart.houses.system],
    ['Ascendant', `${chart.houses.ascendant.toFixed(2)}°`],
    ['Midheaven', `${chart.houses.midheaven.toFixed(2)}°`],
  ]));

  // House cusps table
  output.push('');
  output.push('  House Cusps');
  output.push(`  ${'─'.repeat(50)}`);

  for (let i = 0; i < chart.houses.cusps.length; i++) {
    const cusp = chart.houses.cusps[i];
    const { sign, degree } = getZodiacSign(cusp);
    const num = String(i + 1).padStart(2);
    const label = i === 0 ? ' (ASC)' : i === 9 ? ' (MC) ' : '      ';
    output.push(
      `  House ${num}${label}  ${padRight(cusp.toFixed(2) + '°', 10)} ${padRight(sign, 14)} ${degree.toFixed(2)}°`,
    );
  }

  // Positions (with longitude column)
  output.push('');
  output.push(`  ${padRight('Body', 10)} ${padRight('Longitude', 10)} ${padRight('Sign', 14)} ${padRight('Degree', 8)} ${padRight('House', 6)} ${padRight('Dignity', 12)}`);
  output.push(`  ${'─'.repeat(64)}`);

  for (const pos of chart.positions) {
    const dignity = pos.dignity ?? '';
    output.push(
      `  ${padRight(pos.body, 10)} ${padRight(pos.longitude.toFixed(2) + '°', 10)} ${padRight(pos.sign, 14)} ${padRight(pos.signDegree.toFixed(1) + '°', 8)} ${padRight(String(pos.house), 6)} ${padRight(dignity, 12)}`,
    );
  }

  // Aspects (with angle column)
  if (chart.aspects.length > 0) {
    output.push('');
    output.push(renderTitle('Aspects'));
    output.push(`  ${padRight('Body 1', 10)} ${padRight('Aspect', 14)} ${padRight('Body 2', 10)} ${padRight('Angle', 10)} ${padRight('Orb', 8)}`);
    output.push(`  ${'─'.repeat(54)}`);
    for (const a of chart.aspects) {
      output.push(
        `  ${padRight(a.body1, 10)} ${padRight(a.type, 14)} ${padRight(a.body2, 10)} ${padRight(a.angle.toFixed(1) + '°', 10)} ${a.orb.toFixed(1)}°`,
      );
    }
  }

  return output;
}
