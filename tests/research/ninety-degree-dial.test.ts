import { describe, it, expect } from 'vitest';
import { toDial90 } from '../../src/research/ninety-degree-dial';

describe('toDial90', () => {
  it('maps 0° to 0°', () => {
    expect(toDial90(0)).toBeCloseTo(0);
  });

  it('maps 45° to 45°', () => {
    expect(toDial90(45)).toBeCloseTo(45);
  });

  it('maps 90° to 0°', () => {
    expect(toDial90(90)).toBeCloseTo(0);
  });

  it('maps 135° to 45°', () => {
    expect(toDial90(135)).toBeCloseTo(45);
  });

  it('maps 180° to 0°', () => {
    expect(toDial90(180)).toBeCloseTo(0);
  });

  it('maps 270° to 0°', () => {
    expect(toDial90(270)).toBeCloseTo(0);
  });

  it('maps 359.5° to 89.5°', () => {
    expect(toDial90(359.5)).toBeCloseTo(89.5);
  });

  it('normalizes negative input', () => {
    expect(toDial90(-10)).toBeCloseTo(80); // -10 → 350 → 350 % 90 = 80
  });

  it('normalizes values > 360', () => {
    expect(toDial90(400)).toBeCloseTo(40); // 400 → 40 → 40 % 90 = 40
  });
});
