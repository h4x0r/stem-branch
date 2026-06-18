/* v8 ignore next */
/**
 * Render Sidereal Astrology (Jyotish) chart:
 * ayanamsa, positions with nakshatras, Vimshottari dashas, divisional charts.
 */
import type { SiderealChart } from '../sidereal-astrology';
import { renderTable, renderTitle, padRight } from './render-grid';

export function renderSidereal(chart: SiderealChart): string[] {
  const output: string[] = [
    renderTitle('Sidereal Astrology (Jyotish)'),
  ];

  output.push(...renderTable([
    ['Ayanamsa', `${chart.ayanamsa.toFixed(4)}°`],
  ]));

  // Positions
  output.push('');
  output.push(`  ${padRight('Body', 10)} ${padRight('Sign', 14)} ${padRight('Degree', 8)} ${padRight('Nakshatra', 20)} ${padRight('Pada', 5)}`);
  output.push(`  ${'─'.repeat(61)}`);

  for (const pos of chart.positions) {
    output.push(
      `  ${padRight(pos.body, 10)} ${padRight(pos.sign, 14)} ${padRight(pos.signDegree.toFixed(1) + '°', 8)} ${padRight(pos.nakshatra, 20)} ${padRight(String(pos.nakshatraPada), 5)}`,
    );
  }

  // Vimshottari Dashas
  if (chart.dashas.length > 0) {
    output.push('');
    output.push(renderTitle('Vimshottari Dashas'));
    output.push(`  ${padRight('Planet', 10)} ${padRight('Years', 8)} ${padRight('Start', 12)} ${padRight('End', 12)}`);
    output.push(`  ${'─'.repeat(46)}`);
    for (const d of chart.dashas) {
      output.push(
        `  ${padRight(d.planet, 10)} ${padRight(d.years.toFixed(1), 8)} ${padRight(d.startDate.toISOString().slice(0, 10), 12)} ${padRight(d.endDate.toISOString().slice(0, 10), 12)}`,
      );
    }
  }

  // Divisional Charts (summary)
  for (const div of chart.divisionalCharts) {
    output.push('');
    output.push(renderTitle(`Divisional Chart ${div.type}`));
    for (const pos of div.positions) {
      output.push(`  ${padRight(pos.body, 10)} ${pos.sign} ${pos.signDegree.toFixed(1)}°`);
    }
  }

  return output;
}
