import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTabStore } from '../stores/tab-store';

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

describe('useTabStore', () => {
  beforeEach(() => {
    chromeTabs.query.mockReset();
    chromeTabs.remove.mockReset();
    chromeStorage.get.mockClear();
    chromeStorage.set.mockClear();
    chromeStorage.data = {};
    useTabStore.setState({
      tabs: [],
      groups: [],
      sections: [],
      sectionAssignments: [],
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

  it('keeps product groups intact and prunes stale or URL assignments', async () => {
    const rejectedUrlAssignmentType = 'tab' + 'Url';
    useTabStore.setState({
      fetchTabs: useTabStore.getInitialState().fetchTabs,
    });
    chromeStorage.data = {
      schemaVersion: 3,
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
    const youtube = state.groups.find((group) => group.itemType === 'product' && group.domain === 'youtube');
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

  it('moves product groups into sections', async () => {
    useTabStore.setState({
      fetchTabs: vi.fn().mockResolvedValue(undefined),
      groups: [
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

    await useTabStore.getState().moveProductToSection('github', 'later');

    expect(useTabStore.getState().sectionAssignments).toEqual([
      { productKey: 'github', sectionId: 'later', order: 0 },
    ]);
    expect(chromeStorage.data['sectionAssignments']).toEqual([
      { productKey: 'github', sectionId: 'later', order: 0 },
    ]);

    await useTabStore.getState().moveProductToMain('github');

    expect(useTabStore.getState().sectionAssignments).toEqual([]);
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
