import { describe, it, expect, vi } from 'vitest';
import { analyzeDuplicates } from '../lib/duplicate-analysis';
import { isTabStale } from '../lib/staleness';
import { getProductKey } from '../lib/product-key';
import { getGroupFaviconSource } from '../lib/group-favicon';
import type { Tab } from '../types';

function makeTab(id: number, url: string): Tab {
  return {
    id,
    url,
    title: `Tab ${id}`,
    favIconUrl: '',
    domain: '',
    windowId: 1,
    active: false,
    isDashboard: false,
    isDuplicate: false,
    isLandingPage: false,
    duplicateCount: 0,
  };
}

describe('tab-utils', () => {
  vi.stubGlobal('chrome', {
    runtime: {
      getURL: vi.fn((path: string) => `chrome-extension://fake-id${path}`),
    },
  });

  describe('analyzeDuplicates', () => {
    it('returns zero for unique URLs', () => {
      const tabs = [
        makeTab(1, 'https://a.com'),
        makeTab(2, 'https://b.com'),
      ];
      const result = analyzeDuplicates(tabs);
      expect(result.duplicateCount).toBe(0);
      expect(result.hasDuplicates).toBe(false);
    });

    it('counts extras when URLs repeat', () => {
      const tabs = [
        makeTab(1, 'https://a.com'),
        makeTab(2, 'https://a.com'),
        makeTab(3, 'https://a.com'),
        makeTab(4, 'https://b.com'),
      ];
      const result = analyzeDuplicates(tabs);
      // 3 tabs of a.com means 2 are "duplicates" (extras)
      expect(result.duplicateCount).toBe(2);
      expect(result.hasDuplicates).toBe(true);
    });

    it('returns empty array for unique list', () => {
      const tabs = [
        makeTab(1, 'https://a.com'),
        makeTab(2, 'https://b.com'),
      ];
      expect(analyzeDuplicates(tabs).duplicateUrls).toEqual([]);
    });

    it('returns only URLs that appear more than once', () => {
      const tabs = [
        makeTab(1, 'https://a.com'),
        makeTab(2, 'https://a.com'),
        makeTab(3, 'https://b.com'),
        makeTab(4, 'https://c.com'),
        makeTab(5, 'https://c.com'),
      ];
      const dupes = analyzeDuplicates(tabs).duplicateUrls;
      expect(dupes).toContain('https://a.com');
      expect(dupes).toContain('https://c.com');
      expect(dupes).not.toContain('https://b.com');
      expect(dupes).toHaveLength(2);
    });

    it('returns deduped tabs by keeping the first tab for each URL', () => {
      const tabs = [
        makeTab(1, 'https://a.com'),
        makeTab(2, 'https://a.com'), // duplicate
        makeTab(3, 'https://b.com'),
      ];
      const result = analyzeDuplicates(tabs);
      expect(result.dedupedTabs.map((tab) => tab.id)).toEqual([1, 3]);
    });

    it('filters duplicate tabs correctly', () => {
      const tabs = [
        makeTab(1, 'https://a.com'),
        makeTab(2, 'https://a.com'),
        makeTab(3, 'https://b.com'),
      ];
      const result = analyzeDuplicates(tabs);
      expect(result.duplicateTabs.map((tab) => tab.id)).toEqual([1, 2]);
    });
  });

  describe('tab state helpers', () => {
    it('treats active, pinned, and audible tabs as not stale', () => {
      const now = Date.now();
      const old = now - 10 * 24 * 60 * 60 * 1000;

      expect(isTabStale({ ...makeTab(1, 'https://a.com'), lastAccessed: old }, now, 3)).toBe(true);
      expect(isTabStale({ ...makeTab(2, 'https://b.com'), active: true, lastAccessed: old }, now, 3)).toBe(false);
      expect(isTabStale({ ...makeTab(3, 'https://c.com'), pinned: true, lastAccessed: old }, now, 3)).toBe(false);
      expect(isTabStale({ ...makeTab(4, 'https://d.com'), audible: true, lastAccessed: old }, now, 3)).toBe(false);
      expect(isTabStale(makeTab(5, 'https://e.com'), now, 3)).toBe(false);
    });

    it('filters duplicate tabs and resolves group identity helpers', () => {
      const tabs = [
        makeTab(1, 'https://a.com'),
        makeTab(2, 'https://a.com'),
        makeTab(3, 'https://b.com'),
      ];

      expect(analyzeDuplicates(tabs).duplicateTabs.map((tab: Tab) => tab.id)).toEqual([1, 2]);
      expect(getProductKey({ productKey: 'product', itemKey: 'item', domain: 'domain' })).toBe('product');
      expect(getProductKey({ itemKey: 'item', domain: 'domain' })).toBe('item');
      expect(getProductKey({ domain: 'domain' })).toBe('domain');
    });

    it('uses a provided favicon or falls back to the first tab URL', () => {
      expect(getGroupFaviconSource([
        { ...makeTab(1, 'https://a.com'), favIconUrl: '  https://cdn.example/icon.png  ' },
      ])).toBe('https://cdn.example/icon.png');

      expect(getGroupFaviconSource([makeTab(2, 'https://fallback.example/path')])).toBe(
        'https://fallback.example/path',
      );
      expect(getGroupFaviconSource([])).toBe('');
    });
  });
});
