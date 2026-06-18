import { describe, it, expect } from 'vitest';
import { computeGauquelinSector, isGauquelinPlusZone } from '../../src/research/gauquelin';

describe('computeGauquelinSector', () => {
  // For DSA=100°, NSA=80°:
  // Rising at H = 360-100 = 260°
  // Q1 (sectors 1-9):  H_from_rise [0, 100) — rising to MC
  // Q2 (sectors 10-18): [100, 200) — MC to setting
  // Q3 (sectors 19-27): [200, 280) — setting to IC
  // Q4 (sectors 28-36): [280, 360) — IC to rising
  const DSA = 100;
  const NSA = 80;

  it('body just past rising → sector 1', () => {
    // H_from_rise ≈ 1° into Q1
    // H = 260 + 1 = 261°, so RAMC - RA = 261 → RA = RAMC - 261 = -261 → RA = 99
    // Let RAMC = 0, RA = 360 - 261 = 99
    const sector = computeGauquelinSector(99, 0, DSA, NSA);
    expect(sector).toBe(1);
  });

  it('body near MC → sector 9 or 10', () => {
    // At MC: H = 0, H_from_rise = DSA = 100
    // That's the boundary of Q1/Q2 → should be sector 10
    const sector = computeGauquelinSector(0, 0, DSA, NSA);
    expect(sector).toBe(10);
  });

  it('body just past MC → sector 10', () => {
    // H = 1° (just past MC going west), H_from_rise = DSA + 1 = 101
    // RAMC - RA = 1 → RA = RAMC - 1 = -1 → 359
    const sector = computeGauquelinSector(359, 0, DSA, NSA);
    expect(sector).toBe(10);
  });

  it('sectors range from 1 to 36', () => {
    // Sweep RA from 0-359 and check all sectors are in range
    for (let ra = 0; ra < 360; ra += 5) {
      const sector = computeGauquelinSector(ra, 0, DSA, NSA);
      expect(sector).toBeGreaterThanOrEqual(1);
      expect(sector).toBeLessThanOrEqual(36);
    }
  });

  it('equal semi-arcs (DSA=NSA=90) produces evenly spaced sectors', () => {
    // Q1: [0,90), Q2: [90,180), Q3: [180,270), Q4: [270,360)
    // Each sector = 10°

    // Sector 1: H_from_rise = 0-10°
    // Rising at H=270, so H_from_rise = H - 270 (mod 360)
    // RA at rising: RAMC - (360-90) = 0 - 270 = -270 → RA = 90
    // Just past rising: RA = 89 → H = 0-89 = -89 → 271 → H_from_rise = 1
    const s1 = computeGauquelinSector(89, 0, 90, 90);
    expect(s1).toBe(1);

    // MC (H=0, H_from_rise=90): sector 10
    const sMC = computeGauquelinSector(0, 0, 90, 90);
    expect(sMC).toBe(10);
  });
});

describe('isGauquelinPlusZone', () => {
  it('sectors 1-3 are plus zones', () => {
    expect(isGauquelinPlusZone(1)).toBe(true);
    expect(isGauquelinPlusZone(2)).toBe(true);
    expect(isGauquelinPlusZone(3)).toBe(true);
  });

  it('sectors 10-12 are plus zones', () => {
    expect(isGauquelinPlusZone(10)).toBe(true);
    expect(isGauquelinPlusZone(11)).toBe(true);
    expect(isGauquelinPlusZone(12)).toBe(true);
  });

  it('sector 4 is not a plus zone', () => {
    expect(isGauquelinPlusZone(4)).toBe(false);
  });

  it('sector 9 is not a plus zone', () => {
    expect(isGauquelinPlusZone(9)).toBe(false);
  });

  it('sectors 13-36 are not plus zones', () => {
    for (let s = 13; s <= 36; s++) {
      expect(isGauquelinPlusZone(s)).toBe(false);
    }
  });
});
