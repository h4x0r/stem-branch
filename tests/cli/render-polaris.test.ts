import { describe, it, expect } from 'vitest';
import { renderPolaris } from '../../src/cli/render-polaris';
import { computeZiWei } from '../../src/polaris';

describe('renderPolaris', () => {
  const chart = computeZiWei({
    year: 1990,
    month: 5,
    day: 15,
    hour: 3,
    gender: 'male',
  });
  const lines = renderPolaris(chart);
  const text = lines.join('\n');

  it('returns an array of strings', () => {
    expect(Array.isArray(lines)).toBe(true);
    expect(lines.length).toBeGreaterThan(0);
  });

  it('includes main title', () => {
    expect(text).toContain('紫微斗數');
  });

  it('includes gender label', () => {
    expect(text).toContain('乾造');
  });

  it('includes palace names', () => {
    // Some common palace names
    expect(text).toMatch(/命宮|兄弟|夫妻|子女|財帛|疾厄|遷移|交友|事業|田宅|福德|父母/);
  });

  it('includes major stars in palaces', () => {
    // At least some major stars should appear
    const majorStars = ['紫微', '天機', '太陽', '武曲', '天同', '廉貞', '天府', '太陰', '貪狼', '巨門', '天相', '天梁', '七殺', '破軍'];
    const found = majorStars.filter(s => text.includes(s));
    expect(found.length).toBeGreaterThan(0);
  });

  it('includes element pattern info', () => {
    expect(text).toMatch(/水二局|木三局|金四局|土五局|火六局/);
  });

  it('renders female chart correctly', () => {
    const femaleChart = computeZiWei({
      year: 1990, month: 5, day: 15,
      hour: 3, gender: 'female',
    });
    const femaleText = renderPolaris(femaleChart).join('\n');
    expect(femaleText).toContain('坤造');
  });
});
