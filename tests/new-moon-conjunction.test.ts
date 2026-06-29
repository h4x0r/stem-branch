/**
 * The new moon (朔) must be the exact Sun–Moon apparent-longitude conjunction
 * (定朔), computed from the ELP/MPP02 Moon and VSOP87D + DE441 Sun we already
 * ship — not just the Meeus Ch.49 estimate (~1 minute, ~0.0013° of elongation).
 */
import { describe, it, expect } from 'vitest';
import { newMoonJDE } from '../src/new-moon';
import { solarEclipticState } from '../src/solar-longitude';
import { moonApparentLongitude } from '../src/moon/moon';

describe('new moon is a true Sun–Moon conjunction (定朔)', () => {
  it('elongation at newMoonJDE(k) is sub-arcsecond', () => {
    for (const k of [-100, -12, 0, 12, 100]) {
      const jde = newMoonJDE(k);
      const sun = solarEclipticState(jde).apparentLongitudeDegrees;
      const moon = moonApparentLongitude(jde);
      let d = (moon - sun) % 360;
      if (d > 180) d -= 360;
      else if (d < -180) d += 360;
      expect(Math.abs(d)).toBeLessThan(1e-6);
    }
  });
});
