/* v8 ignore next */
/**
 * Render 紫白飛星 (Flying Stars) as four 3x3 Lo Shu grids.
 *
 * Each grid shows one of year/month/day/hour stars flying through
 * the nine palaces in the standard flight pattern.
 */
import type { FlyingStar, FlyingStarInfo } from '../flying-stars';
import { renderGrid, renderTitle, type GridCell } from './render-grid';

/** Lo Shu palace order for 3x3 grid. */
const LO_SHU_ORDER = [
  [4, 9, 2],
  [3, 5, 7],
  [8, 1, 6],
];

const STAR_NAMES: Record<number, string> = {
  1: '一白', 2: '二黑', 3: '三碧', 4: '四綠', 5: '五黃',
  6: '六白', 7: '七赤', 8: '八白', 9: '九紫',
};

/** Standard flying star sequence from center star. */
function flySequence(center: FlyingStar): Record<number, FlyingStar> {
  const order = [5, 6, 7, 8, 9, 1, 2, 3, 4]; // flight path from center
  const result: Record<number, FlyingStar> = {};
  for (let i = 0; i < 9; i++) {
    const palace = order[i];
    const star = (((center - 1 + i) % 9) + 1) as FlyingStar;
    result[palace] = star;
  }
  return result;
}

function renderStarGrid(label: string, info: FlyingStarInfo): string[] {
  const stars = flySequence(info.number);

  const cells: GridCell[][] = LO_SHU_ORDER.map((row) =>
    row.map((p) => ({
      lines: [
        `${stars[p]} ${STAR_NAMES[stars[p]]}`,
      ],
    })),
  );

  return [
    renderTitle(`${label}: ${info.number}${info.color} ${info.name} (${info.element})`),
    ...renderGrid(cells, { cellWidth: 12, padding: 1 }),
  ];
}

export function renderFlyingStars(stars: {
  year: FlyingStarInfo;
  month: FlyingStarInfo;
  day: FlyingStarInfo;
  hour: FlyingStarInfo;
}): string[] {
  return [
    renderTitle('紫白飛星 Flying Stars'),
    ...renderStarGrid('Year (年)', stars.year),
    '',
    ...renderStarGrid('Month (月)', stars.month),
    '',
    ...renderStarGrid('Day (日)', stars.day),
    '',
    ...renderStarGrid('Hour (時)', stars.hour),
  ];
}
