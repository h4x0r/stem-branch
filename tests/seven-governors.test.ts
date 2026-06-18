import { describe, it, expect } from 'vitest';
import { getMansionForLongitude } from '../src/seven-governors/mansion-mapper';

describe('getMansionForLongitude', () => {
  it('returns a valid mansion for 0°', () => {
    const result = getMansionForLongitude(0);
    expect(result.name).toBeTruthy();
    expect(result.degree).toBeGreaterThanOrEqual(0);
    expect(result.index).toBeGreaterThanOrEqual(0);
  });

  it('normalizes negative longitude', () => {
    const result = getMansionForLongitude(-5);
    expect(result.name).toBeTruthy();
    expect(result.degree).toBeGreaterThanOrEqual(0);
  });

  it('normalizes very negative longitude', () => {
    const result = getMansionForLongitude(-180);
    // -180 → 180° after normalization
    const result180 = getMansionForLongitude(180);
    expect(result.name).toBe(result180.name);
  });

  it('handles longitude near 360°', () => {
    const result = getMansionForLongitude(359.9);
    expect(result.name).toBeTruthy();
  });

  it('handles longitude before first mansion boundary', () => {
    // Very small longitude that might be before first boundary
    const result = getMansionForLongitude(0.001);
    expect(result.name).toBeTruthy();
  });
});
