import { describe, it, expect } from 'vitest';
import { getDutyDeity, getDutyDeityForDate, DUTY_DEITIES } from '../src/duty-deity';
import type { DayFitness } from '../src/day-fitness';

describe('DUTY_DEITIES', () => {
  it('should have 12 entries', () => {
    expect(DUTY_DEITIES).toHaveLength(12);
  });

  it('should start with 青龍', () => {
    expect(DUTY_DEITIES[0]).toBe('青龍');
  });
});

describe('getDutyDeity', () => {
  it('should return 青龍 (黃道) for 建 day', () => {
    const result = getDutyDeity('建');
    expect(result.deity).toBe('青龍');
    expect(result.path).toBe('黃道');
  });

  it('should return 明堂 (黃道) for 除 day', () => {
    const result = getDutyDeity('除');
    expect(result.deity).toBe('明堂');
    expect(result.path).toBe('黃道');
  });

  it('should return 天刑 (黑道) for 滿 day', () => {
    const result = getDutyDeity('滿');
    expect(result.deity).toBe('天刑');
    expect(result.path).toBe('黑道');
  });

  it('should return 白虎 (黑道) for 破 day', () => {
    const result = getDutyDeity('破');
    expect(result.deity).toBe('白虎');
    expect(result.path).toBe('黑道');
  });

  it('should return 勾陳 (黑道) for 閉 day', () => {
    const result = getDutyDeity('閉');
    expect(result.deity).toBe('勾陳');
    expect(result.path).toBe('黑道');
  });

  it('should classify exactly 6 黃道 and 6 黑道', () => {
    const cycle: DayFitness[] = ['建', '除', '滿', '平', '定', '執', '破', '危', '成', '收', '開', '閉'];
    const huang = cycle.filter((f) => getDutyDeity(f).path === '黃道');
    const hei = cycle.filter((f) => getDutyDeity(f).path === '黑道');
    expect(huang).toHaveLength(6);
    expect(hei).toHaveLength(6);
  });

  it('should have 黃道 for 金匱, 天德, 玉堂, 司命', () => {
    expect(getDutyDeity('定').deity).toBe('金匱');
    expect(getDutyDeity('定').path).toBe('黃道');
    expect(getDutyDeity('執').deity).toBe('天德');
    expect(getDutyDeity('執').path).toBe('黃道');
    expect(getDutyDeity('危').deity).toBe('玉堂');
    expect(getDutyDeity('危').path).toBe('黃道');
    expect(getDutyDeity('開').deity).toBe('司命');
    expect(getDutyDeity('開').path).toBe('黃道');
  });
});

describe('getDutyDeityForDate', () => {
  it('should return a duty deity result for a date', () => {
    const result = getDutyDeityForDate(new Date(Date.UTC(2024, 5, 15, 6)));
    expect(result.deity).toBeTruthy();
    expect(['黃道', '黑道']).toContain(result.path);
  });
});
