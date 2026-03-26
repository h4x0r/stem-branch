import { defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';
import footnote from 'markdown-it-footnote';

export default withMermaid(defineConfig({
  title: 'stem-branch',
  description: 'The most accurate open-source Chinese calendar engine — solar terms, lunar calendar, BaZi, divination, and sidereal astrology from first principles.',
  base: '/stem-branch/',
  lang: 'en',
  cleanUrls: true,
  lastUpdated: true,
  markdown: {
    config: (md) => {
      md.use(footnote);
    },
  },
  sitemap: {
    hostname: 'https://h4x0r.github.io/stem-branch',
  },
  head: [
    ['meta', { name: 'theme-color', content: '#b91c1c' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'stem-branch' }],
    ['meta', { property: 'og:description', content: 'The most accurate open-source Chinese calendar engine — solar terms verified to 1.05 seconds against JPL DE441.' }],
  ],
  themeConfig: {
    nav: [
      { text: 'API Reference', link: '/api/astronomy' },
      { text: 'Reference', link: '/reference/almanac-flags' },
      { text: 'Algorithms', link: '/algorithms/overview' },
      { text: 'Accuracy', link: '/accuracy' },
      { text: 'npm', link: 'https://www.npmjs.com/package/@4n6h4x0r/stem-branch' },
      { text: 'GitHub', link: 'https://github.com/h4x0r/stem-branch' },
    ],
    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Install & Quick Start', link: '/getting-started' },
        ],
      },
      {
        text: 'API Reference',
        items: [
          { text: 'Astronomy', link: '/api/astronomy' },
          { text: 'Stem-Branch System', link: '/api/stem-branch' },
          { text: 'Four Pillars & Derivations', link: '/api/four-pillars' },
          { text: 'Almanac Features', link: '/api/almanac' },
          { text: 'Divination Systems', link: '/api/divination' },
          { text: 'Seven Governors', link: '/api/seven-governors' },
          { text: 'Timezone & Location', link: '/api/timezone' },
        ],
      },
      {
        text: 'Reference 參考',
        items: [
          { text: '神煞 Almanac Flags', link: '/reference/almanac-flags' },
          { text: '建除十二神 Day Fitness', link: '/reference/day-fitness' },
          { text: '天德月德 Virtue Stars', link: '/reference/virtue-stars' },
          { text: '神煞方位 Deity Directions', link: '/reference/deity-directions' },
        ],
      },
      {
        text: 'Algorithms 算法',
        items: [
          { text: 'Overview', link: '/algorithms/overview' },
          { text: 'Solar Longitude', link: '/algorithms/solar-longitude' },
          { text: 'Four Pillars', link: '/algorithms/four-pillars' },
          { text: 'Lunar Calendar', link: '/algorithms/lunar-calendar' },
        ],
      },
      {
        text: 'Validation 驗證',
        items: [
          { text: 'Accuracy', link: '/accuracy' },
          { text: 'Technical Notes', link: '/technical-notes' },
        ],
      },
      {
        text: 'Divination & Astrology 術數',
        items: [
          { text: '七政四餘 Seven Governors', link: '/seven-governors' },
          { text: '大六壬 Six Ren', link: '/da-liu-ren' },
          { text: '奇門遁甲 Mystery Gates', link: '/mystery-gates' },
          { text: '紫微斗數 Purple Star', link: '/zi-wei' },
        ],
      },
    ],
    search: {
      provider: 'local',
    },
    outline: {
      level: [2, 3],
    },
  },
}));
