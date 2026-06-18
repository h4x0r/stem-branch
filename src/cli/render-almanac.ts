/* v8 ignore next */
/**
 * Render Daily Almanac (日曆總覽) as key-value pairs.
 */
import type { DailyAlmanac } from '../daily-almanac';
import { renderTable, renderTitle } from './render-grid';

export function renderAlmanac(almanac: DailyAlmanac): string[] {
  const { lunar, solarTerm, chineseZodiac, westernZodiac, dayFitness, flyingStars, almanacFlags, dayElement, dayStrength } = almanac;

  const rows: [string, string][] = [
    ['Date', almanac.date.toISOString().slice(0, 10)],
    ['Julian Day', String(almanac.julianDay)],
    ['Lunar', `${lunar.month}月${lunar.day}日${lunar.isLeapMonth ? ' (閏)' : ''}`],
    ['Solar Term', solarTerm.current ? `${solarTerm.current.name}` : `Next: ${solarTerm.next.name}`],
    ['Chinese Zodiac', `${chineseZodiac.animal} ${chineseZodiac.branch}`],
    ['Western Zodiac', `${westernZodiac.sign} ${westernZodiac.symbol}`],
    ['Day Fitness', `${dayFitness.fitness} ${dayFitness.auspicious ? '(吉)' : '(凶)'}`],
    ['Day Element', `${dayElement} ${dayStrength}`],
    ['Flying Stars', `Y:${flyingStars.year.number}${flyingStars.year.color} M:${flyingStars.month.number}${flyingStars.month.color} D:${flyingStars.day.number}${flyingStars.day.color} H:${flyingStars.hour.number}${flyingStars.hour.color}`],
    ['Eclipse', almanac.isEclipseDay ? 'Eclipse today!' : `Nearest: ${almanac.nearestEclipse.type} ${almanac.nearestEclipse.date.toISOString().slice(0, 10)}`],
  ];

  if (almanacFlags.length > 0) {
    rows.push(['Almanac Flags', almanacFlags.slice(0, 6).map(f => f.name).join(', ')]);
    if (almanacFlags.length > 6) {
      rows.push(['', `... and ${almanacFlags.length - 6} more`]);
    }
  }

  return [
    renderTitle('日曆總覽 Daily Almanac'),
    ...renderTable(rows, 16),
  ];
}
