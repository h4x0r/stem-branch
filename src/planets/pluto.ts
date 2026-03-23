/**
 * Pluto heliocentric position using Meeus Chapter 37 algorithm.
 *
 * 43 periodic terms with 3 fundamental arguments (J, S, P)
 * related to Jupiter, Saturn, and Pluto mean longitudes.
 *
 * Valid: 1885-2099 CE. Accuracy: few arcseconds.
 *
 * Reference: Meeus, "Astronomical Algorithms" 2nd ed, Table 37.A
 */

import type { HeliocentricPosition } from './geocentric';

const DEG_TO_RAD = Math.PI / 180;

// ── 43 periodic terms ────────────────────────────────────────────
// Each row: [J, S, P, lonSin, lonCos, latSin, latCos, radSin, radCos]
// Longitude/latitude coefficients ×10⁻⁶, radius ×10⁻⁷
// prettier-ignore
const PLUTO_TERMS: readonly (readonly number[])[] = [
  [0,0,1, -19799805,19850055, -5452852,-14974862, 66865439,68951812],
  [0,0,2, 897144,-4954829, 3527812,1672790, -11827535,-332538],
  [0,0,3, 611149,1211027, -1050748,327647, 1593179,-1438890],
  [0,0,4, -341243,-189585, 178690,-292153, -18444,483220],
  [0,0,5, 129287,-34992, 18650,100340, -65977,-85431],
  [0,0,6, -38164,30893, -30697,-25823, 31098,75775],
  [0,1,-1, 20442,-9987, 4878,11248, -5644,-14780],
  [0,1,0, -4063,-5071, 226,-64, -4314,-510],
  [0,1,1, -6016,-3336, 2030,-836, 1278,-3228],
  [0,1,2, -3956,3039, 69,-604, 8212,9030],
  [0,1,3, -667,3572, -247,-567, -286,-1450],
  [0,2,-2, 1276,501, -57,-184, -5645,-34],
  [0,2,-1, 1152,-917, -103,-93, -253,-61],
  [0,2,0, 630,-1277, -156,-53, -329,-1063],
  [1,-1,0, 2571,-459, -23,-68, 2788,-117],
  [1,-1,1, 899,-1449, -24,-69, -22952,-16707],
  [1,0,-3, -1016,1043, 21,94, -4680,7110],
  [1,0,-2, -2343,-1012, 343,38, -980,-1844],
  [1,0,-1, 7042,788, -30,-80, -75159,-53050],
  [1,0,0, 1199,-338, 15,14, 35964,20577],
  [1,0,1, 418,-67, 10,-16, -10203,-3221],
  [1,0,2, 120,-274, 11,-25, -1062,-1080],
  [1,0,3, -60,-159, 16,-2, -2127,-915],
  [1,0,4, -82,-29, 11,10, -1267,-519],
  [1,1,-3, -36,-29, -9,-5, 1316,-300],
  [1,1,-2, -40,7, -9,25, -649,-195],
  [1,1,-1, -14,22, -5,8, -298,-4049],
  [1,1,0, 4,13, 12,-4, -198,-2020],
  [1,1,1, 5,2, -2,7, -271,-1208],
  [1,1,3, -1,0, 10,5, -178,-249],
  [2,0,-6, 2,0, -27,-1, 60,-1092],
  [2,0,-5, -4,5, -40,-28, 104,-90],
  [2,0,-4, 4,-7, 25,-192, 124,-233],
  [2,0,-3, 14,24, 14,5, 376,-381],
  [2,0,-2, -49,-34, 94,97, -124,-10],
  [2,0,-1, 163,-48, -161,45, 116,-164],
  [2,0,0, 9,-24, -17,18, -32,-279],
  [2,0,1, -4,1, 14,6, -49,-36],
  [2,0,2, -3,1, -5,-7, -10,-120],
  [2,0,3, 1,3, -8,-6, -6,-72],
  [3,0,-2, -3,-1, 0,1, -10,-30],
  [3,0,-1, 5,-3, 0,0, -7,-14],
  [3,0,0, 0,0, 0,-1, 0,-1],
];

/**
 * Compute Pluto's heliocentric ecliptic position (J2000.0).
 *
 * @param tau - Julian millennia from J2000.0 (TDB/TT)
 * @returns HeliocentricPosition { L (rad), B (rad), R (AU) }
 */
export function getPlutoHelio(tau: number): HeliocentricPosition {
  // Convert millennia to centuries
  const T = tau * 10;

  // Fundamental arguments (degrees)
  const J = 34.35 + 3034.9057 * T;
  const S = 50.08 + 1222.1138 * T;
  const P = 238.96 + 144.96 * T;

  let sumLon = 0;
  let sumLat = 0;
  let sumRad = 0;

  for (const t of PLUTO_TERMS) {
    const alpha = (t[0] * J + t[1] * S + t[2] * P) * DEG_TO_RAD;
    const sinA = Math.sin(alpha);
    const cosA = Math.cos(alpha);

    sumLon += t[3] * sinA + t[4] * cosA;
    sumLat += t[5] * sinA + t[6] * cosA;
    sumRad += t[7] * sinA + t[8] * cosA;
  }

  const L = (238.958116 + 144.96 * T + sumLon / 1e6) * DEG_TO_RAD;
  const B = (-3.908239 + sumLat / 1e6) * DEG_TO_RAD;
  const R = 40.7241346 + sumRad / 1e7;

  return { L, B, R };
}
