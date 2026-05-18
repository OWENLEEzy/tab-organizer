import type { ManualGroup } from '../types';

export const DEFAULT_SPACES: ManualGroup[] = [
  {
    id: 'space-dev',
    name: 'Dev',
    order: 0,
    emoji: '🛠',
    autoRules: [
      { pattern: 'github|vercel|linear|jira|gitlab|stackoverflow|localhost|figma', type: 'hostname' }
    ]
  },
  {
    id: 'space-work',
    name: 'Work',
    order: 1,
    emoji: '📝',
    autoRules: [
      { pattern: 'notion|google\\.com|slack|loom|zoom|airtable|confluence', type: 'hostname' }
    ]
  },
  {
    id: 'space-media',
    name: 'Media',
    order: 2,
    emoji: '🎬',
    autoRules: [
      { pattern: 'youtube|twitter|x\\.com|reddit|instagram|tiktok|bilibili', type: 'hostname' }
    ]
  },
  {
    id: 'space-shopping',
    name: 'Shopping',
    order: 3,
    emoji: '🛒',
    autoRules: [
      { pattern: 'amazon|taobao|jd\\.com|shopee|aliexpress', type: 'hostname' }
    ]
  }
];
