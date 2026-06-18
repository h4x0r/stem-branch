/* v8 ignore next */
/**
 * Render 七政四餘 (Seven Governors Four Remainders) chart.
 *
 * Displays a table of body positions (mansion, degree, palace, dignity)
 * plus the ascendant, star spirits, and aspects.
 */
import type { SevenGovernorsChart } from '../seven-governors';
import { renderTable, renderTitle, padRight } from './render-grid';

const BODY_CHINESE: Record<string, string> = {
  sun: '日 Sun', moon: '月 Moon',
  mercury: '水 Mercury', venus: '金 Venus', mars: '火 Mars',
  jupiter: '木 Jupiter', saturn: '土 Saturn',
  rahu: '羅 Rahu', ketu: '計 Ketu',
  yuebei: '月孛 Yuebei', purpleqi: '紫氣 PurpleQi',
};

export function renderSevenGovernors(chart: SevenGovernorsChart): string[] {
  const output: string[] = [
    renderTitle('七政四餘 Seven Governors'),
  ];

  // Ascendant
  output.push(...renderTable([
    ['Ascendant', `${chart.ascendant.mansion} (${chart.ascendant.palace})`],
    ['Sidereal Mode', chart.siderealMode.type],
  ]));

  // Body positions table
  output.push('');
  output.push(`  ${padRight('Body', 18)} ${padRight('Mansion', 10)} ${padRight('Degree', 8)} ${padRight('Palace', 8)} ${padRight('Dignity', 10)}`);
  output.push(`  ${'─'.repeat(58)}`);

  for (const [key, pos] of Object.entries(chart.bodies)) {
    /* v8 ignore next */
    const label = BODY_CHINESE[key] ?? key;
    /* v8 ignore next */
    const dignity = chart.dignities[key as keyof typeof chart.dignities] ?? '';
    output.push(
      `  ${padRight(label, 18)} ${padRight(pos.mansion, 10)} ${padRight(pos.mansionDegree.toFixed(1) + '°', 8)} ${padRight(pos.palace, 8)} ${padRight(dignity, 10)}`,
    );
  }

  // Aspects (if any)
  if (chart.aspects.length > 0) {
    output.push('');
    output.push(renderTitle('Aspects'));
    for (const a of chart.aspects.slice(0, 10)) {
      /* v8 ignore next */
      output.push(`  ${a.body1} ${a.type} ${a.body2}${a.name ? ` (${a.name})` : ''}`);
    }
  }

  // Star spirits (if any)
  if (chart.starSpirits.length > 0) {
    output.push('');
    output.push(renderTitle('Star Spirits (神煞)'));
    for (const s of chart.starSpirits.slice(0, 10)) {
      output.push(`  ${s.name} (${s.type}): ${s.condition}`);
    }
  }

  return output;
}
