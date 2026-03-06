import { describe, it, expect } from 'vitest';
import {
  getMonthlyVirtue, getHeavenlyVirtue,
  getMonthlyVirtueCombo, getHeavenlyVirtueCombo,
} from '../src/virtue-stars';
import type { Branch } from '../src/types';

// ── 月德 (Monthly Virtue) ──────────────────────────────────────

describe('getMonthlyVirtue', () => {
  // Three-harmony groups share the same 月德:
  // 寅午戌 → 丙 (fire), 亥卯未 → 甲 (wood), 申子辰 → 壬 (water), 巳酉丑 → 庚 (metal)
  const cases: [Branch, string][] = [
    ['寅', '丙'], ['午', '丙'], ['戌', '丙'],
    ['亥', '甲'], ['卯', '甲'], ['未', '甲'],
    ['申', '壬'], ['子', '壬'], ['辰', '壬'],
    ['巳', '庚'], ['酉', '庚'], ['丑', '庚'],
  ];

  it.each(cases)('month %s → 月德 %s', (branch, expected) => {
    expect(getMonthlyVirtue(branch)).toBe(expected);
  });

  it('should return the yang stem of the three-harmony element', () => {
    expect(getMonthlyVirtue('寅')).toBe('丙');  // fire frame → yang fire
    expect(getMonthlyVirtue('子')).toBe('壬');  // water frame → yang water
  });
});

// ── 天德 (Heavenly Virtue) ─────────────────────────────────────

describe('getHeavenlyVirtue', () => {
  const cases: [Branch, string][] = [
    ['寅', '丁'], ['卯', '申'], ['辰', '壬'], ['巳', '辛'],
    ['午', '亥'], ['未', '甲'], ['申', '癸'], ['酉', '寅'],
    ['戌', '丙'], ['亥', '乙'], ['子', '巳'], ['丑', '庚'],
  ];

  it.each(cases)('month %s → 天德 %s', (branch, expected) => {
    expect(getHeavenlyVirtue(branch)).toBe(expected);
  });

  it('天德 can be a stem or a branch', () => {
    expect(getHeavenlyVirtue('寅')).toBe('丁'); // stem
    expect(getHeavenlyVirtue('卯')).toBe('申'); // branch
  });
});

// ── 月德合 (Monthly Virtue Combo) ──────────────────────────────

describe('getMonthlyVirtueCombo', () => {
  // 五合 partner of 月德: 丙→辛, 甲→己, 壬→丁, 庚→乙
  const cases: [Branch, string][] = [
    ['寅', '辛'], ['午', '辛'], ['戌', '辛'],
    ['亥', '己'], ['卯', '己'], ['未', '己'],
    ['申', '丁'], ['子', '丁'], ['辰', '丁'],
    ['巳', '乙'], ['酉', '乙'], ['丑', '乙'],
  ];

  it.each(cases)('month %s → 月德合 %s', (branch, expected) => {
    expect(getMonthlyVirtueCombo(branch)).toBe(expected);
  });
});

// ── 天德合 (Heavenly Virtue Combo) ─────────────────────────────

describe('getHeavenlyVirtueCombo', () => {
  // stem天德 → 五合 partner, branch天德 → 六合 partner
  const cases: [Branch, string][] = [
    ['寅', '壬'],  // 丁→壬
    ['卯', '巳'],  // 申→巳
    ['辰', '丁'],  // 壬→丁
    ['巳', '丙'],  // 辛→丙
    ['午', '寅'],  // 亥→寅
    ['未', '己'],  // 甲→己
    ['申', '戊'],  // 癸→戊
    ['酉', '亥'],  // 寅→亥
    ['戌', '辛'],  // 丙→辛
    ['亥', '庚'],  // 乙→庚
    ['子', '申'],  // 巳→申
    ['丑', '乙'],  // 庚→乙
  ];

  it.each(cases)('month %s → 天德合 %s', (branch, expected) => {
    expect(getHeavenlyVirtueCombo(branch)).toBe(expected);
  });
});
