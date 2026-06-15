import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePopupData } from '../popup/usePopupData';

vi.mock('../utils/chrome-tabs', () => ({
  queryAllTabs: vi.fn(),
  subscribeToTabEvents: vi.fn(() => () => {}),
}));
vi.mock('../utils/storage', () => ({
  readStorage: vi.fn(),
}));
vi.mock('../lib/url-rules', () => ({
  isRealTab: (url: string) => url.startsWith('https://'),
  getTabDomain: (url: string) => {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
  },
}));

import { queryAllTabs } from '../utils/chrome-tabs';
import { readStorage } from '../utils/storage';
import type { StorageSchema } from '../types';

const mockStorage: StorageSchema = {
  schemaVersion: 1,
  settings: {
    theme: 'clay',
    soundEnabled: true,
    confettiEnabled: true,
    maxChipsVisible: 8,
    staleThresholdDays: 7,
    customGroups: [],
    landingPagePatterns: [],
    groupSortBy: 'count',
    keyBindings: { switchSectionN: '', switchSectionAll: '', cyclePrev: '', cycleNext: '', focusSearch: '', clearFilter: '' },
  },
  groupOrder: {},
  sections: [],
  sectionAssignments: [],
  unsectionedProductKeys: [],
  viewMode: 'cards',
  recoveryCandidate: null,
  recoverySnapshots: [],
};

const mockTab = (id: number, url: string, windowId = 1): chrome.tabs.Tab => ({
  id, url, title: url, windowId, index: id, pinned: false,
  highlighted: false, active: false, incognito: false, selected: false,
  discarded: false, autoDiscardable: true, groupId: -1, frozen: false,
});

describe('usePopupData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(readStorage).mockResolvedValue({ ...mockStorage });
  });

  it('returns totalTabs count from real tabs only', async () => {
    vi.mocked(queryAllTabs).mockResolvedValue([
      mockTab(1, 'https://github.com/'),
      mockTab(2, 'chrome://newtab/'),   // filtered out
    ]);
    const { result } = renderHook(() => usePopupData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.totalTabs).toBe(1);
  });

  it('counts unassigned groups correctly', async () => {
    vi.mocked(queryAllTabs).mockResolvedValue([
      mockTab(1, 'https://github.com/'),
      mockTab(2, 'https://claude.ai/'),
    ]);
    const { result } = renderHook(() => usePopupData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.unassignedCount).toBe(2);
  });

  it('assignableCount counts only groups that match a section autoRule', async () => {
    // A "Dev" section auto-matches github; claude matches nothing. Both are still
    // unassigned (assignments not persisted yet), so unassignedCount=2, but only
    // github can actually be auto-assigned → assignableCount=1.
    vi.mocked(readStorage).mockResolvedValue({
      ...mockStorage,
      sections: [{ id: 'dev', name: 'Dev', order: 0, autoRules: [{ pattern: 'github', type: 'hostname' }] }],
    });
    vi.mocked(queryAllTabs).mockResolvedValue([
      mockTab(1, 'https://github.com/'),
      mockTab(2, 'https://claude.ai/'),
    ]);
    const { result } = renderHook(() => usePopupData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.unassignedCount).toBe(2);
    expect(result.current.assignableCount).toBe(1);
  });

  it('counts duplicates across all groups', async () => {
    vi.mocked(queryAllTabs).mockResolvedValue([
      mockTab(1, 'https://github.com/repo'),
      mockTab(2, 'https://github.com/repo'),
    ]);
    const { result } = renderHook(() => usePopupData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.duplicateCount).toBeGreaterThan(0);
  });

  it('exposes the persisted theme for the popup to apply', async () => {
    vi.mocked(readStorage).mockResolvedValue({
      ...mockStorage,
      settings: { ...mockStorage.settings, theme: 'pine' },
    });
    vi.mocked(queryAllTabs).mockResolvedValue([mockTab(1, 'https://github.com/')]);
    const { result } = renderHook(() => usePopupData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.theme).toBe('pine');
  });
});
