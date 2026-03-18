# stembranch

Deterministic Chinese calendar and stem-branch algorithms for TypeScript. Solar terms, lunar calendar, sexagenary cycles, eight-character derivations, and three classical divination chart layouts — all from first principles.

**Scope:** This library computes factual, deterministic results from astronomical and combinatoric algorithms. It does not provide interpretation, analysis, or advice (e.g. chart reading, 用神 prescription, fortune assessment). Consumers can build interpretive layers on top of the computed data.

[![npm](https://img.shields.io/npm/v/stembranch)](https://www.npmjs.com/package/stembranch)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue)](https://www.typescriptlang.org/)

```typescript
import { computeFourPillars, computeMajorLuck, dailyAlmanac } from 'stembranch';

const pillars = computeFourPillars(new Date(2024, 1, 10, 14, 30));
// → { year: {stem: '甲', branch: '辰'}, month: {stem: '丙', branch: '寅'},
//     day:   {stem: '壬', branch: '午'}, hour:  {stem: '丁', branch: '未'} }

const luck = computeMajorLuck(new Date(1990, 6, 15), 'male');
// → { direction: 'forward', startAge: 8, periods: [{pillar: {stem:'甲', ...}, startAge: 8, endAge: 17}, ...] }
```

## Install

```bash
npm install stembranch
```

Zero production dependencies. Self-contained VSOP87D (2,425 terms) and Meeus Ch. 49 new moon algorithms with sub-second solar term precision and full lunar calendar computation.

## Quickstart

### Four Pillars (四柱八字)

```typescript
import { computeFourPillars } from 'stembranch';

const pillars = computeFourPillars(new Date(2024, 1, 10, 14, 30));
// → year: 甲辰, month: 丙寅, day: 壬午, hour: 丁未
```

### Luck Periods (大運)

```typescript
import { computeMajorLuck, computeMinorLuck, getLuckDirection } from 'stembranch';

// 大運: 10-year periods from month pillar
const luck = computeMajorLuck(new Date(1990, 6, 15), 'male', 8);
// → direction: 'forward', startAge: 8
// → periods: [{pillar: 甲申, startAge: 8}, {pillar: 乙酉, startAge: 18}, ...]

// 小運: year-by-year from hour pillar
const minor = computeMinorLuck({stem: '甲', branch: '子'}, 'forward', 1, 10);
// → [{age: 1, pillar: 乙丑}, {age: 2, pillar: 丙寅}, ...]
```

### Daily Almanac (日曆總覽)

One call, everything at once — four pillars, lunar date, solar terms, zodiac, day fitness, flying stars, almanac flags, Six Ren chart, eclipses, and element analysis:

```typescript
import { dailyAlmanac } from 'stembranch';

const a = dailyAlmanac(new Date(2024, 5, 15));
// a.pillars      → year/month/day/hour stem-branch pairs
// a.lunar        → { year: 2024, month: 5, day: 10, isLeapMonth: false }
// a.dayFitness   → { fitness: '成', auspicious: true }
// a.almanacFlags → [{ name: '天乙貴人', english: 'Heavenly Noble', ... }, ...]
// a.sixRen       → { method: '賊剋', lessons: [...], ... }
// a.flyingStars  → { year: {...}, month: {...}, day: {...}, hour: {...} }
```

### Divination Systems (三式)

```typescript
import { computeSixRenForDate, computeQiMenForDate, computeZiWei } from 'stembranch';

// 大六壬
const sixRen = computeSixRenForDate(new Date(2024, 5, 15, 14));
// → { plates, lessons, transmissions, method: '賊剋', generals, ... }

// 奇門遁甲
const qimen = computeQiMenForDate(new Date(2024, 5, 15));
// → { earthPlate, heavenPlate, stars, doors, deities, escapeMode: '陰遁', juShu: 6, ... }

// 紫微斗數
const chart = computeZiWei({ year: 1990, month: 8, day: 15, hour: 6, gender: 'male' });
// → { palaces: [...14 major stars placed...], siHua, elementPattern, taiSuiIndex, ... }
```

## Accuracy

Three-way validated against [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/) (DE441 numerical integration) and [sxwnl](https://github.com/sxwnl/sxwnl) (寿星万年历):

| Test | Samples | Range | Result |
|---|---|---|---|
| Equation of Time vs JPL | 366 daily | 2024 | max **0.03s** deviation |
| Solar Terms vs JPL | 1,008 terms | 209-2493 CE | mean **2.4s** (modern), **26s** (full range) |
| Solar Terms vs sxwnl | 4,824 terms | 1900-2100 | mean **0.6s**, max **3.1s** |
| Day Pillar (日柱) | 5,683 dates | 1583-2500 | **100%** match |
| Year Pillar (年柱) | 2,412 dates | 1900-2100 | **100%** match |
| Month Pillar (月柱) | 2,412 dates | 1900-2100 | **100%** match |
| Lunar New Year (農曆) | 61 dates | 1990-2050 | **100%** match |
| Intercalary Months (閏月) | 10 years | 2001-2025 | **100%** match |

Lunar calendar validated against Hong Kong Observatory / USNO data, including correct handling of the [2033 problem](docs/technical-notes.md#the-2033-problem-二〇三三年問題).

Full 3-way comparison methodology with residual statistics: [docs/accuracy.md](docs/accuracy.md). Design decisions, data sources, and timezone reference analysis: [docs/technical-notes.md](docs/technical-notes.md)

## API Reference

### 1. Astronomical Foundations

#### DeltaT (ΔT)

| Export | Description |
|---|---|
| `deltaT(date)` | ΔT in seconds for a Date (TT = UT + ΔT) |
| `deltaTForYear(y)` | ΔT in seconds for a decimal year |

#### Julian Day Number (儒略日)

| Export | Description |
|---|---|
| `julianDayNumber(year, month, day, calendar?)` | JD for a calendar date (Julian, Gregorian, or auto) |
| `jdToCalendarDate(jd, calendar?)` | Convert JD back to calendar date |
| `julianCalendarToDate(year, month, day)` | Convert a Julian calendar date to a JS Date |

#### Solar Terms (節氣)

| Export | Description |
|---|---|
| `SOLAR_TERM_NAMES` | 24 term names (小寒 through 冬至) |
| `SOLAR_TERM_LONGITUDES` | Ecliptic longitudes (285° through 270°) |
| `findSolarTermMoment(longitude, year, startMonth?)` | Exact UTC moment for a solar longitude |
| `getSolarTermsForYear(year)` | All 24 terms with exact dates |
| `findSpringStart(year)` | Exact moment of 立春 |
| `getSolarMonthExact(date)` | Which solar month a date falls in |

#### New Moon (朔日)

| Export | Description |
|---|---|
| `newMoonJDE(k)` | JDE of new moon for lunation number k (Meeus Ch. 49) |
| `findNewMoonsInRange(startJD, endJD)` | All new moon JDEs in a Julian Day range |

#### Lunar Calendar (農曆)

| Export | Description |
|---|---|
| `getLunarMonthsForYear(lunarYear)` | All lunar months for a year (12 or 13) |
| `getLunarNewYear(gregorianYear)` | Lunar New Year date (正月初一) |
| `gregorianToLunar(date)` | Convert Gregorian date to lunar date |

#### Eclipses (日月食)

| Export | Description |
|---|---|
| `getAllSolarEclipses()` | All solar eclipses (-1999 to 3000 CE), sorted by date |
| `getAllLunarEclipses()` | All lunar eclipses (-1999 to 3000 CE), sorted by date |
| `getEclipsesForYear(year)` | All eclipses for a given year |
| `getEclipsesInRange(start, end, kind?)` | Eclipses in a date range, optionally filtered |
| `findNearestEclipse(date, kind?)` | Nearest eclipse to a given date |
| `isEclipseDate(date)` | Check if a UTC date has an eclipse |
| `ECLIPSE_DATA_RANGE` | `{ min: -1999, max: 3000 }` |

### 2. Stem-Branch System (干支)

#### Stems and Branches (天干地支)

| Export | Description |
|---|---|
| `STEMS` | `['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']` |
| `BRANCHES` | `['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']` |
| `STEM_ELEMENT` | `Record<Stem, Element>` (甲乙=木, 丙丁=火, ...) |
| `BRANCH_ELEMENT` | `Record<Branch, Element>` |
| `stemByIndex(n)` | Get stem by index (mod 10) |
| `branchByIndex(n)` | Get branch by index (mod 12) |
| `stemPolarity(stem)` | `'陽'` or `'陰'` |
| `branchPolarity(branch)` | `'陽'` or `'陰'` |

#### Sexagenary Cycle (六十甲子)

| Export | Description |
|---|---|
| `makeStemBranch(stem, branch)` | Build a `StemBranch` string |
| `stemBranchByCycleIndex(n)` | Get pair at position n in the 60-cycle |
| `stemBranchCycleIndex(stem, branch)` | Reverse lookup (returns -1 for invalid parity) |
| `parseStemBranch(str)` | Parse two-character string into stem + branch |
| `allSixtyStemBranch()` | All 60 valid pairs in cycle order |

#### Five Elements (五行)

| Export | Description |
|---|---|
| `GENERATIVE_CYCLE` | 金→水→木→火→土→金 |
| `CONQUERING_CYCLE` | 金→木→土→水→火→金 |
| `ELEMENT_ORDER` | `['金','木','水','火','土']` |
| `getElementRelation(from, to)` | Returns `'生'`, `'剋'`, `'被生'`, `'被剋'`, or `'比和'` |

#### Cycle Elements (納音)

| Export | Description |
|---|---|
| `CYCLE_ELEMENTS` | Full 60-pair lookup table with element and poetic name |
| `getCycleElement(sb)` | 納音 element for a stem-branch pair |
| `getCycleElementName(sb)` | 納音 poetic name (e.g. 海中金, 爐中火) |

### 3. Pillar Relations (四柱八字)

#### Four Pillars (四柱)

| Export | Description |
|---|---|
| `computeFourPillars(date)` | Compute year, month, day, and hour pillars |

#### Hidden Stems (地支藏干)

| Export | Description |
|---|---|
| `HIDDEN_STEMS` | `Record<Branch, HiddenStem[]>` — main, middle, residual stems |
| `getHiddenStems(branch)` | Hidden stems for a branch (main stem first) |

#### Stem Relations (天干五合/相衝)

| Export | Description |
|---|---|
| `STEM_COMBINATIONS` | Five stem combinations with transformed elements |
| `STEM_CLASHES` | Four stem clash pairs |
| `isStemCombination(a, b)` | Check if two stems form a 五合 |
| `isStemClash(a, b)` | Check if two stems clash |
| `getCombinedElement(a, b)` | Transformed element of a combination, or null |

#### Branch Relations (地支六合/六衝/三合/刑/害/破)

| Export | Description |
|---|---|
| `HARMONY_PAIRS` | 六合: 子丑, 寅亥, 卯戌, 辰酉, 巳申, 午未 |
| `CLASH_PAIRS` | 六衝: 子午, 丑未, 寅申, 卯酉, 辰戌, 巳亥 |
| `THREE_HARMONIES` | 三合: 申子辰水, 寅午戌火, 巳酉丑金, 亥卯未木 |
| `SEASONAL_UNIONS` | 三會: 寅卯辰木, 巳午未火, 申酉戌金, 亥子丑水 |
| `HALF_HARMONIES` | 半合: pairs from three-harmony groups |
| `PUNISHMENT_GROUPS` | 刑: 寅巳申無恩, 丑戌未恃勢, 子卯無禮 |
| `SELF_PUNISHMENT` | 自刑: 辰午酉亥 |
| `HARM_PAIRS` | 六害: 子未, 丑午, 寅巳, 卯辰, 申亥, 酉戌 |
| `DESTRUCTION_PAIRS` | 六破: 子酉, 丑辰, 寅亥, 卯午, 巳申, 未戌 |
| `isThreeHarmony(a, b, c)` | Check three-harmony group |
| `isPunishment(a, b)` | Check punishment relationship |
| `isSelfPunishment(branch)` | Check self-punishment |
| `isHarm(a, b)` | Check harm pair |
| `isDestruction(a, b)` | Check destruction pair |

#### Hidden Harmony (暗合)

| Export | Description |
|---|---|
| `HIDDEN_HARMONY_PAIRS` | Pre-computed pairs where main hidden stems form 五合 |
| `isHiddenHarmony(a, b)` | Check if two branches have 暗合 |

#### Ten Relations (十神)

| Export | Description |
|---|---|
| `TEN_RELATION_NAMES` | All 10 relation names |
| `getTenRelation(dayStem, otherStem)` | Derive the ten-relation |
| `getTenRelationForBranch(dayStem, branch)` | Ten-relation using main hidden stem |

#### Twelve Life Stages (長生十二神)

| Export | Description |
|---|---|
| `TWELVE_STAGES` | `['長生','沐浴','冠帶','臨官','帝旺','衰','病','死','墓','絕','胎','養']` |
| `getLifeStage(stem, branch)` | Life stage of a stem at a branch |

#### Element Strength (旺相休囚死)

| Export | Description |
|---|---|
| `STRENGTH` | `Record<Strength, string>` with descriptive labels |
| `getStrength(element, monthBranch)` | Seasonal strength: 旺, 相, 休, 囚, or 死 |

#### Earth Types (濕土/燥土)

| Export | Description |
|---|---|
| `EARTH_BRANCHES` | `['辰','丑','戌','未']` |
| `isWetEarth(branch)` | 辰丑 are wet earth |
| `isDryEarth(branch)` | 戌未 are dry earth |
| `getStorageElement(branch)` | 庫/墓: 辰→水, 戌→火, 丑→金, 未→木 |

#### Void Branches (旬空)

| Export | Description |
|---|---|
| `computeVoidBranches(dayStem, dayBranch)` | `{ true: Branch, partial: Branch }` — 正空 (polarity match) and 偏空 |

#### Salary Star (祿神)

| Export | Description |
|---|---|
| `SALARY_STAR` | `Record<Stem, Branch>` — stem → 臨官 branch |
| `getSalaryStar(stem)` | Get the 祿 branch for a stem |

#### Virtue Stars (天德/月德)

| Export | Description |
|---|---|
| `getMonthlyVirtue(monthBranch)` | 月德: yang stem of the three-harmony element |
| `getHeavenlyVirtue(monthBranch)` | 天德: traditional 12-entry lookup (stem or branch) |
| `getMonthlyVirtueCombo(monthBranch)` | 月德合: 五合 partner of 月德 |
| `getHeavenlyVirtueCombo(monthBranch)` | 天德合: combination partner of 天德 |

#### Almanac Flags (神煞)

30 symbolic markers derived from stem-branch combinatorics:

| Export | Description |
|---|---|
| `ALMANAC_FLAG_REGISTRY` | Full registry of all 30 flags with metadata |
| `getAlmanacFlags(date)` | All active flags for a date |
| `getAlmanacFlagsForPillars(pillars, season)` | All active flags from pre-computed pillars |

Day stem derivations:

| Export | Description |
|---|---|
| `getHeavenlyNoble(stem)` | 天乙貴人: two noble branches |
| `getSupremeNoble(stem)` | 太極貴人: supreme noble branches |
| `getLiteraryStar(stem)` | 文昌貴人: literary star branch |
| `getProsperityStar(stem)` | 祿神: prosperity branch |
| `getRamBlade(stem)` | 羊刃: ram blade branch |
| `getGoldenCarriage(stem)` | 金輿: golden carriage branch |
| `getStudyHall(stem)` | 學堂: study hall (長生 position) |

Branch derivations (三合 based):

| Export | Description |
|---|---|
| `getTravelingHorse(branch)` | 驛馬: from 三合 group |
| `getPeachBlossom(branch)` | 桃花: from 三合 group |
| `getCanopy(branch)` | 華蓋: from 三合 group |
| `getGeneralStar(branch)` | 將星: from 三合 group |
| `getRobberyStar(branch)` | 劫煞: from 三合 group |
| `getDeathSpirit(branch)` | 亡神: from 三合 group |

Branch derivations (other):

| Export | Description |
|---|---|
| `getRedPhoenix(branch)` | 紅鸞: red phoenix |
| `getHeavenlyJoy(branch)` | 天喜: heavenly joy (紅鸞 + 6) |
| `getLonelyStar(branch)` | 孤辰: lonely star |
| `getWidowStar(branch)` | 寡宿: widow star |
| `getHeavenlyDoctor(branch)` | 天醫: heavenly doctor (year branch + 1) |

Day pillar predicates:

| Export | Description |
|---|---|
| `isCommandingStar(stem, branch)` | 魁罡: 庚辰/壬辰/庚戌/戊戌 |
| `isTenEvils(stem, branch)` | 十惡大敗: 10 specific day pillars |
| `isYinYangError(stem, branch)` | 陰差陽錯: 12 specific day pillars |
| `isGoldSpirit(stem, branch)` | 金神: 己巳/癸酉/乙丑 |
| `isTenSpirits(stem, branch)` | 十靈日: 10 specific day pillars |
| `isHeavenNet(branch)` | 天羅: 戌/亥 |
| `isEarthTrap(branch)` | 地網: 辰/巳 |

Calendar predicates:

| Export | Description |
|---|---|
| `isHeavensPardon(stem, branch, season)` | 天赦日: seasonal pardon day |
| `isMonthBreak(dayBranch, monthBranch)` | 月破: day clashes month |
| `isYearBreak(dayBranch, yearBranch)` | 歲破: day clashes year |
| `isFourWaste(stem, branch, season)` | 四廢: element dead in season |

Multi-pillar patterns:

| Export | Description |
|---|---|
| `getThreeWonders(pillars)` | 三奇貴人: 乙丙丁 (天) / 甲戊庚 (地) / 壬癸辛 (人) |

### 4. Eight-Character Derivations (八字推算)

#### Luck Periods (大運/小運)

| Export | Description |
|---|---|
| `getLuckDirection(yearStem, gender)` | Yang+male or yin+female → forward; opposite → backward |
| `computeMajorLuck(birthDate, gender, count?)` | 大運: 10-year periods from month pillar (default 8 periods) |
| `computeMinorLuck(hourPillar, direction, fromAge, toAge)` | 小運: year-by-year pillars from hour pillar |

### 5. Almanac Features (曆書)

#### Day Fitness (建除十二神)

| Export | Description |
|---|---|
| `DAY_FITNESS_CYCLE` | `['建','除','滿','平','定','執','破','危','成','收','開','閉']` |
| `DAY_FITNESS_AUSPICIOUS` | Auspicious/inauspicious classification per fitness value |
| `getDayFitness(dayBranch, monthBranch)` | Fitness value from day and month branches |
| `getDayFitnessForDate(date)` | Fitness and auspicious flag for a date |

#### Flying Stars (紫白九星)

| Export | Description |
|---|---|
| `FLYING_STARS` | Nine stars: 一白 through 九紫 with element and color |
| `getYearStar(date)` | Year star (changes at 立春) |
| `getMonthStar(date)` | Month star (from year star group + solar month) |
| `getDayStar(date)` | Day star (continuous 9-day cycle) |
| `getHourStar(date)` | Hour star (from day star group + hour branch) |
| `getFlyingStars(date)` | All four stars (year, month, day, hour) |

#### Peng Zu Taboos (彭祖百忌)

| Export | Description |
|---|---|
| `getPengZuTaboo(stem, branch)` | Stem taboo + branch taboo strings |
| `getPengZuTabooForDate(date)` | Taboos for a date |

#### Day Clash (沖煞)

| Export | Description |
|---|---|
| `getDayClash(dayBranch)` | Clash branch + direction |
| `getDayClashForDate(date)` | Clash info for a date |

#### Deity Directions (神煞方位)

| Export | Description |
|---|---|
| `getDeityDirections(dayStem)` | 喜神/福神/財神 directions from day stem |
| `getDeityDirectionsForDate(date)` | Directions for a date |

#### Fetal Deity (胎神)

| Export | Description |
|---|---|
| `getFetalDeity(stem, branch)` | 胎神 location from day pillar |
| `getFetalDeityForDate(date)` | Fetal deity location for a date |

#### Duty Deity (值神)

| Export | Description |
|---|---|
| `DUTY_DEITIES` | The 12 duty deities in cycle order |
| `getDutyDeity(dayFitness, ...)` | Which deity is on duty |
| `getDutyDeityForDate(date)` | Duty deity for a date |

#### Lunar Mansions (二十八星宿)

| Export | Description |
|---|---|
| `LUNAR_MANSIONS` | 28 mansions with luminary and element |
| `getLunarMansion(jd)` | Mansion from Julian Day (JD mod 28) |
| `getLunarMansionForDate(date)` | Mansion for a date |

#### Chinese Zodiac (生肖)

| Export | Description |
|---|---|
| `ZODIAC_ANIMALS` | `['鼠','牛','虎','兔','龍','蛇','馬','羊','猴','雞','狗','豬']` |
| `ZODIAC_ENGLISH` | `Record<ChineseZodiacAnimal, string>` (鼠→Rat, etc.) |
| `getChineseZodiac(date, boundary?)` | Zodiac with configurable year boundary (立春 or 初一) |

#### Western Zodiac (星座)

| Export | Description |
|---|---|
| `getWesternZodiac(date)` | Sign, symbol, Chinese name, Western element |

#### True Solar Time (真太陽時)

| Export | Description |
|---|---|
| `equationOfTime(date)` | EoT in minutes (Spencer 1971) |
| `trueSolarTime(clockTime, longitude, standardMeridian?)` | Corrected solar time with breakdown |

For timezone-aware true solar time (wall clock → UTC → solar time with DST handling), see [`wallClockToSolarTime`](#timezone-conversion) in section 7.

### 6. Divination Systems (三式)

#### Six Ren (大六壬)

| Export | Description |
|---|---|
| `STEM_LODGING` | 日干寄宮: stem lodging branches |
| `HEAVENLY_GENERALS` | 十二天將 in traditional order |
| `getMonthlyGeneral(date)` | 月將: shifts at each 中氣 boundary |
| `buildPlates(monthlyGeneral, hourBranch)` | Build 天地盤 (heaven/earth plate rotation) |
| `buildFourLessons(dayStem, dayBranch, plates)` | Derive 四課 (four lessons) |
| `computeSixRen(dayStem, dayBranch, hourBranch, monthlyGeneral)` | Full chart from parameters |
| `computeSixRenForDate(date, hour?)` | Full chart for a date |

#### Mystery Gates (奇門遁甲)

| Export | Description |
|---|---|
| `NINE_STARS` | 九星: 天蓬 through 天英 |
| `EIGHT_DOORS` | 八門: 休 through 開 |
| `EIGHT_DEITIES` | 八神: 值符 through 天禽 |
| `SAN_QI_LIU_YI` | 三奇六儀: 戊己庚辛壬癸丁丙乙 |
| `getEscapeMode(date)` | 陰遁 or 陽遁 for a date |
| `getJuShu(date)` | 局數 (1-9) for a date |
| `buildEarthPlate(juShu)` | 地盤: Lo Shu base layout |
| `buildHeavenPlate(earthPlate, ...)` | 天盤: rotated overlay |
| `computeQiMen(...)` | Full chart from parameters |
| `computeQiMenForDate(date)` | Full chart for a date |

#### Polaris Astrology (紫微斗數)

| Export | Description |
|---|---|
| `MAJOR_STARS` | 14 major stars (紫微 through 破軍) |
| `PALACE_NAMES` | 12 palace names (命宮 through 父母宮) |
| `getFatepalace(lunarMonth, hourIndex)` | Fate palace branch index |
| `getElementPattern(fatePalaceIndex, yearStem)` | 五行局 from 納音 (2-6) |
| `getZiWeiPosition(birthDay, elementPattern)` | 紫微 star palace index |
| `computeZiWei(birthData)` | Full chart: 12 palaces, 14 stars, 四化, 流太歲 |

### 7. Timezone & Location (時區)

Historically-accurate timezone conversion using an embedded IANA transition table (78 timezones, 11,742 transitions, 1900-2026) for deterministic, platform-independent results. Handles PRC DST 1986-1991, Taiwan DST 1946-1979, Hong Kong summer time 1946-1979, Singapore UTC+7:30→UTC+8, and all other historical timezone changes. Falls back to `Intl.DateTimeFormat` only for timezones not in the embedded database.

Full technical references, source analysis, and known discrepancies: [docs/technical-notes.md](docs/technical-notes.md#timezone--dst)

#### Timezone Conversion

| Export | Description |
|---|---|
| `localToUtc(year, month, day, hour, minute, timezoneId)` | Convert local wall-clock time to UTC Date |
| `utcToLocal(date, timezoneId)` | Convert UTC Date to local `{ year, month, day, hour, minute, second }` |
| `getUtcOffset(year, month, day, hour, minute, timezoneId)` | UTC offset in minutes (positive = east) at a local moment |
| `isDst(year, month, day, hour, minute, timezoneId)` | Whether DST/summer time is in effect |
| `getStandardMeridian(year, month, day, hour, minute, timezoneId)` | Standard meridian in degrees from UTC offset |
| `formatUtcOffset(offsetMinutes)` | Format offset as `"+08:00"`, `"-05:00"`, `"+05:45"` |
| `timezoneFromLongitude(longitude)` | Derive `Etc/GMT±N` timezone from longitude (fallback) |
| `wallClockToSolarTime(year, month, day, hour, minute, timezoneId, longitude)` | Full pipeline: wall clock → UTC → true solar time |

```typescript
import { localToUtc, getUtcOffset, isDst, wallClockToSolarTime } from 'stembranch';

// Convert 1988-07-15 12:00 Shanghai time (PRC DST active) to UTC
const utc = localToUtc(1988, 7, 15, 12, 0, 'Asia/Shanghai');
// → 1988-07-15T03:00:00Z (UTC+9 during DST)

// Check DST status
isDst(1988, 7, 15, 12, 0, 'Asia/Shanghai'); // → true (PRC DST 1986-1991)
isDst(1992, 7, 15, 12, 0, 'Asia/Shanghai'); // → false (DST abolished)

// Full true solar time pipeline for Beijing (116.4°E)
const solar = wallClockToSolarTime(2024, 6, 15, 12, 0, 'Asia/Shanghai', 116.4);
// → { trueSolarTime: Date, longitudeCorrection: -14.4, equationOfTime: ~0, ... }
```

#### City Database (城市)

143 cities across 11 regions with IANA timezone IDs and coordinates for true solar time computation.

| Export | Description |
|---|---|
| `CITIES` | Full city array: `{ name, nameEn, timezoneId, longitude, latitude, region }` |
| `CITY_REGIONS` | Region metadata: `{ key, label, labelEn }` |
| `searchCities(query)` | Search by Chinese name, English name, or pinyin |
| `getCitiesByRegion(regionKey)` | Filter cities by region |
| `findNearestCity(longitude, latitude)` | Find closest city by coordinates |

Regions: China (44), Taiwan (8), Hong Kong (2), Southeast Asia (20), East Asia (12), South Asia (10), Middle East (11), Europe (24), Americas (20), Oceania (7), Africa (5).

### 8. Composite

#### Daily Almanac (日曆總覽)

| Export | Description |
|---|---|
| `dailyAlmanac(date)` | Complete almanac: pillars, lunar date, solar terms, zodiac, day fitness, flying stars, almanac flags, Six Ren, eclipses, element analysis |

## Types

```typescript
type Stem = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸';
type Branch = '子' | '丑' | '寅' | '卯' | '辰' | '巳' | '午' | '未' | '申' | '酉' | '戌' | '亥';
type StemBranch = `${Stem}${Branch}`;
type Element = '金' | '木' | '水' | '火' | '土';
type ElementRelation = '生' | '剋' | '被生' | '被剋' | '比和';
type Strength = '旺' | '相' | '休' | '囚' | '死';
type DayRelation = '生' | '剋' | '合' | '衝' | '比和';
type PunishmentType = '無恩' | '恃勢' | '無禮';
type EarthType = '濕' | '燥';
type TenRelation = '比肩' | '劫財' | '食神' | '傷官' | '偏財' | '正財' | '七殺' | '正官' | '偏印' | '正印';
type LifeStage = '長生' | '沐浴' | '冠帶' | '臨官' | '帝旺' | '衰' | '病' | '死' | '墓' | '絕' | '胎' | '養';
type DayFitness = '建' | '除' | '滿' | '平' | '定' | '執' | '破' | '危' | '成' | '收' | '開' | '閉';
type FlyingStar = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type AlmanacCategory = 'noble' | 'academic' | 'romance' | 'travel' | 'wealth' | 'protection' | 'health' | 'inauspicious';
type LuckDirection = 'forward' | 'backward';
type TransmissionMethod = '賊剋' | '比用' | '涉害' | '遙剋' | '昴星' | '別責' | '八專' | '返吟' | '伏吟';
type HeavenlyGeneral = '貴人' | '螣蛇' | '朱雀' | '六合' | '勾陳' | '青龍' | '天空' | '白虎' | '太常' | '玄武' | '太陰' | '天后';

interface Pillar { stem: Stem; branch: Branch; }
interface FourPillars { year: Pillar; month: Pillar; day: Pillar; hour: Pillar; }
interface HiddenStem { stem: Stem; proportion: number; }
interface SolarTerm { name: string; longitude: number; date: Date; }
interface LunarMonth { monthNumber: number; isLeapMonth: boolean; startDate: Date; days: number; }
interface LunarDate { year: number; month: number; day: number; isLeapMonth: boolean; }

interface MajorLuckPeriod { pillar: { stem: Stem; branch: Branch; stemBranch: StemBranch }; startAge: number; endAge: number; }
interface MajorLuckResult { direction: LuckDirection; startAge: number; periods: MajorLuckPeriod[]; }
interface MinorLuckYear { age: number; pillar: { stem: Stem; branch: Branch; stemBranch: StemBranch }; }

interface FlyingStarInfo { number: FlyingStar; name: string; element: Element; color: string; }
interface AlmanacFlagInfo { name: string; english: string; auspicious: boolean; category: AlmanacCategory; }
interface AlmanacFlagResult extends AlmanacFlagInfo { positions: ('year' | 'month' | 'day' | 'hour')[]; }

interface SixRenLesson { upper: Branch; lower: Branch; }
interface SixRenChart { dayStem: Stem; dayBranch: Branch; hourBranch: Branch; monthlyGeneral: Branch; plates: Record<Branch, Branch>; lessons: SixRenLesson[]; transmissions: { initial: Branch; middle: Branch; final: Branch }; method: TransmissionMethod; generals: Record<Branch, HeavenlyGeneral>; }

interface QiMenChart { earthPlate: Record<number, string>; heavenPlate: Record<number, string>; stars: Record<number, string>; doors: Record<number, string>; deities: Record<number, string>; escapeMode: string; juShu: number; zhiFu: { star: string; palace: number }; zhiShi: { door: string; palace: number }; }

interface ZiWeiBirthData { year: number; month: number; day: number; hour: number; gender: 'male' | 'female'; }
interface ZiWeiPalace { name: string; branch: Branch; stem: Stem; majorStars: string[]; }
interface SiHua { lu: string; quan: string; ke: string; ji: string; }
interface ZiWeiChart { palaces: ZiWeiPalace[]; elementPattern: number; siHua: SiHua; birthData: ZiWeiBirthData; fatePalaceIndex: number; bodyPalaceIndex: number; taiSuiIndex: number; }

type EclipseKind = 'solar' | 'lunar';
type SolarEclipseType = 'T' | 'A' | 'P' | 'H';
type LunarEclipseType = 'T' | 'P' | 'N';
interface Eclipse { date: Date; kind: EclipseKind; type: SolarEclipseType | LunarEclipseType; magnitude: number; }
```

## License

MIT
