import type { Tab } from '../types';

/**
 * Count how many tabs in the array are duplicates (same URL appears
 * more than once). Returns `{ duplicateCount, hasDuplicates }`.
 */
export function countDuplicates(tabs: readonly Tab[]): {
  duplicateCount: number;
  hasDuplicates: boolean;
} {
  const urlCounts = new Map<string, number>();
  for (const tab of tabs) {
    const count = urlCounts.get(tab.url) ?? 0;
    urlCounts.set(tab.url, count + 1);
  }

  let duplicateCount = 0;
  for (const count of urlCounts.values()) {
    if (count > 1) duplicateCount += count - 1;
  }

  return { duplicateCount, hasDuplicates: duplicateCount > 0 };
}

/**
 * Find all URLs that appear more than once in the given tab list.
 */
export function getDuplicateUrls(tabs: readonly Tab[]): string[] {
  const counts = new Map<string, number>();
  for (const tab of tabs) {
    counts.set(tab.url, (counts.get(tab.url) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([url]) => url);
}

/**
 * Filter a tab list to only include the first occurrence of each URL.
 */
export function dedupeTabsByUrl(tabs: readonly Tab[]): Tab[] {
  const seen = new Set<string>();

  return tabs.filter((tab) => {
    if (seen.has(tab.url)) {
      return false;
    }

    seen.add(tab.url);
    return true;
  });
}
