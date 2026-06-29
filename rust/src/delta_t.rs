//! ΔT (TT − UT) in seconds. Faithful port of the TypeScript `deltaTForYear`:
//! Espenak & Meeus (2006) polynomials before 2005, `EclipseWise` (Espenak 2014)
//! for 2005–2015, the sxwnl DE440s-fitted cubic table for 2016–2050, and a
//! parabolic extrapolation (jsd = 31) beyond, blended over 100 years.

/// sxwnl cubic ΔT segments (2016–2050): `[startYear, a0, a1, a2, a3]`,
/// ΔT = a0 + a1·t + a2·t² + a3·t³ with t = (y − startYear)/(nextYear − startYear)·10.
#[rustfmt::skip]
const SXWNL_DT: [[f64; 5]; 9] = [
    [2016.0, 68.1024,  0.5456, -0.0542, -0.001172],
    [2020.0, 69.3612,  0.0422, -0.0502,  0.006216],
    [2024.0, 69.1752, -0.0335, -0.0048,  0.000811],
    [2028.0, 69.0206, -0.0275,  0.0055, -0.000014],
    [2032.0, 68.9981,  0.0163,  0.0054,  0.000006],
    [2036.0, 69.1498,  0.0599,  0.0053,  0.000026],
    [2040.0, 69.4751,  0.1035,  0.0051,  0.000046],
    [2044.0, 69.9737,  0.1469,  0.0050,  0.000066],
    [2048.0, 70.6451,  0.1903,  0.0049,  0.000085],
];

const SXWNL_TABLE_END: f64 = 2050.0;
const SXWNL_TABLE_END_DT: f64 = 71.0457;

fn dt_parabolic(y: f64, jsd: f64) -> f64 {
    let dy = (y - 1820.0) / 100.0;
    -20.0 + jsd * dy * dy
}

fn sxwnl_cubic(y: f64) -> f64 {
    let mut seg = SXWNL_DT.len() - 1;
    for i in 0..SXWNL_DT.len() - 1 {
        if y < SXWNL_DT[i + 1][0] {
            seg = i;
            break;
        }
    }
    let [y0, a0, a1, a2, a3] = SXWNL_DT[seg];
    let next_y = if seg < SXWNL_DT.len() - 1 {
        SXWNL_DT[seg + 1][0]
    } else {
        SXWNL_TABLE_END
    };
    let t = (y - y0) / (next_y - y0) * 10.0;
    a0 + a1 * t + a2 * t * t + a3 * t * t * t
}

fn sxwnl_extrapolation(y: f64) -> f64 {
    let jsd = 31.0;
    if y > SXWNL_TABLE_END + 100.0 {
        return dt_parabolic(y, jsd);
    }
    let v = dt_parabolic(y, jsd);
    let dv = dt_parabolic(SXWNL_TABLE_END, jsd) - SXWNL_TABLE_END_DT;
    v - dv * (SXWNL_TABLE_END + 100.0 - y) / 100.0
}

/// ΔT in seconds for a decimal year (TT = UT + ΔT).
#[must_use]
#[allow(clippy::many_single_char_names)]
pub fn delta_t_for_year(y: f64) -> f64 {
    if y < -500.0 {
        let u = (y - 1820.0) / 100.0;
        return -20.0 + 32.0 * u * u;
    }
    if y < 500.0 {
        let u = y / 100.0;
        return 10583.6 - 1014.41 * u + 33.78311 * u.powi(2)
            - 5.952053 * u.powi(3)
            - 0.1798452 * u.powi(4)
            + 0.022174192 * u.powi(5)
            + 0.0090316521 * u.powi(6);
    }
    if y < 1600.0 {
        let u = (y - 1000.0) / 100.0;
        return 1574.2 - 556.01 * u + 71.23472 * u.powi(2) + 0.319781 * u.powi(3)
            - 0.8503463 * u.powi(4)
            - 0.005050998 * u.powi(5)
            + 0.0083572073 * u.powi(6);
    }
    if y < 1700.0 {
        let t = y - 1600.0;
        return 120.0 - 0.9808 * t - 0.01532 * t * t + t * t * t / 7129.0;
    }
    if y < 1800.0 {
        let t = y - 1700.0;
        return 8.83 + 0.1603 * t - 0.0059285 * t * t + 0.00013336 * t * t * t
            - t.powi(4) / 1_174_000.0;
    }
    if y < 1860.0 {
        let t = y - 1800.0;
        return 13.72 - 0.332447 * t + 0.0068612 * t * t + 0.0041116 * t * t * t
            - 0.00037436 * t.powi(4)
            + 0.0000121272 * t.powi(5)
            - 0.0000001699 * t.powi(6)
            + 0.000000000875 * t.powi(7);
    }
    if y < 1900.0 {
        let t = y - 1860.0;
        return 7.62 + 0.5737 * t - 0.251754 * t * t + 0.01680668 * t * t * t
            - 0.0004473624 * t.powi(4)
            + t.powi(5) / 233_174.0;
    }
    if y < 1920.0 {
        let t = y - 1900.0;
        return -2.79 + 1.494119 * t - 0.0598939 * t * t + 0.0061966 * t * t * t
            - 0.000197 * t.powi(4);
    }
    if y < 1941.0 {
        let t = y - 1920.0;
        return 21.20 + 0.84493 * t - 0.076100 * t * t + 0.0020936 * t * t * t;
    }
    if y < 1961.0 {
        let t = y - 1950.0;
        return 29.07 + 0.407 * t - t * t / 233.0 + t * t * t / 2547.0;
    }
    if y < 1986.0 {
        let t = y - 1975.0;
        return 45.45 + 1.067 * t - t * t / 260.0 - t * t * t / 718.0;
    }
    if y < 2005.0 {
        let t = y - 2000.0;
        return 63.86 + 0.3345 * t - 0.060374 * t * t
            + 0.0017275 * t * t * t
            + 0.000651814 * t.powi(4)
            + 0.00002373599 * t.powi(5);
    }
    if y < 2016.0 {
        let t = y - 2005.0;
        return 64.69 + 0.2930 * t;
    }
    if y < SXWNL_TABLE_END {
        return sxwnl_cubic(y);
    }
    sxwnl_extrapolation(y)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn known_values() {
        // 2000.0: polynomial constant term 63.86 s.
        assert!((delta_t_for_year(2000.0) - 63.86).abs() < 0.01);
        // 2016.0: table head 68.1024 s.
        assert!((delta_t_for_year(2016.0) - 68.1024).abs() < 0.01);
        // 1900.0: segment head -2.79 s.
        assert!((delta_t_for_year(1900.0) - (-2.79)).abs() < 0.01);
        // Modern era is ~69 s; sanity band.
        assert!((68.0..72.0).contains(&delta_t_for_year(2024.0)));
    }
}
