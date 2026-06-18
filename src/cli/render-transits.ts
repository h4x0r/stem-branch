/* v8 ignore next */
/**
 * Render transit overlay — current positions + aspects to natal chart.
 */
import type { TransitResult } from '../transits';
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

export function renderTransits(result: TransitResult): string[] {
  const output: string[] = [];

  output.push(renderTitle('Transits'));
  output.push(`  Transit Date: ${result.transitDate.toISOString()}`);
  output.push('');

  // ── Transit Positions ───────────────────────────────────────
  output.push('  Transit Positions');
  output.push(
    `  ${padRight('Body', 16)} ${padRight('Longitude', 16)} ${padRight('Retro', 6)}`,
  );
  output.push(`  ${'─'.repeat(40)}`);

  for (const p of result.transitPositions) {
    output.push(
      `  ${padRight(p.body, 16)} ${padRight(formatLongitude(p.longitude), 16)} ${padRight(p.retrograde ? 'R' : '', 6)}`,
    );
  }

  // ── Transit-to-Natal Aspects ────────────────────────────────
  output.push('');
  output.push('  Transit-to-Natal Aspects');
  output.push(
    `  ${padRight('Transit', 16)} ${padRight('Aspect', 14)} ${padRight('Natal', 16)} ${padRight('Orb', 8)}`,
  );
  output.push(`  ${'─'.repeat(56)}`);

  /* v8 ignore next 2 */
  if (result.aspects.length === 0) {
    output.push('  (none within orb)');
  } else {
    for (const a of result.aspects) {
      output.push(
        `  ${padRight(a.transitBody, 16)} ${padRight(a.type, 14)} ${padRight(a.natalBody, 16)} ${padRight(a.orb.toFixed(2) + '°', 8)}`,
      );
    }
  }

  return output;
}
