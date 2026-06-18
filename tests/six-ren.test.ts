import { describe, it, expect } from 'vitest';
import {
  STEM_LODGING,
  HEAVENLY_GENERALS,
  getMonthlyGeneral,
  buildPlates,
  buildFourLessons,
  computeSixRen,
  computeSixRenForDate,
} from '../src/six-ren';
import { BRANCHES } from '../src/branches';

// ═══════════════════════════════════════════════════════════════
//  Constants
// ═══════════════════════════════════════════════════════════════

describe('STEM_LODGING', () => {
  it('maps each stem to its lodging branch (same as 祿)', () => {
    expect(STEM_LODGING['甲']).toBe('寅');
    expect(STEM_LODGING['乙']).toBe('卯');
    expect(STEM_LODGING['丙']).toBe('巳');
    expect(STEM_LODGING['丁']).toBe('午');
    expect(STEM_LODGING['戊']).toBe('巳');
    expect(STEM_LODGING['己']).toBe('午');
    expect(STEM_LODGING['庚']).toBe('申');
    expect(STEM_LODGING['辛']).toBe('酉');
    expect(STEM_LODGING['壬']).toBe('亥');
    expect(STEM_LODGING['癸']).toBe('子');
  });
});

describe('HEAVENLY_GENERALS', () => {
  it('has exactly 12 values', () => {
    expect(HEAVENLY_GENERALS).toHaveLength(12);
  });

  it('starts with 貴人 and ends with 天后', () => {
    expect(HEAVENLY_GENERALS[0]).toBe('貴人');
    expect(HEAVENLY_GENERALS[11]).toBe('天后');
  });

  it('contains all twelve generals in traditional order', () => {
    expect(HEAVENLY_GENERALS).toEqual([
      '貴人', '螣蛇', '朱雀', '六合', '勾陳', '青龍',
      '天空', '白虎', '太常', '玄武', '太陰', '天后',
    ]);
  });
});

// ═══════════════════════════════════════════════════════════════
//  buildPlates
// ═══════════════════════════════════════════════════════════════

describe('buildPlates', () => {
  it('aligns monthly general over hour branch', () => {
    // 月將=戌 over 時辰=午
    const plates = buildPlates('戌', '午');
    expect(plates['午']).toBe('戌');
  });

  it('rotates all 12 branches correctly (offset 4)', () => {
    // 月將=戌(10), 時辰=午(6) → offset = 4
    const plates = buildPlates('戌', '午');
    expect(plates['子']).toBe('辰');
    expect(plates['丑']).toBe('巳');
    expect(plates['寅']).toBe('午');
    expect(plates['卯']).toBe('未');
    expect(plates['辰']).toBe('申');
    expect(plates['巳']).toBe('酉');
    expect(plates['午']).toBe('戌');
    expect(plates['未']).toBe('亥');
    expect(plates['申']).toBe('子');
    expect(plates['酉']).toBe('丑');
    expect(plates['戌']).toBe('寅');
    expect(plates['亥']).toBe('卯');
  });

  it('offset 8: 月將=亥 over 時辰=卯', () => {
    // 月將=亥(11), 時辰=卯(3) → offset = 8
    const plates = buildPlates('亥', '卯');
    expect(plates['卯']).toBe('亥'); // monthly general aligned
    expect(plates['子']).toBe('申');
    expect(plates['辰']).toBe('子');
    expect(plates['午']).toBe('寅');
  });

  it('伏吟: offset 0 is identity', () => {
    const plates = buildPlates('子', '子');
    expect(plates['子']).toBe('子');
    expect(plates['午']).toBe('午');
    expect(plates['寅']).toBe('寅');
    expect(plates['酉']).toBe('酉');
  });

  it('返吟: offset 6 maps each branch to its clash', () => {
    const plates = buildPlates('午', '子');
    expect(plates['子']).toBe('午');
    expect(plates['午']).toBe('子');
    expect(plates['丑']).toBe('未');
    expect(plates['寅']).toBe('申');
    expect(plates['卯']).toBe('酉');
    expect(plates['辰']).toBe('戌');
    expect(plates['巳']).toBe('亥');
  });
});

// ═══════════════════════════════════════════════════════════════
//  buildFourLessons
// ═══════════════════════════════════════════════════════════════

describe('buildFourLessons', () => {
  it('壬子日 with offset 4 plates', () => {
    const plates = buildPlates('戌', '午');
    const lessons = buildFourLessons('壬', '子', plates);

    // 壬 lodging = 亥
    // L1: plates[亥]=卯 / 亥
    expect(lessons[0]).toEqual({ upper: '卯', lower: '亥' });
    // L2: plates[卯]=未 / 卯
    expect(lessons[1]).toEqual({ upper: '未', lower: '卯' });
    // L3: plates[子]=辰 / 子
    expect(lessons[2]).toEqual({ upper: '辰', lower: '子' });
    // L4: plates[辰]=申 / 辰
    expect(lessons[3]).toEqual({ upper: '申', lower: '辰' });
  });

  it('甲子日 with offset 8 plates', () => {
    const plates = buildPlates('亥', '卯');
    const lessons = buildFourLessons('甲', '子', plates);

    // 甲 lodging = 寅
    // L1: plates[寅]=戌 / 寅
    expect(lessons[0]).toEqual({ upper: '戌', lower: '寅' });
    // L2: plates[戌]=午 / 戌
    expect(lessons[1]).toEqual({ upper: '午', lower: '戌' });
    // L3: plates[子]=申 / 子
    expect(lessons[2]).toEqual({ upper: '申', lower: '子' });
    // L4: plates[申]=辰 / 申
    expect(lessons[3]).toEqual({ upper: '辰', lower: '申' });
  });

  it('辛卯日 with offset 2 plates', () => {
    const plates = buildPlates('辰', '寅');
    const lessons = buildFourLessons('辛', '卯', plates);

    // 辛 lodging = 酉
    // L1: plates[酉]=亥 / 酉
    expect(lessons[0]).toEqual({ upper: '亥', lower: '酉' });
    // L2: plates[亥]=丑 / 亥
    expect(lessons[1]).toEqual({ upper: '丑', lower: '亥' });
    // L3: plates[卯]=巳 / 卯
    expect(lessons[2]).toEqual({ upper: '巳', lower: '卯' });
    // L4: plates[巳]=未 / 巳
    expect(lessons[3]).toEqual({ upper: '未', lower: '巳' });
  });
});

// ═══════════════════════════════════════════════════════════════
//  computeSixRen — 賊剋法 (single match)
// ═══════════════════════════════════════════════════════════════

describe('computeSixRen', () => {
  describe('賊剋法 — single 下賊上', () => {
    it('壬子日 午時 月將戌: L2 下賊上(木剋土) → 初傳=未', () => {
      const chart = computeSixRen('壬', '子', '午', '戌');

      expect(chart.dayStem).toBe('壬');
      expect(chart.dayBranch).toBe('子');
      expect(chart.hourBranch).toBe('午');
      expect(chart.monthlyGeneral).toBe('戌');

      // Verify plates alignment
      expect(chart.plates['午']).toBe('戌');

      // Verify four lessons
      expect(chart.lessons[0]).toEqual({ upper: '卯', lower: '亥' });
      expect(chart.lessons[1]).toEqual({ upper: '未', lower: '卯' });
      expect(chart.lessons[2]).toEqual({ upper: '辰', lower: '子' });
      expect(chart.lessons[3]).toEqual({ upper: '申', lower: '辰' });

      // L2: 卯(木) conquers 未(土) → 下賊上, single match
      expect(chart.method).toBe('賊剋');
      expect(chart.transmissions.initial).toBe('未');
      expect(chart.transmissions.middle).toBe('亥');  // plates[未]=亥
      expect(chart.transmissions.final).toBe('卯');   // plates[亥]=卯
    });

    it('甲子日 卯時 月將亥: L1 下賊上(木剋土) → 初傳=戌', () => {
      const chart = computeSixRen('甲', '子', '卯', '亥');

      expect(chart.method).toBe('賊剋');
      expect(chart.transmissions.initial).toBe('戌');
      expect(chart.transmissions.middle).toBe('午');  // plates[戌]=午
      expect(chart.transmissions.final).toBe('寅');   // plates[午]=寅
    });
  });

  describe('賊剋法 — single 上剋下 (no 下賊上)', () => {
    it('辛卯日 寅時 月將辰: L2 上剋下(土剋水) → 初傳=丑', () => {
      const chart = computeSixRen('辛', '卯', '寅', '辰');

      // L1: 亥(水)/酉(金) → 金生水, no 克
      // L2: 丑(土)/亥(水) → 土剋水, 上剋下
      // L3: 巳(火)/卯(木) → 木生火, no 克
      // L4: 未(土)/巳(火) → 火生土, no 克
      expect(chart.method).toBe('賊剋');
      expect(chart.transmissions.initial).toBe('丑');
      expect(chart.transmissions.middle).toBe('卯');  // plates[丑]=卯
      expect(chart.transmissions.final).toBe('巳');   // plates[卯]=巳
    });
  });

  // ── Generals placement ───────────────────────────────────────

  describe('十二天將 placement', () => {
    it('壬日 daytime(午時): 貴人=巳, 順行', () => {
      const chart = computeSixRen('壬', '子', '午', '戌');

      // 壬 HEAVENLY_NOBLE = ['巳','卯']. 午 = daytime → first = 巳
      // 巳 index = 5 (in 5-10 range) → 順行 (ascending)
      expect(chart.generals['巳']).toBe('貴人');
      expect(chart.generals['午']).toBe('螣蛇');
      expect(chart.generals['未']).toBe('朱雀');
      expect(chart.generals['申']).toBe('六合');
      expect(chart.generals['酉']).toBe('勾陳');
      expect(chart.generals['戌']).toBe('青龍');
      expect(chart.generals['亥']).toBe('天空');
      expect(chart.generals['子']).toBe('白虎');
      expect(chart.generals['丑']).toBe('太常');
      expect(chart.generals['寅']).toBe('玄武');
      expect(chart.generals['卯']).toBe('太陰');
      expect(chart.generals['辰']).toBe('天后');
    });

    it('甲日 daytime(卯時): 貴人=丑, 逆行', () => {
      const chart = computeSixRen('甲', '子', '卯', '亥');

      // 甲 HEAVENLY_NOBLE = ['丑','未']. 卯 = daytime → first = 丑
      // 丑 index = 1 (in 11-4 range) → 逆行 (descending)
      expect(chart.generals['丑']).toBe('貴人');
      expect(chart.generals['子']).toBe('螣蛇');
      expect(chart.generals['亥']).toBe('朱雀');
      expect(chart.generals['戌']).toBe('六合');
      expect(chart.generals['酉']).toBe('勾陳');
      expect(chart.generals['申']).toBe('青龍');
      expect(chart.generals['未']).toBe('天空');
      expect(chart.generals['午']).toBe('白虎');
      expect(chart.generals['巳']).toBe('太常');
      expect(chart.generals['辰']).toBe('玄武');
      expect(chart.generals['卯']).toBe('太陰');
      expect(chart.generals['寅']).toBe('天后');
    });

    it('all 12 branches have exactly one general assigned', () => {
      const chart = computeSixRen('壬', '子', '午', '戌');
      const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;
      const assigned = new Set<string>();
      for (const b of branches) {
        expect(chart.generals[b]).toBeDefined();
        assigned.add(chart.generals[b]);
      }
      expect(assigned.size).toBe(12);
    });
  });
});

// ═══════════════════════════════════════════════════════════════
//  getMonthlyGeneral (requires VSOP87D — slow)
// ═══════════════════════════════════════════════════════════════

describe('getMonthlyGeneral', () => {
  it('returns correct general for dates after known zhongqi', { timeout: 30_000 }, () => {
    // After 大寒 (~Jan 20, 2024): 月將=子
    expect(getMonthlyGeneral(new Date(2024, 0, 25))).toBe('子');
    // After 雨水 (~Feb 19, 2024): 月將=亥
    expect(getMonthlyGeneral(new Date(2024, 1, 25))).toBe('亥');
    // After 夏至 (~Jun 21, 2024): 月將=未
    expect(getMonthlyGeneral(new Date(2024, 5, 25))).toBe('未');
    // After 秋分 (~Sep 22, 2024): 月將=辰
    expect(getMonthlyGeneral(new Date(2024, 8, 25))).toBe('辰');
  });

  it('handles year boundary: before 大寒 falls in previous 冬至 period', { timeout: 30_000 }, () => {
    // 2024-01-05 is before 大寒 (~Jan 20) → after 冬至 2023 (~Dec 22) → 月將=丑
    expect(getMonthlyGeneral(new Date(2024, 0, 5))).toBe('丑');
  });
});

// ═══════════════════════════════════════════════════════════════
//  computeSixRenForDate (requires VSOP87D — slow)
// ═══════════════════════════════════════════════════════════════

describe('computeSixRenForDate', () => {
  it('returns a valid chart for a known date', { timeout: 30_000 }, () => {
    const chart = computeSixRenForDate(new Date(2024, 5, 15), 14); // Jun 15, 2pm
    expect(chart.dayStem).toBeDefined();
    expect(chart.dayBranch).toBeDefined();
    expect(chart.hourBranch).toBeDefined();
    expect(chart.monthlyGeneral).toBeDefined();
    expect(chart.lessons).toHaveLength(4);
    expect(chart.transmissions.initial).toBeDefined();
    expect(chart.transmissions.middle).toBeDefined();
    expect(chart.transmissions.final).toBeDefined();
    expect(chart.method).toBeDefined();
  });

  it('uses date hour when hour param not given', { timeout: 30_000 }, () => {
    const date = new Date(2024, 5, 15, 14, 30); // 2:30pm → 未時
    const chart = computeSixRenForDate(date);
    expect(chart.hourBranch).toBe('未');
  });
});

// ═══════════════════════════════════════════════════════════════
//  伏吟 (Still Plates) — offset 0
// ═══════════════════════════════════════════════════════════════

describe('伏吟 (Still Plates) — offset 0', () => {
  // When monthlyGeneral === hourBranch, offset is 0 → handleStillPlates
  // Use monthlyGeneral='午' and hourBranch='午'
  it('produces 伏吟 method', () => {
    const chart = computeSixRen('甲', '子', '午', '午');
    expect(chart.method).toBe('伏吟');
  });

  it('uses clash-based chain for transmissions', () => {
    const chart = computeSixRen('甲', '子', '午', '午');
    // In 伏吟, middle transmission = clash of initial, final = clash of middle (= initial)
    expect(chart.transmissions.final).toBe(chart.transmissions.initial);
  });
});

// ═══════════════════════════════════════════════════════════════
//  返吟 (Clash Plates) — offset 6
// ═══════════════════════════════════════════════════════════════

describe('返吟 (Clash Plates) — offset 6', () => {
  // When monthlyGeneral is 6 positions from hourBranch → handleClashPlates
  // hourBranch='子' (idx 0), monthlyGeneral='午' (idx 6): offset = (6-0+12)%12 = 6
  it('produces 返吟 method', () => {
    const chart = computeSixRen('甲', '子', '子', '午');
    expect(chart.method).toBe('返吟');
  });
});

// ═══════════════════════════════════════════════════════════════
//  handleNoConquest — 遙剋
// ═══════════════════════════════════════════════════════════════

describe('handleNoConquest — 遙剋', () => {
  it('single keOnStem: upper element conquers day stem element', () => {
    // 甲(木) 丑日 子時 月將酉 → offset=9
    // Lessons: 亥(水)/寅(木), 申(金)/亥(水), 戌(土)/丑(土), 未(土)/戌(土)
    // No direct 剋 in any lesson.
    // keOnStem: only 申(金) conquers 木 → single → initial=申
    const chart = computeSixRen('甲', '丑', '子', '酉');
    expect(chart.method).toBe('遙剋');
    expect(chart.transmissions.initial).toBe('申');
    expect(chart.transmissions.middle).toBe('巳');  // plates[申]
    expect(chart.transmissions.final).toBe('寅');   // plates[巳]
  });

  it('single stemKeOn: day stem element conquers upper element', () => {
    // 丙(火) 卯日 子時 月將寅 → offset=2
    // Lessons: 未(土)/巳(火), 酉(金)/未(土), 巳(火)/卯(木), 未(土)/巳(火)
    // No direct 剋 in any lesson.
    // keOnStem: none (no upper conquers 火)
    // stemKeOn: only 酉(金) — 火剋金 → single → initial=酉
    const chart = computeSixRen('丙', '卯', '子', '寅');
    expect(chart.method).toBe('遙剋');
    expect(chart.transmissions.initial).toBe('酉');
    expect(chart.transmissions.middle).toBe('亥');  // plates[酉]
    expect(chart.transmissions.final).toBe('丑');   // plates[亥]
  });

  it('multiple keOnStem: selectByPolarity picks yang branch for yang stem', () => {
    // 甲(木,陽) 卯日 子時 月將酉 → offset=9
    // Lessons: 亥(水)/寅(木), 申(金)/亥(水), 子(水)/卯(木), 酉(金)/子(水)
    // No direct 剋 in any lesson.
    // keOnStem: 申(金,陽) and 酉(金,陰) both conquer 木
    // selectByPolarity: 甲=陽 → picks 申(陽) over 酉(陰)
    const chart = computeSixRen('甲', '卯', '子', '酉');
    expect(chart.method).toBe('遙剋');
    expect(chart.transmissions.initial).toBe('申');
    expect(chart.transmissions.middle).toBe('巳');
    expect(chart.transmissions.final).toBe('寅');
  });

  it('multiple stemKeOn: selectByPolarity picks yang branch for yang stem', () => {
    // 甲(木,陽) 酉日 子時 月將辰 → offset=4
    // Lessons: 午(火)/寅(木), 戌(土)/午(火), 丑(土)/酉(金), 巳(火)/丑(土)
    // No direct 剋 in any lesson. keOnStem: none.
    // stemKeOn: 戌(土,陽) and 丑(土,陰) — 木剋土
    // selectByPolarity: 甲=陽 → picks 戌(陽) over 丑(陰)
    const chart = computeSixRen('甲', '酉', '子', '辰');
    expect(chart.method).toBe('遙剋');
    expect(chart.transmissions.initial).toBe('戌');
    expect(chart.transmissions.middle).toBe('寅');
    expect(chart.transmissions.final).toBe('午');
  });
});

// ═══════════════════════════════════════════════════════════════
//  handleNoConquest — 別責
// ═══════════════════════════════════════════════════════════════

describe('handleNoConquest — 別責', () => {
  it('no 剋, no 遙剋, lessons not all identical → 別責', () => {
    // 丙(火) 辰日 子時 月將丑 → offset=1
    // Lessons: 午(火)/巳(火), 未(土)/午(火), 巳(火)/辰(土), 午(火)/巳(火)
    // No direct 剋 in any lesson.
    // keOnStem: none (no upper element conquers 火)
    // stemKeOn: none (火 doesn't conquer any upper element: 火,土,火,火)
    // Not all lessons identical → 別責, initial = L1.upper = 午
    const chart = computeSixRen('丙', '辰', '子', '丑');
    expect(chart.method).toBe('別責');
    expect(chart.transmissions.initial).toBe('午');
    expect(chart.transmissions.middle).toBe('未');  // plates[午]
    expect(chart.transmissions.final).toBe('申');   // plates[未]
  });
});

// ═══════════════════════════════════════════════════════════════
//  getMonthlyGeneral fallback paths
// ═══════════════════════════════════════════════════════════════

describe('getMonthlyGeneral fallback paths', () => {
  it('handles dates before 大寒 (early January)', () => {
    // Jan 5, 2024 is before 大寒 (~Jan 20) → falls back to previous year's terms
    const result = getMonthlyGeneral(new Date('2024-01-05T00:00:00Z'));
    expect(BRANCHES.includes(result)).toBe(true);
  });

  it('handles date in early November before 小雪', () => {
    // Nov 1 is typically before 小雪 (~Nov 22)
    const result = getMonthlyGeneral(new Date('2024-11-01T00:00:00Z'));
    expect(BRANCHES.includes(result)).toBe(true);
  });

  it('handles date in December after 冬至', () => {
    // Dec 25 is after 冬至 (~Dec 21) → should match 冬至 → 丑
    const result = getMonthlyGeneral(new Date('2024-12-25T00:00:00Z'));
    expect(result).toBe('丑');
  });
});

// ═══════════════════════════════════════════════════════════════
//  Night-time generals
// ═══════════════════════════════════════════════════════════════

describe('Night-time generals', () => {
  it('uses different noble person position at night', () => {
    // Night hours: 酉 (17:00-19:00), 戌 (19:00-21:00), 亥 (21:00-23:00), 子 (23:00-01:00)
    const dayChart = computeSixRen('甲', '子', '午', '未');  // 午 is daytime
    const nightChart = computeSixRen('甲', '子', '子', '未');  // 子 is nighttime
    // They should have different heavenly generals
    expect(dayChart.generals).not.toEqual(nightChart.generals);
  });
});

// ═══════════════════════════════════════════════════════════════
//  比用 — multiple 剋, polarity resolves to single winner
// ═══════════════════════════════════════════════════════════════

describe('比用 — normal path', () => {
  it('甲子日 子時 月將巳: 3 下賊上, polarity=陽 picks 子 → 比用', () => {
    // 甲(木,陽) 子日 子時 月將巳 → offset=5
    // Lessons: 未(土)/寅(木), 子(水)/未(土), 巳(火)/子(水), 戌(土)/巳(火)
    // 下賊上: L1 寅(木)剋未(土), L2 未(土)剋子(水), L3 子(水)剋巳(火)
    // 3 candidates. matchByPolarity: 甲=陽 → 子(陽) is only match → 比用
    const chart = computeSixRen('甲', '子', '子', '巳');
    expect(chart.method).toBe('比用');
    expect(chart.transmissions.initial).toBe('子');
    expect(chart.transmissions.middle).toBe('巳');  // plates[子]
    expect(chart.transmissions.final).toBe('戌');   // plates[巳]
  });
});

// ═══════════════════════════════════════════════════════════════
//  涉害 — multiple 剋, polarity doesn't resolve
// ═══════════════════════════════════════════════════════════════

describe('涉害 — normal path', () => {
  it('甲卯日 子時 月將辰: 2 下賊上 with distinct branches, both 陰 → 涉害', () => {
    // 甲(木,陽) 卯日 子時 月將辰 → offset=4
    // Lessons: 午(火)/寅(木), 戌(土)/午(火), 未(土)/卯(木), 亥(水)/未(土)
    // 下賊上: L3 卯(木)剋未(土), L4 未(土)剋亥(水) → 2 candidates: 未(陰), 亥(陰)
    // matchByPolarity: 甲=陽, but both 未 and 亥 are 陰 → no match → keep both
    // → measureHarmDepth resolves → 涉害
    const chart = computeSixRen('甲', '卯', '子', '辰');
    expect(chart.method).toBe('涉害');
    expect(chart.transmissions.initial).toBe('未');
    expect(chart.transmissions.middle).toBe('亥');  // plates[未]
    expect(chart.transmissions.final).toBe('卯');   // plates[亥]
  });
});

// ═══════════════════════════════════════════════════════════════
//  返吟 — multiple conquests sub-paths
// ═══════════════════════════════════════════════════════════════

describe('返吟 — multiple conquests', () => {
  it('甲卯日 子時 月將午: 2 下賊上, polarity=陽 picks 寅 → 返吟 比用 path', () => {
    // 甲(木,陽) 卯日 子時 月將午 → offset=6
    // Lessons: 申(金)/寅(木), 寅(木)/申(金), 酉(金)/卯(木), 卯(木)/酉(金)
    // 下賊上: L2 申(金)→寅 is 上剋下; L2 寅(木)/申(金) → 金剋木 → 下賊上? No...
    // Actually: L2: upper=寅(木), lower=申(金). 金剋木: lower conquers upper → 下賊上
    // L4: upper=卯(木), lower=酉(金). 金剋木: lower conquers upper → 下賊上
    // 2 下賊上 candidates: 寅(陽), 卯(陰). 甲=陽 → picks 寅
    const chart = computeSixRen('甲', '卯', '子', '午');
    expect(chart.method).toBe('返吟');
    expect(chart.transmissions.initial).toBe('寅');
    expect(chart.transmissions.middle).toBe('申');  // plates[寅]=申 (offset 6)
    expect(chart.transmissions.final).toBe('寅');   // plates[申]=寅
  });

  it('甲子日 子時 月將午: 2 下賊上 both 陽 → 返吟 涉害 path', () => {
    // 甲(木,陽) 子日 子時 月將午 → offset=6
    // Lessons: 申(金)/寅(木), 寅(木)/申(金), 午(火)/子(水), 子(水)/午(火)
    // 下賊上: L2 寅(木,陽)/申(金) → 下賊上, L3 午(火,陽)/子(水) → 下賊上
    // matchByPolarity: both 寅(陽) and 午(陽) match 甲(陽) → still 2 → measureHarmDepth
    const chart = computeSixRen('甲', '子', '子', '午');
    expect(chart.method).toBe('返吟');
    expect(chart.transmissions.initial).toBe('寅');
    expect(chart.transmissions.middle).toBe('申');  // plates[寅]=申
    expect(chart.transmissions.final).toBe('寅');   // plates[申]=寅
  });
});
