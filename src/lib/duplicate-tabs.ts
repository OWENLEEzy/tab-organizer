export interface DuplicateTabCandidate {
  id?: number | null;
  url?: string | null;
  active?: boolean;
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

    const keep = keepOne ? matching.find((tab) => tab.active) ?? matching[0] : null;
    for (const tab of matching) {
      if (tab.id == null || tab.id === keep?.id) continue;
      ids.push(tab.id);
    }
  }

  return ids;
}
