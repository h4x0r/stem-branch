/* v8 ignore next */
/**
 * Render Four Pillars (四柱八字) as a 4-column table.
 */
import type { FourPillars } from '../types';
import { STEM_ELEMENT } from '../stems';
import { BRANCH_ELEMENT } from '../branches';
import { renderGrid, renderTitle, type GridCell } from './render-grid';

export function renderPillars(pillars: FourPillars): string[] {
  const order: (keyof FourPillars)[] = ['hour', 'day', 'month', 'year'];
  const labels = ['時柱 Hour', '日柱 Day', '月柱 Month', '年柱 Year'];

  const cells: GridCell[][] = [
    // Row 0: labels
    order.map((_, i) => ({ lines: [labels[i]] })),
    // Row 1: stem + branch
    order.map((key) => {
      const p = pillars[key];
      return {
        lines: [
          `${p.stem} ${STEM_ELEMENT[p.stem]}`,
          `${p.branch} ${BRANCH_ELEMENT[p.branch]}`,
        ],
      };
    }),
  ];

  return [
    renderTitle('四柱八字 Four Pillars'),
    ...renderGrid(cells, { cellWidth: 14, padding: 1 }),
  ];
}
