import { describe, it, expect } from 'vitest';
import { renderAlmanac } from '../../src/cli/render-almanac';
import type { DailyAlmanac } from '../../src/daily-almanac';

/** Build a minimal mock DailyAlmanac with overrides. */
function makeMock(overrides: Partial<DailyAlmanac> = {}): DailyAlmanac {
  return {
    date: new Date('2024-06-15'),
    julianDay: 2460476,
    lunar: { year: 2024, month: 5, day: 10, isLeapMonth: false },
    pillars: {} as DailyAlmanac['pillars'],
    solarTerm: {
      current: { name: '芒種', date: new Date('2024-06-05') },
      next: { name: '夏至', date: new Date('2024-06-21') },
    },
    chineseZodiac: { animal: 'Dragon', branch: '辰' } as DailyAlmanac['chineseZodiac'],
    westernZodiac: { sign: 'Gemini', symbol: '♊' } as DailyAlmanac['westernZodiac'],
    dayFitness: { fitness: '滿' as DailyAlmanac['dayFitness']['fitness'], auspicious: true },
    flyingStars: {
      year:  { number: 3, color: '碧' } as DailyAlmanac['flyingStars']['year'],
      month: { number: 7, color: '赤' } as DailyAlmanac['flyingStars']['month'],
      day:   { number: 1, color: '白' } as DailyAlmanac['flyingStars']['day'],
      hour:  { number: 5, color: '黃' } as DailyAlmanac['flyingStars']['hour'],
    },
    almanacFlags: [],
    sixRen: {} as DailyAlmanac['sixRen'],
    isEclipseDay: false,
    nearestEclipse: { type: 'solar', date: new Date('2024-10-02') } as DailyAlmanac['nearestEclipse'],
    dayElement: '火' as DailyAlmanac['dayElement'],
    dayStrength: '旺' as DailyAlmanac['dayStrength'],
    ...overrides,
  } as DailyAlmanac;
}

describe('renderAlmanac', () => {
  it('renders non-leap month (isLeapMonth: false → no 閏 suffix)', () => {
    const lines = renderAlmanac(makeMock({ lunar: { year: 2024, month: 5, day: 10, isLeapMonth: false } }));
    const text = lines.join('\n');
    expect(text).toContain('5月10日');
    expect(text).not.toContain('(閏)');
  });

  it('renders leap month (isLeapMonth: true → shows 閏)', () => {
    const lines = renderAlmanac(makeMock({ lunar: { year: 2024, month: 4, day: 1, isLeapMonth: true } }));
    const text = lines.join('\n');
    expect(text).toContain('4月1日');
    expect(text).toContain('(閏)');
  });

  it('renders current solar term when present', () => {
    const lines = renderAlmanac(makeMock());
    const text = lines.join('\n');
    expect(text).toContain('芒種');
    expect(text).not.toContain('Next:');
  });

  it('renders next solar term when current is null', () => {
    const lines = renderAlmanac(makeMock({
      solarTerm: {
        current: null,
        next: { name: '夏至', date: new Date('2024-06-21') },
      },
    }));
    const text = lines.join('\n');
    expect(text).toContain('Next: 夏至');
  });

  it('renders auspicious day (吉)', () => {
    const lines = renderAlmanac(makeMock({ dayFitness: { fitness: '滿' as DailyAlmanac['dayFitness']['fitness'], auspicious: true } }));
    const text = lines.join('\n');
    expect(text).toContain('(吉)');
  });

  it('renders non-auspicious day (凶)', () => {
    const lines = renderAlmanac(makeMock({ dayFitness: { fitness: '破' as DailyAlmanac['dayFitness']['fitness'], auspicious: false } }));
    const text = lines.join('\n');
    expect(text).toContain('(凶)');
  });

  it('renders eclipse day', () => {
    const lines = renderAlmanac(makeMock({ isEclipseDay: true }));
    const text = lines.join('\n');
    expect(text).toContain('Eclipse today!');
  });

  it('renders nearest eclipse when not eclipse day', () => {
    const lines = renderAlmanac(makeMock({ isEclipseDay: false }));
    const text = lines.join('\n');
    expect(text).toContain('Nearest:');
    expect(text).toContain('solar');
  });
});
