import { describe, it, expect } from 'vitest';
import { renderSolarReturn } from '../../src/cli/render-solar-return';
import { computeSolarReturn } from '../../src/solar-return';

describe('renderSolarReturn', () => {
  const birthDate = new Date('2024-06-15T14:30:00Z');
  const sr = computeSolarReturn(birthDate, 25, 121, 2025);
  const lines = renderSolarReturn(sr);
  const text = lines.join('\n');

  it('returns an array of strings', () => {
    expect(Array.isArray(lines)).toBe(true);
    expect(lines.length).toBeGreaterThan(0);
  });

  it('includes a title', () => {
    expect(text).toContain('Solar Return');
    expect(text).toContain('2025');
  });

  it('shows the return date', () => {
    expect(text).toContain('Return Date');
  });

  it('shows natal Sun longitude', () => {
    expect(text).toContain('Natal Sun');
  });

  it('shows planetary positions', () => {
    expect(text).toContain('Sun');
    expect(text).toContain('Moon');
  });

  it('shows angles', () => {
    expect(text).toContain('ASC');
    expect(text).toContain('MC');
  });

  it('shows house cusps', () => {
    expect(text).toContain('House Cusps');
  });
});
