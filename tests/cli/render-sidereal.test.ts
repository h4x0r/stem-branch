import { describe, it, expect } from 'vitest';
import { renderSidereal } from '../../src/cli/render-sidereal';
import { computeSiderealChart } from '../../src/sidereal-astrology';

describe('renderSidereal', () => {
  const date = new Date('2024-06-15T14:30:00Z');
  const chart = computeSiderealChart(date, 25.03, 121.56);
  const lines = renderSidereal(chart);
  const text = lines.join('\n');

  it('returns an array of strings', () => {
    expect(Array.isArray(lines)).toBe(true);
    expect(lines.length).toBeGreaterThan(0);
  });

  it('includes main title', () => {
    expect(text).toContain('Sidereal');
  });

  it('includes ayanamsa value', () => {
    expect(text).toContain('Ayanamsa');
    expect(text).toMatch(/\d+\.\d+°/);
  });

  it('includes body positions with nakshatras', () => {
    expect(text).toContain('Nakshatra');
    expect(text).toContain('Pada');
    expect(text).toContain('Sun');
  });

  it('includes Vimshottari Dashas', () => {
    expect(text).toContain('Dashas');
    expect(text).toContain('Years');
  });

  it('includes divisional charts', () => {
    expect(text).toContain('Divisional Chart');
  });
});
