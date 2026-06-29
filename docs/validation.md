# Validation

How stem-branch's astronomical core is checked, against what reference, and how
to reproduce it. This covers both the TypeScript package
(`@4n6h4x0r/stem-branch`) and the Rust port (`stem-branch` on crates.io), which share a
single generated coefficient source and therefore the same numerical model.

## Reference oracle (independent)

The solar ecliptic longitude is validated against **JPL Horizons (DE441
ephemeris)** — the Jet Propulsion Laboratory's geocentric *apparent* (airless)
ecliptic longitude of the Sun. The expected values are authored by JPL, not by
this project, and JPL Horizons output is a U.S. Government work in the public
domain. This is an **independent third-party oracle**: the answer key comes from
outside the codebase, so the test is a genuine external check rather than a
self-consistent round-trip.

Provenance (source URLs, sampled instants, license) is recorded in
[`rust/tests/data/README.md`](../rust/tests/data/README.md). The sampled tuples
deliberately mix round-time (00:00 / 12:00) and off-round (03:00 / 06:00)
instants at full Julian-day precision, so a longitude error that only appears
between tabulated hours cannot hide.

## What is checked

- **Apparent solar ecliptic longitude** vs JPL DE441 across 1900–2100 CE
  (Rust oracle test) and across 209–2493 CE solar terms (TypeScript suite).
- **Normalization invariants**: longitudes in `[0, 360)`, Sun–Earth distance in
  the annual perihelion/aphelion band (≈0.983–1.017 AU).
- **TS ↔ Rust parity**: the Rust port reproduces the TypeScript model because the
  2,077 VSOP87D Earth terms and 77 IAU2000B nutation rows are *generated* from
  the same source by
  [`scripts/gen-rust-solar-data.mjs`](../scripts/gen-rust-solar-data.mjs); the
  two engines cannot silently drift.
- **Moon apparent position** (ELP/MPP02) vs JPL: at JPL's own new/full-moon
  instants the Moon–Sun apparent-longitude elongation is ~0° / ~180° (mean
  < 0.3°) — JPL's times are the independent input, so it checks `moon_position`
  directly (npm `moon-validation.test.ts`, Rust `jpl_lunar_phase.rs`). Plus
  ELP/MPP02 TS↔Rust parity and physical bounds (distance 356,000–407,000 km,
  |latitude| < 5.3°).
- **New moon = true 定朔 conjunction.** Month boundaries use the new moon refined
  from the Meeus Ch.49 estimate to the exact Sun–Moon apparent-longitude
  conjunction (ELP/MPP02 + VSOP87D, sub-arcsecond vs Meeus's ~1 minute).
- **Chinese lunisolar calendar** is validated three independent ways. (1)
  **Published anchors** — Lunar New Year (2000, 2020–2025, 2033) and leap months
  (2017→閏6, 2020→閏4, 2023→閏2, 2025→閏6). (2) **cnlunar** (independent third-party
  implementation): every day 1950–2050 agrees on month/day/leap. (3) **Hong Kong
  Observatory** published tables (the authoritative real-world arbiter): every
  dated entry of 2013/2018/2020/2023 agrees, including the tight 2018 boundary
  (new moon 2.05 min from Beijing midnight) and the 閏4 / 閏2 months. All three are
  external checks, not self-consistent round-trips.

Headline residual against JPL DE441 and the full methodology (sxwnl comparison,
solar-term timing) are in the [accuracy report](https://h4x0r.github.io/stem-branch/accuracy).
Figures live there, in one place, to avoid divergent copies.

## Reproduce

TypeScript engine:

```sh
npm test            # vitest suite, including the JPL-referenced cases
```

Rust port:

```sh
cd rust
cargo test          # JPL DE441 oracle tests
cargo clippy --all-targets -- -D warnings
cargo fmt --check
cargo deny check    # dependency policy (advisories, licenses, sources)
```

## Scope and limits

The validated surface is the solar ecliptic state, the Moon (ELP/MPP02), and the
Chinese lunisolar calendar. The major planets use the same series machinery and
would be validated the same way when ported.

### The ΔT limit (far-future calendar boundaries)

A lunisolar date is decided by which Beijing *calendar day* contains the new moon
and 中氣 — a day-resolution call. When an instant falls within seconds of Beijing
midnight, the date depends on ΔT (TT−UT), which is **observed** through the present
but only **extrapolated** into the future. At such boundaries our calendar can
differ from the Hong Kong Observatory by one day:

- **2057-09-29**: our 定朔 conjunction is 00:00:29 Beijing (29 s after midnight)
  with ΔT ≈ 88 s; HKO's larger future-ΔT places it 29 s earlier, on 2057-09-28.
- **2097** has a boundary ≈ 2.4 s from midnight — even sub-second ephemeris cannot
  decide it; the ΔT prediction does.

This is inherent, not an ephemeris error. Through ~2050 (ΔT observed / well-modelled)
we match HKO exactly, including boundaries as tight as 2 minutes (2018); beyond,
near-midnight boundaries are ΔT-prediction-bound. The engine takes a JDE in TT and
is checked in that frame, so a far-future calendar date is only as certain as ΔT
allows.
