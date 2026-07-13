//! Independent validation of `moon_phase` illumination geometry (tier-1).
//!
//! Two independent oracles, neither authored by us:
//!  1. Meeus, *Astronomical Algorithms* 2e, worked Example 48.a — the Moon at
//!     1992 April 12.0 TD has phase angle i = 69.0756° and illuminated fraction
//!     k = 0.6786. A textbook value + input authored by an independent party.
//!  2. JPL's own new/full-moon instants (`data/jpl_lunar_phases.txt`, the fixture
//!     already used by `jpl_lunar_phase.rs`): illuminated fraction must be ~0 at
//!     new and ~1 at full. JPL supplies the instants, so this is not circular.

use stem_branch::moon_phase;

#[test]
fn meeus_example_48a_phase_angle_and_illumination() {
    // 1992 April 12.0 TD => JDE 2448724.5 (Meeus feeds TD/TT directly).
    let p = moon_phase(2_448_724.5);
    // ELP/MPP02 + VSOP87D vs Meeus' truncated theory: agree to well within these
    // tolerances; a wrong formula would miss by >0.05 (k) / >5° (i).
    assert!(
        (p.illuminated_fraction - 0.6786).abs() < 0.005,
        "illuminated_fraction = {} (expected ~0.6786, Meeus 48.a)",
        p.illuminated_fraction
    );
    assert!(
        (p.phase_angle_deg - 69.0756).abs() < 0.3,
        "phase_angle_deg = {} (expected ~69.0756, Meeus 48.a)",
        p.phase_angle_deg
    );
    assert!((0.0..=360.0).contains(&p.elongation_deg));
}

#[test]
fn illumination_is_near_zero_at_new_and_near_one_at_full() {
    let phases = include_str!("data/jpl_lunar_phases.txt");
    let (mut n_new, mut n_full) = (0u32, 0u32);
    for line in phases.lines() {
        let f: Vec<&str> = line.split_whitespace().collect();
        if f.len() != 2 || f[0].starts_with('#') {
            continue;
        }
        let jde: f64 = f[1].parse().unwrap();
        let p = moon_phase(jde);
        match f[0] {
            "new" => {
                assert!(
                    p.illuminated_fraction < 0.002,
                    "new-moon illuminated_fraction {} at jde {jde}",
                    p.illuminated_fraction
                );
                assert!(!p.waxing || p.elongation_deg < 1.0 || p.elongation_deg > 359.0);
                n_new += 1;
            }
            "full" => {
                assert!(
                    p.illuminated_fraction > 0.998,
                    "full-moon illuminated_fraction {} at jde {jde}",
                    p.illuminated_fraction
                );
                n_full += 1;
            }
            _ => {}
        }
    }
    assert!(n_new > 100 && n_full > 100, "corpus too small");
}

#[test]
fn waxing_flag_tracks_elongation_half() {
    // Quarter-ish sample: 3 days after a known new moon the Moon is waxing
    // (elongation in (0,180)); 3 days after full it is waning. Uses JPL instants
    // as anchors so the direction claim is independent.
    let phases = include_str!("data/jpl_lunar_phases.txt");
    for line in phases.lines() {
        let f: Vec<&str> = line.split_whitespace().collect();
        if f.len() != 2 || f[0].starts_with('#') {
            continue;
        }
        let jde: f64 = f[1].parse().unwrap();
        if f[0] == "new" {
            assert!(
                moon_phase(jde + 3.0).waxing,
                "waxing 3d after new (jde {jde})"
            );
        } else if f[0] == "full" {
            assert!(
                !moon_phase(jde + 3.0).waxing,
                "waning 3d after full (jde {jde})"
            );
        }
    }
}
