//! ELP/MPP02 Moon ephemeris ("ELP revisited", Chapront & Francou 2003; parameter
//! set corr=1, fitted to DE405/DE406). Faithful port of the TypeScript `elpmpp02`
//! computation and the `getMoonPosition` wrapper. The coefficient tables live in
//! the generated `elpmpp02_data.rs`.

use core::f64::consts::PI;

use crate::elpmpp02_data::{
    MAIN_DIST, MAIN_LAT, MAIN_LONG, PERT_DIST_T0, PERT_DIST_T1, PERT_DIST_T2, PERT_DIST_T3,
    PERT_LAT_T0, PERT_LAT_T1, PERT_LAT_T2, PERT_LONG_T0, PERT_LONG_T1, PERT_LONG_T2, PERT_LONG_T3,
};
use crate::{
    delaunay_args, normalize_radians, nutation_deps, nutation_dpsi, ARCSEC_TO_RAD, RAD_TO_DEG,
};

const TWO_PI: f64 = 2.0 * PI;
const DEG: f64 = PI / 180.0;
/// Arcseconds to radians (used for argument construction).
const SEC: f64 = PI / 648000.0;

// ── Correction parameters (corr=1) ────────────────────────────────────────
const DW1_0: f64 = -0.07008;
const DW2_0: f64 = 0.20794;
const DW3_0: f64 = -0.07215;
const DEART_0: f64 = -0.00033;
const DPERI: f64 = -0.00749;
const DW1_1: f64 = -0.35106;
const DGAM: f64 = 0.00085;
const DE: f64 = -0.00006;
const DEART_1: f64 = 0.00732;
const DEP: f64 = 0.00224;
const DW2_1: f64 = 0.08017;
const DW3_1: f64 = -0.04317;
const DW1_2: f64 = -0.03743;
const DW1_3: f64 = -0.00018865;
const DW1_4: f64 = -0.00001024;
const DW2_2: f64 = 0.00470602;
const DW2_3: f64 = -0.00025213;
const DW3_2: f64 = -0.00261070;
const DW3_3: f64 = -0.00010712;

// ── Derived constants ──────────────────────────────────────────────────────
const AM: f64 = 0.074801329;
const ALPHA: f64 = 0.002571881;
const DTSM: f64 = 2.0 * ALPHA / (3.0 * AM);
const XA: f64 = 2.0 * ALPHA / 3.0;
const W11_RATE: f64 = 1732559343.73604;
const W11: f64 = W11_RATE * SEC;
const BP: [[f64; 2]; 5] = [
    [0.311079095, -0.103837907],
    [-0.004482398, 0.000668287],
    [-0.001102485, -0.001298072],
    [0.001056062, -0.000178028],
    [0.000050928, -0.000037342],
];
const W21_RATE: f64 = (14643420.3171 + DW2_1) * SEC;
const W31_RATE: f64 = (-6967919.5383 + DW3_1) * SEC;
const X2: f64 = W21_RATE / W11;
const X3: f64 = W31_RATE / W11;
const Y2: f64 = AM * BP[0][0] + XA * BP[4][0];
const Y3: f64 = AM * BP[0][1] + XA * BP[4][1];
const D21: f64 = X2 - Y2;
const D22: f64 = W11 * BP[1][0];
const D23: f64 = W11 * BP[2][0];
const D24: f64 = W11 * BP[3][0];
const D25: f64 = Y2 / AM;
const D31: f64 = X3 - Y3;
const D32: f64 = W11 * BP[1][1];
const D33: f64 = W11 * BP[2][1];
const D34: f64 = W11 * BP[3][1];
const D35: f64 = Y3 / AM;
const CW2_1: f64 = D21 * DW1_1 + D25 * DEART_1 + D22 * DGAM + D23 * DE + D24 * DEP;
const CW3_1: f64 = D31 * DW1_1 + D35 * DEART_1 + D32 * DGAM + D33 * DE + D34 * DEP;
const DELNU_NU: f64 = (0.55604 + DW1_1) * SEC / W11;
const DELE: f64 = (0.01789 + DE) * SEC;
const DELG: f64 = (-0.08066 + DGAM) * SEC;
const DELNP_NU: f64 = (-0.06424 + DEART_1) * SEC / W11;
const DELEP: f64 = (-0.12879 + DEP) * SEC;
const FB1: f64 = -AM * DELNU_NU + DELNP_NU;
const FB2: f64 = DELG;
const FB3: f64 = DELE;
const FB4: f64 = DELEP;
const FB5: f64 = -XA * DELNU_NU + DTSM * DELNP_NU;
const FA_DIST: f64 = 1.0 - 2.0 / 3.0 * DELNU_NU;
const RA0: f64 = 384747.961370173 / 384747.980674318;

fn mod2pi(x: f64) -> f64 {
    x - TWO_PI * ((x + PI) / TWO_PI).floor()
}

struct ElpArguments {
    w1: f64,
    d: f64,
    f: f64,
    l: f64,
    lp: f64,
    zeta: f64,
    me: f64,
    ve: f64,
    em: f64,
    ma: f64,
    ju: f64,
    sa: f64,
    ur: f64,
    ne: f64,
}

fn compute_elp_arguments(t: f64) -> ElpArguments {
    let t2 = t * t;
    let t3 = t2 * t;
    let t4 = t3 * t;

    let w10 = (-142.0 + 18.0 / 60.0 + (59.95571 + DW1_0) / 3600.0) * DEG;
    let w1_1 = mod2pi((W11_RATE + DW1_1) * t * SEC);
    let w12 = mod2pi((-6.8084 + DW1_2) * t2 * SEC);
    let w13 = mod2pi((0.006604 + DW1_3) * t3 * SEC);
    let w14 = mod2pi((-3.169e-5 + DW1_4) * t4 * SEC);

    let w20 = (83.0 + 21.0 / 60.0 + (11.67475 + DW2_0) / 3600.0) * DEG;
    let w21 = mod2pi((14643420.3171 + DW2_1 + CW2_1) * t * SEC);
    let w22 = mod2pi((-38.2631 + DW2_2) * t2 * SEC);
    let w23 = mod2pi((-0.045047 + DW2_3) * t3 * SEC);
    let w24 = mod2pi(0.00021301 * t4 * SEC);

    let w30 = (125.0 + 2.0 / 60.0 + (40.39816 + DW3_0) / 3600.0) * DEG;
    let w31 = mod2pi((-6967919.5383 + DW3_1 + CW3_1) * t * SEC);
    let w32 = mod2pi((6.359 + DW3_2) * t2 * SEC);
    let w33 = mod2pi((0.007625 + DW3_3) * t3 * SEC);
    let w34 = mod2pi(-3.586e-5 * t4 * SEC);

    let ea0 = (100.0 + 27.0 / 60.0 + (59.13885 + DEART_0) / 3600.0) * DEG;
    let ea1 = mod2pi((129597742.293 + DEART_1) * t * SEC);
    let ea2 = mod2pi(-0.0202 * t2 * SEC);
    let ea3 = mod2pi(9e-6 * t3 * SEC);
    let ea4 = mod2pi(1.5e-7 * t4 * SEC);

    let p0 = (102.0 + 56.0 / 60.0 + (14.45766 + DPERI) / 3600.0) * DEG;
    let p1 = mod2pi(1161.24342 * t * SEC);
    let p2 = mod2pi(0.529265 * t2 * SEC);
    let p3 = mod2pi(-1.1814e-4 * t3 * SEC);
    let p4 = mod2pi(1.1379e-5 * t4 * SEC);

    let w1 = w10 + w1_1 + w12 + w13 + w14;
    let w2 = w20 + w21 + w22 + w23 + w24;
    let w3 = w30 + w31 + w32 + w33 + w34;
    let ea = ea0 + ea1 + ea2 + ea3 + ea4;
    let pomp = p0 + p1 + p2 + p3 + p4;

    let me = (-108.0 + 15.0 / 60.0 + 3.216919 / 3600.0) * DEG + mod2pi(538101628.66888 * t * SEC);
    let ve = (-179.0 + 58.0 / 60.0 + 44.758419 / 3600.0) * DEG + mod2pi(210664136.45777 * t * SEC);
    let em = (100.0 + 27.0 / 60.0 + 59.13885 / 3600.0) * DEG + mod2pi(129597742.293 * t * SEC);
    let ma = (-5.0 + 26.0 / 60.0 + 3.642778 / 3600.0) * DEG + mod2pi(68905077.65936 * t * SEC);
    let ju = (34.0 + 21.0 / 60.0 + 5.379392 / 3600.0) * DEG + mod2pi(10925660.57335 * t * SEC);
    let sa = (50.0 + 4.0 / 60.0 + 38.902495 / 3600.0) * DEG + mod2pi(4399609.33632 * t * SEC);
    let ur = (-46.0 + 3.0 / 60.0 + 4.354234 / 3600.0) * DEG + mod2pi(1542482.57845 * t * SEC);
    let ne = (-56.0 + 20.0 / 60.0 + 56.808371 / 3600.0) * DEG + mod2pi(786547.897 * t * SEC);

    ElpArguments {
        w1: mod2pi(w1),
        d: mod2pi(w1 - ea + PI),
        f: mod2pi(w1 - w3),
        l: mod2pi(w1 - w2),
        lp: mod2pi(ea - pomp),
        zeta: mod2pi(w1 + 0.02438029560881907 * t),
        me: mod2pi(me),
        ve: mod2pi(ve),
        em: mod2pi(em),
        ma: mod2pi(ma),
        ju: mod2pi(ju),
        sa: mod2pi(sa),
        ur: mod2pi(ur),
        ne: mod2pi(ne),
    }
}

/// Main-problem series (4 Delaunay multipliers + amplitude-correction columns).
fn main_sum(terms: &[[f64; 10]], args: &ElpArguments, is_sine: bool, fa: f64) -> f64 {
    let mut sum = 0.0;
    for t in terms {
        let phase = t[0] * args.d + t[1] * args.f + t[2] * args.l + t[3] * args.lp;
        let a_eff = fa * t[4] + FB1 * t[5] + FB2 * t[6] + FB3 * t[7] + FB4 * t[8] + FB5 * t[9];
        sum += a_eff * if is_sine { phase.sin() } else { phase.cos() };
    }
    sum
}

/// Perturbation series (13 argument multipliers + amplitude + phase offset).
fn pert_sum(terms: &[[f64; 15]], args: &ElpArguments) -> f64 {
    let mut sum = 0.0;
    for t in terms {
        let phase = t[14]
            + t[0] * args.d
            + t[1] * args.f
            + t[2] * args.l
            + t[3] * args.lp
            + t[4] * args.me
            + t[5] * args.ve
            + t[6] * args.em
            + t[7] * args.ma
            + t[8] * args.ju
            + t[9] * args.sa
            + t[10] * args.ur
            + t[11] * args.ne
            + t[12] * args.zeta;
        sum += t[13] * phase.sin();
    }
    sum
}

/// Geocentric ecliptic position (longitude rad, latitude rad, distance km) in
/// the J2000.0 mean-ecliptic frame.
fn compute_moon_position(t: f64) -> (f64, f64, f64) {
    let args = compute_elp_arguments(t);

    let main_long = main_sum(MAIN_LONG, &args, true, 1.0);
    let main_lat = main_sum(MAIN_LAT, &args, true, 1.0);
    let main_dist = main_sum(MAIN_DIST, &args, false, FA_DIST);

    let pl0 = pert_sum(PERT_LONG_T0, &args);
    let pl1 = pert_sum(PERT_LONG_T1, &args);
    let pl2 = pert_sum(PERT_LONG_T2, &args);
    let pl3 = pert_sum(PERT_LONG_T3, &args);
    let pb0 = pert_sum(PERT_LAT_T0, &args);
    let pb1 = pert_sum(PERT_LAT_T1, &args);
    let pb2 = pert_sum(PERT_LAT_T2, &args);
    let pd0 = pert_sum(PERT_DIST_T0, &args);
    let pd1 = pert_sum(PERT_DIST_T1, &args);
    let pd2 = pert_sum(PERT_DIST_T2, &args);
    let pd3 = pert_sum(PERT_DIST_T3, &args);

    let t2 = t * t;
    let t3 = t2 * t;

    let long_m = args.w1 + main_long + pl0 + mod2pi(pl1 * t) + mod2pi(pl2 * t2) + mod2pi(pl3 * t3);
    let lat_m = main_lat + pb0 + mod2pi(pb1 * t) + mod2pi(pb2 * t2);
    let r = RA0 * (main_dist + pd0 + pd1 * t + pd2 * t2 + pd3 * t3);

    // Rectangular in the ELP computation frame.
    let cos_lat = lat_m.cos();
    let x0 = r * long_m.cos() * cos_lat;
    let y0 = r * long_m.sin() * cos_lat;
    let z0 = r * lat_m.sin();

    // Chapront P,Q precession to the J2000.0 mean ecliptic.
    let t4 = t3 * t;
    let t5 = t4 * t;
    let p = 0.10180391e-4 * t + 0.47020439e-6 * t2 - 0.5417367e-9 * t3 - 0.2507948e-11 * t4
        + 0.463486e-14 * t5;
    let q = -0.113469002e-3 * t + 0.12372674e-6 * t2 + 0.12654170e-8 * t3
        - 0.1371808e-11 * t4
        - 0.320334e-14 * t5;
    let sq = (1.0 - p * p - q * q).sqrt();
    let p11 = 1.0 - 2.0 * p * p;
    let p12 = 2.0 * p * q;
    let p13 = 2.0 * p * sq;
    let p21 = 2.0 * p * q;
    let p22 = 1.0 - 2.0 * q * q;
    let p23 = -2.0 * q * sq;
    let p31 = -2.0 * p * sq;
    let p32 = 2.0 * q * sq;
    let p33 = 1.0 - 2.0 * p * p - 2.0 * q * q;

    let x = p11 * x0 + p12 * y0 + p13 * z0;
    let y = p21 * x0 + p22 * y0 + p23 * z0;
    let z = p31 * x0 + p32 * y0 + p33 * z0;

    let dist = (x * x + y * y + z * z).sqrt();
    let longitude = y.atan2(x);
    let latitude = (z / dist).asin();
    (longitude, latitude, dist)
}

fn precession_in_longitude(t: f64) -> f64 {
    let t2 = t * t;
    5028.796195 * t + 1.1054348 * t2 - 0.00007964 * t2 * t
}

fn mean_obliquity(t: f64) -> f64 {
    let t2 = t * t;
    (84381.448 - 46.8150 * t - 0.00059 * t2 + 0.001813 * t2 * t) * ARCSEC_TO_RAD
}

fn true_obliquity(t: f64) -> f64 {
    let (l, lp, f, d, om) = delaunay_args(t);
    mean_obliquity(t) + nutation_deps(l, lp, f, d, om, t) * ARCSEC_TO_RAD
}

fn ecliptic_to_equatorial(lambda: f64, beta: f64, eps: f64) -> (f64, f64) {
    let (sin_lam, cos_lam) = lambda.sin_cos();
    let (sin_beta, cos_beta) = beta.sin_cos();
    let (sin_eps, cos_eps) = eps.sin_cos();
    let ra = (sin_lam * cos_eps - sin_beta / cos_beta * sin_eps).atan2(cos_lam);
    let dec = (sin_beta * cos_eps + cos_beta * sin_eps * sin_lam).asin();
    (ra, dec)
}

/// Apparent geocentric position of the Moon at a Julian Ephemeris Day (TT):
/// ELP/MPP02 geometric place, precessed to the ecliptic of date and corrected
/// for nutation in longitude, then resolved to equatorial coordinates.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct MoonState {
    /// Apparent ecliptic longitude of date, degrees `[0, 360)`.
    pub longitude_degrees: f64,
    /// Ecliptic latitude, degrees.
    pub latitude_degrees: f64,
    /// Geocentric distance, kilometres.
    pub distance_km: f64,
    /// Apparent right ascension, degrees `[0, 360)`.
    pub ra_degrees: f64,
    /// Apparent declination, degrees.
    pub dec_degrees: f64,
}

/// Compute the Moon's apparent geocentric position at the given Julian Ephemeris
/// Day in Terrestrial Time.
#[must_use]
pub fn moon_position(jde_tt: f64) -> MoonState {
    let t = (jde_tt - 2451545.0) / 36525.0;
    let (geo_lon, lat, dist) = compute_moon_position(t);

    let p_a = precession_in_longitude(t);
    let (l, lp, f, d, om) = delaunay_args(t);
    let dpsi = nutation_dpsi(l, lp, f, d, om, t);
    let lon = normalize_radians(geo_lon + (p_a + dpsi) * ARCSEC_TO_RAD);

    let eps = true_obliquity(t);
    let (ra, dec) = ecliptic_to_equatorial(lon, lat, eps);

    MoonState {
        longitude_degrees: (lon * RAD_TO_DEG).rem_euclid(360.0),
        latitude_degrees: lat * RAD_TO_DEG,
        distance_km: dist,
        ra_degrees: (ra * RAD_TO_DEG).rem_euclid(360.0),
        dec_degrees: dec * RAD_TO_DEG,
    }
}
