# 神煞方位 Deity Directions

Four deities have daily compass directions determined by the **day stem** (日干). These are used in 擇日 (date selection) and feng shui applications to determine auspicious directions for the day.

## The Four Deities

| Deity | Chinese | Purpose |
|-------|---------|---------|
| Wealth God | 財神 | Direction for financial activities |
| Joy God | 喜神 | Direction for celebrations, weddings |
| Fortune God | 福神 | Direction for general blessings |
| Noble God | 貴神 | Direction for seeking help from patrons |

## Direction Tables

### 財神 Wealth God

| Day Stem | 甲 | 乙 | 丙 | 丁 | 戊 | 己 | 庚 | 辛 | 壬 | 癸 |
|----------|---|---|---|---|---|---|---|---|---|---|
| Direction | 東北 | 東北 | 西南 | 西南 | 正北 | 正北 | 正東 | 正東 | 正南 | 正南 |

**Pattern:** Stems pair by yin/yang of same element. 甲乙(木)→東北, 丙丁(火)→西南, 戊己(土)→正北, 庚辛(金)→正東, 壬癸(水)→正南.

### 喜神 Joy God

| Day Stem | 甲 | 乙 | 丙 | 丁 | 戊 | 己 | 庚 | 辛 | 壬 | 癸 |
|----------|---|---|---|---|---|---|---|---|---|---|
| Direction | 東北 | 西北 | 西南 | 正南 | 東南 | 東北 | 西北 | 西南 | 正南 | 東南 |

**Pattern:** Follows a 5-cycle by 五合 pairs: 甲己→東北, 乙庚→西北, 丙辛→西南, 丁壬→正南, 戊癸→東南.

### 福神 Fortune God

| Day Stem | 甲 | 乙 | 丙 | 丁 | 戊 | 己 | 庚 | 辛 | 壬 | 癸 |
|----------|---|---|---|---|---|---|---|---|---|---|
| Direction | 東南 | 東北 | 正東 | 正南 | 正北 | 正北 | 西南 | 東南 | 西北 | 西南 |

### 貴神 Noble God

| Day Stem | 甲 | 乙 | 丙 | 丁 | 戊 | 己 | 庚 | 辛 | 壬 | 癸 |
|----------|---|---|---|---|---|---|---|---|---|---|
| Direction | 西南 | 正北 | 西北 | 正西 | 東北 | 東北 | 西南 | 正南 | 正南 | 東南 |

Based on the primary 天乙貴人 (Heavenly Noble) position.

## API

```typescript
import { getDeityDirections, getDeityDirectionsForDate } from 'stembranch';

// From day stem
getDeityDirections('甲');
// → { wealth: '東北', joy: '東北', fortune: '東南', noble: '西南' }

// From date (computes day pillar automatically)
getDeityDirectionsForDate(new Date(2024, 5, 15));
// → { wealth: '正南', joy: '正南', fortune: '西北', noble: '正南' }
```
