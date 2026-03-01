import { describe, it, expect } from 'vitest';
import { CYCLE_ELEMENTS, getCycleElement, getCycleElementName } from '../src/cycle-elements';

describe('CYCLE_ELEMENTS', () => {
  it('covers all 60 stem-branch pairs', () => {
    expect(Object.keys(CYCLE_ELEMENTS)).toHaveLength(60);
  });

  it('each pair has element and name', () => {
    for (const entry of Object.values(CYCLE_ELEMENTS)) {
      expect(['金', '木', '水', '火', '土']).toContain(entry.element);
      expect(typeof entry.name).toBe('string');
      expect(entry.name.length).toBeGreaterThan(0);
    }
  });
});

describe('getCycleElement', () => {
  it('甲子 -> 金 (海中金)', () => {
    expect(getCycleElement('甲子')).toBe('金');
    expect(getCycleElementName('甲子')).toBe('海中金');
  });

  it('乙丑 -> 金 (海中金, same pair)', () => {
    expect(getCycleElement('乙丑')).toBe('金');
    expect(getCycleElementName('乙丑')).toBe('海中金');
  });

  it('丙寅 -> 火 (爐中火)', () => {
    expect(getCycleElement('丙寅')).toBe('火');
    expect(getCycleElementName('丙寅')).toBe('爐中火');
  });

  it('癸亥 -> 水 (大海水)', () => {
    expect(getCycleElement('癸亥')).toBe('水');
    expect(getCycleElementName('癸亥')).toBe('大海水');
  });

  it('甲午 -> 金 (沙中金)', () => {
    expect(getCycleElement('甲午')).toBe('金');
    expect(getCycleElementName('甲午')).toBe('沙中金');
  });

  it('壬戌 -> 水 (大海水)', () => {
    expect(getCycleElement('壬戌')).toBe('水');
    expect(getCycleElementName('壬戌')).toBe('大海水');
  });
});
