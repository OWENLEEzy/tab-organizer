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
  applyAssignmentUpdates,
  applyAutoAssignments,
  clearRecoverySnapshots,
  deleteRecoverySnapshot,
  deleteSectionInStorage,
  readRecoverySnapshots,
  reconcileOrganizerState,
  removeUnsectionedPin,
  unassignProductFromSections,
  updateSections,
  writeGroupOrder,
  writeOrganizerState,
} from '../utils/storage';
import { legacyProductKeyForHostname } from '../config/products';
import { resolveProduct } from '../lib/resolve-product';
import { duplicateTabIdsToClose } from '../lib/duplicate-tabs';
import { sortAndGroupTabs } from '../utils/sort-and-group-tabs';
import { buildSectionByProductKey } from '../lib/section-grouping';
import { getTabDomain, isRealTab } from '../lib/url-rules';
import { isTabOrganizerPage } from '../utils/browser-url';
import { chromeTabToAppTab } from '../utils/tab-mapping';
import { protectRecoveryBeforeClosing } from '../utils/recovery-protect';
import { findLastUsedTabId } from '../lib/last-used';
import { getErrorMessage } from '../utils/error';
import {
  closeTabIds,
  createChromeTab,
  focusChromeTab,
  getCurrentTab,
  getCurrentWindow,
  queryAllTabs,
  subscribeToTabEvents,
} from '../utils/chrome-tabs';
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
  /** Assign several product groups to a section in one batched, race-safe write. */
  assignProductsToSection: (productKeys: readonly string[], sectionId: string) => Promise<void>;
  /** Remove a product group assignment. */
  moveProductToUnsectioned: (productKey: string) => Promise<void>;
  /** Clear a product's explicit "keep unsectioned" pin so auto-rules may re-claim it. */
  unpinProduct: (productKey: string) => Promise<void>;
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
  /** Persist the sections the user confirmed in onboarding and close it for good. */
  completeOnboarding: (sections: Section[], assignments: SectionAssignment[]) => Promise<void>;
  /**
   * Overwrite sections and sectionAssignments with imported backup.
   *
   * `sections[].autoRules` is left as `unknown[]` rather than typed as
   * `SectionAutoRule[]` — this is untrusted, unvalidated backup data.
   * `writeOrganizerState` -> `normalizeSections`/`normalizeAutoRules` in
   * `src/lib/storage-schema.ts` is the real gate that validates it on write.
   */
  importBackup: (
    sections: Array<Omit<Section, 'autoRules'> & { autoRules?: unknown[] }>,
    sectionAssignments: SectionAssignment[],
    unsectionedProductKeys?: string[],
  ) => Promise<void>;
  /** Sort the current Chrome window's real tabs to match the dashboard product order. */
  sortCurrentWindowTabsByDashboardOrder: (products: TabGroup[]) => Promise<void>;
}

export type TabStore = {
  tabs: Tab[];
  products: TabGroup[];
  /** Hostnames observed for each product key, from the most recent `fetchTabs`. */
  hostnamesByProductKey: Map<string, string[]>;
  sections: Section[];
  sectionAssignments: SectionAssignment[];
  unsectionedProductKeys: string[];
  recoverySnapshots: RecoverySnapshot[];
  viewMode: ViewMode;
  /** True once the user has confirmed their sections in the one-time onboarding. */
  onboardingDone: boolean;
  loading: boolean;
  error: string | null;
  activeSectionId: string | null;
  dashboardCount: number;
  /** Id of the single globally most-recently-used real tab (excludes our own pages). */
  lastUsedTabId: number | null;
  /** One-shot: make the tab-event listener skip its next debounced refresh. */
  suppressListenerRefresh: boolean;
} & TabActions;

// ─── Helpers ────────────────────────────────────────────────────────

function orderedSections(groups: Section[]): Section[] {
  return [...groups].sort((a, b) => a.order - b.order);
}

/**
 * Refresh once after a programmatic tab close. When a close actually happened,
 * arm the one-shot suppression so the tab-event listener skips its own debounced
 * refresh — the browser's onRemoved would otherwise trigger a SECOND full rebuild
 * ~300ms later, making the list visibly jump.
 *
 * Only arm when `didClose` is true: if nothing was closed (no match, empty set, or
 * a failed close) no onRemoved fires, so an unconditional arm would leave the flag
 * stuck and silently swallow the next genuine tab event's refresh.
 */
async function refreshAfterClose(didClose: boolean): Promise<void> {
  if (didClose) {
    useTabStore.setState({ suppressListenerRefresh: true });
  }
  await useTabStore.getState().fetchTabs();
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

    const product = resolveProduct(hostname, customGroups);
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

/**
 * Persist an optimistic organizer change, then refetch. Refetching also on
 * failure puts the store back in line with what storage actually holds; the
 * error still propagates so the caller can tell the user.
 */
async function writeThenResync(write: () => Promise<unknown>): Promise<void> {
  try {
    await write();
  } finally {
    await useTabStore.getState().fetchTabs();
  }
}

// ─── Store ──────────────────────────────────────────────────────────

export const useTabStore = create<TabStore>((set) => ({
  tabs: [],
  products: [],
  hostnamesByProductKey: new Map(),
  sections: [],
  sectionAssignments: [],
  unsectionedProductKeys: [],
  recoverySnapshots: [],
  viewMode: 'cards',
  onboardingDone: false,
  loading: false,
  error: null,
  activeSectionId: null,
  dashboardCount: 0,
  lastUsedTabId: null,
  suppressListenerRefresh: false,

  setActiveSection: (id) => set({ activeSectionId: id }),

  clearError: () => set({ error: null }),

  fetchTabs: async () => {
    set({ error: null });
    try {
      const rawTabs = await queryAllTabs();
      const rawMapped = rawTabs.map(chromeTabToAppTab);
      const dashboardCount = rawMapped.filter((tab) => tab.isDashboard).length;
      const mapped = rawMapped.filter((tab) => isRealTab(tab.url));
      const { customGroups, productLabels } = useSettingsStore.getState().settings;
      const { currentProductKeys, legacyKeyMap, hostnamesByProductKey } =
        buildProductKeyCompatibility(mapped, customGroups);
      const organizerState = await reconcileOrganizerState(currentProductKeys, legacyKeyMap);
      const groupOrder = organizerState.groupOrder;
      const productGroups = groupTabsByProduct(mapped, groupOrder, customGroups, productLabels);
      const sections = orderedSections(organizerState.sections);
      let sectionAssignments = organizerState.sectionAssignments;
      let unsectionedProductKeys = organizerState.unsectionedProductKeys;
      const newAssignments = autoAssignProducts({
        products: productGroups,
        sections,
        assignments: sectionAssignments,
        unsectionedProductKeys,
        hostnamesByProductKey,
      });

      if (newAssignments.length > 0) {
        // Delta, not a snapshot: an assignment or pin made since this fetch
        // read storage must survive, so publish what storage now holds.
        try {
          ({ sectionAssignments, unsectionedProductKeys } = await applyAutoAssignments(newAssignments));
        } catch (err) {
          console.warn('[Tab Organizer] Failed to persist auto-assignments:', err);
          sectionAssignments = [...sectionAssignments, ...newAssignments];
        }
      }

      const products = productGroups;

      set({
        tabs: mapped,
        products,
        hostnamesByProductKey,
        sections,
        sectionAssignments,
        unsectionedProductKeys,
        viewMode: organizerState.viewMode,
        onboardingDone: organizerState.onboardingDone,
        loading: false,
        dashboardCount,
        // The single globally most-recently-used real tab, computed from all tabs.
        lastUsedTabId: findLastUsedTabId(rawMapped),
      });
    } catch (err: unknown) {
      set({ tabs: [], products: [], loading: false, dashboardCount: 0, lastUsedTabId: null, error: getErrorMessage(err, 'Failed to fetch tabs') });
    }
  },

  closeTabByUrl: async (url: string) => {
    if (!url) return;
    let closed = false;
    try {
      const allTabs = await queryAllTabs();
      const match = allTabs.find((t) => t.url === url);
      if (match?.id != null) {
        await protectRecoveryBeforeClosing(allTabs);
        await closeTabIds(match.id);
        closed = true;
      }
    } finally {
      await refreshAfterClose(closed);
    }
  },

  closeOneTabPerUrl: async (urls: string[]) => {
    if (!urls || urls.length === 0) return;

    const uniqueUrls = [...new Set(urls)];
    const allTabs = await queryAllTabs();
    const toClose = uniqueUrls
      .map((url) => allTabs.find((tab) => tab.url === url)?.id)
      .filter((id): id is number => id != null);

    let closed = false;
    try {
      if (toClose.length > 0) {
        await protectRecoveryBeforeClosing(allTabs);
        await closeTabIds(toClose);
        closed = true;
      }
    } finally {
      await refreshAfterClose(closed);
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

    const allTabs = await queryAllTabs();
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

    let closed = false;
    try {
      if (toClose.length > 0) {
        await protectRecoveryBeforeClosing(allTabs);
        await closeTabIds(toClose);
        closed = true;
      }
    } finally {
      await refreshAfterClose(closed);
    }
  },

  closeTabsExact: async (urls: string[]) => {
    if (!urls || urls.length === 0) return;
    const urlSet = new Set(urls);
    const allTabs = await queryAllTabs();
    const toClose = allTabs
      .filter((t) => t.url && urlSet.has(t.url))
      .map((t) => t.id)
      .filter((id): id is number => id != null);
    let closed = false;
    try {
      if (toClose.length > 0) {
        await protectRecoveryBeforeClosing(allTabs);
        await closeTabIds(toClose);
        closed = true;
      }
    } finally {
      await refreshAfterClose(closed);
    }
  },

  closeTabsByIds: async (tabIds: number[]) => {
    if (!tabIds || tabIds.length === 0) return;

    const ids = [...new Set(tabIds)].filter((id) => Number.isInteger(id));
    if (ids.length === 0) return;

    const allTabs = await queryAllTabs();
    const openIds = new Set(
      allTabs
        .map((tab) => tab.id)
        .filter((id): id is number => id != null),
    );
    const toClose = ids.filter((id) => openIds.has(id));

    let closed = false;
    try {
      if (toClose.length > 0) {
        await protectRecoveryBeforeClosing(allTabs);
        await closeTabIds(toClose);
        closed = true;
      }
    } finally {
      await refreshAfterClose(closed);
    }
  },

  closeDuplicates: async (urls: string[], keepOne: boolean) => {
    if (!urls || urls.length === 0) return;
    const allTabs = await queryAllTabs();
    const toClose = duplicateTabIdsToClose(allTabs, new Set(urls), keepOne);

    let closed = false;
    try {
      if (toClose.length > 0) {
        await protectRecoveryBeforeClosing(allTabs);
        await closeTabIds(toClose);
        closed = true;
      }
    } finally {
      await refreshAfterClose(closed);
    }
  },

  focusTab: async (url: string) => {
    if (!url) return;
    const allTabs = await queryAllTabs();
    const currentWindow = await getCurrentWindow();

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
        await focusChromeTab(match.id, match.windowId);
      }
    } finally {
      await useTabStore.getState().fetchTabs();
    }
  },

  startListeners: () => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const refresh = (): void => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        // A programmatic close already refreshed; skip this redundant rebuild once
        // so the list doesn't visibly jump from a second back-to-back refresh.
        if (useTabStore.getState().suppressListenerRefresh) {
          useTabStore.setState({ suppressListenerRefresh: false });
          return;
        }
        useTabStore.getState().fetchTabs();
      }, 300);
    };

    const unsubscribe = subscribeToTabEvents(refresh);

    return () => {
      unsubscribe();
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
    set({ sections: [...current, group] });
    await writeThenResync(() => updateSections((stored) => [...stored, { ...group, order: stored.length }]));
  },

  renameSection: async (sectionId: string, name: string) => {
    const trimmed = name.trim() || 'Untitled';
    const nextSections = useTabStore
      .getState()
      .sections
      .map((g) => g.id === sectionId ? { ...g, name: trimmed } : g);
    set({ sections: nextSections });
    await writeThenResync(() => updateSections((stored) =>
      stored.map((g) => g.id === sectionId ? { ...g, name: trimmed } : g)));
  },

  updateSection: async (sectionId: string, updates: Partial<Omit<Section, 'id'>>) => {
    const nextSections = useTabStore
      .getState()
      .sections
      .map((g) => g.id === sectionId ? { ...g, ...updates } : g);
    set({ sections: nextSections });
    // The resync also applies changed auto-rules immediately.
    await writeThenResync(() => updateSections((stored) =>
      stored.map((g) => g.id === sectionId ? { ...g, ...updates } : g)));
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
    await writeThenResync(() => deleteSectionInStorage(sectionId));
  },

  reorderSections: async (groups: Section[]) => {
    const nextSections = groups.map((g, index) => ({ ...g, order: index }));
    set({ sections: nextSections });
    const orderById = new Map(nextSections.map((g) => [g.id, g.order]));
    await writeThenResync(() => updateSections((stored) =>
      [...stored]
        .sort((a, b) => (orderById.get(a.id) ?? Infinity) - (orderById.get(b.id) ?? Infinity))
        .map((g, index) => ({ ...g, order: index }))));
  },

  moveProductGroupToSection: async (productKey: string, sectionId: string) => {
    const state = useTabStore.getState();
    set({
      sectionAssignments: assignProductToSectionModel(state.sectionAssignments, productKey, sectionId),
      unsectionedProductKeys: state.unsectionedProductKeys.filter((k) => k !== productKey),
    });
    await writeThenResync(() => applyAssignmentUpdates([{ productKey, sectionId }]));
  },

  assignProductsToSection: async (productKeys: readonly string[], sectionId: string) => {
    if (productKeys.length === 0) return;
    const state = useTabStore.getState();
    const keys = new Set(productKeys);
    const updates: SectionAssignment[] = productKeys.map((productKey) => ({ productKey, sectionId }));
    set({
      sectionAssignments: [
        ...state.sectionAssignments.filter((a) => !keys.has(a.productKey)),
        ...updates,
      ],
      unsectionedProductKeys: state.unsectionedProductKeys.filter((k) => !keys.has(k)),
    });
    await writeThenResync(() => applyAssignmentUpdates(updates));
  },

  moveProductToUnsectioned: async (productKey: string) => {
    const state = useTabStore.getState();
    const { assignments, overrides } = moveProductToUnsectioned(
      state.sectionAssignments,
      state.unsectionedProductKeys,
      productKey,
    );
    set({ sectionAssignments: assignments, unsectionedProductKeys: overrides });
    await writeThenResync(() => unassignProductFromSections(productKey));
  },

  unpinProduct: async (productKey: string) => {
    const state = useTabStore.getState();
    set({ unsectionedProductKeys: state.unsectionedProductKeys.filter((key) => key !== productKey) });
    await writeThenResync(() => removeUnsectionedPin(productKey));
  },

  setViewMode: async (viewMode: ViewMode) => {
    set({ viewMode });
    await writeThenResync(() => writeOrganizerState({ viewMode }));
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
        await createChromeTab(tab.url);
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
        await createChromeTab(tab.url);
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
      const currentTab = await getCurrentTab();
      const currentTabId = currentTab?.id ?? -1;
      const allTabs = await queryAllTabs();
      const extraDashboards = allTabs
        .filter((tab) => tab.id != null && tab.id !== currentTabId && isTabOrganizerPage(tab.url ?? ''))
        .map((tab) => tab.id)
        .filter((id): id is number => id != null);

      if (extraDashboards.length > 0) {
        await closeTabIds(extraDashboards);
      }
    } catch (err: unknown) {
      console.warn('[Tab Organizer] Failed to close extra dashboards:', err);
    } finally {
      await useTabStore.getState().fetchTabs();
    }
  },

  completeOnboarding: async (sections: Section[], assignments: SectionAssignment[]) => {
    const ordered = sections.map((section, index) => ({ ...section, order: index }));
    // One write: a failure must not leave sections saved with onboarding still pending.
    const saved = await writeOrganizerState({
      sections: ordered,
      sectionAssignments: assignments,
      onboardingDone: true,
    });
    set({ sections: saved.sections, sectionAssignments: saved.sectionAssignments, onboardingDone: true });
    await useTabStore.getState().fetchTabs();
  },

  importBackup: async (
    sections: Array<Omit<Section, 'autoRules'> & { autoRules?: unknown[] }>,
    sectionAssignments: SectionAssignment[],
    unsectionedProductKeys: string[] = [],
  ) => {
    // The real trust boundary: writeOrganizerState -> normalizeSections
    // validates every section (including autoRules) before it is persisted,
    // so asserting the type here — right before that gate — is safe.
    const normalized = await writeOrganizerState({
      sections: sections as Section[],
      sectionAssignments,
      unsectionedProductKeys,
    });
    set({
      sections: normalized.sections,
      sectionAssignments: normalized.sectionAssignments,
      unsectionedProductKeys: normalized.unsectionedProductKeys,
    });
    await useTabStore.getState().fetchTabs();
  },

  sortCurrentWindowTabsByDashboardOrder: async (products: TabGroup[]) => {
    // Reuse the shared sort + native-group pipeline, scoped to the current window.
    const currentWindow = await getCurrentWindow();
    if (currentWindow.id == null) return;
    const { sections, sectionAssignments } = useTabStore.getState();
    const sectionByProductKey = buildSectionByProductKey(sections, sectionAssignments);
    await sortAndGroupTabs(products, { windowId: currentWindow.id, sectionByProductKey });
  },
}));
