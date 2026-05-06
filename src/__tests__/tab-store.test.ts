import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTabStore } from '../stores/tab-store';
import type { HistorySnapshot } from '../types';

const chromeTabs = {
  query: vi.fn(),
  remove: vi.fn(),
};

const chromeStorage = {
  data: {} as Record<string, unknown>,
  get: vi.fn((keys: string[] | string) => {
    const result: Record<string, unknown> = {};
    for (const key of Array.isArray(keys) ? keys : [keys]) {
      if (key in chromeStorage.data) result[key] = chromeStorage.data[key];
    }
    return Promise.resolve(result);
  }),
  set: vi.fn((items: Record<string, unknown>) => {
    Object.assign(chromeStorage.data, items);
    return Promise.resolve();
  }),
  remove: vi.fn((keys: string | string[]) => {
    (Array.isArray(keys) ? keys : [keys]).forEach((k) => delete chromeStorage.data[k]);
    return Promise.resolve();
  }),
};

vi.stubGlobal('chrome', {
  tabs: chromeTabs,
  storage: {
    local: chromeStorage,
  },
  runtime: {
    getURL: vi.fn((path: string) => `chrome-extension://fake-id/${path}`),
  },
  windows: {
    getCurrent: vi.fn(),
    update: vi.fn(),
  },
});

function makeChromeTab(
  id: number,
  url: string,
  overrides: Partial<chrome.tabs.Tab> = {},
): chrome.tabs.Tab {
  const tab: chrome.tabs.Tab = {
    id,
    url,
    title: `Tab ${id}`,
    favIconUrl: '',
    windowId: 1,
    active: false,
    index: id,
    pinned: false,
    highlighted: false,
    incognito: false,
    selected: false,
    status: 'complete',
    frozen: false,
    discarded: false,
    autoDiscardable: true,
    groupId: -1,
  };

  return {
    ...tab,
    ...overrides,
  } as chrome.tabs.Tab;
}

function makeStoredHistorySnapshot(id: string, urls: string[]): HistorySnapshot {
  return {
    id,
    capturedAt: `2026-05-05T00:00:0${id}.000Z`,
    tabCount: urls.length,
    products: [{
      productKey: 'example.com',
      label: 'Example',
      iconDomain: 'example.com',
      tabCount: urls.length,
    }],
    tabs: urls.map((url, index) => ({
      url,
      title: `Stale ${index}`,
      domain: 'example.com',
      productKey: 'example.com',
      productLabel: 'Example',
      iconDomain: 'example.com',
      favIconUrl: '',
      capturedAt: `2026-05-05T00:00:0${id}.000Z`,
      windowId: 1,
      active: index === 0,
    })),
  };
}

function expectProtectedBeforeRemove(expectedRemoveArg: number | number[]): void {
  const history = chromeStorage.data['history'] as HistorySnapshot[];
  expect(history).toHaveLength(1);
  expect(history[0].tabs.map((tab) => tab.url)).toEqual([
    'https://github.com/OWENLEEzy/tab-out',
    'https://github.com/OWENLEEzy/tab-out',
    'https://vercel.com',
  ]);
  expect(chromeStorage.data['historyCandidate']).toEqual(history[0]);
  expect(chromeTabs.remove).toHaveBeenCalledWith(expectedRemoveArg);
  expect(chromeStorage.set.mock.invocationCallOrder[0]).toBeLessThan(
    chromeTabs.remove.mock.invocationCallOrder[0],
  );
}

describe('useTabStore', () => {
  beforeEach(() => {
    chromeTabs.query.mockReset();
    chromeTabs.remove.mockReset();
    chromeStorage.get.mockClear();
    chromeStorage.set.mockClear();
    chromeStorage.data = {};
    useTabStore.setState({
      tabs: [],
      products: [],
      manualGroups: [],
      groupAssignments: [],
      viewMode: 'cards',
      loading: false,
      error: null,
      fetchTabs: vi.fn().mockResolvedValue(undefined),
    });
  });

  it('closes only one underlying tab per selected chip URL', async () => {
    chromeTabs.query.mockResolvedValue([
      { id: 11, url: 'https://github.com/OWENLEEzy/tab-out' },
      { id: 12, url: 'https://github.com/OWENLEEzy/tab-out' },
      { id: 13, url: 'https://vercel.com' },
    ]);
    chromeTabs.remove.mockResolvedValue(undefined);

    await useTabStore.getState().closeOneTabPerUrl([
      'https://github.com/OWENLEEzy/tab-out',
    ]);

    expect(chromeTabs.remove).toHaveBeenCalledWith([11]);
    expect(useTabStore.getState().fetchTabs).toHaveBeenCalledTimes(1);
  });

  it.each([
    {
      name: 'closeTabByUrl',
      act: () => useTabStore.getState().closeTabByUrl('https://github.com/OWENLEEzy/tab-out'),
      expectedRemoveArg: 11,
    },
    {
      name: 'closeOneTabPerUrl',
      act: () => useTabStore.getState().closeOneTabPerUrl([
        'https://github.com/OWENLEEzy/tab-out',
        'https://vercel.com',
      ]),
      expectedRemoveArg: [11, 13],
    },
    {
      name: 'closeTabsByUrls',
      act: () => useTabStore.getState().closeTabsByUrls([
        'https://github.com/anything',
      ]),
      expectedRemoveArg: [11, 12],
    },
    {
      name: 'closeTabsExact',
      act: () => useTabStore.getState().closeTabsExact([
        'https://github.com/OWENLEEzy/tab-out',
      ]),
      expectedRemoveArg: [11, 12],
    },
    {
      name: 'closeDuplicates',
      act: () => useTabStore.getState().closeDuplicates([
        'https://github.com/OWENLEEzy/tab-out',
      ], true),
      expectedRemoveArg: [12],
    },
  ])('protects history before removing tabs in $name', async ({ act, expectedRemoveArg }) => {
    chromeTabs.query.mockResolvedValue([
      makeChromeTab(11, 'https://github.com/OWENLEEzy/tab-out', { active: true }),
      makeChromeTab(12, 'https://github.com/OWENLEEzy/tab-out'),
      makeChromeTab(13, 'https://vercel.com'),
    ]);
    chromeTabs.remove.mockResolvedValue(undefined);

    await act();

    expectProtectedBeforeRemove(expectedRemoveArg);
  });

  it('promotes the current pre-close tabs even when the stored candidate is stale', async () => {
    chromeStorage.data['historyCandidate'] = makeStoredHistorySnapshot('stale', [
      'https://old.example.com',
    ]);
    chromeTabs.query.mockResolvedValue([
      makeChromeTab(21, 'https://github.com/OWENLEEzy/tab-out', { active: true }),
      makeChromeTab(22, 'https://vercel.com'),
    ]);
    chromeTabs.remove.mockResolvedValue(undefined);

    await useTabStore.getState().closeTabByUrl('https://github.com/OWENLEEzy/tab-out');

    const history = chromeStorage.data['history'] as HistorySnapshot[];
    expect(history[0].tabs.map((tab) => tab.url)).toEqual([
      'https://github.com/OWENLEEzy/tab-out',
      'https://vercel.com',
    ]);
    expect(history[0].tabs.map((tab) => tab.url)).not.toContain('https://old.example.com');
    expect(chromeTabs.remove).toHaveBeenCalledWith(21);
    expect(chromeStorage.set.mock.invocationCallOrder[0]).toBeLessThan(
      chromeTabs.remove.mock.invocationCallOrder[0],
    );
  });

  it('keeps product groups intact and prunes stale or URL assignments', async () => {
    const rejectedUrlAssignmentType = 'tab' + 'Url';
    useTabStore.setState({
      fetchTabs: useTabStore.getInitialState().fetchTabs,
    });
    chromeStorage.data = {
      schemaVersion: 4,
      deferred: [],
      workspaces: [],
      settings: {
        theme: 'system',
        soundEnabled: true,
        confettiEnabled: true,
        maxChipsVisible: 8,
        customGroups: [],
        landingPagePatterns: [],
      },
      groupOrder: { youtube: 0, 'old-hostname.com': 1 },
      manualGroups: [{ id: 'later', name: 'Later', order: 0 }],
      groupAssignments: [
        { productKey: 'youtube', groupId: 'later', order: 0 },
        { productKey: 'missing-product', groupId: 'later', order: 2 },
        { itemType: rejectedUrlAssignmentType, itemKey: 'https://www.youtube.com/watch?v=1', groupId: 'later', order: 3 },
      ],
      viewMode: 'table',
    };
    chromeTabs.query.mockResolvedValue([
      { id: 11, url: 'https://www.youtube.com/watch?v=1', title: 'Video 1', windowId: 1, active: false },
      { id: 12, url: 'https://www.youtube.com/watch?v=2', title: 'Video 2', windowId: 1, active: false },
    ]);

    await useTabStore.getState().fetchTabs();

    const state = useTabStore.getState();
    const youtube = state.products.find((p) => p.itemType === 'product' && p.domain === 'youtube');
    expect(youtube?.tabs.map((tab) => tab.url)).toEqual([
      'https://www.youtube.com/watch?v=1',
      'https://www.youtube.com/watch?v=2',
    ]);
    expect(state.groupAssignments).toEqual([
      { productKey: 'youtube', groupId: 'later', order: 0 },
    ]);
    expect(state.viewMode).toBe('table');
    expect(chromeStorage.data['groupOrder']).toEqual({ youtube: 0 });
  });

  it('moves product groups into manual groups', async () => {
    useTabStore.setState({
      fetchTabs: vi.fn().mockResolvedValue(undefined),
      products: [
        {
          id: 'github',
          domain: 'github',
          friendlyName: 'GitHub',
          itemType: 'product',
          itemKey: 'github',
          productKey: 'github',
          tabs: [],
          collapsed: false,
          order: 0,
          color: '#4DAB9A',
          hasDuplicates: false,
          duplicateCount: 0,
        },
      ],
      manualGroups: [{ id: 'later', name: 'Later', order: 0 }],
      groupAssignments: [],
    });

    await useTabStore.getState().moveProductToGroup('github', 'later');

    expect(useTabStore.getState().groupAssignments).toEqual([
      { productKey: 'github', groupId: 'later', order: 0 },
    ]);
    expect(chromeStorage.data['groupAssignments']).toEqual([
      { productKey: 'github', groupId: 'later', order: 0 },
    ]);

    await useTabStore.getState().moveProductToMain('github');

    expect(useTabStore.getState().groupAssignments).toEqual([]);
  });

  it('closes exact rendered product URLs instead of every tab on the same host', async () => {
    chromeTabs.query.mockResolvedValue([
      { id: 11, url: 'https://www.youtube.com/watch?v=1' },
      { id: 12, url: 'https://www.youtube.com/watch?v=2' },
      { id: 13, url: 'https://www.youtube.com/watch?v=3' },
    ]);
    chromeTabs.remove.mockResolvedValue(undefined);

    await useTabStore.getState().closeTabsExact([
      'https://www.youtube.com/watch?v=1',
      'https://www.youtube.com/watch?v=2',
    ]);

    expect(chromeTabs.remove).toHaveBeenCalledWith([11, 12]);
  });
});
