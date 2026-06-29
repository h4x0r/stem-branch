//! Independent moon-timing validation against JPL (tier-1): at JPL's own
//! new/full-moon instants, the Moon–Sun apparent-longitude elongation must be
//! ~0° / ~180°. JPL's instants are the independent input (not our `new_moon_jde`,
//! which would be circular), so this genuinely checks `moon_position` +
//! `solar_ecliptic_state` — the Rust mirror of `tests/moon-validation.test.ts`.
//! Fixture: `scripts/gen-jpl-phases-rust.mjs` (from JPL lunar phases).

use stem_branch::{moon_position, solar_ecliptic_state};

const PHASES: &str = include_str!("data/jpl_lunar_phases.txt");

/// Signed Moon−Sun elongation in degrees, wrapped to (-180, 180].
fn elongation(jde: f64) -> f64 {
    let m = moon_position(jde).longitude_degrees;
    let s = solar_ecliptic_state(jde).apparent_longitude_degrees;
    let mut d = (m - s).rem_euclid(360.0);
    if d > 180.0 {
        d -= 360.0;
    }
    d
}

#[test]
fn moon_timing_matches_jpl_phases() {
    let (mut n_new, mut n_full) = (0u32, 0u32);
    let (mut sum_new, mut sum_full) = (0.0f64, 0.0f64);
    for line in PHASES.lines() {
        let f: Vec<&str> = line.split_whitespace().collect();
        if f.len() != 2 || f[0].starts_with('#') {
            continue;
        }
        let jde: f64 = f[1].parse().unwrap();
        let e = elongation(jde).abs();
        match f[0] {
            "new" => {
                assert!(e < 1.0, "new moon: elongation {e}° at jde {jde}");
                sum_new += e;
                n_new += 1;
            }
            "full" => {
                let err = (e - 180.0).abs();
                assert!(err < 1.0, "full moon: elongation {e}° at jde {jde}");
                sum_full += err;
                n_full += 1;
            }
            other => panic!("unknown phase {other:?}"),
        }
    }
    assert!(
        n_new > 100 && n_full > 100,
        "corpus too small: {n_new} new, {n_full} full"
    );
    assert!(
        sum_new / f64::from(n_new) < 0.3,
        "mean new-moon elongation too high"
    );
    assert!(
        sum_full / f64::from(n_full) < 0.3,
        "mean full-moon error too high"
    );
}
