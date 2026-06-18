import { describe, it, expect } from 'vitest';
import { renderFlyingStars } from '../../src/cli/render-flying-stars';
import { getFlyingStars, FLYING_STARS } from '../../src/flying-stars';

describe('renderFlyingStars', () => {
  const date = new Date('2024-06-15T10:00:00Z');
  const starNums = getFlyingStars(date);
  const stars = {
    year: FLYING_STARS[starNums.year - 1],
    month: FLYING_STARS[starNums.month - 1],
    day: FLYING_STARS[starNums.day - 1],
    hour: FLYING_STARS[starNums.hour - 1],
  };
  const lines = renderFlyingStars(stars);
  const text = lines.join('\n');

  it('returns an array of strings', () => {
    expect(Array.isArray(lines)).toBe(true);
    expect(lines.length).toBeGreaterThan(0);
  });

  it('includes main title', () => {
    expect(text).toContain('紫白飛星');
  });

  it('includes all four time periods', () => {
    expect(text).toContain('Year (年)');
    expect(text).toContain('Month (月)');
    expect(text).toContain('Day (日)');
    expect(text).toContain('Hour (時)');
  });

  it('includes star names in Chinese', () => {
    // At least some of the star names should appear
    const starNames = ['一白', '二黑', '三碧', '四綠', '五黃', '六白', '七赤', '八白', '九紫'];
    const found = starNames.filter(n => text.includes(n));
    expect(found.length).toBeGreaterThan(0);
  });

  it('includes element info in grid headers', () => {
    // Each grid header includes element in parens
    expect(text).toMatch(/\(水|木|火|土|金\)/);
  });
});
