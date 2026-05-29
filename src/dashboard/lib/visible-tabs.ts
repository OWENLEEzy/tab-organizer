import type { Tab, TabGroup } from '../../types';
import { dedupeTabsByUrl } from '../../lib/tab-utils';

export interface VisibleTabChip {
  domain: string;
  url: string;
  title: string;
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
