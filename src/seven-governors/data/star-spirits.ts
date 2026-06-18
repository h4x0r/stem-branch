/* v8 ignore next */
import type { GovernorOrRemainder, PalaceName, MansionName, StarSpirit } from '../types';

export interface StarSpiritContext {
  bodyPalaces: Map<GovernorOrRemainder, PalaceName>;
  bodyMansions: Map<GovernorOrRemainder, MansionName>;
  bodyPalaceIndices: Map<GovernorOrRemainder, number>;
  ascendantPalaceIndex: number;
}

export interface StarSpiritRule {
  spirit: StarSpirit;
  check: (ctx: StarSpiritContext) => boolean;
}

export const STAR_SPIRIT_RULES: StarSpiritRule[] = [
  {
    spirit: {
      name: '日月夾命',
      type: 'auspicious',
      condition: 'Sun and Moon in palaces adjacent to 命宮',
      source: '果老星宗',
    },
    check: (ctx) => {
      const sunIdx = ctx.bodyPalaceIndices.get('sun');
      const moonIdx = ctx.bodyPalaceIndices.get('moon');
      if (sunIdx === undefined || moonIdx === undefined) return false;
      const asc = ctx.ascendantPalaceIndex;
      const adjLeft = (asc + 11) % 12;
      const adjRight = (asc + 1) % 12;
      return (sunIdx === adjLeft && moonIdx === adjRight)
          || (sunIdx === adjRight && moonIdx === adjLeft);
    },
  },
  {
    spirit: {
      name: '祿存',
      type: 'auspicious',
      condition: 'Jupiter in 命宮',
      source: '果老星宗',
    },
    check: (ctx) => {
      return ctx.bodyPalaceIndices.get('jupiter') === ctx.ascendantPalaceIndex;
    },
  },
  {
    spirit: {
      name: '火鈴夾命',
      type: 'malefic',
      condition: 'Mars and Ketu in palaces adjacent to 命宮',
      source: '果老星宗',
    },
    check: (ctx) => {
      const marsIdx = ctx.bodyPalaceIndices.get('mars');
      const ketuIdx = ctx.bodyPalaceIndices.get('ketu');
      if (marsIdx === undefined || ketuIdx === undefined) return false;
      const asc = ctx.ascendantPalaceIndex;
      const adjLeft = (asc + 11) % 12;
      const adjRight = (asc + 1) % 12;
      return (marsIdx === adjLeft && ketuIdx === adjRight)
          || (marsIdx === adjRight && ketuIdx === adjLeft);
    },
  },
];

export function evaluateStarSpirits(ctx: StarSpiritContext): StarSpirit[] {
  return STAR_SPIRIT_RULES.filter(r => r.check(ctx)).map(r => r.spirit);
}
