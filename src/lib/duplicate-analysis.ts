import type { Tab } from '../types';

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