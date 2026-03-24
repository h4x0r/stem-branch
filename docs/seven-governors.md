# Seven Governors Four Remainders (七政四餘)

Chinese sidereal astrology system computing positions for 11 celestial bodies
across 28 lunar mansions and 12 palaces. This document covers the astronomical
models, computational methods, and historical context behind the implementation.

---

## Overview

七政四餘 is a Chinese astrological system that places celestial bodies in a
sidereal reference frame anchored to the 28 lunar mansions (二十八宿). Unlike
Western tropical astrology (which follows the vernal equinox), this system ties
the ecliptic to fixed stars — specifically Spica (α Virginis), the determinative
star of the first mansion 角宿.

The system comprises:

| Group | Bodies | Count |
|-------|--------|-------|
| **Seven Governors (七政)** | Sun (日), Moon (月), Mercury (水), Venus (金), Mars (火), Jupiter (木), Saturn (土) | 7 |
| **Four Remainders (四餘)** | Rahu (羅睺), Ketu (計都), Yuebei (月孛), Purple Qi (紫氣) | 4 |

Each body is placed by sidereal ecliptic longitude into one of the 28 mansions,
which are then grouped into 12 palaces (宮). The ascendant (命宮) determines
which palace governs the native's fate, and the remaining 11 palaces are assigned
roles (財帛宮, 兄弟宮, etc.) by offset from the ascendant.

---

## 1. Sidereal Reference Frame

### The problem: tropical vs. sidereal

Western astronomy uses **tropical** coordinates referenced to the vernal equinox,
which precesses westward at ~50.3"/year due to Earth's axial precession. Over
centuries, tropical longitudes drift significantly relative to the fixed stars.

Chinese 七政四餘 requires **sidereal** coordinates — longitudes measured against
the stellar background. The conversion is:

```
sidereal_longitude = tropical_longitude − ayanamsa
```

where the **ayanamsa** is the accumulated precession since the reference epoch.

### Our implementation

The sidereal engine (`src/seven-governors/sidereal.ts`) anchors 0° sidereal to
Spica (α Virginis), the determinative star of 角宿 (Horn mansion). Spica's
J2000.0 tropical ecliptic longitude is 201.2983°.

Three configurable modes are provided:

| Mode | Ayanamsa computation | Use case |
|------|---------------------|----------|
| `modern` (default) | `SPICA_J2000 + precession(T)/3600` using IAU precession model | Modern astronomical accuracy |
| `classical` | Fixed ayanamsa from a historical epoch (開元 724 CE or 崇禎 1628 CE) | Reproducing historical charts |
| `ayanamsa` | User-supplied fixed value | Interoperability with other systems |

The `modern` mode computes the ayanamsa dynamically using the same
`precessionInLongitude(T)` function used elsewhere in the library, ensuring
consistency with the VSOP87D planetary positions.

---

## 2. The Seven Governors (七政)

The seven governors are the classical visible planets. Their tropical ecliptic
longitudes come from the library's existing planetary engine:

| Body | Source function | Algorithm |
|------|----------------|-----------|
| Sun (太陽) | `getSunLongitude(date)` | VSOP87D (2,425 terms) + DE441 correction polynomial |
| Moon (太陰) | `getMoonPosition(date)` | Meeus Ch. 47 (ELP-based, 60+ periodic terms) |
| Mercury (水星) | `getPlanetPosition('mercury', date)` | VSOP87D with aberration correction |
| Venus (金星) | `getPlanetPosition('venus', date)` | VSOP87D with aberration correction |
| Mars (火星) | `getPlanetPosition('mars', date)` | VSOP87D with aberration correction |
| Jupiter (木星) | `getPlanetPosition('jupiter', date)` | VSOP87D with aberration correction |
| Saturn (土星) | `getPlanetPosition('saturn', date)` | VSOP87D with aberration correction |

These produce geocentric apparent tropical ecliptic longitudes, which are then
converted to sidereal via the ayanamsa described above.

Accuracy against JPL DE441 (numerical ground truth):
- Inner planets (Mercury, Venus): mean ~1–2", max ~6"
- Outer planets (Mars–Saturn): mean ~11–14", max ~23–29"

See [docs/accuracy.md](accuracy.md) for the full validation methodology and
residual statistics.

---

## 3. The Four Remainders (四餘)

The four remainders are non-planetary points derived from lunar orbital
mechanics (three of them) and a classical formula (one). Their computation
is in `src/seven-governors/four-remainders.ts`.

### 3.1 Rahu (羅睺) — Moon's mean ascending node

The Moon's orbit is tilted ~5.15° to the ecliptic. The **ascending node** is
where the Moon crosses the ecliptic going northward. This point regresses
(moves retrograde) through the ecliptic with a period of ~18.61 years.

**Formula** (Meeus Ch. 22, mean ascending node):

```
Ω = 125.0445479°
  − 1934.1362891° × T
  + 0.0020754° × T²
  + T³ / 467441
  − T⁴ / 60616000
```

where T is Julian centuries from J2000.0 (2000 Jan 1.5 TT).

The large negative coefficient on T (−1934°/century) produces the retrograde
motion. This is the **mean** node — it does not include short-period
oscillations (nutation terms). For astrological purposes, the mean node is
the standard choice.

### 3.2 Ketu (計都) — osculating lunar apogee or descending node

This is the most historically contentious of the four remainders. In the
mature Chinese 七政四餘 system (as codified in 《果老星宗》), 計都 is
identified with the **osculating lunar apogee** — not the descending node
as in the original Indian system. See [§5: The Ketu–Rahu Translation
Problem](#5-the-keturahu-translation-problem-計都羅睺) for the full
historical analysis.

**Default mode (`apogee`):**

The osculating (true) apogee is computed from the mean perigee longitude
plus a perturbation correction:

```
mean_perigee(T) = 83.3532465°
               + 4069.0137287° × T
               − 0.0103200° × T²
               − T³ / 80053
               + T⁴ / 18999000

Ketu_longitude = (mean_perigee + 180° + correction) mod 360°
```

The perturbation correction accounts for solar gravitational influence on the
Moon's apsidal line and consists of 5 periodic terms derived from the Delaunay
arguments (D, M, M', F):

| Term | Coefficient | Argument |
|------|-------------|----------|
| 1 | −1.4979° | 2D − M' |
| 2 | −0.1500° | 2D |
| 3 | −0.1226° | M' |
| 4 | +0.1176° | 2M' |
| 5 | −0.0801° | 2F |

This produces the **osculating apogee**, which oscillates around the mean by
±10–30° due to solar perturbation.

**Alternative mode (`descending-node`):**

For users who prefer the original Indian identification of Ketu as the
descending node:

```
Ketu_longitude = (Rahu_longitude + 180°) mod 360°
```

The mode is selectable via the `ketuMode` option in `SevenGovernorsOptions`.

### 3.3 Yuebei (月孛) — mean lunar apogee

月孛 is the **mean** apogee of the Moon's orbit — the smoothed, averaged
apsidal longitude without the oscillatory perturbation terms that affect 計都.

```
Yuebei_longitude = (mean_perigee + 180°) mod 360°
```

This uses the same mean perigee polynomial as Ketu but omits the 5-term
perturbation correction. In Western astrology, this point is known as the
**mean Black Moon Lilith**.

**Ketu vs. Yuebei distinction:**

| Property | Ketu (計都) | Yuebei (月孛) |
|----------|------------|--------------|
| Type | Osculating (true) apogee | Mean apogee |
| Perturbations | 5-term correction applied | None (smooth) |
| Typical difference | — | 10–30° from Ketu |
| Western equivalent | Osculating Black Moon Lilith | Mean Black Moon Lilith |

The Chinese system thus maintains a finer distinction than either the Indian
or Western systems by tracking both the perturbed and smoothed apsidal points
as separate entities.

### 3.4 Purple Qi (紫氣) — classical formula

紫氣 is the only remainder with **no known astronomical counterpart**. It does
not correspond to any planet, node, apsidal point, or other identifiable
celestial phenomenon.

**Formula:**

```
Purple_Qi_longitude = EPOCH_LON + (days_since_J2000 × 360° / 10195.5)
```

The period of 10195.5 days ≈ 27.9 years produces prograde motion completing
one full circuit in approximately 28 years.

**Historical source:**

The Yuan dynasty text 《革象新書》 (Ge Xiang Xin Shu, by Zhao Youqin 趙友欽,
c. 1290s) states:

> 夫紫氣者，起於閏法，約二十八年而周天

"Purple Qi arises from the intercalary method, completing one circuit of
heaven in approximately 28 years."

This suggests 紫氣 may derive from the lunisolar calendar's intercalary cycle.
The Chinese calendar inserts 7 leap months every 19 years (the Metonic cycle),
and the accumulated error from this approximation takes roughly 28 years to
complete a full cycle through the ecliptic — though the exact derivation
remains a subject of scholarly investigation.

**Candidate astronomical associations (unconfirmed):**

Several scholars have proposed astronomical identifications:

1. **Saturn's sidereal period** (~29.46 years) — close but not matching the
   ~28-year value
2. **Jupiter–Saturn intercalary resonance** — the interaction between their
   synodic periods and the calendar
3. **Lunisolar accumulation cycle** — the error accumulation in the 19-year
   Metonic cycle

None of these have been definitively established. The current implementation
uses the classical linear formula with a provisional epoch longitude of 0°,
pending sourcing from 《果老星宗》.

---

## 4. Mansion and Palace Mapping

### 28 Lunar Mansions (二十八宿)

The ecliptic is divided into 28 unequal segments, each named for its
**determinative star** (距星). Mansion boundaries are defined by the sidereal
ecliptic longitudes of these stars, with the first mansion 角 (Horn) starting
at 0° (Spica).

Mansions vary considerably in angular width:

| Narrowest | Widest |
|-----------|--------|
| 觜 (Turtle Beak): 2.5° | 井 (Well): 33° |

The mansion boundaries in `src/seven-governors/data/mansion-boundaries.ts`
are sourced from J2000.0 ecliptic longitudes of the Hipparcos catalogue
determinative stars, converted to the Spica-anchored sidereal frame. These
values are approximate pending full verification (see
`scripts/verify-mansion-boundaries.mjs`).

Mansion lookup uses binary search on the sorted boundary array, handling the
wrap-around at the 軫/角 boundary (360° → 0°).

### 12 Palaces (十二宮)

The 12 palaces are equal 30° divisions of the sidereal ecliptic, named for
the Earthly Branches in reverse order starting from 辰:

| Palace | Start | End | Associated mansions |
|--------|-------|-----|-------------------|
| 辰宮 | 0° | 30° | 角, 亢 |
| 卯宮 | 30° | 60° | 氐, 房, 心 |
| 寅宮 | 60° | 90° | 尾, 箕 |
| 丑宮 | 90° | 120° | 斗, 牛 |
| 子宮 | 120° | 150° | 女, 虛, 危 |
| 亥宮 | 150° | 180° | 室, 壁 |
| 戌宮 | 180° | 210° | 奎, 婁, 胃 |
| 酉宮 | 210° | 240° | 昴, 畢 |
| 申宮 | 240° | 270° | 觜, 參 |
| 未宮 | 270° | 300° | 井, 鬼 |
| 午宮 | 300° | 330° | 柳, 星, 張 |
| 巳宮 | 330° | 360° | 翼, 軫 |

Palace assignment is by sidereal degree: `palace_index = floor(lon / 30)`.
The "associated mansions" column is for display reference only — bodies are
placed by their computed degree, not by mansion name.

### Palace Roles (宮位)

The 12 palaces are assigned functional roles relative to the ascendant (命宮).
The ascendant palace receives the role 命宮, and roles rotate through the
remaining palaces:

命宮 → 兄弟宮 → 妻妾宮 → 男女宮 → 財帛宮 → 疾厄宮 →
遷移宮 → 奴僕宮 → 官祿宮 → 田宅宮 → 福德宮 → 相貌宮

---

## 5. The Ketu–Rahu Translation Problem (計都/羅睺)

One of the most studied questions in the history of Sino-Indian astronomical
transmission: did the astronomical identities of Rahu and Ketu get swapped
when translated into Chinese?

### The Indian originals

In Jyotish (Indian astrology), Rahu and Ketu are both **lunar nodes**:

| Sanskrit | Identity | Metaphor |
|----------|----------|----------|
| **Rahu** (राहु) | Ascending node | Dragon's head |
| **Ketu** (केतु) | Descending node | Dragon's tail |

They are shadow planets (chāyā graha) that cause eclipses. They are always
180° apart — knowing one gives the other trivially.

### The Chinese reception

The transmission came primarily through the *Jiuzhi li* (九執曆), translated
by Gautama Siddha (瞿曇悉達) in 718 CE from Indian astronomical sources and
included in the *Kaiyuan zhanjing* (開元占經).

In the received Chinese system:

- **羅睺** retained the identity of the ascending node — no scholarly
  controversy on this point
- **計都** diverged from the descending node

By the time the mature 七政四餘 system was codified in 《果老星宗》
(Song–Ming dynasty), 計都 was identified with the **lunar apogee**, not the
descending node. This is astronomically a completely different point — the
apogee lies on the Moon's apsidal line, not its nodal line.

### Why did this happen?

Several hypotheses appear in the literature:

**1. Redundancy elimination (pragmatic)**

The descending node is just the ascending node + 180° — it carries zero
independent astronomical information. Chinese astronomers may have found it
more useful to repurpose the "slot" for the apsidal point, which provides
genuinely new positional data. Yabuuchi Kiyoshi (薮内清) noted this pragmatic
motivation in his research on Sui–Tang calendrical history.

**2. Source text ambiguity**

Some Indian texts describe Ketu not purely as a node but with apogee-like
characteristics. The Sanskrit term *ketu* itself means "bright appearance" or
"comet" — its astronomical identity was not always fixed even within Indian
traditions. Early Indian sources sometimes conflated Ketu with other
phenomena.

**3. Gradual transmission drift**

The 九執曆 passed through multiple layers of translation (Sanskrit → possibly
Sogdian or Persian intermediaries → Chinese). Niu Weixing (牛衛星, 1995)
traced how the identification shifted across successive Chinese astronomical
texts and argued the conflation was gradual rather than a single
mistranslation event.

**4. Deliberate reinterpretation**

Ho Peng Yoke suggested Chinese astronomers were not passively receiving Indian
astronomy — they actively adapted it to fit their own cosmological framework.
The Four Remainders needed to be four *distinct* points providing independent
information, and having two that are always 180° apart was cosmologically
unsatisfying.

### The 月孛 complication

If 計都 took over the apogee role, what is 月孛? Niu Weixing's resolution,
which this implementation follows:

- **計都** = osculating (true) apogee — perturbed, oscillates ±10–30°
- **月孛** = mean apogee — smooth, averaged apsidal line

The Chinese system ended up with a *finer* distinction than the Indian one:
two separate measures of the Moon's apsidal geometry (osculating vs. mean),
rather than two redundant node points. Whether this was intentional
astronomical insight or a fortunate accident of transmission is debated.

### Our implementation

The `KetuMode` type makes this historiographic choice explicit:

```typescript
type KetuMode = 'apogee' | 'descending-node';
```

- `'apogee'` (default): Chinese 七政四餘 convention per 《果老星宗》 and
  Niu Weixing — 計都 as the osculating lunar apogee
- `'descending-node'`: Original Indian Jyotish convention — Ketu as the
  point diametrically opposite Rahu

### Is 紫氣 a Jyotish problem?

No. 紫氣 (Purple Qi) is unique to the Chinese 七政四餘 system and has no
counterpart in Indian Jyotish. The Indian system has exactly two shadow
planets (Rahu and Ketu); the Chinese system expanded this to four by adding
月孛 and 紫氣. The latter appears to be an indigenous Chinese contribution,
possibly derived from calendar mathematics rather than astronomical
observation.

---

## 6. Ascendant (命宮)

The ascendant is the ecliptic degree rising above the eastern horizon at
the moment of birth. It determines which palace is designated 命宮 (Fate
Palace), anchoring the entire chart.

**Formula** (standard astronomical):

```
ASC = atan2(−cos(LST), sin(LST) × cos(ε) + tan(φ) × sin(ε))
```

where:
- LST = local sidereal time in degrees (GMST + observer longitude)
- ε = mean obliquity of the ecliptic (~23.44°, computed from Meeus Ch. 22)
- φ = observer geographic latitude

GMST is computed from the Meeus Ch. 12 polynomial in Julian centuries.

---

## 7. Interpretive Layers

### Dignity (廟旺平陷)

Each body has a dignity level in each palace, indicating whether it is
well-placed or poorly-placed:

| Dignity | Meaning |
|---------|---------|
| 廟 (Temple) | Strongest — body is in its home palace |
| 旺 (Exalted) | Strong — body is exalted |
| 平 (Neutral) | Neither strong nor weak |
| 陷 (Fallen) | Weakest — body is debilitated |

The dignity table is sourced from 《果老星宗》. Currently only Sun and Moon
have non-placeholder values; the remaining 9 bodies default to 平 pending
full data sourcing from classical texts.

### Aspects (合沖刑三合)

Aspects are relationships between bodies based on the angular distance
between their palaces:

| Palace distance | Aspect | Meaning |
|-----------------|--------|---------|
| 0 | 合 (Conjunction) | Bodies in same palace |
| 3 | 刑 (Punishment) | Square-like tension |
| 4 | 三合 (Trine) | Harmonious support |
| 6 | 沖 (Opposition) | Direct opposition |

Aspects are computed from palace indices (0–11), not from precise degree
separation. This follows the traditional Chinese method where palace
membership, not exact angular distance, determines the relationship.

### Star Spirits (神煞)

Star spirits are pattern-based astrological markers that trigger when
specific configurations appear in the chart. Examples:

| Spirit | Condition | Type |
|--------|-----------|------|
| 日月夾命 | Sun and Moon in palaces adjacent to 命宮 | Auspicious |
| 祿存 | Jupiter in 命宮 | Auspicious |
| 火鈴夾命 | Mars and Ketu adjacent to 命宮 | Malefic |

The current implementation includes 3 rules from 《果老星宗》. The traditional
system includes approximately 40–80 additional rules which are tracked for
future implementation.

---

## 8. Data Sourcing Status

The computational framework is complete, but several data tables require
sourcing from classical texts (primarily 《果老星宗》):

| Data | Status | Impact |
|------|--------|--------|
| Mansion boundaries (28 startDeg values) | Approximate from Hipparcos | May be off by 1–2° per mansion |
| Palace starting point (辰宮 at 0°) | Implemented, needs textual confirmation | Could shift all palace assignments |
| Purple Qi epoch longitude | Provisional (0°) | Constant offset on all 紫氣 positions |
| Dignity table (132 entries) | Sun/Moon complete, 9 bodies placeholder | Dignity lookups return 平 for most bodies |
| Star spirit rules (~50–80) | 3 implemented | Most patterns not yet detected |

---

## 9. References

### Primary sources

- [《果老星宗》](https://archive.org/details/guolaoxingzong) — Standard
  reference for 七政四餘, attributed to Li Chunfeng (李淳風, Tang dynasty) but
  likely compiled in the Song–Ming period. Primary source for dignity tables,
  star spirit rules, and chart interpretation. Full scanned volumes available
  on Internet Archive.

- [《革象新書》](https://ctext.org/wiki.pl?if=gb&res=1474554) (Ge Xiang Xin
  Shu) by Zhao Youqin (趙友欽, Yuan dynasty, c. 1290s) — Contains the key
  passage on Purple Qi: "夫紫氣者，起於閏法，約二十八年而周天". Full text on
  Chinese Text Project.

- [《開元占經》](https://ctext.org/datawiki.pl?if=en&res=252606) (Kaiyuan
  Zhanjing) — Tang dynasty compilation by Gautama Siddha (瞿曇悉達), containing
  the 《九執曆》 (Jiuzhi li) in vol. 104 — the primary vector for Indian
  astronomical concepts entering China. Full text on Chinese Text Project.

### Scholarly literature

- Niu Weixing 钮卫星, ["罗睺、计都天文学含义考源"](https://faculty.ustc.edu.cn/niuweixing/zh_CN/lwcg/64044/content/20729.htm)
  (An Inquiry into the Astronomical Meaning of Rahu and Ketu), *Acta
  Astronomica Sinica* 天文学报, Vol. 35 No. 3, 1994, pp. 326–332. English
  version in *Chinese Astronomy and Astrophysics*, 1995, 19(2). Research
  identifying 計都 with the osculating lunar apogee, tracing the evolution of
  the concept through Chinese astronomical texts.

- Yabuuchi Kiyoshi 薮内清, [*Zōtei Zui-Tō rekihō-shi no kenkyū*](https://ci.nii.ac.jp/ncid/BB26841838)
  (増訂 隋唐暦法史の研究, Rinsen Shoten, 1989) — Research on Sui–Tang
  calendrical history, including analysis of the Indian–Chinese astronomical
  transmission. See also the [biographical article](https://www.academia.edu/9268531/Yabuuchi_Kiyoshi_His_life_Works_and_Significant_Contributions_to_the_Chinese_History_of_Science_and_Technology)
  on his contributions.

- Ho Peng Yoke, [*Chinese Mathematical Astrology: Reaching Out to the Stars*](https://www.routledge.com/Chinese-Mathematical-Astrology-Reaching-Out-to-the-Stars/Yoke/p/book/9780415863100)
  (RoutledgeCurzon, 2003; Needham Research Institute Series) — Comprehensive
  treatment of Chinese astrology's mathematical foundations, including the
  Seven Governors system and Indian transmission. [Review in *East Asian
  Science, Technology, and Medicine*](https://brill.com/view/journals/east/23/1/article-p134_8.xml?language=en).

- Pan Nai 潘鼐, [*Zhongguo Hengxing Guance Shi*](https://books.google.com/books/about/%E4%B8%AD%E5%9B%BD%E6%81%92%E6%98%9F%E8%A7%82%E6%B5%8B%E5%8F%B2.html?id=RQDr888FHoEC)
  (中國恆星觀測史, History of Fixed Star Observation in China; Xuelin Press,
  2009 revised ed., ISBN 9787807306948) — Reference for determinative star
  identifications and the 28-mansion system.

- Sun Xiaochun & Jacob Kistemaker, [*The Chinese Sky During the Han:
  Constellating Stars and Society*](https://www.worldcat.org/title/chinese-sky-during-the-han-constellating-stars-and-society/oclc/185938073)
  (Brill, 1997; Sinica Leidensia vol. 38, ISBN 9789004107373) —
  Determinative star positions and mansion boundary reconstruction.
  [Academia.edu review](https://www.academia.edu/38558071/).

### Astronomical references

- Jean Meeus, [*Astronomical Algorithms*](https://worldcat.org/oclc/40521322)
  (2nd ed., Willmann-Bell, 1998; ISBN 978-0943396613) — Source for the mean
  ascending node polynomial (Ch. 22), mean obliquity (Ch. 22), GMST (Ch. 12),
  and Delaunay arguments. [Online algorithm implementations](http://www.micmap.org/astronomical-algorithms/).

- Bretagnon, P. & Francou, G., ["Planetary Theories in Rectangular and
  Spherical Variables: VSOP87 Solution"](https://ui.adsabs.harvard.edu/abs/1988A&A...202..309B/abstract),
  *Astronomy and Astrophysics*, 202, 309–315, 1988. Full planetary theory
  used for the seven governors' tropical positions.
  [Full text (ADS)](https://adsabs.harvard.edu/full/1988A&A...202..309B).

- Park, R. S. et al., ["The JPL Planetary and Lunar Ephemerides DE440 and
  DE441"](https://doi.org/10.3847/1538-3881/abd414), *The Astronomical
  Journal*, 161:105, 2021. Numerical integration ephemeris used as ground
  truth for planetary position validation.
  [PDF (JPL)](https://ssd.jpl.nasa.gov/doc/Park.2021.AJ.DE440.pdf).

- ESA, [*The Hipparcos and Tycho Catalogues*](https://www.cosmos.esa.int/web/hipparcos/catalogues)
  (ESA SP-1200, 1997) — Source for determinative star positions used in
  mansion boundary data. Searchable online via
  [NASA HEASARC](https://heasarc.gsfc.nasa.gov/w3browse/all/hipparcos.html)
  and [VizieR](https://ui.adsabs.harvard.edu/abs/1997yCat.1239....0E/abstract).
