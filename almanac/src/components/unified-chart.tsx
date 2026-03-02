'use client';

import { BRANCHES } from 'stembranch';
import type { QiMenChart, SixRenChart, ZiWeiChart } from 'stembranch';

// ── Geometry ─────────────────────────────────────────────────

const CX = 400;
const CY = 395; // slightly above center for legend room

function xy(r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
}

function sectorPath(r1: number, r2: number, deg1: number, deg2: number) {
  const [ox1, oy1] = xy(r2, deg1);
  const [ox2, oy2] = xy(r2, deg2);
  const [ix2, iy2] = xy(r1, deg2);
  const [ix1, iy1] = xy(r1, deg1);
  const lg = deg2 - deg1 > 180 ? 1 : 0;
  return [
    `M${ox1},${oy1}`,
    `A${r2},${r2} 0 ${lg} 1 ${ox2},${oy2}`,
    `L${ix2},${iy2}`,
    `A${r1},${r1} 0 ${lg} 0 ${ix1},${iy1}`,
    'Z',
  ].join(' ');
}

// ── Layout ───────────────────────────────────────────────────

/** 12-branch angle: index 0 (子) at top (-90deg), clockwise 30deg each */
const ba = (i: number) => -90 + i * 30;

/** Ring radii [inner, outer] */
const OR = { i: 295, o: 383 }; // outer  — 紫微斗數
const MR = { i: 218, o: 290 }; // middle — 大六壬
const IR = { i: 138, o: 213 }; // inner  — 奇門遁甲
const CR = 133;                 // center circle

/** 奇門 8-direction layout */
const QI_DIRS: { p: number; n: string; a: number }[] = [
  { p: 1, n: '坎', a: -90 },
  { p: 8, n: '艮', a: -45 },
  { p: 3, n: '震', a: 0 },
  { p: 4, n: '巽', a: 45 },
  { p: 9, n: '離', a: 90 },
  { p: 2, n: '坤', a: 135 },
  { p: 7, n: '兌', a: 180 },
  { p: 6, n: '乾', a: -135 },
];

// ── Colors ───────────────────────────────────────────────────

const PAL = {
  // outer ring (紫微)
  outerBg:     '#faf5ff',
  outerFate:   '#ede9fe',
  outerBody:   '#f3e8ff',
  outerStroke: '#c4b5fd',
  starFill:    '#6d28d9',
  // middle ring (六壬)
  midBg:       '#f0fdfa',
  midStroke:   '#99f6e4',
  heavenFill:  '#1e40af',
  generalFill: '#0d9488',
  // inner ring (奇門)
  innerBg:     '#fffbeb',
  innerStroke: '#fcd34d',
  trigramFill: '#92400e',
  qimenFill:   '#b45309',
  // center
  centerBg:    '#1c1917',
  centerText:  '#f5f5f4',
  // general
  dimText:     '#a1a1aa',
  bodyText:    '#555',
};

// ── Component ────────────────────────────────────────────────

export interface UnifiedChartProps {
  polaris?: ZiWeiChart | null;
  sixRen?: SixRenChart | null;
  qimen?: QiMenChart | null;
}

export function UnifiedChart({ polaris, sixRen, qimen }: UnifiedChartProps) {
  return (
    <svg
      viewBox="0 0 800 810"
      className="w-full max-w-[740px] mx-auto"
      role="img"
      aria-label="三式合盤"
    >
      <style>{`
        text { font-family: 'Noto Serif TC', 'Songti SC', 'SimSun', serif; }
      `}</style>

      {/* ── Outer ring: 紫微斗數 (12 palaces) ────────── */}
      {BRANCHES.map((br, i) => {
        const a = ba(i);
        const palace = polaris?.palaces[i];
        const isFate = polaris != null && i === polaris.fatePalaceIndex;
        const isBody = polaris != null && i === polaris.bodyPalaceIndex;
        const fill = isFate ? PAL.outerFate : isBody ? PAL.outerBody : PAL.outerBg;
        const [mx, my] = xy((OR.i + OR.o) / 2, a);
        const [bx, by] = xy(OR.o - 13, a);

        return (
          <g key={`o${i}`}>
            <path
              d={sectorPath(OR.i, OR.o, a - 15, a + 15)}
              fill={fill}
              stroke={PAL.outerStroke}
              strokeWidth="0.5"
            />
            {/* Branch label near outer edge */}
            <text x={bx} y={by} textAnchor="middle" dominantBaseline="central"
              fontSize="13" fontWeight="bold" fill="#333">
              {br}
            </text>
            {palace && (
              <>
                <text x={mx} y={my - 16} textAnchor="middle" dominantBaseline="central"
                  fontSize="10" fill={PAL.bodyText}>
                  {palace.name}
                </text>
                <text x={mx} y={my - 4} textAnchor="middle" dominantBaseline="central"
                  fontSize="9" fill={PAL.dimText}>
                  {palace.stem}
                </text>
                {palace.majorStars.slice(0, 3).map((s, si) => (
                  <text key={si} x={mx} y={my + 9 + si * 12} textAnchor="middle"
                    dominantBaseline="central" fontSize="10" fill={PAL.starFill}>
                    {s}
                  </text>
                ))}
              </>
            )}
          </g>
        );
      })}

      {/* ── Middle ring: 大六壬 (12 positions) ─────────── */}
      {BRANCHES.map((br, i) => {
        const a = ba(i);
        const heaven = sixRen?.plates[br];
        const general = sixRen?.generals[br];
        const [mx, my] = xy((MR.i + MR.o) / 2, a);

        return (
          <g key={`m${i}`}>
            <path
              d={sectorPath(MR.i, MR.o, a - 15, a + 15)}
              fill={PAL.midBg}
              stroke={PAL.midStroke}
              strokeWidth="0.5"
            />
            {heaven && (
              <text x={mx} y={my - 10} textAnchor="middle" dominantBaseline="central"
                fontSize="13" fontWeight="bold" fill={PAL.heavenFill}>
                {heaven}
              </text>
            )}
            <text x={mx} y={my + 4} textAnchor="middle" dominantBaseline="central"
              fontSize="10" fill={PAL.dimText}>
              {br}
            </text>
            {general && (
              <text x={mx} y={my + 17} textAnchor="middle" dominantBaseline="central"
                fontSize="10" fill={PAL.generalFill}>
                {general}
              </text>
            )}
          </g>
        );
      })}

      {/* ── Inner ring: 奇門遁甲 (8 directions) ──────── */}
      {QI_DIRS.map(({ p, n, a }) => {
        const [mx, my] = xy((IR.i + IR.o) / 2, a);
        const star = qimen?.stars[p];
        const door = qimen?.doors[p];
        const earth = qimen?.earthPlate[p];
        const heaven = qimen?.heavenPlate[p];

        return (
          <g key={`i${p}`}>
            <path
              d={sectorPath(IR.i, IR.o, a - 22.5, a + 22.5)}
              fill={PAL.innerBg}
              stroke={PAL.innerStroke}
              strokeWidth="0.5"
            />
            <text x={mx} y={my - 18} textAnchor="middle" dominantBaseline="central"
              fontSize="12" fontWeight="bold" fill={PAL.trigramFill}>
              {n}
            </text>
            {earth && heaven && (
              <text x={mx} y={my - 4} textAnchor="middle" dominantBaseline="central"
                fontSize="10" fill={PAL.qimenFill}>
                {earth}/{heaven}
              </text>
            )}
            {star && (
              <text x={mx} y={my + 10} textAnchor="middle" dominantBaseline="central"
                fontSize="10" fill={PAL.qimenFill}>
                {star}
              </text>
            )}
            {door && (
              <text x={mx} y={my + 22} textAnchor="middle" dominantBaseline="central"
                fontSize="10" fill={PAL.qimenFill}>
                {door}門
              </text>
            )}
          </g>
        );
      })}

      {/* ── Center: 奇門 中宮 (palace 5) ─────────────── */}
      <circle cx={CX} cy={CY} r={CR} fill={PAL.centerBg} />
      {qimen ? (
        <>
          <text x={CX} y={CY - 34} textAnchor="middle" dominantBaseline="central"
            fontSize="14" fontWeight="bold" fill={PAL.centerText}>
            中宮
          </text>
          <text x={CX} y={CY - 16} textAnchor="middle" dominantBaseline="central"
            fontSize="12" fill={PAL.centerText}>
            {qimen.earthPlate[5]}/{qimen.heavenPlate[5]}
          </text>
          {qimen.stars[5] && (
            <text x={CX} y={CY + 0} textAnchor="middle" dominantBaseline="central"
              fontSize="12" fill={PAL.centerText}>
              {qimen.stars[5]}
            </text>
          )}
          <text x={CX} y={CY + 18} textAnchor="middle" dominantBaseline="central"
            fontSize="11" fill="#a8a29e">
            {qimen.escapeMode} {qimen.juShu}局
          </text>
          <text x={CX} y={CY + 34} textAnchor="middle" dominantBaseline="central"
            fontSize="9" fill="#78716c">
            值符:{qimen.zhiFu.star}
          </text>
          <text x={CX} y={CY + 48} textAnchor="middle" dominantBaseline="central"
            fontSize="9" fill="#78716c">
            值使:{qimen.zhiShi.door}門
          </text>
        </>
      ) : (
        <text x={CX} y={CY} textAnchor="middle" dominantBaseline="central"
          fontSize="15" fontWeight="bold" fill={PAL.centerText}>
          三式合盤
        </text>
      )}

      {/* ── Legend ─────────────────────────────────────── */}
      <g fontSize="10">
        <rect x={210} y={793} width={10} height={10} rx="2" fill={PAL.outerStroke} />
        <text x={224} y={802} dominantBaseline="central" fill="#666">紫微斗數</text>
        <rect x={320} y={793} width={10} height={10} rx="2" fill={PAL.midStroke} />
        <text x={334} y={802} dominantBaseline="central" fill="#666">大六壬</text>
        <rect x={410} y={793} width={10} height={10} rx="2" fill={PAL.innerStroke} />
        <text x={424} y={802} dominantBaseline="central" fill="#666">奇門遁甲</text>
      </g>
    </svg>
  );
}
