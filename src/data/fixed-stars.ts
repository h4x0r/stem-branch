/* v8 ignore next */
/**
 * Fixed star catalog with J2000.0 ecliptic coordinates and traditional planetary natures.
 * Precession utilities for projecting positions to arbitrary epochs.
 */

export interface FixedStar {
  name: string;
  longitude2000: number;  // J2000.0 ecliptic longitude (degrees)
  latitude: number;       // ecliptic latitude (degrees)
  magnitude: number;      // apparent visual magnitude
  nature: string;         // traditional planetary nature
}

/** Precession rate in degrees per Julian century (~50.29 arcsec/year). */
export const precessionRate = 1.397;

/**
 * ~50 prominent fixed stars ordered by ecliptic longitude.
 * Longitudes are J2000.0 ecliptic; natures follow Ptolemaic tradition.
 */
export const FIXED_STARS: FixedStar[] = [
  // Aries
  { name: 'Difda',           longitude2000:   2.35, latitude: -20.87, magnitude: 2.04, nature: 'Saturn' },
  { name: 'Algenib',         longitude2000:   9.17, latitude:  12.62, magnitude: 2.83, nature: 'Mars/Mercury' },
  { name: 'Alpheratz',       longitude2000:  14.26, latitude:  25.67, magnitude: 2.06, nature: 'Jupiter/Venus' },
  { name: 'Mirach',          longitude2000:  30.24, latitude:  25.56, magnitude: 2.05, nature: 'Venus' },

  // Taurus
  { name: 'Algol',           longitude2000:  26.17, latitude:  22.42, magnitude: 2.10, nature: 'Saturn/Jupiter' },
  { name: 'Alcyone',         longitude2000:  30.07, latitude:   4.03, magnitude: 2.87, nature: 'Moon/Mars' },
  { name: 'Mirfak',          longitude2000:  32.09, latitude:  30.02, magnitude: 1.79, nature: 'Jupiter/Saturn' },
  { name: 'Capella',         longitude2000:  51.88, latitude:  22.93, magnitude: 0.08, nature: 'Mars/Mercury' },
  { name: 'Menkar',          longitude2000:  14.29, latitude: -12.59, magnitude: 2.53, nature: 'Saturn' },

  // Gemini
  { name: 'Aldebaran',       longitude2000:  69.86, latitude:  -5.47, magnitude: 0.85, nature: 'Mars' },
  { name: 'Rigel',           longitude2000:  76.97, latitude: -31.08, magnitude: 0.12, nature: 'Jupiter/Mars' },
  { name: 'Bellatrix',       longitude2000:  80.97, latitude: -16.78, magnitude: 1.64, nature: 'Mars/Mercury' },
  { name: 'Alnilam',         longitude2000:  83.65, latitude: -24.20, magnitude: 1.70, nature: 'Jupiter/Saturn' },
  { name: 'Betelgeuse',      longitude2000:  88.63, latitude: -16.03, magnitude: 0.58, nature: 'Mars/Mercury' },

  // Cancer
  { name: 'Sirius',          longitude2000: 104.11, latitude: -39.61, magnitude: -1.46, nature: 'Jupiter/Mars' },
  { name: 'Canopus',         longitude2000: 104.93, latitude: -75.75, magnitude: -0.74, nature: 'Saturn/Jupiter' },
  { name: 'Wezen',           longitude2000: 103.33, latitude: -26.28, magnitude: 1.84, nature: 'Venus' },
  { name: 'Aludra',          longitude2000: 105.45, latitude: -24.58, magnitude: 2.45, nature: 'Venus' },
  { name: 'Castor',          longitude2000: 110.22, latitude:  10.09, magnitude: 1.58, nature: 'Mercury' },
  { name: 'Pollux',          longitude2000: 113.22, latitude:   6.68, magnitude: 1.14, nature: 'Mars' },
  { name: 'Procyon',         longitude2000: 115.73, latitude: -16.01, magnitude: 0.34, nature: 'Mercury/Mars' },

  // Leo
  { name: 'Praesepe',        longitude2000: 127.27, latitude:   1.55, magnitude: 3.70, nature: 'Mars/Moon' },
  { name: 'Alphard',         longitude2000: 147.28, latitude: -22.37, magnitude: 1.98, nature: 'Saturn/Venus' },
  { name: 'Regulus',         longitude2000: 149.85, latitude:   0.46, magnitude: 1.35, nature: 'Mars/Jupiter' },

  // Virgo
  { name: 'Zosma',           longitude2000: 161.33, latitude:  14.38, magnitude: 2.56, nature: 'Saturn/Venus' },
  { name: 'Denebola',        longitude2000: 171.56, latitude:  12.28, magnitude: 2.14, nature: 'Saturn/Venus' },

  // Libra
  { name: 'Vindemiatrix',    longitude2000: 189.94, latitude:  16.15, magnitude: 2.83, nature: 'Saturn/Mercury' },
  { name: 'Spica',           longitude2000: 203.87, latitude:  -2.05, magnitude: 0.97, nature: 'Venus/Mars' },
  { name: 'Arcturus',        longitude2000: 204.22, latitude:  30.77, magnitude: -0.04, nature: 'Mars/Jupiter' },

  // Scorpio
  { name: 'Zuben Elgenubi',  longitude2000: 215.08, latitude:   0.36, magnitude: 2.75, nature: 'Jupiter/Mars' },
  { name: 'South Scale',     longitude2000: 225.08, latitude:   0.36, magnitude: 2.75, nature: 'Jupiter/Mars' },
  { name: 'North Scale',     longitude2000: 229.20, latitude:   8.53, magnitude: 2.61, nature: 'Jupiter/Mercury' },
  { name: 'Unukalhai',       longitude2000: 232.10, latitude:  44.53, magnitude: 2.63, nature: 'Saturn/Mars' },
  { name: 'Acrab',           longitude2000: 243.20, latitude:   1.02, magnitude: 2.62, nature: 'Saturn/Mars' },
  { name: 'Dschubba',        longitude2000: 242.35, latitude:  -1.98, magnitude: 2.32, nature: 'Mars/Saturn' },

  // Sagittarius
  { name: 'Antares',         longitude2000: 249.63, latitude:  -4.57, magnitude: 0.96, nature: 'Mars/Jupiter' },
  { name: 'Lesath',          longitude2000: 264.12, latitude: -13.47, magnitude: 2.69, nature: 'Mercury/Mars' },
  { name: 'Ras Alhague',     longitude2000: 262.15, latitude:  35.84, magnitude: 2.07, nature: 'Saturn/Venus' },
  { name: 'Kaus Australis',  longitude2000: 275.10, latitude: -11.05, magnitude: 1.85, nature: 'Jupiter/Mars' },
  { name: 'Nunki',           longitude2000: 282.38, latitude:  -3.44, magnitude: 2.02, nature: 'Jupiter/Mercury' },

  // Capricorn
  { name: 'Vega',            longitude2000: 285.28, latitude:  61.73, magnitude: 0.03, nature: 'Venus/Mercury' },
  { name: 'Terebellum',      longitude2000: 295.87, latitude:  -3.27, magnitude: 4.50, nature: 'Venus/Saturn' },
  { name: 'Toliman',         longitude2000: 209.22, latitude: -42.57, magnitude: -0.01, nature: 'Venus/Jupiter' },
  { name: 'Agena',           longitude2000: 213.91, latitude: -21.54, magnitude: 0.61, nature: 'Venus/Jupiter' },

  // Aquarius
  { name: 'Altair',          longitude2000: 301.53, latitude:  29.31, magnitude: 0.77, nature: 'Mars/Jupiter' },
  { name: 'Sadalmelik',      longitude2000: 313.44, latitude:  -0.44, magnitude: 2.96, nature: 'Saturn/Mercury' },
  { name: 'Sadalsuud',       longitude2000: 323.40, latitude:  -8.49, magnitude: 2.91, nature: 'Saturn/Mercury' },
  { name: 'Deneb Algedi',    longitude2000: 323.48, latitude:  -2.60, magnitude: 2.87, nature: 'Saturn/Jupiter' },

  // Pisces
  { name: 'Fomalhaut',       longitude2000: 333.87, latitude: -21.09, magnitude: 1.16, nature: 'Venus/Mercury' },
  { name: 'Deneb',           longitude2000: 335.30, latitude:  59.97, magnitude: 1.25, nature: 'Venus/Mercury' },
  { name: 'Achernar',        longitude2000: 345.30, latitude: -53.54, magnitude: 0.46, nature: 'Jupiter' },
  { name: 'Markab',          longitude2000: 353.48, latitude:  19.43, magnitude: 2.49, nature: 'Mars/Mercury' },
  { name: 'Scheat',          longitude2000: 359.37, latitude:  31.21, magnitude: 2.42, nature: 'Mars/Mercury' },
];

/**
 * Precess a fixed star's ecliptic longitude from J2000.0 to a given epoch.
 * @param star  The fixed star record.
 * @param T     Julian centuries from J2000.0 (positive = future).
 * @returns     Ecliptic longitude in [0, 360).
 */
export function precessStar(star: FixedStar, T: number): number {
  return ((star.longitude2000 + precessionRate * T) % 360 + 360) % 360;
}

/**
 * Find fixed stars in conjunction with a given body longitude.
 * @param bodyLongitude  Ecliptic longitude of the body (degrees).
 * @param bodyName       Name of the body (e.g. 'Sun', 'Mars').
 * @param T              Julian centuries from J2000.0 for precession.
 * @param orb            Maximum orb in degrees (default 1).
 * @returns              Array of conjunctions sorted by absolute orb.
 */
export function findFixedStarConjunctions(
  bodyLongitude: number,
  bodyName: string,
  T: number,
  orb: number = 1,
): Array<{ star: string; body: string; orb: number }> {
  const results: Array<{ star: string; body: string; orb: number }> = [];

  for (const star of FIXED_STARS) {
    const starLon = precessStar(star, T);
    let diff = bodyLongitude - starLon;
    // Normalize to [-180, 180)
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    if (Math.abs(diff) <= orb) {
      results.push({ star: star.name, body: bodyName, orb: diff });
    }
  }

  results.sort((a, b) => Math.abs(a.orb) - Math.abs(b.orb));
  return results;
}
