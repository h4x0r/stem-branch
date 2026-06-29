//! Native Rust port of stem-branch's solar ephemeris core.
//!
//! Computes the Sun's geocentric ecliptic state from the full VSOP87D Earth
//! series plus a JPL DE441-fitted correction polynomial and IAU2000B nutation.
//! Input is a Julian Ephemeris Day in Terrestrial Time (JDE/TT); the UTC<->TT /
//! ΔT boundary is the caller's responsibility.
//!
//! This is a faithful translation of the TypeScript `solarEclipticState`; the
//! VSOP87D and IAU2000B coefficient tables are generated from the same source
//! by `scripts/gen-rust-solar-data.mjs`.

#![forbid(unsafe_code)]

mod delta_t;
mod elpmpp02_data;
mod julian;
mod lunisolar;
mod moon;
mod names;
mod new_moon;
mod nutation_data;
mod solar_terms;
mod vsop87d_earth;

pub use delta_t::delta_t_for_year;
pub use julian::{jd_from_ymd, ymd_from_jd};
pub use lunisolar::{
    gregorian_to_lunisolar, lunar_months_for_year, lunar_new_year, CivilDate, LunarMonth,
    LunisolarDate,
};
pub use moon::{moon_position, MoonState};
pub use names::{EARTHLY_BRANCHES, HEAVENLY_STEMS};
pub use new_moon::{find_new_moons_in_range, new_moon_jde};
pub use solar_terms::{
    find_solar_term_moment, solar_term_for_longitude, SOLAR_TERM_LONGITUDES, SOLAR_TERM_NAMES,
};

use core::f64::consts::{PI, TAU};
use nutation_data::{NUT_COEFFS, NUT_OBLIQ};
use vsop87d_earth::{EARTH_L, EARTH_R};

/// Radians per arcsecond (π / 180 / 3600).
pub(crate) const ARCSEC_TO_RAD: f64 = PI / 180.0 / 3600.0;
/// Degrees per radian.
pub(crate) const RAD_TO_DEG: f64 = 180.0 / PI;

/// Geocentric solar ecliptic state at a Julian Ephemeris Day (TT).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct SolarState {
    /// Geocentric ecliptic longitude, mean equinox of date (no nutation/
    /// aberration), in degrees `[0, 360)`.
    pub true_longitude_degrees: f64,
    /// Apparent geocentric ecliptic longitude — `true` plus IAU2000B nutation
    /// in longitude and aberration (true equinox of date), in degrees `[0, 360)`.
    pub apparent_longitude_degrees: f64,
    /// Sun–Earth distance in astronomical units.
    pub radius_au: f64,
}

/// Compute the Sun's geocentric ecliptic state at the given Julian Ephemeris
/// Day in Terrestrial Time.
pub fn solar_ecliptic_state(jde_tt: f64) -> SolarState {
    let tau = (jde_tt - 2451545.0) / 365250.0; // Julian millennia from J2000 (TT)
    let t = (jde_tt - 2451545.0) / 36525.0; // Julian centuries from J2000 (TT)

    // VSOP87D heliocentric longitude (rad) and radius (AU).
    let mut lon = eval_vsop_series(EARTH_L, tau);
    let r = eval_vsop_series(EARTH_R, tau);

    // DE441-fitted even-polynomial correction (arcseconds -> radians). The
    // literal 206264.806 mirrors the TypeScript source.
    let tau2 = tau * tau;
    lon += (-0.106674 - 0.616597 * tau2 + 0.315446 * tau2 * tau2 - 0.050315 * tau2 * tau2 * tau2)
        / 206264.806;

    // Heliocentric -> geocentric (+180°): mean equinox of date before nutation
    // and aberration.
    let geo_true = lon + PI;

    // Apparent place: + IAU2000B nutation in longitude + aberration.
    let (dl, dlp, df, dd, dom) = delaunay_args(t);
    let dpsi = nutation_dpsi(dl, dlp, df, dd, dom, t);
    let apparent = geo_true + dpsi * ARCSEC_TO_RAD + (-20.4898 / r) * ARCSEC_TO_RAD;

    SolarState {
        true_longitude_degrees: normalize_radians(geo_true) * RAD_TO_DEG,
        apparent_longitude_degrees: normalize_radians(apparent) * RAD_TO_DEG,
        radius_au: r,
    }
}

/// Evaluate a VSOP87 series: a sum over powers of `tau`, each power weighting a
/// sum of `A * cos(B + C * tau)` terms.
fn eval_vsop_series(series: &[&[[f64; 3]]], tau: f64) -> f64 {
    let mut result = 0.0;
    let mut tau_pow = 1.0;
    for terms in series {
        let mut sum = 0.0;
        for term in *terms {
            sum += term[0] * (term[1] + term[2] * tau).cos();
        }
        result += sum * tau_pow;
        tau_pow *= tau;
    }
    result
}

/// The five Delaunay fundamental arguments (radians) at Julian century `t` (TT).
/// Returns `(l, l', F, D, Ω)`. Source: IERS Conventions (2010), Table 5.2a.
pub(crate) fn delaunay_args(t: f64) -> (f64, f64, f64, f64, f64) {
    let t2 = t * t;
    let t3 = t2 * t;
    let t4 = t3 * t;
    // `% 1296000.0` (arcseconds in 360°) reduces each argument; the f64 `%`
    // operator matches JavaScript's truncated remainder for a faithful port.
    let l = ((485868.249036 + 1717915923.2178 * t + 31.8792 * t2 + 0.051635 * t3
        - 0.00024470 * t4)
        % 1296000.0)
        * ARCSEC_TO_RAD;
    let lp = ((1287104.79305 + 129596581.0481 * t - 0.5532 * t2 + 0.000136 * t3 - 0.00001149 * t4)
        % 1296000.0)
        * ARCSEC_TO_RAD;
    let f = ((335779.526232 + 1739527262.8478 * t - 12.7512 * t2 - 0.001037 * t3
        + 0.00000417 * t4)
        % 1296000.0)
        * ARCSEC_TO_RAD;
    let d = ((1072260.70369 + 1602961601.2090 * t - 6.3706 * t2 + 0.006593 * t3 - 0.00003169 * t4)
        % 1296000.0)
        * ARCSEC_TO_RAD;
    let om = ((450160.398036 - 6962890.5431 * t + 7.4722 * t2 + 0.007702 * t3 - 0.00005939 * t4)
        % 1296000.0)
        * ARCSEC_TO_RAD;
    (l, lp, f, d, om)
}

/// Nutation in longitude (Δψ) in arcseconds, IAU2000B (77 lunisolar terms).
pub(crate) fn nutation_dpsi(l: f64, lp: f64, f: f64, d: f64, om: f64, t: f64) -> f64 {
    let mut dpsi = 0.0;
    for row in NUT_COEFFS {
        let arg = row[0] * l + row[1] * lp + row[2] * f + row[3] * d + row[4] * om;
        dpsi += (row[5] + row[6] * t) * arg.sin();
    }
    // 0.1 microarcseconds -> arcseconds.
    dpsi / 1e7
}

/// Nutation in obliquity (Δε) in arcseconds, IAU2000B (parallel to `NUT_COEFFS`).
pub(crate) fn nutation_deps(l: f64, lp: f64, f: f64, d: f64, om: f64, t: f64) -> f64 {
    let mut deps = 0.0;
    for (row, obliq) in NUT_COEFFS.iter().zip(NUT_OBLIQ) {
        let arg = row[0] * l + row[1] * lp + row[2] * f + row[3] * d + row[4] * om;
        deps += (obliq[0] + obliq[1] * t) * arg.cos();
    }
    // 0.1 microarcseconds -> arcseconds.
    deps / 1e7
}

/// Normalize an angle in radians to `[0, 2π)`.
pub(crate) fn normalize_radians(rad: f64) -> f64 {
    ((rad % TAU) + TAU) % TAU
}
