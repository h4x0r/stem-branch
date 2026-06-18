import { describe, it, expect } from 'vitest';
import { renderLiuRen } from '../../src/cli/render-liuren';
import { computeSixRenForDate } from '../../src/six-ren';

describe('renderLiuRen', () => {
  const date = new Date('2024-06-15T10:00:00Z');
  const chart = computeSixRenForDate(date);
  const lines = renderLiuRen(chart);
  const text = lines.join('\n');

  it('returns an array of strings', () => {
    expect(Array.isArray(lines)).toBe(true);
    expect(lines.length).toBeGreaterThan(0);
  });

  it('includes main title', () => {
    expect(text).toContain('大六壬');
  });

  it('includes three transmissions section', () => {
    expect(text).toContain('三傳');
    expect(text).toContain('初傳');
    expect(text).toContain('中傳');
    expect(text).toContain('末傳');
  });

  it('includes four lessons section', () => {
    expect(text).toContain('四課');
    expect(text).toContain('Lesson 1');
  });

  it('includes plates section', () => {
    expect(text).toContain('天地盤');
    // Should have arrow notation
    expect(text).toContain('→');
  });

  it('includes basic info', () => {
    expect(text).toContain('Day Stem');
    expect(text).toContain('Day Branch');
    expect(text).toContain('Monthly General');
    expect(text).toContain('Method');
  });
});
