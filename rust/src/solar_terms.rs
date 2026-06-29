//! The 24 solar terms (二十四節氣) and the inverse solver that finds the instant
//! the Sun reaches a target apparent ecliptic longitude. Faithful port of the
//! TypeScript `solar-terms` + `findSunLongitudeMoment`.

use crate::delta_t::delta_t_for_year;
use crate::julian::{jd_from_ymd, ymd_from_jd};
use crate::solar_ecliptic_state;

/// Apparent ecliptic longitude (degrees) for each term; index 0 = 小寒 at 285°.
pub const SOLAR_TERM_LONGITUDES: [f64; 24] = [
    285.0, 300.0, 315.0, 330.0, 345.0, 0.0, 15.0, 30.0, 45.0, 60.0, 75.0, 90.0, 105.0, 120.0,
    135.0, 150.0, 165.0, 180.0, 195.0, 210.0, 225.0, 240.0, 255.0, 270.0,
];

/// Traditional-Chinese names of the 24 solar terms, index-aligned with
/// [`SOLAR_TERM_LONGITUDES`] (index 0 = 小寒 @ 285°). Ported verbatim from the
/// TypeScript `SOLAR_TERM_NAMES` (`src/solar-terms.ts`).
#[rustfmt::skip]
pub const SOLAR_TERM_NAMES: [&str; 24] = [
    "小寒", "大寒", "立春", "雨水", "驚蟄", "春分", "清明", "穀雨", "立夏", "小滿", "芒種", "夏至",
    "小暑", "大暑", "立秋", "處暑", "白露", "秋分", "寒露", "霜降", "立冬", "小雪", "大雪", "冬至",
];

/// The solar term in effect at apparent ecliptic longitude `deg` — the term whose
/// longitude is the greatest one at or before `deg` (circular). Terms sit every
/// 15° starting from `SOLAR_TERM_LONGITUDES[0]` (小寒, 285°). Inputs are
/// normalized, so negative or `>360` longitudes are accepted.
#[must_use]
pub fn solar_term_for_longitude(deg: f64) -> &'static str {
    let idx = ((deg - SOLAR_TERM_LONGITUDES[0]).rem_euclid(360.0) / 15.0).floor() as usize % 24;
    SOLAR_TERM_NAMES[idx]
}

fn normalize_degrees(d: f64) -> f64 {
    d.rem_euclid(360.0)
}

/// True if the Sun's longitude crosses `target` while moving from `lon1` to
/// `lon2` (forward arc), matching the TS `crossesTarget`.
fn crosses_target(lon1: f64, lon2: f64, target: f64) -> bool {
    let lon1 = normalize_degrees(lon1);
    let lon2 = normalize_degrees(lon2);
    let target = normalize_degrees(target);
    let forward = normalize_degrees(lon2 - lon1);
    if forward > 180.0 {
        return false;
    }
    let to_target = normalize_degrees(target - lon1);
    to_target <= forward
}

/// Apparent solar ecliptic longitude (degrees) as a function of civil time
/// expressed as JD(UT); converts UT→TT via ΔT exactly as `dateToJD_TT` does.
fn apparent_longitude_ut(jd_ut: f64) -> f64 {
    let (y, m, _) = ymd_from_jd(jd_ut);
    let decimal_year = f64::from(y) + (f64::from(m) - 0.5) / 12.0;
    let jd_tt = jd_ut + delta_t_for_year(decimal_year) / 86400.0;
    solar_ecliptic_state(jd_tt).apparent_longitude_degrees
}

/// Find the JD(UT) at which the Sun reaches `target_longitude`, scanning forward
/// from `start_jd_ut` for up to `search_days`. Returns `None` if no crossing is
/// found in the window. Resolves to ~1 second.
#[must_use]
pub fn find_sun_longitude_moment(
    target_longitude: f64,
    start_jd_ut: f64,
    search_days: u32,
) -> Option<f64> {
    let target = normalize_degrees(target_longitude);
    let mut prev_lon = apparent_longitude_ut(start_jd_ut);
    let mut bracket: Option<(f64, f64)> = None;
    for d in 1..=search_days {
        let current = start_jd_ut + f64::from(d);
        let current_lon = apparent_longitude_ut(current);
        if crosses_target(prev_lon, current_lon, target) {
            bracket = Some((start_jd_ut + f64::from(d - 1), current));
            break;
        }
        prev_lon = current_lon;
    }
    let (mut lo, mut hi) = bracket?;
    let one_second = 1.0 / 86400.0;
    while hi - lo > one_second {
        let mid = lo + (hi - lo) / 2.0;
        if crosses_target(
            apparent_longitude_ut(lo),
            apparent_longitude_ut(mid),
            target,
        ) {
            hi = mid;
        } else {
            lo = mid;
        }
    }
    Some(lo + (hi - lo) / 2.0)
}

/// Find the JD(UT) of the solar term at `target_longitude` in `year`, searching
/// from the first of `start_month`. Returns `None` if not found in 120 days.
#[must_use]
pub fn find_solar_term_moment(target_longitude: f64, year: i32, start_month: u32) -> Option<f64> {
    let start = jd_from_ymd(year, start_month, 1);
    find_sun_longitude_moment(target_longitude, start, 120)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::julian::ymd_from_jd;

    fn beijing(jd_ut: f64) -> (i32, u32, u32) {
        ymd_from_jd(jd_ut + 8.0 / 24.0)
    }

    #[test]
    fn winter_solstice_and_spring_start() {
        // 冬至 270° (Beijing): 2024-12-21, 2023-12-22.
        assert_eq!(
            beijing(find_solar_term_moment(270.0, 2024, 12).unwrap()),
            (2024, 12, 21)
        );
        assert_eq!(
            beijing(find_solar_term_moment(270.0, 2023, 12).unwrap()),
            (2023, 12, 22)
        );
        // 立春 315° (Beijing): 2024-02-04.
        assert_eq!(
            beijing(find_solar_term_moment(315.0, 2024, 1).unwrap()),
            (2024, 2, 4)
        );
    }

    #[test]
    fn no_crossing_returns_none() {
        // 270° will not occur in the few days after Jan 1.
        assert!(find_sun_longitude_moment(270.0, jd_from_ymd(2024, 1, 1), 3).is_none());
    }
}
