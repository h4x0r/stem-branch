/* v8 ignore next */
/**
 * Speculum table computation for primary direction research.
 *
 * All values in degrees.  Input RA, declination, and observer latitude
 * are in degrees; RAMC = Right Ascension of the Medium Coeli (= LST in degrees).
 */

import type { SpeculumEntry } from '../birth-chart-types';

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

/**
 * Compute a full speculum entry for a single body.
 *
 * @param ra - Right ascension (degrees)
 * @param dec - Declination (degrees)
 * @param lat - Observer geographic latitude (degrees)
 * @param ramc - Right Ascension of MC (degrees), i.e. local sidereal time in degrees
 * @param aboveHorizon - Whether the body is above the horizon (altitude > 0)
 */
export function computeSpeculumEntry(
  ra: number,
  dec: number,
  lat: number,
  ramc: number,
  aboveHorizon: boolean,
): SpeculumEntry {
  // Ascensional Difference: AD = asin(tan(dec) * tan(lat))
  const tanProduct = Math.tan(dec * DEG) * Math.tan(lat * DEG);
  // Clamp to [-1, 1] for edge cases near poles
  const ad = Math.asin(Math.max(-1, Math.min(1, tanProduct))) * RAD;

  // Oblique Ascension & Descension
  const oa = ra - ad;
  const od = ra + ad;

  // Diurnal & Nocturnal Semi-Arcs
  const dsa = 90 + ad;
  const nsa = 90 - ad;

  // Meridian Distance: |RA - RAMC| normalized to [0, 180]
  let md = Math.abs(ra - ramc) % 360;
  if (md > 180) md = 360 - md;

  // Active Semi-Arc
  const sa = aboveHorizon ? dsa : nsa;

  // Upper Meridian Distance (signed, then normalize to [0, 360))
  let umd = (ra - ramc) % 360;
  if (umd < 0) umd += 360;

  // Horizon Distance: positive = above horizon
  const hd = sa - md;

  // Temporal Hour: size of one proportional hour
  const temporalHour = sa / 6;

  // Pole of Planet (Regiomontanus)
  // pole = atan(sin(MD) * tan(lat) / SA)
  const sinMD = Math.sin(md * DEG);
  const tanLat = Math.tan(lat * DEG);
  const pole = sa !== 0
    ? Math.atan((sinMD * tanLat) / (sa * DEG)) * RAD
    : 0;

  // Correction: the Regiomontanus pole formula uses SA in the same angular units.
  // pole = atan( sin(MD) * tan(lat) / SA )  where SA is in degrees treated as a ratio.
  // The correct formulation: pole = asin( sin(MD_in_deg / SA_in_deg * 90) * sin(lat) )
  // However, the classical simplified form from Morinus software is:
  // pole = atan( sin(MD) * tan(lat) / SA )
  // We use the classical form here.
  const poleCorrected = sa !== 0
    ? Math.atan(sinMD * tanLat / sa) * RAD
    : 0;

  return {
    ad,
    oa,
    od,
    md,
    dsa,
    nsa,
    sa,
    umd,
    hd,
    temporalHour,
    pole: poleCorrected,
  };
}
