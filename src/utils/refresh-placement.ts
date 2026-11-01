import { placementFromStrip, type StripTab } from '../lib/placement-from-strip';
import { resolveProduct } from '../lib/resolve-product';
import { getTabDomain, isRealTab } from '../lib/url-rules';
import { queryAllTabGroups, queryAllTabs } from './chrome-tabs';
import { readStorage, writeStripPlacements } from './storage';

export async function refreshPlacementFromStrip(): Promise<void> {
  if (!chrome.tabGroups) return;
  const ungrouped = chrome.tabGroups.TAB_GROUP_ID_NONE;
  const [tabs, groups] = await Promise.all([queryAllTabs(), queryAllTabGroups()]);
  const storage = await readStorage();
  const titleByGroupId = new Map(groups.map((group) => [group.id, group.title ?? null]));
  const { customGroups, productLabels } = storage.settings;
  const stripTabs: StripTab[] = [];

  for (const tab of tabs) {
    const url = tab.url ?? '';
    if (!isRealTab(url)) continue;
    const hostname = getTabDomain(url);
    if (!hostname) continue;
    const groupTitle = tab.groupId == null || tab.groupId === ungrouped
      ? null
      : titleByGroupId.get(tab.groupId) ?? null;
    stripTabs.push({
      productKey: resolveProduct(hostname, customGroups, productLabels).key,
      pinned: tab.pinned === true,
      groupTitle,
    });
  }

  const sectionRefs = storage.sections.map((section) => ({
    sectionId: section.id,
    name: section.name,
    emoji: section.emoji,
  }));
  await writeStripPlacements(placementFromStrip(stripTabs, sectionRefs));
}
