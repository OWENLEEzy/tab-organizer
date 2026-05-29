import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  writeOrganizerState,
  updateRecoveryCandidate,
  readRecoverySnapshots,
  promoteRecoveryCandidate,
  readStorage,
  readGroupOrder,
  clearGroupOrder,
  readOrganizerState,
  writeStorage,
} from '../utils/storage';
import type { RecoverySnapshot, StorageSchema } from '../types';

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

const validSnapshot: RecoverySnapshot = {
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
      schemaVersion: 5,
      recoverySnapshots: [],
      recoveryCandidate: null,
      sections: [],
      sectionAssignments: [],
      viewMode: 'cards',
      groupOrder: { 'a.com': 1 },
    };
    vi.clearAllMocks();
  });

  it('handles invalid recovery snapshot structure', async () => {
    // This targets normalizeRecoverySnapshot in storage.ts
    const invalid = { id: 123 }; // id should be string
    chromeStorage.data['recoveryCandidate'] = invalid;
    const storage = await readStorage();
    expect(storage.recoveryCandidate).toBeNull();
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
    expect(state.sections).toHaveLength(0);
  });

  it('writeStorage replaces full data', async () => {
    const newData = { schemaVersion: 5, viewMode: 'table' } as StorageSchema;
    await writeStorage(newData);
    const storage = await readStorage();
    expect(storage.viewMode).toBe('table');
  });

  it('writeOrganizerState updates all fields', async () => {
    await writeOrganizerState({
      viewMode: 'table',
      sections: [{ id: '1', name: 'Test', order: 0 }],
      sectionAssignments: [{ productKey: 'a', sectionId: '1', order: 0 }]
    });

    const storage = await readStorage();
    expect(storage.viewMode).toBe('table');
    expect(storage.sections).toHaveLength(1);
    expect(storage.sectionAssignments).toHaveLength(1);
  });

  it('updateRecoveryCandidate handles null', async () => {
    chromeStorage.data['recoveryCandidate'] = validSnapshot;
    await updateRecoveryCandidate(null);
    const storage = await readStorage();
    expect(storage.recoveryCandidate).toBeNull();
  });

  it('readRecoverySnapshots returns recovery snapshots array', async () => {
    const recoverySnapshots = [validSnapshot];
    chromeStorage.data['recoverySnapshots'] = recoverySnapshots;
    const result = await readRecoverySnapshots();
    expect(result).toEqual(recoverySnapshots);
  });

  it('promoteRecoveryCandidate promotes current candidate', async () => {
    chromeStorage.data['recoveryCandidate'] = validSnapshot;

    const promoted = await promoteRecoveryCandidate();
    expect(promoted).toBe(true);
    const storage = await readStorage();
    expect(storage.recoverySnapshots).toHaveLength(1);
    expect(storage.recoverySnapshots[0].id).toBe('1');
  });

  it('resets to default storage on schema mismatch (v3)', async () => {
    const legacyData = {
        schemaVersion: 3,
        sections: [{ id: 's1', name: 'Legacy', order: 0 }],
        sectionAssignments: [{ productKey: 'a', sectionId: 's1', order: 0 }],
        recoveryCandidate: validSnapshot,
        recoveryHistory: [validSnapshot]
    };
    Object.assign(chromeStorage.data, legacyData);

    const storage = await readStorage();
    expect(storage.schemaVersion).toBe(5);
    // Schema mismatch resets to DEFAULT_STORAGE; legacy data is not read
    expect(storage.sections.length).toBeGreaterThan(0);
    expect(storage.sectionAssignments).toEqual([]);
    expect(storage.recoveryCandidate).toBeNull();
    expect(storage.recoverySnapshots).toEqual([]);
  });
});
