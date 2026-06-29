#!/usr/bin/env python3
"""Generate an independent lunisolar-calendar oracle fixture from cnlunar.

cnlunar (https://github.com/OPN48/cnlunar, LGPL-3.0) is a third-party Python
implementation of the Chinese lunisolar calendar. We use it as an *independent*
differential oracle for `gregorianToLunisolar` — the answer key is authored by
cnlunar, not by this project. Output: tests/fixtures/cnlunar-lunisolar.json.

Sampling: the 1st and 15th of every month, 1950-2050 (covers every lunar-month
transition and ~37 leap months over a century). Run: python3 scripts/gen-cnlunar-fixture.py
"""
import cnlunar
import datetime
import json
import os

START_YEAR = 1950
END_YEAR = 2050

out = []
for year in range(START_YEAR, END_YEAR + 1):
    for month in range(1, 13):
        for day in (1, 15):
            dt = datetime.datetime(year, month, day)
            a = cnlunar.Lunar(dt, godType="8char")
            out.append(
                {
                    "g": [year, month, day],
                    "l": [a.lunarMonth, a.lunarDay],
                    "leap": bool(a.isLunarLeapMonth),
                }
            )

path = os.path.join(
    os.path.dirname(__file__), "..", "tests", "fixtures", "cnlunar-lunisolar.json"
)
with open(path, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
print(f"wrote {len(out)} entries ({START_YEAR}-{END_YEAR}) to {os.path.relpath(path)}")
