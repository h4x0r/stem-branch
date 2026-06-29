#!/usr/bin/env node
/**
 * Fetch the Hong Kong Observatory Gregorian–Lunar Calendar conversion tables and
 * build an authoritative real-world oracle fixture.
 *
 * HKO (government) publishes per-year tables as static open-data text files; this
 * is the *authoritative* arbiter for near-midnight calendar boundaries that a
 * computed library (cnlunar/sxwnl) cannot settle. Source:
 * https://www.hko.gov.hk/en/gts/time/calendar/text/files/T{year}e.txt
 *
 * Years chosen: ΔT-KNOWN years that include the tightest validatable boundaries
 * (2018 ≈ 2.05 min, 2013 ≈ 3.7 min) and both leap cases (2020 閏4, 2023 閏2). HKO
 * marks a leap month by *repeating* the month number, so the second occurrence
 * of a number is the intercalary month.
 *
 * Far-future tight boundaries (2057 ≈ 29 s, 2097 ≈ 2.4 s) are deliberately NOT
 * asserted: there our calendar diverges from HKO by one day because ΔT is
 * extrapolated, not observed — an inherent ΔT-prediction limit, documented in
 * docs/validation.md, not an ephemeris error.
 *
 * Writes tests/fixtures/hko-lunisolar.json (npm) and
 * rust/tests/data/hko_lunisolar.txt (Rust). Run: node scripts/gen-hko-fixture.mjs
 */
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { setTimeout as sleep } from 'timers/promises';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const YEARS = [2013, 2018, 2020, 2023];
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) stem-branch-validation';

function parseHKO(text) {
  const out = [];
  let curMonth = null;
  let curLeap = false;
  let prevMonth = null;
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(.+?)\s{2,}/);
    if (!m) continue;
    const [, y, mo, d, lunarRaw] = m;
    const lunar = lunarRaw.trim();
    const monthMatch = lunar.match(/^(\d+)(?:st|nd|rd|th) Lunar Month$/);
    if (monthMatch) {
      const n = Number(monthMatch[1]);
      curLeap = n === prevMonth; // repeated number ⇒ intercalary month
      curMonth = n;
      prevMonth = n;
      out.push({ g: [Number(y), Number(mo), Number(d)], l: [curMonth, 1], leap: curLeap });
    } else if (/^\d+$/.test(lunar)) {
      if (curMonth === null) continue; // leading days belong to the prior year's month
      out.push({ g: [Number(y), Number(mo), Number(d)], l: [curMonth, Number(lunar)], leap: curLeap });
    }
  }
  return out;
}

const all = [];
for (const year of YEARS) {
  const url = `https://www.hko.gov.hk/en/gts/time/calendar/text/files/T${year}e.txt`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HKO ${year}: HTTP ${res.status}`);
  const entries = parseHKO(await res.text());
  if (entries.length < 300) throw new Error(`HKO ${year}: only ${entries.length} entries parsed`);
  all.push(...entries);
  console.log(`  ${year}: ${entries.length} dated entries`);
  await sleep(1500 + Math.floor(Math.random() * 2500)); // polite, jittered
}

writeFileSync(join(root, 'tests/fixtures/hko-lunisolar.json'), JSON.stringify(all, null, 0));
const txt = all.map((e) => `hko ${e.g[0]} ${e.g[1]} ${e.g[2]} ${e.l[0]} ${e.l[1]} ${e.leap ? 1 : 0}`).join('\n');
writeFileSync(join(root, 'rust/tests/data/hko_lunisolar.txt'), txt + '\n');
console.log(`wrote ${all.length} entries (years ${YEARS.join(', ')})`);
