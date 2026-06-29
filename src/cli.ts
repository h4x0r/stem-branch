/* v8 ignore next */
/**
 * stem-branch CLI
 *
 * Terminal command for Chinese calendar, astronomy, and astrology charts.
 * Renders charts as ASCII art with CJK-aware formatting.
 *
 * Usage: npx @4n6h4x0r/stem-branch [options]
 */

import { computeFourPillars } from './four-pillars';
import { dailyAlmanac } from './daily-almanac';
import { computeZiWei } from './polaris';
import { computeQiMenForDate } from './mystery-gates';
import { computeSixRenForDate } from './six-ren';
import { computeChuanRenChart } from './qimen-chuanren';
import { getSevenGovernorsChart } from './seven-governors';
import { computeTropicalChart } from './tropical-astrology';
import { computeBirthChart } from './birth-chart';
import { computeSiderealChart } from './sidereal-astrology';
import { getFlyingStars, FLYING_STARS } from './flying-stars';
import { searchCities } from './cities';
import { gregorianToLunisolar } from './lunisolar-calendar';
import { computeMajorLuck, computeMinorLuck } from './luck-pillars';
import { computeSolarReturn } from './solar-return';
import { computeTransits } from './transits';

declare const process: {
  argv: string[];
  exit: (code: number) => never;
  stderr: { write: (s: string) => void };
  env?: Record<string, string | undefined>;
};

import { renderPillars } from './cli/render-pillars';
import { renderAlmanac } from './cli/render-almanac';
import { renderPolaris } from './cli/render-polaris';
import { renderQiMen } from './cli/render-qimen';
import { renderLiuRen } from './cli/render-liuren';
import { renderChuanRen } from './cli/render-chuanren';
import { renderSevenGovernors } from './cli/render-seven-governors';
import { renderTropical } from './cli/render-tropical';
import { renderBirthChart } from './cli/render-birth-chart';
import { renderSidereal } from './cli/render-sidereal';
import { renderFlyingStars } from './cli/render-flying-stars';
import { renderLuck } from './cli/render-luck';
import { renderSolarReturn } from './cli/render-solar-return';
import { renderTransits } from './cli/render-transits';

// ── Argument parsing ────────────────────────────────────────

export interface CLIOptions {
  date: Date;
  lat: number;
  lng: number;
  city?: string;
  gender: 'male' | 'female';
  charts: Set<string>;
  json: boolean;
  research: boolean;
  luck: boolean;
  solarReturn: boolean;
  solarReturnYear: number;
  transits: boolean;
  transitDate: Date | null;
  help: boolean;
  version: boolean;
}

const CHART_FLAGS = [
  'pillars', 'almanac', 'flying-stars',
  'polaris', 'qimen', 'liuren', 'chuanren',
  'seven-governors', 'tropical', 'sidereal',
  'western-natal',
  'all',
] as const;

const HELP_TEXT = `
stem-branch — Chinese calendar, astronomy & astrology CLI

Usage: stem-branch [options]

Date & Location:
  --date <ISO>        Date/time in ISO format (default: now)
  --city <name>       City name for coordinates
  --lat <degrees>     Latitude
  --lng <degrees>     Longitude
  --gender <m|f>      Gender for Zi Wei Dou Shu (default: male)

Daily Reference (default: --pillars --almanac):
  --pillars           Four Pillars (四柱八字)
  --almanac           Daily Almanac (日曆) — includes flying star summary
  --flying-stars      Flying Stars 九宮 grids (紫白飛星)

Divination Systems:
  --polaris           Zi Wei Dou Shu (紫微斗數)
  --qimen             Qi Men Dun Jia (奇門遁甲)
  --liuren            Da Liu Ren (大六壬)
  --chuanren          Qi Men Chuan Ren (奇門穿壬)

Astrology:
  --seven-governors   Seven Governors (七政四餘)
  --tropical          Tropical Astrology
  --sidereal          Sidereal Astrology (Jyotish)
  --western-natal     Western natal chart (Tropical, 300+ data points)
  --research          Research / statistical extensions (implies --western-natal)

  --luck              Major & minor luck periods (implies --pillars)
  --solar-return      Solar Return chart (use --year to set year, default: current)
  --year <YYYY>       Year for solar return (default: current year)
  --transits          Transit overlay (aspects to natal, use --transit-date for date)
  --transit-date <ISO>  Date for transits (default: now)

  --all               All charts

Output:
  --json              Output as JSON
  --help              Show this help message
  --version, -v       Show version number
`.trim();

const VERSION = '0.2.0';

function die(msg: string): never {
  process.stderr.write(`Error: ${msg}\n`);
  return process.exit(1);
}

function warn(msg: string): void {
  process.stderr.write(`Warning: ${msg}\n`);
}

/** Flags that consume the next argv element as a value. */
const VALUE_FLAGS = new Set(['--date', '--lat', '--lng', '--city', '--gender', '--year', '--transit-date']);

export function parseArgs(argv: string[]): CLIOptions {
  const opts: CLIOptions = {
    date: new Date(),
    lat: 0,
    lng: 0,
    gender: 'male',
    charts: new Set<string>(),
    json: false,
    research: false,
    luck: false,
    solarReturn: false,
    solarReturnYear: new Date().getUTCFullYear(),
    transits: false,
    transitDate: null,
    help: false,
    version: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    // Bounds check: flags that need a value
    if (VALUE_FLAGS.has(arg) && i + 1 >= argv.length) {
      die(`${arg} requires a value`);
    }

    switch (arg) {
      case '--date': {
        const d = new Date(argv[++i]);
        if (isNaN(d.getTime())) die(`Invalid date: "${argv[i]}"`);
        opts.date = d;
        break;
      }
      case '--lat':
        opts.lat = Number(argv[++i]);
        break;
      case '--lng':
        opts.lng = Number(argv[++i]);
        break;
      case '--city':
        opts.city = argv[++i];
        break;
      case '--gender': {
        const g = argv[++i].toLowerCase();
        if (g === 'female' || g === 'f') {
          opts.gender = 'female';
        } else if (g === 'male' || g === 'm') {
          opts.gender = 'male';
        } else {
          warn(`Unknown gender "${argv[i]}", defaulting to male`);
          opts.gender = 'male';
        }
        break;
      }
      case '--json':
        opts.json = true;
        break;
      case '--research':
        opts.research = true;
        opts.charts.add('western-natal');  // --research implies --western-natal
        break;
      case '--luck':
        opts.luck = true;
        opts.charts.add('pillars');  // --luck implies --pillars
        break;
      case '--solar-return':
        opts.solarReturn = true;
        break;
      case '--year':
        opts.solarReturnYear = Number(argv[++i]);
        break;
      case '--transits':
        opts.transits = true;
        break;
      case '--transit-date': {
        const td = new Date(argv[++i]);
        /* v8 ignore next */
        if (isNaN(td.getTime())) die(`Invalid transit date: "${argv[i]}"`);
        opts.transitDate = td;
        break;
      }
      case '--help':
      case '-h':
        opts.help = true;
        break;
      case '--version':
      case '-v':
        opts.version = true;
        break;
      default:
        if (arg.startsWith('--')) {
          const flag = arg.slice(2);
          if (flag === 'all') {
            for (const f of CHART_FLAGS) {
              if (f !== 'all') opts.charts.add(f);
            }
          } else if ((CHART_FLAGS as readonly string[]).includes(flag)) {
            opts.charts.add(flag);
          } else {
            warn(`Unrecognized flag: ${arg}`);
          }
        }
    }
  }

  // Default charts if none specified
  if (opts.charts.size === 0 && !opts.help && !opts.version) {
    opts.charts.add('pillars');
    opts.charts.add('almanac');
  }

  // Resolve city to coordinates
  if (opts.city) {
    const results = searchCities(opts.city);
    if (results.length > 0) {
      opts.lat = results[0].latitude;
      opts.lng = results[0].longitude;
    } else {
      warn(`City "${opts.city}" not found, using lat=0 lng=0`);
    }
  }

  return opts;
}

// ── Chart computation & rendering ───────────────────────────

function computeAndRender(opts: CLIOptions): string[] {
  const output: string[] = [];
  const { date, lat, lng, charts, research, luck } = opts;

  if (charts.has('pillars') || charts.has('almanac') || luck) {
    const pillars = computeFourPillars(date);

    if (charts.has('pillars')) {
      output.push(...renderPillars(pillars));
      output.push('');
    }

    if (luck) {
      const major = computeMajorLuck(date, opts.gender);
      const minor = computeMinorLuck(
        pillars.hour, major.direction, 1, major.startAge - 1,
      );
      output.push(...renderLuck(major, minor));
      output.push('');
    }

    if (charts.has('almanac')) {
      const almanac = dailyAlmanac(date);
      output.push(...renderAlmanac(almanac));
      output.push('');
    }
  }

  if (charts.has('flying-stars')) {
    const starNums = getFlyingStars(date);
    output.push(...renderFlyingStars({
      year: FLYING_STARS[starNums.year - 1],
      month: FLYING_STARS[starNums.month - 1],
      day: FLYING_STARS[starNums.day - 1],
      hour: FLYING_STARS[starNums.hour - 1],
    }));
    output.push('');
  }

  if (charts.has('polaris')) {
    const lunar = gregorianToLunisolar(date);
    const ziwei = computeZiWei({
      year: date.getFullYear(),
      month: lunar.month,
      day: lunar.day,
      hour: Math.floor(((date.getUTCHours() + 1) % 24) / 2),
      gender: opts.gender,
    });
    output.push(...renderPolaris(ziwei));
    output.push('');
  }

  if (charts.has('qimen')) {
    const qimen = computeQiMenForDate(date);
    output.push(...renderQiMen(qimen));
    output.push('');
  }

  if (charts.has('liuren')) {
    const liuren = computeSixRenForDate(date);
    output.push(...renderLiuRen(liuren));
    output.push('');
  }

  if (charts.has('chuanren')) {
    const chuanren = computeChuanRenChart(date);
    output.push(...renderChuanRen(chuanren));
    output.push('');
  }

  if (charts.has('seven-governors')) {
    const sg = getSevenGovernorsChart(date, { lat, lon: lng });
    output.push(...renderSevenGovernors(sg));
    output.push('');
  }

  if (charts.has('tropical')) {
    const tropical = computeTropicalChart(date, lat, lng);
    output.push(...renderTropical(tropical));
    output.push('');
  }

  if (charts.has('sidereal')) {
    const sidereal = computeSiderealChart(date, lat, lng);
    output.push(...renderSidereal(sidereal));
    output.push('');
  }

  if (charts.has('western-natal')) {
    const birthChart = computeBirthChart(date, lat, lng, { research });
    output.push(...renderBirthChart(birthChart));
    output.push('');
  }

  if (opts.solarReturn) {
    const sr = computeSolarReturn(date, lat, lng, opts.solarReturnYear);
    output.push(...renderSolarReturn(sr));
    output.push('');
  }

  if (opts.transits) {
    /* v8 ignore next */
    const transitDate = opts.transitDate ?? new Date();
    const transit = computeTransits(date, lat, lng, transitDate);
    output.push(...renderTransits(transit));
    output.push('');
  }

  return output;
}

function computeJSON(opts: CLIOptions): Record<string, unknown> {
  const { date, lat, lng, charts, research, luck } = opts;
  const result: Record<string, unknown> = { date: date.toISOString(), lat, lng };

  if (charts.has('pillars')) {
    result.pillars = computeFourPillars(date);
  }
  if (luck) {
    /* v8 ignore next */
    const pillars = (result.pillars as ReturnType<typeof computeFourPillars>) ?? computeFourPillars(date);
    const major = computeMajorLuck(date, opts.gender);
    const minor = computeMinorLuck(pillars.hour, major.direction, 1, major.startAge - 1);
    result.luck = { major, minor };
  }
  if (charts.has('almanac')) {
    result.almanac = dailyAlmanac(date);
  }
  if (charts.has('flying-stars')) {
    const starNums = getFlyingStars(date);
    result.flyingStars = {
      year: FLYING_STARS[starNums.year - 1],
      month: FLYING_STARS[starNums.month - 1],
      day: FLYING_STARS[starNums.day - 1],
      hour: FLYING_STARS[starNums.hour - 1],
    };
  }
  if (charts.has('polaris')) {
    const lunar = gregorianToLunisolar(date);
    result.polaris = computeZiWei({
      year: date.getFullYear(),
      month: lunar.month,
      day: lunar.day,
      hour: Math.floor(((date.getUTCHours() + 1) % 24) / 2),
      gender: opts.gender,
    });
  }
  if (charts.has('qimen')) {
    result.qimen = computeQiMenForDate(date);
  }
  if (charts.has('liuren')) {
    result.liuren = computeSixRenForDate(date);
  }
  if (charts.has('chuanren')) {
    result.chuanren = computeChuanRenChart(date);
  }
  if (charts.has('seven-governors')) {
    result.sevenGovernors = getSevenGovernorsChart(date, { lat, lon: lng });
  }
  if (charts.has('tropical')) {
    result.tropical = computeTropicalChart(date, lat, lng);
  }
  if (charts.has('sidereal')) {
    result.sidereal = computeSiderealChart(date, lat, lng);
  }
  if (charts.has('western-natal')) {
    result.westernNatal = computeBirthChart(date, lat, lng, { research });
  }
  if (opts.solarReturn) {
    const sr = computeSolarReturn(date, lat, lng, opts.solarReturnYear);
    result.solarReturn = {
      year: sr.year,
      natalSunLongitude: sr.natalSunLongitude,
      returnDate: sr.returnDate.toISOString(),
      chart: sr.chart,
    };
  }
  if (opts.transits) {
    /* v8 ignore next */
    const transitDate = opts.transitDate ?? new Date();
    const transit = computeTransits(date, lat, lng, transitDate);
    result.transits = {
      transitDate: transitDate.toISOString(),
      aspects: transit.aspects,
      transitPositions: transit.transitPositions,
    };
  }

  return result;
}

// ── Main ────────────────────────────────────────────────────

export function main(argv: string[] = process.argv.slice(2)): void {
  const opts = parseArgs(argv);

  if (opts.version) {
    console.log(VERSION);
    return;
  }

  if (opts.help) {
    console.log(HELP_TEXT);
    return;
  }

  if (opts.json) {
    const result = computeJSON(opts);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const lines = computeAndRender(opts);
  for (const line of lines) {
    console.log(line);
  }
}

// Run when executed directly (skip during test imports)
/* v8 ignore next 3 */
if (!process.env?.VITEST) {
  main();
}
