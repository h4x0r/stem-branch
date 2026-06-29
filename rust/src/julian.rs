//! Julian Day ↔ Gregorian calendar conversions (Meeus, *Astronomical
//! Algorithms*, 2nd ed., Ch. 7). Gregorian (proleptic before 1582) throughout,
//! which is the convention the upstream TypeScript calendar uses via `Date.UTC`.

/// Julian Day at 00:00 UT of the given Gregorian calendar date.
#[must_use]
pub fn jd_from_ymd(year: i32, month: u32, day: u32) -> f64 {
    let mut y = year;
    let mut m = month as i32;
    if m <= 2 {
        y -= 1;
        m += 12;
    }
    let a = (f64::from(y) / 100.0).floor();
    let b = 2.0 - a + (a / 4.0).floor();
    (365.25 * (f64::from(y) + 4716.0)).floor()
        + (30.6001 * f64::from(m + 1)).floor()
        + f64::from(day)
        + b
        - 1524.5
}

/// Gregorian (year, month, day) of the civil day that contains instant `jd`,
/// using the midnight (`.5`) day boundary.
#[must_use]
pub fn ymd_from_jd(jd: f64) -> (i32, u32, u32) {
    let z = (jd + 0.5).floor();
    let alpha = ((z - 1_867_216.25) / 36524.25).floor();
    let a = z + 1.0 + alpha - (alpha / 4.0).floor();
    let b = a + 1524.0;
    let c = ((b - 122.1) / 365.25).floor();
    let d = (365.25 * c).floor();
    let e = ((b - d) / 30.6001).floor();
    let day = (b - d - (30.6001 * e).floor()).round() as u32;
    let month = if e < 14.0 { e - 1.0 } else { e - 13.0 };
    let year = if month > 2.0 { c - 4716.0 } else { c - 4715.0 };
    (year as i32, month as u32, day)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn jd_known_anchors() {
        // 2000-01-01 00:00 UT = JD 2451544.5; J2000.0 noon = 2451545.0.
        assert!((jd_from_ymd(2000, 1, 1) - 2451544.5).abs() < 1e-9);
        // 1957-10-04 (Sputnik) = JD 2436115.5 at 00:00 (Meeus example range).
        assert!((jd_from_ymd(1970, 1, 1) - 2440587.5).abs() < 1e-9);
    }

    #[test]
    fn round_trip_dates() {
        for &(y, m, d) in &[(2024, 2, 10), (1900, 1, 1), (2033, 1, 31), (1582, 10, 15)] {
            let jd = jd_from_ymd(y, m, d);
            assert_eq!(ymd_from_jd(jd), (y, m, d), "round trip {y}-{m}-{d}");
            // Same date still holds just before the next midnight.
            assert_eq!(ymd_from_jd(jd + 0.999), (y, m, d), "intra-day {y}-{m}-{d}");
        }
    }
}
