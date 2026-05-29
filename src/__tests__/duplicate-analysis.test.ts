import { describe, it, expect } from 'vitest';
import { analyzeDuplicates } from '../lib/duplicate-analysis';
import { makeAppTab } from './factories';

describe('analyzeDuplicates', () => {
  it('returns zero for unique URLs', () => {
    const tabs = [
      makeAppTab({ id: 1, url: 'https://a.com' }),
      makeAppTab({ id: 2, url: 'https://b.com' }),
    ];
    const result = analyzeDuplicates(tabs);
    expect(result.duplicateCount).toBe(0);
    expect(result.hasDuplicates).toBe(false);
  });

  it('counts extras when URLs repeat', () => {
    const tabs = [
      makeAppTab({ id: 1, url: 'https://a.com' }),
      makeAppTab({ id: 2, url: 'https://a.com' }),
      makeAppTab({ id: 3, url: 'https://a.com' }),
      makeAppTab({ id: 4, url: 'https://b.com' }),
    ];
    const result = analyzeDuplicates(tabs);
    expect(result.duplicateCount).toBe(2);
    expect(result.hasDuplicates).toBe(true);
  });

  it('returns empty array for unique list', () => {
    const tabs = [
      makeAppTab({ id: 1, url: 'https://a.com' }),
      makeAppTab({ id: 2, url: 'https://b.com' }),
    ];
    expect(analyzeDuplicates(tabs).duplicateUrls).toEqual([]);
  });

  it('returns only URLs that appear more than once', () => {
    const tabs = [
      makeAppTab({ id: 1, url: 'https://a.com' }),
      makeAppTab({ id: 2, url: 'https://a.com' }),
      makeAppTab({ id: 3, url: 'https://b.com' }),
      makeAppTab({ id: 4, url: 'https://c.com' }),
      makeAppTab({ id: 5, url: 'https://c.com' }),
    ];
    const dupes = analyzeDuplicates(tabs).duplicateUrls;
    expect(dupes).toContain('https://a.com');
    expect(dupes).toContain('https://c.com');
    expect(dupes).not.toContain('https://b.com');
    expect(dupes).toHaveLength(2);
  });

  it('returns deduped tabs by keeping the first tab for each URL', () => {
    const tabs = [
      makeAppTab({ id: 1, url: 'https://a.com' }),
      makeAppTab({ id: 2, url: 'https://a.com' }),
      makeAppTab({ id: 3, url: 'https://b.com' }),
    ];
    const result = analyzeDuplicates(tabs);
    expect(result.dedupedTabs.map((tab) => tab.id)).toEqual([1, 3]);
  });

  it('filters duplicate tabs correctly', () => {
    const tabs = [
      makeAppTab({ id: 1, url: 'https://a.com' }),
      makeAppTab({ id: 2, url: 'https://a.com' }),
      makeAppTab({ id: 3, url: 'https://b.com' }),
    ];
    const result = analyzeDuplicates(tabs);
    expect(result.duplicateTabs.map((tab) => tab.id)).toEqual([1, 2]);
  });
});
