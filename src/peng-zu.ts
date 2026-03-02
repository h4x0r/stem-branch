/**
 * 彭祖百忌 (Peng Zu Taboos)
 *
 * Traditional daily taboos attributed to Peng Zu (彭祖), organized by
 * the day's Heavenly Stem and Earthly Branch. Each stem and branch
 * has one associated taboo saying.
 */

import type { Stem, Branch } from './types';
import { computeFourPillars } from './four-pillars';

// ── Stem taboos (天干禁忌) ───────────────────────────────────

const STEM_TABOOS: Record<Stem, string> = {
  '甲': '甲不開倉財物耗散',
  '乙': '乙不栽植千株不長',
  '丙': '丙不修灶必見災殃',
  '丁': '丁不剃頭頭必生瘡',
  '戊': '戊不受田田主不祥',
  '己': '己不破券二比並亡',
  '庚': '庚不經絡織機虛張',
  '辛': '辛不合醬主人不嘗',
  '壬': '壬不汲水更難提防',
  '癸': '癸不詞訟理弱敵強',
};

// ── Branch taboos (地支禁忌) ─────────────────────────────────

const BRANCH_TABOOS: Record<Branch, string> = {
  '子': '子不問卜自惹禍殃',
  '丑': '丑不冠帶主不還鄉',
  '寅': '寅不祭祀神鬼不嘗',
  '卯': '卯不穿井水泉不香',
  '辰': '辰不哭泣必主重喪',
  '巳': '巳不遠行財物伏藏',
  '午': '午不苫蓋屋主更張',
  '未': '未不服藥毒氣入腸',
  '申': '申不安床鬼祟入房',
  '酉': '酉不宴客醉坐顛狂',
  '戌': '戌不吃犬作怪上床',
  '亥': '亥不嫁娶不利新郎',
};

// ── Public API ───────────────────────────────────────────────

export interface PengZuTaboo {
  stem: string;
  branch: string;
}

export function getPengZuTaboo(stem: Stem, branch: Branch): PengZuTaboo {
  return {
    stem: STEM_TABOOS[stem],
    branch: BRANCH_TABOOS[branch],
  };
}

export function getPengZuTabooForDate(date: Date): PengZuTaboo {
  const pillars = computeFourPillars(date);
  return getPengZuTaboo(pillars.day.stem, pillars.day.branch);
}
