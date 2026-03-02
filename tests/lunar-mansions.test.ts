import { describe, it, expect } from 'vitest';
import { getLunarMansion, getLunarMansionForDate, LUNAR_MANSIONS } from '../src/lunar-mansions';

describe('LUNAR_MANSIONS', () => {
  it('should have 28 entries', () => {
    expect(LUNAR_MANSIONS).toHaveLength(28);
  });

  it('should start with 角 and end with 軫', () => {
    expect(LUNAR_MANSIONS[0].name).toBe('角');
    expect(LUNAR_MANSIONS[27].name).toBe('軫');
  });

  it('should have animal, element, and group for each mansion', () => {
    for (const m of LUNAR_MANSIONS) {
      expect(m.name).toBeTruthy();
      expect(m.animal).toBeTruthy();
      expect(['日', '月', '金', '木', '水', '火', '土']).toContain(m.element);
      expect(['東方青龍', '北方玄武', '西方白虎', '南方朱雀']).toContain(m.group);
    }
  });
});

describe('getLunarMansion', () => {
  it('should return a mansion for a Julian Day Number', () => {
    // JD 2460476 = 2024-06-15
    const result = getLunarMansion(2460476);
    expect(result.name).toBeTruthy();
    expect(result.animal).toBeTruthy();
  });

  it('should cycle through 28 mansions over 28 consecutive days', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 28; i++) {
      seen.add(getLunarMansion(2460476 + i).name);
    }
    expect(seen.size).toBe(28);
  });

  it('should repeat after 28 days', () => {
    const a = getLunarMansion(2460476);
    const b = getLunarMansion(2460476 + 28);
    expect(a.name).toBe(b.name);
  });
});

describe('getLunarMansionForDate', () => {
  it('should return a mansion for a date', () => {
    const result = getLunarMansionForDate(new Date(Date.UTC(2024, 5, 15)));
    expect(result.name).toBeTruthy();
    expect(result.animal).toBeTruthy();
    expect(result.element).toBeTruthy();
    expect(result.group).toBeTruthy();
  });
});
