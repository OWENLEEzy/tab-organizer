import { create } from 'zustand';
import type { OrganizerSection, SectionAssignment, Tab, TabGroup, ViewMode } from '../types';
import { groupTabsByDomain } from '../lib/tab-grouper';
import { readStorage, updateStorage, writeGroupOrder } from '../utils/storage';
import { getHostname, isRealTab, isTabOutPage } from '../utils/url';
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
  /** Close duplicate tabs, optionally keeping one copy (prefer active tab). */
  closeDuplicates: (urls: string[], keepOne: boolean) => Promise<void>;
  /** Focus (activate) the tab matching the given URL, switching window if needed. */
  focusTab: (url: string) => Promise<void>;
  /** Register chrome.tabs listeners for real-time updates. Returns cleanup function. */
  startListeners: () => () => void;
  /** Reorder groups after drag-and-drop and persist the new order. */
  reorderGroups: (newGroups: TabGroup[]) => void;
  /** Create a user-owned organization section. */
  createSection: (name: string) => Promise<void>;
  /** Rename a user-owned organization section. */
  renameSection: (sectionId: string, name: string) => Promise<void>;
  /** Delete a section and return its items to the main area. */
  deleteSection: (sectionId: string) => Promise<void>;
  /** Reorder sections and persist the new order. */
  reorderSections: (sections: OrganizerSection[]) => Promise<void>;
  /** Assign a product group or independent URL item to a section. */
  moveItemToSection: (itemType: 'product' | 'tabUrl', itemKey: string, sectionId: string) => Promise<void>;
  /** Remove a product group or independent URL item assignment. */
  moveItemToMain: (itemType: 'product' | 'tabUrl', itemKey: string) => Promise<void>;
  /** Persist the visible organizer layout mode. */
  setViewMode: (viewMode: ViewMode) => Promise<void>;
  /** Clear the current error state. */
  clearError: () => void;
}

export type TabStore = {
  tabs: Tab[];
  groups: TabGroup[];
  sections: OrganizerSection[];
  sectionAssignments: SectionAssignment[];
  viewMode: ViewMode;
  loading: boolean;
  error: string | null;
} & TabActions;

// ─── Helpers ────────────────────────────────────────────────────────

/**
 * Build the domain string for a tab's URL.
 * Returns empty string for unparseable URLs.
 */
function deriveDomain(url: string): string {
  if (url.startsWith('file://')) return 'local-files';
  return getHostname(url);
}

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
    domain: deriveDomain(url),
    windowId: raw.windowId ?? -1,
    active: raw.active ?? false,
    isTabOut: isTabOutPage(url),
    isDuplicate: false,
    isLandingPage: false,
    duplicateCount: 0,
  };
}

/**
 * Filter out browser-internal URLs (chrome://, about:, etc.)
 */
function isRealWebTab(tab: Tab): boolean {
  return isRealTab(tab.url);
}

function countDuplicates(tabs: readonly Tab[]): {
  duplicateCount: number;
  hasDuplicates: boolean;
} {
  const counts = new Map<string, number>();
  for (const tab of tabs) {
    counts.set(tab.url, (counts.get(tab.url) ?? 0) + 1);
  }

  let duplicateCount = 0;
  for (const count of counts.values()) {
    if (count > 1) duplicateCount += count - 1;
  }

  return {
    duplicateCount,
    hasDuplicates: duplicateCount > 0,
  };
}

function buildTabUrlItem(url: string, tabs: Tab[], order: number): TabGroup {
  const first = tabs[0];
  const { duplicateCount, hasDuplicates } = countDuplicates(tabs);
  const hostname = deriveDomain(url);
  return {
    id: `tabUrl:${encodeURIComponent(url)}`,
    domain: `tabUrl:${encodeURIComponent(url)}`,
    friendlyName: first?.title || hostname || 'Tab',
    label: first?.title || url,
    itemType: 'tabUrl',
    itemKey: url,
    iconDomain: hostname,
    tabs,
    collapsed: false,
    order,
    color: hasDuplicates ? '#DFAB01' : '#4DAB9A',
    hasDuplicates,
    duplicateCount,
  };
}

function projectAssignments(
  productGroups: TabGroup[],
  assignments: SectionAssignment[],
): TabGroup[] {
  const assignedUrls = new Set(
    assignments
      .filter((assignment) => assignment.itemType === 'tabUrl')
      .map((assignment) => assignment.itemKey),
  );

  const projectedProducts = productGroups
    .map((group) => {
      const tabs = group.tabs.filter((tab) => !assignedUrls.has(tab.url));
      const { duplicateCount, hasDuplicates } = countDuplicates(tabs);
      return {
        ...group,
        tabs,
        hasDuplicates,
        duplicateCount,
        color: hasDuplicates ? '#DFAB01' : '#4DAB9A',
      };
    })
    .filter((group) => group.tabs.length > 0);

  const tabsByUrl = new Map<string, Tab[]>();
  for (const group of productGroups) {
    for (const tab of group.tabs) {
      if (!assignedUrls.has(tab.url)) continue;
      const existing = tabsByUrl.get(tab.url);
      if (existing) {
        existing.push(tab);
      } else {
        tabsByUrl.set(tab.url, [tab]);
      }
    }
  }

  const tabUrlItems = [...tabsByUrl.entries()].map(([url, tabs], index) =>
    buildTabUrlItem(url, tabs, projectedProducts.length + index),
  );

  return [...projectedProducts, ...tabUrlItems];
}

function pruneAssignments(
  assignments: SectionAssignment[],
  sections: OrganizerSection[],
  productGroups: TabGroup[],
  tabs: Tab[],
): SectionAssignment[] {
  const sectionIds = new Set(sections.map((section) => section.id));
  const productKeys = new Set(productGroups.map((group) => group.domain));
  const urls = new Set(tabs.map((tab) => tab.url));
  const seen = new Set<string>();

  return assignments.filter((assignment) => {
    if (!sectionIds.has(assignment.sectionId)) return false;
    if (assignment.itemType === 'product' && !productKeys.has(assignment.itemKey)) return false;
    if (assignment.itemType === 'tabUrl' && !urls.has(assignment.itemKey)) return false;

    const key = `${assignment.itemType}:${assignment.itemKey}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function orderedSections(sections: OrganizerSection[]): OrganizerSection[] {
  return [...sections].sort((a, b) => a.order - b.order);
}

// ─── Store ──────────────────────────────────────────────────────────

export const useTabStore = create<TabStore>((set) => ({
  tabs: [],
  groups: [],
  sections: [],
  sectionAssignments: [],
  viewMode: 'cards',
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchTabs: async () => {
    set({ loading: true, error: null });
    try {
      const rawTabs = await chrome.tabs.query({});
      const mapped = rawTabs.map(toAppTab).filter(isRealWebTab);
      const storage = await readStorage();
      const groupOrder = storage.groupOrder;
      const productGroups = groupTabsByDomain(mapped, groupOrder);
      const sections = orderedSections(storage.sections);
      const sectionAssignments = pruneAssignments(
        storage.sectionAssignments,
        sections,
        productGroups,
        mapped,
      );
      const groups = projectAssignments(productGroups, sectionAssignments);

      // Prune stale groupOrder entries for domains no longer present
      const currentDomains = new Set(productGroups.map((g) => g.domain));
      const staleKeys = Object.keys(groupOrder).filter((d) => !currentDomains.has(d));
      if (staleKeys.length > 0 || sectionAssignments.length !== storage.sectionAssignments.length) {
        const cleaned: Record<string, number> = {};
        for (const [domain, order] of Object.entries(groupOrder)) {
          if (currentDomains.has(domain)) {
            cleaned[domain] = order;
          }
        }
        await updateStorage((current) => ({
          ...current,
          groupOrder: cleaned,
          sectionAssignments,
        })).catch((err: unknown) => {
          console.warn('[Tab Out] Failed to prune stale organizer storage:', err);
        });
      }

      set({
        tabs: mapped,
        groups,
        sections,
        sectionAssignments,
        viewMode: storage.viewMode,
        loading: false,
      });
    } catch (err: unknown) {
      set({ tabs: [], groups: [], loading: false, error: getErrorMessage(err, 'Failed to fetch tabs') });
    }
  },

  closeTabByUrl: async (url: string) => {
    if (!url) return;
    const allTabs = await chrome.tabs.query({});
    const match = allTabs.find((t) => t.url === url);
    if (match?.id != null) {
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

    if (toClose.length > 0) await chrome.tabs.remove(toClose);
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
    if (toClose.length > 0) await chrome.tabs.remove(toClose);
    await useTabStore.getState().fetchTabs();
  },

  closeDuplicates: async (urls: string[], keepOne: boolean) => {
    if (!urls || urls.length === 0) return;
    const allTabs = await chrome.tabs.query({});

    // Single-pass: index all tabs by URL
    const byUrl = new Map<string, chrome.tabs.Tab[]>();
    for (const tab of allTabs) {
      if (tab.url == null) continue;
      const arr = byUrl.get(tab.url);
      if (arr) { arr.push(tab); } else { byUrl.set(tab.url, [tab]); }
    }

    const toClose: number[] = [];
    for (const url of urls) {
      const matching = byUrl.get(url);
      if (!matching) continue;
      if (keepOne) {
        // Prefer the active tab; fall back to the first match
        const keep = matching.find((t) => t.active) ?? matching[0];
        for (const tab of matching) {
          if (tab.id != null && tab.id !== keep?.id) {
            toClose.push(tab.id);
          }
        }
      } else {
        for (const tab of matching) {
          if (tab.id != null) toClose.push(tab.id);
        }
      }
    }

    if (toClose.length > 0) await chrome.tabs.remove(toClose);
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
      if (info.url || info.title || info.status === 'complete') {
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

  reorderGroups: (newGroups: TabGroup[]) => {
    const groupOrder: Record<string, number> = {};
    for (const group of useTabStore.getState().groups) {
      if (group.itemType === 'product') {
        groupOrder[group.itemKey ?? group.domain] = group.order;
      }
    }
    for (let i = 0; i < newGroups.length; i++) {
      const group = newGroups[i];
      if (group.itemType === 'product') {
        groupOrder[group.itemKey ?? group.domain] = i;
      }
    }
    set({ groups: newGroups });
    writeGroupOrder(groupOrder).catch((err: unknown) => {
      console.warn('[Tab Out] Failed to persist group order:', err);
    });
  },

  createSection: async (name: string) => {
    const trimmed = name.trim() || 'Untitled';
    const current = useTabStore.getState().sections;
    const section: OrganizerSection = {
      id: crypto.randomUUID(),
      name: trimmed,
      order: current.length,
    };
    const nextSections = [...current, section];
    set({ sections: nextSections });
    await updateStorage((storage) => ({ ...storage, sections: nextSections }));
  },

  renameSection: async (sectionId: string, name: string) => {
    const trimmed = name.trim() || 'Untitled';
    const nextSections = useTabStore
      .getState()
      .sections
      .map((section) => section.id === sectionId ? { ...section, name: trimmed } : section);
    set({ sections: nextSections });
    await updateStorage((storage) => ({ ...storage, sections: nextSections }));
  },

  deleteSection: async (sectionId: string) => {
    const nextSections = useTabStore
      .getState()
      .sections
      .filter((section) => section.id !== sectionId)
      .map((section, index) => ({ ...section, order: index }));
    const nextAssignments = useTabStore
      .getState()
      .sectionAssignments
      .filter((assignment) => assignment.sectionId !== sectionId);

    set({ sections: nextSections, sectionAssignments: nextAssignments });
    await updateStorage((storage) => ({
      ...storage,
      sections: nextSections,
      sectionAssignments: nextAssignments,
    }));
    await useTabStore.getState().fetchTabs();
  },

  reorderSections: async (sections: OrganizerSection[]) => {
    const nextSections = sections.map((section, index) => ({ ...section, order: index }));
    set({ sections: nextSections });
    await updateStorage((storage) => ({ ...storage, sections: nextSections }));
  },

  moveItemToSection: async (itemType: 'product' | 'tabUrl', itemKey: string, sectionId: string) => {
    const current = useTabStore.getState();
    const existingInSection = current.sectionAssignments.filter(
      (assignment) => assignment.sectionId === sectionId,
    );
    const nextAssignment: SectionAssignment = {
      itemType,
      itemKey,
      sectionId,
      order: existingInSection.length,
    };
    const nextAssignments = [
      ...current.sectionAssignments.filter(
        (assignment) => !(assignment.itemType === itemType && assignment.itemKey === itemKey),
      ),
      nextAssignment,
    ];

    set({ sectionAssignments: nextAssignments });
    await updateStorage((storage) => ({ ...storage, sectionAssignments: nextAssignments }));
    await useTabStore.getState().fetchTabs();
  },

  moveItemToMain: async (itemType: 'product' | 'tabUrl', itemKey: string) => {
    const nextAssignments = useTabStore
      .getState()
      .sectionAssignments
      .filter((assignment) => !(assignment.itemType === itemType && assignment.itemKey === itemKey));
    set({ sectionAssignments: nextAssignments });
    await updateStorage((storage) => ({ ...storage, sectionAssignments: nextAssignments }));
    await useTabStore.getState().fetchTabs();
  },

  setViewMode: async (viewMode: ViewMode) => {
    set({ viewMode });
    await updateStorage((storage) => ({ ...storage, viewMode }));
  },
}));
