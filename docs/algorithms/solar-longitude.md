# Solar Longitude Computation

The Sun's apparent geocentric ecliptic longitude is the foundation of solar term timing, month boundaries, and year pillar transitions. stembranch computes it in four stages.

## Pipeline

### 1. VSOP87D Heliocentric Longitude

The heliocentric ecliptic longitude of Earth is computed by evaluating the full VSOP87D series (2,425 terms across 6 polynomial orders):

```
L = L₀(τ) + L₁(τ)·τ + L₂(τ)·τ² + L₃(τ)·τ³ + L₄(τ)·τ⁴ + L₅(τ)·τ⁵
```

where each Lₙ(τ) is a sum of trigonometric terms:

```
Lₙ = Σ Aᵢ · cos(Bᵢ + Cᵢ · τ)
```

and τ = Julian millennia from J2000.0 (= (JD - 2451545.0) / 365250).

VSOP87D provides coordinates in the ecliptic frame of date, which is what we need for solar term definitions (ecliptic longitude = 0° at vernal equinox of the year in question).

### 2. DE441-Fitted Correction

Raw VSOP87D has systematic truncation error that grows with distance from epoch. stembranch applies an even-polynomial correction fitted to JPL DE441 via least-squares over 1,008 solar-term crossings:

```
ΔL = c₀ + c₂τ² + c₄τ⁴ + c₆τ⁶   (arcseconds)
```

| Coefficient | Value |
|-------------|-------|
| c₀ | -0.106674 |
| c₂ | -0.616597 |
| c₄ | +0.315446 |
| c₆ | -0.050315 |

**Why even-only terms?** VSOP87D's truncation error is symmetric — it degrades equally looking backward or forward from J2000. Even powers of τ preserve this symmetry. The previous DE405 correction used odd terms (τ, τ³) which caused 58-second errors for ancient dates while being well-calibrated near epoch.

**Validation:** Mean 1.05s, max 3.05s across 209–2493 CE (1,008 terms, 42 years).

### 3. Geocentric Conversion

Add π radians (180°) to convert heliocentric Earth longitude to geocentric Sun longitude:

```
λ_geo = L + π
```

### 4. IAU2000B Nutation

Apply nutation in longitude (Δψ) using the IAU2000B model with 77 lunisolar terms. The fundamental arguments are the five Delaunay parameters:

| Parameter | Symbol | Description |
|-----------|--------|-------------|
| l | Mean anomaly of the Moon | |
| l' | Mean anomaly of the Sun | |
| F | Mean argument of latitude of the Moon | |
| D | Mean elongation of the Moon from Sun | |
| Ω | Mean longitude of ascending node | |

Each nutation term contributes:

```
Δψ += (Sᵢ + S'ᵢ·T) · sin(N₁ᵢ·l + N₂ᵢ·l' + N₃ᵢ·F + N₄ᵢ·D + N₅ᵢ·Ω)
```

The final apparent longitude is:

```
λ_apparent = λ_geo + Δψ
```

## Solar Term Root Finding

Solar terms are defined as the Sun's apparent longitude reaching exact multiples of 15°. stembranch uses Newton-Raphson iteration:

```
t_{n+1} = t_n - (λ(t_n) - λ_target) / (dλ/dt)
```

The derivative dλ/dt is approximated numerically. Convergence typically occurs within 3–4 iterations to sub-millisecond precision.

## Timescale Handling

- **Internal computation:** TT (Terrestrial Time)
- **Input/output:** UT (Universal Time, ≈ UTC)
- **Conversion:** ΔT = TT - UT, using Espenak & Meeus polynomials (before 2016), sxwnl cubic spline table (2016–2050), and parabolic extrapolation (after 2050)

## API

```typescript
import { getSunLongitude, findSolarTermMoment } from 'stembranch';

// Get Sun's apparent longitude at a specific moment
getSunLongitude(new Date(2024, 2, 20, 3, 6)); // → ~0.0 (vernal equinox)

// Find exact moment of a solar term
findSolarTermMoment(0, 2024);   // → Date for 春分 2024
findSolarTermMoment(90, 2024);  // → Date for 夏至 2024
```
