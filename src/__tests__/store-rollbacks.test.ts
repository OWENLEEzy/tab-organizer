import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSettingsStore } from '../stores/settings-store';
import { useTabStore } from '../stores/tab-store';
import { DEFAULT_SETTINGS } from '../utils/storage';
import { makeChromeTab } from './factories';
import type { TabGroup } from '../types';

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

const chromeTabs = {
  query: vi.fn<() => Promise<chrome.tabs.Tab[]>>().mockResolvedValue([]),
  create: vi.fn().mockResolvedValue({}),
  remove: vi.fn().mockResolvedValue({}),
};

vi.stubGlobal('chrome', {
  storage: { local: chromeStorage },
  tabs: chromeTabs,
  runtime: { getURL: vi.fn((path: string) => `chrome-extension://fake-id/${path}`) }
});

describe('Store Rollbacks & Errors Final', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    chromeStorage.data = {
        schemaVersion: 4,
        settings: DEFAULT_SETTINGS,
        groupOrder: {}
    };
    chromeTabs.query.mockResolvedValue([]);
  });

  it('SettingsStore rollbacks', async () => {
    chromeStorage.set.mockRejectedValueOnce(new Error('fail'));
    await useSettingsStore.getState().toggleSound();
    expect(useSettingsStore.getState().settings.soundEnabled).toBe(DEFAULT_SETTINGS.soundEnabled);
  });

  it('TabStore error paths', async () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    chromeStorage.set.mockRejectedValueOnce(new Error('fail'));

    // reorderProducts catch
    const dummyProduct = { productKey: 'google', domain: 'google.com', order: 0, tabs: [] } as unknown as TabGroup;
    useTabStore.setState({ products: [dummyProduct] });
    useTabStore.getState().reorderProducts([{ ...dummyProduct, order: 1 }]);
    await vi.waitFor(() => expect(spy).toHaveBeenCalledWith(expect.stringContaining('Failed to persist product order'), expect.any(Error)));

    // fetchTabs prune catch
    spy.mockClear();
    chromeStorage.data['groupOrder'] = { 'stale': 0 };
    chromeStorage.set.mockRejectedValueOnce(new Error('fail'));
    await useTabStore.getState().fetchTabs();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Failed to prune stale organizer storage'), expect.any(Error));

    // protectHistoryBeforeClosing catch
    spy.mockClear();
    chromeStorage.set.mockRejectedValueOnce(new Error('fail'));
    chromeTabs.query.mockResolvedValueOnce([makeChromeTab({ id: 1, url: 'https://a.com' })]);
    await useTabStore.getState().closeTabByUrl('https://a.com');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Failed to protect history before closing tabs'), expect.any(Error));

    spy.mockRestore();
  });

  it('TabStore restoreHistorySnapshot handles null snapshot', async () => {
    chromeStorage.data['history'] = [];
    await useTabStore.getState().restoreHistorySnapshot('non-existent');
    expect(chrome.tabs.create).not.toHaveBeenCalled();
  });
});