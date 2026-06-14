import { describe, expect, it } from 'vitest';
import { duplicateTabIdsToClose } from '../lib/duplicate-tabs';

describe('duplicateTabIdsToClose', () => {
  it('keeps the active tab and returns every duplicate tab id for the same URL', () => {
    const ids = duplicateTabIdsToClose([
      { id: 11, url: 'https://example.com/a', active: false },
      { id: 12, url: 'https://example.com/a', active: true },
      { id: 13, url: 'https://example.com/a', active: false },
      { id: 14, url: 'https://example.com/b', active: false },
    ]);

    expect(ids).toEqual([11, 13]);
  });

  it('keeps the most-recently-accessed duplicate, even if not the active one', () => {
    const ids = duplicateTabIdsToClose([
      { id: 11, url: 'https://example.com/a', active: true, lastAccessed: 100 },
      { id: 12, url: 'https://example.com/a', active: false, lastAccessed: 300 },
      { id: 13, url: 'https://example.com/a', active: false, lastAccessed: 200 },
    ]);

    // 12 is newest by lastAccessed -> keep it, close the rest.
    expect(ids.sort((a, b) => a - b)).toEqual([11, 13]);
  });

  it('falls back to the active tab when lastAccessed is absent or tied', () => {
    const ids = duplicateTabIdsToClose([
      { id: 11, url: 'https://example.com/a', active: false },
      { id: 12, url: 'https://example.com/a', active: true },
      { id: 13, url: 'https://example.com/a', active: false },
    ]);

    expect(ids).toEqual([11, 13]);
  });

  it('can scope duplicate closure to a target URL set', () => {
    const ids = duplicateTabIdsToClose(
      [
        { id: 11, url: 'https://example.com/a', active: false },
        { id: 12, url: 'https://example.com/a', active: false },
        { id: 13, url: 'https://example.com/b', active: false },
        { id: 14, url: 'https://example.com/b', active: false },
      ],
      new Set(['https://example.com/b']),
    );

    expect(ids).toEqual([14]);
  });
});
