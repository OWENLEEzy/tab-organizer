import type { Section } from '../types';

export const DEFAULT_SECTIONS: Section[] = [
  {
    id: 'section-dev',
    name: 'Dev',
    order: 0,
    emoji: '🛠',
    autoRules: [
      { pattern: 'github|vercel|linear|jira|gitlab|stackoverflow|localhost|figma', type: 'hostname' }
    ]
  },
  {
    id: 'section-work',
    name: 'Work',
    order: 1,
    emoji: '📝',
    autoRules: [
      { pattern: 'notion|google\\.com|slack|loom|zoom|airtable|confluence', type: 'hostname' }
    ]
  },
  {
    id: 'section-media',
    name: 'Media',
    order: 2,
    emoji: '🎬',
    autoRules: [
      { pattern: 'youtube|twitter|x\\.com|reddit|instagram|tiktok|bilibili', type: 'hostname' }
    ]
  },
  {
    id: 'section-shopping',
    name: 'Shopping',
    order: 3,
    emoji: '🛒',
    autoRules: [
      { pattern: 'amazon|taobao|jd\\.com|shopee|aliexpress', type: 'hostname' }
    ]
  }
];
