import type { ProductInfo } from '../types';

interface ProductRule extends ProductInfo {
  hostnames?: string[];
  hostnameSuffixes?: string[];
  hostnameMatcher?: (hostname: string) => boolean;
}

const LOCALIZED_ROOT_SUFFIXES = new Set([
  'com',
  'co.uk',
  'co.jp',
  'com.hk',
  'com.tw',
  'com.sg',
  'com.br',
  'com.mx',
  'de',
]);

function matchesLocalizedRoot(hostname: string, root: string): boolean {
  const normalized = stripCommonHostPrefix(hostname);
  if (!normalized.startsWith(`${root}.`)) return false;
  return LOCALIZED_ROOT_SUFFIXES.has(normalized.slice(root.length + 1));
}

const PRODUCT_RULES: ProductRule[] = [
  {
    key: 'google',
    label: 'Google',
    iconDomain: 'google.com',
    hostnameMatcher: (hostname) => matchesLocalizedRoot(hostname, 'google'),
  },
  {
    key: 'gmail',
    label: 'Gmail',
    iconDomain: 'mail.google.com',
    hostnames: ['mail.google.com'],
  },
  {
    key: 'google-docs',
    label: 'Google Docs',
    iconDomain: 'docs.google.com',
    hostnames: ['docs.google.com'],
  },
  {
    key: 'google-drive',
    label: 'Google Drive',
    iconDomain: 'drive.google.com',
    hostnames: ['drive.google.com'],
  },
  {
    key: 'google-calendar',
    label: 'Google Calendar',
    iconDomain: 'calendar.google.com',
    hostnames: ['calendar.google.com'],
  },
  {
    key: 'amazon',
    label: 'Amazon',
    iconDomain: 'amazon.com',
    hostnameMatcher: (hostname) => matchesLocalizedRoot(hostname, 'amazon'),
  },
  {
    key: 'wikipedia',
    label: 'Wikipedia',
    iconDomain: 'wikipedia.org',
    hostnames: ['wikipedia.org'],
    hostnameSuffixes: ['.wikipedia.org'],
  },
  {
    key: 'youtube',
    label: 'YouTube',
    iconDomain: 'youtube.com',
    hostnames: ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'],
  },
  {
    key: 'vercel',
    label: 'Vercel',
    iconDomain: 'vercel.com',
    hostnames: ['vercel.com', 'www.vercel.com', 'vercel.app'],
    hostnameSuffixes: ['.vercel.app'],
  },
  {
    key: 'github',
    label: 'GitHub',
    iconDomain: 'github.com',
    hostnames: ['github.com', 'www.github.com'],
    hostnameSuffixes: ['.github.com'],
  },
  {
    key: 'local-files',
    label: 'Local Files',
    iconDomain: 'local-files',
    hostnames: ['local-files'],
  },
];

function stripCommonHostPrefix(hostname: string): string {
  return hostname.replace(/^(www|m)\./, '');
}

export function legacyProductKeyForHostname(hostname: string): string {
  return stripCommonHostPrefix(hostname.toLowerCase());
}

export function fallbackProductForHostname(hostname: string): ProductInfo {
  const normalized = legacyProductKeyForHostname(hostname);
  // Improved label extraction: handle common localized TLDs like .co.jp, .com.hk
  const labelBase = normalized.replace(/\.(com|org|net|io|co|ai|dev|app|so|me|xyz|info|us|uk|gov|edu|co\.uk|co\.jp|com\.hk|com\.tw|com\.sg|com\.br|com\.mx|net\.cn|org\.cn|gov\.cn)(\.[a-z]{2,3})?$/, '');
  
  const label = labelBase
    .split(/[.-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  // Decouple technical key from visual label.
  // We use the normalized hostname as the key to prevent unrelated domains
  // (e.g. example.com vs example.org) from sharing a grouping identity,
  // while still extracting a pretty label for the UI.
  const key = normalized || hostname;

  return {
    key,
    label: label || hostname,
    iconDomain: normalized || hostname,
  };
}

export function productForHostname(hostname: string): ProductInfo {
  const normalized = hostname.toLowerCase();

  for (const rule of PRODUCT_RULES) {
    // 1. Exact hostname match
    if (rule.hostnames?.includes(normalized)) {
      return {
        key: rule.key,
        label: rule.label,
        iconDomain: rule.iconDomain,
      };
    }

    // 2. Suffix match
    if (rule.hostnameSuffixes?.some((suffix) => normalized.endsWith(suffix))) {
      return {
        key: rule.key,
        label: rule.label,
        iconDomain: rule.iconDomain,
      };
    }

    // 3. Custom matcher for owned localized roots
    if (rule.hostnameMatcher?.(normalized)) {
      return {
        key: rule.key,
        label: rule.label,
        iconDomain: rule.iconDomain,
      };
    }
  }

  return fallbackProductForHostname(normalized);
}

export const KNOWN_PRODUCT_KEYS = new Set(PRODUCT_RULES.map((rule) => rule.key));
