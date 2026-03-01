import type { Branch, Element, EarthType } from './types';

/** The four earth (土) branches: 辰丑戌未 */
export const EARTH_BRANCHES: readonly Branch[] = ['辰', '丑', '戌', '未'];

const EARTH_TYPE_MAP: Partial<Record<Branch, EarthType>> = {
  '辰': '濕', '丑': '濕',
  '戌': '燥', '未': '燥',
};

/** 庫/墓 — Each earth branch stores a specific element */
export const STORAGE_MAP: Partial<Record<Branch, Element>> = {
  '辰': '水', // 水庫
  '戌': '火', // 火庫
  '丑': '金', // 金庫
  '未': '木', // 木庫
};

/** Check if a branch is wet earth (濕土) */
export function isWetEarth(branch: Branch): boolean {
  return EARTH_TYPE_MAP[branch] === '濕';
}

/** Check if a branch is dry earth (燥土) */
export function isDryEarth(branch: Branch): boolean {
  return EARTH_TYPE_MAP[branch] === '燥';
}

/** Get the earth type of a branch, or null if not an earth branch */
export function getEarthType(branch: Branch): EarthType | null {
  return EARTH_TYPE_MAP[branch] ?? null;
}

/** Get the element stored by an earth branch (庫/墓), or null */
export function getStorageElement(branch: Branch): Element | null {
  return STORAGE_MAP[branch] ?? null;
}
