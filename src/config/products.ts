import type { ProductInfo } from '../types';

interface ProductRule extends ProductInfo {
  hostnames?: string[];
  hostnameSuffixes?: string[];
}

const PRODUCT_RULES: ProductRule[] = [
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
    key: 'youtube-music',
    label: 'YouTube Music',
    iconDomain: 'music.youtube.com',
    hostnames: ['music.youtube.com'],
  },
  {
    key: 'youtube',
    label: 'YouTube',
    iconDomain: 'youtube.com',
    hostnames: ['youtube.com', 'www.youtube.com', 'm.youtube.com'],
  },
  {
    key: 'vercel',
    label: 'Vercel',
    iconDomain: 'vercel.com',
    hostnames: ['vercel.com', 'www.vercel.com'],
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
  const labelBase = normalized.replace(/\.[a-z.]+$/, '');
  const label = labelBase
    .split(/[.-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  return {
    key: normalized || hostname,
    label: label || hostname,
    iconDomain: normalized || hostname,
  };
}

export function productForHostname(hostname: string): ProductInfo {
  const normalized = hostname.toLowerCase();

  for (const rule of PRODUCT_RULES) {
    if (rule.hostnames?.includes(normalized)) {
      return {
        key: rule.key,
        label: rule.label,
        iconDomain: rule.iconDomain,
      };
    }

    if (rule.hostnameSuffixes?.some((suffix) => normalized.endsWith(suffix))) {
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
