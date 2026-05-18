import { create } from 'zustand';
import type { ManualGroup, HistorySnapshot, GroupAssignment, Tab, TabGroup, ViewMode } from '../types';
import { groupTabsByDomain, autoAssignProductToSpace } from '../lib/tab-grouper';
import {
  clearHistory,
  deleteHistorySnapshot,
  promoteHistorySnapshot,
  readHistory,
  reconcileOrganizerState,
  writeGroupOrder,
  writeOrganizerState,
} from '../utils/storage';
import { legacyProductKeyForHostname, productForHostname } from '../config/products';
import { buildHistorySnapshot } from '../lib/history-snapshots';
import { duplicateTabIdsToClose } from '../lib/duplicate-tabs';
import { getTabDomain, isRealTab, isTabOutPage } from '../utils/url';
import { getErrorMessage } from '../utils/error';

// ─── Types ──────────────────────────────────────────────────────────

interface TabActions {
  /** Query all open Chrome tabs, filter to real web pages, and group by domain. */
  fetchTabs: () => Promise<void>;
  /** Close a single tab matching the exact URL. */
  closeTabByUrl: (url: string) => Promise<void>;
  /** Close one exact-match tab for each given URL. */
  closeOneTabPerUrl: (urls: string[]) => Promise<void>;
  /** Close tabs whose hostname matches any of the given URLs (file:// matched exactly). */
  closeTabsByUrls: (urls: string[]) => Promise<void>;
  /** Close tabs matching exact URLs (used for landing pages). */
  closeTabsExact: (urls: string[]) => Promise<void>;
  /** Close exact tab ids. */
  closeTabsByIds: (tabIds: number[]) => Promise<void>;
  /** Close duplicate tabs, optionally keeping one copy (prefer active tab). */
  closeDuplicates: (urls: string[], keepOne: boolean) => Promise<void>;
  /** Focus (activate) the tab matching the given URL, switching window if needed. */
  focusTab: (url: string) => Promise<void>;
  /** Register chrome.tabs listeners for real-time updates. Returns cleanup function. */
  startListeners: () => () => void;
  /** Reorder products after drag-and-drop and persist the new order. */
  reorderProducts: (newProducts: TabGroup[]) => void;
  /** Create a user-owned organization group. */
  createGroup: (name: string) => Promise<void>;
  /** Rename a user-owned organization group. */
  renameGroup: (groupId: string, name: string) => Promise<void>;
  /** Delete a group and return its items to the main area. */
  deleteGroup: (groupId: string) => Promise<void>;
  /** Update a manual group (such as name, emoji, autoRules). */
  updateGroup: (groupId: string, updates: Partial<Omit<ManualGroup, 'id'>>) => Promise<void>;
  /** Reorder manual groups and persist the new order. */
  reorderGroups: (groups: ManualGroup[]) => Promise<void>;
  /** Assign a product to a group. */
  moveProductToGroup: (productKey: string, groupId: string) => Promise<void>;
  /** Remove a product group assignment. */
  moveProductToMain: (productKey: string) => Promise<void>;
  /** Persist the visible organizer layout mode. */
  setViewMode: (viewMode: ViewMode) => Promise<void>;
  /** Clear the current error state. */
  clearError: () => void;
  /** Fetch recent history snapshots from storage. */
  fetchHistory: () => Promise<void>;
  /** Restore all tabs from a specific history snapshot. */
  restoreHistorySnapshot: (snapshotId: string) => Promise<void>;
  /** Restore tabs from a specific product within a snapshot. */
  restoreHistoryProduct: (snapshotId: string, productKey: string) => Promise<void>;
  /** Delete a specific snapshot from history. */
  deleteHistorySnapshot: (snapshotId: string) => Promise<void>;
  /** Clear all historical snapshots. */
  clearHistory: () => Promise<void>;
  /** Find and close all other open dashboard tabs except the current one. */
  closeExtraDashboards: () => Promise<void>;
  /** Set the currently active space to filter the dashboard. */
  setActiveSpace: (id: string | null) => void;
}

export type TabStore = {
  tabs: Tab[];
  products: TabGroup[];
  manualGroups: ManualGroup[];
  groupAssignments: GroupAssignment[];
  unsortedOverrides: string[];
  history: HistorySnapshot[];
  viewMode: ViewMode;
  loading: boolean;
  error: string | null;
  activeSpaceId: string | null;
} & TabActions;

// ─── Helpers ────────────────────────────────────────────────────────

/**
 * Map a raw chrome.tabs.Tab into our application Tab type.
 */
function toAppTab(raw: chrome.tabs.Tab): Tab {
  const url = raw.url ?? '';
  return {
    id: raw.id ?? -1,
    url,
    title: raw.title ?? '',
    favIconUrl: raw.favIconUrl ?? '',
    domain: getTabDomain(url),
    windowId: raw.windowId ?? -1,
    active: raw.active ?? false,
    isTabOut: isTabOutPage(url),
    isDuplicate: false,
    isLandingPage: false,
    duplicateCount: 0,
    lastAccessed: raw.lastAccessed,
    pinned: raw.pinned ?? false,
    audible: raw.audible ?? false,
  };
}

function orderedGroups(groups: ManualGroup[]): ManualGroup[] {
  return [...groups].sort((a, b) => a.order - b.order);
}

function buildProductKeyCompatibility(tabs: Tab[]): {
  currentProductKeys: Set<string>;
  legacyKeyMap: Map<string, string>;
  hostnamesByProductKey: Map<string, string[]>;
} {
  const currentProductKeys = new Set<string>();
  const legacyKeyMap = new Map<string, string>();
  const hostnamesByProductKey = new Map<string, Set<string>>();

  for (const tab of tabs) {
    const hostname = getTabDomain(tab.url);
    if (!hostname) continue;

    const product = productForHostname(hostname);
    const legacyKey = legacyProductKeyForHostname(hostname);

    currentProductKeys.add(product.key);
    const hostnames = hostnamesByProductKey.get(product.key) ?? new Set<string>();
    hostnames.add(hostname);
    hostnamesByProductKey.set(product.key, hostnames);
    if (legacyKey !== product.key) {
      legacyKeyMap.set(legacyKey, product.key);
    }
  }

  return {
    currentProductKeys,
    legacyKeyMap,
    hostnamesByProductKey: new Map(
      [...hostnamesByProductKey.entries()].map(([productKey, hostnames]) => [
        productKey,
        [...hostnames],
      ]),
    ),
  };
}

async function protectHistoryBeforeClosing(allTabs: chrome.tabs.Tab[]): Promise<void> {
  try {
    const snapshot = buildHistorySnapshot(allTabs.map(toAppTab));
    await promoteHistorySnapshot(snapshot);
  } catch (err: unknown) {
    console.warn('[Tab Out] Failed to protect history before closing tabs:', err);
  }
}

// ─── Store ──────────────────────────────────────────────────────────

export const useTabStore = create<TabStore>((set) => ({
  tabs: [],
  products: [],
  manualGroups: [],
  groupAssignments: [],
  unsortedOverrides: [],
  history: [],
  viewMode: 'cards',
  loading: false,
  error: null,
  activeSpaceId: null,

  setActiveSpace: (id) => set({ activeSpaceId: id }),

  clearError: () => set({ error: null }),

  fetchTabs: async () => {
    set({ error: null });
    try {
      const rawTabs = await chrome.tabs.query({});
      const mapped = rawTabs.map(toAppTab).filter((t) => isRealTab(t.url));
      const { currentProductKeys, legacyKeyMap, hostnamesByProductKey } =
        buildProductKeyCompatibility(mapped);
      const organizerState = await reconcileOrganizerState(currentProductKeys, legacyKeyMap);
      const groupOrder = organizerState.groupOrder;
      const productGroups = groupTabsByDomain(mapped, groupOrder);
      const manualGroups = orderedGroups(organizerState.manualGroups);
      const unsortedOverrideSet = new Set(organizerState.unsortedOverrides);
      
      let groupAssignments = organizerState.groupAssignments;
      let hasNewAssignments = false;
      const assignedKeys = new Set(groupAssignments.map((a) => a.productKey));

      for (const product of productGroups) {
        const productKey = product.productKey ?? product.domain;
        if (!assignedKeys.has(productKey) && !unsortedOverrideSet.has(productKey)) {
          const spaceId = autoAssignProductToSpace(
            hostnamesByProductKey.get(productKey) ?? [productKey],
            manualGroups,
          );
          if (spaceId) {
            const existingInGroup = groupAssignments.filter((a) => a.groupId === spaceId);
            groupAssignments = [
              ...groupAssignments,
              { productKey, groupId: spaceId, order: existingInGroup.length }
            ];
            hasNewAssignments = true;
            assignedKeys.add(productKey);
          }
        }
      }

      if (hasNewAssignments) {
        await writeOrganizerState({ groupAssignments }).catch(err => {
          console.warn('[Tab Out] Failed to persist auto-assignments:', err);
        });
      }

      const products = productGroups;

      set({
        tabs: mapped,
        products,
        manualGroups,
        groupAssignments,
        unsortedOverrides: organizerState.unsortedOverrides,
        viewMode: organizerState.viewMode,
        loading: false,
      });
    } catch (err: unknown) {
      set({ tabs: [], products: [], loading: false, error: getErrorMessage(err, 'Failed to fetch tabs') });
    }
  },

  closeTabByUrl: async (url: string) => {
    if (!url) return;
    const allTabs = await chrome.tabs.query({});
    const match = allTabs.find((t) => t.url === url);
    if (match?.id != null) {
      await protectHistoryBeforeClosing(allTabs);
      await chrome.tabs.remove(match.id);
    }
    await useTabStore.getState().fetchTabs();
  },

  closeOneTabPerUrl: async (urls: string[]) => {
    if (!urls || urls.length === 0) return;

    const uniqueUrls = [...new Set(urls)];
    const allTabs = await chrome.tabs.query({});
    const toClose = uniqueUrls
      .map((url) => allTabs.find((tab) => tab.url === url)?.id)
      .filter((id): id is number => id != null);

    if (toClose.length > 0) {
      await protectHistoryBeforeClosing(allTabs);
      await chrome.tabs.remove(toClose);
    }

    await useTabStore.getState().fetchTabs();
  },

  closeTabsByUrls: async (urls: string[]) => {
    if (!urls || urls.length === 0) return;

    // Separate file:// URLs (exact match) from regular URLs (hostname match)
    const targetHostnames: string[] = [];
    const exactUrls = new Set<string>();

    for (const u of urls) {
      if (u.startsWith('file://')) {
        exactUrls.add(u);
      } else {
        try {
          targetHostnames.push(new URL(u).hostname);
        } catch {
          // skip unparseable URLs
        }
      }
    }

    const allTabs = await chrome.tabs.query({});
    const toClose = allTabs
      .filter((tab) => {
        const tabUrl = tab.url ?? '';
        if (tabUrl.startsWith('file://') && exactUrls.has(tabUrl)) return true;
        try {
          const tabHostname = new URL(tabUrl).hostname;
          return tabHostname !== '' && targetHostnames.includes(tabHostname);
        } catch {
          return false;
        }
      })
      .map((tab) => tab.id)
      .filter((id): id is number => id != null);

    if (toClose.length > 0) {
      await protectHistoryBeforeClosing(allTabs);
      await chrome.tabs.remove(toClose);
    }
    await useTabStore.getState().fetchTabs();
  },

  closeTabsExact: async (urls: string[]) => {
    if (!urls || urls.length === 0) return;
    const urlSet = new Set(urls);
    const allTabs = await chrome.tabs.query({});
    const toClose = allTabs
      .filter((t) => t.url && urlSet.has(t.url))
      .map((t) => t.id)
      .filter((id): id is number => id != null);
    if (toClose.length > 0) {
      await protectHistoryBeforeClosing(allTabs);
      await chrome.tabs.remove(toClose);
    }
    await useTabStore.getState().fetchTabs();
  },

  closeTabsByIds: async (tabIds: number[]) => {
    if (!tabIds || tabIds.length === 0) return;

    const ids = [...new Set(tabIds)].filter((id) => Number.isInteger(id));
    if (ids.length === 0) return;

    const allTabs = await chrome.tabs.query({});
    const openIds = new Set(
      allTabs
        .map((tab) => tab.id)
        .filter((id): id is number => id != null),
    );
    const toClose = ids.filter((id) => openIds.has(id));

    if (toClose.length > 0) {
      await protectHistoryBeforeClosing(allTabs);
      await chrome.tabs.remove(toClose);
    }

    await useTabStore.getState().fetchTabs();
  },

  closeDuplicates: async (urls: string[], keepOne: boolean) => {
    if (!urls || urls.length === 0) return;
    const allTabs = await chrome.tabs.query({});
    const toClose = duplicateTabIdsToClose(allTabs, new Set(urls), keepOne);

    if (toClose.length > 0) {
      await protectHistoryBeforeClosing(allTabs);
      await chrome.tabs.remove(toClose);
    }
    await useTabStore.getState().fetchTabs();
  },

  focusTab: async (url: string) => {
    if (!url) return;
    const allTabs = await chrome.tabs.query({});
    const currentWindow = await chrome.windows.getCurrent();

    // Try exact URL match first
    let matches = allTabs.filter((t) => t.url === url);

    // Fall back to hostname match
    if (matches.length === 0) {
      try {
        const targetHost = new URL(url).hostname;
        matches = allTabs.filter((t) => {
          try {
            return new URL(t.url ?? '').hostname === targetHost;
          } catch {
            return false;
          }
        });
      } catch {
        // URL parsing failed, no matches
      }
    }

    if (matches.length === 0) return;

    // Prefer a match in a different window so it actually switches windows
    const match =
      matches.find((t) => t.windowId !== currentWindow.id) ?? matches[0];

    if (match.id != null) {
      await chrome.tabs.update(match.id, { active: true });
    }
    await chrome.windows.update(match.windowId, { focused: true });
  },

  startListeners: () => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const refresh = (): void => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        useTabStore.getState().fetchTabs();
      }, 300);
    };

    const onCreated = (): void => refresh();
    const onRemoved = (): void => refresh();
    const onUpdated = (_tabId: number, info: chrome.tabs.OnUpdatedInfo): void => {
      if (info.url || info.title || info.favIconUrl || info.status === 'complete') {
        refresh();
      }
    };

    chrome.tabs.onCreated.addListener(onCreated);
    chrome.tabs.onRemoved.addListener(onRemoved);
    chrome.tabs.onUpdated.addListener(onUpdated);

    return () => {
      chrome.tabs.onCreated.removeListener(onCreated);
      chrome.tabs.onRemoved.removeListener(onRemoved);
      chrome.tabs.onUpdated.removeListener(onUpdated);
      if (timer) clearTimeout(timer);
    };
  },

  reorderProducts: (newProducts: TabGroup[]) => {
    const groupOrder: Record<string, number> = {};
    for (const p of useTabStore.getState().products) {
      groupOrder[p.productKey ?? p.domain] = p.order;
    }
    for (let i = 0; i < newProducts.length; i++) {
      const p = newProducts[i];
      groupOrder[p.productKey ?? p.domain] = i;
    }
    set({ products: newProducts });
    writeGroupOrder(groupOrder).catch((err: unknown) => {
      console.warn('[Tab Out] Failed to persist product order:', err);
    });
  },

  createGroup: async (name: string) => {
    const trimmed = name.trim() || 'Untitled';
    const current = useTabStore.getState().manualGroups;
    const group: ManualGroup = {
      id: crypto.randomUUID(),
      name: trimmed,
      order: current.length,
    };
    const nextGroups = [...current, group];
    set({ manualGroups: nextGroups });
    await writeOrganizerState({ manualGroups: nextGroups });
  },

  renameGroup: async (groupId: string, name: string) => {
    const trimmed = name.trim() || 'Untitled';
    const nextGroups = useTabStore
      .getState()
      .manualGroups
      .map((g) => g.id === groupId ? { ...g, name: trimmed } : g);
    set({ manualGroups: nextGroups });
    await writeOrganizerState({ manualGroups: nextGroups });
  },

  updateGroup: async (groupId: string, updates: Partial<Omit<ManualGroup, 'id'>>) => {
    const nextGroups = useTabStore
      .getState()
      .manualGroups
      .map((g) => g.id === groupId ? { ...g, ...updates } : g);
    set({ manualGroups: nextGroups });
    await writeOrganizerState({ manualGroups: nextGroups });
    // Refetch to apply auto-rules updates immediately
    await useTabStore.getState().fetchTabs();
  },

  deleteGroup: async (groupId: string) => {
    const nextGroups = useTabStore
      .getState()
      .manualGroups
      .filter((g) => g.id !== groupId)
      .map((g, index) => ({ ...g, order: index }));
    const nextAssignments = useTabStore
      .getState()
      .groupAssignments
      .filter((assignment) => assignment.groupId !== groupId);

    set({ manualGroups: nextGroups, groupAssignments: nextAssignments });
    await writeOrganizerState({
      manualGroups: nextGroups,
      groupAssignments: nextAssignments,
    });
    await useTabStore.getState().fetchTabs();
  },

  reorderGroups: async (groups: ManualGroup[]) => {
    const nextGroups = groups.map((g, index) => ({ ...g, order: index }));
    set({ manualGroups: nextGroups });
    await writeOrganizerState({ manualGroups: nextGroups });
  },

  moveProductToGroup: async (productKey: string, groupId: string) => {
    const current = useTabStore.getState();
    const existingInGroup = current.groupAssignments.filter(
      (assignment) => assignment.groupId === groupId,
    );
    const nextAssignment: GroupAssignment = {
      productKey,
      groupId,
      order: existingInGroup.length,
    };
    const nextAssignments = [
      ...current.groupAssignments.filter(
        (assignment) => assignment.productKey !== productKey,
      ),
      nextAssignment,
    ];
    const nextOverrides = current.unsortedOverrides.filter((key) => key !== productKey);

    set({ groupAssignments: nextAssignments, unsortedOverrides: nextOverrides });
    await writeOrganizerState({
      groupAssignments: nextAssignments,
      unsortedOverrides: nextOverrides,
    });
    await useTabStore.getState().fetchTabs();
  },

  moveProductToMain: async (productKey: string) => {
    const current = useTabStore.getState();
    const nextAssignments = current.groupAssignments
      .filter((assignment) => assignment.productKey !== productKey);
    const nextOverrides = current.unsortedOverrides.includes(productKey)
      ? current.unsortedOverrides
      : [...current.unsortedOverrides, productKey];
    set({ groupAssignments: nextAssignments, unsortedOverrides: nextOverrides });
    await writeOrganizerState({
      groupAssignments: nextAssignments,
      unsortedOverrides: nextOverrides,
    });
    await useTabStore.getState().fetchTabs();
  },

  setViewMode: async (viewMode: ViewMode) => {
    set({ viewMode });
    await writeOrganizerState({ viewMode });
  },

  fetchHistory: async () => {
    const snapshots = await readHistory();
    set({ history: snapshots });
  },

  restoreHistorySnapshot: async (snapshotId: string) => {
    const snapshots = await readHistory();
    const snapshot = snapshots.find((s) => s.id === snapshotId);
    if (!snapshot) return;

    for (const tab of snapshot.tabs) {
      await chrome.tabs.create({ url: tab.url, active: false });
    }
    await useTabStore.getState().fetchTabs();
  },

  restoreHistoryProduct: async (snapshotId: string, productKey: string) => {
    const snapshots = await readHistory();
    const snapshot = snapshots.find((s) => s.id === snapshotId);
    if (!snapshot) return;

    const productTabs = snapshot.tabs.filter((t) => t.productKey === productKey);
    for (const tab of productTabs) {
      await chrome.tabs.create({ url: tab.url, active: false });
    }
    await useTabStore.getState().fetchTabs();
  },

  deleteHistorySnapshot: async (id: string) => {
    await deleteHistorySnapshot(id);
    await useTabStore.getState().fetchHistory();
  },

  clearHistory: async () => {
    await clearHistory();
    set({ history: [] });
  },

  closeExtraDashboards: async () => {
    try {
      const currentTab = await chrome.tabs.getCurrent();
      const currentTabId = currentTab?.id ?? -1;
      const allTabs = useTabStore.getState().tabs;
      const extraDashboards = allTabs
        .filter((t) => t.isTabOut && t.id !== currentTabId)
        .map((t) => t.url);

      if (extraDashboards.length > 0) {
        await useTabStore.getState().closeTabsExact(extraDashboards);
      }
    } catch (err: unknown) {
      console.warn('[Tab Out] Failed to close extra dashboards:', err);
    }
  },
}));
