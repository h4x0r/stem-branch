# stembranch v0.2.0 Expansion Design

**Goal:** Make stembranch the most precise and comprehensive Chinese calendar library on GitHub. Full VSOP87B precision, zero dependencies, complete stem/branch relation coverage.

**Three pillars:** precision upgrade, new relation modules, iching4d pinyin purge.

---

## 1. VSOP87B Precision Upgrade

**Approach: Drop astronomy-engine, go self-contained.**

Monkey-patching astronomy-engine's internals is fragile and version-dependent. For a library claiming highest precision, owning the full computation stack is correct.

### New modules

- **`vsop87b-earth.ts`** -- Full 2,564-term coefficient data extracted from `gmiller123456/vsop87-multilang` (public domain). Stored as `number[][][]` arrays: `[series][term][A,B,C]`. Earth B: 402 terms (6 series), L: 1,184 terms (6 series), R: 978 terms (6 series). ~100KB source.

- **`solar-longitude.ts`** -- VSOP87B evaluator: `sum(A * cos(B + C * t))` per series, polynomial in t. Plus aberration correction (~20.5 arcsec). Plus nutation (dominant IAU 2000B terms). ~50 lines of math.

- **`solar-terms.ts`** -- Replace astronomy-engine's `SearchSunLongitude` with own binary search iterative solver. Same interface, full precision.

### Result

- Zero runtime dependencies
- 0.1 arcsecond precision (was ~1 arcminute)
- Solar term boundaries accurate to ~1 second
- Smaller total bundle (~115KB source vs ~15KB + 200KB astronomy-engine)

---

## 2. Remove Approximate Mode

- Delete `getSolarMonthApprox()` from `four-pillars.ts`
- Remove `ComputeOptions.exact` parameter entirely
- `computeFourPillars(date)` always uses exact astronomical computation
- **Breaking change:** consumers using `{ exact: false }` get a TypeScript error (intentional)
- iching4d bridge currently passes `{ exact: false }` -- update to call directly

---

## 3. New Modules

### 3a. `hidden-stems.ts` -- 地支藏干

Pure reference data. Each branch maps to 1-3 hidden stems with traditional proportions:

```
子 -> [癸]          丑 -> [己,癸,辛]    寅 -> [甲,丙,戊]    卯 -> [乙]
辰 -> [戊,乙,癸]    巳 -> [丙,庚,戊]    午 -> [丁,己]       未 -> [己,丁,乙]
申 -> [庚,壬,戊]    酉 -> [辛]          戌 -> [戊,辛,丁]    亥 -> [壬,甲]
```

Exports: `HIDDEN_STEMS` map, `getHiddenStems(branch)` function.

### 3b. `stem-relations.ts` -- 天干五合 + 天干相沖

- **Five Stem Combinations (天干五合):** 甲己->土, 乙庚->金, 丙辛->水, 丁壬->木, 戊癸->火
- **Stem Clashes (天干相沖):** 甲庚, 乙辛, 丙壬, 丁癸 (stems 6 apart)
- Exports: `STEM_COMBINATIONS`, `STEM_CLASHES`, `isStemCombination()`, `isStemClash()`, `getCombinedElement()`

### 3c. Expand `branch-relations.ts` -- 三合, 三會, 刑, 害, 破

Add to existing module:

- **三合 (Three Harmonies):** 申子辰->水, 寅午戌->火, 巳酉丑->金, 亥卯未->木
- **三會 (Seasonal Unions):** 寅卯辰->木, 巳午未->火, 申酉戌->金, 亥子丑->水
- **半三合 (Half Three Harmonies):** pairs from three-harmony groups (生合 and 墓合)
- **刑 (Punishment):** 寅巳申(無恩之刑), 丑戌未(恃勢之刑), 子卯(無禮之刑)
- **自刑 (Self-punishment):** 辰辰, 午午, 酉酉, 亥亥
- **害 (Harm):** 子未, 丑午, 寅巳, 卯辰, 申亥, 酉戌
- **破 (Destruction):** 子酉, 丑辰, 寅亥, 卯午, 巳申, 未戌

Exports: `THREE_HARMONIES`, `SEASONAL_UNIONS`, `HALF_HARMONIES`, `PUNISHMENT_GROUPS`, `SELF_PUNISHMENT`, `HARM_PAIRS`, `DESTRUCTION_PAIRS`, plus query functions `isThreeHarmony()`, `isSeasonalUnion()`, `isPunishment()`, `isSelfPunishment()`, `isHarm()`, `isDestruction()`, `getThreeHarmonyElement()`, etc.

### 3d. `hidden-harmony.ts` -- 暗合

Derived from 地支藏干 + 天干五合. When two branches' hidden stems form a 五合, the branches have 暗合. Classic pairs: 丑寅(己甲合), 卯申(乙庚合), 午亥(丁壬合), 巳酉(丙辛合 via 藏干).

Depends on: `hidden-stems.ts`, `stem-relations.ts`

Exports: `HIDDEN_HARMONY_PAIRS`, `isHiddenHarmony()`, `getHiddenHarmonyCombinations()`

### 3e. `earth-types.ts` -- 濕土/燥土 + 庫/墓

- **Wet Earth (濕土):** 辰, 丑 -- water-bearing earth
- **Dry Earth (燥土):** 戌, 未 -- fire-bearing earth
- **Storage/Tomb (庫/墓):** 辰->水庫, 戌->火庫, 丑->金庫, 未->木庫
- Context-dependent: 庫 when element is strong, 墓 when element is weak

Exports: `EARTH_TYPE`, `ELEMENT_STORAGE`, `isWetEarth()`, `isDryEarth()`, `getStorageElement()`

### 3f. `ten-relations.ts` -- 十神

Given day stem, classify any other stem into one of 10 relations:

| Same element, same polarity | 比肩 |
| Same element, different polarity | 劫財 |
| I generate, same polarity | 食神 |
| I generate, different polarity | 傷官 |
| I conquer, same polarity | 偏財 |
| I conquer, different polarity | 正財 |
| Conquers me, same polarity | 七殺 |
| Conquers me, different polarity | 正官 |
| Generates me, same polarity | 偏印 |
| Generates me, different polarity | 正印 |

Exports: `TenRelations` type, `getTenRelation(dayStem, otherStem)`, `getTenRelationForBranch(dayStem, branch)` (uses main hidden stem)

### 3g. `twelve-stages.ts` -- 長生十二神

12 life stages for each stem at each branch position:
長生 -> 沐浴 -> 冠帶 -> 臨官 -> 帝旺 -> 衰 -> 病 -> 死 -> 墓 -> 絕 -> 胎 -> 養

Yang stems go clockwise, yin stems go counter-clockwise. Starting positions:
甲->亥, 丙戊->寅, 庚->巳, 壬->申 (yang)
乙->午, 丁己->酉, 辛->子, 癸->卯 (yin)

Exports: `LifeStage` type, `TWELVE_STAGES`, `getLifeStage(stem, branch)`

### 3h. `cycle-elements.ts` -- 納音

60-cycle -> 30 cycle element pairs. Pure lookup table from traditional text:
甲子乙丑->海中金, 丙寅丁卯->爐中火, etc.

Exports: `CycleElement` type, `CYCLE_ELEMENTS` table, `getCycleElement(stemBranch)`, `getCycleElementName(stemBranch)`

---

## 4. New Types

```typescript
export type TenRelations = '比肩' | '劫財' | '食神' | '傷官' | '偏財' | '正財' | '七殺' | '正官' | '偏印' | '正印';
export type LifeStage = '長生' | '沐浴' | '冠帶' | '臨官' | '帝旺' | '衰' | '病' | '死' | '墓' | '絕' | '胎' | '養';
export type EarthType = '濕' | '燥';
export type PunishmentType = '無恩' | '恃勢' | '無禮' | '自刑';
export type CycleElement = '金' | '木' | '水' | '火' | '土';
```

---

## 5. Module Dependency Graph

```
vsop87b-earth.ts (data only, no deps)
    +-- solar-longitude.ts (evaluator + aberration + nutation)
        +-- solar-terms.ts (iterative solver, replaces astronomy-engine)
            +-- four-pillars.ts (exact only, no approximate mode)

hidden-stems.ts (data only)
    +-- hidden-harmony.ts (also depends on stem-relations.ts)
    +-- ten-relations.ts (also depends on elements.ts)
    +-- earth-types.ts

stem-relations.ts (depends on stems.ts, elements.ts)
    +-- hidden-harmony.ts

branch-relations.ts (expanded, depends on branches.ts)

twelve-stages.ts (depends on stems.ts, branches.ts)
cycle-elements.ts (depends on stem-branch.ts)
```

---

## 6. iching4d Pinyin Purge

Rename all pinyin identifiers in iching4d to match stembranch's English convention. The bridge pattern (import X as Y, re-export) goes away -- direct imports of English names.

### Types

| Current (pinyin) | New (English) |
|---|---|
| `TianGan` | `Stem` |
| `DiZhi` | `Branch` |
| `GanZhi` | `StemBranch` |
| `WuXing` | `Element` |
| `WuXingRelationship` | `ElementRelation` |
| `QiStrength` | `Strength` |
| `LiuQin` | `SixRelation` |
| `GuaXing` | `HexagramNature` |

### Constants / Functions

| Current | New |
|---|---|
| `SHENG_CYCLE` | `GENERATIVE_CYCLE` |
| `KE_CYCLE` | `CONQUERING_CYCLE` |
| `getRelationship` | `getElementRelation` |
| `TIANGAN_ELEMENT` | `STEM_ELEMENT` |
| `TIANGAN` / `TIANGAN_ORDER` | `STEMS` |
| `DIZHI_ELEMENT` | `BRANCH_ELEMENT` |
| `DIZHI` / `DIZHI_ORDER` | `BRANCHES` |
| `getQiStrength` | `getStrength` |
| `QI_MOON` | `STRENGTH` |
| `computeXunKong` | `computeVoidBranches` |
| `LIUHE_PAIRS` | `HARMONY_PAIRS` |
| `LIUCHONG_PAIRS` | `CLASH_PAIRS` |
| `isLiuHe` | `isHarmony` |
| `isLiuChong` | `isClash` |
| `WUXING_COLORS` | `ELEMENT_COLORS` |
| `WUXING_HEX_COLORS` | `ELEMENT_HEX_COLORS` |

### Files

| Current | New |
|---|---|
| `dizhi-relations.ts` | `branch-relations.ts` |
| `five-elements.ts` | `elements.ts` |

---

## 7. Breaking Changes

- `astronomy-engine` removed from dependencies (zero runtime deps)
- `ComputeOptions.exact` removed -- always exact
- `getSolarMonthApprox` deleted
- iching4d: all pinyin type/constant/function names replaced with English equivalents
