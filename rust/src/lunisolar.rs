//! Chinese lunisolar calendar — 冬至-anchored month numbering with leap-month
//! (閏月) detection via the 中氣 (zhongqi) rule. Faithful port of the TypeScript
//! `lunisolar-calendar`. All instants are carried as JD(UT); civil dates are
//! Beijing time (UTC+8), matching the authoritative algorithm.

use std::cell::RefCell;
use std::collections::HashMap;

use crate::delta_t::delta_t_for_year;
use crate::julian::{jd_from_ymd, ymd_from_jd};
use crate::new_moon::find_new_moons_in_range;
use crate::solar_terms::{find_solar_term_moment_dt, SOLAR_TERM_LONGITUDES};

/// A Gregorian civil date in Beijing time.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct CivilDate {
    pub year: i32,
    pub month: u32,
    pub day: u32,
}

/// A Chinese lunisolar date.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LunisolarDate {
    pub year: i32,
    pub month: u32,
    pub day: u32,
    pub is_leap_month: bool,
    /// True if the deciding new moon is within the ΔT-prediction uncertainty of
    /// Beijing midnight, so the date could shift by a day under a different but
    /// equally plausible future ΔT model. Always false for ΔT-observed years
    /// (≤ 2050); see `docs/validation.md` "ΔT limit".
    pub boundary_uncertain: bool,
}

/// One month of a lunisolar year: its number, leap flag, Gregorian start date
/// (正月初一 etc., Beijing), and length in days (29 or 30).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LunarMonth {
    pub month_number: u32,
    pub is_leap_month: bool,
    pub start: CivilDate,
    pub days: u32,
    /// True if this month's start new moon is ΔT-uncertain (see [`LunisolarDate`]).
    pub boundary_uncertain: bool,
}

/// 中氣 (zhongqi) indices into `SOLAR_TERM_LONGITUDES` — the 12 mid-month terms.
const ZHONGQI_INDICES: [usize; 12] = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23];
/// 冬至 (winter solstice) index — the month-11 anchor.
const DONGZHI_INDEX: usize = 23;

/// Sequential month numbers between two consecutive month-11 (冬至) anchors.
const SEQ: [u32; 11] = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

fn jde_to_jd_ut(jde: f64, dt: fn(f64) -> f64) -> f64 {
    let year = 2000.0 + (jde - 2451545.0) / 365.25;
    jde - dt(year) / 86400.0
}

/// Espenak–Meeus long-term ΔT parabola — a standard, higher future extrapolation
/// than the default model; used only to size the boundary-uncertainty margin.
fn em_parabola(year: f64) -> f64 {
    let u = (year - 1820.0) / 100.0;
    -20.0 + 32.0 * u * u
}

/// Whether a month-start new moon is close enough to Beijing midnight that a
/// different (plausible) ΔT model would move it to the adjacent day. Zero margin
/// for ΔT-observed years (≤ 2050); beyond, the margin is the gap between the
/// supplied ΔT and the standard long-term parabola.
fn start_is_uncertain(start_jd_ut: f64, dt: fn(f64) -> f64) -> bool {
    let beijing = start_jd_ut + 8.0 / 24.0;
    let year = ymd_from_jd(beijing).0;
    if year <= 2050 {
        return false;
    }
    let sigma_sec = (em_parabola(f64::from(year)) - dt(f64::from(year))).max(0.0);
    let shifted = beijing + 0.5;
    let frac = shifted - shifted.floor();
    let dist_sec = frac.min(1.0 - frac) * 86400.0;
    dist_sec < sigma_sec
}

fn beijing_civil(jd_ut: f64) -> CivilDate {
    let (year, month, day) = ymd_from_jd(jd_ut + 8.0 / 24.0);
    CivilDate { year, month, day }
}

fn civil_num(cd: CivilDate) -> i64 {
    i64::from(cd.year) * 10000 + i64::from(cd.month) * 100 + i64::from(cd.day)
}

fn civil_jd(cd: CivilDate) -> f64 {
    jd_from_ymd(cd.year, cd.month, cd.day)
}

/// Whole days between the Beijing civil dates of two instants.
fn days_between(a_jd_ut: f64, b_jd_ut: f64) -> u32 {
    let a = civil_jd(beijing_civil(a_jd_ut));
    let b = civil_jd(beijing_civil(b_jd_ut));
    (b - a).round() as u32
}

fn zhongqi_falls_in_month(zq_jd: f64, month_start_jd: f64, next_month_jd: f64) -> bool {
    let zq = civil_num(beijing_civil(zq_jd));
    let ms = civil_num(beijing_civil(month_start_jd));
    let nm = civil_num(beijing_civil(next_month_jd));
    zq >= ms && zq < nm
}

/// New-moon instants (JD UT) spanning the given year range, with ±30-day padding.
fn new_moon_jd_uts(start_year: i32, end_year: i32, dt: fn(f64) -> f64) -> Vec<f64> {
    let start_jd = jd_from_ymd(start_year, 1, 1) - 30.0;
    let end_jd = jd_from_ymd(end_year + 1, 2, 28) + 30.0;
    find_new_moons_in_range(start_jd, end_jd)
        .into_iter()
        .map(|jde| jde_to_jd_ut(jde, dt))
        .collect()
}

/// 中氣 moments (term index, JD UT) over the year range, sorted chronologically.
fn zhongqi_moments(start_year: i32, end_year: i32, dt: fn(f64) -> f64) -> Vec<(usize, f64)> {
    let mut moments = Vec::new();
    for y in start_year..=end_year {
        for &idx in &ZHONGQI_INDICES {
            let longitude = SOLAR_TERM_LONGITUDES[idx];
            let start_month = if idx < 2 { 1 } else { (idx / 2 + 1) as u32 };
            if let Some(jd) = find_solar_term_moment_dt(longitude, y, start_month, dt) {
                moments.push((idx, jd));
            }
        }
    }
    moments.sort_by(|a, b| a.1.partial_cmp(&b.1).unwrap_or(core::cmp::Ordering::Equal));
    moments
}

struct MonthSpan {
    start_jd: f64,
    days: u32,
    has_zhongqi: bool,
    has_dongzhi: bool,
}

struct NumberedMonth {
    month_number: u32,
    is_leap_month: bool,
    start_jd: f64,
    days: u32,
}

/// Build a numbered month sequence (冬至-anchor algorithm): months between two
/// consecutive 冬至 (month 11) are numbered 12,1,…,10; if there are 12 (not 11)
/// of them, the first lacking a 中氣 is the leap month.
fn build_month_sequence(new_moons: &[f64], zhongqi: &[(usize, f64)]) -> Vec<NumberedMonth> {
    let mut spans: Vec<MonthSpan> = Vec::new();
    for w in new_moons.windows(2) {
        let (start, end) = (w[0], w[1]);
        let mut has_zhongqi = false;
        let mut has_dongzhi = false;
        for &(index, date) in zhongqi {
            if zhongqi_falls_in_month(date, start, end) {
                has_zhongqi = true;
                if index == DONGZHI_INDEX {
                    has_dongzhi = true;
                }
            }
        }
        spans.push(MonthSpan {
            start_jd: start,
            days: days_between(start, end),
            has_zhongqi,
            has_dongzhi,
        });
    }

    let dongzhi_indices: Vec<usize> = spans
        .iter()
        .enumerate()
        .filter(|(_, s)| s.has_dongzhi)
        .map(|(i, _)| i)
        .collect();

    let mut assignments: Vec<Option<(u32, bool)>> = vec![None; spans.len()];
    for d in 0..dongzhi_indices.len() {
        let m11 = dongzhi_indices[d];
        assignments[m11] = Some((11, false));
        if d + 1 >= dongzhi_indices.len() {
            continue;
        }
        let next_m11 = dongzhi_indices[d + 1];
        assignments[next_m11] = Some((11, false));

        let intermediate = next_m11 - m11 - 1;
        let needs_leap = intermediate > 11;

        let mut seq_idx = 0usize;
        let mut leap_inserted = false;
        for i in (m11 + 1)..next_m11 {
            if needs_leap && !leap_inserted && !spans[i].has_zhongqi {
                let leap_num = if seq_idx == 0 { 11 } else { SEQ[seq_idx - 1] };
                assignments[i] = Some((leap_num, true));
                leap_inserted = true;
            } else {
                if seq_idx < SEQ.len() {
                    assignments[i] = Some((SEQ[seq_idx], false));
                }
                seq_idx += 1;
            }
        }
    }

    spans
        .iter()
        .zip(assignments)
        .filter_map(|(span, a)| {
            a.map(|(month_number, is_leap_month)| NumberedMonth {
                month_number,
                is_leap_month,
                start_jd: span.start_jd,
                days: span.days,
            })
        })
        .collect()
}

thread_local! {
    /// Per-year cache — the conjunction new-moon solve (ELP + VSOP per lunation)
    /// is expensive, and a year is recomputed on every date query without it.
    /// Keyed by `lunar_year`; the result is a pure function of it.
    static MONTHS_CACHE: RefCell<HashMap<i32, Vec<LunarMonth>>> = RefCell::new(HashMap::new());
}

/// Lunar months for the lunisolar year whose 正月 falls in `lunar_year` — 12
/// months, or 13 in a leap year.
///
/// # Panics
/// Panics if month 1 cannot be located for the year (outside the supported
/// astronomical range).
#[must_use]
pub fn lunar_months_for_year(lunar_year: i32) -> Vec<LunarMonth> {
    if let Some(v) = MONTHS_CACHE.with(|c| c.borrow().get(&lunar_year).cloned()) {
        return v;
    }
    let result = compute_lunar_months_for_year(lunar_year, delta_t_for_year);
    MONTHS_CACHE.with(|c| c.borrow_mut().insert(lunar_year, result.clone()));
    result
}

fn compute_lunar_months_for_year(lunar_year: i32, dt: fn(f64) -> f64) -> Vec<LunarMonth> {
    let new_moons = new_moon_jd_uts(lunar_year - 1, lunar_year + 1, dt);
    let zhongqi = zhongqi_moments(lunar_year - 1, lunar_year + 1, dt);
    let sequence = build_month_sequence(&new_moons, &zhongqi);

    let month1_idx = sequence
        .iter()
        .position(|m| {
            m.month_number == 1 && !m.is_leap_month && beijing_civil(m.start_jd).year == lunar_year
        })
        .unwrap_or_else(|| panic!("cannot find month 1 for lunar year {lunar_year}"));

    let mut result = Vec::new();
    for (i, m) in sequence.iter().enumerate().skip(month1_idx) {
        if i > month1_idx && m.month_number == 1 && !m.is_leap_month {
            break;
        }
        result.push(LunarMonth {
            month_number: m.month_number,
            is_leap_month: m.is_leap_month,
            start: beijing_civil(m.start_jd),
            days: m.days,
            boundary_uncertain: start_is_uncertain(m.start_jd, dt),
        });
    }
    result
}

/// The Lunar New Year (正月初一) Gregorian date for `gregorian_year`.
///
/// # Panics
/// Panics if month 1 cannot be located (outside the supported range).
#[must_use]
pub fn lunar_new_year(gregorian_year: i32) -> CivilDate {
    lunar_months_for_year(gregorian_year)
        .into_iter()
        .find(|m| m.month_number == 1 && !m.is_leap_month)
        .unwrap_or_else(|| panic!("cannot find month 1 for lunar year {gregorian_year}"))
        .start
}

/// Convert a Gregorian (Beijing) civil date to its Chinese lunisolar date.
///
/// # Panics
/// Panics if the date cannot be converted (outside the supported range).
#[must_use]
pub fn gregorian_to_lunisolar(date: CivilDate) -> LunisolarDate {
    convert(date, true, delta_t_for_year)
}

/// As [`gregorian_to_lunisolar`], with a caller-supplied ΔT model
/// (decimal year → seconds) — e.g. to match an authority's calendar at a
/// ΔT-uncertain far-future boundary. Bypasses the per-year cache.
///
/// # Panics
/// Panics if the date cannot be converted (outside the supported range).
#[must_use]
pub fn gregorian_to_lunisolar_with(date: CivilDate, dt: fn(f64) -> f64) -> LunisolarDate {
    convert(date, false, dt)
}

fn convert(date: CivilDate, cached: bool, dt: fn(f64) -> f64) -> LunisolarDate {
    let target_jd = civil_jd(date);
    for lunar_year in [date.year, date.year - 1, date.year + 1] {
        let months = if cached {
            lunar_months_for_year(lunar_year)
        } else {
            compute_lunar_months_for_year(lunar_year, dt)
        };
        for m in months.iter().rev() {
            let start_jd = civil_jd(m.start);
            if target_jd >= start_jd {
                let lunar_day = (target_jd - start_jd).round() as i64 + 1;
                if lunar_day >= 1 && lunar_day <= i64::from(m.days) {
                    return LunisolarDate {
                        year: lunar_year,
                        month: m.month_number,
                        day: lunar_day as u32,
                        is_leap_month: m.is_leap_month,
                        boundary_uncertain: m.boundary_uncertain,
                    };
                }
            }
        }
    }
    panic!(
        "cannot convert {}-{}-{} to a lunisolar date",
        date.year, date.month, date.day
    )
}
