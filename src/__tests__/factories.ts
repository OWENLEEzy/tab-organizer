import type { HistorySnapshot, SavedTab, Tab, TabGroup, Workspace } from '../types';

export function makeAppTab(overrides: Partial<Tab> & Pick<Tab, 'id' | 'url'>): Tab {
  return {
    title: 'Test Tab',
    favIconUrl: '',
    domain: 'example.com',
    windowId: 1,
    active: false,
    isTabOut: false,
    isDuplicate: false,
    isLandingPage: false,
    duplicateCount: 0,
    ...overrides,
  };
}

export function makeTabGroup(overrides: Partial<TabGroup> & Pick<TabGroup, 'domain'>): TabGroup {
  return {
    id: overrides.domain || 'unknown',
    friendlyName: overrides.domain || 'unknown',
    tabs: [],
    collapsed: false,
    order: 0,
    color: '',
    hasDuplicates: false,
    duplicateCount: 0,
    ...overrides,
  };
}

export function makeSavedTab(overrides: Partial<SavedTab> & Pick<SavedTab, 'id' | 'url' | 'title'>): SavedTab {
  return {
    domain: 'example.com',
    savedAt: '2026-05-08T00:00:00.000Z',
    completed: false,
    dismissed: false,
    ...overrides,
  };
}

export function makeWorkspace(overrides: Partial<Workspace> & Pick<Workspace, 'id' | 'name'>): Workspace {
  return {
    icon: 'icon',
    savedTabs: [],
    createdAt: 1,
    updatedAt: 1,
    order: 0,
    ...overrides,
  };
}

export function makeChromeTab(overrides: Pick<chrome.tabs.Tab, 'id' | 'url'> & Partial<chrome.tabs.Tab>): chrome.tabs.Tab {
  return {
    index: 0,
    pinned: false,
    highlighted: false,
    windowId: 1,
    active: false,
    incognito: false,
    selected: false,
    discarded: false,
    autoDiscardable: true,
    ...overrides,
  } as chrome.tabs.Tab;
}

export function makeHistorySnapshot(overrides: Partial<HistorySnapshot> & Pick<HistorySnapshot, 'id'>): HistorySnapshot {
  return {
    capturedAt: '2026-05-08T00:00:00.000Z',
    tabCount: 1,
    products: [
      {
        productKey: 'example',
        label: 'Example',
        iconDomain: 'example.com',
        tabCount: 1,
      },
    ],
    tabs: [
      {
        url: 'https://example.com',
        title: 'Example',
        domain: 'example.com',
        productKey: 'example',
        productLabel: 'Example',
        iconDomain: 'example.com',
        favIconUrl: '',
        capturedAt: '2026-05-08T00:00:00.000Z',
      },
    ],
    ...overrides,
  };
}
