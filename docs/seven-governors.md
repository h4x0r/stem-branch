---
title: "七政四餘 Seven Governors — Chinese Sidereal Astrology"
description: "Chinese sidereal astrology (七政四餘) computing 7 planetary positions + 4 lunar points across 28 mansions and 12 palaces. Astronomical models, historical context from 果老星宗 to the Qing Calendar Case, and the Rahu/Ketu identity problem."
head:
  - - meta
    - name: keywords
      content: "七政四餘, Seven Governors, Chinese astrology, 果老星宗, sidereal, lunar mansions, 二十八宿, 計都, 羅睺, 紫氣, 月孛, Four Remainders, 四餘"
---

# Seven Governors Four Remainders (七政四餘)

**See also:** [Da Liu Ren (大六壬)](da-liu-ren) · [Mystery Gates (奇門遁甲)](mystery-gates) · [Purple Star Astrology (紫微斗數)](zi-wei)

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

### Anchoring to Spica

This library anchors 0° sidereal to Spica (α Virginis), the determinative
star of 角宿 (Horn mansion), at its J2000.0 tropical ecliptic longitude of
201.2983°. Three sidereal modes are available:

| Mode | Method | Use case |
|------|--------|----------|
| Modern (default) | IAU precession model applied dynamically | Modern astronomical accuracy |
| Classical | Fixed ayanamsa from a historical epoch (開元 724 CE or 崇禎 1628 CE) | Reproducing historical charts |
| User-supplied | Custom fixed ayanamsa value | Interoperability with other systems |

The modern mode ensures consistency with the VSOP87D[^vsop87] planetary
positions used throughout the library.

---

## 2. The Seven Governors (七政)

The seven governors are the classical visible planets. Their tropical ecliptic
longitudes come from the library's existing planetary engine:

| Body | Algorithm |
|------|-----------|
| Sun (太陽) | VSOP87D (2,425 terms) + DE441 correction polynomial |
| Moon (太陰) | Meeus[^meeus] Ch. 47 (ELP-based, 60+ periodic terms) |
| Mercury (水星) | VSOP87D with aberration correction |
| Venus (金星) | VSOP87D with aberration correction |
| Mars (火星) | VSOP87D with aberration correction |
| Jupiter (木星) | VSOP87D with aberration correction |
| Saturn (土星) | VSOP87D with aberration correction |

These produce geocentric apparent tropical ecliptic longitudes, which are then
converted to sidereal via the ayanamsa described above.

Accuracy against JPL DE441[^de441] (primary reference):
- Inner planets (Mercury, Venus): mean ~1–2", max ~6"
- Outer planets (Mars–Saturn): mean ~11–14", max ~23–29"

See [docs/accuracy.md](accuracy.md) for the full validation methodology and
residual statistics.

---

## 3. The Four Remainders (四餘)

The four remainders are non-planetary points derived from lunar orbital
mechanics (three of them) and a classical formula (one).

### 3.1 Rahu (羅睺) — Moon's mean ascending node

The Moon's orbit is tilted ~5.15° to the ecliptic. The **ascending node** is
where the Moon crosses the ecliptic going northward. This point regresses
(moves retrograde) through the ecliptic with a period of ~18.61 years.

**Formula** (Meeus[^meeus] Ch. 22, mean ascending node):

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
mature Chinese 七政四餘 system (as codified in 《果老星宗》[^guolao]), 計都 is
identified with the **osculating lunar apogee** — not the descending node
as in the original Indian system. See [§7: Historical Controversies](#7-historical-controversies) for the full
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

The mode is selectable when computing a chart.

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
celestial phenomenon. Its status has been contested since at least the
17th century (see [§7.2: The Schall reforms](#72-the-schall-reforms-紫氣-deletion-and-計都-reversion)).

**Formula:**

```
Purple_Qi_longitude = EPOCH_LON + (days_since_J2000 × 360° / 10195.5)
```

The period of 10195.5 days ≈ 27.9 years produces prograde motion completing
one full circuit in approximately 28 years.

**Historical source:**

The Yuan dynasty text 《革象新書》[^gexiang] (Ge Xiang Xin Shu) by Zhao Youqin
(趙友欽, 1271–c. 1335) states:

> 夫紫氣者，起於閏法，約二十八年而周天

"Purple Qi arises from the intercalary method, completing one circuit of
heaven in approximately 28 years."

The phrase 起於閏法 ("arises from the intercalary method") directly links 紫氣
to the lunisolar calendar's leap-month system. Kotyk (2018, pp. 52–55)[^kotyk2018]
demonstrates that the ~28-year period tracks intercalary months: the Chinese
calendar inserts 7 leap months every 19 years (the Metonic cycle), and 紫氣
effectively indexes the accumulated intercalary drift along the ecliptic.
Kotyk further argues that 紫氣 and 月孛 both originated from foreign (likely
Indo-Iranian) sources rather than being indigenous Chinese innovations.

**Candidate astronomical associations (unconfirmed):**

The numerical proximity of the ~28-year period to Saturn's sidereal period
(~29.46 years) has been noted informally, but no published study has
established this as the origin. No specific scholarly attribution exists for
a Jupiter–Saturn synodic resonance hypothesis either. The only published
derivation is the intercalary-month connection described by Zhao Youqin and
analyzed by Kotyk (2018)[^kotyk2018].

The current implementation uses the classical linear formula with a
provisional epoch longitude of 0°, pending sourcing from 《果老星宗》[^guolao].

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

The mansion boundaries are sourced from J2000.0 ecliptic longitudes of the
Hipparcos[^hipparcos] catalogue determinative stars, converted to the
Spica-anchored sidereal frame.

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

## 5. Ascendant (命宮)

The ascendant is the ecliptic degree rising above the eastern horizon at
the moment of birth. It determines which palace is designated 命宮 (Fate
Palace), anchoring the entire chart.

**Formula** (standard astronomical):

```
ASC = atan2(−cos(LST), sin(LST) × cos(ε) + tan(φ) × sin(ε))
```

where:
- LST = local sidereal time in degrees (GMST + observer longitude)
- ε = mean obliquity of the ecliptic (~23.44°, computed from Meeus[^meeus] Ch. 22)
- φ = observer geographic latitude

GMST is computed from the Meeus Ch. 12 polynomial in Julian centuries.

---

## 6. Interpretive Layers

### Dignity (廟旺平陷)

Each body has a dignity level in each palace, indicating whether it is
well-placed or poorly-placed:

| Dignity | Meaning |
|---------|---------|
| 廟 (Temple) | Strongest — body is in its home palace |
| 旺 (Exalted) | Strong — body is exalted |
| 平 (Neutral) | Neither strong nor weak |
| 陷 (Fallen) | Weakest — body is debilitated |

The dignity table is sourced from 《果老星宗》[^guolao]. Currently only Sun
and Moon have non-placeholder values; the remaining 9 bodies default to 平
pending full data sourcing from classical texts.

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

The current implementation includes 3 rules from 《果老星宗》[^guolao]. The
traditional system includes approximately 40–80 additional rules which are
tracked for future implementation.

---

## 7. Historical Controversies

These are not merely academic questions — they directly affect which
celestial positions your software computes and whether those positions match
the system's classical foundations. Most modern charting software, including
MOIRA and tools based on the Cai Boli 蔡伯勵 almanac tradition, follows
Qing-era conventions that diverge from the mature Chinese system as codified
in 《果老星宗》[^guolao]. Understanding these divergences is essential for
any implementation that aims to be historically informed.

### 7.1 The Indian originals and the Chinese transformation

One of the most studied questions in the history of Sino-Indian astronomical
transmission: did the astronomical identities of Rahu and Ketu get swapped
when translated into Chinese?

**The Indian originals.** In Jyotish (Indian astrology), Rahu and Ketu are
both **lunar nodes**:

| Sanskrit | Identity | Metaphor |
|----------|----------|----------|
| **Rahu** (राहु) | Ascending node | Dragon's head |
| **Ketu** (केतु) | Descending node | Dragon's tail |

They are shadow planets (chāyā graha) that cause eclipses. They are always
180° apart — knowing one gives the other trivially.

**The Chinese reception.** The transmission came primarily through the
*Jiuzhi li* (九執曆), translated by [Gautama Siddha](https://en.wikipedia.org/wiki/Gautama_Siddha)
(瞿曇悉達) in 718 CE from Indian astronomical sources and preserved as
fascicle 104 of the 《開元占經》[^kaiyuan] (compiled 714–724 CE). On the
Jiuzhi li as the primary vector for Indian astronomical concepts entering
China, see Yabuuchi (1979)[^yabuuchi1979] and Niu (2023)[^brill2023].

In the received Chinese system:

- **羅睺** retained the identity of the ascending node — no scholarly
  controversy on this point
- **計都** diverged from the descending node

By the time the mature 七政四餘 system was codified in 《果老星宗》[^guolao]
(attributed to Zhang Guolao 張果老; earliest known edition Ming dynasty, 1593),
計都 was identified with the **lunar apogee**, not the descending node. This
is astronomically a completely different point — the apogee lies on the
Moon's apsidal line, not its nodal line.

**Why did this happen?** Several hypotheses appear in the literature:

**1. Redundancy elimination (pragmatic)**

The descending node is just the ascending node + 180° — it carries zero
independent astronomical information. Chinese astronomers may have found it
more useful to repurpose the "slot" for the apsidal point, which provides
genuinely new positional data. Yabuuchi (1989)[^yabuuchi1989] noted this
pragmatic motivation in his research on Sui–Tang calendrical history.

**2. Source text ambiguity**

Some Indian texts describe Ketu not purely as a node but with apogee-like
characteristics. The Sanskrit term *ketu* itself means "bright appearance" or
"comet" — its astronomical identity was not always fixed even within Indian
traditions. Mak (2014)[^mak2014] traces how the pseudo-planet identities
evolved across Chinese sources from the 2nd to 11th century CE, documenting
the gradual divergence from Indian originals.

**3. Gradual transmission drift**

The 九執曆 passed through multiple layers of translation (Sanskrit → possibly
Sogdian or Persian intermediaries → Chinese). Niu Weixing (钮卫星,
1994)[^niu1994] traced how the identification shifted across successive
Chinese astronomical texts and argued the conflation was gradual rather than
a single mistranslation event.

**4. Active adaptation**

Kotyk (2018, pp. 45–60)[^kotyk2018] argues Chinese astronomers were not
passively receiving Indian astronomy — they actively adapted it to fit their
own cosmological framework. The Four Remainders needed to be four *distinct*
points providing independent information, and having two that are always 180°
apart was cosmologically unsatisfying. This view aligns with Niu Weixing's
analysis of how the identification evolved purposefully rather than through
error.

**The 月孛 complication.** If 計都 took over the apogee role, what is 月孛?
Niu Weixing's[^niu1994] resolution, which this implementation follows:

- **計都** = osculating (true) apogee — perturbed, oscillates ±10–30°
- **月孛** = mean apogee — smooth, averaged apsidal line

The Chinese system ended up with a *finer* distinction than the Indian one:
two separate measures of the Moon's apsidal geometry (osculating vs. mean),
rather than two redundant node points. Whether this was intentional
astronomical insight or a fortunate accident of transmission is debated.

### 7.2 The Schall reforms: 紫氣 deletion and 計都 reversion

When the Jesuit astronomer [Johann Adam Schall von Bell](https://en.wikipedia.org/wiki/Johann_Adam_Schall_von_Bell)
(湯若望, 1592–1666) reformed the Chinese calendar as the 時憲曆 (Shixian
Calendar, 1645), he made two consequential changes to the Four Remainders.
Liu (2020, pp. 118–121)[^liu2020] provides a detailed account of these
reforms.

**The deletion of 紫氣.** Schall eliminated 紫氣 from the Four Remainders
on the grounds that it had no observable astronomical counterpart. He retained
羅睺, 計都, and 月孛, which correspond to real lunar orbital points.

**The reassignment of 計都.** Schall also **reassigned 計都 back to a lunar
node**, aligning the Chinese names with the Indian/European convention:
羅睺 = ascending node, 計都 = descending node.[^liu2020] Schall, trained in
European astronomy where the Rahu/Ketu node identification was standard
(via Arabic/Persian transmission from India), apparently treated the Chinese
apogee identification as an error to be corrected. But his "correction" had
two problems:

1. **It reverted to a superseded identification.** By the Ming dynasty,
   計都 = apogee had been standard for over 800 years. Schall restored a
   Tang-era or Indian interpretation that Chinese astronomers had deliberately
   moved beyond.

2. **It broke the five-element correspondences.** In the Chinese 七政四餘
   system, 羅睺 is classified as 火餘 (fire surplus) and 計都 as 土餘
   (earth surplus). In Indian Jyotish, Rahu's nature aligns with Saturn/earth
   and Ketu's with Mars/fire. Schall's reassignment aligned the *names* with
   India but **reversed the elemental attributions**, creating an internally
   inconsistent system.

**The Calendar Case.** In 1664, [Yang Guangxian](https://en.wikipedia.org/wiki/Yang_Guangxian)
(楊光先) filed formal charges against Schall, making the deletion of 紫氣
one of the central accusations. The deliberating council's verdict held:

> 四餘刪去紫炁……事犯重大

"The deletion of Purple Qi from the Four Surplus constitutes a grave
offense."

Yang's argument, preserved in his 《不得已》[^budeyi] (Bu De Yi), was
philosophically acute: if 紫氣 is rejected for lacking physical substance
(無體), then the other three 四餘 — also "shadow" bodies invisible to the
naked eye — should be rejected on the same principle. Either keep all four
or delete all four; selective removal is inconsistent.

Schall was sentenced to death. The sentence was commuted after the
[Beijing earthquake of 1665](https://en.wikipedia.org/wiki/1665_Tong_County_earthquake),
interpreted as a sign of Heaven's disapproval. The 時憲曆 was temporarily
abolished (1665–1669) and the 大統曆 restored. After the Kangxi Emperor
took personal power, [Ferdinand Verbiest](https://en.wikipedia.org/wiki/Ferdinand_Verbiest)
(南懷仁) defeated Yang in public astronomical prediction contests, the
時憲曆 was reinstated, and Schall was posthumously rehabilitated
(Jami 2015[^jami2015]; Chu 1997[^chu1997]).

Verbiest initially attempted to substitute Western "natural astrology" for
Chinese mantic techniques, but was eventually forced to fully restore
Chinese astrological annotations — including 紫氣 — in the calendar
(Chu 2018, ch. 15[^chu2018]).

This episode demonstrates that 紫氣's lack of an astronomical referent was
recognized and contested *within* the Chinese astronomical tradition, not
only by modern scholars. The point survived not because its astronomical
basis was vindicated, but because the 四餘 system was understood as a
coherent cosmological unit that could not be selectively dismembered.

**Legacy: the Qing convention.** After the Calendar Case and Schall's
posthumous rehabilitation, Verbiest retained the Schall convention for 計都
in the restored 時憲曆. The Qing convention subsequently became the standard
for official almanacs, most influentially the 《七政經緯曆書》 compiled by
the Zhenbutang 真步堂 tradition (first published 1891) and continued by the
Hong Kong feng shui master Cai Boli 蔡伯勵 (1922–2018). Because Cai Boli's
almanac is the most widely used 七政四餘 reference in Hong Kong and
Southeast Asia, the Qing convention dominates modern practice in those
regions.

**The 計北羅南 vs. 計南羅北 debate.** Practitioners sometimes debate whether
計都 is the "north node" (ascending) or "south node" (descending): 計北羅南
vs. 計南羅北.

This debate is itself evidence of confusion. It only makes sense if 計都 is
understood as a lunar node. In the 《果老星宗》 system, 計都 is the lunar
apogee — it lies on the Moon's apsidal line, not its nodal line, and has a
completely different orbital period from 羅睺. The question "is 計都 the
north node or the south node?" is as nonsensical as asking "is the Moon's
apogee the ascending node or the descending node?" They are different
geometric features of the lunar orbit.

The pre-Qing convention (計北羅南, documented by Shen Kuo 沈括 in the
《夢溪筆談》, 1088) and the Qing convention (計南羅北, from Schall) both
treat 計都 as a node — they disagree only about *which* node. Both
diverge from the 《果老星宗》 apogee identification. The scholarly
consensus (Niu 1994[^niu1994]; Mak 2014[^mak2014]; Kotyk 2018[^kotyk2018])
is that the apogee identification is correct for the mature Chinese system,
and the node-based framing is a regression.

### 7.3 The evidence: 七曜攘災訣 ephemeris (806 CE)

How do we know 計都 became the apogee and not just a swapped node? The
earliest Chinese text containing actual positional tables for 計都 is the
*Qiyao rangzai jue* 七曜攘災訣 ("Formulae for Averting Disasters [Caused by]
the Seven Luminaries"), a Buddhist astrological work compiled after 806 CE
and preserved in the Japanese *Sukuyōdō* 宿曜道 tradition. The text gives
ephemerides for 羅睺 spanning 93 years and for 計都 spanning 62 years, with
epoch year 元和 1 (806 CE).[^mak2024]

Niu Weixing's landmark analysis[^niu1994] showed that the 62-year 計都
ephemeris matches the **lunar apsidal precession cycle** (~8.85 years per
revolution, with 62 years ≈ 7 complete apsidal cycles). The descending node,
by contrast, has the same ~18.6-year period as the ascending node — a
62-year ephemeris spanning ~3.3 nodal cycles would produce completely
different positional data from what the text gives. The periods are
irreconcilable: **this is not a naming swap but a different astronomical
body entirely.**

Niu further traced the evolution in a follow-up study[^niu2010], showing
how 計都's identity shifted from node to apogee between 718 and 806 CE,
likely through the mediation of Persian astronomical intermediaries. By
the Song dynasty the apogee identification was standard, and the mature
四餘 system crystallized:

| Body | Identity | Period | Astronomical independence |
|------|----------|--------|--------------------------|
| 羅睺 | Ascending node | ~18.6 years | Unique orbital point |
| 計都 | Osculating apogee | ~8.85 years | Unique orbital point |
| 月孛 | Mean apogee | ~8.85 years | Smoothed version of 計都 |
| 紫氣 | Intercalary-tracking point | ~28 years | Fictitious |

In this system, **計都 is not 180° from 羅睺**. They have entirely different
orbital periods and are astronomically independent.

### 7.4 Impact on modern software

Most 七政四餘 charting software — including the widely-used
[MOIRA](https://github.com/BahnAstro/MOIRA_chinese_astrology)
(At Home Projects, 2004–2015) — follows the Qing convention, treating both
計都 and 羅睺 as lunar nodes always 180° apart. This propagation occurs
because:

1. **The Cai Boli 蔡伯勵 almanac is the most accessible reference.** The
   《七政經緯曆書》 follows Qing conventions and is what most Hong Kong
   and Southeast Asian practitioners consult. Developers build from this.

2. **Node-based computation is simpler.** Two nodes 180° apart require
   only one ephemeris call plus an offset. Separate node and apogee
   computations require two independent calculations with different
   orbital models.

3. **The scholarly literature is inaccessible to developers.** Niu
   Weixing's 1994 paper was published in Chinese in *Acta Astronomica
   Sinica* with an English translation in *Chinese Astronomy and
   Astrophysics* — neither is on a software developer's reading list.

4. **The 計北羅南/計南羅北 toggle creates a false sense of completeness.**
   By offering a toggle between two node-based conventions, software
   appears to address the historical controversy while missing the
   deeper issue: that 計都 should not be a node at all in the
   《果老星宗》 system.

In MOIRA specifically, the code maps 計都 to the Swiss Ephemeris
`SE_TRUE_NODE` (the true lunar ascending node) and 月孛 to `SE_MEAN_APOG`
(the mean lunar apogee). This means MOIRA's 月孛 is actually computing
the position that *should be* 計都 in the 《果老星宗》 system, while its
計都 computes a descending-node position that the mature Chinese tradition
had deliberately abandoned.

### 7.5 Chronological summary

| Period | 計都 identification | Authority |
|--------|---------------------|-----------|
| Pre-718 CE | Descending lunar node | Indian *Siddhānta* tradition |
| 718 CE | Initially descending node | 九執曆 (Gautama Siddha) |
| 806 CE | **Lunar apogee** (shift documented) | 七曜攘災訣; proven by Niu (1994)[^niu1994] |
| Song dynasty | Apogee (canonical) | 《果老星宗》[^guolao]; Shen Kuo treated as node (minority view) |
| Ming dynasty | **Apogee** (standard) | 《星學大成》; 《果老星宗》[^guolao] |
| 1645 | **Descending node** (Qing reversion) | 時憲曆 (Schall von Bell); Liu (2020)[^liu2020] |
| Modern software | Descending node (following Qing) | Cai Boli 蔡伯勵 《七政經緯曆書》 tradition |
| Scholarly consensus | **Apogee** | Niu (1994)[^niu1994]; Mak (2014)[^mak2014]; Kotyk (2018)[^kotyk2018] |

### 7.6 Which convention does this library follow?

By default, this library follows the Chinese 七政四餘 convention per
《果老星宗》[^guolao] and Niu Weixing (1994)[^niu1994]: 計都 as the
osculating lunar apogee. The original Indian Jyotish convention (Ketu as
the descending node) is available as an alternative. See the
[API reference](api/seven-governors) for configuration details.

### 7.7 Is 紫氣 a Jyotish problem?

No. 紫氣 (Purple Qi) is unique to the Chinese 七政四餘 system and has no
counterpart in Indian Jyotish. The Indian system has exactly two shadow
planets (Rahu and Ketu); the Chinese system expanded this to four by adding
月孛 and 紫氣. Kotyk (2018)[^kotyk2018] argues both 月孛 and 紫氣 originated
from foreign (Indo-Iranian) sources rather than being indigenous Chinese
innovations, though the ~28-year period derives from the Chinese lunisolar
intercalary method rather than any Indian astronomical concept.

---

## 8. Open Questions

Several parameters remain uncertain pending further textual research,
primarily in 《果老星宗》[^guolao]:

| Question | Current state | Significance |
|----------|--------------|--------------|
| Mansion boundaries | Derived from Hipparcos[^hipparcos] J2000.0 star positions | Historical boundaries may differ by 1–2° from modern stellar positions |
| Palace starting point (辰宮 at 0°) | Assumed convention | Could shift all palace assignments if a different starting point is attested |
| Purple Qi epoch longitude | Unknown — provisionally set to 0° | Would produce a constant offset on all 紫氣 positions |
| Dignity assignments for 9 bodies | Only Sun and Moon attested so far | The remaining bodies (Mercury through 紫氣) lack sourced dignity tables |
| Star spirit rules (~50–80 total) | Only 3 rules identified so far | The full traditional repertoire requires systematic extraction from classical texts |

---

[^guolao]: **《果老星宗》** — Standard reference for 七政四餘, attributed to Zhang Guolao (張果老), one of the Eight Daoist Immortals. The *Siku Quanshu Zongmu Tiyao* expressed skepticism about this Tang-dynasty attribution; Yabuuchi Kiyoshi argued some astronomical content may preserve Tang-era material based on star chart analysis, but the known published edition dates to 1593 (Ming dynasty, Lu Wei's 陸位 recension). Primary source for dignity tables, star spirit rules, and chart interpretation. [Full scanned volumes on Internet Archive](https://archive.org/details/guolaoxingzong).

[^gexiang]: **《革象新書》** (Ge Xiang Xin Shu) by Zhao Youqin (趙友欽, 1271–c. 1335, Yuan dynasty) — Contains the key passage on Purple Qi: "夫紫氣者，起於閏法，約二十八年而周天". [Full text on Chinese Text Project](https://ctext.org/wiki.pl?if=gb&res=1474554). See also: [Zhao Youqin biography (Wikipedia)](https://en.wikipedia.org/wiki/Zhao_Youqin); [MacTutor biography](https://mathshistory.st-andrews.ac.uk/Biographies/Zhao_Youqin/).

[^kaiyuan]: **《開元占經》** (Kaiyuan Zhanjing) — Tang dynasty compilation (714–724 CE) by [Gautama Siddha](https://en.wikipedia.org/wiki/Gautama_Siddha) (瞿曇悉達), containing the 《九執曆》 (Jiuzhi li) in vol. 104 — the primary vector for Indian astronomical concepts entering China. [Full text on Chinese Text Project](https://ctext.org/datawiki.pl?if=en&res=252606).

[^budeyi]: **Yang Guangxian 楊光先, 《不得已》** (Bu De Yi, c. 1664) — Primary source for the charges against Schall von Bell, including the argument that 紫氣 cannot be selectively deleted from the 四餘. [Full text on Chinese Text Project](https://ctext.org/datawiki.pl?if=en&res=416720); also at [Wikisource](https://zh.wikisource.org/wiki/%E4%B8%8D%E5%BE%97%E5%B7%B2/%E4%B8%8A%E5%8D%B7).

[^niu1994]: **Niu Weixing 钮卫星**, "罗睺、计都天文学含义考源" (An Inquiry into the Astronomical Meaning of Rahu and Ketu), *Acta Astronomica Sinica* 天文学报, Vol. 35 No. 3, 1994, pp. 326–332. English version: "An investigation into the astronomical meaning of Luohou and Jidu", *Chinese Astronomy and Astrophysics* 19(2), 1995. Research identifying 計都 with the osculating lunar apogee, tracing the evolution of the concept through Chinese astronomical texts. [DOI: 10.1016/0275-1062(95)00033-O](https://doi.org/10.1016/0275-1062(95)00033-O); [ADS](https://ui.adsabs.harvard.edu/abs/1995ChA&A..19..259N/abstract); [USTC faculty page](https://faculty.ustc.edu.cn/niuweixing/zh_CN/lwcg/64044/content/20729.htm).

[^yabuuchi1989]: **Yabuuchi Kiyoshi 薮内清**, *Zōtei Zui-Tō rekihō-shi no kenkyū* (増訂 隋唐暦法史の研究, Rinsen Shoten, 1989) — Research on Sui–Tang calendrical history, including analysis of the Indian–Chinese astronomical transmission and the pragmatic motivations for the Ketu identity shift. [CiNii](https://ci.nii.ac.jp/ncid/BB26841838); [biographical article](https://www.academia.edu/9268531/Yabuuchi_Kiyoshi_His_life_Works_and_Significant_Contributions_to_the_Chinese_History_of_Science_and_Technology).

[^yabuuchi1979]: **Yabuuchi Kiyoshi 薮内清**, "Researches on the Chiu-chih li," *Acta Asiatica* 36, 1979, pp. 7–48 — On the 九執曆 as the primary vector for Indian astronomical transmission into China. [CiNii](https://ci.nii.ac.jp/naid/40001001194/).

[^kotyk2018]: **Jeffrey Kotyk**, "The Sinicization of Indo-Iranian Astrology in Medieval China," *Sino-Platonic Papers* 282, 2018, pp. 1–95. Argues 紫氣 and 月孛 originated from foreign (Indo-Iranian) sources; provides the most detailed published analysis of 紫氣's intercalary-month derivation and its ecliptic computation (pp. 52–55). [Free PDF](https://sino-platonic.org/complete/spp282_Indo-Iranian_Astrology_China.pdf).

[^mak2014]: **Bill Mak**, "The History of Pseudo-planets in China (I): from 2nd to 11th century CE," 2014. Also in: *Foreign Astral Sciences in China* (Routledge, 2019; ISBN 978-1138477599). Traces the evolution of pseudo-planet identities (including 四餘) across Chinese sources, documenting the gradual divergence from Indian originals. [Academia.edu](https://www.academia.edu/2763447/); [Routledge](https://www.routledge.com/Foreign-Astral-Sciences-in-China/Mak/p/book/9781138477599).

[^liu2020]: **Liyuan Liu**, "When Missionary Astronomy Encountered Chinese Astrology: Johann Adam Schall von Bell and Chinese Calendar Reform in the Seventeenth Century," *Physics in Perspective* 22(2), 2020, pp. 110–126. Detailed account of Schall's deletion of 紫氣 from the 時憲曆 and the resulting Calendar Case. [Springer](https://link.springer.com/article/10.1007/s00016-020-00255-z).

[^jami2015]: **Catherine Jami**, "Revisiting the Calendar Case (1664–1669): Science, Religion, and Politics in Early Qing Beijing," *Korean Journal of History of Science* 27(2), 2015, pp. 459–477. [Open access PDF](https://shs.hal.science/halshs-01222267/document).

[^chu1997]: **Chu Pingyi 祝平一**, "Scientific Dispute in the Imperial Court: The 1664 Calendar Case," *Chinese Science* 14, 1997, pp. 7–34. Primary study of the 曆獄 proceedings.

[^chu2018]: **Chu Pingyi 祝平一**, "Against Prognostication: Ferdinand Verbiest's Criticisms of Chinese Mantic Arts," ch. 15 in Michael Lackner (ed.), *Coping with the Future: Theories and Practices of Divination in East Asia* (Brill, 2018; Sinica Leidensia 138; ISBN 978-90-04-34653-6). On Verbiest's failed attempt to replace Chinese astrological annotations with Western natural astrology. [Brill](https://brill.com/view/title/34845).

[^brill2023]: "An 8th-Century CE Indian Astronomical Treatise in Chinese," in *Plurilingualism in Traditional Eurasian Scholarship* (Brill, 2023). On the Jiuzhi li as the primary vector for Indian astronomical concepts entering China. [Brill](https://brill.com/display/book/9789004527256/BP000030.xml).

[^hopeng]: **Ho Peng Yoke**, *Chinese Mathematical Astrology: Reaching Out to the Stars* (RoutledgeCurzon, 2003; Needham Research Institute Series) — Covers the three cosmic-board divination systems (三式: 太乙, 奇門遁甲, 六壬) and their mathematical structures. General background on Chinese astrology and Indian transmission. [Routledge](https://www.routledge.com/Chinese-Mathematical-Astrology-Reaching-Out-to-the-Stars/Yoke/p/book/9780415863100); [Review in *EASTM*](https://brill.com/view/journals/east/23/1/article-p134_8.xml?language=en).

[^pannai]: **Pan Nai 潘鼐**, *Zhongguo Hengxing Guance Shi* (中國恆星觀測史, History of Fixed Star Observation in China; Xuelin Press, 2009 revised ed., ISBN 9787807306948) — Reference for determinative star identifications and the 28-mansion system. [Google Books](https://books.google.com/books/about/%E4%B8%AD%E5%9B%BD%E6%81%92%E6%98%9F%E8%A7%82%E6%B5%8B%E5%8F%B2.html?id=RQDr888FHoEC).

[^sunkim]: **Sun Xiaochun & Jacob Kistemaker**, *The Chinese Sky During the Han: Constellating Stars and Society* (Brill, 1997; Sinica Leidensia vol. 38, ISBN 9789004107373) — Determinative star positions and mansion boundary reconstruction. [WorldCat](https://www.worldcat.org/title/chinese-sky-during-the-han-constellating-stars-and-society/oclc/185938073); [Academia.edu review](https://www.academia.edu/38558071/).

[^meeus]: **Jean Meeus**, *Astronomical Algorithms* (2nd ed., Willmann-Bell, 1998; ISBN 978-0943396613) — Source for the mean ascending node polynomial (Ch. 22), mean obliquity (Ch. 22), GMST (Ch. 12), and Delaunay arguments. [WorldCat](https://worldcat.org/oclc/40521322); [algorithm implementations](http://www.micmap.org/astronomical-algorithms/).

[^vsop87]: **Bretagnon, P. & Francou, G.**, "Planetary Theories in Rectangular and Spherical Variables: VSOP87 Solution," *Astronomy and Astrophysics*, 202, 309–315, 1988. Full planetary theory used for the seven governors' tropical positions. [ADS abstract](https://ui.adsabs.harvard.edu/abs/1988A&A...202..309B/abstract); [full text](https://adsabs.harvard.edu/full/1988A&A...202..309B).

[^de441]: **Park, R. S. et al.**, "The JPL Planetary and Lunar Ephemerides DE440 and DE441," *The Astronomical Journal*, 161:105, 2021. Numerical integration ephemeris used as primary reference for planetary position validation. [DOI: 10.3847/1538-3881/abd414](https://doi.org/10.3847/1538-3881/abd414); [PDF (JPL)](https://ssd.jpl.nasa.gov/doc/Park.2021.AJ.DE440.pdf).

[^hipparcos]: **ESA**, *The Hipparcos and Tycho Catalogues* (ESA SP-1200, 1997) — Source for determinative star positions used in mansion boundary data. [ESA catalogue page](https://www.cosmos.esa.int/web/hipparcos/catalogues); [NASA HEASARC](https://heasarc.gsfc.nasa.gov/w3browse/all/hipparcos.html); [VizieR](https://ui.adsabs.harvard.edu/abs/1997yCat.1239....0E/abstract).

[^niu2010]: **Niu Weixing 钮卫星**, "从'罗、计'到'四余'：外来天文概念汉化之一例" (From Rahu and Ketu to Four Invisible Bodies: An Example of the Sinicization of Foreign Astronomical Terminology), *Journal of Shanghai Jiao Tong University (Philosophy and Social Sciences Edition)* 18(6), 2010, pp. 48–57. Follow-up study tracing how 計都's identity shifted from node to apogee between 718 and 806 CE. [Author profile (SJTU)](https://sjtu.academia.edu/weixingniu).

[^mak2024]: **Bill M. Mak**, "Persian Astronomy in China," *Journal of Indian Philosophy* 52(4), 2024. On the 七曜攘災訣 and the Persian intermediaries in the transmission of Indian astronomical concepts to China. [DOI: 10.1177/09719458241247636](https://doi.org/10.1177/09719458241247636).
