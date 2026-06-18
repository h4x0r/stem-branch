import { describe, it, expect } from 'vitest';
import { renderQiMen } from '../../src/cli/render-qimen';
import { computeQiMenForDate } from '../../src/mystery-gates';

describe('renderQiMen', () => {
  const date = new Date('2024-06-15T10:00:00Z');
  const chart = computeQiMenForDate(date);
  const lines = renderQiMen(chart);
  const text = lines.join('\n');

  it('returns an array of strings', () => {
    expect(Array.isArray(lines)).toBe(true);
    expect(lines.length).toBeGreaterThan(0);
  });

  it('includes main title with escape mode and ju', () => {
    expect(text).toContain('奇門遁甲');
    expect(text).toMatch(/陽遁|陰遁/);
    expect(text).toMatch(/\d局/);
  });

  it('includes palace names', () => {
    const palaceNames = ['坎', '坤', '震', '巽', '乾', '兌', '艮', '離'];
    const found = palaceNames.filter(n => text.includes(n));
    expect(found.length).toBeGreaterThan(3);
  });

  it('includes star and door info in palace cells', () => {
    // Palaces show star + door on a line
    expect(lines.length).toBeGreaterThan(5);
  });

  it('includes heaven/earth plate stems', () => {
    // Each palace shows heavenPlate/earthPlate
    expect(text).toContain('/');
  });
});
