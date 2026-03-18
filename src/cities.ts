/**
 * Comprehensive city database with IANA timezone IDs and coordinates.
 *
 * Every city entry includes:
 * - Chinese and English display names
 * - IANA timezone ID (for historical DST-aware UTC conversion)
 * - Longitude and latitude (for true solar time computation)
 * - Region classification
 *
 * The longitude is critical for Chinese metaphysics: true solar time
 * (真太陽時) depends on the observer's longitude, not just their timezone.
 */

// ── Types ────────────────────────────────────────────────────

export interface CityTimezone {
  /** Display name (Chinese) */
  name: string;
  /** Display name (English) */
  nameEn: string;
  /** IANA timezone ID (handles historical DST changes) */
  timezoneId: string;
  /** Longitude in degrees east (negative for west) */
  longitude: number;
  /** Latitude in degrees north (negative for south) */
  latitude: number;
  /** Region classification */
  region: CityRegionKey;
}

export type CityRegionKey =
  | 'china'       // 中國大陸
  | 'taiwan'      // 台灣
  | 'hongkong'    // 港澳
  | 'sea'         // 東南亞
  | 'eastasia'    // 東亞 (日韓蒙)
  | 'southasia'   // 南亞
  | 'middleeast'  // 中東
  | 'europe'      // 歐洲
  | 'americas'    // 美洲
  | 'oceania'     // 大洋洲
  | 'africa';     // 非洲

export interface CityRegion {
  key: CityRegionKey;
  label: string;
  labelEn: string;
}

// ── Region definitions ──────────────────────────────────────

export const CITY_REGIONS: CityRegion[] = [
  { key: 'china', label: '中國大陸', labelEn: 'Mainland China' },
  { key: 'taiwan', label: '台灣', labelEn: 'Taiwan' },
  { key: 'hongkong', label: '港澳', labelEn: 'HK/Macau' },
  { key: 'sea', label: '東南亞', labelEn: 'Southeast Asia' },
  { key: 'eastasia', label: '東亞', labelEn: 'East Asia' },
  { key: 'southasia', label: '南亞', labelEn: 'South Asia' },
  { key: 'middleeast', label: '中東', labelEn: 'Middle East' },
  { key: 'europe', label: '歐洲', labelEn: 'Europe' },
  { key: 'americas', label: '美洲', labelEn: 'Americas' },
  { key: 'oceania', label: '大洋洲', labelEn: 'Oceania' },
  { key: 'africa', label: '非洲', labelEn: 'Africa' },
];

// ── City database ───────────────────────────────────────────
// Sorted by region, then roughly by population/importance.
// Coordinates rounded to 1 decimal place.

export const CITIES: CityTimezone[] = [
  // ═══ 中國大陸 (Mainland China) ═══════════════════════════════
  // All use Asia/Shanghai (UTC+8) except Urumqi
  { name: '北京', nameEn: 'Beijing', timezoneId: 'Asia/Shanghai', longitude: 116.4, latitude: 39.9, region: 'china' },
  { name: '上海', nameEn: 'Shanghai', timezoneId: 'Asia/Shanghai', longitude: 121.5, latitude: 31.2, region: 'china' },
  { name: '廣州', nameEn: 'Guangzhou', timezoneId: 'Asia/Shanghai', longitude: 113.3, latitude: 23.1, region: 'china' },
  { name: '深圳', nameEn: 'Shenzhen', timezoneId: 'Asia/Shanghai', longitude: 114.1, latitude: 22.5, region: 'china' },
  { name: '成都', nameEn: 'Chengdu', timezoneId: 'Asia/Shanghai', longitude: 104.1, latitude: 30.6, region: 'china' },
  { name: '重慶', nameEn: 'Chongqing', timezoneId: 'Asia/Shanghai', longitude: 106.6, latitude: 29.6, region: 'china' },
  { name: '武漢', nameEn: 'Wuhan', timezoneId: 'Asia/Shanghai', longitude: 114.3, latitude: 30.6, region: 'china' },
  { name: '南京', nameEn: 'Nanjing', timezoneId: 'Asia/Shanghai', longitude: 118.8, latitude: 32.1, region: 'china' },
  { name: '杭州', nameEn: 'Hangzhou', timezoneId: 'Asia/Shanghai', longitude: 120.2, latitude: 30.3, region: 'china' },
  { name: '西安', nameEn: "Xi'an", timezoneId: 'Asia/Shanghai', longitude: 108.9, latitude: 34.3, region: 'china' },
  { name: '天津', nameEn: 'Tianjin', timezoneId: 'Asia/Shanghai', longitude: 117.2, latitude: 39.1, region: 'china' },
  { name: '蘇州', nameEn: 'Suzhou', timezoneId: 'Asia/Shanghai', longitude: 120.6, latitude: 31.3, region: 'china' },
  { name: '長沙', nameEn: 'Changsha', timezoneId: 'Asia/Shanghai', longitude: 112.9, latitude: 28.2, region: 'china' },
  { name: '鄭州', nameEn: 'Zhengzhou', timezoneId: 'Asia/Shanghai', longitude: 113.7, latitude: 34.8, region: 'china' },
  { name: '濟南', nameEn: 'Jinan', timezoneId: 'Asia/Shanghai', longitude: 117.0, latitude: 36.7, region: 'china' },
  { name: '青島', nameEn: 'Qingdao', timezoneId: 'Asia/Shanghai', longitude: 120.4, latitude: 36.1, region: 'china' },
  { name: '福州', nameEn: 'Fuzhou', timezoneId: 'Asia/Shanghai', longitude: 119.3, latitude: 26.1, region: 'china' },
  { name: '廈門', nameEn: 'Xiamen', timezoneId: 'Asia/Shanghai', longitude: 118.1, latitude: 24.5, region: 'china' },
  { name: '寧波', nameEn: 'Ningbo', timezoneId: 'Asia/Shanghai', longitude: 121.5, latitude: 29.9, region: 'china' },
  { name: '合肥', nameEn: 'Hefei', timezoneId: 'Asia/Shanghai', longitude: 117.3, latitude: 31.8, region: 'china' },
  { name: '南昌', nameEn: 'Nanchang', timezoneId: 'Asia/Shanghai', longitude: 115.9, latitude: 28.7, region: 'china' },
  { name: '昆明', nameEn: 'Kunming', timezoneId: 'Asia/Shanghai', longitude: 102.7, latitude: 25.0, region: 'china' },
  { name: '貴陽', nameEn: 'Guiyang', timezoneId: 'Asia/Shanghai', longitude: 106.7, latitude: 26.6, region: 'china' },
  { name: '南寧', nameEn: 'Nanning', timezoneId: 'Asia/Shanghai', longitude: 108.3, latitude: 22.8, region: 'china' },
  { name: '海口', nameEn: 'Haikou', timezoneId: 'Asia/Shanghai', longitude: 110.3, latitude: 20.0, region: 'china' },
  { name: '太原', nameEn: 'Taiyuan', timezoneId: 'Asia/Shanghai', longitude: 112.5, latitude: 37.9, region: 'china' },
  { name: '石家莊', nameEn: 'Shijiazhuang', timezoneId: 'Asia/Shanghai', longitude: 114.5, latitude: 38.0, region: 'china' },
  { name: '哈爾濱', nameEn: 'Harbin', timezoneId: 'Asia/Shanghai', longitude: 126.6, latitude: 45.8, region: 'china' },
  { name: '長春', nameEn: 'Changchun', timezoneId: 'Asia/Shanghai', longitude: 125.3, latitude: 43.9, region: 'china' },
  { name: '瀋陽', nameEn: 'Shenyang', timezoneId: 'Asia/Shanghai', longitude: 123.4, latitude: 41.8, region: 'china' },
  { name: '大連', nameEn: 'Dalian', timezoneId: 'Asia/Shanghai', longitude: 121.6, latitude: 38.9, region: 'china' },
  { name: '蘭州', nameEn: 'Lanzhou', timezoneId: 'Asia/Shanghai', longitude: 103.8, latitude: 36.1, region: 'china' },
  { name: '銀川', nameEn: 'Yinchuan', timezoneId: 'Asia/Shanghai', longitude: 106.3, latitude: 38.5, region: 'china' },
  { name: '西寧', nameEn: 'Xining', timezoneId: 'Asia/Shanghai', longitude: 101.8, latitude: 36.6, region: 'china' },
  { name: '呼和浩特', nameEn: 'Hohhot', timezoneId: 'Asia/Shanghai', longitude: 111.7, latitude: 40.8, region: 'china' },
  { name: '烏魯木齊', nameEn: 'Urumqi', timezoneId: 'Asia/Urumqi', longitude: 87.6, latitude: 43.8, region: 'china' },
  { name: '拉薩', nameEn: 'Lhasa', timezoneId: 'Asia/Shanghai', longitude: 91.1, latitude: 29.7, region: 'china' },
  { name: '佛山', nameEn: 'Foshan', timezoneId: 'Asia/Shanghai', longitude: 113.1, latitude: 23.0, region: 'china' },
  { name: '東莞', nameEn: 'Dongguan', timezoneId: 'Asia/Shanghai', longitude: 113.8, latitude: 23.0, region: 'china' },
  { name: '珠海', nameEn: 'Zhuhai', timezoneId: 'Asia/Shanghai', longitude: 113.6, latitude: 22.3, region: 'china' },
  { name: '汕頭', nameEn: 'Shantou', timezoneId: 'Asia/Shanghai', longitude: 116.7, latitude: 23.4, region: 'china' },
  { name: '潮州', nameEn: 'Chaozhou', timezoneId: 'Asia/Shanghai', longitude: 116.6, latitude: 23.7, region: 'china' },
  { name: '溫州', nameEn: 'Wenzhou', timezoneId: 'Asia/Shanghai', longitude: 120.7, latitude: 28.0, region: 'china' },
  { name: '無錫', nameEn: 'Wuxi', timezoneId: 'Asia/Shanghai', longitude: 120.3, latitude: 31.6, region: 'china' },

  // ═══ 台灣 (Taiwan) ════════════════════════════════════════════
  { name: '台北', nameEn: 'Taipei', timezoneId: 'Asia/Taipei', longitude: 121.6, latitude: 25.0, region: 'taiwan' },
  { name: '高雄', nameEn: 'Kaohsiung', timezoneId: 'Asia/Taipei', longitude: 120.3, latitude: 22.6, region: 'taiwan' },
  { name: '台中', nameEn: 'Taichung', timezoneId: 'Asia/Taipei', longitude: 120.7, latitude: 24.1, region: 'taiwan' },
  { name: '台南', nameEn: 'Tainan', timezoneId: 'Asia/Taipei', longitude: 120.2, latitude: 23.0, region: 'taiwan' },
  { name: '新竹', nameEn: 'Hsinchu', timezoneId: 'Asia/Taipei', longitude: 120.9, latitude: 24.8, region: 'taiwan' },
  { name: '桃園', nameEn: 'Taoyuan', timezoneId: 'Asia/Taipei', longitude: 121.3, latitude: 25.0, region: 'taiwan' },
  { name: '花蓮', nameEn: 'Hualien', timezoneId: 'Asia/Taipei', longitude: 121.6, latitude: 24.0, region: 'taiwan' },
  { name: '嘉義', nameEn: 'Chiayi', timezoneId: 'Asia/Taipei', longitude: 120.4, latitude: 23.5, region: 'taiwan' },

  // ═══ 港澳 (Hong Kong / Macau) ═════════════════════════════════
  { name: '香港', nameEn: 'Hong Kong', timezoneId: 'Asia/Hong_Kong', longitude: 114.2, latitude: 22.3, region: 'hongkong' },
  { name: '澳門', nameEn: 'Macau', timezoneId: 'Asia/Macau', longitude: 113.5, latitude: 22.2, region: 'hongkong' },

  // ═══ 東南亞 (Southeast Asia) ═══════════════════════════════════
  { name: '新加坡', nameEn: 'Singapore', timezoneId: 'Asia/Singapore', longitude: 103.8, latitude: 1.4, region: 'sea' },
  { name: '吉隆坡', nameEn: 'Kuala Lumpur', timezoneId: 'Asia/Kuala_Lumpur', longitude: 101.7, latitude: 3.1, region: 'sea' },
  { name: '檳城', nameEn: 'Penang', timezoneId: 'Asia/Kuala_Lumpur', longitude: 100.3, latitude: 5.4, region: 'sea' },
  { name: '新山', nameEn: 'Johor Bahru', timezoneId: 'Asia/Kuala_Lumpur', longitude: 103.8, latitude: 1.5, region: 'sea' },
  { name: '古晉', nameEn: 'Kuching', timezoneId: 'Asia/Kuching', longitude: 110.3, latitude: 1.5, region: 'sea' },
  { name: '亞庇', nameEn: 'Kota Kinabalu', timezoneId: 'Asia/Kuching', longitude: 116.1, latitude: 6.0, region: 'sea' },
  { name: '曼谷', nameEn: 'Bangkok', timezoneId: 'Asia/Bangkok', longitude: 100.5, latitude: 13.8, region: 'sea' },
  { name: '清邁', nameEn: 'Chiang Mai', timezoneId: 'Asia/Bangkok', longitude: 98.9, latitude: 18.8, region: 'sea' },
  { name: '胡志明市', nameEn: 'Ho Chi Minh City', timezoneId: 'Asia/Ho_Chi_Minh', longitude: 106.7, latitude: 10.8, region: 'sea' },
  { name: '河內', nameEn: 'Hanoi', timezoneId: 'Asia/Ho_Chi_Minh', longitude: 105.8, latitude: 21.0, region: 'sea' },
  { name: '峴港', nameEn: 'Da Nang', timezoneId: 'Asia/Ho_Chi_Minh', longitude: 108.2, latitude: 16.1, region: 'sea' },
  { name: '雅加達', nameEn: 'Jakarta', timezoneId: 'Asia/Jakarta', longitude: 106.8, latitude: -6.2, region: 'sea' },
  { name: '泗水', nameEn: 'Surabaya', timezoneId: 'Asia/Jakarta', longitude: 112.8, latitude: -7.3, region: 'sea' },
  { name: '峇里島', nameEn: 'Bali', timezoneId: 'Asia/Makassar', longitude: 115.2, latitude: -8.7, region: 'sea' },
  { name: '馬尼拉', nameEn: 'Manila', timezoneId: 'Asia/Manila', longitude: 121.0, latitude: 14.6, region: 'sea' },
  { name: '宿霧', nameEn: 'Cebu', timezoneId: 'Asia/Manila', longitude: 123.9, latitude: 10.3, region: 'sea' },
  { name: '仰光', nameEn: 'Yangon', timezoneId: 'Asia/Yangon', longitude: 96.2, latitude: 16.9, region: 'sea' },
  { name: '金邊', nameEn: 'Phnom Penh', timezoneId: 'Asia/Phnom_Penh', longitude: 104.9, latitude: 11.6, region: 'sea' },
  { name: '永珍', nameEn: 'Vientiane', timezoneId: 'Asia/Vientiane', longitude: 102.6, latitude: 17.9, region: 'sea' },
  { name: '斯里巴加灣', nameEn: 'Bandar Seri Begawan', timezoneId: 'Asia/Brunei', longitude: 114.9, latitude: 4.9, region: 'sea' },

  // ═══ 東亞 (East Asia – Japan, Korea, Mongolia) ═════════════════
  { name: '東京', nameEn: 'Tokyo', timezoneId: 'Asia/Tokyo', longitude: 139.7, latitude: 35.7, region: 'eastasia' },
  { name: '大阪', nameEn: 'Osaka', timezoneId: 'Asia/Tokyo', longitude: 135.5, latitude: 34.7, region: 'eastasia' },
  { name: '京都', nameEn: 'Kyoto', timezoneId: 'Asia/Tokyo', longitude: 135.8, latitude: 35.0, region: 'eastasia' },
  { name: '名古屋', nameEn: 'Nagoya', timezoneId: 'Asia/Tokyo', longitude: 136.9, latitude: 35.2, region: 'eastasia' },
  { name: '札幌', nameEn: 'Sapporo', timezoneId: 'Asia/Tokyo', longitude: 141.3, latitude: 43.1, region: 'eastasia' },
  { name: '福岡', nameEn: 'Fukuoka', timezoneId: 'Asia/Tokyo', longitude: 130.4, latitude: 33.6, region: 'eastasia' },
  { name: '橫濱', nameEn: 'Yokohama', timezoneId: 'Asia/Tokyo', longitude: 139.6, latitude: 35.4, region: 'eastasia' },
  { name: '首爾', nameEn: 'Seoul', timezoneId: 'Asia/Seoul', longitude: 127.0, latitude: 37.6, region: 'eastasia' },
  { name: '釜山', nameEn: 'Busan', timezoneId: 'Asia/Seoul', longitude: 129.1, latitude: 35.2, region: 'eastasia' },
  { name: '仁川', nameEn: 'Incheon', timezoneId: 'Asia/Seoul', longitude: 126.7, latitude: 37.5, region: 'eastasia' },
  { name: '平壤', nameEn: 'Pyongyang', timezoneId: 'Asia/Pyongyang', longitude: 125.8, latitude: 39.0, region: 'eastasia' },
  { name: '烏蘭巴托', nameEn: 'Ulaanbaatar', timezoneId: 'Asia/Ulaanbaatar', longitude: 106.9, latitude: 47.9, region: 'eastasia' },

  // ═══ 南亞 (South Asia) ════════════════════════════════════════
  { name: '孟買', nameEn: 'Mumbai', timezoneId: 'Asia/Kolkata', longitude: 72.9, latitude: 19.1, region: 'southasia' },
  { name: '德里', nameEn: 'Delhi', timezoneId: 'Asia/Kolkata', longitude: 77.2, latitude: 28.6, region: 'southasia' },
  { name: '加爾各答', nameEn: 'Kolkata', timezoneId: 'Asia/Kolkata', longitude: 88.4, latitude: 22.6, region: 'southasia' },
  { name: '班加羅爾', nameEn: 'Bangalore', timezoneId: 'Asia/Kolkata', longitude: 77.6, latitude: 13.0, region: 'southasia' },
  { name: '清奈', nameEn: 'Chennai', timezoneId: 'Asia/Kolkata', longitude: 80.3, latitude: 13.1, region: 'southasia' },
  { name: '加德滿都', nameEn: 'Kathmandu', timezoneId: 'Asia/Kathmandu', longitude: 85.3, latitude: 27.7, region: 'southasia' },
  { name: '達卡', nameEn: 'Dhaka', timezoneId: 'Asia/Dhaka', longitude: 90.4, latitude: 23.8, region: 'southasia' },
  { name: '可倫坡', nameEn: 'Colombo', timezoneId: 'Asia/Colombo', longitude: 79.9, latitude: 6.9, region: 'southasia' },
  { name: '卡拉奇', nameEn: 'Karachi', timezoneId: 'Asia/Karachi', longitude: 67.0, latitude: 24.9, region: 'southasia' },
  { name: '拉合爾', nameEn: 'Lahore', timezoneId: 'Asia/Karachi', longitude: 74.3, latitude: 31.6, region: 'southasia' },

  // ═══ 中東 (Middle East) ═══════════════════════════════════════
  { name: '杜拜', nameEn: 'Dubai', timezoneId: 'Asia/Dubai', longitude: 55.3, latitude: 25.3, region: 'middleeast' },
  { name: '德黑蘭', nameEn: 'Tehran', timezoneId: 'Asia/Tehran', longitude: 51.4, latitude: 35.7, region: 'middleeast' },
  { name: '耶路撒冷', nameEn: 'Jerusalem', timezoneId: 'Asia/Jerusalem', longitude: 35.2, latitude: 31.8, region: 'middleeast' },
  { name: '特拉維夫', nameEn: 'Tel Aviv', timezoneId: 'Asia/Jerusalem', longitude: 34.8, latitude: 32.1, region: 'middleeast' },
  { name: '伊斯坦布爾', nameEn: 'Istanbul', timezoneId: 'Europe/Istanbul', longitude: 29.0, latitude: 41.0, region: 'middleeast' },
  { name: '安卡拉', nameEn: 'Ankara', timezoneId: 'Europe/Istanbul', longitude: 32.9, latitude: 39.9, region: 'middleeast' },
  { name: '利雅德', nameEn: 'Riyadh', timezoneId: 'Asia/Riyadh', longitude: 46.7, latitude: 24.7, region: 'middleeast' },
  { name: '開羅', nameEn: 'Cairo', timezoneId: 'Africa/Cairo', longitude: 31.2, latitude: 30.0, region: 'middleeast' },
  { name: '巴格達', nameEn: 'Baghdad', timezoneId: 'Asia/Baghdad', longitude: 44.4, latitude: 33.3, region: 'middleeast' },
  { name: '貝魯特', nameEn: 'Beirut', timezoneId: 'Asia/Beirut', longitude: 35.5, latitude: 33.9, region: 'middleeast' },
  { name: '安曼', nameEn: 'Amman', timezoneId: 'Asia/Amman', longitude: 35.9, latitude: 31.9, region: 'middleeast' },

  // ═══ 歐洲 (Europe) ════════════════════════════════════════════
  { name: '倫敦', nameEn: 'London', timezoneId: 'Europe/London', longitude: -0.1, latitude: 51.5, region: 'europe' },
  { name: '巴黎', nameEn: 'Paris', timezoneId: 'Europe/Paris', longitude: 2.3, latitude: 48.9, region: 'europe' },
  { name: '柏林', nameEn: 'Berlin', timezoneId: 'Europe/Berlin', longitude: 13.4, latitude: 52.5, region: 'europe' },
  { name: '阿姆斯特丹', nameEn: 'Amsterdam', timezoneId: 'Europe/Amsterdam', longitude: 4.9, latitude: 52.4, region: 'europe' },
  { name: '馬德里', nameEn: 'Madrid', timezoneId: 'Europe/Madrid', longitude: -3.7, latitude: 40.4, region: 'europe' },
  { name: '羅馬', nameEn: 'Rome', timezoneId: 'Europe/Rome', longitude: 12.5, latitude: 41.9, region: 'europe' },
  { name: '維也納', nameEn: 'Vienna', timezoneId: 'Europe/Vienna', longitude: 16.4, latitude: 48.2, region: 'europe' },
  { name: '布拉格', nameEn: 'Prague', timezoneId: 'Europe/Prague', longitude: 14.4, latitude: 50.1, region: 'europe' },
  { name: '華沙', nameEn: 'Warsaw', timezoneId: 'Europe/Warsaw', longitude: 21.0, latitude: 52.2, region: 'europe' },
  { name: '布達佩斯', nameEn: 'Budapest', timezoneId: 'Europe/Budapest', longitude: 19.0, latitude: 47.5, region: 'europe' },
  { name: '蘇黎世', nameEn: 'Zurich', timezoneId: 'Europe/Zurich', longitude: 8.5, latitude: 47.4, region: 'europe' },
  { name: '布魯塞爾', nameEn: 'Brussels', timezoneId: 'Europe/Brussels', longitude: 4.4, latitude: 50.8, region: 'europe' },
  { name: '斯德哥爾摩', nameEn: 'Stockholm', timezoneId: 'Europe/Stockholm', longitude: 18.1, latitude: 59.3, region: 'europe' },
  { name: '哥本哈根', nameEn: 'Copenhagen', timezoneId: 'Europe/Copenhagen', longitude: 12.6, latitude: 55.7, region: 'europe' },
  { name: '赫爾辛基', nameEn: 'Helsinki', timezoneId: 'Europe/Helsinki', longitude: 24.9, latitude: 60.2, region: 'europe' },
  { name: '雅典', nameEn: 'Athens', timezoneId: 'Europe/Athens', longitude: 23.7, latitude: 38.0, region: 'europe' },
  { name: '莫斯科', nameEn: 'Moscow', timezoneId: 'Europe/Moscow', longitude: 37.6, latitude: 55.8, region: 'europe' },
  { name: '聖彼得堡', nameEn: 'Saint Petersburg', timezoneId: 'Europe/Moscow', longitude: 30.3, latitude: 59.9, region: 'europe' },
  { name: '里斯本', nameEn: 'Lisbon', timezoneId: 'Europe/Lisbon', longitude: -9.1, latitude: 38.7, region: 'europe' },
  { name: '都柏林', nameEn: 'Dublin', timezoneId: 'Europe/Dublin', longitude: -6.3, latitude: 53.3, region: 'europe' },
  { name: '愛丁堡', nameEn: 'Edinburgh', timezoneId: 'Europe/London', longitude: -3.2, latitude: 55.9, region: 'europe' },
  { name: '巴塞羅那', nameEn: 'Barcelona', timezoneId: 'Europe/Madrid', longitude: 2.2, latitude: 41.4, region: 'europe' },
  { name: '米蘭', nameEn: 'Milan', timezoneId: 'Europe/Rome', longitude: 9.2, latitude: 45.5, region: 'europe' },
  { name: '慕尼黑', nameEn: 'Munich', timezoneId: 'Europe/Berlin', longitude: 11.6, latitude: 48.1, region: 'europe' },

  // ═══ 美洲 (Americas) ══════════════════════════════════════════
  { name: '紐約', nameEn: 'New York', timezoneId: 'America/New_York', longitude: -74.0, latitude: 40.7, region: 'americas' },
  { name: '洛杉磯', nameEn: 'Los Angeles', timezoneId: 'America/Los_Angeles', longitude: -118.2, latitude: 34.1, region: 'americas' },
  { name: '舊金山', nameEn: 'San Francisco', timezoneId: 'America/Los_Angeles', longitude: -122.4, latitude: 37.8, region: 'americas' },
  { name: '芝加哥', nameEn: 'Chicago', timezoneId: 'America/Chicago', longitude: -87.6, latitude: 41.9, region: 'americas' },
  { name: '休斯頓', nameEn: 'Houston', timezoneId: 'America/Chicago', longitude: -95.4, latitude: 29.8, region: 'americas' },
  { name: '華盛頓', nameEn: 'Washington DC', timezoneId: 'America/New_York', longitude: -77.0, latitude: 38.9, region: 'americas' },
  { name: '波士頓', nameEn: 'Boston', timezoneId: 'America/New_York', longitude: -71.1, latitude: 42.4, region: 'americas' },
  { name: '西雅圖', nameEn: 'Seattle', timezoneId: 'America/Los_Angeles', longitude: -122.3, latitude: 47.6, region: 'americas' },
  { name: '鳳凰城', nameEn: 'Phoenix', timezoneId: 'America/Phoenix', longitude: -112.1, latitude: 33.4, region: 'americas' },
  { name: '丹佛', nameEn: 'Denver', timezoneId: 'America/Denver', longitude: -105.0, latitude: 39.7, region: 'americas' },
  { name: '檀香山', nameEn: 'Honolulu', timezoneId: 'Pacific/Honolulu', longitude: -157.9, latitude: 21.3, region: 'americas' },
  { name: '多倫多', nameEn: 'Toronto', timezoneId: 'America/Toronto', longitude: -79.4, latitude: 43.7, region: 'americas' },
  { name: '溫哥華', nameEn: 'Vancouver', timezoneId: 'America/Vancouver', longitude: -123.1, latitude: 49.3, region: 'americas' },
  { name: '蒙特利爾', nameEn: 'Montreal', timezoneId: 'America/Toronto', longitude: -73.6, latitude: 45.5, region: 'americas' },
  { name: '墨西哥城', nameEn: 'Mexico City', timezoneId: 'America/Mexico_City', longitude: -99.1, latitude: 19.4, region: 'americas' },
  { name: '聖保羅', nameEn: 'São Paulo', timezoneId: 'America/Sao_Paulo', longitude: -46.6, latitude: -23.6, region: 'americas' },
  { name: '布宜諾斯艾利斯', nameEn: 'Buenos Aires', timezoneId: 'America/Argentina/Buenos_Aires', longitude: -58.4, latitude: -34.6, region: 'americas' },
  { name: '利馬', nameEn: 'Lima', timezoneId: 'America/Lima', longitude: -77.0, latitude: -12.0, region: 'americas' },
  { name: '波哥大', nameEn: 'Bogota', timezoneId: 'America/Bogota', longitude: -74.1, latitude: 4.7, region: 'americas' },
  { name: '聖地亞哥', nameEn: 'Santiago', timezoneId: 'America/Santiago', longitude: -70.7, latitude: -33.4, region: 'americas' },

  // ═══ 大洋洲 (Oceania) ═════════════════════════════════════════
  { name: '雪梨', nameEn: 'Sydney', timezoneId: 'Australia/Sydney', longitude: 151.2, latitude: -33.9, region: 'oceania' },
  { name: '墨爾本', nameEn: 'Melbourne', timezoneId: 'Australia/Melbourne', longitude: 145.0, latitude: -37.8, region: 'oceania' },
  { name: '布里斯班', nameEn: 'Brisbane', timezoneId: 'Australia/Brisbane', longitude: 153.0, latitude: -27.5, region: 'oceania' },
  { name: '柏斯', nameEn: 'Perth', timezoneId: 'Australia/Perth', longitude: 115.9, latitude: -31.9, region: 'oceania' },
  { name: '阿德萊德', nameEn: 'Adelaide', timezoneId: 'Australia/Adelaide', longitude: 138.6, latitude: -34.9, region: 'oceania' },
  { name: '奧克蘭', nameEn: 'Auckland', timezoneId: 'Pacific/Auckland', longitude: 174.8, latitude: -36.9, region: 'oceania' },
  { name: '威靈頓', nameEn: 'Wellington', timezoneId: 'Pacific/Auckland', longitude: 174.8, latitude: -41.3, region: 'oceania' },

  // ═══ 非洲 (Africa) ════════════════════════════════════════════
  { name: '約翰內斯堡', nameEn: 'Johannesburg', timezoneId: 'Africa/Johannesburg', longitude: 28.0, latitude: -26.2, region: 'africa' },
  { name: '奈洛比', nameEn: 'Nairobi', timezoneId: 'Africa/Nairobi', longitude: 36.8, latitude: -1.3, region: 'africa' },
  { name: '拉各斯', nameEn: 'Lagos', timezoneId: 'Africa/Lagos', longitude: 3.4, latitude: 6.5, region: 'africa' },
  { name: '卡薩布蘭卡', nameEn: 'Casablanca', timezoneId: 'Africa/Casablanca', longitude: -7.6, latitude: 33.6, region: 'africa' },
  { name: '開普敦', nameEn: 'Cape Town', timezoneId: 'Africa/Johannesburg', longitude: 18.4, latitude: -33.9, region: 'africa' },
];

// ── Search ──────────────────────────────────────────────────

/**
 * Search cities by name (Chinese or English, case-insensitive).
 * Returns all cities if query is empty.
 */
export function searchCities(query: string): CityTimezone[] {
  if (!query.trim()) return CITIES;
  const q = query.toLowerCase().trim();
  return CITIES.filter(
    c => c.name.includes(q) || c.nameEn.toLowerCase().includes(q),
  );
}

/**
 * Get cities grouped by region key.
 */
export function getCitiesByRegion(): Map<CityRegionKey, CityTimezone[]> {
  const map = new Map<CityRegionKey, CityTimezone[]>();
  for (const city of CITIES) {
    const list = map.get(city.region) ?? [];
    list.push(city);
    map.set(city.region, list);
  }
  return map;
}

/**
 * Find the nearest city to given coordinates (simple Euclidean on lon/lat).
 * Useful for geolocation-based city suggestion.
 */
export function findNearestCity(longitude: number, latitude: number): CityTimezone | undefined {
  let best: CityTimezone | undefined;
  let bestDist = Infinity;
  for (const c of CITIES) {
    const dlng = c.longitude - longitude;
    const dlat = c.latitude - latitude;
    const dist = dlng * dlng + dlat * dlat;
    if (dist < bestDist) {
      bestDist = dist;
      best = c;
    }
  }
  return best;
}
