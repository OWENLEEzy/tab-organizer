/**
 * Shared "sort + native group" capability for Chrome tabs.
 *
 * Used by both the dashboard "sort window" action (single window) and the popup
 * "organize" action (all windows). It physically reorders real tabs so same-product
 * tabs sit together, then creates native Chrome tab groups from those now-adjacent
 * tabs. Sorting happens BEFORE grouping so the two steps never fight over tab order.
 */

import type { TabGroup, CustomGroup } from '../types';
import { computeWindowSortMoves, type SortableTab } from '../lib/window-sort';
import { getTabDomain, isRealTab } from '../lib/url-rules';
import { productForHostname } from '../config/products';
import { queryAllTabs, queryTabs, moveChromeTab } from './chrome-tabs';
import { readStorage } from './storage';

const CHROME_COLORS = [
  'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange', 'grey',
] as const;

type ChromeGroupColor = (typeof CHROME_COLORS)[number];

function colorForProductKey(productKey: string): ChromeGroupColor {
  let hash = 0;
  for (let i = 0; i < productKey.length; i++) {
    hash = (hash * 31 + productKey.charCodeAt(i)) >>> 0;
  }
  return CHROME_COLORS[hash % CHROME_COLORS.length];
}

export interface SortAndGroupOptions {
  /** Restrict to one window. Omit to process every window. */
  windowId?: number;
  /** Tab ids that were just closed (e.g. duplicates) and must be excluded. */
  closedTabIds?: Set<number>;
}

function productKeyFor(
  tab: chrome.tabs.Tab,
  customGroups: CustomGroup[] | undefined,
): string {
  const hostname = getTabDomain(tab.url ?? '');
  const normalizedHost = hostname.toLowerCase();
  const customOverride = customGroups?.find(
    (cg) =>
      cg.hostname?.toLowerCase() === normalizedHost ||
      (cg.hostnameEndsWith && normalizedHost.endsWith(cg.hostnameEndsWith.toLowerCase())),
  );
  return customOverride ? customOverride.groupKey : productForHostname(hostname).key;
}

export async function sortAndGroupTabs(
  products: TabGroup[],
  options: SortAndGroupOptions = {},
): Promise<void> {
  const { windowId, closedTabIds = new Set<number>() } = options;

  const productOrder = products.map((p) => p.productKey ?? p.domain);
  const labelByKey = new Map<string, string>();
  for (const p of products) labelByKey.set(p.productKey ?? p.domain, p.friendlyName);

  const allTabs = windowId == null ? await queryAllTabs() : await queryTabs({ windowId });

  // Bucket real, non-closed tabs by window.
  const byWindow = new Map<number, chrome.tabs.Tab[]>();
  for (const tab of allTabs) {
    if (tab.id == null || tab.id < 0) continue;
    if (closedTabIds.has(tab.id)) continue;
    if (!isRealTab(tab.url ?? '')) continue;
    const list = byWindow.get(tab.windowId) ?? [];
    list.push(tab);
    byWindow.set(tab.windowId, list);
  }
  if (byWindow.size === 0) return;

  const customGroups = (await readStorage()).settings.customGroups;

  // 1. Sort each window in place (slot-based, pinned-aware).
  for (const windowTabs of byWindow.values()) {
    const sortable: SortableTab[] = windowTabs.map((t) => ({
      id: t.id as number,
      index: t.index,
      pinned: t.pinned ?? false,
      productKey: productKeyFor(t, customGroups),
    }));
    const moves = computeWindowSortMoves(sortable, productOrder);
    for (const move of moves) {
      try {
        await moveChromeTab(move.id, move.index);
      } catch (err) {
        console.warn('[Tab Organizer] Failed to move tab', move.id, err);
      }
    }
  }

  // 2. Create native Chrome tab groups from the now-adjacent tabs. We reuse the
  // pre-sort snapshot: tab ids are stable across moves, and chrome.tabs.group re-
  // collocates them, so no re-query is needed. Pinned tabs cannot be grouped, so they
  // are excluded. A product with only a single tab in a window is left ungrouped to
  // avoid cluttering Chrome with one-tab colored groups. Skips silently if the API is
  // unavailable.
  if (!chrome.tabGroups) return;
  for (const windowTabs of byWindow.values()) {
    const tabIdsByProduct = new Map<string, number[]>();
    for (const t of windowTabs) {
      if (t.pinned) continue;
      const key = productKeyFor(t, customGroups);
      const list = tabIdsByProduct.get(key) ?? [];
      list.push(t.id as number);
      tabIdsByProduct.set(key, list);
    }
    for (const [key, tabIds] of tabIdsByProduct) {
      if (tabIds.length < 2) continue;
      try {
        const groupId = await (chrome.tabs.group({
          tabIds: tabIds as [number, ...number[]],
        }) as Promise<number>);
        await (chrome.tabGroups.update(groupId, {
          title: labelByKey.get(key) ?? key,
          color: colorForProductKey(key),
          collapsed: false,
        }) as Promise<chrome.tabGroups.TabGroup>);
      } catch (err) {
        console.warn('[Tab Organizer] Failed to group product', key, err);
      }
    }
  }
}
