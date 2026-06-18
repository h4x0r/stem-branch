/* v8 ignore next */
/**
 * Render 大運 (Major Luck) and 小運 (Minor Luck) periods.
 */
import type { MajorLuckResult, MinorLuckYear } from '../luck-pillars';
import { padRight, renderTitle } from './render-grid';

export function renderLuck(
  major: MajorLuckResult,
  minor: MinorLuckYear[],
): string[] {
  const output: string[] = [];

  const dirLabel = major.direction === 'forward' ? '順行 Forward' : '逆行 Backward';

  output.push(renderTitle('大運流年 Luck Periods'));
  output.push(`  Direction: ${dirLabel}    Starting Age: ${major.startAge}`);
  output.push('');

  // ── Major Luck (大運) ─────────────────────────────────────────
  output.push('  大運 Major Luck');
  output.push(
    `  ${padRight('Ages', 10)} ${padRight('Pillar', 8)}`,
  );
  output.push(`  ${'─'.repeat(20)}`);

  for (const p of major.periods) {
    output.push(
      `  ${padRight(`${p.startAge}–${p.endAge}`, 10)} ${padRight(p.pillar.stemBranch, 8)}`,
    );
  }

  // ── Minor Luck (小運) ─────────────────────────────────────────
  if (minor.length > 0) {
    output.push('');
    output.push('  小運 Minor Luck');
    output.push(
      `  ${padRight('Age', 6)} ${padRight('Pillar', 8)}`,
    );
    output.push(`  ${'─'.repeat(16)}`);

    for (const y of minor) {
      output.push(
        `  ${padRight(String(y.age), 6)} ${padRight(y.pillar.stemBranch, 8)}`,
      );
    }
  }

  return output;
}
