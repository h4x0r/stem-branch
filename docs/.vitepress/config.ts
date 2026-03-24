import { defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';

export default withMermaid(defineConfig({
  title: 'stem-branch',
  description: 'Chinese calendar and stem-branch algorithms — reference documentation',
  base: '/stem-branch/',
  lang: 'zh-Hant',
  head: [
    ['meta', { name: 'theme-color', content: '#b91c1c' }],
  ],
  themeConfig: {
    nav: [
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
    ],
    search: {
      provider: 'local',
    },
    outline: {
      level: [2, 3],
    },
  },
}));
