import { describe, it, expect } from 'vitest';
import { renderLuck } from '../../src/cli/render-luck';
import type { MajorLuckResult, MinorLuckYear } from '../../src/luck-pillars';

describe('renderLuck', () => {
  const majorLuck: MajorLuckResult = {
    direction: 'forward',
    startAge: 5,
    periods: [
      { pillar: { stem: '丁', branch: '巳', stemBranch: '丁巳' }, startAge: 5, endAge: 14 },
      { pillar: { stem: '戊', branch: '午', stemBranch: '戊午' }, startAge: 15, endAge: 24 },
      { pillar: { stem: '己', branch: '未', stemBranch: '己未' }, startAge: 25, endAge: 34 },
    ],
  };

  const minorLuck: MinorLuckYear[] = [
    { age: 1, pillar: { stem: '甲', branch: '子', stemBranch: '甲子' } },
    { age: 2, pillar: { stem: '乙', branch: '丑', stemBranch: '乙丑' } },
    { age: 3, pillar: { stem: '丙', branch: '寅', stemBranch: '丙寅' } },
    { age: 4, pillar: { stem: '丁', branch: '卯', stemBranch: '丁卯' } },
  ];

  const lines = renderLuck(majorLuck, minorLuck);
  const text = lines.join('\n');

  it('returns an array of strings', () => {
    expect(Array.isArray(lines)).toBe(true);
    expect(lines.length).toBeGreaterThan(0);
  });

  it('includes a title with 大運', () => {
    expect(text).toContain('大運');
    expect(text).toContain('Luck Periods');
  });

  it('shows the direction', () => {
    expect(text).toContain('順行');
  });

  it('shows backward direction when applicable', () => {
    const backward: MajorLuckResult = { ...majorLuck, direction: 'backward' };
    const backText = renderLuck(backward, minorLuck).join('\n');
    expect(backText).toContain('逆行');
  });

  it('shows starting age', () => {
    expect(text).toContain('5');
  });

  it('renders major luck period pillars', () => {
    expect(text).toContain('丁巳');
    expect(text).toContain('戊午');
    expect(text).toContain('己未');
  });

  it('renders age ranges for major luck', () => {
    expect(text).toContain('5–14');
    expect(text).toContain('15–24');
    expect(text).toContain('25–34');
  });

  it('includes minor luck section', () => {
    expect(text).toContain('小運');
    expect(text).toContain('Minor Luck');
  });

  it('renders minor luck year pillars', () => {
    expect(text).toContain('甲子');
    expect(text).toContain('乙丑');
    expect(text).toContain('丙寅');
    expect(text).toContain('丁卯');
  });

  it('renders minor luck ages', () => {
    // Ages should appear in the minor luck table
    expect(text).toMatch(/1\s+甲子/);
    expect(text).toMatch(/4\s+丁卯/);
  });

  it('handles empty minor luck gracefully', () => {
    const noMinor = renderLuck(majorLuck, []);
    const noMinorText = noMinor.join('\n');
    expect(noMinorText).toContain('大運');
    expect(noMinorText).not.toContain('小運');
  });
});
