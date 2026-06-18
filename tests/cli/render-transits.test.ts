import { describe, it, expect } from 'vitest';
import { renderTransits } from '../../src/cli/render-transits';
import { computeTransits } from '../../src/transits';

describe('renderTransits', () => {
  const birthDate = new Date('2024-06-15T14:30:00Z');
  const transitDate = new Date('2025-03-20T12:00:00Z');
  const result = computeTransits(birthDate, 25, 121, transitDate);
  const lines = renderTransits(result);
  const text = lines.join('\n');

  it('returns an array of strings', () => {
    expect(Array.isArray(lines)).toBe(true);
    expect(lines.length).toBeGreaterThan(0);
  });

  it('includes a title', () => {
    expect(text).toContain('Transits');
  });

  it('shows the transit date', () => {
    expect(text).toContain('Transit Date');
  });

  it('shows transit positions', () => {
    expect(text).toContain('Transit Positions');
    expect(text).toContain('Sun');
    expect(text).toContain('Moon');
  });

  it('shows transit-to-natal aspects', () => {
    expect(text).toContain('Transit-to-Natal Aspects');
  });

  it('shows aspect type names', () => {
    // At least one of the major aspect types should appear
    const aspectTypes = ['conjunction', 'opposition', 'trine', 'square', 'sextile'];
    const hasAspect = aspectTypes.some(t => text.includes(t));
    expect(hasAspect).toBe(true);
  });
});
