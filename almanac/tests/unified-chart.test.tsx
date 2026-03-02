import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { UnifiedChart } from '../src/components/unified-chart';
import { computeQiMenForDate, computeZiWei } from 'stembranch';
import type { SixRenChart, QiMenChart, ZiWeiChart } from 'stembranch';
import { dailyAlmanac } from 'stembranch';

const date = new Date(Date.UTC(2024, 5, 15, 6));
const almanac = dailyAlmanac(date);
const qimen = computeQiMenForDate(date);
const polaris = computeZiWei({
  year: 1990, month: 8, day: 15, hour: 6, gender: 'male',
});

describe('UnifiedChart', () => {
  it('should render without data (empty state)', () => {
    const { container } = render(<UnifiedChart />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    // Should show fallback center text
    expect(container.textContent).toContain('三式合盤');
  });

  it('should render all three rings with data', () => {
    const { container } = render(
      <UnifiedChart
        polaris={polaris}
        sixRen={almanac.sixRen}
        qimen={qimen}
      />,
    );
    const svg = container.querySelector('svg')!;
    // Should have sector paths for all rings: 12 + 12 + 8 = 32, plus center circle
    const paths = svg.querySelectorAll('path');
    expect(paths.length).toBe(32);
  });

  it('should render 12 branch labels in outer ring', () => {
    const { container } = render(
      <UnifiedChart sixRen={almanac.sixRen} qimen={qimen} />,
    );
    const text = container.textContent || '';
    for (const br of '子丑寅卯辰巳午未申酉戌亥') {
      expect(text).toContain(br);
    }
  });

  it('should render 8 trigram names in inner ring', () => {
    const { container } = render(<UnifiedChart qimen={qimen} />);
    const text = container.textContent || '';
    for (const tri of ['坎', '艮', '震', '巽', '離', '坤', '兌', '乾']) {
      expect(text).toContain(tri);
    }
  });

  it('should render 中宮 with qimen data', () => {
    const { container } = render(<UnifiedChart qimen={qimen} />);
    expect(container.textContent).toContain('中宮');
    expect(container.textContent).toContain(qimen.escapeMode);
  });

  it('should render polaris palace names when birth data provided', () => {
    const { container } = render(<UnifiedChart polaris={polaris} />);
    const text = container.textContent || '';
    expect(text).toContain('命宮');
    expect(text).toContain('財帛宮');
  });

  it('should render 六壬 generals', () => {
    const { container } = render(
      <UnifiedChart sixRen={almanac.sixRen} />,
    );
    const text = container.textContent || '';
    // Should contain at least one general name
    expect(text).toContain('貴人');
  });

  it('should render legend', () => {
    const { container } = render(<UnifiedChart />);
    const text = container.textContent || '';
    expect(text).toContain('紫微斗數');
    expect(text).toContain('大六壬');
    expect(text).toContain('奇門遁甲');
  });
});
