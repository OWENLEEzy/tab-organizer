/**
 * Shared "sort + native group" capability for Chrome tabs.
 *
 * Used by both the dashboard "sort window" action (single window) and the popup
 * "organize" action (all windows). It physically reorders real tabs so same-product
 * tabs sit together, then creates native Chrome tab groups — one per SECTION (区域).
 * Sorting happens BEFORE grouping so the two steps never fight over tab order.
 *
 * Native Chrome groups can't nest, so we group at the section level: a section's
 * products are contiguous after sorting, so one group spans them. Products with no
 * section stay ungrouped. Failures are counted and returned (never swallowed) so
 * callers can report honest results.
 */

import type { TabGroup, CustomGroup } from '../types';
import type { ProductSectionRef } from '../lib/section-grouping';
import { computeWindowSortMoves, type SortableTab } from '../lib/window-sort';
import { getTabDomain, isRealTab } from '../lib/url-rules';
import { resolveProduct } from '../lib/resolve-product';
import { queryAllTabs, queryTabs, moveChromeTab } from './chrome-tabs';
import { readStorage } from './storage';

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
}

export interface SortAndGroupResult {
  /** Number of individual tab-move calls that failed. */
  moveFailures: number;
  /** Number of section-group operations that failed. */
  groupFailures: number;
}

function productKeyFor(tab: chrome.tabs.Tab, customGroups: CustomGroup[] | undefined): string {
  return resolveProduct(getTabDomain(tab.url ?? ''), customGroups).key;
}

export async function sortAndGroupTabs(
  products: TabGroup[],
  options: SortAndGroupOptions = {},
): Promise<SortAndGroupResult> {
  const { windowId, closedTabIds = new Set<number>(), sectionByProductKey } = options;
  const result: SortAndGroupResult = { moveFailures: 0, groupFailures: 0 };

  const productOrder = products.map((p) => p.productKey ?? p.domain);

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
  if (byWindow.size === 0) return result;

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
        result.moveFailures++;
        console.warn('[Tab Organizer] Failed to move tab', move.id, err);
      }
    }
  }

  // 2. Create native Chrome groups — one per SECTION — from the now-adjacent tabs.
  // Pinned tabs cannot be grouped, so they are excluded. Products with no section
  // are left ungrouped. Skips silently if the API or section info is unavailable.
  if (!chrome.tabGroups || !sectionByProductKey || sectionByProductKey.size === 0) {
    return result;
  }

  for (const windowTabs of byWindow.values()) {
    const bySection = new Map<string, { ref: ProductSectionRef; tabIds: number[] }>();
    for (const t of windowTabs) {
      if (t.pinned) continue;
      const ref = sectionByProductKey.get(productKeyFor(t, customGroups));
      if (!ref) continue;
      const entry = bySection.get(ref.sectionId) ?? { ref, tabIds: [] };
      entry.tabIds.push(t.id as number);
      bySection.set(ref.sectionId, entry);
    }

    for (const { ref, tabIds } of bySection.values()) {
      if (tabIds.length === 0) continue;
      try {
        const groupId = await (chrome.tabs.group({
          tabIds: tabIds as [number, ...number[]],
        }) as Promise<number>);
        await (chrome.tabGroups.update(groupId, {
          title: ref.emoji ? `${ref.emoji} ${ref.name}` : ref.name,
          color: colorForKey(ref.sectionId),
          collapsed: false,
        }) as Promise<chrome.tabGroups.TabGroup>);
      } catch (err) {
        result.groupFailures++;
        console.warn('[Tab Organizer] Failed to group section', ref.sectionId, err);
      }
    }
  }

  return result;
}
