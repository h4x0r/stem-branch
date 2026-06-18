/* v8 ignore next */
import type { MansionName } from '../types';

export interface MansionBoundary {
  name: MansionName;
  star: string;
  hip: number;
  startDeg: number;
}

/**
 * 28 lunar mansion sidereal boundaries, ordered by increasing sidereal longitude.
 * Sidereal reference: Spica (α Vir) = 0° = start of 角宿.
 * Sources: Pan Nai, Hipparcos catalogue, Sun & Kistemaker.
 * Note: startDeg values are approximate pending full Hipparcos verification.
 */
export const MANSION_BOUNDARIES: readonly MansionBoundary[] = [
  { name: '角', star: 'α Vir',  hip: 65474, startDeg: 0.000 },
  { name: '亢', star: 'κ Vir',  hip: 69427, startDeg: 12.00 },
  { name: '氐', star: 'α Lib',  hip: 72622, startDeg: 28.00 },
  { name: '房', star: 'π Sco',  hip: 78265, startDeg: 33.00 },
  { name: '心', star: 'σ Sco',  hip: 78820, startDeg: 38.00 },
  { name: '尾', star: 'μ Sco',  hip: 82514, startDeg: 44.50 },
  { name: '箕', star: 'γ Sgr',  hip: 89642, startDeg: 62.50 },
  { name: '斗', star: 'φ Sgr',  hip: 92041, startDeg: 73.50 },
  { name: '牛', star: 'β Cap',  hip: 100345, startDeg: 99.50 },
  { name: '女', star: 'ε Aqr',  hip: 102618, startDeg: 107.00 },
  { name: '虛', star: 'β Aqr',  hip: 106278, startDeg: 119.00 },
  { name: '危', star: 'α Aqr',  hip: 109074, startDeg: 129.00 },
  { name: '室', star: 'α Peg',  hip: 113963, startDeg: 145.50 },
  { name: '壁', star: 'γ Peg',  hip: 677,    startDeg: 161.50 },
  { name: '奎', star: 'η And',  hip: 5447,   startDeg: 170.50 },
  { name: '婁', star: 'β Ari',  hip: 9132,   startDeg: 186.50 },
  { name: '胃', star: '35 Ari', hip: 12390,  startDeg: 198.50 },
  { name: '昴', star: '17 Tau', hip: 17499,  startDeg: 210.00 },
  { name: '畢', star: 'ε Tau',  hip: 20889,  startDeg: 221.00 },
  { name: '觜', star: 'λ Ori',  hip: 26207,  startDeg: 237.50 },
  { name: '參', star: 'δ Ori',  hip: 25930,  startDeg: 240.00 },
  { name: '井', star: 'μ Gem',  hip: 30343,  startDeg: 261.00 },
  { name: '鬼', star: 'θ Cnc',  hip: 41822,  startDeg: 294.00 },
  { name: '柳', star: 'δ Hya',  hip: 42313,  startDeg: 298.00 },
  { name: '星', star: 'α Hya',  hip: 46390,  startDeg: 313.00 },
  { name: '張', star: 'υ¹ Hya', hip: 48356,  startDeg: 320.00 },
  { name: '翼', star: 'α Crt',  hip: 53740,  startDeg: 332.00 },
  { name: '軫', star: 'γ Crv',  hip: 59316,  startDeg: 350.00 },
];
