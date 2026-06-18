/* v8 ignore next */
/**
 * Render 奇門遁甲 (Qi Men Dun Jia) as a 3x3 Lo Shu grid.
 *
 * Palace layout:
 *   ┌───┬───┬───┐
 *   │ 4 │ 9 │ 2 │  (巽 離 坤)
 *   ├───┼───┼───┤
 *   │ 3 │ 5 │ 7 │  (震 中 兌)
 *   ├───┼───┼───┤
 *   │ 8 │ 1 │ 6 │  (艮 坎 乾)
 *   └───┴───┴───┘
 */
import type { QiMenChart } from '../mystery-gates';
import { renderGrid, renderTitle, type GridCell } from './render-grid';

/** Lo Shu palace order for a 3x3 grid (row-major). */
const LO_SHU_ORDER = [
  [4, 9, 2],
  [3, 5, 7],
  [8, 1, 6],
];

const PALACE_NAMES: Record<number, string> = {
  1: '坎', 2: '坤', 3: '震', 4: '巽',
  5: '中', 6: '乾', 7: '兌', 8: '艮', 9: '離',
};

export function renderQiMen(chart: QiMenChart): string[] {
  const header = `${chart.escapeMode} ${chart.juShu}局`;

  const cells: GridCell[][] = LO_SHU_ORDER.map((row) =>
    row.map((p) => ({
      lines: [
        `${PALACE_NAMES[p]}${p}`,
        /* v8 ignore next 3 */
        `${chart.stars[p] ?? ''} ${chart.doors[p] ?? ''}`,
        `${chart.deities[p] ?? ''}`,
        `${chart.heavenPlate[p] ?? ''}/${chart.earthPlate[p] ?? ''}`,
      ],
    })),
  );

  return [
    renderTitle(`奇門遁甲 Qi Men Dun Jia (${header})`),
    ...renderGrid(cells, { cellWidth: 18, padding: 1 }),
  ];
}
