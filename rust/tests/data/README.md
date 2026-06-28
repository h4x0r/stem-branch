# Test data provenance

## JPL Horizons DE441 — apparent solar ecliptic longitude

- **Source:** [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/) system, DE441
  ephemeris. Geocentric, **apparent** (airless) ecliptic longitude of the Sun,
  hourly tables.
- **Use case:** Independent oracle for `solar_ecliptic_state().apparent_longitude_degrees`.
  This is the same reference the TypeScript `stem-branch` validates against, so
  the Rust port is checked against external ground truth rather than the TS
  output (which would be circular).
- **Values:** 7 sampled `(JD_TT, apparent_longitude_deg)` tuples spanning
  1900–2100 CE, embedded directly in `tests/de441_oracle.rs::CASES`. Includes
  both round-time (00:00 / 12:00) and off-round (03:00 / 06:00) instants at full
  Julian-day precision.
- **Independence:** the answer values are authored by JPL, not by us — an
  external check, not a fixture we generated and then asserted against.
- **License / redistribution:** JPL Horizons output is a U.S. Government work and
  is in the public domain.

Measured residual of the current model against these points: **max ≈ 0.08″**
(well under the 1″ test tolerance).
