/**
 * ΔT-boundary handling: (1) a `boundaryUncertain` flag when the deciding new moon
 * is within the ΔT-prediction uncertainty of Beijing midnight, and (2) a
 * pluggable ΔT provider so a caller can match an authority (e.g. HKO) or any
 * standard model. See docs/validation.md "ΔT limit".
 */
import { describe, it, expect } from 'vitest';
import { gregorianToLunisolar } from '../src/lunisolar-calendar';

/** Espenak–Meeus long-term parabola — a standard, higher future ΔT than ours. */
const parabola = (year: number): number => {
  const u = (year - 1820) / 100;
  return -20 + 32 * u * u;
};

describe('ΔT boundary handling', () => {
  it('flags far-future near-midnight boundaries; firm for ΔT-observed years', () => {
    // 2057's 9th-month new moon is 29 s from Beijing midnight.
    expect(gregorianToLunisolar(new Date(2057, 9, 1)).boundaryUncertain).toBe(true);
    for (const [y, m, d] of [
      [2013, 6, 15],
      [2018, 2, 16],
      [2023, 3, 22],
    ]) {
      expect(gregorianToLunisolar(new Date(y, m - 1, d)).boundaryUncertain).toBe(false);
    }
  });

  it('pluggable ΔT shifts the 2057 near-midnight date', () => {
    const def = gregorianToLunisolar(new Date(2057, 8, 28));
    const alt = gregorianToLunisolar(new Date(2057, 8, 28), { deltaT: parabola });
    expect([alt.month, alt.day]).not.toEqual([def.month, def.day]);
  });
});
