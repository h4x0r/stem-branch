# Validation

How stem-branch's astronomical core is checked, against what reference, and how
to reproduce it. This covers both the TypeScript package
(`@4n6h4x0r/stem-branch`) and the Rust port (`stembranch-core`), which share a
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

Validated surface is the **solar** ecliptic state (`solarEclipticState` /
`solar_ecliptic_state`). The Moon (ELP/MPP02) and the major planets use the same
series machinery upstream and would be validated the same way when ported. The
ΔT / UTC↔TT boundary is the caller's responsibility — the engine takes a Julian
Ephemeris Day in Terrestrial Time and is checked in that frame, so a calendar
result is only as good as the ΔT model the caller supplies.
