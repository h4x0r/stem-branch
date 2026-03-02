import { describe, it, expect } from 'vitest';
import { dailyAlmanac } from '../src/daily-almanac';
import type { DailyAlmanac } from '../src/daily-almanac';

// Fixed test date: 2024-06-15 14:30 UTC
// Known values cross-checked against sxwnl and manual calculation
const TEST_DATE = new Date(Date.UTC(2024, 5, 15, 14, 30));

describe('dailyAlmanac', () => {
  let result: DailyAlmanac;

  // Compute once, assert many — the function is deterministic
  it('should return a complete almanac for a given date', () => {
    result = dailyAlmanac(TEST_DATE);
    expect(result).toBeDefined();
  });

  // ── Structure ────────────────────────────────────────────
  it('should contain all expected top-level keys', () => {
    result = dailyAlmanac(TEST_DATE);
    const keys: (keyof DailyAlmanac)[] = [
      'date', 'julianDay',
      'lunar',
      'pillars',
      'solarTerm',
      'chineseZodiac', 'westernZodiac',
      'dayFitness',
      'flyingStars',
      'almanacFlags',
      'sixRen',
      'nearestEclipse', 'isEclipseDay',
      'dayElement', 'dayStrength',
    ];
    for (const key of keys) {
      expect(result).toHaveProperty(key);
    }
  });

  // ── Date basics ──────────────────────────────────────────
  it('should echo back the input date', () => {
    result = dailyAlmanac(TEST_DATE);
    expect(result.date).toEqual(TEST_DATE);
  });

  it('should compute a valid Julian Day number', () => {
    result = dailyAlmanac(TEST_DATE);
    // 2024-06-15 ≈ JD 2460476
    expect(result.julianDay).toBeGreaterThan(2460475);
    expect(result.julianDay).toBeLessThan(2460477);
  });

  // ── Lunar calendar ──────────────────────────────────────
  it('should return a lunar date with valid fields', () => {
    result = dailyAlmanac(TEST_DATE);
    expect(result.lunar.year).toBe(2024);
    expect(result.lunar.month).toBeGreaterThanOrEqual(1);
    expect(result.lunar.month).toBeLessThanOrEqual(12);
    expect(result.lunar.day).toBeGreaterThanOrEqual(1);
    expect(result.lunar.day).toBeLessThanOrEqual(30);
    expect(typeof result.lunar.isLeapMonth).toBe('boolean');
  });

  // ── Four Pillars ────────────────────────────────────────
  it('should return four pillars with valid stems and branches', () => {
    result = dailyAlmanac(TEST_DATE);
    const STEMS = '甲乙丙丁戊己庚辛壬癸';
    const BRANCHES = '子丑寅卯辰巳午未申酉戌亥';

    for (const pillar of ['year', 'month', 'day', 'hour'] as const) {
      expect(STEMS).toContain(result.pillars[pillar].stem);
      expect(BRANCHES).toContain(result.pillars[pillar].branch);
    }
  });

  // ── Solar terms ─────────────────────────────────────────
  it('should return current and next solar terms', () => {
    result = dailyAlmanac(TEST_DATE);
    expect(result.solarTerm.current).not.toBeNull();
    expect(result.solarTerm.current!.name).toBeTruthy();
    expect(result.solarTerm.current!.date).toBeInstanceOf(Date);
    expect(result.solarTerm.next.name).toBeTruthy();
    expect(result.solarTerm.next.date).toBeInstanceOf(Date);
    // Next must be after current
    expect(result.solarTerm.next.date.getTime())
      .toBeGreaterThan(result.solarTerm.current!.date.getTime());
  });

  // ── Zodiac ──────────────────────────────────────────────
  it('should return Chinese zodiac (龍 for 2024)', () => {
    result = dailyAlmanac(TEST_DATE);
    expect(result.chineseZodiac.animal).toBe('龍');
    expect(result.chineseZodiac.branch).toBe('辰');
  });

  it('should return Western zodiac (Gemini for June 15)', () => {
    result = dailyAlmanac(TEST_DATE);
    expect(result.westernZodiac.sign).toBe('Gemini');
  });

  // ── Day Fitness (建除) ──────────────────────────────────
  it('should return day fitness with auspicious flag', () => {
    result = dailyAlmanac(TEST_DATE);
    const CYCLE = '建除滿平定執破危成收開閉';
    expect(CYCLE).toContain(result.dayFitness.fitness);
    expect(typeof result.dayFitness.auspicious).toBe('boolean');
  });

  // ── Flying Stars (紫白九星) ──────────────────────────────
  it('should return four flying stars (year, month, day, hour)', () => {
    result = dailyAlmanac(TEST_DATE);
    for (const period of ['year', 'month', 'day', 'hour'] as const) {
      const star = result.flyingStars[period];
      expect(star.number).toBeGreaterThanOrEqual(1);
      expect(star.number).toBeLessThanOrEqual(9);
      expect(star.name).toBeTruthy();
      expect(star.element).toBeTruthy();
      expect(star.color).toBeTruthy();
    }
  });

  // ── Almanac Flags (神煞) ────────────────────────────────
  it('should return an array of almanac flags', () => {
    result = dailyAlmanac(TEST_DATE);
    expect(Array.isArray(result.almanacFlags)).toBe(true);
    // Most dates have at least one flag
    for (const flag of result.almanacFlags) {
      expect(flag.name).toBeTruthy();
      expect(flag.english).toBeTruthy();
      expect(typeof flag.auspicious).toBe('boolean');
      expect(flag.category).toBeTruthy();
      expect(Array.isArray(flag.positions)).toBe(true);
    }
  });

  // ── Six Ren (大六壬) ────────────────────────────────────
  it('should return a Six Ren chart', () => {
    result = dailyAlmanac(TEST_DATE);
    expect(result.sixRen.dayStem).toBeTruthy();
    expect(result.sixRen.dayBranch).toBeTruthy();
    expect(result.sixRen.hourBranch).toBeTruthy();
    expect(result.sixRen.method).toBeTruthy();
    expect(result.sixRen.lessons).toHaveLength(4);
    expect(result.sixRen.transmissions).toHaveProperty('initial');
    expect(result.sixRen.transmissions).toHaveProperty('middle');
    expect(result.sixRen.transmissions).toHaveProperty('final');
  });

  // ── Eclipses ────────────────────────────────────────────
  it('should find the nearest eclipse', () => {
    result = dailyAlmanac(TEST_DATE);
    expect(result.nearestEclipse).toBeDefined();
    expect(result.nearestEclipse.date).toBeInstanceOf(Date);
    expect(['solar', 'lunar']).toContain(result.nearestEclipse.kind);
  });

  it('should report eclipse day status', () => {
    result = dailyAlmanac(TEST_DATE);
    expect(typeof result.isEclipseDay).toBe('boolean');
  });

  // ── Element analysis ────────────────────────────────────
  it('should derive day element and seasonal strength', () => {
    result = dailyAlmanac(TEST_DATE);
    const ELEMENTS = '金木水火土';
    const STRENGTHS = '旺相休囚死';
    expect(ELEMENTS).toContain(result.dayElement);
    expect(STRENGTHS).toContain(result.dayStrength);
  });

  // ── Edge case: date at year boundary ────────────────────
  it('should handle a date just before 立春 (still previous year)', () => {
    // 2024-02-03 is before 立春 2024 (~Feb 4), so stem-branch year = 2023
    const beforeSpring = new Date(Date.UTC(2024, 1, 3, 12, 0));
    const r = dailyAlmanac(beforeSpring);
    expect(r.pillars).toBeDefined();
    expect(r.chineseZodiac.animal).toBe('兔'); // 2023 = 兔, not 龍
  });

  // ── Edge case: midnight hour (子時) ─────────────────────
  it('should handle 子時 (23:00) correctly', () => {
    const lateNight = new Date(Date.UTC(2024, 5, 15, 15, 0)); // 23:00 CST = 15:00 UTC
    const r = dailyAlmanac(lateNight);
    expect(r.pillars).toBeDefined();
    expect(r.sixRen).toBeDefined();
  });
});
