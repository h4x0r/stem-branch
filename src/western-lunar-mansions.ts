/* v8 ignore next */
export interface WesternLunarMansion {
  number: number;      // 1-28
  name: string;        // Traditional Arabic/Latin name
  startDegree: number; // starting ecliptic longitude
}

export const WESTERN_LUNAR_MANSIONS: readonly WesternLunarMansion[] = [
  { number: 1,  name: 'Al Sharatain',   startDegree: 0 },
  { number: 2,  name: 'Al Butain',      startDegree: 360/28 * 1 },
  { number: 3,  name: 'Al Thurayya',    startDegree: 360/28 * 2 },
  { number: 4,  name: 'Al Dabaran',     startDegree: 360/28 * 3 },
  { number: 5,  name: 'Al Haq\'a',      startDegree: 360/28 * 4 },
  { number: 6,  name: 'Al Han\'a',      startDegree: 360/28 * 5 },
  { number: 7,  name: 'Al Dhira',       startDegree: 360/28 * 6 },
  { number: 8,  name: 'Al Nathrah',     startDegree: 360/28 * 7 },
  { number: 9,  name: 'Al Tarf',        startDegree: 360/28 * 8 },
  { number: 10, name: 'Al Jabhah',      startDegree: 360/28 * 9 },
  { number: 11, name: 'Al Zubrah',      startDegree: 360/28 * 10 },
  { number: 12, name: 'Al Sarfah',      startDegree: 360/28 * 11 },
  { number: 13, name: 'Al Awwa',        startDegree: 360/28 * 12 },
  { number: 14, name: 'Al Simak',       startDegree: 360/28 * 13 },
  { number: 15, name: 'Al Ghafr',       startDegree: 360/28 * 14 },
  { number: 16, name: 'Al Jubana',      startDegree: 360/28 * 15 },
  { number: 17, name: 'Al Iklil',       startDegree: 360/28 * 16 },
  { number: 18, name: 'Al Qalb',        startDegree: 360/28 * 17 },
  { number: 19, name: 'Al Shaulah',     startDegree: 360/28 * 18 },
  { number: 20, name: 'Al Na\'am',      startDegree: 360/28 * 19 },
  { number: 21, name: 'Al Baldah',      startDegree: 360/28 * 20 },
  { number: 22, name: 'Sa\'d al Dhabih', startDegree: 360/28 * 21 },
  { number: 23, name: 'Sa\'d Bula',     startDegree: 360/28 * 22 },
  { number: 24, name: 'Sa\'d al Su\'ud', startDegree: 360/28 * 23 },
  { number: 25, name: 'Sa\'d al Akhbiyah', startDegree: 360/28 * 24 },
  { number: 26, name: 'Al Fargh al Mukdim', startDegree: 360/28 * 25 },
  { number: 27, name: 'Al Fargh al Thani', startDegree: 360/28 * 26 },
  { number: 28, name: 'Batn al Hut',    startDegree: 360/28 * 27 },
];

export function getWesternLunarMansion(longitude: number): { number: number; name: string } {
  const norm = ((longitude % 360) + 360) % 360;
  const mansionSpan = 360 / 28;
  const index = Math.floor(norm / mansionSpan);
  /* v8 ignore next */
  const mansion = WESTERN_LUNAR_MANSIONS[index >= 28 ? 0 : index];
  return { number: mansion.number, name: mansion.name };
}
