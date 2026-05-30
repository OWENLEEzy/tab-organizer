import type { Section } from '../types';

export const DEFAULT_SECTIONS: Section[] = [
  {
    id: 'section-dev',
    name: 'Dev',
    order: 0,
    autoRules: [
      { pattern: 'github|jira|gitlab|stackoverflow|localhost|bitbucket|sourceforge|gitea|launchpad', type: 'hostname' }
    ]
  },
  {
    id: 'section-work',
    name: 'Work',
    order: 1,
    autoRules: [
      { pattern: 'google\\.com|slack|loom|zoom|airtable|confluence|asana|clickup|todoist|linear|trello|basecamp|monday|teamviewer|anydesk', type: 'hostname' }
    ]
  },
  {
    id: 'section-media',
    name: 'Media',
    order: 2,
    autoRules: [
      { pattern: 'youtube|twitter|x\\.com|reddit|instagram|tiktok|bilibili|twitch|steam|epicgames|roblox', type: 'hostname' }
    ]
  },
  {
    id: 'section-shopping',
    name: 'Shopping',
    order: 3,
    autoRules: [
      { pattern: 'amazon|taobao|jd\\.com|shopee|aliexpress|ebay|walmart|target|bestbuy|etsy', type: 'hostname' }
    ]
  },
  {
    id: 'section-academic',
    name: 'Academic',
    order: 4,
    autoRules: [
      { pattern: 'arxiv|scholar\\.google|pubmed|ieee|acm\\.org|jstor|nature|science\\.org|sciencedirect|springer|wiley|researchgate|semanticscholar|阑|center|plos|frontiersin|mdpi|hindawi|biorxiv|medrxiv', type: 'hostname' }
    ]
  },
  {
    id: 'section-social',
    name: 'Social',
    order: 5,
    autoRules: [
      { pattern: 'linkedin|discord|telegram|whatsapp|weixin\\.com|wechat|signal| IRC|reddit\\.com/message', type: 'hostname' }
    ]
  },
  {
    id: 'section-news',
    name: 'News',
    order: 6,
    autoRules: [
      { pattern: 'news\\.google|bbc|nytimes|theguardian|reuters|bloomberg|wsj|apnews|usatoday|washingtonpost|latimes|huffpost|axios|theintercept|propublica|fivethirtyeight', type: 'hostname' }
    ]
  },
  {
    id: 'section-finance',
    name: 'Finance',
    order: 7,
    autoRules: [
      { pattern: 'chase|wellsfargo|robinhood|coinbase|binance|tradingview|fidelity|vanguard|schwab|ameritrade|paypal|venmo|cashapp|stripe|bankofamerica|citibank|usbank', type: 'hostname' }
    ]
  },
  {
    id: 'section-cloud',
    name: 'Cloud',
    order: 8,
    autoRules: [
      { pattern: 'drive\\.google|dropbox|icloud|onedrive|box\\.com|mega|nzbd|mediafire', type: 'hostname' }
    ]
  },
  {
    id: 'section-ai',
    name: 'AI',
    order: 9,
    autoRules: [
      { pattern: 'openai|anthropic|chatgpt|claude|gemini|deepseek|perplexity|huggingface|replicate|ollama|groq|mistral|cohere|aws[ _]bedrock|azure ai', type: 'hostname' }
    ]
  },
  {
    id: 'section-devops',
    name: 'DevOps',
    order: 10,
    autoRules: [
      { pattern: 'aws\\.com|azure\\.com|gcp|googleapis|cloudflare|digitalocean|heroku|vercel|netlify|render| Railway|fly\\.io|supabase|firebase|datadog|sentry|grafana|prometheus|jenkins|travis|circleci|github\\.com/actions|gitlab\\.com/ci', type: 'hostname' }
    ]
  },
  {
    id: 'section-design',
    name: 'Design',
    order: 11,
    autoRules: [
      { pattern: 'figma|sketch|adobe|canva|framer|webflow|dribbble|behance|invision|marvel|principle|zeplin|abstract|plantuml|excalidraw|miro|figjam', type: 'hostname' }
    ]
  },
  {
    id: 'section-productivity',
    name: 'Productivity',
    order: 12,
    autoRules: [
      { pattern: 'obsidian|roam|logseq|notion|coda|evernote|microsoft[ _]onenote|apple[ _]notes|ticktick|any\\.do|habitica|anotepad|pomodorotracker|forest', type: 'hostname' }
    ]
  },
  {
    id: 'section-maps',
    name: 'Maps',
    order: 13,
    autoRules: [
      { pattern: 'maps\\.google|google\\.com/maps|bing\\.com/maps|mapquest|wikimedia|openstreetmap|gismastery', type: 'hostname' }
    ]
  },
  {
    id: 'section-travel',
    name: 'Travel',
    order: 14,
    autoRules: [
      { pattern: 'booking\\.com|airbnb|expedia|tripadvisor|kayak|hotels\\.com|hostelworld|couchsurfing|hostel|trivago|priceline|cheaptickets|flightcentre|airline\\.com|united|delta|american eagle|southwest|lufthansa|ba\\.com|france\\.com|ryanair|easyjet', type: 'hostname' }
    ]
  },
  {
    id: 'section-music',
    name: 'Music',
    order: 15,
    autoRules: [
      { pattern: 'spotify|soundcloud|bandcamp|apple\\.com/music|youtube\\.com/music|deezer|tidal|pandora|musify|qq\\.music', type: 'hostname' }
    ]
  }
];

const DEFAULT_SECTION_IDS = new Set(DEFAULT_SECTIONS.map((section) => section.id));

export function isDefaultSectionId(sectionId: string): boolean {
  return DEFAULT_SECTION_IDS.has(sectionId);
}
