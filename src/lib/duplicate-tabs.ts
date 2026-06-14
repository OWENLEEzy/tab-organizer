export interface DuplicateTabCandidate {
  id?: number | null;
  url?: string | null;
  active?: boolean;
  lastAccessed?: number;
}

/**
 * Pick which duplicate to keep: the most-recently-used tab (highest
 * lastAccessed). Ties (or missing timestamps) fall back to the active tab,
 * then to the first-seen tab for stability.
 */
function pickKeeper(matching: DuplicateTabCandidate[]): DuplicateTabCandidate {
  return matching.reduce((best, tab) => {
    const tabTime = tab.lastAccessed ?? -Infinity;
    const bestTime = best.lastAccessed ?? -Infinity;
    if (tabTime !== bestTime) return tabTime > bestTime ? tab : best;
    if (tab.active && !best.active) return tab;
    return best;
  }, matching[0]);
}

export function duplicateTabIdsToClose(
  tabs: readonly DuplicateTabCandidate[],
  targetUrls?: ReadonlySet<string>,
  keepOne = true,
): number[] {
  const byUrl = new Map<string, DuplicateTabCandidate[]>();

  for (const tab of tabs) {
    if (!tab.url) continue;
    if (targetUrls && !targetUrls.has(tab.url)) continue;

    const matching = byUrl.get(tab.url);
    if (matching) {
      matching.push(tab);
    } else {
      byUrl.set(tab.url, [tab]);
    }
  }

  const ids: number[] = [];
  for (const matching of byUrl.values()) {
    if (matching.length < 2 && keepOne) continue;

    const keep = keepOne ? pickKeeper(matching) : null;
    for (const tab of matching) {
      if (tab.id == null || tab.id === keep?.id) continue;
      ids.push(tab.id);
    }
  }

  return ids;
}
