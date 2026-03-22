# Accuracy Review Report

**Paper:** "Why Your Chinese Metaphysics App Gives Wrong Results"
**File:** `/Users/4n6h4x0r/src/stem-branch/docs/research/why-your-chinese-metaphysics-app-gives-wrong-results.tex`
**Date of review:** 2026-03-23

---

## 1. CRITICAL ISSUES (Factually Wrong or Seriously Misleading)

### 1.1 Yi Xing birth year disputed (line 1464)

The paper states Yi Xing's dates as 683--727. While 683 is the traditional birth year, recent scholarship (Chen 2000; Kotyk 2022) argues convincingly that 673 is the correct birth year. The MDPI *Religions* article is titled "The Astronomical Innovations of Monk Yixing 一行 (673--727)". Wikipedia and older sources still use 683. **Recommendation:** Add a footnote acknowledging the 673 vs. 683 dispute, or use "c. 673/683--727".

### 1.2 Yanbo Diaosou Fu attribution to Zhao Pu is problematic (line 767, line 2303)

The paper attributes the Yanbo Diaosou Fu to Zhao Pu (趙普) and labels the attribution "traditionally Tang dynasty" in the bibliography (line 2303: `date uncertain (traditionally Tang dynasty)`). This contains two errors:
- **Zhao Pu (922--992) was a Song dynasty chancellor**, not Tang dynasty. The bibliography's parenthetical "(traditionally Tang dynasty)" is wrong.
- Chinese scholars consider the attribution to Zhao Pu as "purely fictitious" (纯属子虚乌有). The text likely originated in the Northern Song or Yuan period and was finalized by Luo Tong of the Ming dynasty.

**Fix:** Change bibliography entry to: "date uncertain (traditionally Song dynasty, attribution to Zhao Pu disputed; finalized by Luo Tong, Ming dynasty)."

### 1.3 Kangxi Calendar Case terminology is misleading (line 1139)

The paper calls it the "Kangxi Calendar Case (康熙曆獄)" but the events of 1664 occurred under the Shunzhi Emperor's regents (the Oboi regency), not under Kangxi's personal rule. The Kangxi Emperor was only ~10 years old and had no authority. The case was *reversed* by Kangxi in 1669. While "Kangxi Calendar Case" is used in some sources, the more historically precise standard term is simply the "Calendar Case" (曆獄, 1664--1669). The paper should clarify that this occurred during the Oboi regency, not under Kangxi's governance.

### 1.4 Joseph Yu quote is misattributed (line 1065--1068)

The paper attributes a quote to Joseph Yu (余若愚) and cites `ho_peng_yoke_2003` (Ho Peng Yoke's *Chinese Mathematical Astrology*, 2003). However, the quote reads like something from Joseph Yu's own blog or writings, not from Ho Peng Yoke's book. Joseph Yu's blog (fsrcenter.blogspot.com) contains similar sentiments, but the citation to Ho Peng Yoke appears incorrect. **Verify:** Did Ho Peng Yoke quote Joseph Yu in his 2003 book, or should this citation be to Joseph Yu directly?

### 1.5 Swiss Ephemeris is based on DE431, not DE441 (lines 1156--1157)

The paper states MOIRA "computes planetary positions using the Swiss Ephemeris, which is based on NASA JPL DE431." This is correct -- Swiss Ephemeris since version 2.00 (2014) is based on DE431. However, lines 1156--1157 also claim it "agrees with JPL to 0.001'' (one milli-arcsecond)." This is confirmed correct by Astrodienst's documentation. No issue here; just flagging for completeness.

However, the paper inconsistently refers to "DE431" in the Seven Luminaries section (line 1157, 1250) but "DE441" elsewhere. These are different ephemerides. The Swiss Ephemeris's default compression is DE431, not DE441 (though DE441 files can be loaded separately). The sentence at line 2127 "Swiss Ephemeris/JPL DE431" in the conclusion is correct.

### 1.6 Ketu identification: contradictory claims about Zhao Youqin (line 1083--1084)

The paper lists both:
- 計都 (Ketu) = lunar apogee per Niu Weixing 1995 (line 1078--1079)
- 月孛 (Lunar Apogee) = Moon's apogee per Zhao Youqin (line 1083--1084)

If both 計都 and 月孛 are "lunar apogee", this is contradictory. Per Niu Weixing's research, 計都 is the lunar apogee (not the descending node as in Indian Jyotish). 月孛 is also identified with the lunar apogee by Zhao Youqin. The paper needs to clarify the distinction: either they refer to different aspects of the apsidal line (perigee vs. apogee), or this is an inconsistency that should be resolved. **Recommendation:** Clarify that 計都 and 月孛 may both relate to apsidal points but are computed differently, or cite the specific distinction from Niu Weixing's work.

---

## 2. MISSING CITATIONS (Claims Stated as Fact Without References)

### 2.1 Uncited factual claims

| Line(s) | Claim | Suggested citation |
|---------|-------|--------------------|
| 128--129 | "one of humanity's oldest continuous astronomical traditions, with systematic records spanning over 2,700 years" | Cited (stephenson2016). OK. |
| 199--201 | Sun's angular velocity: ~1.02 deg/day near perihelion, ~0.95 deg/day near aphelion | No citation. Standard astronomical fact but should cite Meeus 1998 or similar. |
| 220 | Delta T approx 69.1 s for mid-2024 | No citation. Cite IERS Bulletin A or nasa_deltaT_uncertainty. |
| 234--235 | "Many applications incorrectly use Lunar New Year... This affects 4--6% of birth dates" | No citation for the 4--6% figure. How was this calculated? |
| 334 | "China's single timezone (UTC+8, 120 deg E) spans 73 deg--135 deg E" | No citation. Standard geographic fact but source would strengthen it. |
| 400--401 | "Ming astronomer Xing Yunlu (邢雲路) advocated midnight" | No citation. Should cite Xing Yunlu's work or a secondary source. |
| 660--661 | "the Sun's angular velocity is maximal (~1.02 deg/day)" at equinoxes | **POTENTIALLY INCORRECT** -- see section 3.1 below. |
| 749 | "1,080 unique configurations called 局 (formations)" | No citation. This is standard QMDJ theory but should have a reference. |
| 793--794 | "championed by modern practitioners such as Zhang Zhichun (張志春)" | No citation for Zhang Zhichun's advocacy of 拆補法. |
| 800 | "developed by Maoshan Daoists during the Yuan--Ming period" | No citation for the dating or Maoshan attribution. |
| 809--813 | "danger zone spans approximately +/- 2 hours... Approximately 13% of randomly-chosen moments" | No citation. The 13% calculation is given inline but is approximate and should show its derivation. |
| 833 | Chen Tuan dates "c. 871--989 CE" | Cited implicitly via context. Verified correct per Wikipedia and multiple sources. |
| 911--912 | "閏十二月 occurred 8 times between 1368 and 1644 (the Ming dynasty)" | No citation. This is a verifiable calendar fact but needs a source. |
| 950 | "approximately 4.2% of births falling near a 時辰 boundary" | No citation. The derivation (28 min out of 120-min double-hour) is implicit but should be stated. |
| 957 | "oldest of the Three Arts (三式), with roots in the Warring States period (475--221 BCE)" | No citation for the dating of Da Liu Ren's origins. |
| 1098 | "七曜攘災決 (806 CE)" | No citation. Should have a bibliographic entry for this text. |
| 1112--1114 | "Huang Yi-long (黃一農) has shown that Han-dynasty planetary calculations were 'often off by several lunar lodges'" | No citation. Need to cite Huang Yi-long's specific work. |
| 1114--1117 | "A 999 CE Japanese scribe's marginal note in the 七曜攘災決 records a discrepancy exceeding 3 degrees" | Cited as ho_peng_yoke_2003. Acceptable if Ho Peng Yoke discusses this. |
| 1316--1318 | "tidal friction (LOD increase +2.3 ms/century), partially offset by post-glacial rebound (-0.6 ms/century), yielding observed +1.8 ms/century" | Cited (stephenson2016). OK, but the specific numbers should be verified against that source. |
| 1324--1325 | "Spoerer (1450--1550) and Maunder (1645--1715) Minima" | No citation for these specific date ranges; eddy1976 is cited on the next line but should be moved to cover both. |
| 1336--1338 | "709 BCE eclipse -- humanity's earliest datable total solar eclipse recorded in Chinese annals" | Should verify whether "earliest datable total" is correct. There are older eclipse records (e.g., 780 BCE in the Bamboo Annals). The 709 BCE claim may refer to the earliest with sufficient detail for computational verification. |
| 1447--1448 | "Duke of Zhou erected a gnomon at Yangcheng... c. 1037 BCE" | No citation for the 1037 BCE date. The Zhou Li is cited indirectly; Needham 1959 is cited a few lines later. |
| 1451--1455 | Nangong Yue rebuilt gnomon in stone in 723 CE, "Eight-Chi Gnomon, with gnomon and base each 1.98 m -- exactly 8 chi in Tang metrology" | Cited (needham1959). OK. |
| 1477--1478 | Guo Shoujing's gnomon "40 chi (~12 m)" and "31.9 m stone measurement path comprising 36 stones" | No citation. Should cite Needham 1959 or Sivin 2009. |
| 1504--1505 | "In 1918, the Republic of China proposed five time zones spanning UTC+5:30 to UTC+8:30" | No citation. |
| 1505--1506 | "After 1949, Mao Zedong abolished these in favor of a single UTC+8 standard" | No citation. |
| 1571--1572 | "Ptolemy estimated Earth's circumference at 180,000 stadia (~33,300 km), about 17% less than true value of 40,075 km" | No citation beyond berggren2000. The 17% figure should be checked: (40075-33300)/40075 = 16.9%. OK. |
| 1587--1589 | Al-Khwarizmi dates "c. 780--850 CE" | No citation for these dates specifically. |
| 1605 | Ulugh Beg dates "(1394--1449)" | No citation. Standard historical fact, verified correct. |
| 1607--1608 | Sextant graduation: "1 deg = 70.2 cm, 1' = 11.7 mm, 5'' = 1 mm" | No citation. Should cite Sayili 1960 (which is cited two lines later for the tropical year measurement). |
| 1608--1610 | Sultani Zij "(1438--39) measured the tropical year to within 25 seconds of the true value" | Cited (sayili1960). Verified approximately correct. |
| 1617 | "Royal Observatory at Greenwich was founded on 22 June 1675" | Cited (sobel1995). Verified correct. |
| 1626 | "John Flamsteed, appointed as the first Astronomer Royal on 4 March 1675" | Cited (sobel1995). Verified correct -- though technically his title was "astronomical observator", not yet "Astronomer Royal." |
| 1627--1628 | "made over 50,000 observations in 40 years, producing the Historia Coelestis Britannica (3,000 stars)" | No separate citation. The star count should be verified: Flamsteed's catalogue contained approximately 3,000 stars. Confirmed. |
| 1661 | "41 delegates from 25 nations" at 1884 Conference | Cited (howse1997, implied). Standard historical fact. |
| 1672 | "72% of global shipping tonnage already used [Greenwich] as zero longitude" | No citation. This is a widely repeated figure from the 1884 Conference proceedings. |
| 1692--1693 | "Stonehenge, c. 3000--2000 BCE; Newgrange, c. 3200 BCE" | No citation for these specific dates. Standard archaeological dating. |
| 1703--1704 | "Maya synodic month calculation exceeded Ptolemy's in precision" | Cited (aveni2001). Should verify in that source. |
| 1868--1869 | "11,742 historical transitions across 78 timezones" in stem-branch library | No citation needed (this is a software implementation detail). |
| 1891--1893 | "PMO has served as the sole official calendar authority for the PRC since 1949, inheriting a mandate that traces to the Academia Sinica's adoption of the site in 1929" | No citation. |
| 1895--1896 | "Chinese Astronomical Almanac was still using DE421 as of 2025" | No citation. |
| 1901--1903 | "Prior to 1984, PMO relied on Newcomb's Tables (1895), introducing systematic solar term timing errors of approximately 25 seconds" | Cited (meeus1998). The 25-second figure should be verified. |
| 1914 | "over 70 million copies" of Choi almanacs sold | No citation. |
| 1927 | "founded 真步堂 1891" by 蔡最白 | No citation. |
| 1929 | "1922--2018; received GBS from HKSAR" for 蔡伯勵 | No citation. Verified: born December 28, 1922; died July 26, 2018. GBS confirmed. |
| 1936--1939 | 蔡興華 quote about "no special techniques" | No citation for the source of this quote. |
| 1993--1994 | "approximately 90 competing 通勝 are published annually" in Taiwan | Cited (huang_tungshu). OK. |
| 2050--2057 | The 1978 Mid-Autumn Festival discrepancy details | No citation. This is a well-documented event; should cite ytliu_rules or a similar source. Verified factually correct per Yuk Tung Liu's website. |
| 2066--2067 | "Until the early 1990s, all published Chinese calendars worldwide placed the 2033 leap month after month 7 rather than after month 11" | Cited (aslaksen_fake, wikipedia_2033). OK. |

### 2.2 Seven unused bibliography entries

The following `\bibitem` entries are defined but never cited:
- `hayakawa2017` -- Hayakawa et al., sunspot/aurora records 1261--1644
- `nasa_deltaT_uncertainty` -- Espenak, Delta T uncertainty
- `ronvondrak1986` -- Ron & Vondrak, annual aberration
- `stephenson1986` -- Stephenson & Houlden, historical eclipse maps
- `wikipedia_fourpillars` -- Wikipedia Four Pillars article
- `ytliu_computation` -- Y.T. Liu, calendar calculation
- `zhukz1973` -- 竺可楨, 5000-year climate study

**Recommendation:** Either cite these where appropriate or remove them.

---

## 3. POTENTIALLY INCORRECT CLAIMS

### 3.1 Equinox amplification explanation (lines 660--661)

The paper states: "where the Sun's angular velocity is maximal (~1.02 deg/day)" at the equinoxes. This is **incorrect**. The Sun's ecliptic longitude velocity is maximal near perihelion (around January 3), not at the equinoxes. The equinoxes occur around March 20 and September 23. The Sun moves ~1.02 deg/day near perihelion and ~0.95 deg/day near aphelion. At the equinoxes, the velocity is close to the mean (~0.986 deg/day). The equinox amplification effect described (larger timing deviations at equinoxes) is real but occurs for a different reason: the 15-degree longitude intervals are traversed in fewer days near perihelion, making a given longitude error translate to a larger timing error. The explanation should be revised.

**Wait -- rereading more carefully:** The paper says "the Sun's angular velocity is maximal" at the equinoxes in the context of SB-SX *deviations*. This pattern could reflect the fact that both implementations use slightly different ephemeris corrections, and the *sensitivity* of timing to longitude errors is related to the Sun's speed at that longitude. The ~1.02 deg/day figure is actually more characteristic of the winter solstice region (near perihelion), not equinoxes. The equinox peaks in the deviation plot may reflect a different underlying cause (e.g., nutation sensitivity near equinoxes). The explanation in the text conflates two distinct effects. **Recommendation:** Revise the physical explanation or verify it against the data.

### 3.2 VSOP87D "2,425 terms" claim is absent from the paper

The paper does not actually claim 2,425 terms for VSOP87D. This was mentioned in the review prompt but is not in the paper. The paper simply states "VSOP87D" without specifying a term count. No issue here.

### 3.3 DE441 time span (review prompt mentions this)

The paper states DE441 range as "+/- 2300 yr" in Table 1 (line 265) and "+/- 2500 yr" for the "truth" row (line 266). The actual DE441 range is -13,200 to +17,191 (about 30,000 years). The paper's "+/- 2,300 yr" likely refers to the validated accuracy range, not the full span. The distinction should be clarified. The "+/- 2,500 yr" for the "truth" row is also narrower than DE441's actual span. This is not wrong per se (DE441 accuracy degrades for very distant epochs) but could be clearer.

### 3.4 1978 Mid-Autumn Festival: times differ slightly (lines 2051--2054)

The paper gives the new moon time as "00:07 CST on 3 September 1978" for the modern standard and "23:53 on 2 September 1978" for the old Beijing meridian. Yuk Tung Liu's website gives "0:09 (UTC+8)" for the PMO version and "23:56" for the Shixian system calculation. The discrepancy is small (2 minutes) and may reflect different ephemeris choices. **Recommendation:** Note that exact times depend on the ephemeris used, or cite the specific source.

### 3.5 Equation of Time amplitude stated as +/- 16 min (lines 339, 1755, 1801)

The actual extremes are approximately +14 min (February) and -16 min (November). The paper's "+/- 16 min" is slightly imprecise -- the positive extreme is ~14 min, not 16 min. However, for a bound estimate, "+/- 16 min" is acceptable as an upper bound. **Minor issue.**

### 3.6 Luoyang longitude: 112.45 deg E (lines 925, 939, 2145)

The paper uses 112.45 deg E for Luoyang. Modern Luoyang's coordinates are approximately 112.45 deg E. However, the "reference longitude" discussion also mentions Dengfeng at 113.07 deg E (line 927), which is a different location. The paper correctly distinguishes between them in some places but conflates them in others (e.g., line 1512 uses "洛陽/Dengfeng" as if they were the same). They are about 40 km apart. **Recommendation:** Be consistent about which site is being discussed.

### 3.7 Surya Siddhanta Earth diameter claim (line 1551--1552)

The paper states the Surya Siddhanta "calculated Earth's diameter as 8,000 miles (modern value: 7,928 miles)." The Surya Siddhanta gives 1,600 yojanas for the Earth's diameter, but the conversion to miles depends on the assumed yojana length. Different scholars produce different estimates. The Burgess translation does discuss such figures. This claim should be read with caution. The modern Earth mean diameter is ~7,918 miles (equatorial: 7,926 miles). The "7,928" figure in the paper appears to be roughly correct for the equatorial diameter.

---

## 4. MINOR ISSUES (Formatting, Consistency, Typos)

### 4.1 Inconsistent romanization

- Line 1059: "Q\={\i}" should probably be "Q\'{i}" for the pinyin of 七. The macron suggests first tone (qī), which is correct for 七.
- Line 743: "Q\'{i} M\'{e}n D\`{u}n Ji\v{a}" -- the accents are correct for the pinyin tones.

### 4.2 Cai Boli death date

The paper states dates as "1922--2018" (line 1929). Verified: born December 28, 1922; died July 26, 2018. Correct.

### 4.3 GBS vs. GBM distinction

Line 1929 says Cai Boli "received GBS from HKSAR." GBS is the Gold Bauhinia Star, which is the highest rank in the Order of the Bauhinia Star. This is confirmed by search results. Correct.

### 4.4 Flamsteed star count

Line 1628 says "3,000 stars" in the Historia Coelestis Britannica. Various sources confirm approximately 3,000 stars. Correct.

### 4.5 Xieji Bianfang Shu: "completed in 1739" (line 1978)

The paper says completed in 1739. Chinaknowledge.de confirms "was finished in 1739." Correct. The Qianlong Emperor's preface is consistent (he took the throne in 1735).

### 4.6 Prince Yun Lu name

Line 1978: "Prince Yun Lu (允祿)." Verified: Yunlu (允祿, 1695--1767), 16th son of the Kangxi Emperor. Correct.

### 4.7 Matteo Ricci dates

Line 1497--1498: "Matteo Ricci (1552--1610)." Standard dates. Correct.

### 4.8 Harrison's marine chronometer

Line 1630: "John Harrison's marine chronometer H4 (1760s)." H4 was completed in 1759, tested in 1761. "1760s" is acceptable. Correct.

### 4.9 Parliament prize amount

Line 1630--1631: "Parliament offered a 20,000 pound prize in 1714." The Longitude Act of 1714 offered up to 20,000 pounds. Correct.

---

## 5. VERIFICATION NOTES (Claims Verified as Correct)

| Claim | Status |
|-------|--------|
| Chen Tuan dates c. 871--989 CE | **Verified.** Wikipedia: "allegedly October 10, 871 -- July 22, 989." |
| Jingyou era = 1034--1038 CE | **Verified.** Emperor Renzong of Song, Northern Song dynasty. |
| Shen Kuo dates 1031--1095; Dream Pool Essays c. 1088 | **Verified.** Multiple sources confirm both dates. |
| Guo Shoujing dates 1231--1316; Shoushi calendar = 365.2425 days; completed 1281 | **Verified.** Multiple sources confirm. |
| Luo Hongxian attributed as author of ZWDS Quanshu; dates 1504--1564 | **Verified.** Wikipedia and Ziwei Doushu sources confirm. |
| IAU2000B = 77 terms | **Verified.** McCarthy & Luzum 2003; SOFA and NOVAS implementations. |
| DE441 range covers -13,200 to +17,191 | **Verified.** Park et al. 2021. Paper's "+/- 2300 yr" is a narrower practical accuracy range. |
| Precession ~50.3"/year = ~1.4 deg/century | **Verified.** Standard value from IAU. |
| Equation of Time max amplitude ~16 min | **Verified.** Approximately +14 min (Feb) to -16 min (Nov). |
| Swiss Ephemeris based on DE431, 0.001" accuracy vs. JPL | **Verified.** Astrodienst documentation confirms. |
| PRC DST 1986--1991 (6 years) | **Verified.** Multiple sources confirm. |
| Hong Kong DST: 1941, 1946--1976, 1979 (33 years total) | **Verified.** HKO website confirms. Note: exact year count depends on how the Japanese occupation years 1942--1945 are counted. The paper lists 33 years. |
| Niu Weixing 1995: Ketu = lunar apogee (not descending node) | **Verified.** ADS abstract confirms. |
| Gautama Siddha translated Jiuzhi Calendar in 718 CE | **Verified.** Multiple sources confirm. |
| 1645 Shixian calendar reform: switched from 平氣 to 定氣 | **Verified.** Standard Chinese calendar history. |
| 1884 International Meridian Conference: Greenwich adopted 22-1 with France/Brazil abstaining | **Verified.** Standard historical fact. |
| Ulugh Beg observatory: 40-meter sextant, tropical year within 25 seconds | **Verified.** UNESCO World Heritage documentation confirms. |
| Royal Observatory Greenwich founded 22 June 1675 by Charles II | **Verified.** Royal Museums Greenwich confirms. |
| Flamsteed appointed 4 March 1675 | **Verified.** Royal Museums Greenwich: "appointed 'our astronomical observer' on 4 March 1675." |
| 1978 Mid-Autumn Festival discrepancy between HK and mainland | **Verified.** Yuk Tung Liu's Chinese Calendar Rules page documents this. |
| Xieji Bianfang Shu compiled under Yun Lu, completed 1739, 36 juan | **Verified.** Chinaknowledge.de confirms all details. |
| Cai Boli (蔡伯勵) 1922--2018, GBS | **Verified.** Multiple Hong Kong sources confirm. |
| All \cite{} keys resolve to valid \bibitem entries | **Verified.** Python cross-check confirms zero missing bibitem keys. |
| All \ref{}/\eqref{} keys resolve to valid \label targets | **Verified.** Python cross-check confirms zero missing label keys. |

---

## 6. SUMMARY OF RECOMMENDED ACTIONS

### Priority 1 (Must fix)
1. **Fix Yanbo Diaosou Fu bibliography entry** (line 2303): Change "traditionally Tang dynasty" to "traditionally Song dynasty" and note disputed attribution.
2. **Fix equinox amplification explanation** (line 660--661): The Sun's angular velocity is NOT maximal at equinoxes; it is maximal near perihelion (winter solstice region). Revise the physical explanation.
3. **Clarify Ketu/Yuebei distinction** (lines 1078--1084): Both are described as "lunar apogee" -- explain how they differ.
4. **Verify Joseph Yu quote citation** (line 1068): Confirm the quote source is ho_peng_yoke_2003 or cite Joseph Yu directly.

### Priority 2 (Should fix)
5. Add citations for uncited factual claims listed in section 2.1 (particularly: Xing Yunlu midnight advocacy, QMDJ 1,080 configurations, Huang Yi-long planetary error findings, 1918 five time zones, 1949 single timezone, the 4--6% birth date figure, the 13% danger zone figure).
6. Remove or cite the 7 unused bibliography entries.
7. Clarify Yi Xing birth year dispute (673 vs 683).
8. Add clarification that the "Kangxi Calendar Case" actually occurred during the Oboi regency.

### Priority 3 (Nice to have)
9. Make Luoyang vs. Dengfeng references consistent.
10. Clarify DE441 range notation in Table 1.
11. Note that "+/- 16 min" for EoT is an upper bound; positive extreme is ~14 min.
12. Add missing URLs/DOIs to bibliography entries where possible.
