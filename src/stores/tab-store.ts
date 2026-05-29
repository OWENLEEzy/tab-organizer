import { create } from 'zustand';
import type { Section, RecoverySnapshot, SectionAssignment, Tab, TabGroup, ViewMode, CustomGroup } from '../types';
import { groupTabsByProduct } from '../lib/product-groups';
import {
  assignProductToSection as assignProductToSectionModel,
  autoAssignProducts,
  deleteSectionAndUnassignProducts,
  moveProductToUnsectioned,
} from '../lib/section-organizer';
import {
  clearRecoverySnapshots,
  deleteRecoverySnapshot,
  promoteRecoverySnapshot,
  readRecoverySnapshots,
  reconcileOrganizerState,
  writeGroupOrder,
  writeOrganizerState,
} from '../utils/storage';
import { legacyProductKeyForHostname, productForHostname } from '../config/products';
import { buildRecoverySnapshot } from '../lib/recovery-snapshots';
import { duplicateTabIdsToClose } from '../lib/duplicate-tabs';
import { getTabDomain, isRealTab } from '../lib/url-rules';
import { isTabOrganizerPage } from '../utils/browser-url';
import { getErrorMessage } from '../utils/error';
import { useSettingsStore } from './settings-store';

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
  /** Create a user-owned organization section. */
  createSection: (name: string) => Promise<void>;
  /** Rename a user-owned organization section. */
  renameSection: (sectionId: string, name: string) => Promise<void>;
  /** Delete a section and return its product groups to the unassigned area. */
  deleteSection: (sectionId: string) => Promise<void>;
  /** Update a section (such as name, emoji, autoRules). */
  updateSection: (sectionId: string, updates: Partial<Omit<Section, 'id'>>) => Promise<void>;
  /** Reorder sections and persist the new order. */
  reorderSections: (groups: Section[]) => Promise<void>;
  /** Assign a product group to a section. */
  moveProductGroupToSection: (productKey: string, sectionId: string) => Promise<void>;
  /** Remove a product group assignment. */
  moveProductToUnsectioned: (productKey: string) => Promise<void>;
  /** Persist the visible organizer layout mode. */
  setViewMode: (viewMode: ViewMode) => Promise<void>;
  /** Clear the current error state. */
  clearError: () => void;
  /** Fetch recent recovery snapshots from storage. */
  fetchRecovery: () => Promise<void>;
  /** Restore all tabs from a specific recovery snapshot. */
  restoreRecoverySnapshot: (snapshotId: string) => Promise<void>;
  /** Restore tabs from a specific product within a snapshot. */
  restoreRecoveryProduct: (snapshotId: string, productKey: string) => Promise<void>;
  /** Delete a specific recovery snapshot. */
  deleteRecoverySnapshot: (snapshotId: string) => Promise<void>;
  /** Clear all recovery snapshots. */
  clearRecovery: () => Promise<void>;
  /** Find and close all other open dashboard tabs except the current one. */
  closeExtraDashboards: () => Promise<void>;
  /** Set the currently active section to filter the dashboard. */
  setActiveSection: (id: string | null) => void;
  /** Overwrite sections and sectionAssignments with imported backup. */
  importBackup: (
    sections: Section[],
    sectionAssignments: SectionAssignment[],
    unsectionedProductKeys?: string[],
  ) => Promise<void>;
  /** Sort the current Chrome window's real tabs to match the dashboard product order. */
  sortCurrentWindowTabsByDashboardOrder: (products: TabGroup[]) => Promise<void>;
}

export type TabStore = {
  tabs: Tab[];
  products: TabGroup[];
  sections: Section[];
  sectionAssignments: SectionAssignment[];
  unsectionedProductKeys: string[];
  recoverySnapshots: RecoverySnapshot[];
  viewMode: ViewMode;
  loading: boolean;
  error: string | null;
  activeSectionId: string | null;
  dashboardCount: number;
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
    isDashboard: isTabOrganizerPage(url),
    isDuplicate: false,
    isLandingPage: false,
    duplicateCount: 0,
    lastAccessed: raw.lastAccessed,
    pinned: raw.pinned ?? false,
    audible: raw.audible ?? false,
  };
}

function orderedSections(groups: Section[]): Section[] {
  return [...groups].sort((a, b) => a.order - b.order);
}

function buildProductKeyCompatibility(
  tabs: Tab[],
  customGroups?: CustomGroup[],
): {
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

    const normalizedHost = hostname.toLowerCase();
    const customOverride = customGroups?.find(
      (cg) =>
        cg.hostname?.toLowerCase() === normalizedHost ||
        (cg.hostnameEndsWith && normalizedHost.endsWith(cg.hostnameEndsWith.toLowerCase())),
    );

    const product = customOverride
      ? {
          key: customOverride.groupKey,
          label: customOverride.groupLabel,
          iconDomain: hostname,
        }
      : productForHostname(hostname);

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

async function protectRecoveryBeforeClosing(allTabs: chrome.tabs.Tab[]): Promise<void> {
  try {
    const snapshot = buildRecoverySnapshot(allTabs.map(toAppTab));
    await promoteRecoverySnapshot(snapshot);
  } catch (err: unknown) {
    console.warn('[Tab Organizer] Failed to protect recovery before closing tabs:', err);
  }
}

// ─── Store ──────────────────────────────────────────────────────────

export const useTabStore = create<TabStore>((set) => ({
  tabs: [],
  products: [],
  sections: [],
  sectionAssignments: [],
  unsectionedProductKeys: [],
  recoverySnapshots: [],
  viewMode: 'cards',
  loading: false,
  error: null,
  activeSectionId: null,
  dashboardCount: 0,

  setActiveSection: (id) => set({ activeSectionId: id }),

  clearError: () => set({ error: null }),

  fetchTabs: async () => {
    set({ error: null });
    try {
      const rawTabs = await chrome.tabs.query({});
      const rawMapped = rawTabs.map(toAppTab);
      const dashboardCount = rawMapped.filter((tab) => tab.isDashboard).length;
      const mapped = rawMapped.filter((tab) => isRealTab(tab.url));
      const customGroups = useSettingsStore.getState().settings.customGroups;
      const { currentProductKeys, legacyKeyMap, hostnamesByProductKey } =
        buildProductKeyCompatibility(mapped, customGroups);
      const organizerState = await reconcileOrganizerState(currentProductKeys, legacyKeyMap);
      const groupOrder = organizerState.groupOrder;
      const productGroups = groupTabsByProduct(mapped, groupOrder, customGroups);
      const sections = orderedSections(organizerState.sections);
      let sectionAssignments = organizerState.sectionAssignments;
      let hasNewAssignments = false;
      const newAssignments = autoAssignProducts({
        products: productGroups,
        sections,
        assignments: sectionAssignments,
        noSectionOverrides: organizerState.unsectionedProductKeys,
        hostnamesByProductKey,
      });

      if (newAssignments.length > 0) {
        sectionAssignments = [...sectionAssignments, ...newAssignments];
        hasNewAssignments = true;
      }

      if (hasNewAssignments) {
        await writeOrganizerState({ sectionAssignments }).catch(err => {
          console.warn('[Tab Organizer] Failed to persist auto-assignments:', err);
        });
      }

      const products = productGroups;

      set({
        tabs: mapped,
        products,
        sections,
        sectionAssignments,
        unsectionedProductKeys: organizerState.unsectionedProductKeys,
        viewMode: organizerState.viewMode,
        loading: false,
        dashboardCount,
      });
    } catch (err: unknown) {
      set({ tabs: [], products: [], loading: false, dashboardCount: 0, error: getErrorMessage(err, 'Failed to fetch tabs') });
    }
  },

  closeTabByUrl: async (url: string) => {
    if (!url) return;
    try {
      const allTabs = await chrome.tabs.query({});
      const match = allTabs.find((t) => t.url === url);
      if (match?.id != null) {
        await protectRecoveryBeforeClosing(allTabs);
        await chrome.tabs.remove(match.id);
      }
    } finally {
      await useTabStore.getState().fetchTabs();
    }
  },

  closeOneTabPerUrl: async (urls: string[]) => {
    if (!urls || urls.length === 0) return;

    const uniqueUrls = [...new Set(urls)];
    const allTabs = await chrome.tabs.query({});
    const toClose = uniqueUrls
      .map((url) => allTabs.find((tab) => tab.url === url)?.id)
      .filter((id): id is number => id != null);

    try {
      if (toClose.length > 0) {
        await protectRecoveryBeforeClosing(allTabs);
        await chrome.tabs.remove(toClose);
      }
    } finally {
      await useTabStore.getState().fetchTabs();
    }
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

    try {
      if (toClose.length > 0) {
        await protectRecoveryBeforeClosing(allTabs);
        await chrome.tabs.remove(toClose);
      }
    } finally {
      await useTabStore.getState().fetchTabs();
    }
  },

  closeTabsExact: async (urls: string[]) => {
    if (!urls || urls.length === 0) return;
    const urlSet = new Set(urls);
    const allTabs = await chrome.tabs.query({});
    const toClose = allTabs
      .filter((t) => t.url && urlSet.has(t.url))
      .map((t) => t.id)
      .filter((id): id is number => id != null);
    try {
      if (toClose.length > 0) {
        await protectRecoveryBeforeClosing(allTabs);
        await chrome.tabs.remove(toClose);
      }
    } finally {
      await useTabStore.getState().fetchTabs();
    }
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

    try {
      if (toClose.length > 0) {
        await protectRecoveryBeforeClosing(allTabs);
        await chrome.tabs.remove(toClose);
      }
    } finally {
      await useTabStore.getState().fetchTabs();
    }
  },

  closeDuplicates: async (urls: string[], keepOne: boolean) => {
    if (!urls || urls.length === 0) return;
    const allTabs = await chrome.tabs.query({});
    const toClose = duplicateTabIdsToClose(allTabs, new Set(urls), keepOne);

    try {
      if (toClose.length > 0) {
        await protectRecoveryBeforeClosing(allTabs);
        await chrome.tabs.remove(toClose);
      }
    } finally {
      await useTabStore.getState().fetchTabs();
    }
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

    try {
      if (match.id != null) {
        await chrome.tabs.update(match.id, { active: true });
      }
      await chrome.windows.update(match.windowId, { focused: true });
    } finally {
      await useTabStore.getState().fetchTabs();
    }
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
    const onMoved = (_tabId: number, _info: chrome.tabs.OnMovedInfo): void => refresh();
    const onUpdated = (_tabId: number, info: chrome.tabs.OnUpdatedInfo): void => {
      if (info.url || info.title || info.favIconUrl || info.status === 'complete') {
        refresh();
      }
    };

    chrome.tabs.onCreated.addListener(onCreated);
    chrome.tabs.onRemoved.addListener(onRemoved);
    chrome.tabs.onMoved.addListener(onMoved);
    chrome.tabs.onUpdated.addListener(onUpdated);

    return () => {
      chrome.tabs.onCreated.removeListener(onCreated);
      chrome.tabs.onRemoved.removeListener(onRemoved);
      chrome.tabs.onMoved.removeListener(onMoved);
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
      console.warn('[Tab Organizer] Failed to persist product order:', err);
    });
  },

  createSection: async (name: string) => {
    const trimmed = name.trim() || 'Untitled';
    const current = useTabStore.getState().sections;
    const group: Section = {
      id: crypto.randomUUID(),
      name: trimmed,
      order: current.length,
    };
    const nextSections = [...current, group];
    set({ sections: nextSections });
    await writeOrganizerState({ sections: nextSections });
  },

  renameSection: async (sectionId: string, name: string) => {
    const trimmed = name.trim() || 'Untitled';
    const nextSections = useTabStore
      .getState()
      .sections
      .map((g) => g.id === sectionId ? { ...g, name: trimmed } : g);
    set({ sections: nextSections });
    await writeOrganizerState({ sections: nextSections });
  },

  updateSection: async (sectionId: string, updates: Partial<Omit<Section, 'id'>>) => {
    const nextSections = useTabStore
      .getState()
      .sections
      .map((g) => g.id === sectionId ? { ...g, ...updates } : g);
    set({ sections: nextSections });
    await writeOrganizerState({ sections: nextSections });
    // Refetch to apply auto-rules updates immediately
    await useTabStore.getState().fetchTabs();
  },

  deleteSection: async (sectionId: string) => {
    const state = useTabStore.getState();
    const { assignments: nextAssignments, overrides: nextOverrides } = deleteSectionAndUnassignProducts(
      state.sectionAssignments,
      state.unsectionedProductKeys,
      sectionId,
    );
    const nextSections = state.sections
      .filter((section) => section.id !== sectionId)
      .map((section, index) => ({ ...section, order: index }));

    set({
      sections: nextSections,
      sectionAssignments: nextAssignments,
      unsectionedProductKeys: nextOverrides,
    });
    await writeOrganizerState({
      sections: nextSections,
      sectionAssignments: nextAssignments,
      unsectionedProductKeys: nextOverrides,
    });
    await useTabStore.getState().fetchTabs();
  },

  reorderSections: async (groups: Section[]) => {
    const nextSections = groups.map((g, index) => ({ ...g, order: index }));
    set({ sections: nextSections });
    await writeOrganizerState({ sections: nextSections });
  },

  moveProductGroupToSection: async (productKey: string, sectionId: string) => {
    const state = useTabStore.getState();
    const nextAssignments = assignProductToSectionModel(state.sectionAssignments, productKey, sectionId);
    const nextOverrides = state.unsectionedProductKeys.filter((k) => k !== productKey);
    set({ sectionAssignments: nextAssignments, unsectionedProductKeys: nextOverrides });
    await writeOrganizerState({ sectionAssignments: nextAssignments, unsectionedProductKeys: nextOverrides });
    await useTabStore.getState().fetchTabs();
  },

  moveProductToUnsectioned: async (productKey: string) => {
    const state = useTabStore.getState();
    const { assignments: nextAssignments, overrides: nextOverrides } = moveProductToUnsectioned(
      state.sectionAssignments,
      state.unsectionedProductKeys,
      productKey,
    );
    set({ sectionAssignments: nextAssignments, unsectionedProductKeys: nextOverrides });
    await writeOrganizerState({ sectionAssignments: nextAssignments, unsectionedProductKeys: nextOverrides });
    await useTabStore.getState().fetchTabs();
  },

  setViewMode: async (viewMode: ViewMode) => {
    set({ viewMode });
    await writeOrganizerState({ viewMode });
  },

  fetchRecovery: async () => {
    const snapshots = await readRecoverySnapshots();
    set({ recoverySnapshots: snapshots });
  },

  restoreRecoverySnapshot: async (snapshotId: string) => {
    const snapshots = await readRecoverySnapshots();
    const snapshot = snapshots.find((s) => s.id === snapshotId);
    if (!snapshot) return;

    try {
      for (const tab of snapshot.tabs) {
        await chrome.tabs.create({ url: tab.url, active: false });
      }
    } finally {
      await useTabStore.getState().fetchTabs();
    }
  },

  restoreRecoveryProduct: async (snapshotId: string, productKey: string) => {
    const snapshots = await readRecoverySnapshots();
    const snapshot = snapshots.find((s) => s.id === snapshotId);
    if (!snapshot) return;

    try {
      const productTabs = snapshot.tabs.filter((t) => t.productKey === productKey);
      for (const tab of productTabs) {
        await chrome.tabs.create({ url: tab.url, active: false });
      }
    } finally {
      await useTabStore.getState().fetchTabs();
    }
  },

  deleteRecoverySnapshot: async (id: string) => {
    await deleteRecoverySnapshot(id);
    await useTabStore.getState().fetchRecovery();
  },

  clearRecovery: async () => {
    await clearRecoverySnapshots();
    set({ recoverySnapshots: [] });
  },

  closeExtraDashboards: async () => {
    try {
      const currentTab = await chrome.tabs.getCurrent();
      const currentTabId = currentTab?.id ?? -1;
      const allTabs = await chrome.tabs.query({});
      const extraDashboards = allTabs
        .filter((tab) => tab.id != null && tab.id !== currentTabId && isTabOrganizerPage(tab.url ?? ''))
        .map((tab) => tab.id)
        .filter((id): id is number => id != null);

      if (extraDashboards.length > 0) {
        await chrome.tabs.remove(extraDashboards);
      }
    } catch (err: unknown) {
      console.warn('[Tab Organizer] Failed to close extra dashboards:', err);
    } finally {
      await useTabStore.getState().fetchTabs();
    }
  },

  importBackup: async (
    sections: Section[],
    sectionAssignments: SectionAssignment[],
    unsectionedProductKeys: string[] = [],
  ) => {
    await writeOrganizerState({ sections, sectionAssignments, unsectionedProductKeys });
    set({ sections, sectionAssignments, unsectionedProductKeys });
    await useTabStore.getState().fetchTabs();
  },

  sortCurrentWindowTabsByDashboardOrder: async (products: TabGroup[]) => {
    // 1. Get current window
    const currentWindow = await chrome.windows.getCurrent();
    const windowId = currentWindow.id;

    // 2. Query all tabs in this window
    const allTabs = await chrome.tabs.query({ windowId });

    // 3. Separate pinned from unpinned; filter to real web tabs only
    const pinnedTabs = allTabs.filter((t) => t.pinned);
    const pinnedRealTabs = pinnedTabs.filter((t) => isRealTab(t.url ?? ''));
    const unpinnedRealTabs = allTabs.filter((t) => !t.pinned && isRealTab(t.url ?? ''));

    if (pinnedRealTabs.length === 0 && unpinnedRealTabs.length === 0) {
      // Nothing to sort
      return;
    }

    // 4. Build product-key -> position-in-products map from dashboard order
    const productKeyPositions = new Map<string, number>();
    for (let i = 0; i < products.length; i++) {
      const key = products[i].productKey ?? products[i].domain;
      productKeyPositions.set(key, i);
    }

    type TabWithProduct = { tab: chrome.tabs.Tab; productKey: string; originalIndex: number };
    const customGroups = useSettingsStore.getState().settings.customGroups;

    const tabsWithProducts = (tabsToSort: chrome.tabs.Tab[]): TabWithProduct[] =>
      tabsToSort.map((tab) => {
        const hostname = getTabDomain(tab.url ?? '');
        const normalizedHost = hostname.toLowerCase();
        const customOverride = customGroups?.find(
          (cg) =>
            cg.hostname?.toLowerCase() === normalizedHost ||
            (cg.hostnameEndsWith && normalizedHost.endsWith(cg.hostnameEndsWith.toLowerCase())),
        );
        const product = customOverride
          ? { key: customOverride.groupKey }
          : productForHostname(hostname);
        return { tab, productKey: product.key, originalIndex: tab.index };
      });

    // 5. Sort each Chrome tab area independently. Known products follow dashboard order;
    // unknown products remain at the end in their original order.
    const sortTabsByProductOrder = (tabsToSort: chrome.tabs.Tab[]): TabWithProduct[] => {
      const tabsWithProduct = tabsWithProducts(tabsToSort);
      return [
        ...tabsWithProduct
        .filter((tp) => productKeyPositions.has(tp.productKey))
        .sort((a, b) => {
          const posA = productKeyPositions.get(a.productKey) ?? Infinity;
          const posB = productKeyPositions.get(b.productKey) ?? Infinity;
          if (posA !== posB) return posA - posB;
          return a.originalIndex - b.originalIndex;
        }),
        ...tabsWithProduct
        .filter((tp) => !productKeyPositions.has(tp.productKey))
        .sort((a, b) => a.originalIndex - b.originalIndex),
      ];
    };

    const sortedPinnedTabs = sortTabsByProductOrder(pinnedRealTabs);
    const sortedUnpinnedTabs = sortTabsByProductOrder(unpinnedRealTabs);

    // 6. Build move plan. Real tabs sort only within their existing real-tab slots
    // so Chrome internal and extension pages keep their relative positions.
    const moves: { id: number; index: number }[] = [];
    const pinnedRealTargetIndices = pinnedRealTabs
      .map((tab) => tab.index)
      .sort((a, b) => a - b);
    const unpinnedRealTargetIndices = unpinnedRealTabs
      .map((tab) => tab.index)
      .sort((a, b) => a - b);

    for (let i = 0; i < sortedPinnedTabs.length; i++) {
      const tabId = sortedPinnedTabs[i].tab.id;
      if (tabId != null) {
        moves.push({ id: tabId, index: pinnedRealTargetIndices[i] });
      }
    }

    for (let i = 0; i < sortedUnpinnedTabs.length; i++) {
      const tabId = sortedUnpinnedTabs[i].tab.id;
      if (tabId != null) {
        moves.push({ id: tabId, index: unpinnedRealTargetIndices[i] });
      }
    }

    // 7. Execute moves in batch
    if (moves.length === 0) return;

    // Move one at a time to avoid Chrome API conflicts with same-window reordering
    // We use sequential moves preserving relative order
    for (const move of moves) {
      try {
        await chrome.tabs.move(move.id, { index: move.index });
      } catch (err) {
        console.warn('[Tab Organizer] Failed to move tab', move.id, err);
      }
    }
  },
}));