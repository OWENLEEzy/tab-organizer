import { describe, expect, it } from 'vitest';
import { buildRecoverySnapshot, shouldReplaceRecoveryCandidate } from '../lib/recovery-snapshots';
import type { RecoverySnapshot, Tab } from '../types';

function makeTab(overrides: Partial<Tab> & Pick<Tab, 'id' | 'url'>): Tab {
  return {
    title: 'Test Tab',
    favIconUrl: '',
    domain: '',
    windowId: 1,
    active: false,
    isTabOut: false,
    isDuplicate: false,
    isLandingPage: false,
    duplicateCount: 0,
    ...overrides,
  };
}

function snapshotWithUrls(urls: string[]): RecoverySnapshot {
  return buildRecoverySnapshot(
    urls.map((url, index) => makeTab({ id: index, url, title: `Tab ${index}` })),
    '2026-05-05T00:00:00.000Z',
  )!;
}

describe('buildRecoverySnapshot', () => {
  it('excludes browser internal and Tab Out pages and keeps product summaries', () => {
    const snapshot = buildRecoverySnapshot(
      [
        makeTab({ id: 1, url: 'https://github.com/OWENLEEzy/tab-out', title: 'Repo' }),
        makeTab({ id: 2, url: 'https://music.youtube.com/watch?v=1', title: 'Song' }),
        makeTab({ id: 3, url: 'chrome://extensions', title: 'Extensions' }),
        makeTab({ id: 4, url: 'chrome-extension://fake-id/src/newtab/index.html', title: 'Tab Out' }),
      ],
      '2026-05-05T00:00:00.000Z',
    );

    expect(snapshot?.tabs.map((tab) => tab.url)).toEqual([
      'https://github.com/OWENLEEzy/tab-out',
      'https://music.youtube.com/watch?v=1',
    ]);
    expect(snapshot?.products.map((product) => product.productKey).sort()).toEqual(['github', 'youtube']);
  });

  it('returns null when there are no real tabs and caps snapshots at 80 tabs', () => {
    expect(buildRecoverySnapshot([
      makeTab({ id: 1, url: 'chrome://newtab/' }),
    ])).toBeNull();

    const snapshot = buildRecoverySnapshot(
      Array.from({ length: 85 }, (_, index) => makeTab({ id: index, url: `https://example.com/${index}` })),
      '2026-05-05T00:00:00.000Z',
    );

    expect(snapshot?.tabs).toHaveLength(80);
    expect(snapshot?.tabCount).toBe(80);
  });
});

describe('shouldReplaceRecoveryCandidate', () => {
  it('ignores title-only changes and replaces candidates when the URL set changes', () => {
    const current = snapshotWithUrls(['https://example.com/a']);
    const sameUrlsNewTitle = {
      ...snapshotWithUrls(['https://example.com/a']),
      tabs: [{ ...current.tabs[0], title: 'New title' }],
    };
    const changedUrls = snapshotWithUrls(['https://example.com/b']);

    expect(shouldReplaceRecoveryCandidate(current, sameUrlsNewTitle)).toBe(false);
    expect(shouldReplaceRecoveryCandidate(current, changedUrls)).toBe(true);
  });
});
