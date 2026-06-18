/* v8 ignore next */
/**
 * ELP/MPP02 Moon ephemeris computation.
 *
 * Implements the lunar theory "ELP revisited" (Chapront & Francou, 2003)
 * using coefficient data from ytliu0's ElpMpp02 repository.
 *
 * Output: geocentric ecliptic coordinates (longitude, latitude, distance)
 * referred to the mean ecliptic and equinox of J2000.0.
 *
 * Parameter set: corr=1 (fitted to DE405/DE406).
 *
 * Reference: https://github.com/ytliu0/ElpMpp02
 */

import {
  MAIN_LONG, MAIN_LAT, MAIN_DIST,
  PERT_LONG_T0, PERT_LONG_T1, PERT_LONG_T2, PERT_LONG_T3,
  PERT_LAT_T0, PERT_LAT_T1, PERT_LAT_T2,
  PERT_DIST_T0, PERT_DIST_T1, PERT_DIST_T2, PERT_DIST_T3,
} from './elpmpp02-data';

// ── Constants ─────────────────────────────────────────────────────────────

const PI = Math.PI;
const TWO_PI = 2 * PI;
const DEG = PI / 180;
const SEC = PI / 648000;  // arcseconds to radians (used for argument computation only)

// ── ELP/MPP02 correction parameters (corr=1: fitted to DE405/DE406) ─────

const Dw1_0 = -0.07008;
const Dw2_0 = 0.20794;
const Dw3_0 = -0.07215;
const Deart_0 = -0.00033;
const Dperi = -0.00749;

const Dw1_1 = -0.35106;
const Dgam = 0.00085;
const De = -0.00006;
const Deart_1 = 0.00732;
const Dep = 0.00224;

const Dw2_1 = 0.08017;
const Dw3_1 = -0.04317;

const Dw1_2 = -0.03743;
const Dw1_3 = -0.00018865;
const Dw1_4 = -0.00001024;
const Dw2_2 = 0.00470602;
const Dw2_3 = -0.00025213;
const Dw3_2 = -0.00261070;
const Dw3_3 = -0.00010712;

// ── Derived constants ─────────────────────────────────────────────────────

const am = 0.074801329;
const alpha = 0.002571881;
const dtsm = 2 * alpha / (3 * am);
const xa = 2 * alpha / 3;

const w11_rate = 1732559343.73604;  // mean motion in arcsec/cy
const w11 = w11_rate * SEC;          // mean motion in rad/cy

const bp: readonly (readonly [number, number])[] = [
  [0.311079095, -0.103837907],
  [-0.004482398, 0.000668287],
  [-0.001102485, -0.001298072],
  [0.001056062, -0.000178028],
  [0.000050928, -0.000037342],
];

// Angular rate ratios (reference: ytliu0 setup_parameters)
const w21_rate = (14643420.3171 + Dw2_1) * SEC;  // W2 rate in rad/cy
const w31_rate = (-6967919.5383 + Dw3_1) * SEC;   // W3 rate in rad/cy
const x2 = w21_rate / w11;
const x3 = w31_rate / w11;
const y2 = am * bp[0][0] + xa * bp[4][0];
const y3 = am * bp[0][1] + xa * bp[4][1];
const d21 = x2 - y2;
const d22 = w11 * bp[1][0];
const d23 = w11 * bp[2][0];
const d24 = w11 * bp[3][0];
const d25 = y2 / am;
const d31 = x3 - y3;
const d32 = w11 * bp[1][1];
const d33 = w11 * bp[2][1];
const d34 = w11 * bp[3][1];
const d35 = y3 / am;

const Cw2_1 = d21 * Dw1_1 + d25 * Deart_1 + d22 * Dgam + d23 * De + d24 * Dep;
const Cw3_1 = d31 * Dw1_1 + d35 * Deart_1 + d32 * Dgam + d33 * De + d34 * Dep;

// Correction factors for main problem amplitude adjustment
const delnu_nu = (0.55604 + Dw1_1) * SEC / w11;
const dele = (0.01789 + De) * SEC;
const delg = (-0.08066 + Dgam) * SEC;
const delnp_nu = (-0.06424 + Deart_1) * SEC / w11;
const delep = (-0.12879 + Dep) * SEC;

const fB1 = -am * delnu_nu + delnp_nu;
const fB2 = delg;
const fB3 = dele;
const fB4 = delep;
const fB5 = -xa * delnu_nu + dtsm * delnp_nu;
const fA_lon_lat = 1.0;  // for lon/lat, fA = 1.0
const fA_dist = 1.0 - 2.0 / 3.0 * delnu_nu;  // for distance

// Reference radii ratio
const ra0 = 384747.961370173 / 384747.980674318;

// ── mod2pi: normalize to [-PI, PI) ─────────────────────────────────────

function mod2pi(x: number): number {
  return x - TWO_PI * Math.floor((x + PI) / TWO_PI);
}

// ── Argument computation ──────────────────────────────────────────────────

export interface ElpArguments {
  W1: number;  // Mean longitude of Moon
  D: number;   // Mean elongation
  F: number;   // Mean argument of latitude
  L: number;   // Mean anomaly of Moon
  Lp: number;  // Mean anomaly of Sun
  zeta: number;
  Me: number; Ve: number; EM: number; Ma: number;
  Ju: number; Sa: number; Ur: number; Ne: number;
}

export function computeElpArguments(T: number): ElpArguments {
  const T2 = T * T;
  const T3 = T2 * T;
  const T4 = T3 * T;

  // W1: Mean longitude of Moon
  const w10 = (-142 + 18 / 60 + (59.95571 + Dw1_0) / 3600) * DEG;
  const w1_1 = mod2pi((w11_rate + Dw1_1) * T * SEC);
  const w12 = mod2pi((-6.8084 + Dw1_2) * T2 * SEC);
  const w13 = mod2pi((0.006604 + Dw1_3) * T3 * SEC);
  const w14 = mod2pi((-3.169e-5 + Dw1_4) * T4 * SEC);

  // W2: Mean longitude of lunar perigee
  const w20 = (83 + 21 / 60 + (11.67475 + Dw2_0) / 3600) * DEG;
  const w21 = mod2pi((14643420.3171 + Dw2_1 + Cw2_1) * T * SEC);
  const w22 = mod2pi((-38.2631 + Dw2_2) * T2 * SEC);
  const w23 = mod2pi((-0.045047 + Dw2_3) * T3 * SEC);
  const w24 = mod2pi(0.00021301 * T4 * SEC);

  // W3: Mean longitude of lunar ascending node
  const w30 = (125 + 2 / 60 + (40.39816 + Dw3_0) / 3600) * DEG;
  const w31 = mod2pi((-6967919.5383 + Dw3_1 + Cw3_1) * T * SEC);
  const w32 = mod2pi((6.359 + Dw3_2) * T2 * SEC);
  const w33 = mod2pi((0.007625 + Dw3_3) * T3 * SEC);
  const w34 = mod2pi(-3.586e-5 * T4 * SEC);

  // Ea: Mean longitude of Earth-Moon barycenter
  const Ea0 = (100 + 27 / 60 + (59.13885 + Deart_0) / 3600) * DEG;
  const Ea1 = mod2pi((129597742.293 + Deart_1) * T * SEC);
  const Ea2 = mod2pi(-0.0202 * T2 * SEC);
  const Ea3 = mod2pi(9e-6 * T3 * SEC);
  const Ea4 = mod2pi(1.5e-7 * T4 * SEC);

  // pomp: Mean longitude of perihelion of EMB
  const p0 = (102 + 56 / 60 + (14.45766 + Dperi) / 3600) * DEG;
  const p1 = mod2pi(1161.24342 * T * SEC);
  const p2 = mod2pi(0.529265 * T2 * SEC);
  const p3 = mod2pi(-1.1814e-4 * T3 * SEC);
  const p4 = mod2pi(1.1379e-5 * T4 * SEC);

  // Assemble
  const W1 = w10 + w1_1 + w12 + w13 + w14;
  const W2 = w20 + w21 + w22 + w23 + w24;
  const W3 = w30 + w31 + w32 + w33 + w34;
  const Ea = Ea0 + Ea1 + Ea2 + Ea3 + Ea4;
  const pomp = p0 + p1 + p2 + p3 + p4;

  // Planetary mean longitudes
  const Me = (-108 + 15 / 60 + 3.216919 / 3600) * DEG + mod2pi(538101628.66888 * T * SEC);
  const Ve = (-179 + 58 / 60 + 44.758419 / 3600) * DEG + mod2pi(210664136.45777 * T * SEC);
  const EM = (100 + 27 / 60 + 59.13885 / 3600) * DEG + mod2pi(129597742.293 * T * SEC);
  const Ma = (-5 + 26 / 60 + 3.642778 / 3600) * DEG + mod2pi(68905077.65936 * T * SEC);
  const Ju = (34 + 21 / 60 + 5.379392 / 3600) * DEG + mod2pi(10925660.57335 * T * SEC);
  const Sa = (50 + 4 / 60 + 38.902495 / 3600) * DEG + mod2pi(4399609.33632 * T * SEC);
  const Ur = (-46 + 3 / 60 + 4.354234 / 3600) * DEG + mod2pi(1542482.57845 * T * SEC);
  const Ne = (-56 + 20 / 60 + 56.808371 / 3600) * DEG + mod2pi(786547.897 * T * SEC);

  return {
    W1: mod2pi(W1),
    D: mod2pi(W1 - Ea + PI),
    F: mod2pi(W1 - W3),
    L: mod2pi(W1 - W2),
    Lp: mod2pi(Ea - pomp),
    zeta: mod2pi(W1 + 0.02438029560881907 * T),
    Me: mod2pi(Me),
    Ve: mod2pi(Ve),
    EM: mod2pi(EM),
    Ma: mod2pi(Ma),
    Ju: mod2pi(Ju),
    Sa: mod2pi(Sa),
    Ur: mod2pi(Ur),
    Ne: mod2pi(Ne),
  };
}

// ── Series summation ──────────────────────────────────────────────────────

/**
 * Sum main problem series (4 Delaunay multipliers).
 * For lon/lat (isSine=true): sum += A_eff * sin(phase)
 * For distance (isSine=false): sum += A_eff * cos(phase)
 */
function mainSum(
  terms: readonly (readonly number[])[],
  args: ElpArguments,
  isSine: boolean,
  fA: number,
): number {
  const { D, F, L, Lp } = args;
  let sum = 0;
  const trigFn = isSine ? Math.sin : Math.cos;

  for (const t of terms) {
    const phase = t[0] * D + t[1] * F + t[2] * L + t[3] * Lp;
    // Effective amplitude with correction parameters
    const A_eff = fA * t[4] + fB1 * t[5] + fB2 * t[6] + fB3 * t[7] + fB4 * t[8] + fB5 * t[9];
    sum += A_eff * trigFn(phase);
  }

  return sum;
}

/**
 * Sum perturbation series (13 argument multipliers + phase offset).
 * ALL perturbation series use sine.
 */
function pertSum(
  terms: readonly (readonly number[])[],
  args: ElpArguments,
): number {
  const { D, F, L, Lp, Me, Ve, EM, Ma, Ju, Sa, Ur, Ne, zeta } = args;
  let sum = 0;

  for (const t of terms) {
    const phase = t[14] // phase offset
      + t[0] * D + t[1] * F + t[2] * L + t[3] * Lp
      + t[4] * Me + t[5] * Ve + t[6] * EM + t[7] * Ma
      + t[8] * Ju + t[9] * Sa + t[10] * Ur + t[11] * Ne + t[12] * zeta;
    sum += t[13] * Math.sin(phase);
  }

  return sum;
}

// ── Main computation ──────────────────────────────────────────────────────

export interface MoonPosition {
  /** Geocentric ecliptic longitude (radians, mean ecliptic of J2000.0) */
  longitude: number;
  /** Geocentric ecliptic latitude (radians, mean ecliptic of J2000.0) */
  latitude: number;
  /** Geocentric distance (km) */
  distance: number;
}

/**
 * Compute Moon's geocentric position using ELP/MPP02 theory.
 *
 * @param T - Julian centuries from J2000.0 in TDB/TT
 *            T = (JD_TT - 2451545.0) / 36525.0
 * @returns Position in J2000.0 mean ecliptic frame
 */
export function computeMoonPosition(T: number): MoonPosition {
  const args = computeElpArguments(T);

  // ── Main problem sums ──────────────────────────────────────────
  // Units: radians for lon/lat (data files already in radians), km for dist
  const mainLong = mainSum(MAIN_LONG, args, true, fA_lon_lat);  // radians
  const mainLat = mainSum(MAIN_LAT, args, true, fA_lon_lat);    // radians
  const mainDist = mainSum(MAIN_DIST, args, false, fA_dist);    // km

  // ── Perturbation sums ──────────────────────────────────────────
  // Units: radians for lon/lat, km for dist
  const pertLongT0 = pertSum(PERT_LONG_T0, args);
  const pertLongT1 = pertSum(PERT_LONG_T1, args);
  const pertLongT2 = pertSum(PERT_LONG_T2, args);
  const pertLongT3 = pertSum(PERT_LONG_T3, args);
  const pertLatT0 = pertSum(PERT_LAT_T0, args);
  const pertLatT1 = pertSum(PERT_LAT_T1, args);
  const pertLatT2 = pertSum(PERT_LAT_T2, args);
  const pertDistT0 = pertSum(PERT_DIST_T0, args);
  const pertDistT1 = pertSum(PERT_DIST_T1, args);
  const pertDistT2 = pertSum(PERT_DIST_T2, args);
  const pertDistT3 = pertSum(PERT_DIST_T3, args);

  const T2 = T * T;
  const T3 = T2 * T;

  // ── Combine: ecliptic of date ──────────────────────────────────
  // Main problem amplitudes are already in radians (data files from ytliu0)
  const longM = args.W1
    + mainLong
    + pertLongT0 + mod2pi(pertLongT1 * T)
    + mod2pi(pertLongT2 * T2) + mod2pi(pertLongT3 * T3);

  // Latitude: main (radians) + perturbation (radians)
  const latM = mainLat
    + pertLatT0 + mod2pi(pertLatT1 * T)
    + mod2pi(pertLatT2 * T2);

  // Distance: main sum already includes the constant term (~384748 km)
  const r = ra0 * (mainDist
    + pertDistT0 + pertDistT1 * T
    + pertDistT2 * T2 + pertDistT3 * T3);

  // ── Rectangular (ELP computation frame) ──────────────────────────
  const cosLat = Math.cos(latM);
  const x0 = r * Math.cos(longM) * cosLat;
  const y0 = r * Math.sin(longM) * cosLat;
  const z0 = r * Math.sin(latM);

  // ── Precession to J2000.0 mean ecliptic ─────────────────────────
  // The ELP/MPP02 series are computed in an internal frame that
  // requires the Chapront P,Q precession to reach J2000.0.
  const T4 = T3 * T;
  const T5 = T4 * T;

  const P = 0.10180391e-4 * T + 0.47020439e-6 * T2 - 0.5417367e-9 * T3
    - 0.2507948e-11 * T4 + 0.463486e-14 * T5;
  const Q = -0.113469002e-3 * T + 0.12372674e-6 * T2 + 0.12654170e-8 * T3
    - 0.1371808e-11 * T4 - 0.320334e-14 * T5;

  const sq = Math.sqrt(1 - P * P - Q * Q);

  const p11 = 1 - 2 * P * P;
  const p12 = 2 * P * Q;
  const p13 = 2 * P * sq;
  const p21 = 2 * P * Q;
  const p22 = 1 - 2 * Q * Q;
  const p23 = -2 * Q * sq;
  const p31 = -2 * P * sq;
  const p32 = 2 * Q * sq;
  const p33 = 1 - 2 * P * P - 2 * Q * Q;

  const X = p11 * x0 + p12 * y0 + p13 * z0;
  const Y = p21 * x0 + p22 * y0 + p23 * z0;
  const Z = p31 * x0 + p32 * y0 + p33 * z0;

  // ── Extract ecliptic lon/lat from J2000.0 rectangular ──────────
  const dist = Math.sqrt(X * X + Y * Y + Z * Z);
  const longitude = Math.atan2(Y, X);
  const latitude = Math.asin(Z / dist);

  return { longitude, latitude, distance: dist };
}
