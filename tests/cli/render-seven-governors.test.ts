import { describe, it, expect } from 'vitest';
import { renderSevenGovernors } from '../../src/cli/render-seven-governors';
import { getSevenGovernorsChart } from '../../src/seven-governors';
import type { SevenGovernorsChart } from '../../src/seven-governors';

describe('renderSevenGovernors', () => {
  const date = new Date('2024-06-15T14:30:00Z');
  const chart = getSevenGovernorsChart(date, { lat: 25.03, lon: 121.56 });
  const lines = renderSevenGovernors(chart);
  const text = lines.join('\n');

  it('returns an array of strings', () => {
    expect(Array.isArray(lines)).toBe(true);
    expect(lines.length).toBeGreaterThan(0);
  });

  it('includes main title', () => {
    expect(text).toContain('七政四餘');
  });

  it('includes ascendant info', () => {
    expect(text).toContain('Ascendant');
  });

  it('includes body positions with mansions', () => {
    expect(text).toContain('Mansion');
    expect(text).toContain('Degree');
    expect(text).toContain('Palace');
    expect(text).toContain('Dignity');
  });

  it('includes Chinese body names', () => {
    expect(text).toContain('日 Sun');
    expect(text).toContain('月 Moon');
  });

  it('includes aspects section when present', () => {
    if (chart.aspects.length > 0) {
      expect(text).toContain('Aspects');
    }
  });

  it('includes star spirits section when present', () => {
    if (chart.starSpirits.length > 0) {
      expect(text).toContain('Star Spirits');
      expect(text).toContain('神煞');
    }
  });
});

describe('renderSevenGovernors — star spirits rendering', () => {
  it('renders Star Spirits section when chart has star spirits', () => {
    // Use a real chart and inject star spirits to guarantee the rendering branch
    const date = new Date('2024-06-15T14:30:00Z');
    const baseChart = getSevenGovernorsChart(date, { lat: 25.03, lon: 121.56 });
    const chartWithSpirits: SevenGovernorsChart = {
      ...baseChart,
      starSpirits: [
        { name: '天德 Tiande', type: 'auspicious', condition: 'Moon in palace of month virtue', source: 'classical' },
        { name: '天刑 Tianxing', type: 'malefic', condition: 'Mars in fire palace', source: 'classical' },
      ],
    };
    const text = renderSevenGovernors(chartWithSpirits).join('\n');
    expect(text).toContain('Star Spirits');
    expect(text).toContain('神煞');
    expect(text).toContain('天德 Tiande');
    expect(text).toContain('auspicious');
    expect(text).toContain('天刑 Tianxing');
    expect(text).toContain('malefic');
  });
});
