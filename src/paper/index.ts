/* v8 ignore next */
/**
 * Computational verification modules for the Silk Road astronomy paper.
 *
 * These modules generate data for tables and figures in the companion paper
 * "From Eclipse Demon to Lunar Apogee." Not part of the public library API.
 */

export { generateKetuEphemeris, estimateOrbitalPeriod } from './ketu-period-analysis';
export { raToEclipticOnEcliptic, quasiEclipticBoundaries, quasiEclipticHouse } from './quasi-ecliptic';
export { computeFourRegimes, generateFourRegimeTable } from './coordinate-regimes';
