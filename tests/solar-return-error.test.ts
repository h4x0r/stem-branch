import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/solar-longitude', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/solar-longitude')>();
  return {
    ...actual,
    findSunLongitudeMoment: () => null,
  };
});

describe('computeSolarReturn — error when no return found', () => {
  it('throws when findSunLongitudeMoment returns null', async () => {
    const { computeSolarReturn } = await import('../src/solar-return');
    const birth = new Date('1990-06-15T12:00:00Z');
    expect(() => computeSolarReturn(birth, 25, 121, 2024)).toThrow('Could not find solar return');
  });
});
