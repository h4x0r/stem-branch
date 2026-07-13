# Changelog

All notable changes to stem-branch (TypeScript source and the Rust port, released
in lockstep) are documented here.

## [0.8.0] - 2026-07-13

### Added

- **Moon illumination geometry** — `moonPhase(jdeTT)` (TypeScript) and
  `moon_phase(jde_tt)` (Rust), returning the Moon–Sun elongation, the phase angle,
  the illuminated fraction, and the waxing/waning sense at a Julian Ephemeris Day
  (TT). Computed from the true geocentric elongation (Meeus *Astronomical
  Algorithms* 2e eq. 48.2, using the Moon's ecliptic latitude) and the phase angle
  from the real Sun and Moon distances (eq. 48.3) — not a longitude-only
  approximation. Validated tier-1 against Meeus's worked Example 48.a (phase angle
  69.0756°, illuminated fraction 0.6786) and against 100+ JPL new/full-moon
  instants (illuminated fraction ≈ 0 at new, ≈ 1 at full).
