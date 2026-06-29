//! New-moon (朔) times via Meeus, *Astronomical Algorithms*, 2nd ed., Ch. 49.
//! Returns the Julian Ephemeris Day (JDE, in TT) of the new moon for lunation
//! `k` (k = 0 → 2000 January 6). Accuracy ~1 minute over −2000…+4000.

use core::f64::consts::PI;

const DEG: f64 = PI / 180.0;

/// JDE (TT) of the new moon for integer lunation number `k`.
#[must_use]
#[allow(clippy::many_single_char_names)]
pub fn new_moon_jde(k: i32) -> f64 {
    let k = f64::from(k);
    let t = k / 1236.85;
    let t2 = t * t;
    let t3 = t2 * t;
    let t4 = t3 * t;

    let mut jde =
        2451550.09766 + 29.530588861 * k + 0.00015437 * t2 - 0.00000015 * t3 + 0.00000000073 * t4;

    let e = 1.0 - 0.002516 * t - 0.0000074 * t2;
    let e2 = e * e;

    let m = (2.5534 + 29.1053567 * k - 0.0000014 * t2 - 0.00000011 * t3) * DEG;
    let mp =
        (201.5643 + 385.81693528 * k + 0.0107582 * t2 + 0.00001238 * t3 - 0.000000058 * t4) * DEG;
    let f =
        (160.7108 + 390.67050284 * k - 0.0016118 * t2 - 0.00000227 * t3 + 0.000000011 * t4) * DEG;
    let omega = (124.7746 - 1.56375588 * k + 0.002068 * t2 + 0.00000215 * t3) * DEG;

    jde += -0.4072 * mp.sin()
        + 0.17241 * e * m.sin()
        + 0.01608 * (2.0 * mp).sin()
        + 0.01039 * (2.0 * f).sin()
        + 0.00739 * e * (mp - m).sin()
        - 0.00514 * e * (mp + m).sin()
        + 0.00208 * e2 * (2.0 * m).sin()
        - 0.00111 * (mp - 2.0 * f).sin()
        - 0.00057 * (mp + 2.0 * f).sin()
        + 0.00056 * e * (2.0 * mp + m).sin()
        - 0.00042 * (3.0 * mp).sin()
        + 0.00042 * e * (m + 2.0 * f).sin()
        + 0.00038 * e * (m - 2.0 * f).sin()
        - 0.00024 * e * (2.0 * mp - m).sin()
        - 0.00017 * omega.sin()
        - 0.00007 * (mp + 2.0 * m).sin()
        + 0.00004 * (2.0 * mp - 2.0 * f).sin()
        + 0.00004 * (3.0 * m).sin()
        + 0.00003 * (mp + m - 2.0 * f).sin()
        + 0.00003 * (2.0 * mp + 2.0 * f).sin()
        - 0.00003 * (mp + m + 2.0 * f).sin()
        + 0.00003 * (mp - m + 2.0 * f).sin()
        - 0.00002 * (mp - m - 2.0 * f).sin()
        - 0.00002 * (3.0 * mp + m).sin()
        + 0.00002 * (4.0 * mp).sin();

    // Planetary arguments (Table 49.c).
    let a = [
        (299.77, 132.8475848, -0.009173, 0.000325),
        (251.88, 92.5186844, 0.0, 0.000165),
        (251.83, 360.30367988, 0.0, 0.000164),
        (349.42, 450.37629756, 0.0, 0.000126),
        (84.66, 966.97899884, 0.0, 0.00011),
        (141.74, 1367.7288924, 0.0, 0.000062),
        (207.14, 35.7255876, 0.0, 0.00006),
        (154.84, 966.89791524, 0.0, 0.000056),
        (34.52, 27.5546248, 0.0, 0.000047),
        (207.19, 1.2282596, 0.0, 0.000042),
        (291.34, 0.8070004, 0.0, 0.00004),
        (161.72, 280.8282784, 0.0, 0.000037),
        (239.56, 3.8721732, 0.0, 0.000035),
        (331.55, 32.02416024, 0.0, 0.000023),
    ];
    for (c0, c1, c2, amp) in a {
        jde += amp * ((c0 + c1 * k + c2 * t2) * DEG).sin();
    }

    jde
}

/// All new-moon JDEs (TT) within the Julian-Day range `[start_jd, end_jd]`.
#[must_use]
pub fn find_new_moons_in_range(start_jd: f64, end_jd: f64) -> Vec<f64> {
    let k_start = ((start_jd - 2451550.1) / 29.530588861).floor() as i32 - 1;
    let k_end = ((end_jd - 2451550.1) / 29.530588861).ceil() as i32 + 1;
    let mut out = Vec::new();
    for k in k_start..=k_end {
        let jde = new_moon_jde(k);
        if jde >= start_jd && jde <= end_jd {
            out.push(jde);
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn k0_is_2000_jan_06() {
        // Corrected JDE of the 2000-01-06 new moon (~18:14 UT) is 2451550.260;
        // 2451550.0977 is only the *mean* phase before Table 49.a corrections.
        assert!((new_moon_jde(0) - 2451550.260).abs() < 0.01);
    }

    #[test]
    fn synodic_spacing() {
        // Consecutive lunations differ by ~29.53 days.
        assert!((new_moon_jde(1) - new_moon_jde(0) - 29.53).abs() < 1.0);
    }

    #[test]
    fn range_returns_sorted_in_bounds() {
        let v = find_new_moons_in_range(2451545.0, 2451545.0 + 60.0);
        assert!(v.len() >= 2);
        assert!(v.windows(2).all(|w| w[0] < w[1]));
        assert!(v.iter().all(|&x| (2451545.0..=2451605.0).contains(&x)));
    }
}
