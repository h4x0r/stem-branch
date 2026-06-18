/* v8 ignore next */
import { dateToJulianCenturies } from '../astro';
import type { KetuMode } from './types';

function normDeg(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

// ── Rahu (羅睺) — Moon's mean ascending node ────────────────

function meanAscendingNode(T: number): number {
  const T2 = T * T;
  const T3 = T2 * T;
  const T4 = T3 * T;
  return normDeg(
    125.0445479
    - 1934.1362891 * T
    + 0.0020754 * T2
    + T3 / 467441.0
    - T4 / 60616000.0
  );
}

export function getRahuPosition(date: Date): { longitude: number; latitude: number } {
  const T = dateToJulianCenturies(date);
  return { longitude: meanAscendingNode(T), latitude: 0 };
}

// ── Ketu (計都) — Osculating lunar apogee ────────────────────

function meanPerigee(T: number): number {
  const T2 = T * T;
  const T3 = T2 * T;
  const T4 = T3 * T;
  return normDeg(
    83.3532465
    + 4069.0137287 * T
    - 0.0103200 * T2
    - T3 / 80053.0
    + T4 / 18999000.0
  );
}

function apogeeCorrection(T: number): number {
  const T2 = T * T;
  const D = normDeg(297.8501921 + 445267.1114034 * T - 0.0018819 * T2);
  const M = normDeg(357.5291092 + 35999.0502909 * T - 0.0001536 * T2);
  const Mp = normDeg(134.9633964 + 477198.8675055 * T + 0.0087414 * T2);
  const F = normDeg(93.2720950 + 483202.0175233 * T - 0.0036539 * T2);
  const toRad = Math.PI / 180;
  let correction = 0;
  correction += 1.4979 * Math.sin(2 * (D - Mp) * toRad);
  correction += 0.1500 * Math.sin(M * toRad);
  correction += 0.1226 * Math.sin(2 * D * toRad);
  correction += 0.1040 * Math.sin(2 * Mp * toRad);
  correction -= 0.0752 * Math.sin(2 * F * toRad);
  return correction;
}

export function getKetuPosition(
  date: Date,
  mode: KetuMode = 'apogee',
): { longitude: number; latitude: number } {
  if (mode === 'descending-node') {
    const rahu = getRahuPosition(date);
    return { longitude: normDeg(rahu.longitude + 180), latitude: 0 };
  }
  const T = dateToJulianCenturies(date);
  const meanApogee = normDeg(meanPerigee(T) + 180);
  const correction = apogeeCorrection(T);
  return { longitude: normDeg(meanApogee + correction), latitude: 0 };
}

// ── Yuebei (月孛) — Mean lunar apogee ────────────────────────

export function getYuebeiPosition(date: Date): { longitude: number; latitude: number } {
  const T = dateToJulianCenturies(date);
  return { longitude: normDeg(meanPerigee(T) + 180), latitude: 0 };
}

// ── Purple Qi (紫氣) — Classical formula ─────────────────────

const PURPLE_QI_EPOCH_JD = 2451545.0;
const PURPLE_QI_EPOCH_LON = 0.0; // Provisional — TBD from 《果老星宗》
const PURPLE_QI_DAILY_RATE = 360.0 / 10195.5; // ~28-year cycle

export function getPurpleQiPosition(date: Date): { longitude: number; latitude: number } {
  const msPerDay = 86400000;
  const jd = date.getTime() / msPerDay + 2440587.5;
  const days = jd - PURPLE_QI_EPOCH_JD;
  return { longitude: normDeg(PURPLE_QI_EPOCH_LON + PURPLE_QI_DAILY_RATE * days), latitude: 0 };
}
