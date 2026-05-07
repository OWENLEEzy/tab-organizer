import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTabStore } from '../stores/tab-store';
import type { HistorySnapshot } from '../types';

const chromeTabs = {
  query: vi.fn().mockResolvedValue([]),
  create: vi.fn().mockResolvedValue({}),
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
  remove: vi.fn(() => Promise.resolve()),
};

vi.stubGlobal('chrome', {
  tabs: chromeTabs,
  storage: { local: chromeStorage },
  runtime: { getURL: vi.fn(() => '') }
});

const mockSnapshot: HistorySnapshot = {
  id: 's1',
  capturedAt: new Date().toISOString(),
  tabCount: 2,
  products: [],
  tabs: [
    { url: 'https://a.com', title: 'A', domain: 'a.com', productKey: 'a', productLabel: 'A', iconDomain: 'a.com', favIconUrl: '', capturedAt: '' },
    { url: 'https://b.com', title: 'B', domain: 'b.com', productKey: 'b', productLabel: 'B', iconDomain: 'b.com', favIconUrl: '', capturedAt: '' }
  ]
};

describe('TabStore History Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    chromeStorage.data = {
      schemaVersion: 4,
      history: [mockSnapshot],
      historyCandidate: null
    };
  });

  it('fetchHistory loads from storage', async () => {
    await useTabStore.getState().fetchHistory();
    expect(useTabStore.getState().history).toHaveLength(1);
    expect(useTabStore.getState().history[0].id).toBe('s1');
  });

  it('restoreHistorySnapshot creates tabs', async () => {
    await useTabStore.getState().restoreHistorySnapshot('s1');
    expect(chromeTabs.create).toHaveBeenCalledTimes(2);
    expect(chromeTabs.create).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://a.com' }));
    expect(chromeTabs.create).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://b.com' }));
  });

  it('restoreHistorySnapshot handles missing id', async () => {
    await useTabStore.getState().restoreHistorySnapshot('missing');
    expect(chromeTabs.create).not.toHaveBeenCalled();
  });

  it('restoreHistoryProduct creates only product tabs', async () => {
    await useTabStore.getState().restoreHistoryProduct('s1', 'a');
    expect(chromeTabs.create).toHaveBeenCalledTimes(1);
    expect(chromeTabs.create).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://a.com' }));
  });

  it('restoreHistoryProduct handles missing id', async () => {
    await useTabStore.getState().restoreHistoryProduct('missing', 'a');
    expect(chromeTabs.create).not.toHaveBeenCalled();
  });

  it('deleteHistorySnapshot removes snapshot', async () => {
    await useTabStore.getState().deleteHistorySnapshot('s1');
    expect(chromeStorage.data['history'] as any[]).toHaveLength(0);
  });

  it('clearHistory removes all snapshots', async () => {
    await useTabStore.getState().clearHistory();
    expect(chromeStorage.data['history'] as any[]).toHaveLength(0);
    expect(useTabStore.getState().history).toHaveLength(0);
  });
});
