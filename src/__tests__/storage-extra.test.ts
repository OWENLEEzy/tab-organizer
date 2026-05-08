import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  writeOrganizerState, 
  updateHistoryCandidate, 
  readHistory, 
  promoteHistoryCandidate,
  readStorage,
  readGroupOrder,
  clearGroupOrder,
  readOrganizerState,
  writeStorage,
  getSavedTabs
} from '../utils/storage';
import type { HistorySnapshot, StorageSchema } from '../types';

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
  storage: {
    local: chromeStorage,
  },
});

const validSnapshot: HistorySnapshot = { 
    id: '1', 
    tabs: [{ 
        url: 'https://a.com', 
        title: 'A', 
        domain: 'a.com', 
        productKey: 'a', 
        productLabel: 'A', 
        iconDomain: 'a.com', 
        favIconUrl: '', 
        capturedAt: new Date().toISOString(),
        windowId: 1,
        active: false
    }],
    capturedAt: new Date().toISOString(),
    tabCount: 1,
    products: [{
        productKey: 'a',
        label: 'A',
        iconDomain: 'a.com',
        tabCount: 1
    }]
};

describe('storage extra', () => {
  beforeEach(() => {
    chromeStorage.data = {
      schemaVersion: 4,
      history: [],
      historyCandidate: null,
      manualGroups: [],
      groupAssignments: [],
      viewMode: 'cards',
      groupOrder: { 'a.com': 1 },
      deferred: []
    };
    vi.clearAllMocks();
  });

  it('handles invalid history snapshot structure', async () => {
    // This targets line 128 in storage.ts
    const invalid = { id: 123 }; // id should be string
    chromeStorage.data['historyCandidate'] = invalid;
    const storage = await readStorage();
    expect(storage.historyCandidate).toBeNull();
  });

  it('reads and clears group order', async () => {
    const order = await readGroupOrder();
    expect(order).toEqual({ 'a.com': 1 });
    
    await clearGroupOrder();
    expect(await readGroupOrder()).toEqual({});
  });

  it('reads organizer state', async () => {
    const state = await readOrganizerState();
    expect(state.viewMode).toBe('cards');
    expect(state.manualGroups).toHaveLength(0);
  });

  it('writeStorage replaces full data', async () => {
    const newData = { schemaVersion: 4, viewMode: 'table' } as StorageSchema;
    await writeStorage(newData);
    const storage = await readStorage();
    expect(storage.viewMode).toBe('table');
  });

  it('getSavedTabs returns active and archived', async () => {
    chromeStorage.data['deferred'] = [
        { id: '1', url: 'u1', title: 'T1', completed: false, dismissed: false },
        { id: '2', url: 'u2', title: 'T2', completed: true, dismissed: false },
        { id: '3', url: 'u3', title: 'T3', completed: false, dismissed: true }
    ];
    const result = await getSavedTabs();
    expect(result.active).toHaveLength(1);
    expect(result.active[0].id).toBe('1');
    expect(result.archived).toHaveLength(1);
    expect(result.archived[0].id).toBe('2');
  });

  it('writeOrganizerState updates all fields', async () => {
    await writeOrganizerState({
      viewMode: 'table',
      manualGroups: [{ id: '1', name: 'Test', order: 0 }],
      groupAssignments: [{ productKey: 'a', groupId: '1', order: 0 }]
    });
    
    const storage = await readStorage();
    expect(storage.viewMode).toBe('table');
    expect(storage.manualGroups).toHaveLength(1);
    expect(storage.groupAssignments).toHaveLength(1);
  });

  it('updateHistoryCandidate handles null', async () => {
    chromeStorage.data['historyCandidate'] = validSnapshot;
    await updateHistoryCandidate(null);
    const storage = await readStorage();
    expect(storage.historyCandidate).toBeNull();
  });

  it('readHistory returns history array', async () => {
    const history = [validSnapshot];
    chromeStorage.data['history'] = history;
    const result = await readHistory();
    expect(result).toEqual(history);
  });

  it('promoteHistoryCandidate promotes current candidate', async () => {
    chromeStorage.data['historyCandidate'] = validSnapshot;
    
    const promoted = await promoteHistoryCandidate();
    expect(promoted).toBe(true);
    const storage = await readStorage();
    expect(storage.history).toHaveLength(1);
    expect(storage.history[0].id).toBe('1');
  });

  it('migrate handles legacy data', async () => {
    const legacyData = {
        schemaVersion: 3,
        sections: [{ id: 's1', name: 'Legacy', order: 0 }],
        sectionAssignments: [{ productKey: 'a', sectionId: 's1', order: 0 }],
        recoveryCandidate: validSnapshot,
        recoveryHistory: [validSnapshot]
    };
    Object.assign(chromeStorage.data, legacyData);
    
    const storage = await readStorage();
    expect(storage.schemaVersion).toBe(4);
    expect(storage.manualGroups).toHaveLength(1);
    expect(storage.manualGroups[0].id).toBe('s1');
    expect(storage.groupAssignments).toHaveLength(1);
    expect(storage.groupAssignments[0].groupId).toBe('s1');
    expect(storage.historyCandidate).not.toBeNull();
    expect(storage.history).toHaveLength(1);
  });
});
