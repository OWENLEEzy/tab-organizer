import { describe, it, expect } from 'vitest';
import { countDuplicates, getDuplicateUrls, dedupeTabsByUrl } from '../lib/tab-utils';
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
    isTabOut: false,
    isDuplicate: false,
    isLandingPage: false,
    duplicateCount: 0,
  };
}

describe('tab-utils', () => {
  describe('countDuplicates', () => {
    it('returns zero for unique URLs', () => {
      const tabs = [
        makeTab(1, 'https://a.com'),
        makeTab(2, 'https://b.com'),
      ];
      const result = countDuplicates(tabs);
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
      const result = countDuplicates(tabs);
      // 3 tabs of a.com means 2 are "duplicates" (extras)
      expect(result.duplicateCount).toBe(2);
      expect(result.hasDuplicates).toBe(true);
    });
  });

  describe('getDuplicateUrls', () => {
    it('returns empty array for unique list', () => {
      const tabs = [
        makeTab(1, 'https://a.com'),
        makeTab(2, 'https://b.com'),
      ];
      expect(getDuplicateUrls(tabs)).toEqual([]);
    });

    it('returns only URLs that appear more than once', () => {
      const tabs = [
        makeTab(1, 'https://a.com'),
        makeTab(2, 'https://a.com'),
        makeTab(3, 'https://b.com'),
        makeTab(4, 'https://c.com'),
        makeTab(5, 'https://c.com'),
      ];
      const dupes = getDuplicateUrls(tabs);
      expect(dupes).toContain('https://a.com');
      expect(dupes).toContain('https://c.com');
      expect(dupes).not.toContain('https://b.com');
      expect(dupes).toHaveLength(2);
    });
  });

  describe('dedupeTabsByUrl', () => {
    it('keeps only the first occurrence of each URL', () => {
      const tabs = [
        makeTab(1, 'https://a.com'),
        makeTab(2, 'https://a.com'),
        makeTab(3, 'https://b.com'),
      ];
      const deduped = dedupeTabsByUrl(tabs);
      expect(deduped).toHaveLength(2);
      expect(deduped[0].id).toBe(1);
      expect(deduped[1].id).toBe(3);
    });
  });
});
