# Deep Research: 蔡真步堂 (Choi Chan Po Tong) Almanac Computation Methods

## Family Lineage (All Confirmed)

| Gen | Name | Period | Role |
|-----|------|--------|------|
| 1st | 蔡最白 (Cai Zuibai) | Late Qing (~1880s-1891+) | 學海堂 astronomy/math graduate; served in 欽天監; founded 真步堂 in Guangzhou 1891 |
| 2nd | 蔡廉仿 (Cai Lianfang) | Early Republic | Continued tradition; persuaded son to take over |
| 3rd | 蔡伯勵 (Choi Pak Lai) | 1922-2018 | Studied under mathematician 張兆駟 and SYSU astronomer 張雲; moved to HK 1952; GBS 2015 |
| 4th | 蔡興華 (Choi Hing Wah) | Current | Eldest daughter; took over from 1990s; compiles with 4 siblings |

## Q1: Modern Ephemeris vs Traditional Methods?

**Answer: Hybrid -- almost certainly modern astronomical data for calendar backbone, traditional methods for date-selection interpretation layer.**

Evidence for modern data adoption:
- Post-1978: Hong Kong calendars switched to PMO-based calculations after the Mid-Autumn Festival discrepancy
- 蔡伯勵 discussed UTC+8 time zone corrections, daylight saving time, and longitude-specific calculations
- 2017 GB/T 33661-2017 mandates PMO as official reference
- The 七政經緯曆書 may still incorporate traditional computational elements for planetary positions

## Q2: Hand, Computer, or Hybrid?

**Answer: Originally entirely by hand; current status unclear but likely hybrid.**

蔡伯勵's quote: "This book requires four workers... takes one to one-and-a-half years to compile." He described family members taking turns computing, each trained to produce a complete book independently. This was clearly hand computation historically.

No public statement found confirming or denying computer use. Given that 蔡興華 took over in the 1990s and the family adapted to modernity, some computerization is plausible, but the complex editorial judgment layer (filtering contradictory date-selection results) likely remains manual.

## Q3: What Was Inherited from the 欽天監?

**The Shixian Calendar system (時憲曆), which was itself Jesuit-influenced:**
- 定氣法 (Dingqi): True solar longitude method for solar terms
- Tychonic planetary model adapted to Chinese computational frameworks
- Western trigonometry embedded in ready-reckoner tables
- 曆象考成 and its supplement as reference works
- The 推步法 (tuibu fa) step-by-step astronomical computation methodology
- The 選擇家 tradition of date/time selection based on astronomical data

**Critical insight:** The "traditional" method was already a European-Chinese hybrid by 1645. 蔡最白 inherited 17th-18th century European astronomy reformulated into Chinese frameworks, not purely ancient Chinese methods.

## Q4: Documented or Trade Secrets?

**Confirmed by 蔡興華: NOT trade secrets.**

Direct quote: "Actually we have no proprietary methods, nor should we be mythologized. The knowledge of the Tung Shing consists of basic compilation rules that anyone can self-study."

The "expertise" is in:
- Depth of experience applying traditional rules
- Editorial judgment in filtering contradictions
- The specific 選擇家 tradition of combining astronomical data with metaphysical frameworks
- Accumulated family knowledge transmitted through apprenticeship

## Q5: Solar Term Comparison with PMO

**Known discrepancies exist, primarily pre-1978:**

### 1978 Mid-Autumn Festival
- PMO: Month 8 conjunction at 00:09 UTC+8, Sep 3, 1978
- Imperial Calendar: Conjunction on Sep 2 (using Beijing apparent solar time, ~23:56)
- HK celebrated Sep 16; mainland Sep 17
- **Resolution: HK calendars adopted PMO data afterward**

### 2013 Dragon Boat Festival
- Similar near-midnight discrepancy in Month 5 conjunction
- PMO: June 8 at 23:56; some calendars had June 9

### Root causes: time standard differences (Beijing apparent solar time vs UTC+8), computational precision of old methods, near-midnight boundary events

## Q6: Relationship with Hong Kong Observatory?

**No formal collaboration on almanac production.** They operate independently:
- HKO publishes scientific astronomical almanac (data from HM Nautical Almanac Office, UK + USNO)
- 蔡真步堂 publishes traditional Chinese almanac (Tung Shing)

**Personal connections:**
- 蔡伯勵 recast a 渾天儀 (armillary sphere) and gifted it to HKO Director 林超英 in 2007
- 蔡伯勵 created specialized HK-region tables: solar azimuth tables, sunrise/sunset tables, 24 solar term dawn/dusk tables

## Q7: Did 蔡伯勵 Explain Methods in Interviews?

**Yes, but at a high level only:**
- Multiple lectures and interviews at 灼見名家 (Master Insight)
- 2005 Government-sponsored lecture: "中國曆法講座" (Chinese Calendar Lecture)
- Lectures at 思考香港 (Think HK) in 2018
- Explained the structure of Tung Shing pages, basic principles of 宜忌 (auspicious/inauspicious), historical evolution of 102+ Chinese calendar systems
- Never published detailed computational algorithms
- Emphasized complexity: "astronomical calculation is extremely complex, we can't fully explain it here"

## Q8: 欽天監 Methods in Late Qing

**By the late Qing (1880s-1890s), the 欽天監 used:**
1. Shixian Calendar (時憲曆) -- adopted 1645, Jesuit origin
2. Tychonic geo-heliocentric planetary model
3. 定氣法 (true solar longitude) for solar terms
4. Western trigonometry via ready-reckoner tables
5. 曆象考成 (1722) and 曆象考成後編 (Qianlong era supplement)
6. Beijing apparent solar time as time standard

Four divisions: 時憲科 (calendar), 天文科 (astronomy/astrology), 刻漏科 (timekeeping/date selection), 回回科 (Islamic calendar, later abolished).

## Q9: Did 欽天監 Use Western Tables?

**Yes -- since 1645.** The entire Shixian system was built on Jesuit-introduced European astronomy:
- Tycho Brahe's planetary model
- Western trigonometric functions
- Ready-reckoner tables for computation
- Kepler's and Newton's refinements incorporated in 曆象考成後編

By 蔡最白's time, the methods were ~200 years post-Jesuit reform. They were Western in origin but had been fully integrated into Chinese computational practice.

## Q10: Academic Studies Comparing 真步堂 vs PMO?

**No specific academic study found.** Closest relevant work:
- ytliu0 (Yuk Tung Liu): ytliu0.github.io/ChineseCalendar -- extensive technical reconstruction
- Liu and Stephenson: Historical calendar discrepancy analysis
- GB/T 33661-2017: PMO's official standardization document
- Over 200 mismatches identified between Qing-era official calendar data and modern recomputation

## Q11: 擇日 (Date Selection) -- Computed or Lookup?

**Answer: Both. Cyclic/deterministic rules that function like algorithms, applied on top of astronomical data.**

Systems used (all deterministic once calendar date is known):
1. **十二建除 (12 Day Officers)** -- cyclic pattern mapped to stems/branches
2. **定局法 (Constant Pattern Method)** -- from 玉匣記, systematic chronomancy
3. **黃黑道十二星 (12 Yellow/Black Path Stars)** -- auspicious vs inauspicious markers
4. **二十八宿 (28 Mansions)** -- cyclic daily assignment
5. **協紀辨方書** -- Qing imperial standardized rules (last edited 1742)
6. **天星擇日** -- Higher-level method using actual planetary positions (requires astronomical knowledge)

The basic 通勝 daily entries use cyclic lookup patterns. The advanced 天星擇日 method (which 蔡真步堂 specializes in) requires actual astronomical computation.

## Q12: 七政四餘 in Their Method?

**Yes, foundational.** The founding publication was literally named 《七政經緯選擇通書》:
- 七政 = Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn
- Their positions plotted in 28 mansions for date selection
- 四餘 = Rahu (羅喉), Ketu (計都), Purple Qi (紫氣), Moon's Apogee (月孛)
- Indian-origin mathematical points incorporated into Chinese system
- This is the most astronomically-grounded Chinese astrological system
- Requires actual planetary position computation (unlike simpler BaZi or Zi Wei Dou Shu)

## Architecture Summary

```
Layer 4: EDITORIAL JUDGMENT (family expertise)
  - Filter contradictions between systems
  - Resolve ambiguous combinations
  - "I filter clearly in my Tung Shing" -- 蔡伯勵

Layer 3: DATE SELECTION (擇日) -- traditional algorithmic rules
  - 12 Day Officers, 28 Mansions, Yellow/Black Paths
  - 協紀辨方書 rules
  - 天星擇日 (requires Layer 2 data)
  - Personal BaZi interaction

Layer 2: TRADITIONAL ASTRONOMICAL (七政經緯)
  - Planetary positions in 28 mansions
  - 四餘 mathematical points
  - Possibly still using traditional computation methods
  - May be cross-checked with modern data

Layer 1: CALENDAR BACKBONE (astronomical)
  - Solar terms, lunar conjunctions, eclipses
  - Post-1978: Aligned with PMO/modern ephemeris
  - Uses UTC+8 (with longitude corrections for different locations)
```

## Key Sources

1. [蔡伯勵 Wikipedia](https://zh.wikipedia.org/zh-hk/蔡伯勵)
2. [Initium Media 2019 Interview with 蔡興華](https://theinitium.com/article/20190202-culture-hongkong-traditional-calendar)
3. [Master Insight: 蔡伯勵 Five-Minute Guide to Tung Shing](https://www.master-insight.com/article/1785)
4. [Master Insight: 蔡伯勵 on Calculation Principles](https://www.master-insight.com/article/1796)
5. [Think HK: 蔡伯勵 Lecture 2018](https://www.thinkhk.com/article/2018-07/26/28316.html)
6. [HK01: 蔡興華 Interview 2023](https://www.hk01.com/藝文/858582/)
7. [Wen Wei Po: Naming of 真步堂](http://paper.wenweipo.com/2018/10/01/CF1810010002.htm)
8. [CUHK U-Beat Issue 93](https://ubeat.com.cuhk.edu.hk/ubeat_past/091293/tungshing.pdf)
9. [SCMP: Choi Pak-lai Obituary](https://www.scmp.com/news/hong-kong/community/article/2156992/)
10. [ytliu0 Chinese Calendar Computation](https://ytliu0.github.io/ChineseCalendar/computation.html)
11. [Chinese Calendar Rules](https://ytliu0.github.io/ChineseCalendar/rules.html)
12. [GB/T 33661-2017 Standard](http://www.pmo.cas.cn/)
13. [HKO Calendar Data](https://www.hko.gov.hk/en/gts/time/Calendar.htm)
14. [SCMP: Choi Calls for Almanac Protection](https://www.scmp.com/news/hong-kong/article/1679771/)
15. [HKO: Brief History of Calendar Organizations in China](https://www.hko.gov.hk/en/education/astronomy-and-time/time-service/00470-a-brief-history-about-the-authoritative-organizations-for-compiling-calendar-in-china.html)
