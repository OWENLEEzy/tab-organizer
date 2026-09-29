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

/**
 * Order matters: the first matching section wins, so a template whose keywords
 * are a narrower slice of a broader one's (DevOps's `aws.amazon` inside
 * Shopping's `amazon`) must come first. Keywords are specific enough not to
 * claim unrelated sites by label prefix (`delta.com`, not `delta`).
 */
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
    keywords: ['docs.google', 'sheets.google', 'slides.google', 'forms.google', 'meet.google', 'calendar.google', 'mail.google', 'slack', 'loom', 'zoom.us', 'airtable', 'confluence', 'asana', 'clickup', 'todoist', 'linear.app', 'trello', 'basecamp', 'monday.com', 'teamviewer', 'anydesk'],
  },
  {
    id: 'section-media',
    name: 'Media',
    emoji: '🎬',
    keywords: ['youtube', 'twitter', 'x.com', 'reddit', 'instagram', 'tiktok', 'bilibili', 'twitch', 'steam', 'epicgames', 'roblox'],
  },
  {
    id: 'section-devops',
    name: 'DevOps',
    emoji: '⚙️',
    keywords: ['aws.amazon', 'amazonaws', 'azure.com', 'cloud.google', 'googleapis', 'cloudflare', 'digitalocean', 'heroku', 'vercel', 'netlify', 'render.com', 'railway.app', 'fly.io', 'supabase', 'firebase', 'datadog', 'sentry.io', 'grafana', 'prometheus', 'jenkins', 'travis-ci', 'circleci'],
  },
  {
    id: 'section-shopping',
    name: 'Shopping',
    emoji: '🛒',
    keywords: ['amazon', 'taobao', 'jd.com', 'shopee', 'aliexpress', 'ebay', 'walmart', 'target.com', 'bestbuy', 'etsy'],
  },
  {
    id: 'section-academic',
    name: 'Academic',
    emoji: '🎓',
    keywords: ['arxiv', 'scholar.google', 'pubmed', 'ieee', 'acm.org', 'jstor', 'nature.com', 'science.org', 'sciencedirect', 'springer', 'wiley', 'researchgate', 'semanticscholar', 'plos', 'frontiersin', 'mdpi', 'hindawi', 'biorxiv', 'medrxiv'],
  },
  {
    id: 'section-social',
    name: 'Social',
    emoji: '💬',
    keywords: ['linkedin', 'discord', 'telegram', 'whatsapp', 'weixin.qq', 'wechat', 'signal.org', 'irc'],
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
    keywords: ['chase.com', 'wellsfargo', 'robinhood', 'coinbase', 'binance', 'tradingview', 'fidelity', 'vanguard', 'schwab', 'ameritrade', 'paypal', 'venmo', 'cashapp', 'stripe', 'bankofamerica', 'citibank', 'usbank'],
  },
  {
    id: 'section-cloud',
    name: 'Cloud',
    emoji: '☁️',
    keywords: ['drive.google', 'dropbox', 'icloud', 'onedrive', 'box.com', 'mega.nz', 'mega.io', 'nzbd', 'mediafire'],
  },
  {
    id: 'section-ai',
    name: 'AI',
    emoji: '🤖',
    keywords: ['openai', 'anthropic', 'chatgpt', 'claude.ai', 'gemini.google', 'deepseek', 'perplexity', 'huggingface', 'replicate.com', 'ollama', 'groq', 'mistral.ai', 'cohere.com'],
  },
  {
    id: 'section-design',
    name: 'Design',
    emoji: '🎨',
    keywords: ['figma', 'sketch.com', 'adobe', 'canva', 'framer', 'webflow', 'dribbble', 'behance', 'invision', 'marvelapp', 'principleformac', 'zeplin', 'abstract.com', 'plantuml', 'excalidraw', 'miro', 'figjam'],
  },
  {
    id: 'section-productivity',
    name: 'Productivity',
    emoji: '✅',
    keywords: ['obsidian', 'roamresearch', 'logseq', 'notion', 'coda.io', 'evernote', 'ticktick', 'any.do', 'habitica', 'anotepad', 'pomodorotracker', 'forestapp'],
  },
  {
    id: 'section-maps',
    name: 'Maps',
    emoji: '🗺️',
    keywords: ['maps.google', 'mapquest', 'wikimedia', 'openstreetmap', 'gismastery'],
  },
  {
    id: 'section-travel',
    name: 'Travel',
    emoji: '✈️',
    keywords: ['booking.com', 'airbnb', 'expedia', 'tripadvisor', 'kayak', 'hotels.com', 'hostelworld', 'couchsurfing', 'hostel', 'trivago', 'priceline', 'cheaptickets', 'flightcentre', 'airline.com', 'united.com', 'delta.com', 'southwest', 'lufthansa', 'ba.com', 'france.com', 'ryanair', 'easyjet'],
  },
  {
    id: 'section-music',
    name: 'Music',
    emoji: '🎵',
    keywords: ['spotify', 'soundcloud', 'bandcamp', 'deezer', 'tidal.com', 'pandora.com', 'musify', 'y.qq', 'music.qq'],
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
