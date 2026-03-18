import { describe, it, expect } from 'vitest';
import {
  CITIES, CITY_REGIONS,
  searchCities, getCitiesByRegion, findNearestCity,
  type CityTimezone, type CityRegionKey,
} from '../src/cities';

describe('CITIES data integrity', () => {
  it('has at least 100 cities', () => {
    expect(CITIES.length).toBeGreaterThanOrEqual(100);
  });

  it('every city has required fields', () => {
    for (const c of CITIES) {
      expect(c.name, `${c.nameEn} missing Chinese name`).toBeTruthy();
      expect(c.nameEn, `${c.name} missing English name`).toBeTruthy();
      expect(c.timezoneId, `${c.nameEn} missing timezoneId`).toBeTruthy();
      expect(typeof c.longitude).toBe('number');
      expect(typeof c.latitude).toBe('number');
      expect(c.region).toBeTruthy();
    }
  });

  it('longitudes are in valid range [-180, 180]', () => {
    for (const c of CITIES) {
      expect(c.longitude, `${c.nameEn} longitude`).toBeGreaterThanOrEqual(-180);
      expect(c.longitude, `${c.nameEn} longitude`).toBeLessThanOrEqual(180);
    }
  });

  it('latitudes are in valid range [-90, 90]', () => {
    for (const c of CITIES) {
      expect(c.latitude, `${c.nameEn} latitude`).toBeGreaterThanOrEqual(-90);
      expect(c.latitude, `${c.nameEn} latitude`).toBeLessThanOrEqual(90);
    }
  });

  it('no duplicate city names within the same timezone', () => {
    const seen = new Set<string>();
    for (const c of CITIES) {
      const key = `${c.name}|${c.timezoneId}`;
      expect(seen.has(key), `Duplicate: ${c.name} in ${c.timezoneId}`).toBe(false);
      seen.add(key);
    }
  });

  it('every region in CITIES exists in CITY_REGIONS', () => {
    const validRegions = new Set(CITY_REGIONS.map(r => r.key));
    for (const c of CITIES) {
      expect(validRegions.has(c.region), `Unknown region: ${c.region} for ${c.nameEn}`).toBe(true);
    }
  });
});

describe('Key cities exist', () => {
  const findByEn = (name: string) => CITIES.find(c => c.nameEn === name);

  // China
  it('Beijing', () => {
    const c = findByEn('Beijing')!;
    expect(c).toBeDefined();
    expect(c.timezoneId).toBe('Asia/Shanghai');
    expect(c.longitude).toBeCloseTo(116.4, 0);
    expect(c.latitude).toBeCloseTo(39.9, 0);
    expect(c.region).toBe('china');
  });

  it('Shanghai', () => {
    const c = findByEn('Shanghai')!;
    expect(c).toBeDefined();
    expect(c.longitude).toBeCloseTo(121.5, 0);
  });

  it('Urumqi uses Asia/Urumqi', () => {
    const c = findByEn('Urumqi')!;
    expect(c).toBeDefined();
    expect(c.timezoneId).toBe('Asia/Urumqi');
    expect(c.longitude).toBeCloseTo(87.6, 0);
  });

  // Taiwan
  it('Taipei', () => {
    const c = findByEn('Taipei')!;
    expect(c).toBeDefined();
    expect(c.timezoneId).toBe('Asia/Taipei');
    expect(c.region).toBe('taiwan');
  });

  // Hong Kong / Macau
  it('Hong Kong', () => {
    const c = findByEn('Hong Kong')!;
    expect(c).toBeDefined();
    expect(c.timezoneId).toBe('Asia/Hong_Kong');
  });

  it('Macau', () => {
    const c = findByEn('Macau')!;
    expect(c).toBeDefined();
    expect(c.timezoneId).toBe('Asia/Macau');
  });

  // SEA
  it('Singapore', () => {
    const c = findByEn('Singapore')!;
    expect(c).toBeDefined();
    expect(c.timezoneId).toBe('Asia/Singapore');
  });

  // East Asia
  it('Tokyo', () => {
    const c = findByEn('Tokyo')!;
    expect(c).toBeDefined();
    expect(c.timezoneId).toBe('Asia/Tokyo');
    expect(c.longitude).toBeCloseTo(139.7, 0);
  });

  it('Seoul', () => {
    const c = findByEn('Seoul')!;
    expect(c).toBeDefined();
    expect(c.timezoneId).toBe('Asia/Seoul');
  });

  // World
  it('New York', () => {
    const c = findByEn('New York')!;
    expect(c).toBeDefined();
    expect(c.timezoneId).toBe('America/New_York');
    expect(c.longitude).toBeCloseTo(-74.0, 0);
  });

  it('London', () => {
    const c = findByEn('London')!;
    expect(c).toBeDefined();
    expect(c.timezoneId).toBe('Europe/London');
  });

  it('Sydney', () => {
    const c = findByEn('Sydney')!;
    expect(c).toBeDefined();
    expect(c.timezoneId).toBe('Australia/Sydney');
  });
});

describe('CITY_REGIONS', () => {
  it('has the expected regions', () => {
    const keys = CITY_REGIONS.map(r => r.key);
    expect(keys).toContain('china');
    expect(keys).toContain('taiwan');
    expect(keys).toContain('hongkong');
    expect(keys).toContain('sea');
    expect(keys).toContain('eastasia');
    expect(keys).toContain('southasia');
    expect(keys).toContain('middleeast');
    expect(keys).toContain('europe');
    expect(keys).toContain('americas');
    expect(keys).toContain('oceania');
    expect(keys).toContain('africa');
  });

  it('every region has both Chinese and English labels', () => {
    for (const r of CITY_REGIONS) {
      expect(r.label).toBeTruthy();
      expect(r.labelEn).toBeTruthy();
    }
  });
});

describe('searchCities', () => {
  it('returns all cities for empty query', () => {
    expect(searchCities('').length).toBe(CITIES.length);
  });

  it('finds by Chinese name', () => {
    const results = searchCities('北京');
    expect(results.some(c => c.nameEn === 'Beijing')).toBe(true);
  });

  it('finds by English name (case-insensitive)', () => {
    const results = searchCities('tokyo');
    expect(results.some(c => c.nameEn === 'Tokyo')).toBe(true);
  });

  it('finds partial matches', () => {
    const results = searchCities('Shang');
    expect(results.some(c => c.nameEn === 'Shanghai')).toBe(true);
  });

  it('returns empty for no match', () => {
    const results = searchCities('zzzzzzz');
    expect(results.length).toBe(0);
  });
});

describe('getCitiesByRegion', () => {
  it('returns a map with all regions', () => {
    const map = getCitiesByRegion();
    expect(map.size).toBeGreaterThan(0);
    expect(map.has('china')).toBe(true);
    expect(map.has('taiwan')).toBe(true);
  });

  it('china region has many cities', () => {
    const map = getCitiesByRegion();
    expect(map.get('china')!.length).toBeGreaterThanOrEqual(20);
  });
});

describe('findNearestCity', () => {
  it('finds Beijing for coordinates near Beijing', () => {
    const city = findNearestCity(116.4, 39.9);
    expect(city?.nameEn).toBe('Beijing');
  });

  it('finds Tokyo for coordinates near Tokyo', () => {
    const city = findNearestCity(139.7, 35.7);
    expect(city?.nameEn).toBe('Tokyo');
  });

  it('finds New York for coordinates near NYC', () => {
    const city = findNearestCity(-74.0, 40.7);
    expect(city?.nameEn).toBe('New York');
  });
});
