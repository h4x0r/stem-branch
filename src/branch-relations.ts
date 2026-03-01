/* c8 ignore next */
import type { Branch, Element, DayRelation, PunishmentType } from './types';
import { BRANCH_ELEMENT } from './branches';
import { getElementRelation } from './elements';

// ── 六合 (Six Harmonies) ────────────────────────────────────

/** 六合 (Harmony) pairs */
export const HARMONY_PAIRS: readonly [Branch, Branch][] = [
  ['子', '丑'], ['寅', '亥'], ['卯', '戌'],
  ['辰', '酉'], ['巳', '申'], ['午', '未'],
];

/** Check if two branches form a 六合 (Harmony) pair */
export function isHarmony(a: Branch, b: Branch): boolean {
  return HARMONY_PAIRS.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
}

// ── 六沖 (Six Clashes) ─────────────────────────────────────

/** 六沖 (Clash) pairs — branches 6 apart on the cycle */
export const CLASH_PAIRS: readonly [Branch, Branch][] = [
  ['子', '午'], ['丑', '未'], ['寅', '申'],
  ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
];

/** Check if two branches form a 六沖 (Clash) pair */
export function isClash(a: Branch, b: Branch): boolean {
  return CLASH_PAIRS.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
}

// ── 三合 (Three Harmonies) ──────────────────────────────────

/** 三合 — Three branches combining into an element */
export const THREE_HARMONIES: readonly { branches: [Branch, Branch, Branch]; element: Element }[] = [
  { branches: ['申', '子', '辰'], element: '水' },
  { branches: ['寅', '午', '戌'], element: '火' },
  { branches: ['巳', '酉', '丑'], element: '金' },
  { branches: ['亥', '卯', '未'], element: '木' },
];

function branchSetMatch(group: readonly Branch[], a: Branch, b: Branch, c: Branch): boolean {
  const set = new Set([a, b, c]);
  return group.every(br => set.has(br)) && set.size === 3;
}

/** Check if three branches form a 三合 group */
export function isThreeHarmony(a: Branch, b: Branch, c: Branch): boolean {
  return THREE_HARMONIES.some(({ branches: [x, y, z] }) => branchSetMatch([x, y, z], a, b, c));
}

/** Get the resulting element of a 三合, or null */
export function getThreeHarmonyElement(a: Branch, b: Branch, c: Branch): Element | null {
  const found = THREE_HARMONIES.find(({ branches: [x, y, z] }) => branchSetMatch([x, y, z], a, b, c));
  return found?.element ?? null;
}

// ── 半合 (Half Harmonies) ───────────────────────────────────

/** 半合 — Two of three branches from a 三合 group */
export const HALF_HARMONIES: readonly { pair: [Branch, Branch]; element: Element }[] = THREE_HARMONIES.flatMap(
  ({ branches: [a, b, c], element }) => [
    { pair: [a, b] as [Branch, Branch], element },
    { pair: [a, c] as [Branch, Branch], element },
    { pair: [b, c] as [Branch, Branch], element },
  ],
);

// ── 三會 (Seasonal Unions) ──────────────────────────────────

/** 三會 — Three consecutive seasonal branches combining into an element */
export const SEASONAL_UNIONS: readonly { branches: [Branch, Branch, Branch]; element: Element }[] = [
  { branches: ['寅', '卯', '辰'], element: '木' },
  { branches: ['巳', '午', '未'], element: '火' },
  { branches: ['申', '酉', '戌'], element: '金' },
  { branches: ['亥', '子', '丑'], element: '水' },
];

/** Check if three branches form a 三會 group */
export function isSeasonalUnion(a: Branch, b: Branch, c: Branch): boolean {
  return SEASONAL_UNIONS.some(({ branches: [x, y, z] }) => branchSetMatch([x, y, z], a, b, c));
}

/** Get the resulting element of a 三會, or null */
export function getSeasonalUnionElement(a: Branch, b: Branch, c: Branch): Element | null {
  const found = SEASONAL_UNIONS.find(({ branches: [x, y, z] }) => branchSetMatch([x, y, z], a, b, c));
  return found?.element ?? null;
}

// ── 刑 (Punishment) ────────────────────────────────────────

/** 刑 — Punishment groups with type */
export const PUNISHMENT_GROUPS: readonly { branches: Branch[]; type: PunishmentType }[] = [
  { branches: ['寅', '巳', '申'], type: '無恩' },
  { branches: ['丑', '戌', '未'], type: '恃勢' },
  { branches: ['子', '卯'], type: '無禮' },
];

/** Check if two branches are in the same punishment group */
export function isPunishment(a: Branch, b: Branch): boolean {
  return PUNISHMENT_GROUPS.some(({ branches }) => branches.includes(a) && branches.includes(b) && a !== b);
}

/** Get the punishment type for two branches, or null */
export function getPunishmentType(a: Branch, b: Branch): PunishmentType | null {
  const found = PUNISHMENT_GROUPS.find(({ branches }) => branches.includes(a) && branches.includes(b) && a !== b);
  return found?.type ?? null;
}

// ── 自刑 (Self-Punishment) ──────────────────────────────────

/** 自刑 — Branches that punish themselves */
export const SELF_PUNISHMENT: readonly Branch[] = ['辰', '午', '酉', '亥'];

/** Check if a branch has self-punishment */
export function isSelfPunishment(branch: Branch): boolean {
  return SELF_PUNISHMENT.includes(branch);
}

// ── 害 (Harm) ──────────────────────────────────────────────

/** 六害 — Harm pairs */
export const HARM_PAIRS: readonly [Branch, Branch][] = [
  ['子', '未'], ['丑', '午'], ['寅', '巳'], ['卯', '辰'], ['申', '亥'], ['酉', '戌'],
];

/** Check if two branches form a 害 pair */
export function isHarm(a: Branch, b: Branch): boolean {
  return HARM_PAIRS.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
}

// ── 破 (Destruction) ───────────────────────────────────────

/** 六破 — Destruction pairs */
export const DESTRUCTION_PAIRS: readonly [Branch, Branch][] = [
  ['子', '酉'], ['丑', '辰'], ['寅', '亥'], ['卯', '午'], ['巳', '申'], ['未', '戌'],
];

/** Check if two branches form a 破 pair */
export function isDestruction(a: Branch, b: Branch): boolean {
  return DESTRUCTION_PAIRS.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
}

// ── Day Relation ───────────────────────────────────────────

/**
 * Day branch → line branch relationship.
 * Priority: 合 > 沖 > 五行 (生/剋/比和)
 */
export function getDayRelation(dayBranch: Branch, lineBranch: Branch): DayRelation {
  if (isHarmony(dayBranch, lineBranch)) return '合';
  if (isClash(dayBranch, lineBranch)) return '沖';
  const dayEl = BRANCH_ELEMENT[dayBranch];
  const lineEl = BRANCH_ELEMENT[lineBranch];
  const rel = getElementRelation(dayEl, lineEl);
  if (rel === '生') return '生';
  if (rel === '剋') return '剋';
  return '比和';
}
