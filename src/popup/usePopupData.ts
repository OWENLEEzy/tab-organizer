import { useState, useEffect, useCallback } from 'react';
import type { Section, SectionAssignment, TabGroup } from '../types';
import type { AccentKey } from '../config/themes';
import { resolveLocale, type Locale } from '../lib/i18n/translate-core';
import { queryAllTabs, subscribeToTabEvents } from '../utils/chrome-tabs';
import { readStorage } from '../utils/storage';
import { isRealTab, getTabDomain } from '../lib/url-rules';
import { groupTabsByProduct } from '../lib/product-groups';
import { getProductKey } from '../lib/product-key';
import { duplicateTabIdsToClose } from '../lib/duplicate-tabs';

const DEFAULT_LOCALE: Locale = resolveLocale(
  undefined,
  typeof navigator !== 'undefined' ? navigator.language : undefined,
);

interface PopupGroup {
  productKey: string;
  friendlyName: string;
  iconDomain: string;
  tabCount: number;
}

export interface PopupSection {
  id: string;
  name: string;
  emoji?: string;
  groups: PopupGroup[];
  tabCount: number;
}

export interface PopupData {
  totalTabs: number;
  totalGroups: number;
  unassignedCount: number;
  duplicateCount: number;
  windowCount: number;
  activeSections: PopupSection[];
  unassignedGroups: PopupGroup[];
  groups: TabGroup[];
  sections: Section[];
  assignments: SectionAssignment[];
  unsectionedProductKeys: string[];
  groupOrder: Record<string, number>;
  theme: AccentKey;
  locale: Locale;
  isLoading: boolean;
}

const EMPTY: PopupData = {
  totalTabs: 0, totalGroups: 0, unassignedCount: 0, duplicateCount: 0, windowCount: 0,
  activeSections: [], unassignedGroups: [], groups: [], sections: [],
  assignments: [], unsectionedProductKeys: [], groupOrder: {}, theme: 'clay',
  locale: DEFAULT_LOCALE, isLoading: true,
};

export function usePopupData(): PopupData {
  const [data, setData] = useState<PopupData>(EMPTY);

  const fetchData = useCallback(async (): Promise<PopupData> => {
    const [chromeTabs, storage] = await Promise.all([queryAllTabs(), readStorage()]);

    const realChromeTabs = chromeTabs.filter((t) => isRealTab(t.url ?? ''));
    const tabs = realChromeTabs.map((t) => ({
      id: t.id ?? -1,
      url: t.url ?? '',
      title: t.title ?? '',
      favIconUrl: t.favIconUrl ?? '',
      domain: getTabDomain(t.url ?? ''),
      windowId: t.windowId ?? -1,
      active: t.active ?? false,
      isDashboard: false,
      isDuplicate: false,
      isLandingPage: false,
      duplicateCount: 0,
      lastAccessed: (t as chrome.tabs.Tab & { lastAccessed?: number }).lastAccessed,
    }));

    const groups = groupTabsByProduct(tabs, storage.groupOrder, storage.settings.customGroups);
    const { sections, sectionAssignments, unsectionedProductKeys, groupOrder } = storage;

    const assignedKeys = new Set(sectionAssignments.map((a) => a.productKey));

    // Build active sections with their product groups
    const groupsBySection = new Map<string, PopupGroup[]>();
    for (const a of sectionAssignments) {
      const g = groups.find((gr) => getProductKey(gr) === a.productKey);
      if (!g) continue;
      const list = groupsBySection.get(a.sectionId) ?? [];
      list.push({
        productKey: a.productKey,
        friendlyName: g.friendlyName,
        iconDomain: g.iconDomain ?? g.domain,
        tabCount: g.tabs.length,
      });
      groupsBySection.set(a.sectionId, list);
    }
    const activeSections: PopupSection[] = sections
      .filter((s) => (groupsBySection.get(s.id)?.length ?? 0) > 0)
      .sort((a, b) => a.order - b.order)
      .map((s) => {
        const sGroups = groupsBySection.get(s.id) ?? [];
        return {
          id: s.id,
          name: s.name,
          emoji: s.emoji,
          groups: sGroups,
          tabCount: sGroups.reduce((n, g) => n + g.tabCount, 0),
        };
      });

    // Unassigned groups
    const unassignedGroups: PopupGroup[] = groups
      .filter((g) => !assignedKeys.has(getProductKey(g)))
      .map((g) => ({
        productKey: getProductKey(g),
        friendlyName: g.friendlyName,
        iconDomain: g.iconDomain ?? g.domain,
        tabCount: g.tabs.length,
      }));

    // Duplicates
    const allTabs = groups.flatMap((g) => g.tabs);
    const dupIds = duplicateTabIdsToClose(allTabs, undefined, true);

    const windowIds = new Set(realChromeTabs.map((t) => t.windowId));

    return {
      totalTabs: tabs.length,
      totalGroups: groups.length,
      unassignedCount: unassignedGroups.length,
      duplicateCount: dupIds.length,
      windowCount: windowIds.size,
      activeSections,
      unassignedGroups,
      groups,
      sections,
      assignments: sectionAssignments,
      unsectionedProductKeys,
      groupOrder,
      theme: storage.settings.theme,
      locale: resolveLocale(
        storage.settings.language,
        typeof navigator !== 'undefined' ? navigator.language : undefined,
      ),
      isLoading: false,
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const reload = () => {
      void fetchData()
        .then((newData) => {
          if (!cancelled) setData(newData);
        })
        .catch((err) => {
          console.error('[Tab Organizer] Popup data load failed', err);
        });
    };
    reload();
    const unsubscribe = subscribeToTabEvents(reload);

    // Also react to storage changes (settings, section assignments) so the popup
    // never shows a stale snapshot — e.g. when the dashboard or organize updates state.
    const storageEvents = typeof chrome !== 'undefined' ? chrome.storage?.onChanged : undefined;
    const onStorageChanged = (_changes: Record<string, chrome.storage.StorageChange>, areaName: string): void => {
      if (areaName === 'local') reload();
    };
    storageEvents?.addListener(onStorageChanged);

    return () => {
      cancelled = true;
      unsubscribe();
      storageEvents?.removeListener(onStorageChanged);
    };
  }, [fetchData]);

  return data;
}
