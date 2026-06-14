import { describe, it, expect } from 'vitest';
import { findLastUsedTabId } from '../lib/last-used';

describe('findLastUsedTabId', () => {
  it('returns the single real tab with the newest lastAccessed', () => {
    const id = findLastUsedTabId([
      { id: 1, url: 'https://a.com', lastAccessed: 100 },
      { id: 2, url: 'http://localhost:3000', lastAccessed: 300 },
      { id: 3, url: 'https://b.com', lastAccessed: 200 },
    ]);
    expect(id).toBe(2);
  });

  it('excludes the extension/internal pages even when they are newest', () => {
    // Opening the dashboard makes it the most-recently-accessed tab; it must
    // not steal the "last used" marker from the real localhost tab.
    const id = findLastUsedTabId([
      { id: 1, url: 'http://localhost:3000', lastAccessed: 200 },
      { id: 2, url: 'chrome-extension://abc/dashboard.html', lastAccessed: 999 },
      { id: 3, url: 'chrome://newtab/', lastAccessed: 998 },
    ]);
    expect(id).toBe(1);
  });

  it('returns null when there are no real tabs', () => {
    expect(
      findLastUsedTabId([
        { id: 1, url: 'chrome://newtab/', lastAccessed: 100 },
        { id: 2, url: 'chrome-extension://abc/popup.html', lastAccessed: 200 },
      ]),
    ).toBeNull();
  });

  it('returns null for an empty list', () => {
    expect(findLastUsedTabId([])).toBeNull();
  });

  it('ignores tabs without a usable id', () => {
    const id = findLastUsedTabId([
      { id: undefined, url: 'https://a.com', lastAccessed: 999 },
      { id: 5, url: 'https://b.com', lastAccessed: 100 },
    ]);
    expect(id).toBe(5);
  });

  it('treats a missing lastAccessed as oldest', () => {
    const id = findLastUsedTabId([
      { id: 1, url: 'https://a.com' },
      { id: 2, url: 'https://b.com', lastAccessed: 1 },
    ]);
    expect(id).toBe(2);
  });
});
