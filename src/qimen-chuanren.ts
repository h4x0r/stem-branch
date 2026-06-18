/* v8 ignore next */
/**
 * 奇門穿壬 (Qi Men Chuan Ren)
 *
 * Composition layer overlaying 大六壬 天地盤 branch mappings
 * onto the 奇門遁甲 九宮 grid.
 *
 * Each palace in the 3x3 Lo Shu grid receives:
 *   - QiMen layers: star (九星), door (八門), deity (八神), heaven/earth stems
 *   - LiuRen overlays: earth-plate and heaven-plate branches mapped to this palace
 *   - Transmission markers: which palace(s) contain the 三傳 branches
 */

import type { Branch, Stem } from './types';
import { BRANCHES } from './branches';
import type { QiMenChart } from './mystery-gates';
import { computeQiMenForDate } from './mystery-gates';
import type { SixRenChart } from './six-ren';
import { computeSixRenForDate } from './six-ren';

// ── Branch-to-palace mapping ───────────────────────────────

/**
 * Map an earthly branch to its Later Heaven Bagua palace (Lo Shu).
 *
 * 寅卯→3(震), 辰巳→4(巽), 午→9(離), 未申→2(坤),
 * 酉戌→7(兌), 亥子→1(坎), 丑→8(艮)
 *
 * Note: No branch maps to palace 5 (center/中宮) or 6 (乾).
 */
const BRANCH_PALACE_MAP: Record<Branch, number> = {
  '子': 1, '丑': 8, '寅': 3, '卯': 3, '辰': 4, '巳': 4,
  '午': 9, '未': 2, '申': 2, '酉': 7, '戌': 7, '亥': 1,
};

export function branchToPalace(branch: Branch): number {
  return BRANCH_PALACE_MAP[branch];
}

// ── Types ──────────────────────────────────────────────────

export interface ChuanRenPalace {
  palace: number;                    // 1-9
  // QiMen layers
  star: string;                      // 九星
  door: string;                      // 八門
  deity: string;                     // 八神
  heavenStem: string;                // 天盤干
  earthStem: string;                 // 地盤干
  // LiuRen overlay
  liurenEarthBranches: Branch[];     // 地盤 branches mapped to this palace
  liurenHeavenBranches: Branch[];    // 天盤 branches mapped to this palace
  transmission: null | 'initial' | 'middle' | 'final';
}

export interface ChuanRenChart {
  qimen: QiMenChart;
  liuren: SixRenChart;
  palaces: ChuanRenPalace[];
}

// ── Main computation ───────────────────────────────────────

export function computeChuanRenChart(date: Date): ChuanRenChart {
  const qimen = computeQiMenForDate(date);
  const liuren = computeSixRenForDate(date);

  // Build palace structures
  const palaces: ChuanRenPalace[] = [];

  for (let p = 1; p <= 9; p++) {
    // Collect earth-plate branches that map to this palace
    const earthBranches: Branch[] = [];
    const heavenBranches: Branch[] = [];

    for (const branch of BRANCHES) {
      if (branchToPalace(branch) === p) {
        earthBranches.push(branch);
        // The heaven branch is what the liuren plate maps this earth branch to
        heavenBranches.push(liuren.plates[branch]);
      }
    }

    // For palace 5 (center) and palace 6 (乾), no branches map directly.
    // Palace 5: 天禽 borrows to palace 2 in QiMen. No direct LiuRen branches.
    // Palace 6: 乾. No direct LiuRen branch mapping.
    // They get empty arrays for branches, which is correct.

    // Determine transmission status
    let transmission: null | 'initial' | 'middle' | 'final' = null;
    const { initial, middle, final: fin } = liuren.transmissions;

    // Check if any transmission branch maps to this palace
    // Priority: initial > middle > final (when multiple land on the same palace)
    if (branchToPalace(initial) === p) transmission = 'initial';
    if (branchToPalace(middle) === p) {
      /* v8 ignore next */
      transmission = transmission === null ? 'middle' : transmission;
    }
    if (branchToPalace(fin) === p) {
      transmission = transmission === null ? 'final' : transmission;
    }

    palaces.push({
      palace: p,
      /* v8 ignore next 5 */
      star: qimen.stars[p] || '',
      door: qimen.doors[p] || '',
      deity: qimen.deities[p] || '',
      heavenStem: qimen.heavenPlate[p] || '',
      earthStem: qimen.earthPlate[p] || '',
      liurenEarthBranches: earthBranches,
      liurenHeavenBranches: heavenBranches,
      transmission,
    });
  }

  return { qimen, liuren, palaces };
}
