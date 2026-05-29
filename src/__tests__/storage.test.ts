import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  readStorage,
  writeGroupOrder,
  writeSettings,
  updateRecoveryCandidate,
  promoteRecoveryCandidate,
  promoteRecoverySnapshot,
  deleteRecoverySnapshot,
  clearRecoverySnapshots,
  reconcileOrganizerState,
  pruneStaleStorage,
  assignProductToSection,
  unassignProductFromSections,
} from '../utils/storage';
import type { RecoverySnapshot } from '../types';

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
    expect(result.schemaVersion).toBe(5);
    expect(result.settings.theme).toBe('clay');
    expect(result.settings.groupSortBy).toBe('count');
    expect(result.groupOrder).toEqual({});
    expect(result.sections.length).toBeGreaterThan(0);
    expect(result.sectionAssignments).toEqual([]);
    expect(result.unsectionedProductKeys).toEqual([]);
    expect(result.viewMode).toBe('cards');
    expect(result.recoveryCandidate).toBeNull();
    expect(result.recoverySnapshots).toEqual([]);
  });

  it('normalizes legacy and unknown group sort settings', async () => {
    storage['schemaVersion'] = 5;
    storage['settings'] = { groupSortBy: 'default' };
    await expect(readStorage()).resolves.toMatchObject({
      settings: { groupSortBy: 'count' },
    });

    storage['settings'] = { groupSortBy: 'not-real' };
    await expect(readStorage()).resolves.toMatchObject({
      settings: { groupSortBy: 'count' },
    });
  });

  it('maps legacy space shortcut settings to section shortcut settings', async () => {
    storage['schemaVersion'] = 5;
    storage['settings'] = {
      keyBindings: {
        switchSpaceN: 'Alt+{n}',
        switchSpaceAll: 'Alt+0',
        focusSearch: 'Meta+K',
      },
    };

    const result = await readStorage();

    expect(result.settings.keyBindings.switchSectionN).toBe('Alt+{n}');
    expect(result.settings.keyBindings.switchSectionAll).toBe('Alt+0');
    expect(result.settings.keyBindings.focusSearch).toBe('Meta+K');
    expect(result.settings.keyBindings.cyclePrev).toBe('ArrowLeft');
  });

  it('prefers current section shortcuts over legacy space shortcut settings', async () => {
    storage['schemaVersion'] = 5;
    storage['settings'] = {
      keyBindings: {
        switchSpaceN: 'Alt+{n}',
        switchSpaceAll: 'Alt+0',
        switchSectionN: 'Shift+{n}',
        switchSectionAll: 'Shift+0',
      },
    };

    const result = await readStorage();

    expect(result.settings.keyBindings.switchSectionN).toBe('Shift+{n}');
    expect(result.settings.keyBindings.switchSectionAll).toBe('Shift+0');
  });

  it('resets to default storage when no schemaVersion exists (fresh install)', async () => {
    const result = await readStorage();
    expect(result.schemaVersion).toBe(5);
    expect(result.settings.theme).toBe('clay');
    expect(result.settings.groupSortBy).toBe('count');
    expect(result.groupOrder).toEqual({});
    expect(result.sections.length).toBeGreaterThan(0);
    expect(result.sectionAssignments).toEqual([]);
    expect(result.unsectionedProductKeys).toEqual([]);
    expect(result.viewMode).toBe('cards');
    expect(result.recoveryCandidate).toBeNull();
    expect(result.recoverySnapshots).toEqual([]);
  });

  it('resets to default storage when schemaVersion is outdated (v3)', async () => {
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

    expect(result.schemaVersion).toBe(5);
    // Schema mismatch resets to DEFAULT_STORAGE; legacy data is not read
    expect(result.sections.length).toBeGreaterThan(0);
    expect(result.sectionAssignments).toEqual([]);
    expect(result.recoverySnapshots).toEqual([]);
    expect(result.recoveryCandidate).toBeNull();
  });

  it('filters browser-internal tabs from recovery snapshots during normalization', async () => {
    storage['schemaVersion'] = 5;
    storage['recoverySnapshots'] = [{
      id: 'snap-current',
      capturedAt: '2026-05-05T00:00:00Z',
      tabCount: 4,
      products: [{ productKey: 'example.com', label: 'Example', iconDomain: 'example.com', tabCount: 1 }],
      tabs: [
        {
          url: 'chrome://extensions',
          title: 'Extensions',
          domain: 'chrome',
          productKey: 'chrome',
          productLabel: 'Chrome',
          iconDomain: 'chrome',
          favIconUrl: '',
          capturedAt: '2026-05-05T00:00:00Z',
        },
        {
          url: 'chrome-extension://fake-id/src/dashboard/index.html',
          title: 'Tab Organizer',
          domain: 'fake-id',
          productKey: 'fake-id',
          productLabel: 'Extension',
          iconDomain: 'fake-id',
          favIconUrl: '',
          capturedAt: '2026-05-05T00:00:00Z',
        },
        {
          url: 'devtools://devtools/bundled/inspector.html',
          title: 'DevTools',
          domain: 'devtools',
          productKey: 'devtools',
          productLabel: 'DevTools',
          iconDomain: 'devtools',
          favIconUrl: '',
          capturedAt: '2026-05-05T00:00:00Z',
        },
        {
          url: 'https://example.com',
          title: 'Example',
          domain: 'example.com',
          productKey: 'example.com',
          productLabel: 'Example',
          iconDomain: 'example.com',
          favIconUrl: '',
          capturedAt: '2026-05-05T00:00:00Z',
        },
      ],
    }];

    const result = await readStorage();

    expect(result.recoverySnapshots).toHaveLength(1);
    expect(result.recoverySnapshots[0].tabs.map((tab) => tab.url)).toEqual(['https://example.com']);
    expect(result.recoverySnapshots[0].tabCount).toBe(1);
  });

  it('normalizes section organizer state and rejects tabUrl assignments', async () => {
    const rejectedUrlAssignmentType = 'tab' + 'Url';
    storage['schemaVersion'] = 5;
    storage['sections'] = [
      { id: 'later', name: 'Later', order: 2 },
      { id: 'homepages', name: 'Homepages', order: 1 },
      { id: '', name: 'bad' },
      { id: 'untitled', name: '   ', order: 3 },
    ];
    storage['sectionAssignments'] = [
      { productKey: 'youtube', sectionId: 'later', order: 0 },
      { itemType: 'product', itemKey: 'github', sectionId: 'later', order: 1 },
      { itemType: rejectedUrlAssignmentType, itemKey: 'https://example.com', sectionId: 'later' },
      { itemType: 'bad', itemKey: 'x', sectionId: 'later' },
    ];
    storage['viewMode'] = 'table';

    const result = await readStorage();

    expect(result.sections.map((g) => g.id)).toEqual(['homepages', 'later', 'untitled']);
    expect(result.sections.find((g) => g.id === 'untitled')?.name).toBe('Untitled');
    expect(result.sectionAssignments).toEqual([
      { productKey: 'youtube', sectionId: 'later', order: 0 },
      { productKey: 'github', sectionId: 'later', order: 1 },
    ]);
    expect(result.viewMode).toBe('table');
  });

  it('normalizes unsectioned product keys', async () => {
    storage['schemaVersion'] = 5;
    storage['unsectionedProductKeys'] = ['github', '', 'github', 123, ' google.com '];

    const result = await readStorage();

    expect(result.unsectionedProductKeys).toEqual(['github', 'google.com']);
  });

  it('normalizes malformed sections and assignments to empty lists', async () => {
    storage['schemaVersion'] = 5;
    storage['sections'] = 'not-an-array';
    storage['sectionAssignments'] = 'not-an-array';
    storage['unsectionedProductKeys'] = 'not-an-array';
    storage['viewMode'] = 'invalid';

    const result = await readStorage();

    expect(result.sections).toEqual([]);
    expect(result.sectionAssignments).toEqual([]);
    expect(result.unsectionedProductKeys).toEqual([]);
    expect(result.viewMode).toBe('cards');
  });
});

function makeSnapshot(id: string, urls: string[]): RecoverySnapshot {
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

describe('recovery storage', () => {
  it('safely ignores null direct snapshot promotions', async () => {
    const promoted = await promoteRecoverySnapshot(null);
    const result = await readStorage();

    expect(promoted).toBe(false);
    expect(result.recoverySnapshots).toEqual([]);
    expect(result.recoveryCandidate).toBeNull();
  });

  it('directly promotes snapshots with signature dedupe and five item cap', async () => {
    for (let index = 0; index < 6; index += 1) {
      await promoteRecoverySnapshot(makeSnapshot(String(index), [`https://example.com/${index}`]));
    }

    let result = await readStorage();
    expect(result.recoverySnapshots.map((snapshot) => snapshot.id)).toEqual(['5', '4', '3', '2', '1']);

    const promoted = await promoteRecoverySnapshot(makeSnapshot('duplicate', ['https://example.com/3']));
    result = await readStorage();

    expect(promoted).toBe(true);
    expect(result.recoverySnapshots.map((snapshot) => snapshot.id)).toEqual(['duplicate', '5', '4', '2', '1']);
    expect(result.recoveryCandidate?.id).toBe('duplicate');
  });

  it('does not duplicate the latest URL signature when directly promoted again', async () => {
    await promoteRecoverySnapshot(makeSnapshot('1', ['https://example.com/1']));

    const promoted = await promoteRecoverySnapshot(makeSnapshot('same-url', ['https://example.com/1']));
    const result = await readStorage();

    expect(promoted).toBe(false);
    expect(result.recoverySnapshots.map((snapshot) => snapshot.id)).toEqual(['1']);
    expect(result.recoveryCandidate?.id).toBe('same-url');
  });

  it('stores a bounded latest candidate and promotes it to history on startup', async () => {
    const tooManyTabs = Array.from({ length: 85 }, (_, index) => `https://example.com/${index}`);
    const candidate = makeSnapshot('1', tooManyTabs);

    await updateRecoveryCandidate(candidate);
    let result = await readStorage();

    expect(result.recoveryCandidate?.tabs).toHaveLength(80);
    expect(result.recoveryCandidate?.tabCount).toBe(80);
    expect(result.recoverySnapshots).toHaveLength(0);

    const promoted = await promoteRecoveryCandidate();
    result = await readStorage();

    expect(promoted).toBe(true);
    expect(result.recoverySnapshots).toHaveLength(1);
    expect(result.recoverySnapshots[0].tabs).toHaveLength(80);
  });


  it('keeps only five history snapshots and skips duplicate URL sets', async () => {
    for (let index = 0; index < 7; index += 1) {
      await updateRecoveryCandidate(makeSnapshot(String(index), [`https://example.com/${index}`]));
      await promoteRecoveryCandidate();
    }

    let result = await readStorage();
    expect(result.recoverySnapshots.map((snapshot) => snapshot.id)).toEqual(['6', '5', '4', '3', '2']);

    await updateRecoveryCandidate(makeSnapshot('duplicate', ['https://example.com/6']));
    const promoted = await promoteRecoveryCandidate();
    result = await readStorage();

    expect(promoted).toBe(false);
    expect(result.recoverySnapshots.map((snapshot) => snapshot.id)).toEqual(['6', '5', '4', '3', '2']);
  });

  it('deletes one history snapshot and clears history', async () => {
    await updateRecoveryCandidate(makeSnapshot('1', ['https://example.com/1']));
    await promoteRecoveryCandidate();
    await updateRecoveryCandidate(makeSnapshot('2', ['https://example.com/2']));
    await promoteRecoveryCandidate();

    await deleteRecoverySnapshot('1');
    let result = await readStorage();
    expect(result.recoverySnapshots.map((snapshot) => snapshot.id)).toEqual(['2']);

    await clearRecoverySnapshots();
    result = await readStorage();
    expect(result.recoverySnapshots).toEqual([]);
    expect(result.recoveryCandidate).toBeNull();
  });
});

describe('writeGroupOrder', () => {
  it('persists group ordering to storage', async () => {
    await writeGroupOrder({ 'github.com': 1, 'google.com': 0 });
    const result = await readStorage();
    expect(result.groupOrder).toEqual({ 'github.com': 1, 'google.com': 0 });
  });

  it('does not clobber unrelated settings when another write lands first', async () => {
    storage['schemaVersion'] = 5;
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
          schemaVersion: 5,
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

describe('organizer storage mutations', () => {
  it('prunes stale order, assignments, and unsorted overrides', async () => {
    storage['schemaVersion'] = 5;
    storage['sections'] = [{ id: 'group-1', name: 'Group', order: 0 }];
    storage['groupOrder'] = { github: 0, stale: 1 };
    storage['sectionAssignments'] = [
      { productKey: 'github', sectionId: 'group-1', order: 0 },
      { productKey: 'stale', sectionId: 'group-1', order: 1 },
      { productKey: 'github', sectionId: 'missing-group', order: 2 },
    ];
    storage['unsectionedProductKeys'] = ['github', 'stale'];

    await pruneStaleStorage(new Set(['github']));
    const result = await readStorage();

    expect(result.groupOrder).toEqual({ github: 0 });
    expect(result.sectionAssignments).toEqual([{ productKey: 'github', sectionId: 'group-1', order: 0 }]);
    expect(result.unsectionedProductKeys).toEqual(['github']);
  });

  it('leaves organizer storage untouched when no stale data exists', async () => {
    storage['schemaVersion'] = 5;
    storage['sections'] = [{ id: 'group-1', name: 'Group', order: 0 }];
    storage['groupOrder'] = { github: 0 };
    storage['sectionAssignments'] = [{ productKey: 'github', sectionId: 'group-1', order: 0 }];
    storage['unsectionedProductKeys'] = ['github'];

    await pruneStaleStorage(new Set(['github']));
    const result = await readStorage();

    expect(result.groupOrder).toEqual({ github: 0 });
    expect(result.sectionAssignments).toEqual([{ productKey: 'github', sectionId: 'group-1', order: 0 }]);
    expect(result.unsectionedProductKeys).toEqual(['github']);
  });

  it('assigns products by clearing No section overrides and moves unassigned products into No section overrides', async () => {
    storage['schemaVersion'] = 5;
    storage['sections'] = [{ id: 'group-1', name: 'Group', order: 0 }];
    storage['sectionAssignments'] = [{ productKey: 'github', sectionId: 'group-1', order: 0 }];
    storage['unsectionedProductKeys'] = ['vercel', 'github'];

    let next = await assignProductToSection('vercel', 'group-1');
    expect(next.sectionAssignments).toEqual([
      { productKey: 'github', sectionId: 'group-1', order: 0 },
      { productKey: 'vercel', sectionId: 'group-1', order: 1 },
    ]);
    expect(next.unsectionedProductKeys).toEqual(['github']);

    next = await unassignProductFromSections('vercel');
    expect(next.sectionAssignments).toEqual([{ productKey: 'github', sectionId: 'group-1', order: 0 }]);
    expect(next.unsectionedProductKeys).toEqual(['github', 'vercel']);
  });

  it('does not duplicate an existing No section override when unassigning', async () => {
    storage['schemaVersion'] = 5;
    storage['unsectionedProductKeys'] = ['github'];

    const next = await unassignProductFromSections('github');

    expect(next.unsectionedProductKeys).toEqual(['github']);
  });
});

describe('reconcileOrganizerState', () => {
  it('seeds default sections when sections has never been persisted', async () => {
    const state = await reconcileOrganizerState(new Set(['github.com']), new Map());
    expect(state.sections.length).toBeGreaterThan(0);
    // Check if the default Dev section is present
    const devSection = state.sections.find(g => g.id === 'section-dev');
    expect(devSection).toBeDefined();
    expect(devSection?.name).toBe('Dev');
    expect(devSection?.autoRules?.[0]?.pattern).toContain('github');
  });

  it('preserves empty sections in current schema without reseeding', async () => {
    storage['schemaVersion'] = 5;
    storage['sections'] = [];

    const state = await reconcileOrganizerState(new Set(['github.com']), new Map());
    const result = await readStorage();

    expect(state.sections).toEqual([]);
    expect(result.sections).toEqual([]);
  });

  it('keeps existing sections if not empty', async () => {
    // Let's seed a custom group in storage first
    storage['schemaVersion'] = 5;
    const customGroup = { id: 'custom-id', name: 'My Section', order: 0 };
    storage['sections'] = [customGroup];

    const state = await reconcileOrganizerState(new Set(['github.com']), new Map());
    expect(state.sections).toEqual([customGroup]);
  });

  it('canonicalizes and prunes unsorted overrides during organizer reconcile', async () => {
    storage['schemaVersion'] = 5;
    storage['sections'] = [{ id: 'g1', name: 'G1', order: 0 }];
    storage['unsectionedProductKeys'] = ['google.com', 'missing-product', 'github'];

    const state = await reconcileOrganizerState(
      new Set(['google', 'github']),
      new Map([['google.com', 'google']]),
    );
    const result = await readStorage();

    expect(state.unsectionedProductKeys).toEqual(['google', 'github']);
    expect(result.unsectionedProductKeys).toEqual(['google', 'github']);
  });
});
