import { describe, it, expect } from 'vitest';
import {
  STEM_COMBINATIONS, STEM_CLASHES,
  isStemCombination, isStemClash, getCombinedElement,
} from '../src/stem-relations';

describe('STEM_COMBINATIONS (天干五合)', () => {
  it('has 5 combination pairs', () => {
    expect(STEM_COMBINATIONS).toHaveLength(5);
  });

  it('甲己合化土', () => {
    expect(isStemCombination('甲', '己')).toBe(true);
    expect(isStemCombination('己', '甲')).toBe(true);
    expect(getCombinedElement('甲', '己')).toBe('土');
  });

  it('乙庚合化金', () => {
    expect(isStemCombination('乙', '庚')).toBe(true);
    expect(getCombinedElement('乙', '庚')).toBe('金');
  });

  it('丙辛合化水', () => {
    expect(isStemCombination('丙', '辛')).toBe(true);
    expect(getCombinedElement('丙', '辛')).toBe('水');
  });

  it('丁壬合化木', () => {
    expect(isStemCombination('丁', '壬')).toBe(true);
    expect(getCombinedElement('丁', '壬')).toBe('木');
  });

  it('戊癸合化火', () => {
    expect(isStemCombination('戊', '癸')).toBe(true);
    expect(getCombinedElement('戊', '癸')).toBe('火');
  });

  it('non-combination returns false', () => {
    expect(isStemCombination('甲', '乙')).toBe(false);
    expect(getCombinedElement('甲', '乙')).toBeNull();
  });
});

describe('STEM_CLASHES (天干相沖)', () => {
  it('has 4 clash pairs', () => {
    expect(STEM_CLASHES).toHaveLength(4);
  });

  it('甲庚相沖', () => {
    expect(isStemClash('甲', '庚')).toBe(true);
    expect(isStemClash('庚', '甲')).toBe(true);
  });

  it('乙辛相沖', () => {
    expect(isStemClash('乙', '辛')).toBe(true);
  });

  it('丙壬相沖', () => {
    expect(isStemClash('丙', '壬')).toBe(true);
  });

  it('丁癸相沖', () => {
    expect(isStemClash('丁', '癸')).toBe(true);
  });

  it('non-clash returns false', () => {
    expect(isStemClash('甲', '乙')).toBe(false);
  });

  it('戊己 are not clashes (no 沖 for earth stems)', () => {
    expect(isStemClash('戊', '己')).toBe(false);
  });
});
