# stem-branch (Rust)

[![Crates.io](https://img.shields.io/crates/v/stem-branch.svg)](https://crates.io/crates/stem-branch)
[![Docs.rs](https://docs.rs/stem-branch/badge.svg)](https://docs.rs/stem-branch)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](https://github.com/h4x0r/stem-branch/blob/main/rust/LICENSE)
[![Rust CI](https://github.com/h4x0r/stem-branch/actions/workflows/rust.yml/badge.svg)](https://github.com/h4x0r/stem-branch/actions/workflows/rust.yml)

Native Rust port of [stem-branch](https://github.com/h4x0r/stem-branch)'s
astronomical core. Computes the Sun's geocentric ecliptic state (full VSOP87D
Earth series + JPL DE441-fitted correction + IAU2000B nutation) and the full
Chinese lunisolar calendar (new moons, solar terms, and 閏月 leap months) — no
runtime dependencies, no JavaScript.

```rust
use stem_branch::solar_ecliptic_state;

// Julian Ephemeris Day in Terrestrial Time (J2000.0).
let s = solar_ecliptic_state(2451545.0);
assert!((s.apparent_longitude_degrees - 280.368152).abs() < 1.0 / 3600.0);
// s.true_longitude_degrees   — mean equinox of date
// s.apparent_longitude_degrees — + IAU2000B nutation + aberration
// s.radius_au                 — Sun–Earth distance
```

The Chinese lunisolar calendar — Lunar New Year, leap months (閏月), conversion:

```rust
use stem_branch::{gregorian_to_lunisolar, lunar_new_year, CivilDate};

// 2023-03-22 is 閏二月初一 — day 1 of the leap 2nd month of 2023.
let d = gregorian_to_lunisolar(CivilDate { year: 2023, month: 3, day: 22 });
assert_eq!((d.year, d.month, d.day, d.is_leap_month), (2023, 2, 1, true));

// Lunar New Year (正月初一) 2024 falls on 2024-02-10 (Beijing).
let lny = lunar_new_year(2024);
assert_eq!((lny.year, lny.month, lny.day), (2024, 2, 10));
```

Input is a Julian Ephemeris Day in **Terrestrial Time**; the UTC↔TT / ΔT
boundary is the caller's responsibility.

## Validation

The implementation is validated against **JPL Horizons (DE441 ephemeris)** —
an independent third-party oracle, the same reference the upstream TypeScript
[`stem-branch`](https://h4x0r.github.io/stem-branch/accuracy) is validated
against. The test asserts
`solar_ecliptic_state().apparent_longitude_degrees` against JPL's apparent
geocentric ecliptic longitude of the Sun. The expected values are authored by
JPL, not by us, so the test is an independent check rather than a circular one.

**Result — apparent ecliptic longitude vs JPL DE441 (1900–2100 CE):**

| Instant (TT) | JD_TT | this crate (°) | JPL DE441 (°) | \|Δ\| |
|---|---|---|---|---|
| 1900-01-01 00:00 | 2415020.5 | 280.1533022 | 280.1533171 | 0.054″ |
| 1940-06-15 06:00 | 2429795.75 | 83.9726193 | 83.9726417 | 0.081″ |
| 1980-09-23 00:00 | 2444505.5 | 180.1158230 | 180.1158349 | 0.043″ |
| 2000-01-01 12:00 (J2000) | 2451545.0 | 280.3681559 | 280.3681519 | 0.014″ |
| 2024-03-20 03:00 | 2460389.625 | 359.9947954 | 359.9947742 | 0.076″ |
| 2060-12-21 00:00 | 2473814.5 | 269.8705294 | 269.8705076 | 0.079″ |
| 2100-07-04 12:00 | 2488254.0 | 102.6537711 | 102.6537510 | 0.073″ |

**Maximum residual: 0.081″** — identical to the upstream TypeScript engine
(the Rust port reproduces the same VSOP87D + DE441 model bit-for-bit). For
reference, the upstream engine's headline figure is mean **1.05 s** solar-term
timing vs JPL DE441 over 209–2493 CE; see the
[full accuracy report](https://h4x0r.github.io/stem-branch/accuracy).

Reference-value provenance (source, identity, license) is documented in
[`tests/data/README.md`](tests/data/README.md). JPL Horizons output is a U.S.
Government work in the public domain.

### Reproduce

```sh
cargo test            # runs the JPL DE441 oracle tests
cargo clippy --all-targets -- -D warnings
cargo fmt --check
```

## How it's built

The 2,077 VSOP87D Earth terms and 77 IAU2000B nutation rows are **generated**
from the canonical TypeScript source by
[`scripts/gen-rust-solar-data.mjs`](../scripts/gen-rust-solar-data.mjs), so the
Rust crate and the TypeScript engine share a single source of truth and cannot
silently drift. Only the math (≈130 lines in `src/lib.rs`) is hand-written; the
coefficient tables are mechanical translations.

The port matches the TypeScript implementation faithfully, including JavaScript's
truncated-remainder (`%`) semantics for argument reduction and the literal
`206264.806` arcsec-per-radian factor used by the DE441 correction polynomial.

## Scope

Covers the solar ephemeris (`solar_ecliptic_state`) and the full Chinese
lunisolar calendar (`gregorian_to_lunisolar`, `lunar_months_for_year`,
`lunar_new_year`, plus `new_moon_jde` and `find_solar_term_moment`). The Moon
*position* ephemeris (ELP/MPP02) and the planets share the same series machinery
upstream and can be ported the same way when needed.
