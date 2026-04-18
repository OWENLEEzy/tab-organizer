import type { Tab, TabGroup } from '../../types';

export interface VisibleTabChip {
  domain: string;
  url: string;
  title: string;
}

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

export function getVisibleTabs(
  tabs: readonly Tab[],
  maxChipsVisible: number,
  expanded: boolean,
): {
  visibleTabs: Tab[];
  hiddenTabs: Tab[];
} {
  const uniqueTabs = dedupeTabsByUrl(tabs);
  const hiddenTabs = uniqueTabs.slice(maxChipsVisible);

  return {
    visibleTabs: expanded ? uniqueTabs : uniqueTabs.slice(0, maxChipsVisible),
    hiddenTabs,
  };
}

export function flattenVisibleTabs(
  groups: readonly TabGroup[],
  maxChipsVisible: number,
  expandedDomains: ReadonlySet<string>,
): VisibleTabChip[] {
  return groups.flatMap((group) => {
    const { visibleTabs } = getVisibleTabs(
      group.tabs,
      maxChipsVisible,
      expandedDomains.has(group.domain),
    );

    return visibleTabs.map((tab) => ({
      domain: group.domain,
      url: tab.url,
      title: tab.title,
    }));
  });
}
