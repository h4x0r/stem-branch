# Chinese Almanac/Calendar Authorities: Research Notes

*Compiled 2026-03-22 for academic paper on computational accuracy in Chinese metaphysics apps.*

---

## 1. Purple Mountain Observatory (紫金山天文台, PMO) — Nanjing

### Role and Authority
- China's **sole institution** for ephemeris astronomy and almanac compilation, operated by the Chinese Academy of Sciences.
- Located at Purple Mountain (紫金山), east of Nanjing.
- Has published the **Chinese Astronomical Almanac (中国天文年历)** annually since 1950.
- Since 1929 (Institute of Astronomy) and since 1949 (as PMO), responsible for all official calendrical calculations in the PRC.
- Also conducts classified space domain awareness activities (dual-use).

### Ephemeris and Computation Methods
- **Current ephemeris**: JPL DE441 (planetary and lunar, numerical integration). As of 2025, the Chinese Astronomical Almanac still used **DE421** (covers 1899–2053); differences between DE421/DE431/DE441 are negligible for recent centuries.
- **Pre-1984**: Sun positions from Newcomb's Tables (1895), accurate to ~1 arcsecond, causing solar term times to be off by ~25 seconds.
- Computes apparent geocentric positions (ICRS) after correcting for light time and aberration.
- Calculations in **Barycentric Dynamical Time (TDB)** → Terrestrial Time (TT) → UTC.
- Solar terms: **定氣 (dìngqì)** — Sun's apparent ecliptic longitude at 15° intervals.

### GB/T 33661-2017: National Standard
- Issued **2017-05-12** by Standardization Administration of China.
- Drafted by PMO; proposed/managed by Chinese Academy of Sciences.
- Title: "Calculation and Promulgation of the Chinese Calendar" (农历的编算和颁行).
- Key provisions:
  - Standard time: **UTC+8 (120°E meridian)**
  - New moon day = first day of lunar month (定朔)
  - 11th month must contain Winter Solstice
  - Leap month rules fully specified
  - **Accuracy requirement**: ~1 second (excluding unpublished leap seconds)
  - Calendar data 1912–2017: refer to PMO publications
  - PMO provides official data annually for upcoming year
- Uses IERS conventions; reconciles traditional rules with modern astronomical precision.

### Recent Development: LTE440
- PMO researchers developed **LTE440** (Lunar Time Ephemeris), the world's first ready-to-use software for lunar timekeeping (published in *Astronomy & Astrophysics*, December 2025).
- Calculates lunar coordinate time (TCL) and its relation to TCB/TDB.
- Accurate to tens of nanoseconds over 1,000 years.

---

## 2. 蔡伯勵 (Choi Pak Lai) and 蔡真步堂 (Choi Gen Po Tong)

### Biographical Details
- **蔡伯勵** (Choi Pak-lai), GBS, 1922–2018, originally named 蔡勸勤 (Choi Hyun-kan).
- Third-generation heir of 蔡真步堂.
- Died at Hong Kong Sanatorium & Hospital, July 2018, age 96.
- Almanac sold over **70 million copies**.
- Adviser to: CE Tung Chee-hwa, Governor Chris Patten, Li Ka-shing.

### Family Lineage (Four Generations)
| Generation | Name | Period | Notes |
|---|---|---|---|
| 1st | **蔡最白** (Choi Chui-baak) | Late Qing | Founded tradition; top student in astronomy/math at Hok Hoi Tong; served in 欽天監 (Imperial Astronomical Bureau); first published 七政經緯選擇通書 in **1891** |
| 2nd | (Choi Pak Lai's father) | Early 20th c. | Continued tradition |
| 3rd | **蔡伯勵** (Choi Pak Lai) | 1922–2018 | Relocated family to HK in 1952 during "Destroy the Four Olds"; master almanac compiler |
| 4th | **蔡興華** (Choi Hing Wah) | Present | Eldest daughter; current head of almanac compilation |

### Computation Methods
- Uses **定氣 (dìngqì)** — true solar position along ecliptic.
- Reference time: **UTC+8 / 120° East** (same as mainland China).
- The name "真步堂" signifies "truly stepping through" astronomical phenomena (真正按照天象一步一步推算).
- Goes beyond pure calendar: includes **date selection (擇日)** based on Five Elements, Eight Trigrams, stems and branches.

### Relationship to Major Publishers
- **蔡真步堂 is NOT a competing publisher** — it is the **source** of calendrical calculations.
- **永經堂 (Wing King Tong)** and **廣經堂 (Kwong King Tong)** are the major publishers that distribute the Tung Shing using 蔡真步堂 calculations.
- Differences between published editions are in supplementary content only, not core calendar dates.

### Cultural Recognition
- 2013: Recognized as **provincial-level intangible cultural heritage** by Guangdong provincial government.
- Honored for "research value in science, astronomy, folk culture and history."
- Nearly **1 million copies/year** sold across HK and Southeast Asia.

---

## 3. 協紀辨方書 (Xieji Bianfang Shu)

### Overview
- Full title: **(欽定)協紀辨方書** — "Imperially Endorsed Treatise on Harmonizing Times and Distinguishing Directions"
- Compiled under **Prince Yun Lu (允祿, 1695–1767)**; finished in **1739**.
- Commissioned by the **Qianlong Emperor**.
- **36 juan**, divided into **11 parts**.
- Included in 四庫全書 (Siku Quanshu, Complete Library of the Four Treasuries).

### Purpose
- Commissioned explicitly to:
  1. Combine theories of various date selection schools
  2. **Eliminate baseless superstitions**
  3. Systematize contradictory calendar spirit (神煞) traditions
- Debunked many traditional formulae lacking logical basis.
- Example: described spatial form of 羅睺 (Rahu) but said nothing about "Rahu Days" or their supposed effects.

### Contents and Methods
- Covers: site selection for houses/tombs (feng shui), auspicious/inauspicious moments.
- Uses: Five Agents (五行), celestial body movements, time calculations, stems and branches.
- Date selection assigns qualities to days based on complex interactions of heavenly stems (天干), earthly branches (地支), and calendar spirits.

### Relationship to Modern Almanacs
- Became the **fundamental basis** of the Tung Shu (通書) / Tong Shing (通勝).
- Modern date selection practice derives from it.
- However: many popular almanacs continued using superstitions that the Xieji had excised.
- Popular almanacs combine different 擇日 techniques, which experts criticize as inconsistent.

### Historical Calendar Context
- During Qianlong's reign: calendar used **Newton's Theory of the Moon's motion** for eclipse prediction.
- The **Time Regulated Calendar (時憲曆)** drew from Western (Gregorian/Julian) methods.
- The Xieji focuses on date selection algorithms, not astronomical ephemeris computation.

### English Translation
- Thomas F. Aylward (2007), *The Imperial Guide to Feng Shui and Chinese Astrology* (London: Watkins) — partial translation.

---

## 4. 真步堂 vs 永經堂 (Choi Gen Po Tong vs Wing King Tong)

### Key Finding: They Are NOT Competitors
- **真步堂** = calculation source (the Choi family's astronomical computation)
- **永經堂** = publisher (distributes the almanac commercially)
- **廣經堂** = another publisher (also uses 真步堂 calculations)
- No known "two different Chinese New Year dates" controversy between them.
- Core calendar dates are identical; differences are in supplementary material.

### The Real Historical Controversies

#### 1978 Mid-Autumn Festival (HK vs Mainland)
- New moon: September 3, 1978 at **00:07 CST** (120°E meridian).
- Old Beijing meridian (116°25'E): **23:53 on September 2**.
- Hong Kong (using old calendar): celebrated **September 16**.
- Mainland (using PMO): celebrated **September 17**.
- **After this, Hong Kong adopted PMO calculations.**

#### 1989 Lunar Conjunction Discrepancy
- Imperial Perpetual Calendar vs PMO data disagreed on month 7 conjunction.
- HK calendars were already aligned with PMO.
- Taiwan was not — Taipei Astronomical Observatory confirmed PMO was correct.

#### 2033 Leap Month: The "Chinese Y2033" Problem
- **Until the early 1990s, ALL Chinese calendars worldwide had the wrong leap month for 2033.**
- Calendars placed leap month after 7th month; correct answer: **after the 11th month**.
- A leap month after 11th month hadn't occurred since the 1645 calendar reform.
- Root cause: "fake leap months" — months without any zhong qi that are NOT leap months.
- These arise from the 1645 Jesuit reform switching from 平氣 (mean sun) to 定氣 (true sun).
- Historical irony: The Jesuits introduced this change partly to demonstrate superiority over Chinese/Muslim astronomers. It backfired — fake leap months were one reason Jesuits were **jailed in 1664**.
- 2034: first "fake leap month in a leap sui" since 1645.
- Future occurrences: leap month after 1st month in **2262** (should have happened in 1651 but was miscalculated); after 12th month in **3358**.

### HK Government's Official Reference
- **Hong Kong Observatory (HKO)** publishes the official almanac (astronomical data, Chinese calendar, solar terms, eclipses).
- HKO provides Gregorian-Lunar Calendar Conversion Tables (1901–2100).
- Since ~1978, HK calendars aligned with PMO calculations.
- 蔡真步堂 Tung Shing is the **popular/traditional** almanac, not the government's official source.
- Both use UTC+8 and modern astronomical methods, so core dates agree.

---

## 5. The Broader Question: Competing Authorities

### Current Authorities by Region
| Region | Authority | Calendar Type |
|---|---|---|
| **Mainland China** | Purple Mountain Observatory (PMO) | Official, sole authority since 1929; GB/T 33661-2017 |
| **Hong Kong** | HK Observatory (official); 蔡真步堂 (traditional Tung Shing) | Official + traditional |
| **Taiwan** | ~90 different tong shu in use; Central Weather Administration (official) | Fragmented tradition |
| **Overseas** | Various editions from HK, Taiwan, local publishers | Mixed sources |

### Taiwan's "Warring States Period" of Almanacs
- Researcher **Huang Yi-nung (黃一農)** documented ~90 different tong shu in Taiwan.
- Over 2/3 trace back to **繼成堂 (Jicheng Hall)** of Quanzhou, Fujian, founded by **Hong Chaohe (洪潮和)**.
- After PRC's Cultural Revolution ban on tong shu printing, the parent tradition collapsed.
- "With everybody aiming for a piece of the action, various lesser brands began to appear."
- A publisher could earn over 1 million NT dollars by selling just a few thousand copies.

### Main Sources of Disagreement
1. **Reference meridian**: Pre-1929 Beijing (116°25'E) vs modern 120°E — ~14 min difference.
2. **Timezone**: UTC+8 (China/HK) vs UTC+9 (Korea/Japan) can shift new moon dates.
3. **Astronomical vs Civil calendar**: Different leap month assignment rules.
4. **Fake leap months**: The dìngqì system (post-1645) creates months without zhong qi that aren't leap months — extremely rare but catastrophically confusing.
5. **Ephemeris accuracy**: Old tables (Newcomb 1895) vs modern JPL DE441.
6. **Midnight boundary cases**: Events near midnight + calculation accuracy → different dates.
7. **Date selection (擇日) methods**: Different schools combine techniques differently → conflicting auspicious/inauspicious determinations.
8. **Supplementary content**: Publishers retain methods the Xieji Bianfang Shu had explicitly debunked.

### 平氣 vs 定氣 Historical Timeline
| Period | Method | Description |
|---|---|---|
| Pre-7th c. | **平氣** (píngqì) | Equal time divisions of tropical year; assumes uniform solar motion |
| 6th c. | Discovery | Zhang Zixin found solar velocity varies through year |
| 604 | **定氣** proposed | Liu Chuo's Huangji Calendar (皇極曆): 24 segments of 15° on ecliptic |
| 604–1645 | Coexistence | 平氣 for civil use; 定氣 for scholarly calculation |
| 1645 | **定氣** adopted | Jesuit reform of Shixian Calendar (時憲曆) for civil calendar |
| Modern | **定氣** universal | All legitimate calendars use true solar position |

### The Calendar as Sacred Document
- In imperial China, the calendar was a sacred document sponsored by the reigning monarch.
- New dynasty → new calendar as assertion of authority.
- The Imperial Astronomical Bureau (欽天監) employed hundreds of astronomers.
- Qing dynasty allowed ordinary people to print almanacs, democratizing the tradition.
- Modern: the Chinese calendar remains **astronomical** (not purely algorithmic like Gregorian), requiring annual recomputation by PMO.

---

## Key Academic References

1. **Helmer Aslaksen**, "The Mathematics of the Chinese Calendar" — comprehensive mathematical treatment; motivated by the 2033 controversy. [PDF](https://gwern.net/doc/science/physics/astronomy/2010-aslaksen.pdf)
2. **Helmer Aslaksen**, "Fake Leap Months in the Chinese Calendar: From the Jesuits to 2033" (2002) — in *Historical Perspectives on East Asian Science, Technology and Medicine*. [ResearchGate](https://www.researchgate.net/publication/250375165)
3. **Zhang Peiyu (張培瑜)** et al., *Ancient Chinese Calendars and Almanacs* — PMO researcher, authoritative reference.
4. **Huang Yi-nung (黃一農)**, research on ~90 Taiwanese tong shu traditions — documented fragmentation of almanac publishing.
5. **Thomas F. Aylward**, *The Imperial Guide to Feng Shui and Chinese Astrology* (2007) — partial English translation of Xieji Bianfang Shu.
6. **Yuk Tung Liu (廖育棟)**, computational papers at [ytliu0.github.io/ChineseCalendar](https://ytliu0.github.io/ChineseCalendar/) — detailed technical treatment of calendar computation, verification against PMO data.
7. **GB/T 33661-2017**, "Calculation and Promulgation of the Chinese Calendar" — Chinese national standard. [Official link](https://openstd.samr.gov.cn/bzgk/gb/newGbInfo?hcno=E107EA4DE9725EDF819F33C60A44B296)
8. **Hong Kong Observatory**, "A Brief History about the Authoritative Organizations for Compiling Calendar in China" — [HKO Educational Resources](https://www.hko.gov.hk/en/education/astronomy-and-time/time-service/00470-a-brief-history-about-the-authoritative-organizations-for-compiling-calendar-in-china.html)

---

## Sources

- [Calendar Calculation — Yuk Tung Liu](https://ytliu0.github.io/ChineseCalendar/computation.html)
- [Rules for the Chinese Calendar — Yuk Tung Liu](https://ytliu0.github.io/ChineseCalendar/rules.html)
- [24 Solar Terms — Yuk Tung Liu](https://ytliu0.github.io/ChineseCalendar/solarTerms.html)
- [GB/T 33661-2017 (English summary)](https://www.bzxz.net/en/76ad85410442a7455.html)
- [GB/T 33661-2017 (Official)](https://openstd.samr.gov.cn/bzgk/gb/newGbInfo?hcno=E107EA4DE9725EDF819F33C60A44B296)
- [Purple Mountain Observatory — Wikipedia](https://en.wikipedia.org/wiki/Purple_Mountain_Observatory)
- [Chinese calendar — Wikipedia](https://en.wikipedia.org/wiki/Chinese_calendar)
- [Solar term — Wikipedia](https://en.wikipedia.org/wiki/Solar_term)
- [Tung Shing — Wikipedia](https://en.wikipedia.org/wiki/Tung_Shing)
- [HKO Brief History of Calendar Authorities](https://www.hko.gov.hk/en/education/astronomy-and-time/time-service/00470-a-brief-history-about-the-authoritative-organizations-for-compiling-calendar-in-china.html)
- [Choi Pak-lai obituary — SCMP](https://www.scmp.com/news/hong-kong/community/article/2156992/hong-kong-feng-shui-master-choi-park-lai-who-helped)
- [Choi Pak-lai on cultural heritage — SCMP](https://www.scmp.com/news/hong-kong/article/1679771/hong-kong-fung-shui-master-choi-park-lai-calls-chinese-almanac-be)
- [Choi Pak-lai obituary — Asia Times](https://asiatimes.com/2018/07/famous-hong-kong-feng-shui-master-passes-away/)
- [Tales of the Tung Sing — SCMP](https://www.scmp.com/article/345659/tales-tung-sing)
- [蔡真步堂 4th gen interview — Initium Media](https://theinitium.com/article/20190202-culture-hongkong-traditional-calendar)
- [Xieji Bianfang Shu — ChinaKnowledge](http://www.chinaknowledge.de/Literature/Daoists/xiejibianfangshu.html)
- [Xieji Bianfang Shu — Chinese Text Project](https://ctext.org/wiki.pl?if=en&res=595276)
- [Calendar history — ChinaKnowledge](http://www.chinaknowledge.de/History/Terms/calendar.html)
- [Taiwan almanac traditions — Taiwan Panorama](https://www.taiwan-panorama.com/en/Articles/Details?Guid=41034fa3-c237-47de-982e-f7e59c82385f&CatId=8&postname=Is+Today+a+Good+Day+to+Read+this+Article?+--Better+Check+the+Chinese+Almanac...)
- [Fake Leap Months paper — Aslaksen (ResearchGate)](https://www.researchgate.net/publication/250375165_Fake_Leap_Months_in_the_Chinese_Calendar_From_the_Jesuits_to_2033)
- [Mathematics of the Chinese Calendar — Aslaksen (PDF)](https://gwern.net/doc/science/physics/astronomy/2010-aslaksen.pdf)
- [2033 Unusual Leap Month — SingaporeanLifeStyle](https://www.singaporeanlifestyle.com/traditional-chinese-culture/year-2033-the-unusual-leap-month/)
- [LTE440 Lunar Time Ephemeris — A&A](https://www.aanda.org/articles/aa/full_html/2025/12/aa57345-25/aa57345-25.html)
- [Zhen Bu Tang vs Wing King Tong — stationery.hk](https://stationery.hk/blog/%E7%9C%9F%E6%AD%A5%E5%A0%82%E9%80%9A%E5%8B%9D%E5%92%8C%E6%B0%B8%E7%B6%93%E5%A0%82%E9%80%9A%E5%8B%9D%E6%9C%89%E4%BB%80%E9%BA%BC%E5%88%86%E5%88%A5)
- [HKO Almanac 2026](https://www.hko.gov.hk/en/gts/astron2026/almanac2026_index.htm)
