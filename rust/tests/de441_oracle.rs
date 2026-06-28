//! Validation of `solar_ecliptic_state` against JPL Horizons DE441.
//!
//! The reference apparent ecliptic longitudes come from the JPL Horizons system
//! (DE441 ephemeris) — an independent third-party oracle, the same one the
//! TypeScript stem-branch validates against. The expected values are authored by
//! JPL, not by us, so this is an independent check. Provenance: `tests/data/README.md`.

use stembranch::solar_ecliptic_state;

/// `(JD_TT, JPL apparent geocentric ecliptic longitude in degrees)`.
/// Sampled across 1900–2100 CE at full Julian-day precision (round-time and
/// off-round instants) from JPL Horizons DE441 hourly tables.
const CASES: &[(f64, f64)] = &[
    (2415020.5, 280.1533171),   // 1900-Jan-01 00:00 TT
    (2429795.75, 83.9726417),   // 1940-Jun-15 06:00 TT
    (2444505.5, 180.1158349),   // 1980-Sep-23 00:00 TT
    (2451545.0, 280.3681519),   // 2000-Jan-01 12:00 TT  (J2000.0)
    (2460389.625, 359.9947742), // 2024-Mar-20 03:00 TT  (near vernal equinox)
    (2473814.5, 269.8705076),   // 2060-Dec-21 00:00 TT
    (2488254.0, 102.6537510),   // 2100-Jul-04 12:00 TT
];

/// Wrap-aware absolute difference between two longitudes, in degrees `[0, 180]`.
fn wrap_diff_deg(a: f64, b: f64) -> f64 {
    let d = (a - b).rem_euclid(360.0);
    if d > 180.0 {
        360.0 - d
    } else {
        d
    }
}

#[test]
fn apparent_longitude_matches_jpl_de441_within_one_arcsec() {
    const TOL_DEG: f64 = 1.0 / 3600.0; // 1 arcsecond (model residual is < 0.1")
    for &(jd, expected) in CASES {
        let got = solar_ecliptic_state(jd).apparent_longitude_degrees;
        let diff = wrap_diff_deg(got, expected);
        assert!(
            diff < TOL_DEG,
            "JD {jd}: apparent longitude {got:.6}° vs JPL {expected:.6}° (Δ = {:.4}″, tol 1″)",
            diff * 3600.0
        );
    }
}

#[test]
fn longitudes_normalized_and_radius_in_annual_range() {
    for &(jd, _) in CASES {
        let s = solar_ecliptic_state(jd);
        for v in [s.true_longitude_degrees, s.apparent_longitude_degrees] {
            assert!(
                (0.0..360.0).contains(&v),
                "longitude {v}° outside [0, 360) at JD {jd}"
            );
        }
        // Sun–Earth distance: perihelion ~0.983 AU, aphelion ~1.017 AU.
        assert!(
            (0.98..1.02).contains(&s.radius_au),
            "radius {} AU outside annual range at JD {jd}",
            s.radius_au
        );
    }
}
