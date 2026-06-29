//! Port-fidelity parity: the Rust crate must reproduce the npm/TypeScript engine
//! to floating-point noise, because they share the same model and the same
//! generated coefficient tables.
//!
//! This is a TIER-2 check — it proves the port is *faithful*, NOT that either
//! engine is *correct*. Correctness is established independently by the JPL
//! DE441, new-moon-conjunction, published-almanac, and cnlunar oracles. A loose
//! tolerance here would hide exactly the porting bugs this test exists to catch,
//! so the bands are tight (sub-µ°, sub-metre).
//!
//! Golden data generated from the published npm package by
//! `scripts/gen-npm-golden.mjs`.

use stem_branch::{
    gregorian_to_lunisolar, moon_position, solar_ecliptic_state, solar_term_for_longitude,
    CivilDate,
};

const GOLDEN: &str = include_str!("data/npm_golden.txt");

fn approx(got: f64, want: f64, tol: f64, lineno: usize, what: &str) {
    let d = (got - want).abs();
    assert!(
        d < tol,
        "line {lineno} {what}: got {got}, want {want} (Δ {d:e}, tol {tol:e})"
    );
}

#[test]
fn rust_matches_npm_golden_corpus() {
    let mut checked = 0usize;
    for (i, line) in GOLDEN.lines().enumerate() {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        let f: Vec<&str> = line.split_whitespace().collect();
        match f[0] {
            "solar" => {
                let s = solar_ecliptic_state(f[1].parse().unwrap());
                approx(
                    s.true_longitude_degrees,
                    f[2].parse().unwrap(),
                    1e-7,
                    i,
                    "solar.true",
                );
                approx(
                    s.apparent_longitude_degrees,
                    f[3].parse().unwrap(),
                    1e-7,
                    i,
                    "solar.app",
                );
                approx(s.radius_au, f[4].parse().unwrap(), 1e-9, i, "solar.radius");
            }
            "moon" => {
                let m = moon_position(f[1].parse().unwrap());
                approx(
                    m.longitude_degrees,
                    f[2].parse().unwrap(),
                    1e-7,
                    i,
                    "moon.lon",
                );
                approx(
                    m.latitude_degrees,
                    f[3].parse().unwrap(),
                    1e-7,
                    i,
                    "moon.lat",
                );
                approx(m.distance_km, f[4].parse().unwrap(), 1e-3, i, "moon.dist");
            }
            "lunisolar" => {
                let date = CivilDate {
                    year: f[1].parse().unwrap(),
                    month: f[2].parse().unwrap(),
                    day: f[3].parse().unwrap(),
                };
                let r = gregorian_to_lunisolar(date);
                let want = (
                    f[4].parse::<i32>().unwrap(),
                    f[5].parse::<u32>().unwrap(),
                    f[6].parse::<u32>().unwrap(),
                    f[7] == "1",
                );
                assert_eq!(
                    (r.year, r.month, r.day, r.is_leap_month),
                    want,
                    "line {i}: lunisolar {}-{}-{}",
                    f[1],
                    f[2],
                    f[3]
                );
            }
            "term" => {
                assert_eq!(
                    solar_term_for_longitude(f[1].parse().unwrap()),
                    f[2],
                    "line {i}: term"
                );
            }
            other => panic!("line {i}: unknown record kind {other:?}"),
        }
        checked += 1;
    }
    assert!(
        checked > 500,
        "expected a substantial corpus, got {checked}"
    );
}
