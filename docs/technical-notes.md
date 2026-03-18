# Technical Notes

Implementation details, algorithmic design decisions, data sources, and reference analysis for the stembranch library.

## Table of Contents

- [Design Decisions](#design-decisions)
- [Data Sources](#data-sources)
- [Accuracy Detail](#accuracy-detail)
- [Timezone & DST](#timezone--dst)

---

## Design Decisions

### Year boundary: 立春 (Start of Spring), not January 1

The 干支 year starts at 立春, the moment the sun reaches ecliptic longitude 315°. This falls around February 3-5 each year. A person born on January 20, 2024 belongs to the 癸卯 year (2023's stem-branch), not 甲辰 (2024's).

The library computes the exact 立春 moment using full VSOP87D planetary theory (2,425 terms) with DE405 correction and sxwnl-derived DeltaT, achieving sub-second precision.

### 子時 (Midnight Hour) crosses calendar days

子時 runs from 23:00 to 00:59, crossing the calendar midnight boundary. At 23:00+, the hour branch is 子 and the hour stem uses the *next* day's stem for the 甲己還加甲 rule. The day pillar itself does not advance until 00:00.

### 小寒 (Minor Cold) starts 丑月

The 12 month boundaries are defined by 節 (Jie) solar terms. 小寒 (~January 6) starts 丑月, and 立春 (~February 4) starts 寅月. Dates between 小寒 and 立春 belong to 丑月 of the *previous* stem-branch year.

### Solar longitude computation

Solar longitude is computed from VSOP87D heliocentric Earth coordinates (2,425 terms), converted to geocentric, with:

1. **DE405 correction** — sxwnl's fitted polynomial compensating for VSOP87 truncation
2. **IAU2000B nutation** — 77-term lunisolar nutation in longitude (Δψ)
3. **Aberration correction** — Ron & Vondrak constant (~20.4898″)

No external precession or FK5 correction is needed because VSOP87D operates in the ecliptic of date (precession is built into the coefficients).

### DeltaT (ΔT) model

TT = UT + ΔT. The model uses three regimes:

| Period | Method | Source |
|--------|--------|--------|
| Before 2016 | Polynomial fits | Espenak & Meeus (2006) |
| 2016-2050 | Cubic spline table | sxwnl (許劍偉) |
| After 2050 | Parabolic extrapolation | Morrison & Stephenson (2004) |

### Lunar calendar algorithm

The lunar calendar uses a 冬至-anchor approach:

1. Find the 冬至 (Winter Solstice) moment for the target year and adjacent years
2. Enumerate all new moons (Meeus Ch. 49) between consecutive 冬至 dates
3. Count months: if there are 13 new moons between two 冬至, one month is intercalary (閏月)
4. The intercalary month is the first month that does not contain a 中氣 (Zhongqi solar term)
5. Month numbering follows the 中氣 assignment rule, handling the 二〇三三年問題 correctly

---

## Data Sources

| Component | Source | Method |
|---|---|---|
| Solar longitude | VSOP87D | Full 2,425-term planetary theory + DE405 correction |
| New moon | Meeus Ch. 49 | 25 periodic + 14 planetary correction terms |
| Lunar calendar | Computed | 冬至-anchor algorithm with zhongqi month numbering |
| Julian Day | Meeus Ch. 7 | Julian/Gregorian calendar conversion |
| DeltaT (ΔT) | Espenak & Meeus + sxwnl | Polynomial (pre-2016), sxwnl cubic table (2016-2050), parabolic extrapolation (2050+) |
| Nutation | IAU2000B | 77-term lunisolar nutation series |
| Equation of Time | Spencer 1971 Fourier | Accurate to ~30 seconds |
| Timezone / DST | IANA Time Zone Database | Embedded transition table (78 timezones, 11,742 transitions, 1900-2026); `Intl` fallback for unknown timezones. See [Timezone & DST](#timezone--dst) below |
| City database | 143 cities, 11 regions | IANA timezone IDs + coordinates for solar time |
| Eclipse dates | NASA Five Millennium Canon | 23,962 eclipses (-1999 to 3000 CE) |
| Solar longitude reference | [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/) | DE441 numerical integration; independent ground truth for 3-way comparison |
| Day pillar | Arithmetic | Epoch: 2000-01-07 = 甲子日 |
| Stem/branch cycles | Lookup tables | Standard 10-stem, 12-branch sequences |

---

## Accuracy Detail

### Cross-validation against 寿星万年历 (sxwnl)

Validated against [sxwnl](https://github.com/sxwnl/sxwnl), the gold standard Chinese calendar library by 許劍偉:

| Test | Samples | Range | Result |
|---|---|---|---|
| Day Pillar (日柱) | 5,683 dates | 1583-2500 | **100%** match |
| Year Pillar (年柱) | 2,412 dates | 1900-2100 | **100%** match |
| Month Pillar (月柱) | 2,412 dates | 1900-2100 | **100%** match |
| Solar Terms (節氣) | 4,824 terms | 1900-2100 | avg **0.6s** deviation |
| Lunar New Year (農曆) | 61 dates | 1990-2050 | **100%** match |
| Intercalary Months (閏月) | 10 years | 2001-2025 | **100%** match |

Lunar calendar validated against Hong Kong Observatory / USNO data, including correct handling of the 二〇三三年問題 (2033 problem).

### Solar term timing precision

| Percentile | Deviation |
|---|---|
| P50 | 0.5 seconds |
| P95 | 1.4 seconds |
| P99 | 2.0 seconds |
| Max | 3.1 seconds |
| Within 1 min | 100% |

Full analysis with statistical charts: [accuracy.md](accuracy.md)

### Three-way comparison: stembranch vs sxwnl vs JPL Horizons

Both stembranch and sxwnl use VSOP87D-based solar longitude computation with similar correction pipelines (DE405, nutation, aberration). The ~0.6s average deviation between them likely reflects differences in DeltaT models, truncation order, and numerical precision rather than a fundamental accuracy difference. Neither can be independently declared "more accurate" than the other from a bilateral comparison alone.

[JPL Horizons](https://ssd.jpl.nasa.gov/horizons/) provides an independent third reference based on JPL's DE (Development Ephemeris) series (currently DE441). Horizons computes the Sun's apparent geocentric ecliptic longitude from numerical integration of the full solar system, not from analytical series like VSOP87D. This makes it suitable as a ground-truth reference for 3-way comparison:

| System | Basis | Independence |
|---|---|---|
| stembranch | VSOP87D (2,425 terms) + DE405 correction + IAU2000B nutation | Analytical series |
| sxwnl | VSOP87D + custom corrections | Analytical series (shared ancestry) |
| JPL Horizons | DE441 numerical integration | Fully independent methodology |

A 3-way comparison would determine whether the ~0.6s stembranch-vs-sxwnl deviation is dominated by one implementation's error or distributed between both. JPL Horizons solar longitude queries can be made via the [Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html) with `QUANTITIES=31` (observer ecliptic longitude) for the Sun (`COMMAND='10'`) as seen from Earth (`CENTER='500'`).

### The 2033 problem (二〇三三年問題)

In 2033, the standard Chinese lunar calendar algorithm produces an ambiguity in intercalary month assignment. The issue arises because:

1. Between the 冬至 (Winter Solstice) of 2033 and 2034, there are **13 lunar months** (13 new moons), requiring one to be designated intercalary (閏月)
2. The standard rule — "the first month without a 中氣 (Zhongqi) is the leap month" — identifies 月 11 (the 11th month) as lacking a Zhongqi
3. However, the 11th month has special status (it must contain 冬至), creating a conflict: can the 冬至-containing month be intercalary?

Different authorities have historically given different answers:

- **Purple Mountain Observatory (紫金山天文台)**: Designated 閏七月 (leap 7th month) for 2033, overriding the algorithmic result
- **Hong Kong Observatory**: Follows the same designation
- **Algorithmic result**: The strict "first month without Zhongqi" rule would produce 閏十一月

The stembranch implementation follows the 冬至-anchor algorithm with the standard Zhongqi assignment rule, which correctly produces the same result as the Purple Mountain Observatory and Hong Kong Observatory for 2033 (閏十一月 is avoided because the 11th month must contain 冬至, and the algorithm accounts for this constraint).

This is validated against HKO/USNO reference data in the test suite.

---

## Timezone & DST

The stembranch timezone module (`src/timezone.ts`) provides historically-accurate wall-clock ↔ UTC ↔ true solar time conversion using an embedded IANA transition table as the primary data source.

### Embedded transition table

The library ships with a pre-extracted IANA transition table (`src/tz-data.ts`) covering 78 timezones, 11,742 transitions (1900-2026), generated from the system's `zdump` utility. This ensures:

- **Determinism**: identical results across all platforms and OS versions, regardless of system tzdata version
- **Auditability**: the transition data is visible TypeScript source, not an opaque OS API call
- **Correctness for Chinese metaphysics**: a 1-hour DST error can flip the entire hour pillar in Four Pillars calculation — the embedded table eliminates platform-dependent `Intl.DateTimeFormat` variance as a source of error

For timezones not in the embedded database, the module falls back to `Intl.DateTimeFormat`.

Many Chinese metaphysics tools require manual DST correction (e.g., "if born during PRC DST 1986-1991, subtract 1 hour"). The stembranch approach automates this: `localToUtc()` and `getUtcOffset()` look up the embedded transition table for the target IANA timezone, getting historically-correct offsets — including obscure transitions like Singapore's UTC+7:30 → UTC+8 shift on 1982-01-01.

The comprehensive test suite (`tests/timezone.test.ts`, 340+ tests; `tests/tz-data.test.ts`, 42 tests) serves as verified documentation of historical DST transitions, with cross-validation against `Intl` and against the primary sources listed below.

### Sources

#### Primary / Authoritative

| Source | Coverage | Notes |
|--------|----------|-------|
| [IANA Time Zone Database](https://www.iana.org/time-zones) | Global, all years | The canonical source. Backed by every major OS. Our `Intl` calls read from this database. |
| [HKO Summer Time](https://www.hko.gov.hk/tc/gts/time/Summertime.htm) | Hong Kong 1941-1979 | Official Hong Kong Observatory record of all 33 summer time years. Definitive for HK. |
| [ITU-T SP LT.1-2015](https://www.itu.int/dms_pub/itu-t/opb/sp/T-SP-LT.1-2015-PDF-E.pdf) | Global standard offsets | International Telecommunication Union standard time zone designations and UTC offsets. |
| [CRS Report R45208](https://www.congress.gov/crs-product/R45208) | US DST history | US Congressional Research Service: comprehensive legislative history of Daylight Saving Time. |
| [台灣省政府公報](https://www.th.gov.tw/Epaper_Content/238/6535/) | Taiwan timezone history | Official ROC government record: 三更燈火五更雞—臺灣時間的故事. Covers Japanese colonial era through modern Taiwan. |

#### Wikipedia (Comprehensive Secondary)

| Source | Coverage |
|--------|----------|
| [Daylight saving time by country](https://en.wikipedia.org/wiki/Daylight_saving_time_by_country) | Global DST overview |
| [Hong Kong Time](https://en.wikipedia.org/wiki/Hong_Kong_Time) | HK timezone history |
| [Singapore Time](https://en.wikipedia.org/wiki/Singapore_Time) | SG timezone transitions (UTC+7, +7:20, +7:30, +8) |
| [Time in China](https://en.wikipedia.org/wiki/Time_in_China) | PRC five zones → single zone, DST 1986-1991 |
| [Time in Indonesia](https://en.wikipedia.org/wiki/Time_in_Indonesia) | ID three-zone system history |
| [Time in Malaysia](https://en.wikipedia.org/wiki/Time_in_Malaysia) | MY UTC+7:30 → UTC+8 (1982) |
| [Time in Taiwan](https://en.wikipedia.org/wiki/Time_in_Taiwan) | ROC timezone and DST history |
| [臺灣日治時期年表](https://zh.wikipedia.org/zh-tw/臺灣日治時期年表) | Taiwan under Japanese rule timeline |

#### Historical / Editorial

| Source | Coverage | Notes |
|--------|----------|-------|
| [WeToastHK DST History](https://www.wetoasthk.com/1010-2/) | Hong Kong 1941-1979 | Detailed historical narrative with legislative context. Cites original LegCo documents and SCMP reports. Provides transition times not available from HKO. |
| [BBC中文 時區](https://www.bbc.com/zhongwen/trad/chinese-news-41789080) | Taiwan, PRC, Japan | Taiwan 2017 timezone petition; historical context of PRC/ROC/Japan timezone politics. |

### Known Discrepancies Between Sources

#### High Severity

##### 1. Wikipedia "DST by country" — Taiwan errors

The [Daylight saving time by country](https://en.wikipedia.org/wiki/Daylight_saving_time_by_country) article (Asia section) contains three factual errors about Taiwan:

- Claims DST started "from 1945" — should be **1946** (per IANA, th.gov.tw, and Wikipedia's own "Time in Taiwan" article)
- States DST was "revoked from 1976-79 and reinstated in 1980" — actually **1979 had DST** (starting July 1) and **1980 did not**
- Says "abandoned from 1981" — should be **1980** (last DST year was 1979)

**Our approach:** We follow IANA and the th.gov.tw primary source. Our test suite verifies DST status for every documented Taiwan DST year (1946-1961, 1974-1975, 1979) and confirms no DST in gap years (1962-1973, 1976-1978, 1980+).

#### Medium Severity

##### 2. HKO vs IANA: 1946 Hong Kong start date

- **HKO** says summer time started **April 20, 1946**
- **IANA tzdata** encodes the transition on **April 21 at 00:00**
- **[WeToastHK](https://www.wetoasthk.com/1010-2/)** explains this by citing the original LegCo document, which specifies April 20 at **17:00** — IANA likely rounded to midnight of the next calendar day

**Our approach:** We follow IANA (since `Intl` reads from IANA). The practical difference is 7 hours on one day in 1946.

##### 3. HKO vs WeToastHK/IANA: 1942-1945 characterization

- **HKO** labels 1942-1945 as "whole year" summer time in its tabulation
- **[WeToastHK](https://www.wetoasthk.com/1010-2/)** explicitly criticizes this as misleading: it was Japanese occupation forcing **JST (GMT+9)**, not DST. Hong Kong's civil government did not legislate summer time; Japan imposed its standard time.
- **IANA** correctly models it as a **zone change** to JST, not a Rule-based DST transition

**Our approach:** We follow IANA's modeling (zone change, not DST rule). The `isDst()` function correctly returns `false` for this period since the offset is the same year-round.

##### 4. HKO vs IANA: 1945 end date

- **HKO**'s "whole year" for 1945 implies summer time through December 31
- **IANA and [WeToastHK](https://www.wetoasthk.com/1010-2/)** (citing SCMP) record standard time restored on **November 18, 1945**, after the Japanese surrender

**Our approach:** We follow IANA/WeToastHK.

##### 5. HKO vs WeToastHK vs IANA: 1946 transition time

- **HKO** gives no transition times in its table
- **[WeToastHK](https://www.wetoasthk.com/1010-2/)** cites LegCo documents specifying **17:00** (5:00 PM)
- **IANA** uses **00:00** (midnight)

These are irreconcilable for the same date. WeToastHK's citation of primary legislative documents is the most authoritative for the actual enacted time, but IANA's midnight convention is what software implementations use.

##### 6. PRC DST rule description

The IANA rule for PRC DST is `Sun>=11` (the first Sunday on or after April 11). This is commonly described in secondary sources as "the second Sunday of April," which is incorrect: when April 1 falls on Friday, Saturday, or Sunday (as in 1988, 1989, 1990), the rule yields the **third** Sunday.

| Year | April 1 weekday | Sun>=11 date | "2nd Sunday" date | Match? |
|------|----------------|--------------|-------------------|--------|
| 1986 | Tuesday | Apr 13 (2nd Sun) | Apr 13 | Yes |
| 1987 | Wednesday | Apr 12 (2nd Sun) | Apr 12 | Yes |
| 1988 | Friday | Apr 17 (**3rd** Sun) | Apr 10 | **No** |
| 1989 | Saturday | Apr 16 (**3rd** Sun) | Apr 9 | **No** |
| 1990 | Sunday | Apr 15 (**3rd** Sun) | Apr 8 | **No** |
| 1991 | Monday | Apr 14 (2nd Sun) | Apr 14 | Yes |

**Our approach:** Our test suite verifies the exact IANA transition dates for all 6 years (1986-1991), which is more precise than any verbal rule description.

#### Low Severity

##### 7. Header comment scope: "Hong Kong summer time 1946-1979"

The stembranch `timezone.ts` header comment mentions "Hong Kong summer time 1946-1979." This excludes the initial 1941 summer time period and the 1942-1945 Japanese occupation years. This is intentional scoping — the 1941 period was a single wartime instance, and 1942-1945 was JST imposition, not legislated summer time. However, it's technically incomplete as a statement of HK's summer time history.

### Items With No Discrepancy

The following facts are consistent across all consulted sources:

- **Singapore UTC+7:30 → UTC+8**: All sources agree on January 1, 1982
- **US DST rules**: CRS Report R45208 and IANA are fully consistent
- **HK 1973-74 oil crisis**: All three HK sources agree DST was extended from December 30, 1973 through October 20, 1974 (continuous across winter)
- **PRC DST year range**: 1986-1991, all transitions at 02:00 local time
- **Taiwan core DST years**: 1946-1961, 1974-1975, 1979 — agreed by IANA, th.gov.tw, and Wikipedia "Time in Taiwan"
- **HKO "33 years" count**: Correctly excludes the 4 occupation years (1942-1945)

### Test Suite as Living Documentation

The stembranch timezone test suite (`tests/timezone.test.ts`) contains 340+ tests that serve as machine-verifiable documentation of historical DST transitions. Key sections:

- **PRC DST exact boundaries**: All 6 years (1986-1991), day before/after/during for each transition
- **HK summer time all years**: Every documented year (1946-1976, 1979) verified at UTC+9 in August
- **Taiwan DST all years**: Every DST year (1946-1961, 1974-1975, 1979) and gap years verified
- **Singapore historical offsets**: UTC+7:30 (1970) → UTC+8 (post-1982) transition
- **Worldwide coverage**: Japan, Korea (N+S), Mongolia, Southeast Asia, South Asia, Middle East, Europe, Americas, Oceania, Africa
- **Edge cases**: Half-hour offsets (India +5:30, Nepal +5:45), quarter-hour (Eucla +8:45), date boundary crossings, leap years, DST spring-forward gaps

### WeToastHK: Unique Contributions

The [WeToastHK article](https://www.wetoasthk.com/1010-2/) provides several details not available from the HKO official table or Wikipedia:

1. **Transition times** from original LegCo documents (e.g., 1946: 17:00)
2. **Legislative context**: specific ordinance numbers and amendment dates
3. **Japanese occupation analysis**: explains why 1942-1945 should not be classified as "summer time"
4. **1945 restoration date**: November 18, citing South China Morning Post
5. **1973-74 oil crisis narrative**: context for the unprecedented winter DST extension
6. **Detailed HK summer time transition at 03:30**: notes that HK uniquely used 03:30 as the transition time (most jurisdictions use 02:00)
