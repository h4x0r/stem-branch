import { describe, it, expect } from 'vitest';
import {
  isWetEarth, isDryEarth, getEarthType, getStorageElement,
  EARTH_BRANCHES, STORAGE_MAP,
} from '../src/earth-types';

describe('earth types', () => {
  it('辰丑 are wet earth', () => {
    expect(isWetEarth('辰')).toBe(true);
    expect(isWetEarth('丑')).toBe(true);
    expect(isDryEarth('辰')).toBe(false);
    expect(isDryEarth('丑')).toBe(false);
  });

  it('戌未 are dry earth', () => {
    expect(isDryEarth('戌')).toBe(true);
    expect(isDryEarth('未')).toBe(true);
    expect(isWetEarth('戌')).toBe(false);
    expect(isWetEarth('未')).toBe(false);
  });

  it('non-earth branches return false', () => {
    expect(isWetEarth('子')).toBe(false);
    expect(isDryEarth('午')).toBe(false);
    expect(isWetEarth('寅')).toBe(false);
  });

  it('getEarthType returns correct type', () => {
    expect(getEarthType('辰')).toBe('濕');
    expect(getEarthType('丑')).toBe('濕');
    expect(getEarthType('戌')).toBe('燥');
    expect(getEarthType('未')).toBe('燥');
    expect(getEarthType('子')).toBeNull();
  });
});

describe('EARTH_BRANCHES', () => {
  it('lists the 4 earth branches', () => {
    expect(EARTH_BRANCHES).toHaveLength(4);
    expect(EARTH_BRANCHES).toContain('辰');
    expect(EARTH_BRANCHES).toContain('丑');
    expect(EARTH_BRANCHES).toContain('戌');
    expect(EARTH_BRANCHES).toContain('未');
  });
});

describe('element storage (庫/墓)', () => {
  it('辰 stores 水', () => {
    expect(getStorageElement('辰')).toBe('水');
  });

  it('戌 stores 火', () => {
    expect(getStorageElement('戌')).toBe('火');
  });

  it('丑 stores 金', () => {
    expect(getStorageElement('丑')).toBe('金');
  });

  it('未 stores 木', () => {
    expect(getStorageElement('未')).toBe('木');
  });

  it('non-storage branch returns null', () => {
    expect(getStorageElement('子')).toBeNull();
    expect(getStorageElement('午')).toBeNull();
  });
});
