import { describe, it, expect } from 'vitest';
import { isTabStale } from '../lib/staleness';
import { makeAppTab } from './factories';

describe('isTabStale', () => {
  it('treats active, pinned, and audible tabs as not stale', () => {
    const now = Date.now();
    const old = now - 10 * 24 * 60 * 60 * 1000;

    expect(isTabStale({ ...makeAppTab({ id: 1, url: 'https://a.com' }), lastAccessed: old }, now, 3)).toBe(true);
    expect(isTabStale({ ...makeAppTab({ id: 2, url: 'https://b.com' }), active: true, lastAccessed: old }, now, 3)).toBe(false);
    expect(isTabStale({ ...makeAppTab({ id: 3, url: 'https://c.com' }), pinned: true, lastAccessed: old }, now, 3)).toBe(false);
    expect(isTabStale({ ...makeAppTab({ id: 4, url: 'https://d.com' }), audible: true, lastAccessed: old }, now, 3)).toBe(false);
    expect(isTabStale(makeAppTab({ id: 5, url: 'https://e.com' }), now, 3)).toBe(false);
  });
});
