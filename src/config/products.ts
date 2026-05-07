import type { ProductInfo } from '../types';

interface ProductRule extends ProductInfo {
  hostnames?: string[];
  hostnameSuffixes?: string[];
  hostnamePatterns?: RegExp[];
}

const PRODUCT_RULES: ProductRule[] = [
  {
    key: 'google',
    label: 'Google',
    iconDomain: 'google.com',
    hostnamePatterns: [/^google\.[a-z.]+$/, /^(www|m)\.google\.[a-z.]+$/],
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
    hostnamePatterns: [/^amazon\.[a-z.]+$/, /^(www|m)\.amazon\.[a-z.]+$/],
  },
  {
    key: 'wikipedia',
    label: 'Wikipedia',
    iconDomain: 'wikipedia.org',
    hostnamePatterns: [/^[a-z.]+\.wikipedia\.org$/],
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

export function fallbackProductForHostname(hostname: string): ProductInfo {
  const normalized = stripCommonHostPrefix(hostname.toLowerCase());
  // Improved label extraction: handle common localized TLDs like .co.jp, .com.hk
  const labelBase = normalized.replace(/\.(com|org|net|io|co|ai|dev|app|so|me|xyz|info|us|uk|gov|edu|co\.uk|co\.jp|com\.hk|com\.tw|com\.sg|com\.br|com\.mx|net\.cn|org\.cn|gov\.cn)(\.[a-z]{2,3})?$/, '');
  
  const label = labelBase
    .split(/[.-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  // Use the label-base as the key to consolidate localized domains
  // e.g. "google.com.hk" and "google.com" both become key: "google"
  const key = labelBase.toLowerCase() || normalized || hostname;

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

    // 3. Regex pattern match
    if (rule.hostnamePatterns?.some((pattern) => pattern.test(normalized))) {
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
