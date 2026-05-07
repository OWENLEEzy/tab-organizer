import { describe, it, expect } from 'vitest';
import { groupTabsByDomain } from '../lib/tab-grouper';
import type { Tab } from '../types';

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

describe('groupTabsByDomain', () => {
  it('returns empty array for empty input', () => {
    expect(groupTabsByDomain([])).toEqual([]);
  });

  it('groups tabs by product key instead of raw hostname', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://www.youtube.com/' }),
      makeTab({ id: 2, url: 'https://m.youtube.com/watch?v=abc' }),
      makeTab({ id: 3, url: 'https://stackoverflow.com/questions/1' }),
    ];

    const groups = groupTabsByDomain(tabs);
    const youtubeGroup = groups.find((g) => g.domain === 'youtube');
    const soGroup = groups.find((g) => g.domain === 'stackoverflow');

    expect(groups).toHaveLength(2);
    expect(youtubeGroup).toBeDefined();
    expect(youtubeGroup!.tabs).toHaveLength(2);
    expect(youtubeGroup!.friendlyName).toBe('YouTube');
    expect(youtubeGroup!.iconDomain).toBe('youtube.com');
    expect(youtubeGroup!.itemType).toBe('product');
    expect(soGroup).toBeDefined();
    expect(soGroup!.tabs).toHaveLength(1);
  });

  it('keeps landing pages in their product group until manually assigned', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://www.youtube.com/' }),
      makeTab({ id: 2, url: 'https://www.youtube.com/watch?v=1' }),
      makeTab({ id: 3, url: 'https://github.com/' }),
    ];

    const groups = groupTabsByDomain(tabs);

    expect(groups.find((g) => g.domain === '__landing-pages__')).toBeUndefined();
    expect(groups.find((g) => g.domain === 'youtube')!.tabs).toHaveLength(2);
    expect(groups.find((g) => g.domain === 'github')!.tabs).toHaveLength(1);
  });

  it('keeps Google products separated', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://mail.google.com/mail/u/0/#inbox' }),
      makeTab({ id: 2, url: 'https://docs.google.com/document/d/1/edit' }),
      makeTab({ id: 3, url: 'https://drive.google.com/drive/my-drive' }),
    ];

    const groups = groupTabsByDomain(tabs);
    const keys = groups.map((g) => g.domain).sort();

    expect(keys).toEqual(['gmail', 'google-docs', 'google-drive']);
    expect(groups.find((g) => g.domain === 'gmail')?.iconDomain).toBe('mail.google.com');
    expect(groups.find((g) => g.domain === 'google-docs')?.friendlyName).toBe('Google Docs');
  });

  it('merges YouTube and YouTube Music into one product', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://www.youtube.com/watch?v=1' }),
      makeTab({ id: 2, url: 'https://music.youtube.com/watch?v=2' }),
    ];

    const groups = groupTabsByDomain(tabs);
    const keys = groups.map((g) => g.domain).sort();

    expect(keys).toEqual(['youtube']);
    expect(groups.find((g) => g.domain === 'youtube')?.tabs).toHaveLength(2);
    expect(groups.find((g) => g.domain === 'youtube')?.iconDomain).toBe('youtube.com');
  });

  it('merges Vercel dashboard and vercel.app deployments into one product', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://vercel.com/dashboard' }),
      makeTab({ id: 2, url: 'https://my-product.vercel.app/' }),
      makeTab({ id: 3, url: 'https://preview-abc.my-product.vercel.app/path' }),
    ];

    const groups = groupTabsByDomain(tabs);

    expect(groups).toHaveLength(1);
    expect(groups[0].domain).toBe('vercel');
    expect(groups[0].tabs).toHaveLength(3);
  });

  it('handles file:// URLs as local-files group', () => {
    const tabs = [
      makeTab({ id: 1, url: 'file:///Users/test/document.html' }),
      makeTab({ id: 2, url: 'file:///Users/test/other.pdf' }),
      makeTab({ id: 3, url: 'https://example.com/page' }),
    ];

    const groups = groupTabsByDomain(tabs);
    const localGroup = groups.find((g) => g.domain === 'local-files');

    expect(localGroup).toBeDefined();
    expect(localGroup!.tabs).toHaveLength(2);
    expect(localGroup!.friendlyName).toBe('Local Files');
  });

  it('assigns correct friendly names from product rules', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://github.com/user/repo' }),
    ];

    const groups = groupTabsByDomain(tabs);
    expect(groups[0].friendlyName).toBe('GitHub');
    expect(groups[0].domain).toBe('github');
  });

  it('detects duplicate tabs and sets color and flags inside product groups', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://www.youtube.com/watch?v=1' }),
      makeTab({ id: 2, url: 'https://m.youtube.com/watch?v=1' }),
    ];

    const groups = groupTabsByDomain(tabs);

    expect(groups[0].hasDuplicates).toBe(false);
    expect(groups[0].duplicateCount).toBe(0);
    expect(groups[0].color).toBe('#4DAB9A');
  });

  it('detects exact duplicate URLs', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://example.com/page' }),
      makeTab({ id: 2, url: 'https://example.com/page' }),
    ];

    const groups = groupTabsByDomain(tabs);

    expect(groups[0].hasDuplicates).toBe(true);
    expect(groups[0].duplicateCount).toBe(1);
    expect(groups[0].color).toBe('#DFAB01');
  });

  it('assigns sequential order values', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://example.com/a' }),
      makeTab({ id: 2, url: 'https://other.com/b' }),
      makeTab({ id: 3, url: 'https://third.com/c' }),
    ];

    const groups = groupTabsByDomain(tabs);
    expect(groups.map((g) => g.order)).toEqual([0, 1, 2]);
  });

  it('sets collapsed to false for all groups', () => {
    const groups = groupTabsByDomain([
      makeTab({ id: 1, url: 'https://example.com/a' }),
    ]);

    expect(groups.every((group) => group.collapsed === false)).toBe(true);
  });

  it('skips malformed URLs without crashing', () => {
    const groups = groupTabsByDomain([
      makeTab({ id: 1, url: 'not-a-url' }),
      makeTab({ id: 2, url: 'https://example.com/valid' }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].domain).toBe('example');
  });

  describe('customOrder', () => {
    it('behaves the same when customOrder is undefined', () => {
      const tabs = [
        makeTab({ id: 1, url: 'https://github.com/user/repo' }),
        makeTab({ id: 2, url: 'https://example.com/page' }),
        makeTab({ id: 3, url: 'https://x.com/status' }),
      ];

      const withoutOrder = groupTabsByDomain(tabs);
      const withEmpty = groupTabsByDomain(tabs, {});

      expect(withEmpty.map((g) => g.domain)).toEqual(withoutOrder.map((g) => g.domain));
    });

    it('applies custom order when all products are ordered', () => {
      const tabs = [
        makeTab({ id: 1, url: 'https://github.com/user/repo' }),
        makeTab({ id: 2, url: 'https://example.com/page' }),
        makeTab({ id: 3, url: 'https://x.com/status' }),
      ];

      const groups = groupTabsByDomain(tabs, {
        'example': 0,
        'x': 1,
        github: 2,
      });

      expect(groups.map((g) => g.domain)).toEqual(['example', 'x', 'github']);
    });

    it('sorts ordered products before unordered ones', () => {
      const tabs = [
        makeTab({ id: 1, url: 'https://github.com/user/repo' }),
        makeTab({ id: 2, url: 'https://example.com/page' }),
        makeTab({ id: 3, url: 'https://x.com/status' }),
      ];

      const groups = groupTabsByDomain(tabs, {
        'example': 0,
      });

      expect(groups[0].domain).toBe('example');
      expect(groups).toHaveLength(3);
    });
  });
});
