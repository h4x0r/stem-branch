/* v8 ignore next */
// ── Body identifiers ─────────────────────────────────────────

export type Governor = 'sun' | 'moon' | 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn';
export type Remainder = 'rahu' | 'ketu' | 'yuebei' | 'purpleQi';
export type GovernorOrRemainder = Governor | Remainder;

export const GOVERNORS: readonly Governor[] = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];
export const REMAINDERS: readonly Remainder[] = ['rahu', 'ketu', 'yuebei', 'purpleQi'];
export const ALL_BODIES: readonly GovernorOrRemainder[] = [...GOVERNORS, ...REMAINDERS];

// ── Chinese names ────────────────────────────────────────────

export const BODY_CHINESE: Record<GovernorOrRemainder, string> = {
  sun: '太陽', moon: '太陰',
  mercury: '水星', venus: '金星', mars: '火星', jupiter: '木星', saturn: '土星',
  rahu: '羅睺', ketu: '計都', yuebei: '月孛', purpleQi: '紫氣',
};

// ── Sidereal mode ────────────────────────────────────────────

export type SiderealMode =
  | { type: 'modern' }
  | { type: 'classical'; epoch: 'kaiyuan' | 'chongzhen' | number }
  | { type: 'ayanamsa'; value: number };

export type KetuMode = 'apogee' | 'descending-node';

// ── Mansion and Palace names ─────────────────────────────────

export type MansionName =
  | '角' | '亢' | '氐' | '房' | '心' | '尾' | '箕'
  | '斗' | '牛' | '女' | '虛' | '危' | '室' | '壁'
  | '奎' | '婁' | '胃' | '昴' | '畢' | '觜' | '參'
  | '井' | '鬼' | '柳' | '星' | '張' | '翼' | '軫';

export type PalaceName =
  | '子宮' | '丑宮' | '寅宮' | '卯宮' | '辰宮' | '巳宮'
  | '午宮' | '未宮' | '申宮' | '酉宮' | '戌宮' | '亥宮';

export type PalaceRole =
  | '命宮' | '財帛宮' | '兄弟宮' | '田宅宮' | '男女宮' | '奴僕宮'
  | '妻妾宮' | '疾厄宮' | '遷移宮' | '官祿宮' | '福德宮' | '相貌宮';

export const PALACE_ROLES: readonly PalaceRole[] = [
  '命宮', '兄弟宮', '妻妾宮', '男女宮', '財帛宮', '疾厄宮',
  '遷移宮', '奴僕宮', '官祿宮', '田宅宮', '福德宮', '相貌宮',
];

export type Dignity = '廟' | '旺' | '平' | '陷';
export type AspectType = '合' | '沖' | '刑' | '三合';

// ── Position output ──────────────────────────────────────────

export interface BodyPosition {
  siderealLon: number;
  tropicalLon: number;
  mansion: MansionName;
  mansionDegree: number;
  palace: PalaceName;
}

// ── Chart structures ─────────────────────────────────────────

export interface PalaceInfo {
  name: PalaceName;
  role: PalaceRole;
  mansions: MansionName[];
  occupants: GovernorOrRemainder[];
}

export interface StarSpirit {
  name: string;
  type: 'auspicious' | 'malefic';
  condition: string;
  source: string;
}

export interface Aspect {
  body1: GovernorOrRemainder;
  body2: GovernorOrRemainder;
  type: AspectType;
  name?: string;
}

export interface SevenGovernorsOptions {
  siderealMode?: SiderealMode;
  ketuMode?: KetuMode;
}

export interface SevenGovernorsChart {
  date: Date;
  location: { lat: number; lon: number };
  siderealMode: SiderealMode;
  ketuMode: KetuMode;
  bodies: Record<GovernorOrRemainder, BodyPosition>;
  palaces: PalaceInfo[];
  ascendant: { mansion: MansionName; palace: PalaceName };
  starSpirits: StarSpirit[];
  aspects: Aspect[];
  dignities: Record<GovernorOrRemainder, Dignity>;
}
