# README & GitHub Pages Retargeting

## Goal

Split content between two surfaces with distinct audiences:

- **README** → developers evaluating the library on npm/GitHub. Must convince fast with hard numbers.
- **GitHub Pages** → long-term reference for English-speaking practitioners of Chinese metaphysics (astrologers, divinators, BaZi consultants) who may have no coding background. Must be SEO-friendly so searches for terms like 神煞, 天乙貴人, 建除十二神 land here.

## Audiences

### README: Developers

Scanning npm or GitHub. Deciding in 30 seconds whether to `npm install`. They care about:

1. Accuracy (hard numbers, not marketing claims)
2. Breadth (does it cover what I need?)
3. API surface (what does the import look like?)
4. Dependencies and size (zero is a selling point)

They do NOT read 700 lines. They skim the first screen, check the accuracy table, glance at the API summary, and either install or move on.

### GitHub Pages: Practitioners

English-speaking learners and practitioners of Chinese metaphysics. Searching Google for specific terms. They care about:

1. "What is 天乙貴人?" — definitions, derivation rules, lookup tables
2. "How are solar terms calculated?" — algorithm explanations they can trust
3. "Is this library accurate?" — validation data as credibility signal
4. Reference material they currently get from books, apps, or Chinese-language sites

They do NOT read TypeScript type definitions. They need plain-language explanations with Chinese terms prominently displayed.

---

## README Design (~300 lines)

### Structure

```
1. Hero block (5 lines)
   - Package name
   - One-line claim: "most accurate open-source Chinese calendar engine"
   - Key metric: "1.05 seconds mean vs JPL DE441 across 2,300 years"
   - "Zero dependencies. TypeScript."
   - Badges (npm, Apache-2.0, coverage, TypeScript)

2. Accuracy proof (~30 lines)
   - Table 1: vs JPL DE441 (4 rows: solar terms, EoT, planets, lunar phases)
   - Table 2: vs sxwnl head-to-head (5 rows: mean, max, range, extended, timeline %)
   - One-line link to full accuracy report

3. Install (3 lines)
   - npm install command
   - "Zero production dependencies. Works in Node.js, browsers, edge runtimes."

4. Quick examples (~60 lines)
   - Four Pillars (四柱八字) — most common use case
   - Daily Almanac (日曆總覽) — shows breadth in one call
   - Seven Governors (七政四餘) — unique differentiator
   - No other examples in README

5. Grouped API summary (~80 lines)
   - One table per module (7 modules)
   - 3-5 representative exports per table (not exhaustive)
   - Each table ends with "[+ N more →](link)" to full API docs
   - Modules: Astronomy, Stem-Branch, Four Pillars, Almanac,
     Divination, Seven Governors, Timezone

6. Documentation links (~10 lines)
   - Getting Started
   - API Reference (full)
   - Algorithms
   - Reference Tables
   - Accuracy Report

7. License (1 line)
   - Apache-2.0
```

### Writing principles (from positioning-angles + direct-response-copy skills)

- **Lead with proof, not claims.** The accuracy tables ARE the pitch. No "revolutionary" or "comprehensive."
- **Specific numbers only.** "1.05 seconds mean" not "highly accurate." "10,392 terms" not "extensively tested."
- **Head-to-head comparison.** The sxwnl table makes the choice visceral — every metric, side by side.
- **Three examples, not eight.** Each demonstrates a different value proposition: precision (pillars), breadth (almanac), uniqueness (seven governors).
- **Grouped API shows breadth without exhaustion.** Developer sees 7 modules with representative exports and knows the scope. Full reference is one click away.

### Content removed from README

The following currently lives in README and will be removed (moved to docs or dropped):

- Full API reference (all exports) → moves to GitHub Pages API Reference section
- TypeScript type definitions → moves to GitHub Pages API Reference section
- Luck Periods example → moves to Getting Started page
- Divination Systems example → moves to Getting Started page
- Timezone example → moves to Getting Started page
- Extensive almanac flag export tables → moves to API Reference

---

## GitHub Pages Design

### New sidebar structure

```
Getting Started
  - Install & Quick Start          (existing, updated with moved examples)

API Reference (NEW)
  - Astronomy                      (new page, from README)
  - Stem-Branch System             (new page, from README)
  - Four Pillars & Derivations     (new page, from README)
  - Almanac Features               (new page, from README)
  - Divination Systems             (new page, from README)
  - Seven Governors                (new page, from README)
  - Timezone & Location            (new page, from README)

Reference 參考 (existing, SEO-enhanced)
  - 神煞 Almanac Flags             (existing, SEO overhaul)
  - 建除十二神 Day Fitness          (existing, SEO overhaul)
  - 天德月德 Virtue Stars           (existing, SEO overhaul)
  - 神煞方位 Deity Directions       (existing, SEO overhaul)

Algorithms 算法 (existing, unchanged)
  - Overview
  - Solar Longitude
  - Four Pillars
  - Lunar Calendar

Validation 驗證 (existing, unchanged)
  - Accuracy
  - Technical Notes

Seven Governors 七政四餘 (NEW sidebar group)
  - Computation Methods            (existing orphan: seven-governors.md)
```

### API Reference pages (7 new pages)

Each page follows this template:

```markdown
---
title: "[Module Name] — stem-branch API Reference"
description: "[Brief description for search engines]"
---

# [Module Name]

[2-3 sentence description of what this module does]

## Exports

[Full table of all exports with descriptions — migrated from README]

## Types

[TypeScript type definitions relevant to this module — migrated from README]
```

### SEO treatment for reference pages

Each existing reference page (almanac-flags.md, day-fitness.md, virtue-stars.md,
deity-directions.md) gets:

1. **Frontmatter with SEO metadata:**
   ```yaml
   ---
   title: "神煞 Almanac Flags — Chinese Calendar Day Selection Reference"
   description: "Complete lookup tables for 30 Chinese almanac flags (神煞)
     including 天乙貴人, 驛馬, 桃花, 華蓋. Derivation rules, meanings, and
     classifications."
   head:
     - - meta
       - name: keywords
         content: "神煞, almanac flags, 天乙貴人, 驛馬, 桃花, Chinese calendar"
   ---
   ```

2. **H1 with Chinese + pinyin + English:**
   ```markdown
   # 神煞 Almanac Flags (Shén Shà)
   ```

3. **Plain-language introductions before lookup tables:**
   Each flag gets a human-readable explanation: what it is, when it appears,
   what it traditionally signifies. Written for practitioners, not developers.

4. **Pinyin in subheadings** where it aids search:
   ```markdown
   ### 天乙貴人 Tiān Yǐ Guì Rén — Heavenly Noble
   ```

### VitePress config changes

1. `lang: 'en'` (change from `zh-Hant` — content is English-primary)
2. `cleanUrls: true` — removes `.html` extensions for cleaner URLs
3. `lastUpdated: true` — shows freshness timestamps (Google favors updated content)
4. `sitemap` generation (VitePress built-in)
5. Default `head` tags for Open Graph:
   ```typescript
   ['meta', { property: 'og:type', content: 'website' }],
   ['meta', { property: 'og:site_name', content: 'stem-branch' }],
   ```
6. Add `seven-governors.md` to sidebar under new group
7. Update nav links to match new structure

### Additional SEO infrastructure

1. **`robots.txt`** in `docs/public/`:
   ```
   User-agent: *
   Allow: /
   Sitemap: https://h4x0r.github.io/stem-branch/sitemap.xml
   ```

2. **JSON-LD structured data** via VitePress `head` frontmatter on key pages:
   - `Article` schema on algorithm pages (solar-longitude, four-pillars, etc.)
   - `FAQPage` schema on reference pages if FAQ sections are added

3. **Internal cross-linking strategy:**
   - Every reference page links to related reference pages (almanac-flags ↔
     virtue-stars ↔ deity-directions ↔ day-fitness)
   - Algorithm pages link to corresponding API reference pages
   - API reference pages link back to algorithm explanations
   - Creates topic clusters that signal topical authority to search engines

4. **Canonical URLs** via VitePress `head` tag to prevent duplicate content
   from trailing-slash variants

5. **Google Search Console** submission (manual step post-deploy):
   - Submit sitemap at `https://h4x0r.github.io/stem-branch/sitemap.xml`
   - Verify ownership via GitHub Pages DNS or meta tag

6. **npm package as backlink** — ensure the npm `homepage` field in
   `package.json` points to the GitHub Pages docs site (high-authority backlink)

### Landing page (index.md) updates

- Update feature card: "29 Almanac Flags" → "30 Almanac Flags"
- Add feature card for Seven Governors
- Update tagline to include extended range data

### What stays orphaned

Research docs (`qimen-dunjia-research.md`, `research-da-liu-ren-monthly-generals.md`,
`research-zwds-intercalary-month.md`) remain unlinked — they're internal research
notes, not user-facing documentation.

---

## Consistency Fixes

| Issue | Current | Fix |
|-------|---------|-----|
| License | README says "MIT", badges/LICENSE say Apache-2.0 | Fix README to Apache-2.0 |
| Flag count | README + landing say "29", registry has 30 | Fix to 30 everywhere |
| "Ground truth" | README uses it, accuracy.md says "primary reference" | Align to "primary reference" |
| `lang` tag | `zh-Hant` | Change to `en` |
| seven-governors.md | Exists but not in sidebar | Add to sidebar |
| Getting Started | Missing moved examples | Add Luck, Divination, Timezone examples |

---

## Out of scope

- Rewriting the content of algorithm pages (overview, solar-longitude, four-pillars, lunar-calendar)
- Rewriting accuracy.md (already revised in previous session)
- Rewriting technical-notes.md
- Rewriting seven-governors.md content
- Adding new practitioner reference pages beyond the existing four (almanac-flags,
  day-fitness, virtue-stars, deity-directions). The 7 new API Reference pages are
  in scope — they are developer-facing, migrated from README.
- i18n / multi-language support
- Custom VitePress theme or components
