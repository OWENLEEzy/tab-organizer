import { beforeEach, describe, expect, it, vi } from 'vitest';
import { refreshPlacementFromStrip } from '../utils/refresh-placement';
import { readStorage } from '../utils/storage';

const stored: Record<string, unknown> = {};

function snapshot(keys: string[] | string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Array.isArray(keys) ? keys : [keys]) {
    if (key in stored) result[key] = stored[key];
  }
  return result;
}

const moveTabs = vi.fn();
const groupTabs = vi.fn();

vi.stubGlobal('chrome', {
  storage: {
    local: {
      get: vi.fn((keys: string[] | string) => Promise.resolve(snapshot(keys))),
      set: vi.fn((items: Record<string, unknown>) => {
        Object.assign(stored, items);
        return Promise.resolve();
      }),
      remove: vi.fn(() => Promise.resolve()),
    },
  },
  tabs: {
    query: vi.fn(async () => [
      { id: 1, url: 'https://glados.example/', pinned: false, groupId: 7 },
      { id: 2, url: 'https://youtube.example/watch', pinned: false, groupId: -1 },
    ]),
    move: moveTabs,
    group: groupTabs,
  },
  tabGroups: {
    TAB_GROUP_ID_NONE: -1,
    query: vi.fn(async () => [{ id: 7, title: '其他', windowId: 1, color: 'blue', collapsed: true }]),
  },
});

beforeEach(() => {
  for (const key of Object.keys(stored)) delete stored[key];
  moveTabs.mockClear();
  groupTabs.mockClear();
  stored.schemaVersion = 6;
  stored.onboardingDone = true;
  stored.sections = [
    { id: 'work', name: 'Work', order: 0 },
    { id: 'other', name: '其他', order: 1 },
  ];
  stored.sectionAssignments = [
    { productKey: 'youtube.example', sectionId: 'other' },
    { productKey: 'closed.example', sectionId: 'work' },
  ];
  stored.unsectionedProductKeys = [];
});

describe('refreshPlacementFromStrip', () => {
  it('copies the Chrome groups into the panel and does not move tabs', async () => {
    await refreshPlacementFromStrip();
    const storage = await readStorage();

    expect(storage.sectionAssignments).toEqual([
      { productKey: 'closed.example', sectionId: 'work' },
      { productKey: 'glados.example', sectionId: 'other' },
    ]);
    expect(storage.unsectionedProductKeys).toEqual(['youtube.example']);
    expect(moveTabs).not.toHaveBeenCalled();
    expect(groupTabs).not.toHaveBeenCalled();
  });

  it('leaves stored placement unchanged when Chrome groups cannot be read', async () => {
    const api = globalThis.chrome as { tabGroups?: unknown };
    const groups = api.tabGroups;
    delete api.tabGroups;
    try {
      await refreshPlacementFromStrip();
    } finally {
      api.tabGroups = groups;
    }

    const storage = await readStorage();
    expect(storage.sectionAssignments).toEqual([
      { productKey: 'youtube.example', sectionId: 'other' },
      { productKey: 'closed.example', sectionId: 'work' },
    ]);
    expect(storage.unsectionedProductKeys).toEqual([]);
    expect(moveTabs).not.toHaveBeenCalled();
  });
});
