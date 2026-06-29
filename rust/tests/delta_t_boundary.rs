//! ΔT-boundary handling: (1) a `boundary_uncertain` flag when the deciding new
//! moon is within the ΔT-prediction uncertainty of Beijing midnight, and (2) a
//! pluggable ΔT provider so a caller can match an authority (e.g. HKO) or any
//! standard model.

use stem_branch::{
    delta_t_for_year, gregorian_to_lunisolar, gregorian_to_lunisolar_with, CivilDate,
};

/// Espenak–Meeus long-term parabola — a standard, *higher* future ΔT than ours.
fn parabola(year: f64) -> f64 {
    let u = (year - 1820.0) / 100.0;
    -20.0 + 32.0 * u * u
}

#[test]
fn far_future_boundary_flagged_present_firm() {
    // 2057's 9th-month new moon is 29 s from Beijing midnight → ΔT-uncertain.
    assert!(
        gregorian_to_lunisolar(CivilDate {
            year: 2057,
            month: 10,
            day: 1
        })
        .boundary_uncertain,
        "2057 near-midnight month should be ΔT-uncertain"
    );
    // ΔT-observed years are firm.
    for (y, m, d) in [(2013, 6, 15), (2018, 2, 16), (2023, 3, 22)] {
        assert!(
            !gregorian_to_lunisolar(CivilDate {
                year: y,
                month: m,
                day: d
            })
            .boundary_uncertain,
            "{y}-{m}-{d} should be firm"
        );
    }
}

#[test]
fn pluggable_delta_t_shifts_the_2057_boundary() {
    // Default (lower ΔT) keeps 2057-09-28 in month 8; the larger long-term
    // parabola moves the new moon to the previous Beijing day → month 9.
    let default = gregorian_to_lunisolar(CivilDate {
        year: 2057,
        month: 9,
        day: 28,
    });
    let alt = gregorian_to_lunisolar_with(
        CivilDate {
            year: 2057,
            month: 9,
            day: 28,
        },
        parabola,
    );
    assert_ne!(
        (default.month, default.day),
        (alt.month, alt.day),
        "a larger ΔT should change the 2057 near-midnight date"
    );
    // Passing the built-in ΔT explicitly reproduces the default path.
    let d = CivilDate {
        year: 2013,
        month: 6,
        day: 15,
    };
    assert_eq!(
        gregorian_to_lunisolar_with(d, delta_t_for_year),
        gregorian_to_lunisolar(d)
    );
}
