# 神煞 Almanac Flags

Symbolic markers from Chinese almanacs (通書/黃曆) and 命理學 (fate analysis). Each flag is derived from pillar components — stems, branches, or their relationships — using traditional lookup rules.

stembranch implements 29 almanac flags across 8 categories.

## Overview

| Category | Auspicious | Inauspicious |
|----------|-----------|-------------|
| Noble 貴人 | 天乙貴人, 太極貴人, 將星, 魁罡, 三奇貴人 | — |
| Academic 文學 | 文昌貴人, 華蓋, 學堂 | — |
| Romance 姻緣 | 紅鸞, 天喜 | 桃花 (context-dependent) |
| Travel 驛動 | 驛馬 | — |
| Wealth 財富 | 祿神, 金輿, 金神 | — |
| Protection 護佑 | 天赦日, 十靈日 | — |
| Health 健康 | 天醫 | — |
| Inauspicious 凶煞 | — | 羊刃, 劫煞, 亡神, 孤辰, 寡宿, 十惡大敗, 陰差陽錯, 月破, 歲破, 天羅, 地網, 四廢 |

---

## Day Stem Derivations 日干取煞

These stars are derived from the **day stem** (日干). The day stem determines a target branch; the star is activated when any pillar's branch matches that target.

### 天乙貴人 Heavenly Noble

The most important noble star. Each stem maps to two branches (daytime/nighttime positions).

| Day Stem | Target Branches |
|----------|----------------|
| 甲 | 丑, 未 |
| 乙 | 子, 申 |
| 丙 | 亥, 酉 |
| 丁 | 亥, 酉 |
| 戊 | 丑, 未 |
| 己 | 子, 申 |
| 庚 | 丑, 未 |
| 辛 | 午, 寅 |
| 壬 | 巳, 卯 |
| 癸 | 巳, 卯 |

**Mnemonic:** 甲戊庚牛羊(丑未), 乙己鼠猴鄉(子申), 丙丁豬雞位(亥酉), 壬癸蛇兔藏(巳卯), 六辛馬虎方(午寅).

```typescript
import { getHeavenlyNoble } from 'stembranch';
getHeavenlyNoble('甲'); // → ['丑', '未']
```

### 太極貴人 Supreme Noble

| Day Stem | Target Branches |
|----------|----------------|
| 甲, 乙 | 子, 午 |
| 丙, 丁 | 卯, 酉 |
| 戊, 己 | 辰, 戌, 丑, 未 |
| 庚, 辛 | 寅, 亥 |
| 壬, 癸 | 巳, 申 |

**Rule:** Stems are paired by 五合 (stem combination). 甲己 share targets, 乙庚 share targets, etc.

```typescript
import { getSupremeNoble } from 'stembranch';
getSupremeNoble('戊'); // → ['辰', '戌', '丑', '未']
```

### 文昌貴人 Literary Star

| Day Stem | 甲 | 乙 | 丙 | 丁 | 戊 | 己 | 庚 | 辛 | 壬 | 癸 |
|----------|---|---|---|---|---|---|---|---|---|---|
| Target | 巳 | 午 | 申 | 酉 | 申 | 酉 | 亥 | 子 | 寅 | 卯 |

**Rule:** The branch of the stem's 食神 (eating god) position.

```typescript
import { getLiteraryStar } from 'stembranch';
getLiteraryStar('甲'); // → '巳'
```

### 祿神 Prosperity Star

| Day Stem | 甲 | 乙 | 丙 | 丁 | 戊 | 己 | 庚 | 辛 | 壬 | 癸 |
|----------|---|---|---|---|---|---|---|---|---|---|
| Target | 寅 | 卯 | 巳 | 午 | 巳 | 午 | 申 | 酉 | 亥 | 子 |

**Rule:** The branch where the stem is in the 臨官 (official) phase of its 12-stage life cycle.

```typescript
import { getProsperityStar } from 'stembranch';
getProsperityStar('甲'); // → '寅'
```

### 羊刃 Ram Blade

| Day Stem | 甲 | 乙 | 丙 | 丁 | 戊 | 己 | 庚 | 辛 | 壬 | 癸 |
|----------|---|---|---|---|---|---|---|---|---|---|
| Target | 卯 | 寅 | 午 | 巳 | 午 | 巳 | 酉 | 申 | 子 | 亥 |

**Rule:** 陽干 = 祿 + 1 (next branch), 陰干 = 祿 - 1 (previous branch). The Ram Blade is the overextension past the prosperity peak — powerful but dangerous.

```typescript
import { getRamBlade } from 'stembranch';
getRamBlade('甲'); // → '卯'
```

### 金輿 Golden Carriage

| Day Stem | 甲 | 乙 | 丙 | 丁 | 戊 | 己 | 庚 | 辛 | 壬 | 癸 |
|----------|---|---|---|---|---|---|---|---|---|---|
| Target | 辰 | 巳 | 未 | 申 | 未 | 申 | 戌 | 亥 | 丑 | 寅 |

**Rule:** 祿 + 2 (two branches past prosperity).

```typescript
import { getGoldenCarriage } from 'stembranch';
getGoldenCarriage('甲'); // → '辰'
```

### 學堂 Study Hall

| Day Stem | 甲 | 乙 | 丙 | 丁 | 戊 | 己 | 庚 | 辛 | 壬 | 癸 |
|----------|---|---|---|---|---|---|---|---|---|---|
| Target | 亥 | 午 | 寅 | 酉 | 寅 | 酉 | 巳 | 子 | 申 | 卯 |

**Rule:** The branch of the stem's 長生 (birth) position in its life cycle.

```typescript
import { getStudyHall } from 'stembranch';
getStudyHall('甲'); // → '亥'
```

---

## Three-Harmony Derivations 三合取煞

These stars derive from the **year branch** (年支) via the 三合 (three-harmony) grouping system.

### The Four Three-Harmony Groups

| Group | Element | Branches | Travel Horse | Peach Blossom | Canopy | General | Robbery | Death Spirit |
|-------|---------|----------|-------------|--------------|--------|---------|---------|-------------|
| 0 | 火 Fire | 寅午戌 | 申 | 卯 | 戌 | 午 | 亥 | 巳 |
| 1 | 金 Metal | 巳酉丑 | 亥 | 午 | 丑 | 酉 | 寅 | 申 |
| 2 | 水 Water | 申子辰 | 寅 | 酉 | 辰 | 子 | 巳 | 亥 |
| 3 | 木 Wood | 亥卯未 | 巳 | 子 | 未 | 卯 | 申 | 寅 |

Each position in the 三合 group corresponds to a stage in the 十二長生 (twelve life stages):

| Position | Life Stage | Star | Meaning |
|----------|-----------|------|---------|
| 0 | 衝 (clash) | 驛馬 Traveling Horse | Movement, relocation |
| 1 | 沐浴 (bathing) | 桃花 Peach Blossom | Romance, charm |
| 2 | 墓 (tomb) | 華蓋 Canopy | Solitude, spirituality |
| 3 | 帝旺 (emperor) | 將星 General Star | Authority, leadership |
| 4 | 絕 (extinction) | 劫煞 Robbery Star | Sudden loss, danger |
| 5 | — | 亡神 Death Spirit | Hidden harm |

### 驛馬 Traveling Horse

Activated when any pillar branch matches the travel horse of the year branch's 三合 group.

```typescript
import { getTravelingHorse } from 'stembranch';
getTravelingHorse('寅'); // → '申' (fire group)
getTravelingHorse('子'); // → '寅' (water group)
```

### 桃花 Peach Blossom

Also called 咸池. The "bathing" position — associated with attraction and romance.

```typescript
import { getPeachBlossom } from 'stembranch';
getPeachBlossom('午'); // → '卯' (fire group)
```

### 華蓋 Canopy

The "tomb" position of the 三合 group. Associated with artistic temperament, solitude, and spiritual inclination.

```typescript
import { getCanopy } from 'stembranch';
getCanopy('子'); // → '辰' (water group)
```

### 將星 General Star

The "emperor" position — peak power of the 三合 element. Leadership and authority.

```typescript
import { getGeneralStar } from 'stembranch';
getGeneralStar('寅'); // → '午' (fire group)
```

### 劫煞 Robbery Star

The "extinction" position. Sudden, unexpected loss or danger.

```typescript
import { getRobberyStar } from 'stembranch';
getRobberyStar('酉'); // → '寅' (metal group)
```

### 亡神 Death Spirit

Hidden harm position. Subtle, hard-to-detect negative influence.

```typescript
import { getDeathSpirit } from 'stembranch';
getDeathSpirit('卯'); // → '寅' (wood group)
```

---

## Year Branch Stars 年支取煞

### 紅鸞 Red Phoenix

**Formula:** `(3 - yearBranchIndex + 12) % 12`

| Year Branch | 子 | 丑 | 寅 | 卯 | 辰 | 巳 | 午 | 未 | 申 | 酉 | 戌 | 亥 |
|------------|---|---|---|---|---|---|---|---|---|---|---|---|
| 紅鸞 | 卯 | 寅 | 丑 | 子 | 亥 | 戌 | 酉 | 申 | 未 | 午 | 巳 | 辰 |

Marriage and romantic fortune. Activated when any pillar branch matches.

### 天喜 Heavenly Joy

**Formula:** 紅鸞 + 6 (opposite position on the branch circle)

| Year Branch | 子 | 丑 | 寅 | 卯 | 辰 | 巳 | 午 | 未 | 申 | 酉 | 戌 | 亥 |
|------------|---|---|---|---|---|---|---|---|---|---|---|---|
| 天喜 | 酉 | 申 | 未 | 午 | 巳 | 辰 | 卯 | 寅 | 丑 | 子 | 亥 | 戌 |

Joyful events, celebrations.

### 天醫 Heavenly Doctor

**Formula:** year branch + 1 (next branch)

| Year Branch | 子 | 丑 | 寅 | 卯 | 辰 | 巳 | 午 | 未 | 申 | 酉 | 戌 | 亥 |
|------------|---|---|---|---|---|---|---|---|---|---|---|---|
| 天醫 | 丑 | 寅 | 卯 | 辰 | 巳 | 午 | 未 | 申 | 酉 | 戌 | 亥 | 子 |

Healing ability, medical aptitude.

### 孤辰 Lonely Star

Derived from the **seasonal group** of the year branch.

| Seasonal Group | Branches | 孤辰 |
|---------------|----------|------|
| Spring 春 | 寅卯辰 | 巳 |
| Summer 夏 | 巳午未 | 申 |
| Autumn 秋 | 申酉戌 | 亥 |
| Winter 冬 | 亥子丑 | 寅 |

Loneliness, independence. More significant for males.

### 寡宿 Widow Star

| Seasonal Group | Branches | 寡宿 |
|---------------|----------|------|
| Spring 春 | 寅卯辰 | 丑 |
| Summer 夏 | 巳午未 | 辰 |
| Autumn 秋 | 申酉戌 | 未 |
| Winter 冬 | 亥子丑 | 戌 |

Solitude, isolation. More significant for females.

---

## Day Pillar Predicates 日柱取煞

These stars are determined by the specific **day pillar** (stem + branch combination). No external lookup — the day pillar itself either is or is not in the predefined set.

### 魁罡 Commanding Star

**Set:** 壬辰, 庚戌, 庚辰, 戊戌

Strong, decisive personality. Only four day pillars carry this star.

### 十惡大敗 Ten Evils

**Set:** 甲辰, 乙巳, 壬申, 丙申, 丁亥, 庚辰, 戊戌, 癸亥, 辛巳, 己丑

Days considered extremely inauspicious. These are the 10 day pillars where the 祿 (prosperity star) is in the 空亡 (void) position.

### 陰差陽錯 Yin-Yang Error

**Set:** 丙子, 丙午, 丁丑, 丁未, 戊寅, 戊申, 辛卯, 辛酉, 壬辰, 壬戌, 癸巳, 癸亥

Day pillars where yin and yang energies are misaligned. Considered inauspicious for marriage.

### 金神 Gold Spirit

**Set:** 己巳, 癸酉, 乙丑

Day pillars with concentrated metal energy. Auspicious — indicates determination and resilience.

### 十靈日 Ten Spirits

**Set:** 甲辰, 乙亥, 丙辰, 丁酉, 戊午, 庚戌, 庚寅, 辛亥, 壬寅, 癸未

Day pillars associated with spiritual sensitivity and intuition.

### 天羅 Heaven Net

**Branches:** 戌, 亥

Entrapment for fire-element people. When the day branch is 戌 or 亥.

### 地網 Earth Trap

**Branches:** 辰, 巳

Entrapment for water-element people. When the day branch is 辰 or 巳.

---

## Calendar Predicates 曆法取煞

These depend on relationships between pillars, or between the day pillar and the current season.

### 月破 Month Break

The day branch **clashes** (六衝) with the month branch. The six clashes are:

子↔午, 丑↔未, 寅↔申, 卯↔酉, 辰↔戌, 巳↔亥

### 歲破 Year Break

The day branch **clashes** with the year branch. Same clash pairs as above.

### 天赦日 Heaven's Pardon

One of the most auspicious days. Determined by **season + day pillar**:

| Season | Required Day Pillar |
|--------|-------------------|
| Spring 春 | 戊寅 |
| Summer 夏 | 甲午 |
| Autumn 秋 | 戊申 |
| Winter 冬 | 甲子 |

Only occurs when the day pillar exactly matches the season's designated pillar.

### 四廢 Four Waste

Day pillars whose element is in the "dead" phase during the current season:

| Season | Waste Pillars | Element | Reason |
|--------|--------------|---------|--------|
| Spring 春 | 庚申, 辛酉 | Metal 金 | Metal is dead in spring (wood season) |
| Summer 夏 | 壬子, 癸亥 | Water 水 | Water is dead in summer (fire season) |
| Autumn 秋 | 甲寅, 乙卯 | Wood 木 | Wood is dead in autumn (metal season) |
| Winter 冬 | 丙午, 丁巳 | Fire 火 | Fire is dead in winter (water season) |

### 三奇貴人 Three Wonders

Activated when **three consecutive pillar stems** form a special pattern:

| Pattern | Type | Stems |
|---------|------|-------|
| 天上三奇 | Heaven | 乙丙丁 |
| 地上三奇 | Earth | 甲戊庚 |
| 人中三奇 | Human | 壬癸辛 |

Checks year-month-day and month-day-hour stem sequences.

---

## API

```typescript
import {
  getAlmanacFlags,          // Date → all active flags
  getAlmanacFlagsForPillars, // FourPillars + season → all active flags
  getHeavenlyNoble,         // Stem → [Branch, Branch]
  getSupremeNoble,          // Stem → Branch[]
  getLiteraryStar,          // Stem → Branch
  getProsperityStar,        // Stem → Branch
  getRamBlade,              // Stem → Branch
  getGoldenCarriage,        // Stem → Branch
  getStudyHall,             // Stem → Branch
  getTravelingHorse,        // Branch → Branch
  getPeachBlossom,          // Branch → Branch
  getCanopy,                // Branch → Branch
  getGeneralStar,           // Branch → Branch
  getRobberyStar,           // Branch → Branch
  getDeathSpirit,           // Branch → Branch
  getRedPhoenix,            // Branch → Branch
  getHeavenlyJoy,           // Branch → Branch
  getHeavenlyDoctor,        // Branch → Branch
  getLonelyStar,            // Branch → Branch
  getWidowStar,             // Branch → Branch
  isCommandingStar,         // (Stem, Branch) → boolean
  isTenEvils,               // (Stem, Branch) → boolean
  isYinYangError,           // (Stem, Branch) → boolean
  isGoldSpirit,             // (Stem, Branch) → boolean
  isTenSpirits,             // (Stem, Branch) → boolean
  isHeavenNet,              // Branch → boolean
  isEarthTrap,              // Branch → boolean
  isHeavensPardon,          // (Stem, Branch, season) → boolean
  isMonthBreak,             // (Branch, Branch) → boolean
  isYearBreak,              // (Branch, Branch) → boolean
  isFourWaste,              // (Stem, Branch, season) → boolean
  getThreeWonders,          // FourPillars → 'heaven'|'earth'|'human'|null
} from 'stembranch';
```
