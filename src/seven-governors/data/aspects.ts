/* v8 ignore next */
import type { GovernorOrRemainder, AspectType, Aspect } from '../types';

const ASPECT_RULES: { distance: number; type: AspectType }[] = [
  { distance: 0, type: '合' },
  { distance: 3, type: '刑' },
  { distance: 4, type: '三合' },
  { distance: 6, type: '沖' },
  { distance: 8, type: '三合' },
  { distance: 9, type: '刑' },
];

export function computeAspects(
  bodyPalaceIndices: Map<GovernorOrRemainder, number>,
): Aspect[] {
  const aspects: Aspect[] = [];
  const bodies = Array.from(bodyPalaceIndices.entries());
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const [body1, idx1] = bodies[i];
      const [body2, idx2] = bodies[j];
      const dist = Math.abs(idx1 - idx2);
      const palaceDist = Math.min(dist, 12 - dist);
      for (const rule of ASPECT_RULES) {
        if (palaceDist === rule.distance) {
          aspects.push({ body1, body2, type: rule.type });
        }
      }
    }
  }
  return aspects;
}
