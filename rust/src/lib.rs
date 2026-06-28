//! Native Rust port of stem-branch's solar ephemeris core.
//!
//! Computes the Sun's geocentric ecliptic state from the full VSOP87D Earth
//! series plus a JPL DE441-fitted correction polynomial and IAU2000B nutation.
//! Input is a Julian Ephemeris Day in Terrestrial Time (JDE/TT); the UTC<->TT /
//! ΔT boundary is the caller's responsibility.

/// Geocentric solar ecliptic state at a Julian Ephemeris Day (TT).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct SolarState {
    /// Geocentric ecliptic longitude, mean equinox of date (no nutation/
    /// aberration), in degrees `[0, 360)`.
    pub true_longitude_degrees: f64,
    /// Apparent geocentric ecliptic longitude — `true` plus IAU2000B nutation
    /// in longitude and aberration (true equinox of date), in degrees `[0, 360)`.
    pub apparent_longitude_degrees: f64,
    /// Sun–Earth distance in astronomical units.
    pub radius_au: f64,
}

/// Compute the Sun's geocentric ecliptic state at the given Julian Ephemeris
/// Day in Terrestrial Time.
pub fn solar_ecliptic_state(jde_tt: f64) -> SolarState {
    // RED stub: real implementation lands in the GREEN step.
    let _ = jde_tt;
    SolarState {
        true_longitude_degrees: 0.0,
        apparent_longitude_degrees: 0.0,
        radius_au: 0.0,
    }
}
