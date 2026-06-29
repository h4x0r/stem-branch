//! Sexagenary name labels — the ten Heavenly Stems (天干) and twelve Earthly
//! Branches (地支). Ported verbatim from the TypeScript `STEMS` / `BRANCHES`
//! (`src/stems.ts`, `src/branches.ts`); Traditional Chinese.

/// The ten Heavenly Stems (天干), index 0 = 甲.
pub const HEAVENLY_STEMS: [&str; 10] = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];

/// The twelve Earthly Branches (地支), index 0 = 子.
pub const EARTHLY_BRANCHES: [&str; 12] = [
    "子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥",
];
