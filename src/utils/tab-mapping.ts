import type { Tab } from '../types';
import { getTabDomain } from '../lib/url-rules';
import { isTabOrganizerPage } from './browser-url';

/**
 * Map a raw chrome.tabs.Tab into our application Tab type. Shared by every
 * surface (dashboard store, popup, recovery protection) so they all derive the
 * same fields the same way.
 */
export function chromeTabToAppTab(raw: chrome.tabs.Tab): Tab {
  const url = raw.url ?? '';
  return {
    id: raw.id ?? -1,
    url,
    title: raw.title ?? '',
    favIconUrl: raw.favIconUrl ?? '',
    domain: getTabDomain(url),
    windowId: raw.windowId ?? -1,
    active: raw.active ?? false,
    isDashboard: isTabOrganizerPage(url),
    isDuplicate: false,
    isLandingPage: false,
    duplicateCount: 0,
    lastAccessed: raw.lastAccessed,
    pinned: raw.pinned ?? false,
    audible: raw.audible ?? false,
  };
}
