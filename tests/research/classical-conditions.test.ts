import { describe, it, expect } from 'vitest';
import {
  isHayz, isHalb, isBesieged, isViaCombusta, isJoyByHouse,
} from '../../src/research/classical-conditions';

describe('isHayz', () => {
  it('Sun in day chart, above horizon, positive sign → true', () => {
    expect(isHayz('Sun', true, true, 'positive', null)).toBe(true);
  });

  it('Sun in day chart, above horizon, negative sign → false (wrong gender)', () => {
    expect(isHayz('Sun', true, true, 'negative', null)).toBe(false);
  });

  it('Sun in day chart, below horizon, positive sign → false (wrong hemisphere)', () => {
    expect(isHayz('Sun', true, false, 'positive', null)).toBe(false);
  });

  it('Sun in night chart → false (wrong sect)', () => {
    expect(isHayz('Sun', false, true, 'positive', null)).toBe(false);
  });

  it('Moon in night chart, below horizon, negative sign → true', () => {
    expect(isHayz('Moon', false, false, 'negative', null)).toBe(true);
  });

  it('Moon in night chart, above horizon → false (wrong hemisphere)', () => {
    expect(isHayz('Moon', false, true, 'negative', null)).toBe(false);
  });

  it('Mars (nocturnal) in night chart, below horizon, negative sign → true', () => {
    expect(isHayz('Mars', false, false, 'negative', null)).toBe(true);
  });

  it('Mercury oriental in day chart, above horizon, positive sign → true', () => {
    expect(isHayz('Mercury', true, true, 'positive', true)).toBe(true);
  });

  it('Mercury occidental in night chart, below horizon, negative sign → true', () => {
    expect(isHayz('Mercury', false, false, 'negative', false)).toBe(true);
  });

  it('returns false for non-traditional bodies', () => {
    expect(isHayz('Chiron', true, true, 'positive', null)).toBe(false);
    expect(isHayz('North Node', true, true, 'positive', null)).toBe(false);
  });
});

describe('isHalb', () => {
  it('Sun in day chart, below horizon, positive sign → true (sect matches, hemisphere wrong)', () => {
    expect(isHalb('Sun', true, false, 'positive', null)).toBe(true);
  });

  it('Sun in day chart, above horizon, negative sign → true (sect matches, gender wrong)', () => {
    expect(isHalb('Sun', true, true, 'negative', null)).toBe(true);
  });

  it('Sun in full Hayz → false (Halb is lesser condition)', () => {
    expect(isHalb('Sun', true, true, 'positive', null)).toBe(false);
  });

  it('Sun in night chart → false (wrong sect entirely)', () => {
    expect(isHalb('Sun', false, false, 'positive', null)).toBe(false);
  });

  it('Moon in night chart, above horizon, negative sign → true (hemisphere wrong)', () => {
    expect(isHalb('Moon', false, true, 'negative', null)).toBe(true);
  });
});

describe('isBesieged', () => {
  const positions = [
    { body: 'Mars', longitude: 10 },
    { body: 'Saturn', longitude: 30 },
    { body: 'Venus', longitude: 100 },
    { body: 'Jupiter', longitude: 200 },
  ];

  it('body between Mars and Saturn with no benefic → besieged', () => {
    expect(isBesieged('Mercury', 20, positions)).toBe(true);
  });

  it('malefic body cannot be besieged', () => {
    expect(isBesieged('Mars', 20, positions)).toBe(false);
    expect(isBesieged('Saturn', 20, positions)).toBe(false);
  });

  it('body between malefic and benefic → not besieged', () => {
    // Sun at 15°: between Mars(10) and Saturn(30), no benefic between → besieged
    // Sun at 50°: nearest before = Saturn(30), nearest after = Mars(10+360=370→10)
    // but Venus at 100 is between 50 and the next malefic going forward... complex
    // Simpler: put a benefic between the malefics
    const withBenefic = [
      { body: 'Mars', longitude: 10 },
      { body: 'Venus', longitude: 20 },  // benefic between malefics
      { body: 'Saturn', longitude: 30 },
      { body: 'Jupiter', longitude: 200 },
    ];
    expect(isBesieged('Mercury', 15, withBenefic)).toBe(false);
  });

  it('returns false when fewer than 2 malefics', () => {
    const onlyMars = [
      { body: 'Mars', longitude: 10 },
      { body: 'Venus', longitude: 100 },
    ];
    expect(isBesieged('Mercury', 50, onlyMars)).toBe(false);
  });
});

describe('isViaCombusta', () => {
  it('Moon at 200° (Libra 20°) → true', () => {
    expect(isViaCombusta('Moon', 200)).toBe(true);
  });

  it('Moon at 195° (Libra 15°) → true (start of range)', () => {
    expect(isViaCombusta('Moon', 195)).toBe(true);
  });

  it('Moon at 224.9° → true (just before end)', () => {
    expect(isViaCombusta('Moon', 224.9)).toBe(true);
  });

  it('Moon at 225° (Scorpio 15°) → false (exclusive end)', () => {
    expect(isViaCombusta('Moon', 225)).toBe(false);
  });

  it('Moon at 194° → false (before range)', () => {
    expect(isViaCombusta('Moon', 194)).toBe(false);
  });

  it('non-Moon body → always false', () => {
    expect(isViaCombusta('Sun', 200)).toBe(false);
    expect(isViaCombusta('Mars', 210)).toBe(false);
  });
});

describe('isJoyByHouse', () => {
  it('Mercury in house 1 → true', () => {
    expect(isJoyByHouse('Mercury', 1)).toBe(true);
  });

  it('Moon in house 3 → true', () => {
    expect(isJoyByHouse('Moon', 3)).toBe(true);
  });

  it('Venus in house 5 → true', () => {
    expect(isJoyByHouse('Venus', 5)).toBe(true);
  });

  it('Mars in house 6 → true', () => {
    expect(isJoyByHouse('Mars', 6)).toBe(true);
  });

  it('Sun in house 9 → true', () => {
    expect(isJoyByHouse('Sun', 9)).toBe(true);
  });

  it('Jupiter in house 11 → true', () => {
    expect(isJoyByHouse('Jupiter', 11)).toBe(true);
  });

  it('Saturn in house 12 → true', () => {
    expect(isJoyByHouse('Saturn', 12)).toBe(true);
  });

  it('wrong house → false', () => {
    expect(isJoyByHouse('Sun', 1)).toBe(false);
    expect(isJoyByHouse('Mars', 1)).toBe(false);
  });

  it('non-traditional body → false', () => {
    expect(isJoyByHouse('Chiron', 1)).toBe(false);
  });
});
