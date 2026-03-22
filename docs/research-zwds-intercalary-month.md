# 紫微斗數 (Zi Wei Dou Shu) and 閏月 (Intercalary Months): Research Notes

## 1. What is 紫微斗數?

紫微斗數 (Zi Wei Dou Shu / Purple Star Astrology) is one of the most sophisticated systems
of Chinese fortune-telling. It constructs a personal fate chart (命盤) from the lunar
calendar birth year, month, day, and double-hour (時辰).

**Key characteristics:**
- The name derives from 紫微垣 (Purple Forbidden Enclosure, the celestial region around
  the North Celestial Pole — the heavenly emperor's domain) + 斗數 ("dipper numbers")
- Unlike Western astrology, ZWDS does **not** use actual astronomical star positions.
  The 14 major stars are "virtual stars" (虛星) — mathematical symbols derived
  algorithmically from birth data. Their names come from Taoist scriptures
  (《北斗七星延命經》, 《太上說南斗六司延壽度人妙經》), not from observational astronomy.
  [Wikipedia: 紫微斗數](https://zh.wikipedia.org/zh-hant/%E7%B4%AB%E5%BE%AE%E6%96%97%E6%95%B0)
- Unlike 八字 (BaZi/Four Pillars), which is tied to solar terms, ZWDS uses the purely
  lunar calendar. 《紫微斗數全集·起例歌訣總括》: 「不依五星要過節，只論年月日時生」

---

## 2. The 命盤 (Fate Chart)

### 2.1 The 12 Palaces (十二宮)

| # | Palace | Chinese | Domain |
|---|--------|---------|--------|
| 1 | Destiny | 命宮 | Core personality, innate talents, life direction |
| 2 | Siblings | 兄弟宮 | Sibling relationships |
| 3 | Spouse | 夫妻宮 | Marriage, romantic relationships |
| 4 | Children | 子女宮 | Children, subordinates |
| 5 | Wealth | 財帛宮 | Finances, income |
| 6 | Health | 疾厄宮 | Physical health, ailments |
| 7 | Travel | 遷移宮 | Travel, external environment |
| 8 | Friends | 交友宮/奴僕宮 | Social relationships, employees |
| 9 | Career | 官祿宮/事業宮 | Career, professional life |
| 10 | Property | 田宅宮 | Real estate, home environment |
| 11 | Fortune | 福德宮 | Inner happiness, spiritual life |
| 12 | Parents | 父母宮/相貌宮 | Parental relationships, appearance |

Additionally, the 身宮 (Body Palace) overlaps one of the 12 palaces and represents
post-natal development.

Source: [紫微斗數全面解析](https://skill-mart.com/magazine/%E7%B4%AB%E5%BE%AE%E6%96%97%E6%95%B8%E6%80%8E%E9%BA%BC%E7%9C%8B/)

### 2.2 The 14 Major Stars (十四主星)

Divided into two star systems with fixed placement patterns relative to 紫微星:

**紫微星系 (Zi Wei System) — 6 stars, placed counter-clockwise from 紫微:**
1. 紫微星 (Zi Wei) — Emperor star: leadership, authority, dignity
2. 天機星 (Tian Ji) — Strategist: wisdom, adaptability, changeability
3. *(skip one palace)*
4. 太陽星 (Tai Yang) — Sun: generosity, public service, openness
5. 武曲星 (Wu Qu) — Military: financial acumen, determination, discipline
6. 天同星 (Tian Tong) — Harmony: gentleness, leisure, artistic temperament
7. *(skip two palaces)*
8. 廉貞星 (Lian Zhen) — Integrity: complexity, passion, political skill

**天府星系 (Tian Fu System) — 8 stars, placed clockwise from 天府:**
1. 天府星 (Tian Fu) — Treasury: stability, conservation, wealth management
2. 太陰星 (Tai Yin) — Moon: sensitivity, femininity, intuition
3. 貪狼星 (Tan Lang) — Greedy Wolf: desire, versatility, social charm
4. 巨門星 (Ju Men) — Giant Gate: analytical speech, disputes, investigation
5. 天相星 (Tian Xiang) — Prime Minister: service, diplomacy, mediation
6. 天梁星 (Tian Liang) — Heavenly Beam: elder wisdom, protection, charity
7. 七殺星 (Qi Sha) — Seven Killings: courage, aggression, decisive action
8. *(skip three palaces)*
9. 破軍星 (Po Jun) — Army Destroyer: reform, creative destruction

Source: [十四主星詳解](https://zwayyuan.com/main-stars/),
[安紫微十四主星](https://www.108s.tw/article/info/91)

---

## 3. Chart Construction Algorithm

### Step 1: Lunar Calendar Conversion
Convert Gregorian birth date → lunar (農曆) date. Requires precise new moon calculations.

### Step 2: Locate 命宮 (Destiny Palace)
Classical mnemonic: 「寅起順行至生月，生月起子兩頭通，逆至生時為命宮，順至生時好安身」

Algorithm:
1. Start at the **寅** (Yin/Tiger) position on the 12-palace grid
2. Count **clockwise** by the lunar birth **month** number
3. From that position, count **counter-clockwise** by the birth **hour** index
   (子=1, 丑=2, 寅=3, ... 亥=12)
4. Landing position = **命宮**

The 身宮 uses the same starting point but counts **clockwise** by the birth hour.

### Step 3: Arrange 12 Palaces
From 命宮, place remaining 11 palaces **counter-clockwise** in fixed sequence.

### Step 4: Determine Palace Heavenly Stems (五虎遁)
From the birth year's Heavenly Stem, determine 寅宮's stem:
- 甲/己 year → 丙寅 | 乙/庚 year → 戊寅 | 丙/辛 year → 庚寅
- 丁/壬 year → 壬寅 | 戊/癸 year → 甲寅

Then assign stems sequentially through all 12 palaces.

### Step 5: Determine 五行局 (Five Element Bureau)
Using the 命宮's stem + branch, look up 納音五行 (Na Yin) from the 60-Jiazi table.
Result: Bureau number B ∈ {2=水, 3=木, 4=金, 5=土, 6=火}

This is CRITICAL — the Bureau number determines:
- The starting position of 紫微星
- The starting age of major life cycles (大限)

### Step 6: Place 紫微星 (Zi Wei Star)
Formula: 「生日除局數，商數定紫微」
1. Multiplier = ⌈Birth Day ÷ Bureau Number⌉ (ceiling division)
2. Remainder = (Multiplier × Bureau Number) − Birth Day
3. From 寅, count forward by Multiplier steps
4. Adjust backward using Remainder with odd/even parity rules
5. Landing = 紫微星 position

### Step 7: Place Remaining 13 Major Stars
Fixed patterns relative to 紫微 (Zi Wei system) and 天府 (Tian Fu system).

### Step 8: Place Auxiliary & Transformation Stars
六吉星, 六煞星, 祿存, 天馬, and 四化 (化祿, 化權, 化科, 化忌).

Source: [Zi Wei Dou Shu Algorithm Guide](https://ziweiai.com.cn/static/en/20250512ziweiai-api.html),
[星林學苑排盤教學](https://www.108s.tw/article/info/88),
[排盤SOP](https://vocus.cc/article/66b9a907fd89780001e4189f)

---

## 4. How the Lunar Month Affects the Chart

The lunar month number is a **primary input** that directly determines:

1. **命宮 position** — the month is the first variable in the 安命宮 formula
2. **身宮 position** — also derived from month + hour
3. **Auxiliary star positions** — 左輔 (from 辰, count forward by month), 右弼 (from 戌,
   count backward by month)

**Cascade effect**: Changing the month by even ONE shifts the 命宮, which changes the
Five Element Bureau, which changes the 紫微星 position, which relocates ALL 14 major
stars. The entire chart is fundamentally different.

This is precisely why the 閏月 problem is so significant — an ambiguous month assignment
produces two entirely different fate charts.

---

## 5. The 閏月 (Intercalary Month) Controversy

### 5.1 Background

The Chinese lunisolar calendar inserts an intercalary (leap) month approximately every
2-3 years (7 times per 19-year Metonic cycle) to keep lunar months aligned with solar
seasons. The intercalary month bears the same number as the preceding month (e.g., 閏四月
follows 四月). By definition, an intercalary month contains no 中氣 (major solar term).

Since ZWDS charts depend on the month number, births during 閏月 create an ambiguity:
what month number should be used for charting?

### 5.2 The Four Approaches

#### Approach A: Treat 閏月 as the Previous Month (閏月算當月/上月)

**Arguments:**
- 「閏」means "surplus/extra" — 閏月 is supplementary to the current month, not a new month
- Classical charting instructions (《紫微斗數全集·安身命訣》) simply say "whatever month,
  place whatever stars" with no mention of special 閏月 handling
- This is the **only** method that handles **閏十二月** without contradiction
  (閏十二月 simply = 12th month)

**Key advocate**: 譚冰 (Tam Bing), calendar historian, argues in 《風水天地》(vol. 241,
Oct 2012) that since ZWDS was created during the Ming dynasty when 閏月 could appear in
any month (including 閏十二月, which occurred 8 times 1368-1644), the original design must
have used this simplest approach.

**Counter-evidence**: The 《紫微斗數全書》explicitly contradicts this (see Approach B).

Source: [斗數閏月起盤探究 (譚冰)](https://tambingblog.wordpress.com/2012/10/01/%E6%96%97%E6%95%B8%E9%96%8F%E6%9C%88%E8%B5%B7%E7%9B%A4%E6%8E%A2%E7%A9%B6/)

#### Approach B: Treat 閏月 as the Following Month (閏月算下月)

**Textual support:**
《紫微斗數全書·安身命例》:
> 「又若閏正月生者，要在二月內起安身命。凡有閏月，俱要依此為例。」
> ("If born in intercalary 1st month, use the 2nd month for charting.
> All leap months follow this rule.")

**Problem — the 閏十二月 paradox:**
If 閏十二月 → use month 1, then the birth *year* must also change (different 干支),
which would cascade through the entire chart. The text never addresses this.

**Internal contradiction**: The same 《紫微斗數全書》(卷四) contains a chart example
titled "進士之命" for a person born in **閏十二月** of 丙申年, 初十日亥時 — and the chart
uses month 12, NOT month 1 of the following year.

Source: [紫微斗數全書](https://books.google.com/books/about/%E7%B4%AB%E5%BE%AE%E6%96%97%E6%95%B8%E5%85%A8%E6%9B%B8.html?id=0j1LDwAAQBAJ)

#### Approach C: Split at the Midpoint (閏月十五日分界 / 月中切分法)

**Textual support:**
《斗數宣微·安身命例》:
> 「又如閏正月生者，十五日以前，作正月看；十五日以後，作二月看。
> 凡有閏月，俱依此為例。」

**Historical support:**
Qing dynasty 《星歷考原》(1713, compiled by 李光地 under Emperor Kangxi's edict),
quoting the pre-Qin 《汲冢周書》:
> 「中氣以著時應，閏無中氣，斗柄指兩辰之間。故閏前之月，中氣在晦，閏後之月，
> 中氣在朔，當閏之月，節居月中。以前作前月用事，以後作後月用事。」

Translation: "The intercalary month has no zhōngqì. In such a month, the jiéqì (minor
solar term) falls at mid-month. The first half operates as the previous month; the
second half as the next month."

**Criticisms:**
- The 15th-day cutoff is arbitrary; some argue the 望 (full moon) would be more
  astronomically meaningful as the true midpoint
- 《星歷考原》is a 選擇 (date-selection/择日) text, not a ZWDS text
- Still doesn't cleanly solve 閏十二月 (the second half would need to become month 1
  of the next year)

**Variant**: Some practitioners use the actual **節氣** (minor solar term) crossing date
as the dividing point instead of the fixed 15th day.

Source: [農曆閏月 | lifedna.com.tw](https://www.lifedna.com.tw/blog/c40.html),
[ZWDS Intercalary Month Discussion](https://zwdsastrology.blogspot.com/p/the-intercalary-month.html)

#### Approach D: Follow Solar Terms (效法子平八字)

Some practitioners advocate using solar term boundaries to define months (as in BaZi),
which would eliminate the 閏月 problem entirely.

**Refutation**: 《紫微斗數全集·起例歌訣總括》explicitly rejects this:
> 「不依五星要過節，只論年月日時生」

ZWDS is a lunar system; importing solar-term month boundaries contradicts its foundation.

### 5.3 The 閏十二月 Test Case

This edge case is the critical test for any intercalary month theory:

Under the Ming dynasty 平氣 (mean solar terms) system, 閏十二月 occurred 8 times between
1368-1644: 1392, 1411, 1422, 1430, 1517, 1525, 1536, 1574.

Under the post-1645 定氣 (true solar terms) system, 閏十二月 is extremely rare. The
practical irrelevance of 閏十二月 in modern times has allowed competing theories to
coexist without being tested against this edge case.

Only **Approach A** (treat as previous month) handles 閏十二月 without any contradictions.

### 5.4 Impact of the Ming-Qing Calendar Reform

The 1645 adoption of 定氣 (true solar terms, replacing 平氣/mean solar terms) fundamentally
changed the distribution of intercalary months:

- **Before 1645** (平氣): 閏月 could occur in any month with roughly equal probability,
  including 閏正月 and 閏十二月
- **After 1645** (定氣): 閏月 concentrates in summer months (April-August) because the
  Earth moves slower near aphelion, making the interval between 中氣 shorter than a
  synodic month more likely in summer. 閏十一月 and 閏十二月 become extremely rare.

This calendar reform is crucial context: the controversy can persist because the difficult
edge cases (閏十一月, 閏十二月) no longer arise in practice.

Source: [斗數閏月起盤探究 (譚冰)](https://tambingblog.wordpress.com/2012/10/01/%E6%96%97%E6%95%B8%E9%96%8F%E6%9C%88%E8%B5%B7%E7%9B%A4%E6%8E%A2%E7%A9%B6/)

### 5.5 Practical Recommendation

Most authoritative practitioners recommend:
1. Chart **both** possible month assignments
2. Compare both charts against the person's actual life events
3. Use the chart that better matches reality

This empirical approach acknowledges the theoretical impasse while providing practical
utility.

---

## 6. Historical Context

### 6.1 陳摶 / 陳希夷 (Chen Tuan / Chen Xi Yi)

- **Dates**: 871-989 CE (lived ~118 years according to tradition)
- **Names**: 字圖南, 號扶搖子/白雲先生/希夷先生
  - "希" = hearing without hearing; "夷" = seeing without seeing (Daoist concept)
- **Origin**: 亳州真源縣 (modern 鹿邑, Henan) per 《宋史》; other accounts say
  普州崇龕 (modern Chongqing) or 華州華陰 (modern Shaanxi)
- **Life**: Failed the civil service examination, then devoted himself to Daoist, Buddhist,
  and Confucian studies. Hermit on 武當山, 華山 (Mount Hua), and 少華山.
- **Honors**: Emperor Zhou Shizong (Five Dynasties) bestowed the title 白雲先生;
  Song Taizong bestowed the title 希夷先生
- **Influence**: His thought synthesized all three teachings (三教合流). Credited as an
  intellectual ancestor of Song Neo-Confucianism (理學). Zhou Dunyi's 《太極圖說》,
  Shao Yong's 《先天圖》, and the 河圖洛書 tradition trace back to him.

Source: [陳摶 — 維基百科](https://zh.wikipedia.org/zh-tw/%E9%99%88%E6%8A%9F),
[紫微斗數的創始人](https://ptzl.tw/article-info.asp?cate=16&id=65)

### 6.2 Academic Assessment of Attribution

- **Traditional claim**: 陳摶 created ZWDS through star observation (觀星) on Mount Hua
- **Alternative tradition**: 呂洞賓 (Lü Dongbin) originated it; 陳摶 systematized it.
  《宋史·陳摶傳》records that 呂洞賓 "frequently visited Chen Tuan's study" (「數來摶齋中」)
- **Scholarly skepticism**: Wikipedia notes the attribution is "possibly apocryphal"
  (可能為託名). No Song dynasty manuscripts survive. The earliest extant texts are
  Ming dynasty prints.
- **Transmission lineage** (traditional): 呂純陽 (Tang) → 陳希夷 (Song) → 羅洪先 (Ming)

### 6.3 The 全書 and Other Key Texts

| Text | Date | Notes |
|------|------|-------|
| 《紫微斗數全書》 | Ming dynasty (preface dated 1550 by 羅洪先) | Most important text. Attributed to 陳摶, compiled by 潘希尹. Contains charting rules and example charts. |
| 《紫微斗數全集》 | Ming dynasty; widely circulated as Late Qing woodblock reprint | Companion text with 十八飛星 system |
| 《紫微斗數捷覽》 | 明萬曆九年 (1581) | Earliest confirmed appearance of the name "紫微斗數" |
| 《斗數宣微》 | Republican era, by 王裁珊 | Contains the "split at 15th day" 閏月 rule |
| 《萬曆續道藏》 (1607) | Contains a "紫微斗數" entry | **Different system** — different star names, different methods |

Source: [紫微斗數 — 維基百科](https://zh.wikipedia.org/zh-hant/%E7%B4%AB%E5%BE%AE%E6%96%97%E6%95%B0),
[Chinese Text Project](https://ctext.org/wiki.pl?if=en&res=979714)

---

## 7. The 洛陽 (Luoyang) Reference

### 7.1 Why Luoyang?

Luoyang's significance for ZWDS stems from three interconnected roles:

**A. "Center of All Under Heaven" (天下之中)**
- 《史記·周本紀》: 「雒邑乃天下之中，四方入貢道里均」
- 《尚書·召誥》calls it 土中 ("earth's center")
- Capital of 13+ dynasties spanning ~1,500 years

**B. Center of Astronomical Observation**
- **周公測景台** (Duke of Zhou's gnomon, ~1000 BCE) at 登封告城 near Luoyang — established
  the tradition of solar shadow measurement for determining solar terms and seasons
- **東漢靈台** — National observatory in Luoyang (56-306 CE), where 張衡 built the
  armillary sphere and seismograph; operated for 250+ years
- **登封觀星台** (1279) — Yuan dynasty observatory where 郭守敬 created the 《授時曆》
  (tropical year = 365.2425 days, matching the Gregorian calendar 300 years earlier)
- Tang astronomer **一行** (Yi Xing) conducted meridian measurements from this region

**C. Reference Longitude for Timekeeping**
- Luoyang's approximate longitude: **112.45°E**
- In ZWDS practice, "洛陽時間" means using Luoyang as the zero-point for time correction,
  since the system was developed when Luoyang was the imperial astronomical center
- Modern Beijing Standard Time uses **120°E** — a difference of ~7.55° or ~30 minutes
- Debate: Should ZWDS true solar time corrections reference Luoyang (historical fidelity)
  or the birth location (practical accuracy)?

Source: [百日火靈師傅 — 洛陽時間](https://www.astroziweifirespiritchan.com/%E7%B4%AB%E5%BE%AE%E6%96%97%E6%95%B8%E6%B4%9B%E9%99%BD%E6%99%82%E9%96%93%E3%80%81%E7%B4%AB%E5%BE%AE%E6%96%97%E6%95%B8%E7%9A%84%E6%9C%AC%E5%B0%8D%E5%90%88%E9%84%B0%E4%B9%8B%E9%97%9C%E4%BF%82/),
[周公測景台 — 維基百科](https://zh.wikipedia.org/zh-hans/%E5%91%A8%E5%85%AC%E6%B8%AC%E6%99%AF%E5%8F%B0),
[登封觀星台 — 維基百科](https://zh.wikipedia.org/zh-hans/%E7%99%BB%E5%B0%81%E8%A7%82%E6%98%9F%E5%8F%B0)

---

## 8. Computational Requirements

### 8.1 For Lunar Calendar Generation

| Computation | Purpose | Precision Required |
|---|---|---|
| New Moon (朔) timing | First day of each lunar month | ~1 second (per GB/T 33661-2017) |
| Solar longitude (太陽黃經) | Determine 24 solar terms | ~1 second for 中氣/節氣 boundaries |
| 中氣 assignment to months | Identify intercalary months | Depends on new moon + solar term precision |

### 8.2 For ZWDS Chart Construction

| Input | Source | Type |
|---|---|---|
| Lunar year, month, day | Calendar conversion | Integer (discrete) |
| Birth hour (時辰) | 12 double-hours | Integer index (1-12) |
| Year Heavenly Stem | From sexagenary cycle | Lookup table |
| Five Element Bureau | From 納音五行 (60 Jiazi table) | Lookup table |

The ZWDS algorithm itself uses only **integer arithmetic** and **lookup tables** — no
floating-point astronomy is needed once the lunar date is established.

### 8.3 True Solar Time (Optional Correction)

```
True Solar Time = Mean Solar Time + Equation of Time + Longitude Correction
Longitude Correction = (Local Longitude - Reference Longitude) × 4 minutes/degree
```

Where Reference Longitude = 120°E (Beijing) or 112.45°E (Luoyang), depending on school.

The Equation of Time varies by ±16 minutes throughout the year and requires knowledge of
the Earth's orbital parameters (eccentricity, obliquity, longitude of perihelion).

### 8.4 The 19-Year Metonic Cycle

The fundamental relationship: 235 synodic months ≈ 19 tropical years.
- Since 235 = 19 × 12 + 7, there are 7 intercalary months every 19 years
- The 四分 system: synodic month = (365.25 × 19/235) = 29 + 499/940 days

### 8.5 Post-1645 定氣 Complications

The switch from 平氣 (uniform solar terms) to 定氣 (true solar terms) in 1645 means:
- Time between consecutive 中氣 varies: 29.44 to 31.44 days
- It is now possible for a lunar month to contain TWO 中氣
- Multiple months without 中氣 can occur in a single year
- Additional rules needed: only the first month without 中氣 after the Winter Solstice
  month is designated intercalary

### 8.6 Modern Institutional Authority

The **Purple Mountain Observatory** (紫金山天文台) near Nanjing is responsible for
computing the official Chinese calendar using modern planetary ephemerides.

The **GB/T 33661-2017** national standard requires:
- Calculations accurate to ~1 second
- Based on modern astronomical theories following IERS conventions
- Computations referenced to the 120°E meridian

Source: [Chinese Calendar Rules](https://ytliu0.github.io/ChineseCalendar/rules.html),
[Solar Terms](https://en.wikipedia.org/wiki/Solar_term),
[Chinese Calendar — Wikipedia](https://en.wikipedia.org/wiki/Chinese_calendar)

---

## 9. Summary Table: 閏月 Approaches

| Approach | Rule | Classical Source | Handles 閏十二月? | Weakness |
|---|---|---|---|---|
| A. Previous month | 閏N月 → month N | (implicit in 全集) | Yes (cleanly) | Contradicted by 全書 |
| B. Following month | 閏N月 → month N+1 | 《紫微斗數全書》 | No (year change needed) | Self-contradicted by 全書 example |
| C. Split at 15th | 1-15 → month N; 16+ → month N+1 | 《斗數宣微》, 《星歷考原》 | Partially (second half problematic) | Arbitrary cutoff |
| D. Solar terms | Use 節氣 boundaries | None in ZWDS texts | N/A | Contradicts ZWDS lunar foundation |

---

## 10. Key Sources and Citations

### Primary Texts
1. 《紫微斗數全書》(新鐫希夷陳先生紫微斗數全書) — Ming dynasty, attributed to 陳摶, compiled by 潘希尹
2. 《紫微斗數全集》(十八飛星策天紫微斗數全集) — Ming dynasty
3. 《斗數宣微》— Republican era, by 王裁珊
4. 《紫微斗數捷覽》— 明萬曆九年 (1581)
5. 《星歷考原》— Qing dynasty, 康熙五十二年 (1713), compiled by 李光地

### Modern Scholarly Sources
6. 譚冰 (Tam Bing), "斗數閏月起盤探究," 《風水天地》vol. 241 (October 2012)
7. GB/T 33661-2017, Chinese national standard for calendar computation

### Online References
8. [紫微斗數 — 維基百科](https://zh.wikipedia.org/zh-hant/%E7%B4%AB%E5%BE%AE%E6%96%97%E6%95%B0)
9. [陳摶 — 維基百科](https://zh.wikipedia.org/zh-tw/%E9%99%88%E6%8A%9F)
10. [ZWDS Intercalary Month (English)](https://zwdsastrology.blogspot.com/p/the-intercalary-month.html)
11. [Zi Wei Dou Shu Algorithm & Python Library Guide](https://ziweiai.com.cn/static/en/20250512ziweiai-api.html)
12. [Chinese Calendar Rules](https://ytliu0.github.io/ChineseCalendar/rules.html)
13. [農曆閏月 | lifedna.com.tw](https://www.lifedna.com.tw/blog/c40.html)
14. [惟馨堂 — 農曆閏月出生的人](https://www.fatebook.cc/fatebook/fate/fate10036.html)
