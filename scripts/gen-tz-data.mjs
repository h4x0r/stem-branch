#!/usr/bin/env node
/**
 * Generate embedded timezone transition data from system zdump.
 *
 * Usage: node scripts/gen-tz-data.mjs > src/tz-data.ts
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

// Extract unique timezone IDs from cities.ts
const citiesSrc = readFileSync(new URL('../src/cities.ts', import.meta.url), 'utf8');
const tzIds = [...new Set(citiesSrc.match(/timezoneId: '([^']+)'/g)
  .map(m => m.replace("timezoneId: '", '').replace("'", '')))].sort();

console.error(`Found ${tzIds.length} unique timezones`);

// Month name → number
const MONTHS = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

/**
 * Parse a zdump UT date string to Unix seconds.
 * Format: "Mon Dec 31 15:54:17 1900"
 */
function parseUtDate(str) {
  // "Day Mon DD HH:MM:SS YYYY"
  const parts = str.trim().split(/\s+/);
  // parts: [Day, Mon, DD, HH:MM:SS, YYYY]
  const month = MONTHS[parts[1]];
  const day = parseInt(parts[2]);
  const [hh, mm, ss] = parts[3].split(':').map(Number);
  const year = parseInt(parts[4]);

  // Use Date.UTC to get milliseconds, then convert to seconds
  const ms = Date.UTC(year, month, day, hh, mm, ss);
  return Math.floor(ms / 1000);
}

// Collect all data
const allData = {};
let totalTransitions = 0;

for (const tz of tzIds) {
  const raw = execSync(`zdump -v "${tz}" 2>/dev/null`, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  const lines = raw.split('\n').filter(line => {
    // Only include transitions in 1900-2026
    const match = line.match(/UT = .* (\d{4}) /);
    if (!match) return false;
    const year = parseInt(match[1]);
    return year >= 1900 && year <= 2026;
  });

  const transitions = [];

  for (const line of lines) {
    // Extract UT date (before "UT =")
    const utMatch = line.match(/\s+(.+?)\s+UT\s*=/);
    if (!utMatch) continue;

    // Extract gmtoff and isdst
    const gmtoffMatch = line.match(/gmtoff=(-?\d+)/);
    const isdstMatch = line.match(/isdst=([01])/);
    if (!gmtoffMatch) continue;

    const utcSeconds = parseUtDate(utMatch[1]);
    const offsetMinutes = parseInt(gmtoffMatch[1]) / 60;
    const isDst = isdstMatch ? parseInt(isdstMatch[1]) : 0;

    transitions.push([utcSeconds, offsetMinutes, isDst]);
  }

  if (transitions.length > 0) {
    // Sort by UTC seconds (should already be sorted, but be safe)
    transitions.sort((a, b) => a[0] - b[0]);

    // Flatten to a single array: [utc1, off1, dst1, utc2, off2, dst2, ...]
    const flat = [];
    for (const [utc, off, dst] of transitions) {
      flat.push(utc, off, dst);
    }
    allData[tz] = flat;
    totalTransitions += transitions.length;
  }
}

console.error(`Total transitions: ${totalTransitions}`);
console.error(`Generating TypeScript...`);

// Also need initial offsets (before first transition) for each timezone
// Use the offset at 1899-12-31T12:00:00Z as the "initial" offset
const initialOffsets = {};
for (const tz of tzIds) {
  const raw = execSync(`zdump -v "${tz}" 2>/dev/null`, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  // Find the first line that has a valid gmtoff before or at 1900
  const allLines = raw.split('\n');
  let lastOffset = 0;
  for (const line of allLines) {
    const gmtoffMatch = line.match(/gmtoff=(-?\d+)/);
    if (!gmtoffMatch) continue;
    const yearMatch = line.match(/UT = .* (\d{4}) /);
    if (!yearMatch) {
      lastOffset = parseInt(gmtoffMatch[1]) / 60;
      continue;
    }
    const year = parseInt(yearMatch[1]);
    if (year < 1900) {
      lastOffset = parseInt(gmtoffMatch[1]) / 60;
    } else {
      break;
    }
  }
  initialOffsets[tz] = lastOffset;
}

// Output TypeScript
const lines = [];
lines.push(`/**`);
lines.push(` * Embedded IANA timezone transition data.`);
lines.push(` *`);
lines.push(` * Generated from the system's IANA tzdata via zdump.`);
lines.push(` * Covers all ${tzIds.length} timezones used in the stembranch city database (1900-2026).`);
lines.push(` * Total transitions: ${totalTransitions}`);
lines.push(` *`);
lines.push(` * Each timezone entry is a flat array of [utcSeconds, offsetMinutes, isDst] triples,`);
lines.push(` * sorted by utcSeconds ascending.`);
lines.push(` *`);
lines.push(` * Source: IANA Time Zone Database (via system zdump)`);
lines.push(` * System tzdata version: ${(() => { try { return execSync('cat /usr/share/zoneinfo/+VERSION 2>/dev/null || echo "unknown"', { encoding: 'utf8' }).trim(); } catch { return 'unknown'; } })()}`);
lines.push(` * Generated: ${new Date().toISOString()}`);
lines.push(` */`);
lines.push(``);
lines.push(`/**`);
lines.push(` * Initial UTC offsets (in minutes) before the first recorded transition.`);
lines.push(` * These are typically LMT (Local Mean Time) offsets from before standardization.`);
lines.push(` */`);
lines.push(`// prettier-ignore`);
lines.push(`export const TZ_INITIAL_OFFSETS: Record<string, number> = {`);
for (const tz of tzIds) {
  lines.push(`  '${tz}': ${initialOffsets[tz]},`);
}
lines.push(`};`);
lines.push(``);
lines.push(`/**`);
lines.push(` * Timezone transitions as flattened [utcSeconds, offsetMinutes, isDst] triples.`);
lines.push(` * Use getEmbeddedOffset() to look up the offset for a given UTC moment.`);
lines.push(` */`);
lines.push(`// prettier-ignore`);
lines.push(`export const TZ_TRANSITIONS: Record<string, number[]> = {`);

for (const tz of tzIds) {
  const data = allData[tz];
  if (!data) {
    lines.push(`  '${tz}': [],`);
    continue;
  }
  // Format the array compactly — one timezone per line
  lines.push(`  '${tz}': [${data.join(',')}],`);
}

lines.push(`};`);
lines.push(``);
lines.push(`/**`);
lines.push(` * Binary search the transition table to find the UTC offset at a given moment.`);
lines.push(` *`);
lines.push(` * @param utcSeconds - Unix timestamp in seconds`);
lines.push(` * @param timezoneId - IANA timezone identifier`);
lines.push(` * @returns { offsetMinutes, isDst } or null if timezone not in embedded data`);
lines.push(` */`);
lines.push(`export function getEmbeddedOffset(`);
lines.push(`  utcSeconds: number,`);
lines.push(`  timezoneId: string,`);
lines.push(`): { offsetMinutes: number; isDst: boolean } | null {`);
lines.push(`  const transitions = TZ_TRANSITIONS[timezoneId];`);
lines.push(`  if (!transitions) return null;`);
lines.push(``);
lines.push(`  const tripleCount = transitions.length / 3;`);
lines.push(``);
lines.push(`  if (tripleCount === 0) {`);
lines.push(`    const initial = TZ_INITIAL_OFFSETS[timezoneId];`);
lines.push(`    return initial != null ? { offsetMinutes: initial, isDst: false } : null;`);
lines.push(`  }`);
lines.push(``);
lines.push(`  // Before first transition → use initial offset`);
lines.push(`  if (utcSeconds < transitions[0]) {`);
lines.push(`    const initial = TZ_INITIAL_OFFSETS[timezoneId];`);
lines.push(`    return initial != null ? { offsetMinutes: initial, isDst: false } : null;`);
lines.push(`  }`);
lines.push(``);
lines.push(`  // Binary search: find the last transition at or before utcSeconds`);
lines.push(`  let lo = 0;`);
lines.push(`  let hi = tripleCount - 1;`);
lines.push(`  while (lo < hi) {`);
lines.push(`    const mid = lo + Math.ceil((hi - lo) / 2);`);
lines.push(`    if (transitions[mid * 3] <= utcSeconds) {`);
lines.push(`      lo = mid;`);
lines.push(`    } else {`);
lines.push(`      hi = mid - 1;`);
lines.push(`    }`);
lines.push(`  }`);
lines.push(``);
lines.push(`  return {`);
lines.push(`    offsetMinutes: transitions[lo * 3 + 1],`);
lines.push(`    isDst: transitions[lo * 3 + 2] === 1,`);
lines.push(`  };`);
lines.push(`}`);

process.stdout.write(lines.join('\n') + '\n');
