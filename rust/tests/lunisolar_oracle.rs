//! Validation of the lunisolar calendar against published Chinese-calendar facts.
//!
//! The expected Lunar New Year dates and leap-month numbers are independently
//! published (e.g. Hong Kong Observatory 香港天文台 Gregorian–Chinese conversion
//! tables; widely tabulated). They are authored outside this project, so these
//! are external checks rather than self-consistent round-trips.

use stem_branch::{
    find_new_moons_in_range, find_solar_term_moment, gregorian_to_lunisolar, lunar_months_for_year,
    lunar_new_year, new_moon_jde, ymd_from_jd, CivilDate,
};

/// Beijing civil date of an instant given as JD(UT).
fn beijing_date(jd_ut: f64) -> CivilDate {
    let (y, m, d) = ymd_from_jd(jd_ut + 8.0 / 24.0);
    CivilDate {
        year: y,
        month: m,
        day: d,
    }
}

#[test]
fn lunar_new_year_matches_published_dates() {
    // 正月初一 Gregorian dates (Beijing), authoritative published values.
    let cases: &[(i32, (i32, u32, u32))] = &[
        (2000, (2000, 2, 5)),
        (2020, (2020, 1, 25)),
        (2021, (2021, 2, 12)),
        (2022, (2022, 2, 1)),
        (2023, (2023, 1, 22)),
        (2024, (2024, 2, 10)),
        (2025, (2025, 1, 29)),
        (2033, (2033, 1, 31)),
    ];
    for &(year, (ey, em, ed)) in cases {
        let lny = lunar_new_year(year);
        assert_eq!(
            (lny.year, lny.month, lny.day),
            (ey, em, ed),
            "Lunar New Year {year}"
        );
    }
}

#[test]
fn leap_months_match_published_record() {
    // (Gregorian lunar year, expected single leap-month number).
    let cases: &[(i32, u32)] = &[(2017, 6), (2020, 4), (2023, 2), (2025, 6)];
    for &(year, expected) in cases {
        let leaps: Vec<u32> = lunar_months_for_year(year)
            .into_iter()
            .filter(|m| m.is_leap_month)
            .map(|m| m.month_number)
            .collect();
        assert_eq!(leaps, vec![expected], "leap month for {year}");
    }
    // Non-leap year has exactly 12 months, none leap.
    let y2022 = lunar_months_for_year(2022);
    assert_eq!(y2022.len(), 12, "2022 is a 12-month year");
    assert!(y2022.iter().all(|m| !m.is_leap_month));
    // Leap year has 13 months.
    assert_eq!(
        lunar_months_for_year(2023).len(),
        13,
        "2023 is a 13-month year"
    );
}

#[test]
fn gregorian_to_lunisolar_known_conversions() {
    // gregorian (y, m, d) -> lunar (year, month, day, is_leap)
    let cases: &[(i32, u32, u32, i32, u32, u32, bool)] = &[
        (2024, 2, 10, 2024, 1, 1, false),
        (2023, 1, 22, 2023, 1, 1, false),
        (2024, 6, 29, 2024, 5, 24, false),
        // 閏二月初一 2023 — the leap month case.
        (2023, 3, 22, 2023, 2, 1, true),
    ];
    for &(y, m, d, ly, lm, ld, leap) in cases {
        let r = gregorian_to_lunisolar(CivilDate {
            year: y,
            month: m,
            day: d,
        });
        assert_eq!(
            (r.year, r.month, r.day, r.is_leap_month),
            (ly, lm, ld, leap),
            "{y}-{m}-{d}"
        );
    }
}

#[test]
fn new_moon_k0_is_2000_jan_06() {
    // Meeus: k = 0 → the 2000-01-06 new moon; corrected JDE ≈ 2451550.260.
    let jde = new_moon_jde(0);
    assert!((jde - 2451550.260).abs() < 0.01, "k=0 JDE {jde}");
    let bj = beijing_date(jde - 64.0 / 86400.0); // rough ΔT≈64s → UT
    assert_eq!((bj.year, bj.month), (2000, 1), "k=0 Beijing month");
}

#[test]
fn winter_solstice_2024_is_dec_21() {
    // 冬至 = solar longitude 270°. 2024 winter solstice falls on Dec 21 (Beijing).
    let jd_ut = find_solar_term_moment(270.0, 2024, 12).expect("found 冬至 2024");
    let bj = beijing_date(jd_ut);
    assert_eq!((bj.year, bj.month, bj.day), (2024, 12, 21), "冬至 2024");
}

#[test]
fn new_moons_in_a_lunation_are_about_29_53_days_apart() {
    let nms = find_new_moons_in_range(2451545.0, 2451545.0 + 365.0);
    assert!(nms.len() >= 12, "at least 12 new moons in a year");
    for w in nms.windows(2) {
        let gap = w[1] - w[0];
        assert!((gap - 29.53).abs() < 1.0, "synodic gap {gap}");
    }
}
