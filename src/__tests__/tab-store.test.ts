import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTabStore } from '../stores/tab-store';
import type { HistorySnapshot } from '../types';

const chromeTabs = {
  query: vi.fn(),
  remove: vi.fn(),
  update: vi.fn(),
  create: vi.fn(),
  getCurrent: vi.fn(),
  move: vi.fn(),
  onCreated: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
  },
  onRemoved: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
  },
  onMoved: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
  },
  onUpdated: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
  },
};

const chromeWindows = {
  getCurrent: vi.fn(),
  update: vi.fn(),
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
    getCurrent: chromeWindows.getCurrent,
    update: chromeWindows.update,
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
    chromeTabs.update.mockReset();
    chromeTabs.create.mockReset();
    chromeTabs.getCurrent.mockReset();
    chromeWindows.getCurrent.mockReset();
    chromeWindows.update.mockReset();
    chromeTabs.onCreated.addListener.mockClear();
    chromeTabs.onCreated.removeListener.mockClear();
    chromeTabs.onRemoved.addListener.mockClear();
    chromeTabs.onRemoved.removeListener.mockClear();
    chromeTabs.onMoved.addListener.mockClear();
    chromeTabs.onMoved.removeListener.mockClear();
    chromeTabs.onUpdated.addListener.mockClear();
    chromeTabs.onUpdated.removeListener.mockClear();
    chromeStorage.get.mockClear();
    chromeStorage.set.mockClear();
    chromeStorage.data = {};
    useTabStore.setState({
      tabs: [],
      products: [],
      sections: [],
      sectionAssignments: [],
      unsectionedProductKeys: [],
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
      name: 'closeTabsByIds',
      act: () => useTabStore.getState().closeTabsByIds([12]),
      expectedRemoveArg: [12],
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
      sections: [{ id: 'later', name: 'Later', order: 0 }],
      sectionAssignments: [
        { productKey: 'youtube', sectionId: 'later', order: 0 },
        { productKey: 'missing-product', sectionId: 'later', order: 2 },
        { itemType: rejectedUrlAssignmentType, itemKey: 'https://www.youtube.com/watch?v=1', sectionId: 'later', order: 3 },
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
    expect(state.sectionAssignments).toEqual([
      { productKey: 'youtube', sectionId: 'later', order: 0 },
    ]);
    expect(state.viewMode).toBe('table');
    expect(chromeStorage.data['groupOrder']).toEqual({ youtube: 0 });
  });

  it('auto-assigns Google workspace products from their real hostnames', async () => {
    useTabStore.setState({
      fetchTabs: useTabStore.getInitialState().fetchTabs,
    });
    chromeTabs.query.mockResolvedValue([
      makeChromeTab(31, 'https://mail.google.com/mail/u/0/#inbox'),
      makeChromeTab(32, 'https://docs.google.com/document/d/1/edit'),
    ]);

    await useTabStore.getState().fetchTabs();

    expect(useTabStore.getState().sectionAssignments).toEqual([
      { productKey: 'gmail', sectionId: 'section-work', order: 0 },
      { productKey: 'google-docs', sectionId: 'section-work', order: 1 },
    ]);
    expect(chromeStorage.data['sectionAssignments']).toEqual([
      { productKey: 'gmail', sectionId: 'section-work', order: 0 },
      { productKey: 'google-docs', sectionId: 'section-work', order: 1 },
    ]);
  });

  it('keeps a product in Unsorted after the user moves it out of an auto-matched space', async () => {
    useTabStore.setState({
      fetchTabs: useTabStore.getInitialState().fetchTabs,
    });
    chromeTabs.query.mockResolvedValue([
      makeChromeTab(41, 'https://mail.google.com/mail/u/0/#inbox'),
    ]);

    await useTabStore.getState().fetchTabs();
    expect(useTabStore.getState().sectionAssignments).toEqual([
      { productKey: 'gmail', sectionId: 'section-work', order: 0 },
    ]);

    await useTabStore.getState().moveProductToUnsectioned('gmail');

    expect(useTabStore.getState().sectionAssignments).toEqual([]);
    expect(chromeStorage.data['unsectionedProductKeys']).toEqual(['gmail']);

    await useTabStore.getState().fetchTabs();

    expect(useTabStore.getState().sectionAssignments).toEqual([]);
  });

  it('moves product groups into sections', async () => {
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
      sections: [{ id: 'later', name: 'Later', order: 0 }],
      sectionAssignments: [],
    });

    await useTabStore.getState().moveProductGroupToSection('github', 'later');

    expect(useTabStore.getState().sectionAssignments).toEqual([
      { productKey: 'github', sectionId: 'later', order: 0 },
    ]);
    expect(chromeStorage.data['sectionAssignments']).toEqual([
      { productKey: 'github', sectionId: 'later', order: 0 },
    ]);
    expect(chromeStorage.data['unsectionedProductKeys']).toEqual([]);

    await useTabStore.getState().moveProductToUnsectioned('github');

    expect(useTabStore.getState().sectionAssignments).toEqual([]);
    expect(chromeStorage.data['unsectionedProductKeys']).toEqual(['github']);

    await useTabStore.getState().moveProductGroupToSection('github', 'later');

    expect(useTabStore.getState().sectionAssignments).toEqual([
      { productKey: 'github', sectionId: 'later', order: 0 },
    ]);
    expect(chromeStorage.data['unsectionedProductKeys']).toEqual([]);
  });

  it('preserves concurrent product moves based on the latest organizer storage state', async () => {
    useTabStore.setState({
      fetchTabs: vi.fn().mockResolvedValue(undefined),
      sections: [{ id: 'later', name: 'Later', order: 0 }],
      sectionAssignments: [],
      unsectionedProductKeys: [],
    });
    chromeStorage.data = {
      schemaVersion: 4,
      sections: [{ id: 'later', name: 'Later', order: 0 }],
      sectionAssignments: [],
      unsectionedProductKeys: [],
    };

    await Promise.all([
      useTabStore.getState().moveProductGroupToSection('github', 'later'),
      useTabStore.getState().moveProductGroupToSection('vercel', 'later'),
    ]);

    expect(useTabStore.getState().sectionAssignments.map((assignment) => assignment.productKey).sort()).toEqual([
      'github',
      'vercel',
    ]);
    expect((chromeStorage.data['sectionAssignments'] as { productKey: string }[])
      .map((assignment) => assignment.productKey)
      .sort()).toEqual(['github', 'vercel']);
  });

  it('refreshes tabs even when a Chrome tab removal races with an already-closed tab', async () => {
    const fetchTabs = vi.fn().mockResolvedValue(undefined);
    useTabStore.setState({ fetchTabs });
    chromeTabs.query.mockResolvedValue([
      makeChromeTab(11, 'https://github.com/OWENLEEzy/tab-out'),
    ]);
    chromeTabs.remove.mockRejectedValue(new Error('No tab with id: 11'));

    await expect(useTabStore.getState().closeTabByUrl('https://github.com/OWENLEEzy/tab-out')).rejects.toThrow('No tab with id');

    expect(fetchTabs).toHaveBeenCalledTimes(1);
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

  it('correctly maps active status when fetching tabs', async () => {
    useTabStore.setState({
      fetchTabs: useTabStore.getInitialState().fetchTabs,
    });
    chromeTabs.query.mockResolvedValue([
      makeChromeTab(1, 'https://example.com/1', { active: true }),
      makeChromeTab(2, 'https://example.com/2', { active: false }),
    ]);

    await useTabStore.getState().fetchTabs();

    const state = useTabStore.getState();
    expect(state.tabs.find((t) => t.id === 1)?.active).toBe(true);
    expect(state.tabs.find((t) => t.id === 2)?.active).toBe(false);
  });

  it('handles the edge case where no real tabs are active', async () => {
    useTabStore.setState({
      fetchTabs: useTabStore.getInitialState().fetchTabs,
    });
    // Scenario: All active tabs are internal pages (filtered out by isRealTab)
    chromeTabs.query.mockResolvedValue([
      makeChromeTab(1, 'chrome://settings', { active: true }),
      makeChromeTab(2, 'https://example.com/1', { active: false }),
    ]);

    await useTabStore.getState().fetchTabs();

    const state = useTabStore.getState();
    expect(state.tabs).toHaveLength(1);
    expect(state.tabs[0].active).toBe(false);
  });

  it('focuses an exact matching tab and falls back to hostname matching', async () => {
    chromeTabs.query.mockResolvedValue([
      makeChromeTab(51, 'https://github.com/a', { windowId: 1 }),
      makeChromeTab(52, 'https://github.com/b', { windowId: 2 }),
    ]);
    chromeWindows.getCurrent.mockResolvedValue({ id: 1 });
    chromeTabs.update.mockResolvedValue({});
    chromeWindows.update.mockResolvedValue({});

    await useTabStore.getState().focusTab('https://github.com/missing-path');

    expect(chromeTabs.update).toHaveBeenCalledWith(52, { active: true });
    expect(chromeWindows.update).toHaveBeenCalledWith(2, { focused: true });
  });

  it('refreshes tabs when focusing a tab fails', async () => {
    chromeTabs.query.mockResolvedValue([makeChromeTab(53, 'https://example.com', { windowId: 1 })]);
    chromeWindows.getCurrent.mockResolvedValue({ id: 1 });
    chromeTabs.update.mockRejectedValueOnce(new Error('focus failed'));
    const fetchTabs = vi.fn().mockResolvedValue(undefined);
    useTabStore.setState({ fetchTabs });

    await expect(useTabStore.getState().focusTab('https://example.com')).rejects.toThrow('focus failed');

    expect(fetchTabs).toHaveBeenCalled();
  });

  it('refreshes tabs when restoring history fails mid-create', async () => {
    const snapshot = makeStoredHistorySnapshot('1', ['https://example.com/a', 'https://example.com/b']);
    chromeStorage.data['history'] = [snapshot];
    chromeTabs.create.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('create failed'));
    const fetchTabs = vi.fn().mockResolvedValue(undefined);
    useTabStore.setState({ fetchTabs });

    await expect(useTabStore.getState().restoreHistorySnapshot('1')).rejects.toThrow('create failed');

    expect(fetchTabs).toHaveBeenCalled();
  });

  it('refreshes tabs when restoring a history product fails mid-create', async () => {
    const snapshot = makeStoredHistorySnapshot('1', ['https://example.com/a']);
    chromeStorage.data['history'] = [snapshot];
    chromeTabs.create.mockRejectedValueOnce(new Error('create failed'));
    const fetchTabs = vi.fn().mockResolvedValue(undefined);
    useTabStore.setState({ fetchTabs });

    await expect(useTabStore.getState().restoreHistoryProduct('1', 'example.com')).rejects.toThrow(
      'create failed',
    );

    expect(fetchTabs).toHaveBeenCalled();
  });

  it('ignores missing history snapshots during restore', async () => {
    chromeStorage.data['history'] = [];

    await useTabStore.getState().restoreHistorySnapshot('missing');
    await useTabStore.getState().restoreHistoryProduct('missing', 'example.com');

    expect(chromeTabs.create).not.toHaveBeenCalled();
  });

  it('does not focus when there is no matching tab or URL is empty', async () => {
    chromeTabs.query.mockResolvedValue([makeChromeTab(61, 'https://example.com')]);
    chromeWindows.getCurrent.mockResolvedValue({ id: 1 });

    await useTabStore.getState().focusTab('');
    await useTabStore.getState().focusTab('not-a-url');

    expect(chromeTabs.update).not.toHaveBeenCalled();
  });

  it('registers and cleans up tab listeners', () => {
    vi.useFakeTimers();
    const fetchTabs = vi.fn().mockResolvedValue(undefined);
    useTabStore.setState({ fetchTabs });

    const cleanup = useTabStore.getState().startListeners();
    const onUpdated = chromeTabs.onUpdated.addListener.mock.calls[0][0];
    onUpdated(1, { title: 'Changed' });
    vi.advanceTimersByTime(300);
    cleanup();

    expect(fetchTabs).toHaveBeenCalledTimes(1);
    expect(chromeTabs.onCreated.removeListener).toHaveBeenCalled();
    expect(chromeTabs.onRemoved.removeListener).toHaveBeenCalled();
    expect(chromeTabs.onUpdated.removeListener).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('creates, renames, updates, reorders, and deletes sections', async () => {
    const fetchTabs = vi.fn().mockResolvedValue(undefined);
    useTabStore.setState({
      fetchTabs,
      sections: [],
      sectionAssignments: [{ productKey: 'github', sectionId: 'group-1', order: 0 }],
    });

    await useTabStore.getState().createSection('  ');
    const createdGroup = useTabStore.getState().sections[0];
    expect(createdGroup.name).toBe('Untitled');

    await useTabStore.getState().renameSection(createdGroup.id, 'Work');
    expect(useTabStore.getState().sections[0].name).toBe('Work');

    await useTabStore.getState().updateSection(createdGroup.id, { emoji: 'W' });
    expect(fetchTabs).toHaveBeenCalled();
    expect(useTabStore.getState().sections[0].emoji).toBe('W');

    await useTabStore.getState().reorderSections([{ ...createdGroup, id: 'group-1', name: 'One', order: 10 }]);
    expect(useTabStore.getState().sections[0].order).toBe(0);

    await useTabStore.getState().deleteSection('group-1');
    expect(useTabStore.getState().sectionAssignments).toEqual([]);
  });

  it('uses No section overrides when deleting an auto-assigned section', async () => {
    useTabStore.setState({
      fetchTabs: useTabStore.getInitialState().fetchTabs,
    });
    chromeStorage.data['sections'] = [
      {
        id: 'section-dev',
        name: 'Dev',
        order: 0,
        autoRules: [{ pattern: 'linear', type: 'hostname' }],
      },
    ];
    chromeTabs.query.mockResolvedValue([
      makeChromeTab(51, 'https://linear.app/acme/issue/TAB-1'),
    ]);

    await useTabStore.getState().fetchTabs();
    expect(useTabStore.getState().sectionAssignments).toEqual([
      { productKey: 'linear.app', sectionId: 'section-dev', order: 0 },
    ]);

    await useTabStore.getState().deleteSection('section-dev');

    expect(useTabStore.getState().sectionAssignments).toEqual([]);
    expect(useTabStore.getState().unsectionedProductKeys).toEqual(['linear.app']);
  });

  it('keeps products in No section when deleting their section', async () => {
    useTabStore.setState({
      fetchTabs: useTabStore.getInitialState().fetchTabs,
    });
    chromeStorage.data['sections'] = [
      {
        id: 'section-dev',
        name: 'Dev',
        order: 0,
        autoRules: [{ pattern: 'linear', type: 'hostname' }],
      },
      {
        id: 'section-work',
        name: 'Work',
        order: 1,
        autoRules: [{ pattern: 'linear', type: 'hostname' }],
      },
    ];
    chromeTabs.query.mockResolvedValue([
      makeChromeTab(51, 'https://linear.app/acme/issue/TAB-1'),
    ]);

    await useTabStore.getState().fetchTabs();
    expect(useTabStore.getState().sectionAssignments).toEqual([
      { productKey: 'linear.app', sectionId: 'section-dev', order: 0 },
    ]);

    await useTabStore.getState().deleteSection('section-dev');

    expect(useTabStore.getState().sectionAssignments).toEqual([]);
    expect(useTabStore.getState().unsectionedProductKeys).toEqual(['linear.app']);

    await useTabStore.getState().fetchTabs();

    expect(useTabStore.getState().sectionAssignments).toEqual([]);
    expect(useTabStore.getState().unsectionedProductKeys).toEqual(['linear.app']);
  });

  it('imports backup unsorted overrides so No section choices survive refresh', async () => {
    useTabStore.setState({
      fetchTabs: useTabStore.getInitialState().fetchTabs,
    });
    chromeTabs.query.mockResolvedValue([
      makeChromeTab(61, 'https://mail.google.com/mail/u/0/#inbox'),
    ]);

    await useTabStore.getState().importBackup([], [], ['gmail']);
    await useTabStore.getState().fetchTabs();

    expect(useTabStore.getState().sectionAssignments).toEqual([]);
    expect(useTabStore.getState().unsectionedProductKeys).toEqual(['gmail']);
  });

  it('tracks dashboard tab count before filtering real tabs', async () => {
    useTabStore.setState({
      fetchTabs: useTabStore.getInitialState().fetchTabs,
    });
    chromeTabs.query.mockResolvedValue([
      makeChromeTab(1, 'chrome-extension://fake-id/src/dashboard/index.html'),
      makeChromeTab(2, 'chrome-extension://fake-id/src/dashboard/index.html?x=1'),
      makeChromeTab(3, 'https://github.com/OWENLEEzy/tab-organizer'),
    ]);

    await useTabStore.getState().fetchTabs();

    expect(useTabStore.getState().tabs).toHaveLength(1);
    expect(useTabStore.getState().dashboardCount).toBe(2);
  });

  it('restores and manages history snapshots', async () => {
    const snapshot = makeStoredHistorySnapshot('1', ['https://example.com/a', 'https://example.com/b']);
    chromeStorage.data['history'] = [snapshot];
    chromeTabs.create.mockResolvedValue({});
    const fetchTabs = vi.fn().mockResolvedValue(undefined);
    useTabStore.setState({ fetchTabs });

    await useTabStore.getState().fetchHistory();
    expect(useTabStore.getState().history).toEqual([snapshot]);

    await useTabStore.getState().restoreHistorySnapshot('1');
    expect(chromeTabs.create).toHaveBeenCalledTimes(2);

    await useTabStore.getState().restoreHistoryProduct('1', 'example.com');
    expect(chromeTabs.create).toHaveBeenCalledTimes(4);

    await useTabStore.getState().deleteHistorySnapshot('1');
    expect(useTabStore.getState().history).toEqual([]);

    chromeStorage.data['history'] = [snapshot];
    await useTabStore.getState().clearHistory();
    expect(useTabStore.getState().history).toEqual([]);
  });

  it('closes extra dashboard pages and tolerates cleanup failures', async () => {
    chromeTabs.getCurrent.mockResolvedValue(makeChromeTab(1, 'chrome-extension://fake-id/src/dashboard/index.html'));
    chromeTabs.query.mockResolvedValue([
      makeChromeTab(1, 'chrome-extension://fake-id/src/dashboard/index.html'),
      makeChromeTab(2, 'chrome-extension://fake-id/src/dashboard/index.html?x=1'),
      makeChromeTab(3, 'https://example.com'),
    ]);
    chromeTabs.remove.mockResolvedValue(undefined);

    await useTabStore.getState().closeExtraDashboards();
    expect(chromeTabs.remove).toHaveBeenCalledWith([2]);
    expect(useTabStore.getState().fetchTabs).toHaveBeenCalledTimes(1);

    chromeTabs.getCurrent.mockRejectedValueOnce(new Error('missing'));
    await expect(useTabStore.getState().closeExtraDashboards()).resolves.not.toThrow();
  });
});
