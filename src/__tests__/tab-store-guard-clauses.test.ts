import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTabStore } from '../stores/tab-store';

const chromeTabs = {
  query: vi.fn(),
  remove: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
};

const chromeStorage = {
  data: {} as Record<string, unknown>,
  get: vi.fn(() => Promise.resolve({})),
  set: vi.fn(() => Promise.resolve()),
  remove: vi.fn(() => Promise.resolve()),
};

vi.stubGlobal('chrome', {
  tabs: chromeTabs,
  storage: { local: chromeStorage },
  windows: {
    getCurrent: vi.fn().mockResolvedValue({ id: 1 }),
    update: vi.fn().mockResolvedValue({}),
  },
  runtime: {
    getURL: vi.fn((path: string) => `chrome-extension://fake-id/${path}`),
  }
});

describe('TabStore Guard Clauses & Error Paths', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTabStore.setState({ loading: false, error: null });
  });

  it('fetchTabs handles errors', async () => {
    chromeTabs.query.mockRejectedValueOnce(new Error('Query failed'));
    await useTabStore.getState().fetchTabs();
    expect(useTabStore.getState().error).toBe('Query failed');
    expect(useTabStore.getState().tabs).toHaveLength(0);
  });

  it('closeTabByUrl handles empty url', async () => {
    await useTabStore.getState().closeTabByUrl('');
    expect(chromeTabs.query).not.toHaveBeenCalled();
  });

  it('closeOneTabPerUrl handles empty urls', async () => {
    await useTabStore.getState().closeOneTabPerUrl([]);
    expect(chromeTabs.query).not.toHaveBeenCalled();
  });

  it('closeTabsByUrls handles empty urls and invalid urls', async () => {
    await useTabStore.getState().closeTabsByUrls([]);
    expect(chromeTabs.query).not.toHaveBeenCalled();

    chromeTabs.query.mockResolvedValue([]);
    await useTabStore.getState().closeTabsByUrls(['not-a-url', 'file:///test']);
    expect(chromeTabs.query).toHaveBeenCalled();
  });

  it('closeTabsExact handles empty urls', async () => {
    await useTabStore.getState().closeTabsExact([]);
    expect(chromeTabs.query).not.toHaveBeenCalled();
  });

  it('closeDuplicates handles empty urls', async () => {
    await useTabStore.getState().closeDuplicates([], true);
    expect(chromeTabs.query).not.toHaveBeenCalled();
  });

  it('focusTab handles empty url and invalid url', async () => {
    await useTabStore.getState().focusTab('');
    expect(chromeTabs.query).not.toHaveBeenCalled();

    chromeTabs.query.mockResolvedValue([]);
    await useTabStore.getState().focusTab('not-a-url');
    expect(chromeTabs.query).toHaveBeenCalled();
  });
});
