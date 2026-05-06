import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  readStorage,
  saveTabForLater,
  checkOffSavedTab,
  dismissSavedTab,
  writeGroupOrder,
  writeSettings,
  updateHistoryCandidate,
  promoteHistoryCandidate,
  deleteHistorySnapshot,
  clearHistory,
} from '../utils/storage';
import type { HistorySnapshot } from '../types';

// Mock chrome.storage.local
const storage: Record<string, unknown> = {};
const DEFAULT_SETTINGS = {
  theme: 'system',
  soundEnabled: true,
  confettiEnabled: true,
  maxChipsVisible: 8,
  customGroups: [],
  landingPagePatterns: [],
};

function snapshot(keys: string[] | string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  (Array.isArray(keys) ? keys : [keys]).forEach((k) => {
    if (k in storage) result[k] = storage[k];
  });
  return result;
}

type StorageGetMock = {
  getMockImplementation: () => ((keys: string[] | string) => Promise<Record<string, unknown>>) | undefined;
  mockImplementation: (impl: (keys: string[] | string) => Promise<Record<string, unknown>>) => void;
};

beforeEach(() => {
  Object.keys(storage).forEach((k) => delete storage[k]);
  vi.clearAllMocks();
});

vi.stubGlobal('chrome', {
  storage: {
    local: {
      get: vi.fn((keys: string[] | string) => Promise.resolve(snapshot(keys))),
      set: vi.fn((items: Record<string, unknown>) => {
        Object.assign(storage, items);
        return Promise.resolve();
      }),
      remove: vi.fn((keys: string | string[]) => {
        (Array.isArray(keys) ? keys : [keys]).forEach((k) => delete storage[k]);
        return Promise.resolve();
      }),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  runtime: {
    getURL: vi.fn((path: string) => `chrome-extension://fake-id/${path}`),
  },
});

describe('readStorage', () => {
  it('returns default schema when storage is empty', async () => {
    const result = await readStorage();
    expect(result.schemaVersion).toBe(4);
    expect(result.deferred).toEqual([]);
    expect(result.workspaces).toEqual([]);
    expect(result.settings.theme).toBe('system');
    expect(result.groupOrder).toEqual({});
    expect(result.manualGroups).toEqual([]);
    expect(result.groupAssignments).toEqual([]);
    expect(result.viewMode).toBe('cards');
    expect(result.historyCandidate).toBeNull();
    expect(result.history).toEqual([]);
  });

  it('migrates from v0 (no schemaVersion) to v4', async () => {
    storage['deferred'] = [{ id: '1', url: 'https://example.com', title: 'Test', domain: 'example.com', savedAt: '2026-01-01T00:00:00.000Z', completed: false, dismissed: false }];
    const result = await readStorage();
    expect(result.schemaVersion).toBe(4);
    expect(result.deferred).toHaveLength(1);
    expect(result.groupOrder).toEqual({});
    expect(result.manualGroups).toEqual([]);
    expect(result.groupAssignments).toEqual([]);
    expect(result.viewMode).toBe('cards');
  });

  it('migrates from v3 terminology to v4', async () => {
    storage['schemaVersion'] = 3;
    storage['sections'] = [{ id: 'work', name: 'Work', order: 1 }];
    storage['sectionAssignments'] = [{ productKey: 'github', sectionId: 'work', order: 0 }];
    storage['recoveryHistory'] = [{
      id: 'snap-1',
      capturedAt: '2026-05-05T00:00:00Z',
      tabCount: 1,
      products: [{ productKey: 'github', label: 'GitHub', iconDomain: 'github.com', tabCount: 1 }],
      tabs: [{
        url: 'https://github.com',
        title: 'GitHub',
        domain: 'github.com',
        productKey: 'github',
        productLabel: 'GitHub',
        iconDomain: 'github.com',
        favIconUrl: '',
        capturedAt: '2026-05-05T00:00:00Z',
      }]
    }];
    storage['recoveryCandidate'] = null;

    const result = await readStorage();

    expect(result.schemaVersion).toBe(4);
    expect(result.manualGroups).toEqual([{ id: 'work', name: 'Work', order: 1 }]);
    expect(result.groupAssignments).toEqual([{ productKey: 'github', groupId: 'work', order: 0 }]);
    expect(result.history).toHaveLength(1);
    expect(result.history[0].id).toBe('snap-1');
  });

  it('normalizes v4 product-group organizer state and rejects tabUrl assignments', async () => {
    const rejectedUrlAssignmentType = 'tab' + 'Url';
    storage['schemaVersion'] = 4;
    storage['manualGroups'] = [
      { id: 'later', name: 'Later', order: 2 },
      { id: 'homepages', name: 'Homepages', order: 1 },
      { id: '', name: 'bad' },
      { id: 'untitled', name: '   ', order: 3 },
    ];
    storage['groupAssignments'] = [
      { productKey: 'youtube', groupId: 'later', order: 0 },
      { itemType: 'product', itemKey: 'github', groupId: 'later', order: 1 },
      { itemType: rejectedUrlAssignmentType, itemKey: 'https://example.com', groupId: 'later' },
      { itemType: 'bad', itemKey: 'x', groupId: 'later' },
    ];
    storage['viewMode'] = 'table';

    const result = await readStorage();

    expect(result.manualGroups.map((g) => g.id)).toEqual(['homepages', 'later', 'untitled']);
    expect(result.manualGroups.find((g) => g.id === 'untitled')?.name).toBe('Untitled');
    expect(result.groupAssignments).toEqual([
      { productKey: 'youtube', groupId: 'later', order: 0 },
      { productKey: 'github', groupId: 'later', order: 1 },
    ]);
    expect(result.viewMode).toBe('table');
  });
});

function makeSnapshot(id: string, urls: string[]): HistorySnapshot {
  return {
    id,
    capturedAt: `2026-05-05T00:00:0${id}.000Z`,
    tabCount: urls.length,
    products: [
      {
        productKey: 'example.com',
        label: 'Example',
        iconDomain: 'example.com',
        tabCount: urls.length,
      },
    ],
    tabs: urls.map((url, index) => ({
      url,
      title: `Tab ${index}`,
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

describe('history storage', () => {
  it('stores a bounded latest candidate and promotes it to history on startup', async () => {
    const tooManyTabs = Array.from({ length: 85 }, (_, index) => `https://example.com/${index}`);
    const candidate = makeSnapshot('1', tooManyTabs);

    await updateHistoryCandidate(candidate);
    let result = await readStorage();

    expect(result.historyCandidate?.tabs).toHaveLength(80);
    expect(result.historyCandidate?.tabCount).toBe(80);
    expect(result.history).toHaveLength(0);

    const promoted = await promoteHistoryCandidate();
    result = await readStorage();

    expect(promoted).toBe(true);
    expect(result.history).toHaveLength(1);
    expect(result.history[0].tabs).toHaveLength(80);
  });

  it('keeps only five history snapshots and skips duplicate URL sets', async () => {
    for (let index = 0; index < 7; index += 1) {
      await updateHistoryCandidate(makeSnapshot(String(index), [`https://example.com/${index}`]));
      await promoteHistoryCandidate();
    }

    let result = await readStorage();
    expect(result.history.map((snapshot) => snapshot.id)).toEqual(['6', '5', '4', '3', '2']);

    await updateHistoryCandidate(makeSnapshot('duplicate', ['https://example.com/6']));
    const promoted = await promoteHistoryCandidate();
    result = await readStorage();

    expect(promoted).toBe(false);
    expect(result.history.map((snapshot) => snapshot.id)).toEqual(['6', '5', '4', '3', '2']);
  });

  it('deletes one history snapshot and clears history', async () => {
    await updateHistoryCandidate(makeSnapshot('1', ['https://example.com/1']));
    await promoteHistoryCandidate();
    await updateHistoryCandidate(makeSnapshot('2', ['https://example.com/2']));
    await promoteHistoryCandidate();

    await deleteHistorySnapshot('1');
    let result = await readStorage();
    expect(result.history.map((snapshot) => snapshot.id)).toEqual(['2']);

    await clearHistory();
    result = await readStorage();
    expect(result.history).toEqual([]);
    expect(result.historyCandidate).toBeNull();
  });
});

describe('saveTabForLater', () => {
  it('creates a SavedTab and persists it', async () => {
    const saved = await saveTabForLater({ url: 'https://github.com/test', title: 'Test Repo' });
    expect(saved.url).toBe('https://github.com/test');
    expect(saved.title).toBe('Test Repo');
    expect(saved.domain).toBe('github.com');
    expect(saved.completed).toBe(false);
    expect(saved.dismissed).toBe(false);

    const storage2 = await readStorage();
    expect(storage2.deferred).toHaveLength(1);
  });
});

describe('checkOffSavedTab', () => {
  it('marks a saved tab as completed', async () => {
    const saved = await saveTabForLater({ url: 'https://example.com', title: 'Test' });
    await checkOffSavedTab(saved.id);
    const result = await readStorage();
    expect(result.deferred[0].completed).toBe(true);
    expect(result.deferred[0].completedAt).toBeDefined();
  });
});

describe('dismissSavedTab', () => {
  it('marks a saved tab as dismissed', async () => {
    const saved = await saveTabForLater({ url: 'https://example.com', title: 'Test' });
    await dismissSavedTab(saved.id);
    const result = await readStorage();
    expect(result.deferred[0].dismissed).toBe(true);
  });
});

describe('writeGroupOrder', () => {
  it('persists group ordering to storage', async () => {
    await writeGroupOrder({ 'github.com': 1, 'google.com': 0 });
    const result = await readStorage();
    expect(result.groupOrder).toEqual({ 'github.com': 1, 'google.com': 0 });
  });

  it('does not clobber unrelated settings when another write lands first', async () => {
    storage['schemaVersion'] = 4;
    storage['deferred'] = [];
    storage['workspaces'] = [];
    storage['settings'] = DEFAULT_SETTINGS;
    storage['groupOrder'] = {};

    const getMock = chrome.storage.local.get as unknown as StorageGetMock;
    const originalGet = getMock.getMockImplementation();

    let releaseFirstRead = (): void => {};
    let readCount = 0;

    getMock.mockImplementation((keys: string[] | string) => {
      readCount += 1;
      if (readCount === 1) {
        const staleSnapshot = {
          schemaVersion: 4,
          deferred: [],
          workspaces: [],
          settings: DEFAULT_SETTINGS,
          groupOrder: {},
        };

        return new Promise<Record<string, unknown>>((resolve) => {
          releaseFirstRead = () => resolve(staleSnapshot);
        });
      }

      if (originalGet) {
        return originalGet(keys);
      }

      return Promise.resolve(snapshot(keys));
    });

    const groupOrderWrite = writeGroupOrder({ 'github.com': 0 });
    await Promise.resolve();

    const settingsWrite = writeSettings({ soundEnabled: false });
    releaseFirstRead();
    await Promise.all([groupOrderWrite, settingsWrite]);

    const result = await readStorage();
    expect(result.settings.soundEnabled).toBe(false);
    expect(result.groupOrder).toEqual({ 'github.com': 0 });
  });
});
