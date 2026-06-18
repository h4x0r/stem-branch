/* v8 ignore next */
import type { ZodiacSign } from './tropical-astrology';
import type { WesternElement, WesternQuality } from './birth-chart-types';

export const SIGN_ELEMENT: Record<ZodiacSign, WesternElement> = {
  Aries: 'fire',
  Taurus: 'earth',
  Gemini: 'air',
  Cancer: 'water',
  Leo: 'fire',
  Virgo: 'earth',
  Libra: 'air',
  Scorpio: 'water',
  Sagittarius: 'fire',
  Capricorn: 'earth',
  Aquarius: 'air',
  Pisces: 'water',
};

export const SIGN_QUALITY: Record<ZodiacSign, WesternQuality> = {
  Aries: 'cardinal',
  Taurus: 'fixed',
  Gemini: 'mutable',
  Cancer: 'cardinal',
  Leo: 'fixed',
  Virgo: 'mutable',
  Libra: 'cardinal',
  Scorpio: 'fixed',
  Sagittarius: 'mutable',
  Capricorn: 'cardinal',
  Aquarius: 'fixed',
  Pisces: 'mutable',
};

export const SIGN_POLARITY: Record<ZodiacSign, 'positive' | 'negative'> = {
  Aries: 'positive',
  Taurus: 'negative',
  Gemini: 'positive',
  Cancer: 'negative',
  Leo: 'positive',
  Virgo: 'negative',
  Libra: 'positive',
  Scorpio: 'negative',
  Sagittarius: 'positive',
  Capricorn: 'negative',
  Aquarius: 'positive',
  Pisces: 'negative',
};

export const SIGN_RULER: Record<ZodiacSign, string> = {
  Aries: 'Mars',
  Taurus: 'Venus',
  Gemini: 'Mercury',
  Cancer: 'Moon',
  Leo: 'Sun',
  Virgo: 'Mercury',
  Libra: 'Venus',
  Scorpio: 'Mars',
  Sagittarius: 'Jupiter',
  Capricorn: 'Saturn',
  Aquarius: 'Saturn',
  Pisces: 'Jupiter',
};
