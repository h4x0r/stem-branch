//! Name labels — solar-term names (節氣), Heavenly Stems (天干), Earthly
//! Branches (地支). Values are ported verbatim from the TypeScript source
//! (Traditional Chinese) and index-aligned with `SOLAR_TERM_LONGITUDES`.

use stem_branch::{
    solar_term_for_longitude, EARTHLY_BRANCHES, HEAVENLY_STEMS, SOLAR_TERM_LONGITUDES,
    SOLAR_TERM_NAMES,
};

#[test]
fn solar_term_names_index_aligned_with_longitudes() {
    assert_eq!(SOLAR_TERM_NAMES.len(), 24);
    assert_eq!(SOLAR_TERM_NAMES.len(), SOLAR_TERM_LONGITUDES.len());
    assert_eq!(
        (SOLAR_TERM_NAMES[0], SOLAR_TERM_LONGITUDES[0]),
        ("小寒", 285.0)
    );
    assert_eq!(
        (SOLAR_TERM_NAMES[2], SOLAR_TERM_LONGITUDES[2]),
        ("立春", 315.0)
    );
    assert_eq!(SOLAR_TERM_NAMES[23], "冬至");
    // Traditional, not simplified.
    assert_eq!(SOLAR_TERM_NAMES[7], "穀雨");
    assert_eq!(SOLAR_TERM_NAMES[9], "小滿");
}

#[test]
fn solar_term_for_longitude_lookup() {
    assert_eq!(solar_term_for_longitude(315.0), "立春");
    assert_eq!(solar_term_for_longitude(71.0), "小滿");
    assert_eq!(solar_term_for_longitude(0.0), "春分");
    assert_eq!(solar_term_for_longitude(270.0), "冬至");
    // Just past 小寒 (285°) stays 小寒 until 大寒 (300°).
    assert_eq!(solar_term_for_longitude(286.0), "小寒");
    // Negative / >360 inputs normalize.
    assert_eq!(
        solar_term_for_longitude(-45.0),
        solar_term_for_longitude(315.0)
    );
}

#[test]
fn heavenly_stems_and_earthly_branches() {
    assert_eq!(HEAVENLY_STEMS.len(), 10);
    assert_eq!(EARTHLY_BRANCHES.len(), 12);
    assert_eq!(
        (HEAVENLY_STEMS[0], HEAVENLY_STEMS[6], HEAVENLY_STEMS[9]),
        ("甲", "庚", "癸")
    );
    assert_eq!(
        (
            EARTHLY_BRANCHES[0],
            EARTHLY_BRANCHES[4],
            EARTHLY_BRANCHES[11]
        ),
        ("子", "辰", "亥")
    );
}
