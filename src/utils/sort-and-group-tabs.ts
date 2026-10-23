/** Plan complete window destinations before sorting, then apply and verify them. */

import type { TabGroup, CustomGroup } from '../types';
import type { ProductSectionRef } from '../lib/section-grouping';
import { computeWindowSortMoves, type SortableTab } from '../lib/window-sort';
import { getTabDomain, isRealTab } from '../lib/url-rules';
import { resolveProduct } from '../lib/resolve-product';
import { queryAllTabs, queryTabs, moveChromeTab } from './chrome-tabs';
import { readStorage } from './storage';
import { nativeSectionTitle, planNativeGroups } from '../lib/native-group-plan';

const CHROME_COLORS = [
  'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange', 'grey',
] as const;

type ChromeGroupColor = (typeof CHROME_COLORS)[number];

function colorForKey(key: string): ChromeGroupColor {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return CHROME_COLORS[hash % CHROME_COLORS.length];
}

export interface SortAndGroupOptions {
  /** Restrict to one window. Omit to process every window. */
  windowId?: number;
  /** Tab ids that were just closed (e.g. duplicates) and must be excluded. */
  closedTabIds?: Set<number>;
  /**
   * productKey -> section. When provided, native groups are created per section;
   * products absent from the map are sorted but not grouped. When omitted, tabs
   * are sorted only (no grouping).
   */
  sectionByProductKey?: Map<string, ProductSectionRef>;
  sectionRefs?: readonly ProductSectionRef[];
}

export interface SortAndGroupResult {
  /** Number of individual tab-move calls that failed. */
  moveFailures: number;
  /** Failed grouping operations or deviations from the planned membership. */
  groupFailures: number;
}

function productKeyFor(tab: chrome.tabs.Tab, customGroups: CustomGroup[] | undefined): string {
  return resolveProduct(getTabDomain(tab.url ?? ''), customGroups).key;
}

export async function sortAndGroupTabs(
  products: TabGroup[],
  options: SortAndGroupOptions = {},
): Promise<SortAndGroupResult> {
  const run = () => executeSortAndGroup(products, options);
  // The popup and dashboard share an extension origin but separate JS contexts.
  return globalThis.navigator?.locks
    ? navigator.locks.request('tab-organizer-sort-and-group', run)
    : run();
}

async function executeSortAndGroup(
  products: TabGroup[],
  options: SortAndGroupOptions,
): Promise<SortAndGroupResult> {
  const { windowId, closedTabIds = new Set<number>(), sectionByProductKey, sectionRefs } = options;
  const result: SortAndGroupResult = { moveFailures: 0, groupFailures: 0 };
  const productOrder = products.map((product) => product.productKey ?? product.domain);
  const allTabs = windowId == null ? await queryAllTabs() : await queryTabs({ windowId });
  const byWindow = new Map<number, chrome.tabs.Tab[]>();
  for (const tab of allTabs) {
    if (tab.id == null || tab.id < 0 || closedTabIds.has(tab.id)) continue;
    const tabs = byWindow.get(tab.windowId) ?? [];
    tabs.push(tab);
    byWindow.set(tab.windowId, tabs);
  }
  const customGroups = (await readStorage()).settings.customGroups;
  for (const [currentWindowId, snapshotTabs] of byWindow) {
    if (!chrome.tabGroups || !sectionByProductKey) {
      const sortable: SortableTab[] = snapshotTabs.filter((tab) => isRealTab(tab.url ?? '')).map((tab) => ({
        id: tab.id!, index: tab.index, pinned: tab.pinned, productKey: productKeyFor(tab, customGroups),
      }));
      for (const move of computeWindowSortMoves(sortable, productOrder)) {
        try { await moveChromeTab(move.id, move.index); }
        catch (error) { result.moveFailures++; console.warn('[Tab Organizer] Failed to move tab', move.id, error); }
      }
      continue;
    }
    try {
      // Both membership and native-group metadata must be captured before any move.
      const snapshotGroups = await chrome.tabGroups.query({ windowId: currentWindowId });
      if (snapshotTabs.some((tab) => tab.groupId >= 0 && !snapshotGroups.some((group) => group.id === tab.groupId))) {
        result.groupFailures++;
        continue;
      }
      const plan = planNativeGroups(snapshotTabs.map((tab) => ({
        id: tab.id!, index: tab.index, pinned: tab.pinned, groupId: tab.groupId,
        productKey: isRealTab(tab.url ?? '') ? productKeyFor(tab, customGroups) : undefined,
      })), snapshotGroups, sectionRefs ?? [...sectionByProductKey.values()], sectionByProductKey, productOrder);
      if (plan.orderedTabIds.length === 0) continue;
      const metadataByKey = new Map(plan.groups.map((group) => {
        const original = snapshotGroups.find((candidate) => candidate.id === group.originalGroupIds[0]);
        return [group.key, group.section ? {
          title: nativeSectionTitle(group.section), color: colorForKey(group.section.sectionId), collapsed: false,
        } : { title: original?.title, color: original?.color, collapsed: original?.collapsed }];
      }));
      let currentTabs = await queryTabs({ windowId: currentWindowId });
      const validIds = (ids: readonly number[]): number[] => ids.filter((id) => {
        const tab = currentTabs.find((candidate) => candidate.id === id);
        if (!tab || tab.pinned) { result.groupFailures++; return false; }
        return true;
      });
      // Fill target positions from left to right using current indices, not stale slots.
      for (const [offset, id] of plan.orderedTabIds.entries()) {
        if (validIds([id]).length === 0) continue;
        const tab = currentTabs.find((candidate) => candidate.id === id)!;
        const index = Math.min(currentTabs.filter((candidate) => candidate.pinned).length + offset, currentTabs.length - 1);
        if (tab.index !== index) {
          try { await moveChromeTab(id, index); }
          catch { result.moveFailures++; }
          currentTabs = await queryTabs({ windowId: currentWindowId });
        }
      }
      // Moves may attach nonmembers to groups. Detach those according to the plan,
      // including pages that were ungrouped before sorting.
      const allowedGroups = new Map<number, readonly number[]>();
      for (const group of plan.groups) {
        for (const id of group.tabIds) allowedGroups.set(id, group.originalGroupIds);
      }
      currentTabs = await queryTabs({ windowId: currentWindowId });
      const detachIds = validIds(plan.orderedTabIds).filter((id) => {
        const tab = currentTabs.find((candidate) => candidate.id === id)!;
        return tab.groupId >= 0 && !(allowedGroups.get(id) ?? []).includes(tab.groupId);
      });
      if (detachIds.length > 0) await chrome.tabs.ungroup(detachIds as [number, ...number[]]);
      const resolvedGroups = new Map<string, number>();
      for (const group of plan.groups) {
        currentTabs = await queryTabs({ windowId: currentWindowId });
        const ids = validIds(group.tabIds);
        if (ids.length === 0) continue;
        const liveGroups = await chrome.tabGroups.query({ windowId: currentWindowId });
        const reusable = group.originalGroupIds.find((id) => liveGroups.some((candidate) => candidate.id === id));
        try {
          const id = await chrome.tabs.group({ tabIds: ids as [number, ...number[]], ...(reusable == null ? {} : { groupId: reusable }) });
          resolvedGroups.set(group.key, id);
          await chrome.tabGroups.update(id, metadataByKey.get(group.key)!);
        } catch { result.groupFailures++; }
      }
      currentTabs = await queryTabs({ windowId: currentWindowId });
      const liveGroups = await chrome.tabGroups.query({ windowId: currentWindowId });
      for (const group of plan.groups) {
        const target = resolvedGroups.get(group.key);
        const expected = validIds(group.tabIds);
        const actual = currentTabs.filter((tab) => tab.groupId === target).map((tab) => tab.id);
        if (target == null || actual.length !== expected.length || expected.some((id) => !actual.includes(id))) result.groupFailures++;
        const actualGroup = liveGroups.find((candidate) => candidate.id === target);
        const metadata = metadataByKey.get(group.key)!;
        if (!actualGroup || actualGroup.title !== metadata.title || actualGroup.color !== metadata.color
          || actualGroup.collapsed !== metadata.collapsed) result.groupFailures++;
        if (group.originalGroupIds.some((id) => id !== target && liveGroups.some((candidate) => candidate.id === id))) result.groupFailures++;
      }
      for (const id of validIds(plan.ungroupedTabIds)) {
        if (currentTabs.find((tab) => tab.id === id)?.groupId !== -1) result.groupFailures++;
      }
      const plannedIds = new Set(plan.orderedTabIds);
      const actualOrder = [...currentTabs].sort((a, b) => a.index - b.index)
        .filter((tab) => !tab.pinned && plannedIds.has(tab.id!)).map((tab) => tab.id);
      const expectedOrder = validIds(plan.orderedTabIds);
      if (actualOrder.some((id, index) => id !== expectedOrder[index]) || actualOrder.length !== expectedOrder.length) result.moveFailures++;
    } catch (error) {
      result.groupFailures++;
      console.warn('[Tab Organizer] Window organization did not complete', currentWindowId, error);
    }
  }
  return result;
}
