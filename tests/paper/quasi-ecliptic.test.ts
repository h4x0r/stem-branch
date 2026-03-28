import { describe, it, expect } from 'vitest';
import {
  raToEclipticOnEcliptic,
  quasiEclipticBoundaries,
  quasiEclipticHouse,
  quasiEclipticWidths,
} from '../../src/paper/quasi-ecliptic';

// Mean obliquity circa 1400 CE (Ming dynasty) ≈ 23.5°
const OBLIQUITY_RAD = 23.5 * Math.PI / 180;

describe('quasi-ecliptic coordinate system (似黃道)', () => {
  describe('raToEclipticOnEcliptic', () => {
    it('maps 0° RA to 0° ecliptic (vernal equinox)', () => {
      expect(raToEclipticOnEcliptic(0, OBLIQUITY_RAD)).toBeCloseTo(0, 5);
    });

    it('maps 90° RA to 90° ecliptic (summer solstice)', () => {
      expect(raToEclipticOnEcliptic(90, OBLIQUITY_RAD)).toBeCloseTo(90, 5);
    });

    it('maps 180° RA to 180° ecliptic (autumnal equinox)', () => {
      expect(raToEclipticOnEcliptic(180, OBLIQUITY_RAD)).toBeCloseTo(180, 5);
    });

    it('maps 270° RA to 270° ecliptic (winter solstice)', () => {
      expect(raToEclipticOnEcliptic(270, OBLIQUITY_RAD)).toBeCloseTo(270, 5);
    });

    it('maps 30° RA to ~32.2° ecliptic (obliquity stretching)', () => {
      const result = raToEclipticOnEcliptic(30, OBLIQUITY_RAD);
      expect(result).toBeGreaterThan(30);
      expect(result).toBeLessThan(35);
    });

    it('maps 60° RA to ~62° ecliptic', () => {
      const result = raToEclipticOnEcliptic(60, OBLIQUITY_RAD);
      expect(result).toBeGreaterThan(60);
      expect(result).toBeLessThan(65);
    });
  });

  describe('quasiEclipticBoundaries', () => {
    it('produces 12 boundaries', () => {
      const b = quasiEclipticBoundaries(OBLIQUITY_RAD);
      expect(b).toHaveLength(12);
    });

    it('first boundary is 0° (vernal equinox)', () => {
      const b = quasiEclipticBoundaries(OBLIQUITY_RAD);
      expect(b[0]).toBeCloseTo(0, 5);
    });

    it('boundaries are monotonically increasing', () => {
      const b = quasiEclipticBoundaries(OBLIQUITY_RAD);
      for (let i = 1; i < b.length; i++) {
        expect(b[i]).toBeGreaterThan(b[i - 1]);
      }
    });

    it('boundaries are NOT equal 30° divisions (effect of obliquity)', () => {
      const b = quasiEclipticBoundaries(OBLIQUITY_RAD);
      const widths = b.map((_, i) =>
        i < 11 ? b[i + 1] - b[i] : 360 - b[i] + b[0]
      );
      const minWidth = Math.min(...widths);
      const maxWidth = Math.max(...widths);
      expect(maxWidth - minWidth).toBeGreaterThan(2);
      expect(maxWidth - minWidth).toBeLessThan(8);
    });
  });

  describe('quasiEclipticWidths', () => {
    it('widths sum to 360°', () => {
      const widths = quasiEclipticWidths(OBLIQUITY_RAD);
      const sum = widths.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(360, 5);
    });

    it('widths near solstices are narrower than near equinoxes', () => {
      const widths = quasiEclipticWidths(OBLIQUITY_RAD);
      // Houses 1 (0°) and 7 (180°) are near equinoxes — wider
      // Houses 4 (90°) and 10 (270°) are near solstices — narrower
      expect(widths[0]).toBeGreaterThan(widths[2]);
    });
  });

  describe('quasiEclipticHouse', () => {
    it('assigns 0° ecliptic to house 1', () => {
      const b = quasiEclipticBoundaries(OBLIQUITY_RAD);
      expect(quasiEclipticHouse(0, b)).toBe(1);
    });

    it('assigns 31° ecliptic to house 1 (quasi-ecliptic boundary is ~32°)', () => {
      const b = quasiEclipticBoundaries(OBLIQUITY_RAD);
      expect(quasiEclipticHouse(31, b)).toBe(1);
    });

    it('assigns 33° ecliptic to house 2', () => {
      const b = quasiEclipticBoundaries(OBLIQUITY_RAD);
      expect(quasiEclipticHouse(33, b)).toBe(2);
    });

    it('wraps 359° to house 12', () => {
      const b = quasiEclipticBoundaries(OBLIQUITY_RAD);
      expect(quasiEclipticHouse(359, b)).toBe(12);
    });
  });
});
