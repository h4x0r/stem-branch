/* v8 ignore next */
/**
 * Render 大六壬 (Da Liu Ren / Grand Six Ren) as tables.
 *
 * Displays: day stem/branch, monthly general, plates (天地盤),
 * four lessons (四課), three transmissions (三傳), and method.
 */
import type { SixRenChart } from '../six-ren';
import { BRANCHES } from '../branches';
import { renderTable, renderTitle, renderGrid, type GridCell } from './render-grid';

export function renderLiuRen(chart: SixRenChart): string[] {
  const output: string[] = [
    renderTitle('大六壬 Da Liu Ren'),
  ];

  // Basic info
  output.push(...renderTable([
    ['Day Stem', chart.dayStem],
    ['Day Branch', chart.dayBranch],
    ['Hour Branch', chart.hourBranch],
    ['Monthly General', chart.monthlyGeneral],
    ['Method', chart.method],
  ]));

  // Three transmissions
  output.push('');
  output.push(renderTitle('三傳 Three Transmissions'));
  output.push(...renderTable([
    ['Initial (初傳)', chart.transmissions.initial],
    ['Middle (中傳)', chart.transmissions.middle],
    ['Final (末傳)', chart.transmissions.final],
  ]));

  // Four lessons
  output.push('');
  output.push(renderTitle('四課 Four Lessons'));
  const lessonCells: GridCell[][] = [
    chart.lessons.map((_, i) => ({ lines: [`Lesson ${i + 1}`] })),
    chart.lessons.map((l) => ({ lines: [`${l.upper} (上)`, `${l.lower} (下)`] })),
  ];
  output.push(...renderGrid(lessonCells, { cellWidth: 12, padding: 1 }));

  // Plates (abbreviated: show 6 key pairs)
  output.push('');
  output.push(renderTitle('天地盤 Heaven-Earth Plates'));
  const platePairs = BRANCHES.map(
    (b) => `${b}\u2192${chart.plates[b]}`,
  );
  // Display in 2 rows of 6
  output.push(`  ${platePairs.slice(0, 6).join('  ')}`);
  output.push(`  ${platePairs.slice(6).join('  ')}`);

  return output;
}
