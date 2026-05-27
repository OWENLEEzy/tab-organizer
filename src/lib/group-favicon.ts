import type { Tab } from '../types';

/**
 * Resolves the source URL for a list of tabs to use as a favicon source.
 * Finds the first tab with a valid non-empty favicon URL, or falls back to the first tab's URL.
 */
export function getGroupFaviconSource(tabs: readonly Tab[]): string {
  const firstWithFavicon = tabs.find((tab) => tab.favIconUrl.trim() !== '');
  if (firstWithFavicon) return firstWithFavicon.favIconUrl.trim();
  return tabs[0]?.url ?? '';
}