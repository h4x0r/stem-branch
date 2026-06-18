/* v8 ignore next */
/**
 * Render 紫微斗數 (Zi Wei Dou Shu / Polaris Astrology) as a 4x4 grid.
 *
 * The 12 palaces wrap around the outer ring of a 4x4 grid.
 * The center 2x2 area displays chart metadata.
 *
 * Palace positions (by branch index 0-11):
 *   ┌────┬────┬────┬────┐
 *   │  3 │  4 │  5 │  6 │  (辰 巳 午 未)
 *   ├────┼─────────┼────┤
 *   │  2 │ metadata │  7 │  (卯    申)
 *   ├────┤         ├────┤
 *   │  1 │         │  8 │  (寅    酉)
 *   ├────┼────┬────┼────┤
 *   │  0 │ 11 │ 10 │  9 │  (丑 子 亥 戌)
 *   └────┴────┴────┴────┘
 */
import type { ZiWeiChart } from '../polaris';
import { renderGrid, renderTitle, padCenter, type GridCell } from './render-grid';

/** Map branch index to grid position [row, col]. */
const BRANCH_TO_GRID: [number, number][] = [
  [3, 0], // 0: 丑
  [2, 0], // 1: 寅 (actually branch index in palaces array)
  [1, 0], // 2: 卯
  [0, 0], // 3: 辰
  [0, 1], // 4: 巳
  [0, 2], // 5: 午
  [0, 3], // 6: 未
  [1, 3], // 7: 申
  [2, 3], // 8: 酉
  [3, 3], // 9: 戌
  [3, 2], // 10: 亥
  [3, 1], // 11: 子
];

export function renderPolaris(chart: ZiWeiChart): string[] {
  const cellWidth = 16;

  // Build 4x4 grid initialized with center metadata
  const cells: GridCell[][] = Array.from({ length: 4 }, () =>
    Array.from({ length: 4 }, () => ({ lines: [''] })),
  );

  // Center 2x2: chart metadata
  const patternNames: Record<number, string> = {
    2: '水二局', 3: '木三局', 4: '金四局', 5: '土五局', 6: '火六局',
  };
  const genderLabel = chart.birthData.gender === 'female' ? '坤造 ♀' : '乾造 ♂';
  cells[1][1] = { lines: ['紫微斗數', genderLabel] };
  /* v8 ignore next */
  cells[1][2] = { lines: [patternNames[chart.elementPattern] ?? `${chart.elementPattern}局`] };
  cells[2][1] = { lines: [`${chart.birthData.year}年`] };
  cells[2][2] = { lines: [`月${chart.birthData.month} 日${chart.birthData.day}`] };

  // Fill outer ring with palace data
  for (let i = 0; i < chart.palaces.length && i < 12; i++) {
    const palace = chart.palaces[i];
    const [r, c] = BRANCH_TO_GRID[i];
    // Skip center cells
    /* v8 ignore next */
    if ((r === 1 || r === 2) && (c === 1 || c === 2)) continue;

    const stars = palace.majorStars.slice(0, 3).join(' ');
    cells[r][c] = {
      lines: [
        `${palace.name}`,
        `${palace.stem}${palace.branch}`,
        stars || '---',
      ],
    };
  }

  return [
    renderTitle('紫微斗數 Zi Wei Dou Shu'),
    ...renderGrid(cells, { cellWidth, padding: 1 }),
  ];
}
