import type { Tab, TabGroup } from '../../types';
import { analyzeDuplicates } from '../../lib/tab-utils';

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
  const dedupedTabs = analyzeDuplicates(tabs).dedupedTabs;
  const hiddenTabs = dedupedTabs.slice(maxChipsVisible);

  return {
    visibleTabs: expanded ? dedupedTabs : dedupedTabs.slice(0, maxChipsVisible),
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
