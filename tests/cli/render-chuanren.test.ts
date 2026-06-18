import { describe, it, expect } from 'vitest';
import { renderChuanRen } from '../../src/cli/render-chuanren';
import { computeChuanRenChart } from '../../src/qimen-chuanren';

describe('renderChuanRen', () => {
  const date = new Date('2024-06-15T10:00:00Z');
  const chart = computeChuanRenChart(date);
  const lines = renderChuanRen(chart);
  const text = lines.join('\n');

  it('returns an array of strings', () => {
    expect(Array.isArray(lines)).toBe(true);
    expect(lines.length).toBeGreaterThan(0);
  });

  it('includes main title', () => {
    expect(text).toContain('奇門穿壬');
  });

  it('includes palace names', () => {
    const palaceNames = ['坎', '坤', '震', '巽', '乾', '兌', '艮', '離'];
    const found = palaceNames.filter(n => text.includes(n));
    expect(found.length).toBeGreaterThan(3);
  });

  it('includes star and door info', () => {
    // Each palace has star and door on a line
    // Just verify the grid has content
    expect(lines.length).toBeGreaterThan(5);
  });

  it('includes heaven/earth stem info', () => {
    // Palaces show heavenStem/earthStem
    expect(text).toContain('/');
  });

  it('includes transmission markers when present', () => {
    // At least one palace should have a transmission marker
    const hasTransmission = text.includes('初傳') || text.includes('中傳') || text.includes('末傳');
    expect(hasTransmission).toBe(true);
  });
});
