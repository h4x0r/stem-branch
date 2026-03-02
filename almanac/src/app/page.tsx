'use client';

import { useState, useMemo } from 'react';
import {
  dailyAlmanac, computeQiMenForDate, computeZiWei, gregorianToLunar,
} from 'stembranch';
import type { ZiWeiChart } from 'stembranch';
import { AlmanacView } from '@/components/almanac-view';
import { DateNav } from '@/components/date-nav';
import { ExportButton } from '@/components/export-button';
import { UnifiedChart } from '@/components/unified-chart';

function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fromLocalDateString(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 6, 0)); // noon CST ~ 06:00 UTC
}

const HOUR_LABELS = '子丑寅卯辰巳午未申酉戌亥'.split('');

export default function Home() {
  const [dateStr, setDateStr] = useState(() => toLocalDateString(new Date()));

  // Birth data state for 紫微斗數
  const [showBirth, setShowBirth] = useState(false);
  const [birthStr, setBirthStr] = useState('');
  const [birthHour, setBirthHour] = useState(0);
  const [gender, setGender] = useState<'male' | 'female'>('male');

  const date = useMemo(() => fromLocalDateString(dateStr), [dateStr]);
  const almanac = useMemo(() => dailyAlmanac(date), [date]);
  const qimen = useMemo(() => computeQiMenForDate(date), [date]);

  const polaris = useMemo((): ZiWeiChart | null => {
    if (!showBirth || !birthStr) return null;
    try {
      const [y, m, d] = birthStr.split('-').map(Number);
      const bd = new Date(Date.UTC(y, m - 1, d, 6));
      const lunar = gregorianToLunar(bd);
      return computeZiWei({
        year: lunar.year,
        month: lunar.month,
        day: lunar.day,
        hour: birthHour,
        gender,
      });
    } catch {
      return null;
    }
  }, [showBirth, birthStr, birthHour, gender]);

  const handlePrev = () => {
    const d = fromLocalDateString(dateStr);
    d.setUTCDate(d.getUTCDate() - 1);
    setDateStr(toLocalDateString(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())));
  };

  const handleNext = () => {
    const d = fromLocalDateString(dateStr);
    d.setUTCDate(d.getUTCDate() + 1);
    setDateStr(toLocalDateString(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())));
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-center text-2xl font-bold tracking-wide mb-1">
          日曆總覽
        </h1>
        <p className="text-center text-sm text-muted-foreground mb-6">
          stembranch almanac
        </p>

        <DateNav
          dateStr={dateStr}
          onChange={setDateStr}
          onPrev={handlePrev}
          onNext={handleNext}
        />

        {/* ── 三式合盤 ──────────────────────────────────── */}
        <section className="my-6">
          <h2 className="text-center text-lg font-semibold mb-3">三式合盤</h2>

          {/* Birth input toggle for 紫微 outer ring */}
          <div className="mb-3 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showBirth}
                onChange={() => setShowBirth(!showBirth)}
              />
              紫微斗數排盤（輸入出生資料）
            </label>
            {showBirth && (
              <div className="flex flex-wrap gap-3 mt-2 items-center pl-6">
                <input
                  type="date"
                  value={birthStr}
                  onChange={(e) => setBirthStr(e.target.value)}
                  className="border rounded px-2 py-1 text-sm bg-background"
                />
                <select
                  value={birthHour}
                  onChange={(e) => setBirthHour(Number(e.target.value))}
                  className="border rounded px-2 py-1 text-sm bg-background"
                >
                  {HOUR_LABELS.map((h, i) => (
                    <option key={i} value={i}>{h}時</option>
                  ))}
                </select>
                <div className="flex gap-3">
                  {(['male', 'female'] as const).map((g) => (
                    <label key={g} className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        checked={gender === g}
                        onChange={() => setGender(g)}
                      />
                      {g === 'male' ? '男' : '女'}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <UnifiedChart
            polaris={polaris}
            sixRen={almanac.sixRen}
            qimen={qimen}
          />
        </section>

        <AlmanacView almanac={almanac} />

        <div className="flex justify-center mt-6">
          <ExportButton almanac={almanac} />
        </div>

        <footer className="text-center text-xs text-muted-foreground mt-8">
          Powered by{' '}
          <a
            href="https://github.com/h4x0r/stembranch"
            className="underline hover:text-foreground"
            target="_blank"
            rel="noopener noreferrer"
          >
            stembranch
          </a>
        </footer>
      </div>
    </main>
  );
}
