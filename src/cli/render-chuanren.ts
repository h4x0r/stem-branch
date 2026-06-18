/* v8 ignore next */
/**
 * Render 奇門穿壬 (Qi Men Chuan Ren) as a 3x3 Lo Shu grid
 * overlaying QiMen layers with LiuRen branch mappings.
 */
import type { ChuanRenChart } from '../qimen-chuanren';
import { renderGrid, renderTitle, type GridCell } from './render-grid';

const LO_SHU_ORDER = [
  [4, 9, 2],
  [3, 5, 7],
  [8, 1, 6],
];

const PALACE_NAMES: Record<number, string> = {
  1: '坎', 2: '坤', 3: '震', 4: '巽',
  5: '中', 6: '乾', 7: '兌', 8: '艮', 9: '離',
};

export function renderChuanRen(chart: ChuanRenChart): string[] {
  const palaceMap = new Map(chart.palaces.map((p) => [p.palace, p]));

  const cells: GridCell[][] = LO_SHU_ORDER.map((row) =>
    row.map((p) => {
      const palace = palaceMap.get(p);
      /* v8 ignore next */
      if (!palace) return { lines: [`${PALACE_NAMES[p]}${p}`] };

      /* v8 ignore next 4 */
      const transmissionMark = palace.transmission
        ? ` [${palace.transmission === 'initial' ? '初'
            : palace.transmission === 'middle' ? '中'
            : '末'}傳]`
        : '';

      return {
        lines: [
          `${PALACE_NAMES[p]}${p}${transmissionMark}`,
          `${palace.star} ${palace.door}`,
          `${palace.deity}`,
          `${palace.heavenStem}/${palace.earthStem}`,
          palace.liurenEarthBranches.length > 0
            ? `地:${palace.liurenEarthBranches.join('')} 天:${palace.liurenHeavenBranches.join('')}`
            : '',
        ].filter(Boolean),
      };
    }),
  );

  return [
    renderTitle('奇門穿壬 Qi Men Chuan Ren'),
    ...renderGrid(cells, { cellWidth: 22, padding: 1 }),
  ];
}
