//! Validation of the ELP/MPP02 Moon ephemeris.
//!
//! Primary check is independent: at a new moon (computed from Meeus Ch. 49), the
//! Moon's apparent ecliptic longitude (ELP/MPP02) must equal the Sun's apparent
//! ecliptic longitude (VSOP87D + DE441) — three independently-derived theories
//! agreeing on a conjunction. Parity values are the upstream TypeScript engine's
//! ELP/MPP02 output at fixed instants.

use stem_branch::{
    delta_t_for_year, jd_from_ymd, moon_position, new_moon_jde, solar_ecliptic_state,
};

/// JDE(TT) for 00:00 UT of a civil date, matching `dateToJD_TT`.
fn jde_tt_at_midnight(y: i32, m: u32, d: u32) -> f64 {
    let jd_ut = jd_from_ymd(y, m, d);
    let decimal_year = f64::from(y) + (f64::from(m) - 0.5) / 12.0;
    jd_ut + delta_t_for_year(decimal_year) / 86400.0
}

fn wrap_diff_deg(a: f64, b: f64) -> f64 {
    let d = (a - b).rem_euclid(360.0);
    if d > 180.0 {
        360.0 - d
    } else {
        d
    }
}

#[test]
fn moon_sun_conjunction_at_new_moons() {
    // At each new moon, apparent Moon longitude ≈ apparent Sun longitude.
    for k in [-12, -5, 0, 1, 12, 60] {
        let jde = new_moon_jde(k);
        let moon = moon_position(jde).longitude_degrees;
        let sun = solar_ecliptic_state(jde).apparent_longitude_degrees;
        let diff = wrap_diff_deg(moon, sun);
        assert!(
            diff < 0.02,
            "k={k}: moon {moon:.4}° vs sun {sun:.4}° (Δ {diff:.4}°)"
        );
    }
}

#[test]
fn matches_ts_elpmpp02_reference_values() {
    // (civil date 00:00 UT, lon°, lat°, distance km) from the TS ELP/MPP02 engine.
    let cases: &[(i32, u32, u32, f64, f64, f64)] = &[
        (2000, 1, 1, 217.293477, 5.231311, 400933.20),
        (2024, 1, 25, 116.101986, 4.964651, 399130.64),
        (2025, 6, 11, 256.704005, -4.960896, 400566.14),
    ];
    for &(y, m, d, lon, lat, dist) in cases {
        let p = moon_position(jde_tt_at_midnight(y, m, d));
        assert!(
            wrap_diff_deg(p.longitude_degrees, lon) < 1e-3,
            "{y}-{m}-{d} lon"
        );
        assert!((p.latitude_degrees - lat).abs() < 1e-3, "{y}-{m}-{d} lat");
        assert!((p.distance_km - dist).abs() < 2.0, "{y}-{m}-{d} dist");
    }
}

#[test]
fn physical_bounds() {
    for k in 0..30 {
        let p = moon_position(new_moon_jde(k));
        assert!(
            (356_000.0..=407_000.0).contains(&p.distance_km),
            "distance {}",
            p.distance_km
        );
        assert!(
            p.latitude_degrees.abs() < 5.5,
            "ecliptic latitude {}",
            p.latitude_degrees
        );
        assert!((0.0..360.0).contains(&p.longitude_degrees));
    }
}
