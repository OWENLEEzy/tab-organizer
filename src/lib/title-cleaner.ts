import { FRIENDLY_DOMAINS } from '../config/friendly-domains';

/**
 * Map a hostname to a human-friendly display name.
 *
 * Looks up known domains in FRIENDLY_DOMAINS, handles Substack subdomains
 * and github.io pages, then falls back to stripping "www." and TLD suffixes.
 */
export function friendlyDomain(hostname: string): string {
  if (!hostname) return '';
  if (FRIENDLY_DOMAINS[hostname]) return FRIENDLY_DOMAINS[hostname];

  if (hostname.endsWith('.substack.com') && hostname !== 'substack.com') {
    return capitalize(hostname.replace('.substack.com', '')) + "'s Substack";
  }
  if (hostname.endsWith('.github.io')) {
    return capitalize(hostname.replace('.github.io', '')) + ' (GitHub Pages)';
  }

  const clean = hostname
    .replace(/^www\./, '')
    .replace(/\.(com|org|net|io|co|ai|dev|app|so|me|xyz|info|us|uk|co\.uk|co\.jp)$/, '');

  return clean.split('.').map((part) => capitalize(part)).join(' ');
}

/**
 * Capitalize the first character of a string.
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Remove noise from tab titles: notification counts, inline counters,
 * email addresses, and X/Twitter format artifacts.
 */
export function stripTitleNoise(title: string): string {
  if (!title) return '';
  // Strip leading notification count: "(2) Title"
  let cleaned = title.replace(/^\(\d+\+?\)\s*/, '');
  // Strip inline counts like "Inbox (16,359)"
  cleaned = cleaned.replace(/\s*\([\d,]+\+?\)\s*/g, ' ');
  // Strip email addresses preceded by a dash (privacy + cleaner display)
  cleaned = cleaned.replace(
    /\s*[\u2010-\u2015-]\s*[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    '',
  );
  // Strip remaining bare email addresses
  cleaned = cleaned.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    '',
  );
  // Clean X/Twitter format
  cleaned = cleaned.replace(/\s+on X:\s*/, ': ');
  cleaned = cleaned.replace(/\s*\/\s*X\s*$/, '');
  return cleaned.trim();
}

/**
 * Strip the site-name suffix that browsers append to tab titles.
 *
 * Handles separators like " - ", " | ", " — ", " · ", " – ".
 * Only strips if the remaining title is at least 5 characters long.
 */
export function cleanTitle(title: string, hostname: string): string {
  if (!title || !hostname) return title || '';

  const friendly = friendlyDomain(hostname);
  const domain = hostname.replace(/^www\./, '');
  const separators = [' - ', ' | ', ' \u2014 ', ' \u00B7 ', ' \u2013 '];

  for (const sep of separators) {
    const idx = title.lastIndexOf(sep);
    if (idx === -1) continue;

    const suffix = title.slice(idx + sep.length).trim();
    const suffixLow = suffix.toLowerCase();
    if (
      suffixLow === domain.toLowerCase() ||
      suffixLow === friendly.toLowerCase() ||
      suffixLow === domain.replace(/\.\w+$/, '').toLowerCase() ||
      domain.toLowerCase().includes(suffixLow) ||
      friendly.toLowerCase().includes(suffixLow)
    ) {
      const cleaned = title.slice(0, idx).trim();
      if (cleaned.length >= 5) return cleaned;
    }
  }
  return title;
}

/**
 * Generate a smart, descriptive title for well-known URL patterns.
 *
 * Handles GitHub issues/PRs/repos, X posts, YouTube videos, and Reddit posts.
 * Falls back to the original title for unknown patterns.
 */
export function smartTitle(title: string, url: string): string {
  if (!url) return title || '';

  let pathname = '';
  let hostname = '';
  try {
    const u = new URL(url);
    pathname = u.pathname;
    hostname = u.hostname;
  } catch {
    return title || '';
  }

  const titleIsUrl =
    !title || title === url || title.startsWith(hostname) || title.startsWith('http');

  // X / Twitter posts
  if (
    (hostname === 'x.com' || hostname === 'twitter.com' || hostname === 'www.x.com') &&
    pathname.includes('/status/')
  ) {
    const username = pathname.split('/')[1];
    if (username) return titleIsUrl ? `Post by @${username}` : title;
  }

  // GitHub issues, PRs, repos, file trees
  if (hostname === 'github.com' || hostname === 'www.github.com') {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length >= 2) {
      const [owner, repo, ...rest] = parts;
      if (rest[0] === 'issues' && rest[1]) return `${owner}/${repo} Issue #${rest[1]}`;
      if (rest[0] === 'pull' && rest[1]) return `${owner}/${repo} PR #${rest[1]}`;
      if (rest[0] === 'blob' || rest[0] === 'tree')
        return `${owner}/${repo} \u2014 ${rest.slice(2).join('/')}`;
      if (titleIsUrl) return `${owner}/${repo}`;
    }
  }

  // YouTube videos
  if (
    (hostname === 'www.youtube.com' || hostname === 'youtube.com') &&
    pathname === '/watch'
  ) {
    if (titleIsUrl) return 'YouTube Video';
  }

  // Reddit posts
  if (
    (hostname === 'www.reddit.com' ||
      hostname === 'reddit.com' ||
      hostname === 'old.reddit.com') &&
    pathname.includes('/comments/')
  ) {
    const parts = pathname.split('/').filter(Boolean);
    const subIdx = parts.indexOf('r');
    if (subIdx !== -1 && parts[subIdx + 1]) {
      if (titleIsUrl) return `r/${parts[subIdx + 1]} post`;
    }
  }

  return title || url;
}
