import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTabStore } from '../stores/tab-store';
import type { RecoverySnapshot } from '../types';

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

const mockSnapshot: RecoverySnapshot = {
  id: 's1',
  capturedAt: new Date().toISOString(),
  tabCount: 2,
  products: [],
  tabs: [
    { url: 'https://a.com', title: 'A', domain: 'a.com', productKey: 'a', productLabel: 'A', iconDomain: 'a.com', favIconUrl: '', capturedAt: '' },
    { url: 'https://b.com', title: 'B', domain: 'b.com', productKey: 'b', productLabel: 'B', iconDomain: 'b.com', favIconUrl: '', capturedAt: '' }
  ]
};

describe('TabStore Recovery Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    chromeStorage.data = {
      schemaVersion: 4,
      recoverySnapshots: [mockSnapshot],
      recoveryCandidate: null
    };
  });

  it('fetchRecovery loads from storage', async () => {
    await useTabStore.getState().fetchRecovery();
    expect(useTabStore.getState().recoverySnapshots).toHaveLength(1);
    expect(useTabStore.getState().recoverySnapshots[0].id).toBe('s1');
  });

  it('restoreRecoverySnapshot creates tabs', async () => {
    await useTabStore.getState().restoreRecoverySnapshot('s1');
    expect(chromeTabs.create).toHaveBeenCalledTimes(2);
    expect(chromeTabs.create).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://a.com' }));
    expect(chromeTabs.create).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://b.com' }));
  });

  it('restoreRecoverySnapshot handles missing id', async () => {
    await useTabStore.getState().restoreRecoverySnapshot('missing');
    expect(chromeTabs.create).not.toHaveBeenCalled();
  });

  it('restoreRecoveryProduct creates only product tabs', async () => {
    await useTabStore.getState().restoreRecoveryProduct('s1', 'a');
    expect(chromeTabs.create).toHaveBeenCalledTimes(1);
    expect(chromeTabs.create).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://a.com' }));
  });

  it('restoreRecoveryProduct handles missing id', async () => {
    await useTabStore.getState().restoreRecoveryProduct('missing', 'a');
    expect(chromeTabs.create).not.toHaveBeenCalled();
  });

  it('deleteRecoverySnapshot removes snapshot', async () => {
    await useTabStore.getState().deleteRecoverySnapshot('s1');
    expect(chromeStorage.data['recoverySnapshots'] as RecoverySnapshot[]).toHaveLength(0);
  });

  it('clearRecovery removes all snapshots', async () => {
    await useTabStore.getState().clearRecovery();
    expect(chromeStorage.data['recoverySnapshots'] as RecoverySnapshot[]).toHaveLength(0);
    expect(useTabStore.getState().recoverySnapshots).toHaveLength(0);
  });
});