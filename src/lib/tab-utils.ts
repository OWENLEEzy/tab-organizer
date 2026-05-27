import type { Tab } from '../types';
import { getFaviconUrl } from '../utils/favicon';

export interface DuplicateAnalysis {
  duplicateCount: number;
  hasDuplicates: boolean;
  duplicateUrls: string[];
  duplicateTabs: Tab[];
  dedupedTabs: Tab[];
}

/**
 * Analyzes tab list for duplicates, returning all duplicate-related data in one pass.
 * Eliminates redundant Map<string, number> URL counting that was previously duplicated
 * across countDuplicates, getDuplicateUrls, filterDuplicateTabs, and dedupeTabsByUrl.
 */
export function analyzeDuplicates(tabs: readonly Tab[]): DuplicateAnalysis {
  const urlCounts = new Map<string, number>();
  for (const tab of tabs) {
    urlCounts.set(tab.url, (urlCounts.get(tab.url) ?? 0) + 1);
  }

  const duplicateUrls: string[] = [];
  const duplicateTabs: Tab[] = [];
  const dedupedTabs: Tab[] = [];
  let duplicateCount = 0;

  for (const [url, count] of urlCounts.entries()) {
    if (count > 1) {
      duplicateUrls.push(url);
      duplicateCount += count - 1;
    }
  }

  const seen = new Set<string>();
  for (const tab of tabs) {
    const count = urlCounts.get(tab.url)!;
    if (count > 1) {
      duplicateTabs.push(tab);
    }
    if (!seen.has(tab.url)) {
      dedupedTabs.push(tab);
      seen.add(tab.url);
    }
  }

  return {
    duplicateCount,
    hasDuplicates: duplicateCount > 0,
    duplicateUrls,
    duplicateTabs,
    dedupedTabs,
  };
}

/**
 * Determines if a tab is considered stale (idle for more than a threshold).
 * Active, pinned, and audible tabs are never considered stale.
 */
export function isTabStale(tab: Tab, now: number, thresholdDays = 3): boolean {
  if (tab.active || tab.pinned || tab.audible) return false;
  const msThreshold = thresholdDays * 24 * 60 * 60 * 1000;
  const lastAccess = tab.lastAccessed ?? now;
  return now - lastAccess > msThreshold;
}

/**
 * Resolves the representative favicon for a list of tabs.
 * Finds the first tab with a valid non-empty favicon URL, or falls back to using the first tab's URL.
 */
export function getGroupFaviconUrl(tabs: readonly Tab[]): string {
  const firstWithFavicon = tabs.find((tab) => tab.favIconUrl.trim() !== '');
  if (firstWithFavicon) {
    return firstWithFavicon.favIconUrl.trim();
  }
  return getFaviconUrl(tabs[0]?.url || '');
}

/**
 * Resolves the primary unique identifier (productKey) for a tab group.
 * Follows the standard priority: productKey ?? itemKey ?? domain.
 */
export function getProductKey(group: { productKey?: string; itemKey?: string; domain: string }): string {
  return group.productKey ?? group.itemKey ?? group.domain;
}
