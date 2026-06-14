import { isRealTab } from './url-rules';

/**
 * "Last used" identity for the whole browser.
 *
 * The dashboard highlights exactly ONE tab as the one you most recently used —
 * the real web page with the newest `lastAccessed`, globally (not per window).
 * Tab Organizer's own dashboard/popup pages live under `chrome-extension://`,
 * which `isRealTab` already rejects, so opening the dashboard can never steal
 * the marker from the page you were actually on.
 */

export interface LastUsedCandidate {
  id?: number | null;
  url?: string | null;
  lastAccessed?: number;
}

/**
 * Find the id of the globally most-recently-used real web tab, or null when
 * there are no real tabs.
 */
export function findLastUsedTabId(tabs: readonly LastUsedCandidate[]): number | null {
  let bestId: number | null = null;
  let bestTime = -Infinity;

  for (const tab of tabs) {
    if (tab.id == null || tab.id < 0) continue;
    if (!isRealTab(tab.url ?? '')) continue;

    const time = tab.lastAccessed ?? -Infinity;
    if (time > bestTime) {
      bestTime = time;
      bestId = tab.id;
    }
  }

  return bestId;
}
