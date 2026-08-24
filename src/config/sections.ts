import type { Section, SectionAutoRule } from '../types';

/**
 * Onboarding candidates. These are NOT written to storage at install time —
 * the user picks and edits them once in the onboarding card, and only what
 * they confirm becomes a real Section. See design spec §3.1 and §3.9.
 */
export interface SectionTemplate {
  id: string;
  name: string;
  emoji: string;
  /** Already normalized: lowercase, no whitespace. */
  keywords: string[];
  /**
   * Preset coverage that cannot be expressed as a plain keyword (contains a
   * path segment, a character class, or a space). Never edited by the user —
   * `keywords` is the only editable surface in the onboarding card.
   */
  extraRules?: SectionAutoRule[];
}

export const SECTION_TEMPLATES: SectionTemplate[] = [
  {
    id: 'section-dev',
    name: 'Dev',
    emoji: '💻',
    keywords: ['github', 'jira', 'gitlab', 'stackoverflow', 'localhost', 'bitbucket', 'sourceforge', 'gitea', 'launchpad'],
  },
  {
    id: 'section-work',
    name: 'Work',
    emoji: '💼',
    keywords: ['google.com', 'slack', 'loom', 'zoom', 'airtable', 'confluence', 'asana', 'clickup', 'todoist', 'linear', 'trello', 'basecamp', 'monday', 'teamviewer', 'anydesk'],
  },
  {
    id: 'section-media',
    name: 'Media',
    emoji: '🎬',
    keywords: ['youtube', 'twitter', 'x.com', 'reddit', 'instagram', 'tiktok', 'bilibili', 'twitch', 'steam', 'epicgames', 'roblox'],
  },
  {
    id: 'section-shopping',
    name: 'Shopping',
    emoji: '🛒',
    keywords: ['amazon', 'taobao', 'jd.com', 'shopee', 'aliexpress', 'ebay', 'walmart', 'target', 'bestbuy', 'etsy'],
  },
  {
    id: 'section-academic',
    name: 'Academic',
    emoji: '🎓',
    keywords: ['arxiv', 'scholar.google', 'pubmed', 'ieee', 'acm.org', 'jstor', 'nature', 'science.org', 'sciencedirect', 'springer', 'wiley', 'researchgate', 'semanticscholar', '阑', 'center', 'plos', 'frontiersin', 'mdpi', 'hindawi', 'biorxiv', 'medrxiv'],
  },
  {
    id: 'section-social',
    name: 'Social',
    emoji: '💬',
    keywords: ['linkedin', 'discord', 'telegram', 'whatsapp', 'weixin.com', 'wechat', 'signal', 'irc'],
    extraRules: [{ kind: 'regex', pattern: 'reddit\\.com/message' }],
  },
  {
    id: 'section-news',
    name: 'News',
    emoji: '📰',
    keywords: ['news.google', 'bbc', 'nytimes', 'theguardian', 'reuters', 'bloomberg', 'wsj', 'apnews', 'usatoday', 'washingtonpost', 'latimes', 'huffpost', 'axios', 'theintercept', 'propublica', 'fivethirtyeight'],
  },
  {
    id: 'section-finance',
    name: 'Finance',
    emoji: '💰',
    keywords: ['chase', 'wellsfargo', 'robinhood', 'coinbase', 'binance', 'tradingview', 'fidelity', 'vanguard', 'schwab', 'ameritrade', 'paypal', 'venmo', 'cashapp', 'stripe', 'bankofamerica', 'citibank', 'usbank'],
  },
  {
    id: 'section-cloud',
    name: 'Cloud',
    emoji: '☁️',
    keywords: ['drive.google', 'dropbox', 'icloud', 'onedrive', 'box.com', 'mega', 'nzbd', 'mediafire'],
  },
  {
    id: 'section-ai',
    name: 'AI',
    emoji: '🤖',
    keywords: ['openai', 'anthropic', 'chatgpt', 'claude', 'gemini', 'deepseek', 'perplexity', 'huggingface', 'replicate', 'ollama', 'groq', 'mistral', 'cohere'],
    extraRules: [
      { kind: 'regex', pattern: 'aws[ _]bedrock' },
      { kind: 'regex', pattern: 'azure ai' },
    ],
  },
  {
    id: 'section-devops',
    name: 'DevOps',
    emoji: '⚙️',
    keywords: ['aws.com', 'azure.com', 'gcp', 'googleapis', 'cloudflare', 'digitalocean', 'heroku', 'vercel', 'netlify', 'render', 'railway', 'fly.io', 'supabase', 'firebase', 'datadog', 'sentry', 'grafana', 'prometheus', 'jenkins', 'travis', 'circleci'],
    extraRules: [
      { kind: 'regex', pattern: 'github\\.com/actions' },
      { kind: 'regex', pattern: 'gitlab\\.com/ci' },
    ],
  },
  {
    id: 'section-design',
    name: 'Design',
    emoji: '🎨',
    keywords: ['figma', 'sketch', 'adobe', 'canva', 'framer', 'webflow', 'dribbble', 'behance', 'invision', 'marvel', 'principle', 'zeplin', 'abstract', 'plantuml', 'excalidraw', 'miro', 'figjam'],
  },
  {
    id: 'section-productivity',
    name: 'Productivity',
    emoji: '✅',
    keywords: ['obsidian', 'roam', 'logseq', 'notion', 'coda', 'evernote', 'ticktick', 'any.do', 'habitica', 'anotepad', 'pomodorotracker', 'forest'],
    extraRules: [
      { kind: 'regex', pattern: 'microsoft[ _]onenote' },
      { kind: 'regex', pattern: 'apple[ _]notes' },
    ],
  },
  {
    id: 'section-maps',
    name: 'Maps',
    emoji: '🗺️',
    keywords: ['maps.google', 'mapquest', 'wikimedia', 'openstreetmap', 'gismastery'],
    extraRules: [
      { kind: 'regex', pattern: 'google\\.com/maps' },
      { kind: 'regex', pattern: 'bing\\.com/maps' },
    ],
  },
  {
    id: 'section-travel',
    name: 'Travel',
    emoji: '✈️',
    keywords: ['booking.com', 'airbnb', 'expedia', 'tripadvisor', 'kayak', 'hotels.com', 'hostelworld', 'couchsurfing', 'hostel', 'trivago', 'priceline', 'cheaptickets', 'flightcentre', 'airline.com', 'united', 'delta', 'southwest', 'lufthansa', 'ba.com', 'france.com', 'ryanair', 'easyjet'],
    extraRules: [{ kind: 'regex', pattern: 'american eagle' }],
  },
  {
    id: 'section-music',
    name: 'Music',
    emoji: '🎵',
    keywords: ['spotify', 'soundcloud', 'bandcamp', 'deezer', 'tidal', 'pandora', 'musify', 'qq.music'],
    extraRules: [
      { kind: 'regex', pattern: 'apple\\.com/music' },
      { kind: 'regex', pattern: 'youtube\\.com/music' },
    ],
  },
];

/** The auto-rules a template implies: its editable keywords plus its fixed extra rules. */
export function templateAutoRules(
  template: SectionTemplate,
  keywords: readonly string[] = template.keywords,
): SectionAutoRule[] {
  return [
    ...keywords.map((value): SectionAutoRule => ({ kind: 'keyword', value })),
    ...(template.extraRules ?? []),
  ];
}

/** Build the Section objects a template set implies. */
export function sectionsFromTemplates(templates: readonly SectionTemplate[]): Section[] {
  return templates.map((template, index) => ({
    id: template.id,
    name: template.name,
    order: index,
    emoji: template.emoji,
    autoRules: templateAutoRules(template),
  }));
}
