//! Authoritative real-world validation against the Hong Kong Observatory
//! Gregorian–Lunar Calendar tables (HKO government open data) — the tier-1
//! arbiter a computed library (cnlunar / sxwnl) cannot be. Covers ΔT-known years
//! including the tight 2018 (2.05 min) boundary and leap months 2020/2023.
//! Fixture + provenance: `scripts/gen-hko-fixture.mjs`. Far-future near-midnight
//! boundaries (2057/2097) are excluded — see docs/validation.md "ΔT limit".

use stem_branch::{gregorian_to_lunisolar, CivilDate};

const HKO: &str = include_str!("data/hko_lunisolar.txt");

#[test]
fn matches_hong_kong_observatory() {
    let mut checked = 0usize;
    let mut mismatches: Vec<String> = Vec::new();
    for line in HKO.lines() {
        let f: Vec<&str> = line.split_whitespace().collect();
        if f.first() != Some(&"hko") {
            continue;
        }
        let date = CivilDate {
            year: f[1].parse().unwrap(),
            month: f[2].parse().unwrap(),
            day: f[3].parse().unwrap(),
        };
        let r = gregorian_to_lunisolar(date);
        let want = (
            f[4].parse::<u32>().unwrap(),
            f[5].parse::<u32>().unwrap(),
            f[6] == "1",
        );
        if (r.month, r.day, r.is_leap_month) != want {
            mismatches.push(format!(
                "{}-{}-{}: ours M{}D{} vs HKO M{}D{}",
                f[1], f[2], f[3], r.month, r.day, want.0, want.1
            ));
        }
        checked += 1;
    }
    assert!(checked > 1000, "HKO corpus too small: {checked}");
    assert!(
        mismatches.is_empty(),
        "{} HKO mismatches; first: {:?}",
        mismatches.len(),
        &mismatches[..mismatches.len().min(10)]
    );
}
