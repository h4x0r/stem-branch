#!/usr/bin/env node
/**
 * Generate cross-validation reference data from sxwnl (寿星万年历).
 *
 * This script loads sxwnl's eph0.js (VSOP87 data + astronomical functions)
 * and computes reference data for day pillars, solar terms, and year/month pillars.
 *
 * Output: JSON fixture files in tests/fixtures/
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createContext, runInContext } from 'vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, 'fixtures');
mkdirSync(fixturesDir, { recursive: true });

// ─── Load sxwnl in a sandboxed VM context ───────────────────────────────

function loadSxwnl() {
  const eph0Src = readFileSync('/tmp/sxwnl/eph0.js', 'utf-8');
  const lunarSrc = readFileSync('/tmp/sxwnl/lunar.js', 'utf-8');

  const sandbox = {
    Math,
    Number,
    Array,
    Object,
    String,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    Date,
    console,
    alert: (msg) => {},
    window: { Storage: false },
    document: { cookie: '' },
    localStorage: null,
  };

  const ctx = createContext(sandbox);
  runInContext(eph0Src, ctx, { filename: 'eph0.js' });

  const lunarPatched = lunarSrc
    .replace(/document\./g, '({cookie:""}.')
    .replace(/window\./g, '({}).');
  runInContext(lunarPatched, ctx, { filename: 'lunar.js' });

  return ctx;
}

console.log('Loading sxwnl...');
const sxwnl = loadSxwnl();

// Helper: convert JD (noon) to ISO date string YYYY-MM-DD
function jdToDateStr(jd) {
  // sxwnl's DD function returns {Y,M,D,...} from JD
  const r = runInContext(`JD.DD(${jd})`, sxwnl);
  const y = r.Y;
  const m = String(r.M).padStart(2, '0');
  const d = String(r.D).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ─── 1. Day Pillar Reference Data ──────────────────────────────────────

function generateDayPillarData() {
  console.log('Generating day pillar reference data...');

  const Gan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const Zhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const J2000 = 2451545;

  const results = [];

  // Sample every 57 days (59 is prime, co-prime with 60) from 1583-01-01 to 2500-12-31
  // This ensures we hit all 60 GanZhi combinations across the range
  const startJD = runInContext('JD.JD(1583, 1, 1)', sxwnl);
  const endJD = runInContext('JD.JD(2500, 12, 31)', sxwnl);

  for (let jd = startJD; jd <= endJD; jd += 59) {
    const d0 = Math.floor(jd + 0.5) - J2000;
    const D = d0 - 6 + 9000000;
    const ganIdx = D % 10;
    const zhiIdx = D % 12;
    const gz = Gan[ganIdx] + Zhi[zhiIdx];

    const dateStr = jdToDateStr(jd);

    results.push({
      date: dateStr,
      d0,
      ganzhi: gz,
      ganIdx,
      zhiIdx,
    });
  }

  console.log(`  Generated ${results.length} day pillar samples`);
  return results;
}

// ─── 2. Solar Term Reference Data ──────────────────────────────────────

function generateSolarTermData() {
  console.log('Generating solar term reference data...');

  const jqNames = [
    '冬至', '小寒', '大寒', '立春', '雨水', '驚蟄',
    '春分', '清明', '穀雨', '立夏', '小滿', '芒種',
    '夏至', '小暑', '大暑', '立秋', '處暑', '白露',
    '秋分', '寒露', '霜降', '立冬', '小雪', '大雪',
  ];

  const results = [];

  for (let year = 1900; year <= 2100; year++) {
    for (let termIdx = 0; termIdx < 24; termIdx++) {
      const longDeg = (270 + termIdx * 15) % 360;

      try {
        const approxD0 = (year - 2000) * 365.2422 + termIdx * 15.2184 - 10;
        const preciseD0 = runInContext(`obb.qi_accurate2(${approxD0})`, sxwnl);

        // d0 is Beijing time. Convert to UTC.
        const d0utc = preciseD0 - 8 / 24;
        const jd = d0utc + 2451545;
        const unixMs = (jd - 2440587.5) * 86400000;
        const date = new Date(unixMs);

        results.push({
          year,
          termIdx,
          name: jqNames[termIdx],
          longitudeDeg: longDeg,
          d0Beijing: preciseD0,
          utcIso: date.toISOString(),
          utcTimestamp: unixMs,
        });
      } catch (e) {
        console.warn(`  Warning: Failed ${jqNames[termIdx]} year ${year}: ${e.message}`);
      }
    }

    if (year % 50 === 0) console.log(`  ... year ${year}`);
  }

  console.log(`  Generated ${results.length} solar term samples`);
  return results;
}

// ─── 3. Year and Month Pillar Reference Data ───────────────────────────

function generateYearMonthPillarData() {
  console.log('Generating year/month pillar reference data...');

  const Gan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const Zhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const J2000 = 2451545;

  const results = [];

  for (let year = 1900; year <= 2100; year++) {
    // Compute lichun for this year
    const approxLichunD0 = (year - 2000) * 365.2422 + 3 * 15.2184 - 10;
    let lichunD0;
    try {
      lichunD0 = runInContext(`obb.qi_accurate2(${approxLichunD0})`, sxwnl);
    } catch (e) {
      console.warn(`  Warning: Failed lichun for ${year}: ${e.message}`);
      continue;
    }

    // Compute all 12 Jie boundaries for this year
    // sxwnl jqmc indices: 0=冬至, 1=小寒, 2=大寒, 3=立春, ...
    // Jie terms are at odd sxwnl indices: 1,3,5,...,23
    // = 小寒,立春,惊蛰,清明,立夏,芒种,小暑,立秋,白露,寒露,立冬,大雪
    const jieD0s = [];
    for (let j = 0; j < 12; j++) {
      const sxwnlIdx = 2 * j + 1;
      const approxD = (year - 2000) * 365.2422 + sxwnlIdx * 15.2184 - 10;
      try {
        const precise = runInContext(`obb.qi_accurate2(${approxD})`, sxwnl);
        jieD0s.push(precise);
      } catch (e) {
        jieD0s.push(null);
      }
    }

    // 大雪 from previous year
    const prevDaxueApprox = (year - 1 - 2000) * 365.2422 + 23 * 15.2184 - 10;
    let prevDaxueD0;
    try {
      prevDaxueD0 = runInContext(`obb.qi_accurate2(${prevDaxueApprox})`, sxwnl);
    } catch (e) {
      prevDaxueD0 = null;
    }

    for (let month = 1; month <= 12; month++) {
      const day = 15;
      const jd = runInContext(`JD.JD(${year}, ${month}, ${day})`, sxwnl);
      const d0 = Math.floor(jd + 0.5) - J2000;

      // Year pillar
      const isAfterLichun = d0 >= Math.floor(lichunD0);
      const effectiveYear = isAfterLichun ? year : year - 1;
      const yearStemIdx = ((effectiveYear - 4) % 10 + 10) % 10;
      const yearBranchIdx = ((effectiveYear - 4) % 12 + 12) % 12;
      const yearGZ = Gan[yearStemIdx] + Zhi[yearBranchIdx];

      // Month pillar
      let solarMonthIdx = -1;
      for (let j = 11; j >= 0; j--) {
        if (jieD0s[j] !== null && d0 >= Math.floor(jieD0s[j])) {
          solarMonthIdx = j === 0 ? 11 : j - 1;
          break;
        }
      }
      if (solarMonthIdx === -1) {
        if (prevDaxueD0 !== null && d0 >= Math.floor(prevDaxueD0)) {
          solarMonthIdx = 10;
        } else {
          solarMonthIdx = 11;
        }
      }

      const monthBranchIdx = (solarMonthIdx + 2) % 12;
      const firstMonthStem = ((yearStemIdx % 5) * 2 + 2) % 10;
      const monthStemIdx = (firstMonthStem + solarMonthIdx) % 10;
      const monthGZ = Gan[monthStemIdx] + Zhi[monthBranchIdx];

      // Day pillar
      const dayD = d0 - 6 + 9000000;
      const dayGZ = Gan[dayD % 10] + Zhi[dayD % 12];

      results.push({
        date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        yearGanzhi: yearGZ,
        yearStemIdx,
        yearBranchIdx,
        effectiveYear,
        monthGanzhi: monthGZ,
        monthStemIdx,
        monthBranchIdx,
        solarMonthIdx,
        dayGanzhi: dayGZ,
      });
    }

    if (year % 50 === 0) console.log(`  ... year ${year}`);
  }

  console.log(`  Generated ${results.length} year/month pillar samples`);
  return results;
}

// ─── Main ──────────────────────────────────────────────────────────────

try {
  const dayPillars = generateDayPillarData();
  writeFileSync(join(fixturesDir, 'sxwnl-day-pillars.json'), JSON.stringify(dayPillars));
  console.log('Wrote sxwnl-day-pillars.json');

  const solarTerms = generateSolarTermData();
  writeFileSync(join(fixturesDir, 'sxwnl-solar-terms.json'), JSON.stringify(solarTerms));
  console.log('Wrote sxwnl-solar-terms.json');

  const yearMonthPillars = generateYearMonthPillarData();
  writeFileSync(join(fixturesDir, 'sxwnl-year-month-pillars.json'), JSON.stringify(yearMonthPillars));
  console.log('Wrote sxwnl-year-month-pillars.json');

  console.log('\nDone! All reference data generated.');
} catch (e) {
  console.error('Error generating reference data:', e);
  process.exit(1);
}
